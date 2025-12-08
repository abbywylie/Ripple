# Recommendation service for finding similar users based on job title and company
# Uses external ML API service to save memory on main backend

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from typing import List, Tuple, Dict, Any, Optional
import requests

# External ML recommendation API URL (set via environment variable)
# Default to the provided recommendation service
EXTERNAL_RECOMMENDATION_API_URL = os.getenv(
    "EXTERNAL_RECOMMENDATION_API_URL", 
    "https://ripple-yiue.onrender.com/api/recommendations"  # Default recommendation service
)

from models.database_functions import (
    get_session, User, select, Contact, NotFoundError
)


class Connection:
    """Represents a potential connection recommendation."""
    def __init__(self, user_id: int, name: str, role: str, company_or_school: str):
        self.user_id = user_id
        self.name = name
        self.role = role
        self.company_or_school = company_or_school


def call_external_recommendation_api(
    user_id: int,
    user_role: str,
    user_company: str,
    connections: List[Connection],
    threshold: float = 0.65
    print("num connections:", len(connections))
) -> Optional[List[Tuple[Connection, float]]]:
    """Call external ML recommendation API service."""
    if not EXTERNAL_RECOMMENDATION_API_URL:
        return None
    
    try:
        # Prepare data for external API
        connections_data = [
            {
                "user_id": conn.user_id,
                "name": conn.name,
                "role": conn.role,
                "company_or_school": conn.company_or_school
            }
            for conn in connections
        ]
        
        payload = {
            "user_id": user_id,
            "user_role": user_role,
            "user_company": user_company,
            "connections": connections_data,
            "threshold": threshold
        }
        
        print(f"[Recommendation] Calling external API: {EXTERNAL_RECOMMENDATION_API_URL}")
        print("[Recommendation] Running external recommendation")
        print(f"[Recommendation] Payload: user_id={user_id}, connections={len(connections_data)}")
        
        response = requests.post(
            EXTERNAL_RECOMMENDATION_API_URL,
            json=payload,
            timeout=30,  # 30 second timeout for ML processing
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"[Recommendation] External API response: {result}")
            
            # Handle different response formats
            # Format 1: [{"user_id": 1, "similarity_score": 0.85}, ...]
            # Format 2: {"recommendations": [{"user_id": 1, "similarity_score": 0.85}, ...]}
            if isinstance(result, dict) and "recommendations" in result:
                result = result["recommendations"]
            elif not isinstance(result, list):
                print(f"[Recommendation] Unexpected response format: {type(result)}")
                return None
            
            recommendations = []
            for item in result:
                user_id_match = item.get("user_id")
                score = item.get("similarity_score", 0.0)
                # Find the connection object
                connection = next((c for c in connections if c.user_id == user_id_match), None)
                if connection and score >= threshold:
                    recommendations.append((connection, float(score)))
            
            recommendations.sort(key=lambda x: x[1], reverse=True)
            print(f"[Recommendation] External API returned {len(recommendations)} recommendations above threshold {threshold}")
            return recommendations
        else:
            print(f"[Recommendation] External API returned status {response.status_code}: {response.text}")
            return None
            
    except requests.exceptions.Timeout:
        print(f"[Recommendation] External API request timed out after 30 seconds")
        print("[Recommendation] Switched to backup recommendation feature.")
        return None
    except requests.exceptions.RequestException as e:
        print(f"[Recommendation] External API request failed: {e}")
        return None
    except Exception as e:
        print(f"[Recommendation] Error processing external API response: {e}")
        import traceback
        traceback.print_exc()
        return None


def get_user_and_potential_connections(user_id: int) -> Tuple[Connection, List[Connection]]:
    """Get the logged-in user and all potential connections (excluding existing contacts)."""
    with get_session() as session:
        user_profile = session.get(User, user_id)
        
        if not user_profile:
            raise NotFoundError(f"User with id {user_id} not found.")
        
        # Create Connection object for logged-in user
        logged_in_user = Connection(
            user_id=user_profile.user_id,
            name=user_profile.name,
            role=user_profile.role or "",
            company_or_school=user_profile.company_or_school or ""
        )
        
        # Get existing contact emails to exclude
        existing_contact_emails = session.execute(
            select(Contact.email)
            .where(Contact.user_id == user_id)
            .where(Contact.email.isnot(None))
        ).scalars().all()
        
        # Build query for potential connections
        recommendation_query = select(User).where(User.user_id != user_id)
        
        # Exclude users who are already contacts
        if existing_contact_emails:
            recommendation_query = recommendation_query.where(
                User.email.not_in(existing_contact_emails)
            )
        
        # Only get users with public profiles (has_public_profile = True)
        recommendation_query = recommendation_query.where(User.has_public_profile == True)
        
        recommendations = session.execute(recommendation_query).scalars().all()
        
        # Create Connection objects for potential connections
        connections_list = []
        for other_user in recommendations:
            connections_list.append(Connection(
                user_id=other_user.user_id,
                name=other_user.name,
                role=other_user.role or "",
                company_or_school=other_user.company_or_school or ""
            ))
        
        return logged_in_user, connections_list


def get_recommendations_simple(user_id: int, threshold: float = 0.5) -> List[Tuple[Connection, float]]:
    """Simple recommendation based on exact/partial string matching (fallback when ML not available)."""
    try:
        logged_in_user, connections = get_user_and_potential_connections(user_id)
    except NotFoundError as e:
        print(f"Error: {e}")
        return []
    
    if not connections:
        return []
    
    user_role = logged_in_user.role.lower() if logged_in_user.role else ""
    user_company = logged_in_user.company_or_school.lower() if logged_in_user.company_or_school else ""
    
    scored_connections = []
    for connection in connections:
        conn_role = connection.role.lower() if connection.role else ""
        conn_company = connection.company_or_school.lower() if connection.company_or_school else ""
        
        # Simple similarity: check for common words
        role_score = 0.0
        if user_role and conn_role:
            user_role_words = set(user_role.split())
            conn_role_words = set(conn_role.split())
            if user_role_words and conn_role_words:
                common_words = user_role_words.intersection(conn_role_words)
                role_score = len(common_words) / max(len(user_role_words), len(conn_role_words))
        
        company_score = 1.0 if user_company and conn_company and user_company == conn_company else 0.0
        
        # Weighted score: 75% role, 25% company
        total_score = 0.75 * role_score + 0.25 * company_score
        
        if total_score >= threshold:
            scored_connections.append((connection, total_score))
    
    # Sort by score descending
    scored_connections.sort(key=lambda x: x[1], reverse=True)
    return scored_connections


def get_recommendations_external(user_id: int, threshold: float = 0.65) -> List[Tuple[Connection, float]]:
    """Get ML-powered recommendations from external API service."""
    try:
        logged_in_user, connections = get_user_and_potential_connections(user_id)
    except NotFoundError as e:
        print(f"Error: {e}")
        return []
    
    if not connections:
        return []
    
    # Prepare data for external API
    user_role = logged_in_user.role or ""
    user_company = logged_in_user.company_or_school or ""
    
    # Call external API
    recommendations = call_external_recommendation_api(
        user_id=user_id,
        user_role=user_role,
        user_company=user_company,
        connections=connections,
        threshold=threshold
    )
    
    if recommendations is not None:
        return recommendations
    
    # Fallback to simple matching if external API unavailable
    print("[Recommendation] External API unavailable, falling back to simple matching")
    return get_recommendations_simple(user_id, threshold)


def get_recommendations_for_user(user_id: int, threshold: float = 0.65, use_ml: bool = True) -> List[Dict[str, Any]]:
    """Get recommendations for a user, returning as dictionary format for API.
    
    If EXTERNAL_RECOMMENDATION_API_URL is set, calls external ML service.
    Otherwise falls back to simple matching.
    """
    if use_ml and EXTERNAL_RECOMMENDATION_API_URL:
        recommendations = get_recommendations_external(user_id, threshold)
    else:
        recommendations = get_recommendations_simple(user_id, threshold)
    
    # Convert to API-friendly format
    result = []
    for connection, score in recommendations:
        result.append({
            "user_id": connection.user_id,
            "name": connection.name,
            "role": connection.role,
            "company_or_school": connection.company_or_school,
            "similarity_score": round(score, 3),
        })
    
    return result


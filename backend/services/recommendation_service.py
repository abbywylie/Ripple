# Recommendation service for finding similar users based on job title and company
# Uses hybrid dense + sparse embeddings for semantic similarity matching

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from typing import List, Tuple, Dict, Any, Optional
import torch

# Try to import ML models - handle gracefully if not available
try:
    from sentence_transformers import SentenceTransformer, util
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    print("Warning: ML libraries not available. Recommendations will use simple matching.")

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


def normalize_sparse_scores(scores: torch.Tensor) -> torch.Tensor:
    """Normalize sparse similarity scores to 0-1 range."""
    min_score = scores.min()
    max_score = scores.max()
    if max_score - min_score == 0:
        return torch.zeros_like(scores)
    normalized_scores = (scores - min_score) / (max_score - min_score)
    return normalized_scores


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


def get_recommendations_ml(user_id: int, threshold: float = 0.65) -> List[Tuple[Connection, float]]:
    """ML-powered recommendations using hybrid dense + sparse embeddings."""
    if not ML_AVAILABLE:
        return get_recommendations_simple(user_id, threshold)
    
    try:
        logged_in_user, connections = get_user_and_potential_connections(user_id)
    except NotFoundError as e:
        print(f"Error: {e}")
        return []
    
    if not connections:
        return []
    
    # Prepare data for embedding
    user_role = logged_in_user.role or ""
    user_company = logged_in_user.company_or_school or ""
    
    roles = [conn.role or "" for conn in connections]
    companies = [conn.company_or_school or "" for conn in connections]
    
    try:
        # Load models (use a lightweight model if custom one doesn't exist)
        try:
            dense_model = SentenceTransformer("all-MiniLM-L6-v2")  # Lightweight fallback
        except:
            dense_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        
        # Create embeddings
        dense_embeddings_user_role = dense_model.encode(user_role, convert_to_tensor=True)
        dense_embeddings_user_company = dense_model.encode(user_company, convert_to_tensor=True)
        dense_embeddings_roles = dense_model.encode(roles, convert_to_tensor=True)
        dense_embeddings_companies = dense_model.encode(companies, convert_to_tensor=True)
        
        # Calculate cosine similarity
        role_similarity = util.cos_sim(dense_embeddings_user_role, dense_embeddings_roles)[0]
        company_similarity = util.cos_sim(dense_embeddings_user_company, dense_embeddings_companies)[0]
        
        # Weighted combination: 75% role, 25% company
        total_sim = (0.75 * role_similarity + 0.25 * company_similarity).flatten()
        
        scored_connections = list(zip(connections, total_sim))
        
        recommendations = [
            (connection, float(score.item()))
            for connection, score in scored_connections
            if score.item() > threshold
        ]
        
        recommendations.sort(key=lambda x: x[1], reverse=True)
        return recommendations
        
    except Exception as e:
        print(f"ML recommendation error: {e}, falling back to simple matching")
        return get_recommendations_simple(user_id, threshold)


def get_recommendations_for_user(user_id: int, threshold: float = 0.65, use_ml: bool = True) -> List[Dict[str, Any]]:
    """Get recommendations for a user, returning as dictionary format for API."""
    if use_ml and ML_AVAILABLE:
        recommendations = get_recommendations_ml(user_id, threshold)
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


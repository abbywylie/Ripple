"""
Email Thread Parser
Extracts key information from pasted email conversations
"""
import re
from typing import Dict, List, Optional
from datetime import datetime


def parse_email_thread(email_text: str) -> Dict:
    """
    Parse an email thread to extract key information.
    
    Returns:
        {
            'from_emails': [list of email addresses],
            'dates': [list of dates found],
            'subject': str or None,
            'is_reply': bool,
            'message_count': int,
            'is_thank_you': bool,
            'is_first_contact': bool,
            'mentions_meeting': bool,
            'meeting_details': {date, time, location, platform},
            'summary': str
        }
    """
    result = {
        'from_emails': [],
        'dates': [],
        'subject': None,
        'is_reply': False,
        'message_count': 0,
        'is_thank_you': False,
        'is_first_contact': False,
        'mentions_meeting': False,
        'meeting_details': None,
        'summary': ''
    }
    
    text = email_text.strip()
    
    # Extract email addresses
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    result['from_emails'] = list(set(re.findall(email_pattern, text)))
    
    # Try to extract subject line
    subject_match = re.search(r'(?i)(?:subject|re:|fwd:)\s*:?\s*(.+)', text)
    if subject_match:
        result['subject'] = subject_match.group(1).strip()[:100]
    
    # Count message separators (lines with dates/from headers)
    date_headers = re.findall(r'(?i)(?:from:|sent:|date:)', text)
    result['message_count'] = len(date_headers) if date_headers else 1
    
    # Check if it's a reply
    result['is_reply'] = bool(re.search(r'(?i)(?:re:|fwd:|reply)', text[:500]))
    
    # Check for thank you indicators
    thank_you_patterns = [
        r'thank\s+you',
        r'thanks\s+again',
        r'appreciate\s+it',
        r'grateful',
        r'thank\s+you\s+for'
    ]
    result['is_thank_you'] = any(re.search(pattern, text, re.IGNORECASE) for pattern in thank_you_patterns)
    
    # Check if it's first contact
    first_contact_patterns = [
        r'nice\s+to\s+meet\s+you',
        r'first\s+time',
        r'first\s+reaching\s+out',
        r'introducing\s+myself',
        r'my\s+name\s+is'
    ]
    result['is_first_contact'] = any(re.search(pattern, text, re.IGNORECASE) for pattern in first_contact_patterns)
    
    # Check if meeting is mentioned
    meeting_patterns = [
        r'coffee\s+chat',
        r'meeting',
        r'call',
        r'zoom',
        r'meet\s+up',
        r'get\s+together',
        r'schedule',
        r'calendar'
    ]
    result['mentions_meeting'] = any(re.search(pattern, text, re.IGNORECASE) for pattern in meeting_patterns)
    
    # Extract meeting details if meeting is mentioned
    if result['mentions_meeting']:
        meeting_details = {}
        
        # Extract dates (multiple formats)
        date_patterns = [
            r'\b(?P<month>Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(?P<day>\d{1,2})(?:st|nd|rd|th)?,?\s+(?P<year>\d{4})\b',
            r'\b(?P<month>\d{1,2})/(?P<day>\d{1,2})/(?P<year>\d{2,4})\b',
            r'\b(?P<year>\d{4})-(?P<month>\d{1,2})-(?P<day>\d{1,2})\b',
        ]
        
        time_patterns = [
            r'\b(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)\b',
            r'\b(\d{1,2}):(\d{2})\b',
        ]
        
        # Extract location
        location_patterns = [
            r'(?:at|@)\s+([A-Z][A-Za-z\s&]+(?:Coffee|Cafe|Restaurant|Library|Office|Building|Room|Campus)?)',
            r'location:\s*([^\n]+)',
            r'where:\s*([^\n]+)',
        ]
        
        # Extract platform (Zoom, Google Meet, etc.)
        platform_patterns = [
            r'(zoom|google\s+meet|teams|webex|skype)',
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                meeting_details['date'] = match.group(0)
                break
        
        for pattern in time_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                meeting_details['time'] = match.group(0)
                break
        
        for pattern in location_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                meeting_details['location'] = match.group(1).strip()
                break
        
        for pattern in platform_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                meeting_details['platform'] = match.group(1).strip()
                break
        
        if meeting_details:
            result['meeting_details'] = meeting_details
    
    # Generate summary
    summary_parts = []
    if result['is_first_contact']:
        summary_parts.append("First contact")
    elif result['is_thank_you']:
        summary_parts.append("Thank you")
    elif result['is_reply']:
        summary_parts.append("Reply")
    
    if result['mentions_meeting']:
        summary_parts.append("Meeting discussion")
    
    if result['message_count'] > 1:
        summary_parts.append(f"{result['message_count']} messages")
    
    result['summary'] = ' | '.join(summary_parts) if summary_parts else 'Email interaction'
    
    return result


def suggest_actions(parsed_data: Dict, contact_name: Optional[str] = None) -> List[str]:
    """
    Generate suggested next actions based on parsed email data.
    """
    suggestions = []
    
    if parsed_data['is_first_contact'] and not parsed_data['mentions_meeting']:
        suggestions.append("Set a follow-up reminder for next week to stay in touch")
    
    if parsed_data['mentions_meeting']:
        if parsed_data['is_reply']:
            suggestions.append("Schedule the meeting in your calendar")
        else:
            suggestions.append("Wait for their reply before scheduling")
    
    if parsed_data['message_count'] > 2 and not parsed_data['is_thank_you']:
        suggestions.append("Consider sending a thank you email")
    
    if parsed_data['is_thank_you'] and parsed_data['mentions_meeting']:
        suggestions.append("Meeting completed - update contact with meeting details")
    
    return suggestions


def generate_interaction_tag(parsed_data: Dict) -> str:
    """
    Generate an appropriate tag for the interaction based on content.
    """
    if parsed_data['is_thank_you']:
        return "Thank You"
    elif parsed_data['is_first_contact']:
        return "First Contact"
    elif parsed_data['mentions_meeting']:
        return "Meeting Discussion"
    elif parsed_data['is_reply']:
        return "Follow-Up"
    else:
        return "Email Exchange"


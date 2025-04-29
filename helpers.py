"""Helper functions for the Flask application."""

import os
import json
import numpy as np

def allowed_file(filename):
    """Check if the file has an allowed extension"""
    ALLOWED_EXTENSIONS = {'csv', 'txt'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_users():
    """Load users from the JSON file"""
    try:
        with open('users.json', 'r') as f:
            return json.load(f)
    except:
        # If file doesn't exist or is corrupted, return demo users
        from app import DEMO_USERS
        return DEMO_USERS

def save_users(users):
    """Save users to the JSON file"""
    with open('users.json', 'w') as f:
        json.dump(users, f)

def get_user_by_username(username):
    """Get a user by username"""
    users = load_users()
    for user in users:
        if user['username'] == username:
            return user
    return None

def format_file_size(size_bytes):
    """Format file size in a human-readable format"""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = int(np.floor(np.log(size_bytes) / np.log(1024)))
    p = np.power(1024, i)
    s = round(size_bytes / p, 2)
    
    return f"{s} {size_names[i]}"
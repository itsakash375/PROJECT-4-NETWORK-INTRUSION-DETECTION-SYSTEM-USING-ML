"""Authentication module for the Network Intrusion Detection System."""

import os
import json
from flask import session, redirect, url_for, request, flash
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

# Path to users file
USERS_FILE = 'users.json'

def load_users():
    """Load users from the JSON file."""
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r') as f:
                return json.load(f)
        except:
            return []
    # Create default users if file doesn't exist
    default_users = [
        {'username': 'admin', 'password': generate_password_hash('admin123'), 'email': 'admin@example.com'},
        {'username': 'user', 'password': generate_password_hash('user123'), 'email': 'user@example.com'}
    ]
    save_users(default_users)
    return default_users

def save_users(users):
    """Save users to the JSON file."""
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f)

def get_user_by_username(username):
    """Get a user by username."""
    users = load_users()
    for user in users:
        if user['username'] == username:
            return user
    return None

def login_user(username, password):
    """Login a user with username and password."""
    user = get_user_by_username(username)
    
    if not user or not check_password_hash(user['password'], password):
        return False, "Invalid username or password"
    
    # Store user info in session
    session['user'] = {
        'username': user['username'],
        'email': user['email']
    }
    
    return True, "Login successful"

def register_user(username, email, password, confirm_password):
    """Register a new user."""
    # Basic validation
    if not username or not email or not password:
        return False, "Missing required fields"
    
    if password != confirm_password:
        return False, "Passwords do not match"
    
    # Check if username already exists
    if get_user_by_username(username):
        return False, "Username already exists"
    
    # Create new user
    users = load_users()
    new_user = {
        'username': username,
        'email': email,
        'password': generate_password_hash(password)
    }
    
    users.append(new_user)
    save_users(users)
    
    return True, "Registration successful"

def logout_user():
    """Logout the current user."""
    session.clear()
    return True, "Logout successful"

def is_authenticated():
    """Check if a user is authenticated."""
    return 'user' in session

def login_required(f):
    """Decorator for views that require authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            return {"success": False, "message": "Authentication required"}, 401
        return f(*args, **kwargs)
    return decorated_function

def get_current_user():
    """Get the current authenticated user."""
    if is_authenticated():
        return session['user']
    return None
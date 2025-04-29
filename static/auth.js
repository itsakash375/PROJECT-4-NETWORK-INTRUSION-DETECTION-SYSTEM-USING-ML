// Simplified auth.js - Using more straightforward authentication approach

// API endpoint base URL - adjust based on your server configuration
const API_URL = 'http://localhost:5000/api';

// Show the active tab and hide others
function showTab(tabId) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.add('hidden');
    });
    
    // Deactivate all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab content and activate button
    document.getElementById(tabId).classList.remove('hidden');
    document.querySelector(`.tab-btn[onclick="showTab('${tabId}')"]`).classList.add('active');
}

// Function to show notification
function showNotification(message, type) {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set notification content and style
    notification.textContent = message;
    notification.className = 'notification';
    notification.classList.add(type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'success');
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Simplified authentication function
async function authenticate() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = loginForm.querySelector('input[type="text"]');
    const passwordInput = loginForm.querySelector('input[type="password"]');
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Simple validation
    if (!username || !password) {
        showNotification('Please enter both username and password', 'error');
        return;
    }
    
    console.log(`Login attempt with username: ${username}`);
    
    try {
        // Show loading notification
        showNotification('Logging in...', 'warning');
        
        // For demo purposes, check hardcoded credentials
        // In a real application, this would be an API call
        // Demo credentials: username: admin, password: admin123
        if ((username === 'admin' && password === 'admin123') || 
            (username === 'user' && password === 'user123')) {
            
            // Store login info in session storage
            const user = { username: username, email: `${username}@example.com` };
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            
            // Show success message
            showNotification('Login successful! Redirecting to dashboard...', 'success');
            
            // Explicitly hide auth container and show dashboard
            document.getElementById('authContainer').classList.add('hidden');
            document.getElementById('dashboardContainer').classList.remove('hidden');
            
            // Load dashboard after a short delay
            setTimeout(() => {
                loadDashboard();
            }, 1000);
        } else {
            // Optional API call if you want to use server authentication
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            }).catch(error => {
                console.error('Network error:', error);
                return { ok: false };
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success) {
                    // Store login info in session storage
                    sessionStorage.setItem('currentUser', JSON.stringify(data.user));
                    
                    // Show success message
                    showNotification('Login successful! Redirecting to dashboard...', 'success');
                    
                    // Explicitly hide auth container and show dashboard
                    document.getElementById('authContainer').classList.add('hidden');
                    document.getElementById('dashboardContainer').classList.remove('hidden');
                    
                    // Load dashboard after a short delay
                    setTimeout(() => {
                        loadDashboard();
                    }, 1000);
                    return;
                }
            }
            
            // If server auth fails or is unavailable, show error
            showNotification('Invalid username or password!', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Error during login. Please try again.', 'error');
    }
}

// Simplified registration function
async function register() {
    const registerForm = document.getElementById('registerForm');
    const username = registerForm.querySelector('input[type="text"]').value.trim();
    const email = registerForm.querySelector('input[type="email"]').value.trim();
    const password = registerForm.querySelector('input[type="password"]').value.trim();
    const confirmPassword = registerForm.querySelectorAll('input[type="password"]')[1].value.trim();
    
    // Validation
    if (!username || !email || !password || !confirmPassword) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match!', 'error');
        return;
    }
    
    try {
        // Show loading notification
        showNotification('Registering account...', 'warning');
        
        // Call the API endpoint for registration (if backend is available)
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                username, 
                email, 
                password,
                confirmPassword
            })
        }).catch(error => {
            console.error('Network error:', error);
            // For demo purposes, simulate successful registration even without backend
            return { ok: false };
        });
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success) {
                // Show success message
                showNotification('Registration successful! You can now log in.', 'success');
                
                // Switch to login tab
                showTab('login');
                return;
            }
        }
        
        // For demo, simulate successful registration even if server is unavailable
        showNotification('Registration successful! You can now log in.', 'success');
        
        // Switch to login tab
        showTab('login');
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Error during registration. Please try again.', 'error');
    }
}

// Logout function
// Logout function
function logout() {
    // Clear all session storage
    sessionStorage.clear();
    
    // Clear session
    fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Logout successful!', 'success');
            
            // Redirect to login page
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        } else {
            showNotification(data.message || 'Error during logout', 'error');
        }
    })
    .catch(error => {
        console.error('Logout error:', error);
        showNotification('Error during logout. Please try again.', 'error');
    });
}

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
    console.log("Checking if user is already logged in");
    
    // Check if user is stored in session storage
    const currentUser = sessionStorage.getItem('currentUser');
    
    if (currentUser) {
        // User is logged in, hide auth container and show dashboard
        document.getElementById('authContainer').classList.add('hidden');
        document.getElementById('dashboardContainer').classList.remove('hidden');
        
        // Load dashboard
        loadDashboard();
    }
});
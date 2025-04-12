// Enhanced Login Page JavaScript
// This should be saved to a file in your static/js directory, e.g., static/js/login.js

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const loginForm = document.querySelector('.login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.querySelector('.login-button');
    const passwordToggle = document.querySelector('.password-toggle');
    const loginContainer = document.querySelector('.login-container');
    
    // Error translation for security (don't expose specific errors)
    const errorMessages = {
        "invalid_credentials": "The username or password you entered is incorrect.",
        "account_locked": "Your account has been temporarily locked due to multiple failed login attempts.",
        "empty_fields": "Please enter both username and password.",
        "invalid_format": "Username contains invalid characters.",
        "network_error": "Network error. Please try again later."
    };
    
    // Validate form before submitting
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            let isValid = true;
            
            // Reset validity styles
            usernameInput.style.borderColor = '';
            passwordInput.style.borderColor = '';
            
            // Validate username
            if (!usernameInput.value.trim()) {
                isValid = false;
                usernameInput.style.borderColor = 'var(--danger-color)';
            }
            
            // Validate password
            if (!passwordInput.value.trim()) {
                isValid = false;
                passwordInput.style.borderColor = 'var(--danger-color)';
            }
            
            if (!isValid) {
                e.preventDefault();
                
                // Show error with animation
                showFormError("Please enter both username and password.");
                
                // Shake animation
                loginContainer.classList.add('error');
                setTimeout(() => {
                    loginContainer.classList.remove('error');
                }, 800);
            } else {
                // Show loading state
                loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
                loginButton.disabled = true;
            }
        });
    }
    
    // Toggle password visibility
    if (passwordToggle) {
        passwordToggle.addEventListener('click', function() {
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }
    
    // Real-time validation
    if (usernameInput) {
        usernameInput.addEventListener('input', function() {
            // Remove error highlighting as user types
            if (this.value.trim() !== '') {
                this.style.borderColor = '';
            }
            
            // Optional: validate format as user types
            if (this.value.trim() !== '' && !/^[a-zA-Z0-9_-]{0,20}$/.test(this.value)) {
                this.style.borderColor = 'var(--danger-color)';
            }
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            // Remove error highlighting as user types
            if (this.value.trim() !== '') {
                this.style.borderColor = '';
            }
        });
    }
    
    // Show form error message
    function showFormError(message) {
        // Check if error message element already exists
        let errorEl = document.querySelector('.error-message');
        
        if (!errorEl) {
            // Create new error element
            errorEl = document.createElement('div');
            errorEl.className = 'error-message';
            errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
            
            // Insert after flashes or at the top of the form
            const flashes = document.querySelector('.flashes');
            if (flashes) {
                flashes.parentNode.insertBefore(errorEl, flashes.nextSibling);
            } else {
                const logoEl = document.querySelector('.login-logo');
                logoEl.parentNode.insertBefore(errorEl, logoEl.nextSibling);
            }
        } else {
            // Update existing error message
            errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        }
    }
    
    // Check for URL parameters for error messages
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('error')) {
        const errorCode = urlParams.get('error');
        if (errorMessages[errorCode]) {
            showFormError(errorMessages[errorCode]);
        }
    }
    
    // Focus first empty field
    if (usernameInput && !usernameInput.value) {
        usernameInput.focus();
    } else if (passwordInput) {
        passwordInput.focus();
    }
});
// config.js - Central configuration for API connections

// API endpoint base URL - adjust this based on your server configuration
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api' 
    : `${window.location.origin}/api`;

// Helper function to make API requests with error handling
// config.js - Add these modifications

// Helper function to make API requests with error handling
async function apiRequest(endpoint, method = 'GET', data = null, options = {}) {
    try {
        const url = `${API_URL}${endpoint}`;
        const fetchOptions = {
            method: method,
            credentials: 'include', // Important for session cookies
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            ...options
        };

        if (data) {
            if (data instanceof FormData) {
                // For FormData, don't set Content-Type
                delete fetchOptions.headers['Content-Type'];
                fetchOptions.body = data;
            } else {
                fetchOptions.body = JSON.stringify(data);
            }
        }

        const response = await fetch(url, fetchOptions);

        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const jsonResponse = await response.json();
            
            // Add response status to the returned object
            jsonResponse.status = response.status;
            
            // If unauthorized, handle session expiration
            if (response.status === 401) {
                console.warn('Session expired or unauthorized access');
                
                // Only show notification if this isn't an auth check
                if (endpoint !== '/auth/check' && !options.suppressErrors) {
                    showNotification('Your session has expired. Please log in again.', 'warning');
                    
                    // Redirect to login after a brief delay
                    setTimeout(() => {
                        sessionStorage.removeItem('currentUser');
                        window.location.reload();
                    }, 2000);
                }
            }
            
            // Show error notifications for other failed requests
            else if (!response.ok && !options.suppressErrors) {
                const errorMessage = jsonResponse.message || `Request failed with status ${response.status}`;
                showNotification(errorMessage, 'error');
            }
            
            return jsonResponse;
        } else {
            // For non-JSON responses (like file downloads)
            return {
                status: response.status,
                success: response.ok,
                response: response
            };
        }
    } catch (error) {
        console.error(`API request error for ${endpoint}:`, error);
        if (!options.suppressErrors) {
            showNotification('Network error. Please check your connection and try again.', 'error');
        }
        return { success: false, message: 'Network error', status: 0 };
    }
}

// API helper functions
const API = {
    // Authentication endpoints
    auth: {
        login: (credentials) => apiRequest('/auth/login', 'POST', credentials),
        register: (userData) => apiRequest('/auth/register', 'POST', userData),
        logout: () => apiRequest('/auth/logout', 'POST'),
        check: () => apiRequest('/auth/check', 'GET')
    },
    
    // Dataset endpoints
    dataset: {
        getInfo: () => apiRequest('/dataset-info', 'GET'),
        upload: (formData) => apiRequest('/upload', 'POST', formData),
        getSample: (datasetName) => apiRequest(`/sample-dataset/${datasetName}`, 'GET'),
        clear: () => apiRequest('/clear-dataset', 'POST')
    },
    
    // Preprocessing endpoints
    preprocessing: {
        apply: (options) => apiRequest('/preprocess', 'POST', options),
        getInfo: () => apiRequest('/preprocessed-info', 'GET'),
        clear: () => apiRequest('/clear-preprocessed', 'POST')
    },
    
    // Training endpoints
    training: {
        train: (options) => apiRequest('/train', 'POST', options),
        getResults: () => apiRequest('/training-results', 'GET'),
        getProgress: (modelName) => apiRequest(`/model-progress/${modelName}`, 'GET'),
        clear: () => apiRequest('/clear-training', 'POST')
    },
    
    // Live capture endpoints
    liveCapture: {
        start: (options) => apiRequest('/live-capture/start', 'POST', options),
        stop: () => apiRequest('/live-capture/stop', 'POST'),
        getStatus: () => apiRequest('/live-capture/status', 'GET'),
        getPackets: () => apiRequest('/live-capture/packets', 'GET'),
        clear: () => apiRequest('/live-capture/clear', 'POST')
    },
    
    // Manual entry endpoints
    manualEntry: {
        analyze: (options) => apiRequest('/manual-entry/analyze', 'POST', options),
        simulateTraffic: (attackType) => apiRequest(`/simulate-traffic/${attackType}`, 'GET')
    },
    
    // Report endpoints
    reports: {
        generate: (options) => apiRequest('/report', 'POST', options),
        getAll: () => apiRequest('/reports', 'GET'),
        get: (reportId) => apiRequest(`/report/${reportId}`, 'GET'),
        delete: (reportId) => apiRequest(`/report/${reportId}`, 'DELETE'),
        download: (reportId) => apiRequest(`/report/${reportId}/download`, 'GET', null, { raw: true })
    },
    
    // System endpoints
    system: {
        health: () => apiRequest('/health', 'GET', null, { suppressErrors: true })
    }
};

// Function to check backends health
async function checkBackendHealth() {
    try {
        const result = await API.system.health();
        if (result.success) {
            console.log('Backend is reachable');
            return true;
        } else {
            console.error('Backend health check failed');
            return false;
        }
    } catch (error) {
        console.error('Backend is unreachable:', error);
        return false;
    }
}

// System health check function
function checkSystemHealth() {
    return fetch(`${API_URL}/health`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'ok') {
            console.log('System health check passed');
            return true;
        }
        console.error('System health check failed', data);
        return false;
    })
    .catch(error => {
        console.error('System health check error', error);
        return false;
    });
}

// Run health check at startup
document.addEventListener('DOMContentLoaded', () => {
    checkSystemHealth()
        .then(isHealthy => {
            if (!isHealthy) {
                showNotification('System connection issue detected. Some features may not work properly.', 'warning');
            }
        });
});
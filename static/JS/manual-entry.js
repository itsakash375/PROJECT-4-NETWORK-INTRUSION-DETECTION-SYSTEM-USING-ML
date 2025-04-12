// Enhanced JavaScript for Manual Entry Page

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const presetButtons = document.querySelectorAll('.preset-btn');
    const manualEntryForm = document.getElementById('manual-entry-form');
    const ipInputs = document.querySelectorAll('input[id$="_ip"]');
    const portInputs = document.querySelectorAll('input[id$="_port"]');
    
    // Preset data
    const presets = {
        normal: {
            src_ip: "192.168.1.100",
            dst_ip: "192.168.1.1",
            src_port: 49152,
            dst_port: 80,
            protocol: "http",
            duration: 0.76,
            src_bytes: 1024,
            dst_bytes: 2048,
            count: 3,
            srv_count: 3,
            dst_host_count: 45,
            dst_host_srv_count: 25,
            logged_in: "1"
        },
        dos: {
            src_ip: "10.0.0.99",
            dst_ip: "192.168.1.10",
            src_port: 33842,
            dst_port: 80,
            protocol: "tcp",
            duration: 0.02,
            src_bytes: 512,
            dst_bytes: 0,
            count: 125,
            srv_count: 125,
            dst_host_count: 255,
            dst_host_srv_count: 255,
            logged_in: "0"
        },
        portscan: {
            src_ip: "10.0.0.15",
            dst_ip: "192.168.1.5",
            src_port: 31337,
            dst_port: 22,
            protocol: "tcp",
            duration: 0.01,
            src_bytes: 60,
            dst_bytes: 0,
            count: 24,
            srv_count: 1,
            dst_host_count: 30,
            dst_host_srv_count: 1,
            logged_in: "0"
        },
        bruteforce: {
            src_ip: "10.0.0.50",
            dst_ip: "192.168.1.20",
            src_port: 41234,
            dst_port: 22,
            protocol: "ssh",
            duration: 5.23,
            src_bytes: 4096,
            dst_bytes: 1024,
            count: 15,
            srv_count: 15,
            dst_host_count: 15,
            dst_host_srv_count: 15,
            logged_in: "0"
        },
        dataexfil: {
            src_ip: "192.168.1.30",
            dst_ip: "203.0.113.100",
            src_port: 45678,
            dst_port: 443,
            protocol: "https",
            duration: 14.5,
            src_bytes: 15000,
            dst_bytes: 1200,
            count: 1,
            srv_count: 1,
            dst_host_count: 1,
            dst_host_srv_count: 1,
            logged_in: "1"
        },
        // Add more complex attack scenarios
        ransomware: {
            src_ip: "192.168.1.50",
            dst_ip: "198.51.100.23",
            src_port: 50123,
            dst_port: 443,
            protocol: "https",
            duration: 120.5,
            src_bytes: 3500,
            dst_bytes: 250000,
            count: 7,
            srv_count: 7,
            dst_host_count: 8,
            dst_host_srv_count: 8,
            logged_in: "1"
        },
        mitm: {
            src_ip: "192.168.1.125",
            dst_ip: "192.168.1.1",
            src_port: 58432,
            dst_port: 80,
            protocol: "tcp",
            duration: 0.05,
            src_bytes: 128,
            dst_bytes: 350,
            count: 45,
            srv_count: 40,
            dst_host_count: 60,
            dst_host_srv_count: 55,
            logged_in: "0"
        },
        botnet: {
            src_ip: "192.168.1.200",
            dst_ip: "203.0.113.45",
            src_port: 62145,
            dst_port: 8080,
            protocol: "tcp",
            duration: 1.25,
            src_bytes: 540,
            dst_bytes: 8200,
            count: 12,
            srv_count: 12,
            dst_host_count: 15,
            dst_host_srv_count: 15,
            logged_in: "0"
        }
    };
    
    // Event listeners for preset buttons
    if (presetButtons) {
        presetButtons.forEach(button => {
            button.addEventListener('click', function() {
                const presetName = this.getAttribute('data-preset');
                const preset = presets[presetName];
                
                if (preset) {
                    // Fill form with preset data
                    for (const field in preset) {
                        const input = document.getElementById(field);
                        if (input) {
                            input.value = preset[field];
                            
                            // Trigger change event for select elements
                            if (input.tagName === 'SELECT') {
                                const event = new Event('change');
                                input.dispatchEvent(event);
                            }
                            
                            // Add visual feedback for filled fields
                            input.classList.add('filled');
                            setTimeout(() => {
                                input.classList.remove('filled');
                            }, 1000);
                        }
                    }
                    
                    // Show confirmation
                    showAlert(`Loaded ${presetName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} example`, 'success');
                }
            });
        });
    }
    
    // IP address validation
    if (ipInputs) {
        ipInputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateIpAddress(this);
            });
        });
    }
    
    // Port number validation
    if (portInputs) {
        portInputs.forEach(input => {
            input.addEventListener('input', function() {
                validatePortNumber(this);
            });
        });
    }
    
    // Form submission validation
    if (manualEntryForm) {
        manualEntryForm.addEventListener('submit', function(e) {
            let isValid = validateForm();
            
            if (!isValid) {
                e.preventDefault();
                showAlert('Please fix the errors in the form before submitting', 'error');
                
                // Scroll to first error
                const firstError = document.querySelector('.error-field');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                // Show loading state
                document.querySelector('.form-submit-btn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
                document.querySelector('.form-submit-btn').disabled = true;
            }
        });
    }
    
    // Enhance form fields with tooltips
    enhanceFormFields();
    
    // Add model explanation section
    addModelExplanation();
    
    // Functions
    function validateIpAddress(input) {
        const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        
        if (input.value && !ipRegex.test(input.value)) {
            input.classList.add('error-field');
            
            // Add error message if it doesn't exist
            let errorMsg = input.nextElementSibling;
            if (!errorMsg || !errorMsg.classList.contains('error-message')) {
                errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                errorMsg.innerHTML = 'Invalid IP address format (e.g. 192.168.1.1)';
                input.parentNode.insertBefore(errorMsg, input.nextSibling);
            }
            
            return false;
        } else {
            input.classList.remove('error-field');
            
            // Remove error message if it exists
            const errorMsg = input.nextElementSibling;
            if (errorMsg && errorMsg.classList.contains('error-message')) {
                errorMsg.remove();
            }
            
            return true;
        }
    }
    
    function validatePortNumber(input) {
        const portValue = parseInt(input.value);
        
        if (isNaN(portValue) || portValue < 0 || portValue > 65535) {
            input.classList.add('error-field');
            
            // Add error message if it doesn't exist
            let errorMsg = input.nextElementSibling;
            if (!errorMsg || !errorMsg.classList.contains('error-message')) {
                errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                errorMsg.innerHTML = 'Port must be between 0 and 65535';
                input.parentNode.insertBefore(errorMsg, input.nextSibling);
            }
            
            return false;
        } else {
            input.classList.remove('error-field');
            
            // Remove error message if it exists
            const errorMsg = input.nextElementSibling;
            if (errorMsg && errorMsg.classList.contains('error-message')) {
                errorMsg.remove();
            }
            
            return true;
        }
    }
    
    function validateForm() {
        let isValid = true;
        
        // Validate all required fields
        const requiredFields = manualEntryForm.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('error-field');
                isValid = false;
                
                // Add error message if it doesn't exist
                let errorMsg = field.nextElementSibling;
                if (!errorMsg || !errorMsg.classList.contains('error-message')) {
                    errorMsg = document.createElement('div');
                    errorMsg.className = 'error-message';
                    errorMsg.innerHTML = 'This field is required';
                    field.parentNode.insertBefore(errorMsg, field.nextSibling);
                }
            } else {
                field.classList.remove('error-field');
                
                // Remove error message if it exists
                const errorMsg = field.nextElementSibling;
                if (errorMsg && errorMsg.classList.contains('error-message')) {
                    errorMsg.remove();
                }
            }
        });
        
        // Validate IP addresses
        ipInputs.forEach(input => {
            if (!validateIpAddress(input)) {
                isValid = false;
            }
        });
        
        // Validate port numbers
        portInputs.forEach(input => {
            if (!validatePortNumber(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    function showAlert(message, type = 'info') {
        // Create flash container if it doesn't exist
        let flashContainer = document.querySelector('.flashes');
        if (!flashContainer) {
            flashContainer = document.createElement('ul');
            flashContainer.className = 'flashes';
            const container = document.querySelector('.summary-section');
            if (container) {
                container.insertBefore(flashContainer, container.firstChild.nextSibling);
            }
        }
        
        // Create alert element
        const alertItem = document.createElement('li');
        alertItem.className = type;
        
        // Add icon based on type
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        
        alertItem.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
        
        // Add to container
        flashContainer.appendChild(alertItem);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            alertItem.style.opacity = '0';
            setTimeout(() => alertItem.remove(), 300);
        }, 5000);
    }
    
    function enhanceFormFields() {
        // Add tooltips to form fields
        const tooltips = {
            src_ip: "Source IP address of the network traffic",
            dst_ip: "Destination IP address of the network traffic",
            src_port: "Source port number (0-65535)",
            dst_port: "Destination port number (0-65535)",
            protocol: "Network protocol used for the connection",
            duration: "Length of the connection in seconds",
            src_bytes: "Number of data bytes sent from source to destination",
            dst_bytes: "Number of data bytes sent from destination to source",
            count: "Number of connections to the same host in past 2 seconds",
            srv_count: "Number of connections to the same service in past 2 seconds",
            dst_host_count: "Number of connections to the same host in past 100 connections",
            dst_host_srv_count: "Number of connections to the same service in past 100 connections",
            logged_in: "1 if successfully logged in, 0 otherwise"
        };
        
        // Add tooltips to form fields
        for (const [id, tooltip] of Object.entries(tooltips)) {
            const field = document.getElementById(id);
            if (field) {
                const label = field.parentElement.querySelector('label');
                if (label) {
                    // Check if tooltip already exists
                    if (!label.querySelector('.tooltip-icon')) {
                        const tooltipSpan = document.createElement('span');
                        tooltipSpan.className = 'tooltip-wrapper';
                        tooltipSpan.innerHTML = `
                            <i class="fas fa-question-circle tooltip-icon"></i>
                            <span class="tooltip-content">${tooltip}</span>
                        `;
                        label.appendChild(tooltipSpan);
                    }
                }
            }
        }
        
        // Enhance preset buttons
        presetButtons.forEach(button => {
            button.classList.add('btn-animated');
        });
    }
    
    function addModelExplanation() {
        // Add model explanation to model selector section
        const modelSelector = document.querySelector('.model-selector');
        if (modelSelector) {
            // Check if explanation already exists
            if (!modelSelector.querySelector('.model-explanation')) {
                const explanation = document.createElement('div');
                explanation.className = 'model-explanation';
                explanation.innerHTML = `
                    <h4>Model Comparison</h4>
                    <div class="model-comparison-table">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Model</th>
                                    <th>Strengths</th>
                                    <th>Best For</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Isolation Forest</td>
                                    <td>Fast, handles high-dimensional data well</td>
                                    <td>General purpose, most network traffic</td>
                                </tr>
                                <tr>
                                    <td>Local Outlier Factor</td>
                                    <td>Good at finding local anomalies</td>
                                    <td>When anomalies vary by network segment</td>
                                </tr>
                                <tr>
                                    <td>One-Class SVM</td>
                                    <td>Works well with small datasets</td>
                                    <td>When normal behavior is well-defined</td>
                                </tr>
                                <tr>
                                    <td>K-Means</td>
                                    <td>Simple and fast</td>
                                    <td>When traffic forms distinct groups</td>
                                </tr>
                                <tr>
                                    <td>DBSCAN</td>
                                    <td>Discovers clusters of arbitrary shape</td>
                                    <td>Complex network traffic patterns</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                `;
                modelSelector.appendChild(explanation);
            }
        }
    }
});

// Add CSS styles
document.addEventListener('DOMContentLoaded', function() {
    // Create style element
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .filled {
            animation: highlightField 1s ease;
        }
        
        @keyframes highlightField {
            0% { background-color: rgba(40, 167, 69, 0.1); }
            100% { background-color: transparent; }
        }
        
        .error-field {
            border-color: #dc3545 !important;
            box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
        }
        
        .error-message {
            color: #dc3545;
            font-size: 0.85rem;
            margin-top: 0.25rem;
        }
        
        .model-explanation {
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border-color);
        }
        
        .model-comparison-table {
            margin-top: 1rem;
            overflow-x: auto;
        }
        
        .tooltip-wrapper {
            position: relative;
            display: inline-block;
            margin-left: 0.5rem;
        }
        
        .tooltip-icon {
            color: var(--primary-color);
            cursor: help;
        }
        
        .tooltip-content {
            visibility: hidden;
            width: 200px;
            background-color: #333;
            color: white;
            text-align: center;
            border-radius: 6px;
            padding: 5px;
            position: absolute;
            z-index: 1;
            bottom: 125%;
            left: 50%;
            margin-left: -100px;
            opacity: 0;
            transition: opacity 0.3s;
            font-size: 0.85rem;
            font-weight: normal;
        }
        
        .tooltip-content::after {
            content: "";
            position: absolute;
            top: 100%;
            left: 50%;
            margin-left: -5px;
            border-width: 5px;
            border-style: solid;
            border-color: #333 transparent transparent transparent;
        }
        
        .tooltip-wrapper:hover .tooltip-content {
            visibility: visible;
            opacity: 1;
        }
        
        /* Enhanced preset buttons */
        .preset-btn {
            transition: all 0.3s ease;
            border: 1px solid var(--primary-color);
            color: var(--primary-color);
            background-color: rgba(74, 111, 165, 0.1);
            padding: 0.75rem 1.25rem;
            border-radius: 30px;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }
        
        .preset-btn:hover {
            background-color: var(--primary-color);
            color: white;
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .preset-btn:active {
            transform: translateY(0);
        }
        
        .preset-btn i {
            margin-right: 0.5rem;
            font-size: 1.1rem;
        }
        
        /* Form sections */
        .section-title {
            background-color: rgba(74, 111, 165, 0.1);
            padding: 1rem;
            border-radius: 5px;
            margin-top: 2rem;
            margin-bottom: 1.5rem;
            border-left: 4px solid var(--primary-color);
        }
        
        .section-title i {
            color: var(--primary-color);
        }
        
        /* Form submit button */
        .form-submit-btn {
            padding: 1rem 2rem;
            font-size: 1.1rem;
            border-radius: 30px;
            box-shadow: 0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease;
        }
        
        .form-submit-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 7px 14px rgba(50, 50, 93, 0.1), 0 3px 6px rgba(0, 0, 0, 0.08);
        }
        
        .form-submit-btn:active {
            transform: translateY(1px);
        }
    `;
    
    // Append to head
    document.head.appendChild(styleElement);
});
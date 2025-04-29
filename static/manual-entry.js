// Manual Entry frontend functionality
// Manual Entry frontend functionality
function loadManualEntryPage(container) {
    // Check if trained models exist
    checkModelAvailability()
        .then(availability => {
            if (!availability.modelsAvailable) {
                // No trained models available
                container.innerHTML = `
                    <div class="page-header slide-in">
                        <h2 class="page-title"><i class="fas fa-edit"></i> Manual Entry Analysis</h2>
                    </div>
                    
                    <div class="alert alert-warning slide-in">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div>
                            <strong>No trained models available for analysis!</strong>
                            <p>Please train at least one unsupervised model first.</p>
                        </div>
                    </div>
                    
                    <div class="text-center">
                        <button class="btn primary-btn" onclick="loadPage('model-training')">
                            <i class="fas fa-brain"></i> Go to Model Training
                        </button>
                    </div>
                `;
                return;
            }
            
            if (!availability.unsupervisedModels) {
                // Only supervised models available
                container.innerHTML = `
                    <div class="page-header slide-in">
                        <h2 class="page-title"><i class="fas fa-edit"></i> Manual Entry Analysis</h2>
                    </div>
                    
                    <div class="alert alert-warning slide-in">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div>
                            <strong>Manual entry requires unsupervised models!</strong>
                            <p>Please train at least one unsupervised model.</p>
                        </div>
                    </div>
                    
                    <div class="text-center">
                        <button class="btn primary-btn" onclick="loadPage('model-training')">
                            <i class="fas fa-brain"></i> Go to Model Training
                        </button>
                    </div>
                `;
                return;
            }
            
            // Unsupervised models available, render manual entry UI
            renderManualEntryUI(container, availability.unsupervisedModels);
        })
        .catch(error => {
            console.error('Error checking model availability:', error);
            // Show error state
            container.innerHTML = `
                <div class="page-header slide-in">
                    <h2 class="page-title"><i class="fas fa-edit"></i> Manual Entry Analysis</h2>
                </div>
                
                <div class="alert alert-danger slide-in">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>
                        <strong>Error checking model availability!</strong>
                        <p>There was a problem accessing trained models. Please try again.</p>
                    </div>
                </div>
            `;
        });
}

// Render Manual Entry UI
function renderManualEntryUI(container, results) {
    // Fetch data info to get feature names
    fetch(`${API_URL}/dataset-info`, {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        const datasetInfo = data.success ? data.datasetInfo : null;
        const features = datasetInfo ? datasetInfo.headers : [];
        
        // Create UI with feature fields
        container.innerHTML = `
            <div class="page-header slide-in">
                <h2 class="page-title"><i class="fas fa-edit"></i> Manual Entry Analysis</h2>
                <div class="page-actions">
                    <button class="btn secondary-btn" id="resetFormBtn">
                        <i class="fas fa-redo"></i> Reset Form
                    </button>
                    <button class="btn primary-btn" id="analyzeEntryBtn">
                        <i class="fas fa-search"></i> Analyze
                    </button>
                </div>
            </div>
            
            <div class="alert alert-info slide-in">
                <i class="fas fa-info-circle"></i>
                <div>
                    <strong>Manual Entry Analysis</strong>
                    <p>Enter network traffic parameters manually to analyze them with your trained models.</p>
                </div>
            </div>
            
            <!-- Input form -->
            <div class="row slide-in">
                <div class="col">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title"><i class="fas fa-list-alt"></i> Enter Network Parameters</h3>
                        </div>
                        <div class="card-body">
                            ${features.length === 0 ? `
                                <div class="alert alert-warning">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    <div>
                                        <strong>No features available!</strong>
                                        <p>Using default network traffic parameters instead.</p>
                                    </div>
                                </div>
                            ` : ''}
                            
                            <form id="manualEntryForm" class="manual-form">
                                ${createFormFields(features)}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Template selection -->
            <div class="row slide-in">
                <div class="col">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title"><i class="fas fa-copy"></i> Use Templates</h3>
                        </div>
                        <div class="card-body">
                            <p>Use a template to fill the form with sample values:</p>
                            <div class="templates-container">
                                <!-- Normal traffic template -->
                                <div class="template-item">
                                    <div class="template-icon">
                                        <i class="fas fa-check-circle"></i>
                                    </div>
                                    <div class="template-info">
                                        <h4>Normal HTTP Traffic</h4>
                                        <p>Standard web browsing traffic pattern</p>
                                    </div>
                                    <button class="btn secondary-btn" onclick="loadTemplate('normal_http')">
                                        <i class="fas fa-file-import"></i> Use Template
                                    </button>
                                </div>
                                
                                <!-- DoS attack template -->
                                <div class="template-item">
                                    <div class="template-icon attack">
                                        <i class="fas fa-bomb"></i>
                                    </div>
                                    <div class="template-info">
                                        <h4>DoS Attack Pattern</h4>
                                        <p>Denial of Service attack signature</p>
                                    </div>
                                    <button class="btn secondary-btn" onclick="loadTemplate('dos_attack')">
                                        <i class="fas fa-file-import"></i> Use Template
                                    </button>
                                </div>
                                
                                <!-- Port scan template -->
                                <div class="template-item">
                                    <div class="template-icon attack">
                                        <i class="fas fa-search"></i>
                                    </div>
                                    <div class="template-info">
                                        <h4>Port Scanning Pattern</h4>
                                        <p>Network reconnaissance activity</p>
                                    </div>
                                    <button class="btn secondary-btn" onclick="loadTemplate('port_scan')">
                                        <i class="fas fa-file-import"></i> Use Template
                                    </button>
                                </div>
                                
                                <!-- SQL injection template -->
                                <div class="template-item">
                                    <div class="template-icon attack">
                                        <i class="fas fa-database"></i>
                                    </div>
                                    <div class="template-info">
                                        <h4>SQL Injection Pattern</h4>
                                        <p>Database attack signature</p>
                                    </div>
                                    <button class="btn secondary-btn" onclick="loadTemplate('sql_injection')">
                                        <i class="fas fa-file-import"></i> Use Template
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Analysis results (initially hidden) -->
            <div class="row slide-in hidden" id="analysisResults">
                <div class="col">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title"><i class="fas fa-chart-line"></i> Analysis Results</h3>
                        </div>
                        <div class="card-body" id="resultsContainer">
                            <!-- Results will be populated here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize manual entry functionality
        initializeManualEntry();
    })
    .catch(error => {
        console.error('Error fetching dataset info:', error);
        // Create UI with default fields
        container.innerHTML = `
            <div class="page-header slide-in">
                <h2 class="page-title"><i class="fas fa-edit"></i> Manual Entry Analysis</h2>
                <div class="page-actions">
                    <button class="btn secondary-btn" id="resetFormBtn">
                        <i class="fas fa-redo"></i> Reset Form
                    </button>
                    <button class="btn primary-btn" id="analyzeEntryBtn">
                        <i class="fas fa-search"></i> Analyze
                    </button>
                </div>
            </div>
            
            <div class="alert alert-warning slide-in">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <strong>Error loading dataset features!</strong>
                    <p>Using default network parameters instead.</p>
                </div>
            </div>
            
            <!-- Input form with default fields -->
            <div class="row slide-in">
                <div class="col">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title"><i class="fas fa-list-alt"></i> Enter Network Parameters</h3>
                        </div>
                        <div class="card-body">
                            <form id="manualEntryForm" class="manual-form">
                                ${createDefaultFormFields()}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Template selection (same as above) -->
            <!-- Analysis results (same as above) -->
        `;
        
        // Initialize manual entry functionality
        initializeManualEntry();
    });
}

// Check model availability function
function checkModelAvailability() {
    // First check if training results are directly available in session
    const storedResults = sessionStorage.getItem('trainingResults');
    
    if (storedResults) {
        try {
            const results = JSON.parse(storedResults);
            console.log("Found training results in session storage:", results);
            
            const hasSupervised = results && Object.keys(results.supervisedModels || {}).length > 0;
            const hasUnsupervised = results && Object.keys(results.unsupervisedModels || {}).length > 0;
            
            if (hasSupervised || hasUnsupervised) {
                console.log("Models are available from session storage");
                return Promise.resolve({
                    modelsAvailable: true,
                    supervisedModels: hasSupervised ? results.supervisedModels : null,
                    unsupervisedModels: hasUnsupervised ? results.unsupervisedModels : null
                });
            }
        } catch (e) {
            console.error("Error parsing stored results:", e);
        }
    }
    
    // If not in session, try to fetch from the server
    console.log("Checking model availability via API");
    return fetch('/api/training-results', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success && data.trainingResults) {
            const results = data.trainingResults;
            console.log("Successfully fetched training results from API:", results);
            
            // Store the full results in sessionStorage for future use
            sessionStorage.setItem('trainingResults', JSON.stringify(results));
            
            const hasSupervised = results && Object.keys(results.supervisedModels || {}).length > 0;
            const hasUnsupervised = results && Object.keys(results.unsupervisedModels || {}).length > 0;
            
            // Also save training status
            sessionStorage.setItem('modelsTrainedStatus', JSON.stringify({
                supervisedTrained: hasSupervised,
                unsupervisedTrained: hasUnsupervised,
                timestamp: new Date().toISOString()
            }));
            
            return {
                modelsAvailable: hasSupervised || hasUnsupervised,
                supervisedModels: hasSupervised ? results.supervisedModels : null,
                unsupervisedModels: hasUnsupervised ? results.unsupervisedModels : null
            };
        }
        console.log("No training results available from API");
        return { modelsAvailable: false };
    })
    .catch(error => {
        console.error("Error checking model availability:", error);
        // Try a second approach - check if we have training status in session storage
        const trainedStatus = sessionStorage.getItem('modelsTrainedStatus');
        if (trainedStatus) {
            try {
                const status = JSON.parse(trainedStatus);
                // Use this as a fallback
                return {
                    modelsAvailable: status.supervisedTrained || status.unsupervisedTrained,
                    supervisedModels: status.supervisedTrained ? ['Available'] : null,
                    unsupervisedModels: status.unsupervisedTrained ? ['Available'] : null
                };
            } catch (e) {
                console.error("Error parsing training status:", e);
            }
        }
        return { modelsAvailable: false };
    });
}

// Create form fields based on dataset features
function createFormFields(features) {
    if (!features || features.length === 0) {
        return createDefaultFormFields();
    }
    
    // Group fields into columns for better layout
    const columns = 3;
    const fieldsPerColumn = Math.ceil(features.length / columns);
    
    let html = '<div class="form-columns">';
    
    for (let i = 0; i < columns; i++) {
        html += '<div class="form-column">';
        
        const startIndex = i * fieldsPerColumn;
        const endIndex = Math.min(startIndex + fieldsPerColumn, features.length);
        
        for (let j = startIndex; j < endIndex; j++) {
            const feature = features[j];
            html += `
                <div class="form-group">
                    <label for="${feature}">${formatFeatureName(feature)}</label>
                    <input type="text" id="${feature}" name="${feature}" class="form-control">
                </div>
            `;
        }
        
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

// Create default form fields when dataset features are not available
function createDefaultFormFields() {
    return `
        <div class="form-columns">
            <div class="form-column">
                <div class="form-group">
                    <label for="duration">Duration (sec)</label>
                    <input type="number" id="duration" name="duration" class="form-control" min="0">
                </div>
                <div class="form-group">
                    <label for="protocol_type">Protocol Type</label>
                    <select id="protocol_type" name="protocol_type" class="form-control">
                        <option value="tcp">TCP</option>
                        <option value="udp">UDP</option>
                        <option value="icmp">ICMP</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="service">Service</label>
                    <select id="service" name="service" class="form-control">
                        <option value="http">HTTP</option>
                        <option value="ftp">FTP</option>
                        <option value="smtp">SMTP</option>
                        <option value="ssh">SSH</option>
                        <option value="dns">DNS</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="src_bytes">Source Bytes</label>
                    <input type="number" id="src_bytes" name="src_bytes" class="form-control" min="0">
                </div>
            </div>
            
            <div class="form-column">
                <div class="form-group">
                    <label for="dst_bytes">Destination Bytes</label>
                    <input type="number" id="dst_bytes" name="dst_bytes" class="form-control" min="0">
                </div>
                <div class="form-group">
                    <label for="flag">Connection Flag</label>
                    <select id="flag" name="flag" class="form-control">
                        <option value="SF">SF (Normal)</option>
                        <option value="REJ">REJ (Rejected)</option>
                        <option value="S0">S0 (Connection Attempt)</option>
                        <option value="RST">RST (Reset)</option>
                        <option value="S1">S1 (Connection Established)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="land">Land (1=same src/dst)</label>
                    <select id="land" name="land" class="form-control">
                        <option value="0">0 (Different)</option>
                        <option value="1">1 (Same)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="wrong_fragment">Wrong Fragment</label>
                    <input type="number" id="wrong_fragment" name="wrong_fragment" class="form-control" min="0">
                </div>
            </div>
            
            <div class="form-column">
                <div class="form-group">
                    <label for="urgent">Urgent Packets</label>
                    <input type="number" id="urgent" name="urgent" class="form-control" min="0">
                </div>
                <div class="form-group">
                    <label for="hot">Hot Indicators</label>
                    <input type="number" id="hot" name="hot" class="form-control" min="0">
                </div>
                <div class="form-group">
                    <label for="num_failed_logins">Failed Login Attempts</label>
                    <input type="number" id="num_failed_logins" name="num_failed_logins" class="form-control" min="0">
                </div>
                <div class="form-group">
                    <label for="count">Connection Count</label>
                    <input type="number" id="count" name="count" class="form-control" min="0">
                </div>
            </div>
        </div>
    `;
}

// Format feature name for display
function formatFeatureName(feature) {
    return feature
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
}

// Initialize manual entry functionality
// Initialize manual entry functionality
function initializeManualEntry() {
    // Get DOM elements
    const resetFormBtn = document.getElementById('resetFormBtn');
    const analyzeEntryBtn = document.getElementById('analyzeEntryBtn');
    const manualEntryForm = document.getElementById('manualEntryForm');
    const analysisResults = document.getElementById('analysisResults');
    
    // Reset form button
    if (resetFormBtn) {
        resetFormBtn.addEventListener('click', () => {
            manualEntryForm.reset();
            analysisResults.classList.add('hidden');
        });
    }
    
    // Analyze button
    if (analyzeEntryBtn) {
        analyzeEntryBtn.addEventListener('click', analyzeEntry);
    }
}

// Load template data
function loadTemplate(templateName) {
    const form = document.getElementById('manualEntryForm');
    if (!form) return;
    
    // Clear existing form
    form.reset();
    
    // Hide results if showing
    const resultsSection = document.getElementById('analysisResults');
    if (resultsSection) {
        resultsSection.classList.add('hidden');
    }
    
    // Define templates
    const templates = {
        normal_http: {
            duration: 2,
            protocol_type: 'tcp',
            service: 'http',
            flag: 'SF',
            src_bytes: 1250,
            dst_bytes: 8500,
            land: 0,
            wrong_fragment: 0,
            urgent: 0,
            hot: 0,
            num_failed_logins: 0,
            logged_in: 1,
            num_compromised: 0,
            root_shell: 0,
            su_attempted: 0,
            num_root: 0,
            num_file_creations: 0,
            num_shells: 0,
            num_access_files: 0,
            num_outbound_cmds: 0,
            is_host_login: 0,
            is_guest_login: 0,
            count: 12,
            srv_count: 10,
            serror_rate: 0,
            srv_serror_rate: 0,
            rerror_rate: 0,
            srv_rerror_rate: 0,
            same_srv_rate: 1.0,
            diff_srv_rate: 0,
            srv_diff_host_rate: 0.08,
            dst_host_count: 120,
            dst_host_srv_count: 95,
            dst_host_same_srv_rate: 0.79,
            dst_host_diff_srv_rate: 0.04,
            dst_host_same_src_port_rate: 0.25,
            dst_host_srv_diff_host_rate: 0.1,
            dst_host_serror_rate: 0,
            dst_host_srv_serror_rate: 0,
            dst_host_rerror_rate: 0,
            dst_host_srv_rerror_rate: 0
        },
        
        dos_attack: {
            duration: 0,
            protocol_type: 'tcp',
            service: 'http',
            flag: 'S0',
            src_bytes: 0,
            dst_bytes: 0,
            land: 0,
            wrong_fragment: 0,
            urgent: 0,
            hot: 0,
            num_failed_logins: 0,
            logged_in: 0,
            num_compromised: 0,
            root_shell: 0,
            su_attempted: 0,
            num_root: 0,
            num_file_creations: 0,
            num_shells: 0,
            num_access_files: 0,
            num_outbound_cmds: 0,
            is_host_login: 0,
            is_guest_login: 0,
            count: 350,
            srv_count: 350,
            serror_rate: 1.0,
            srv_serror_rate: 1.0,
            rerror_rate: 0,
            srv_rerror_rate: 0,
            same_srv_rate: 1.0,
            diff_srv_rate: 0,
            srv_diff_host_rate: 0,
            dst_host_count: 255,
            dst_host_srv_count: 255,
            dst_host_same_srv_rate: 1.0,
            dst_host_diff_srv_rate: 0,
            dst_host_same_src_port_rate: 1.0,
            dst_host_srv_diff_host_rate: 0,
            dst_host_serror_rate: 1.0,
            dst_host_srv_serror_rate: 1.0,
            dst_host_rerror_rate: 0,
            dst_host_srv_rerror_rate: 0
        },
        
        port_scan: {
            duration: 0,
            protocol_type: 'tcp',
            service: 'other',
            flag: 'S0',
            src_bytes: 0,
            dst_bytes: 0,
            land: 0,
            wrong_fragment: 0,
            urgent: 0,
            hot: 0,
            num_failed_logins: 0,
            logged_in: 0,
            num_compromised: 0,
            root_shell: 0,
            su_attempted: 0,
            num_root: 0,
            num_file_creations: 0,
            num_shells: 0,
            num_access_files: 0,
            num_outbound_cmds: 0,
            is_host_login: 0,
            is_guest_login: 0,
            count: 1,
            srv_count: 1,
            serror_rate: 1.0,
            srv_serror_rate: 1.0,
            rerror_rate: 0,
            srv_rerror_rate: 0,
            same_srv_rate: 1.0,
            diff_srv_rate: 0,
            srv_diff_host_rate: 1.0,
            dst_host_count: 20,
            dst_host_srv_count: 5,
            dst_host_same_srv_rate: 0.25,
            dst_host_diff_srv_rate: 0.75,
            dst_host_same_src_port_rate: 0.03,
            dst_host_srv_diff_host_rate: 0.25,
            dst_host_serror_rate: 0.8,
            dst_host_srv_serror_rate: 0.8,
            dst_host_rerror_rate: 0.2,
            dst_host_srv_rerror_rate: 0.2
        },
        
        sql_injection: {
            duration: 1,
            protocol_type: 'tcp',
            service: 'http',
            flag: 'SF',
            src_bytes: 2500,
            dst_bytes: 3000,
            land: 0,
            wrong_fragment: 0,
            urgent: 0,
            hot: 9,
            num_failed_logins: 0,
            logged_in: 1,
            num_compromised: 2,
            root_shell: 0,
            su_attempted: 0,
            num_root: 0,
            num_file_creations: 0,
            num_shells: 0,
            num_access_files: 0,
            num_outbound_cmds: 0,
            is_host_login: 0,
            is_guest_login: 0,
            count: 6,
            srv_count: 6,
            serror_rate: 0,
            srv_serror_rate: 0,
            rerror_rate: 0,
            srv_rerror_rate: 0,
            same_srv_rate: 1.0,
            diff_srv_rate: 0,
            srv_diff_host_rate: 0,
            dst_host_count: 100,
            dst_host_srv_count: 100,
            dst_host_same_srv_rate: 1.0,
            dst_host_diff_srv_rate: 0,
            dst_host_same_src_port_rate: 0.2,
            dst_host_srv_diff_host_rate: 0,
            dst_host_serror_rate: 0,
            dst_host_srv_serror_rate: 0,
            dst_host_rerror_rate: 0,
            dst_host_srv_rerror_rate: 0
        }
    };
    
    // Get the template data
    const templateData = templates[templateName];
    if (!templateData) {
        showNotification('Template not found!', 'error');
        return;
    }
    
    // Fill the form with template data
    Object.entries(templateData).forEach(([key, value]) => {
        const field = form.elements[key];
        if (field) {
            field.value = value;
        }
    });
    
    showNotification(`Loaded "${templateName}" template`, 'success');
}

// Analyze form entry
async function analyzeEntry() {
    // Get form data
    const form = document.getElementById('manualEntryForm');
    if (!form) return;
    
    // Show loading notification
    showNotification('Analyzing network parameters...', 'warning');
    
    // Collect form data
    const formData = {};
    const formElements = form.elements;
    for (let i = 0; i < formElements.length; i++) {
        const element = formElements[i];
        if (element.name && element.value) {
            // Convert numeric values to numbers
            const value = !isNaN(element.value) && element.type !== 'text' ? parseFloat(element.value) : element.value;
            formData[element.name] = value;
        }
    }
    
    try {
        // Send data for analysis
        const response = await fetch(`${API_URL}/analyze-manual`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Show results
            displayAnalysisResults(data.results);
            
            // Show success notification
            showNotification('Analysis completed successfully!', 'success');
        } else {
            showNotification(data.message || 'Error analyzing data', 'error');
        }
    } catch (error) {
        console.error('Error analyzing manual entry:', error);
        showNotification('Server error. Please try again later.', 'error');
    }
}

// Display analysis results
function displayAnalysisResults(results) {
    const container = document.getElementById('resultsContainer');
    const resultsSection = document.getElementById('analysisResults');
    
    if (!container || !resultsSection) return;
    
    // Show results section
    resultsSection.classList.remove('hidden');
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
    
    // Generate results HTML
    let html = `
        <div class="results-summary">
            <div class="status-indicator ${results.isAnomaly ? 'danger' : 'success'}">
                <i class="fas ${results.isAnomaly ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i>
                <h3>${results.isAnomaly ? 'Potential Threat Detected' : 'Normal Traffic'}</h3>
            </div>
            
            <div class="confidence-meter">
                <div class="confidence-label">Confidence: ${(results.confidence * 100).toFixed(1)}%</div>
                <div class="confidence-bar">
                    <div class="confidence-value" style="width: ${(results.confidence * 100).toFixed(1)}%"></div>
                </div>
            </div>
        </div>
        
        <div class="results-details">
            <h4>Model Predictions</h4>
            <div class="models-predictions">
                ${Object.entries(results.modelPredictions).map(([modelName, prediction]) => `
                    <div class="model-prediction">
                        <div class="model-name">${modelName}</div>
                        <div class="prediction-value ${prediction.isAnomaly ? 'anomaly' : 'normal'}">
                            ${prediction.isAnomaly ? 'Anomaly' : 'Normal'}
                            <span class="prediction-confidence">${(prediction.confidence * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            ${results.attackType ? `
                <div class="attack-details">
                    <h4>Attack Classification</h4>
                    <div class="attack-type">
                        <div class="attack-name">${results.attackType.name}</div>
                        <div class="attack-confidence">${(results.attackType.confidence * 100).toFixed(1)}%</div>
                    </div>
                    <div class="attack-description">
                        <p>${results.attackType.description}</p>
                    </div>
                </div>
            ` : ''}
            
            <div class="feature-importance">
                <h4>Key Factors</h4>
                <div class="factors-list">
                    ${results.keyFactors.map(factor => `
                        <div class="factor-item">
                            <div class="factor-name">${formatFeatureName(factor.name)}</div>
                            <div class="factor-bar-container">
                                <div class="factor-bar ${factor.direction === 'positive' ? 'positive' : 'negative'}" 
                                      style="width: ${Math.min(Math.abs(factor.importance) * 100, 100)}%">
                                </div>
                            </div>
                            <div class="factor-value">${factor.value}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <div class="results-recommendations">
            <h4>Recommendations</h4>
            <ul class="recommendations-list">
                ${results.recommendations.map(rec => `
                    <li class="recommendation-item">
                        <i class="fas fa-angle-right"></i>
                        <span>${rec}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
    
    container.innerHTML = html;
}
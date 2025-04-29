// Results functionality frontend
// Results functionality frontend
function loadResultsPage(container) {
    // First, try to get results from sessionStorage
    const storedResults = sessionStorage.getItem('trainingResults');
    let results = null;
    
    if (storedResults) {
        try {
            results = JSON.parse(storedResults);
            console.log("Successfully loaded results from session storage:", results);
        } catch (e) {
            console.error("Error parsing stored results:", e);
        }
    }
    
    // If results were loaded from session, use them
    if (results && (Object.keys(results.supervisedModels || {}).length > 0 || 
                   Object.keys(results.unsupervisedModels || {}).length > 0)) {
        renderResultsPage(container, results);
        return;
    }
    
    // If not found in session or empty, try API
    checkTrainingResults()
        .then(apiResults => {
            if (!apiResults || 
                (Object.keys(apiResults.supervisedModels || {}).length === 0 && 
                 Object.keys(apiResults.unsupervisedModels || {}).length === 0)) {
                // No results available from API either
                showNoResultsMessage(container);
                return;
            }
            
            // Save API results to session for future use
            sessionStorage.setItem('trainingResults', JSON.stringify(apiResults));
            
            // Also save training status
            sessionStorage.setItem('modelsTrainedStatus', JSON.stringify({
                supervisedTrained: Object.keys(apiResults.supervisedModels || {}).length > 0,
                unsupervisedTrained: Object.keys(apiResults.unsupervisedModels || {}).length > 0,
                timestamp: new Date().toISOString()
            }));
            
            renderResultsPage(container, apiResults);
        })
        .catch(error => {
            console.error('Error checking training results:', error);
            showNoResultsMessage(container);
        });
}

// Find best supervised model based on metrics
function findBestSupervisedModel(supervisedModels) {
    let bestModel = null;
    let bestScore = -1;
    
    for (const [modelName, modelData] of Object.entries(supervisedModels)) {
        if (modelData.results && modelData.results.metrics) {
            const metrics = modelData.results.metrics;
            // Prioritize F1 score, then accuracy
            const score = metrics.F1 || metrics.Accuracy || 0;
            
            if (score > bestScore) {
                bestScore = score;
                bestModel = modelName;
            }
        }
    }
    
    return bestModel;
}

// Find best unsupervised model based on metrics
function findBestUnsupervisedModel(unsupervisedModels) {
    let bestModel = null;
    let bestScore = -1;
    
    for (const [modelName, modelData] of Object.entries(unsupervisedModels)) {
        if (modelData.results && modelData.results.metrics) {
            const metrics = modelData.results.metrics;
            // Prioritize Silhouette score
            const score = metrics.Silhouette || 0;
            
            if (score > bestScore) {
                bestScore = score;
                bestModel = modelName;
            }
        }
    }
    
    return bestModel;
}

// Show message when no results available
function showNoResultsMessage(container) {
    container.innerHTML = `
        <div class="page-header slide-in">
            <h2 class="page-title"><i class="fas fa-chart-bar"></i> Results</h2>
        </div>
        
        <div class="alert alert-warning slide-in">
            <i class="fas fa-exclamation-triangle"></i>
            <div>
                <strong>No trained models available!</strong>
                <p>Please train models first to view results.</p>
            </div>
        </div>
        
        <div class="text-center">
            <button class="btn primary-btn" onclick="loadPage('model-training')">
                <i class="fas fa-brain"></i> Go to Model Training
            </button>
        </div>
    `;
}

// Render results page
function renderResultsPage(container, results) {
    container.innerHTML = `
        <div class="page-header slide-in">
            <h2 class="page-title"><i class="fas fa-chart-bar"></i> Results</h2>
            <div class="page-actions">
                <button class="btn primary-btn" id="generateReportBtn">
                    <i class="fas fa-file-pdf"></i> Generate Report
                </button>
            </div>
        </div>
        
        <div class="alert alert-info slide-in">
            <i class="fas fa-info-circle"></i>
            <div>
                <strong>Model Evaluation Results</strong>
                <p>View and compare performance metrics for your trained models. Use the tabs below to switch between supervised and unsupervised models.</p>
            </div>
        </div>
        
        <div class="tabs-container slide-in">
            <div class="tabs">
                <button class="tab-btn ${Object.keys(results.supervisedModels).length > 0 ? 'active' : ''}" data-tab="supervised" ${Object.keys(results.supervisedModels).length === 0 ? 'disabled' : ''}>
                    <i class="fas fa-tag"></i> Supervised Models
                </button>
                <button class="tab-btn ${Object.keys(results.supervisedModels).length === 0 ? 'active' : ''}" data-tab="unsupervised" ${Object.keys(results.unsupervisedModels).length === 0 ? 'disabled' : ''}>
                    <i class="fas fa-project-diagram"></i> Unsupervised Models
                </button>
            </div>
            
            <!-- Supervised models tab -->
            <div class="tab-content ${Object.keys(results.supervisedModels).length > 0 ? 'active' : ''}" id="supervised-tab">
                ${Object.keys(results.supervisedModels).length === 0 ? `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div>
                            <strong>No supervised models were trained!</strong>
                            <p>Please train supervised models to view their results.</p>
                        </div>
                    </div>
                ` : `
                    <!-- Performance metrics -->
                    <div class="results-section">
                        <h3>Models Performance Metrics</h3>
                        <div class="metrics-table-container">
                            <table class="metrics-table">
                                <thead>
                                    <tr>
                                        <th>Model</th>
                                        ${results.supervisedMetrics.map(metric => `<th>${metric}</th>`).join('')}
                                    </tr>
                                </thead>
                                <tbody>
                                    ${Object.entries(results.supervisedModels).map(([modelName, modelData]) => `
                                        <tr>
                                            <td>${modelName}</td>
                                            ${results.supervisedMetrics.map(metric => `
                                                <td>${modelData.results && modelData.results.metrics && modelData.results.metrics[metric] ? 
                                                    modelData.results.metrics[metric].toFixed(4) : 'N/A'}</td>
                                            `).join('')}
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Confusion matrices -->
                    <div class="results-section">
                        <h3>Confusion Matrices</h3>
                        <div class="models-grid">
                            ${Object.entries(results.supervisedModels).map(([modelName, modelData]) => `
                                <div class="model-card">
                                    <h4>${modelName}</h4>
                                    <div class="confusion-matrix-container" id="confusionMatrix-${modelName}">
                                        <button class="btn secondary-btn" onclick="fetchConfusionMatrix('${modelName}')">
                                            <i class="fas fa-eye"></i> View Confusion Matrix
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Learning curves -->
                    <div class="results-section">
                        <h3>Learning Curves</h3>
                        <div class="models-grid">
                            ${Object.entries(results.supervisedModels).map(([modelName, modelData]) => `
                                <div class="model-card">
                                    <h4>${modelName}</h4>
                                    <div class="learning-curve-container" id="learningCurve-${modelName}">
                                        <button class="btn secondary-btn" onclick="fetchLearningCurve('${modelName}')">
                                            <i class="fas fa-chart-line"></i> View Learning Curve
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `}
            </div>
            
            <!-- Unsupervised models tab -->
            <div class="tab-content ${Object.keys(results.supervisedModels).length === 0 ? 'active' : ''}" id="unsupervised-tab">
                ${Object.keys(results.unsupervisedModels).length === 0 ? `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div>
                            <strong>No unsupervised models were trained!</strong>
                            <p>Please train unsupervised models to view their results.</p>
                        </div>
                    </div>
                ` : `
                    <!-- Performance metrics -->
                    <div class="results-section">
                        <h3>Models Performance Metrics</h3>
                        <div class="metrics-table-container">
                            <table class="metrics-table">
                                <thead>
                                    <tr>
                                        <th>Model</th>
                                        ${results.unsupervisedMetrics.map(metric => `<th>${metric}</th>`).join('')}
                                        <th>Anomaly Ratio</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${Object.entries(results.unsupervisedModels).map(([modelName, modelData]) => `
                                        <tr>
                                            <td>${modelName}</td>
                                            ${results.unsupervisedMetrics.map(metric => `
                                                <td>${modelData.results && modelData.results.metrics && modelData.results.metrics[metric] ? 
                                                    modelData.results.metrics[metric].toFixed(4) : 'N/A'}</td>
                                            `).join('')}
                                            <td>${modelData.results && modelData.results.anomaly_ratio ? 
                                                (modelData.results.anomaly_ratio * 100).toFixed(2) + '%' : 'N/A'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Cluster distribution -->
                    <div class="results-section">
                        <h3>Cluster Distribution</h3>
                        <div class="models-grid">
                            ${Object.entries(results.unsupervisedModels)
                                .filter(([modelName, modelData]) => modelData.results && modelData.results.cluster_distribution)
                                .map(([modelName, modelData]) => `
                                    <div class="model-card">
                                        <h4>${modelName}</h4>
                                        <div class="cluster-distribution-container" id="clusterDistribution-${modelName}">
                                            <button class="btn secondary-btn" onclick="fetchClusterDistribution('${modelName}')">
                                                <i class="fas fa-chart-pie"></i> View Cluster Distribution
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                        </div>
                    </div>
                    
                    <!-- Detected attack types -->
                    <div class="results-section">
                        <h3>Detected Attack Types</h3>
                        <div class="attack-types-container">
                            ${Object.entries(results.unsupervisedModels)
                                .filter(([modelName, modelData]) => modelData.predictedAttackTypes && modelData.predictedAttackTypes.length > 0)
                                .map(([modelName, modelData]) => `
                                    <div class="model-attacks">
                                        <h4>${modelName}</h4>
                                        <div class="attacks-list">
                                            ${modelData.predictedAttackTypes.map(attack => `
                                                <div class="attack-item">
                                                    <div class="attack-header">
                                                        <div class="attack-name">
                                                            <i class="fas fa-exclamation-triangle"></i> ${attack.type || attack.name}
                                                        </div>
                                                        <div class="attack-confidence">
                                                            Confidence: ${(attack.confidence * 100).toFixed(1)}%
                                                        </div>
                                                    </div>
                                                    <div class="attack-desc">
                                                        ${attack.description}
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                `).join('')}
                        </div>
                    </div>
                `}
            </div>
        </div>
    `;
    
    // Initialize results functionality
    initializeResults(results);
}

// Initialize results functionality
function initializeResults(results) {
    // Setup tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.disabled) return;
            
            // Remove active class from all tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked tab
            btn.classList.add('active');
            
            // Hide all tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show selected tab content
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
        });
    });
    
    // Generate report button
    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', () => {
            generateReport();
        });
    }
}

// Fetch confusion matrix visualization
async function fetchConfusionMatrix(modelName) {
    const container = document.getElementById(`confusionMatrix-${modelName}`);
    if (!container) return;
    
    // Show loading state
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading confusion matrix...</div>';
    
    try {
        const response = await fetch(`${API_URL}/confusion-matrix/${modelName}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Display the confusion matrix image
            container.innerHTML = `
                <div class="matrix-visualization">
                    <img src="${data.confusionMatrix.image}" alt="Confusion Matrix for ${modelName}" />
                </div>
            `;
        } else {
            container.innerHTML = `<div class="error-message">${data.message || 'Failed to load confusion matrix'}</div>`;
        }
    } catch (error) {
        console.error(`Error fetching confusion matrix for ${modelName}:`, error);
        container.innerHTML = '<div class="error-message">Server error. Please try again later.</div>';
    }
}

// Fetch learning curve visualization
async function fetchLearningCurve(modelName) {
    const container = document.getElementById(`learningCurve-${modelName}`);
    if (!container) return;
    
    // Show loading state
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading learning curve...</div>';
    
    try {
        const response = await fetch(`${API_URL}/learning-curve/${modelName}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Display the learning curve image
            container.innerHTML = `
                <div class="curve-visualization">
                    <img src="${data.learningCurve.image}" alt="Learning Curve for ${modelName}" />
                </div>
            `;
        } else {
            container.innerHTML = `<div class="error-message">${data.message || 'Failed to load learning curve'}</div>`;
        }
    } catch (error) {
        console.error(`Error fetching learning curve for ${modelName}:`, error);
        container.innerHTML = '<div class="error-message">Server error. Please try again later.</div>';
    }
}

// Fetch cluster distribution visualization
async function fetchClusterDistribution(modelName) {
    const container = document.getElementById(`clusterDistribution-${modelName}`);
    if (!container) return;
    
    // Show loading state
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading cluster distribution...</div>';
    
    try {
        const response = await fetch(`${API_URL}/cluster-distribution/${modelName}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Display the cluster distribution image
            container.innerHTML = `
                <div class="distribution-visualization">
                    <img src="${data.clusterDistribution.image}" alt="Cluster Distribution for ${modelName}" />
                </div>
            `;
        } else {
            container.innerHTML = `<div class="error-message">${data.message || 'Failed to load cluster distribution'}</div>`;
        }
    } catch (error) {
        console.error(`Error fetching cluster distribution for ${modelName}:`, error);
        container.innerHTML = '<div class="error-message">Server error. Please try again later.</div>';
    }
}

// Generate report
async function generateReport() {
    // Show loading notification
    showNotification('Generating report...', 'warning');
    
    try {
        // Prepare report options
        const options = {
            reportType: 'comprehensive',
            includeDataset: true,
            includeModels: true,
            includeMetrics: true,
            includeCharts: true,
            includeAttacks: true,
            includeRecommendations: true,
            reportFormat: 'html'
        };
        
        // Send request to generate report
        const response = await fetch(`${API_URL}/report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(options),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Show success notification
            showNotification('Report generated successfully!', 'success');
            
            // Redirect to reports page
            setTimeout(() => {
                loadPage('reports');
            }, 1000);
        } else {
            showNotification(data.message || 'Error generating report', 'error');
        }
    } catch (error) {
        console.error('Error generating report:', error);
        showNotification('Server error. Please try again later.', 'error');
    }
}

// Enhanced visualization functions for results.js

// Function to run when page loads to check for pre-generated visualizations
function checkExistingVisualizations() {
    console.log("Checking for existing visualizations...");
    
    // Find all supervised model names
    document.querySelectorAll('[id^="confusionMatrix-"]').forEach(container => {
        const modelName = container.id.replace('confusionMatrix-', '');
        checkForExistingMatrix(modelName);
    });
    
    document.querySelectorAll('[id^="learningCurve-"]').forEach(container => {
        const modelName = container.id.replace('learningCurve-', '');
        checkForExistingCurve(modelName);
    });
    
    document.querySelectorAll('[id^="clusterDistribution-"]').forEach(container => {
        const modelName = container.id.replace('clusterDistribution-', '');
        checkForExistingDistribution(modelName);
    });
}

// Check for existing confusion matrix image
async function checkForExistingMatrix(modelName) {
    const container = document.getElementById(`confusionMatrix-${modelName}`);
    if (!container) return;
    
    try {
        const response = await fetch(`/check-visualization/${modelName}/confusion_matrix_image`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success && data.image) {
            // Display existing image
            container.innerHTML = `
                <div class="matrix-visualization">
                    <img src="data:image/png;base64,${data.image}" alt="Confusion Matrix for ${modelName}" 
                         style="max-width:100%; height:auto; border-radius:5px; box-shadow:0 4px 8px rgba(0,0,0,0.1);" />
                </div>
            `;
        }
    } catch (error) {
        console.log(`No preexisting matrix found for ${modelName}`);
    }
}

// Check for existing learning curve image
async function checkForExistingCurve(modelName) {
    const container = document.getElementById(`learningCurve-${modelName}`);
    if (!container) return;
    
    try {
        const response = await fetch(`/check-visualization/${modelName}/learning_curve_image`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success && data.image) {
            // Display existing image
            container.innerHTML = `
                <div class="curve-visualization">
                    <img src="data:image/png;base64,${data.image}" alt="Learning Curve for ${modelName}" 
                         style="max-width:100%; height:auto; border-radius:5px; box-shadow:0 4px 8px rgba(0,0,0,0.1);" />
                </div>
            `;
        }
    } catch (error) {
        console.log(`No preexisting learning curve found for ${modelName}`);
    }
}

// Check for existing cluster distribution image
async function checkForExistingDistribution(modelName) {
    const container = document.getElementById(`clusterDistribution-${modelName}`);
    if (!container) return;
    
    try {
        const response = await fetch(`/check-visualization/${modelName}/cluster_distribution_image`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success && data.image) {
            // Display existing image
            container.innerHTML = `
                <div class="distribution-visualization">
                    <img src="data:image/png;base64,${data.image}" alt="Cluster Distribution for ${modelName}" 
                         style="max-width:100%; height:auto; border-radius:5px; box-shadow:0 4px 8px rgba(0,0,0,0.1);" />
                </div>
            `;
        }
    } catch (error) {
        console.log(`No preexisting distribution found for ${modelName}`);
    }
}

// Fetch confusion matrix with retry mechanism
async function fetchConfusionMatrix(modelName) {
    const container = document.getElementById(`confusionMatrix-${modelName}`);
    if (!container) return;
    
    // Show loading state
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading confusion matrix...</div>';
    
    try {
        // First check if we already have the image
        const checkResponse = await fetch(`/check-visualization/${modelName}/confusion_matrix_image`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            if (checkData.success && checkData.image) {
                // Use existing image
                container.innerHTML = `
                    <div class="matrix-visualization">
                        <img src="data:image/png;base64,${checkData.image}" alt="Confusion Matrix for ${modelName}" 
                             style="max-width:100%; height:auto; border-radius:5px; box-shadow:0 4px 8px rgba(0,0,0,0.1);" />
                    </div>
                `;
                return;
            }
        }
        
        // If no existing image, use the form-based approach
        container.innerHTML = `
            <div class="loading">
                <form action="/confusion-matrix/${modelName}" method="post" target="_blank" style="display:inline;">
                    <button type="submit" class="btn primary-btn">
                        <i class="fas fa-sync"></i> Generate Matrix
                    </button>
                </form>
                <p style="margin-top: 10px; font-size: 13px;">
                    After generation, refresh this page to view the matrix
                </p>
            </div>
        `;
    } catch (error) {
        console.error(`Error fetching confusion matrix for ${modelName}:`, error);
        // Fallback to form submission
        container.innerHTML = `
            <div class="error-message">
                <p>Error loading visualization</p>
                <form action="/confusion-matrix/${modelName}" method="post" target="_blank" style="display:inline;">
                    <button type="submit" class="btn primary-btn">
                        <i class="fas fa-sync"></i> Try Again
                    </button>
                </form>
                <p style="margin-top: 10px; font-size: 13px;">
                    After generation, refresh this page to view the matrix
                </p>
            </div>
        `;
    }
}

// Fetch learning curve with retry mechanism
async function fetchLearningCurve(modelName) {
    const container = document.getElementById(`learningCurve-${modelName}`);
    if (!container) return;
    
    // Show loading state
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading learning curve...</div>';
    
    try {
        // First check if we already have the image
        const checkResponse = await fetch(`/check-visualization/${modelName}/learning_curve_image`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            if (checkData.success && checkData.image) {
                // Use existing image
                container.innerHTML = `
                    <div class="curve-visualization">
                        <img src="data:image/png;base64,${checkData.image}" alt="Learning Curve for ${modelName}" 
                             style="max-width:100%; height:auto; border-radius:5px; box-shadow:0 4px 8px rgba(0,0,0,0.1);" />
                    </div>
                `;
                return;
            }
        }
        
        // If no existing image, use the form-based approach
        container.innerHTML = `
            <div class="loading">
                <form action="/learning-curve/${modelName}" method="post" target="_blank" style="display:inline;">
                    <button type="submit" class="btn primary-btn">
                        <i class="fas fa-sync"></i> Generate Curve
                    </button>
                </form>
                <p style="margin-top: 10px; font-size: 13px;">
                    After generation, refresh this page to view the curve
                </p>
            </div>
        `;
    } catch (error) {
        console.error(`Error fetching learning curve for ${modelName}:`, error);
        // Fallback to form submission
        container.innerHTML = `
            <div class="error-message">
                <p>Error loading visualization</p>
                <form action="/learning-curve/${modelName}" method="post" target="_blank" style="display:inline;">
                    <button type="submit" class="btn primary-btn">
                        <i class="fas fa-sync"></i> Try Again
                    </button>
                </form>
                <p style="margin-top: 10px; font-size: 13px;">
                    After generation, refresh this page to view the curve
                </p>
            </div>
        `;
    }
}

// Fetch cluster distribution with retry mechanism
async function fetchClusterDistribution(modelName) {
    const container = document.getElementById(`clusterDistribution-${modelName}`);
    if (!container) return;
    
    // Show loading state
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading cluster distribution...</div>';
    
    try {
        // First check if we already have the image
        const checkResponse = await fetch(`/check-visualization/${modelName}/cluster_distribution_image`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            if (checkData.success && checkData.image) {
                // Use existing image
                container.innerHTML = `
                    <div class="distribution-visualization">
                        <img src="data:image/png;base64,${checkData.image}" alt="Cluster Distribution for ${modelName}" 
                             style="max-width:100%; height:auto; border-radius:5px; box-shadow:0 4px 8px rgba(0,0,0,0.1);" />
                    </div>
                `;
                return;
            }
        }
        
        // If no existing image, use the form-based approach
        container.innerHTML = `
            <div class="loading">
                <form action="/cluster-distribution/${modelName}" method="post" target="_blank" style="display:inline;">
                    <button type="submit" class="btn primary-btn">
                        <i class="fas fa-sync"></i> Generate Distribution
                    </button>
                </form>
                <p style="margin-top: 10px; font-size: 13px;">
                    After generation, refresh this page to view the distribution
                </p>
            </div>
        `;
    } catch (error) {
        console.error(`Error fetching cluster distribution for ${modelName}:`, error);
        // Fallback to form submission
        container.innerHTML = `
            <div class="error-message">
                <p>Error loading visualization</p>
                <form action="/cluster-distribution/${modelName}" method="post" target="_blank" style="display:inline;">
                    <button type="submit" class="btn primary-btn">
                        <i class="fas fa-sync"></i> Try Again
                    </button>
                </form>
                <p style="margin-top: 10px; font-size: 13px;">
                    After generation, refresh this page to view the distribution
                </p>
            </div>
        `;
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log("Visualization script loaded");
    checkExistingVisualizations();
});
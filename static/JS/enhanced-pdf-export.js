// Enhanced PDF Export Function for ML Intrusion Detection System
// This provides a client-side solution to generate PDF reports

// Main PDF export function
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener to PDF export button
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', generatePdfReport);
    }
});

// Comprehensive PDF generation function
async function generatePdfReport() {
    try {
        // Show loading indicator
        const loadingIndicator = createLoadingIndicator('Generating PDF report...');
        document.body.appendChild(loadingIndicator);
        
        // Determine source (results page, manual entry, or capture)
        const source = getDataSource();
        
        // Get currently selected model
        const model = getCurrentModel();
        
        // Gather all analysis data
        const analysisData = gatherAnalysisData(model, source);
        
        console.log("Preparing PDF report with data:", {
            source: source,
            model: model,
            analysisData: analysisData
        });
        
        // Submit form to server for PDF generation using FormData
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/export_pdf';
        form.target = '_blank'; // Open in new tab/window
        form.style.display = 'none';
        
        // Add model parameter
        addFormField(form, 'model', model);
        
        // Add source parameter
        addFormField(form, 'source', source);
        
        // Add analysis data as JSON
        addFormField(form, 'analysis_data', JSON.stringify(analysisData));
        
        // Add form to body, submit it, and then remove it
        document.body.appendChild(form);
        form.submit();
        
        // Set a timeout to remove loading indicator
        setTimeout(() => {
            if (document.body.contains(loadingIndicator)) {
                document.body.removeChild(loadingIndicator);
                showNotification('PDF report generated. Check your browser downloads or new tab.', 'success');
            }
        }, 3000);
    } catch (error) {
        console.error('Error generating PDF report:', error);
        showNotification('Error generating PDF: ' + error.message, 'error');
        
        // Remove loading indicator if exists
        const loadingIndicator = document.querySelector('.loading-indicator');
        if (loadingIndicator) {
            document.body.removeChild(loadingIndicator);
        }
    }
}

// Helper function to determine data source
function getDataSource() {
    // Default to results page
    let source = 'results';
    
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('source')) {
        source = urlParams.get('source');
    } else if (window.location.pathname.includes('/manual_result')) {
        source = 'manual';
    } else if (window.location.pathname.includes('/capture')) {
        source = 'capture';
    }
    
    return source;
}

// Helper function to get current model
function getCurrentModel() {
    // Try to get from model select dropdown
    const modelSelect = document.getElementById('model-select');
    if (modelSelect) {
        return modelSelect.value;
    }
    
    // Try to get from capture model select
    const captureModelSelect = document.getElementById('model-select');
    if (captureModelSelect) {
        return captureModelSelect.value;
    }
    
    // Try to get from global variable
    if (window.selectedModel) {
        return window.selectedModel;
    }
    
    // Get from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('model')) {
        return urlParams.get('model');
    }
    
    // Default to Isolation Forest
    return 'IsolationForest';
}

// Helper function to gather all analysis data
function gatherAnalysisData(model, source) {
    const data = {
        timestamp: new Date().toISOString(),
        model: model,
        source: source,
        networkStatus: {},
        modelMetrics: {},
        threatAnalysis: {
            detectedThreats: []
        },
        recommendations: [],
        dataStats: {},
        modelResults: {},
        modelComparison: {}
    };
    
    // Get prediction text if available
    const predictionText = document.querySelector('.prediction-text');
    if (predictionText) {
        data.networkStatus.summary = predictionText.textContent;
        
        // Determine risk level from text content
        if (predictionText.textContent.includes('HIGH RISK') || 
            predictionText.textContent.includes('ELEVATED RISK')) {
            data.networkStatus.riskLevel = 'High';
        } else if (predictionText.textContent.includes('MODERATE RISK')) {
            data.networkStatus.riskLevel = 'Medium';
        } else {
            data.networkStatus.riskLevel = 'Low';
        }
    }
    
    // Get threat types
    const threatBadges = document.querySelectorAll('.threat-badge');
    if (threatBadges.length > 0) {
        const threats = new Set();
        threatBadges.forEach(badge => {
            if (badge.textContent.trim()) {
                threats.add(badge.textContent.trim());
            }
        });
        data.threatAnalysis.detectedThreats = Array.from(threats).slice(0, 5);
    }
    
    // Get model results from global variable if available
    if (window.modelResultsData) {
        // Store current model metrics
        if (window.modelResultsData[model]) {
            data.modelMetrics = window.modelResultsData[model];
        }
        
        // Store all model results for comparison
        data.modelResults = window.modelResultsData;
        
        // Create model comparison data
        for (const [modelName, metrics] of Object.entries(window.modelResultsData)) {
            if (metrics) {
                // Store simplified metrics for easier comparison
                data.modelComparison[modelName] = {
                    accuracy: metrics.accuracy || null,
                    precision: metrics.precision || null,
                    recall: metrics.recall || null,
                    f1: metrics.f1 || null,
                    anomaly_percentage: metrics.anomaly_percentage || null
                };
            }
        }
    }
    
    // Add appropriate recommendations based on model and detected threats
    data.recommendations = generateRecommendations(model, data.threatAnalysis.detectedThreats);
    
    // Get data statistics if available
    if (window.fullData && Array.isArray(window.fullData)) {
        data.dataStats.recordCount = window.fullData.length;
        
        // Count normal vs anomaly records if class column exists
        if (window.fullData.length > 0 && 
            (window.fullData[0].hasOwnProperty('class') || 
             window.fullData[0].hasOwnProperty('is_anomaly'))) {
            
            const normalCount = window.fullData.filter(row => 
                row.class === 0 || 
                row.class === 'normal' || 
                row.is_anomaly === 0
            ).length;
            
            data.dataStats.normalCount = normalCount;
            data.dataStats.anomalyCount = window.fullData.length - normalCount;
            data.dataStats.anomalyPercentage = ((window.fullData.length - normalCount) / window.fullData.length * 100).toFixed(2);
        }
    }
    
    // If manual entry, collect form data
    if (source === 'manual') {
        data.manualEntryData = getManualEntryData();
    }
    
    // If capture, collect capture metrics
    if (source === 'capture') {
        data.captureData = getCaptureData();
    }
    
    // Get model characteristics for report
    data.modelCharacteristics = getModelCharacteristics(model);
    
    return data;
}

// Helper function to get manual entry data
function getManualEntryData() {
    const manualData = {};
    
    // Try to get from the form if on manual entry page
    const manualForm = document.getElementById('manual-entry-form');
    if (manualForm) {
        const formData = new FormData(manualForm);
        for (const [key, value] of formData.entries()) {
            manualData[key] = value;
        }
    } 
    // Try to get from result page if on manual result page
    else {
        const detailItems = document.querySelectorAll('.detail-item');
        detailItems.forEach(item => {
            const label = item.querySelector('.detail-label');
            const value = item.querySelector('.detail-value');
            
            if (label && value) {
                // Clean up label (remove colon and convert to lowercase)
                const key = label.textContent.replace(':', '').trim().toLowerCase();
                manualData[key] = value.textContent.trim();
            }
        });
    }
    
    return manualData;
}

// Helper function to get capture data
function getCaptureData() {
    const captureData = {
        packetCount: 0,
        elapsedTime: '00:00',
        uniqueIPs: 0,
        protocols: 0
    };
    
    // Get packet count
    const packetCount = document.getElementById('packet-count');
    if (packetCount) {
        captureData.packetCount = parseInt(packetCount.textContent) || 0;
    }
    
    // Get elapsed time
    const elapsedTime = document.getElementById('elapsed-time');
    if (elapsedTime) {
        captureData.elapsedTime = elapsedTime.textContent;
    }
    
    // Get unique IPs
    const ipCount = document.getElementById('ip-count');
    if (ipCount) {
        captureData.uniqueIPs = parseInt(ipCount.textContent) || 0;
    }
    
    // Get protocol count
    const protocolCount = document.getElementById('protocol-count');
    if (protocolCount) {
        captureData.protocols = parseInt(protocolCount.textContent) || 0;
    }
    
    return captureData;
}

// Helper function to generate appropriate recommendations
function generateRecommendations(model, threats) {
    // Default recommendations
    const defaultRecommendations = [
        "Regularly update all systems and applications with security patches",
        "Implement network segmentation to limit lateral movement",
        "Deploy intrusion detection and prevention systems",
        "Conduct regular security audits and penetration testing"
    ];
    
    // If no threats detected, return default recommendations
    if (!threats || threats.length === 0) {
        return defaultRecommendations;
    }
    
    // Get the primary threat type
    const primaryThreat = threats[0];
    
    // Recommendations based on threat type
    if (primaryThreat.includes('DoS')) {
        return [
            "Implement rate limiting for connections from suspicious source IPs",
            "Configure your firewall to block traffic from attacking source IP addresses",
            "Deploy a DDoS protection service if attacks persist",
            "Monitor network traffic volumes and set alerts for sudden spikes"
        ];
    } else if (primaryThreat.includes('Port Scan')) {
        return [
            "Block the scanning IP addresses in your firewall",
            "Ensure all unused ports are closed",
            "Implement port knocking or similar techniques for sensitive services",
            "Review security of services running on the scanned ports"
        ];
    } else if (primaryThreat.includes('Brute Force')) {
        return [
            "Implement account lockout policies after multiple failed attempts",
            "Enable two-factor authentication for all critical services",
            "Use strong password policies and consider password managers",
            "Implement IP-based access restrictions for sensitive services"
        ];
    } else if (primaryThreat.includes('Data Exfiltration')) {
        return [
            "Implement data loss prevention controls on critical systems",
            "Monitor and restrict outbound traffic, especially to unusual destinations",
            "Encrypt sensitive data at rest and in transit",
            "Implement egress filtering at network boundaries"
        ];
    } else if (primaryThreat.includes('Command & Control')) {
        return [
            "Implement DNS filtering and monitoring for unusual patterns",
            "Block access to known malicious domains and IP addresses",
            "Monitor for unusual outbound connections, especially during off-hours",
            "Deploy endpoint detection and response (EDR) solutions"
        ];
    } else if (primaryThreat.includes('Web Attack')) {
        return [
            "Implement a web application firewall (WAF)",
            "Regularly audit web application code for security vulnerabilities",
            "Validate and sanitize all user inputs",
            "Keep web server software and frameworks updated"
        ];
    } else {
        // For other/unknown threats, return default recommendations
        return defaultRecommendations;
    }
}

// Helper function to get model characteristics
function getModelCharacteristics(model) {
    const characteristics = {
        IsolationForest: {
            description: "An ensemble-based method that isolates anomalies by recursively partitioning the data space",
            strengths: ["Effective with high-dimensional data", "Handles complex, non-linear patterns", "Fast training time"],
            limitations: ["May miss local anomalies", "Performance affected by irrelevant features"],
            bestUseCase: "General-purpose anomaly detection with diverse traffic patterns"
        },
        LOF: {
            description: "Detects anomalies by measuring the local deviation of a data point with respect to its neighbors",
            strengths: ["Excellent at finding local anomalies", "Works well with varying densities", "Provides meaningful anomaly scores"],
            limitations: ["Sensitive to parameter choices", "Computationally intensive for large datasets"],
            bestUseCase: "Detecting anomalies that are only abnormal in their local context"
        },
        OneClassSVM: {
            description: "Maps data to a high-dimensional space and finds a hyperplane that separates normal data from anomalies",
            strengths: ["Effective with well-defined boundaries", "Works well with medium-sized datasets", "Handles complex decision boundaries"],
            limitations: ["Sensitive to parameter tuning", "Can be slow on large datasets"],
            bestUseCase: "When normal behavior follows a clear pattern and anomalies are distinctly different"
        },
        KMeans: {
            description: "Groups data into clusters and identifies points far from cluster centers as anomalies",
            strengths: ["Simple to implement", "Fast computation", "Intuitive interpretation"],
            limitations: ["Assumes spherical clusters", "Predefined number of clusters required"],
            bestUseCase: "Basic anomaly detection when traffic forms distinct groups"
        },
        DBSCAN: {
            description: "Density-based clustering algorithm that identifies points in low-density regions as anomalies",
            strengths: ["Discovers clusters of arbitrary shape", "Automatically identifies noise points", "No predefined number of clusters needed"],
            limitations: ["Sensitive to density parameters", "Struggles with varying densities"],
            bestUseCase: "Detecting anomalies in data with complex cluster structures"
        },
        RandomForest_Classifier: {
            description: "Ensemble learning method that constructs multiple decision trees for classification",
            strengths: ["High accuracy", "Robust to overfitting", "Handles large feature sets"],
            limitations: ["Requires labeled data", "Can be resource-intensive"],
            bestUseCase: "Supervised classification with well-labeled network traffic data"
        },
        Neural_Network: {
            description: "Deep learning model that can learn complex patterns in network traffic",
            strengths: ["Captures complex non-linear relationships", "Highly adaptable", "State-of-the-art performance"],
            limitations: ["Requires significant labeled data", "Black-box model with limited interpretability"],
            bestUseCase: "Complex classification tasks with sufficient training data"
        },
        Logistic_Regression: {
            description: "Statistical model that predicts binary outcomes using a logistic function",
            strengths: ["Fast training and prediction", "Highly interpretable", "Works well with linearly separable data"],
            limitations: ["Limited capacity for complex relationships", "Sensitive to outliers"],
            bestUseCase: "Quick baseline models and understanding feature importance"
        },
        KNeighbors_Classifier: {
            description: "Classification based on majority vote of nearest neighbors",
            strengths: ["Simple and intuitive", "No training phase", "Adapts to new patterns"],
            limitations: ["Slow for large datasets", "Sensitive to irrelevant features", "Memory intensive"],
            bestUseCase: "Smaller datasets with well-defined decision boundaries"
        },
        SVM_Classifier: {
            description: "Finds the optimal hyperplane that separates classes",
            strengths: ["Effective in high dimensions", "Robust against overfitting", "Versatile with different kernels"],
            limitations: ["Slow training on large datasets", "Sensitive to parameter tuning"],
            bestUseCase: "Complex classification with clear margins between classes"
        }
    };
    
    // Return characteristics for the specified model or default values
    return characteristics[model] || {
        description: "Advanced machine learning model for network traffic analysis",
        strengths: ["Anomaly detection", "Pattern recognition", "Automated analysis"],
        limitations: ["Requires quality data", "May need periodic retraining"],
        bestUseCase: "Network security monitoring and threat detection"
    };
}

// Helper function to create loading indicator
function createLoadingIndicator(message = 'Loading...') {
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading-indicator';
    loadingElement.style.position = 'fixed';
    loadingElement.style.top = '0';
    loadingElement.style.left = '0';
    loadingElement.style.width = '100%';
    loadingElement.style.height = '100%';
    loadingElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    loadingElement.style.display = 'flex';
    loadingElement.style.flexDirection = 'column';
    loadingElement.style.justifyContent = 'center';
    loadingElement.style.alignItems = 'center';
    loadingElement.style.zIndex = '10000';
    
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.style.border = '6px solid #f3f3f3';
    spinner.style.borderTop = '6px solid #4a6fa5';
    spinner.style.borderRadius = '50%';
    spinner.style.width = '50px';
    spinner.style.height = '50px';
    spinner.style.animation = 'spin 1s linear infinite';
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.color = 'white';
    messageElement.style.marginTop = '15px';
    messageElement.style.fontSize = '16px';
    
    loadingElement.appendChild(spinner);
    loadingElement.appendChild(messageElement);
    
    return loadingElement;
}

// Helper function to show notification
function showNotification(message, type = 'info') {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert-notification alert-${type}`;
    alertDiv.style.position = 'fixed';
    alertDiv.style.bottom = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.padding = '15px 20px';
    alertDiv.style.borderRadius = '4px';
    alertDiv.style.zIndex = '10000';
    alertDiv.style.maxWidth = '400px';
    alertDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    alertDiv.style.transition = 'opacity 0.5s ease';
    
    // Style based on type
    if (type === 'success') {
        alertDiv.style.backgroundColor = '#d4edda';
        alertDiv.style.borderLeft = '4px solid #28a745';
        alertDiv.style.color = '#155724';
    } else if (type === 'error') {
        alertDiv.style.backgroundColor = '#f8d7da';
        alertDiv.style.borderLeft = '4px solid #dc3545';
        alertDiv.style.color = '#721c24';
    } else if (type === 'warning') {
        alertDiv.style.backgroundColor = '#fff3cd';
        alertDiv.style.borderLeft = '4px solid #ffc107';
        alertDiv.style.color = '#856404';
    } else {
        alertDiv.style.backgroundColor = '#d1ecf1';
        alertDiv.style.borderLeft = '4px solid #17a2b8';
        alertDiv.style.color = '#0c5460';
    }
    
    // Add icon and message
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    alertDiv.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
    
    // Add to page
    document.body.appendChild(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(alertDiv)) {
                document.body.removeChild(alertDiv);
            }
        }, 500);
    }, 5000);
}

// Helper function to add form field
function addFormField(form, name, value) {
    const field = document.createElement('input');
    field.type = 'hidden';
    field.name = name;
    field.value = value;
    form.appendChild(field);
}
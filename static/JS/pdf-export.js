// Enhanced PDF Export Function

/**
 * Improved PDF export with proper analysis results
 * This script completely replaces the existing pdf-export.js
 */

// Main PDF export function
function exportToPdf() {
    try {
        console.log("Starting enhanced PDF export process...");
        
        // Show loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
        loadingIndicator.style.position = 'fixed';
        loadingIndicator.style.top = '0';
        loadingIndicator.style.left = '0';
        loadingIndicator.style.width = '100%';
        loadingIndicator.style.height = '100%';
        loadingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        loadingIndicator.style.display = 'flex';
        loadingIndicator.style.justifyContent = 'center';
        loadingIndicator.style.alignItems = 'center';
        loadingIndicator.style.color = 'white';
        loadingIndicator.style.fontSize = '1.5rem';
        loadingIndicator.style.zIndex = '9999';
        document.body.appendChild(loadingIndicator);
        
        // Determine source and model
        let source = 'results';
        let model = window.selectedModel || document.querySelector('#model-select')?.value || 'IsolationForest';
        
        // Check if coming from manual entry
        if (window.location.search.includes('source=manual')) {
            source = 'manual';
        } 
        // Check if coming from capture
        else if (window.location.search.includes('source=capture')) {
            source = 'capture';
            // Get capture model if available
            if (document.getElementById('capture-model')) {
                model = document.getElementById('capture-model').value;
            }
        }
        
        console.log(`Exporting PDF with source: ${source}, model: ${model}`);
        
        // Collect comprehensive analysis data
        const analysisData = collectAnalysisData(model, source);
        
        // Create form for POST request
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/export_pdf';
        form.style.display = 'none';
        
        // Add model parameter
        const modelInput = document.createElement('input');
        modelInput.type = 'hidden';
        modelInput.name = 'model';
        modelInput.value = model;
        form.appendChild(modelInput);
        
        // Add source parameter
        const sourceInput = document.createElement('input');
        sourceInput.type = 'hidden';
        sourceInput.name = 'source';
        sourceInput.value = source;
        form.appendChild(sourceInput);
        
        // Add analysis data as JSON
        const analysisInput = document.createElement('input');
        analysisInput.type = 'hidden';
        analysisInput.name = 'analysis_data';
        analysisInput.value = JSON.stringify(analysisData);
        form.appendChild(analysisInput);
        
        // Add form to body and submit
        document.body.appendChild(form);
        
        // Submit form
        form.submit();
        
        // Remove loading indicator after a delay
        setTimeout(() => {
            if (document.body.contains(loadingIndicator)) {
                document.body.removeChild(loadingIndicator);
                showPdfAlert('PDF generation in progress. Your download should begin automatically.', 'info');
            }
        }, 3000);
        
        console.log("PDF export form submitted with complete analysis data");
    } catch (e) {
        console.error("Error in enhanced PDF export:", e);
        showPdfAlert('Error generating PDF: ' + e.message, 'error');
        // Remove loading indicator if it exists
        const loadingIndicator = document.querySelector('.loading-indicator');
        if (loadingIndicator) {
            document.body.removeChild(loadingIndicator);
        }
    }
}

/**
 * Collect comprehensive analysis data for PDF report
 */
function collectAnalysisData(model, source) {
    const data = {
        title: "ML Intrusion Detection System Analysis Report",
        timestamp: new Date().toISOString(),
        model: model,
        source: source,
        networkStatus: {},
        modelMetrics: {},
        threatAnalysis: {},
        recommendations: [],
        dataStats: {}
    };
    
    // Get network status from prediction text
    const predictionText = document.querySelector('.prediction-text');
    if (predictionText) {
        data.networkStatus.summary = predictionText.textContent;
        data.networkStatus.riskLevel = predictionText.classList.contains('danger') ? 'High' : 
                                      (predictionText.classList.contains('warning') ? 'Medium' : 'Low');
    }
    
    // Get threat types if available
    const threatBadges = document.querySelectorAll('.threat-badge');
    if (threatBadges.length > 0) {
        data.threatAnalysis.detectedThreats = Array.from(threatBadges).slice(0, 5).map(badge => badge.textContent);
    }
    
    // Get model metrics from global data or DOM
    if (window.modelResultsData && window.modelResultsData[model]) {
        data.modelMetrics = window.modelResultsData[model];
    } else {
        // Try to extract from DOM
        const metricsTable = document.querySelector('.data-table');
        if (metricsTable) {
            const rows = metricsTable.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                    const metricName = cells[0].textContent.trim();
                    const metricValue = cells[1].textContent.trim();
                    data.modelMetrics[metricName] = metricValue;
                }
            });
        }
    }
    
    // Add model-specific recommendations based on model type
    const isUnsupervised = ['IsolationForest', 'LOF', 'OneClassSVM', 'KMeans', 'DBSCAN'].includes(model);
    
    if (isUnsupervised) {
        data.recommendations = [
            "Set up continuous monitoring for the detected anomaly patterns",
            "Create alerts for traffic matching the anomaly signatures",
            "Review network segmentation to isolate potential threat vectors",
            "Update firewall rules to restrict communications with suspicious endpoints"
        ];
    } else {
        data.recommendations = [
            "Regularly update the model with new labeled data to improve accuracy",
            "Combine multiple model outputs for more robust detection",
            "Consider deploying the model in a staged approach with human verification",
            "Track false positive rates over time to fine-tune detection thresholds"
        ];
    }
    
    // Add data statistics
    if (window.fullData && window.fullData.length > 0) {
        data.dataStats.recordCount = window.fullData.length;
        
        // Count normal vs anomaly records
        const normalCount = window.fullData.filter(row => 
            row.class === 0 || row.class === 'normal' || row.is_anomaly === 0
        ).length;
        
        data.dataStats.normalCount = normalCount;
        data.dataStats.anomalyCount = window.fullData.length - normalCount;
        data.dataStats.anomalyPercentage = ((window.fullData.length - normalCount) / window.fullData.length * 100).toFixed(2);
    }
    
    // Add model characteristics
    data.modelCharacteristics = getModelCharacteristics(model);
    
    return data;
}

/**
 * Get model characteristics for the report
 */
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
        }
    };
    
    // Return model characteristics or default values if model not found
    return characteristics[model] || {
        description: "Advanced machine learning model for network traffic analysis",
        strengths: ["Anomaly detection", "Pattern recognition", "Automated analysis"],
        limitations: ["Requires quality data", "May need periodic retraining"],
        bestUseCase: "Network security monitoring and threat detection"
    };
}

/**
 * Show alert for PDF export process
 */
function showPdfAlert(message, type = 'info') {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `pdf-alert alert-${type}`;
    alertDiv.style.position = 'fixed';
    alertDiv.style.bottom = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.padding = '15px 20px';
    alertDiv.style.borderRadius = '4px';
    alertDiv.style.backgroundColor = type === 'error' ? '#f8d7da' : 
                                    (type === 'success' ? '#d4edda' : '#d1ecf1');
    alertDiv.style.color = type === 'error' ? '#721c24' : 
                          (type === 'success' ? '#155724' : '#0c5460');
    alertDiv.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.maxWidth = '400px';
    alertDiv.style.transition = 'opacity 0.5s ease';
    
    // Add icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    alertDiv.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
    
    // Add to page
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(alertDiv)) {
                document.body.removeChild(alertDiv);
            }
        }, 500);
    }, 5000);
}

// Export function to global scope
window.exportToPdf = exportToPdf;

// Add event listener to PDF export button when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    if (exportPdfBtn) {
        // Remove existing event listeners
        const oldElement = exportPdfBtn.cloneNode(true);
        if (exportPdfBtn.parentNode) {
            exportPdfBtn.parentNode.replaceChild(oldElement, exportPdfBtn);
        }
        
        // Add new event listener
        oldElement.addEventListener('click', exportToPdf);
        console.log("Enhanced PDF export functionality initialized");
    }
});
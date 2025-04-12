// Improved Manual Entry Page Styling
// This script fixes the alignment and styling of the model selection section

/**
 * Apply improved styling to the manual entry page
 */
function enhanceManualEntryPage() {
    console.log('Enhancing manual entry page styling...');
    
    // Check if we're on the manual entry page
    const modelSelector = document.querySelector('.model-selector');
    if (!modelSelector) {
        return;
    }
    
    // Add CSS to improve model selector styling
    const style = document.createElement('style');
    style.textContent = `
        /* Enhanced model selector section */
        .model-selector {
            background: linear-gradient(to right, rgba(74, 111, 165, 0.05), rgba(111, 66, 193, 0.05));
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            margin-top: 2.5rem;
            border: 1px solid rgba(74, 111, 165, 0.2);
            position: relative;
        }
        
        .model-selector::before {
            content: "";
            position: absolute;
            top: -10px;
            left: 20px;
            width: 180px;
            height: 20px;
            background-color: #fff;
            border-radius: 10px;
            border: 1px solid rgba(74, 111, 165, 0.2);
            border-bottom: none;
        }
        
        .model-selector h3 {
            position: absolute;
            top: -18px;
            left: 40px;
            margin: 0;
            padding: 0 20px;
            font-size: 1.2rem;
            background-color: #fff;
            z-index: 1;
        }
        
        .model-selector p {
            margin-top: 1rem;
            margin-bottom: 1.5rem;
            color: #666;
            max-width: 700px;
        }
        
        .model-selection-flex {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
        }
        
        .model-select-label {
            font-weight: 600;
            color: #4a6fa5;
            min-width: 120px;
        }
        
        #model {
            flex-grow: 1;
            max-width: 400px;
            padding: 0.8rem 1rem;
            border-radius: 8px;
            border: 1px solid rgba(74, 111, 165, 0.3);
            background-color: white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
            font-size: 1rem;
        }
        
        #model:focus {
            border-color: #4a6fa5;
            box-shadow: 0 0 0 3px rgba(74, 111, 165, 0.2);
            outline: none;
        }
        
        /* Enhanced model comparison table */
        .model-comparison-table {
            margin-top: 1.5rem;
            overflow-x: auto;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            border-radius: 8px;
        }
        
        .model-comparison-table table {
            width: 100%;
            border-collapse: collapse;
            background-color: white;
        }
        
        .model-comparison-table th {
            background-color: #4a6fa5;
            color: white;
            padding: 12px 15px;
            text-align: left;
            font-size: 0.9rem;
            white-space: nowrap;
        }
        
        .model-comparison-table td {
            padding: 10px 15px;
            border-bottom: 1px solid #eee;
            font-size: 0.9rem;
        }
        
        .model-comparison-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        .model-comparison-table tr:hover {
            background-color: rgba(74, 111, 165, 0.05);
        }
        
        /* Form submit button improvements */
        .form-actions {
            margin-top: 3rem;
            text-align: center;
        }
        
        .form-submit-btn {
            background: linear-gradient(45deg, #4a6fa5, #6f42c1);
            color: white;
            border: none;
            padding: 1rem 2.5rem;
            font-size: 1.1rem;
            border-radius: 50px;
            box-shadow: 0 4px 12px rgba(74, 111, 165, 0.3);
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .form-submit-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 18px rgba(74, 111, 165, 0.4);
        }
        
        .form-submit-btn:active {
            transform: translateY(0);
            box-shadow: 0 4px 12px rgba(74, 111, 165, 0.2);
        }
        
        .form-submit-btn::after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            transform: scale(0);
            transition: transform 0.5s ease-out;
        }
        
        .form-submit-btn:active::after {
            transform: scale(2);
            opacity: 0;
        }
        
        /* Enhanced model explanation */
        .model-explanation {
            margin-top: 2rem;
            padding: 0;
            border-top: 1px solid #eee;
        }
        
        .model-explanation h4 {
            color: #4a6fa5;
            margin: 1.5rem 0 1rem;
        }
        
        .model-comparison-table th:first-child,
        .model-comparison-table td:first-child {
            font-weight: 600;
            color: #4a6fa5;
        }
        
        /* Responsive breakpoints */
        @media (max-width: 768px) {
            .model-selection-flex {
                flex-direction: column;
                align-items: flex-start;
            }
            
            #model {
                width: 100%;
                max-width: 100%;
            }
            
            .model-selector {
                padding: 1.5rem;
            }
        }
    `;
    
    document.head.appendChild(style);
    
    // Enhance model selector layout with flexbox
    if (modelSelector) {
        // Find the select element
        const selectElement = modelSelector.querySelector('#model');
        const label = modelSelector.querySelector('label[for="model"]');
        
        if (selectElement && label) {
            // Create a flex container
            const flexContainer = document.createElement('div');
            flexContainer.className = 'model-selection-flex';
            
            // Move the label and select into the flex container
            label.className = 'model-select-label';
            
            // Reorganize the elements
            label.parentNode.insertBefore(flexContainer, label);
            flexContainer.appendChild(label);
            flexContainer.appendChild(selectElement);
        }
    }
    
    // Enhance model explanation if exists
    const modelExplanation = document.querySelector('.model-explanation');
    if (modelExplanation) {
        // Update table headers for better styling
        const tableHeaders = modelExplanation.querySelectorAll('th');
        tableHeaders.forEach(header => {
            header.setAttribute('scope', 'col');
        });
        
        // Add useful metrics information if not already present
        if (!modelExplanation.querySelector('.metrics-info')) {
            const metricsInfo = document.createElement('div');
            metricsInfo.className = 'metrics-info';
            metricsInfo.innerHTML = `
                <h4>Understanding Unsupervised Model Metrics</h4>
                <ul>
                    <li><strong>Silhouette Score</strong> - Measures how well clusters are separated. Higher values (closer to 1) indicate better defined clusters.</li>
                    <li><strong>Reconstruction Error</strong> - How accurately the model can reconstruct normal data. Lower values indicate better model performance.</li>
                    <li><strong>False Positive Rate</strong> - The percentage of normal data incorrectly flagged as anomalies. Lower values are better.</li>
                    <li><strong>Detection Speed</strong> - How quickly the model can identify anomalies. Lower values (faster detection) are better.</li>
                </ul>
            `;
            
            modelExplanation.appendChild(metricsInfo);
        }
    }
    
    // Enhance the form submit button with icon if not already present
    const submitButton = document.querySelector('.form-submit-btn');
    if (submitButton && !submitButton.querySelector('i')) {
        // Keep original text
        const originalText = submitButton.textContent.trim();
        // Add magnifying glass icon
        submitButton.innerHTML = `<i class="fas fa-search"></i> ${originalText}`;
    }
    
    console.log('Manual entry page styling enhancements applied');
}

// Initialize when the page is ready
document.addEventListener('DOMContentLoaded', function() {
    // Run with a small delay to ensure DOM is fully loaded
    setTimeout(enhanceManualEntryPage, 300);
    
    // Listen for form submissions to show loading state
    const manualEntryForm = document.getElementById('manual-entry-form');
    if (manualEntryForm) {
        manualEntryForm.addEventListener('submit', function() {
            const submitButton = this.querySelector('.form-submit-btn');
            if (submitButton) {
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
                submitButton.disabled = true;
                
                // Create and show a loading overlay
                const loadingOverlay = document.createElement('div');
                loadingOverlay.className = 'loading-overlay';
                loadingOverlay.style.position = 'fixed';
                loadingOverlay.style.top = '0';
                loadingOverlay.style.left = '0';
                loadingOverlay.style.width = '100%';
                loadingOverlay.style.height = '100%';
                loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                loadingOverlay.style.display = 'flex';
                loadingOverlay.style.justifyContent = 'center';
                loadingOverlay.style.alignItems = 'center';
                loadingOverlay.style.zIndex = '9999';
                
                // Add spinner to overlay
                const spinner = document.createElement('div');
                spinner.className = 'loading-spinner';
                spinner.innerHTML = '<i class="fas fa-spinner fa-spin" style="color: white; font-size: 3rem;"></i>';
                loadingOverlay.appendChild(spinner);
                
                // Add overlay to the page
                document.body.appendChild(loadingOverlay);
            }
        });
    }
});
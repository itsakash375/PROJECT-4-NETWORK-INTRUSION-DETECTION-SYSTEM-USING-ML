// Enhanced visualization functions for results.js

// Fetch confusion matrix with retry mechanism
async function fetchConfusionMatrix(modelName) {
    const container = document.getElementById(`confusionMatrix-${modelName}`);
    if (!container) return;
    
    // Show loading state
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading confusion matrix...</div>';
    
    try {
        // First try the new API endpoint
        let response = await fetch(`/api/visualization/confusion-matrix/${modelName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        
        // If that fails, try the original endpoint
        if (!response.ok) {
            response = await fetch(`/api/confusion-matrix/${modelName}`, {
                method: 'GET',
                credentials: 'include'
            });
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Display the confusion matrix image
            container.innerHTML = `
                <div class="matrix-visualization">
                    <img src="${data.confusionMatrix.image}" alt="Confusion Matrix for ${modelName}" 
                         style="max-width:100%; height:auto; border-radius:5px; box-shadow:0 4px 8px rgba(0,0,0,0.1);" />
                </div>
            `;
        } else {
            // Try a direct method as a fallback
            container.innerHTML = `
                <div class="loading">
                    <form action="/confusion-matrix/${modelName}" method="post" style="display:inline;">
                        <button type="submit" class="btn primary-btn">
                            <i class="fas fa-sync"></i> Generate Matrix
                        </button>
                    </form>
                </div>
            `;
        }
    } catch (error) {
        console.error(`Error fetching confusion matrix for ${modelName}:`, error);
        // Fallback to form submission
        container.innerHTML = `
            <div class="error-message">
                <p>Error loading visualization</p>
                <form action="/confusion-matrix/${modelName}" method="post" style="display:inline;">
                    <button type="submit" class="btn primary-btn">
                        <i class="fas fa-sync"></i> Try Again
                    </button>
                </form>
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
        // First try the new API endpoint
        let response = await fetch(`/api/visualization/learning-curve/${modelName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        
        // If that fails, try the original endpoint
        if (!response.ok) {
            response = await fetch(`/api/learning-curve/${modelName}`, {
                method: 'GET',
                credentials: 'include'
            });
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Display the learning curve image
            container.innerHTML = `
                <div class="curve-visualization">
                    <img src="${data.learningCurve.image}" alt="Learning Curve for ${modelName}" 
                         style="max-width:100%; height:auto; border-radius:5px; box-shadow:0 4px 8px rgba(0,0,0,0.1);" />
                </div>
            `;
        } else {
            // Try a direct method as a fallback
            container.innerHTML = `
                <div class="loading">
                    <form action="/learning-curve/${modelName}" method="post" style="display:inline;">
                        <button type="submit" class="btn primary-btn">
                            <i class="fas fa-sync"></i> Generate Curve
                        </button>
                    </form>
                </div>
            `;
        }
    } catch (error) {
        console.error(`Error fetching learning curve for ${modelName}:`, error);
        // Fallback to form submission
        container.innerHTML = `
            <div class="error-message">
                <p>Error loading visualization</p>
                <form action="/learning-curve/${modelName}" method="post" style="display:inline;">
                    <button type="submit" class="btn primary-btn">
                        <i class="fas fa-sync"></i> Try Again
                    </button>
                </form>
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
        // First try the new API endpoint
        let response = await fetch(`/api/visualization/cluster-distribution/${modelName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        
        // If that fails, try the original endpoint
        if (!response.ok) {
            response = await fetch(`/api/cluster-distribution/${modelName}`, {
                method: 'GET',
                credentials: 'include'
            });
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Display the cluster distribution image
            container.innerHTML = `
                <div class="distribution-visualization">
                    <img src="${data.clusterDistribution.image}" alt="Cluster Distribution for ${modelName}" 
                         style="max-width:100%; height:auto; border-radius:5px; box-shadow:0 4px 8px rgba(0,0,0,0.1);" />
                </div>
            `;
        } else {
            // Try a direct method as a fallback
            container.innerHTML = `
                <div class="loading">
                    <form action="/cluster-distribution/${modelName}" method="post" style="display:inline;">
                        <button type="submit" class="btn primary-btn">
                            <i class="fas fa-sync"></i> Generate Distribution
                        </button>
                    </form>
                </div>
            `;
        }
    } catch (error) {
        console.error(`Error fetching cluster distribution for ${modelName}:`, error);
        // Fallback to form submission
        container.innerHTML = `
            <div class="error-message">
                <p>Error loading visualization</p>
                <form action="/cluster-distribution/${modelName}" method="post" style="display:inline;">
                    <button type="submit" class="btn primary-btn">
                        <i class="fas fa-sync"></i> Try Again
                    </button>
                </form>
            </div>
        `;
    }
}
// dashboard.js - Dashboard functionality
// This module handles the main dashboard view

// Load dashboard page
function loadDashboardPage(container) {
    // Check if user is logged in
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    // Check if any dataset is loaded
    checkDatasetInfo()
        .then(datasetInfo => {
            // Check if any models are trained
            return checkTrainingResults()
                .then(trainingResults => {
                    renderDashboard(container, currentUser, datasetInfo, trainingResults);
                });
        })
        .catch(error => {
            console.error("Error loading dashboard data:", error);
            renderDashboard(container, currentUser, null, null);
        });
}

// Render dashboard with available data
function renderDashboard(container, user, datasetInfo, trainingResults) {
    // Count trained models
    const supervisedModelsCount = trainingResults ? Object.keys(trainingResults.supervisedModels || {}).length : 0;
    const unsupervisedModelsCount = trainingResults ? Object.keys(trainingResults.unsupervisedModels || {}).length : 0;
    const totalModelsCount = supervisedModelsCount + unsupervisedModelsCount;
    
    // Dataset count
    const datasetsLoaded = datasetInfo ? 1 : 0;
    
    container.innerHTML = `
        <div class="dashboard-header slide-in">
            <h2 class="page-title"><i class="fas fa-tachometer-alt"></i> Dashboard</h2>
            <div class="user-info">
                <span id="currentUserName">${user.username || 'User'}</span>
                <i class="fas fa-user-circle"></i>
            </div>
        </div>
        
        <div class="alert alert-info slide-in">
            <i class="fas fa-info-circle"></i>
            <div>
                <strong>Welcome to the Network Intrusion Detection System!</strong>
                <p>This system helps you detect and analyze potential network intrusions using machine learning models.</p>
            </div>
        </div>
        
        <div class="row slide-in">
            <div class="col">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><i class="fas fa-chart-line"></i> System Overview</h3>
                    </div>
                    <div class="card-body">
                        <div class="stats-container">
                            <div class="stat-box">
                                <div class="stat-icon">
                                    <i class="fas fa-database"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-value">${datasetsLoaded}</div>
                                    <div class="stat-label">Datasets Loaded</div>
                                </div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-icon">
                                    <i class="fas fa-brain"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-value">${totalModelsCount}</div>
                                    <div class="stat-label">Models Trained</div>
                                </div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-icon">
                                    <i class="fas fa-exclamation-triangle"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-value" id="anomalyCount">0</div>
                                    <div class="stat-label">Anomalies Detected</div>
                                </div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-icon">
                                    <i class="fas fa-network-wired"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-value" id="captureCount">0</div>
                                    <div class="stat-label">Live Captures</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="row slide-in">
            <div class="col">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><i class="fas fa-tasks"></i> Quick Start Guide</h3>
                    </div>
                    <div class="card-body">
                        <div class="steps-container">
                            <div class="step">
                                <div class="step-number">1</div>
                                <div class="step-content">
                                    <h4>Upload Dataset</h4>
                                    <p>Upload your network traffic dataset in CSV format. The system supports both labeled and unlabeled data.</p>
                                    <a href="#" class="btn secondary-btn" onclick="loadPage('data-upload')">
                                        <i class="fas fa-upload"></i> Upload Data
                                    </a>
                                </div>
                            </div>
                            <div class="step">
                                <div class="step-number">2</div>
                                <div class="step-content">
                                    <h4>Preprocess Data</h4>
                                    <p>Clean and preprocess your data to ensure optimal model performance. Convert between labeled and unlabeled formats if needed.</p>
                                    <a href="#" class="btn secondary-btn" onclick="loadPage('preprocessing')">
                                        <i class="fas fa-broom"></i> Preprocess
                                    </a>
                                </div>
                            </div>
                            <div class="step">
                                <div class="step-number">3</div>
                                <div class="step-content">
                                    <h4>Train Models</h4>
                                    <p>Train your selected supervised and unsupervised models on the preprocessed data.</p>
                                    <a href="#" class="btn secondary-btn" onclick="loadPage('model-training')">
                                        <i class="fas fa-brain"></i> Train Models
                                    </a>
                                </div>
                            </div>
                            <div class="step">
                                <div class="step-number">4</div>
                                <div class="step-content">
                                    <h4>Analyze Results</h4>
                                    <p>View and compare model performance metrics, visualize results, and generate reports.</p>
                                    <a href="#" class="btn secondary-btn" onclick="loadPage('results')">
                                        <i class="fas fa-chart-bar"></i> View Results
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="row slide-in">
            <div class="col">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><i class="fas fa-cogs"></i> System Capabilities</h3>
                    </div>
                    <div class="card-body">
                        <div class="capabilities-container">
                            <div class="capability-box">
                                <div class="capability-icon">
                                    <i class="fas fa-brain"></i>
                                </div>
                                <div class="capability-content">
                                    <h4>Machine Learning Models</h4>
                                    <p>5 Supervised Models: Random Forest, SVM, Decision Tree, KNN, Logistic Regression</p>
                                    <p>5 Unsupervised Models: K-Means, Isolation Forest, One-Class SVM, LOF, DBSCAN</p>
                                </div>
                            </div>
                            <div class="capability-box">
                                <div class="capability-icon">
                                    <i class="fas fa-chart-pie"></i>
                                </div>
                                <div class="capability-content">
                                    <h4>Metrics & Visualization</h4>
                                    <p>Supervised Metrics: Accuracy, Precision, Recall, F1-Score, AUC-ROC</p>
                                    <p>Unsupervised Metrics: Silhouette Score, Davies-Bouldin Index, Calinski-Harabasz Index, Homogeneity, Completeness</p>
                                </div>
                            </div>
                            <div class="capability-box">
                                <div class="capability-icon">
                                    <i class="fas fa-network-wired"></i>
                                </div>
                                <div class="capability-content">
                                    <h4>Real-time Analysis</h4>
                                    <p>Live network packet capture and analysis</p>
                                    <p>Manual entry of network traffic parameters</p>
                                    <p>Integration with trained models for instant detection</p>
                                </div>
                            </div>
                            <div class="capability-box">
                                <div class="capability-icon">
                                    <i class="fas fa-shield-alt"></i>
                                </div>
                                <div class="capability-content">
                                    <h4>Attack Type Detection</h4>
                                    <p>Identification of 100+ common attack signatures</p>
                                    <p>Classification of DoS, Probe, R2L, U2R, and other attack categories</p>
                                    <p>Detailed attack information and remediation suggestions</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Apply additional styles
    const style = document.createElement('style');
    style.textContent = `
        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .user-info {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
        }
        
        .user-info i {
            font-size: 24px;
            color: var(--primary-color);
        }
        
        .stats-container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
        }
        
        .stat-box {
            flex: 1;
            min-width: 200px;
            display: flex;
            align-items: center;
            padding: 15px;
            background: #f8f9fa;
            border-radius: var(--border-radius);
            transition: var(--transition);
        }
        
        .stat-box:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .stat-icon {
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--primary-gradient);
            border-radius: 50%;
            margin-right: 15px;
        }
        
        .stat-icon i {
            font-size: 20px;
            color: white;
        }
        
        .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: var(--primary-color);
        }
        
        .stat-label {
            font-size: 14px;
            color: #777;
        }
        
        .steps-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .step {
            display: flex;
            align-items: flex-start;
            padding: 15px;
            background: #f8f9fa;
            border-radius: var(--border-radius);
            transition: var(--transition);
        }
        
        .step:hover {
            background: white;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .step-number {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--primary-gradient);
            border-radius: 50%;
            margin-right: 15px;
            font-size: 18px;
            font-weight: 700;
            color: white;
        }
        
        .step-content h4 {
            margin-bottom: 5px;
            color: var(--secondary-color);
        }
        
        .step-content p {
            margin-bottom: 10px;
            color: #666;
        }
        
        .capabilities-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .capability-box {
            padding: 20px;
            background: #f8f9fa;
            border-radius: var(--border-radius);
            transition: var(--transition);
        }
        
        .capability-box:hover {
            background: white;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .capability-icon {
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--primary-gradient);
            border-radius: 50%;
            margin-bottom: 15px;
        }
        
        .capability-icon i {
            font-size: 24px;
            color: white;
        }
        
        .capability-content h4 {
            margin-bottom: 10px;
            color: var(--secondary-color);
        }
        
        .capability-content p {
            margin-bottom: 8px;
            color: #666;
        }
    `;
    document.head.appendChild(style);
    
    // Fetch dashboard stats
    fetchDashboardStats();
}

// Fetch dashboard statistics
async function fetchDashboardStats() {
    try {
        // Fetch anomaly count - can be implemented with your actual API
        const anomalyCountEl = document.getElementById('anomalyCount');
        if (anomalyCountEl) {
            // Placeholder - in a real app you would fetch this from an API
            anomalyCountEl.textContent = Math.floor(Math.random() * 50);
        }
        
        // Fetch capture count
        const captureCountEl = document.getElementById('captureCount');
        if (captureCountEl) {
            // Placeholder - in a real app you would fetch this from an API
            captureCountEl.textContent = Math.floor(Math.random() * 10);
        }
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
    }
}
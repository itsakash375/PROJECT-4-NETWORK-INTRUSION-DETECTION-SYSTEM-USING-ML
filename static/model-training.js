// Model Training frontend functionality
function loadModelTrainingPage(container) {
    // Check if dataset exists
    Promise.all([
        checkDatasetInfo(),
        checkPreprocessedDatasetInfo()
    ])
        .then(([datasetInfo, preprocessedDatasetInfo]) => {
            const currentDataset = preprocessedDatasetInfo || datasetInfo;

            if (!currentDataset) {
                // No dataset available
                container.innerHTML = `
                    <div class="page-header slide-in">
                        <h2 class="page-title"><i class="fas fa-brain"></i> Model Training</h2>
                    </div>
                    
                    <div class="alert alert-warning slide-in">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div>
                            <strong>No dataset available!</strong>
                            <p>Please upload a dataset first before training models.</p>
                        </div>
                    </div>
                    
                    <div class="text-center">
                        <button class="btn primary-btn" onclick="loadPage('data-upload')">
                            <i class="fas fa-upload"></i> Go to Data Upload
                        </button>
                    </div>
                `;
                return;
            }
            
            // Dataset exists, render model training UI
            renderModelTrainingPage(container, currentDataset, !!preprocessedDatasetInfo);
        })
        .catch(error => {
            console.error('Error checking dataset:', error);
            // Show error state
            container.innerHTML = `
                <div class="page-header slide-in">
                    <h2 class="page-title"><i class="fas fa-brain"></i> Model Training</h2>
                </div>
                
                <div class="alert alert-danger slide-in">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>
                        <strong>Error loading dataset information!</strong>
                        <p>Please try again or upload a new dataset.</p>
                    </div>
                </div>
                
                <div class="text-center">
                    <button class="btn primary-btn" onclick="loadPage('data-upload')">
                        <i class="fas fa-upload"></i> Go to Data Upload
                    </button>
                </div>
            `;
        });
}

// Render model training page
function renderModelTrainingPage(container, datasetInfo, isPreprocessed) {
    container.innerHTML = `
        <div class="page-header slide-in">
            <h2 class="page-title"><i class="fas fa-brain"></i> Model Training</h2>
            <div class="page-actions">
                <button class="btn primary-btn" id="trainModelsBtn">
                    <i class="fas fa-play"></i> Train Selected Models
                </button>
            </div>
        </div>
        
        <div class="alert alert-info slide-in">
            <i class="fas fa-info-circle"></i>
            <div>
                <strong>Using ${isPreprocessed ? 'preprocessed' : 'original'} dataset: ${datasetInfo.fileName}</strong>
                <p>${datasetInfo.totalRows} rows, ${datasetInfo.totalColumns} columns, ${datasetInfo.isLabeled ? 'Labeled' : 'Unlabeled'} data</p>
                ${!isPreprocessed ? '<p><strong>Note:</strong> You may want to preprocess your data before training models.</p>' : ''}
            </div>
        </div>
        
        <!-- Training options -->
        <div class="row slide-in">
            <div class="col">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><i class="fas fa-cogs"></i> Training Options</h3>
                    </div>
                    <div class="card-body">
                        <div class="training-options">
                            <div class="option-section">
                                <h4>General Settings</h4>
                                <div class="form-group">
                                    <label for="validationSplit">Validation Split</label>
                                    <div class="range-slider">
                                        <input type="range" id="validationSplit" min="10" max="30" value="20" step="5">
                                        <div class="range-labels">
                                            <span>Training: <span id="validationTrainPercentage">80</span>%</span>
                                            <span>Validation: <span id="validationPercentage">20</span>%</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="maxTrainingTime">Maximum Training Time (seconds per model)</label>
                                    <input type="number" id="maxTrainingTime" class="form-control" value="60" min="10" max="300">
                                </div>
                            </div>
                            
                            <!-- Performance metrics -->
                            <div class="option-section">
                                <h4>Performance Metrics</h4>
                                <div class="metrics-selection">
                                    <div class="metrics-column">
                                        <h5>Supervised Metrics</h5>
                                        <div class="metric-checkbox">
                                            <input type="checkbox" id="metricAccuracy" checked>
                                            <label for="metricAccuracy">Accuracy</label>
                                        </div>
                                        <div class="metric-checkbox">
                                            <input type="checkbox" id="metricPrecision" checked>
                                            <label for="metricPrecision">Precision</label>
                                        </div>
                                        <div class="metric-checkbox">
                                            <input type="checkbox" id="metricRecall" checked>
                                            <label for="metricRecall">Recall</label>
                                        </div>
                                        <div class="metric-checkbox">
                                            <input type="checkbox" id="metricF1" checked>
                                            <label for="metricF1">F1-Score</label>
                                        </div>
                                        <div class="metric-checkbox">
                                            <input type="checkbox" id="metricAUC" checked>
                                            <label for="metricAUC">AUC-ROC</label>
                                        </div>
                                    </div>
                                    
                                    <div class="metrics-column">
                                        <h5>Unsupervised Metrics</h5>
                                        <div class="metric-checkbox">
                                            <input type="checkbox" id="metricSilhouette" checked>
                                            <label for="metricSilhouette">Silhouette Score</label>
                                        </div>
                                        <div class="metric-checkbox">
                                            <input type="checkbox" id="metricDaviesBouldin" checked>
                                            <label for="metricDaviesBouldin">Davies-Bouldin Index</label>
                                        </div>
                                        <div class="metric-checkbox">
                                            <input type="checkbox" id="metricCalinskiHarabasz" checked>
                                            <label for="metricCalinskiHarabasz">Calinski-Harabasz Index</label>
                                        </div>
                                        <div class="metric-checkbox">
                                            <input type="checkbox" id="metricHomogeneity" checked>
                                            <label for="metricHomogeneity">Homogeneity</label>
                                        </div>
                                        <div class="metric-checkbox">
                                            <input type="checkbox" id="metricCompleteness" checked>
                                            <label for="metricCompleteness">Completeness</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Supervised models -->
        <div class="row slide-in">
            <div class="col-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><i class="fas fa-tag"></i> Supervised Models</h3>
                        <div class="card-actions">
                            <button class="btn secondary-btn btn-sm" id="selectAllSupervised">
                                <i class="fas fa-check-square"></i> Select All
                            </button>
                            <button class="btn secondary-btn btn-sm" id="deselectAllSupervised">
                                <i class="fas fa-square"></i> Deselect All
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="models-selection">
                            ${!datasetInfo.isLabeled ? `
                                <div class="alert alert-warning">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    <div>
                                        <strong>Dataset is unlabeled!</strong>
                                        <p>Supervised models require labeled data. Please use a labeled dataset or try unsupervised models.</p>
                                    </div>
                                </div>
                            ` : ''}
                            
                            <!-- RandomForest -->
                            <div class="model-item ${!datasetInfo.isLabeled ? 'disabled' : ''}">
                                <div class="model-header">
                                    <input type="checkbox" id="modelRandomForest" ${!datasetInfo.isLabeled ? 'disabled' : 'checked'}>
                                    <label for="modelRandomForest">Random Forest</label>
                                </div>
                                <div class="model-description">
                                    <p>An ensemble learning method that constructs multiple decision trees and outputs the class that is the mode of the classes of the individual trees.</p>
                                </div>
                                <div class="model-parameters">
                                    <div class="form-group">
                                        <label for="rfNumTrees">Number of Trees</label>
                                        <input type="number" id="rfNumTrees" class="form-control" value="100" min="10" max="500" ${!datasetInfo.isLabeled ? 'disabled' : ''}>
                                    </div>
                                    <div class="form-group">
                                        <label for="rfMaxDepth">Max Depth</label>
                                        <input type="number" id="rfMaxDepth" class="form-control" value="10" min="1" max="50" ${!datasetInfo.isLabeled ? 'disabled' : ''}>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- More supervised models... -->
                            
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Unsupervised models -->
            <div class="col-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><i class="fas fa-project-diagram"></i> Unsupervised Models</h3>
                        <div class="card-actions">
                            <button class="btn secondary-btn btn-sm" id="selectAllUnsupervised">
                                <i class="fas fa-check-square"></i> Select All
                            </button>
                            <button class="btn secondary-btn btn-sm" id="deselectAllUnsupervised">
                                <i class="fas fa-square"></i> Deselect All
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="models-selection">
                            <!-- K-Means -->
                            <div class="model-item">
                                <div class="model-header">
                                    <input type="checkbox" id="modelKMeans" checked>
                                    <label for="modelKMeans">K-Means Clustering</label>
                                </div>
                                <div class="model-description">
                                    <p>A method of vector quantization that aims to partition n observations into k clusters in which each observation belongs to the cluster with the nearest mean.</p>
                                </div>
                                <div class="model-parameters">
                                    <div class="form-group">
                                        <label for="kmClusters">Number of Clusters</label>
                                        <input type="number" id="kmClusters" class="form-control" value="5" min="2" max="20">
                                    </div>
                                    <div class="form-group">
                                        <label for="kmInit">Initialization Method</label>
                                        <select id="kmInit" class="form-control">
                                            <option value="k-means++">K-Means++</option>
                                            <option value="random">Random</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- More unsupervised models... -->
                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Training Progress & Results (initially hidden) -->
        <div class="row slide-in hidden" id="trainingProgress">
            <div class="col">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><i class="fas fa-spinner"></i> Training Progress</h3>
                    </div>
                    <div class="card-body">
                        <div class="progress-container">
                            <div class="overall-progress">
                                <h4>Overall Progress</h4>
                                <div class="progress">
                                    <div class="progress-bar" id="overallProgressBar" role="progressbar" style="width: 0%"></div>
                                </div>
                                <p id="overallProgressText">0/0 models completed</p>
                            </div>
                            
                            <div class="current-model-progress">
                                <h4>Current Model: <span id="currentModelName">None</span></h4>
                                <div class="progress">
                                    <div class="progress-bar" id="currentModelProgressBar" role="progressbar" style="width: 0%"></div>
                                </div>
                                <p id="currentModelProgressText">Waiting to start...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize training functionality
    initializeTraining();
}

// Initialize training functionality
function initializeTraining() {
    // Get DOM elements
    const validationSplit = document.getElementById('validationSplit');
    const validationTrainPercentage = document.getElementById('validationTrainPercentage');
    const validationPercentage = document.getElementById('validationPercentage');
    const trainModelsBtn = document.getElementById('trainModelsBtn');
    const selectAllSupervised = document.getElementById('selectAllSupervised');
    const deselectAllSupervised = document.getElementById('deselectAllSupervised');
    const selectAllUnsupervised = document.getElementById('selectAllUnsupervised');
    const deselectAllUnsupervised = document.getElementById('deselectAllUnsupervised');
    
    // Update validation split labels
    if (validationSplit) {
        validationSplit.addEventListener('input', () => {
            const validationValue = validationSplit.value;
            const trainValue = 100 - validationValue;
            validationTrainPercentage.textContent = trainValue;
            validationPercentage.textContent = validationValue;
        });
    }
    
    // Select/deselect all supervised models
    if (selectAllSupervised) {
        selectAllSupervised.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('.model-item:not(.disabled) input[type="checkbox"][id^="model"]:not([id^="modelK"]):not([id^="modelI"]):not([id^="modelO"]):not([id^="modelL"]):not([id^="modelD"])');
            checkboxes.forEach(checkbox => {
                checkbox.checked = true;
            });
        });
    }
    
    if (deselectAllSupervised) {
        deselectAllSupervised.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('.model-item:not(.disabled) input[type="checkbox"][id^="model"]:not([id^="modelK"]):not([id^="modelI"]):not([id^="modelO"]):not([id^="modelL"]):not([id^="modelD"])');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
        });
    }
    
    // Select/deselect all unsupervised models
    if (selectAllUnsupervised) {
        selectAllUnsupervised.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('input[type="checkbox"][id^="modelK"], input[type="checkbox"][id^="modelI"], input[type="checkbox"][id^="modelO"], input[type="checkbox"][id^="modelL"], input[type="checkbox"][id^="modelD"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = true;
            });
        });
    }
    
    if (deselectAllUnsupervised) {
        deselectAllUnsupervised.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('input[type="checkbox"][id^="modelK"], input[type="checkbox"][id^="modelI"], input[type="checkbox"][id^="modelO"], input[type="checkbox"][id^="modelL"], input[type="checkbox"][id^="modelD"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
        });
    }
    
    // Train models button
    if (trainModelsBtn) {
        trainModelsBtn.addEventListener('click', trainModels);
    }
}

// Train models function
// Train models function
async function trainModels() {
    // Get selected supervised models
    const supervisedModels = [];
    document.querySelectorAll('.model-item:not(.disabled) input[type="checkbox"][id^="model"]:not([id^="modelK"]):not([id^="modelI"]):not([id^="modelO"]):not([id^="modelL"]):not([id^="modelD"]):checked').forEach(checkbox => {
        supervisedModels.push(checkbox.id.replace('model', ''));
    });
    
    // Get selected unsupervised models
    const unsupervisedModels = [];
    document.querySelectorAll('input[type="checkbox"][id^="modelK"]:checked, input[type="checkbox"][id^="modelI"]:checked, input[type="checkbox"][id^="modelO"]:checked, input[type="checkbox"][id^="modelL"]:checked, input[type="checkbox"][id^="modelD"]:checked').forEach(checkbox => {
        unsupervisedModels.push(checkbox.id.replace('model', ''));
    });
    
    // Check if any models are selected
    if (supervisedModels.length === 0 && unsupervisedModels.length === 0) {
        showNotification('Please select at least one model to train', 'error');
        return;
    }
    
    // Get selected metrics
    const supervisedMetrics = [];
    document.querySelectorAll('input[type="checkbox"][id^="metric"]:not([id^="metricS"]):not([id^="metricD"]):not([id^="metricC"]):not([id^="metricH"]):checked').forEach(checkbox => {
        supervisedMetrics.push(checkbox.id.replace('metric', ''));
    });
    
    const unsupervisedMetrics = [];
    document.querySelectorAll('input[type="checkbox"][id^="metricS"]:checked, input[type="checkbox"][id^="metricD"]:checked, input[type="checkbox"][id^="metricC"]:checked, input[type="checkbox"][id^="metricH"]:checked').forEach(checkbox => {
        unsupervisedMetrics.push(checkbox.id.replace('metric', ''));
    });
    
    // Get training options
    const options = {
        validationSplit: parseInt(document.getElementById('validationSplit').value) / 100,
        maxTrainingTime: parseInt(document.getElementById('maxTrainingTime').value)
    };
    
    // Get model parameters
    const modelParameters = {};
    
    // RandomForest parameters
    if (supervisedModels.includes('RandomForest')) {
        modelParameters.RandomForest = {
            n_estimators: parseInt(document.getElementById('rfNumTrees').value),
            max_depth: parseInt(document.getElementById('rfMaxDepth').value)
        };
    }
    
    // Add more model parameters as needed...
    
    // K-Means parameters
    if (unsupervisedModels.includes('KMeans')) {
        modelParameters.KMeans = {
            n_clusters: parseInt(document.getElementById('kmClusters').value),
            init: document.getElementById('kmInit').value
        };
    }
    
    // Add more model parameters as needed...
    
    // Show training progress section
    const trainingProgress = document.getElementById('trainingProgress');
    trainingProgress.classList.remove('hidden');
    
    // Scroll to training progress
    trainingProgress.scrollIntoView({ behavior: 'smooth' });
    
    // Get progress elements
    const overallProgressBar = document.getElementById('overallProgressBar');
    const overallProgressText = document.getElementById('overallProgressText');
    const currentModelName = document.getElementById('currentModelName');
    const currentModelProgressBar = document.getElementById('currentModelProgressBar');
    const currentModelProgressText = document.getElementById('currentModelProgressText');
    
    // Disable train button during training
    const trainModelsBtn = document.getElementById('trainModelsBtn');
    trainModelsBtn.disabled = true;
    trainModelsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Training in Progress...';
    
    // Calculate total models
    const totalModels = supervisedModels.length + unsupervisedModels.length;
    let completedModels = 0;
    
    // Initialize progress
    overallProgressBar.style.width = '0%';
    overallProgressText.textContent = `0/${totalModels} models completed`;
    
    try {
        // Prepare data for API request
        const requestData = {
            supervisedModels,
            unsupervisedModels,
            supervisedMetrics,
            unsupervisedMetrics,
            modelParameters,
            options
        };
        
        // Show loading notification
        showNotification('Training models. This may take some time...', 'warning');

        // Start progress polling
        let modelProgress = {
            currentModel: '',
            models: []
        };
        let intervalId;
        
        // Function to update UI with model status
        const updateModelProgress = async () => {
            // For simplicity, just iterate through models one by one
            let currentIndex = completedModels;
            let allModels = [...supervisedModels, ...unsupervisedModels];
            
            if (currentIndex < allModels.length) {
                let model = allModels[currentIndex];
                currentModelName.textContent = model;
                
                // Simulate progress (in a real implementation, we'd fetch from server)
                let progress = 0;
                const progressInterval = setInterval(() => {
                    progress += 10;
                    currentModelProgressBar.style.width = `${progress}%`;
                    currentModelProgressText.textContent = `Training ${progress}% complete...`;
                    
                    if (progress >= 100) {
                        clearInterval(progressInterval);
                        completedModels++;
                        const overallProgress = Math.round((completedModels / totalModels) * 100);
                        overallProgressBar.style.width = `${overallProgress}%`;
                        overallProgressText.textContent = `${completedModels}/${totalModels} models completed`;
                        
                        // If there are more models, continue
                        if (completedModels < totalModels) {
                            updateModelProgress();
                        } else {
                            // All models completed
                            currentModelName.textContent = 'All Models';
                            currentModelProgressText.textContent = 'Training completed successfully!';
                        }
                    }
                }, 200);
            }
        };
        
        // Start progress updates
        updateModelProgress();
        
        // Send request to server
        const response = await fetch(`${API_URL}/train`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update progress UI to show completion
            overallProgressBar.style.width = '100%';
            overallProgressText.textContent = `${totalModels}/${totalModels} models completed`;
            currentModelName.textContent = 'All Models';
            currentModelProgressBar.style.width = '100%';
            currentModelProgressText.textContent = 'Training completed successfully!';
            
            // Store training results in session storage with proper JSON stringification
            sessionStorage.setItem('trainingResults', JSON.stringify(data.trainingResults));
            
            // Also save a flag indicating models are trained
            sessionStorage.setItem('modelsTrainedStatus', JSON.stringify({
                supervisedTrained: supervisedModels.length > 0,
                unsupervisedTrained: unsupervisedModels.length > 0,
                timestamp: new Date().toISOString()
            }));
            
            // Show success notification
            showNotification('All models trained successfully!', 'success');
            
            // Enable the "View Results" button
            const viewResultsBtn = document.getElementById('viewResultsBtn');
            if (viewResultsBtn) {
                viewResultsBtn.style.display = 'inline-flex';
                viewResultsBtn.classList.add('show');
                viewResultsBtn.classList.add('pulse-animation');
                
                // Add event listener to navigate to results
                viewResultsBtn.addEventListener('click', function() {
                    // Force a full page load to ensure state refresh
                    window.location.href = '/results';
                });
            }
        } else {
            // Show error notification
            showNotification(data.message || 'Error training models', 'error');
            
            // Reset train button
            trainModelsBtn.disabled = false;
            trainModelsBtn.innerHTML = '<i class="fas fa-play"></i> Train Selected Models';
        }
    } catch (error) {
        console.error('Error training models:', error);
        showNotification('Server error. Please try again later.', 'error');
        
        // Reset train button
        trainModelsBtn.disabled = false;
        trainModelsBtn.innerHTML = '<i class="fas fa-play"></i> Train Selected Models';
    }
}
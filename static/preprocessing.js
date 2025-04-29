// Preprocessing frontend functionality
function loadPreprocessingPage(container) {
    // Check if dataset exists
    checkDatasetInfo()
        .then(datasetInfo => {
            if (!datasetInfo) {
                // No dataset available
                container.innerHTML = `
                    <div class="page-header slide-in">
                        <h2 class="page-title"><i class="fas fa-broom"></i> Data Preprocessing</h2>
                    </div>
                    
                    <div class="alert alert-warning slide-in">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div>
                            <strong>No dataset available!</strong>
                            <p>Please upload a dataset first before preprocessing.</p>
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
            
            // Dataset exists, render preprocessing UI
            renderPreprocessingPage(container, datasetInfo);
        })
        .catch(error => {
            console.error('Error checking dataset:', error);
            // Show error state
            container.innerHTML = `
                <div class="page-header slide-in">
                    <h2 class="page-title"><i class="fas fa-broom"></i> Data Preprocessing</h2>
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

// Render preprocessing page
function renderPreprocessingPage(container, datasetInfo) {
    container.innerHTML = `
        <div class="page-header slide-in">
            <h2 class="page-title"><i class="fas fa-broom"></i> Data Preprocessing</h2>
            <div class="page-actions">
                <button class="btn primary-btn" id="applyPreprocessingBtn">
                    <i class="fas fa-check"></i> Apply Preprocessing
                </button>
            </div>
        </div>
        
        <div class="alert alert-info slide-in">
            <i class="fas fa-info-circle"></i>
            <div>
                <strong>Current Dataset: ${datasetInfo.fileName}</strong>
                <p>${datasetInfo.totalRows} rows, ${datasetInfo.totalColumns} columns, ${datasetInfo.isLabeled ? 'Labeled' : 'Unlabeled'} data</p>
            </div>
        </div>
        
        <!-- Preprocessing tasks -->
        <div class="row slide-in">
            <div class="col">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><i class="fas fa-tasks"></i> Preprocessing Tasks</h3>
                    </div>
                    <div class="card-body">
                        <div class="preprocessing-options">
                            <!-- Missing values handling -->
                            <div class="preprocessing-option">
                                <input type="checkbox" id="handleMissingValues" checked>
                                <label for="handleMissingValues">Handle Missing Values</label>
                                <div class="option-details">
                                    <select id="missingValueStrategy" class="form-control">
                                        <option value="mean">Replace with Mean (for numeric)</option>
                                        <option value="median">Replace with Median (for numeric)</option>
                                        <option value="mode">Replace with Mode (for categorical)</option>
                                        <option value="drop">Drop rows with missing values</option>
                                    </select>
                                </div>
                            </div>
                            
                            <!-- Categorical encoding -->
                            <div class="preprocessing-option">
                                <input type="checkbox" id="encodeCategorial" checked>
                                <label for="encodeCategorial">Encode Categorical Features</label>
                                <div class="option-details">
                                    <select id="encodingStrategy" class="form-control">
                                        <option value="onehot">One-Hot Encoding</option>
                                        <option value="label">Label Encoding</option>
                                    </select>
                                </div>
                            </div>
                            
                            <!-- Normalization/scaling -->
                            <div class="preprocessing-option">
                                <input type="checkbox" id="normalizeFeatures" checked>
                                <label for="normalizeFeatures">Normalize/Scale Features</label>
                                <div class="option-details">
                                    <select id="scalingStrategy" class="form-control">
                                        <option value="minmax">Min-Max Scaling (0-1)</option>
                                        <option value="standardize">Standardization (z-score)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <!-- Outlier removal -->
                            <div class="preprocessing-option">
                                <input type="checkbox" id="removeOutliers">
                                <label for="removeOutliers">Remove Outliers</label>
                                <div class="option-details">
                                    <select id="outlierStrategy" class="form-control">
                                        <option value="iqr">IQR Method</option>
                                        <option value="zscore">Z-Score Method</option>
                                    </select>
                                </div>
                            </div>
                            
                            <!-- Feature selection -->
                            <div class="preprocessing-option">
                                <input type="checkbox" id="featureSelection">
                                <label for="featureSelection">Feature Selection</label>
                                <div class="option-details">
                                    <select id="featureSelectionStrategy" class="form-control">
                                        <option value="correlation">Correlation-based</option>
                                        <option value="variance">Variance Threshold</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Label handling -->
        <div class="row slide-in">
            <div class="col">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><i class="fas fa-tag"></i> Label Handling</h3>
                    </div>
                    <div class="card-body">
                        <div class="label-options">
                            <div class="label-info">
                                <h4>Dataset Type: <span id="datasetType">${datasetInfo.isLabeled ? 'Labeled' : 'Unlabeled'}</span></h4>
                            </div>
                            
                            ${datasetInfo.isLabeled ? `
                                <div class="option-section">
                                    <h4>Label Column</h4>
                                    <div class="option-row">
                                        <select id="labelColumn" class="form-control">
                                            ${datasetInfo.headers.map(header => `
                                                <option value="${header}" ${header === datasetInfo.labelColumn ? 'selected' : ''}>${header}</option>
                                            `).join('')}
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="option-section">
                                    <h4>Conversion Options</h4>
                                    <div class="option-row">
                                        <input type="checkbox" id="removeLabels">
                                        <label for="removeLabels">Remove labels (convert to unlabeled dataset)</label>
                                    </div>
                                </div>
                            ` : `
                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle"></i>
                                    This dataset appears to be unlabeled. You can use it for unsupervised learning.
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Preprocessing preview -->
        <div class="row slide-in hidden" id="preprocessingPreview">
            <div class="col">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><i class="fas fa-eye"></i> Preprocessing Preview</h3>
                    </div>
                    <div class="card-body">
                        <div class="preview-tabs">
                            <button class="preview-tab active" data-tab="original">Original Data</button>
                            <button class="preview-tab" data-tab="preprocessed">Preprocessed Data</button>
                        </div>
                        <div class="preview-content">
                            <div class="preview-tab-content active" id="original-tab">
                                <div class="table-container">
                                    <table class="data-table" id="originalDataTable">
                                        <thead>
                                            <tr id="originalTableHeader">
                                                <th>Loading...</th>
                                            </tr>
                                        </thead>
                                        <tbody id="originalTableBody">
                                            <tr>
                                                <td>Loading...</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="preview-tab-content" id="preprocessed-tab">
                                <div class="table-container">
                                    <table class="data-table" id="preprocessedDataTable">
                                        <thead>
                                            <tr id="preprocessedTableHeader">
                                                <th>Apply preprocessing to see results</th>
                                            </tr>
                                        </thead>
                                        <tbody id="preprocessedTableBody">
                                            <tr>
                                                <td>Apply preprocessing to see results</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize preprocessing functionality
    initializePreprocessing();
    
    // Load original data preview
    loadOriginalDataPreview(datasetInfo);
}

// Initialize preprocessing functionality
function initializePreprocessing() {
    // Get DOM elements
    const applyPreprocessingBtn = document.getElementById('applyPreprocessingBtn');
    const previewTabs = document.querySelectorAll('.preview-tab');
    
    // Tab switching for preview
    previewTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            previewTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all tab contents
            const tabContents = document.querySelectorAll('.preview-tab-content');
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Show selected tab content
            const tabId = tab.dataset.tab + '-tab';
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Toggle options based on checkbox state
    const checkboxes = ['handleMissingValues', 'encodeCategorial', 'normalizeFeatures', 
                        'removeOutliers', 'featureSelection'];
    
    checkboxes.forEach(checkboxId => {
        const checkbox = document.getElementById(checkboxId);
        if (checkbox) {
            const optionDetails = checkbox.parentElement.querySelector('.option-details');
            
            // Set initial state
            optionDetails.style.display = checkbox.checked ? 'block' : 'none';
            
            // Add change event
            checkbox.addEventListener('change', () => {
                optionDetails.style.display = checkbox.checked ? 'block' : 'none';
            });
        }
    });
    
    // Apply preprocessing button
    if (applyPreprocessingBtn) {
        applyPreprocessingBtn.addEventListener('click', applyPreprocessing);
    }
}

// Load original data preview
function loadOriginalDataPreview(datasetInfo) {
    const originalTableHeader = document.getElementById('originalTableHeader');
    const originalTableBody = document.getElementById('originalTableBody');
    
    // Show preprocessing preview section
    document.getElementById('preprocessingPreview').classList.remove('hidden');
    
    // Populate headers
    originalTableHeader.innerHTML = '';
    const headerRow = document.createElement('tr');
    datasetInfo.headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    originalTableHeader.appendChild(headerRow);
    
    // Populate data
    originalTableBody.innerHTML = '';
    datasetInfo.sampleData.forEach(row => {
        const tr = document.createElement('tr');
        datasetInfo.headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header] || '';
            tr.appendChild(td);
        });
        originalTableBody.appendChild(tr);
    });
}
// Apply preprocessing function
async function applyPreprocessing() {
    // Show loading indicator
    showNotification('Applying preprocessing...', 'warning');
    
    // Get preprocessing options
    const options = {
        handleMissingValues: document.getElementById('handleMissingValues').checked,
        missingValueStrategy: document.getElementById('missingValueStrategy').value,
        encodeCategorial: document.getElementById('encodeCategorial').checked,
        encodingStrategy: document.getElementById('encodingStrategy').value,
        normalizeFeatures: document.getElementById('normalizeFeatures').checked,
        scalingStrategy: document.getElementById('scalingStrategy').value,
        removeOutliers: document.getElementById('removeOutliers').checked,
        outlierStrategy: document.getElementById('outlierStrategy').value,
        featureSelection: document.getElementById('featureSelection').checked,
        featureSelectionStrategy: document.getElementById('featureSelectionStrategy').value
    };
    
    // For labeled data, get label column and conversion option
    const datasetTypeElement = document.getElementById('datasetType');
    if (datasetTypeElement && datasetTypeElement.textContent === 'Labeled') {
        options.labelColumn = document.getElementById('labelColumn').value;
        options.removeLabels = document.getElementById('removeLabels').checked;
    }
    
    try {
        // Send preprocessing request to server
        const response = await fetch(`${API_URL}/preprocess`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(options),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store preprocessed dataset info
            sessionStorage.setItem('preprocessedDatasetInfo', JSON.stringify(data.datasetInfo));
            
            // Update preprocessed data preview
            updatePreprocessedDataPreview(data.datasetInfo);
            
            // Show success notification
            showNotification('Preprocessing applied successfully!', 'success');
            
            // Switch to preprocessed tab
            document.querySelector('.preview-tab[data-tab="preprocessed"]').click();
        } else {
            showNotification(data.message || 'Error applying preprocessing', 'error');
        }
    } catch (error) {
        console.error('Error applying preprocessing:', error);
        showNotification('Server error. Please try again later.', 'error');
    }
}

// Update preprocessed data preview
function updatePreprocessedDataPreview(datasetInfo) {
    const preprocessedTableHeader = document.getElementById('preprocessedTableHeader');
    const preprocessedTableBody = document.getElementById('preprocessedTableBody');
    
    // Populate headers
    preprocessedTableHeader.innerHTML = '';
    const headerRow = document.createElement('tr');
    datasetInfo.headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    preprocessedTableHeader.appendChild(headerRow);
    
    // Populate data
    preprocessedTableBody.innerHTML = '';
    datasetInfo.sampleData.forEach(row => {
        const tr = document.createElement('tr');
        datasetInfo.headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header] !== undefined ? row[header] : '';
            tr.appendChild(td);
        });
        preprocessedTableBody.appendChild(tr);
    });
}
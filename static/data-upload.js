// Data Upload frontend functionality
function loadDataUploadPage(container) {
    // Check if dataset exists
    checkDatasetInfo()
        .then(datasetInfo => {
            // Generate UI based on dataset info
            renderDataUploadPage(container, datasetInfo);
        })
        .catch(error => {
            console.error('Error checking dataset:', error);
            // If no dataset exists, show empty state
            renderDataUploadPage(container, null);
        });
}

// Render the data upload page
function renderDataUploadPage(container, datasetInfo) {
    container.innerHTML = `
        <div class="page-header slide-in">
            <h2 class="page-title"><i class="fas fa-upload"></i> Data Upload</h2>
            <div class="page-actions">
                <button class="btn secondary-btn" id="clearDataBtn">
                    <i class="fas fa-trash"></i> Clear Data
                </button>
            </div>
        </div>
        
        <!-- Upload section -->
        <div class="row slide-in">
            <div class="col">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><i class="fas fa-file-upload"></i> Upload Dataset</h3>
                    </div>
                    <div class="card-body">
                        <div class="upload-container" id="uploadContainer">
                            <div class="upload-icon">
                                <i class="fas fa-cloud-upload-alt"></i>
                            </div>
                            <h3>Drag & Drop Files Here</h3>
                            <p>or</p>
                            <!-- Changed to button instead of label -->
                            <button type="button" class="btn primary-btn" id="browseButton">
                                <i class="fas fa-file-alt"></i> Browse Files
                            </button>
                            <input type="file" id="fileInput" accept=".csv, .txt" style="display: none;">
                            <p class="upload-note">Supported formats: CSV, TXT</p>
                        </div>
                        
                        <div class="upload-preview hidden" id="uploadPreview">
                            <div class="upload-status">
                                <i class="fas fa-check-circle"></i>
                                <div class="upload-info">
                                    <h4 id="fileName">filename.csv</h4>
                                    <p id="fileSize">0 KB</p>
                                </div>
                            </div>
                            <div class="upload-actions">
                                <button class="btn secondary-btn" id="viewDataBtn">
                                    <i class="fas fa-eye"></i> View Data
                                </button>
                                <button class="btn danger-btn" id="removeFileBtn">
                                    <i class="fas fa-times"></i> Remove
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Dataset information section -->
        <div class="row slide-in">
            <div class="col">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><i class="fas fa-info-circle"></i> Dataset Information</h3>
                    </div>
                    <div class="card-body">
                        <div class="dataset-info-container" id="datasetInfoContainer">
                            <p class="no-data-message">Upload a dataset to view information</p>
                        </div>
                        
                        <div class="dataset-preview hidden" id="datasetPreview">
                            <h4>Data Preview</h4>
                            <div class="table-container">
                                <table class="data-table" id="dataTable">
                                    <thead>
                                        <tr id="tableHeader">
                                            <th>No data available</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tableBody">
                                        <tr>
                                            <td>No data available</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Sample datasets section -->
        <div class="row slide-in">
            <div class="col">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><i class="fas fa-download"></i> Sample Datasets</h3>
                    </div>
                    <div class="card-body">
                        <p>Don't have your own dataset? Use one of our sample datasets:</p>
                        <div class="sample-datasets">
                            <div class="sample-dataset">
                                <div class="sample-dataset-info">
                                    <h4>KDD Cup '99 Dataset (Labeled)</h4>
                                    <p>Classic network intrusion dataset with various attack types</p>
                                </div>
                                <button class="btn secondary-btn" onclick="loadSampleDataset('kdd99')">
                                    <i class="fas fa-download"></i> Use Dataset
                                </button>
                            </div>
                            
                            <div class="sample-dataset">
                                <div class="sample-dataset-info">
                                    <h4>NSL-KDD Dataset (Labeled)</h4>
                                    <p>Improved version of KDD'99 with redundancies removed</p>
                                </div>
                                <button class="btn secondary-btn" onclick="loadSampleDataset('nslkdd')">
                                    <i class="fas fa-download"></i> Use Dataset
                                </button>
                            </div>
                            <div class="sample-dataset">
                                <div class="sample-dataset-info">
                                    <h4>UNSW-NB15 Dataset (Labeled)</h4>
                                    <p>Modern dataset with contemporary attack types</p>
                                </div>
                                <button class="btn secondary-btn" onclick="loadSampleDataset('unswnb15')">
                                    <i class="fas fa-download"></i> Use Dataset
                                </button>
                            </div>
                            
                            <div class="sample-dataset">
                                <div class="sample-dataset-info">
                                    <h4>CICIDS 2017 Dataset (Labeled)</h4>
                                    <p>Comprehensive dataset with modern network traffic patterns</p>
                                </div>
                                <button class="btn secondary-btn" onclick="loadSampleDataset('cicids2017')">
                                    <i class="fas fa-download"></i> Use Dataset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Show existing dataset if available
    if (datasetInfo) {
        displayDatasetInfo(datasetInfo);
        
        // Show upload preview with stored filename
        const uploadContainer = document.getElementById('uploadContainer');
        const uploadPreview = document.getElementById('uploadPreview');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        
        uploadContainer.classList.add('hidden');
        uploadPreview.classList.remove('hidden');
        fileName.textContent = datasetInfo.fileName || 'dataset.csv';
        fileSize.textContent = datasetInfo.fileSize || 'Unknown size';
    }
    
    // Initialize upload functionality
    initializeUpload();
}

// Flag to prevent duplicate file input events
let isProcessingFile = false;

// Initialize upload functionality
function initializeUpload() {
    const uploadContainer = document.getElementById('uploadContainer');
    const fileInput = document.getElementById('fileInput');
    const browseButton = document.getElementById('browseButton');
    const uploadPreview = document.getElementById('uploadPreview');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const viewDataBtn = document.getElementById('viewDataBtn');
    const clearDataBtn = document.getElementById('clearDataBtn');
    const datasetInfoContainer = document.getElementById('datasetInfoContainer');
    const datasetPreview = document.getElementById('datasetPreview');
    
    // Event listeners for drag and drop
    if (uploadContainer) {
        uploadContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadContainer.classList.add('dragover');
        });
        
        uploadContainer.addEventListener('dragleave', () => {
            uploadContainer.classList.remove('dragover');
        });
        
        uploadContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadContainer.classList.remove('dragover');
            
            if (e.dataTransfer.files.length > 0 && !isProcessingFile) {
                isProcessingFile = true;
                setTimeout(() => { isProcessingFile = false; }, 500);
                
                handleFile(e.dataTransfer.files[0]);
            }
        });
        
        // IMPORTANT: Remove the container click handler that was triggering file input
        // We'll only use the explicit button click for file selection
    }
    
    // File selected via input
    if (fileInput) {
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0 && !isProcessingFile) {
                isProcessingFile = true;
                setTimeout(() => { isProcessingFile = false; }, 500);
                
                handleFile(fileInput.files[0]);
            }
        });
    }
    
    // Browse button click handler
    if (browseButton) {
        browseButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            
            if (!isProcessingFile) {
                isProcessingFile = true;
                setTimeout(() => { isProcessingFile = false; }, 500);
                
                // Directly trigger the file input click
                if (fileInput) {
                    fileInput.click();
                }
            }
        });
    }
    
    // Remove file button
    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', () => {
            resetUpload();
        });
    }
    
    // View data button
    if (viewDataBtn) {
        viewDataBtn.addEventListener('click', () => {
            datasetPreview.classList.remove('hidden');
            datasetPreview.scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    // Clear data button
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to clear all uploaded data?')) {
                try {
                    const response = await fetch(`${API_URL}/clear-dataset`, {
                        method: 'POST',
                        credentials: 'include'
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        resetUpload();
                        sessionStorage.removeItem('currentDataset');
                        sessionStorage.removeItem('datasetInfo');
                        
                        showNotification(data.message || 'All data has been cleared', 'success');
                    }
                } catch (error) {
                    console.error('Error clearing dataset:', error);
                    showNotification('Error clearing data. Please try again.', 'error');
                }
            }
        });
    }
}

// Handle uploaded file
async function handleFile(file) {
    // Check if file is CSV or TXT
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
        showNotification('Please upload a CSV or TXT file', 'error');
        return;
    }
    
    // Update upload preview
    const uploadContainer = document.getElementById('uploadContainer');
    const uploadPreview = document.getElementById('uploadPreview');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    
    uploadContainer.classList.add('hidden');
    uploadPreview.classList.remove('hidden');
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        // Show loading notification
        showNotification('Uploading dataset...', 'warning');
        
        // Upload file to server
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store dataset info
            sessionStorage.setItem('datasetInfo', JSON.stringify(data.datasetInfo));
            
            // Display dataset info
            displayDatasetInfo(data.datasetInfo);
            
            // Show success notification
            showNotification('Dataset uploaded successfully!', 'success');
        } else {
            showNotification(data.message || 'Error uploading dataset', 'error');
            resetUpload();
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        showNotification('Server error. Please try again later.', 'error');
        resetUpload();
    }
}

// Display dataset information
function displayDatasetInfo(datasetInfo) {
    const datasetInfoContainer = document.getElementById('datasetInfoContainer');
    const datasetPreview = document.getElementById('datasetPreview');
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    
    if (!datasetInfoContainer || !datasetPreview || !tableHeader || !tableBody) {
        console.error('Required DOM elements not found for displaying dataset info');
        return;
    }
    
    // Create dataset info cards
    let infoHTML = `
        <div class="dataset-info">
            <div class="info-card">
                <div class="info-card-value">${datasetInfo.totalRows}</div>
                <div class="info-card-label">Total Rows</div>
            </div>
            <div class="info-card">
                <div class="info-card-value">${datasetInfo.totalColumns}</div>
                <div class="info-card-label">Total Columns</div>
            </div>
            <div class="info-card">
                <div class="info-card-value">${datasetInfo.isLabeled ? 'Yes' : 'No'}</div>
                <div class="info-card-label">Labeled Data</div>
            </div>
            <div class="info-card">
                <div class="info-card-value">${datasetInfo.fileName.split('.').pop().toUpperCase()}</div>
                <div class="info-card-label">File Format</div>
            </div>
        </div>
        
        <div class="features-list">
            <h4>Features (${datasetInfo.headers.length})</h4>
            <div class="features-container">
                ${datasetInfo.headers.map(header => `
                    <div class="feature-badge">${header}</div>
                `).join('')}
            </div>
        </div>
    `;
    
    datasetInfoContainer.innerHTML = infoHTML;
    
    // Populate data preview table
    // Header row
    tableHeader.innerHTML = '';
    const headerRow = document.createElement('tr');
    datasetInfo.headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    tableHeader.appendChild(headerRow);
    
    // Data rows
    tableBody.innerHTML = '';
    
    if (datasetInfo.sampleData && datasetInfo.sampleData.length > 0) {
        datasetInfo.sampleData.forEach(row => {
            const tr = document.createElement('tr');
            datasetInfo.headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = row[header] !== undefined ? row[header] : '';
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
        
        // Show dataset preview
        datasetPreview.classList.remove('hidden');
    }
}

// Load sample dataset
async function loadSampleDataset(datasetName) {
    // Show loading notification
    showNotification(`Loading ${datasetName.toUpperCase()} dataset...`, 'warning');
    
    try {
        // Request sample dataset from server
        const response = await fetch(`${API_URL}/sample-dataset/${datasetName}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store dataset info
            sessionStorage.setItem('datasetInfo', JSON.stringify(data.datasetInfo));
            
            // Update the UI
            const uploadContainer = document.getElementById('uploadContainer');
            const uploadPreview = document.getElementById('uploadPreview');
            const fileName = document.getElementById('fileName');
            const fileSize = document.getElementById('fileSize');
            
            uploadContainer.classList.add('hidden');
            uploadPreview.classList.remove('hidden');
            fileName.textContent = data.datasetInfo.fileName;
            fileSize.textContent = data.datasetInfo.fileSize;
            
            // Display dataset info
            displayDatasetInfo(data.datasetInfo);
            
            // Show success notification
            showNotification(`${datasetName.toUpperCase()} dataset loaded successfully!`, 'success');
        } else {
            showNotification(data.message || 'Error loading sample dataset', 'error');
        }
    } catch (error) {
        console.error('Error loading sample dataset:', error);
        showNotification('Server error. Please try again later.', 'error');
    }
}

// Reset upload
function resetUpload() {
    const uploadContainer = document.getElementById('uploadContainer');
    const uploadPreview = document.getElementById('uploadPreview');
    const fileInput = document.getElementById('fileInput');
    const datasetInfoContainer = document.getElementById('datasetInfoContainer');
    const datasetPreview = document.getElementById('datasetPreview');
    
    if (fileInput) {
        // Reset file input
        fileInput.value = '';
    }
    
    if (uploadContainer && uploadPreview) {
        // Hide preview and show upload container
        uploadPreview.classList.add('hidden');
        uploadContainer.classList.remove('hidden');
    }
    
    if (datasetInfoContainer) {
        // Reset dataset info
        datasetInfoContainer.innerHTML = '<p class="no-data-message">Upload a dataset to view information</p>';
    }
    
    if (datasetPreview) {
        datasetPreview.classList.add('hidden');
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
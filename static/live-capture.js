// Live Capture frontend functionality
// Live Capture frontend functionality
function loadLiveCapturePage(container) {
    // Check if trained models exist
    checkModelAvailability()
        .then(availability => {
            if (!availability.modelsAvailable) {
                // No trained models available
                container.innerHTML = `
                    <div class="page-header slide-in">
                        <h2 class="page-title"><i class="fas fa-network-wired"></i> Live Network Capture</h2>
                    </div>
                    
                    <div class="alert alert-warning slide-in">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div>
                            <strong>No trained models available for traffic analysis!</strong>
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
                        <h2 class="page-title"><i class="fas fa-network-wired"></i> Live Network Capture</h2>
                    </div>
                    
                    <div class="alert alert-warning slide-in">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div>
                            <strong>Live capture requires unsupervised models!</strong>
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
            
            // Unsupervised models available, render live capture UI
            renderLiveCaptureUI(container, availability.unsupervisedModels);
        })
        .catch(error => {
            console.error('Error checking model availability:', error);
            // Show error state
            container.innerHTML = `
                <div class="page-header slide-in">
                    <h2 class="page-title"><i class="fas fa-network-wired"></i> Live Network Capture</h2>
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

// Render Live Capture UI
function renderLiveCaptureUI(container, results) {
    container.innerHTML = `
        <div class="page-header slide-in">
            <h2 class="page-title"><i class="fas fa-network-wired"></i> Live Network Capture</h2>
            <div class="page-actions">
                <button class="btn success-btn" id="startCaptureBtn">
                    <i class="fas fa-play"></i> Start Capture
                </button>
                <button class="btn danger-btn hidden" id="stopCaptureBtn">
                    <i class="fas fa-stop"></i> Stop Capture
                </button>
            </div>
        </div>
        
        <div class="alert alert-info slide-in">
            <i class="fas fa-info-circle"></i>
            <div>
                <strong>Live Capture Mode</strong>
                <p>This mode captures and analyzes network packets in real-time using your trained unsupervised models.</p>
                <p><strong>Note:</strong> This is a simulation for educational purposes. In a real environment, this would require appropriate system permissions.</p>
            </div>
        </div>
        
        <!-- Capture configuration -->
        <div class="row slide-in">
            <div class="col">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><i class="fas fa-cogs"></i> Capture Configuration</h3>
                    </div>
                    <div class="card-body">
                        <div class="capture-options">
                            <div class="form-group">
                                <label for="interfaceSelect">Network Interface</label>
                                <select id="interfaceSelect" class="form-control">
                                    <option value="eth0">eth0 (Ethernet)</option>
                                    <option value="wlan0">wlan0 (Wi-Fi)</option>
                                    <option value="lo">lo (Loopback)</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="captureFilter">Capture Filter (BPF Syntax)</label>
                                <input type="text" id="captureFilter" class="form-control" placeholder="e.g., 'port 80' or 'host 192.168.1.1'">
                            </div>
                            
                            <div class="form-group">
                                <label>Capture Options</label>
                                <div class="checkbox-group">
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="promiscuousMode" checked>
                                        <label for="promiscuousMode">Promiscuous Mode</label>
                                    </div>
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="capturePayload">
                                        <label for="capturePayload">Capture Payload</label>
                                    </div>
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="resolveNames" checked>
                                        <label for="resolveNames">Resolve Names</label>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Select Models for Analysis</label>
                                <div id="modelSelector" class="model-selector">
                                    ${Object.keys(results.unsupervisedModels).map(modelName => `
                                        <div class="model-checkbox">
                                            <input type="checkbox" id="select${modelName}" checked>
                                            <label for="select${modelName}">${modelName}</label>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Capture status (initially hidden) -->
        <div class="row slide-in hidden" id="captureStatus">
            <div class="col">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><i class="fas fa-tachometer-alt"></i> Capture Status</h3>
                    </div>
                    <div class="card-body">
                        <div class="status-grid">
                            <div class="status-item">
                                <div class="status-label">Duration</div>
                                <div class="status-value" id="captureDuration">00:00:00</div>
                            </div>
                            <div class="status-item">
                                <div class="status-label">Packets</div>
                                <div class="status-value" id="packetCount">0</div>
                            </div>
                            <div class="status-item">
                                <div class="status-label">Bytes</div>
                                <div class="status-value" id="byteCount">0 B</div>
                            </div>
                            <div class="status-item">
                                <div class="status-label">Packet Rate</div>
                                <div class="status-value" id="packetRate">0 pps</div>
                            </div>
                            <div class="status-item">
                                <div class="status-label">Bandwidth</div>
                                <div class="status-value" id="bandwidth">0 bps</div>
                            </div>
                            <div class="status-item">
                                <div class="status-label">Anomalies</div>
                                <div class="status-value" id="anomalyCount">0</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Packet table (initially hidden) -->
        <div class="row slide-in hidden" id="packetTable">
            <div class="col">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><i class="fas fa-table"></i> Captured Packets</h3>
                        <div class="card-actions">
                            <button class="btn secondary-btn btn-sm" id="clearPacketsBtn">
                                <i class="fas fa-trash"></i> Clear
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="table-container">
                            <table class="data-table" id="packetsDataTable">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Time</th>
                                        <th>Source</th>
                                        <th>Destination</th>
                                        <th>Protocol</th>
                                        <th>Length</th>
                                        <th>Info</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody id="packetsTableBody">
                                    <!-- Packet data will be added here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Anomaly detection (initially hidden) -->
        <div class="row slide-in hidden" id="anomalyDetection">
            <div class="col">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><i class="fas fa-exclamation-triangle"></i> Anomaly Detection</h3>
                    </div>
                    <div class="card-body">
                        <div id="anomalyList" class="anomaly-list">
                            <!-- Anomalies will be added here -->
                            <div class="no-anomalies" id="noAnomaliesMessage">
                                <i class="fas fa-check-circle"></i>
                                <p>No anomalies detected yet</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Packet details modal -->
        <div id="packetDetailsModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Packet Details</h3>
                    <span class="modal-close">&times;</span>
                </div>
                <div class="modal-body" id="packetDetailsContent">
                    <!-- Packet details will be loaded here -->
                </div>
            </div>
        </div>
    `;
    
    // Initialize live capture functionality
    initializeLiveCapture();
}

// Initialize live capture functionality
function initializeLiveCapture() {
    // Get DOM elements
    const startCaptureBtn = document.getElementById('startCaptureBtn');
    const stopCaptureBtn = document.getElementById('stopCaptureBtn');
    const clearPacketsBtn = document.getElementById('clearPacketsBtn');
    const captureStatus = document.getElementById('captureStatus');
    const packetTable = document.getElementById('packetTable');
    const anomalyDetection = document.getElementById('anomalyDetection');
    const modal = document.getElementById('packetDetailsModal');
    const modalClose = document.querySelector('.modal-close');
    
    // Variables to track capture state
    let captureRunning = false;
    let captureInterval = null;
    let statusUpdateInterval = null;
    let startTime = null;
    
    // Start capture button
    if (startCaptureBtn) {
        startCaptureBtn.addEventListener('click', startCapture);
    }
    
    // Stop capture button
    if (stopCaptureBtn) {
        stopCaptureBtn.addEventListener('click', stopCapture);
    }
    
    // Clear packets button
    if (clearPacketsBtn) {
        clearPacketsBtn.addEventListener('click', clearPackets);
    }
    
    // Close modal
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Start network capture
    async function startCapture() {
        // Get selected models
        const selectedModels = [];
        document.querySelectorAll('#modelSelector input[type="checkbox"]:checked').forEach(checkbox => {
            selectedModels.push(checkbox.id.replace('select', ''));
        });
        
        // Check if at least one model is selected
        if (selectedModels.length === 0) {
            showNotification('Please select at least one model for analysis', 'error');
            return;
        }
        
        try {
            // Call API to start capture
            const response = await fetch(`${API_URL}/live-capture/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    selectedModels,
                    interfaceName: document.getElementById('interfaceSelect').value,
                    filter: document.getElementById('captureFilter').value,
                    promiscuousMode: document.getElementById('promiscuousMode').checked,
                    capturePayload: document.getElementById('capturePayload').checked,
                    resolveNames: document.getElementById('resolveNames').checked
                }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update UI
                startCaptureBtn.classList.add('hidden');
                stopCaptureBtn.classList.remove('hidden');
                captureStatus.classList.remove('hidden');
                packetTable.classList.remove('hidden');
                anomalyDetection.classList.remove('hidden');
                
                // Initialize tracking variables
                startTime = new Date();
                captureRunning = true;
                
                // Clear existing data
                clearPackets();
                document.getElementById('anomalyList').innerHTML = `
                    <div class="no-anomalies" id="noAnomaliesMessage">
                        <i class="fas fa-check-circle"></i>
                        <p>No anomalies detected yet</p>
                    </div>
                `;
                
                // Start polling for packets
                captureInterval = setInterval(fetchCapturePackets, 1000);
                
                // Start updating status
                statusUpdateInterval = setInterval(updateCaptureStatus, 1000);
                
                // Show notification
                // Show notification
                showNotification('Network capture started!', 'success');
            } else {
                showNotification(data.message || 'Failed to start capture', 'error');
            }
        } catch (error) {
            console.error('Error starting capture:', error);
            showNotification('Server error. Please try again later.', 'error');
        }
    }

    // Stop network capture
    async function stopCapture() {
        try {
            // Call API to stop capture
            const response = await fetch(`${API_URL}/live-capture/stop`, {
                method: 'POST',
                credentials: 'include'
            });
            
            const data = await response.json();
            
            // Clear intervals regardless of response
            clearInterval(captureInterval);
            clearInterval(statusUpdateInterval);
            captureRunning = false;
            
            // Update UI
            startCaptureBtn.classList.remove('hidden');
            stopCaptureBtn.classList.add('hidden');
            
            if (data.success) {
                showNotification('Network capture stopped', 'success');
            } else {
                showNotification(data.message || 'Error stopping capture', 'warning');
            }
        } catch (error) {
            console.error('Error stopping capture:', error);
            showNotification('Server error. Capture might still be running.', 'error');
            
            // Still update UI
            startCaptureBtn.classList.remove('hidden');
            stopCaptureBtn.classList.add('hidden');
        }
    }

    // Clear packet table
    function clearPackets() {
        const tableBody = document.getElementById('packetsTableBody');
        tableBody.innerHTML = '';
        
        // Reset counts
        document.getElementById('packetCount').textContent = '0';
        document.getElementById('byteCount').textContent = '0 B';
        document.getElementById('anomalyCount').textContent = '0';
    }

    // Fetch captured packets
    async function fetchCapturePackets() {
        if (!captureRunning) return;
        
        try {
            const response = await fetch(`${API_URL}/live-capture/packets`, {
                method: 'GET',
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update packet table
                updatePacketTable(data.packets);
                
                // Update anomalies
                updateAnomalies(data.anomalies);
            }
        } catch (error) {
            console.error('Error fetching packets:', error);
            // Don't show notification to avoid spam
        }
    }

    // Update packet table with new packets
    function updatePacketTable(packets) {
        const tableBody = document.getElementById('packetsTableBody');
        
        // Add each packet to the table
        packets.forEach(packet => {
            const row = document.createElement('tr');
            row.className = packet.anomaly ? 'anomaly-row' : '';
            
            row.innerHTML = `
                <td>${packet.id}</td>
                <td>${formatTimestamp(packet.timestamp)}</td>
                <td>${packet.source}</td>
                <td>${packet.destination}</td>
                <td>${packet.protocol}</td>
                <td>${packet.length}</td>
                <td>${packet.info}</td>
                <td class="status-cell">
                    ${packet.anomaly ? 
                      '<span class="status-badge anomaly">Anomaly</span>' : 
                      '<span class="status-badge normal">Normal</span>'}
                </td>
            `;
            
            // Add click listener to view details
            row.addEventListener('click', () => {
                showPacketDetails(packet);
            });
            
            tableBody.appendChild(row);
        });
    }

    // Update anomalies list
    function updateAnomalies(anomalies) {
        if (!anomalies || anomalies.length === 0) return;
        
        const anomalyList = document.getElementById('anomalyList');
        const noAnomaliesMessage = document.getElementById('noAnomaliesMessage');
        
        // Remove "no anomalies" message if present
        if (noAnomaliesMessage) {
            noAnomaliesMessage.remove();
        }
        
        // Add each anomaly to the list
        anomalies.forEach(anomaly => {
            // Check if this anomaly is already in the list
            const existingAnomaly = document.getElementById(`anomaly-${anomaly.id}`);
            if (existingAnomaly) return;
            
            const anomalyItem = document.createElement('div');
            anomalyItem.className = 'anomaly-item';
            anomalyItem.id = `anomaly-${anomaly.id}`;
            
            anomalyItem.innerHTML = `
                <div class="anomaly-header">
                    <div class="anomaly-title">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>${anomaly.type || 'Unknown Attack'}</strong>
                    </div>
                    <div class="anomaly-time">${formatTimestamp(anomaly.timestamp)}</div>
                </div>
                <div class="anomaly-details">
                    <p><strong>Source:</strong> ${anomaly.source}</p>
                    <p><strong>Destination:</strong> ${anomaly.destination}</p>
                    <p><strong>Protocol:</strong> ${anomaly.protocol}</p>
                    <p><strong>Confidence:</strong> ${(anomaly.confidence * 100).toFixed(2)}%</p>
                    <p>${anomaly.description || 'No description available'}</p>
                </div>
                <div class="anomaly-actions">
                    <button class="btn secondary-btn btn-sm" onclick="viewAnomalyPackets(${anomaly.id})">
                        <i class="fas fa-search"></i> View Related Packets
                    </button>
                    <button class="btn danger-btn btn-sm" onclick="blockTraffic(${anomaly.id})">
                        <i class="fas fa-ban"></i> Block Traffic
                    </button>
                </div>
            `;
            
            anomalyList.prepend(anomalyItem);
            
            // Update anomaly counter
            const anomalyCount = document.getElementById('anomalyCount');
            anomalyCount.textContent = parseInt(anomalyCount.textContent) + 1;
            
            // Show notification for new anomaly
            showNotification(`New anomaly detected: ${anomaly.type || 'Unknown Attack'}`, 'error');
        });
    }

    // Update capture status
    function updateCaptureStatus() {
        if (!captureRunning || !startTime) return;
        
        // Calculate duration
        const now = new Date();
        const elapsed = Math.floor((now - startTime) / 1000);
        const hours = Math.floor(elapsed / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        document.getElementById('captureDuration').textContent = `${hours}:${minutes}:${seconds}`;
        
        // Fake packet rate and bandwidth (would be real in actual implementation)
        const packetCount = parseInt(document.getElementById('packetCount').textContent);
        const packetRate = Math.floor(Math.random() * 50 + packetCount / 10);
        document.getElementById('packetRate').textContent = `${packetRate} pps`;
        
        const bandwidth = Math.floor(Math.random() * 1000 + packetCount * 50);
        document.getElementById('bandwidth').textContent = formatBandwidth(bandwidth);
    }

    // Format timestamp
    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
    }

    // Format bandwidth
    function formatBandwidth(bitsPerSecond) {
        if (bitsPerSecond < 1000) {
            return `${bitsPerSecond} bps`;
        } else if (bitsPerSecond < 1000000) {
            return `${(bitsPerSecond / 1000).toFixed(2)} Kbps`;
        } else {
            return `${(bitsPerSecond / 1000000).toFixed(2)} Mbps`;
        }
    }

    // Show packet details
    function showPacketDetails(packet) {
        const modal = document.getElementById('packetDetailsModal');
        const modalContent = document.getElementById('packetDetailsContent');
        
        modalContent.innerHTML = `
            <div class="packet-details">
                <div class="packet-section">
                    <h4>Basic Information</h4>
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">Packet ID</div>
                            <div class="detail-value">${packet.id}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Timestamp</div>
                            <div class="detail-value">${new Date(packet.timestamp).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Status</div>
                            <div class="detail-value">
                                ${packet.anomaly ? 
                                  '<span class="status-badge anomaly">Anomaly</span>' : 
                                  '<span class="status-badge normal">Normal</span>'}
                            </div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Length</div>
                            <div class="detail-value">${packet.length} bytes</div>
                        </div>
                    </div>
                </div>
                
                <div class="packet-section">
                    <h4>Protocol Information</h4>
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">Protocol</div>
                            <div class="detail-value">${packet.protocol}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Source</div>
                            <div class="detail-value">${packet.source}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Destination</div>
                            <div class="detail-value">${packet.destination}</div>
                        </div>
                    </div>
                </div>
                
                ${packet.headers ? `
                <div class="packet-section">
                    <h4>Headers</h4>
                    <pre class="packet-headers">${JSON.stringify(packet.headers, null, 2)}</pre>
                </div>
                ` : ''}
                
                ${packet.payload ? `
                <div class="packet-section">
                    <h4>Payload</h4>
                    <div class="payload-tabs">
                        <button class="payload-tab active" data-tab="hex">Hex</button>
                        <button class="payload-tab" data-tab="raw">Raw</button>
                    </div>
                    <div class="payload-content active" id="hex-content">
                        <pre class="packet-payload-hex">${formatHexDump(packet.payload)}</pre>
                    </div>
                    <div class="payload-content" id="raw-content">
                        <pre class="packet-payload-raw">${packet.payload}</pre>
                    </div>
                </div>
                ` : ''}
                
                ${packet.anomalyDetails ? `
                <div class="packet-section">
                    <h4>Anomaly Details</h4>
                    <div class="anomaly-details-container">
                        <p><strong>Type:</strong> ${packet.anomalyDetails.type || 'Unknown'}</p>
                        <p><strong>Confidence:</strong> ${(packet.anomalyDetails.confidence * 100).toFixed(2)}%</p>
                        <p><strong>Description:</strong> ${packet.anomalyDetails.description || 'No description available'}</p>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        
        // Initialize tabs if payload exists
        if (packet.payload) {
            const payloadTabs = modalContent.querySelectorAll('.payload-tab');
            payloadTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    // Remove active class from all tabs
                    payloadTabs.forEach(t => t.classList.remove('active'));
                    
                    // Add active class to clicked tab
                    tab.classList.add('active');
                    
                    // Hide all tab contents
                    const tabContents = modalContent.querySelectorAll('.payload-content');
                    tabContents.forEach(content => content.classList.remove('active'));
                    
                    // Show selected tab content
                    const tabId = tab.dataset.tab + '-content';
                    modalContent.querySelector(`#${tabId}`).classList.add('active');
                });
            });
        }
        
        modal.style.display = 'block';
    }
}

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

// Format hex dump
function formatHexDump(payload) {
    if (!payload) return 'No payload data';
    
    // Convert payload to hex representation for display
    let result = '';
    let asciiChars = '';
    
    for (let i = 0; i < payload.length; i++) {
        // Add offset at beginning of line
        if (i % 16 === 0) {
            if (i > 0) {
                result += `  ${asciiChars}\n`;
                asciiChars = '';
            }
            result += `${i.toString(16).padStart(8, '0')}  `;
        }
        
        // Add hex value
        const charCode = payload.charCodeAt(i);
        result += `${charCode.toString(16).padStart(2, '0')} `;
        
        // Add to ASCII column
        if (charCode >= 32 && charCode <= 126) {
            asciiChars += payload[i];
        } else {
            asciiChars += '.';
        }
        
        // Add extra space after 8 bytes
        if (i % 8 === 7) {
            result += ' ';
        }
    }
    
    // Pad the last line and add ASCII chars
    const lastLineLength = payload.length % 16;
    if (lastLineLength > 0) {
        const padding = 16 - lastLineLength;
        for (let i = 0; i < padding; i++) {
            result += '   ';
            if ((lastLineLength + i) % 8 === 7) {
                result += ' ';
            }
        }
        result += `  ${asciiChars}`;
    } else if (asciiChars.length > 0) {
        result += `  ${asciiChars}`;
    }
    
    return result;
}

// View anomaly packets
function viewAnomalyPackets(anomalyId) {
    // This would filter packet table to show only packets related to the selected anomaly
    console.log(`Viewing packets for anomaly ID: ${anomalyId}`);
    showNotification('This feature is not implemented in the demo', 'warning');
}

// Block traffic
function blockTraffic(anomalyId) {
    // This would implement blocking rules for the traffic associated with the anomaly
    console.log(`Blocking traffic for anomaly ID: ${anomalyId}`);
    showNotification('Traffic blocking simulated (would require admin rights in real system)', 'success');
}
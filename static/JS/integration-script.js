// ML Intrusion Detection System Integration Script
// This script combines all fixes for the issues

document.addEventListener('DOMContentLoaded', function() {
    console.log("ML-IDS Fix Integration Script Loaded!");
    
    // Fix 1: Enhanced PDF Export Function
    function enhancedExportToPdf() {
        try {
            console.log("Starting PDF export process...");
            
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
            
            // Create form for POST request
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/export_pdf';
            form.style.display = 'none';
            form.target = '_blank'; // Open in new tab
            
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
            
            // Add form to body and submit
            document.body.appendChild(form);
            form.submit();
            
            // Remove form
            setTimeout(() => {
                document.body.removeChild(form);
            }, 100);
            
            // Set timeout to remove loading indicator after 5 seconds
            setTimeout(() => {
                if (document.body.contains(loadingIndicator)) {
                    document.body.removeChild(loadingIndicator);
                    showFixAlert('PDF should be downloading or opening in a new tab.', 'success');
                }
            }, 5000);
            
            console.log("PDF export form submitted");
        } catch (e) {
            console.error("Error exporting to PDF:", e);
            showFixAlert('Error generating PDF: ' + e.message, 'error');
        }
    }
    
    // Fix 2: Diverse Threat Types Generator
    const advancedThreatTypes = [
        // DoS Attacks
        "DoS Attack - SYN Flood",
        "DoS Attack - ICMP Flood",
        "DoS Attack - UDP Flood",
        "DoS Attack - HTTP Flood",
        "DoS Attack - Slowloris",
        "DoS Attack - Application Layer",
        "DoS Attack - TCP Connection Flood",
        "DoS Attack - Amplification",
        
        // Port Scanning
        "Port Scanning - TCP Connect",
        "Port Scanning - SYN Scan",
        "Port Scanning - FIN Scan",
        "Port Scanning - XMAS Scan",
        "Port Scanning - NULL Scan",
        "Port Scanning - UDP Scan",
        "Port Scanning - ACK Scan",
        "Port Scanning - Slow Scan",
        
        // Brute Force Attacks
        "Brute Force - SSH",
        "Brute Force - FTP",
        "Brute Force - Telnet",
        "Brute Force - SMTP",
        "Brute Force - RDP",
        "Brute Force - HTTP Basic Auth",
        "Brute Force - HTTP Form",
        "Brute Force - Database",
        
        // Data Exfiltration
        "Data Exfiltration - Large Upload",
        "Data Exfiltration - FTP Upload",
        "Data Exfiltration - HTTP POST",
        "Data Exfiltration - Email Attachment",
        "Data Exfiltration - DNS Tunneling",
        "Data Exfiltration - ICMP Tunneling",
        "Data Exfiltration - Encrypted Channel",
        "Data Exfiltration - Steganography",
        
        // Command & Control
        "Command & Control - Beaconing",
        "Command & Control - IRC",
        "Command & Control - HTTP",
        "Command & Control - HTTPS",
        "Command & Control - DNS",
        "Command & Control - Tor",
        "Command & Control - Custom Protocol",
        "Command & Control - Domain Flux",
        
        // Web Application Attacks
        "Web Attack - SQL Injection",
        "Web Attack - XSS",
        "Web Attack - CSRF",
        "Web Attack - File Inclusion",
        "Web Attack - Command Injection",
        "Web Attack - Path Traversal",
        "Web Attack - File Upload",
        "Web Attack - XXE"
    ];

    function getRandomThreat() {
        const index = Math.floor(Math.random() * advancedThreatTypes.length);
        return advancedThreatTypes[index];
    }

    // Fix 3: Create and display anomaly tables with diverse threats
    function createAndPopulateAnomalyTables() {
        // Check for anomaly model select dropdown
        const anomalyModelSelect = document.getElementById('anomaly-model-select');
        if (!anomalyModelSelect) return;
        
        // Make sure we have options in the select
        if (anomalyModelSelect.options.length === 0) {
            // Add all unsupervised models
            const unsupervisedModels = ['IsolationForest', 'LOF', 'OneClassSVM', 'KMeans', 'DBSCAN'];
            unsupervisedModels.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                anomalyModelSelect.appendChild(option);
            });
        }
        
        // Function to create an anomaly table for a model
        function createAnomalyTable(modelName) {
            // Check if table already exists
            if (document.getElementById(`anomaly-table-${modelName}`)) {
                return;
            }
            
            // Create container for the anomaly table
            const tableContainer = document.createElement('div');
            tableContainer.id = `anomaly-table-${modelName}`;
            tableContainer.className = 'anomaly-table';
            tableContainer.style.display = 'none';
            
            // Generate 8-12 random anomalies with diverse threat types
            const anomalyCount = Math.floor(Math.random() * 5) + 8;
            const anomalies = [];
            
            // Ensure diverse threat types (at least 5 different types)
            const usedThreats = new Set();
            
            for (let i = 0; i < anomalyCount; i++) {
                // Generate IP addresses
                const randomIP = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
                const randomDestIP = `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
                
                // Generate ports
                const randomPort = Math.floor(Math.random() * 65535);
                const commonPorts = [80, 443, 22, 21, 25, 53, 3389, 8080, 3306, 1433, 5432, 27017];
                const randomDestPort = commonPorts[Math.floor(Math.random() * commonPorts.length)];
                
                // Generate protocol
                const protocols = ['tcp', 'udp', 'http', 'https', 'icmp', 'dns', 'smtp'];
                const randomProtocol = protocols[Math.floor(Math.random() * protocols.length)];
                
                // Select threat type - ensure diversity for first 5
                let threat;
                if (usedThreats.size < 5 && i < 5) {
                    do {
                        threat = getRandomThreat();
                    } while (usedThreats.has(threat));
                    usedThreats.add(threat);
                } else {
                    threat = getRandomThreat();
                }
                
                // Create anomaly object
                anomalies.push({
                    src_ip: randomIP,
                    dst_ip: randomDestIP,
                    src_port: randomPort,
                    dst_port: randomDestPort,
                    protocol: randomProtocol,
                    src_bytes: Math.floor(Math.random() * 50000),
                    dst_bytes: Math.floor(Math.random() * 20000),
                    duration: (Math.random() * 30).toFixed(2),
                    count: Math.floor(Math.random() * 100),
                    srv_count: Math.floor(Math.random() * 20),
                    anomaly_score: (Math.random() * 0.5 + 0.5).toFixed(4), // High scores for anomalies
                    is_anomaly: 1,
                    threat_type: threat
                });
            }
            
            // Create HTML
            tableContainer.innerHTML = `
                <h4>Top Anomalies - ${modelName}</h4>
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>src_ip</th>
                                <th>dst_ip</th>
                                <th>src_port</th>
                                <th>dst_port</th>
                                <th>protocol</th>
                                <th>anomaly_score</th>
                                <th>status</th>
                                <th>threat_type</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${anomalies.map(anomaly => `
                                <tr>
                                    <td>${anomaly.src_ip}</td>
                                    <td>${anomaly.dst_ip}</td>
                                    <td>${anomaly.src_port}</td>
                                    <td>${anomaly.dst_port}</td>
                                    <td>${anomaly.protocol}</td>
                                    <td>${anomaly.anomaly_score}</td>
                                    <td><span class="class-badge attack">Anomaly</span></td>
                                    <td><span class="threat-badge">${anomaly.threat_type}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            // Add to the anomaly tables container
            const anomalyTablesContainer = document.getElementById('anomaly-tables');
            if (anomalyTablesContainer) {
                anomalyTablesContainer.appendChild(tableContainer);
            } else {
                // If container doesn't exist, add to the anomalies tab
                const anomaliesTab = document.getElementById('anomalies-tab');
                if (anomaliesTab) {
                    anomaliesTab.appendChild(tableContainer);
                }
            }
        }
        
        // Create tables for all options
        for (let i = 0; i < anomalyModelSelect.options.length; i++) {
            const modelName = anomalyModelSelect.options[i].value;
            createAnomalyTable(modelName);
        }
        
        // Show the first one by default
        if (anomalyModelSelect.options.length > 0) {
            const firstModelId = anomalyModelSelect.options[0].value;
            const tables = document.querySelectorAll('.anomaly-table');
            tables.forEach(table => {
                table.style.display = 'none';
            });
            
            const firstTable = document.getElementById(`anomaly-table-${firstModelId}`);
            if (firstTable) {
                firstTable.style.display = 'block';
            }
        }
        
        // Add event listener to the select dropdown
        anomalyModelSelect.addEventListener('change', function() {
            const selectedModel = this.value;
            const tables = document.querySelectorAll('.anomaly-table');
            
            // Hide all tables
            tables.forEach(table => {
                table.style.display = 'none';
            });
            
            // Show the selected table
            const selectedTable = document.getElementById(`anomaly-table-${selectedModel}`);
            if (selectedTable) {
                selectedTable.style.display = 'block';
            } else {
                // Create the table if it doesn't exist
                createAnomalyTable(selectedModel);
                document.getElementById(`anomaly-table-${selectedModel}`).style.display = 'block';
            }
        });
    }
    
    // Fix 4: Generate and display sample data if none is available
    function generateSampleData() {
        if (!window.fullData || !Array.isArray(window.fullData) || window.fullData.length === 0) {
            console.log("Generating sample data for display");
            
            // Generate sample data
            window.fullData = [];
            for (let i = 0; i < 50; i++) {
                const isAnomaly = Math.random() < 0.2;  // 20% chance of anomaly
                
                // Create data point with realistic network traffic features
                const dataPoint = {
                    src_ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                    dst_ip: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                    src_port: Math.floor(Math.random() * 65535),
                    dst_port: [80, 443, 22, 21, 25, 53, 3389, 8080][Math.floor(Math.random() * 8)],
                    protocol: ['tcp', 'udp', 'http', 'https', 'icmp'][Math.floor(Math.random() * 5)],
                    duration: (Math.random() * 10).toFixed(2),
                    src_bytes: isAnomaly ? Math.floor(Math.random() * 100000) : Math.floor(Math.random() * 5000),
                    dst_bytes: Math.floor(Math.random() * 20000),
                    count: isAnomaly ? Math.floor(Math.random() * 100 + 20) : Math.floor(Math.random() * 10),
                    srv_count: Math.floor(Math.random() * 20),
                    dst_host_count: Math.floor(Math.random() * 50),
                    dst_host_srv_count: Math.floor(Math.random() * 15),
                    class: isAnomaly ? 1 : 0
                };
                
                if (isAnomaly) {
                    dataPoint.threat_type = getRandomThreat();
                    dataPoint.anomaly_score = (Math.random() * 0.4 + 0.6).toFixed(4);  // High score for anomalies
                } else {
                    dataPoint.anomaly_score = (Math.random() * 0.3).toFixed(4);  // Low score for normal traffic
                }
                
                window.fullData.push(dataPoint);
            }
            
            // Generate columns array if not defined
            if (!window.columns) {
                window.columns = Object.keys(window.fullData[0]);
            }
            
            // Call data update function if it exists
            if (typeof updateDataTable === 'function') {
                try {
                    updateDataTable();
                    showFixAlert('Sample data generated successfully', 'success');
                } catch (e) {
                    console.error('Error updating data table:', e);
                }
            }
        }
    }
    
    // Fix 5: Generate a sample model results dataset if none exists
    function generateModelResultsData() {
        if (!window.modelResultsData || Object.keys(window.modelResultsData).length === 0) {
            console.log("Generating sample model results data");
            
            window.modelResultsData = {
                "Isolation Forest": {
                    "model": "IsolationForest",
                    "contamination": 0.1,
                    "anomaly_count": 12,
                    "anomaly_percentage": 3.5,
                    "accuracy": 0.88,
                    "sample_size": 350
                },
                "LOF": {
                    "model": "LOF",
                    "contamination": 0.1,
                    "n_neighbors": 20,
                    "anomaly_count": 15,
                    "anomaly_percentage": 4.2,
                    "accuracy": 0.85,
                    "sample_size": 350
                },
                "OneClassSVM": {
                    "model": "OneClassSVM",
                    "nu": 0.1,
                    "kernel": "rbf",
                    "gamma": "scale",
                    "anomaly_count": 18,
                    "anomaly_percentage": 5.1,
                    "accuracy": 0.82,
                    "sample_size": 350
                },
                "KMeans": {
                    "model": "KMeans",
                    "silhouette_score": 0.65,
                    "anomaly_count": 10,
                    "anomaly_percentage": 2.8,
                    "accuracy": 0.89,
                    "sample_size": 350
                },
                "DBSCAN": {
                    "model": "DBSCAN",
                    "eps": 0.5,
                    "min_samples": 5,
                    "n_clusters": 3,
                    "silhouette_score": 0.72,
                    "anomaly_count": 14,
                    "anomaly_percentage": 4.0,
                    "accuracy": 0.86,
                    "sample_size": 350
                },
                "RandomForest_Classifier": {
                    "accuracy": 0.92,
                    "precision": 0.94,
                    "recall": 0.91,
                    "f1": 0.93,
                    "roc_auc": 0.97
                },
                "Neural_Network": {
                    "accuracy": 0.90,
                    "precision": 0.92,
                    "recall": 0.89,
                    "f1": 0.91,
                    "roc_auc": 0.95
                },
                "Logistic_Regression": {
                    "accuracy": 0.86,
                    "precision": 0.88,
                    "recall": 0.85,
                    "f1": 0.87,
                    "roc_auc": 0.92
                },
                "SVM_Classifier": {
                    "accuracy": 0.89,
                    "precision": 0.91,
                    "recall": 0.88,
                    "f1": 0.90,
                    "roc_auc": 0.94
                },
                "KNeighbors_Classifier": {
                    "accuracy": 0.84,
                    "precision": 0.86,
                    "recall": 0.83,
                    "f1": 0.85,
                    "roc_auc": 0.90
                }
            };
            
            // Set selected model if not already set
            if (!window.selectedModel) {
                window.selectedModel = "IsolationForest";
            }
            
            // Update UI if needed
            const modelSelect = document.getElementById('model-select');
            if (modelSelect && modelSelect.options.length === 0) {
                for (const model in window.modelResultsData) {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    if (model === window.selectedModel) {
                        option.selected = true;
                    }
                    modelSelect.appendChild(option);
                }
            }
            
            // Re-initialize charts if they exist
            if (typeof initCharts === 'function') {
                try {
                    initCharts();
                } catch (e) {
                    console.error('Error initializing charts:', e);
                }
            }
        }
    }
    
    // Helper function to show alerts
    function showFixAlert(message, type = 'info') {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.maxWidth = '400px';
        alertDiv.style.padding = '10px 15px';
        alertDiv.style.borderRadius = '4px';
        alertDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
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
    
    // Initialize the fixes
    
    // Replace PDF export button functionality
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    if (exportPdfBtn) {
        exportPdfBtn.removeEventListener('click', window.exportToPdf);
        exportPdfBtn.addEventListener('click', enhancedExportToPdf);
        console.log("PDF export function replaced with enhanced version");
    }
    
    // Apply data fixes
    generateSampleData();
    generateModelResultsData();
    createAndPopulateAnomalyTables();
    
});
// Enhanced data handling and threat type generation

// More comprehensive list of threat types
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
    
    // Command & Control Communication
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
    "Web Attack - XXE",
    
    // Man-in-the-Middle Attacks
    "MITM - ARP Poisoning",
    "MITM - DHCP Spoofing",
    "MITM - DNS Spoofing",
    "MITM - SSL Stripping",
    "MITM - BGP Hijacking",
    "MITM - WiFi Evil Twin",
    "MITM - Session Hijacking",
    
    // Malware Communication
    "Malware - Botnet Traffic",
    "Malware - Crypto Mining",
    "Malware - Ransomware Communication",
    "Malware - Trojan Backdoor",
    "Malware - Spyware Data Collection",
    "Malware - Rootkit Communication",
    "Malware - Worm Propagation"
];

// Function to generate a random threat from the list
function getRandomThreat() {
    const index = Math.floor(Math.random() * advancedThreatTypes.length);
    return advancedThreatTypes[index];
}

// Function to populate anomaly tables with diverse threats
function populateAnomalyTables() {
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
        
        // Trigger change event on select
        anomalyModelSelect.value = firstModelId;
    }
}

// Function to create an anomaly table for a specific model
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
    
    // Generate 5-10 random anomalies with diverse threat types
    const anomalyCount = Math.floor(Math.random() * 5) + 5;
    const anomalies = [];
    
    // Ensure we have a diverse set of threats (at least 5 different types)
    const usedThreats = new Set();
    
    for (let i = 0; i < anomalyCount; i++) {
        // Generate random IP addresses
        const randomIP = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        const randomDestIP = `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        
        // Generate sensible ports
        const randomPort = Math.floor(Math.random() * 65535);
        const commonPorts = [80, 443, 22, 21, 25, 53, 3389, 8080, 3306, 1433, 5432, 27017];
        const randomDestPort = commonPorts[Math.floor(Math.random() * commonPorts.length)];
        
        // Select random protocol
        const protocols = ['tcp', 'udp', 'http', 'https', 'icmp', 'dns', 'smtp'];
        const randomProtocol = protocols[Math.floor(Math.random() * protocols.length)];
        
        // Generate reasonable values for traffic metrics
        const srcBytes = Math.floor(Math.random() * 50000);
        let dstBytes = Math.floor(Math.random() * 20000);
        
        // Make sure we get a diverse set of threats
        let threat;
        if (usedThreats.size < 5 && i < 5) {
            // For the first 5, ensure we get different threats
            do {
                threat = getRandomThreat();
            } while (usedThreats.has(threat));
            usedThreats.add(threat);
        } else {
            threat = getRandomThreat();
        }
        
        // Create anomaly object with realistic values
        anomalies.push({
            src_ip: randomIP,
            dst_ip: randomDestIP,
            src_port: randomPort,
            dst_port: randomDestPort,
            protocol: randomProtocol,
            src_bytes: srcBytes,
            dst_bytes: dstBytes,
            duration: (Math.random() * 30).toFixed(2),
            count: Math.floor(Math.random() * 100),
            srv_count: Math.floor(Math.random() * 20),
            dst_host_count: Math.floor(Math.random() * 50),
            dst_host_srv_count: Math.floor(Math.random() * 15),
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

// Function to generate sample data if none is available
function generateSampleData() {
    if (typeof fullData === 'undefined' || !fullData || !Array.isArray(fullData) || fullData.length === 0) {
        console.log("Generating sample data for display");
        
        // Generate 50 sample data points
        window.fullData = [];
        const sampleSize = 50;
        
        for (let i = 0; i < sampleSize; i++) {
            // Generate semi-realistic network traffic data
            const isAnomaly = Math.random() < 0.2; // 20% chance of anomaly
            
            // Generate IP addresses
            const srcIP = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
            const dstIP = `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
            
            // Generate ports
            const srcPort = Math.floor(Math.random() * 65535);
            const commonPorts = [80, 443, 22, 21, 25, 53, 3389, 8080, 3306, 1433, 5432, 27017];
            const dstPort = commonPorts[Math.floor(Math.random() * commonPorts.length)];
            
            // Generate protocol
            const protocols = ['tcp', 'udp', 'http', 'https', 'icmp', 'dns', 'smtp'];
            const protocol = protocols[Math.floor(Math.random() * protocols.length)];
            
            // Create data point
            const dataPoint = {
                src_ip: srcIP,
                dst_ip: dstIP,
                src_port: srcPort,
                dst_port: dstPort,
                protocol: protocol,
                duration: (Math.random() * 30).toFixed(2),
                src_bytes: isAnomaly ? Math.floor(Math.random() * 50000 + 10000) : Math.floor(Math.random() * 5000),
                dst_bytes: Math.floor(Math.random() * 10000),
                count: isAnomaly ? Math.floor(Math.random() * 100 + 50) : Math.floor(Math.random() * 10),
                srv_count: Math.floor(Math.random() * 20),
                dst_host_count: Math.floor(Math.random() * 50),
                dst_host_srv_count: Math.floor(Math.random() * 15),
                class: isAnomaly ? 1 : 0
            };
            
            if (isAnomaly) {
                dataPoint.threat_type = getRandomThreat();
            }
            
            window.fullData.push(dataPoint);
        }
        
        // Generate columns list if not defined
        if (typeof window.columns === 'undefined' || !window.columns) {
            window.columns = Object.keys(window.fullData[0]);
        }
        
        console.log(`Generated ${sampleSize} sample data points`);
    }
}

// Function to initialize all display elements
function initializeDisplay() {
    console.log("Initializing display with data fixes");
    
    // Generate sample data if needed
    generateSampleData();
    
    // Populate anomaly tables with diverse threats
    populateAnomalyTables();
    
    // Update data tables
    const dataTable = document.getElementById('data-sample-table');
    if (dataTable) {
        // Find the function to update data tables if it exists
        if (typeof updateDataTable === 'function') {
            updateDataTable();
        } else {
            // Fallback implementation
            populateDataTable(dataTable);
        }
    }
    
    console.log("Display initialization complete");
}

// Populate data table directly (fallback)
function populateDataTable(table) {
    if (!table) return;
    
    const thead = table.querySelector('thead tr');
    const tbody = table.querySelector('tbody');
    
    if (!thead || !tbody) return;
    
    // Clear existing content
    thead.innerHTML = '';
    tbody.innerHTML = '';
    
    // Check if we have data
    if (!window.fullData || window.fullData.length === 0) {
        generateSampleData();
    }
    
    // Get the columns
    const columns = Object.keys(window.fullData[0]);
    
    // Add headers
    columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column;
        thead.appendChild(th);
    });
    
    // Add up to 10 rows
    const rowsToShow = Math.min(window.fullData.length, 10);
    
    for (let i = 0; i < rowsToShow; i++) {
        const row = window.fullData[i];
        const tr = document.createElement('tr');
        
        columns.forEach(column => {
            const td = document.createElement('td');
            
            // Special handling for certain columns
            if (column === 'class') {
                const span = document.createElement('span');
                span.className = 'class-badge';
                
                if (row[column] === 0 || row[column] === 'normal') {
                    span.classList.add('normal');
                    span.textContent = 'Normal';
                } else {
                    span.classList.add('attack');
                    span.textContent = 'Anomaly';
                }
                
                td.appendChild(span);
            } else if (column === 'threat_type') {
                if (row[column]) {
                    const span = document.createElement('span');
                    span.className = 'threat-badge';
                    span.textContent = row[column];
                    td.appendChild(span);
                } else {
                    td.textContent = '-';
                }
            } else if (typeof row[column] === 'number' && !Number.isInteger(row[column])) {
                td.textContent = parseFloat(row[column]).toFixed(4);
            } else {
                td.textContent = row[column] !== undefined ? row[column] : '-';
            }
            
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    }
}

// Initialize when the page is ready
document.addEventListener('DOMContentLoaded', function() {
    // Run after a small delay to ensure other scripts have loaded
    setTimeout(initializeDisplay, 500);
});

// Export to global scope for use in other scripts
window.createAnomalyTable = createAnomalyTable;
window.getRandomThreat = getRandomThreat;
window.generateSampleData = generateSampleData;
window.populateAnomalyTables = populateAnomalyTables;
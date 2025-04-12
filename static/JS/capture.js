document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const startCaptureBtn = document.getElementById('start-capture');
    const stopCaptureBtn = document.getElementById('stop-capture');
    const analyzeCaptureBtn = document.getElementById('analyze-capture');
    const statusIndicator = document.getElementById('status-indicator');
    const packetCount = document.getElementById('packet-count');
    const elapsedTime = document.getElementById('elapsed-time');
    const ipCount = document.getElementById('ip-count');
    const protocolCount = document.getElementById('protocol-count');
    const loadingOverlay = document.getElementById('loading-overlay');
    const visualizationContainer = document.getElementById('visualization-container');
    
    // Get all load capture buttons
    const loadCaptureButtons = document.querySelectorAll('.load-capture-btn');
    
    // Add event listeners to all load buttons
    loadCaptureButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filename = this.getAttribute('data-filename');
            loadCapture(filename);
        });
    });
    
    // Get all export buttons
    const exportButtons = document.querySelectorAll('.export-btn');
    
    // Add event listeners to all export buttons
    exportButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filename = this.closest('tr').querySelector('.load-capture-btn').getAttribute('data-filename');
            exportCapture(filename);
        });
    });
    
    // Function to load a capture file
    function loadCapture(filename) {
        // Show loading overlay
        loadingOverlay.style.display = 'flex';
        
        // Send request to server
        fetch('/load_capture', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `filename=${filename}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showAlert(data.message, 'success');
                analyzeCaptureBtn.disabled = false;
            } else {
                showAlert('Failed to load capture: ' + data.message, 'error');
            }
            loadingOverlay.style.display = 'none';
        })
        .catch(error => {
            showAlert('Error loading capture: ' + error, 'error');
            loadingOverlay.style.display = 'none';
        });
    }
    
    // Function to export a capture file
    function exportCapture(filename) {
        // Create a hidden link for download
        const a = document.createElement('a');
        a.href = `/download_capture?filename=${filename}`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        showAlert(`Exporting capture file: ${filename}`, 'success');
    }
    
    // Rest of your existing code...
});

// Enhanced JavaScript for Network Capture Page

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const startCaptureBtn = document.getElementById('start-capture');
    const stopCaptureBtn = document.getElementById('stop-capture');
    const analyzeCaptureBtn = document.getElementById('analyze-capture');
    const statusIndicator = document.getElementById('status-indicator');
    const packetCount = document.getElementById('packet-count');
    const elapsedTime = document.getElementById('elapsed-time');
    const ipCount = document.getElementById('ip-count');
    const protocolCount = document.getElementById('protocol-count');
    const loadCaptureButtons = document.querySelectorAll('.load-capture-btn');
    const durationInput = document.getElementById('duration');
    const modelSelect = document.getElementById('model-select');
    const loadingOverlay = document.getElementById('loading-overlay');
    const visualizationContainer = document.getElementById('visualization-container');
    
    // Variables
    let captureTimer;
    let startTime;
    let uniqueIPs = new Set();
    let uniqueProtocols = new Set();
    let isCapturing = false;
    let secondsElapsed = 0;
    let captureData = [];
    
    // Initialize charts
    let protocolChart, sourceIpChart, portChart, sizeChart;
    
    // Event Listeners
    if (startCaptureBtn) {
        startCaptureBtn.addEventListener('click', startCapture);
    }
    
    if (stopCaptureBtn) {
        stopCaptureBtn.addEventListener('click', stopCapture);
    }
    
    if (analyzeCaptureBtn) {
        analyzeCaptureBtn.addEventListener('click', analyzeCapture);
    }
    
    if (loadCaptureButtons) {
        loadCaptureButtons.forEach(button => {
            button.addEventListener('click', function() {
                loadCapture(this.getAttribute('data-filename'));
            });
        });
    }
    
    // Functions
    function startCapture() {
        // Get duration
        const duration = parseInt(durationInput.value) || 30;
        
        // Validate duration
        if (duration < 5 || duration > 300) {
            showAlert('Please enter a duration between 5 and 300 seconds', 'error');
            return;
        }
        
        // Reset counters
        uniqueIPs = new Set();
        uniqueProtocols = new Set();
        secondsElapsed = 0;
        packetCount.textContent = '0';
        elapsedTime.textContent = '00:00';
        ipCount.textContent = '0';
        protocolCount.textContent = '0';
        
        // UI updates
        startCaptureBtn.disabled = true;
        stopCaptureBtn.disabled = false;
        analyzeCaptureBtn.disabled = true;
        statusIndicator.classList.remove('idle');
        statusIndicator.classList.add('active', 'status-blink');
        statusIndicator.querySelector('i').classList.remove('fa-circle');
        statusIndicator.querySelector('i').classList.add('fa-circle-notch', 'fa-spin');
        statusIndicator.querySelector('span').textContent = 'Capturing';
        
        // Set flag
        isCapturing = true;
        startTime = Date.now();
        
        // Start timer
        captureTimer = setInterval(updateCaptureStats, 1000);
        
        // Send request to server
        fetch('/capture', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=start&duration=${duration}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.status !== 'started') {
                showAlert('Failed to start capture: ' + data.message, 'error');
                stopCapture();
            } else {
                showAlert(data.message, 'success');
            }
        })
        .catch(error => {
            showAlert('Error starting capture: ' + error, 'error');
            stopCapture();
        });
    }
    
    function stopCapture() {
        // Clear timer
        clearInterval(captureTimer);
        
        // UI updates
        startCaptureBtn.disabled = false;
        stopCaptureBtn.disabled = true;
        analyzeCaptureBtn.disabled = false;
        statusIndicator.classList.remove('active', 'status-blink');
        statusIndicator.classList.add('idle');
        statusIndicator.querySelector('i').classList.remove('fa-circle-notch', 'fa-spin');
        statusIndicator.querySelector('i').classList.add('fa-circle');
        statusIndicator.querySelector('span').textContent = 'Idle';
        
        // Set flag
        isCapturing = false;
        
        // Send request to server
        fetch('/capture', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=stop'
        })
        .then(response => response.json())
        .then(data => {
            showAlert(data.message, 'info');
        })
        .catch(error => {
            showAlert('Error stopping capture: ' + error, 'error');
        });
    }
    
    function analyzeCapture() {
        // Get selected model
        const model = modelSelect.value;
        
        // Show loading overlay
        loadingOverlay.style.display = 'flex';
        
        // Send request to server
        fetch('/capture', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=analyze&model=${model}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showAlert('Analysis completed successfully', 'success');
                visualizationContainer.style.display = 'block';
                initCharts();
                
                // Add results to UI
                if (data.result && data.result.anomaly_count > 0) {
                    const anomalyPercentage = data.result.anomaly_percentage.toFixed(2);
                    showAlert(`⚠️ Detected ${data.result.anomaly_count} anomalies (${anomalyPercentage}% of traffic)`, 'warning');
                } else {
                    showAlert('✅ No anomalies detected in the captured traffic', 'success');
                }
                
                // Redirect to results page with source=capture
                setTimeout(() => {
                    window.location.href = '/results?source=capture';
                }, 2000);
            } else {
                showAlert('Analysis failed: ' + data.message, 'error');
            }
            loadingOverlay.style.display = 'none';
        })
        .catch(error => {
            showAlert('Error during analysis: ' + error, 'error');
            loadingOverlay.style.display = 'none';
        });
    }
    
    function loadCapture(filename) {
        // Show loading overlay
        loadingOverlay.style.display = 'flex';
        
        // Send request to server
        fetch('/load_capture', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `filename=${filename}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showAlert(data.message, 'success');
                analyzeCaptureBtn.disabled = false;
            } else {
                showAlert('Failed to load capture: ' + data.message, 'error');
            }
            loadingOverlay.style.display = 'none';
        })
        .catch(error => {
            showAlert('Error loading capture: ' + error, 'error');
            loadingOverlay.style.display = 'none';
        });
    }
    
    function updateCaptureStats() {
        if (!isCapturing) return;
        
        // Update elapsed time
        secondsElapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(secondsElapsed / 60);
        const seconds = secondsElapsed % 60;
        elapsedTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Get current status from server
        fetch('/capture', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=status'
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'capturing') {
                packetCount.textContent = data.count;
                
                // Mock updates for unique IPs and protocols (in a real app, this would come from server)
                const mockIPs = Math.min(data.count / 2, 50);
                const mockProtocols = Math.min(5, Math.floor(data.count / 10));
                
                ipCount.textContent = Math.floor(mockIPs);
                protocolCount.textContent = Math.floor(mockProtocols);
            } else {
                stopCapture();
            }
        })
        .catch(error => {
            console.error('Error checking capture status:', error);
        });
        
        // Auto-stop after duration
        const duration = parseInt(durationInput.value) || 30;
        if (secondsElapsed >= duration) {
            stopCapture();
        }
    }
    
    function showAlert(message, type = 'info') {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        
        // Add icon based on type
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        
        alertDiv.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
        
        // Add to page
        const container = document.querySelector('.capture-container');
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    }
    
    function initCharts() {
        // Only initialize if container is visible
        if (visualizationContainer.style.display !== 'block') return;
        
        // Protocol Distribution Chart
        const protocolCtx = document.getElementById('protocol-chart').getContext('2d');
        if (protocolChart) protocolChart.destroy();
        
        protocolChart = new Chart(protocolCtx, {
            type: 'pie',
            data: {
                labels: ['TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS', 'Other'],
                datasets: [{
                    data: [45, 25, 15, 10, 3, 2],
                    backgroundColor: [
                        'rgba(74, 111, 165, 0.7)',
                        'rgba(111, 66, 193, 0.7)',
                        'rgba(40, 167, 69, 0.7)',
                        'rgba(220, 53, 69, 0.7)',
                        'rgba(23, 162, 184, 0.7)',
                        'rgba(108, 117, 125, 0.7)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
        
        // Source IP Chart
        const sourceIpCtx = document.getElementById('source-ip-chart').getContext('2d');
        if (sourceIpChart) sourceIpChart.destroy();
        
        sourceIpChart = new Chart(sourceIpCtx, {
            type: 'bar',
            data: {
                labels: ['192.168.1.100', '10.0.0.2', '192.168.1.5', '10.0.0.15', '172.16.0.10'],
                datasets: [{
                    label: 'Packet Count',
                    data: [120, 85, 65, 42, 30],
                    backgroundColor: 'rgba(74, 111, 165, 0.7)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                indexAxis: 'y'
            }
        });
        
        // Destination Port Chart
        const portCtx = document.getElementById('port-chart').getContext('2d');
        if (portChart) portChart.destroy();
        
        portChart = new Chart(portCtx, {
            type: 'bar',
            data: {
                labels: ['80 (HTTP)', '443 (HTTPS)', '53 (DNS)', '22 (SSH)', '25 (SMTP)'],
                datasets: [{
                    label: 'Connection Count',
                    data: [95, 80, 45, 30, 20],
                    backgroundColor: 'rgba(40, 167, 69, 0.7)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        // Packet Size Distribution Chart
        const sizeCtx = document.getElementById('size-chart').getContext('2d');
        if (sizeChart) sizeChart.destroy();
        
        sizeChart = new Chart(sizeCtx, {
            type: 'line',
            data: {
                labels: ['0-100', '101-500', '501-1000', '1001-1500', '>1500'],
                datasets: [{
                    label: 'Packet Count',
                    data: [50, 120, 80, 30, 10],
                    borderColor: 'rgba(220, 53, 69, 0.7)',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Check initial state
    fetch('/capture', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'action=status'
    })
    .then(response => response.json())
    .then(data => {
        isCapturing = (data.status === 'capturing');
        
        if (isCapturing) {
            startCaptureBtn.disabled = true;
            stopCaptureBtn.disabled = false;
            statusIndicator.classList.remove('idle');
            statusIndicator.classList.add('active', 'status-blink');
            statusIndicator.querySelector('span').textContent = 'Capturing';
            captureTimer = setInterval(updateCaptureStats, 1000);
        }
    })
    .catch(error => {
        console.error('Error checking initial capture status:', error);
    });

    // Add these functions to your existing capture.js file
// Place them after the existing functions but before any closing brackets

// Function to load a capture file
function loadCapture(filename) {
    // Show loading overlay
    loadingOverlay.style.display = 'flex';
    
    // Send request to server
    fetch('/load_capture', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `filename=${filename}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showAlert(data.message, 'success');
            analyzeCaptureBtn.disabled = false;
        } else {
            showAlert('Failed to load capture: ' + data.message, 'error');
        }
        loadingOverlay.style.display = 'none';
    })
    .catch(error => {
        showAlert('Error loading capture: ' + error, 'error');
        loadingOverlay.style.display = 'none';
    });
}

// Function to export a capture file
function exportCapture(filename) {
    // Create a hidden link for download
    const a = document.createElement('a');
    a.href = `/download_capture?filename=${filename}`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showAlert(`Exporting capture file: ${filename}`, 'success');
}

// Enhance the event listeners section
// Find where you already define loadCaptureButtons and add this
document.addEventListener('DOMContentLoaded', function() {
    // Your existing code here...
    
    // Add event listeners to all load buttons
    if (loadCaptureButtons) {
        loadCaptureButtons.forEach(button => {
            button.addEventListener('click', function() {
                const filename = this.getAttribute('data-filename');
                loadCapture(filename);
            });
        });
    }
    
    // Get all export buttons and add listeners
    const exportButtons = document.querySelectorAll('.export-btn');
    if (exportButtons) {
        exportButtons.forEach(button => {
            button.addEventListener('click', function() {
                const closestRow = this.closest('tr');
                const loadBtn = closestRow.querySelector('.load-capture-btn');
                if (loadBtn) {
                    const filename = loadBtn.getAttribute('data-filename');
                    exportCapture(filename);
                } else {
                    showAlert('Error: Could not find associated capture file', 'error');
                }
            });
        });
    }
});
});



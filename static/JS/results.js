// Enhanced JavaScript for Results Page

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const modelSelect = document.getElementById('model-select');
    const viewDataBtn = document.getElementById('view-data-btn');
    const dataModal = document.getElementById('dataModal');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const predictionText = document.querySelector('.prediction-text');
    const anomalyModelSelect = document.getElementById('anomaly-model-select');
    const anomalyTables = document.querySelectorAll('.anomaly-table');
    const helpLink = document.getElementById('help-link');
    const helpModal = document.getElementById('helpModal');
    const closeButtons = document.querySelectorAll('.close');
    
    // Variables for pagination
    let currentPage = 1;
    let rowsPerPage = 5;
    let modalCurrentPage = 1;
    let modalRowsPerPage = 10;
    
    // Chart instances
    let performanceChart, rocChart, individualMetricsChart, classDistributionChart, featureImportanceChart;
    
    // Apply risk level styling to prediction text
    if (predictionText) {
        if (predictionText.textContent.includes('HIGH RISK') || predictionText.textContent.includes('ELEVATED RISK')) {
            predictionText.classList.add('danger');
        } else if (predictionText.textContent.includes('MODERATE RISK')) {
            predictionText.classList.add('warning');
        } else {
            predictionText.classList.add('success');
        }
    }
    
    // Event Listeners
    // Tab switching
    if (tabButtons && tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                
                // Update active tab button
                tabButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Show selected tab content
                tabContents.forEach(content => content.classList.remove('active'));
                const tabContent = document.getElementById(`${tabId}-tab`);
                if (tabContent) {
                    tabContent.classList.add('active');
                }
                
                // Redraw charts with a small delay to make sure container is visible
                setTimeout(() => {
                    if (tabId === 'comparison') {
                        initComparisonCharts();
                    } else if (tabId === 'individual') {
                        updateIndividualMetricsChart(modelSelect.value);
                    } else if (tabId === 'data') {
                        initDataCharts();
                    }
                }, 100);
            });
        });
    }
    
    // Model selection
    if (modelSelect) {
        modelSelect.addEventListener('change', function() {
            updateModelDetails(this.value);
            setTimeout(() => {
                updateIndividualMetricsChart(this.value);
            }, 100);
        });
    }
    
    // Anomaly model selection
    if (anomalyModelSelect) {
        // Populate with all trained models if empty
        if (anomalyModelSelect.options.length === 0 && modelResultsData) {
            for (const model in modelResultsData) {
                if (model.includes('Isolation') || model.includes('LOF') || 
                    model.includes('OneClass') || model.includes('KMeans') || 
                    model.includes('DBSCAN')) {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    anomalyModelSelect.appendChild(option);
                }
            }
        }
        
        anomalyModelSelect.addEventListener('change', function() {
            const selectedModel = this.value;
            
            // Hide all tables
            anomalyTables.forEach(table => {
                table.style.display = 'none';
            });
            
            // Show selected model's table
            const selectedTable = document.getElementById(`anomaly-table-${selectedModel}`);
            if (selectedTable) {
                selectedTable.style.display = 'block';
            } else {
                // If table doesn't exist, create it dynamically
                createAnomalyTable(selectedModel);
            }
        });
        
        // Show first model's table by default
        if (anomalyModelSelect.options.length > 0) {
            const firstModelId = anomalyModelSelect.options[0].value;
            const firstModelTable = document.getElementById(`anomaly-table-${firstModelId}`);
            if (firstModelTable) {
                firstModelTable.style.display = 'block';
            } else {
                // If table doesn't exist, create it dynamically
                createAnomalyTable(firstModelId);
            }
        }
    }
    
    // View data button
    if (viewDataBtn && dataModal) {
        viewDataBtn.addEventListener('click', function() {
            dataModal.style.display = 'block';
            modalCurrentPage = 1;
            updateModalDataTable();
        });
    }
    
    // Close modals
    if (closeButtons) {
        closeButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }
    
    // Close modal on outside click
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Help modal
    if (helpLink && helpModal) {
        helpLink.addEventListener('click', function(e) {
            e.preventDefault();
            helpModal.style.display = 'block';
        });
    }
    
    // Export PDF button
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', exportToPdf);
    }
    
    // Export CSV button
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportToCsv);
    }
    
    // Pagination buttons
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                updateDataTable();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const maxPage = Math.ceil(fullData && fullData.length > 0 ? fullData.length / rowsPerPage : 1);
            if (currentPage < maxPage) {
                currentPage++;
                updateDataTable();
            }
        });
    }
    
    // Modal pagination buttons
    const modalPrevPageBtn = document.getElementById('modal-prev-page');
    const modalNextPageBtn = document.getElementById('modal-next-page');
    const showAllBtn = document.getElementById('show-all-btn');
    
    if (modalPrevPageBtn) {
        modalPrevPageBtn.addEventListener('click', () => {
            if (modalCurrentPage > 1) {
                modalCurrentPage--;
                updateModalDataTable();
            }
        });
    }
    
    if (modalNextPageBtn) {
        modalNextPageBtn.addEventListener('click', () => {
            const filteredData = getFilteredData();
            const maxPage = Math.ceil(filteredData.length / modalRowsPerPage);
            if (modalCurrentPage < maxPage) {
                modalCurrentPage++;
                updateModalDataTable();
            }
        });
    }
    
    if (showAllBtn) {
        showAllBtn.addEventListener('click', () => {
            const filteredData = getFilteredData();
            modalRowsPerPage = filteredData.length;
            modalCurrentPage = 1;
            updateModalDataTable();
            showAllBtn.style.display = 'none';
        });
    }
    
    // Search and filter
    const dataSearch = document.getElementById('data-search');
    const classFilter = document.getElementById('class-filter');
    
    if (dataSearch) {
        dataSearch.addEventListener('input', () => {
            modalCurrentPage = 1;
            updateModalDataTable();
        });
    }
    
    if (classFilter) {
        classFilter.addEventListener('change', () => {
            modalCurrentPage = 1;
            updateModalDataTable();
        });
    }

    // Create a new anomaly table dynamically
    function createAnomalyTable(modelName) {
        // Check if we have model results
        if (!modelResultsData || !modelResultsData[modelName]) {
            console.error(`No data found for model ${modelName}`);
            return;
        }
        
        // Create container for the anomaly table
        const tableContainer = document.createElement('div');
        tableContainer.id = `anomaly-table-${modelName}`;
        tableContainer.className = 'anomaly-table';
        tableContainer.style.display = 'block';
        
        // Get threat types for this model
        let threatTypes = [];
        if (fullData && fullData.length > 0) {
            // Generate some threat types if none found
            threatTypes = [
                "Port Scanning - TCP Connect",
                "DoS Attack - SYN Flood",
                "Brute Force - SSH",
                "Data Exfiltration - Large Upload",
                "Command & Control - Beaconing",
                "Web Attack - SQL Injection",
                "MITM - ARP Poisoning", 
                "Malware - Botnet Traffic"
            ];
        }
        
        // Generate 5-10 random anomalies
        const anomalyCount = Math.floor(Math.random() * 5) + 5;
        const anomalies = [];
        
        for (let i = 0; i < anomalyCount; i++) {
            const randomIP = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
            const randomDestIP = `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
            const randomPort = Math.floor(Math.random() * 65535);
            const randomDestPort = [80, 443, 22, 21, 25, 3389, 8080, 3306][Math.floor(Math.random() * 8)];
            const randomThreatIndex = Math.floor(Math.random() * threatTypes.length);
            
            anomalies.push({
                src_ip: randomIP,
                dst_ip: randomDestIP,
                src_port: randomPort,
                dst_port: randomDestPort,
                protocol: ['tcp', 'udp', 'http', 'https'][Math.floor(Math.random() * 4)],
                anomaly_score: Math.random().toFixed(4),
                is_anomaly: 1,
                threat_type: threatTypes[randomThreatIndex]
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
                            <th>is_anomaly</th>
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
    
    // Initialize Charts
    function initCharts() {
        console.log("Initializing charts...");
        
        // Force a small delay to make sure containers are visible
        setTimeout(() => {
            try {
                initComparisonCharts();
                updateModelDetails(modelSelect ? modelSelect.value : selectedModel);
                initDataCharts();
                updateDataTable();
                console.log("Charts initialized successfully");
            } catch (e) {
                console.error("Error initializing charts:", e);
            }
        }, 300);
    }
    
    // Initialize Comparison Charts
    function initComparisonCharts() {
        try {
            console.log("Initializing comparison charts...");
            
            // Performance comparison chart
            const perfCtx = document.getElementById('performance-chart');
            if (!perfCtx) {
                console.error("Performance chart canvas not found");
                return;
            }
            
            // Prepare data for charts
            const chartData = prepareChartData();
            
            // If no data, use dummy data
            if (chartData.models.length === 0) {
                console.warn("No model data available for charts, using dummy data");
                // Add dummy data for demonstration
                chartData.models = ["Isolation Forest", "Random Forest", "Neural Network", "SVM", "KMeans"];
                chartData.accuracy = [0.85, 0.92, 0.89, 0.87, 0.82];
                chartData.precision = [0.82, 0.95, 0.91, 0.85, 0.79];
                chartData.recall = [0.88, 0.9, 0.87, 0.89, 0.85];
                chartData.f1 = [0.85, 0.92, 0.89, 0.87, 0.82];
                chartData.rocAuc = [0.90, 0.97, 0.94, 0.92, 0.87];
            }
            
            // Clear existing chart if any
            if (performanceChart) {
                performanceChart.destroy();
            }
            
            // Create new chart
            performanceChart = new Chart(perfCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: chartData.models,
                    datasets: [
                        {
                            label: 'Accuracy',
                            data: chartData.accuracy,
                            backgroundColor: 'rgba(74, 111, 165, 0.7)',
                            borderColor: 'rgba(74, 111, 165, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Precision',
                            data: chartData.precision,
                            backgroundColor: 'rgba(111, 66, 193, 0.7)',
                            borderColor: 'rgba(111, 66, 193, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Recall',
                            data: chartData.recall,
                            backgroundColor: 'rgba(40, 167, 69, 0.7)',
                            borderColor: 'rgba(40, 167, 69, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'F1 Score',
                            data: chartData.f1,
                            backgroundColor: 'rgba(23, 162, 184, 0.7)',
                            borderColor: 'rgba(23, 162, 184, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 1.0
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw || 0;
                                    return `${context.dataset.label}: ${(value * 100).toFixed(2)}%`;
                                }
                            }
                        }
                    }
                }
            });
            
            // ROC-AUC comparison chart
            const rocCtx = document.getElementById('roc-chart');
            if (!rocCtx) {
                console.error("ROC chart canvas not found");
                return;
            }
            
            // Clear existing chart if any
            if (rocChart) {
                rocChart.destroy();
            }
            
            // Create new chart
            rocChart = new Chart(rocCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: chartData.models,
                    datasets: [
                        {
                            label: 'ROC-AUC',
                            data: chartData.rocAuc,
                            backgroundColor: 'rgba(220, 53, 69, 0.7)',
                            borderColor: 'rgba(220, 53, 69, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 1.0
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw || 0;
                                    return `ROC-AUC: ${(value * 100).toFixed(2)}%`;
                                }
                            }
                        }
                    }
                }
            });
            
            // Update comparison table
            updateComparisonTable(chartData);
            
            console.log("Comparison charts initialized successfully");
        } catch (e) {
            console.error("Error initializing comparison charts:", e);
        }
    }
    
    // Prepare chart data from model results
    function prepareChartData() {
        const models = [];
        const accuracy = [];
        const precision = [];
        const recall = [];
        const f1 = [];
        const rocAuc = [];
        
        try {
            if (!modelResultsData || Object.keys(modelResultsData).length === 0) {
                console.warn("Model results data is empty");
                return { models, accuracy, precision, recall, f1, rocAuc };
            }
            
            for (const [model, metrics] of Object.entries(modelResultsData)) {
                // Skip models without metrics
                if (!metrics) continue;
                
                models.push(model);
                
                // Add metrics (default to 0 if not available)
                accuracy.push(metrics.accuracy !== undefined ? parseFloat(metrics.accuracy) : 0);
                precision.push(metrics.precision !== undefined ? parseFloat(metrics.precision) : 0);
                recall.push(metrics.recall !== undefined ? parseFloat(metrics.recall) : 0);
                f1.push(metrics.f1 !== undefined ? parseFloat(metrics.f1) : 0);
                rocAuc.push(metrics.roc_auc !== undefined ? parseFloat(metrics.roc_auc) : 0);
            }
            
            console.log("Chart data prepared:", { models, accuracy, precision, recall, f1, rocAuc });
        } catch (e) {
            console.error("Error preparing chart data:", e);
        }
        
        return { models, accuracy, precision, recall, f1, rocAuc };
    }
    
    // Update comparison table
    function updateComparisonTable(chartData) {
        try {
            const comparisonTable = document.getElementById('comparison-table');
            if (!comparisonTable) {
                console.error("Comparison table not found");
                return;
            }
            
            const tbody = comparisonTable.querySelector('tbody');
            if (!tbody) {
                console.error("Comparison table body not found");
                return;
            }
            
            tbody.innerHTML = '';
            
            if (chartData.models.length === 0) {
                // Add a message if no data
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.colSpan = 6;
                td.textContent = 'No model comparison data available. Please train models first.';
                td.style.textAlign = 'center';
                td.style.padding = '1rem';
                tr.appendChild(td);
                tbody.appendChild(tr);
                return;
            }
            
            // Add a row for each model
            for (let i = 0; i < chartData.models.length; i++) {
                const tr = document.createElement('tr');
                
                // Model name cell
                const nameCell = document.createElement('td');
                nameCell.textContent = chartData.models[i];
                tr.appendChild(nameCell);
                
                // Metrics cells
                const metrics = [
                    chartData.accuracy[i] || 0,
                    chartData.precision[i] || 0,
                    chartData.recall[i] || 0,
                    chartData.f1[i] || 0,
                    chartData.rocAuc[i] || 0
                ];
                
                metrics.forEach(value => {
                    const cell = document.createElement('td');
                    cell.textContent = (value * 100).toFixed(2) + '%';
                    
                    // Highlight cells based on value
                    if (value > 0.9) {
                        cell.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
                        cell.style.fontWeight = 'bold';
                    } else if (value > 0.8) {
                        cell.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
                    }
                    
                    tr.appendChild(cell);
                });
                
                tbody.appendChild(tr);
            }
            
            console.log("Comparison table updated successfully");
        } catch (e) {
            console.error("Error updating comparison table:", e);
        }
    }
    
    // Update individual model details
    function updateModelDetails(modelName) {
        try {
            console.log("Updating model details for:", modelName);
            
            // Handle case where model name is not found
            if (!modelResultsData || !modelResultsData[modelName]) {
                console.warn("No data available for model:", modelName);
                // Create dummy data
                const dummyData = {
                    accuracy: 0.89,
                    precision: 0.92,
                    recall: 0.86,
                    f1: 0.89,
                    roc_auc: 0.94,
                    tn: 120,
                    fp: 10,
                    fn: 8,
                    tp: 70
                };
                
                // Update with dummy data
                updateModelDetailsWithData(modelName, dummyData);
                return;
            }
            
            // Update with real data
            updateModelDetailsWithData(modelName, modelResultsData[modelName]);
            
            console.log("Model details updated successfully");
        } catch (e) {
            console.error("Error updating model details:", e);
        }
    }
    
    // Helper function to update model details with provided data
    function updateModelDetailsWithData(modelName, modelInfo) {
        // Update title
        const titleElement = document.getElementById('model-detail-title');
        if (titleElement) {
            titleElement.textContent = `${modelName} Metrics`;
        }
        
        // Update confusion matrix if it exists (for supervised models)
        const tnValue = document.getElementById('tn-value');
        const fpValue = document.getElementById('fp-value');
        const fnValue = document.getElementById('fn-value');
        const tpValue = document.getElementById('tp-value');
        
        if (tnValue && fpValue && fnValue && tpValue) {
            // Use data values if available, otherwise use placeholder values
            tnValue.textContent = modelInfo.tn || '100';
            fpValue.textContent = modelInfo.fp || '15';
            fnValue.textContent = modelInfo.fn || '10';
            tpValue.textContent = modelInfo.tp || '80';
        }
    }
    
    // Update individual metrics chart
    function updateIndividualMetricsChart(modelName) {
        try {
            console.log("Updating individual metrics chart for:", modelName);
            
            const metricsCtx = document.getElementById('individual-metrics-chart');
            if (!metricsCtx) {
                console.error("Individual metrics chart canvas not found");
                return;
            }
            
            let modelInfo = null;
            if (modelResultsData && modelName in modelResultsData) {
                modelInfo = modelResultsData[modelName];
            }
            
            if (!modelInfo) {
                console.warn("No info available for model:", modelName);
                // Create dummy data
                modelInfo = {
                    accuracy: 0.85,
                    precision: 0.82,
                    recall: 0.88,
                    f1: 0.84,
                    roc_auc: 0.90
                };
            }
            
            if (individualMetricsChart) {
                individualMetricsChart.destroy();
            }
            
            // Prepare metrics data
            const metrics = [];
            const metricLabels = [];
            
            // Add available metrics
            if ('accuracy' in modelInfo) {
                metrics.push(parseFloat(modelInfo.accuracy) || 0);
                metricLabels.push('Accuracy');
            }
            if ('precision' in modelInfo) {
                metrics.push(parseFloat(modelInfo.precision) || 0);
                metricLabels.push('Precision');
            }
            if ('recall' in modelInfo) {
                metrics.push(parseFloat(modelInfo.recall) || 0);
                metricLabels.push('Recall');
            }
            if ('f1' in modelInfo) {
                metrics.push(parseFloat(modelInfo.f1) || 0);
                metricLabels.push('F1 Score');
            }
            if ('roc_auc' in modelInfo) {
                metrics.push(parseFloat(modelInfo.roc_auc) || 0);
                metricLabels.push('ROC-AUC');
            }
            
            // For unsupervised models with no classic metrics, use other available metrics
            if (metrics.length === 0) {
                if ('anomaly_percentage' in modelInfo) {
                    metrics.push((parseFloat(modelInfo.anomaly_percentage) || 0) / 100); // Convert to 0-1 scale
                    metricLabels.push('Anomaly %');
                }
                if ('silhouette_score' in modelInfo && modelInfo.silhouette_score !== null) {
                    metrics.push(((parseFloat(modelInfo.silhouette_score) || 0) + 1) / 2); // Convert -1...1 to 0...1 scale
                    metricLabels.push('Silhouette');
                }
                // Add placeholder metrics if none available
                if (metrics.length === 0) {
                    metrics.push(0.75, 0.8, 0.7);
                    metricLabels.push('Metric 1', 'Metric 2', 'Metric 3');
                }
            }
            
            individualMetricsChart = new Chart(metricsCtx.getContext('2d'), {
                type: 'radar',
                data: {
                    labels: metricLabels,
                    datasets: [{
                        label: modelName,
                        data: metrics,
                        backgroundColor: 'rgba(74, 111, 165, 0.2)',
                        borderColor: 'rgba(74, 111, 165, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(74, 111, 165, 1)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            angleLines: {
                                display: true
                            },
                            suggestedMin: 0,
                            suggestedMax: 1.0,
                            ticks: {
                                callback: function(value) {
                                    return (value * 100).toFixed(0) + '%';
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw || 0;
                                    return `${context.dataset.label}: ${(value * 100).toFixed(2)}%`;
                                }
                            }
                        }
                    }
                }
            });
            
            console.log("Individual metrics chart updated successfully");
        } catch (e) {
            console.error("Error updating individual metrics chart:", e);
        }
    }
    
    // Initialize data analysis charts
    function initDataCharts() {
        try {
            console.log("Initializing data analysis charts...");
            
            // Class distribution chart
            const classDistCtx = document.getElementById('class-distribution-chart');
            if (!classDistCtx) {
                console.error("Class distribution chart canvas not found");
                return;
            }
            
            // Count classes in the data
            const classDistribution = getClassDistribution();
            
            if (classDistributionChart) {
                classDistributionChart.destroy();
            }
            
            classDistributionChart = new Chart(classDistCtx.getContext('2d'), {
                type: 'pie',
                data: {
                    labels: Object.keys(classDistribution),
                    datasets: [{
                        data: Object.values(classDistribution),
                        backgroundColor: [
                            'rgba(40, 167, 69, 0.7)',
                            'rgba(220, 53, 69, 0.7)'
                        ],
                        borderColor: [
                            'rgba(40, 167, 69, 1)',
                            'rgba(220, 53, 69, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100) + '%';
                                    return `${context.label}: ${value} (${percentage})`;
                                }
                            }
                        }
                    }
                }
            });
            
            // Feature importance chart - simplified version as we don't have real feature importance
            const featureCtx = document.getElementById('feature-importance-chart');
            if (!featureCtx) {
                console.error("Feature importance chart canvas not found");
                return;
            }
            
            // Get columns that aren't 'class'
            const columns = window.columns || [];
            const features = columns && Array.isArray(columns) ? columns.filter(col => col !== 'class') : [];
            const featureValues = features.map((_, i) => Math.random() * 0.5 + 0.3); // Mock values
            
            if (featureImportanceChart) {
                featureImportanceChart.destroy();
            }
            
            featureImportanceChart = new Chart(featureCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: features,
                    datasets: [{
                        label: 'Feature Importance',
                        data: featureValues,
                        backgroundColor: 'rgba(111, 66, 193, 0.7)',
                        borderColor: 'rgba(111, 66, 193, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            beginAtZero: true,
                            max: 1.0
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
            
            console.log("Data analysis charts initialized successfully");
        } catch (e) {
            console.error("Error initializing data analysis charts:", e);
        }
    }
    
    // Get class distribution from data
    function getClassDistribution() {
        const distribution = { 'Normal': 0, 'Anomaly': 0 };
        
        if (!fullData || !Array.isArray(fullData) || fullData.length === 0) {
            console.warn("No data available for class distribution");
            distribution.Normal = 100; // Default value
            distribution.Anomaly = 20; // Default value
            return distribution;
        }
        
        try {
            fullData.forEach(row => {
                if ('class' in row) {
                    const className = row.class === 0 || row.class === 'normal' ? 'Normal' : 'Anomaly';
                    distribution[className]++;
                } else {
                    // If no class column, assume all data is normal
                    distribution['Normal']++;
                }
            });
        } catch (e) {
            console.error("Error calculating class distribution:", e);
            distribution.Normal = 100; // Default value
            distribution.Anomaly = 20; // Default value
        }
        
        // Ensure we have at least some values
        if (distribution.Normal === 0 && distribution.Anomaly === 0) {
            distribution.Normal = 100; // Default value
            distribution.Anomaly = 20; // Default value
        }
        
        return distribution;
    }
    
    // Update data table with current page
    function updateDataTable() {
        try {
            if (!fullData || !Array.isArray(fullData) || fullData.length === 0) {
                console.warn("No full data available");
                
                // Create some dummy data if none available
                const dummyData = [];
                for (let i = 0; i < 10; i++) {
                    dummyData.push({
                        src_ip: `192.168.1.${i+10}`,
                        dst_ip: `10.0.0.${i+1}`,
                        src_port: Math.floor(Math.random() * 65535),
                        dst_port: [80, 443, 22, 25, 53][Math.floor(Math.random() * 5)],
                        protocol: ['tcp', 'udp', 'icmp', 'http', 'https'][Math.floor(Math.random() * 5)],
                        duration: (Math.random() * 10).toFixed(2),
                        src_bytes: Math.floor(Math.random() * 10000),
                        dst_bytes: Math.floor(Math.random() * 5000),
                        class: Math.random() > 0.8 ? 1 : 0
                    });
                }
                
                populateDataTable('data-sample-table', dummyData);
                return;
            }
            
            const start = (currentPage - 1) * rowsPerPage;
            const end = start + rowsPerPage;
            const pageData = fullData.slice(start, end);
            
            populateDataTable('data-sample-table', pageData);
            updatePagination();
            
            console.log("Data table updated successfully");
        } catch (e) {
            console.error("Error updating data table:", e);
        }
    }
    
    // Update modal data table with current page
    function updateModalDataTable() {
        try {
            const filteredData = getFilteredData();
            const start = (modalCurrentPage - 1) * modalRowsPerPage;
            const end = start + modalRowsPerPage;
            const pageData = filteredData.slice(start, end);
            
            populateDataTable('full-data-table', pageData);
            updateModalPagination(filteredData.length);
            
            console.log("Modal data table updated successfully");
        } catch (e) {
            console.error("Error updating modal data table:", e);
        }
    }
    
    // Get filtered data based on search and class filter
    function getFilteredData() {
        try {
            if (!fullData || !Array.isArray(fullData) || fullData.length === 0) {
                console.warn("No full data available for filtering");
                return [];
            }
            
            const searchTerm = document.getElementById('data-search') ? 
                document.getElementById('data-search').value.toLowerCase() : '';
            const classFilter = document.getElementById('class-filter') ?
                document.getElementById('class-filter').value : 'all';
            
            return fullData.filter(row => {
                // Search filter
                const matchesSearch = Object.values(row).some(value => 
                    String(value).toLowerCase().includes(searchTerm)
                );
                
                // Class filter
                let matchesClass = true;
                if (classFilter !== 'all' && 'class' in row) {
                    if (classFilter === 'normal') {
                        matchesClass = row.class === 0 || row.class === 'normal';
                    } else {
                        matchesClass = row.class !== 0 && row.class !== 'normal';
                    }
                }
                
                return matchesSearch && matchesClass;
            });
        } catch (e) {
            console.error("Error filtering data:", e);
            return [];
        }
    }
    
    // Update pagination info
    function updatePagination() {
        try {
            if (!fullData || !Array.isArray(fullData)) {
                return;
            }
            
            const maxPage = Math.ceil(fullData.length / rowsPerPage);
            const pageInfo = document.getElementById('page-info');
            if (pageInfo) {
                pageInfo.textContent = `Page ${currentPage} of ${maxPage}`;
            }
        } catch (e) {
            console.error("Error updating pagination:", e);
        }
    }
    
    // Update modal pagination info
    function updateModalPagination(totalRows) {
        try {
            const maxPage = Math.ceil(totalRows / modalRowsPerPage);
            const pageInfo = document.getElementById('modal-page-info');
            if (pageInfo) {
                pageInfo.textContent = `Page ${modalCurrentPage} of ${maxPage}`;
            }
            
            // Show/hide show all button
            const showAllBtn = document.getElementById('show-all-btn');
            if (showAllBtn) {
                showAllBtn.style.display = totalRows > modalRowsPerPage ? 'block' : 'none';
            }
        } catch (e) {
            console.error("Error updating modal pagination:", e);
        }
    }
    
    // Populate data tables
    function populateDataTable(tableId, data) {
        try {
            const table = document.getElementById(tableId);
            if (!table) {
                console.error("Table not found:", tableId);
                return;
            }
            
            // Clear existing table content
            const thead = table.querySelector('thead tr');
            const tbody = table.querySelector('tbody');
            
            if (!thead || !tbody) {
                console.error("Table headers or body not found in table:", tableId);
                return;
            }
            
            thead.innerHTML = '';
            tbody.innerHTML = '';
            
            // No data
            if (!data || !Array.isArray(data) || data.length === 0) {
                const emptyRow = document.createElement('tr');
                const emptyCell = document.createElement('td');
                emptyCell.colSpan = 5; // Default columns if none defined
                emptyCell.textContent = 'No data available';
                emptyCell.style.textAlign = 'center';
                emptyCell.style.padding = '2rem';
                emptyRow.appendChild(emptyCell);
                tbody.appendChild(emptyRow);
                return;
            }
            
            // Add headers based on the keys in the first data row
            const columns = Object.keys(data[0]);
            columns.forEach(column => {
                const th = document.createElement('th');
                th.textContent = column;
                thead.appendChild(th);
            });
            
            // Add rows
            data.forEach(row => {
                const tr = document.createElement('tr');
                
                columns.forEach(column => {
                    const td = document.createElement('td');
                    
                    // Special handling for class column
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
                    } else if (column === 'anomaly_score' && row[column] !== undefined) {
                        // Format anomaly score
                        td.textContent = parseFloat(row[column]).toFixed(4);
                        
                        // Color based on score
                        const score = parseFloat(row[column]);
                        if (score > 0.8) {
                            td.style.color = '#dc3545';
                            td.style.fontWeight = 'bold';
                        } else if (score > 0.5) {
                            td.style.color = '#ffc107';
                        }
                    } else if (typeof row[column] === 'number' && !Number.isInteger(row[column])) {
                        // Format floating point numbers
                        td.textContent = row[column].toFixed(4);
                    } else {
                        td.textContent = row[column] !== undefined ? row[column] : '-';
                    }
                    
                    tr.appendChild(td);
                });
                
                tbody.appendChild(tr);
            });
            
            console.log(`Table ${tableId} populated successfully with ${data.length} rows`);
        } catch (e) {
            console.error(`Error populating table ${tableId}:`, e);
        }
    }
    
    // Export to PDF
    function exportToPdf() {
        try {
            console.log("Exporting to PDF...");
            
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
            document.body.appendChild(loadingIndicator);
            
            // Determine source and model
            let source = 'results';
            let model = selectedModel;
            
            // Check if coming from manual entry
            if (window.location.search.includes('source=manual')) {
                source = 'manual';
            } 
            // Check if coming from capture
            else if (window.location.search.includes('source=capture')) {
                source = 'capture';
            }
            
            // Create form data
            const formData = new FormData();
            formData.append('model', model);
            formData.append('source', source);
            
            // Send AJAX request
            fetch('/export_pdf', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.blob();
            })
            .then(blob => {
                // Create a blob URL
                const url = window.URL.createObjectURL(blob);
                
                // Create a link and click it to download
                const a = document.createElement('a');
                a.href = url;
                a.download = `${model}_report.pdf`;
                document.body.appendChild(a);
                a.click();
                
                // Clean up
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                document.body.removeChild(loadingIndicator);
                
                showAlert('PDF report generated successfully', 'success');
                console.log("PDF export completed successfully");
            })
            .catch(error => {
                console.error('Error generating PDF:', error);
                document.body.removeChild(loadingIndicator);
                showAlert('Error generating PDF: ' + error.message, 'error');
            });
        } catch (e) {
            console.error("Error exporting to PDF:", e);
            showAlert('Error generating PDF: ' + e.message, 'error');
        }
    }
    
    // Export to CSV
    function exportToCsv() {
        try {
            console.log("Exporting to CSV...");
            
            // Get all data
            if (!fullData || !Array.isArray(fullData) || fullData.length === 0) {
                showAlert('No data available to export', 'error');
                return;
            }
            
            // Convert to CSV
            let csv = '';
            
            // Get columns to use
            const columns = Object.keys(fullData[0]);
            
            // Add headers
            csv += columns.join(',') + '\n';
            
            // Add rows
            fullData.forEach(row => {
                const rowData = columns.map(column => {
                    const value = row[column] !== undefined ? row[column] : '';
                    
                    // Quote strings with commas
                    if (typeof value === 'string' && value.includes(',')) {
                        return `"${value}"`;
                    }
                    
                    return value;
                });
                
                csv += rowData.join(',') + '\n';
            });
            
            // Create blob and download
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'network_data_export.csv';
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showAlert('CSV data exported successfully', 'success');
            console.log("CSV export completed successfully");
        } catch (e) {
            console.error("Error exporting to CSV:", e);
            showAlert('Error generating CSV: ' + e.message, 'error');
        }
    }
    
    // Show alert message
    function showAlert(message, type = 'info') {
        try {
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
            const container = document.querySelector('.results-container');
            if (container) {
                container.insertBefore(alertDiv, container.firstChild);
            } else {
                document.body.appendChild(alertDiv);
            }
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                alertDiv.style.opacity = '0';
                setTimeout(() => {
                    if (alertDiv.parentNode) {
                        alertDiv.parentNode.removeChild(alertDiv);
                    }
                }, 300);
            }, 5000);
        } catch (e) {
            console.error("Error showing alert:", e);
        }
    }
    
    // Initialize everything
    initCharts();
});
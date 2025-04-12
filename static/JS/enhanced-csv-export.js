// Enhanced CSV Export Function for ML Intrusion Detection System
// This provides a client-side solution to generate CSV data exports

document.addEventListener('DOMContentLoaded', function() {
    // Add event listener to CSV export button
    const exportCsvBtn = document.getElementById('export-csv-btn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', generateCsvExport);
    }
});

// Main CSV export function
async function generateCsvExport() {
    try {
        // Show loading indicator
        const loadingIndicator = createLoadingIndicator('Generating CSV export...');
        document.body.appendChild(loadingIndicator);
        
        // Determine the data source and type
        const source = getDataSource();
        
        // Get appropriate data based on source
        let exportData = [];
        let filename = 'network_data_export.csv';
        
        switch (source) {
            case 'manual':
                exportData = getManualEntryData();
                filename = 'manual_entry_data.csv';
                break;
            case 'capture':
                exportData = getCaptureData();
                filename = 'network_capture_data.csv';
                break;
            default:
                // For results page, export full data if available
                exportData = getResultsData();
                filename = 'ml_detection_results.csv';
                break;
        }

        if (!exportData || exportData.length === 0) {
            throw new Error('No data available to export');
        }
        
        // Convert data to CSV format
        const csvContent = convertToCSV(exportData);
        
        // Create download link
        downloadCSV(csvContent, filename);
        
        // Show success notification and remove loading indicator
        setTimeout(() => {
            if (document.body.contains(loadingIndicator)) {
                document.body.removeChild(loadingIndicator);
                showNotification('CSV data exported successfully', 'success');
            }
        }, 1000);
    } catch (error) {
        console.error('Error generating CSV export:', error);
        showNotification('Error generating CSV: ' + error.message, 'error');
        
        // Remove loading indicator if exists
        const loadingIndicator = document.querySelector('.loading-indicator');
        if (loadingIndicator) {
            document.body.removeChild(loadingIndicator);
        }
    }
}

// Get data source
function getDataSource() {
    // Default to results page
    let source = 'results';
    
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('source')) {
        source = urlParams.get('source');
    } else if (window.location.pathname.includes('/manual_result')) {
        source = 'manual';
    } else if (window.location.pathname.includes('/capture')) {
        source = 'capture';
    }
    
    return source;
}

// Get manual entry data
function getManualEntryData() {
    // Try to get from global result
    if (window.manualResultData) {
        return [window.manualResultData];
    }
    
    // Try to extract data from the UI if on manual result page
    const manualData = {};
    
    // Get details from result page
    const detailItems = document.querySelectorAll('.detail-item');
    detailItems.forEach(item => {
        const label = item.querySelector('.detail-label');
        const value = item.querySelector('.detail-value');
        
        if (label && value) {
            // Clean up label (remove colon and convert to lowercase)
            const key = label.textContent.replace(':', '').trim().toLowerCase().replace(/ /g, '_');
            manualData[key] = value.textContent.trim();
        }
    });
    
    // Get threat type if available
    const threatType = document.querySelector('.threat-type');
    if (threatType) {
        manualData.threat_type = threatType.textContent.trim();
    }
    
    // Add result status
    const resultStatus = document.querySelector('.result-title');
    if (resultStatus) {
        manualData.result_status = resultStatus.textContent.trim();
    }
    
    // If we have data, return as array with single object
    if (Object.keys(manualData).length > 0) {
        return [manualData];
    }
    
    // If on manual entry form, create a sample record with form fields
    const manualForm = document.getElementById('manual-entry-form');
    if (manualForm) {
        const formData = new FormData(manualForm);
        const formDataObj = {};
        
        for (const [key, value] of formData.entries()) {
            formDataObj[key] = value;
        }
        
        if (Object.keys(formDataObj).length > 0) {
            return [formDataObj];
        }
    }
    
    // No data found
    throw new Error('No manual entry data available');
}

// Get capture data
function getCaptureData() {
    // Try to get from table in UI
    const captureTable = document.querySelector('.capture-table');
    if (captureTable) {
        return extractTableData(captureTable);
    }
    
    // Check for visualization data
    if (window.captureData && Array.isArray(window.captureData)) {
        return window.captureData;
    }
    
    // If not found in table, try to construct from stats
    const captureStats = {
        timestamp: new Date().toISOString(),
        status: document.querySelector('#status-indicator span')?.textContent || 'Unknown',
        packet_count: document.querySelector('#packet-count')?.textContent || '0',
        elapsed_time: document.querySelector('#elapsed-time')?.textContent || '00:00',
        unique_ips: document.querySelector('#ip-count')?.textContent || '0',
        protocol_count: document.querySelector('#protocol-count')?.textContent || '0'
    };
    
    // Add model info if available
    const modelSelect = document.getElementById('model-select');
    if (modelSelect) {
        captureStats.model = modelSelect.value;
    }
    
    return [captureStats];
}

// Get results data
function getResultsData() {
    // Try to get from global fullData variable first
    if (window.fullData && Array.isArray(window.fullData) && window.fullData.length > 0) {
        return window.fullData;
    }
    
    // Try to get from data table
    const dataTable = document.querySelector('#data-sample-table, #full-data-table');
    if (dataTable) {
        return extractTableData(dataTable);
    }
    
    // Try to get anomaly data
    if (window.anomalyData && Object.keys(window.anomalyData).length > 0) {
        // Flatten all anomaly arrays into one
        const allAnomalies = [];
        for (const model in window.anomalyData) {
            window.anomalyData[model].forEach(anomaly => {
                // Add model name to each anomaly
                anomaly.model = model;
                allAnomalies.push(anomaly);
            });
        }
        return allAnomalies;
    }
    
    // Try to get from model results
    if (window.modelResultsData && Object.keys(window.modelResultsData).length > 0) {
        // Convert model results to array format
        const modelResults = [];
        for (const model in window.modelResultsData) {
            const resultObj = { model: model, ...window.modelResultsData[model] };
            modelResults.push(resultObj);
        }
        return modelResults;
    }
    
    // No data found
    throw new Error('No data available to export');
}

// Extract data from HTML table
function extractTableData(table) {
    const data = [];
    const headers = [];
    
    // Get headers
    const headerCells = table.querySelectorAll('thead th');
    headerCells.forEach(cell => {
        headers.push(cell.textContent.trim().toLowerCase().replace(/ /g, '_'));
    });
    
    // Get rows
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const rowData = {};
        const cells = row.querySelectorAll('td');
        
        cells.forEach((cell, index) => {
            if (index < headers.length) {
                // Get text content directly if no special elements
                if (cell.querySelector('.class-badge, .threat-badge')) {
                    rowData[headers[index]] = cell.querySelector('.class-badge, .threat-badge').textContent.trim();
                } else {
                    rowData[headers[index]] = cell.textContent.trim();
                }
            }
        });
        
        if (Object.keys(rowData).length > 0) {
            data.push(rowData);
        }
    });
    
    return data;
}

// Convert data array to CSV string
function convertToCSV(dataArray) {
    if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) {
        throw new Error('Invalid data for CSV conversion');
    }
    
    // Get all possible columns from all objects
    const columns = new Set();
    dataArray.forEach(item => {
        Object.keys(item).forEach(key => columns.add(key));
    });
    
    // Convert to array and sort for consistent output
    const sortedColumns = Array.from(columns).sort();
    
    // Create CSV header row
    let csvContent = sortedColumns.join(',') + '\n';
    
    // Add data rows
    dataArray.forEach(item => {
        const row = sortedColumns.map(column => {
            const value = item[column] !== undefined ? item[column] : '';
            
            // Check if value needs to be quoted (contains commas, quotes, or newlines)
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                // Escape double quotes by doubling them
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',');
        
        csvContent += row + '\n';
    });
    
    return csvContent;
}

// Create and trigger download of CSV file
function downloadCSV(csvContent, filename) {
    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download URL
    const url = URL.createObjectURL(blob);
    
    // Create temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    // Add to document, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up URL object
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 100);
}

// Helper function to create loading indicator
function createLoadingIndicator(message = 'Loading...') {
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading-indicator';
    loadingElement.style.position = 'fixed';
    loadingElement.style.top = '0';
    loadingElement.style.left = '0';
    loadingElement.style.width = '100%';
    loadingElement.style.height = '100%';
    loadingElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    loadingElement.style.display = 'flex';
    loadingElement.style.flexDirection = 'column';
    loadingElement.style.justifyContent = 'center';
    loadingElement.style.alignItems = 'center';
    loadingElement.style.zIndex = '10000';
    
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.style.border = '6px solid #f3f3f3';
    spinner.style.borderTop = '6px solid #4a6fa5';
    spinner.style.borderRadius = '50%';
    spinner.style.width = '50px';
    spinner.style.height = '50px';
    spinner.style.animation = 'spin 1s linear infinite';
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.color = 'white';
    messageElement.style.marginTop = '15px';
    messageElement.style.fontSize = '16px';
    
    loadingElement.appendChild(spinner);
    loadingElement.appendChild(messageElement);
    
    return loadingElement;
}

// Helper function to show notification
function showNotification(message, type = 'info') {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert-notification alert-${type}`;
    alertDiv.style.position = 'fixed';
    alertDiv.style.bottom = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.padding = '15px 20px';
    alertDiv.style.borderRadius = '4px';
    alertDiv.style.zIndex = '10000';
    alertDiv.style.maxWidth = '400px';
    alertDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
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
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(alertDiv)) {
                document.body.removeChild(alertDiv);
            }
        }, 500);
    }, 5000);
}
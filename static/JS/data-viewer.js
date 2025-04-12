// Data Viewer Script for ML Intrusion Detection Dashboard
// This script handles the improved data viewing functionality

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const dataTable = document.getElementById('full-data-table');
    const dataSearch = document.getElementById('data-search');
    const classFilter = document.getElementById('class-filter');
    const showAllBtn = document.getElementById('show-all-btn');
    const modalPrevBtn = document.getElementById('modal-prev-page');
    const modalNextBtn = document.getElementById('modal-next-page');
    const modalPageInfo = document.getElementById('modal-page-info');
    
    // Settings
    let currentPage = 1;
    const defaultRowsPerPage = 100; // Higher default value
    let rowsPerPage = defaultRowsPerPage;
    let totalPages = 1;
    let allData = [];
    let filteredData = [];
    
    // Initialize the viewer with data
    function initDataViewer(data) {
        if (!data || !dataTable) return;
        
        // Clone the data to avoid modifying the original
        allData = JSON.parse(JSON.stringify(data));
        filteredData = [...allData];
        totalPages = Math.ceil(filteredData.length / rowsPerPage);
        
        updatePageInfo();
        renderTablePage();
        
        // Add event listeners
        if (dataSearch) {
            dataSearch.addEventListener('input', filterData);
        }
        
        if (classFilter) {
            classFilter.addEventListener('change', filterData);
        }
        
        if (showAllBtn) {
            showAllBtn.addEventListener('click', showAllData);
        }
        
        if (modalPrevBtn) {
            modalPrevBtn.addEventListener('click', prevPage);
        }
        
        if (modalNextBtn) {
            modalNextBtn.addEventListener('click', nextPage);
        }
    }
    
    // Filter data based on search and class
    function filterData() {
        if (!dataSearch || !classFilter) return;
        
        const searchTerm = dataSearch.value.toLowerCase();
        const selectedClass = classFilter.value;
        
        filteredData = allData.filter(row => {
            // Check if row matches search term
            const matchesSearch = Object.values(row).some(value => {
                if (value === null || value === undefined) return false;
                return String(value).toLowerCase().includes(searchTerm);
            });
            
            // Check if row matches class filter
            let matchesClass = true;
            if (selectedClass !== 'all') {
                if (selectedClass === 'normal') {
                    matchesClass = (
                        row.class === 'normal' || 
                        row.class === 0 || 
                        row.is_anomaly === 0 ||
                        row.prediction === 0
                    );
                } else if (selectedClass === 'attack') {
                    matchesClass = (
                        row.class !== 'normal' && 
                        row.class !== 0 && 
                        row.is_anomaly !== 0 &&
                        (row.prediction === undefined || row.prediction === 1)
                    );
                }
            }
            
            return matchesSearch && matchesClass;
        });
        
        // Reset to first page after filtering
        currentPage = 1;
        totalPages = Math.ceil(filteredData.length / rowsPerPage);
        
        updatePageInfo();
        renderTablePage();
    }
    
    // Show all data at once
    function showAllData() {
        rowsPerPage = filteredData.length;
        currentPage = 1;
        
        modalPageInfo.textContent = `Showing all ${filteredData.length} records`;
        renderTablePage();
        
        // Hide pagination buttons when showing all
        if (modalPrevBtn) modalPrevBtn.style.display = 'none';
        if (modalNextBtn) modalNextBtn.style.display = 'none';
        
        // Show reset button
        const resetBtn = document.createElement('button');
        resetBtn.id = 'reset-pagination-btn';
        resetBtn.className = 'btn-secondary';
        resetBtn.innerHTML = '<i class="fas fa-undo"></i> Return to Paginated View';
        resetBtn.addEventListener('click', resetPagination);
        
        const tableActions = document.querySelector('.table-pagination');
        if (tableActions && !document.getElementById('reset-pagination-btn')) {
            tableActions.appendChild(resetBtn);
        }
    }
    
    // Reset to paginated view
    function resetPagination() {
        rowsPerPage = defaultRowsPerPage;
        totalPages = Math.ceil(filteredData.length / rowsPerPage);
        
        updatePageInfo();
        renderTablePage();
        
        // Show pagination buttons
        if (modalPrevBtn) modalPrevBtn.style.display = 'inline-block';
        if (modalNextBtn) modalNextBtn.style.display = 'inline-block';
        
        // Remove reset button
        const resetBtn = document.getElementById('reset-pagination-btn');
        if (resetBtn) resetBtn.remove();
    }
    
    // Go to previous page
    function prevPage() {
        if (currentPage > 1) {
            currentPage--;
            updatePageInfo();
            renderTablePage();
        }
    }
    
    // Go to next page
    function nextPage() {
        if (currentPage < totalPages) {
            currentPage++;
            updatePageInfo();
            renderTablePage();
        }
    }
    
    // Update page info text
    function updatePageInfo() {
        if (modalPageInfo) {
            modalPageInfo.textContent = `Page ${currentPage} of ${totalPages} (${filteredData.length} records)`;
        }
    }
    
    // Render current page of data
    function renderTablePage() {
        if (!dataTable) return;
        
        const thead = dataTable.querySelector('thead tr');
        const tbody = dataTable.querySelector('tbody');
        
        // Clear table
        thead.innerHTML = '';
        tbody.innerHTML = '';
        
        if (filteredData.length === 0) {
            thead.innerHTML = '<th>No data matches your filter criteria</th>';
            return;
        }
        
        // Get column headers from first record
        const columns = Object.keys(filteredData[0]);
        
        // Create header row
        columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column.replace(/_/g, ' ').toUpperCase();
            thead.appendChild(th);
        });
        
        // Calculate start and end indices for current page
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = Math.min(startIndex + rowsPerPage, filteredData.length);
        
        // Create data rows for current page
        for (let i = startIndex; i < endIndex; i++) {
            const row = filteredData[i];
            const tr = document.createElement('tr');
            
            columns.forEach(column => {
                const td = document.createElement('td');
                
                // Special handling for class column
                if (column === 'class' || column === 'is_anomaly' || column === 'prediction') {
                    const span = document.createElement('span');
                    const value = row[column];
                    const isNormal = value === 0 || value === "normal";
                    
                    span.textContent = isNormal ? 'Normal' : 'Anomaly';
                    span.className = `class-badge ${isNormal ? 'normal' : 'attack'}`;
                    td.appendChild(span);
                } else if (column === 'threat_type') {
                    // Special handling for threat type
                    const span = document.createElement('span');
                    span.textContent = row[column] || 'Unknown';
                    span.className = 'threat-badge';
                    td.appendChild(span);
                } else if (column === 'src_ip' || column === 'dst_ip') {
                    // Special handling for IP addresses
                    td.textContent = row[column] !== undefined ? row[column] : '';
                    td.className = 'ip-address';
                } else if (column === 'protocol') {
                    // Special handling for protocol
                    const protocolSpan = document.createElement('span');
                    protocolSpan.textContent = row[column] !== undefined ? row[column].toUpperCase() : '';
                    protocolSpan.className = 'protocol-badge';
                    td.appendChild(protocolSpan);
                } else if (column === 'src_port' || column === 'dst_port') {
                    // Special handling for ports
                    td.textContent = row[column] !== undefined ? row[column] : '';
                    if (row[column] < 1024 && row[column] > 0) {
                        td.className = 'well-known-port'; // Highlight well-known ports
                    }
                } else {
                    // Format numbers to 4 decimal places if they are floats
                    if (typeof row[column] === 'number' && !Number.isInteger(row[column])) {
                        td.textContent = row[column].toFixed(4);
                    } else {
                        td.textContent = row[column] !== undefined ? row[column] : '';
                    }
                }
                
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        }
    }
    
    // Export data to CSV
    function exportToCSV() {
        if (!filteredData.length) return;
        
        const columns = Object.keys(filteredData[0]);
        
        // Create CSV header
        let csvContent = columns.join(',') + '\n';
        
        // Add data rows
        filteredData.forEach(row => {
            const csvRow = columns.map(column => {
                // Handle values that might contain commas or quotes
                let cellValue = row[column] !== undefined ? row[column] : '';
                if (typeof cellValue === 'string' && (cellValue.includes(',') || cellValue.includes('"'))) {
                    return `"${cellValue.replace(/"/g, '""')}"`;
                }
                return cellValue;
            }).join(',');
            
            csvContent += csvRow + '\n';
        });
        
        // Create a download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'network_data_export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Initialize export button
    const exportCSVBtn = document.getElementById('export-csv-btn');
    if (exportCSVBtn) {
        exportCSVBtn.addEventListener('click', exportToCSV);
    }
    
    // Check if we have data passed from the server
    if (typeof fullData !== 'undefined' && fullData.length > 0) {
        initDataViewer(fullData);
    } else if (window.fullData && window.fullData.length > 0) {
        initDataViewer(window.fullData);
    }
    
    // Export global functions
    window.dataViewer = {
        initDataViewer,
        filterData,
        showAllData,
        resetPagination,
        nextPage,
        prevPage,
        exportToCSV
    };
    
    // Add custom styles for badges
    const style = document.createElement('style');
    style.textContent = `
        .class-badge {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: 500;
        }
        .class-badge.normal {
            background-color: rgba(40, 167, 69, 0.2);
            color: rgb(40, 167, 69);
        }
        .class-badge.attack {
            background-color: rgba(220, 53, 69, 0.2);
            color: rgb(220, 53, 69);
        }
        .threat-badge {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            background-color: rgba(111, 66, 193, 0.2);
            color: rgb(111, 66, 193);
            font-size: 0.85rem;
            font-weight: 500;
        }
        .protocol-badge {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            background-color: rgba(23, 162, 184, 0.2);
            color: rgb(23, 162, 184);
            font-size: 0.85rem;
            font-weight: 500;
        }
        .ip-address {
            font-family: monospace;
        }
        .well-known-port {
            color: rgb(111, 66, 193);
            font-weight: 600;
        }
    `;
    document.head.appendChild(style);
});
// Reports functionality frontend
function loadReportsPage(container) {
    // Fetch available reports
    fetch(`${API_URL}/reports`, {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            renderReportsPage(container, data.reports);
        } else {
            // No reports or error
            container.innerHTML = `
                <div class="page-header slide-in">
                    <h2 class="page-title"><i class="fas fa-file-alt"></i> Reports</h2>
                </div>
                
                <div class="alert alert-info slide-in">
                    <i class="fas fa-info-circle"></i>
                    <div>
                        <strong>No reports available</strong>
                        <p>Generate a report from the Results page after training models.</p>
                    </div>
                </div>
                
                <div class="text-center">
                    <button class="btn primary-btn" onclick="loadPage('model-training')">
                        <i class="fas fa-brain"></i> Train Models
                    </button>
                </div>
            `;
        }
    })
    .catch(error => {
        console.error('Error fetching reports:', error);
        // Show error state
        container.innerHTML = `
            <div class="page-header slide-in">
                <h2 class="page-title"><i class="fas fa-file-alt"></i> Reports</h2>
            </div>
            
            <div class="alert alert-danger slide-in">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <strong>Error loading reports!</strong>
                    <p>Please try again later.</p>
                </div>
            </div>
        `;
    });
}

// Render reports page
function renderReportsPage(container, reports) {
    container.innerHTML = `
        <div class="page-header slide-in">
            <h2 class="page-title"><i class="fas fa-file-alt"></i> Reports</h2>
            <div class="page-actions">
                <button class="btn primary-btn" onclick="loadPage('results')">
                    <i class="fas fa-plus"></i> Generate New Report
                </button>
            </div>
        </div>
        
        <div class="alert alert-info slide-in">
            <i class="fas fa-info-circle"></i>
            <div>
                <strong>Reports</strong>
                <p>View and manage generated reports. You can download, view, or delete reports from this page.</p>
            </div>
        </div>
        
        <!-- Reports table -->
        <div class="row slide-in">
            <div class="col">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><i class="fas fa-list"></i> Available Reports</h3>
                    </div>
                    <div class="card-body">
                        <div class="table-container">
                            <table class="data-table" id="reportsTable">
                                <thead>
                                    <tr>
                                        <th>Report Name</th>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Format</th>
                                        <th>Size</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${reports.map(report => `
                                        <tr>
                                            <td>${report.name}</td>
                                            <td>${formatDate(report.date)}</td>
                                            <td>${report.type}</td>
                                            <td>${report.format.toUpperCase()}</td>
                                            <td>${formatFileSize(report.size)}</td>
                                            <td class="actions-cell">
                                                <button class="btn icon-btn" onclick="viewReport('${report.id}')">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button class="btn icon-btn" onclick="downloadReport('${report.id}')">
                                                    <i class="fas fa-download"></i>
                                                </button>
                                                <button class="btn icon-btn danger" onclick="deleteReport('${report.id}')">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// View report
function viewReport(reportId) {
    // Redirect to report viewer page
    window.open(`${API_URL}/reports/${reportId}/view`, '_blank');
}

// Download report
function downloadReport(reportId) {
    // Redirect to download URL
    window.location.href = `${API_URL}/reports/${reportId}/download`;
}

// Delete report
async function deleteReport(reportId) {
    if (confirm('Are you sure you want to delete this report?')) {
        try {
            const response = await fetch(`${API_URL}/reports/${reportId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('Report deleted successfully', 'success');
                
                // Reload reports page
                loadPage('reports');
            } else {
                showNotification(data.message || 'Error deleting report', 'error');
            }
        } catch (error) {
            console.error('Error deleting report:', error);
            showNotification('Server error. Please try again later.', 'error');
        }
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}
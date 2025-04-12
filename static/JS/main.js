// Main JavaScript for ML Intrusion Detection Dashboard

// DOM Elements
const chooseFile = document.getElementById('chooseFile');
const fileName = document.getElementById('noFile');
const helpLink = document.getElementById('help-link');
const helpModal = document.getElementById('helpModal');
const closeButtons = document.querySelectorAll('.close');
const uploadForm = document.getElementById('upload-form');
const resultsLink = document.getElementById('results-link');

// Check if we have data
const hasData = resultsLink && !resultsLink.classList.contains('disabled');

// Initialize event listeners
function initEventListeners() {
    // File selection display
    if (chooseFile) {
        chooseFile.addEventListener('change', function() {
            fileName.textContent = this.files[0] ? this.files[0].name : 'No file chosen...';
        });
    }

    // Help modal
    if (helpLink && helpModal) {
        helpLink.addEventListener('click', function(e) {
            e.preventDefault();
            helpModal.style.display = 'block';
        });
    }

    // Close modals
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Close modal on outside click
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Form submission
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            const fileInput = this.querySelector('input[type="file"]');
            if (!fileInput.files.length) {
                e.preventDefault();
                alert('Please select a file to upload.');
                return false;
            }
            
            const file = fileInput.files[0];
            if (!file.name.toLowerCase().endsWith('.csv')) {
                e.preventDefault();
                alert('Please select a CSV file.');
                return false;
            }
            
            // Show loading indicator
            document.querySelector('.upload-button').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            document.querySelector('.upload-button').disabled = true;
        });
    }

    // Try again button on error page
    const tryAgainBtn = document.getElementById('try-again-btn');
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', function() {
            window.history.back();
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initEventListeners);
// Enhanced JavaScript for Training Page

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const selectAllBtn = document.getElementById('select-all');
    const selectSupervisedBtn = document.getElementById('select-supervised');
    const selectUnsupervisedBtn = document.getElementById('select-unsupervised');
    const clearAllBtn = document.getElementById('clear-all');
    const trainingForm = document.getElementById('training-form');
    const trainingProgress = document.getElementById('training-progress');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const progressText = document.getElementById('progress-text');
    const trainButton = document.getElementById('train-button');
    const hasLabels = document.getElementById('has-labels') ? 
                      document.getElementById('has-labels').value === 'true' : false;
    
    // Get all model checkboxes
    const supervisedCheckboxes = document.querySelectorAll('.supervised-models input[type="checkbox"]');
    const unsupervisedCheckboxes = document.querySelectorAll('.unsupervised-models input[type="checkbox"]');
    const allCheckboxes = document.querySelectorAll('input[type="checkbox"][name="models"]');
    
    // Selection functions
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', function() {
            allCheckboxes.forEach(checkbox => {
                checkbox.checked = true;
            });
        });
    }
    
    if (selectSupervisedBtn) {
        selectSupervisedBtn.addEventListener('click', function() {
            // Clear all first
            allCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // Then select supervised only
            supervisedCheckboxes.forEach(checkbox => {
                checkbox.checked = true;
            });
        });
    }
    
    if (selectUnsupervisedBtn) {
        selectUnsupervisedBtn.addEventListener('click', function() {
            // Clear all first
            allCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // Then select unsupervised only
            unsupervisedCheckboxes.forEach(checkbox => {
                checkbox.checked = true;
            });
        });
    }
    
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function() {
            allCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
        });
    }
    
    // Determine what models are available based on data type
    function updateAvailableModels() {
        if (hasLabels) {
            // Data has labels, all models are available
            supervisedCheckboxes.forEach(checkbox => {
                checkbox.parentElement.parentElement.classList.remove('disabled');
                checkbox.disabled = false;
            });
            
            unsupervisedCheckboxes.forEach(checkbox => {
                checkbox.parentElement.parentElement.classList.remove('disabled');
                checkbox.disabled = false;
            });
            
            // Add info notification about what happens with labeled data in unsupervised models
            if (!document.querySelector('.data-type-note')) {
                const note = document.createElement('div');
                note.className = 'model-note data-type-note';
                note.innerHTML = '<i class="fas fa-info-circle"></i> Your dataset has labels. For unsupervised models, the class column will automatically be removed during analysis, ensuring proper unsupervised learning.';
                
                const container = document.querySelector('.summary-section');
                const modelSectionTitle = document.querySelector('.model-section-title');
                
                if (container && modelSectionTitle) {
                    container.insertBefore(note, modelSectionTitle);
                }
            }
        } else {
            // Data does not have labels, disable supervised models
            supervisedCheckboxes.forEach(checkbox => {
                checkbox.parentElement.parentElement.classList.add('disabled');
                checkbox.disabled = true;
                checkbox.checked = false;
            });
            
            unsupervisedCheckboxes.forEach(checkbox => {
                checkbox.parentElement.parentElement.classList.remove('disabled');
                checkbox.disabled = false;
            });
            
            // Add warning notification about supervised models
            if (!document.querySelector('.data-type-note')) {
                const note = document.createElement('div');
                note.className = 'model-note data-type-note';
                note.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Your dataset has no labels (no "class" column). Supervised models are disabled. Please use only unsupervised models or upload labeled data.';
                
                const container = document.querySelector('.summary-section');
                const modelSectionTitle = document.querySelector('.model-section-title');
                
                if (container && modelSectionTitle) {
                    container.insertBefore(note, modelSectionTitle);
                }
            }
        }
    }
    
    // Training form submission
    if (trainingForm) {
        trainingForm.addEventListener('submit', function(e) {
            const selectedModels = document.querySelectorAll('input[type="checkbox"][name="models"]:checked');
            
            if (selectedModels.length === 0) {
                e.preventDefault();
                showAlert('Please select at least one model to train', 'error');
                return;
            }
            
            // Check if supervised models are selected when data has no labels
            if (!hasLabels) {
                let hasSupervisedSelected = false;
                supervisedCheckboxes.forEach(checkbox => {
                    if (checkbox.checked) {
                        hasSupervisedSelected = true;
                    }
                });
                
                if (hasSupervisedSelected) {
                    e.preventDefault();
                    showAlert('Your data has no labels. Supervised models cannot be trained. Please select only unsupervised models.', 'error');
                    return;
                }
            }
            
            // Show training progress
            trainButton.disabled = true;
            trainingProgress.style.display = 'block';
            
            // Simulate progress updates
            let progress = 0;
            const selectedModelsCount = selectedModels.length;
            const progressInterval = setInterval(function() {
                progress += 1;
                const progressPercent = Math.min((progress / (selectedModelsCount * 20)) * 100, 95);
                progressBarFill.style.width = progressPercent + '%';
                progressText.textContent = `Training models... ${Math.round(progressPercent)}%`;
                
                if (progressPercent >= 95) {
                    clearInterval(progressInterval);
                }
            }, 500);
        });
    }
    
    // Show alert message
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
        
        // Get flash container or create one if it doesn't exist
        let flashContainer = document.querySelector('.flashes');
        if (!flashContainer) {
            flashContainer = document.createElement('ul');
            flashContainer.className = 'flashes';
            const container = document.querySelector('.summary-section');
            if (container) {
                container.insertBefore(flashContainer, container.querySelector('form'));
            }
        }
        
        // Add to flashes container
        const listItem = document.createElement('li');
        listItem.className = type;
        listItem.appendChild(alertDiv);
        flashContainer.appendChild(listItem);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            listItem.style.opacity = '0';
            setTimeout(() => listItem.remove(), 300);
        }, 5000);
    }
    
    // Add visual enhancements to model cards
    function enhanceModelCards() {
        const modelCards = document.querySelectorAll('.model-card');
        modelCards.forEach(card => {
            // Add hover effect with CSS variables
            card.style.setProperty('--card-initial-transform', 'scale(1)');
            card.style.setProperty('--card-hover-transform', 'scale(1.03) translateY(-5px)');
            
            // Improve checkbox styling
            const checkbox = card.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.addEventListener('change', function() {
                    if (this.checked) {
                        card.classList.add('selected');
                    } else {
                        card.classList.remove('selected');
                    }
                });
            }
        });
    }
    
    // Init function
    function init() {
        updateAvailableModels();
        enhanceModelCards();
        
        // Check for flash messages and add appropriate icons
        const flashMessages = document.querySelectorAll('.flashes li');
        flashMessages.forEach(flash => {
            const classes = flash.classList;
            let icon = 'info-circle';
            
            if (classes.contains('success')) icon = 'check-circle';
            if (classes.contains('error')) icon = 'exclamation-circle';
            if (classes.contains('warning')) icon = 'exclamation-triangle';
            if (classes.contains('info')) icon = 'info-circle';
            
            // Add icon if not already present
            if (!flash.querySelector('i')) {
                const iconElement = document.createElement('i');
                iconElement.className = `fas fa-${icon}`;
                flash.insertBefore(iconElement, flash.firstChild);
            }
        });
    }
    
    // Run initialization
    init();
});
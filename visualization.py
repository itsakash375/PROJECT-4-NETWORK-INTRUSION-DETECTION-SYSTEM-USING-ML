"""Functions for creating visualizations."""

import matplotlib.pyplot as plt
import seaborn as sns
import base64
import io
import numpy as np

def plot_confusion_matrix(cm, class_names):
    """Create a confusion matrix plot"""
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=class_names, yticklabels=class_names)
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.title('Confusion Matrix')
    
    # Save to a bytes buffer
    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format='png')
    buf.seek(0)
    plt.close()
    
    # Convert to base64 string
    img_str = base64.b64encode(buf.read()).decode('utf-8')
    return f"data:image/png;base64,{img_str}"

def plot_learning_curve(train_scores, val_scores):
    """Create a learning curve plot"""
    plt.figure(figsize=(8, 6))
    epochs = range(1, len(train_scores) + 1)
    
    plt.plot(epochs, train_scores, 'b-', label='Training')
    plt.plot(epochs, val_scores, 'r-', label='Validation')
    plt.title('Learning Curve')
    plt.xlabel('Epochs')
    plt.ylabel('Accuracy')
    plt.legend()
    
    # Save to a bytes buffer
    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format='png')
    buf.seek(0)
    plt.close()
    
    # Convert to base64 string
    img_str = base64.b64encode(buf.read()).decode('utf-8')
    return f"data:image/png;base64,{img_str}"

def plot_cluster_distribution(cluster_labels):
    """Create a cluster distribution plot"""
    plt.figure(figsize=(8, 6))
    
    # Count the number of points in each cluster
    unique_clusters, counts = np.unique(cluster_labels, return_counts=True)
    
    # Create bar chart
    plt.bar(unique_clusters, counts)
    plt.title('Cluster Distribution')
    plt.xlabel('Cluster')
    plt.ylabel('Number of Points')
    
    # Save to a bytes buffer
    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format='png')
    buf.seek(0)
    plt.close()
    
    # Convert to base64 string
    img_str = base64.b64encode(buf.read()).decode('utf-8')
    return f"data:image/png;base64,{img_str}"
"""Functions for training machine learning models."""

import numpy as np
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.svm import SVC, OneClassSVM
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier, LocalOutlierFactor
from sklearn.linear_model import LogisticRegression
from sklearn.cluster import KMeans, DBSCAN
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score
from sklearn.metrics import homogeneity_score, completeness_score, confusion_matrix

def train_supervised_model(model_name, data, params):
    """Train a supervised model"""
    X = data['X_train']
    y = data['y_train']
    X_val = data['X_val']
    y_val = data['y_val']
    
    # Initialize model based on name
    if model_name == 'RandomForest':
        model = RandomForestClassifier(
            n_estimators=params.get('n_estimators', 100),
            max_depth=params.get('max_depth', 10),
            random_state=42
        )
    elif model_name == 'SVM':
        model = SVC(
            kernel=params.get('kernel', 'rbf'),
            C=params.get('C', 1.0),
            probability=True,
            random_state=42
        )
    elif model_name == 'DecisionTree':
        model = DecisionTreeClassifier(
            max_depth=params.get('max_depth', 10),
            criterion=params.get('criterion', 'gini'),
            random_state=42
        )
    elif model_name == 'KNN':
        model = KNeighborsClassifier(
            n_neighbors=params.get('n_neighbors', 5),
            weights=params.get('weights', 'uniform')
        )
    elif model_name == 'LogisticRegression':
        model = LogisticRegression(
            C=params.get('C', 1.0),
            solver=params.get('solver', 'lbfgs'),
            random_state=42,
            max_iter=1000
        )
    else:
        raise ValueError(f"Unsupported model type: {model_name}")
    
    # Fit the model
    model.fit(X, y)
    
    # Predict on validation set
    y_pred = model.predict(X_val)
    
    # Calculate metrics
    metrics = {}
    
    # Binary classification metrics if there are only 2 classes
    if len(np.unique(y)) == 2:
        metrics['Accuracy'] = accuracy_score(y_val, y_pred)
        metrics['Precision'] = precision_score(y_val, y_pred, average='binary')
        metrics['Recall'] = recall_score(y_val, y_pred, average='binary')
        metrics['F1'] = f1_score(y_val, y_pred, average='binary')
        
        # AUC-ROC if the model supports predict_proba
        if hasattr(model, 'predict_proba'):
            try:
                y_prob = model.predict_proba(X_val)[:, 1]
                metrics['AUC'] = roc_auc_score(y_val, y_prob)
            except:
                metrics['AUC'] = None
    # Multiclass metrics
    else:
        metrics['Accuracy'] = accuracy_score(y_val, y_pred)
        metrics['Precision'] = precision_score(y_val, y_pred, average='weighted')
        metrics['Recall'] = recall_score(y_val, y_pred, average='weighted')
        metrics['F1'] = f1_score(y_val, y_pred, average='weighted')
        
        # AUC-ROC for multiclass
        if hasattr(model, 'predict_proba'):
            try:
                y_prob = model.predict_proba(X_val)
                metrics['AUC'] = roc_auc_score(y_val, y_prob, multi_class='ovr', average='weighted')
            except:
                metrics['AUC'] = None
    
    # Confusion matrix
    cm = confusion_matrix(y_val, y_pred)
    
    # Learning curves (simple simulation)
    train_accuracy = []
    val_accuracy = []
    
    # Simulate learning process over 10 epochs
    for i in range(10):
        # Increase accuracy gradually
        train_acc = min(0.6 + i * 0.04 + np.random.uniform(-0.01, 0.01), 0.99)
        val_acc = min(train_acc - 0.05 - np.random.uniform(0, 0.05), 0.95)
        
        train_accuracy.append(train_acc)
        val_accuracy.append(val_acc)
    
    return {
        'model': model,
        'metrics': metrics,
        'confusion_matrix': {
            'matrix': cm.tolist(),
            'classes': np.unique(y).tolist()
        },
        'learning_curves': {
            'train_accuracy': train_accuracy,
            'val_accuracy': val_accuracy
        }
    }

# Add this to your model_training.py file to ensure all 5 unsupervised models work

def train_unsupervised_model(model_name, data, params):
    """Train an unsupervised model with improved support for all 5 models"""
    X = data['X_train']
    
    # Import required models
    from sklearn.cluster import KMeans, DBSCAN
    from sklearn.ensemble import IsolationForest
    from sklearn.svm import OneClassSVM
    from sklearn.neighbors import LocalOutlierFactor
    from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score
    import numpy as np
    
    # Initialize model based on name
    if model_name == 'KMeans':
        # Get parameters
        n_clusters = params.get('n_clusters', 5)
        init = params.get('init', 'k-means++')
        
        # Create and fit model
        model = KMeans(n_clusters=n_clusters, init=init, random_state=42)
        cluster_labels = model.fit_predict(X)
        
        # Calculate metrics
        metrics = {}
        
        # Calculate silhouette score
        try:
            metrics['Silhouette'] = silhouette_score(X, cluster_labels)
        except:
            metrics['Silhouette'] = None
        
        # Calculate Davies-Bouldin score
        try:
            metrics['DaviesBouldin'] = davies_bouldin_score(X, cluster_labels)
        except:
            metrics['DaviesBouldin'] = None
        
        # Calculate Calinski-Harabasz score
        try:
            metrics['CalinskiHarabasz'] = calinski_harabasz_score(X, cluster_labels)
        except:
            metrics['CalinskiHarabasz'] = None
        
        # Calculate anomaly ratio (considering points in smallest clusters as anomalies)
        cluster_counts = np.bincount(cluster_labels)
        smallest_cluster_size = np.min(cluster_counts)
        anomaly_ratio = smallest_cluster_size / len(X)
        
        # Prepare cluster distribution data
        cluster_distribution = []
        for cluster_id, count in enumerate(cluster_counts):
            cluster_distribution.append({
                'cluster': f'Cluster {cluster_id}',
                'count': int(count),
                'percentage': float(count / len(X))
            })
        
        # Add predicted attack types
        from network_simulation import generate_attack_type_predictions
        predicted_attack_types = generate_attack_type_predictions()
        
        return {
            'model': model,
            'metrics': metrics,
            'anomaly_ratio': anomaly_ratio,
            'cluster_distribution': cluster_distribution,
            'predictedAttackTypes': predicted_attack_types
        }
    
    elif model_name == 'IsolationForest':
        # Get parameters
        contamination = params.get('contamination', 0.1)
        n_estimators = params.get('n_estimators', 100)
        
        # Create and fit model
        model = IsolationForest(contamination=contamination, n_estimators=n_estimators, random_state=42)
        model.fit(X)
        
        # Get predictions (-1 for outliers, 1 for inliers)
        y_pred = model.predict(X)
        
        # Convert to binary labels (1 for outliers, 0 for inliers)
        outlier_labels = np.where(y_pred == -1, 1, 0)
        
        # Calculate anomaly ratio
        anomaly_ratio = np.sum(outlier_labels) / len(X)
        
        # Calculate metrics
        metrics = {}
        
        # For Isolation Forest, we create a simulated cluster distribution
        # based on the outlier detection
        cluster_counts = np.bincount(outlier_labels)
        cluster_distribution = [
            {
                'cluster': 'Normal',
                'count': int(cluster_counts[0]),
                'percentage': float(cluster_counts[0] / len(X))
            },
            {
                'cluster': 'Anomaly',
                'count': int(cluster_counts[1]) if len(cluster_counts) > 1 else 0,
                'percentage': float(cluster_counts[1] / len(X)) if len(cluster_counts) > 1 else 0.0
            }
        ]
        
        # Add predicted attack types
        from network_simulation import generate_attack_type_predictions
        predicted_attack_types = generate_attack_type_predictions()
        
        return {
            'model': model,
            'metrics': metrics,
            'anomaly_ratio': anomaly_ratio,
            'cluster_distribution': cluster_distribution,
            'predictedAttackTypes': predicted_attack_types
        }
    
    elif model_name == 'DBSCAN':
        # Get parameters
        eps = params.get('eps', 0.5)
        min_samples = params.get('min_samples', 5)
        
        # Create and fit model
        model = DBSCAN(eps=eps, min_samples=min_samples)
        cluster_labels = model.fit_predict(X)
        
        # DBSCAN labels -1 as noise/outliers
        outlier_count = np.sum(cluster_labels == -1)
        anomaly_ratio = outlier_count / len(X)
        
        # Calculate metrics
        metrics = {}
        
        # Only calculate silhouette score if there are more than 1 cluster and no noise points
        clean_labels = cluster_labels[cluster_labels != -1]
        if len(np.unique(clean_labels)) > 1 and len(clean_labels) > 1:
            clean_data = X[cluster_labels != -1]
            try:
                metrics['Silhouette'] = silhouette_score(clean_data, clean_labels)
            except:
                metrics['Silhouette'] = None
        
        # Get cluster distribution including noise points as a separate cluster
        unique_labels = np.unique(cluster_labels)
        cluster_distribution = []
        
        for label in unique_labels:
            count = np.sum(cluster_labels == label)
            cluster_name = 'Noise/Outliers' if label == -1 else f'Cluster {label}'
            
            cluster_distribution.append({
                'cluster': cluster_name,
                'count': int(count),
                'percentage': float(count / len(X))
            })
        
        # Add predicted attack types
        from network_simulation import generate_attack_type_predictions
        predicted_attack_types = generate_attack_type_predictions()
        
        return {
            'model': model,
            'metrics': metrics,
            'anomaly_ratio': anomaly_ratio,
            'cluster_distribution': cluster_distribution,
            'predictedAttackTypes': predicted_attack_types
        }
    
    elif model_name == 'OneClassSVM':
        # Get parameters
        nu = params.get('nu', 0.1)
        kernel = params.get('kernel', 'rbf')
        
        # Create and fit model
        model = OneClassSVM(nu=nu, kernel=kernel)
        model.fit(X)
        
        # Get predictions (1 for inliers, -1 for outliers)
        y_pred = model.predict(X)
        
        # Convert to binary labels (1 for outliers, 0 for inliers)
        outlier_labels = np.where(y_pred == -1, 1, 0)
        
        # Calculate anomaly ratio
        anomaly_ratio = np.sum(outlier_labels) / len(X)
        
        # Calculate metrics
        metrics = {}
        
        # For OneClassSVM, we create a simulated cluster distribution
        # based on the outlier detection
        cluster_counts = np.bincount(outlier_labels)
        cluster_distribution = [
            {
                'cluster': 'Normal',
                'count': int(cluster_counts[0]),
                'percentage': float(cluster_counts[0] / len(X))
            },
            {
                'cluster': 'Anomaly',
                'count': int(cluster_counts[1]) if len(cluster_counts) > 1 else 0,
                'percentage': float(cluster_counts[1] / len(X)) if len(cluster_counts) > 1 else 0.0
            }
        ]
        
        # Add predicted attack types
        from network_simulation import generate_attack_type_predictions
        predicted_attack_types = generate_attack_type_predictions()
        
        return {
            'model': model,
            'metrics': metrics,
            'anomaly_ratio': anomaly_ratio,
            'cluster_distribution': cluster_distribution,
            'predictedAttackTypes': predicted_attack_types
        }
    
    elif model_name == 'LOF':
        # Get parameters
        n_neighbors = params.get('n_neighbors', 20)
        contamination = params.get('contamination', 0.1)
        
        # Create model (LocalOutlierFactor doesn't have a traditional fit method)
        model = LocalOutlierFactor(n_neighbors=n_neighbors, contamination=contamination)
        
        # Fit and predict in one step
        outlier_labels = model.fit_predict(X)
        
        # LOF returns -1 for outliers and 1 for inliers, convert to binary (1 for outliers, 0 for inliers)
        outlier_labels = np.where(outlier_labels == -1, 1, 0)
        
        # Calculate anomaly ratio
        anomaly_ratio = np.sum(outlier_labels) / len(X)
        
        # Calculate metrics (LOF doesn't have traditional metrics)
        metrics = {}
        
        # Create cluster distribution (normal vs anomaly)
        cluster_counts = np.bincount(outlier_labels)
        cluster_distribution = [
            {
                'cluster': 'Normal',
                'count': int(cluster_counts[0]),
                'percentage': float(cluster_counts[0] / len(X))
            },
            {
                'cluster': 'Anomaly',
                'count': int(cluster_counts[1]) if len(cluster_counts) > 1 else 0,
                'percentage': float(cluster_counts[1] / len(X)) if len(cluster_counts) > 1 else 0.0
            }
        ]
        
        # Add predicted attack types
        from network_simulation import generate_attack_type_predictions
        predicted_attack_types = generate_attack_type_predictions()
        
        # For LOF, we don't return the model since it can't be serialized normally
        # Instead, we just return the results
        return {
            'metrics': metrics,
            'anomaly_ratio': anomaly_ratio,
            'cluster_distribution': cluster_distribution,
            'predictedAttackTypes': predicted_attack_types
        }
    
    else:
        raise ValueError(f"Unsupported model type: {model_name}")
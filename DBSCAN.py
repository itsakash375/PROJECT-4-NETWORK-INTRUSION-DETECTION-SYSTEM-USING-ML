import json
import os
import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
from sklearn.neighbors import NearestNeighbors

# Create directory for static files
os.makedirs('./static', exist_ok=True)

# Load data
print("Loading data...")
data = pd.read_csv('./Data/filtered_data.csv')

# Check if 'class' column exists and convert to binary if it does
if 'class' in data.columns:
    data['class'] = (data['class'] != "normal").astype(int)
    # Store original class for later evaluation
    y_true = data['class']
    X = data.drop(columns=['class'])
else:
    # No class column - fully unsupervised scenario
    X = data.copy()
    y_true = None

print(f"Data shape: {X.shape}")

# Standardize the data
print("Standardizing features...")
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Determine eps parameter automatically using k-distance graph
def find_optimal_eps(X, n_neighbors=5):
    # Compute distances between points
    nbrs = NearestNeighbors(n_neighbors=n_neighbors).fit(X)
    distances, _ = nbrs.kneighbors(X)
    
    # Sort distance to the nth neighbor
    distances = np.sort(distances[:, n_neighbors-1])
    
    # Estimate eps as the "elbow" in the k-distance graph
    # This is a simplified approach - in practice, you would visually inspect the graph
    diffs = np.diff(distances)
    threshold = np.mean(diffs) + 2 * np.std(diffs)
    elbow_index = np.where(diffs > threshold)[0]
    
    if len(elbow_index) > 0:
        eps = distances[elbow_index[0]]
    else:
        # Default if no clear elbow is found
        eps = np.percentile(distances, 90)
    
    return eps

# Set parameters
try:
    eps = find_optimal_eps(X_scaled)
except Exception as e:
    print(f"Error finding optimal eps: {e}")
    eps = 0.5  # Default value

min_samples = 5  # Minimum number of samples in a core point's neighborhood

print(f"Applying DBSCAN with eps={eps:.4f}, min_samples={min_samples}...")
dbscan = DBSCAN(
    eps=eps,
    min_samples=min_samples,
    metric='euclidean',
    n_jobs=-1
)

# Fit and predict
labels = dbscan.fit_predict(X_scaled)

# In DBSCAN, -1 = noise points (outliers), non-negative integers = cluster labels
# Convert to binary (0 = normal, 1 = anomaly) for consistency
binary_labels = (labels == -1).astype(int)

# Calculate anomaly scores - distance to the nearest core point
# If a point is in a cluster, its score is 0. If it's an outlier, we compute its distance to the nearest cluster.
def calculate_anomaly_scores(X, labels, eps):
    unique_labels = np.unique(labels)
    unique_labels = unique_labels[unique_labels != -1]  # Exclude noise points
    
    anomaly_scores = np.zeros(X.shape[0])
    
    # For each point
    for i in range(X.shape[0]):
        if labels[i] == -1:  # If it's a noise point
            min_dist = float('inf')
            
            # Find its distance to the nearest cluster
            for label in unique_labels:
                cluster_points = X[labels == label]
                
                if len(cluster_points) > 0:
                    # Distance to the nearest point in the cluster
                    dist = np.min(np.linalg.norm(X[i] - cluster_points, axis=1))
                    min_dist = min(min_dist, dist)
            
            if min_dist == float('inf'):
                min_dist = eps * 2  # Default if no clusters found
                
            anomaly_scores[i] = min_dist
    
    return anomaly_scores

# Calculate anomaly scores
anomaly_scores = calculate_anomaly_scores(X_scaled, labels, eps)

# Get the indices of the top 10 anomalies (highest anomaly scores)
top_indices = np.argsort(anomaly_scores)[-10:][::-1]

# Try to calculate silhouette score (only if there are at least 2 clusters and not all points are noise)
silhouette = None
try:
    if len(np.unique(labels)) > 1 and not np.all(labels == -1):
        # For silhouette score, we need to exclude noise points
        non_noise_indices = labels != -1
        if np.sum(non_noise_indices) > 1:
            silhouette = silhouette_score(X_scaled[non_noise_indices], labels[non_noise_indices])
            print(f"Silhouette Score: {silhouette:.4f}")
except Exception as e:
    print(f"Couldn't calculate silhouette score: {e}")

# Save original data with predictions
results_df = X.copy()
results_df['anomaly_score'] = anomaly_scores
results_df['cluster'] = labels
results_df['is_anomaly'] = binary_labels

# If we have ground truth, add it back for comparison
if y_true is not None:
    results_df['actual_class'] = y_true

# Extract top anomalies
top_anomalies = results_df.iloc[top_indices].copy()

# Save full results and predictions
results_df.to_csv('./static/DBSCAN_results_full.csv', index=False)
binary_df = pd.DataFrame({'prediction': binary_labels})
binary_df.to_csv('./static/DBSCAN_predictions.csv', index=False)

# Save top anomalies separately
top_anomalies.to_csv('./static/DBSCAN_top_anomalies.csv', index=False)

# Calculate metrics
anomaly_count = np.sum(binary_labels)
anomaly_percentage = (anomaly_count / len(binary_labels)) * 100

print(f"Detected {anomaly_count} anomalies ({anomaly_percentage:.2f}%)")

# Count clusters
n_clusters = len(np.unique(labels)) - (1 if -1 in labels else 0)
print(f"Number of clusters detected: {n_clusters}")

# If we have ground truth, calculate accuracy
accuracy = None
if y_true is not None:
    accuracy = np.mean(binary_labels == y_true)
    print(f"Accuracy against labeled data: {accuracy:.4f}")

# Save results as JSON
results = {
    "model": "DBSCAN",
    "eps": float(eps),
    "min_samples": min_samples,
    "n_clusters": n_clusters,
    "silhouette_score": silhouette,
    "anomaly_count": int(anomaly_count),
    "anomaly_percentage": float(anomaly_percentage),
    "accuracy": accuracy,
    "sample_size": len(binary_labels)
}

with open('./static/DBSCAN_results.json', 'w') as f:
    json.dump(results, f, indent=4)

print(f"✅ Results saved for DBSCAN in ./static/DBSCAN_results.json")
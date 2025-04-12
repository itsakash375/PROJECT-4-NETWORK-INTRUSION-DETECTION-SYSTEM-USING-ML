import json
import os
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score

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

# Apply KMeans clustering
print("Applying KMeans clustering...")
kmeans = KMeans(n_clusters=2, random_state=42, n_init=10)
labels = kmeans.fit_predict(X_scaled)

# Convert to binary labels: 1 for anomaly (smaller cluster), 0 for normal
counts = np.bincount(labels)
anomaly_label = np.argmin(counts)
binary_labels = (labels == anomaly_label).astype(int)

# Calculate silhouette score
try:
    silhouette = silhouette_score(X_scaled, labels)
    print(f"Silhouette Score: {silhouette:.4f}")
except Exception as e:
    print(f"Couldn't calculate silhouette score: {e}")
    silhouette = None

# Calculate distance to cluster centers as anomaly scores
anomaly_scores = np.min(kmeans.transform(X_scaled), axis=1)

# Get the indices of the top 10 anomalies (highest distance to cluster center)
top_indices = np.argsort(anomaly_scores)[-10:][::-1]

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
results_df.to_csv('./static/KMeans_results_full.csv', index=False)
binary_df = pd.DataFrame({'prediction': binary_labels})
binary_df.to_csv('./static/KMeans_predictions.csv', index=False)

# Save top anomalies separately
top_anomalies.to_csv('./static/KMeans_top_anomalies.csv', index=False)

# Calculate metrics
anomaly_count = np.sum(binary_labels)
anomaly_percentage = (anomaly_count / len(binary_labels)) * 100

print(f"Detected {anomaly_count} anomalies ({anomaly_percentage:.2f}%)")

# If we have ground truth, calculate accuracy
accuracy = None
if y_true is not None:
    accuracy = np.mean(binary_labels == y_true)
    print(f"Accuracy against labeled data: {accuracy:.4f}")

# Save results as JSON
results = {
    "model": "KMeans",
    "silhouette_score": silhouette,
    "anomaly_count": int(anomaly_count),
    "anomaly_percentage": float(anomaly_percentage),
    "accuracy": accuracy,
    "sample_size": len(binary_labels)
}

with open('./static/KMeans_Clustering_results.json', 'w') as f:
    json.dump(results, f, indent=4)

print(f"✅ Results saved for KMeans_Clustering in ./static/KMeans_Clustering_results.json")
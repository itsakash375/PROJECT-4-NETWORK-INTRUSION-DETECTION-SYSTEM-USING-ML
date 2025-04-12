import json
import os
import numpy as np
import pandas as pd
from sklearn.neighbors import LocalOutlierFactor
from sklearn.preprocessing import StandardScaler

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

# Set parameters
contamination = 0.1  # Expected proportion of outliers
n_neighbors = 20     # Number of neighbors to consider

# Apply Local Outlier Factor
print(f"Applying Local Outlier Factor with contamination={contamination}, n_neighbors={n_neighbors}...")
lof = LocalOutlierFactor(
    n_neighbors=n_neighbors,
    contamination=contamination,
    novelty=False,  # Fit and predict in one step
    n_jobs=-1       # Use all cores
)

# Fit and predict (in LOF, -1 = anomaly, 1 = normal)
raw_labels = lof.fit_predict(X_scaled)

# Convert to binary (0 = normal, 1 = anomaly) for consistency
binary_labels = (raw_labels == -1).astype(int)

# Get anomaly scores (higher = more anomalous)
# In LOF, negative_outlier_factor_ is negative of the outlier score (lower = more anomalous)
# So we negate it to get a score where higher = more anomalous
anomaly_scores = -lof.negative_outlier_factor_

# Get the indices of the top 10 anomalies (highest anomaly scores)
top_indices = np.argsort(anomaly_scores)[-10:][::-1]

# Save original data with predictions
results_df = X.copy()
results_df['anomaly_score'] = anomaly_scores
results_df['is_anomaly'] = binary_labels

# If we have ground truth, add it back for comparison
if y_true is not None:
    results_df['actual_class'] = y_true

# Extract top anomalies
top_anomalies = results_df.iloc[top_indices].copy()

# Save full results and predictions
results_df.to_csv('./static/LOF_results_full.csv', index=False)
binary_df = pd.DataFrame({'prediction': binary_labels})
binary_df.to_csv('./static/LOF_predictions.csv', index=False)

# Save top anomalies separately
top_anomalies.to_csv('./static/LOF_top_anomalies.csv', index=False)

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
    "model": "LOF",
    "contamination": contamination,
    "n_neighbors": n_neighbors,
    "anomaly_count": int(anomaly_count),
    "anomaly_percentage": float(anomaly_percentage),
    "accuracy": accuracy,
    "sample_size": len(binary_labels)
}

with open('./static/LOF_results.json', 'w') as f:
    json.dump(results, f, indent=4)

print(f"✅ Results saved for LOF in ./static/LOF_results.json")
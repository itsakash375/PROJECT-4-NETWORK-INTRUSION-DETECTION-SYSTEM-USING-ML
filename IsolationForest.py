import json
import os
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
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

# Set contamination parameter (expected proportion of anomalies)
# This can be tuned based on domain knowledge
contamination = 0.1  # Assuming 10% of data are anomalies

# Apply Isolation Forest
print(f"Applying Isolation Forest with contamination={contamination}...")
iso_forest = IsolationForest(
    n_estimators=100,
    max_samples='auto',
    contamination=contamination,
    random_state=42
)

# Fit and predict
iso_forest.fit(X_scaled)
raw_labels = iso_forest.predict(X_scaled)

# In Isolation Forest: -1 = anomaly, 1 = normal
# Convert to binary (0 = normal, 1 = anomaly) for consistency
binary_labels = (raw_labels == -1).astype(int)

# Get anomaly scores (higher = more anomalous)
anomaly_scores = -iso_forest.score_samples(X_scaled)

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
results_df.to_csv('./static/IsolationForest_results_full.csv', index=False)
binary_df = pd.DataFrame({'prediction': binary_labels})
binary_df.to_csv('./static/IsolationForest_predictions.csv', index=False)

# Save top anomalies separately
top_anomalies.to_csv('./static/IsolationForest_top_anomalies.csv', index=False)

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
    "model": "IsolationForest",
    "contamination": contamination,
    "anomaly_count": int(anomaly_count),
    "anomaly_percentage": float(anomaly_percentage),
    "accuracy": accuracy,
    "sample_size": len(binary_labels)
}

with open('./static/IsolationForest_results.json', 'w') as f:
    json.dump(results, f, indent=4)

print(f"✅ Results saved for IsolationForest in ./static/IsolationForest_results.json")
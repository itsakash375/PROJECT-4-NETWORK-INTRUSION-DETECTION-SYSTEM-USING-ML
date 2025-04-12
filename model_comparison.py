import json
import os
import pandas as pd
import numpy as np

# Define supervised models and their corresponding result files
supervised_models = {
    "Logistic Regression": "./static/Logistic_Regression_results.json",
    "KNN": "./static/KNeighbors_Classifier_results.json",
    "Random Forest": "./static/RandomForest_Classifier_results.json",
    "SVM": "./static/SVM_Classifier_results.json",
    "Neural Network": "./static/Neural_Network_results.json"
}

# Define unsupervised models and their corresponding result files
unsupervised_models = {
    "K-Means": "./static/KMeans_Clustering_results.json",
    "Isolation Forest": "./static/IsolationForest_results.json",
    "Local Outlier Factor": "./static/LOF_results.json",
    "One-Class SVM": "./static/OneClassSVM_results.json",
    "DBSCAN": "./static/DBSCAN_results.json"
}

# Load supervised model results
supervised_results = {}
for model, file_path in supervised_models.items():
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            supervised_results[model] = json.load(f)
    else:
        print(f"⚠️ Warning: Results file not found for {model}")

# Load unsupervised model results
unsupervised_results = {}
for model, file_path in unsupervised_models.items():
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            unsupervised_results[model] = json.load(f)
    else:
        print(f"⚠️ Warning: Results file not found for {model}")

# Create DataFrames for each model type
supervised_df = pd.DataFrame.from_dict(supervised_results, orient="index")
unsupervised_df = pd.DataFrame.from_dict(unsupervised_results, orient="index")

# Print supervised model results
if not supervised_df.empty:
    print("\n📊 Supervised Model Comparison:\n")
    print(supervised_df[['accuracy', 'precision', 'recall', 'f1', 'roc_auc']].fillna("N/A"))
    
    # Save supervised comparison as CSV
    supervised_df.to_csv("./static/supervised_model_comparison.csv")

# Print unsupervised model results
if not unsupervised_df.empty:
    print("\n📊 Unsupervised Model Comparison:\n")
    columns_to_show = ['anomaly_count', 'anomaly_percentage', 'silhouette_score', 'accuracy']
    print(unsupervised_df[unsupervised_df.columns.intersection(columns_to_show)].fillna("N/A"))
    
    # Save unsupervised comparison as CSV
    unsupervised_df.to_csv("./static/unsupervised_model_comparison.csv")

# Combine all results for the frontend
all_results = {**supervised_results, **unsupervised_results}

# Save all results in a single JSON file
with open("./static/model_comparison.json", "w") as f:
    json.dump(all_results, f, indent=4)

print("\n✅ Combined model comparison saved to ./static/model_comparison.json")

# Determine best models
best_supervised = None
best_supervised_accuracy = 0

if supervised_results:
    for model, results in supervised_results.items():
        if 'accuracy' in results and results['accuracy'] > best_supervised_accuracy:
            best_supervised_accuracy = results['accuracy']
            best_supervised = model

best_unsupervised = None
lowest_anomaly_percentage = float('inf')

if unsupervised_results:
    for model, results in unsupervised_results.items():
        if 'anomaly_percentage' in results and results['anomaly_percentage'] < lowest_anomaly_percentage:
            lowest_anomaly_percentage = results['anomaly_percentage']
            best_unsupervised = model

# Print best models
if best_supervised:
    print(f"\n🏆 Best Supervised Model: {best_supervised} (Accuracy: {best_supervised_accuracy:.4f})")

if best_unsupervised:
    print(f"\n🏆 Best Unsupervised Model: {best_unsupervised} (Anomaly %: {lowest_anomaly_percentage:.2f}%)")

# Save best model information
best_models = {
    "supervised": best_supervised,
    "supervised_accuracy": best_supervised_accuracy if best_supervised else None,
    "unsupervised": best_unsupervised,
    "unsupervised_anomaly_percentage": lowest_anomaly_percentage if best_unsupervised else None
}

with open("./static/best_models.json", "w") as f:
    json.dump(best_models, f, indent=4)

print("\n✅ Best models information saved to ./static/best_models.json")
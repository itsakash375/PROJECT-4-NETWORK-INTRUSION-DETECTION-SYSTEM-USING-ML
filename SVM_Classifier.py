import json
import os
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.svm import SVC
from sklearn.metrics import confusion_matrix, precision_score, recall_score, f1_score, roc_auc_score

data = pd.read_csv('./Data/filtered_data.csv')

data['class'] = (data['class'] != "normal").astype(int)

X = data.drop(columns=['class'])
y = data['class']


X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.1, random_state=42)


############################################################### Initialize and fit SVM model ##############################################


clf = SVC(probability=True, random_state=42)
clf.fit(X_train, y_train)


############################################################## Predict on test data ##########################################################################


pred_target = clf.predict(X_test)


######################################################################### Calculate accuracy ##################################################################


accuracy = np.sum(pred_target == y_test) / len(y_test)
print("Accuracy:", accuracy)
conf_matrix = confusion_matrix(y_test, pred_target)
print("Confusion Matrix:")
print(conf_matrix)

# Precision
precision = precision_score(y_test, pred_target)
print("Precision:", precision)

# Recall
recall = recall_score(y_test, pred_target)
print("Recall:", recall)

# F1-Score
f1 = f1_score(y_test, pred_target)
print("F1-Score:", f1)

# ROC-AUC Score
probabilities = clf.predict_proba(X_test)[:, 1]  # Probability of being in the positive class
roc_auc = roc_auc_score(y_test, probabilities)
print("ROC-AUC Score:", roc_auc)

model_name = "SVM_Classifier"  

# Define model evaluation results
# Ensure all metrics are correctly defined before saving results
results = {
    "accuracy": accuracy,
    "precision": precision,
    "recall": recall,
    "f1": f1,
    "roc_auc": roc_auc
}

# Ensure the 'static' folder exists
os.makedirs("./static", exist_ok=True)

# Save results to a separate JSON file for this model
file_path = f"./static/{model_name}_results.json"
with open(file_path, "w") as f:
    json.dump(results, f, indent=4)

print(f"Results saved for {model_name} in {file_path}")

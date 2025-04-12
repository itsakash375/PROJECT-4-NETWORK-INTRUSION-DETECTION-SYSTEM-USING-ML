import json
import os
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix, f1_score, precision_score, recall_score, roc_auc_score


data = pd.read_csv('./Data/filtered_data.csv')

data['class'] = (data['class'] != "normal").astype(int)

X = data.drop(columns=['class'])
y = data['class']

train_size = 0.9
train_samples = int(len(X) * train_size)


X_train = X[:train_samples]
y_train = y[:train_samples]
X_test = X[train_samples:]
y_test = y[train_samples:]

clf = LogisticRegression()
clf.fit(X_train, y_train)

pred_target = clf.predict(X_test)


accuracy = np.sum(pred_target == y_test) / len(y_test)
print("Accuracy:", accuracy)


accuracy = np.sum(pred_target == y_test) / len(y_test)
print("Accuracy:", accuracy)

conf_matrix = confusion_matrix(y_test, pred_target)
print("Confusion Matrix:")
print(conf_matrix)

precision = precision_score(y_test, pred_target)
print("Precision:", precision)

recall = recall_score(y_test, pred_target)
print("Recall:", recall)

f1 = f1_score(y_test, pred_target)
print("F1-Score:", f1)

probabilities = clf.predict_proba(X_test)[:, 1] 
roc_auc = roc_auc_score(y_test, probabilities)
print("ROC-AUC Score:", roc_auc)


model_name = "Logistic_Regression"  

results = {
    "accuracy": accuracy,
    "precision": precision,
    "recall": recall,
    "f1": f1,
    "roc_auc": roc_auc
}

os.makedirs("./static", exist_ok=True)

file_path = f"./static/{model_name}_results.json"
with open(file_path, "w") as f:
    json.dump(results, f, indent=4)

print(f"Results saved for {model_name} in {file_path}")

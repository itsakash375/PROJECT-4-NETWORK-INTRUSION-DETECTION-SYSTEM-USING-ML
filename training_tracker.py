# training_tracker.py
import time
import threading
import time
import random
import json
import os

# Global variable to store training progress
training_progress = {
    "is_training": False,
    "total_models": 0,
    "completed_models": 0,
    "current_model": "",
    "current_model_progress": 0,
    "status": "Not started",
    "overall_progress": 0
}

def train_models_task(selected_models, model_params):
    global training_progress
    
    try:
        print(f"Starting training of {len(selected_models)} models")
        
        # Initialize the training progress
        training_progress["is_training"] = True
        training_progress["total_models"] = len(selected_models)
        training_progress["completed_models"] = 0
        
        # Create a results structure to store model results
        training_results = {
            "supervisedModels": {},
            "unsupervisedModels": {},
            "supervisedMetrics": ["Accuracy", "Precision", "Recall", "F1", "AUC"],
            "unsupervisedMetrics": ["Silhouette", "DaviesBouldin", "CalinskiHarabasz"]
        }
        
        for i, model_name in enumerate(selected_models):
            # Update current model info
            training_progress["current_model"] = model_name
            training_progress["current_model_progress"] = 0
            training_progress["status"] = f"Starting training for {model_name}..."
            
            # Determine if model is supervised or unsupervised
            model_type = "supervised" if model_name in ["RandomForest", "SVM", "DecisionTree", "KNN", "LogisticRegression"] else "unsupervised"
            
            # Simulate model training (replace with actual training in production)
            for progress in range(0, 101, 5):
                training_progress["current_model_progress"] = progress
                
                if progress < 20:
                    training_progress["status"] = f"Initializing {model_name}..."
                elif progress < 40:
                    training_progress["status"] = f"Preparing data for {model_name}..."
                elif progress < 70:
                    training_progress["status"] = f"Training {model_name}..."
                elif progress < 90:
                    training_progress["status"] = f"Evaluating {model_name}..."
                else:
                    training_progress["status"] = f"Finalizing {model_name}..."
                
                # Calculate overall progress
                training_progress["overall_progress"] = int((i * 100 + progress) / len(selected_models))
                
                # Simulate work being done
                time.sleep(0.2)
            
            # Generate fake model results for demonstration
            import random
            if model_type == "supervised":
                model_results = {
                    "metrics": {
                        "Accuracy": round(random.uniform(0.85, 0.98), 4),
                        "Precision": round(random.uniform(0.80, 0.97), 4),
                        "Recall": round(random.uniform(0.82, 0.96), 4),
                        "F1": round(random.uniform(0.81, 0.97), 4),
                        "AUC": round(random.uniform(0.83, 0.99), 4)
                    }
                }
                training_results["supervisedModels"][model_name] = {
                    "results": model_results
                }
            else:
                model_results = {
                    "metrics": {
                        "Silhouette": round(random.uniform(0.4, 0.8), 4),
                        "DaviesBouldin": round(random.uniform(0.5, 2.0), 4),
                        "CalinskiHarabasz": round(random.uniform(100, 500), 4)
                    },
                    "anomaly_ratio": round(random.uniform(0.05, 0.2), 4),
                    "has_attack_types": True,
                    "predictedAttackTypes": [
                        {
                            "type": "Port Scanning",
                            "confidence": round(random.uniform(0.7, 0.95), 4),
                            "description": "Multiple connections to different ports detected."
                        },
                        {
                            "type": "DDoS Attack",
                            "confidence": round(random.uniform(0.65, 0.9), 4),
                            "description": "High volume traffic to a single destination."
                        }
                    ]
                }
                training_results["unsupervisedModels"][model_name] = {
                    "results": model_results
                }
            
            # Update progress
            training_progress["completed_models"] += 1
        
        # Save results
        print("Training complete, saving results...")
        save_training_results(training_results)
        print("Results saved successfully")
        
        # All models complete
        training_progress["overall_progress"] = 100
        training_progress["status"] = "Training complete!"
        training_progress["current_model_progress"] = 100
        
    except Exception as e:
        print(f"Error during training: {e}")
    finally:
        print("Training process finalized")
        training_progress["is_training"] = False

def save_training_results(results):
    """Save the training results to a file or database"""
    import json
    import os

    file_path = os.path.join(os.path.dirname(os.path.abspath(file)), 'training_results.json')
    print(f"Saving results to: {file_path}")

    with open(file_path, 'w') as f:
        json.dump(results, f, indent=2)

def simulate_model_results(model_name, model_type):
    """Generate sample model results for demonstration"""
    import random
    
    if model_type == "supervised":
        return {
            "metrics": {
                "Accuracy": random.uniform(0.85, 0.98),
                "Precision": random.uniform(0.80, 0.97),
                "Recall": random.uniform(0.82, 0.96),
                "F1": random.uniform(0.81, 0.97),
                "AUC": random.uniform(0.83, 0.99)
            }
        }
    else:
        return {
            "metrics": {
                "Silhouette": random.uniform(0.4, 0.8),
                "DaviesBouldin": random.uniform(0.5, 2.0),
                "CalinskiHarabasz": random.uniform(100, 500)
            },
            "anomaly_ratio": random.uniform(0.05, 0.2),
            "has_attack_types": True,
            "predictedAttackTypes": [
                {
                    "type": "Port Scanning",
                    "confidence": random.uniform(0.7, 0.95),
                    "description": "Multiple connections to different ports detected."
                },
                {
                    "type": "DDoS Attack",
                    "confidence": random.uniform(0.65, 0.9),
                    "description": "High volume traffic to a single destination."
                }
            ]
        }

def save_training_results(results):
    """Save the training results to a file or database"""
    # In a real implementation, this would save to a database
    # For demonstration, we'll save to a JSON file
    import json
    with open('training_results.json', 'w') as f:
        json.dump(results, f, indent=2)
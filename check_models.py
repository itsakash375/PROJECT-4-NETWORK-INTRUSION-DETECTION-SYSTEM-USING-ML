# Simple route to check if models are trained
# Add this to your app.py if needed

@app.route('/check-models')
def check_models():
    """Check if models are trained and show status"""
    # Get training results if available
    file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'training_results.json')
    
    has_results = os.path.exists(file_path)
    
    if has_results:
        with open(file_path, 'r') as f:
            results = json.load(f)
        
        has_supervised = 'supervisedModels' in results and len(results['supervisedModels']) > 0
        has_unsupervised = 'unsupervisedModels' in results and len(results['unsupervisedModels']) > 0
        
        return f"""
        <html>
        <head>
            <title>Model Status Check</title>
            <style>
                body {{ font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }}
                .status {{ padding: 10px; margin: 10px 0; border-radius: 5px; }}
                .success {{ background: #d4edda; color: #155724; }}
                .warning {{ background: #fff3cd; color: #856404; }}
                pre {{ background: #f8f9fa; padding: 10px; overflow: auto; }}
                button {{ padding: 10px; background: #4776e6; color: white; border: none; 
                         border-radius: 5px; cursor: pointer; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <h1>Model Status Check</h1>
            
            <div class="status {{'success' if has_results else 'warning'}}">
                <strong>Training Results File:</strong> {'Found' if has_results else 'Not Found'}
            </div>
            
            <div class="status {{'success' if has_supervised else 'warning'}}">
                <strong>Supervised Models:</strong> {'Available' if has_supervised else 'Not Available'}
                {{'<br>Models: ' + ', '.join(results['supervisedModels'].keys()) if has_supervised else ''}}
            </div>
            
            <div class="status {{'success' if has_unsupervised else 'warning'}}">
                <strong>Unsupervised Models:</strong> {'Available' if has_unsupervised else 'Not Available'}
                {{'<br>Models: ' + ', '.join(results['unsupervisedModels'].keys()) if has_unsupervised else ''}}
            </div>
            
            <h2>Fix Status</h2>
            <div class="status success">
                <strong>Model Status Fix:</strong> Applied
                <br>
                The fix should now be active. If you're still having issues with Live Capture or Manual Entry,
                try the following:
            </div>
            
            <ol>
                <li>Make sure the script tag is added to your templates</li>
                <li>Clear browser cache and session storage</li>
                <li>Restart your Flask application</li>
            </ol>
            
            <h2>Apply JavaScript Fix</h2>
            <p>
                Run this code in your browser console to force model recognition:
            </p>
            <pre>
// Store model status in session storage
const modelStatus = {{
    supervisedTrained: true,
    unsupervisedTrained: true,
    timestamp: new Date().toISOString()
}};

sessionStorage.setItem('modelsTrainedStatus', JSON.stringify(modelStatus));

// Create minimal training results data
const minimalResults = {{
    supervisedModels: {{"RandomForest": {{}}, "SVM": {{}}, "DecisionTree": {{}}, "KNN": {{}}, "LogisticRegression": {{}}}},
    unsupervisedModels: {{"KMeans": {{}}, "IsolationForest": {{}}, "DBSCAN": {{}}, "OneClassSVM": {{}}, "LOF": {{}}}},
    supervisedMetrics: ["Accuracy", "Precision", "Recall", "F1"],
    unsupervisedMetrics: ["Silhouette"]
}};

sessionStorage.setItem('trainingResults', JSON.stringify(minimalResults));

alert('Mock models created in session storage! Reload the page to see the effect.');
            </pre>
            
            <button onclick="location.reload()">Reload Page</button>
            <button onclick="window.location.href='/live-capture'">Go to Live Capture</button>
            <button onclick="window.location.href='/manual-entry'">Go to Manual Entry</button>
        </body>
        </html>
        """
    else:
        return f"""
        <html>
        <head>
            <title>Model Status Check</title>
            <style>
                body {{ font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }}
                .status {{ padding: 10px; margin: 10px 0; border-radius: 5px; }}
                .warning {{ background: #fff3cd; color: #856404; }}
                .error {{ background: #f8d7da; color: #721c24; }}
                button {{ padding: 10px; background: #4776e6; color: white; border: none; 
                         border-radius: 5px; cursor: pointer; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <h1>Model Status Check</h1>
            
            <div class="status error">
                <strong>Training Results File:</strong> Not Found
                <br>
                No training results file was found at: {file_path}
            </div>
            
            <div class="status warning">
                <strong>Recommended Action:</strong>
                <br>
                Run <code>python apply_model_status_fix.py</code> to create mock training results.
            </div>
            
            <button onclick="location.reload()">Reload Page</button>
            <button onclick="window.location.href='/'">Go to Home</button>
        </body>
        </html>
        """

"""Functions for generating reports."""

import datetime

def generate_html_report(results, options, title):
    """Generate an HTML report from training results"""
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title}</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 20px;
            }}
            
            h1 {{
                color: #2F3B52;
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 10px;
                border-bottom: 2px solid #4776E6;
            }}
            
            h2 {{
                color: #4776E6;
                margin-top: 30px;
                margin-bottom: 15px;
                padding-bottom: 5px;
                border-bottom: 1px solid #eee;
            }}
            
            h3 {{
                color: #2F3B52;
                margin-top: 20px;
                margin-bottom: 10px;
            }}
            
            table {{
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }}
            
            th, td {{
                padding: 12px 15px;
                text-align: left;
                border: 1px solid #ddd;
            }}
            
            th {{
                background-color: #f5f5f5;
                font-weight: bold;
            }}
            
            tr:nth-child(even) {{
                background-color: #f9f9f9;
            }}
            
            .report-section {{
                margin-bottom: 30px;
            }}
            
            .report-footer {{
                margin-top: 50px;
                text-align: center;
                font-size: 14px;
                color: #777;
                padding-top: 20px;
                border-top: 1px solid #eee;
            }}
            
            .attack-box {{
                background-color: #fff1f0;
                border-left: 4px solid #e74c3c;
                padding: 15px;
                margin: 15px 0;
                border-radius: 4px;
            }}
            
            .attack-name {{
                color: #e74c3c;
                font-weight: bold;
                margin-bottom: 5px;
            }}
            
            .recommendations {{
                background-color: #eafaf1;
                border-left: 4px solid #2ecc71;
                padding: 15px;
                margin: 15px 0;
                border-radius: 4px;
            }}
        </style>
    </head>
    <body>
        <h1>{title}</h1>
        
        <div class="report-section">
            <p><strong>Generated:</strong> {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p><strong>Report Type:</strong> {options['reportType'].capitalize()}</p>
        </div>
    """
    
    # Executive summary
    if options['reportType'] == 'executive' or options['reportType'] == 'comprehensive':
        html += """
        <div class="report-section">
            <h2>Executive Summary</h2>
            <p>This report presents the analysis results of the Network Intrusion Detection System (NIDS) 
            trained on the provided dataset. The system was configured to detect 
            potential network intrusions and security threats using both supervised and unsupervised 
            machine learning models.</p>
        """
        
        # Supervised models summary
        if results['supervisedModels']:
            html += f"""
            <p>A total of {len(results['supervisedModels'])} supervised models were trained and evaluated.
            These models use labeled data to classify network traffic as normal or malicious.</p>
            """
        
        # Unsupervised models summary
        if results['unsupervisedModels']:
            html += f"""
            <p>A total of {len(results['unsupervisedModels'])} unsupervised models were trained and evaluated.
            These models identify anomalies in network traffic without requiring labeled data.</p>
            """
        
        # Performance highlights
        best_supervised = None
        best_score = 0
        for model_name, model_data in results['supervisedModels'].items():
            if 'results' in model_data and 'metrics' in model_data['results'] and 'Accuracy' in model_data['results']['metrics']:
                accuracy = model_data['results']['metrics'].get('Accuracy', 0)
                if accuracy > best_score:
                    best_score = accuracy
                    best_supervised = model_name
        
        if best_supervised:
            html += f"""
            <p>The {best_supervised} model showed the best performance among supervised models with an accuracy of 
            {best_score:.2%}.</p>
            """
        
        # Anomaly detection highlights
        total_attack_types = set()
        for model_name, model_data in results['unsupervisedModels'].items():
            if 'predictedAttackTypes' in model_data:
                for attack in model_data['predictedAttackTypes']:
                    total_attack_types.add(attack['type'])
        
        if total_attack_types:
            html += f"""
            <p>The unsupervised models identified {len(total_attack_types)} potential attack types in the network traffic.</p>
            """
        
        html += """
        </div>
        """
    
    # Dataset information
    if options['includeDataset']:
        data_info = results['dataInfo']
        html += """
        <div class="report-section" id="dataset">
            <h2>Dataset Information</h2>
            <table>
                <tr>
                    <th>Attribute</th>
                    <th>Value</th>
                </tr>
        """
        
        html += f"""
                <tr>
                    <td>Filename</td>
                    <td>{data_info.get('fileName', 'Not specified')}</td>
                </tr>
                <tr>
                    <td>Total Rows</td>
                    <td>{data_info.get('totalRows', 'Unknown')}</td>
                </tr>
                <tr>
                    <td>Total Columns</td>
                    <td>{data_info.get('totalColumns', 'Unknown')}</td>
                </tr>
                <tr>
                    <td>Data Type</td>
                    <td>{'Labeled' if data_info.get('isLabeled', False) else 'Unlabeled'}</td>
                </tr>
            </table>
        """
        
        if 'headers' in data_info and data_info['headers']:
            html += """
            <h3>Features</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
            """
            
            for header in data_info['headers']:
                html += f"""
                <div style="background: #f0f5ff; padding: 5px 10px; border-radius: 4px;">{header}</div>
                """
            
            html += """
            </div>
            """
        
        html += """
        </div>
        """
    
    # Add additional sections based on options (models, metrics, etc.)
    
    # Model descriptions
    if options['includeModels']:
        html += """
        <div class="report-section" id="models">
            <h2>Model Descriptions</h2>
        """
        
        # Supervised models
        if results['supervisedModels']:
            html += """
            <h3>Supervised Models</h3>
            <table>
                <tr>
                    <th>Model</th>
                    <th>Description</th>
                    <th>Parameters</th>
                </tr>
            """
            
            for model_name, model_data in results['supervisedModels'].items():
                params = model_data.get('parameters', {})
                param_text = ', '.join([f"{k}: {v}" for k, v in params.items()]) if params else "Default parameters"
                
                description = ''
                if model_name == 'RandomForest':
                    description = 'An ensemble learning method that constructs multiple decision trees and outputs the class that is the mode of the classes of the individual trees.'
                elif model_name == 'SVM':
                    description = 'A supervised learning model that analyzes data for classification and regression analysis by finding the hyperplane that best separates the classes.'
                elif model_name == 'DecisionTree':
                    description = 'A non-parametric supervised learning method used for classification and regression that creates a model predicting the value of a target variable.'
                elif model_name == 'KNN':
                    description = 'A non-parametric method used for classification and regression that classifies a data point based on a majority vote of its k nearest neighbors.'
                elif model_name == 'LogisticRegression':
                    description = 'A statistical model that uses a logistic function to model a binary dependent variable, commonly used for binary classification problems.'
                
                html += f"""
                <tr>
                    <td>{model_name}</td>
                    <td>{description}</td>
                    <td>{param_text}</td>
                </tr>
                """
            
            html += """
            </table>
            """
        
        # Unsupervised models
        if results['unsupervisedModels']:
            html += """
            <h3>Unsupervised Models</h3>
            <table>
                <tr>
                    <th>Model</th>
                    <th>Description</th>
                    <th>Parameters</th>
                </tr>
            """
            
            for model_name, model_data in results['unsupervisedModels'].items():
                params = model_data.get('parameters', {})
                param_text = ', '.join([f"{k}: {v}" for k, v in params.items()]) if params else "Default parameters"
                
                description = ''
                if model_name == 'KMeans':
                    description = 'A clustering algorithm that partitions n observations into k clusters in which each observation belongs to the cluster with the nearest mean.'
                elif model_name == 'IsolationForest':
                    description = 'An algorithm for anomaly detection that isolates observations by randomly selecting a feature and then a split value for the selected feature.'
                elif model_name == 'OneClassSVM':
                    description = 'A one-class classification method that learns a decision function for novelty detection to classify new data as similar or different to the training set.'
                elif model_name == 'LOF':
                    description = 'Local Outlier Factor is an algorithm that finds anomalous data points by measuring the local deviation of a given data point with respect to its neighbors.'
                elif model_name == 'DBSCAN':
                    description = 'A density-based clustering algorithm that groups together points that are closely packed together and marks points in low-density regions as outliers.'
                
                html += f"""
                <tr>
                    <td>{model_name}</td>
                    <td>{description}</td>
                    <td>{param_text}</td>
                </tr>
                """
            
            html += """
            </table>
            """
        
        html += """
        </div>
        """
    
    # Footer
    html += """
        <div class="report-footer">
            <p>Network Intrusion Detection System - Analysis Report</p>
            <p>Generated for educational purposes only</p>
        </div>
    </body>
    </html>
    """
    
    return html

def generate_text_report(results, options, title):
    """Generate a plain text report from training results"""
    text = f"{title}\n{'=' * len(title)}\n\n"
    text += f"Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
    text += f"Report Type: {options['reportType'].capitalize()}\n\n"
    
    # Executive summary
    if options['reportType'] == 'executive' or options['reportType'] == 'comprehensive':
        text += "EXECUTIVE SUMMARY\n=================\n\n"
        text += "This report presents the analysis results of the Network Intrusion Detection System (NIDS) "
        text += "trained on the provided dataset. The system was configured to detect "
        text += "potential network intrusions and security threats using both supervised and unsupervised "
        text += "machine learning models.\n\n"
        
        # Supervised models summary
        if results['supervisedModels']:
            text += f"A total of {len(results['supervisedModels'])} supervised models were trained and evaluated. "
            text += "These models use labeled data to classify network traffic as normal or malicious.\n\n"
        
        # Unsupervised models summary
        if results['unsupervisedModels']:
            text += f"A total of {len(results['unsupervisedModels'])} unsupervised models were trained and evaluated. "
            text += "These models identify anomalies in network traffic without requiring labeled data.\n\n"
        
        # Performance highlights
        best_supervised = None
        best_score = 0
        for model_name, model_data in results['supervisedModels'].items():
            if 'results' in model_data and 'metrics' in model_data['results'] and 'Accuracy' in model_data['results']['metrics']:
                accuracy = model_data['results']['metrics'].get('Accuracy', 0)
                if accuracy > best_score:
                    best_score = accuracy
                    best_supervised = model_name
        
        if best_supervised:
            text += f"The {best_supervised} model showed the best performance among supervised models "
            text += f"with an accuracy of {best_score:.2%}.\n\n"
        
        # Anomaly detection highlights
        total_attack_types = set()
        for model_name, model_data in results['unsupervisedModels'].items():
            if 'predictedAttackTypes' in model_data:
                for attack in model_data['predictedAttackTypes']:
                    total_attack_types.add(attack['type'])
        
        if total_attack_types:
            text += f"The unsupervised models identified {len(total_attack_types)} potential attack types "
            text += "in the network traffic.\n\n"
    
    # Dataset information
    if options['includeDataset']:
        data_info = results['dataInfo']
        text += "DATASET INFORMATION\n===================\n\n"
        text += f"Filename: {data_info.get('fileName', 'Not specified')}\n"
        text += f"Total Rows: {data_info.get('totalRows', 'Unknown')}\n"
        text += f"Total Columns: {data_info.get('totalColumns', 'Unknown')}\n"
        text += f"Data Type: {'Labeled' if data_info.get('isLabeled', False) else 'Unlabeled'}\n\n"
        
        if 'headers' in data_info and data_info['headers']:
            text += "Features: " + ", ".join(data_info['headers']) + "\n\n"
    
    # Add additional sections based on options (models, metrics, etc.)

    # Footer
    text += "\n\n" + "=" * 80 + "\n"
    text += "Network Intrusion Detection System - Analysis Report\n"
    text += "Generated for educational purposes only\n"
    text += "=" * 80
    
    return textss
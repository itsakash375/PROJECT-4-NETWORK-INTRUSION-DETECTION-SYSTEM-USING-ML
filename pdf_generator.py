import os
import json
import tempfile
import traceback
from datetime import datetime
from flask import make_response, jsonify
from jinja2 import Template

# Create PDF export function for Flask route
def generate_pdf_report(model_name, source, analysis_data_json='{}'):
    """
    Generate a comprehensive PDF report based on analysis data
    
    Args:
        model_name (str): The ML model used
        source (str): Data source (results, manual, capture)
        analysis_data_json (str): JSON string with analysis data
    
    Returns:
        Response object with PDF data or error JSON
    """
    try:
        # Parse analysis data
        try:
            analysis_data = json.loads(analysis_data_json)
        except:
            # Default data if parsing fails
            analysis_data = {}
        
        # Load HTML template
        template_path = os.path.join(os.path.dirname(__file__), 'templates', 'pdf_report_template.html')
        
        # If template doesn't exist, use inline template
        if not os.path.exists(template_path):
            template_html = create_inline_template()
        else:
            with open(template_path, 'r') as f:
                template_html = f.read()
        
        # Check for model results from files
        model_results = {}
        result_file = f'./static/{model_name}_results.json'
        
        if os.path.exists(result_file):
            try:
                with open(result_file, 'r') as f:
                    model_results = json.load(f)
            except:
                print(f"Warning: Could not load model results from {result_file}")
        
        # Default threat types for use if none in analysis data
        default_threat_types = [
            "Port Scanning - TCP Connect", 
            "DoS Attack - SYN Flood",
            "Brute Force - SSH",
            "Data Exfiltration - DNS Tunneling",
            "Command & Control - Beaconing"
        ]
        
        # Extract threat types or use defaults
        threat_types = []
        if analysis_data and 'threatAnalysis' in analysis_data and 'detectedThreats' in analysis_data['threatAnalysis']:
            threat_types = analysis_data['threatAnalysis']['detectedThreats']
        
        if not threat_types and 'is_anomaly' in model_results and model_results['is_anomaly'] == 1:
            # Use defaults if no threats detected but there are anomalies
            threat_types = default_threat_types[:2]  # Just use top 2 defaults
        
        # Determine risk level
        risk_level = "Low"
        if threat_types:
            risk_level = "High" if len(threat_types) > 2 else "Medium"
        elif model_results.get('anomaly_count', 0) > 5:
            risk_level = "Medium"
        
        # Model metrics from either analysis data or result file
        model_metrics = {}
        if 'modelMetrics' in analysis_data and analysis_data['modelMetrics']:
            model_metrics = analysis_data['modelMetrics']
        elif model_results:
            model_metrics = model_results
        
        # Get manual entry data if source is 'manual'
        manual_data = {}
        if source == 'manual' and 'manualEntryData' in analysis_data:
            manual_data = analysis_data['manualEntryData']
        
        # Get capture data if source is 'capture'
        capture_data = {}
        if source == 'capture' and 'captureData' in analysis_data:
            capture_data = analysis_data['captureData']
        
        # Generate recommendations based on threat types or model
        recommendations = []
        if 'recommendations' in analysis_data and analysis_data['recommendations']:
            recommendations = analysis_data['recommendations']
        elif threat_types:
            recommendations = generate_recommendations(threat_types[0])
        else:
            recommendations = [
                "Regularly update all systems and applications with security patches",
                "Implement network segmentation to limit lateral movement",
                "Deploy intrusion detection and prevention systems",
                "Conduct regular security audits and penetration testing"
            ]
        
        # Model characteristics
        model_characteristics = {}
        if 'modelCharacteristics' in analysis_data:
            model_characteristics = analysis_data['modelCharacteristics']
        else:
            model_characteristics = get_model_characteristics(model_name)
        
        # Prepare template variables
        template_vars = {
            'title': f"ML Intrusion Detection Report - {model_name}",
            'model_name': model_name,
            'source': source,
            'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'risk_level': risk_level,
            'threat_types': threat_types,
            'model_metrics': model_metrics,
            'model_characteristics': model_characteristics,
            'recommendations': recommendations,
            'manual_data': manual_data,
            'capture_data': capture_data,
            'analysis_data': analysis_data
        }
        
        # Render template
        template = Template(template_html)
        html_content = template.render(**template_vars)
        
        # Create temporary files
        with tempfile.NamedTemporaryFile(suffix='.html', delete=False) as html_file:
            html_path = html_file.name
            html_file.write(html_content.encode('utf-8'))
        
        # Generate PDF using WeasyPrint
        try:
            pdf = HTML(filename=html_path).write_pdf()
        except Exception as e:
            os.unlink(html_path)  # Clean up HTML file
            print(f"Error generating PDF with WeasyPrint: {e}")
            print(traceback.format_exc())
            return make_error_response()
        
        # Clean up
        os.unlink(html_path)
        
        # Create response
        response = make_response(pdf)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename={model_name}_report.pdf'
        
        return response
        
    except Exception as e:
        print(f"Error generating PDF: {e}")
        print(traceback.format_exc())
        return make_error_response()


def create_inline_template():
    """Create HTML template for PDF report if template file doesn't exist"""
    return """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{ title }}</title>
    <style>
        @page {
            size: A4;
            margin: 1cm;
        }
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        .header {
            border-bottom: 1px solid #4a6fa5;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header h1 {
            color: #4a6fa5;
            margin: 0;
            font-size: 24px;
        }
        .date {
            color: #777;
            font-size: 14px;
        }
        h2 {
            color: #4a6fa5;
            margin-top: 25px;
            margin-bottom: 15px;
            font-size: 20px;
            page-break-after: avoid;
        }
        h3 {
            color: #333;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 16px;
            page-break-after: avoid;
        }
        p {
            margin: 0 0 12px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 14px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .section {
            margin-bottom: 30px;
        }
        .summary-box {
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .high-risk {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .medium-risk {
            background-color: #fff3cd;
            color: #856404;
            border: 1px solid #ffeeba;
        }
        .low-risk {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .threat-item {
            background-color: #f8f9fa;
            padding: 10px;
            margin-bottom: 10px;
            border-left: 4px solid #dc3545;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 12px;
            color: #777;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        .metric-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 20px 0;
        }
        .metric-card {
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 4px;
            border: 1px solid #ddd;
        }
        .metric-title {
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 14px;
            color: #4a6fa5;
        }
        .metric-value {
            font-size: 18px;
            font-weight: bold;
        }
        .model-details {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .recommendation-list {
            list-style-type: none;
            padding: 0;
        }
        .recommendation-list li {
            padding: 10px;
            margin-bottom: 10px;
            background-color: #e9f7fe;
            border-left: 4px solid #4a6fa5;
        }
        .model-feature {
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ title }}</h1>
        <p class="date">Generated: {{ date }}</p>
    </div>
    
    <div class="section">
        <h2>Analysis Overview</h2>
        <p><strong>Model:</strong> {{ model_name }}</p>
        <p><strong>Analysis Type:</strong> {{ 'Manual Entry Analysis' if source == 'manual' else 'Live Capture Analysis' if source == 'capture' else 'Dataset Analysis' }}</p>
        
        <!-- Risk summary based on risk level -->
        {% set risk_class = 'high-risk' if risk_level == 'High' else 'medium-risk' if risk_level == 'Medium' else 'low-risk' %}
        {% set risk_icon = '⚠️' if risk_level in ['High', 'Medium'] else '✓' %}
        
        <div class="summary-box {{ risk_class }}">
            <h3>{{ risk_icon }} {{ risk_level }} RISK ASSESSMENT</h3>
            {% if risk_level in ['High', 'Medium'] %}
                <p>The analysis has identified potential security threats in your network traffic.</p>
                {% if threat_types %}
                    <p><strong>Primary Threat Type:</strong> {{ threat_types[0] }}</p>
                {% endif %}
                {% if model_metrics.anomaly_count %}
                    <p><strong>Anomaly Count:</strong> {{ model_metrics.anomaly_count }}</p>
                {% endif %}
                {% if model_metrics.anomaly_percentage %}
                    <p><strong>Anomaly Percentage:</strong> {{ model_metrics.anomaly_percentage|float|round(2) }}% of analyzed traffic</p>
                {% endif %}
            {% else %}
                <p>The analysis indicates normal network behavior with no significant anomalies detected.</p>
                <p><strong>Network Status:</strong> Normal traffic patterns observed</p>
            {% endif %}
        </div>
    </div>
    
    <div class="section">
        <h2>Threat Analysis</h2>
        
        {% if threat_types %}
            <h3>Detected Threat Patterns</h3>
            <p>The following threat patterns were identified in the analyzed traffic:</p>
            
            {% for threat in threat_types %}
                <div class="threat-item">
                    <strong>{{ threat }}</strong>
                </div>
            {% endfor %}
            
            <!-- Add specific analysis for the primary threat -->
            {% set primary_threat = threat_types[0] %}
            
            {% if "DoS" in primary_threat %}
                <h3>Denial of Service (DoS) Attack Analysis</h3>
                <p>The detected DoS pattern shows characteristics of a volumetric attack designed to overwhelm network resources.</p>
                <ul>
                    <li><strong>Attack Vector:</strong> {{ primary_threat.split('-')[1].strip() if '-' in primary_threat else 'Network flood' }}</li>
                    <li><strong>Traffic Pattern:</strong> High volume of packets with similar characteristics</li>
                    <li><strong>Target Resources:</strong> Network bandwidth and server processing capacity</li>
                </ul>
            {% elif "Port Scan" in primary_threat %}
                <h3>Port Scanning Analysis</h3>
                <p>The detected scanning activity indicates reconnaissance attempts to identify open services.</p>
                <ul>
                    <li><strong>Scan Type:</strong> {{ primary_threat.split('-')[1].strip() if '-' in primary_threat else 'General port scan' }}</li>
                    <li><strong>Traffic Pattern:</strong> Sequential or randomized connection attempts to multiple ports</li>
                    <li><strong>Risk Level:</strong> Medium - typically precedes targeted attacks</li>
                </ul>
            {% elif "Brute Force" in primary_threat %}
                <h3>Brute Force Attack Analysis</h3>
                <p>The detected brute force pattern shows repeated authentication attempts to gain unauthorized access.</p>
                <ul>
                    <li><strong>Target Service:</strong> {{ primary_threat.split('-')[1].strip() if '-' in primary_threat else 'Authentication service' }}</li>
                    <li><strong>Traffic Pattern:</strong> Multiple failed login attempts in rapid succession</li>
                    <li><strong>Risk Level:</strong> High - active attempt to compromise access controls</li>
                </ul>
            {% elif "Data Exfiltration" in primary_threat %}
                <h3>Data Exfiltration Analysis</h3>
                <p>The detected exfiltration pattern indicates potential data theft or unauthorized data transfer.</p>
                <ul>
                    <li><strong>Exfiltration Method:</strong> {{ primary_threat.split('-')[1].strip() if '-' in primary_threat else 'Network transfer' }}</li>
                    <li><strong>Traffic Pattern:</strong> Unusual outbound data volume or connection patterns</li>
                    <li><strong>Risk Level:</strong> Critical - active data theft in progress</li>
                </ul>
            {% endif %}
        {% else %}
            <p>No specific threat patterns were identified in the analyzed traffic.</p>
            <p>The network traffic appears to follow normal expected patterns with no significant deviations that would indicate malicious activity.</p>
        {% endif %}
    </div>
    
    <!-- Different sections based on source -->
    {% if source == 'manual' and manual_data %}
        <div class="section">
            <h2>Manual Entry Details</h2>
            <table>
                <tr>
                    <th>Parameter</th>
                    <th>Value</th>
                </tr>
                {% for key, value in manual_data.items() %}
                <tr>
                    <td>{{ key }}</td>
                    <td>{{ value }}</td>
                </tr>
                {% endfor %}
            </table>
        </div>
    {% elif source == 'capture' and capture_data %}
        <div class="section">
            <h2>Network Capture Details</h2>
            <table>
                <tr>
                    <th>Parameter</th>
                    <th>Value</th>
                </tr>
                {% for key, value in capture_data.items() %}
                <tr>
                    <td>{{ key }}</td>
                    <td>{{ value }}</td>
                </tr>
                {% endfor %}
            </table>
        </div>
    {% endif %}
    
    <div class="section">
        <h2>Model Details</h2>
        <div class="model-details">
            <h3>{{ model_name }}</h3>
            <p class="model-feature"><strong>Description:</strong> {{ model_characteristics.description }}</p>
            
            <h4>Strengths:</h4>
            <ul>
            {% for strength in model_characteristics.strengths %}
                <li>{{ strength }}</li>
            {% endfor %}
            </ul>
            
            <h4>Limitations:</h4>
            <ul>
            {% for limitation in model_characteristics.limitations %}
                <li>{{ limitation }}</li>
            {% endfor %}
            </ul>
        </div>
        
        <!-- Model Metrics -->
        <h3>Model Performance Metrics</h3>
        <div class="metric-grid">
            {% if model_metrics.accuracy is defined and model_metrics.accuracy != None %}
                <div class="metric-card">
                    <div class="metric-title">Accuracy</div>
                    <div class="metric-value">{{ (model_metrics.accuracy|float * 100)|round(2) }}%</div>
                </div>
            {% endif %}
            
            {% if model_metrics.precision is defined and model_metrics.precision != None %}
                <div class="metric-card">
                    <div class="metric-title">Precision</div>
                    <div class="metric-value">{{ (model_metrics.precision|float * 100)|round(2) }}%</div>
                </div>
            {% endif %}
            
            {% if model_metrics.recall is defined and model_metrics.recall != None %}
                <div class="metric-card">
                    <div class="metric-title">Recall</div>
                    <div class="metric-value">{{ (model_metrics.recall|float * 100)|round(2) }}%</div>
                </div>
            {% endif %}
            
            {% if model_metrics.f1 is defined and model_metrics.f1 != None %}
                <div class="metric-card">
                    <div class="metric-title">F1 Score</div>
                    <div class="metric-value">{{ (model_metrics.f1|float * 100)|round(2) }}%</div>
                </div>
            {% endif %}
            
            {% if model_metrics.anomaly_count is defined and model_metrics.anomaly_count != None %}
                <div class="metric-card">
                    <div class="metric-title">Anomaly Count</div>
                    <div class="metric-value">{{ model_metrics.anomaly_count }}</div>
                </div>
            {% endif %}
            
            {% if model_metrics.anomaly_percentage is defined and model_metrics.anomaly_percentage != None %}
                <div class="metric-card">
                    <div class="metric-title">Anomaly Percentage</div>
                    <div class="metric-value">{{ model_metrics.anomaly_percentage|float|round(2) }}%</div>
                </div>
            {% endif %}
            
            {% if model_metrics.silhouette_score is defined and model_metrics.silhouette_score != None %}
                <div class="metric-card">
                    <div class="metric-title">Silhouette Score</div>
                    <div class="metric-value">{{ model_metrics.silhouette_score|float|round(3) }}</div>
                </div>
            {% endif %}
        </div>
    </div>
    
    <div class="section">
        <h2>Security Recommendations</h2>
        <p>Based on the analysis results, the following security measures are recommended:</p>
        <ul class="recommendation-list">
            {% for recommendation in recommendations %}
                <li>{{ recommendation }}</li>
            {% endfor %}
        </ul>
    </div>
    
    <div class="footer">
        <p>ML Intrusion Detection System &copy; 2025</p>
        <p>This report was automatically generated and should be reviewed by security professionals.</p>
    </div>
</body>
</html>"""


def make_error_response():
    """Create simple PDF with error message when generation fails"""
    try:
        # Create simple HTML
        html = """<!DOCTYPE html>
        <html>
        <head>
            <title>Error Generating PDF</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                h1 { color: #dc3545; }
                .container { max-width: 800px; margin: 0 auto; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Error Generating PDF Report</h1>
                <p>We encountered an error while generating your PDF report. This could be due to:</p>
                <ul>
                    <li>Missing or incomplete data</li>
                    <li>Server processing issues</li>
                    <li>PDF generation library limitations</li>
                </ul>
                <p>Please try again or contact support if the issue persists.</p>
                <p>You can also try the CSV export option as an alternative.</p>
                <hr>
                <p style="color: #666;">ML Intrusion Detection System &copy; 2025</p>
            </div>
        </body>
        </html>"""
        
        # Generate PDF
        pdf = HTML(string=html).write_pdf()
        
        # Create response
        response = make_response(pdf)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = 'attachment; filename=error_report.pdf'
        
        return response
    except:
        # If even the error PDF fails, return JSON error
        return jsonify({
            "status": "error",
            "message": "Could not generate PDF report. Please try exporting as CSV instead."
        }), 500


def generate_recommendations(threat_type):
    """Generate recommendations based on threat type"""
    if "DoS" in threat_type:
        return [
            "Implement rate limiting for connections from suspicious source IPs",
            "Configure your firewall to block traffic from attacking source IP addresses",
            "Deploy a DDoS protection service if attacks persist",
            "Monitor network traffic volumes and set alerts for sudden spikes"
        ]
    elif "Port Scan" in threat_type:
        return [
            "Block the scanning IP addresses in your firewall",
            "Ensure all unused ports are closed",
            "Implement port knocking or similar techniques for sensitive services",
            "Review security of services running on the scanned ports"
        ]
    elif "Brute Force" in threat_type:
        return [
            "Implement account lockout policies after multiple failed attempts",
            "Enable two-factor authentication for all critical services",
            "Use strong password policies and consider password managers",
            "Implement IP-based access restrictions for sensitive services"
        ]
    elif "Data Exfiltration" in threat_type:
        return [
            "Implement data loss prevention controls on critical systems",
            "Monitor and restrict outbound traffic, especially to unusual destinations",
            "Encrypt sensitive data at rest and in transit",
            "Implement egress filtering at network boundaries"
        ]
    elif "Command & Control" in threat_type:
        return [
            "Block communication with known C2 servers and suspicious domains",
            "Implement strict egress filtering at network boundaries",
            "Deploy endpoint detection and response (EDR) solutions",
            "Monitor for unusual outbound connections, especially during off-hours"
        ]
    elif "Web Attack" in threat_type:
        return [
            "Implement a web application firewall (WAF)",
            "Keep web server software and frameworks updated",
            "Validate and sanitize all user inputs",
            "Implement proper Content Security Policy (CSP) headers"
        ]
    elif "MITM" in threat_type:
        return [
            "Enforce HTTPS for all web traffic and services",
            "Implement certificate pinning for critical applications",
            "Use secure DNS protocols like DNS-over-HTTPS or DNS-over-TLS",
            "Monitor for unusual certificate changes or anomalies"
        ]
    elif "Malware" in threat_type:
        return [
            "Deploy endpoint protection with real-time monitoring capabilities",
            "Implement network segmentation to contain malware spread",
            "Keep all systems and software updated with security patches",
            "Implement application allowlisting on critical systems"
        ]
    else:
        return [
            "Regularly update all systems and applications with security patches",
            "Implement network segmentation to limit lateral movement",
            "Deploy intrusion detection and prevention systems",
            "Conduct regular security audits and penetration testing"
        ]


def get_model_characteristics(model_name):
    """Get model characteristics for the report"""
    characteristics = {
        "IsolationForest": {
            "description": "An ensemble-based method that isolates anomalies by recursively partitioning the data space",
            "strengths": ["Effective with high-dimensional data", "Handles complex, non-linear patterns", "Fast training time"],
            "limitations": ["May miss local anomalies", "Performance affected by irrelevant features"],
            "bestUseCase": "General-purpose anomaly detection with diverse traffic patterns"
        },
        "LOF": {
            "description": "Detects anomalies by measuring the local deviation of a data point with respect to its neighbors",
            "strengths": ["Excellent at finding local anomalies", "Works well with varying densities", "Provides meaningful anomaly scores"],
            "limitations": ["Sensitive to parameter choices", "Computationally intensive for large datasets"],
            "bestUseCase": "Detecting anomalies that are only abnormal in their local context"
        },
        "OneClassSVM": {
            "description": "Maps data to a high-dimensional space and finds a hyperplane that separates normal data from anomalies",
            "strengths": ["Effective with well-defined boundaries", "Works well with medium-sized datasets", "Handles complex decision boundaries"],
            "limitations": ["Sensitive to parameter tuning", "Can be slow on large datasets"],
            "bestUseCase": "When normal behavior follows a clear pattern and anomalies are distinctly different"
        },
        "KMeans": {
            "description": "Groups data into clusters and identifies points far from cluster centers as anomalies",
            "strengths": ["Simple to implement", "Fast computation", "Intuitive interpretation"],
            "limitations": ["Assumes spherical clusters", "Predefined number of clusters required"],
            "bestUseCase": "Basic anomaly detection when traffic forms distinct groups"
        },
        "DBSCAN": {
            "description": "Density-based clustering algorithm that identifies points in low-density regions as anomalies",
            "strengths": ["Discovers clusters of arbitrary shape", "Automatically identifies noise points", "No predefined number of clusters needed"],
            "limitations": ["Sensitive to density parameters", "Struggles with varying densities"],
            "bestUseCase": "Detecting anomalies in data with complex cluster structures"
        },
        "RandomForest_Classifier": {
            "description": "Ensemble learning method that constructs multiple decision trees for classification",
            "strengths": ["High accuracy", "Robust to overfitting", "Handles large feature sets"],
            "limitations": ["Requires labeled data", "Can be resource-intensive"],
            "bestUseCase": "Supervised classification with well-labeled network traffic data"
        },
        "Neural_Network": {
            "description": "Deep learning model that can learn complex patterns in network traffic",
            "strengths": ["Captures complex non-linear relationships", "Highly adaptable", "State-of-the-art performance"],
            "limitations": ["Requires significant labeled data", "Black-box model with limited interpretability"],
            "bestUseCase": "Complex classification tasks with sufficient training data"
        },
        "Logistic_Regression": {
            "description": "Statistical model that predicts binary outcomes using a logistic function",
            "strengths": ["Fast training and prediction", "Highly interpretable", "Works well with linearly separable data"],
            "limitations": ["Limited capacity for complex relationships", "Sensitive to outliers"],
            "bestUseCase": "Quick baseline models and understanding feature importance"
        },
        "KNeighbors_Classifier": {
            "description": "Classification based on majority vote of nearest neighbors",
            "strengths": ["Simple and intuitive", "No training phase", "Adapts to new patterns"],
            "limitations": ["Slow for large datasets", "Sensitive to irrelevant features", "Memory intensive"],
            "bestUseCase": "Smaller datasets with well-defined decision boundaries"
        },
        "SVM_Classifier": {
            "description": "Finds the optimal hyperplane that separates classes",
            "strengths": ["Effective in high dimensions", "Robust against overfitting", "Versatile with different kernels"],
            "limitations": ["Slow training on large datasets", "Sensitive to parameter tuning"],
            "bestUseCase": "Complex classification with clear margins between classes"
        }
    }
    
    # Return characteristics for the specified model or default values
    return characteristics.get(model_name, {
        "description": "Advanced machine learning model for network traffic analysis",
        "strengths": ["Anomaly detection", "Pattern recognition", "Automated analysis"],
        "limitations": ["Requires quality data", "May need periodic retraining"],
        "bestUseCase": "Network security monitoring and threat detection"
    })
            
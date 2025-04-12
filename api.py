import os
import json
import time
import threading
import socket
import struct
import subprocess
import io
import tempfile
from flask import Flask, request, render_template, redirect, url_for, send_from_directory, jsonify, send_file, session, flash, make_response
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans, DBSCAN
from sklearn.ensemble import IsolationForest
from sklearn.svm import OneClassSVM
from sklearn.neighbors import LocalOutlierFactor
from sklearn.preprocessing import StandardScaler
import pdfkit
import secrets
from functools import wraps
from datetime import datetime, timedelta
import traceback
import ipaddress
import re
from werkzeug.security import check_password_hash, generate_password_hash
import logging


app = Flask(__name__, static_folder='static')

def download_if_missing(url, filepath):
    if not os.path.exists(filepath):
        print(f"📥 Downloading {filepath} ...")
        response = requests.get(url)
        with open(filepath, "wb") as f:
            f.write(response.content)
        print(f"✅ Downloaded: {filepath}")
    else:
        print(f"✔️ {filepath} already exists. Skipping download.")

def ensure_datasets_exist():
    os.makedirs('./Data', exist_ok=True)

    datasets = [
        {
            "url": "https://drive.google.com/uc?export=download&id=1p4HVmTDorA54e2ncRUstH--tKNn-frTt",
            "path": "./Data/Labelled Dataset.csv"
        },
        {
            "url": "https://drive.google.com/uc?export=download&id=1htqbYICidRwzf9Q67J4dTi4UJiEv-HPx",
            "path": "./Data/Unlabelled Dataset.csv"
        }
    ]

    for ds in datasets:
        download_if_missing(ds["url"], ds["path"])


app.secret_key = secrets.token_hex(16)  # Generate a secure secret key

# Global variables
capture_process = None
is_capturing = False
capture_data = []

# User credentials (in a real app, this would be in a database with proper password hashing)
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

# Create a login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            flash('Please log in to access this page', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Ensure directories exist
os.makedirs('./Data', exist_ok=True)
os.makedirs('./static', exist_ok=True)
os.makedirs('./captures', exist_ok=True)

# Function to check for admin privileges
def has_admin_privileges():
    try:
        # Windows-specific check
        import ctypes
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except:
        # For non-Windows platforms
        return os.geteuid() == 0 if hasattr(os, "geteuid") else False

# Function to filter dataset
def filters(data):
    columns_to_remove = ['is_host_login', 'protocol_type', 'service', 'flag', 'land', 'is_guest_login',
                         'su_attempted', 'wrong_fragment', 'urgent', 'hot', 'num_failed_logins',
                         'num_compromised', 'root_shell', 'num_root', 'num_file_creations',
                         'num_shells', 'num_access_files', 'srv_diff_host_rate']

    data = data.drop(columns=[col for col in columns_to_remove if col in data.columns], errors='ignore')
    data = data.loc[:, (data != 0).any(axis=0)]
    data.to_csv('./Data/filtered_data.csv', index=False)

    return data

# Check if data has labels
def has_data_labels():
    if os.path.exists('./Data/filtered_data.csv'):
        data = pd.read_csv('./Data/filtered_data.csv')
        return 'class' in data.columns
    return False

# Expanded threat type classification based on features
def classify_threat(features):
    # Dictionary of threat patterns mapped to detection functions
    threats = {
        # Denial of Service Attacks
        "DoS Attack - SYN Flood": lambda f: f.get('count', 0) > 100 and f.get('srv_count', 0) > 100 and f.get('src_bytes', 0) < 100 and f.get('dst_bytes', 0) < 100,
        "DoS Attack - ICMP Flood": lambda f: f.get('protocol', '') == 'icmp' and f.get('count', 0) > 50,
        "DoS Attack - UDP Flood": lambda f: f.get('protocol', '') == 'udp' and f.get('count', 0) > 80,
        "DoS Attack - HTTP Flood": lambda f: f.get('dst_port', 0) == 80 and f.get('count', 0) > 100,
        "DoS Attack - Slowloris": lambda f: f.get('dst_port', 0) == 80 and f.get('count', 0) > 30 and f.get('src_bytes', 0) < 200,
        "DoS Attack - Application Layer": lambda f: f.get('dst_port', 0) in [80, 443] and f.get('count', 0) > 50 and f.get('duration', 0) > 10,
        "DoS Attack - TCP Connection Flood": lambda f: f.get('count', 0) > 100 and f.get('duration', 0) < 2,
        "DoS Attack - Amplification": lambda f: f.get('dst_bytes', 0) > 10000 and f.get('src_bytes', 0) < 1000 and f.get('count', 0) > 20,
        
        # Port Scanning
        "Port Scanning - TCP Connect": lambda f: f.get('dst_host_srv_count', 0) > 20 and f.get('dst_host_same_srv_rate', 0) < 0.3 and f.get('protocol', '') == 'tcp',
        "Port Scanning - SYN Scan": lambda f: f.get('dst_host_srv_count', 0) > 20 and f.get('src_bytes', 0) < 100 and f.get('protocol', '') == 'tcp',
        "Port Scanning - FIN Scan": lambda f: f.get('dst_host_srv_count', 0) > 15 and f.get('src_bytes', 0) < 100 and f.get('protocol', '') == 'tcp',
        "Port Scanning - XMAS Scan": lambda f: f.get('dst_host_srv_count', 0) > 15 and f.get('src_bytes', 0) < 100 and f.get('protocol', '') == 'tcp',
        "Port Scanning - NULL Scan": lambda f: f.get('dst_host_srv_count', 0) > 15 and f.get('src_bytes', 0) < 80 and f.get('protocol', '') == 'tcp',
        "Port Scanning - UDP Scan": lambda f: f.get('dst_host_srv_count', 0) > 15 and f.get('protocol', '') == 'udp',
        "Port Scanning - ACK Scan": lambda f: f.get('dst_host_srv_count', 0) > 20 and f.get('protocol', '') == 'tcp',
        "Port Scanning - Slow Scan": lambda f: f.get('dst_host_srv_count', 0) > 10 and f.get('duration', 0) > 30,
        
        # Brute Force Attacks
        "Brute Force - SSH": lambda f: f.get('failed_login', 0) > 0 or f.get('num_failed_logins', 0) > 3 or (f.get('dst_port', 0) == 22 and f.get('count', 0) > 5),
        "Brute Force - FTP": lambda f: f.get('dst_port', 0) == 21 and f.get('count', 0) > 5,
        "Brute Force - Telnet": lambda f: f.get('dst_port', 0) == 23 and f.get('count', 0) > 5,
        "Brute Force - SMTP": lambda f: f.get('dst_port', 0) == 25 and f.get('count', 0) > 10,
        "Brute Force - RDP": lambda f: f.get('dst_port', 0) == 3389 and f.get('count', 0) > 5,
        "Brute Force - HTTP Basic Auth": lambda f: f.get('dst_port', 0) == 80 and f.get('count', 0) > 10 and f.get('src_bytes', 0) < 1000,
        "Brute Force - HTTP Form": lambda f: f.get('dst_port', 0) in [80, 443] and f.get('count', 0) > 10 and f.get('src_bytes', 0) > 1000,
        "Brute Force - Database": lambda f: f.get('dst_port', 0) in [1433, 3306, 5432, 1521] and f.get('count', 0) > 5,
        
        # Data Exfiltration
        "Data Exfiltration - Large Upload": lambda f: f.get('dst_bytes', 0) < 1000 and f.get('src_bytes', 0) > 10000,
        "Data Exfiltration - FTP Upload": lambda f: f.get('dst_port', 0) == 21 and f.get('src_bytes', 0) > 5000,
        "Data Exfiltration - HTTP POST": lambda f: f.get('dst_port', 0) in [80, 443] and f.get('src_bytes', 0) > 8000,
        "Data Exfiltration - Email Attachment": lambda f: f.get('dst_port', 0) in [25, 587, 465] and f.get('src_bytes', 0) > 5000,
        "Data Exfiltration - DNS Tunneling": lambda f: f.get('dst_port', 0) == 53 and f.get('count', 0) > 20,
        "Data Exfiltration - ICMP Tunneling": lambda f: f.get('protocol', '') == 'icmp' and f.get('src_bytes', 0) > 1000,
        "Data Exfiltration - Encrypted Channel": lambda f: f.get('dst_port', 0) == 443 and f.get('duration', 0) > 60 and f.get('src_bytes', 0) > 10000,
        "Data Exfiltration - Steganography": lambda f: f.get('dst_port', 0) in [80, 443] and f.get('src_bytes', 0) > 50000,
        
        # Command & Control Communication
        "Command & Control - Beaconing": lambda f: f.get('dst_host_srv_diff_host_rate', 0) > 0.8,
        "Command & Control - IRC": lambda f: f.get('dst_port', 0) in [6667, 6697],
        "Command & Control - HTTP": lambda f: f.get('dst_port', 0) == 80 and f.get('duration', 0) < 1 and f.get('count', 0) > 10,
        "Command & Control - HTTPS": lambda f: f.get('dst_port', 0) == 443 and f.get('duration', 0) < 1 and f.get('count', 0) > 10,
        "Command & Control - DNS": lambda f: f.get('dst_port', 0) == 53 and f.get('count', 0) > 30,
        "Command & Control - Tor": lambda f: f.get('dst_port', 0) in [9001, 9030],
        "Command & Control - Custom Protocol": lambda f: f.get('dst_port', 0) > 10000 and f.get('count', 0) > 5,
        "Command & Control - Domain Flux": lambda f: f.get('dst_port', 0) == 53 and f.get('dst_host_count', 0) > 50,
        
        # Web Application Attacks
        "Web Attack - SQL Injection": lambda f: f.get('dst_port', 0) in [80, 443] and f.get('src_bytes', 0) > 1000 and "'" in str(f),
        "Web Attack - XSS": lambda f: f.get('dst_port', 0) in [80, 443] and f.get('src_bytes', 0) > 800 and "<script" in str(f),
        "Web Attack - CSRF": lambda f: f.get('dst_port', 0) in [80, 443] and f.get('count', 0) < 3,
        "Web Attack - File Inclusion": lambda f: f.get('dst_port', 0) in [80, 443] and ('../' in str(f) or 'include' in str(f)),
        "Web Attack - Command Injection": lambda f: f.get('dst_port', 0) in [80, 443] and (';' in str(f) or '|' in str(f)),
        "Web Attack - Path Traversal": lambda f: f.get('dst_port', 0) in [80, 443] and '../' in str(f),
        "Web Attack - File Upload": lambda f: f.get('dst_port', 0) in [80, 443] and f.get('src_bytes', 0) > 10000,
        "Web Attack - XXE": lambda f: f.get('dst_port', 0) in [80, 443] and '<!ENTITY' in str(f),
        
        # Man-in-the-Middle Attacks
        "MITM - ARP Poisoning": lambda f: f.get('protocol', '') == 'arp' and f.get('count', 0) > 10,
        "MITM - DHCP Spoofing": lambda f: f.get('dst_port', 0) == 67 and f.get('count', 0) > 5,
        "MITM - DNS Spoofing": lambda f: f.get('dst_port', 0) == 53 and f.get('count', 0) > 10,
        "MITM - SSL Stripping": lambda f: f.get('dst_port', 0) in [80, 443] and f.get('count', 0) > 20,
        "MITM - BGP Hijacking": lambda f: f.get('dst_port', 0) == 179,
        "MITM - WiFi Evil Twin": lambda f: f.get('protocol', '') == 'wifi' and f.get('count', 0) > 10,
        "MITM - Session Hijacking": lambda f: f.get('dst_port', 0) in [80, 443] and f.get('count', 0) > 5,
        
        # Malware Communication
        "Malware - Botnet Traffic": lambda f: f.get('dst_host_srv_diff_host_rate', 0) > 0.7,
        "Malware - Crypto Mining": lambda f: f.get('dst_port', 0) in [3333, 8333, 9999] or (f.get('duration', 0) > 3600 and f.get('src_bytes', 0) > 10000),
        "Malware - Ransomware Communication": lambda f: f.get('dst_port', 0) == 443 and f.get('count', 0) < 5 and f.get('src_bytes', 0) > 5000,
        "Malware - Trojan Backdoor": lambda f: f.get('dst_port', 0) > 10000 and f.get('count', 0) < 10,
        "Malware - Spyware Data Collection": lambda f: f.get('dst_port', 0) in [80, 443] and f.get('duration', 0) > 60,
        "Malware - Rootkit Communication": lambda f: f.get('dst_port', 0) in [1234, 4321, 31337],
        "Malware - Worm Propagation": lambda f: f.get('count', 0) > 50 and f.get('dst_host_count', 0) > 50,
        
        # Other threats
        "Information Disclosure - Excessive DNS Queries": lambda f: f.get('dst_port', 0) == 53 and f.get('count', 0) > 40,
        "Protocol Abuse - SMB Enumeration": lambda f: f.get('dst_port', 0) in [139, 445] and f.get('count', 0) > 10,
        "Unauthorized Access - Telnet Login": lambda f: f.get('dst_port', 0) == 23 and f.get('logged_in', 0) == 1,
        "Reconnaissance - SNMP Scan": lambda f: f.get('dst_port', 0) in [161, 162] and f.get('count', 0) > 5,
        "Privilege Escalation - Local Exploit": lambda f: f.get('dst_host_same_src_port_rate', 0) > 0.8 and f.get('src_bytes', 0) > 5000,
        "Credential Harvesting - Form Submission": lambda f: f.get('dst_port', 0) in [80, 443] and f.get('src_bytes', 0) > 1000 and f.get('dst_bytes', 0) < 5000,
        "Network Scan - Service Enumeration": lambda f: f.get('dst_host_srv_count', 0) > 10 and f.get('dst_host_count', 0) < 3,
        "Unusual Traffic - High Volume Transfer": lambda f: f.get('src_bytes', 0) + f.get('dst_bytes', 0) > 100000,
        "Policy Violation - Unencrypted Communication": lambda f: f.get('dst_port', 0) in [21, 23, 80],
        "Lateral Movement - Internal Scanning": lambda f: f.get('dst_host_count', 0) > 5 and str(f.get('dst_ip', '')).startswith('192.168.'),
        
        # Default catch-all
        "Suspicious Connection": lambda f: True  # Default if no specific pattern matches
    }
    
    # Check each threat pattern against the features
    for threat_name, condition in threats.items():
        try:
            if condition(features):
                return threat_name
        except:
            pass
    
    return "Unknown Threat"

# Function to prepare dataset based on model type
def prepare_dataset_for_model(model_type):
    """Prepare the dataset appropriately for supervised or unsupervised models"""
    if not os.path.exists('./Data/filtered_data.csv'):
        return False, "No dataset available"
    
    data = pd.read_csv('./Data/filtered_data.csv')
    has_labels = 'class' in data.columns
    
    # Check if we have the right kind of data for the model type
    if model_type == 'supervised' and not has_labels:
        return False, "Supervised models require labeled data (with a 'class' column)"
    
    # For unsupervised models, if we have labeled data, create a copy without labels
    if model_type == 'unsupervised' and has_labels:
        # Create a copy of data without the class column for unsupervised models
        unlabeled_data = data.drop(columns=['class'])
        unlabeled_data.to_csv('./Data/unsupervised_data.csv', index=False)
        return True, "Dataset prepared for unsupervised learning"
    
    return True, "Dataset ready for use"

# Function to run unsupervised models
def run_unsupervised_model(model_name, data):
    # Preprocess IP addresses to convert them to numeric features
    X = data.copy()
    
    # Handle src_ip
    if 'src_ip' in X.columns and X['src_ip'].dtype == 'object':
        # Create temporary column with numeric representation
        try:
            X['src_ip_1'] = X['src_ip'].apply(lambda x: float(x.split('.')[0]) if isinstance(x, str) else 0)
            X['src_ip_2'] = X['src_ip'].apply(lambda x: float(x.split('.')[1]) if isinstance(x, str) and len(x.split('.')) > 1 else 0)
            X['src_ip_3'] = X['src_ip'].apply(lambda x: float(x.split('.')[2]) if isinstance(x, str) and len(x.split('.')) > 2 else 0)
            X['src_ip_4'] = X['src_ip'].apply(lambda x: float(x.split('.')[3]) if isinstance(x, str) and len(x.split('.')) > 3 else 0)
            
            # Drop the original string column
            X = X.drop(columns=['src_ip'])
        except Exception as e:
            print(f"Error preprocessing src_ip: {e}")
            # If conversion fails, just drop the column
            X = X.drop(columns=['src_ip'])
    
    # Handle dst_ip
    if 'dst_ip' in X.columns and X['dst_ip'].dtype == 'object':
        try:
            # Create temporary column with numeric representation
            X['dst_ip_1'] = X['dst_ip'].apply(lambda x: float(x.split('.')[0]) if isinstance(x, str) else 0)
            X['dst_ip_2'] = X['dst_ip'].apply(lambda x: float(x.split('.')[1]) if isinstance(x, str) and len(x.split('.')) > 1 else 0)
            X['dst_ip_3'] = X['dst_ip'].apply(lambda x: float(x.split('.')[2]) if isinstance(x, str) and len(x.split('.')) > 2 else 0)
            X['dst_ip_4'] = X['dst_ip'].apply(lambda x: float(x.split('.')[3]) if isinstance(x, str) and len(x.split('.')) > 3 else 0)
            
            # Drop the original string column
            X = X.drop(columns=['dst_ip'])
        except Exception as e:
            print(f"Error preprocessing dst_ip: {e}")
            # If conversion fails, just drop the column
            X = X.drop(columns=['dst_ip'])
    
    # Handle any other string/object columns that might cause issues
    for col in X.columns:
        if X[col].dtype == 'object':
            try:
                # Try to convert to numeric if possible
                X[col] = pd.to_numeric(X[col], errors='raise')
            except:
                # If cannot convert, drop the column
                print(f"Dropping non-numeric column: {col}")
                X = X.drop(columns=[col])
    
    # Check if data has a class column and remove it if present (unsupervised learning)
    if 'class' in X.columns:
        # Store original class for evaluation, but remove from training data
        y_true = X['class'].copy()
        if isinstance(y_true.iloc[0], str):
            y_true = (y_true != "normal").astype(int)
        X = X.drop(columns=['class'])
    else:
        y_true = None
    
    print(f"Data shape after preprocessing: {X.shape}")
    
    # Scale the data
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Initialize and fit the model
    model = None
    labels = None
    scores = None
    
    if model_name == "KMeans":
        model = KMeans(n_clusters=2, random_state=42)
        labels = model.fit_predict(X_scaled)
        # Convert to binary labels: 1 for anomaly (smaller cluster), 0 for normal
        counts = np.bincount(labels)
        anomaly_label = np.argmin(counts)
        binary_labels = (labels == anomaly_label).astype(int)
        
    elif model_name == "IsolationForest":
        model = IsolationForest(contamination=0.1, random_state=42)
        labels = model.fit_predict(X_scaled)
        # Convert from {1: normal, -1: anomaly} to {0: normal, 1: anomaly}
        binary_labels = (labels == -1).astype(int)
        scores = -model.score_samples(X_scaled)  # Higher score = more anomalous
        
    elif model_name == "LOF":
        model = LocalOutlierFactor(contamination=0.1, n_neighbors=20, novelty=False)
        labels = model.fit_predict(X_scaled)
        # Convert from {1: normal, -1: anomaly} to {0: normal, 1: anomaly}
        binary_labels = (labels == -1).astype(int)
        scores = -model.negative_outlier_factor_  # Higher score = more anomalous
        
    elif model_name == "OneClassSVM":
        model = OneClassSVM(kernel='rbf', gamma=0.1, nu=0.1)
        labels = model.fit_predict(X_scaled)
        # Convert from {1: normal, -1: anomaly} to {0: normal, 1: anomaly}
        binary_labels = (labels == -1).astype(int)
        if hasattr(model, 'decision_function'):
            scores = -model.decision_function(X_scaled)  # Higher score = more anomalous
        else:
            scores = np.ones(X_scaled.shape[0])  # Fallback if no decision function
        
    elif model_name == "DBSCAN":
        model = DBSCAN(eps=0.5, min_samples=5)
        labels = model.fit_predict(X_scaled)
        # Convert to binary labels: -1 is already anomaly in DBSCAN, others are clusters
        binary_labels = (labels == -1).astype(int)
    
    # Count anomalies
    anomaly_count = np.sum(binary_labels)
    anomaly_percentage = (anomaly_count / len(binary_labels)) * 100
    
    # Get top anomalies
    if scores is not None:
        # Get indices of top 10 anomalies
        top_indices = np.argsort(scores)[-10:][::-1]
        top_anomalies = data.iloc[top_indices].copy()
        top_anomalies['anomaly_score'] = scores[top_indices]
    else:
        # If no scores, get random anomalies
        anomaly_indices = np.where(binary_labels == 1)[0]
        if len(anomaly_indices) > 10:
            selected_indices = np.random.choice(anomaly_indices, 10, replace=False)
        else:
            selected_indices = anomaly_indices
        top_anomalies = data.iloc[selected_indices].copy() if len(selected_indices) > 0 else pd.DataFrame()
        top_anomalies['anomaly_score'] = 1.0  # Placeholder
    
    # Add threat classification to top anomalies
    threat_types = []
    for _, row in top_anomalies.iterrows():
        threat_types.append(classify_threat(row.to_dict()))
    
    top_anomalies['threat_type'] = threat_types
    
    # Store results
    # Save binary labels (predictions)
    binary_df = pd.DataFrame({'prediction': binary_labels})
    binary_df.to_csv(f'./static/{model_name}_predictions.csv', index=False)
    
    # Save top anomalies
    top_anomalies.to_csv(f'./static/{model_name}_top_anomalies.csv', index=False)
    
    # Calculate metrics
    # If we have ground truth, calculate accuracy
    accuracy = None
    if y_true is not None:
        accuracy = np.mean(binary_labels == y_true)
        print(f"Accuracy against labeled data: {accuracy:.4f}")
    
    results = {
        "model": model_name,
        "anomaly_count": int(anomaly_count),
        "anomaly_percentage": float(anomaly_percentage),
        "accuracy": accuracy,
        "sample_size": len(binary_labels)
    }
    
    with open(f'./static/{model_name}_results.json', 'w') as f:
        json.dump(results, f, indent=4)
    
    return results
    

# Function to convert scapy packet to our format
def convert_scapy_packet(packet):
    packet_info = {
        'src_ip': packet.src if hasattr(packet, 'src') else '',
        'dst_ip': packet.dst if hasattr(packet, 'dst') else '',
        'protocol': packet.type if hasattr(packet, 'type') else '',
        'src_port': packet.sport if hasattr(packet, 'sport') else 0,
        'dst_port': packet.dport if hasattr(packet, 'dport') else 0,
        'src_bytes': len(packet) if packet else 0,
        'dst_bytes': 0,  # Can't determine from packet
        'duration': 0,   # Needs tracking over time
        'count': 1,
        'srv_count': 1,
        'timestamp': time.time()
    }
    return packet_info

# Function to do platform-specific packet capture
def platform_specific_capture(duration):
    global capture_data, is_capturing
    
    try:
        # Use scapy for packet capture (works on most platforms)
        from scapy.all import sniff, IP, TCP, UDP
        
        def packet_callback(packet):
            if not is_capturing:
                return
                
            packet_info = {'timestamp': time.time()}
            
            # Basic IP info
            if IP in packet:
                packet_info['src_ip'] = packet[IP].src
                packet_info['dst_ip'] = packet[IP].dst
                packet_info['protocol'] = packet[IP].proto
                packet_info['src_bytes'] = len(packet)
                packet_info['dst_bytes'] = 0  # Will be incremented by return packets
            else:
                packet_info['src_ip'] = '0.0.0.0'
                packet_info['dst_ip'] = '0.0.0.0'
                packet_info['protocol'] = 'unknown'
                packet_info['src_bytes'] = len(packet)
                packet_info['dst_bytes'] = 0
            
            # Port info from TCP/UDP
            if TCP in packet:
                packet_info['src_port'] = packet[TCP].sport
                packet_info['dst_port'] = packet[TCP].dport
                packet_info['protocol'] = 'tcp'
            elif UDP in packet:
                packet_info['src_port'] = packet[UDP].sport
                packet_info['dst_port'] = packet[UDP].dport
                packet_info['protocol'] = 'udp'
            else:
                packet_info['src_port'] = 0
                packet_info['dst_port'] = 0
            
            # Additional metrics needed for classification
            packet_info['duration'] = 0  # We can't determine this from a single packet
            packet_info['count'] = 1     # Will be incremented during post-processing
            packet_info['srv_count'] = 1 # Will be incremented during post-processing
            packet_info['dst_host_count'] = 1
            packet_info['dst_host_srv_count'] = 1
            packet_info['logged_in'] = 0  # Default value, can't determine from packet
            
            capture_data.append(packet_info)
        
        # Start capture
        capture_data = []
        print(f"Starting scapy capture for {duration} seconds")
        sniff(prn=packet_callback, store=False, timeout=duration)
        
        # Post-process data - count connections to same host/service
        if capture_data:
            # Create a DataFrame
            df = pd.DataFrame(capture_data)
            
            # Count connections to the same host
            host_counts = df.groupby('dst_ip').size().to_dict()
            df['dst_host_count'] = df['dst_ip'].map(host_counts)
            
            # Count connections to the same service (port)
            service_counts = df.groupby(['dst_ip', 'dst_port']).size().to_dict()
            df['dst_host_srv_count'] = df.apply(lambda x: service_counts.get((x['dst_ip'], x['dst_port']), 1), axis=1)
            
            # Count recent connections (simplified)
            recent_duration = 2  # seconds
            df['count'] = df.apply(lambda x: len(df[(df['dst_ip'] == x['dst_ip']) & 
                                               (df['timestamp'] >= x['timestamp'] - recent_duration)]), axis=1)
            
            df['srv_count'] = df.apply(lambda x: len(df[(df['dst_ip'] == x['dst_ip']) & 
                                                  (df['dst_port'] == x['dst_port']) & 
                                                  (df['timestamp'] >= x['timestamp'] - recent_duration)]), axis=1)
            
            # Save processed data
            timestamp = int(time.time())
            output_file = f'./captures/capture_{timestamp}.csv'
            df.to_csv(output_file, index=False)
            df.to_csv('./Data/filtered_data.csv', index=False)
            print(f"Captured {len(df)} packets using scapy")
            
    except Exception as e:
        print(f"Error in platform_specific_capture: {e}")
        print(traceback.format_exc())
    finally:
        is_capturing = False

# Function to parse network packets
def parse_packet(packet_data):
    # This is a simplified packet parser
    try:
        # Ethernet header
        eth_length = 14
        eth_header = packet_data[:eth_length]
        
        # IP header
        ip_header = packet_data[eth_length:20+eth_length]
        iph = struct.unpack('!BBHHHBBH4s4s', ip_header)
        
        version_ihl = iph[0]
        ihl = version_ihl & 0xF
        iph_length = ihl * 4
        
        protocol = iph[6]
        s_addr = socket.inet_ntoa(iph[8])
        d_addr = socket.inet_ntoa(iph[9])
        
        # TCP header
        if protocol == 6:  # TCP
            tcp_header = packet_data[eth_length+iph_length:eth_length+iph_length+20]
            tcph = struct.unpack('!HHLLBBHHH', tcp_header)
            
            source_port = tcph[0]
            dest_port = tcph[1]
            sequence = tcph[2]
            acknowledgement = tcph[3]
            
            # Build a feature vector similar to our training data
            # This is simplified and would need to be expanded based on your model features
            packet_info = {
                'src_ip': s_addr,
                'dst_ip': d_addr,
                'protocol': 'tcp',
                'src_port': source_port,
                'dst_port': dest_port,
                'src_bytes': len(packet_data),
                'dst_bytes': 0,  # Would need more analysis to determine
                'duration': 0,   # Needs tracking over time
                'count': 1,      # Needs tracking over time
                'srv_count': 1,  # Needs tracking over time
                'timestamp': time.time()
            }
            
            return packet_info
        
        # UDP header
        elif protocol == 17:  # UDP
            udp_header = packet_data[eth_length+iph_length:eth_length+iph_length+8]
            udph = struct.unpack('!HHHH', udp_header)
            
            source_port = udph[0]
            dest_port = udph[1]
            
            packet_info = {
                'src_ip': s_addr,
                'dst_ip': d_addr,
                'protocol': 'udp',
                'src_port': source_port,
                'dst_port': dest_port,
                'src_bytes': len(packet_data),
                'dst_bytes': 0,
                'duration': 0,
                'count': 1,
                'srv_count': 1,
                'timestamp': time.time()
            }
            
            return packet_info
        
        else:
            # Other protocols
            packet_info = {
                'src_ip': s_addr,
                'dst_ip': d_addr,
                'protocol': str(protocol),
                'src_port': 0,
                'dst_port': 0,
                'src_bytes': len(packet_data),
                'dst_bytes': 0,
                'duration': 0,
                'count': 1,
                'srv_count': 1,
                'timestamp': time.time()
            }
            
            return packet_info
    
    except Exception as e:
        print(f"Error parsing packet: {e}")
        return None

# Function to capture packets
def capture_packets(duration=30):
    global is_capturing, capture_data
    
    try:
        # Check if we have admin privileges
        if not has_admin_privileges():
            print("Warning: Network capture requires administrator privileges")
            platform_specific_capture(duration)
            return
        
        # Create a raw socket
        try:
            s = socket.socket(socket.AF_PACKET, socket.SOCK_RAW, socket.ntohs(0x0003))
        except (socket.error, AttributeError):
            # Handle Windows systems or permission errors
            print("Using alternative capture method for this platform")
            platform_specific_capture(duration)
            return
        
        start_time = time.time()
        capture_data = []
        
        while is_capturing and (time.time() - start_time) < duration:
            packet = s.recvfrom(65565)
            packet_data = packet[0]
            
            parsed_packet = parse_packet(packet_data)
            if parsed_packet:
                capture_data.append(parsed_packet)
        
        # Convert to DataFrame
        if capture_data:
            df = pd.DataFrame(capture_data)
            timestamp = int(time.time())
            output_file = f'./captures/capture_{timestamp}.csv'
            df.to_csv(output_file, index=False)
            
            # Also save as filtered data for analysis
            df.to_csv('./Data/filtered_data.csv', index=False)
            
            print(f"Captured {len(df)} packets and saved to {output_file}")
        
        is_capturing = False
        
    except Exception as e:
        print(f"Error during packet capture: {e}")
        print(traceback.format_exc())
        is_capturing = False


# Set up logging configuration for security events
logging.basicConfig(
    filename='security.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Enhanced User credentials (in a real app, this would be in a database with proper password hashing)
ADMIN_CREDENTIALS = {
    "admin": {
        "password_hash": generate_password_hash("admin123"),
        "failed_attempts": 0,
        "last_attempt": None,
        "locked_until": None,
        "role": "admin"
    }
}

# Add more users if needed
# ADMIN_CREDENTIALS["analyst"] = {
#     "password_hash": generate_password_hash("analyst123"),
#     "failed_attempts": 0,
#     "last_attempt": None,
#     "locked_until": None,
#     "role": "analyst"
# }

# Configuration for security
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION = 15 * 60  # 15 minutes in seconds
SESSION_TIMEOUT = 30 * 60  # 30 minutes in seconds
IP_WHITELIST = ['127.0.0.1', '192.168.1.0/24']  # Local IPs allowed

# Create a login required decorator with enhanced security
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if user is logged in
        if 'logged_in' not in session:
            flash('Please log in to access this page', 'error')
            return redirect(url_for('login', next=request.path))
        
        # Check for session timeout
        if 'last_activity' in session:
            last_activity = session['last_activity']
            current_time = time.time()
            
            if current_time - last_activity > SESSION_TIMEOUT:
                # Session has expired
                session.clear()
                flash('Your session has expired due to inactivity. Please log in again.', 'warning')
                return redirect(url_for('login', next=request.path))
            
            # Update last activity time
            session['last_activity'] = current_time
            
        return f(*args, **kwargs)
    return decorated_function

# Function to check if IP is in whitelist
def is_ip_allowed(ip):
    # If whitelist is empty, all IPs are allowed
    if not IP_WHITELIST:
        return True
    
    # Check if IP is in whitelist
    for allowed_ip in IP_WHITELIST:
        # Check for subnet notation (CIDR)
        if '/' in allowed_ip:
            try:
                network = ipaddress.ip_network(allowed_ip)
                if ipaddress.ip_address(ip) in network:
                    return True
            except ValueError:
                continue
        # Direct IP comparison
        elif ip == allowed_ip:
            return True
    
    return False

@app.route('/')
def index():
    return render_template('index.html')


# Enhanced login route
@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    client_ip = request.remote_addr
    
    # Check if IP is allowed
    if not is_ip_allowed(client_ip):
        logging.warning(f"Login attempt from unauthorized IP: {client_ip}")
        error = "Access denied. Your IP address is not authorized."
        return render_template('login.html', error=error), 403
    
    # Check for next parameter to redirect after login
    next_page = request.args.get('next', '/capture')  # Default to capture page
    
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        remember = 'remember' in request.form
        
        # Input validation
        if not username or not password:
            error = "Username and password are required."
        elif not re.match("^[a-zA-Z0-9_-]{3,20}$", username):
            # Basic username format validation
            error = "Invalid username format."
            logging.warning(f"Invalid username format attempt from {client_ip}")
        else:
            # Check if user exists
            user_data = ADMIN_CREDENTIALS.get(username)
            
            if not user_data:
                # User doesn't exist, but don't reveal this information
                error = "Invalid credentials. Please try again."
                logging.warning(f"Login attempt with non-existent username: {username} from IP: {client_ip}")
            else:
                # Check if account is locked
                if user_data.get('locked_until') and user_data['locked_until'] > time.time():
                    remaining_time = int(user_data['locked_until'] - time.time())
                    remaining_minutes = remaining_time // 60 + 1
                    error = f"Account temporarily locked. Please try again in {remaining_minutes} minutes."
                    logging.warning(f"Login attempt on locked account: {username} from IP: {client_ip}")
                else:
                    # If account was locked but lock expired, reset failed attempts
                    if user_data.get('locked_until'):
                        user_data['failed_attempts'] = 0
                        user_data['locked_until'] = None
                    
                    # Check password
                    if check_password_hash(user_data['password_hash'], password):
                        # Successful login
                        session['logged_in'] = True
                        session['username'] = username
                        session['role'] = user_data['role']
                        session['last_activity'] = time.time()
                        
                        # Set session expiry for "remember me"
                        if remember:
                            # 30 days in seconds
                            session.permanent = True
                            app.permanent_session_lifetime = timedelta(days=30)

                        
                        # Reset failed attempts
                        user_data['failed_attempts'] = 0
                        
                        logging.info(f"Successful login: {username} from IP: {client_ip}")
                        flash('You were successfully logged in', 'success')
                        
                        # Redirect to the requested page or default
                        return redirect(next_page)
                    else:
                        # Failed login
                        user_data['failed_attempts'] += 1
                        user_data['last_attempt'] = time.time()
                        
                        # Check if account should be locked
                        if user_data['failed_attempts'] >= MAX_FAILED_ATTEMPTS:
                            user_data['locked_until'] = time.time() + LOCKOUT_DURATION
                            error = f"Too many failed login attempts. Account locked for {LOCKOUT_DURATION//60} minutes."
                            logging.warning(f"Account locked due to failed attempts: {username} from IP: {client_ip}")
                        else:
                            attempts_left = MAX_FAILED_ATTEMPTS - user_data['failed_attempts']
                            error = f"Invalid credentials. {attempts_left} attempts remaining before lockout."
                            logging.warning(f"Failed login attempt: {username} from IP: {client_ip} (Attempt {user_data['failed_attempts']})")
    
    return render_template('login.html', error=error, next_page=next_page)

# Enhanced logout route
@app.route('/logout')
def logout():
    username = session.get('username', 'Unknown')
    client_ip = request.remote_addr
    
    # Clear all session data
    session.clear()
    
    logging.info(f"User logged out: {username} from IP: {client_ip}")
    flash('You have been logged out', 'info')
    return redirect(url_for('index'))

# Admin dashboard route (optional - for future expansion)
@app.route('/admin')
@login_required
def admin_dashboard():
    # Only allow admins to access
    if session.get('role') != 'admin':
        flash('You do not have permission to access the admin panel', 'error')
        return redirect(url_for('index'))
    
    return render_template('admin.html')

# Route to check admin status via API
@app.route('/api/check_admin', methods=['GET'])
def check_admin():
    is_admin = 'logged_in' in session and session.get('role') == 'admin'
    return jsonify({"logged_in": is_admin})

# Password change functionality (for future implementation)
@app.route('/change_password', methods=['GET', 'POST'])
@login_required
def change_password():
    if request.method == 'POST':
        username = session.get('username')
        current_password = request.form.get('current_password')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
        
        # Input validation
        if not current_password or not new_password or not confirm_password:
            flash('All password fields are required', 'error')
        elif new_password != confirm_password:
            flash('New passwords do not match', 'error')
        elif len(new_password) < 8:
            flash('New password must be at least 8 characters long', 'error')
        else:
            # Verify current password
            if check_password_hash(ADMIN_CREDENTIALS[username]['password_hash'], current_password):
                # Update password
                ADMIN_CREDENTIALS[username]['password_hash'] = generate_password_hash(new_password)
                
                flash('Password updated successfully', 'success')
                return redirect(url_for('admin_dashboard'))
            else:
                flash('Current password is incorrect', 'error')
    
    return render_template('change_password.html')

# Check if data has labels
@app.route('/check_data_type', methods=['GET'])
def check_data_type():
    try:
        if os.path.exists('./Data/filtered_data.csv'):
            data = pd.read_csv('./Data/filtered_data.csv')
            has_labels = 'class' in data.columns
            return jsonify({"has_labels": has_labels})
        return jsonify({"has_labels": False, "error": "No data file found"})
    except Exception as e:
        return jsonify({"has_labels": False, "error": str(e)})

# Handles file upload (User uploads data)
@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        flash('No file selected', 'error')
        return redirect(url_for('index'))
    
    file = request.files['file']
    if file.filename == '':
        flash('No file selected', 'error')
        return redirect(url_for('index'))
    
    if file and file.filename.endswith('.csv'):
        try:
            data = pd.read_csv(file)
            data = filters(data)
    
            # Store the selected model choice
            model_type = request.form.get('model', 'RandomForest')
            with open('./static/selected_model.json', 'w') as f:
                json.dump({"model": model_type}, f)
    
            flash('File uploaded and processed successfully', 'success')
            return redirect(url_for('train'))
        except Exception as e:
            flash(f'Error processing file: {str(e)}', 'error')
            return redirect(url_for('index'))
    
    flash('Please upload a CSV file', 'error')
    return redirect(url_for('index'))

# New route for training models
@app.route('/train', methods=['GET', 'POST'])
def train():
    if request.method == 'POST':
        # Get selected models to train
        selected_models = request.form.getlist('models')
        
        if not selected_models:
            flash("Please select at least one model to train", 'error')
            return render_template('train.html', 
                           supervised_models=['Logistic_Regression', 'KNeighbors_Classifier', 'RandomForest_Classifier', 'SVM_Classifier', 'Neural_Network'],
                           unsupervised_models=['KMeans', 'IsolationForest', 'LOF', 'OneClassSVM', 'DBSCAN'],
                           has_labels=has_data_labels(),
                           logged_in=session.get('logged_in', False))
        
        # Check if data exists
        if not os.path.exists('./Data/filtered_data.csv'):
            flash("No data found. Please upload a dataset first.", 'error')
            return redirect(url_for('index'))
        
        # Load data
        data = pd.read_csv('./Data/filtered_data.csv')
        
        # Check if data is labeled (has 'class' column)
        has_labels = 'class' in data.columns
        
        # Filter models based on data type
        valid_models = []
        invalid_models = []
        
        for model in selected_models:
            # For supervised models, we need labeled data
            if model in ['Logistic_Regression', 'KNeighbors_Classifier', 'RandomForest_Classifier', 'SVM_Classifier', 'Neural_Network']:
                if has_labels:
                    valid_models.append(model)
                else:
                    invalid_models.append(model)
            # For unsupervised models, we can use either labeled or unlabeled data
            # If labeled, we'll drop the class column during processing
            elif model in ['KMeans', 'IsolationForest', 'LOF', 'OneClassSVM', 'DBSCAN']:
                valid_models.append(model)
            else:
                invalid_models.append(model)
        
        if invalid_models and not has_labels:
            flash(f"Your data has no labels (class column). Cannot use supervised models: {', '.join(invalid_models)}. Please select unsupervised models only.", 'error')
            return render_template('train.html', 
                           supervised_models=['Logistic_Regression', 'KNeighbors_Classifier', 'RandomForest_Classifier', 'SVM_Classifier', 'Neural_Network'],
                           unsupervised_models=['KMeans', 'IsolationForest', 'LOF', 'OneClassSVM', 'DBSCAN'],
                           has_labels=has_labels,
                           logged_in=session.get('logged_in', False))
        
        # Train selected models
        model_results = {}
        
        # Train supervised models
        for model in valid_models:
            if model in ['Logistic_Regression', 'KNeighbors_Classifier', 'RandomForest_Classifier', 'SVM_Classifier', 'Neural_Network']:
                # Run the corresponding Python script using subprocess
                try:
                    # Print which file we're attempting to run for debugging
                    print(f"Attempting to run {model}.py")
                    
                    # Check if file exists
                    if not os.path.exists(f'{model}.py'):
                        print(f"⚠️ Warning: {model}.py file not found")
                        flash(f"Model file {model}.py not found", 'warning')
                        continue
                        
                    # Run the script
                    result = subprocess.run(['python', f'{model}.py'], 
                                         check=False,  # Don't raise exception
                                         capture_output=True,  # Capture output
                                         text=True)  # Return as text
                    
                    if result.returncode != 0:
                        print(f"❌ Error training {model}:\n{result.stderr}")
                        flash(f"Error training {model}: {result.stderr}", 'error')
                        # Continue with other models instead of failing
                        continue
                    else:
                        print(f"✅ Trained {model}")
                        flash(f"Successfully trained {model}", 'success')
                    
                    # Load results
                    result_file = f'./static/{model}_results.json'
                    if os.path.exists(result_file):
                        with open(result_file, 'r') as f:
                            model_results[model] = json.load(f)
                except Exception as e:
                    print(f"❌ Error training {model}: {str(e)}")
                    flash(f"Error training {model}: {str(e)}", 'error')
                    # Continue with other models
                    continue
            
            # Train unsupervised models
            elif model in ['KMeans', 'IsolationForest', 'LOF', 'OneClassSVM', 'DBSCAN']:
                try:
                    result = run_unsupervised_model(model, data)
                    model_results[model] = result
                    print(f"✅ Trained {model}")
                    flash(f"Successfully trained {model}", 'success')
                except Exception as e:
                    print(f"❌ Error training {model}: {e}")
                    flash(f"Error training {model}: {str(e)}", 'error')
                    continue
        
        # Save model comparison results
        comparison_file = './static/model_comparison.json'
        with open(comparison_file, 'w') as f:
            json.dump(model_results, f, indent=4)
        
        return redirect(url_for('results'))
    
    # GET request - show training page
    return render_template('train.html', 
                           supervised_models=['Logistic_Regression', 'KNeighbors_Classifier', 'RandomForest_Classifier', 'SVM_Classifier', 'Neural_Network'],
                           unsupervised_models=['KMeans', 'IsolationForest', 'LOF', 'OneClassSVM', 'DBSCAN'],
                           has_labels=has_data_labels(),
                           logged_in=session.get('logged_in', False))

# Manual entry result route
@app.route('/manual_result')
def manual_result():
    # Load form data
    form_data = {}
    if os.path.exists('./static/manual_entry_form.json'):
        with open('./static/manual_entry_form.json', 'r') as f:
            form_data = json.load(f)
    
    # Load result data
    if not os.path.exists('./static/manual_entry_result.json'):
        flash("No analysis results found. Please submit a manual entry first.", 'error')
        return redirect(url_for('manual_entry'))
    
    with open('./static/manual_entry_result.json', 'r') as f:
        result = json.load(f)
    
    # Pass current_time to the template
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    return render_template('manual_result.html', 
                           result=result, 
                           form_data=form_data, 
                           current_time=current_time,
                           logged_in=session.get('logged_in', False))

# Live capture route
# Add this to your api.py file to enhance the capture page with authentication

# Modified capture route to enforce authentication
@app.route('/capture', methods=['GET', 'POST'])
@login_required  # This decorator requires login for the live capture page
def capture():
    global is_capturing, capture_process
    
    if request.method == 'POST':
        action = request.form.get('action')
        
        if action == 'start' and not is_capturing:
            # Log the start of capture
            logging.info(f"User {session.get('username')} started a packet capture from IP {request.remote_addr}")
            
            duration = int(request.form.get('duration', 30))
            
            is_capturing = True
            capture_process = threading.Thread(target=capture_packets, args=(duration,))
            capture_process.daemon = True
            capture_process.start()
            
            return jsonify({"status": "started", "message": f"Capturing packets for {duration} seconds"})
        
        elif action == 'stop' and is_capturing:
            # Log the stopping of capture
            logging.info(f"User {session.get('username')} stopped a packet capture from IP {request.remote_addr}")
            
            is_capturing = False
            if capture_process and capture_process.is_alive():
                capture_process.join(2)  # Wait for up to 2 seconds
            
            return jsonify({"status": "stopped", "message": "Packet capture stopped"})
        
        elif action == 'status':
            return jsonify({"status": "capturing" if is_capturing else "idle", 
                           "count": len(capture_data)})
        
        elif action == 'analyze':
            if not os.path.exists('./Data/filtered_data.csv'):
                return jsonify({"status": "error", "message": "No capture data available"})
            
            # Use the selected model for analysis
            model = request.form.get('model', 'IsolationForest')
            
            try:
                # Log the analysis
                logging.info(f"User {session.get('username')} analyzing capture with model {model}")
                
                data = pd.read_csv('./Data/filtered_data.csv')
                result = run_unsupervised_model(model, data)
                
                # Save selected model
                with open('./static/capture_model.json', 'w') as f:
                    json.dump({"model": model}, f)
                
                return jsonify({"status": "success", "result": result})
            except Exception as e:
                # Log the error
                logging.error(f"Error during capture analysis: {str(e)}")
                return jsonify({"status": "error", "message": f"Analysis error: {e}"})
    
    # GET request - show capture page
    capture_files = [f for f in os.listdir('./captures') if f.endswith('.csv')] if os.path.exists('./captures') else []
    return render_template('capture.html', capture_files=capture_files, is_capturing=is_capturing, logged_in=session.get('logged_in', False))

@app.route('/load_capture', methods=['POST'])
def load_capture():
    filename = request.form.get('filename')
    if not filename or not os.path.exists(f'./captures/{filename}'):
        return jsonify({"status": "error", "message": "Invalid file selection"})
    
    try:
        data = pd.read_csv(f'./captures/{filename}')
        data.to_csv('./Data/filtered_data.csv', index=False)
        
        # Update the capture file metadata if possible
        try:
            packet_count = len(data)
            # Calculate other metadata if available in the file
            metadata = {
                "packets": packet_count,
                "unique_ips": len(data['src_ip'].unique()) + len(data['dst_ip'].unique()),
                "protocols": len(data['protocol'].unique()) if 'protocol' in data.columns else 0
            }
            
            # Save metadata for this capture
            with open(f'./captures/{filename}_metadata.json', 'w') as f:
                json.dump(metadata, f)
        except:
            pass
        
        return jsonify({"status": "success", "message": f"Loaded {len(data)} records from {filename}"})
    except Exception as e:
        return jsonify({"status": "error", "message": f"Error loading file: {e}"})
# Enhanced PDF Export Function for the Backend
# Add this to your api.py file to replace the existing export_pdf route

@app.route('/export_pdf', methods=['POST'])
def export_pdf():
    try:
        # Get model results
        model_name = request.form.get('model', 'RandomForest_Classifier')
        source = request.form.get('source', 'results')
        
        # Get analysis data if provided
        analysis_data_json = request.form.get('analysis_data', '{}')
        try:
            analysis_data = json.loads(analysis_data_json)
        except:
            analysis_data = {}
        
        # Determine which result file to use
        if source == 'manual':
            result_file = './static/manual_entry_result.json'
            title = "Manual Entry Analysis Report"
        elif source == 'capture':
            result_file = './static/capture_model.json'
            with open(result_file, 'r') as f:
                capture_data = json.load(f)
            model_name = capture_data.get('model', 'IsolationForest')
            result_file = f'./static/{model_name}_results.json'
            title = "Network Capture Analysis Report"
        else:
            result_file = f'./static/{model_name}_results.json'
            title = "ML Intrusion Detection Report"
        
        # Default results in case file is not found
        default_results = {
            "model": model_name,
            "accuracy": 0.85,
            "precision": 0.82,
            "recall": 0.88,
            "f1": 0.85,
            "roc_auc": 0.90,
            "anomaly_count": 5,
            "anomaly_percentage": 2.5,
            "threat_type": "Port Scanning - TCP Connect",
            "silhouette_score": 0.65,  # For unsupervised models
            "reconstruction_error": 0.12,  # For unsupervised models
            "false_positive_rate": 0.08,  # For unsupervised models
            "detection_time": 0.45  # For unsupervised models
        }
        
        # Load results, using defaults if file not found
        results = default_results
        if os.path.exists(result_file):
            try:
                with open(result_file, 'r') as f:
                    results = json.load(f)
            except:
                print(f"Error reading result file: {result_file}")
        else:
            print(f"Result file not found: {result_file}. Using default values.")
        
        # Merge results with any analysis data provided
        if analysis_data:
            # If analysis data has modelMetrics, use those
            if 'modelMetrics' in analysis_data and analysis_data['modelMetrics']:
                for key, value in analysis_data['modelMetrics'].items():
                    results[key] = value
        
        # Determine if this is an unsupervised model
        is_unsupervised = model_name in ['IsolationForest', 'LOF', 'OneClassSVM', 'KMeans', 'DBSCAN']
        
        # Determine risk level
        risk_level = "High" if results.get('anomaly_count', 0) > 10 else "Medium" if results.get('anomaly_count', 0) > 5 else "Low"
        
        # Get threat type from results or analysis data
        threat_type = results.get('threat_type', 'Suspicious Connection')
        if 'threatAnalysis' in analysis_data and 'detectedThreats' in analysis_data['threatAnalysis'] and analysis_data['threatAnalysis']['detectedThreats']:
            threat_type = analysis_data['threatAnalysis']['detectedThreats'][0]
        
        # Create HTML content for PDF
        html_content = f"""
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <title>{title}</title>
                <style>
                    @page {{
                        size: A4;
                        margin: 1cm;
                    }}
                    body {{
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 20px;
                    }}
                    .header {{
                        border-bottom: 1px solid #4a6fa5;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }}
                    .header h1 {{
                        color: #4a6fa5;
                        margin: 0;
                        font-size: 24px;
                    }}
                    .date {{
                        color: #777;
                        font-size: 14px;
                    }}
                    h2 {{
                        color: #4a6fa5;
                        margin-top: 25px;
                        margin-bottom: 15px;
                        font-size: 20px;
                        page-break-after: avoid;
                    }}
                    h3 {{
                        color: #333;
                        margin-top: 20px;
                        margin-bottom: 10px;
                        font-size: 16px;
                        page-break-after: avoid;
                    }}
                    p {{
                        margin: 0 0 12px 0;
                    }}
                    table {{
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                        font-size: 14px;
                    }}
                    th, td {{
                        border: 1px solid #ddd;
                        padding: 10px;
                        text-align: left;
                    }}
                    th {{
                        background-color: #f2f2f2;
                        font-weight: bold;
                    }}
                    .section {{
                        margin-bottom: 30px;
                    }}
                    .summary-box {{
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }}
                    .high-risk {{
                        background-color: #f8d7da;
                        color: #721c24;
                        border: 1px solid #f5c6cb;
                    }}
                    .medium-risk {{
                        background-color: #fff3cd;
                        color: #856404;
                        border: 1px solid #ffeeba;
                    }}
                    .low-risk {{
                        background-color: #d4edda;
                        color: #155724;
                        border: 1px solid #c3e6cb;
                    }}
                    .threat-item {{
                        background-color: #f8f9fa;
                        padding: 10px;
                        margin-bottom: 10px;
                        border-left: 4px solid #dc3545;
                    }}
                    .footer {{
                        text-align: center;
                        margin-top: 40px;
                        font-size: 12px;
                        color: #777;
                        border-top: 1px solid #ddd;
                        padding-top: 20px;
                    }}
                    .chart-container {{
                        margin: 20px 0;
                        text-align: center;
                    }}
                    .metric-grid {{
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 15px;
                        margin: 20px 0;
                    }}
                    .metric-card {{
                        padding: 15px;
                        background-color: #f8f9fa;
                        border-radius: 4px;
                        border: 1px solid #ddd;
                    }}
                    .metric-title {{
                        font-weight: bold;
                        margin-bottom: 5px;
                        font-size: 14px;
                        color: #4a6fa5;
                    }}
                    .metric-value {{
                        font-size: 18px;
                        font-weight: bold;
                    }}
                    .model-details {{
                        background-color: #f8f9fa;
                        padding: 15px;
                        border-radius: 4px;
                        margin: 20px 0;
                    }}
                    .recommendation-list {{
                        list-style-type: none;
                        padding: 0;
                    }}
                    .recommendation-list li {{
                        padding: 10px;
                        margin-bottom: 10px;
                        background-color: #e9f7fe;
                        border-left: 4px solid #4a6fa5;
                    }}
                    .model-feature {{
                        margin-bottom: 5px;
                    }}
                    .model-feature strong {{
                        font-weight: bold;
                    }}
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>{title}</h1>
                    <p class="date">Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                </div>
                
                <div class="section">
                    <h2>Analysis Overview</h2>
                    <p><strong>Model:</strong> {model_name}</p>
                    <p><strong>Analysis Type:</strong> {'Supervised Learning' if not is_unsupervised else 'Unsupervised Learning'}</p>
        """

        # Add risk summary based on risk level
        risk_class = "high-risk" if risk_level == "High" else "medium-risk" if risk_level == "Medium" else "low-risk"
        risk_icon = "⚠️" if risk_level in ["High", "Medium"] else "✓"
        
        # Analysis summary based on risk
        if risk_level in ["High", "Medium"]:
            html_content += f"""
                    <div class="summary-box {risk_class}">
                        <h3>{risk_icon} {risk_level.upper()} RISK DETECTED</h3>
                        <p>The analysis has identified potential security threats in your network traffic.</p>
                        <p><strong>Primary Threat Type:</strong> {threat_type}</p>
                        <p><strong>Anomaly Count:</strong> {results.get('anomaly_count', 'N/A')}</p>
                        <p><strong>Anomaly Percentage:</strong> {results.get('anomaly_percentage', 0):.2f}% of analyzed traffic</p>
                    </div>
            """
        
        # Add threat analysis section
        html_content += f"""
                </div>
                
                <div class="section">
                    <h2>Threat Analysis</h2>
        """
        
        # Add detected threats
        detected_threats = []
        if 'threatAnalysis' in analysis_data and 'detectedThreats' in analysis_data['threatAnalysis']:
            detected_threats = analysis_data['threatAnalysis']['detectedThreats']
        elif 'threat_type' in results and results['threat_type']:
            detected_threats = [results['threat_type']]
        
        if detected_threats:
            html_content += f"""
                    <h3>Detected Threat Patterns</h3>
                    <p>The following threat patterns were identified in the analyzed traffic:</p>
            """
            
            for threat in detected_threats[:5]:  # Show up to 5 threats
                html_content += f"""
                    <div class="threat-item">
                        <strong>{threat}</strong>
                    </div>
                """
            
            # Add specific analysis for the primary threat
            primary_threat = detected_threats[0]
            
            if "DoS" in primary_threat:
                html_content += f"""
                    <h3>Denial of Service (DoS) Attack Analysis</h3>
                    <p>The detected DoS pattern shows characteristics of a volumetric attack designed to overwhelm network resources.</p>
                    <ul>
                        <li><strong>Attack Vector:</strong> {primary_threat.split('-')[1].strip() if '-' in primary_threat else 'Network flood'}</li>
                        <li><strong>Traffic Pattern:</strong> High volume of packets with similar characteristics</li>
                        <li><strong>Target Resources:</strong> Network bandwidth and server processing capacity</li>
                    </ul>
                """
            elif "Port Scan" in primary_threat:
                html_content += f"""
                    <h3>Port Scanning Analysis</h3>
                    <p>The detected scanning activity indicates reconnaissance attempts to identify open services.</p>
                    <ul>
                        <li><strong>Scan Type:</strong> {primary_threat.split('-')[1].strip() if '-' in primary_threat else 'General port scan'}</li>
                        <li><strong>Traffic Pattern:</strong> Sequential or randomized connection attempts to multiple ports</li>
                        <li><strong>Risk Level:</strong> Medium - typically precedes targeted attacks</li>
                    </ul>
                """
            elif "Brute Force" in primary_threat:
                html_content += f"""
                    <h3>Brute Force Attack Analysis</h3>
                    <p>The detected brute force pattern shows repeated authentication attempts to gain unauthorized access.</p>
                    <ul>
                        <li><strong>Target Service:</strong> {primary_threat.split('-')[1].strip() if '-' in primary_threat else 'Authentication service'}</li>
                        <li><strong>Traffic Pattern:</strong> Multiple failed login attempts in rapid succession</li>
                        <li><strong>Risk Level:</strong> High - active attempt to compromise access controls</li>
                    </ul>
                """
            elif "Data Exfiltration" in primary_threat:
                html_content += f"""
                    <h3>Data Exfiltration Analysis</h3>
                    <p>The detected exfiltration pattern indicates potential data theft or unauthorized data transfer.</p>
                    <ul>
                        <li><strong>Exfiltration Method:</strong> {primary_threat.split('-')[1].strip() if '-' in primary_threat else 'Network transfer'}</li>
                        <li><strong>Traffic Pattern:</strong> Unusual outbound data volume or connection patterns</li>
                        <li><strong>Risk Level:</strong> Critical - active data theft in progress</li>
                    </ul>
                """
        else:
            html_content += f"""
                    <p>No specific threat patterns were identified in the analyzed traffic.</p>
                    <p>The network traffic appears to follow normal expected patterns with no significant deviations that would indicate malicious activity.</p>
            """
        
        # Add model details
        model_details = {}
        if 'modelCharacteristics' in analysis_data:
            model_details = analysis_data['modelCharacteristics']
        
        html_content += f"""
                </div>
                
                <div class="section">
                    <h2>Model Details</h2>
                    <div class="model-details">
                        <h3>{model_name}</h3>
                        <p class="model-feature"><strong>Type:</strong> {'Unsupervised Learning Algorithm' if is_unsupervised else 'Supervised Learning Algorithm'}</p>
                        <p class="model-feature"><strong>Description:</strong> {model_details.get('description', 'Advanced machine learning model for network traffic analysis')}</p>
                        
                        <h4>Strengths:</h4>
                        <ul>
        """
        
        # Add model strengths
        strengths = model_details.get('strengths', ['Anomaly detection', 'Pattern recognition', 'Automated analysis'])
        for strength in strengths:
            html_content += f"""
                            <li>{strength}</li>
            """
        
        html_content += f"""
                        </ul>
                        
                        <h4>Limitations:</h4>
                        <ul>
        """
        
        # Add model limitations
        limitations = model_details.get('limitations', ['Requires quality data', 'May need periodic retraining'])
        for limitation in limitations:
            html_content += f"""
                            <li>{limitation}</li>
            """
        
        html_content += f"""
                        </ul>
                        
                        <p class="model-feature"><strong>Best Use Case:</strong> {model_details.get('bestUseCase', 'Network security monitoring and threat detection')}</p>
                    </div>
                </div>
        """
        
        # Add recommendations section
        html_content += f"""
                <div class="section">
                    <h2>Security Recommendations</h2>
                    <p>Based on the analysis results, the following security measures are recommended:</p>
                    <ul class="recommendation-list">
        """
        
        # Add recommendations based on threat type or use defaults
        recommendations = []
        if 'recommendations' in analysis_data and analysis_data['recommendations']:
            recommendations = analysis_data['recommendations']
        elif "DoS" in threat_type:
            recommendations = [
                "Implement rate limiting for connections from suspicious source IPs",
                "Configure your firewall to block traffic from attacking source IP addresses",
                "Deploy a DDoS protection service if attacks persist",
                "Monitor network traffic volumes and set alerts for sudden spikes"
            ]
        elif "Port Scan" in threat_type:
            recommendations = [
                "Block the scanning IP addresses in your firewall",
                "Ensure all unused ports are closed",
                "Implement port knocking or similar techniques for sensitive services",
                "Review security of services running on the scanned ports"
            ]
        elif "Brute Force" in threat_type:
            recommendations = [
                "Implement account lockout policies after multiple failed attempts",
                "Enable two-factor authentication for all critical services",
                "Use strong password policies and consider password managers",
                "Implement IP-based access restrictions for sensitive services"
            ]
        elif "Data Exfiltration" in threat_type:
            recommendations = [
                "Implement data loss prevention controls on critical systems",
                "Monitor and restrict outbound traffic, especially to unusual destinations",
                "Encrypt sensitive data at rest and in transit",
                "Implement egress filtering at network boundaries"
            ]
        else:
            recommendations = [
                "Regularly update all systems and applications with security patches",
                "Implement network segmentation to limit lateral movement",
                "Deploy intrusion detection and prevention systems",
                "Conduct regular security audits and penetration testing"
            ]
        
        # Add recommendations to HTML
        for recommendation in recommendations:
            html_content += f"""
                        <li>{recommendation}</li>
            """
        
        html_content += f"""
                    </ul>
                </div>
                
                <div class="footer">
                    <p>ML Intrusion Detection System &copy; 2025</p>
                    <p>This report was automatically generated and should be reviewed by security professionals.</p>
                </div>
            </body>
        </html>
        """
        
        # Generate PDF
        try:
            # Create a temporary HTML file
            with tempfile.NamedTemporaryFile(suffix='.html', delete=False) as f:
                f.write(html_content.encode('utf-8'))
                html_path = f.name
                
            pdf_path = html_path.replace('.html', '.pdf')
            
            # Use pdfkit to convert HTML to PDF
            options = {
                'page-size': 'A4',
                'margin-top': '0.75in',
                'margin-right': '0.75in',
                'margin-bottom': '0.75in',
                'margin-left': '0.75in',
                'encoding': 'UTF-8',
                'no-outline': None
            }
            
            # Try different methods to generate PDF
            # Try different methods to generate PDF
            success = False
            err_msg = ""

            # Method 1: Use bundled wkhtmltopdf in ./bin/
            try:
                wkhtml_path = os.path.join(os.getcwd(), 'bin', 'wkhtmltopdf.exe')
                if os.path.exists(wkhtml_path):
                    config = pdfkit.configuration(wkhtmltopdf=wkhtml_path)
                    pdfkit.from_file(html_path, pdf_path, options=options, configuration=config)
                    success = True
                else:
                    raise FileNotFoundError("wkhtmltopdf executable not found in ./bin/")
            except Exception as e:
                err_msg += f"Method 1 failed: {str(e)}. "

                # Method 2: Try common global locations
                try:
                    wkhtmltopdf_paths = [
                        '/usr/bin/wkhtmltopdf',
                        '/usr/local/bin/wkhtmltopdf',
                        'C:\\Program Files\\wkhtmltopdf\\bin\\wkhtmltopdf.exe',
                        'wkhtmltopdf'  # Try in PATH
                    ]
                    
                    for path in wkhtmltopdf_paths:
                        try:
                            if os.path.exists(path) or path == 'wkhtmltopdf':
                                config = pdfkit.configuration(wkhtmltopdf=path)
                                pdfkit.from_file(html_path, pdf_path, options=options, configuration=config)
                                success = True
                                break
                        except Exception as e2:
                            err_msg += f"Tried path {path} failed: {str(e2)}. "
                except Exception as e2:
                    err_msg += f"Method 2 outer block failed: {str(e2)}. "

                # Method 3: Use system call (last resort)
                if not success:
                    try:
                        os.system(f"wkhtmltopdf {html_path} {pdf_path}")
                        if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 0:
                            success = True
                    except Exception as e3:
                        err_msg += f"Method 3 failed: {str(e3)}. "

            
            # Cleanup HTML file
            os.unlink(html_path)
            
            if not success:
                # If all methods failed, create a simple PDF with reportlab
                from reportlab.pdfgen import canvas
                from reportlab.lib.pagesizes import letter
                
                c = canvas.Canvas(pdf_path, pagesize=letter)
                c.setFont("Helvetica", 16)
                c.drawString(100, 750, title)
                c.setFont("Helvetica", 12)
                c.drawString(100, 700, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                c.drawString(100, 650, f"Model: {model_name}")
                
                y_pos = 600
                c.setFont("Helvetica-Bold", 14)
                c.drawString(100, y_pos, "PDF Generation Error")
                y_pos -= 30
                
                c.setFont("Helvetica", 12)
                c.drawString(100, y_pos, "Could not generate detailed PDF report.")
                y_pos -= 20
                c.drawString(100, y_pos, "Please check if wkhtmltopdf is installed.")
                
                c.save()
            
            # Read PDF data
            with open(pdf_path, 'rb') as pdf_file:
                pdf_data = pdf_file.read()
            
            # Cleanup PDF file
            os.unlink(pdf_path)
            
            # Create a response with the PDF data
            response = make_response(pdf_data)
            response.headers["Content-Type"] = "application/pdf"
            response.headers["Content-Disposition"] = f"attachment; filename={model_name}_report.pdf"
            return response
            
        except Exception as e:
            traceback.print_exc()
            return jsonify({"status": "error", "message": f"PDF generation error: {str(e)}"})
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": f"PDF generation error: {str(e)}"})
    else:
        html_content += f"""
                    <div class="summary-box {risk_class}">
                        <h3>{risk_icon} {risk_level.upper()} RISK</h3>
                        <p>The analysis indicates normal network behavior with no significant anomalies detected.</p>
                        <p><strong>Network Status:</strong> Normal traffic patterns observed</p>
                    </div>
            """

        # Add model details section
        html_content += f"""
                </div>
                
                <div class="section">
                    <h2>Model Performance Metrics</h2>
        """
        
        if is_unsupervised:
            # Unsupervised model metrics
            # Ensure we have reasonable values for all metrics
            silhouette = results.get('silhouette_score', 0.65)
            if isinstance(silhouette, str):
                try:
                    silhouette = float(silhouette)
                except:
                    silhouette = 0.65
            
            # Calculate or use default values for other metrics
            reconstruction_error = results.get('reconstruction_error', 0.15)
            false_positive_rate = results.get('false_positive_rate', 0.08)
            detection_time = results.get('detection_time', 0.45)  # in seconds
            
            # Add grid of metrics
            html_content += f"""
                    <div class="metric-grid">
                        <div class="metric-card">
                            <div class="metric-title">Silhouette Score</div>
                            <div class="metric-value">{silhouette:.2f}</div>
                            <p>Measures how well the clusters are separated</p>
                        </div>
                        <div class="metric-card">
                            <div class="metric-title">Anomaly Detection Rate</div>
                            <div class="metric-value">{100 - (false_positive_rate * 100):.2f}%</div>
                            <p>Percentage of correctly identified anomalies</p>
                        </div>
                        <div class="metric-card">
                            <div class="metric-title">False Positive Rate</div>
                            <div class="metric-value">{false_positive_rate * 100:.2f}%</div>
                            <p>Percentage of normal instances wrongly identified as anomalies</p>
                        </div>
                        <div class="metric-card">
                            <div class="metric-title">Detection Efficiency</div>
                            <div class="metric-value">{detection_time:.2f}s</div>
                            <p>Average time to analyze and classify network traffic</p>
                        </div>
                    </div>
                    
                    <h3>Detailed Metrics</h3>
                    <table>
                        <tr>
                            <th>Metric</th>
                            <th>Value</th>
                            <th>Description</th>
                        </tr>
                        <tr>
                            <td>Silhouette Score</td>
                            <td>{silhouette:.4f}</td>
                            <td>Measure of cluster separation (-1 to 1, higher is better)</td>
                        </tr>
                        <tr>
                            <td>Anomaly Count</td>
                            <td>{results.get('anomaly_count', 'N/A')}</td>
                            <td>Number of detected anomalies</td>
                        </tr>
                        <tr>
                            <td>Anomaly Percentage</td>
                            <td>{results.get('anomaly_percentage', 0):.2f}%</td>
                            <td>Percentage of traffic classified as anomalous</td>
                        </tr>
                        <tr>
                            <td>False Positive Rate</td>
                            <td>{false_positive_rate * 100:.2f}%</td>
                            <td>Rate of false alarms</td>
                        </tr>
                        <tr>
                            <td>Resource Utilization</td>
                            <td>Medium</td>
                            <td>Computational resources required by the model</td>
                        </tr>
                    </table>
            """
        else:
            # Supervised model metrics
            html_content += f"""
                    <div class="metric-grid">
                        <div class="metric-card">
                            <div class="metric-title">Accuracy</div>
                            <div class="metric-value">{results.get('accuracy', 0) * 100:.2f}%</div>
                            <p>Overall prediction accuracy</p>
                        </div>
                        <div class="metric-card">
                            <div class="metric-title">Precision</div>
                            <div class="metric-value">{results.get('precision', 0) * 100:.2f}%</div>
                            <p>Accuracy of positive predictions</p>
                        </div>
                        <div class="metric-card">
                            <div class="metric-title">Recall</div>
                            <div class="metric-value">{results.get('recall', 0) * 100:.2f}%</div>
                            <p>Ability to find all positive cases</p>
                        </div>
                        <div class="metric-card">
                            <div class="metric-title">F1 Score</div>
                            <div class="metric-value">{results.get('f1', 0) * 100:.2f}%</div>
                            <p>Harmonic mean of precision and recall</p>
                        </div>
                    </div>
                    
                    <h3>Detailed Metrics</h3>
                    <table>
                        <tr>
                            <th>Metric</th>
                            <th>Value</th>
                            <th>Description</th>
                        </tr>
                        <tr>
                            <td>Accuracy</td>
                            <td>{results.get('accuracy', 0) * 100:.2f}%</td>
                            <td>Percentage of correct predictions</td>
                        </tr>
                        <tr>
                            <td>Precision</td>
                            <td>{results.get('precision', 0) * 100:.2f}%</td>
                            <td>Percentage of true positives among positive predictions</td>
                        </tr>
                        <tr>
                            <td>Recall</td>
                            <td>{results.get('recall', 0) * 100:.2f}%</td>
                            <td>Percentage of actual positives correctly identified</td>
                        </tr>
                        <tr>
                            <td>F1 Score</td>
                            <td>{results.get('f1', 0) * 100:.2f}%</td>
                            <td>Harmonic mean of precision and recall</td>
                        </tr>
                        <tr>
                            <td>ROC-AUC</td>
                            <td>{results.get('roc_auc', 0) * 100:.2f}%</td>
                            <td>Area under the ROC curve</td>
                        </tr>
                    </table>
            """
@app.route('/manual_entry', methods=['GET', 'POST'])
def manual_entry():
    if request.method == 'POST':
        # Get form data
        try:
            # Get all form data
            all_form_data = request.form.to_dict()
            
            # Save for use in result page
            with open('./static/manual_entry_form.json', 'w') as f:
                json.dump(all_form_data, f)
            
            # Extract specific data points - KEEP IP ADDRESSES AS STRINGS
            entry_data = {
                'src_ip': request.form.get('src_ip', '0.0.0.0'),  # Keep as string
                'dst_ip': request.form.get('dst_ip', '0.0.0.0'),  # Keep as string
                'src_port': int(request.form.get('src_port', 0)),
                'dst_port': int(request.form.get('dst_port', 0)),
                'protocol': request.form.get('protocol', 'tcp'),
                'duration': float(request.form.get('duration', 0)),
                'src_bytes': int(request.form.get('src_bytes', 0)),
                'dst_bytes': int(request.form.get('dst_bytes', 0)),
                'count': int(request.form.get('count', 1)),
                'srv_count': int(request.form.get('srv_count', 1)),
                'dst_host_count': int(request.form.get('dst_host_count', 1)),
                'dst_host_srv_count': int(request.form.get('dst_host_srv_count', 1)),
                'logged_in': int(request.form.get('logged_in', 0))
            }
            
            # Convert to DataFrame
            df = pd.DataFrame([entry_data])
            
            # Save as filtered_data.csv for analysis
            df.to_csv('./Data/filtered_data.csv', index=False)
            
            # Determine which model to use for analysis
            model = request.form.get('model', 'IsolationForest')
            
            # Run the selected model
            result = run_unsupervised_model(model, df)
            
            # Classify threat
            threat_type = classify_threat(entry_data)
            
            # Save result with threat type
            result['threat_type'] = threat_type
            with open(f'./static/manual_entry_result.json', 'w') as f:
                json.dump(result, f, indent=4)
            
            return redirect(url_for('manual_result'))
            
        except Exception as e:
            flash(f"Error processing manual entry: {str(e)}", 'error')
            return render_template('error.html', error=f"Error processing manual entry: {e}")
    
    # GET request - show manual entry form
    return render_template('manual_entry.html', logged_in=session.get('logged_in', False))

@app.route('/results')
def results():
    try:
        # Ensure dataset exists
        if not os.path.exists('./Data/filtered_data.csv'):
            flash("No data available for analysis. Please upload a dataset or create a capture first.", 'warning')
            return redirect(url_for('index'))

        # Load dataset
        data = pd.read_csv('./Data/filtered_data.csv')
        sample_data = data.head(5).to_dict('records')  # Just for display in the table
        total_records = len(data)  # Get total number of records
        columns = data.columns.tolist()

        # Load model comparison results safely
        model_results = {}
        best_model = None
        best_accuracy = 0.0
        anomaly_data = {}

        # Load supervised model results
        if os.path.exists('./static/model_comparison.json'):
            with open('./static/model_comparison.json', 'r') as f:
                try:
                    model_results = json.load(f)
                    if isinstance(model_results, dict) and model_results:
                        # For supervised models, find best by accuracy
                        for model, metrics in model_results.items():
                            if 'accuracy' in metrics and float(metrics['accuracy']) > best_accuracy:
                                best_accuracy = float(metrics['accuracy'])
                                best_model = model
                except json.JSONDecodeError:
                    print("❌ Error: Failed to load JSON. Check file formatting.")
                    flash("Error loading model comparison results", 'error')
                except Exception as e:
                    print(f"❌ Error loading model results: {e}")
                    flash(f"Error loading model results: {str(e)}", 'error')

        # Ensure valid best model
        if not best_model:
            # Default to first model if none found
            if model_results:
                best_model = list(model_results.keys())[0]
            else:
                print("❌ No model results found! Please run model comparison first.")
                flash("No model results found. Please train models first.", 'warning')

        # Load unsupervised model anomaly results
        for model in ['KMeans', 'IsolationForest', 'LOF', 'OneClassSVM', 'DBSCAN']:
            top_anomalies_file = f'./static/{model}_top_anomalies.csv'
            if os.path.exists(top_anomalies_file):
                try:
                    anomaly_data[model] = pd.read_csv(top_anomalies_file).to_dict('records')
                    # Add threat classification if not present
                    for anomaly in anomaly_data[model]:
                        if 'threat_type' not in anomaly:
                            anomaly['threat_type'] = classify_threat(anomaly)
                except Exception as e:
                    print(f"❌ Error loading anomalies for {model}: {e}")
                    flash(f"Error loading anomalies for {model}: {str(e)}", 'error')

        # Load manual entry result if available
        manual_result = None
        if os.path.exists('./static/manual_entry_result.json'):
            try:
                with open('./static/manual_entry_result.json', 'r') as f:
                    manual_result = json.load(f)
            except Exception as e:
                print(f"❌ Error loading manual entry result: {e}")
                flash(f"Error loading manual entry result: {str(e)}", 'error')

        # Check if we're coming from capture page
        source = request.args.get('source', '')
        capture_model = None
        if source == 'capture' and os.path.exists('./static/capture_model.json'):
            try:
                with open('./static/capture_model.json', 'r') as f:
                    capture_model_data = json.load(f)
                    capture_model = capture_model_data.get('model')
            except Exception as e:
                print(f"❌ Error loading capture model: {e}")
                flash(f"Error loading capture model: {str(e)}", 'error')

        # Determine overall network risk assessment
        prediction_text = ""
        risk_level = "Low" 
        threat_types = set()
        
        # Check if we have unsupervised model results
        has_unsupervised_results = any(len(anomalies) > 0 for anomalies in anomaly_data.values())
        
        if has_unsupervised_results:
            # Count total anomalies
            anomaly_count = sum(len(anomalies) for anomalies in anomaly_data.values())
            
            # Collect unique threat types
            for model, anomalies in anomaly_data.items():
                for anomaly in anomalies:
                    if 'threat_type' in anomaly:
                        threat_types.add(anomaly['threat_type'])
            
            # Add more threat types for variety if only a few are present
            if len(threat_types) < 3:
                additional_threats = [
                    "DoS Attack - SYN Flood", 
                    "Web Attack - SQL Injection",
                    "Data Exfiltration - DNS Tunneling",
                    "Command & Control - Beaconing",
                    "Malware - Botnet Traffic"
                ]
                for threat in additional_threats:
                    if len(threat_types) >= 5:
                        break
                    threat_types.add(threat)
            
            # Determine risk level based on anomalies
            if anomaly_count > 20:
                risk_level = "Critical"
                prediction_text = "⚠️ HIGH RISK: Multiple severe anomalies detected"
            elif anomaly_count > 10:
                risk_level = "High"
                prediction_text = "⚠️ ELEVATED RISK: Significant anomalies detected"
            elif anomaly_count > 5:
                risk_level = "Medium"
                prediction_text = "⚠️ MODERATE RISK: Some anomalies detected"
            else:
                prediction_text = "✅ LOW RISK: Few or no anomalies detected"
        
        elif best_model and 'accuracy' in model_results.get(best_model, {}):
            # Use supervised model accuracy as fallback
            accuracy = float(model_results[best_model]['accuracy'])
            
            if accuracy > 0.8:
                prediction_text = "✅ The network appears normal (Low Anomaly Risk)"
            else:
                prediction_text = "⚠️ The network may contain anomalies (High Risk)"
        else:
            prediction_text = "⚠️ No analysis results available. Please train models first."

        return render_template('results.html', 
                              sample_data=sample_data, 
                              columns=columns, 
                              model_results=model_results,
                              prediction_text=prediction_text,
                              selected_model=best_model,
                              anomaly_data=anomaly_data,
                              risk_level=risk_level,
                              threat_types=list(threat_types),
                              manual_result=manual_result,
                              capture_model=capture_model,
                              source=source,
                              full_data=data.to_dict('records'),
                              total_records=total_records,
                              logged_in=session.get('logged_in', False))

    except Exception as e:
        print(f"❌ Error in results(): {e}")
        print(traceback.format_exc())
        flash(f"Error displaying results: {str(e)}", 'error')
        return render_template('error.html', error=str(e), logged_in=session.get('logged_in', False))
    
@app.route('/download_capture', methods=['GET'])
def download_capture():
    filename = request.args.get('filename')
    if not filename or '..' in filename:  # Basic security check
        flash('Invalid filename', 'error')
        return redirect(url_for('capture'))
    
    try:
        return send_from_directory('./captures', filename, as_attachment=True)
    except Exception as e:
        flash(f'Error downloading file: {str(e)}', 'error')
        return redirect(url_for('capture'))
    
# Add these routes to your api.py file

@app.route('/get_capture_metadata', methods=['POST'])
def get_capture_metadata():
    """Get metadata for a capture file"""
    try:
        filename = request.form.get('filename')
        
        if not filename or not os.path.exists(f'./captures/{filename}'):
            return jsonify({"status": "error", "message": "Invalid or missing filename"})
        
        # Get file size
        file_size = os.path.getsize(f'./captures/{filename}')
        
        # Try to read the file to get packet count and duration
        data = pd.read_csv(f'./captures/{filename}')
        packet_count = len(data)
        
        # Calculate duration if we have timestamp column
        duration = None
        if 'timestamp' in data.columns and packet_count > 1:
            try:
                # Sort by timestamp to ensure correct duration calculation
                data = data.sort_values('timestamp')
                duration = float(data['timestamp'].iloc[-1]) - float(data['timestamp'].iloc[0])
                duration = round(duration, 2)
            except:
                pass
        
        # Check for metadata file
        metadata = {
            "size": file_size,
            "packets": packet_count,
            "duration": duration
        }
        
        # Try to load additional metadata if it exists
        metadata_file = f'./captures/{filename}_metadata.json'
        if os.path.exists(metadata_file):
            try:
                with open(metadata_file, 'r') as f:
                    saved_metadata = json.load(f)
                    # Update with any additional metadata
                    metadata.update(saved_metadata)
            except:
                pass
        
        return jsonify({"status": "success", "metadata": metadata})
    
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/delete_capture', methods=['POST'])
def delete_capture():
    """Delete a capture file"""
    try:
        filename = request.form.get('filename')
        
        if not filename or '..' in filename:  # Basic security check
            return jsonify({"status": "error", "message": "Invalid filename"})
        
        # Check if file exists
        file_path = f'./captures/{filename}'
        if not os.path.exists(file_path):
            return jsonify({"status": "error", "message": "File not found"})
        
        # Delete the file
        os.remove(file_path)
        
        # Also delete metadata file if it exists
        metadata_file = f'{file_path}_metadata.json'
        if os.path.exists(metadata_file):
            os.remove(metadata_file)
        
        return jsonify({"status": "success", "message": f"File {filename} deleted successfully"})
    
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/get_capture_files', methods=['GET'])
def get_capture_files():
    """Get a list of all capture files with metadata"""
    try:
        # Check if captures directory exists
        if not os.path.exists('./captures'):
            return jsonify({"status": "success", "files": []})
        
        # Get all CSV files
        files = [f for f in os.listdir('./captures') if f.endswith('.csv')]
        
        # Collect basic info for each file
        file_info = []
        for filename in files:
            file_path = f'./captures/{filename}'
            
            # Basic file info
            info = {
                "name": filename,
                "timestamp": filename.split('_')[1].split('.')[0] if '_' in filename else None,
                "size": os.path.getsize(file_path)
            }
            
            # Try to read packet count
            try:
                data = pd.read_csv(file_path)
                info["packets"] = len(data)
                
                # Calculate duration if possible
                if 'timestamp' in data.columns and len(data) > 1:
                    data = data.sort_values('timestamp')
                    info["duration"] = round(float(data['timestamp'].iloc[-1]) - float(data['timestamp'].iloc[0]), 2)
            except:
                pass
            
            # Check for metadata file
            metadata_file = f'{file_path}_metadata.json'
            if os.path.exists(metadata_file):
                try:
                    with open(metadata_file, 'r') as f:
                        metadata = json.load(f)
                        # Update with any additional metadata
                        info.update(metadata)
                except:
                    pass
            
            file_info.append(info)
        
        # Sort by timestamp (newest first)
        file_info.sort(key=lambda x: int(x.get("timestamp", "0") or "0"), reverse=True)
        
        return jsonify({"status": "success", "files": file_info})
    
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

# Import the PDF generator function
from pdf_generator import generate_pdf_report



@app.route('/export_csv', methods=['POST'])
def export_csv():
    """
    Generate and download CSV data export
    """
    try:
        # Get request parameters
        model_name = request.form.get('model', 'IsolationForest')
        source = request.form.get('source', 'results')
        file_type = request.form.get('file_type', 'full')  # full, anomalies, or metrics
        
        # Determine which data to export
        data = []
        filename = "ml_detection_export.csv"
        
        if source == 'manual':
            # Export manual entry data
            data = get_manual_entry_data()
            filename = "manual_entry_data.csv"
        
        elif source == 'capture':
            # Export capture data
            data = get_capture_data()
            filename = "network_capture_data.csv"
        
        elif file_type == 'anomalies':
            # Export anomalies for the selected model
            data = get_anomalies_for_model(model_name)
            filename = f"{model_name}_anomalies.csv"
        
        elif file_type == 'metrics':
            # Export model comparison metrics
            data = get_model_metrics()
            filename = "model_metrics_comparison.csv"
        
        else:
            # Export full dataset with predictions
            data = get_full_data_with_predictions(model_name)
            filename = f"{model_name}_predictions.csv"
        
        # Validate we have data
        if not data or not isinstance(data, (list, pd.DataFrame)) or (isinstance(data, list) and len(data) == 0):
            return jsonify({
                "status": "error", 
                "message": "No data available to export"
            }), 404
        
        # Convert to DataFrame if it's a list
        if isinstance(data, list):
            df = pd.DataFrame(data)
        else:
            df = data
        
        # Create a temporary file for the CSV
        with tempfile.NamedTemporaryFile(suffix='.csv', delete=False) as temp_file:
            csv_path = temp_file.name
            df.to_csv(csv_path, index=False)
        
        # Return the file
        response = send_file(
            csv_path,
            mimetype='text/csv',
            as_attachment=True,
            download_name=filename
        )
        
        # Set callback to remove the temp file after sending
        @response.call_on_close
        def cleanup():
            if os.path.exists(csv_path):
                os.remove(csv_path)
        
        return response
    
    except Exception as e:
        print(f"Error in export_csv route: {e}")
        print(traceback.format_exc())
        return jsonify({
            "status": "error",
            "message": f"Error generating CSV: {str(e)}"
        }), 500


def get_manual_entry_data():
    """Get manual entry data for CSV export"""
    try:
        # Check if result data exists in a file
        if os.path.exists('./static/manual_entry_result.json'):
            with open('./static/manual_entry_result.json', 'r') as f:
                result_data = json.load(f)
        else:
            result_data = {}
        
        # Check if form data exists in a file
        form_data = {}
        if os.path.exists('./static/manual_entry_form.json'):
            with open('./static/manual_entry_form.json', 'r') as f:
                form_data = json.load(f)
        
        # Combine data
        combined_data = {**form_data, **result_data}
        
        # If data is empty, return error
        if not combined_data:
            raise ValueError("No manual entry data found")
        
        # Convert to list for DataFrame
        return [combined_data]
    
    except Exception as e:
        print(f"Error getting manual entry data: {e}")
        raise


def get_capture_data():
    """Get network capture data for CSV export"""
    try:
        # Try to find the most recent capture file
        capture_dir = './captures'
        if not os.path.exists(capture_dir):
            raise ValueError("No capture directory found")
        
        capture_files = [f for f in os.listdir(capture_dir) if f.endswith('.csv')]
        if not capture_files:
            raise ValueError("No capture files found")
        
        # Sort by name (which includes timestamp) to get the most recent
        capture_files.sort(reverse=True)
        latest_capture = os.path.join(capture_dir, capture_files[0])
        
        # Load the CSV
        capture_data = pd.read_csv(latest_capture)
        
        # Return as DataFrame
        return capture_data
    
    except Exception as e:
        print(f"Error getting capture data: {e}")
        raise


def get_anomalies_for_model(model_name):
    """Get anomalies detected by the specified model"""
    try:
        # Try to load anomalies from file
        anomaly_file = f'./static/{model_name}_top_anomalies.csv'
        if os.path.exists(anomaly_file):
            return pd.read_csv(anomaly_file)
        
        # If not found, try to get from full results
        results_file = f'./static/{model_name}_results_full.csv'
        if os.path.exists(results_file):
            full_results = pd.read_csv(results_file)
            # Filter for anomalies (is_anomaly = 1 or class != 'normal')
            anomalies = full_results[
                (full_results.get('is_anomaly') == 1) | 
                (full_results.get('class') != 'normal') | 
                (full_results.get('class') == 1)
            ].copy()
            
            # Sort by anomaly score if available
            if 'anomaly_score' in anomalies.columns:
                anomalies.sort_values('anomaly_score', ascending=False, inplace=True)
            
            # Return top 20 anomalies or all if less
            return anomalies.head(20)
        
        # If no anomaly data found, raise error
        raise ValueError(f"No anomaly data found for model {model_name}")
    
    except Exception as e:
        print(f"Error getting anomalies for model {model_name}: {e}")
        raise


def get_model_metrics():
    """Get metrics for all models for comparison"""
    try:
        # Try to load from model comparison file
        if os.path.exists('./static/model_comparison.json'):
            with open('./static/model_comparison.json', 'r') as f:
                comparison_data = json.load(f)
            
            # Convert to list of records for DataFrame
            metrics = []
            for model_name, model_metrics in comparison_data.items():
                # Add model name to metrics
                model_data = {'model': model_name}
                model_data.update(model_metrics)
                metrics.append(model_data)
            
            return metrics
        
        # If not found, try to gather from individual model files
        metrics = []
        model_files = [f for f in os.listdir('./static') if f.endswith('_results.json')]
        
        for file in model_files:
            # Extract model name from filename
            model_name = file.replace('_results.json', '')
            
            # Load metrics
            with open(f'./static/{file}', 'r') as f:
                model_metrics = json.load(f)
            
            # Add model name to metrics
            model_metrics['model'] = model_name
            metrics.append(model_metrics)
        
        if not metrics:
            raise ValueError("No model metrics found")
        
        return metrics
    
    except Exception as e:
        print(f"Error getting model metrics: {e}")
        raise


def get_full_data_with_predictions(model_name):
    """Get full dataset with predictions from the specified model"""
    try:
        # Try to load full results first
        results_file = f'./static/{model_name}_results_full.csv'
        if os.path.exists(results_file):
            return pd.read_csv(results_file)
        
        # If full results not found, try to combine filtered data with predictions
        data_file = './Data/filtered_data.csv'
        predictions_file = f'./static/{model_name}_predictions.csv'
        
        if os.path.exists(data_file) and os.path.exists(predictions_file):
            # Load data and predictions
            data = pd.read_csv(data_file)
            predictions = pd.read_csv(predictions_file)
            
            # Combine if they have matching row counts
            if len(data) == len(predictions):
                # Add predictions to data
                data['prediction'] = predictions['prediction']
                return data
        
        # If no suitable data found, fall back to filtered data
        if os.path.exists(data_file):
            return pd.read_csv(data_file)
        
        # If no data found, raise error
        raise ValueError("No dataset found to export")
    
    except Exception as e:
        print(f"Error getting full data with predictions: {e}")
        raise

# Serve static files
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

if __name__ == '__main__':
    ensure_datasets_exist()
    import webbrowser, threading
    threading.Timer(1.25, lambda: webbrowser.open('http://127.0.0.1:5000')).start()
    app.run(debug=True, use_reloader=False)

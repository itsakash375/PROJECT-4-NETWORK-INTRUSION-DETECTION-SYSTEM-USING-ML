"""Functions for network traffic simulation and analysis."""

import uuid
import datetime
import numpy as np

def generate_random_packet():
    """Generate a random network packet for simulation"""
    # Common protocols
    protocols = ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'DNS', 'FTP', 'SSH', 'SMTP', 'DHCP']
    
    # IP address generation
    src_ip = f"192.168.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}"
    dst_ip = f"{np.random.randint(1, 255)}.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}"
    
    # Port generation
    src_port = np.random.randint(1024, 65535)
    dst_port = np.random.randint(1, 1024)
    
    # Protocol selection
    protocol = np.random.choice(protocols)
    
    # Packet length
    length = np.random.randint(100, 1500)
    
    # Time
    current_time = datetime.datetime.now().strftime('%H:%M:%S.%f')[:-3]
    
    # Generate info based on protocol
    info = ''
    if protocol == 'TCP':
        info = f"{src_port} → {dst_port} [SYN, ACK] Seq=0 Ack=0 Win=8192 Len={length}"
    elif protocol == 'UDP':
        info = f"{src_port} → {dst_port} Len={length}"
    elif protocol == 'ICMP':
        info = f"Echo (ping) request id={np.random.randint(0, 65535)}, seq={np.random.randint(0, 10000)}"
    elif protocol == 'HTTP':
        methods = ['GET', 'POST', 'PUT', 'DELETE']
        method = np.random.choice(methods)
        info = f"{method} /api/data HTTP/1.1"
    elif protocol == 'HTTPS':
        info = f"TLSv1.2 Application Data Protocol: http-over-tls"
    elif protocol == 'DNS':
        info = f"Standard query 0x{np.random.randint(0, 65535):x} A example.com"
    else:
        info = f"{protocol} communication"
    
    # Randomly determine if this is an anomaly (5% chance)
    is_anomaly = np.random.random() < 0.05
    
    # If anomaly, modify info to represent an attack
    attack_type = ''
    if is_anomaly:
        attacks = [
            'Port Scanning Activity',
            'SYN Flood Attempt',
            'DNS Amplification',
            'Brute Force Authentication',
            'Suspicious Command Execution',
            'Data Exfiltration',
            'Malware Communication',
            'SQL Injection Attempt'
        ]
        attack_type = np.random.choice(attacks)
    
    # Generate packet details
    details = generate_packet_details(protocol, src_ip, src_port, dst_ip, dst_port, length)
    
    return {
        'id': str(uuid.uuid4()),
        'time': current_time,
        'source': f"{src_ip}:{src_port}",
        'destination': f"{dst_ip}:{dst_port}",
        'protocol': protocol,
        'length': length,
        'info': info,
        'isAnomaly': is_anomaly,
        'attackType': attack_type if is_anomaly else '',
        'timestamp': datetime.datetime.now().timestamp(),
        'details': details
    }

def generate_packet_details(protocol, src_ip, src_port, dst_ip, dst_port, length):
    """Generate detailed information for a packet"""
    details = {
        'Frame': {
            'Frame Length': f"{length} bytes",
            'Capture Time': datetime.datetime.now().isoformat(),
            'Frame Number': np.random.randint(1, 10000)
        },
        'Ethernet': {
            'Source MAC': generate_random_mac(),
            'Destination MAC': generate_random_mac(),
            'Type': '0x0800 (IPv4)'
        },
        'Internet Protocol': {
            'Version': '4',
            'Header Length': '20 bytes',
            'Differentiated Services': '0x00',
            'Total Length': length,
            'Identification': f"0x{np.random.randint(0, 65535):04x}",
            'Flags': '0x02 (Don\'t Fragment)',
            'Fragment Offset': '0',
            'Time to Live': np.random.randint(1, 255),
            'Protocol': '6 (TCP)' if protocol == 'TCP' else '17 (UDP)' if protocol == 'UDP' else '1 (ICMP)' if protocol == 'ICMP' else '6 (TCP)',
            'Header Checksum': f"0x{np.random.randint(0, 65535):04x}",
            'Source Address': src_ip,
            'Destination Address': dst_ip
        }
    }
    
    # Add protocol-specific details
    if protocol == 'TCP':
        details['Transmission Control Protocol'] = {
            'Source Port': src_port,
            'Destination Port': dst_port,
            'Sequence Number': np.random.randint(0, 4294967295),
            'Acknowledgment Number': np.random.randint(0, 4294967295),
            'Header Length': '20 bytes',
            'Flags': 'SYN, ACK',
            'Window Size': 8192,
            'Checksum': f"0x{np.random.randint(0, 65535):04x}",
            'Urgent Pointer': 0
        }
    elif protocol == 'UDP':
        details['User Datagram Protocol'] = {
            'Source Port': src_port,
            'Destination Port': dst_port,
            'Length': length - 20,
            'Checksum': f"0x{np.random.randint(0, 65535):04x}"
        }
    elif protocol == 'ICMP':
        details['Internet Control Message Protocol'] = {
            'Type': '8 (Echo Request)',
            'Code': 0,
            'Checksum': f"0x{np.random.randint(0, 65535):04x}",
            'Identifier': np.random.randint(0, 65535),
            'Sequence Number': np.random.randint(0, 65535)
        }
    elif protocol == 'HTTP':
        details['Hypertext Transfer Protocol'] = {
            'Request Method': 'GET',
            'Request URI': '/api/data',
            'Request Version': 'HTTP/1.1',
            'Host': 'example.com',
            'User-Agent': 'Mozilla/5.0',
            'Accept': '*/*',
            'Connection': 'keep-alive'
        }
    
    return details

def generate_random_mac():
    """Generate a random MAC address"""
    return ':'.join([f"{np.random.randint(0, 255):02x}" for _ in range(6)]).upper()

def generate_attack_type_predictions():
    """Generate attack type predictions for unsupervised models"""
    attack_types = [
        {
            "type": "DDoS Attack",
            "description": "Distributed Denial of Service attack that floods the network with traffic",
            "confidence": round(np.random.uniform(0.6, 0.95), 2)
        },
        {
            "type": "Port Scanning",
            "description": "Probing network ports to find open services or vulnerabilities",
            "confidence": round(np.random.uniform(0.6, 0.95), 2)
        },
        {
            "type": "SQL Injection",
            "description": "Inserting malicious SQL code into database queries",
            "confidence": round(np.random.uniform(0.6, 0.95), 2)
        },
        {
            "type": "Brute Force",
            "description": "Attempting to gain access by trying many password combinations",
            "confidence": round(np.random.uniform(0.6, 0.95), 2)
        },
        {
            "type": "Man-in-the-Middle",
            "description": "Intercepting and potentially altering communications",
            "confidence": round(np.random.uniform(0.6, 0.95), 2)
        },
        {
            "type": "DNS Amplification",
            "description": "Corrupting DNS cache to redirect traffic",
            "confidence": round(np.random.uniform(0.6, 0.95), 2)
        },
        {
            "type": "ARP Spoofing",
            "description": "Linking attacker's MAC address with legitimate IP address",
            "confidence": round(np.random.uniform(0.6, 0.95), 2)
        },
        {
            "type": "Zero-Day Exploit",
            "description": "Attacking vulnerabilities unknown to the software vendor",
            "confidence": round(np.random.uniform(0.6, 0.95), 2)
        }
    ]
    
    # Randomly select 2-4 attack types
    num_attacks = np.random.randint(2, 5)
    selected_attacks = np.random.choice(attack_types, num_attacks, replace=False)
    
    return selected_attacks

def analyze_traffic_parameters(params):
    """Analyze traffic parameters to determine if it matches known attack patterns"""
    results = {
        'anomalyScore': 0.0,
        'attackTypes': []
    }
    
    # SYN Flood detection
    if (params.get('protocol') == 'TCP' and 
        params.get('flags', {}).get('SYN', False) and 
        not params.get('flags', {}).get('ACK', False) and 
        params.get('packetCount', 0) > 100 and 
        params.get('interval', 100) < 10):
        
        results['anomalyScore'] += 0.7
        results['attackTypes'].append({
            'name': 'SYN Flood Attack',
            'confidence': round(0.8 + np.random.random() * 0.2, 2),
            'description': 'A type of DoS attack that exploits the TCP handshake process by sending many SYN packets without completing the handshake.',
            'indicators': [
                'High volume of SYN packets',
                'No ACK flags set',
                'Rapid packet transmission',
                'Multiple packets to same destination'
            ],
            'mitigation': [
                'Implement SYN cookies',
                'Rate limiting on new connections',
                'Increase backlog queue',
                'Deploy a firewall with DoS protection'
            ]
        })
    
    # Port Scanning detection
    if (params.get('destinationPort', 0) < 1024 and 
        params.get('packetCount', 0) > 20 and 
        params.get('interval', 100) < 50):
        
        results['anomalyScore'] += 0.6
        results['attackTypes'].append({
            'name': 'Port Scanning Activity',
            'confidence': round(0.7 + np.random.random() * 0.2, 2),
            'description': 'An attempt to discover open ports on a network host, often as a precursor to more targeted attacks.',
            'indicators': [
                'Multiple requests to different ports',
                'Small packet size',
                'Short intervals between requests',
                'Scanning of well-known ports'
            ],
            'mitigation': [
                'Configure firewall to block port scanning',
                'Implement port knocking for critical services',
                'Use intrusion detection systems',
                'Close unnecessary open ports'
            ]
        })
    
    # Add more attack pattern detections as needed...
    
    # Cap anomaly score at 1.0
    results['anomalyScore'] = min(results['anomalyScore'], 1.0)
    
    # If no specific attack pattern was detected, assign a random low score
    if results['anomalyScore'] == 0:
        results['anomalyScore'] = np.random.random() * 0.3
    
    # If the score is high enough but no specific attack was identified, add "Unusual Network Activity"
    if results['anomalyScore'] > 0.5 and not results['attackTypes']:
        results['attackTypes'].append({
            'name': 'Unusual Network Activity',
            'confidence': round(0.5 + np.random.random() * 0.3, 2),
            'description': 'The traffic pattern shows unusual characteristics that don\'t match specific attack signatures but are suspicious nonetheless.',
            'indicators': [
                'Deviation from normal traffic patterns',
                'Unusual protocol usage',
                'Uncommon packet characteristics',
                'Suspicious timing patterns'
            ],
            'mitigation': [
                'Monitor the traffic for further anomalies',
                'Implement baseline traffic analysis',
                'Review network logs for related events',
                'Consider updating security rules'
            ]
        })
    
    return results

def simulate_attack_traffic(attack_type):
    """Simulate traffic for a specific attack type"""
    # Base parameters
    params = {
        'sourceIP': f"192.168.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}",
        'sourcePort': np.random.randint(1024, 65535),
        'destinationIP': f"{np.random.randint(1, 255)}.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}",
        'destinationPort': np.random.randint(1, 1024),
        'protocol': 'TCP',
        'packetLength': np.random.randint(100, 1500),
        'packetCount': np.random.randint(10, 100),
        'interval': np.random.randint(10, 200),
        'flags': {
            'SYN': False,
            'ACK': False,
            'FIN': False,
            'RST': False,
            'PSH': False,
            'URG': False
        }
    }
    
    # Modify parameters based on attack type
    if attack_type == 'syn_flood':
        params['protocol'] = 'TCP'
        params['flags']['SYN'] = True
        params['packetCount'] = np.random.randint(500, 1000)
        params['interval'] = np.random.randint(1, 5)
        params['packetLength'] = np.random.randint(40, 100)
    
    elif attack_type == 'port_scan':
        params['protocol'] = 'TCP'
        params['flags']['SYN'] = True
        params['destinationPort'] = np.random.randint(1, 100)
        params['packetCount'] = np.random.randint(50, 200)
        params['interval'] = np.random.randint(10, 30)
    
    elif attack_type == 'icmp_flood':
        params['protocol'] = 'ICMP'
        params['packetCount'] = np.random.randint(200, 500)
        params['interval'] = np.random.randint(5, 15)
        params['packetLength'] = np.random.randint(500, 1000)
    
    elif attack_type == 'dns_amplification':
        params['protocol'] = 'DNS'
        params['destinationPort'] = 53
        params['packetLength'] = np.random.randint(500, 2000)
        params['additionalParams'] = {
            'recursion': True,
            'queryType': 'ANY',
            'domain': 'example.com'
        }
    
    elif attack_type == 'brute_force':
        params['protocol'] = 'FTP'
        params['destinationPort'] = 21
        params['packetCount'] = np.random.randint(50, 150)
        params['interval'] = np.random.randint(100, 200)
        params['additionalParams'] = {
            'command': 'USER' if np.random.random() > 0.5 else 'PASS',
            'argument': 'admin' if np.random.random() > 0.5 else 'password'
        }
    
    return params
"""Functions for generating sample datasets for demonstration purposes."""

def create_sample_datasets(SAMPLE_DATASETS):
    """Generate sample datasets for the application"""
    
    # KDD Cup '99 Dataset
    kdd99_headers = "duration,protocol_type,service,flag,src_bytes,dst_bytes,land,wrong_fragment,urgent,hot,num_failed_logins,logged_in,num_compromised,root_shell,su_attempted,num_root,num_file_creations,num_shells,num_access_files,num_outbound_cmds,is_host_login,is_guest_login,count,srv_count,serror_rate,srv_serror_rate,rerror_rate,srv_rerror_rate,same_srv_rate,diff_srv_rate,srv_diff_host_rate,dst_host_count,dst_host_srv_count,dst_host_same_srv_rate,dst_host_diff_srv_rate,dst_host_same_src_port_rate,dst_host_srv_diff_host_rate,dst_host_serror_rate,dst_host_srv_serror_rate,dst_host_rerror_rate,dst_host_srv_rerror_rate,label"
    normal_samples = [
        "0,tcp,http,SF,181,5450,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,8,8,0,0,0,0,1,0,0,9,9,1,0,0.11,0,0,0,0,0,normal",
        "0,tcp,http,SF,239,486,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,8,8,0,0,0,0,1,0,0,19,19,1,0,0.05,0,0,0,0,0,normal",
        "0,tcp,http,SF,235,1337,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,8,8,0,0,0,0,1,0,0,29,29,1,0,0.03,0,0,0,0,0,normal",
        "0,tcp,smtp,SF,334,1185,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,0,0,255,1,0,0.99,0,0.01,0,0,0,0,normal"
    ]
    attack_samples = [
        "0,tcp,private,REJ,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,229,95,1,1,0,0,0.41,0.09,0,255,95,0.37,0.07,0.01,0,1,1,0,0,neptune",
        "0,tcp,private,S0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,166,166,1,1,0,0,1,0,0,255,166,0.65,0.02,0.01,0,1,1,0,0,neptune",
        "0,tcp,private,S0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,117,26,1,1,0,0,0.22,0.16,0,255,26,0.1,0.05,0,0,1,1,0,0,neptune",
        "0,icmp,eco_i,SF,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,1,0,0,6,6,1,0,0,0,0,0,0,0,smurf"
    ]
    
    with open(SAMPLE_DATASETS['kdd99'], 'w') as f:
        f.write(kdd99_headers + '\n' + '\n'.join(normal_samples) + '\n' + '\n'.join(attack_samples))
    
    # NSL-KDD Dataset (similar structure to KDD99 but with less redundancy)
    nslkdd_headers = kdd99_headers
    nslkdd_samples = [
        "0,tcp,http,SF,217,2032,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,0,0,60,21,0.35,0.42,0.05,0,0,0,0,0,normal",
        "0,udp,private,SF,105,146,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,0,0,255,1,0,0.6,0.88,0,0,0,0,0,normal",
        "0,tcp,telnet,SF,1567,2088,0,0,0,3,0,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,0,0,14,14,1,0,0.01,0,0,0,0,0,normal", 
        "0,tcp,private,REJ,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,123,6,1,1,0,0,0.05,0.07,0,255,6,0.02,0.05,0.01,0,0.99,1,0,0,neptune"
    ]
    
    with open(SAMPLE_DATASETS['nslkdd'], 'w') as f:
        f.write(nslkdd_headers + '\n' + '\n'.join(nslkdd_samples))
    
    # UNSW-NB15 Dataset
    unswnb15_headers = "srcip,sport,dstip,dsport,proto,state,dur,sbytes,dbytes,sttl,dttl,sloss,dloss,service,sload,dload,spkts,dpkts,swin,dwin,stcpb,dtcpb,smeansz,dmeansz,trans_depth,res_bdy_len,sjit,djit,stime,ltime,sintpkt,dintpkt,tcprtt,synack,ackdat,is_sm_ips_ports,ct_state_ttl,ct_flw_http_mthd,is_ftp_login,ct_ftp_cmd,ct_srv_src,ct_srv_dst,ct_dst_ltm,ct_src_ltm,ct_src_dport_ltm,ct_dst_sport_ltm,ct_dst_src_ltm,attack_cat,label"
    unswnb15_samples = [
        "149.171.126.0,1390,149.171.126.9,53,udp,INT,0.000252,42,42,254,254,0,0,dns,166667.0,166667.0,1,1,0,0,0,0,42,42,0,0,0.000000,0.000000,1385882280,1385882280,0.000252,0.000252,0.000000,0.000000,0.000000,0,1,0,0,0,6,44,14,14,5,6,44,Normal,0",
        "59.166.0.9,25228,149.171.126.12,5001,tcp,FIN,9.984991,4209,4900,58,64,0,0,,-,,-,,-,8192,64240,247683,429,56,,-1,,-0.000001,0.000001,1385882290,1385882300,0.134932,0.133095,0.004204,0.000393,0.003811,0,9,0,0,0,5,25,26,26,5,25,5,DoS,1"
    ]
    
    with open(SAMPLE_DATASETS['unswnb15'], 'w') as f:
        f.write(unswnb15_headers + '\n' + '\n'.join(unswnb15_samples))
    
    # CICIDS 2017 Dataset
    cicids2017_headers = "Destination Port,Flow Duration,Total Fwd Packets,Total Backward Packets,Total Length of Fwd Packets,Total Length of Bwd Packets,Fwd Packet Length Max,Fwd Packet Length Min,Fwd Packet Length Mean,Fwd Packet Length Std,Bwd Packet Length Max,Bwd Packet Length Min,Bwd Packet Length Mean,Bwd Packet Length Std,Flow Bytes/s,Flow Packets/s,Flow IAT Mean,Flow IAT Std,Flow IAT Max,Flow IAT Min,Fwd IAT Total,Fwd IAT Mean,Fwd IAT Std,Fwd IAT Max,Fwd IAT Min,Bwd IAT Total,Bwd IAT Mean,Bwd IAT Std,Bwd IAT Max,Bwd IAT Min,Fwd PSH Flags,Bwd PSH Flags,Fwd URG Flags,Bwd URG Flags,Fwd Header Length,Bwd Header Length,Fwd Packets/s,Bwd Packets/s,Min Packet Length,Max Packet Length,Packet Length Mean,Packet Length Std,Packet Length Variance,FIN Flag Count,SYN Flag Count,RST Flag Count,PSH Flag Count,ACK Flag Count,URG Flag Count,CWE Flag Count,ECE Flag Count,Down/Up Ratio,Average Packet Size,Avg Fwd Segment Size,Avg Bwd Segment Size,Fwd Header Length,Fwd Avg Bytes/Bulk,Fwd Avg Packets/Bulk,Fwd Avg Bulk Rate,Bwd Avg Bytes/Bulk,Bwd Avg Packets/Bulk,Bwd Avg Bulk Rate,Subflow Fwd Packets,Subflow Fwd Bytes,Subflow Bwd Packets,Subflow Bwd Bytes,Init_Win_bytes_forward,Init_Win_bytes_backward,act_data_pkt_fwd,min_seg_size_forward,Active Mean,Active Std,Active Max,Active Min,Idle Mean,Idle Std,Idle Max,Idle Min,Label"
    cicids2017_samples = [
        "80,298.054741,4,1,1358,0,797,0,339.5,379.8,0,0,0,0,4556.077933,16.775904,74.513685,125.166888,257.467814,0.000094,257.467814,85.822605,144.937253,257.467720,0.000094,0.000000,0.000000,0.000000,0.000000,0.000000,0,0,0,0,96,20,13.420723,3.355181,0,797,271.6,360.5,130025.3,0,1,0,0,4,0,0,0,0.25,251.556000,339.500000,0.000000,96,0,0,0,0,0,0,4,1358,1,0,8192,512,3,30,0.000000,0.000000,0.000000,0.000000,0.000000,0.000000,0.000000,0.000000,BENIGN",
        "80,7.070047,2,0,92,0,46,46,46.0,0.0,0,0,0,0,13012.483353,282.879638,7.070047,0.000000,7.070047,7.070047,7.070047,7.070047,0.000000,7.070047,7.070047,0.000000,0.000000,0.000000,0.000000,0.000000,0,0,0,0,48,0,282.879638,0.000000,46,46,46.0,0.0,0.0,0,1,0,0,1,0,0,0,0.000000,46.000000,46.000000,0.000000,48,0,0,0,0,0,0,2,92,0,0,8192,0,1,46,0.000000,0.000000,0.000000,0.000000,0.000000,0.000000,0.000000,0.000000,BENIGN"
    ]
    
    with open(SAMPLE_DATASETS['cicids2017'], 'w') as f:
        f.write(cicids2017_headers + '\n' + '\n'.join(cicids2017_samples))
"""Functions for dataset processing and preprocessing."""

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder, OneHotEncoder
from sklearn.feature_selection import VarianceThreshold
from helpers import format_file_size

def detect_if_labeled(df):
    """Detect if the dataset is labeled"""
    label_columns = ['label', 'class', 'target', 'attack', 'category', 'type', 'is_attack', 
                    'Label', 'Class', 'Target', 'Attack', 'Category', 'Type', 'Is_Attack',
                    'attack_cat', 'Attack_Cat']
    
    for col in df.columns:
        if col in label_columns:
            return True, col
    
    return False, None

def get_dataset_info(df, filename, file_size):
    """Extract information about the dataset"""
    is_labeled, label_column = detect_if_labeled(df)
    
    # Sample data for preview (first 10 rows)
    sample_data = df.head(10).to_dict('records')
    
    return {
        'fileName': filename,
        'fileSize': format_file_size(file_size),
        'totalRows': len(df),
        'totalColumns': len(df.columns),
        'headers': list(df.columns),
        'isLabeled': is_labeled,
        'labelColumn': label_column if is_labeled else None,
        'sampleData': sample_data
    }

def preprocess_data(df, options):
    """Preprocess data based on options"""
    # Make a copy of the dataframe to avoid modifying the original
    df_processed = df.copy()
    
    # Handle missing values
    if options.get('handleMissingValues', False):
        strategy = options.get('missingValueStrategy', 'mean')
        
        for column in df_processed.columns:
            # Skip label column if we don't want to modify it
            if column == options.get('labelColumn') and not options.get('removeLabels', False):
                continue
                
            if df_processed[column].dtype.kind in 'ifc':  # integer, float, complex
                if strategy == 'mean':
                    df_processed[column].fillna(df_processed[column].mean(), inplace=True)
                elif strategy == 'median':
                    df_processed[column].fillna(df_processed[column].median(), inplace=True)
            else:  # categorical
                if strategy == 'mode':
                    df_processed[column].fillna(df_processed[column].mode()[0] if not df_processed[column].mode().empty else "", inplace=True)
        
        # Drop rows with missing values if strategy is 'drop'
        if strategy == 'drop':
            df_processed.dropna(inplace=True)
    
    # Encode categorical features
    if options.get('encodeCategorial', False):
        strategy = options.get('encodingStrategy', 'onehot')
        
        for column in df_processed.columns:
            # Skip label column if we don't want to modify it
            if column == options.get('labelColumn') and not options.get('removeLabels', False):
                continue
                
            if df_processed[column].dtype == 'object':
                if strategy == 'label':
                    le = LabelEncoder()
                    df_processed[column] = le.fit_transform(df_processed[column].astype(str))
                elif strategy == 'onehot':
                    # Get dummies for categorical column
                    dummies = pd.get_dummies(df_processed[column], prefix=column)
                    # Drop original column and join the dummies
                    df_processed = pd.concat([df_processed.drop(column, axis=1), dummies], axis=1)
    
    # Normalize/scale features
    if options.get('normalizeFeatures', False):
        strategy = options.get('scalingStrategy', 'minmax')
        
        # Identify numerical columns
        num_cols = df_processed.select_dtypes(include=['int64', 'float64']).columns
        
        # Skip label column if it's numerical
        if options.get('labelColumn') in num_cols and not options.get('removeLabels', False):
            num_cols = num_cols.drop(options.get('labelColumn'))
        
        if strategy == 'minmax':
            scaler = MinMaxScaler()
            df_processed[num_cols] = scaler.fit_transform(df_processed[num_cols])
        elif strategy == 'standardize':
            scaler = StandardScaler()
            df_processed[num_cols] = scaler.fit_transform(df_processed[num_cols])
    
    # Remove outliers
    if options.get('removeOutliers', False):
        strategy = options.get('outlierStrategy', 'iqr')
        
        # Identify numerical columns
        num_cols = df_processed.select_dtypes(include=['int64', 'float64']).columns
        
        # Skip label column if it's numerical
        if options.get('labelColumn') in num_cols and not options.get('removeLabels', False):
            num_cols = num_cols.drop(options.get('labelColumn'))
        
        if strategy == 'iqr':
            for column in num_cols:
                Q1 = df_processed[column].quantile(0.25)
                Q3 = df_processed[column].quantile(0.75)
                IQR = Q3 - Q1
                
                # Define bounds
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                
                # Filter out outliers
                df_processed = df_processed[(df_processed[column] >= lower_bound) & (df_processed[column] <= upper_bound)]
        
        elif strategy == 'zscore':
            from scipy import stats
            
            for column in num_cols:
                z_scores = stats.zscore(df_processed[column])
                abs_z_scores = np.abs(z_scores)
                filtered_entries = (abs_z_scores < 3)  # Keep only entries with z-score < 3
                df_processed = df_processed[filtered_entries]
    
    # Feature selection
    if options.get('featureSelection', False):
        strategy = options.get('featureSelectionStrategy', 'correlation')
        
        if strategy == 'correlation':
            # Only apply to numerical columns
            num_cols = df_processed.select_dtypes(include=['int64', 'float64']).columns
            
            # Skip label column if it's numerical
            if options.get('labelColumn') in num_cols and not options.get('removeLabels', False):
                num_cols = num_cols.drop(options.get('labelColumn'))
                
            if len(num_cols) > 1:  # Need at least 2 columns for correlation
                # Compute correlation matrix
                corr_matrix = df_processed[num_cols].corr().abs()
                
                # Select upper triangle of correlation matrix
                upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
                
                # Find columns with correlation greater than 0.95
                to_drop = [column for column in upper.columns if any(upper[column] > 0.95)]
                
                # Drop highly correlated columns
                df_processed.drop(to_drop, axis=1, inplace=True)
        
        elif strategy == 'variance':
            # Identify numerical columns
            num_cols = df_processed.select_dtypes(include=['int64', 'float64']).columns
            
            # Skip label column if it's numerical
            if options.get('labelColumn') in num_cols and not options.get('removeLabels', False):
                num_cols = num_cols.drop(options.get('labelColumn'))
            
            if len(num_cols) > 0:
                # Apply variance threshold
                selector = VarianceThreshold(threshold=0.01)  # Features with low variance will be removed
                selector.fit(df_processed[num_cols])
                
                # Get column indices that will be kept
                support = selector.get_support()
                
                # Get column names that will be kept
                cols_to_keep = [col for i, col in enumerate(num_cols) if support[i]]
                
                # Columns to drop
                cols_to_drop = [col for col in num_cols if col not in cols_to_keep]
                
                # Drop low variance columns
                df_processed.drop(cols_to_drop, axis=1, inplace=True)
    
    # Remove labels if requested
    if options.get('removeLabels', False) and options.get('labelColumn'):
        df_processed.drop(options.get('labelColumn'), axis=1, inplace=True)
    
    return df_processed
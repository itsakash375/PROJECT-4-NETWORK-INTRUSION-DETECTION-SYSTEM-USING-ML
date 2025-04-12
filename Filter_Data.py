import pandas as pd
import os

def filters(input_file):
    """
    Reads the dataset, filters out unnecessary columns, removes columns with all zero values,
    and saves the cleaned data to 'Data/filtered_data.csv'.
    """

    # Check if the input file exists
    if not os.path.exists(input_file):
        print(f"❌ Error: The file '{input_file}' was not found.")
        return None

    # Load the dataset
    try:
        data = pd.read_csv(input_file)
        print("✅ Data loaded successfully.")
    except Exception as e:
        print(f"❌ Error loading file: {e}")
        return None

    # Columns to remove
    columns_to_remove = [
        'is_host_login', 'protocol_type', 'service', 'flag', 'land', 'is_guest_login',
        'su_attempted', 'wrong_fragment', 'urgent', 'hot', 'num_failed_logins',
        'num_compromised', 'root_shell', 'num_root', 'num_file_creations',
        'num_shells', 'num_access_files', 'srv_diff_host_rate'
    ]

    # Drop specified columns (ignore errors if some columns don't exist)
    data = data.drop(columns=columns_to_remove, errors='ignore')

    # Remove columns where all values are 0
    data = data.loc[:, (data != 0).any(axis=0)]

    # Ensure the 'Data' directory exists
    save_dir = os.path.join(os.getcwd(), "Data")
    os.makedirs(save_dir, exist_ok=True)  # Create folder if it doesn't exist

    # Save the filtered data
    save_path = os.path.join(save_dir, "filtered_data.csv")
    try:
        data.to_csv(save_path, index=False)
        print(f"✅ Filtered data saved successfully at: {save_path}")
    except Exception as e:
        print(f"❌ Error saving file: {e}")

    return data

# Run the filtering process (Modify 'your_dataset.csv' with the actual dataset filename)
if __name__ == "__main__":
    dataset_path = "Data\data.csv"  # Change this to the correct dataset file
    filters(dataset_path)

"""
Dataset Downloader for IEEE-CIS Fraud Detection Edition (Hacker House Goa 2026)
Downloads the full dataset files (including the 708MB transactions.csv) directly from the official Google Drive.
"""

import os
import sys

def download():
    dataset_dir = os.path.join(os.path.dirname(__file__), "dataset")
    os.makedirs(dataset_dir, exist_ok=True)
    folder_url = "https://drive.google.com/drive/folders/1YDJUW1fiE7Jx8R9KqknC4IcsED9zll2A"

    print("Fetching dataset files from Google Drive...")
    try:
        import gdown
    except ImportError:
        print("Installing gdown...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "gdown"])
        import gdown

    gdown.download_folder(url=folder_url, output=dataset_dir, quiet=False)
    print("Dataset download complete!")

if __name__ == "__main__":
    download()

# backend/src/azure_config.py
"""
Azure-compatible configuration for file paths and directories
"""
import os
from pathlib import Path

def get_data_directory():
    """Get the appropriate data directory based on environment"""
    if is_azure_environment():
        # Use Azure App Service's temporary directory
        data_dir = "/tmp/data"
    else:
        # Local development
        data_dir = "data"
    
    # Ensure directory exists
    os.makedirs(data_dir, exist_ok=True)
    return data_dir

def get_model_path():
    """Get the ML model file path"""
    if is_azure_environment():
        # Store in writable temp directory
        return "/tmp/fight_predictor.pkl"
    else:
        # Local development - use existing location
        return "src/ml/fight_predictor.pkl"

def get_dataset_path():
    """Get the training dataset path"""
    data_dir = get_data_directory()
    return f"{data_dir}/training_dataset.csv"

def get_database_path():
    """Get the SQLite database path for local development"""
    if is_azure_environment():
        # Azure uses PostgreSQL via DATABASE_URL env var
        return os.getenv("DATABASE_URL")
    else:
        # Local SQLite
        data_dir = get_data_directory()
        return f"sqlite:///./{data_dir}/fighter_stats.db"

def is_azure_environment():
    """Check if running in Azure App Service"""
    return (
        os.getenv("WEBSITE_SITE_NAME") is not None or  # Azure App Service
        os.getenv("AZURE_FUNCTIONS_ENVIRONMENT") is not None or  # Azure Functions
        os.getenv("RUNNING_IN_PRODUCTION") == "true"  # Manual flag
    )

def ensure_directories():
    """Ensure all required directories exist"""
    # Create data directory
    get_data_directory()
    
    # Create model directory for local development
    if not is_azure_environment():
        os.makedirs("src/ml", exist_ok=True)

# Initialize on import
ensure_directories()

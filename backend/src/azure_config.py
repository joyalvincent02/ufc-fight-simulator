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
    # Always prioritize the environment variable (production/Supabase)
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        print(f"Using DATABASE_URL: {db_url[:50]}...")  # Only show first 50 chars for security
        return db_url
    
    # Local development fallback
    if not is_azure_environment():
        data_dir = get_data_directory()
        local_path = f"sqlite:///./{data_dir}/fighter_stats.db"
        print(f"Using local SQLite: {local_path}")
        return local_path
    else:
        print("ERROR: No DATABASE_URL found in Azure environment!")
        raise ValueError("DATABASE_URL environment variable is required in production")

def is_azure_environment():
    """Check if running in Azure App Service"""
    # Check multiple Azure environment indicators
    azure_indicators = [
        os.getenv("WEBSITE_SITE_NAME"),  # Azure App Service
        os.getenv("AZURE_FUNCTIONS_ENVIRONMENT"),  # Azure Functions
        os.getenv("RUNNING_IN_PRODUCTION"),  # Manual flag
        os.getenv("WEBSITE_HOSTNAME"),  # Another Azure indicator
        os.getenv("APPSETTING_WEBSITE_SITE_NAME")  # Alternative Azure setting
    ]
    
    # Also check if we're running in a typical Azure path structure
    azure_paths = [
        "/home/site/wwwroot" in os.getcwd() if hasattr(os, 'getcwd') else False,
        "/opt" in os.getcwd() if hasattr(os, 'getcwd') else False
    ]
    
    is_azure = any(indicator for indicator in azure_indicators if indicator) or any(azure_paths)
    
    # Debug logging
    print(f"Azure detection - WEBSITE_SITE_NAME: {os.getenv('WEBSITE_SITE_NAME')}")
    print(f"Azure detection - Current working dir: {os.getcwd() if hasattr(os, 'getcwd') else 'unknown'}")
    print(f"Azure detection - Is Azure: {is_azure}")
    
    return is_azure

def ensure_directories():
    """Ensure all required directories exist"""
    # Create data directory
    get_data_directory()
    
    # Create model directory for local development
    if not is_azure_environment():
        os.makedirs("src/ml", exist_ok=True)

# Initialize on import
ensure_directories()

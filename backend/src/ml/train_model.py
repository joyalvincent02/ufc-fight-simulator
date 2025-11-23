import pandas as pd
import xgboost as xgb
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import cross_val_score, RandomizedSearchCV
from sklearn.calibration import CalibratedClassifierCV
import joblib
import os
import warnings
from src.azure_config import get_dataset_path, get_model_path
import numpy as np

# Suppress XGBoost deprecation warnings
warnings.filterwarnings('ignore', category=UserWarning, module='xgboost')

def train_model(dataset_path=None, model_path=None, use_hyperparameter_tuning=True, n_iter=30):
    """
    Train the ML model using XGBoost with hyperparameter tuning and probability calibration
    
    Args:
        dataset_path: Path to training dataset
        model_path: Path to save the trained model
        use_hyperparameter_tuning: Whether to perform hyperparameter tuning (default: True)
        n_iter: Number of iterations for RandomizedSearchCV (default: 30)
    """
    # Use Azure-compatible paths
    if dataset_path is None:
        dataset_path = get_dataset_path()
    if model_path is None:
        model_path = get_model_path()
    
    print(f"Loading dataset from: {dataset_path}")
    print(f"Will save model to: {model_path}")
    
    df = pd.read_csv(dataset_path)
    X = df.drop(columns=["label"])
    y = df["label"]

    # Calculate scale_pos_weight for class imbalance (similar to class_weight="balanced")
    # This is the ratio of negative to positive samples
    pos_count = np.sum(y == 1)
    neg_count = np.sum(y == 0)
    scale_pos_weight = neg_count / pos_count if pos_count > 0 else 1.0

    if use_hyperparameter_tuning and len(df) > 100:  # Only tune if we have enough data
        print("Performing hyperparameter tuning...")
        
        # Suppress XGBoost warnings during hyperparameter tuning
        import logging
        import os
        xgb_logger = logging.getLogger('xgboost')
        xgb_logger.setLevel(logging.ERROR)
        # Suppress XGBoost C++ warnings
        os.environ['PYTHONWARNINGS'] = 'ignore'
        
        # Define parameter grid for RandomizedSearchCV
        param_distributions = {
            'n_estimators': [100, 200, 300],
            'max_depth': [6, 8, 10, 12],
            'learning_rate': [0.05, 0.1, 0.15],
            'subsample': [0.7, 0.8, 0.9],
            'colsample_bytree': [0.7, 0.8, 0.9],
            'min_child_weight': [1, 3, 5],
            'gamma': [0, 0.1, 0.2]
        }
        
        # Base model with fixed parameters
        base_model = xgb.XGBClassifier(
            scale_pos_weight=scale_pos_weight,
            random_state=42,
            eval_metric='logloss'
        )
        
        # Randomized search with 5-fold CV
        random_search = RandomizedSearchCV(
            base_model,
            param_distributions,
            n_iter=n_iter,
            cv=5,
            scoring='accuracy',
            n_jobs=-1,
            random_state=42,
            verbose=0  # Set to 0 to reduce output
        )
        
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            random_search.fit(X, y)
        
        # Restore logging level
        xgb_logger.setLevel(logging.WARNING)
        best_model = random_search.best_estimator_
        
        print(f"Best parameters: {random_search.best_params_}")
        print(f"Best CV score: {random_search.best_score_:.4f}")
        
    else:
        print("Using default hyperparameters...")
        best_model = xgb.XGBClassifier(
            n_estimators=200,
            max_depth=10,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            min_child_weight=3,
            scale_pos_weight=scale_pos_weight,
            random_state=42,
            eval_metric='logloss'
        )
        best_model.fit(X, y)

    # Apply probability calibration
    print("Calibrating probabilities...")
    calibrated_model = CalibratedClassifierCV(
        best_model,
        method='isotonic',
        cv=5
    )
    calibrated_model.fit(X, y)

    # Calculate metrics
    train_accuracy = accuracy_score(y, calibrated_model.predict(X))
    cv_scores = cross_val_score(calibrated_model, X, y, cv=5)
    cv_accuracy = cv_scores.mean()
    
    # Save calibrated model
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(calibrated_model, model_path)
    
    metrics = {
        "training_samples": len(df),
        "features": len(X.columns),
        "train_accuracy": round(train_accuracy, 4),
        "cv_accuracy": round(cv_accuracy, 4),
        "cv_std": round(cv_scores.std(), 4),
        "model_path": model_path,
        "dataset_path": dataset_path,
        "hyperparameter_tuning": use_hyperparameter_tuning and len(df) > 100,
        "calibrated": True
    }
    
    print(f"Model saved to {model_path}")
    print(f"Metrics: {metrics}")
    
    return metrics

def retrain_model():
    """Retrain the model and return metrics - used by scheduler"""
    return train_model()

if __name__ == "__main__":
    train_model()

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import cross_val_score
import joblib
import os

def train_model(dataset_path="data/training_dataset.csv", model_path="src/ml/fight_predictor.pkl"):
    """Train the ML model and return metrics"""
    df = pd.read_csv(dataset_path)
    X = df.drop(columns=["label"])
    y = df["label"]

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        class_weight="balanced",
        random_state=42
    )
    model.fit(X, y)

    # Calculate metrics
    train_accuracy = accuracy_score(y, model.predict(X))
    cv_scores = cross_val_score(model, X, y, cv=5)
    cv_accuracy = cv_scores.mean()
    
    # Save model
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(model, model_path)
    
    metrics = {
        "training_samples": len(df),
        "features": len(X.columns),
        "train_accuracy": round(train_accuracy, 4),
        "cv_accuracy": round(cv_accuracy, 4),
        "cv_std": round(cv_scores.std(), 4)
    }
    
    print(f"Model saved to {model_path}")
    print(f"Metrics: {metrics}")
    
    return metrics

def retrain_model():
    """Retrain the model and return metrics - used by scheduler"""
    return train_model()

if __name__ == "__main__":
    train_model()

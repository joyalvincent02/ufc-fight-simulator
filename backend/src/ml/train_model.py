import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

# Load training data
df = pd.read_csv("data/training_dataset.csv")
X = df.drop(columns=["label"])
y = df["label"]

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

# Save model
os.makedirs("src/ml", exist_ok=True)
joblib.dump(model, "src/ml/fight_predictor.pkl")
print("✅ Model saved to backend/src/ml/fight_predictor.pkl")

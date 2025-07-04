import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

df = pd.read_csv("data/training_dataset.csv")
X = df.drop(columns=["label"])
y = df["label"]

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    class_weight="balanced",
    random_state=42
)
model.fit(X, y)

os.makedirs("src/ml", exist_ok=True)
joblib.dump(model, "src/ml/fight_predictor.pkl")
print("✅ Model saved to src/ml/fight_predictor.pkl")

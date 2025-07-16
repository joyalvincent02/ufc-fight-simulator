import pandas as pd
from sqlalchemy import create_engine
import os
from datetime import datetime, date
import re
from src.azure_config import get_dataset_path

# Use the same database connection as the main app
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL is None:
    # Local development fallback
    from src.azure_config import get_database_path
    DATABASE_URL = get_database_path()

print(f"ML Dataset - Using database: {DATABASE_URL[:50] if DATABASE_URL else 'None'}...")
engine = create_engine(DATABASE_URL)

def parse_height(s):
    match = re.match(r"(\d+)' (\d+)", s)
    return int(match.group(1)) * 12 + int(match.group(2)) if match else None

def parse_weight(s):
    return int(s.replace("lbs.", "").strip()) if s else None

def parse_reach(s):
    try:
        return int(s.replace('"', "").strip()) if s and s != "--" else None
    except ValueError:
        return None

def compute_age(dob):
    if pd.isna(dob):
        return None
    if isinstance(dob, str):
        try:
            dob = datetime.strptime(dob.strip(), "%Y-%m-%d").date()
        except ValueError:
            return None
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

def build_dataset():
    with engine.connect() as conn:
        df = pd.read_sql("""
            SELECT
                f1.name AS fighter_name,
                f2.name AS opponent_name,
                fr.result,

                f1.slpm AS f1_slpm,
                f1.str_acc AS f1_str_acc,
                f1.str_def AS f1_str_def,
                f1.td_avg AS f1_td_avg,
                f1.td_acc AS f1_td_acc,
                f1.td_def AS f1_td_def,
                f1.sub_avg AS f1_sub_avg,
                f1.height AS f1_height,
                f1.weight AS f1_weight,
                f1.reach AS f1_reach,
                f1.stance AS f1_stance,
                f1.dob AS f1_dob,

                f2.slpm AS f2_slpm,
                f2.str_acc AS f2_str_acc,
                f2.str_def AS f2_str_def,
                f2.td_avg AS f2_td_avg,
                f2.td_acc AS f2_td_acc,
                f2.td_def AS f2_td_def,
                f2.sub_avg AS f2_sub_avg,
                f2.height AS f2_height,
                f2.weight AS f2_weight,
                f2.reach AS f2_reach,
                f2.stance AS f2_stance,
                f2.dob AS f2_dob

            FROM fight_results fr
            JOIN fighters f1 ON fr.fighter_name = f1.name
            JOIN fighters f2 ON fr.opponent_name = f2.name
            WHERE fr.result IN ('win', 'loss')
        """, conn)

    # Parse physical attributes
    for side in ["f1", "f2"]:
        df[f"{side}_height"] = df[f"{side}_height"].apply(parse_height)
        df[f"{side}_weight"] = df[f"{side}_weight"].apply(parse_weight)
        df[f"{side}_reach"] = df[f"{side}_reach"].apply(parse_reach)
        df[f"{side}_age"] = df[f"{side}_dob"].apply(compute_age)

    # Compute difference features
    df["reach_diff"] = df["f1_reach"] - df["f2_reach"]
    df["height_diff"] = df["f1_height"] - df["f2_height"]
    df["weight_diff"] = df["f1_weight"] - df["f2_weight"]
    df["age_diff"] = df["f1_age"] - df["f2_age"]
    
    # Add enhanced ratio features
    def safe_divide(a, b):
        return a / b.where(b > 0.1, 0.1)
    
    df["slpm_ratio"] = safe_divide(df["f1_slpm"], df["f2_slpm"])
    df["str_acc_ratio"] = safe_divide(df["f1_str_acc"], df["f2_str_acc"])
    df["str_def_ratio"] = safe_divide(df["f1_str_def"], df["f2_str_def"])
    df["td_avg_ratio"] = safe_divide(df["f1_td_avg"], df["f2_td_avg"])
    df["td_acc_ratio"] = safe_divide(df["f1_td_acc"], df["f2_td_acc"])
    df["td_def_ratio"] = safe_divide(df["f1_td_def"], df["f2_td_def"])
    df["sub_avg_ratio"] = safe_divide(df["f1_sub_avg"], df["f2_sub_avg"])
    
    # Physical advantage features
    df["reach_advantage"] = (df["reach_diff"] > 2).astype(int)
    df["height_advantage"] = (df["height_diff"] > 2).astype(int)
    df["weight_advantage"] = (df["weight_diff"] > 5).astype(int)
    df["age_advantage"] = (df["age_diff"] < -2).astype(int)  # Younger is better
    
    # Combined effectiveness scores
    df["f1_striking_score"] = df["f1_slpm"] * df["f1_str_acc"] * df["f1_str_def"]
    df["f2_striking_score"] = df["f2_slpm"] * df["f2_str_acc"] * df["f2_str_def"]
    df["f1_grappling_score"] = df["f1_td_avg"] * df["f1_td_acc"] * df["f1_td_def"]
    df["f2_grappling_score"] = df["f2_td_avg"] * df["f2_td_acc"] * df["f2_td_def"]

    # One-hot encode stance combinations
    df = pd.get_dummies(df, columns=["f1_stance", "f2_stance"], dummy_na=True)

    # Convert result to label
    df["label"] = df["result"].apply(lambda r: 1 if r == "win" else 0)

    # Drop raw attributes and unused columns
    df.drop(columns=[
        "result", "fighter_name", "opponent_name",
        "f1_height", "f2_height", "f1_weight", "f2_weight",
        "f1_reach", "f2_reach", "f1_dob", "f2_dob",
        "f1_age", "f2_age"
    ], inplace=True)

    df.dropna(inplace=True)
    
    # Use Azure-compatible path
    dataset_path = get_dataset_path()
    df.to_csv(dataset_path, index=False)
    print(f"Dataset written to {dataset_path}")
    print(f"Dataset shape: {df.shape}")
    return dataset_path

if __name__ == "__main__":
    build_dataset()

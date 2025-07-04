import pandas as pd
from sqlalchemy import create_engine
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/fighter_stats.db")
engine = create_engine(DATABASE_URL)

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
                f2.slpm AS f2_slpm,
                f2.str_acc AS f2_str_acc,
                f2.str_def AS f2_str_def,
                f2.td_avg AS f2_td_avg,
                f2.td_acc AS f2_td_acc,
                f2.td_def AS f2_td_def,
                f2.sub_avg AS f2_sub_avg
            FROM fight_results fr
            JOIN fighters f1 ON fr.fighter_name = f1.name
            JOIN fighters f2 ON fr.opponent_name = f2.name
            WHERE fr.result IN ('win', 'loss')
        """, conn)

    df["label"] = df["result"].apply(lambda r: 1 if r == "win" else 0)
    df.drop(columns=["result", "fighter_name", "opponent_name"], inplace=True)
    df.dropna(inplace=True)
    df.to_csv("data/training_dataset.csv", index=False)
    print("✅ Dataset written to backend/data/training_dataset.csv")

if __name__ == "__main__":
    build_dataset()

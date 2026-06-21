"""
train.py
--------
Run this ONCE (locally or in Colab) whenever you want to (re)train the model.
It reads results.csv, rebuilds Elo ratings + rolling form features, trains the
XGBoost classifier, and saves everything the FastAPI backend needs into
./artifacts/  so the API never has to retrain on startup.

Usage:
    python train.py
"""

import json
import pickle
from collections import defaultdict

import numpy as np
import pandas as pd
from xgboost import XGBClassifier

ARTIFACTS_DIR = "artifacts"

# -----------------------------------------------------------------------------
# 1. Load + clean data
# -----------------------------------------------------------------------------
results = pd.read_csv("results.csv")
results["date"] = pd.to_datetime(results["date"])
results = results[results["date"] >= "1990-1-1"]
results = results.sort_values("date")

df = results.dropna(subset=["home_score", "away_score"]).copy()
df = df.drop_duplicates()


def get_result(row):
    if row["home_score"] > row["away_score"]:
        return 0  # home win
    elif row["home_score"] < row["away_score"]:
        return 2  # away win
    return 1  # draw


df["result"] = df.apply(get_result, axis=1)

# -----------------------------------------------------------------------------
# 2. Elo ratings
# -----------------------------------------------------------------------------
def determine_k_factor(tournament):
    t = tournament.lower()
    if "friendly" in t:
        return 20
    elif "world cup" in t and "qualif" not in t:
        return 60
    elif any(c in t for c in ["euro", "copa am", "african cup of nations", "asian cup",
                               "gold cup", "nations cup", "nations league"]):
        return 30 if "qualif" in t else 50
    elif "qualif" in t or "preliminary" in t:
        return 40
    return 30


def calculate_elo_ratings(df):
    team_ratings = {}
    default_rating = 1500.0
    home_field_advantage = 100.0

    elo_home_list, elo_away_list, elo_diff_list = [], [], []

    for _, row in df.iterrows():
        home, away = row["home_team"], row["away_team"]
        neutral, tournament = row["neutral"], row["tournament"]

        r_home = team_ratings.get(home, default_rating)
        r_away = team_ratings.get(away, default_rating)

        elo_home_list.append(r_home)
        elo_away_list.append(r_away)

        h_adj = 0.0 if neutral else home_field_advantage
        elo_diff = (r_home + h_adj) - r_away
        elo_diff_list.append(elo_diff)

        e_home = 1.0 / (1.0 + 10.0 ** (-elo_diff / 400.0))
        e_away = 1.0 - e_home

        if row["home_score"] > row["away_score"]:
            s_home, s_away = 1.0, 0.0
        elif row["away_score"] > row["home_score"]:
            s_home, s_away = 0.0, 1.0
        else:
            s_home, s_away = 0.5, 0.5

        k = determine_k_factor(tournament)
        team_ratings[home] = r_home + k * (s_home - e_home)
        team_ratings[away] = r_away + k * (s_away - e_away)

    df["elo_home"] = elo_home_list
    df["elo_away"] = elo_away_list
    df["elo_diff"] = elo_diff_list
    return df, team_ratings


df, final_ratings = calculate_elo_ratings(df)

# -----------------------------------------------------------------------------
# 3. Rolling form features (last 5 matches)
# -----------------------------------------------------------------------------
def get_form_features(history):
    last5 = history[-5:]
    if not last5:
        return 0, 0, 0, 0, 0, 0

    wins = sum(x["result"] == "W" for x in last5)
    draws = sum(x["result"] == "D" for x in last5)
    losses = sum(x["result"] == "L" for x in last5)
    goals_scored = sum(x["goals_for"] for x in last5) / len(last5)
    goals_conceded = sum(x["goals_against"] for x in last5) / len(last5)
    goal_diff = sum(x["goals_for"] - x["goals_against"] for x in last5) / len(last5)
    return wins, draws, losses, goals_scored, goals_conceded, goal_diff


team_history = defaultdict(list)
feat_cols = {
    "home_wins_last5": [], "away_wins_last5": [],
    "home_goals_scored_avg5": [], "away_goals_scored_avg5": [],
    "home_goals_conceded_avg5": [], "away_goals_conceded_avg5": [],
    "home_goal_diff_avg5": [], "away_goal_diff_avg5": [],
}

for _, row in df.iterrows():
    home, away = row["home_team"], row["away_team"]
    hf = get_form_features(team_history[home])
    af = get_form_features(team_history[away])

    feat_cols["home_wins_last5"].append(hf[0])
    feat_cols["home_goals_scored_avg5"].append(hf[3])
    feat_cols["home_goals_conceded_avg5"].append(hf[4])
    feat_cols["home_goal_diff_avg5"].append(hf[5])

    feat_cols["away_wins_last5"].append(af[0])
    feat_cols["away_goals_scored_avg5"].append(af[3])
    feat_cols["away_goals_conceded_avg5"].append(af[4])
    feat_cols["away_goal_diff_avg5"].append(af[5])

    home_result = "W" if row["home_score"] > row["away_score"] else (
        "L" if row["home_score"] < row["away_score"] else "D")
    away_result = "L" if home_result == "W" else ("W" if home_result == "L" else "D")

    team_history[home].append({"result": home_result, "goals_for": row["home_score"],
                                "goals_against": row["away_score"]})
    team_history[away].append({"result": away_result, "goals_for": row["away_score"],
                                "goals_against": row["home_score"]})

for col, vals in feat_cols.items():
    df[col] = vals

df["form_diff"] = df["home_wins_last5"] - df["away_wins_last5"]
df["goal_diff_diff"] = df["home_goal_diff_avg5"] - df["away_goal_diff_avg5"]


def tournament_importance(tournament):
    t = tournament.lower()
    if "friendly" in t:
        return 1
    elif "qualif" in t:
        return 2
    elif any(x in t for x in ["euro", "copa", "african", "asian", "gold cup"]):
        return 3
    elif "world cup" in t:
        return 4
    return 2


df["tournament_importance"] = df["tournament"].apply(tournament_importance)

# -----------------------------------------------------------------------------
# 4. Train / test split + model
# -----------------------------------------------------------------------------
FEATURES = [
    "elo_home", "elo_away", "elo_diff",
    "home_wins_last5", "away_wins_last5",
    "home_goals_scored_avg5", "away_goals_scored_avg5",
    "home_goals_conceded_avg5", "away_goals_conceded_avg5",
    "home_goal_diff_avg5", "away_goal_diff_avg5",
    "form_diff", "goal_diff_diff",
    "neutral", "tournament_importance",
]

#split_ind = int(len(df) * 0.8)

train_df = df
#test_df = df.iloc[split_ind:]

xgb = XGBClassifier(
    objective="multi:softmax",
    num_class=3,
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    random_state=42,
)
xgb.fit(train_df[FEATURES], train_df["result"])

#from sklearn.metrics import accuracy_score, classification_report
#pred = xgb.predict(test_df[FEATURES])
#print("Test accuracy:", accuracy_score(test_df["result"], pred))
#print(classification_report(test_df["result"], pred))

# -----------------------------------------------------------------------------
# 5. Build latest team_state snapshot (what the API will simulate from)
# -----------------------------------------------------------------------------
def build_team_state(df):
    state = {}
    df = df.sort_values("date")
    for _, row in df.iterrows():
        state[row["home_team"]] = {
            "elo": row["elo_home"],
            "wins_last5": row["home_wins_last5"],
            "goals_scored_avg5": row["home_goals_scored_avg5"],
            "goals_conceded_avg5": row["home_goals_conceded_avg5"],
            "goal_diff_avg5": row["home_goal_diff_avg5"],
        }
        state[row["away_team"]] = {
            "elo": row["elo_away"],
            "wins_last5": row["away_wins_last5"],
            "goals_scored_avg5": row["away_goals_scored_avg5"],
            "goals_conceded_avg5": row["away_goals_conceded_avg5"],
            "goal_diff_avg5": row["away_goal_diff_avg5"],
        }
    return state


team_state = build_team_state(df)

# -----------------------------------------------------------------------------
# 6. World Cup groups (edit this for the tournament you're modelling)
# -----------------------------------------------------------------------------
groups = {
    "A": ["Mexico", "South Africa", "South Korea", "Czech Republic"],
    "B": ["Canada", "Bosnia and Herzegovina", "Qatar", "Switzerland"],
    "C": ["Brazil", "Morocco", "Haiti", "Scotland"],
    "D": ["United States", "Paraguay", "Australia", "Turkey"],
    "E": ["Germany", "Curaçao", "Ivory Coast", "Ecuador"],
    "F": ["Netherlands", "Japan", "Sweden", "Tunisia"],
    "G": ["Belgium", "Egypt", "Iran", "New Zealand"],
    "H": ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"],
    "I": ["France", "Senegal", "Iraq", "Norway"],
    "J": ["Argentina", "Algeria", "Austria", "Jordan"],
    "K": ["Portugal", "DR Congo", "Uzbekistan", "Colombia"],
    "L": ["England", "Croatia", "Ghana", "Panama"],
}

# Any team in `groups` that never appeared in history gets a default state
for group_teams in groups.values():
    for t in group_teams:
        if t not in team_state:
            team_state[t] = {
                "elo": 1500.0,
                "wins_last5": 0,
                "goals_scored_avg5": 0.0,
                "goals_conceded_avg5": 0.0,
                "goal_diff_avg5": 0.0,
            }

# -----------------------------------------------------------------------------
# 7. Save artifacts
# -----------------------------------------------------------------------------
import os
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

with open(f"{ARTIFACTS_DIR}/model.pkl", "wb") as f:
    pickle.dump(xgb, f)

with open(f"{ARTIFACTS_DIR}/team_state.pkl", "wb") as f:
    pickle.dump(team_state, f)

with open(f"{ARTIFACTS_DIR}/groups.json", "w") as f:
    json.dump(groups, f, indent=2)

with open(f"{ARTIFACTS_DIR}/features.json", "w") as f:
    json.dump(FEATURES, f, indent=2)

print(f"\nSaved model + team_state for {len(team_state)} teams to ./{ARTIFACTS_DIR}/")

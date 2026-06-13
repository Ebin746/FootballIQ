# features.py

import pandas as pd
from collections import defaultdict
from config import ELO_DEFAULT_RATING, ELO_HOME_FIELD_ADVANTAGE

def get_result(row):
    """
    Categorizes the match result.
    0: Home win
    1: Draw
    2: Away win
    """
    if row['home_score'] > row['away_score']:
        return 0
    elif row['home_score'] < row['away_score']:
        return 2
    else:
        return 1

def determine_k_factor(tournament):
    """
    Determines the ELO update K-factor based on tournament importance.
    """
    tourn_lower = tournament.lower()
    if "friendly" in tourn_lower:
        return 20
    elif "world cup" in tourn_lower and "qualif" not in tourn_lower:
        return 60
    elif any(comp in tourn_lower for comp in ["euro", "copa am", "african cup of nations", "asian cup", "gold cup", "nations cup", "nations league"]):
        if "qualif" in tourn_lower:
            return 30
        return 50
    elif "qualif" in tourn_lower or "preliminary" in tourn_lower:
        return 40
    else:
        return 30

def calculate_elo_ratings(df):
    """
    Sequentially simulates team ELO ratings match by match.
    """
    print("Calculating historical Elo ratings...")
    team_ratings = {}
    
    elo_home_list = []
    elo_away_list = []
    elo_diff_list = []
    elo_prob_home_list = []
    elo_prob_away_list = []

    for idx, row in df.iterrows():
        home = row["home_team"]
        away = row["away_team"]
        neutral = row["neutral"]
        tournament = row["tournament"]

        r_home = team_ratings.get(home, ELO_DEFAULT_RATING)
        r_away = team_ratings.get(away, ELO_DEFAULT_RATING)

        elo_home_list.append(r_home)
        elo_away_list.append(r_away)

        h_adj = 0.0 if neutral else ELO_HOME_FIELD_ADVANTAGE
        elo_diff = (r_home + h_adj) - r_away
        elo_diff_list.append(elo_diff)

        # Expected scores
        e_home = 1.0 / (1.0 + 10.0 ** (-elo_diff / 400.0))
        e_away = 1.0 - e_home

        elo_prob_home_list.append(e_home)
        elo_prob_away_list.append(e_away)

        # Actual scores
        if row["home_score"] > row["away_score"]:
            s_home, s_away = 1.0, 0.0
        elif row["away_score"] > row["home_score"]:
            s_home, s_away = 0.0, 1.0
        else:
            s_home, s_away = 0.5, 0.5

        k = determine_k_factor(tournament)

        r_home_new = r_home + k * (s_home - e_home)
        r_away_new = r_away + k * (s_away - e_away)

        team_ratings[home] = r_home_new
        team_ratings[away] = r_away_new

    df["elo_home"] = elo_home_list
    df["elo_away"] = elo_away_list
    df["elo_diff"] = elo_diff_list
    df["elo_prob_home"] = elo_prob_home_list
    df["elo_prob_away"] = elo_prob_away_list

    print(f"Elo calculations complete. Total unique teams tracked: {len(team_ratings)}")
    return df, team_ratings

def get_form_features(history):
    """
    Computes summary features from the last 5 matches in a team's history.
    """
    last5 = history[-5:]

    if len(last5) == 0:
        return (
            0, 0, 0,      # wins, draws, losses
            0, 0, 0       # goals scored avg, goals conceded avg, goal diff avg
        )

    wins = sum(x["result"] == "W" for x in last5)
    draws = sum(x["result"] == "D" for x in last5)
    losses = sum(x["result"] == "L" for x in last5)

    goals_scored = sum(x["goals_for"] for x in last5) / len(last5)
    goals_conceded = sum(x["goals_against"] for x in last5) / len(last5)

    goal_diff = sum(
        x["goals_for"] - x["goals_against"]
        for x in last5
    ) / len(last5)

    return (
        wins,
        draws,
        losses,
        goals_scored,
        goals_conceded,
        goal_diff
    )

def compute_form_features(df):
    """
    Generates historical rolling form features for both home and away teams.
    """
    print("Calculating team form features...")
    team_history = defaultdict(list)

    home_wins_last5 = []
    away_wins_last5 = []
    home_draws_last5 = []
    away_draws_last5 = []
    home_losses_last5 = []
    away_losses_last5 = []
    home_goals_scored_avg5 = []
    away_goals_scored_avg5 = []
    home_goals_conceded_avg5 = []
    away_goals_conceded_avg5 = []
    home_goal_diff_avg5 = []
    away_goal_diff_avg5 = []

    for _, row in df.iterrows():
        home = row["home_team"]
        away = row["away_team"]

        home_features = get_form_features(team_history[home])
        away_features = get_form_features(team_history[away])

        home_wins_last5.append(home_features[0])
        home_draws_last5.append(home_features[1])
        home_losses_last5.append(home_features[2])
        home_goals_scored_avg5.append(home_features[3])
        home_goals_conceded_avg5.append(home_features[4])
        home_goal_diff_avg5.append(home_features[5])

        away_wins_last5.append(away_features[0])
        away_draws_last5.append(away_features[1])
        away_losses_last5.append(away_features[2])
        away_goals_scored_avg5.append(away_features[3])
        away_goals_conceded_avg5.append(away_features[4])
        away_goal_diff_avg5.append(away_features[5])

        if row["home_score"] > row["away_score"]:
            home_result = "W"
            away_result = "L"
        elif row["home_score"] < row["away_score"]:
            home_result = "L"
            away_result = "W"
        else:
            home_result = "D"
            away_result = "D"

        team_history[home].append({
            "result": home_result,
            "goals_for": row["home_score"],
            "goals_against": row["away_score"]
        })

        team_history[away].append({
            "result": away_result,
            "goals_for": row["away_score"],
            "goals_against": row["home_score"]
        })

    df["home_wins_last5"] = home_wins_last5
    df["away_wins_last5"] = away_wins_last5
    df["home_draws_last5"] = home_draws_last5
    df["away_draws_last5"] = away_draws_last5
    df["home_losses_last5"] = home_losses_last5
    df["away_losses_last5"] = away_losses_last5
    df["home_goals_scored_avg5"] = home_goals_scored_avg5
    df["away_goals_scored_avg5"] = away_goals_scored_avg5
    df["home_goals_conceded_avg5"] = home_goals_conceded_avg5
    df["away_goals_conceded_avg5"] = away_goals_conceded_avg5
    df["home_goal_diff_avg5"] = home_goal_diff_avg5
    df["away_goal_diff_avg5"] = away_goal_diff_avg5

    df["form_diff"] = df["home_wins_last5"] - df["away_wins_last5"]
    df["goal_diff_diff"] = df["home_goal_diff_avg5"] - df["away_goal_diff_avg5"]

    print("Form features generated successfully!")
    return df

def tournament_importance(tournament):
    """
    Returns tournament weight importance category.
    """
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

def prepare_data(csv_path, start_date="1990-01-01"):
    """
    Loads, cleans, calculates Elo ratings, and generates form features.
    """
    print(f"Loading data from {csv_path}...")
    results = pd.read_csv(csv_path)
    results['date'] = pd.to_datetime(results['date'])
    results = results[results['date'] >= start_date]
    results = results.sort_values('date')
    
    df = results.dropna(subset=["home_score", "away_score"]).copy()
    df["result"] = df.apply(get_result, axis=1)
    df = df.drop_duplicates()

    df, final_ratings = calculate_elo_ratings(df)
    df = compute_form_features(df)
    df["tournament_importance"] = df["tournament"].apply(tournament_importance)

    return df, final_ratings

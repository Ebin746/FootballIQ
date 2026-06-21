"""
Loads the artifacts produced by train.py exactly ONCE at process startup
(module import time), then exposes simulation functions that the FastAPI
routes call. Nothing here retrains anything.
"""

import copy
import json
import pickle
from pathlib import Path

import numpy as np
import pandas as pd

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "artifacts"

# -----------------------------------------------------------------------------
# Load once at import time
# -----------------------------------------------------------------------------
with open(ARTIFACTS_DIR / "model.pkl", "rb") as f:
    MODEL = pickle.load(f)

with open(ARTIFACTS_DIR / "team_state.pkl", "rb") as f:
    BASE_TEAM_STATE = pickle.load(f)

with open(ARTIFACTS_DIR / "groups.json", "r") as f:
    GROUPS = json.load(f)

with open(ARTIFACTS_DIR / "features.json", "r") as f:
    FEATURES = json.load(f)

ALL_TEAMS = sorted(BASE_TEAM_STATE.keys())


# -----------------------------------------------------------------------------
# Feature building + single match prediction
# -----------------------------------------------------------------------------
def create_match_features_from_state(home_team, away_team, team_state,
                                      neutral=True, tournament_importance=4):
    home = team_state[home_team]
    away = team_state[away_team]

    h_adj = 0.0 if neutral else 100.0

    row = {
        "elo_home": home["elo"],
        "elo_away": away["elo"],
        "elo_diff": (home["elo"] + h_adj) - away["elo"],
        "home_wins_last5": home["wins_last5"],
        "away_wins_last5": away["wins_last5"],
        "home_goals_scored_avg5": home["goals_scored_avg5"],
        "away_goals_scored_avg5": away["goals_scored_avg5"],
        "home_goals_conceded_avg5": home["goals_conceded_avg5"],
        "away_goals_conceded_avg5": away["goals_conceded_avg5"],
        "home_goal_diff_avg5": home["goal_diff_avg5"],
        "away_goal_diff_avg5": away["goal_diff_avg5"],
        "form_diff": home["wins_last5"] - away["wins_last5"],
        "goal_diff_diff": home["goal_diff_avg5"] - away["goal_diff_avg5"],
        "neutral": int(neutral),
        "tournament_importance": tournament_importance,
    }
    return pd.DataFrame([row])[FEATURES]


def predict_match_probs(home_team, away_team, neutral=True, tournament_importance=4,
                         team_state=None):
    """Deterministic probabilities for the /predict-match endpoint."""
    state = team_state or BASE_TEAM_STATE
    X = create_match_features_from_state(home_team, away_team, state,
                                          neutral, tournament_importance)
    probs = MODEL.predict_proba(X)[0]
    return probs  # [home_win, draw, away_win]


def simulate_match(home_team, away_team, team_state, neutral=True,
                    tournament_importance=4):
    """Stochastic outcome (sampled from predicted probabilities) used in sims."""
    probs = predict_match_probs(home_team, away_team, neutral,
                                 tournament_importance, team_state)
    result = np.random.choice([0, 1, 2], p=probs)
    return result, probs


# -----------------------------------------------------------------------------
# Elo-only state update between simulated matches (keeps form roughly live)
# -----------------------------------------------------------------------------
def update_team_state(home_team, away_team, result, team_state):
    home = team_state[home_team]
    away = team_state[away_team]
    K = 20

    elo_diff = home["elo"] - away["elo"]
    expected_home = 1 / (1 + 10 ** (-elo_diff / 400))
    expected_away = 1 - expected_home

    if result == 0:
        actual_home, actual_away = 1, 0
        home["wins_last5"] = min(home["wins_last5"] + 1, 5)
    elif result == 2:
        actual_home, actual_away = 0, 1
        away["wins_last5"] = min(away["wins_last5"] + 1, 5)
    else:
        actual_home, actual_away = 0.5, 0.5

    home["elo"] += K * (actual_home - expected_home)
    away["elo"] += K * (actual_away - expected_away)


# -----------------------------------------------------------------------------
# Group stage
# -----------------------------------------------------------------------------
def create_standings(groups):
    standings = {}
    for group, teams in groups.items():
        standings[group] = {
            team: {"points": 0, "played": 0, "wins": 0, "draws": 0, "losses": 0}
            for team in teams
        }
    return standings


def find_group(team, groups):
    for group, teams in groups.items():
        if team in teams:
            return group
    return None


def update_standings(standings, home_team, away_team, result, groups):
    group = find_group(home_team, groups)
    if group is None:
        return
    home = standings[group][home_team]
    away = standings[group][away_team]

    home["played"] += 1
    away["played"] += 1

    if result == 0:
        home["points"] += 3
        home["wins"] += 1
        away["losses"] += 1
    elif result == 2:
        away["points"] += 3
        away["wins"] += 1
        home["losses"] += 1
    else:
        home["points"] += 1
        away["points"] += 1
        home["draws"] += 1
        away["draws"] += 1


def round_robin_group_matches(groups):
    """Build every fixture for every group (round-robin, single leg)."""
    matches = []
    for teams in groups.values():
        for i in range(len(teams)):
            for j in range(i + 1, len(teams)):
                matches.append((teams[i], teams[j]))
    return matches


def simulate_group_stage(standings, team_state, groups):
    for home, away in round_robin_group_matches(groups):
        result, _ = simulate_match(home, away, team_state)
        update_team_state(home, away, result, team_state)
        update_standings(standings, home, away, result, groups)


def get_group_qualifiers(standings, groups):
    qualifiers = []
    for group in standings:
        table = pd.DataFrame(standings[group]).T
        table = table.sort_values(["points", "wins"], ascending=False)
        qualifiers.extend(table.index[:2].tolist())
    return qualifiers


def get_group_results(standings):
    group_tables = {}
    for group in standings:
        table = pd.DataFrame(standings[group]).T
        table = table.sort_values(["points", "wins"], ascending=False)
        group_tables[group] = table
    return group_tables


# -----------------------------------------------------------------------------
# Knockout stage
# -----------------------------------------------------------------------------
def knockout_match(team1, team2, team_state):
    result, _ = simulate_match(team1, team2, team_state)
    if result == 0:
        return team1
    elif result == 2:
        return team2
    return np.random.choice([team1, team2])  # penalty shootout coin-flip


def simulate_round(teams, team_state):
    winners = []
    for i in range(0, len(teams), 2):
        if i + 1 < len(teams):
            winners.append(knockout_match(teams[i], teams[i + 1], team_state))
        else:
            winners.append(teams[i])
    return winners


def simulate_knockout_tournament(qualified, team_state):
    teams = qualified.copy()
    while len(teams) > 1:
        teams = simulate_round(teams, team_state)
    return teams[0]


# -----------------------------------------------------------------------------
# Full tournament (one run)
# -----------------------------------------------------------------------------
def simulate_world_cup_once():
    team_state = copy.deepcopy(BASE_TEAM_STATE)
    standings = create_standings(GROUPS)

    simulate_group_stage(standings, team_state, GROUPS)
    qualified = get_group_qualifiers(standings, GROUPS)
    champion = simulate_knockout_tournament(qualified, team_state)

    return champion, standings


def simulate_world_cup_many(n_simulations):
    from collections import Counter
    winner_count = Counter()
    sample_standings = None

    for i in range(n_simulations):
        champion, standings = simulate_world_cup_once()
        winner_count[champion] += 1
        if i == 0:
            sample_standings = standings  # keep one example group stage to show

    results = [
        {"team": team, "win_pct": round(wins / n_simulations * 100, 2)}
        for team, wins in winner_count.items()
    ]
    results.sort(key=lambda x: x["win_pct"], reverse=True)
    return results, sample_standings

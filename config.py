# config.py

CSV_PATH = "results.csv"
START_DATE = "1990-01-01"
TEST_SPLIT_RATIO = 0.8
RANDOM_STATE = 42

ELO_DEFAULT_RATING = 1500.0
ELO_HOME_FIELD_ADVANTAGE = 100.0

FEATURES = [
    "elo_home",
    "elo_away",
    "elo_diff",
    "home_wins_last5",
    "away_wins_last5",
    "home_goals_scored_avg5",
    "away_goals_scored_avg5",
    "home_goals_conceded_avg5",
    "away_goals_conceded_avg5",
    "home_goal_diff_avg5",
    "away_goal_diff_avg5",
    "form_diff",
    "goal_diff_diff",
    "neutral",
    "tournament_importance"
]

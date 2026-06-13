# FootballIQ

FootballIQ is a machine learning pipeline designed to predict football match outcomes (Home Win, Draw, Away Win) by leverage historical ELO ratings, recent rolling team form, and tournament significance weighting.

## Repository Structure

```
├── config.py             # Global configurations, features, and hyperparameters
├── features.py           # Ingestion, cleaning, ELO calculation, and team form calculation
├── model.py              # ML classifier models (Random Forest, XGBoost) and plotting utilities
├── main.py               # Main pipeline orchestration script
├── requirements.txt      # Project dependencies list
├── .gitignore            # Git exclusions file
└── results.csv           # Match history database (1990 - present)
```

## Features Used

* **ELO Ratings**: Simulates historical team strengths chronologically starting at a default rating of 1500, with K-factors adjusted by tournament prestige and extra points for home-field advantage.
* **Rolling Form**: Calculates performance metrics over the last 5 matches for each team (wins, draws, losses, goals scored, goals conceded, goal difference).
* **Tournament Importance**: Classifies tournaments into weight levels (e.g. World Cups carry higher weights than Friendlies).

## Getting Started

### 1. Install Dependencies
Ensure you have Python installed, then run:
```bash
pip install -r requirements.txt
```

### 2. Run Pipeline
Execute the pipeline from the root directory:
```bash
python main.py
```
Running this will:
1. Load and clean the match data from `results.csv`.
2. Compute historical ELO ratings and team forms.
3. Split the data into train and test sets (80/20 split).
4. Train and evaluate **Random Forest** and **XGBoost** models.
5. Output classification reports and save a feature importance plot to `feature_importance.png`.

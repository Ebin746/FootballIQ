# main.py

import os
from config import CSV_PATH, START_DATE, TEST_SPLIT_RATIO, FEATURES
from features import prepare_data
from model import (
    train_random_forest,
    train_xgboost,
    evaluate_model,
    plot_feature_importance
)

def main():
    # 1. Prepare features and load dataset
    df, final_ratings = prepare_data(CSV_PATH, START_DATE)
    
    # Print some info about processed dataframe
    print(f"\nDataset prepared with shape: {df.shape}")
    print(df[["home_team", "away_team", "home_wins_last5", "away_wins_last5", "home_goal_diff_avg5", "away_goal_diff_avg5"]].tail())
    
    # 2. Train / Test Split
    split_ind = int(len(df) * TEST_SPLIT_RATIO)
    train_df = df.iloc[:split_ind]
    test_df = df.iloc[split_ind:]
    print(f"\nTrain set shape: {train_df.shape}, Test set shape: {test_df.shape}")
    
    # 3. Train & Evaluate Random Forest Classifier
    rf_model = train_random_forest(train_df, FEATURES)
    evaluate_model(rf_model, test_df, FEATURES, model_name="Random Forest")
    
    # 4. Train & Evaluate XGBoost Classifier
    xgb_model = train_xgboost(train_df, FEATURES)
    evaluate_model(xgb_model, test_df, FEATURES, model_name="XGBoost")
    
    # 5. Save Feature Importance Plot
    plot_feature_importance(xgb_model, FEATURES, save_path="feature_importance.png")
    
    print("\nPipeline execution complete!")

if __name__ == "__main__":
    main()

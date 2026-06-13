# model.py

import pandas as pd
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, classification_report
from config import RANDOM_STATE

def train_random_forest(train_df, features, target="result"):
    """
    Trains a Random Forest classifier.
    """
    print("Training Random Forest Classifier...")
    rf_model = RandomForestClassifier(
        n_estimators=200,
        random_state=RANDOM_STATE
    )
    rf_model.fit(train_df[features], train_df[target])
    return rf_model

def train_xgboost(train_df, features, target="result"):
    """
    Trains an XGBoost classifier.
    """
    print("Training XGBoost Classifier...")
    xgb_model = XGBClassifier(
        objective="multi:softmax",
        num_class=3,
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        random_state=RANDOM_STATE
    )
    xgb_model.fit(train_df[features], train_df[target])
    return xgb_model

def evaluate_model(model, test_df, features, target="result", model_name="Model"):
    """
    Evaluates a model and prints metrics.
    """
    preds = model.predict(test_df[features])
    accuracy = accuracy_score(test_df[target], preds)
    
    print(f"\n=== {model_name} Evaluation ===")
    print(f"Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(test_df[target], preds))
    return accuracy

def plot_feature_importance(model, features, save_path="feature_importance.png"):
    """
    Plots feature importances for a tree-based model and saves it.
    """
    print(f"Plotting feature importance and saving to {save_path}...")
    imp = pd.Series(
        model.feature_importances_,
        index=features
    ).sort_values()

    plt.figure(figsize=(10, 6))
    imp.plot(kind="barh")
    plt.title("Feature Importance")
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()
    print("Plot saved successfully.")

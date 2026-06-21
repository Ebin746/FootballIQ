from typing import List, Optional

from pydantic import BaseModel, Field


class MatchPredictRequest(BaseModel):
    home_team: str
    away_team: str
    neutral: bool = True
    tournament_importance: int = Field(default=4, ge=1, le=4)


class MatchPredictResponse(BaseModel):
    home_team: str
    away_team: str
    home_win_pct: float
    draw_pct: float
    away_win_pct: float
    predicted_outcome: str


class WorldCupPredictRequest(BaseModel):
    n_simulations: int = Field(default=200, ge=10, le=2000)


class TeamProbability(BaseModel):
    team: str
    win_pct: float


class WorldCupPredictResponse(BaseModel):
    n_simulations: int
    results: List[TeamProbability]


class GroupRow(BaseModel):
    team: str
    played: int
    wins: int
    draws: int
    losses: int
    points: int


class GroupStandingsResponse(BaseModel):
    group: str
    table: List[GroupRow]


class TeamsResponse(BaseModel):
    teams: List[str]


class GroupsResponse(BaseModel):
    groups: dict

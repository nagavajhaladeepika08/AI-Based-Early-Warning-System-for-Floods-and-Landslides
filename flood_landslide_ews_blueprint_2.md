# AI-Based Explainable Early Warning System for Flood and Landslide Risk Prediction
## Complete Project Blueprint & Development Roadmap (Full-Stack Edition)

> This version enables **both a real backend (API + database) and a full frontend (dashboard)**, instead of a single Streamlit-only script. This is closer to a production-style architecture, still scoped to be achievable in a final-year timeline.

---

## 1. Project Title
**An AI-Based Explainable Early Warning System for Flood and Landslide Risk Prediction**

Optional subtitle: *A Multi-Hazard, SHAP-Explainable Decision-Support Prototype*

---

## 2. Abstract (template — fill in after results exist)
This project presents a decision-support prototype that predicts flood and landslide risk using machine learning models trained on historical environmental data (rainfall, river level, soil moisture, slope, elevation, etc.). Multiple algorithms (Logistic Regression, Decision Tree, Random Forest, XGBoost, LightGBM) are compared using standard classification metrics. SHAP (SHapley Additive exPlanations) is applied to provide both global and local explainability, allowing the system to state *which factors* drove a given prediction. A FastAPI backend serves predictions and explanations through a REST API backed by a relational database, and a Streamlit frontend dashboard visualizes current conditions, risk levels, historical trends, and SHAP-based explanations, issuing warnings when risk crosses calibrated thresholds. The system is explicitly a prototype early-warning aid and does not replace official disaster-management authorities.

*(Do not fill in numeric results until you actually have them — see Section 10.)*

---

## 3. Introduction / Problem Statement / Motivation / Research Gap
- **Problem**: Floods and landslides cause significant loss of life and property, and many at-risk communities lack timely, localized, and *interpretable* warnings.
- **Motivation**: Most ML-based disaster prediction systems act as "black boxes" — they give a probability but not a reason. Decision-makers and residents are more likely to trust and act on warnings when the contributing factors are shown.
- **Research gap**: Many academic flood/landslide models report accuracy but skip (a) explainability, (b) proper temporal validation, (c) deployable end-to-end systems (data → model → explanation → dashboard → alert). This project addresses all three in one integrated pipeline.

---

## 4. Aim, Objectives, Research Questions

**Aim**: Design and implement an explainable, multi-hazard (flood + landslide) early-warning decision-support system.

**Objectives**
1. Collect and preprocess historical rainfall, hydrological, and terrain data for a chosen study region.
2. Engineer time-aware features (lag/rolling/cumulative) suited to disaster prediction.
3. Train and compare multiple ML models for flood and landslide risk.
4. Apply SHAP for global and local explainability.
5. Build a calibrated risk classification scheme.
6. Develop a backend API and database to serve predictions.
7. Build a frontend dashboard with maps, graphs, and alerts.
8. Evaluate the system honestly, including its limitations and false-negative risk.

**Research questions**
- Which environmental variables contribute most to flood vs. landslide risk in the study region?
- How does model choice affect the trade-off between recall (catching real events) and false alarms?
- Can SHAP explanations meaningfully improve the interpretability of the system for non-technical users?
- How should risk thresholds be calibrated rather than assumed?

---

## 5. Scope
- Two hazards: flood and landslide (separate models, shared architecture).
- One study region initially (see Section 9 for how to choose it).
- Historical data–driven prediction (real-time API integration is an optional stretch goal, not a requirement).
- Prototype-level early warning, not an operational government system.

---

## 6. System Architecture (Full-Stack: Frontend + Backend Enabled)

```
                          Environmental Data Sources
                    (Rainfall, River Level, Soil Moisture,
                     Terrain, Weather, Historical Events)
                                    ↓
                         Data Collection Layer
                        (scripts / API fetchers)
                                    ↓
                         Data Processing Layer
                (cleaning, missing values, unit/time sync)
                                    ↓
                          Feature Engineering
                (lag features, rolling sums, terrain features)
                                    ↓
                 ┌──────────────────┴──────────────────┐
                 ↓                                      ↓
           Flood Model                           Landslide Model
     (LogReg / DT / RF / XGB / LGBM)         (LogReg / DT / RF / XGB / LGBM)
                 ↓                                      ↓
           Probability                             Probability
                 └──────────────────┬──────────────────┘
                                    ↓
                          SHAP Explainability
                        (global + local explanations)
                                    ↓
                            Risk Engine
                 (calibrated thresholds → LOW/MODERATE/HIGH/CRITICAL)
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                                ↓
             BACKEND (FastAPI)                 DATABASE (PostgreSQL/SQLite)
      /predict/flood   /predict/landslide         locations, observations,
      /explain         /history   /alerts         predictions, risk_levels,
      /locations       /health                     events, alerts
                    ↓                                ↑
                    └────────────┬───────────────────┘
                                 ↓
                    FRONTEND (Streamlit dashboard)
        current conditions · probability gauges · SHAP charts
        historical graphs · risk map (Folium/Plotly) · alerts
                                 ↓
                              End User
```

**Why split into frontend + backend (instead of one Streamlit script)?**
- Backend (FastAPI) owns: model loading, prediction logic, SHAP computation, database access, business rules (risk thresholds, alert generation). Exposed as a clean REST API.
- Frontend (Streamlit) owns: presentation only — calls the API, renders charts/maps/tables.
- This mirrors real systems, is easier to demo ("here's my API docs, here's my UI"), and lets you show both frontend and backend skills to examiners — while still being buildable solo in ~10–12 weeks.
- If you're short on time, the backend can be simplified (predictions computed in-process) but the API layer should still exist — it's the cleanest way to satisfy "frontend and backend both enabled."

---

## 7. Technology Stack (All Layers Enabled)

| Layer | Technology | Notes |
|---|---|---|
| Language | Python 3.11 | single language across stack |
| Data processing | Pandas, NumPy | |
| ML | Scikit-learn, XGBoost, LightGBM | model comparison |
| Explainability | SHAP | global + local |
| Visualization | Matplotlib, Seaborn, Plotly | Plotly for interactive dashboard charts |
| Mapping | Folium or Plotly (choropleth/scatter-mapbox) | risk map |
| **Backend API** | **FastAPI** + Uvicorn | REST endpoints, request validation via Pydantic |
| **Database** | **SQLite** (dev) → **PostgreSQL** (optional upgrade) | SQLAlchemy ORM recommended |
| **Frontend** | **Streamlit** | calls backend via `requests` |
| Auth (optional/stretch) | simple API key header | only if you want to show security awareness |
| Model serialization | joblib / pickle | |
| Testing | pytest | unit tests for feature engineering & API |
| Environment | venv + requirements.txt | |
| Version control | Git + GitHub | |

---

## 8. Folder Structure (Frontend/Backend Separated)

```
flood-landslide-ews/
│
├── data/
│   ├── raw/
│   └── processed/
│
├── models/
│   ├── flood_model.pkl
│   └── landslide_model.pkl
│
├── notebooks/
│   ├── 01_eda.ipynb
│   ├── 02_feature_engineering.ipynb
│   └── 03_model_comparison.ipynb
│
├── backend/
│   ├── app.py                  # FastAPI entrypoint
│   ├── routers/
│   │   ├── predict.py
│   │   ├── history.py
│   │   └── alerts.py
│   ├── services/
│   │   ├── flood_service.py
│   │   ├── landslide_service.py
│   │   ├── explainability_service.py
│   │   └── risk_engine.py
│   ├── db/
│   │   ├── models.py           # SQLAlchemy models
│   │   ├── database.py
│   │   └── schema.sql
│   └── config.py
│
├── frontend/
│   ├── dashboard_app.py        # Streamlit entrypoint
│   ├── components/
│   │   ├── map_view.py
│   │   ├── shap_view.py
│   │   ├── history_view.py
│   │   └── alert_banner.py
│   └── api_client.py           # wraps requests to backend
│
├── src/
│   ├── data_processing/
│   ├── feature_engineering/
│   ├── flood_model/
│   ├── landslide_model/
│   ├── explainability/
│   └── training/
│
├── tests/
│   ├── test_features.py
│   └── test_api.py
│
├── requirements.txt
├── README.md
└── docker-compose.yml (optional stretch: containerize backend+frontend+db)
```

---

## 9. Study Area Selection
Pick **one** region with:
- Documented flood *and* landslide history (news archives, disaster databases).
- Available rainfall/river gauge data (government meteorological or hydrology agency).
- Terrain data coverage (SRTM/ASTER elevation is near-global, so slope isn't usually the blocker).

Practical approach: start with a country/region where you can read the language of government portals, since most hydrology/meteorology open data is published by national agencies. Document your selection criteria in the report — this itself is a legitimate methodology section ("Study Area Selection").

---

## 10. Data Sources (to be detailed further when we reach data collection)
Categories you'll need: rainfall & weather, river/water level, soil moisture, elevation/slope (DEM), land cover, historical flood/landslide event records. Good starting points to investigate for your specific country: national meteorological department, national hydrology/water resources agency, and global datasets (e.g., NASA/USGS elevation data, global precipitation products, global landslide/flood event catalogs from research institutions). We'll go deep on exact sources, variables, and download steps in the next step of this roadmap — many portals require choosing a country/region first.

**No fabricated numbers**: any accuracy/precision/recall figures shown before you train real models will be explicitly labeled `HYPOTHETICAL EXAMPLE`.

---

## 11. Modules
1. Data Collection
2. Data Preprocessing
3. Feature Engineering
4. Flood Prediction Model
5. Landslide Prediction Model
6. Explainable AI (SHAP)
7. Risk Assessment / Risk Engine
8. GIS / Mapping
9. Backend API
10. Database
11. Frontend Dashboard
12. Alert System
13. Model Monitoring & Evaluation

---

## 12. ML Methodology (unchanged core, backend-aware)
1. Load & explore data → 2. Clean → 3. Feature engineer (with lag/rolling features) → 4. Define target variable → 5. **Chronological split** (not random — see below) → 6. Train baseline (Logistic Regression) → 7. Train Decision Tree, Random Forest, XGBoost, LightGBM → 8. Hyperparameter tuning (e.g., `TimeSeriesSplit` + `GridSearchCV`/`RandomizedSearchCV`) → 9. Evaluate (accuracy, precision, recall, F1, ROC-AUC, PR-AUC, confusion matrix) → 10. Select best model with justification → 11. Calibrate probabilities (`CalibratedClassifierCV` if needed) → 12. Apply SHAP → 13. Save model (joblib) → 14. Wrap in backend service → 15. Expose via FastAPI → 16. Consume from Streamlit → 17. Build risk engine → 18. Build alert logic.

**Why not a random train/test split?** Rainfall/river-level/soil-moisture readings are autocorrelated in time — a random split leaks future information into training (e.g., training on Tuesday 3pm and testing on Tuesday 2pm of the same storm). Use a **chronological split** (train on earlier period, test on later period) or `TimeSeriesSplit` cross-validation.

**Why recall/false negatives matter most here**: A false negative means the system says "safe" right before a flood/landslide — the worst possible failure mode for an early-warning tool. A false positive just causes an unnecessary precaution. So while you report all metrics, discuss recall and PR-AUC (more informative than ROC-AUC under class imbalance) with extra weight, and explicitly report the false-negative count/rate, not just aggregate accuracy.

---

## 13. Risk Classification & Calibration
Starting bands (illustrative, not final):
- 0–30% = LOW, 30–50% = MODERATE, 50–75% = HIGH, 75–100% = CRITICAL

These must be **calibrated**, not assumed: after training, plot the predicted-probability distribution against actual outcomes (reliability/calibration curve), and pick thresholds that reflect actual historical event rates at each probability band in your validation data — this becomes a genuine methodological contribution rather than an arbitrary rule.

---

## 14. Backend API Design (FastAPI) — enabling "backend" fully

Example endpoint set:
- `POST /predict/flood` → body: current features → returns probability + risk level
- `POST /predict/landslide` → same pattern
- `GET /explain/{prediction_id}` → returns SHAP local explanation (feature contributions)
- `GET /locations` → list of monitored locations
- `GET /history/{location_id}` → past observations + past predictions
- `GET /alerts` → active alerts
- `GET /health` → service status

Database tables (SQL, to detail fully with ER diagram in the implementation phase): `locations`, `observations`, `predictions`, `risk_levels`, `historical_events`, `alerts`.

---

## 15. Frontend Dashboard Design (Streamlit) — enabling "frontend" fully
Sections: location selector → current conditions panel (rainfall, river level, soil moisture, temp, humidity) → flood/landslide probability gauges + risk badges → SHAP bar chart (global) and waterfall chart (local, per-prediction) → historical rainfall/river-level line charts → risk map (color-coded by location) → warning banner → last-updated timestamp. All values are fetched from the backend API (`frontend/api_client.py`), not computed inline — keeping the "frontend calls backend" separation real, not cosmetic.

---

## 16. Timeline (10–12 weeks)
| Week | Focus |
|---|---|
| 1 | Literature review, study area selection, finalize scope |
| 2 | Dataset collection (rainfall, river, soil, terrain, events) |
| 3 | Data cleaning & timestamp/geo alignment |
| 4 | Feature engineering (lag/rolling/cumulative), target definition |
| 5 | Baseline + multiple model training (flood) |
| 6 | Multiple model training (landslide) + tuning + chronological CV |
| 7 | Model comparison, selection, calibration |
| 8 | SHAP integration (global + local) |
| 9 | Backend API + database build |
| 10 | Frontend dashboard build + integration with backend |
| 11 | Alert system, risk map, end-to-end testing |
| 12 | Documentation, report writing, slides, rehearsal |

---

## 17. Demonstration Plan (with or without live data)
If real-time sensors/APIs aren't available: use a **held-out historical event** (e.g., a real past storm from your dataset) as the "live" demo input, replaying its readings hour-by-hour into the dashboard. This is scientifically honest (labelled as historical replay) and still visually compelling.

---

## 18. Final Presentation Guide (brief — expand later)
Suggested ~14–16 slides: Title → Problem/Motivation → Research Gap → Objectives → Architecture (frontend+backend+DB diagram) → Dataset & Study Area → Feature Engineering → Models Compared → Evaluation Results (real, not hypothetical) → SHAP Global → SHAP Local (example case) → Risk Calibration → Dashboard Demo (screenshots/live) → Limitations → Future Work → Conclusion. Expect examiner questions on: why these models, why these metrics, data leakage prevention, why false negatives matter, and how thresholds were calibrated — have one slide's worth of answer ready for each.

---

## 19. Limitations (be upfront about these in the report)
- Predictions are only as good as historical data coverage and quality.
- A prototype trained on one region will not generalize elsewhere without retraining.
- Small/imbalanced disaster-event datasets limit model reliability — must be disclosed, not hidden.
- The system supports decisions; it does not replace official meteorological/disaster-management authorities, and should be presented that way both in the dashboard UI text and in the report.

---

## Next Step
As agreed, the next step is **dataset selection and data collection**, starting with choosing your study region and identifying real rainfall/river/soil/terrain/event data sources for it.

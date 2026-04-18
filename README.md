<div align="center">

# 📦 DRA — Delivery Risk Analysis

**An end-to-end Machine Learning system that predicts delivery outcomes in real time.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://delivery-risk-analysis.vercel.app)
[![API Health](https://img.shields.io/badge/API-Render-46E3B7?style=for-the-badge&logo=render)](https://dra-api.onrender.com/health)
[![Model](https://img.shields.io/badge/Model-Hugging%20Face-FFD21E?style=for-the-badge&logo=huggingface)](https://huggingface.co/shrshthbhshn/dra-model)
[![XGBoost](https://img.shields.io/badge/XGBoost-ML-orange?style=for-the-badge)](https://xgboost.readthedocs.io)

</div>

---

## 🧠 What is DRA?

DRA (Delivery Risk Analysis) is a production-deployed ML system trained on the **Amazon Delivery Dataset** (~44K records). It classifies any delivery into one of three outcomes:

| Label | Meaning |
|---|---|
| ✅ **On-Time** | Delivery is expected to arrive as scheduled |
| ⚠️ **At-Risk** | Delivery shows signals of potential delay |
| ❌ **Delayed** | Delivery is likely to miss the expected window |

The system accepts **17 raw user inputs**, engineers **~67 features** internally (temporal, Haversine distance, weather/traffic severity, interaction flags), and returns a prediction with confidence scores — all in under a second.

---

## 🏗️ System Architecture

```
User → Next.js Frontend (Vercel)
           │
           ▼
    FastAPI Backend (Render)
           │
           ├── Feature Engineering (~67 features)
           │
           ▼
    XGBoost Model (Hugging Face)
           │
           ▼
    Prediction: On-Time / At-Risk / Delayed
```

| Layer | Tech | Hosted On |
|---|---|---|
| **Frontend** | Next.js 14, Tailwind CSS, shadcn/ui, Framer Motion | Vercel |
| **Backend** | FastAPI, Python, scikit-learn | Render (Free Tier) |
| **Model** | XGBoost, StandardScaler, LabelEncoder | Hugging Face |
| **Keep-Alive** | cron-job.org (pings `/health` every 10 min) | — |

---

## 🚀 How to Use

> **Important:** The API is hosted on Render's free tier and **spins down after inactivity**. Always wake it up before using the app.

### Step 1 — Wake Up the API

Click the link below to ping the health endpoint. Wait until you see `{"status":"ok"}` in your browser (this may take **up to 60 seconds** on a cold start):

**👉 [https://dra-api.onrender.com/health](https://dra-api.onrender.com/health)**

You'll see:
```json
{ "status": "ok", "model": "loaded" }
```

Once that appears, the API is warm and ready.

### Step 2 — Open the App

Navigate to the live frontend:

**👉 [https://delivery-risk-analysis.vercel.app](https://delivery-risk-analysis.vercel.app)**

### Step 3 — Fill in the Delivery Details

The form accepts **17 inputs** across the following categories:

| Category | Fields |
|---|---|
| **Order Info** | Order Date, Order Time |
| **Origin** | Origin Latitude, Origin Longitude |
| **Destination** | Destination Latitude, Destination Longitude |
| **Agent Info** | Agent Age, Agent Rating |
| **Delivery Context** | Vehicle Type, Weather Conditions, Traffic Conditions |
| **Item Details** | Product Category, Item Priority |
| **Logistics** | Warehouse Distance (km), Shipping Mode |
| **Customer** | Customer Tier, Region |

### Step 4 — Get Your Prediction

Hit **Analyze Risk** and receive:
- **Prediction label** — On-Time, At-Risk, or Delayed
- **Confidence scores** — probability breakdown across all three classes
- **Risk explanation** — key contributing factors

---

## 🔌 API Reference

Base URL: `https://dra-api.onrender.com`

### `GET /health`
Check if the API is alive and the model is loaded.

**Response:**
```json
{ "status": "ok", "model": "loaded" }
```

---

### `GET /options`
Returns all valid values for categorical input fields (vehicle types, weather conditions, etc.)

**Response:**
```json
{
  "vehicle_types": ["Bike", "Car", "Scooter", "Truck"],
  "weather_conditions": ["Sunny", "Rainy", "Foggy", "Windy", "Cloudy"],
  ...
}
```

---

### `POST /predict`
Submit delivery data and receive a risk prediction.

**Request Body:**
```json
{
  "order_date": "2024-03-15",
  "order_time": "14:30",
  "origin_lat": 12.9716,
  "origin_lon": 77.5946,
  "dest_lat": 13.0827,
  "dest_lon": 80.2707,
  "agent_age": 28,
  "agent_rating": 4.3,
  "vehicle_type": "Bike",
  "weather": "Rainy",
  "traffic": "High",
  "product_category": "Electronics",
  "item_priority": "High",
  "warehouse_distance_km": 12.5,
  "shipping_mode": "Standard",
  "customer_tier": "Premium",
  "region": "South"
}
```

**Response:**
```json
{
  "prediction": "At-Risk",
  "confidence": {
    "On-Time": 0.18,
    "At-Risk": 0.61,
    "Delayed": 0.21
  }
}
```

---

## 🧪 Local Development

### Prerequisites
- Python 3.10+
- Node.js 18+
- pip

### Backend Setup

```bash
git clone https://github.com/your-username/dra-api
cd dra-api
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`.

### Frontend Setup

```bash
git clone https://github.com/your-username/dra-frontend
cd dra-frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

> Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in your `.env.local` to point the frontend to your local API.

---

## 🤖 Model Details

| Property | Value |
|---|---|
| **Algorithm** | XGBoost (Gradient Boosted Trees) |
| **Training Set** | ~44,000 Amazon delivery records |
| **Feature Count** | ~67 engineered features |
| **Target Classes** | On-Time, At-Risk, Delayed |
| **Preprocessing** | StandardScaler (numerical), LabelEncoder (categorical) |
| **Model Hosting** | Hugging Face — `shrshthbhshn/dra-model` |

**Key engineered features include:**
- Haversine distance between origin and destination
- Hour-of-day and day-of-week extraction
- Weather severity index
- Traffic severity index
- Agent experience proxy (age × rating)
- Distance-to-warehouse interaction term

---

## 📁 Project Structure

```
dra-api/
├── main.py              # FastAPI app & endpoints
├── model_loader.py      # Downloads model files from Hugging Face
├── feature_engineer.py  # All ~67 feature engineering functions
├── requirements.txt     # Python dependencies (unpinned for compatibility)
└── Procfile             # Render start command

dra-frontend/
├── app/
│   ├── page.tsx         # Main prediction form
│   └── layout.tsx       # App shell
├── components/
│   ├── PredictionForm.tsx
│   └── ResultCard.tsx
└── public/
```

---

## ⚠️ Known Limitations

- **Cold starts:** The Render free tier spins down after ~15 minutes of inactivity. The first request after spin-down takes up to 60 seconds. A keep-alive cron job pings the API every 10 minutes to minimize this.
- **Free tier limits:** High concurrent load may cause timeouts on the free Render plan.
- **Model scope:** Trained on Amazon delivery data; predictions may be less accurate for highly unusual delivery configurations not represented in the training set.

---

## 📄 License

MIT — see [LICENSE](./LICENSE) for details.

---

<div align="center">
  Built with ❤️ by <a href="https://github.com/shrshthbhshn">Shreshtha</a>
</div>

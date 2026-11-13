# RetailIQ — Retail Intelligence Workbench

RetailIQ is a local web application for uploading retail CSV datasets, reviewing data quality, cleaning and normalizing data, viewing inventory analytics, and asking questions about a dataset.

## Features

- Upload and profile CSV datasets (maximum size: 10 MB).
- Review detected data-quality issues and clean selected issues.
- Normalize retail data and compare dataset versions.
- View product, category, price, and inventory analytics.
- Ask supported questions about products, prices, stock, and categories. Chat queries are handled by a deterministic intent parser; no external AI service is required.
- Join datasets through the backend API.

## Requirements

- Python with `pip`
- Node.js and npm

## Run locally

Start the backend in one terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install fastapi uvicorn pandas python-multipart
python -m uvicorn app.main:app --reload
```

The API is available at `http://127.0.0.1:8000`. Interactive API documentation is at `http://127.0.0.1:8000/docs`, and the health check is at `http://127.0.0.1:8000/health`.

In another terminal, start the frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173`). The frontend calls the backend at `http://127.0.0.1:8000`.

## Using the workbench

1. Open **Datasets** and upload a CSV file.
2. Select **Data Cleaning** to review and apply detected fixes, or normalize the data.
3. Use **Analytics** to view retail metrics.
4. Open **AI Assistant** to ask supported questions about the selected dataset.

Retail analytics requires columns corresponding to `product`, `category`, `price`, and `stock`. The backend stores uploaded datasets and generated artifacts under `backend/datasets/` and `backend/artifacts/`.

## API overview

- `POST /api/datasets/upload` — upload and profile a CSV.
- `GET /api/datasets/{dataset_id}/metadata` — retrieve dataset metadata.
- `POST /api/datasets/clean` — clean selected data-quality issues.
- `POST /api/datasets/normalize` — normalize a dataset.
- `POST /api/datasets/analytics` — generate retail analytics.
- `POST /api/datasets/join` — join two datasets.
- `GET /api/datasets/{dataset_id}/download` — download a dataset.
- `POST /api/chat/query` — ask a question about a dataset.
- `GET /api/chat/sessions/{session_id}` — retrieve a chat session.

See the interactive API documentation at `/docs` for request and response schemas.

## Tests and checks

Run backend tests from `backend/`:

```powershell
python -m pytest
```

Run frontend linting and create a production build from `frontend/`:

```powershell
npm run lint
npm run build
```

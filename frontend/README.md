# RetailIQ — AI Retail Data & Conversational Intelligence Workbench

RetailIQ is a full-stack data intelligence workbench designed to help users upload, inspect, clean, normalize, combine, and analyze retail datasets through a web interface. It also provides a conversational query assistant that translates supported natural-language questions into validated query plans and executes them against retail data.

## Features

### 1. Dataset Upload & Profiling
- Upload CSV datasets.
- Inspect row and column counts, data types, missing values, duplicate rows, and unique values.
- Generate an initial dataset profile and detect potential data-quality issues.
- Persist dataset metadata and original files.

### 2. Data Cleaning
- Identify missing values and duplicate records.
- Select which detected issues to resolve.
- Apply deterministic cleaning operations.
- Generate cleaned dataset artifacts and cleaning action reports.

### 3. Product & Category Normalization
- Standardize product names by trimming and cleaning whitespace.
- Normalize common retail category variations.
- Generate a normalized dataset and record the transformations applied.

### 4. Safe Dataset Joining
- Combine two retail datasets using a selected join key.
- Support inner, left, right, and outer joins.
- Validate join keys and reject duplicate keys to prevent unexpected many-to-many row multiplication.

### 5. Retail Analytics
- Calculate product and category counts.
- Calculate average product price.
- Calculate total inventory stock and inventory value.
- Generate category-level summaries.
- Identify products with the highest stock levels.

### 6. Conversational Query Assistant
- Ask supported retail questions in natural language.
- Convert questions into structured, allow-listed query plans.
- Validate query plans before execution.
- Execute queries deterministically against the selected dataset.
- Return results with supporting evidence, including dataset version, columns used, operation, input row count, and result preview.
- Persist conversation sessions for retrieval.

**Implementation note:** The current conversational query engine uses a deterministic intent parser and validated query execution. It does not currently call an external large language model.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Python, FastAPI |
| Data Processing | Pandas, NumPy |
| Database / Query Tools | DuckDB, SQLAlchemy |
| HTTP Client | Axios |
| Visualization | Recharts |
| Icons | Lucide React |
| Testing | Pytest, HTTPX |

## Project Structure

```text
retail-intelligence-workbench/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── evaluate.py
│   │   └── services/
│   │       ├── profiler.py
│   │       ├── cleaner.py
│   │       ├── analytics.py
│   │       ├── normalizer.py
│   │       ├── joiner.py
│   │       └── chat_service.py
│   │
│   ├── datasets/
│   ├── artifacts/
│   ├── evaluation_output/
│   ├── tests/
│   ├── cases.json
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.10 or later
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd retail-intelligence-workbench
```

### 2. Set up the backend

Open a terminal:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment on Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
python -m uvicorn app.main:app --reload
```

Backend URL: `http://127.0.0.1:8000`

Interactive API documentation: `http://127.0.0.1:8000/docs`

### 3. Set up the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal. The default is usually `http://localhost:5173`.

## Sample Datasets

Sample CSV datasets are available in:

- `backend/datasets/retail_sample.csv`
- `backend/datasets/inventory_sample.csv`

These datasets can be used to explore upload, profiling, cleaning, normalization, joining, and analytics functionality.

## Running Tests

From the `backend` directory:

```bash
python -m pytest -v
```

The current test suite contains 31 tests covering profiling, cleaning, analytics, normalization, joining, and conversational query functionality.

## Running the Evaluation

From the `backend` directory:

```bash
python -m app.evaluate --input cases.json --output results.json --artifacts-dir ./evaluation_output
```

The evaluation runner executes the defined test cases and generates a results file and detailed evaluation report.

**Current evaluation result:** 6 out of 6 cases passed (100%).

## API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | API information |
| GET | `/health` | Health check |
| POST | `/api/datasets/upload` | Upload and profile a CSV |
| POST | `/api/datasets/clean` | Clean selected data issues |
| POST | `/api/datasets/analytics` | Generate retail analytics |
| POST | `/api/datasets/normalize` | Normalize product and category data |
| POST | `/api/datasets/join` | Join two datasets |
| GET | `/api/datasets/{dataset_id}/metadata` | Retrieve dataset metadata |
| GET | `/api/datasets/{dataset_id}/download` | Download a dataset |
| POST | `/api/chat/query` | Submit a conversational query |
| GET | `/api/chat/sessions/{session_id}` | Retrieve a chat session |

For request and response schemas, use the interactive Swagger documentation at `/docs`.

## Design Principles

- **Deterministic processing:** Data transformations and supported query execution follow predictable rules.
- **Validation first:** Inputs, join keys, and query plans are checked before execution.
- **Traceability:** Dataset artifacts, metadata, cleaning actions, and query evidence support reproducibility.
- **Safe execution:** Conversational queries are restricted to explicitly supported operations.
- **Modular architecture:** Data processing capabilities are separated into individual backend services.

## Current Limitations

- Conversational query interpretation is rule-based rather than powered by an external LLM.
- The evaluation runner currently uses the configured sample dataset artifact.
- The frontend API client currently uses a local backend URL; deployment configuration is required for production hosting.

## License

This project was developed as a technical assignment and demonstration of retail data processing and conversational analytics capabilities.
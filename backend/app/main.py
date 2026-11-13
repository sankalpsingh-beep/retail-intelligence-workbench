import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal
from uuid import UUID, uuid4

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from app.services.profiler import profile_dataframe
from app.services.cleaner import detect_issues, clean_dataframe
from app.services.analytics import generate_retail_analytics
from app.services.normalizer import normalize_retail_data
from app.services.joiner import join_retail_datasets
from app.services.chat_service import (
    build_query_plan,
    validate_query_plan,
    execute_query_plan,
    UnsupportedQuestionError,
)



app = FastAPI(
    title="RetailIQ",
    description="AI Retail Data & Conversational Intelligence Workbench",
    version="1.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = BASE_DIR / "datasets"
ARTIFACT_DIR = BASE_DIR / "artifacts"
CHAT_SESSION_DIR = ARTIFACT_DIR / "chat_sessions"

DATASET_DIR.mkdir(parents=True, exist_ok=True)
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
CHAT_SESSION_DIR.mkdir(parents=True, exist_ok=True)

MAX_UPLOAD_SIZE = 10 * 1024 * 1024


# -------------------------
# Request Models
# -------------------------

class CleaningRequest(BaseModel):
    dataset_id: str
    selected_issue_ids: list[str]


class AnalyticsRequest(BaseModel):
    dataset_id: str


class JoinRequest(BaseModel):
    left_dataset_id: str
    right_dataset_id: str
    join_key: str
    how: Literal["inner", "left", "right", "outer"] = "inner"


class ChatRequest(BaseModel):
    dataset_id: str
    question: str = Field(min_length=1, max_length=1000)
    dataset_version: Literal[
        "original", "cleaned", "normalized"
    ] = "cleaned"
    session_id: str | None = None


# -------------------------
# Utility Functions
# -------------------------

def validate_dataset_id(dataset_id: str) -> str:
    try:
        return str(UUID(dataset_id))
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(
            status_code=400,
            detail="Invalid dataset ID. A valid UUID is required.",
        )


def update_dataset_metadata(dataset_id: str, updates: dict):
    dataset_id = validate_dataset_id(dataset_id)
    metadata_path = ARTIFACT_DIR / f"{dataset_id}_metadata.json"

    if not metadata_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Dataset metadata not found.",
        )

    with open(metadata_path, "r", encoding="utf-8") as file:
        metadata = json.load(file)

    metadata.update(updates)
    metadata["updated_at"] = datetime.now(timezone.utc).isoformat()

    temporary_path = metadata_path.with_suffix(".tmp")
    temporary_path.write_text(
        json.dumps(metadata, indent=4, default=str),
        encoding="utf-8",
    )
    temporary_path.replace(metadata_path)


def get_dataset_path(dataset_id: str, version: str) -> Path:
    dataset_id = validate_dataset_id(dataset_id)

    paths = {
        "original": DATASET_DIR / f"{dataset_id}_original.csv",
        "cleaned": ARTIFACT_DIR / f"{dataset_id}_cleaned.csv",
        "normalized": ARTIFACT_DIR / f"{dataset_id}_normalized.csv",
    }

    if version not in paths:
        raise HTTPException(
            status_code=400,
            detail="Unsupported dataset version.",
        )

    path = paths[version]

    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"The {version} dataset version was not found.",
        )

    return path


def load_chat_session(session_id: str | None, dataset_id: str):
    """Load a conversation or create a new one."""

    if session_id is None:
        now = datetime.now(timezone.utc).isoformat()

        return {
            "session_id": str(uuid4()),
            "dataset_id": dataset_id,
            "created_at": now,
            "updated_at": now,
            "messages": [],
        }

    try:
        session_id = str(UUID(session_id))
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(
            status_code=400,
            detail="Invalid chat session ID.",
        )

    session_path = CHAT_SESSION_DIR / f"{session_id}.json"

    if not session_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Chat session not found.",
        )

    with open(session_path, "r", encoding="utf-8") as file:
        session = json.load(file)

    if session.get("dataset_id") != dataset_id:
        raise HTTPException(
            status_code=400,
            detail="This chat session belongs to another dataset.",
        )

    return session


def save_chat_session(session: dict):
    session["updated_at"] = datetime.now(timezone.utc).isoformat()

    session_path = CHAT_SESSION_DIR / f"{session['session_id']}.json"
    temporary_path = session_path.with_suffix(".tmp")

    temporary_path.write_text(
        json.dumps(session, indent=4, default=str),
        encoding="utf-8",
    )

    temporary_path.replace(session_path)


def append_chat_message(session: dict, role: str, content: Any):
    session["messages"].append({
        "role": role,
        "content": content,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


# -------------------------
# Basic Routes
# -------------------------

@app.get("/")
def home():
    return {
        "message": "Welcome to RetailIQ",
        "status": "running",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


# -------------------------
# CSV Upload
# -------------------------

@app.post("/api/datasets/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported.",
        )

    dataset_id = str(uuid4())
    original_path = DATASET_DIR / f"{dataset_id}_original.csv"

    try:
        contents = await file.read(MAX_UPLOAD_SIZE + 1)

        if not contents:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty.",
            )

        if len(contents) > MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=413,
                detail="CSV file cannot exceed 10 MB.",
            )

        original_path.write_bytes(contents)
        df = pd.read_csv(original_path)

        if len(df.columns) == 0:
            raise HTTPException(
                status_code=400,
                detail="The CSV does not contain any columns.",
            )

        profile = profile_dataframe(df)
        issues = detect_issues(df)

        metadata = {
            "dataset_id": dataset_id,
            "filename": Path(file.filename).name,
            "status": "uploaded",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "original_file": original_path.name,
            "cleaned_file": None,
            "normalized_file": None,
            "profile": profile,
            "issues": issues,
        }

        metadata_path = ARTIFACT_DIR / f"{dataset_id}_metadata.json"
        metadata_path.write_text(
            json.dumps(metadata, indent=4, default=str),
            encoding="utf-8",
        )

        return {
            "dataset_id": dataset_id,
            "filename": metadata["filename"],
            "status": "uploaded",
            "profile": profile,
            "issues": issues,
        }

    except HTTPException:
        if original_path.exists():
            original_path.unlink()
        raise

    except Exception:
        if original_path.exists():
            original_path.unlink()

        raise HTTPException(
            status_code=400,
            detail="Could not process CSV file. Check that it is a valid CSV.",
        )

    finally:
        await file.close()


# -------------------------
# Data Cleaning
# -------------------------

@app.post("/api/datasets/clean")
def clean_dataset(request: CleaningRequest):
    dataset_id = validate_dataset_id(request.dataset_id)
    original_path = get_dataset_path(dataset_id, "original")

    try:
        df = pd.read_csv(original_path)
        cleaned_df, actions = clean_dataframe(
            df,
            request.selected_issue_ids,
        )

        cleaned_path = ARTIFACT_DIR / f"{dataset_id}_cleaned.csv"
        cleaned_df.to_csv(cleaned_path, index=False)

        update_dataset_metadata(
            dataset_id,
            {
                "status": "cleaned",
                "cleaned_file": cleaned_path.name,
                "cleaned_at": datetime.now(timezone.utc).isoformat(),
                "cleaning_actions": actions,
                "cleaned_profile": profile_dataframe(cleaned_df),
            },
        )

        return {
            "dataset_id": dataset_id,
            "status": "cleaned",
            "original_profile": profile_dataframe(df),
            "cleaned_profile": profile_dataframe(cleaned_df),
            "applied_actions": actions,
            "cleaned_file": cleaned_path.name,
        }

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Could not clean dataset.",
        )


# -------------------------
# Retail Analytics
# -------------------------

@app.post("/api/datasets/analytics")
def dataset_analytics(request: AnalyticsRequest):
    dataset_id = validate_dataset_id(request.dataset_id)

    cleaned_path = ARTIFACT_DIR / f"{dataset_id}_cleaned.csv"
    dataset_path = (
        cleaned_path
        if cleaned_path.exists()
        else get_dataset_path(dataset_id, "original")
    )

    try:
        df = pd.read_csv(dataset_path)
        analytics = generate_retail_analytics(df)

        return {
            "dataset_id": dataset_id,
            "source_file": dataset_path.name,
            "status": "success",
            "analytics": analytics,
        }

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Could not generate analytics.",
        )


# -------------------------
# Product / Category Normalization
# -------------------------

@app.post("/api/datasets/normalize")
def normalize_dataset(request: AnalyticsRequest):
    dataset_id = validate_dataset_id(request.dataset_id)

    cleaned_path = ARTIFACT_DIR / f"{dataset_id}_cleaned.csv"
    dataset_path = (
        cleaned_path
        if cleaned_path.exists()
        else get_dataset_path(dataset_id, "original")
    )

    try:
        df = pd.read_csv(dataset_path)
        normalized_df, actions = normalize_retail_data(df)

        normalized_path = ARTIFACT_DIR / f"{dataset_id}_normalized.csv"
        normalized_df.to_csv(normalized_path, index=False)

        update_dataset_metadata(
            dataset_id,
            {
                "normalized_file": normalized_path.name,
                "normalized_at": datetime.now(timezone.utc).isoformat(),
                "normalization_actions": actions,
                "normalized_profile": profile_dataframe(normalized_df),
            },
        )

        return {
            "dataset_id": dataset_id,
            "status": "success",
            "source_file": dataset_path.name,
            "normalized_file": normalized_path.name,
            "actions": actions,
            "normalized_preview": normalized_df.head(5).fillna("").to_dict(
                orient="records"
            ),
        }

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Could not normalize dataset.",
        )


# -------------------------
# Cross-Dataset Joins
# -------------------------

@app.post("/api/datasets/join")
def join_datasets(request: JoinRequest):
    left_dataset_id = validate_dataset_id(request.left_dataset_id)
    right_dataset_id = validate_dataset_id(request.right_dataset_id)

    left_path = get_dataset_path(left_dataset_id, "original")
    right_path = get_dataset_path(right_dataset_id, "original")

    try:
        left_df = pd.read_csv(left_path)
        right_df = pd.read_csv(right_path)

        joined_df, report = join_retail_datasets(
            left_df=left_df,
            right_df=right_df,
            join_key=request.join_key,
            how=request.how,
        )

        output_path = (
            ARTIFACT_DIR
            / f"{left_dataset_id}_{right_dataset_id}_joined.csv"
        )
        joined_df.to_csv(output_path, index=False)

        return {
            "status": "success",
            "join_report": report,
            "output_file": output_path.name,
            "preview": joined_df.head(5).fillna("").to_dict(
                orient="records"
            ),
        }

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Could not join datasets.",
        )


# -------------------------
# Dataset Downloads
# -------------------------

@app.get("/api/datasets/{dataset_id}/download")
def download_dataset(
    dataset_id: str,
    file_type: Literal["original", "cleaned", "normalized"] = "cleaned",
):
    dataset_id = validate_dataset_id(dataset_id)
    file_path = get_dataset_path(dataset_id, file_type)

    return FileResponse(
        path=file_path,
        media_type="text/csv",
        filename=file_path.name,
    )


# -------------------------
# Dataset Metadata
# -------------------------

@app.get("/api/datasets/{dataset_id}/metadata")
def get_dataset_metadata(dataset_id: str):
    dataset_id = validate_dataset_id(dataset_id)
    metadata_path = ARTIFACT_DIR / f"{dataset_id}_metadata.json"

    if not metadata_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Dataset metadata not found.",
        )

    try:
        with open(metadata_path, "r", encoding="utf-8") as file:
            return json.load(file)

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve dataset metadata.",
        )


# -------------------------
# Conversational Intelligence
# -------------------------

@app.post("/api/chat/query")
def chat_query(request: ChatRequest):
    dataset_id = validate_dataset_id(request.dataset_id)
    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    dataset_path = get_dataset_path(
        dataset_id,
        request.dataset_version,
    )

    session = load_chat_session(
        request.session_id,
        dataset_id,
    )

    try:
        df = pd.read_csv(dataset_path)

        # Pass earlier messages to the planner.
        # This enables contextual follow-up questions.
        plan = build_query_plan(
            question,
            conversation_history=session["messages"],
        )

        validated_plan = validate_query_plan(plan)

        execution = execute_query_plan(
            df=df,
            plan=validated_plan,
            dataset_id=dataset_id,
            dataset_version=request.dataset_version,
        )

        if validated_plan["operation"] == "top_products_by_stock":
            parameters = validated_plan["parameters"]
            offset = parameters["offset"]
            limit = parameters["limit"]

            if offset:
                answer = (
                    f"Here are the next {len(execution['result'])} "
                    f"products by stock, starting after the first "
                    f"{offset} results."
                )
            else:
                answer = (
                    f"Here are the top {len(execution['result'])} "
                    "products by stock."
                )
        else:
            answer = "Your retail query was executed successfully."

        response = {
            "success": True,
            "answer": answer,
            "plan": validated_plan,
            "result": execution["result"],
            "evidence": execution["evidence"],
        }

        append_chat_message(session, "user", question)
        append_chat_message(session, "assistant", response)
        save_chat_session(session)

        return {
            "session_id": session["session_id"],
            "dataset_id": dataset_id,
            **response,
        }

    except UnsupportedQuestionError as exc:
        refusal = str(exc)

        append_chat_message(session, "user", question)
        append_chat_message(session, "assistant", {
            "success": False,
            "answer": refusal,
        })
        save_chat_session(session)

        raise HTTPException(
            status_code=422,
            detail={
                "message": refusal,
                "session_id": session["session_id"],
            },
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Could not process chat query.",
        )


# -------------------------
# Chat Session History
# -------------------------

@app.get("/api/chat/sessions/{session_id}")
def get_chat_session(session_id: str):
    try:
        session_id = str(UUID(session_id))
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(
            status_code=400,
            detail="Invalid chat session ID.",
        )

    session_path = CHAT_SESSION_DIR / f"{session_id}.json"

    if not session_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Chat session not found.",
        )

    try:
        with open(session_path, "r", encoding="utf-8") as file:
            return json.load(file)

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve chat session.",
        )
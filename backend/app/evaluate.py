
import argparse
import json
import math
from pathlib import Path
from typing import Any

import pandas as pd

from app.services.chat_service import (
    UnsupportedQuestionError,
    build_query_plan,
    execute_query_plan,
    validate_query_plan,
)


PROJECT_DIR = Path(__file__).resolve().parent.parent

DEFAULT_DATASET = (
    PROJECT_DIR
    / "artifacts"
    / "7f293f11-0fe7-4fc2-af84-55dc7c3434bc_cleaned.csv"
)


def values_match(actual: Any, expected: Any) -> bool:
    """Compare nested results with floating-point tolerance."""

    if isinstance(expected, dict):
        if not isinstance(actual, dict):
            return False

        return (
            actual.keys() == expected.keys()
            and all(
                values_match(actual[key], expected[key])
                for key in expected
            )
        )

    if isinstance(expected, list):
        if not isinstance(actual, list):
            return False

        return (
            len(actual) == len(expected)
            and all(
                values_match(a, e)
                for a, e in zip(actual, expected)
            )
        )

    if isinstance(expected, (int, float)) and not isinstance(expected, bool):
        if not isinstance(actual, (int, float)):
            return False

        return math.isclose(
            float(actual),
            float(expected),
            rel_tol=1e-6,
            abs_tol=0.01,
        )

    return actual == expected


def evaluate_case(
    case: dict[str, Any],
    df: pd.DataFrame,
    dataset_id: str,
) -> dict[str, Any]:

    case_id = case.get("id", "UNKNOWN")
    question = case.get("question", "")
    expected_operation = case.get("expected_operation")
    expected_result = case.get("expected_result")

    try:
        plan = build_query_plan(question)

        if expected_operation == "unsupported":
            return {
                "case_id": case_id,
                "question": question,
                "passed": False,
                "error": "Expected this question to be refused.",
            }

        validated_plan = validate_query_plan(plan)

        if validated_plan["operation"] != expected_operation:
            return {
                "case_id": case_id,
                "question": question,
                "passed": False,
                "expected_operation": expected_operation,
                "actual_operation": validated_plan["operation"],
                "error": "Query operation did not match.",
            }

        execution = execute_query_plan(
            df=df,
            plan=validated_plan,
            dataset_id=dataset_id,
            dataset_version="cleaned",
        )

        actual_result = execution["result"]

        return {
            "case_id": case_id,
            "question": question,
            "passed": values_match(actual_result, expected_result),
            "expected_operation": expected_operation,
            "actual_operation": validated_plan["operation"],
            "expected_result": expected_result,
            "actual_result": actual_result,
            "evidence": execution["evidence"],
        }

    except UnsupportedQuestionError as error:
        passed = expected_operation == "unsupported"

        return {
            "case_id": case_id,
            "question": question,
            "passed": passed,
            "expected_operation": expected_operation,
            "actual_operation": "unsupported",
            "error": str(error),
        }

    except Exception as error:
        return {
            "case_id": case_id,
            "question": question,
            "passed": False,
            "error": str(error),
        }


def run_evaluation(
    input_path: Path,
    output_path: Path,
    artifacts_dir: Path,
) -> dict[str, Any]:

    with input_path.open("r", encoding="utf-8") as file:
        test_data = json.load(file)

    cases = test_data.get("cases")

    if not isinstance(cases, list) or not cases:
        raise ValueError("Input JSON must contain a non-empty cases list.")

    if not DEFAULT_DATASET.exists():
        raise FileNotFoundError(
            f"Cleaned dataset not found: {DEFAULT_DATASET}"
        )

    df = pd.read_csv(DEFAULT_DATASET)

    results = [
        evaluate_case(
            case=case,
            df=df,
            dataset_id="evaluation_sample",
        )
        for case in cases
    ]

    total = len(results)
    passed = sum(result["passed"] for result in results)
    failed = total - passed

    report = {
        "summary": {
            "total_cases": total,
            "passed": passed,
            "failed": failed,
            "pass_rate": round(passed / total * 100, 2),
        },
        "results": results,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    with output_path.open("w", encoding="utf-8") as file:
        json.dump(report, file, indent=2, ensure_ascii=False)

    detailed_path = artifacts_dir / "evaluation_report.json"

    with detailed_path.open("w", encoding="utf-8") as file:
        json.dump(report, file, indent=2, ensure_ascii=False)

    print("\n=== Retail Intelligence Evaluation ===")
    print(f"Total cases : {total}")
    print(f"Passed      : {passed}")
    print(f"Failed      : {failed}")
    print(f"Pass rate   : {report['summary']['pass_rate']}%")
    print(f"\nResults saved to: {output_path}")
    print(f"Detailed report: {detailed_path}")

    return report


def main():
    parser = argparse.ArgumentParser(
        description="Evaluate retail conversational intelligence."
    )

    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--artifacts-dir", required=True)

    args = parser.parse_args()

    run_evaluation(
        input_path=Path(args.input),
        output_path=Path(args.output),
        artifacts_dir=Path(args.artifacts_dir),
    )


if __name__ == "__main__":
    main()

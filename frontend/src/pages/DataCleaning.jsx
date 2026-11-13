
import { useEffect, useState } from "react";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Database,
  RefreshCw,
  ShieldCheck,
  Tags,
} from "lucide-react";
import {
  cleanDataset,
  normalizeDataset,
} from "../services/api";

export default function DataCleaning() {
  const [dataset, setDataset] = useState(null);
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [normalizing, setNormalizing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [normalizationResult, setNormalizationResult] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("retailiq_dataset");

      if (saved) {
        const parsed = JSON.parse(saved);
        setDataset(parsed);
        setSelectedIssues(
          (parsed.issues || []).map((issue) => issue.issue_id)
        );

        const savedResult = localStorage.getItem(
          "retailiq_cleaning_result"
        );

        if (savedResult) {
          setResult(JSON.parse(savedResult));
        }

        const savedNormalization = localStorage.getItem(
          "retailiq_normalization_result"
        );

        if (savedNormalization) {
          setNormalizationResult(JSON.parse(savedNormalization));
        }
      }
    } catch {
      setError("Could not load the saved dataset information.");
    }
  }, []);

  const issues = dataset?.issues || [];

  const toggleIssue = (issueId) => {
    setSelectedIssues((current) =>
      current.includes(issueId)
        ? current.filter((id) => id !== issueId)
        : [...current, issueId]
    );
  };

  const handleCleaning = async () => {
    if (!dataset?.dataset_id || selectedIssues.length === 0) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await cleanDataset(
        dataset.dataset_id,
        selectedIssues
      );

      setResult(response);

      try {
        localStorage.setItem(
          "retailiq_cleaning_result",
          JSON.stringify(response)
        );

        const updatedDataset = {
          ...dataset,
          cleaning_result: response,
          active_version: "cleaned",
        };

        localStorage.setItem(
          "retailiq_dataset",
          JSON.stringify(updatedDataset)
        );

        setDataset(updatedDataset);
      } catch {
        setError(
          "Cleaning succeeded, but the result could not be saved in browser storage."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Cleaning failed. Please check the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNormalization = async () => {
    if (!dataset?.dataset_id) return;

    setNormalizing(true);
    setError("");
    setNormalizationResult(null);

    try {
      const response = await normalizeDataset(dataset.dataset_id);

      setNormalizationResult(response);

      try {
        localStorage.setItem(
          "retailiq_normalization_result",
          JSON.stringify(response)
        );

        const updatedDataset = {
          ...dataset,
          normalization_result: response,
          active_version: "normalized",
        };

        localStorage.setItem(
          "retailiq_dataset",
          JSON.stringify(updatedDataset)
        );

        setDataset(updatedDataset);
      } catch {
        setError(
          "Normalization succeeded, but the result could not be saved in browser storage."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Normalization failed. Please check the backend."
      );
    } finally {
      setNormalizing(false);
    }
  };

  if (!dataset) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <Database size={36} className="mx-auto text-slate-400" />
        <h2 className="mt-4 text-lg font-bold text-slate-800">
          No dataset found
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Upload a CSV dataset first from the Datasets section.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div>
        <p className="text-sm font-medium text-indigo-600">
          DATA QUALITY MANAGEMENT
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Data Cleaning
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Identify data quality issues and apply selected cleaning operations.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
            <Database size={22} />
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900">
              {dataset.filename || "Uploaded dataset"}
            </h3>
            <p className="break-all text-xs text-slate-400">
              Dataset ID: {dataset.dataset_id}
            </p>

            {dataset.active_version && (
              <p className="mt-1 text-xs font-semibold text-emerald-600">
                Active version: {dataset.active_version}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-400">Total rows</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {dataset.profile?.overview?.total_rows ?? "—"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-400">Total columns</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {dataset.profile?.overview?.total_columns ?? "—"}
            </p>
          </div>

          <div className="col-span-2 rounded-xl bg-amber-50 p-4 sm:col-span-1">
            <p className="text-xs text-amber-600">Detected issues</p>
            <p className="mt-2 text-2xl font-bold text-amber-700">
              {issues.length}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Detected Data Issues
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select the issues you want the cleaning engine to resolve.
            </p>
          </div>

          {issues.length > 0 && (
            <button
              onClick={() =>
                setSelectedIssues(
                  selectedIssues.length === issues.length
                    ? []
                    : issues.map((issue) => issue.issue_id)
                )
              }
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              {selectedIssues.length === issues.length
                ? "Deselect all"
                : "Select all"}
            </button>
          )}
        </div>

        {issues.length === 0 ? (
          <div className="mt-6 rounded-xl bg-emerald-50 p-6 text-center">
            <ShieldCheck size={30} className="mx-auto text-emerald-600" />
            <p className="mt-3 font-semibold text-emerald-800">
              No detected issues
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              The profiler did not detect any supported cleaning issues.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {issues.map((issue) => {
              const selected = selectedIssues.includes(issue.issue_id);

              return (
                <label
                  key={issue.issue_id}
                  className={`flex cursor-pointer gap-4 rounded-xl border p-4 transition ${
                    selected
                      ? "border-indigo-300 bg-indigo-50/50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleIssue(issue.issue_id)}
                    className="mt-1 h-4 w-4 accent-indigo-600"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-800">
                        {issue.issue_id.replaceAll("_", " ")}
                      </h3>

                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                        {issue.risk || "Review"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      {issue.reason || "Data quality issue detected."}
                    </p>

                    <p className="mt-2 text-xs text-indigo-600">
                      Suggested action:{" "}
                      {issue.suggested_action || "Review this issue"}
                    </p>

                    {issue.count !== undefined && (
                      <p className="mt-2 text-xs text-slate-400">
                        Affected records: {issue.count}
                      </p>
                    )}
                  </div>

                  <AlertTriangle
                    size={19}
                    className="shrink-0 text-amber-500"
                  />
                </label>
              );
            })}
          </div>
        )}

        <button
          onClick={handleCleaning}
          disabled={loading || normalizing || selectedIssues.length === 0}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Cleaning dataset...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Clean Selected Issues ({selectedIssues.length})
            </>
          )}
        </button>

        <div className="my-6 border-t border-slate-100" />

        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
              <Tags size={21} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Retail Data Normalization
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Standardize product names and category labels.
              </p>
            </div>
          </div>

          <button
            onClick={handleNormalization}
            disabled={normalizing || loading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {normalizing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Normalizing data...
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                Normalize Categories
              </>
            )}
          </button>

          <p className="mt-2 text-xs text-slate-400">
            This operation creates a normalized dataset without changing the original CSV.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {result && (
        <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={25} className="text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-900">
                Cleaning request completed
              </h3>
              <p className="text-sm text-slate-500">
                Cleaning result saved in browser storage.
              </p>
            </div>
          </div>

          <pre className="mt-5 max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
            {JSON.stringify(result, null, 2)}
          </pre>

          <button
            onClick={() => window.location.reload()}
            className="mt-4 flex items-center gap-2 text-sm font-semibold text-indigo-600"
          >
            <RefreshCw size={16} />
            Refresh page
          </button>
        </div>
      )}

      {normalizationResult && (
        <div className="rounded-2xl border border-violet-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={25} className="text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-900">
                Normalization completed
              </h3>
              <p className="text-sm text-slate-500">
                Normalization response saved in browser storage.
              </p>
            </div>
          </div>

          <pre className="mt-5 max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
            {JSON.stringify(normalizationResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

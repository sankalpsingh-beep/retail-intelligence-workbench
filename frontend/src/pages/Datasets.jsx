
import { useRef, useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { uploadDataset } from "../services/api";

export default function Datasets() {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataset, setDataset] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    setError("");
    setDataset(null);

    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setFile(null);
      setError("Please select a CSV file.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setFile(null);
      setError("File size must not exceed 10 MB.");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError("");
    setDataset(null);

    try {
      const result = await uploadDataset(file);

      localStorage.setItem(
        "retailiq_dataset",
        JSON.stringify(result)
      );

      setDataset(result);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Upload failed. Please check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div>
        <p className="text-sm font-medium text-indigo-600">
          DATA MANAGEMENT
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Upload Dataset
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Import your retail CSV data to begin profiling, cleaning and analysis.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const droppedFile = event.dataTransfer.files?.[0];

            if (droppedFile) {
              handleFileChange({ target: { files: [droppedFile] } });
            }
          }}
          className="flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 px-5 text-center transition hover:border-indigo-400 hover:bg-indigo-50"
        >
          <div className="rounded-2xl bg-white p-4 text-indigo-600 shadow-sm">
            <UploadCloud size={32} />
          </div>

          <h2 className="mt-5 text-lg font-semibold text-slate-800">
            Drop your CSV file here
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            or click to browse files from your computer
          </p>

          <span className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
            Browse CSV files
          </span>

          <p className="mt-4 text-xs text-slate-400">
            CSV format · Maximum file size 10 MB
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {file && (
          <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
                <FileSpreadsheet size={22} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {file.name}
                </p>
                <p className="text-xs text-slate-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setDataset(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        )}

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <button
          disabled={!file || loading}
          onClick={handleUpload}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Uploading dataset...
            </>
          ) : (
            <>
              <UploadCloud size={18} />
              Upload and Profile Dataset
            </>
          )}
        </button>
      </div>

      {dataset && (
        <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-600" size={24} />
            <div>
              <h3 className="font-bold text-slate-900">
                Dataset uploaded successfully!
              </h3>
              <p className="text-sm text-slate-500">
                Your dataset has been processed by the backend.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">Dataset ID</p>
              <p className="mt-2 break-all text-sm font-medium text-slate-700">
                {dataset.dataset_id}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">Rows uploaded</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {dataset.profile?.overview?.total_rows ?? "—"}
              </p>
            </div>
          </div>

          <pre className="mt-4 max-h-64 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
            {JSON.stringify(dataset, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

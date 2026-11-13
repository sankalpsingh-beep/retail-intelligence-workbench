
import { useEffect, useState } from "react";
import {
  BarChart3,
  Package,
  Layers3,
  IndianRupee,
  Boxes,
  AlertTriangle,
  RefreshCw,
  Loader2,
  TrendingUp,
  Database,
} from "lucide-react";
import api from "../services/api";

export default function Analytics() {
  const [dataset, setDataset] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    try {
      const saved = localStorage.getItem("retailiq_dataset");

      if (!saved) {
        setError("Please upload a dataset before viewing analytics.");
        return;
      }

      const parsed = JSON.parse(saved);
      setDataset(parsed);

      if (!parsed.dataset_id) {
        setError("Dataset ID is missing. Please upload your CSV again.");
        return;
      }

      setLoading(true);
      setError("");

      const response = await api.post("/api/datasets/analytics", {
        dataset_id: parsed.dataset_id,
      });

      const payload = response.data.analytics || response.data;

      // Backend returns summary, category_summary and top_products_by_stock.
      setAnalytics({
        summary: payload.summary || {},
        category_summary: payload.category_summary || [],
        top_products_by_stock: payload.top_products_by_stock || [],
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to generate analytics. Please check your backend."
      );
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const formatNumber = (value) =>
    Number(value ?? 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });

  const summary = analytics?.summary || {};

  const metricCards = [
    {
      title: "Total Products",
      value: formatNumber(summary.total_products),
      icon: Package,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Categories",
      value: formatNumber(summary.total_categories),
      icon: Layers3,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Average Price",
      value:
        summary.average_price == null
          ? "—"
          : `₹${formatNumber(summary.average_price)}`,
      icon: IndianRupee,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Total Stock",
      value: formatNumber(summary.total_inventory_units),
      icon: Boxes,
      color: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-indigo-600">
            RETAIL INTELLIGENCE
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Analytics Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Understand your products, inventory and category performance.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          Refresh analytics
        </button>
      </div>

      {dataset && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
            <Database size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800">
              {dataset.filename || "Uploaded retail dataset"}
            </p>
            <p className="break-all text-xs text-slate-400">
              Dataset ID: {dataset.dataset_id}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle size={19} className="mt-0.5 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {loading && !analytics && (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Loader2 size={35} className="animate-spin text-indigo-600" />
          <p className="mt-4 font-semibold text-slate-800">
            Generating retail analytics...
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Processing your dataset.
          </p>
        </div>
      )}

      {analytics && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((metric) => {
              const Icon = metric.icon;

              return (
                <div
                  key={metric.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                      {metric.title}
                    </p>
                    <div className={`rounded-xl p-3 ${metric.color}`}>
                      <Icon size={21} />
                    </div>
                  </div>
                  <p className="mt-4 text-2xl font-bold text-slate-900">
                    {metric.value}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                  <TrendingUp size={21} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">
                    Inventory Overview
                  </h2>
                  <p className="text-xs text-slate-500">
                    Estimated inventory value and stock quality
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    Total Inventory Value
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    ₹{formatNumber(summary.total_inventory_value)}
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-sm text-amber-700">
                    Products with Missing Stock
                  </p>
                  <p className="mt-2 text-2xl font-bold text-amber-800">
                    {formatNumber(summary.products_with_missing_stock)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                  <BarChart3 size={21} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">
                    Category Summary
                  </h2>
                  <p className="text-xs text-slate-500">
                    Product distribution across categories
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {analytics.category_summary.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No category information available.
                  </p>
                ) : (
                  analytics.category_summary.map((category, index) => (
                    <div
                      key={`${category.category}-${index}`}
                      className="rounded-xl bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-800">
                          {category.category || "Uncategorized"}
                        </p>
                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                          {formatNumber(category.product_count)} products
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                        <span>
                          Average price: ₹
                          {formatNumber(category.average_price)}
                        </span>
                        <span>
                          Stock: {formatNumber(category.total_stock)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                <Package size={21} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">
                  Top Products by Stock
                </h2>
                <p className="text-xs text-slate-500">
                  Products ranked by available inventory
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[350px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-400">
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 text-right font-medium">Price</th>
                    <th className="pb-3 text-right font-medium">Stock</th>
                  </tr>
                </thead>

                <tbody>
                  {analytics.top_products_by_stock.map(
                    (product, index) => (
                      <tr
                        key={`${product.product}-${index}`}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-4 font-semibold text-slate-800">
                          {product.product || "Unnamed product"}
                        </td>
                        <td className="py-4 text-right text-slate-600">
                          ₹{formatNumber(product.price)}
                        </td>
                        <td className="py-4 text-right font-semibold text-slate-800">
                          {formatNumber(product.stock)}
                        </td>
                      </tr>
                    )
                  )}

                  {analytics.top_products_by_stock.length === 0 && (
                    <tr>
                      <td
                        colSpan="3"
                        className="py-6 text-center text-slate-500"
                      >
                        No product records available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

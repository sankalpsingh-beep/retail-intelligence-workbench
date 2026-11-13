
import { useState } from "react";
import {
  LayoutDashboard,
  Database,
  Sparkles,
  ChartNoAxesCombined,
  MessageSquare,
  Settings,
  Bell,
  Search,
  UploadCloud,
  ArrowUpRight,
  Package,
  Boxes,
  IndianRupee,
  Activity,
  Menu,
  X,
} from "lucide-react";

import DataCleaning from "./pages/DataCleaning";
import Datasets from "./pages/Datasets";
import Analytics from "./pages/Analytics";
import AIAssistant from "./pages/AIAssistant";

const navigation = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Datasets", icon: Database },
  { name: "Data Cleaning", icon: Sparkles },
  { name: "Analytics", icon: ChartNoAxesCombined },
  { name: "AI Assistant", icon: MessageSquare },
];

function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const metrics = [
    { title: "Total Products", value: "—", description: "Upload a dataset", icon: Package },
    { title: "Categories", value: "—", description: "Upload a dataset", icon: Boxes },
    { title: "Inventory Value", value: "—", description: "Upload a dataset", icon: IndianRupee },
    { title: "Data Quality", value: "—", description: "Upload a dataset", icon: Activity },
  ];

  const isOverview = activePage === "Overview";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <ChartNoAxesCombined size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                RetailIQ
              </h1>
              <p className="text-xs text-slate-400">Intelligence Workbench</p>
            </div>
          </div>

          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-7">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = activePage === item.name;

              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActivePage(item.name);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon size={19} />
                  {item.name}

                  {active && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-indigo-600" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-slate-100 p-4">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500 hover:bg-slate-50">
            <Settings size={19} />
            Settings
          </button>

          <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              R
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Retail Workspace
              </p>
              <p className="text-xs text-slate-400">Free workspace</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={21} />
            </button>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {activePage}
              </h2>
              <p className="hidden text-xs text-slate-400 sm:block">
                AI-powered retail data intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
              <Search size={16} className="text-slate-400" />
              <span className="text-sm text-slate-400">Search workspace...</span>
              <span className="rounded bg-white px-1.5 py-0.5 text-xs text-slate-400">
                /
              </span>
            </div>

            <button
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-500" />
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl p-5 sm:p-8">
          {isOverview ? (
            <div className="space-y-8">
              <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-medium text-indigo-600">
                    WORKSPACE OVERVIEW
                  </p>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Good to see you!
                  </h1>
                  <p className="mt-2 text-sm text-slate-500">
                    Upload your retail data to start discovering insights.
                  </p>
                </div>

                <button
                  onClick={() => setActivePage("Datasets")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
                >
                  <UploadCloud size={18} />
                  Upload Dataset
                  <ArrowUpRight size={16} />
                </button>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => {
                  const Icon = metric.icon;

                  return (
                    <div
                      key={metric.title}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">
                          {metric.title}
                        </p>
                        <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                          <Icon size={19} />
                        </div>
                      </div>

                      <h3 className="mt-5 text-3xl font-bold text-slate-900">
                        {metric.value}
                      </h3>
                      <p className="mt-2 text-xs text-slate-400">
                        {metric.description}
                      </p>
                    </div>
                  );
                })}
              </section>

              <section className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                  <h3 className="font-bold text-slate-900">Retail Analytics</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Your dataset insights will appear here.
                  </p>

                  <div className="flex min-h-64 flex-col items-center justify-center text-center">
                    <div className="rounded-2xl bg-indigo-50 p-4 text-indigo-500">
                      <ChartNoAxesCombined size={32} />
                    </div>
                    <p className="mt-4 font-semibold text-slate-700">
                      Analytics will appear here
                    </p>
                    <p className="mt-1 max-w-sm text-sm text-slate-400">
                      Upload a retail CSV file to explore product performance,
                      category distribution and inventory insights.
                    </p>
                    <button
                      onClick={() => setActivePage("Analytics")}
                      className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Open Analytics
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-violet-50 p-2 text-violet-600">
                      <Sparkles size={19} />
                    </div>
                    <h3 className="font-bold text-slate-900">AI Intelligence</h3>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-500">
                    Ask questions about your retail data and get answers backed
                    by structured query execution and evidence.
                  </p>

                  <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
                    <MessageSquare size={22} className="text-indigo-500" />
                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      Your AI assistant is waiting
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Upload a dataset to begin asking questions.
                    </p>
                  </div>

                  <button
                    onClick={() => setActivePage("AI Assistant")}
                    className="mt-5 w-full rounded-xl border border-indigo-200 py-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
                  >
                    Open AI Assistant
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                    <Database size={21} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Get started with your data
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Your workspace is ready. Upload your first retail dataset.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActivePage("Datasets")}
                  className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Explore datasets
                </button>
              </section>
            </div>
          ) : activePage === "Datasets" ? (
            <Datasets />
          ) : activePage === "Data Cleaning" ? (
            <DataCleaning />
          ) : activePage === "Analytics" ? (
            <Analytics />
          ) : activePage === "AI Assistant" ? (
            <AIAssistant />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <h3 className="text-lg font-bold text-slate-900">
                {activePage}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                This workspace section will be implemented next.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

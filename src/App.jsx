import { useState } from "react";
import data from "./data/comparison.json";
import { generateFinalJson, generateAutoMerge } from "./utils/mergeUtils";

import UploadPanel from "./components/UploadPanel/UploadPanel";
import WinnerSummary from "./components/WinnerSummary/WinnerSummary";
import DifferencesView from "./components/DifferencesView/DifferencesView";
import CombinedAnalysis from "./components/CombinedAnalysis/CombinedAnalysis";
import MergePanel from "./components/MergePanel/MergePanel";
import ErrorBoundary from "./components/common/ErrorBoundary";

const tabs = ["Summary", "Differences", "Merge"];

const App = () => {
  const [mergeState, setMergeState] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [appData, setAppData] = useState(data);
  const [activeTab, setActiveTab] = useState("Summary");
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [autoMergeResult, setAutoMergeResult] = useState(null);
  const [selectedModelMap, setSelectedModelMap] = useState({});

  const currentData = appData;
  const manualFinalJson = generateFinalJson(
    currentData?.comparison?.combined_analysis || {},
    mergeState,
  );
  const finalJson = autoMergeResult || manualFinalJson;

  const hasValidData = currentData && currentData.comparison && (
    currentData.comparison.differences ||
    currentData.comparison.combined_analysis ||
    currentData.comparison.winner_overall
  );

  const handleResetMerge = () => {
    setMergeState({});
    setSelectedModelMap({});
    setAutoMergeResult(null);
  };

  const handleManualSelect = (model, value) => {
    setAutoMergeResult(null);
    setMergeState((prev) => ({
      ...prev,
      cost: value,
    }));
    setSelectedModelMap((prev) => ({
      ...prev,
      cost: model,
    }));
  };

  const handleAutoMerge = () => {
    setLoading(true);
    setTimeout(() => {
      try {
        const bestModel =
          currentData?.comparison?.differences?.machinery_differences?.cost_conflicts?.[0]?.most_realistic ||
          currentData?.comparison?.winner_overall;

        const costObj =
          currentData?.comparison?.differences?.cost_estimation_differences?.total_project_cost;

        const bestValue = costObj?.[bestModel];

        setMergeState({
          cost: bestValue,
        });

        setSelectedModelMap({
          cost: bestModel,
        });

        const result = generateAutoMerge(currentData);
        if (result) {
          setAutoMergeResult(result);
          setActiveTab("Merge");
        }
      } catch (error) {
        console.error("Auto merge error:", error);
      }
      setLoading(false);
    }, 1200);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(finalJson, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "merged-output.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="loader-container">
          <div className="spinner"></div>
          <p className="mt-4 text-slate-300">Processing data...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-8 overflow-hidden rounded-[2rem] border border-slate-800/80 bg-slate-900/90 p-6 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.95)] backdrop-blur-xl">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.28em] text-sky-400/80">AI JSON Merge Tool</p>
                <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Smart JSON comparison and merge</h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
                  Upload one JSON file, explore model differences, and generate a polished merged output with intelligent recommendations.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-start gap-3">
                <button
                  type="button"
                  onClick={handleAutoMerge}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition duration-200 hover:-translate-y-0.5 hover:brightness-110"
                >
                  Auto Merge Best
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-100 transition duration-200 hover:border-slate-500 hover:bg-slate-700"
                >
                  Download JSON
                </button>
              </div>
            </div>
          </header>

          <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
            <aside className="space-y-6">
              <div className="rounded-[2rem] border border-slate-800/70 bg-slate-900/90 p-5 shadow-xl shadow-slate-950/30">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-sky-400/80">Workspace</p>
                    <h2 className="mt-2 text-lg font-semibold text-white">Navigation</h2>
                  </div>
                </div>
                <nav className="space-y-3">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`w-full rounded-3xl px-4 py-3 text-left text-sm font-semibold transition duration-200 ${
                        activeTab === tab
                          ? "bg-gradient-to-r from-sky-500 to-violet-500 text-slate-950 shadow-lg shadow-sky-500/20"
                          : "bg-slate-950/80 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="rounded-[2rem] border border-slate-800/70 bg-slate-900/90 p-5 shadow-xl shadow-slate-950/30">
                <h3 className="text-sm uppercase tracking-[0.24em] text-sky-400/80">Status</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  {loading && <p>Loading JSON file...</p>}
                  {uploadError && <p className="text-rose-400">{uploadError}</p>}
                  {!uploadedFiles.length && !loading && !uploadError && (
                    <p>Upload JSON to start or use the default sample data.</p>
                  )}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-slate-400">Uploaded file:</p>
                      <p className="rounded-2xl bg-slate-950/80 px-3 py-2 text-sm text-slate-200">{uploadedFiles[0]?.name ?? "Unknown"}</p>
                    </div>
                  )}
                </div>
              </div>
            </aside>

            <main className="space-y-6">
              <UploadPanel
                uploadedFiles={uploadedFiles}
                loading={loading}
                error={uploadError}
                setUploadedFiles={setUploadedFiles}
                setAppData={setAppData}
                setLoading={setLoading}
                setUploadError={setUploadError}
                defaultData={data}
              />

              <section className="rounded-[2rem] border border-slate-800/70 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/30">
                 {activeTab === "Summary" && (
                   <div className="space-y-6">
                     <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
                       <WinnerSummary data={hasValidData ? currentData : {}} />
                       <CombinedAnalysis data={hasValidData ? currentData : {}} />
                     </div>
                   </div>
                 )}

                 {activeTab === "Differences" && (
                    <DifferencesView
                      data={hasValidData ? currentData : {}}
                      mergeState={mergeState}
                      selectedModelMap={selectedModelMap}
                      onManualSelect={handleManualSelect}
                    />
                 )}

                {activeTab === "Merge" && (
                  <MergePanel
                    mergeState={mergeState}
                    finalJson={finalJson}
                    onReset={handleResetMerge}
                    onAutoMerge={handleAutoMerge}
                    selectedModelMap={selectedModelMap}
                  />
                )}
              </section>
            </main>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;

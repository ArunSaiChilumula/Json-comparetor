import { useState } from "react";
import { motion } from "framer-motion";
import data from "./data/comparison.json";
import { generateFinalJson, generateAutoMerge, hasValidData } from "./utils/mergeUtils";

import UploadPanel from "./components/UploadPanel/UploadPanel";
import WinnerSummary from "./components/WinnerSummary/WinnerSummary";
import DifferencesView from "./components/DifferencesView/DifferencesView";
import CombinedAnalysis from "./components/CombinedAnalysis/CombinedAnalysis";
import MergePanel from "./components/MergePanel/MergePanel";
import ErrorBoundary from "./components/common/ErrorBoundary";

const tabs = ["Summary", "Differences", "Merge"];

const App = () => {
  const [mergeState, setMergeState] = useState({
    cost: null,
    process_flow: null,
    machinery_list: null,
    materials: null,
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [appData, setAppData] = useState(data);
  const [activeTab, setActiveTab] = useState("Summary");
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [autoMergeResult, setAutoMergeResult] = useState(null);
  const [selectedModelMap, setSelectedModelMap] = useState({
    cost: null,
    process_flow: null,
    machinery: null,
    materials: null,
  });

  const currentData = appData;
  const manualFinalJson = generateFinalJson(
    currentData?.comparison?.combined_analysis || {},
    mergeState,
    currentData,
  );
  const finalJson = autoMergeResult || manualFinalJson;

  const isValidDataAvailable = currentData && currentData.comparison && (
    currentData.comparison.differences ||
    currentData.comparison.combined_analysis ||
    currentData.comparison.winner_overall
  );

  const handleResetMerge = () => {
    setMergeState({
      cost: null,
      process_flow: null,
      machinery_list: null,
      materials: null,
    });
    setSelectedModelMap({
      cost: null,
      process_flow: null,
      machinery: null,
      materials: null,
    });
    setAutoMergeResult(null);
  };

  const handleManualSelect = (section, model, value) => {
    setAutoMergeResult(null);

    setMergeState((prev) => ({
      ...prev,
      [section]: value,
    }));
    setSelectedModelMap({
      cost: section === "cost" ? model : null,
      process_flow: section === "process_flow" ? model : null,
      machinery: section === "machinery_list" ? model : null,
      materials: section === "materials" ? model : null,
    });
  };

  const handleAutoMerge = () => {
    setLoading(true);
    setTimeout(() => {
      try {
        const result = generateAutoMerge(currentData);
        if (result) {
          const combined = currentData?.comparison?.combined_analysis;

          // 🔥 STRICT CHECK
          if (!hasValidData(currentData)) {
            setMergeState({
              process_flow: [],
              machinery_list: [],
              materials: [],
              cost: null
            });

              setSelectedModelMap({
                cost: null,
                process_flow: null,
                machinery: null,
                materials: null,
              });

            setAutoMergeResult(result);
            setActiveTab("Merge");
            setLoading(false);
            return; // 🚨 MUST STOP HERE
          }

          // ✅ ONLY AFTER this, assign models based on actual data
          const ai = currentData?.comparison?.explainable_ai || {};

          setMergeState({
            cost: combined?.cost_estimation?.total_project_cost || null,
            process_flow: combined?.process_flow || [],
            machinery_list: combined?.machinery_list || [],
            materials:
              Array.isArray(combined?.materials) && combined.materials.length > 0
                ? combined.materials
                : "No data available",
          });

          setSelectedModelMap({
            cost: ai?.cost_estimation?.taken_from || null,
            process_flow: ai?.process_flow?.taken_from || null,
            machinery: ai?.machinery_list?.taken_from || null,
            materials: ai?.materials?.taken_from || null,
          });

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
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-gray-600 border-t-green-400 rounded-full animate-spin"></div>
          <p className="text-slate-300 text-sm font-medium">Analyzing and merging data...</p>
        </div>
      </motion.div>
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
              <WinnerSummary data={isValidDataAvailable ? currentData : {}} />
                        <CombinedAnalysis data={isValidDataAvailable ? currentData : {}} />
                     </div>
                   </div>
                 )}

                 {activeTab === "Differences" && (
                    <DifferencesView
                      data={hasValidData(currentData) ? currentData : {}}
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
                     data={currentData}
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

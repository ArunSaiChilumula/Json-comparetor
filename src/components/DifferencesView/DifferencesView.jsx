import { useState } from "react";
import { motion } from "framer-motion";
import { formatCurrency, getSelectionReason, hasValidData } from "../../utils/mergeUtils";

const BestModelBadge = ({ model, winner, mostRealistic }) => {
  if (model === mostRealistic) {
    return <motion.span className="text-xs px-2 py-1 bg-yellow-500 text-black rounded" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>Best</motion.span>;
  }
  if (model === winner) {
    return <motion.span className="text-xs px-2 py-1 bg-emerald-500/10 px-3 py-1 text-emerald-300 rounded" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>Recommended</motion.span>;
  }
  return null;
};

const DifferencesView = ({ data, mergeState, selectedModelMap = {}, onManualSelect }) => {
  const comparison = data?.comparison ?? {};
  const differences = comparison?.differences ?? {};
  const costValues = differences?.cost_estimation_differences?.total_project_cost ?? {};
  const winner = comparison?.winner_overall;
  const bestValue = winner ? costValues[winner] : null;
  const mostRealistic = comparison?.differences?.machinery_differences?.cost_conflicts?.[0]?.most_realistic || null;
  const stepCount = differences?.process_flow_differences?.step_count ?? {};
  const uniqueSteps = differences?.process_flow_differences?.unique_steps ?? [];
  const costConflicts = differences?.machinery_differences?.cost_conflicts ?? [];
  const [showPopup, setShowPopup] = useState(false);
  const [lastSelected, setLastSelected] = useState(null);

  if (!data || Object.keys(data).length === 0) {
    return (
      <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <motion.div className="rounded-[2rem] border border-slate-800/70 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <p className="text-slate-500">No data available for this section</p>
        </motion.div>
      </motion.div>
    );
  }

  if (!comparison || Object.keys(comparison).length === 0) {
    return (
      <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <motion.div className="rounded-[2rem] border border-slate-800/70 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <p className="text-slate-500">No data available for this section</p>
        </motion.div>
      </motion.div>
    );
  }

  if (!differences || Object.keys(differences).length === 0) {
    return (
      <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <motion.div className="rounded-[2rem] border border-slate-800/70 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <p className="text-slate-500">No data available for this section</p>
        </motion.div>
      </motion.div>
    );
  }

  const handleSelect = (section, model, value) => {
    if (value === undefined || value === null) {
      return;
    }
    if (!hasValidData(data)) {
      return;
    }
    setLastSelected({ model, value, section });
    setShowPopup(true);
    onManualSelect(section, model, value);
    setTimeout(() => setShowPopup(false), 3000);
  };

  const getSelectedModel = (section) => {
    const selected = selectedModelMap[section];
    if (typeof selected === "string") {
      return selected;
    }

    if (section === "machinery_list" && selected && typeof selected === "object") {
      const values = Object.values(selected).filter(Boolean);
      if (values.length === 0) {
        return null;
      }
      const counts = values.reduce((acc, model) => {
        acc[model] = (acc[model] || 0) + 1;
        return acc;
      }, {});
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    }

    return null;
  };

  const selectedCostModel = getSelectedModel("cost");
  const selectedProcessFlowModel = getSelectedModel("process_flow");
  const selectedMachineryModel = getSelectedModel("machinery_list");
  const selectedMaterialsModel = getSelectedModel("materials");

  const options = [
    { key: "deepseek", label: "Deepseek", value: costValues.deepseek ?? 0 },
    { key: "gpt", label: "GPT", value: costValues.gpt ?? 0 },
    { key: "gemini", label: "Gemini", value: costValues.gemini ?? 0 },
  ];

  return (
    <div className="space-y-6">
      {showPopup && lastSelected && (
        <motion.div className="fixed top-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-2xl shadow-emerald-500/10 backdrop-blur-md animate-in slide-in-from-right-1 fade-in duration-300" initial={{ opacity: 0, x: 50, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 0.3, type: "spring" }}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
            <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-300">Selection Applied</p>
            <p className="mt-1 text-sm text-slate-400">
              {lastSelected.model.toUpperCase()} - {formatCurrency(lastSelected.value)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {lastSelected.section === 'cost' && 'Total project cost'}
              {lastSelected.section === 'process_flow' && 'Process flow'}
              {lastSelected.section === 'machinery_list' && 'Machinery list'}
              {lastSelected.section === 'materials' && 'Materials'}
              {' option selected successfully'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPopup(false)}
            className="-mr-1 -mt-1 shrink-0 rounded-full p-1 text-slate-500/60 hover:bg-slate-800/50 hover:text-slate-300"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </motion.div>
      )}
      <motion.div className="rounded-[2rem] border border-slate-800/70 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-sky-400/80">Differences</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Model comparison overview</h2>
          </div>
              <motion.button
               type="button"
               onClick={() => handleSelect("cost", winner, bestValue)}
               disabled={!bestValue}
               className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
             >
               Apply Recommended Cost
             </motion.button>
        </div>

        <div className="mt-6 grid gap-4">
          <details className="group rounded-[1.75rem] border border-slate-800 bg-slate-900/80 p-4 transition hover:border-slate-700">
            <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-slate-100">
              Process flow details
              <span className="text-slate-400 transition duration-200 group-open:rotate-180">▼</span>
            </summary>
          {Object.keys(stepCount).length === 0 ? (
            <motion.p className="text-slate-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>No data available</motion.p>
          ) : (
            <motion.div className="mt-4 grid gap-3 sm:grid-cols-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
              <motion.div className="rounded-3xl bg-slate-950/80 p-4" whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}>
                <p className="text-sm text-slate-400">Deepseek</p>
                <p className="mt-2 text-base font-semibold text-white">{stepCount.deepseek}</p>
              </motion.div>
              <motion.div className="rounded-3xl bg-slate-950/80 p-4" whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}>
                <p className="text-sm text-slate-400">GPT</p>
                <p className="mt-2 text-base font-semibold text-white">{stepCount.gpt}</p>
              </motion.div>
              <motion.div className="rounded-3xl bg-slate-950/80 p-4" whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}>
                <p className="text-sm text-slate-400">Gemini</p>
                <p className="mt-2 text-base font-semibold text-white">{stepCount.gemini}</p>
              </motion.div>
            </motion.div>
          )}
          </details>

          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/80 p-4">
            <h3 className="text-sm font-semibold text-white">Unique steps</h3>
              {uniqueSteps.length === 0 ? (
                <motion.p className="text-slate-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>No data available</motion.p>
              ) : (
                <motion.div className="mt-4 space-y-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
                  {uniqueSteps.map((step, index) => (
                    <motion.div key={index} className="rounded-3xl border border-slate-800/90 bg-slate-950/80 p-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }} whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}>
                      <p className="font-semibold text-slate-100">{step?.step_name ?? "Unnamed step"}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-400">
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-300">Present: {(step?.present_in ?? []).join(", ") || "N/A"}</span>
                        <span className="rounded-full bg-rose-500/10 px-3 py-1 text-rose-300">Missing: {(step?.absent_in ?? []).join(", ") || "N/A"}</span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
          </div>

          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/80 p-4">
            <h3 className="text-sm font-semibold text-white">Machinery cost recommendations</h3>
              {costConflicts.length === 0 ? (
                <motion.p className="text-slate-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>No data available</motion.p>
              ) : (
                <motion.div className="mt-4 space-y-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
                  {costConflicts.map((item, index) => (
                    <motion.div key={index} className="rounded-3xl border border-slate-800/90 bg-slate-950/80 p-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }} whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-semibold text-white">{item?.machine_name ?? "Unnamed machine"}</p>
                        <motion.span className="rounded-full bg-sky-500/10 px-3 py-1 text-sky-200" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}>Recommended: {item?.most_realistic ?? "N/A"}</motion.span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <motion.div className="rounded-2xl bg-slate-900/80 p-3 text-sm text-slate-300" whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}>
                          Deepseek: {formatCurrency(item?.costs?.deepseek)}
                        </motion.div>
                        <motion.div className="rounded-2xl bg-slate-900/80 p-3 text-sm text-slate-300" whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}>
                          GPT: {formatCurrency(item?.costs?.gpt)}
                        </motion.div>
                        <motion.div className="rounded-2xl bg-slate-900/80 p-3 text-sm text-slate-300" whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}>
                          Gemini: {formatCurrency(item?.costs?.gemini)}
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
          </div>

          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/80 p-4">
            <h3 className="text-sm font-semibold text-white">Total cost options</h3>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {options.map((option) => {
                  const isSelected = selectedCostModel
                    ? selectedCostModel === option.key
                    : mergeState.cost === option.value;
                  return (
                    <motion.div
                      key={option.key}
                      className={`rounded-3xl border p-4 transition ${isSelected ? "border-green-400 bg-green-900/20 shadow-lg" : "border-slate-800 bg-slate-950/80 hover:border-slate-700"}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: options.indexOf(option) * 0.1 }}
                      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-300">{option.label}</p>
                          <p className="mt-3 text-2xl font-semibold text-white">{formatCurrency(option.value)}</p>
                        </div>
                        <BestModelBadge model={option.key} winner={winner} mostRealistic={mostRealistic} />
                      </div>
                         <motion.button
                         type="button"
                         onClick={() => handleSelect("cost", option.key, option.value)}
                         className="mt-5 w-full rounded-full bg-gradient-to-r from-violet-500 to-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition duration-200 hover:-translate-y-0.5"
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                       >
                         Select
                       </motion.button>
                      <div className="mt-3 text-sm text-slate-400">
                        {isSelected
                          ? getSelectionReason("cost", data, option.key, false)
                          : option.key === winner
                          ? "Recommended based on overall winner"
                          : "Not selected"}
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/80 p-4">
            <h3 className="text-sm font-semibold text-white">Process flow options</h3>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
               {Object.entries({
                 deepseek: differences?.process_flow_differences?.step_count?.deepseek || 0,
                 gpt: differences?.process_flow_differences?.step_count?.gpt || 0,
                 gemini: differences?.process_flow_differences?.step_count?.gemini || 0,
               }).map(([key, count]) => {
                   const label = key === "deepseek" ? "Deepseek" : key === "gpt" ? "GPT" : "Gemini";
                   const isSelected = selectedProcessFlowModel
                     ? selectedProcessFlowModel === key
                     : mergeState.process_flow && mergeState.process_flow.length > 0 && mergeState.process_flow[0]?.source_model === key;
                  return (
                    <motion.div
                      key={key}
                      className={`rounded-3xl border p-4 transition ${isSelected ? "border-green-400 bg-green-900/20 shadow-lg" : "border-slate-800 bg-slate-950/80 hover:border-slate-700"}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 + Object.keys({ deepseek: 0, gpt: 1, gemini: 2 })[key === 'deepseek' ? 0 : key === 'gpt' ? 1 : 2] * 0.1 }}
                      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-300">{label}</p>
                          <p className="mt-3 text-2xl font-semibold text-white">{count} steps</p>
                        </div>
                        <BestModelBadge model={key} winner={winner} mostRealistic={mostRealistic} />
                      </div>
                      <motion.button
                        type="button"
                        onClick={() => {
                          const combined = data?.comparison?.combined_analysis || {};
                          const selectedData = (combined?.process_flow || []).filter(s => s.source_model === key);
                          handleSelect("process_flow", key, selectedData);
                        }}
                        className="mt-5 w-full rounded-full bg-gradient-to-r from-violet-500 to-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition duration-200 hover:-translate-y-0.5"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Select {label} Process Flow
                      </motion.button>
                      <div className="mt-3 text-sm text-slate-400">
                        {isSelected
                          ? getSelectionReason("process_flow", data, key, true)
                          : key === winner
                          ? "Recommended based on overall winner"
                          : "Not selected"}
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/80 p-4">
            <h3 className="text-sm font-semibold text-white">Machinery list options</h3>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
               {Object.entries({
                 deepseek: (data?.comparison?.combined_analysis?.machinery_list || []).filter(m => m.source_model === "deepseek").length,
                 gpt: (data?.comparison?.combined_analysis?.machinery_list || []).filter(m => m.source_model === "gpt").length,
                 gemini: (data?.comparison?.combined_analysis?.machinery_list || []).filter(m => m.source_model === "gemini").length,
               }).map(([key, count]) => {
                   const label = key === "deepseek" ? "Deepseek" : key === "gpt" ? "GPT" : "Gemini";
                   const isSelected = selectedMachineryModel
                     ? selectedMachineryModel === key
                     : mergeState.machinery_list && mergeState.machinery_list.length > 0 && mergeState.machinery_list[0]?.source_model === key;
                  return (
                    <motion.div
                      key={key}
                      className={`rounded-3xl border p-4 transition ${isSelected ? "border-green-400 bg-green-900/20 shadow-lg" : "border-slate-800 bg-slate-950/80 hover:border-slate-700"}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 + Object.keys({ deepseek: 0, gpt: 1, gemini: 2 })[key === 'deepseek' ? 0 : key === 'gpt' ? 1 : 2] * 0.1 }}
                      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-300">{label}</p>
                          <p className="mt-3 text-2xl font-semibold text-white">{count} machines</p>
                        </div>
                        <BestModelBadge model={key} winner={winner} mostRealistic={mostRealistic} />
                      </div>
                      <motion.button
                        type="button"
                        onClick={() => {
                          const combined = data?.comparison?.combined_analysis || {};
                          const selectedData = (combined?.machinery_list || []).filter(m => m.source_model === key);
                          handleSelect("machinery_list", key, selectedData);
                        }}
                        className="mt-5 w-full rounded-full bg-gradient-to-r from-violet-500 to-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition duration-200 hover:-translate-y-0.5"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Select {label} Machinery
                      </motion.button>
                      <div className="mt-3 text-sm text-slate-400">
                        {isSelected
                          ? getSelectionReason("machinery_list", data, key, true)
                          : key === winner
                          ? "Recommended based on overall winner"
                          : "Not selected"}
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/80 p-4">
            <h3 className="text-sm font-semibold text-white">Materials options</h3>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
               {Object.entries({
                 deepseek: (data?.comparison?.combined_analysis?.materials || []).filter(m => m.source_model === "deepseek").length,
                 gpt: (data?.comparison?.combined_analysis?.materials || []).filter(m => m.source_model === "gpt").length,
                 gemini: (data?.comparison?.combined_analysis?.materials || []).filter(m => m.source_model === "gemini").length,
               }).map(([key, count]) => {
                   const label = key === "deepseek" ? "Deepseek" : key === "gpt" ? "GPT" : "Gemini";
                   const isSelected = selectedMaterialsModel
                     ? selectedMaterialsModel === key
                     : mergeState.materials && mergeState.materials.length > 0 && mergeState.materials[0]?.source_model === key;
                  return (
                    <motion.div
                      key={key}
                      className={`rounded-3xl border p-4 transition ${isSelected ? "border-green-400 bg-green-900/20 shadow-lg" : "border-slate-800 bg-slate-950/80 hover:border-slate-700"}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.7 + Object.keys({ deepseek: 0, gpt: 1, gemini: 2 })[key === 'deepseek' ? 0 : key === 'gpt' ? 1 : 2] * 0.1 }}
                      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-300">{label}</p>
                          <p className="mt-3 text-2xl font-semibold text-white">{count} materials</p>
                        </div>
                        <BestModelBadge model={key} winner={winner} mostRealistic={mostRealistic} />
                      </div>
                      <motion.button
                        type="button"
                        onClick={() => {
                          const combined = data?.comparison?.combined_analysis || {};
                          const selectedData = (combined?.materials || []).filter(m => m.source_model === key);
                          handleSelect("materials", key, selectedData);
                        }}
                        className="mt-5 w-full rounded-full bg-gradient-to-r from-violet-500 to-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition duration-200 hover:-translate-y-0.5"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Select {label} Materials
                      </motion.button>
                      <div className="mt-3 text-sm text-slate-400">
                        {isSelected
                          ? getSelectionReason("materials", data, key, true)
                          : key === winner
                          ? "Recommended based on overall winner"
                          : "Not selected"}
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DifferencesView;

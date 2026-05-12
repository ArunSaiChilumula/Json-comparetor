import { useState } from "react";
import { motion } from "framer-motion";
import { getSelectionReason } from "../../utils/mergeUtils";

const MergePanel = ({ finalJson, onReset, onAutoMerge, selectedModelMap, data }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(finalJson || {}, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const finalData = finalJson || {};

  if (!finalJson || Object.keys(finalJson).length === 0) {
    return (
      <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-sky-400/80">Merge result</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Final merged payload</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <motion.button
              type="button"
              onClick={onAutoMerge}
              className="rounded-full bg-gradient-to-r from-violet-500 to-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition duration-200 hover:-translate-y-0.5"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Auto Merge Best
            </motion.button>
            <motion.button
              type="button"
              onClick={handleCopy}
              className="rounded-full border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-100 transition duration-200 hover:border-slate-500 hover:bg-slate-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {copied ? "Copied" : "Copy JSON"}
            </motion.button>
            <motion.button
              type="button"
              onClick={onReset}
              className="rounded-full border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-100 transition duration-200 hover:border-slate-500 hover:bg-slate-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Reset Merge
            </motion.button>
          </div>
        </div>

        <motion.div className="rounded-[1.75rem] border border-slate-800/70 bg-slate-900/90 p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <p className="text-slate-500">No data available for this section</p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-sky-400/80">Merge result</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Final merged payload</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <motion.button
            type="button"
            onClick={onAutoMerge}
            className="rounded-full bg-gradient-to-r from-violet-500 to-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition duration-200 hover:-translate-y-0.5"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Auto Merge Best
          </motion.button>
          <motion.button
            type="button"
            onClick={handleCopy}
            className="rounded-full border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-100 transition duration-200 hover:border-slate-500 hover:bg-slate-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {copied ? "Copied" : "Copy JSON"}
          </motion.button>
          <motion.button
            type="button"
            onClick={onReset}
            className="rounded-full border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-100 transition duration-200 hover:border-slate-500 hover:bg-slate-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Reset Merge
          </motion.button>
        </div>
      </div>

      <motion.div className="grid gap-6 lg:grid-cols-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <motion.div className="rounded-[1.75rem] border border-slate-800/70 bg-slate-900/90 p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}>
          <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Selection explanations</h3>
          <div className="mt-4 space-y-3">
            {Object.entries(selectedModelMap || {}).map(([section, model], index) => (
              <motion.div key={section} className="rounded-3xl border border-slate-800/70 bg-slate-900/80 p-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.35 + index * 0.05 }} whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.14em]  text-slate-300">
                      {section === "cost" ? "Cost" : section === "process_flow" ? "Process Flow" : section === "machinery_list" ? "Machinery List" : section === "materials" ? "Materials" : section}
                    </p>
                    <p className="mt-1 text-lg font-semibold  text-white">{JSON.stringify(model || {}, null, 2) || "N/A"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Reason</p>
                    <p className="mt-1 text-sm text-slate-300">
                      {getSelectionReason(section, data, model, false)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
            {Object.keys(selectedModelMap || {}).length === 0 && (
              <motion.p className="text-slate-500 text-center py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>No selections made yet</motion.p>
            )}
          </div>
        </motion.div>
      </motion.div>

      <motion.div className="rounded-[1.75rem] border border-slate-800/70 bg-slate-900/90 p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }} whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Output</p>
            <h3 className="mt-1 text-lg font-semibold text-white">JSON Preview</h3>
          </div>
          <motion.span className="rounded-full bg-slate-800/80 px-3 py-1 text-sm text-slate-300" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.5 }}>
            {Object.keys(finalData || {}).length} fields
          </motion.span>
        </div>
        <pre className="max-h-[520px] overflow-auto rounded-[1.5rem] bg-[#020617] p-4 text-sm leading-6 text-slate-200">{JSON.stringify(finalData, null, 2)}</pre>
      </motion.div>
    </motion.div>
  );
};

export default MergePanel;

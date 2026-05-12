import { motion } from "framer-motion";

const BestModelBadge = ({ model, mostRealistic }) => {
  if (model === mostRealistic) {
    return <motion.span className="text-xs px-2 py-1 bg-yellow-500 text-black rounded ml-2" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>Best</motion.span>;
  }
  return null;
};

const WinnerSummary = ({ data }) => {
  const comparison = data?.comparison || {};
  const winnerOverall = comparison?.winner_overall ?? "N/A";
  const winnerReason = comparison?.winner_reason ?? "No reason available.";
  const llmScores = comparison?.llm_scores || {};
  const mostRealistic = comparison?.differences?.machinery_differences?.cost_conflicts?.[0]?.most_realistic || null;

  if (!data || Object.keys(data).length === 0) {
    return (
      <motion.div className="rounded-[2rem] border border-slate-800/70 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <motion.p className="text-slate-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.2 }}>No data available for this section</motion.p>
      </motion.div>
    );
  }

  if (!comparison || Object.keys(comparison).length === 0) {
    return (
      <motion.div className="rounded-[2rem] border border-slate-800/70 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <motion.p className="text-slate-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.2 }}>No data available for this section</motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div className="rounded-[2rem] border border-slate-800/70 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-sky-400/80">Winner</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{String(winnerOverall).toUpperCase()}</h2>
          </div>
          <BestModelBadge model={winnerOverall} mostRealistic={mostRealistic} />
        </div>

        <motion.p className="text-sm leading-6 text-slate-400" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>{winnerReason}</motion.p>

        <div className="space-y-4">
          {Object.keys(llmScores).length === 0 ? (
            <motion.p className="text-slate-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.3 }}>No data available</motion.p>
          ) : (
            <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
              {Object.entries(llmScores).map(([model, details], index) => (
                <motion.div key={model} className="rounded-3xl border border-slate-800/70 bg-slate-900/80 p-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.35 + index * 0.1 }} whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-300">{model}</p>
                        <BestModelBadge model={model} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Score overview</p>
                    </div>
                    <motion.span className="rounded-2xl bg-slate-800 px-3 py-1 text-sm text-slate-200" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}>
                      {details?.score ?? 0}
                    </motion.span>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${details?.score ?? 0}%` }}
                      transition={{ duration: 0.8, delay: 0.5 + index * 0.1, type: "spring" }}
                    />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default WinnerSummary;

export const overridePaths = {
  cost: ["cost_estimation", "total_project_cost"],
};

const toCurrencyString = (value) => {
  if (typeof value === "number") {
    return `₹${value.toLocaleString("en-IN")}`;
  }
  return value ?? "N/A";
};

export function getBestCostValue(data) {
  const costValues = data?.comparison?.differences?.cost_estimation_differences?.total_project_cost || {};
  if (!costValues || Object.keys(costValues).length === 0) return null;

  const conflictModels = (data?.comparison?.differences?.machinery_differences?.cost_conflicts || [])
    .map((item) => item?.most_realistic)
    .filter(Boolean) || [];

  const preferredModel = conflictModels[0] || data?.comparison?.winner_overall;
  if (!preferredModel || costValues[preferredModel] === undefined) {
    return null;
  }

  return costValues[preferredModel];
}

export function generateAutoMerge(data) {
  const combined = data?.comparison?.combined_analysis || {};
  const differences = data?.comparison?.differences || {};
  const winnerOverall = data?.comparison?.winner_overall;

  const costValues = differences?.cost_estimation_differences?.total_project_cost || {};
  const machineryConflicts = differences?.machinery_differences?.cost_conflicts || [];
  const processFlow = Array.isArray(combined?.process_flow) ? [...combined.process_flow] : [];
  const materials = Array.isArray(combined?.materials) ? [...combined.materials] : [];
  const machineryList = Array.isArray(combined?.machinery_list) ? combined.machinery_list.map((item) => ({ ...item })) : [];

  const machineryModelMap = {};

  machineryConflicts.forEach((conflict) => {
    const model = conflict?.most_realistic || winnerOverall;
    if (!model) return;

    const chosenCost = conflict?.costs?.[model] ?? Object.values(conflict?.costs || {})[0];
    machineryModelMap[conflict.machine_name] = model;

    const existing = machineryList.find((machine) => machine.name === conflict.machine_name);
    if (existing) {
      existing.estimated_cost = toCurrencyString(chosenCost);
      existing.source_model = model;
      return;
    }

    machineryList.push({
      name: conflict.machine_name,
      estimated_cost: toCurrencyString(chosenCost),
      source_model: model,
    });
  });

  const uniqueSteps = differences?.process_flow_differences?.unique_steps || [];
  uniqueSteps
    .filter((step) => step?.important)
    .forEach((step) => {
      if (!processFlow.some((item) => item.step_name === step.step_name)) {
        processFlow.push(step);
      }
    });

  const uniqueMaterials = differences?.materials_differences?.unique_materials || [];
  uniqueMaterials.forEach((item) => {
    if (item?.material_name && !materials.some((material) => material.name === item.material_name)) {
      materials.push({
        name: item.material_name,
        purpose: item.purpose || "",
        quantity_per_batch: item.quantity_per_batch || "",
        monthly_requirement: item.monthly_requirement || "",
        unit_cost: item.unit_cost || "",
        monthly_cost: item.monthly_cost || "",
        source_model: item.source_model || winnerOverall || "",
      });
    }
  });

  const costModel = machineryConflicts
    .map((item) => item?.most_realistic)
    .find((model) => model && costValues[model] !== undefined) || winnerOverall;

  const selectedCost = costModel ? costValues[costModel] : undefined;

  return {
    process_flow: processFlow,
    machinery_list: machineryList,
    cost_estimation: {
      ...(combined.cost_estimation || {}),
      ...(selectedCost !== undefined ? { total_project_cost: selectedCost } : {}),
    },
    materials,
    selected_model_map: {
      cost: costModel || null,
      machinery: machineryConflicts.length ? machineryModelMap : null,
      process_flow: winnerOverall || null,
      materials: winnerOverall || null,
    },
  };
}

export function generateFinalJson(baseData, mergeState) {
  if (!baseData || typeof baseData !== "object") {
    return {};
  }

  if (!mergeState || Object.keys(mergeState).length === 0) {
    return baseData;
  }

  const merged = JSON.parse(JSON.stringify(baseData));

  Object.entries(mergeState).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    const path = overridePaths[key];
    if (!path) {
      return;
    }

    let pointer = merged;
    for (let i = 0; i < path.length - 1; i += 1) {
      const segment = path[i];
      if (pointer[segment] === undefined || pointer[segment] === null) {
        pointer[segment] = {};
      }
      pointer = pointer[segment];
    }

    pointer[path[path.length - 1]] = value;
  });

  return merged;
}

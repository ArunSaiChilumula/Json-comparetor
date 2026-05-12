export const overridePaths = {
  cost: ["cost_estimation", "total_project_cost"],
  process_flow: ["process_flow"],
  machinery_list: ["machinery_list"],
  materials: ["materials"],
};

export const hasValidData = (data) => {
  const combined = data?.comparison?.combined_analysis;
  if (!combined) return false;

  const hasProcessFlow = Array.isArray(combined.process_flow) && combined.process_flow.length > 0;
  const hasMachinery = Array.isArray(combined.machinery_list) && combined.machinery_list.length > 0;
  const hasMaterials = Array.isArray(combined.materials) && combined.materials.length > 0;
  const hasCost = combined.cost_estimation?.total_project_cost != null;

  return hasProcessFlow || hasMachinery || hasMaterials || hasCost;
};

export const formatCurrency = (value) => {
  if (value === null || value === undefined) {
    return "N/A";
  }
  if (typeof value === "number") {
    return `₹${value.toLocaleString("en-IN")}`;
  }
  if (typeof value === "string") {
    return value;
  }
  return String(value);
};

const toCurrencyString = (value) => {
  if (typeof value === "number") {
    return `₹${value.toLocaleString("en-IN")}`;
  }
  return value ?? "N/A";
};

function normalizeName(name = "") {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getDetailScore(item) {
  if (!item || typeof item !== "object") {
    return 0;
  }

  const filledFields = Object.values(item).filter((value) => (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    value !== "N/A"
  )).length;

  return filledFields + String(item?.name || "").length / 1000;
}

function dedupeByNormalizedName(arr = []) {
  const indexByName = new Map();
  const deduped = [];

  arr.forEach((item) => {
    const key = normalizeName(item?.name);

    if (!key) {
      return;
    }

    if (!indexByName.has(key)) {
      indexByName.set(key, deduped.length);
      deduped.push(item);
      return;
    }

    const existingIndex = indexByName.get(key);
    const existing = deduped[existingIndex];

    if (getDetailScore(item) > getDetailScore(existing)) {
      deduped[existingIndex] = item;
    }
  });

  return deduped;
}

/**
 * Check if a value is valid (not null, not undefined, not empty object/array)
 */
const isValidValue = (value) => {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return Object.keys(value).length > 0;
  }
  return true;
};

/**
 * Get the best model for a section based on priority:
 * 1. most_realistic markers
 * 2. winner_overall
 * 3. Valid data with complete fields
 * 4. Any available model with valid data
 */
function getBestModel(sectionData, differences, winnerOverall, section, explainableTakenFrom) {
  const models = ["deepseek", "gpt", "gemini"];
  
  // Priority 1: Check most_realistic markers
  if (section === "cost") {
    const costConflicts = differences?.machinery_differences?.cost_conflicts || [];
    for (const conflict of costConflicts) {
      const mostRealistic = conflict?.most_realistic;
      if (mostRealistic && sectionData[mostRealistic] !== null && sectionData[mostRealistic] !== undefined) {
        return mostRealistic;
      }
    }

    // Priority 2: Respect explainable_ai taken_from for cost
    if (explainableTakenFrom && sectionData[explainableTakenFrom] !== null && sectionData[explainableTakenFrom] !== undefined) {
      return explainableTakenFrom;
    }
  }

  // Priority 3: Check winner_overall
  if (winnerOverall && sectionData[winnerOverall] !== null && sectionData[winnerOverall] !== undefined) {
    return winnerOverall;
  }

  // Priority 3: Find model with valid, complete data
  let bestModel = null;
  let bestScore = -1;

  for (const model of models) {
    const value = sectionData[model];
    
    // Skip invalid values
    if (!isValidValue(value)) {
      continue;
    }

    // Score based on data completeness and validity
    let score = 0;

    // Base score for having valid data
    score += 10;

    // Bonus for non-null, non-undefined values
    if (value !== null && value !== undefined) {
      score += 10;
    }

    // Bonus for numeric values (typically more reliable)
    if (typeof value === "number") {
      score += 5;
    }

    // Bonus for non-zero/non-empty values
    if (typeof value === "number" && value > 0) {
      score += 5;
    }
    if (typeof value === "string" && value.trim().length > 0) {
      score += 5;
    }
    if (Array.isArray(value) && value.length > 0) {
      score += 5;
    }
    if (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0) {
      score += 5;
    }

    // For cost, prefer values that are reasonable (not extreme outliers)
    if (section === "cost" && typeof value === "number") {
      // Penalize extreme outliers (likely errors)
      if (value > 0 && value < 1e12) { // Reasonable range for project costs
        score += 10;
      } else {
        score -= 20;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestModel = model;
    }
  }

  if (bestModel) {
    return bestModel;
  }

  // Priority 4: Fallback to any model with any data
  for (const model of models) {
    if (sectionData[model] !== undefined) {
      return model;
    }
  }

  return null;
}

export function getSelectionReason(section, data, model, isManual = false) {
  if (isManual) {
    return "Selected manually by user";
  }

  const comparison = data?.comparison || {};
  const differences = comparison?.differences || {};
  const winnerOverall = comparison?.winner_overall;
  const explainableAI = comparison?.explainable_ai || {};

  if (section === "cost") {
    const costConflicts = differences?.machinery_differences?.cost_conflicts || [];
    const mostRealisticModels = costConflicts
      .filter(c => c?.most_realistic === model)
      .map(c => c?.machine_name)
      .filter(Boolean);

    if (mostRealisticModels.length > 0) {
      return `Selected because it is marked as most realistic for ${mostRealisticModels.join(", ")}`;
    }

    if (model === winnerOverall) {
      return "Selected based on overall winner";
    }

    const hasLowVariance = costConflicts.some(c => {
      const costs = c?.costs || {};
      const values = Object.values(costs).filter(v => typeof v === "number");
      if (values.length < 2) return false;
      const maxVal = Math.max(...values);
      const minVal = Math.min(...values);
      const variancePct = ((maxVal - minVal) / minVal) * 100;
      return variancePct < 50 && costs[model] !== undefined;
    });

    if (hasLowVariance) {
      return "Selected based on lowest variance in cost estimates";
    }

    return "Default selection based on system rules";
  }

  if (section === "process_flow") {
    const explainable = explainableAI?.process_flow || {};
    if (explainable?.taken_from === model) {
      return `Selected: ${explainable?.reason || "Most detailed process flow"}`;
    }

    if (model === winnerOverall) {
      return "Selected based on overall winner";
    }

    const stepCount = differences?.process_flow_differences?.step_count?.[model];
    const maxSteps = Math.max(
      differences?.process_flow_differences?.step_count?.deepseek || 0,
      differences?.process_flow_differences?.step_count?.gpt || 0,
      differences?.process_flow_differences?.step_count?.gemini || 0
    );

    if (stepCount === maxSteps && maxSteps > 0) {
      return "Selected because it has the most detailed process flow";
    }

    return "Default selection based on system rules";
  }

  if (section === "machinery_list") {
    const explainable = explainableAI?.machinery_list || {};
    if (explainable?.taken_from === model) {
      return `Selected: ${explainable?.reason || "Most comprehensive machinery list"}`;
    }

    if (model === winnerOverall) {
      return "Selected based on overall winner";
    }

    const machineCount = (data?.comparison?.combined_analysis?.machinery_list || [])
      .filter(m => m.source_model === model).length;
    const maxMachines = Math.max(
      ...["deepseek", "gpt", "gemini"].map(m =>
        (data?.comparison?.combined_analysis?.machinery_list || [])
          .filter(machine => machine.source_model === m).length
      )
    );

    if (machineCount === maxMachines && maxMachines > 0) {
      return "Selected because it has the most comprehensive machinery list";
    }

    return "Default selection based on system rules";
  }

  if (section === "materials") {
    const explainable = explainableAI?.materials || {};
    if (explainable?.taken_from === model) {
      return `Selected: ${explainable?.reason || "Most comprehensive material list"}`;
    }

    if (model === winnerOverall) {
      return "Selected based on overall winner";
    }

    const materialCount = (data?.comparison?.combined_analysis?.materials || [])
      .filter(m => m.source_model === model).length;
    const maxMaterials = Math.max(
      ...["deepseek", "gpt", "gemini"].map(m =>
        (data?.comparison?.combined_analysis?.materials || [])
          .filter(material => material.source_model === m).length
      )
    );

    if (materialCount === maxMaterials && maxMaterials > 0) {
      return "Selected because it has the most comprehensive material list";
    }

    return "Default selection based on system rules";
  }

  return "Selection based on system rules";
}

export function generateAutoMerge(data) {
  if (!hasValidData(data)) {
    return {
      process_flow: "No data available",
      machinery_list: "No data available",
      materials: "No data available",
      cost_estimation: {
        total_project_cost: "No data available"
      },
      selected_model_map: {
        cost: null,
        process_flow: null,
        machinery: null,
        materials: null
      },
    };
  }

  const combined = data?.comparison?.combined_analysis || {};
  const differences = data?.comparison?.differences || {};
  const winnerOverall = data?.comparison?.winner_overall;
  const ai = data?.comparison?.explainable_ai || {};

  const costValues = differences?.cost_estimation_differences?.total_project_cost || {};
  const machineryConflicts = differences?.machinery_differences?.cost_conflicts || [];
  const processFlow = Array.isArray(combined?.process_flow) ? [...combined.process_flow] : [];
  const materials = Array.isArray(combined?.materials) ? [...combined.materials] : [];
  const machineryList = Array.isArray(combined?.machinery_list) ? combined.machinery_list.map((item) => ({ ...item })) : [];

  const machineryModelMap = {};

  // Use most_realistic markers for machinery conflicts, fallback to best model
  machineryConflicts.forEach((conflict) => {
    const mostRealistic = conflict?.most_realistic;
    const validModels = ["deepseek", "gpt", "gemini"].filter(m => 
      conflict?.costs?.[m] !== null && conflict?.costs?.[m] !== undefined
    );
    
    let chosenModel = mostRealistic;
    
    // If most_realistic is not valid, use winner_overall
    if (!chosenModel || !validModels.includes(chosenModel)) {
      if (winnerOverall && validModels.includes(winnerOverall)) {
        chosenModel = winnerOverall;
      } else if (validModels.length > 0) {
        // Fallback to first valid model
        chosenModel = validModels[0];
      } else {
        return; // Skip if no valid models
      }
    }

    const chosenCost = conflict?.costs?.[chosenModel] ?? Object.values(conflict?.costs || {})[0];
    machineryModelMap[conflict.machine_name] = chosenModel;

    const conflictNameKey = normalizeName(conflict.machine_name);
    const existing = machineryList.find((machine) => normalizeName(machine?.name) === conflictNameKey);
    if (existing) {
      existing.estimated_cost = toCurrencyString(chosenCost);
      existing.source_model = chosenModel;
      return;
    }

    machineryList.push({
      name: conflict.machine_name,
      estimated_cost: toCurrencyString(chosenCost),
      source_model: chosenModel,
    });
  });

  // Add unique steps from differences to process flow
  const uniqueSteps = differences?.process_flow_differences?.unique_steps || [];
  uniqueSteps
    .filter((step) => step?.important)
    .forEach((step) => {
      if (!processFlow.some((item) => item.step_name === step.step_name)) {
        processFlow.push(step);
      }
    });

  // Add unique materials from differences
  const uniqueMaterials = differences?.materials_differences?.unique_materials || [];
  uniqueMaterials.forEach((item) => {
    const materialNameKey = normalizeName(item?.material_name);
    if (materialNameKey && !materials.some((material) => normalizeName(material?.name) === materialNameKey)) {
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

  const explainableTakenFrom = data?.comparison?.explainable_ai?.cost_estimation?.taken_from;
  // Use improved decision logic for cost selection
  const costModel = getBestModel(costValues, differences, winnerOverall, "cost", explainableTakenFrom);
  const selectedCost = costModel ? costValues[costModel] : undefined;

  return {
    process_flow: processFlow,
    machinery_list: dedupeByNormalizedName(machineryList),
    cost_estimation: {
      total_project_cost: selectedCost ?? (combined.cost_estimation?.total_project_cost ?? "No data available")
    },
    materials: dedupeByNormalizedName(materials),
    selected_model_map: {
      cost: ai?.cost_estimation?.taken_from || null,
      process_flow: ai?.process_flow?.taken_from || null,
      machinery: ai?.machinery_list?.taken_from || null,
      materials: ai?.materials?.taken_from || null,
    },
  };
}

export function generateFinalJson(baseData, mergeState, sourceData = {}) {
  const ai = sourceData?.comparison?.explainable_ai || {};

  if (!baseData || typeof baseData !== "object") {
    return {
      process_flow: "No data available",
      machinery_list: "No data available",
      materials: "No data available",
      cost_estimation: {
        total_project_cost: "No data available"
      },
      selected_model_map: {
        cost: null,
        process_flow: null,
        machinery: null,
        materials: null
      }
    };
  }

  const merged = JSON.parse(JSON.stringify(baseData));

  if (!mergeState || Object.keys(mergeState).length === 0) {
    // Still ensure complete structure from baseData
    const process_flow = baseData.process_flow ?? "No data available";
    const machinery_list = baseData.machinery_list ?? "No data available";
    const materials =
      Array.isArray(baseData?.materials) && baseData.materials.length > 0
        ? dedupeByNormalizedName(baseData.materials)
        : "No data available";
    const cost_estimation_cost = baseData.cost_estimation?.total_project_cost ?? "No data available";

    ["process_flow", "machinery_list", "materials"].forEach((section) => {
      if (merged[section] === undefined || merged[section] === null || (Array.isArray(merged[section]) && merged[section].length === 0)) {
        merged[section] = "No data available";
      }
    });

    if (!merged.cost_estimation) {
      merged.cost_estimation = {};
    }
    if (merged.cost_estimation.total_project_cost === null || merged.cost_estimation.total_project_cost === undefined) {
      merged.cost_estimation.total_project_cost = "No data available";
    }

    const selectedModelMap = {
      cost: ai?.cost_estimation?.taken_from || null,
      process_flow: ai?.process_flow?.taken_from || null,
      machinery: ai?.machinery_list?.taken_from || null,
      materials: ai?.materials?.taken_from || null
    };

    return {
      process_flow,
      machinery_list: Array.isArray(machinery_list) ? dedupeByNormalizedName(machinery_list) : machinery_list,
      materials,
      cost_estimation: {
        total_project_cost: cost_estimation_cost
      },
      selected_model_map: selectedModelMap
    };
  }

  Object.entries(mergeState).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (key === "cost") {
      const path = overridePaths[key];
      let pointer = merged;
      for (let i = 0; i < path.length - 1; i += 1) {
        const segment = path[i];
        if (pointer[segment] === undefined || pointer[segment] === null) {
          pointer[segment] = {};
        }
        pointer = pointer[segment];
      }
      pointer[path[path.length - 1]] = value;
    } else if (key === "process_flow" || key === "machinery_list" || key === "materials") {
      merged[key] = value;
    }
  });

  ["process_flow", "machinery_list", "materials"].forEach((section) => {
    if (!Array.isArray(merged[section]) || merged[section].length === 0) {
      merged[section] = "No data available";
    }
  });

  // Handle cost when no data available
  if (!merged.cost_estimation) {
    merged.cost_estimation = {};
  }
  if (merged.cost_estimation.total_project_cost === null || merged.cost_estimation.total_project_cost === undefined) {
    merged.cost_estimation.total_project_cost = "No data available";
  }

  const selectedModelMap = {
    cost: ai?.cost_estimation?.taken_from || null,
    process_flow: ai?.process_flow?.taken_from || null,
    machinery: ai?.machinery_list?.taken_from || null,
    materials: ai?.materials?.taken_from || null
  };

  // Return complete and consistent structure
  return {
    process_flow: merged.process_flow ?? "No data available",
    machinery_list: Array.isArray(merged?.machinery_list)
      ? dedupeByNormalizedName(merged.machinery_list)
      : merged.machinery_list ?? "No data available",
    materials:
      Array.isArray(merged?.materials) && merged.materials.length > 0
        ? dedupeByNormalizedName(merged.materials)
        : "No data available",
    cost_estimation: {
      total_project_cost: merged.cost_estimation?.total_project_cost ?? "No data available"
    },
    selected_model_map: selectedModelMap
  };
}

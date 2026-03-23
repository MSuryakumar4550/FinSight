const BUDGET_KEY = "finsight_budget";
const DEFAULT_BUDGET = 5000;

export const getBudget = () => {
  const saved = localStorage.getItem(BUDGET_KEY);
  return saved ? parseInt(saved) : DEFAULT_BUDGET;
};

export const setBudget = (amount) => {
  localStorage.setItem(BUDGET_KEY, amount);
};
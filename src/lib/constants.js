export const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Bank account' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'cash', label: 'Cash' },
  { value: 'savings', label: 'Savings' },
  { value: 'other', label: 'Other' },
];

export const ACCOUNT_TYPE_LABELS = ACCOUNT_TYPES.reduce((labels, type) => {
  labels[type.value] = type.label;
  return labels;
}, {});

export const COLOR_SWATCHES = [
  '#4f46e5',
  '#6366f1',
  '#0ea5e9',
  '#14b8a6',
  '#10b981',
  '#84cc16',
  '#eab308',
  '#f59e0b',
  '#f97316',
  '#ef4444',
  '#f43f5e',
  '#ec4899',
  '#8b5cf6',
  '#64748b',
];

export const CHART_FALLBACK_COLORS = [
  '#6366f1',
  '#f97316',
  '#10b981',
  '#0ea5e9',
  '#ec4899',
  '#f59e0b',
  '#8b5cf6',
  '#14b8a6',
  '#ef4444',
  '#64748b',
];

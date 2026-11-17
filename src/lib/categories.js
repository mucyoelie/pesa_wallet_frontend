import { CHART_FALLBACK_COLORS } from './constants.js';

/** Flatten a two level category tree into picker options, parents first. */
export function flattenCategories(tree = []) {
  return tree.flatMap((parent) => [
    { ...parent, depth: 0 },
    ...(parent.children ?? []).map((child) => ({ ...child, depth: 1, parentName: parent.name })),
  ]);
}

/** "Food & Dining › Groceries" for a transaction row. */
export function categoryLabel(transaction) {
  if (!transaction?.category_name) return 'Uncategorised';
  return transaction.parent_category_name
    ? `${transaction.parent_category_name} › ${transaction.category_name}`
    : transaction.category_name;
}

/** Colour for a category row, falling back to a rotating palette. */
export function categoryColor(category, index = 0) {
  return category?.color ?? CHART_FALLBACK_COLORS[index % CHART_FALLBACK_COLORS.length];
}

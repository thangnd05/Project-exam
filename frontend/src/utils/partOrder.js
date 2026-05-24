const FALLBACK_ORDER = 999;

const extractNumberFromName = (name) => {
  if (typeof name !== 'string') return null;
  const match = name.match(/(\d+)/);
  return match ? Number(match[1]) : null;
};

export const getPartOrder = (item, options = {}) => {
  if (!item) return FALLBACK_ORDER;
  const { nameKey = 'name' } = options;
  if (item.displayOrder != null) return Number(item.displayOrder);
  if (item.display_order != null) return Number(item.display_order);
  const parsed = extractNumberFromName(item[nameKey] || item.partName || item.examPartName);
  return parsed != null ? parsed : FALLBACK_ORDER;
};

export const sortByPartOrder = (items, options = {}) => {
  if (!Array.isArray(items)) return [];
  return [...items].sort((a, b) => getPartOrder(a, options) - getPartOrder(b, options));
};

export const sortPartsByLookup = (items, partsLookup, idKey = 'examPartId') => {
  if (!Array.isArray(items)) return [];
  const lookup = new Map(
    (partsLookup || []).map((p) => [p.examPartId || p.exam_part_id, p]),
  );
  return [...items].sort((a, b) => {
    const partA = lookup.get(a[idKey]) || {};
    const partB = lookup.get(b[idKey]) || {};
    return (
      getPartOrder({ ...partA, displayOrder: partA.displayOrder ?? partA.display_order }) -
      getPartOrder({ ...partB, displayOrder: partB.displayOrder ?? partB.display_order })
    );
  });
};

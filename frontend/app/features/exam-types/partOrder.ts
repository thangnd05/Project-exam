const FALLBACK_ORDER = 999;

type PartLike = {
  displayOrder?: number | string | null;
  display_order?: number | string | null;
  name?: string | null;
  partName?: string | null;
  examPartName?: string | null;
};

type PartLookupLike = PartLike & {
  examPartId?: string | null;
  exam_part_id?: string | null;
};

const EMPTY_PART: PartLookupLike = {};

// Đọc trường động theo tên (nameKey/idKey do caller truyền vào).
const readField = (item: object, key: string): unknown => (item as Record<string, unknown>)[key];

const extractNumberFromName = (name: unknown): number | null => {
  if (typeof name !== 'string') return null;
  const match = name.match(/(\d+)/);
  return match ? Number(match[1]) : null;
};

export const getPartOrder = (
  item: PartLike | null | undefined,
  options: { nameKey?: string } = {},
): number => {
  if (!item) return FALLBACK_ORDER;
  const { nameKey = 'name' } = options;
  if (item.displayOrder != null) return Number(item.displayOrder);
  if (item.display_order != null) return Number(item.display_order);
  const parsed = extractNumberFromName(readField(item, nameKey) || item.partName || item.examPartName);
  return parsed != null ? parsed : FALLBACK_ORDER;
};

export const sortByPartOrder = <T extends PartLike>(
  items: T[] | null | undefined,
  options: { nameKey?: string } = {},
): T[] => {
  if (!Array.isArray(items)) return [];
  return [...items].sort((a, b) => getPartOrder(a, options) - getPartOrder(b, options));
};

export const sortPartsByLookup = <T extends object>(
  items: T[] | null | undefined,
  partsLookup: PartLookupLike[] | null | undefined,
  idKey = 'examPartId',
): T[] => {
  if (!Array.isArray(items)) return [];
  const lookup = new Map<unknown, PartLookupLike>(
    (partsLookup || []).map((p) => [p.examPartId || p.exam_part_id, p]),
  );
  return [...items].sort((a, b) => {
    const partA = lookup.get(readField(a, idKey)) || EMPTY_PART;
    const partB = lookup.get(readField(b, idKey)) || EMPTY_PART;
    return (
      getPartOrder({ ...partA, displayOrder: partA.displayOrder ?? partA.display_order }) -
      getPartOrder({ ...partB, displayOrder: partB.displayOrder ?? partB.display_order })
    );
  });
};

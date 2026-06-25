// Tiện ích xử lý cây bộ sưu tập câu hỏi (Collection) tối đa 2 cấp: cha -> con.
// API trả phẳng kèm parentId; FE tự dựng thứ tự hiển thị và tra cứu con-cháu.

/**
 * Sắp xếp danh sách collection theo thứ tự cây: mỗi cha đứng trước, các con đứng ngay sau.
 * Mỗi phần tử được gắn thêm `depth` (0 = cha, 1 = con) để FE thụt lề khi render.
 * @param {Array<{collectionId: string, name?: string, parentId?: string|null}>} list
 * @returns {Array<{collectionId: string, name: string, parentId: string|null, depth: number}>}
 */
export const buildCollectionTree = (list) => {
  const items = Array.isArray(list) ? list : [];
  const byId = new Map(items.map((c) => [String(c.collectionId), c]));
  const childrenOf = new Map();
  const roots = [];

  items.forEach((c) => {
    const parentId = c.parentId ? String(c.parentId) : null;
    // Cha không tồn tại trong danh sách -> coi như gốc để không bị mất.
    if (parentId && byId.has(parentId)) {
      if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
      childrenOf.get(parentId).push(c);
    } else {
      roots.push(c);
    }
  });

  const byName = (a, b) => (a.name || '').localeCompare(b.name || '');
  const ordered = [];
  roots.sort(byName).forEach((root) => {
    ordered.push({ ...root, parentId: null, depth: 0 });
    (childrenOf.get(String(root.collectionId)) || [])
      .sort(byName)
      .forEach((child) =>
        ordered.push({ ...child, parentId: String(root.parentId ? root.parentId : root.collectionId), depth: 1 }),
      );
  });
  return ordered;
};

/**
 * Trả về tập id gồm chính collection và toàn bộ con-cháu (2 cấp nên chỉ con trực tiếp).
 * @returns {string[]}
 */
export const getCollectionWithDescendantIds = (list, collectionId) => {
  const items = Array.isArray(list) ? list : [];
  const id = String(collectionId);
  const ids = [id];
  items.forEach((c) => {
    if (c.parentId && String(c.parentId) === id) ids.push(String(c.collectionId));
  });
  return ids;
};

/** Có phải collection cha (cấp 1, đang có ít nhất 1 con) hay không. */
export const isParentCollection = (list, collectionId) => {
  const items = Array.isArray(list) ? list : [];
  const id = String(collectionId);
  return items.some((c) => c.parentId && String(c.parentId) === id);
};

export const buildCollectionTree = (list) => {
  const items = Array.isArray(list) ? list : [];
  const byId = new Map(items.map((c) => [String(c.collectionId), c]));
  const childrenOf = new Map();
  const roots = [];

  items.forEach((c) => {
    const parentId = c.parentId ? String(c.parentId) : null;

    if (parentId && byId.has(parentId)) {
      if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
      childrenOf.get(parentId).push(c);
    } else {
      roots.push(c);
    }
  });

  const orderOf = (c) =>
    c.displayOrder == null || Number.isNaN(Number(c.displayOrder))
      ? Number.POSITIVE_INFINITY
      : Number(c.displayOrder);
  const byOrderThenName = (a, b) => {
    const oa = orderOf(a);
    const ob = orderOf(b);
    if (oa !== ob) return oa - ob;
    return (a.name || '').localeCompare(b.name || '', undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  };
  const ordered = [];
  roots.sort(byOrderThenName).forEach((root) => {
    ordered.push({ ...root, parentId: null, depth: 0 });
    (childrenOf.get(String(root.collectionId)) || [])
      .sort(byOrderThenName)
      .forEach((child) =>
        ordered.push({ ...child, parentId: String(root.parentId ? root.parentId : root.collectionId), depth: 1 }),
      );
  });
  return ordered;
};

export const getCollectionWithDescendantIds = (list, collectionId) => {
  const items = Array.isArray(list) ? list : [];
  const id = String(collectionId);
  const ids = [id];
  items.forEach((c) => {
    if (c.parentId && String(c.parentId) === id) ids.push(String(c.collectionId));
  });
  return ids;
};

export const isParentCollection = (list, collectionId) => {
  const items = Array.isArray(list) ? list : [];
  const id = String(collectionId);
  return items.some((c) => c.parentId && String(c.parentId) === id);
};

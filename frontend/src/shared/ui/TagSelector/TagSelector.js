'use client';

import { useMemo, useState } from 'react';
import { Badge } from 'react-bootstrap';
import { ChevronDown, ChevronRight } from 'lucide-react';
import classNames from 'classnames/bind';
import styles from './TagSelector.module.scss';

const cx = classNames.bind(styles);

const isRoot = (tag, byId) => {
    const pid = tag.parentId;
    if (pid == null || pid === '') return true;

    return !byId.has(pid);
};

const TagSelector = ({ tags = [], selectedIds = [], onToggle, label = 'Tag phân loại' }) => {
    const { byId, childrenOf, roots, hasHierarchy } = useMemo(() => {
        const map = new Map(tags.map((t) => [t.tagId, t]));
        const children = new Map();
        tags.forEach((t) => {
            if (t.parentId && map.has(t.parentId)) {
                if (!children.has(t.parentId)) children.set(t.parentId, []);
                children.get(t.parentId).push(t);
            }
        });
        const rootList = tags.filter((t) => isRoot(t, map));
        return {
            byId: map,
            childrenOf: (id) => children.get(id) || [],
            roots: rootList,
            hasHierarchy: children.size > 0,
        };
    }, [tags]);

    const [openOverride, setOpenOverride] = useState({});

    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

    if (tags.length === 0) return null;

    const Chip = ({ tag }) => {
        const selected = selectedSet.has(tag.tagId);
        return (
            <Badge
                bg={selected ? 'primary' : 'light'}
                text={selected ? 'white' : 'dark'}
                role="button"
                className="border px-2 py-1 fw-medium tag-badge"
                onClick={() => onToggle?.(tag.tagId)}
            >
                {tag.name}
            </Badge>
        );
    };

    const countSelectedDescendants = (tagId) => {
        let count = 0;
        childrenOf(tagId).forEach((c) => {
            if (selectedSet.has(c.tagId)) count += 1;
            count += countSelectedDescendants(c.tagId);
        });
        return count;
    };

    const renderNode = (tag) => {
        const kids = childrenOf(tag.tagId);
        if (kids.length === 0) {
            return <Chip key={tag.tagId} tag={tag} />;
        }
        const selCount = countSelectedDescendants(tag.tagId);

        const open =
            openOverride[tag.tagId] !== undefined ? openOverride[tag.tagId] : true;
        return (
            <div key={tag.tagId} className={cx('group')}>
                <button
                    type="button"
                    className={cx('groupHeader')}
                    onClick={() =>
                        setOpenOverride((prev) => ({ ...prev, [tag.tagId]: !open }))
                    }
                    aria-expanded={open}
                >
                    {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className={cx('groupName')}>{tag.name}</span>
                    {selCount > 0 && (
                        <Badge bg="primary" pill className="ms-1">
                            {selCount}
                        </Badge>
                    )}
                </button>
                {open && (
                    <div className={cx('groupBody')}>
                        {kids.map((child) => renderNode(child))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="mb-2">
            {label && <label className="fw-bold mb-1 d-block">{label}</label>}
            {hasHierarchy ? (
                <div className={cx('groupList')}>{roots.map((r) => renderNode(r))}</div>
            ) : (
                <div className="d-flex flex-wrap gap-2">
                    {tags.map((tag) => (
                        <Chip key={tag.tagId} tag={tag} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default TagSelector;

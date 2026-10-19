'use client';

import { useMemo, useState } from 'react';
import { Badge } from 'react-bootstrap';
import { ChevronDown, ChevronRight } from 'lucide-react';
import classNames from 'classnames/bind';
import styles from './TagSelector.module.scss';

const cx = classNames.bind(styles);

const SHARED_PART_KEY = '__shared__';

type TagSelectorProps = {
    tags?: any[];
    selectedIds?: any[];
    onToggle?: (tagId: any) => void;
    label?: string;
};

type PartGroup = { key: string; name: string; tags: any[] };

const TagSelector = ({ tags = [], selectedIds = [], onToggle, label = 'Tag phân loại' }: TagSelectorProps) => {
    // Tag được nhóm theo phần thi; thứ tự nhóm theo thứ tự tag backend trả về.
    const groups = useMemo(() => {
        const map = new Map<string, PartGroup>();
        tags.forEach((t) => {
            const key = t.examPartId || SHARED_PART_KEY;
            if (!map.has(key)) {
                map.set(key, { key, name: t.examPartId ? t.examPartName || 'Phần thi' : 'Dùng chung', tags: [] });
            }
            map.get(key)!.tags.push(t);
        });
        return Array.from(map.values());
    }, [tags]);

    const [openOverride, setOpenOverride] = useState<Record<string, boolean>>({});

    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

    if (tags.length === 0) return null;

    const Chip = ({ tag }: { tag: any }) => {
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

    const renderGroup = (group: PartGroup) => {
        const selCount = group.tags.filter((t) => selectedSet.has(t.tagId)).length;
        const open = openOverride[group.key] !== undefined ? openOverride[group.key] : true;
        return (
            <div key={group.key} className={cx('group')}>
                <button
                    type="button"
                    className={cx('groupHeader')}
                    onClick={() => setOpenOverride((prev) => ({ ...prev, [group.key]: !open }))}
                    aria-expanded={open}
                >
                    {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className={cx('groupName')}>{group.name}</span>
                    {selCount > 0 && (
                        <Badge bg="primary" pill className="ms-1">
                            {selCount}
                        </Badge>
                    )}
                </button>
                {open && (
                    <div className={cx('groupBody')}>
                        {group.tags.map((tag) => <Chip key={tag.tagId} tag={tag} />)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="mb-2">
            {label && <label className="fw-bold mb-1 d-block">{label}</label>}
            {groups.length > 1 ? (
                <div className={cx('groupList')}>{groups.map(renderGroup)}</div>
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

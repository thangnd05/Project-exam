'use client';

import { useMemo, useState } from 'react';
import { Badge } from 'react-bootstrap';
import { ChevronDown, ChevronRight } from 'lucide-react';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import styles from '@/app/features/tests/TagSelector/TagSelector.module.scss';
import type { TagResponse } from '@/app/types';

const cx = classNames.bind(styles);

const SHARED_PART_KEY = '__shared__';

type TagSelectorProps = {
    tags?: TagResponse[];
    selectedIds?: string[];
    onToggle?: (tagId: string) => void;
    label?: string;
};

type PartGroup = { key: string; name: string; tags: TagResponse[] };

const TagSelector = ({ tags = [], selectedIds = [], onToggle, label: labelProp }: TagSelectorProps) => {
    const t = useTranslations('TestCreator');
    const label = labelProp ?? t('tagSelector.label');
    // Tag được nhóm theo phần thi; thứ tự nhóm theo thứ tự tag backend trả về.
    const groups = useMemo(() => {
        const map = new Map<string, PartGroup>();
        tags.forEach((tag) => {
            const key = tag.examPartId || SHARED_PART_KEY;
            if (!map.has(key)) {
                map.set(key, { key, name: tag.examPartId ? tag.examPartName || t('tagSelector.part') : t('tagSelector.shared'), tags: [] });
            }
            map.get(key)!.tags.push(tag);
        });
        return Array.from(map.values());
    }, [tags, t]);

    const [openOverride, setOpenOverride] = useState<Record<string, boolean>>({});

    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

    if (tags.length === 0) return null;

    const Chip = ({ tag }: { tag: TagResponse }) => {
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
        const selCount = group.tags.filter((tag) => selectedSet.has(tag.tagId)).length;
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

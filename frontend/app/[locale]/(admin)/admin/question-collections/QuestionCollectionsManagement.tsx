'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {Form, Spinner} from 'react-bootstrap';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import {useTranslations} from 'next-intl';
import {ChevronDown, ChevronRight, Edit, FolderTree, Library, Plus, Trash2} from 'lucide-react';
import classNames from 'classnames/bind';

import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import {AdminFieldError, AdminPageHeader, AdminToolbar} from '@/app/[locale]/(admin)/_components/common';
import {useAdminQuestionCollections, type CollectionItem} from './_hooks/useAdminQuestionCollections';
import type {QuestionCollectionRequest} from '@/app/types';
import {getApiErrorMessage} from '@/app/utils/apiError';
import styles from '@/app/[locale]/(admin)/_components/common/adminTree.module.scss';

const cx = classNames.bind(styles);

type CollectionFormState = {
  name: string;
  description: string;
  parentId: string;
  examTypeId: string;
  displayOrder: string;
};

const defaultFormState: CollectionFormState = {
  name: '',
  description: '',
  parentId: '',
  examTypeId: '',
  displayOrder: '',
};

const extractApiErrorMessage = (error: unknown, fallback: string) =>
  getApiErrorMessage(error, (error instanceof Error && error.message) || fallback);

type CollectionNode = CollectionItem & {children?: CollectionNode[]};

type CollectionTreeNodeProps = {
  node: CollectionNode;
  level: number;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  onEdit: (node: CollectionNode) => void;
  onDelete: (node: CollectionNode) => void;
  onAddChild: (node: CollectionNode) => void;
  keyword: string;
  examTypeName: (id: string) => string;
};

function CollectionTreeNode({node, level, expandedIds, toggleExpand, onEdit, onDelete, onAddChild, keyword, examTypeName}: CollectionTreeNodeProps) {
  const t = useTranslations('AdminContent.questionCollections');
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.collection_id);
  const kw = keyword.trim().toLowerCase();
  const matchesSearch =
    !kw || node.name.toLowerCase().includes(kw) || (node.description || '').toLowerCase().includes(kw);
  const childrenMatchSearch =
    hasChildren &&
    node.children!.some(
      (c) => c.name.toLowerCase().includes(kw) || (c.description || '').toLowerCase().includes(kw),
    );

  if (kw && !matchesSearch && !childrenMatchSearch) return null;

  const nodeContent = (
    <>
      <div className={cx('treeNode')}>
        <div className={cx('treeNodeLeft')}>
          {hasChildren ? (
            <ButtonPrime size="icon" variant="ghost" className={cx('expandBtn')} onClick={() => toggleExpand(node.collection_id)}>
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </ButtonPrime>
          ) : (
            <span className={cx('expandPlaceholder')} />
          )}
          <span className={cx('nodeIcon')}>
            {level === 0 ? <FolderTree size={16} /> : <Library size={15} />}
          </span>
          <span className={cx('collectionName', {root: level === 0})}>{node.name}</span>
          {level === 0 && node.exam_type_id && examTypeName(node.exam_type_id) && (
            <span className={cx('examTypeBadge')}>{examTypeName(node.exam_type_id)}</span>
          )}
          {hasChildren && (
            <span className={cx('childCount')}>{t('childCount', {count: node.children!.length})}</span>
          )}
          <span
            className={cx('questionCount', {empty: !node.question_count})}
            title={t('questionCountTitle')}
          >
            {t('questionCount', {count: node.question_count})}
            {hasChildren && node.total_question_count > node.question_count
              ? ` · ${t('totalWithChildren', {count: node.total_question_count})}`
              : ''}
          </span>
          {node.description && <span className={cx('description')}>- {node.description}</span>}
        </div>
        <div className={cx('treeNodeActions')}>
          {level === 0 && (
            <ButtonPrime size="icon" variant="ghost" onClick={() => onAddChild(node)} title={t('addChild')}>
              <Plus size={16} />
            </ButtonPrime>
          )}
          <ButtonPrime size="icon" variant="ghost" onClick={() => onEdit(node)} title={t('edit')}>
            <Edit size={16} />
          </ButtonPrime>
          <ButtonPrime size="icon" variant="dangerGhost" onClick={() => onDelete(node)} title={t('delete')}>
            <Trash2 size={16} />
          </ButtonPrime>
        </div>
      </div>
      {hasChildren && (isExpanded || Boolean(kw)) && (
        <div className={cx('childrenWrapper')}>
          {node.children!.map((child) => (
            <CollectionTreeNode
              key={child.collection_id}
              node={child}
              level={level + 1}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              keyword={keyword}
              examTypeName={examTypeName}
            />
          ))}
        </div>
      )}
    </>
  );

  if (level === 0) {
    return <div className={cx('rootGroup')}>{nodeContent}</div>;
  }
  return nodeContent;
}

function QuestionCollectionsManagement() {
  const t = useTranslations('AdminContent.questionCollections');
  const tc = useTranslations('Common');
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<CollectionFormState>(defaultFormState);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingItem, setDeletingItem] = useState<CollectionItem | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const {
    collections: collectionList,
    examTypes,
    isLoading: loading,
    isSuccess: collectionsLoaded,
    isError: collectionsError,
    error: collectionsErrorObj,
    refetchCollections,
    createCollection,
    updateCollection,
    deleteCollection,
  } = useAdminQuestionCollections();

  const applyDefaultExpanded = useCallback((list: CollectionItem[]) => {
    setExpandedIds(new Set(list.filter((c) => c.child_count > 0).map((c) => c.collection_id)));
  }, []);

  const didInitExpand = useRef(false);
  useEffect(() => {
    if (didInitExpand.current || !collectionsLoaded) return;
    didInitExpand.current = true;
    applyDefaultExpanded(collectionList);
  }, [collectionsLoaded, collectionList, applyDefaultExpanded]);

  const examTypeName = useCallback(
    (id: string) => examTypes.find((et) => String(et.examTypeId) === String(id))?.name || '',
    [examTypes],
  );

  const collectionTree = useMemo(() => {
    const byId = new Map(collectionList.map((c) => [c.collection_id, c]));
    const childrenOf = new Map<string, CollectionItem[]>();
    const roots: CollectionItem[] = [];
    collectionList.forEach((c) => {
      if (c.parent_id && byId.has(c.parent_id)) {
        if (!childrenOf.has(c.parent_id)) childrenOf.set(c.parent_id, []);
        childrenOf.get(c.parent_id)!.push(c);
      } else {
        roots.push(c);
      }
    });

    const byOrder = (a: CollectionItem, b: CollectionItem) => {
      const ao = a.display_order == null ? Number.MAX_SAFE_INTEGER : a.display_order;
      const bo = b.display_order == null ? Number.MAX_SAFE_INTEGER : b.display_order;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name, 'vi', {numeric: true});
    };
    return roots
      .sort(byOrder)
      .map((root) => ({...root, children: (childrenOf.get(root.collection_id) || []).sort(byOrder)}));
  }, [collectionList]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(
    () => setExpandedIds(new Set(collectionList.filter((c) => c.child_count > 0).map((c) => c.collection_id))),
    [collectionList],
  );
  const collapseAll = useCallback(() => setExpandedIds(new Set()), []);

  const parentOptions = useMemo(
    () => collectionList.filter((c) => !c.parent_id && c.collection_id !== editingId),
    [collectionList, editingId],
  );
  const editingHasChildren = useMemo(
    () => Boolean(editingId) && collectionList.some((c) => c.parent_id === editingId),
    [collectionList, editingId],
  );

  const resetForm = () => {
    setFormState(defaultFormState);
    setEditingId(null);
    setErrorMessage('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openCreateChildModal = (parent: CollectionNode) => {
    resetForm();

    setFormState({name: '', description: '', parentId: parent.collection_id, examTypeId: parent.exam_type_id || '', displayOrder: ''});
    setShowModal(true);
  };

  const openEditModal = (collection: CollectionNode) => {
    setEditingId(collection.collection_id);
    setFormState({
      name: collection.name,
      description: collection.description || '',
      parentId: collection.parent_id || '',
      examTypeId: collection.exam_type_id || '',
      displayOrder: collection.display_order == null ? '' : String(collection.display_order),
    });
    setErrorMessage('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const normalizedName = formState.name.trim();
    if (!normalizedName) {
      setErrorMessage(t('errors.nameRequired'));
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {

      const payloadParentId = editingId && editingHasChildren ? '' : (formState.parentId || '');

      const trimmedOrder = String(formState.displayOrder).trim();
      const parsedOrder = trimmedOrder === '' ? undefined : Number.parseInt(trimmedOrder, 10);
      const payload: QuestionCollectionRequest = {
        name: normalizedName,
        description: formState.description.trim(),
        parentId: payloadParentId,

        examTypeId: payloadParentId ? '' : (formState.examTypeId || ''),
        displayOrder: Number.isNaN(parsedOrder) ? undefined : parsedOrder,
      };

      if (editingId) {
        await updateCollection({id: editingId, payload});
      } else {
        await createCollection(payload);
      }

      const {data: fresh} = await refetchCollections();
      applyDefaultExpanded(Array.isArray(fresh) ? fresh : []);
      if (payloadParentId) {
        setExpandedIds((prev) => new Set(prev).add(payloadParentId));
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error, t('errors.saveFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      await deleteCollection(deletingItem.collection_id);
      setDeletingItem(null);
      const {data: fresh} = await refetchCollections();
      applyDefaultExpanded(Array.isArray(fresh) ? fresh : []);
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error, t('errors.deleteFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteBlockReason = (() => {
    if (!deletingItem) return '';
    if (deletingItem.question_count > 0) {
      return t('deleteBlockedQuestions', {name: deletingItem.name, count: deletingItem.question_count});
    }
    if (deletingItem.child_count > 0) {
      return t('deleteBlockedChildren', {name: deletingItem.name, count: deletingItem.child_count});
    }
    return t('deleteMessage', {name: deletingItem.name || ''});
  })();

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title={t('title')}
        description={t('description')}
      >
        <ButtonPrime onClick={openCreateModal}>
          <Plus size={16} />
          {t('add')}
        </ButtonPrime>
      </AdminPageHeader>

      <AdminToolbar
        searchValue={keyword}
        onSearchChange={setKeyword}
        searchPlaceholder={t('searchPlaceholder')}
      />
      <AdminFieldError
        message={
          errorMessage ||
          (collectionsError
            ? extractApiErrorMessage(collectionsErrorObj, t('errors.loadFailed'))
            : '')
        }
      />

      <div className={cx('treeWrapper')}>
        <div className={cx('treeToolbar')}>
          <span className={cx('treeCount')}>{t('count', {count: collectionList.length})}</span>
          <div className={cx('treeToolbarActions')}>
            <ButtonPrime variant="link" size="sm" onClick={expandAll}>{t('expandAll')}</ButtonPrime>
            <ButtonPrime variant="link" size="sm" onClick={collapseAll}>{t('collapseAll')}</ButtonPrime>
          </div>
        </div>

        {loading && (
          <div className="text-center py-4">
            <Spinner size="sm" className="me-2" />
            {tc('loading')}
          </div>
        )}

        {!loading && collectionList.length === 0 && (
          <div className="text-center py-4 text-muted">{t('empty')}</div>
        )}

        {!loading &&
          collectionTree.map((node) => (
            <CollectionTreeNode
              key={node.collection_id}
              node={node}
              level={0}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              onEdit={openEditModal}
              onDelete={setDeletingItem}
              onAddChild={openCreateChildModal}
              keyword={keyword}
              examTypeName={examTypeName}
            />
          ))}
      </div>

      <BaseModal
        show={showModal}
        onClose={() => {
          if (submitting) return;
          setShowModal(false);
          resetForm();
        }}
        title={editingId ? t('form.editTitle') : t('form.createTitle')}
        footer={
          <ModalActionFooter
            onCancel={() => {
              if (submitting) return;
              setShowModal(false);
              resetForm();
            }}
            onSubmit={handleSubmit}
            cancelLabel={tc('cancelShort')}
            submitLabel={editingId ? tc('save') : t('form.create')}
            loadingLabel={t('form.saving')}
            loading={submitting}
          />
        }
      >
        <Form.Group className="mb-3">
          <Form.Label>{t('form.name')}</Form.Label>
          <Form.Control
            value={formState.name}
            onChange={(event) => setFormState((prev) => ({...prev, name: event.target.value}))}
            placeholder={t('form.namePlaceholder')}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>{t('form.displayOrder')}</Form.Label>
          <Form.Control
            type="number"
            value={formState.displayOrder}
            onChange={(event) => setFormState((prev) => ({...prev, displayOrder: event.target.value}))}
            placeholder={t('form.displayOrderPlaceholder')}
          />
          <Form.Text muted>
            {t('form.displayOrderHelp')}
          </Form.Text>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>{t('form.parent')}</Form.Label>
          <Form.Select
            value={editingHasChildren ? '' : formState.parentId}
            disabled={editingHasChildren}
            onChange={(event) => setFormState((prev) => ({...prev, parentId: event.target.value}))}
          >
            <option value="">{t('form.noParent')}</option>
            {parentOptions.map((c) => (
              <option key={c.collection_id} value={c.collection_id}>
                {c.name}
              </option>
            ))}
          </Form.Select>
          <Form.Text muted>
            {editingHasChildren
              ? t('form.parentLockedHelp')
              : t('form.parentHelp')}
          </Form.Text>
        </Form.Group>

        {!(editingHasChildren ? false : Boolean(formState.parentId)) ? (
          <Form.Group className="mb-3">
            <Form.Label>{t('form.examTypeForSet')}</Form.Label>
            <Form.Select
              value={formState.examTypeId}
              onChange={(event) => setFormState((prev) => ({...prev, examTypeId: event.target.value}))}
            >
              <option value="">{t('form.noExamType')}</option>
              {examTypes.map((et) => (
                <option key={et.examTypeId} value={et.examTypeId}>
                  {et.name}
                </option>
              ))}
            </Form.Select>
            <Form.Text muted>
              {t('form.examTypeHelp')}
            </Form.Text>
          </Form.Group>
        ) : (
          <Form.Group className="mb-3">
            <Form.Label>{t('form.examType')}</Form.Label>
            <Form.Control plaintext readOnly value={examTypeName(formState.examTypeId) || t('form.inheritedExamType')} />
          </Form.Group>
        )}
        <Form.Group>
          <Form.Label>{t('form.description')}</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={formState.description}
            onChange={(event) => setFormState((prev) => ({...prev, description: event.target.value}))}
            placeholder={t('form.descriptionPlaceholder')}
          />
        </Form.Group>
        <AdminFieldError message={errorMessage} />
      </BaseModal>

      <ConfirmDeleteModal
        show={Boolean(deletingItem)}
        onClose={() => {
          if (submitting) return;
          setDeletingItem(null);
        }}
        onConfirm={handleDelete}
        title={t('deleteTitle')}
        message={deleteBlockReason}
      />
    </div>
  );
}

export default QuestionCollectionsManagement;

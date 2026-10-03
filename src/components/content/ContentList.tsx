'use client';

import { useState } from 'react';
import styles from './content.module.css';
import { useContentList, deleteContentRecord } from '@/lib/hooks/useContent';
import type { SectionKey, ContentRecord } from '@/lib/notion/content';

interface ContentListProps {
  section: SectionKey;
  weekId: string;
  onEdit: (record: ContentRecord) => void;
}

export default function ContentList({ section, weekId, onEdit }: ContentListProps) {
  const { items, isLoading, error } = useContentList(section, weekId);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteContentRecord(section, id);
      setConfirmDeleteId(null);
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || 'Failed to archive record');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return <div className={styles.loadingInline}>LOADING RECORDS...</div>;
  }

  if (error) {
    return <div className={styles.errorInline}>Unable to load records.</div>;
  }

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📂</div>
        <div className={styles.emptyTitle}>NO RECORDS FOUND</div>
        <div className={styles.emptyText}>There are no records for this section in the selected week.</div>
      </div>
    );
  }

  return (
    <div className={styles.contentList}>
      {items.map((record) => (
        <div key={record.id} className={styles.contentRow}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={styles.contentRowTitle}>{record.title || 'Untitled'}</div>
            <div className={styles.contentRowMeta} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span>{record.fields.status || 'Active'}</span>
              {record.fields.category && (
                <span className={styles.contentRowCategory}>{record.fields.category}</span>
              )}
            </div>
          </div>
          
          <div className={styles.contentRowActions}>
            {confirmDeleteId === record.id ? (
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#e06c75' }}>ARCHIVE?</span>
                <button
                  className={`${styles.rowAction} ${styles.deleteAction}`}
                  onClick={() => handleDelete(record.id)}
                  disabled={deletingId === record.id}
                  type="button"
                >
                  YES
                </button>
                <button
                  className={styles.rowAction}
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={deletingId === record.id}
                  type="button"
                >
                  NO
                </button>
              </div>
            ) : (
              <>
                <button
                  className={styles.rowAction}
                  onClick={() => onEdit(record)}
                  type="button"
                >
                  EDIT
                </button>
                <button
                  className={`${styles.rowAction} ${styles.deleteAction}`}
                  onClick={() => setConfirmDeleteId(record.id)}
                  type="button"
                >
                  ARCHIVE
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

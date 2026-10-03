'use client';

import { useArchiveWeeks } from '@/lib/hooks/useArchiveWeeks';
import styles from './archive.module.css';
import Link from 'next/link';
import { useState } from 'react';

export default function ArchivePage() {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const { archive, isLoading, error } = useArchiveWeeks(cursor);

  // We could keep track of history to go back, but for simplicity we will just show current page
  // A robust pagination would store cursors in an array: [undefined, cursor1, cursor2]
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);

  const handleNext = () => {
    if (archive?.nextCursor) {
      setCursorHistory([...cursorHistory, cursor || '']);
      setCursor(archive.nextCursor);
    }
  };

  const handlePrev = () => {
    if (cursorHistory.length > 0) {
      const newHistory = [...cursorHistory];
      const prevCursor = newHistory.pop();
      setCursorHistory(newHistory);
      setCursor(prevCursor === '' ? undefined : prevCursor);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Weekly Archive</h1>
        <div className={styles.subtitle}>HISTORICAL INTELLIGENCE REVIEWS</div>
      </div>

      {isLoading ? (
        <div className={styles.centerState}>
          <h2>FETCHING ARCHIVE...</h2>
        </div>
      ) : error || !archive ? (
        <div className={styles.centerState}>
          <h2 style={{ color: '#ff4444' }}>ARCHIVE RETRIEVAL FAILED</h2>
          <p>{error?.message || 'Unknown error'}</p>
        </div>
      ) : archive.items.length === 0 ? (
        <div className={styles.centerState}>
          <h2>NO ARCHIVES FOUND</h2>
          <p>Create weekly briefings to populate the archive.</p>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {archive.items.map(({ week, summary, coveragePercentage }) => (
              <Link key={week.id} href={`/dashboard/week/${week.id}`} className={styles.weekCard}>
                <div className={styles.weekInfo}>
                  <h3 className={styles.weekNumber}>
                    W{week.weekNumber}
                    <span className={`${styles.weekStatus} ${week.status === 'Active' ? styles.active : ''}`}>
                      {week.status.toUpperCase()}
                    </span>
                  </h3>
                  <div className={styles.weekDates}>{week.startDate} — {week.endDate}</div>
                </div>

                <div className={styles.weekStats}>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{summary.total}</span>
                    <span className={styles.statLabel}>ITEMS</span>
                  </div>
                  
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{summary.saved}</span>
                    <span className={styles.statLabel}>SAVED</span>
                  </div>
                  
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{summary.toRevise}</span>
                    <span className={styles.statLabel}>TO REVISE</span>
                  </div>
                  
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{coveragePercentage}%</span>
                    <span className={styles.statLabel}>COVERAGE</span>
                    <div className={styles.coverageBar}>
                      <div className={styles.coverageFill} style={{ width: `${coveragePercentage}%` }} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className={styles.pagination}>
            <button 
              className={styles.pageBtn} 
              disabled={cursorHistory.length === 0 || isLoading}
              onClick={handlePrev}
            >
              PREVIOUS
            </button>
            <button 
              className={styles.pageBtn} 
              disabled={!archive.hasMore || isLoading}
              onClick={handleNext}
            >
              NEXT
            </button>
          </div>
        </>
      )}
    </div>
  );
}

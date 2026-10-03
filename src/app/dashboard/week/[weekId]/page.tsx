'use client';

import { useWeeklyReview } from '@/lib/hooks/useWeeklyReview';
import styles from './week.module.css';
import Link from 'next/link';
import SaveControl from '@/components/knowledge/SaveControl';
import RevisionControl from '@/components/knowledge/RevisionControl';
import { use, useEffect } from 'react';
import { RevisionStatus } from '@/lib/notion/types';
import { SECTION_META } from '@/lib/notion/content';

export default function WeeklyReviewPage({ params }: { params: Promise<{ weekId: string }> }) {
  const { weekId } = use(params);
  const { review, isLoading, error, mutate } = useWeeklyReview(weekId);

  // Trigger SWR on mount if needed, though useSWR handles it
  
  if (isLoading) {
    return (
      <div className={styles.centerState}>
        <h2>INITIALIZING WEEKLY BRIEF...</h2>
        <p>Retrieving intelligence records for {weekId}</p>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className={styles.centerState}>
        <h2 style={{ color: '#ff4444' }}>INTELLIGENCE RETRIEVAL FAILED</h2>
        <p>Unable to load this week&apos;s briefing.</p>
        <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {error?.message || 'Unknown error'}
        </p>
        <Link href="/dashboard" className={styles.navLink}>RETURN TO DASHBOARD</Link>
      </div>
    );
  }

  const {
    week,
    summary,
    sections,
    coverageGaps,
    revision,
    saved,
    revisionQueue,
    previousWeek,
    nextWeek,
    continuity
  } = review;

  if (summary.total === 0) {
    return (
      <div className={styles.centerState}>
        <h2>NO INTELLIGENCE RECORDED</h2>
        <p>No knowledge records have been logged for this week.</p>
        <div className={styles.navigation} style={{ marginTop: '2rem' }}>
          {previousWeek && <Link href={`/dashboard/week/${previousWeek.id}`} className={styles.navLink}>← PREVIOUS WEEK (OLDER)</Link>}
          {nextWeek && <Link href={`/dashboard/week/${nextWeek.id}`} className={styles.navLink}>NEXT WEEK (NEWER) →</Link>}
        </div>
      </div>
    );
  }

  const formatDiff = (val: number) => {
    if (val > 0) return <span className={styles.diffPos}>+{val}</span>;
    if (val < 0) return <span className={styles.diffNeg}>{val}</span>;
    return <span className={styles.diffNeu}>0</span>;
  };

  return (
    <div className={styles.container}>
      {/* 1. Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.subtitle}>WEEKLY INTELLIGENCE BRIEF</div>
          <h1 className={styles.title}>SITREP // W{week.weekNumber}</h1>
          <div className={styles.meta}>
            <span>{week.startDate} — {week.endDate}</span>
            <span>STATUS: {week.status.toUpperCase()}</span>
          </div>
        </div>
        <div className={styles.navigation}>
          {previousWeek && <Link href={`/dashboard/week/${previousWeek.id}`} className={styles.navLink}>← PREVIOUS WEEK (OLDER)</Link>}
          <Link href={`/dashboard/week/${weekId}/briefing`} className={`${styles.navLink} ${styles.briefingBtn}`}>BRIEFING MODE</Link>
          {nextWeek && <Link href={`/dashboard/week/${nextWeek.id}`} className={styles.navLink}>NEXT WEEK (NEWER) →</Link>}
        </div>
      </div>

      {/* 2. Intelligence Summary */}
      <div>
        <h2 className={styles.sectionHeader}>INTELLIGENCE SUMMARY</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{summary.total}</span>
            <span className={styles.statLabel}>Total Items</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{summary.covered}</span>
            <span className={styles.statLabel}>Covered</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{summary.saved}</span>
            <span className={styles.statLabel}>Saved</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{summary.toRevise}</span>
            <span className={styles.statLabel}>To Revise</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{summary.revised}</span>
            <span className={styles.statLabel}>Revised</span>
          </div>
        </div>
      </div>

      {/* Takeaways (if any) */}
      {week.takeaways && week.takeaways.trim() !== '' && (
        <div>
          <h2 className={styles.sectionHeader}>WEEKLY TAKEAWAYS</h2>
          <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', whiteSpace: 'pre-wrap' }}>
            {week.takeaways}
          </div>
        </div>
      )}

      {/* 3. Coverage Gaps */}
      {coverageGaps.length > 0 && (
        <div>
          <h2 className={styles.sectionHeader} style={{ color: '#ff4444', borderColor: '#ff4444' }}>COVERAGE GAPS</h2>
          <div className={styles.gapList}>
            {coverageGaps.map((gap, i) => (
              <div key={i} className={styles.gapItem}>
                <span className={styles.gapSection}>⚠ {gap.section}</span>
                <p className={styles.gapMessage}>{gap.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Knowledge Sectors */}
      <div>
        <h2 className={styles.sectionHeader}>KNOWLEDGE SECTORS</h2>
        <div className={styles.sectorGrid}>
          {sections.map(sec => (
            <div key={sec.key} className={styles.sectorCard}>
              <h3 className={styles.sectorTitle}>{sec.label}</h3>
              <div className={styles.sectorStats}>
                <div className={styles.sectorStat}>
                  <span className={styles.sectorStatValue}>{sec.items}</span>
                  <span className={styles.sectorStatLabel}>Items</span>
                </div>
                <div className={styles.sectorStat}>
                  <span className={styles.sectorStatValue}>{sec.saved}</span>
                  <span className={styles.sectorStatLabel}>Saved</span>
                </div>
                <div className={styles.sectorStat}>
                  <span className={styles.sectorStatValue}>{sec.toRevise}</span>
                  <span className={styles.sectorStatLabel}>To Revise</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Revision Progress */}
      <div>
        <h2 className={styles.sectionHeader}>REVISION STATUS</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{revision.unread}</span>
            <span className={styles.statLabel}>Unread</span>
          </div>
          <div className={styles.statCard} style={{ borderBottom: '3px solid #e2b93b' }}>
            <span className={styles.statValue}>{revision.reading}</span>
            <span className={styles.statLabel}>Reading</span>
          </div>
          <div className={styles.statCard} style={{ borderBottom: '3px solid #98c379' }}>
            <span className={styles.statValue}>{revision.reviewed}</span>
            <span className={styles.statLabel}>Reviewed</span>
          </div>
          <div className={styles.statCard} style={{ borderBottom: '3px solid var(--accent)' }}>
            <span className={styles.statValue}>{revision.revised}</span>
            <span className={styles.statLabel}>Revised</span>
          </div>
        </div>
      </div>

      {/* 6. Saved Intelligence */}
      {saved.length > 0 && (
        <div>
          <h2 className={styles.sectionHeader}>SAVED INTELLIGENCE</h2>
          <div className={styles.recordList}>
            {saved.map(record => (
              <div key={record.id} className={styles.recordItem}>
                <Link href={`/dashboard/knowledge/${record.section}/${record.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                  <div className={styles.recordInfo}>
                    <span className={styles.recordSection}>{SECTION_META[record.section]?.label || record.section.toUpperCase()}</span>
                    <h4 className={styles.recordTitle}>★ {record.title}</h4>
                  </div>
                </Link>
                <div className={styles.recordControls}>
                  <SaveControl 
                    section={record.section} 
                    id={record.id} 
                    initialSaved={record.fields.saved || false}
                    onUpdate={() => mutate()}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Revision Queue */}
      {revisionQueue.length > 0 && (
        <div>
          <h2 className={styles.sectionHeader}>REVISION QUEUE</h2>
          <div className={styles.recordList}>
            {revisionQueue.map(record => (
              <div key={record.id} className={styles.recordItem}>
                <Link href={`/dashboard/knowledge/${record.section}/${record.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                  <div className={styles.recordInfo}>
                    <span className={styles.recordSection}>{SECTION_META[record.section]?.label || record.section.toUpperCase()}</span>
                    <h4 className={styles.recordTitle}>{record.title}</h4>
                  </div>
                </Link>
                <div className={styles.recordControls}>
                  <RevisionControl 
                    section={record.section} 
                    id={record.id} 
                    initialRevision={(record.fields.revision || 'Unread') as RevisionStatus}
                    onUpdate={() => mutate()}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Weekly Continuity */}
      {continuity && previousWeek && (
        <div>
          <h2 className={styles.sectionHeader}>WEEKLY CONTINUITY</h2>
          <div className={styles.continuityFlex}>
            <div className={styles.continuitySide}>
              <h3>W{week.weekNumber} (THIS WEEK)</h3>
              <div className={styles.statValue}>{summary.total} <span className={styles.statLabel}>ITEMS</span></div>
              <div className={styles.statValue}>{summary.saved} <span className={styles.statLabel}>SAVED</span></div>
              <div className={styles.statValue}>{summary.toRevise} <span className={styles.statLabel}>TO REVISE</span></div>
            </div>
            
            <div className={`${styles.continuitySide} ${styles.vs}`}>VS</div>
            
            <div className={styles.continuitySide}>
              <h3>W{previousWeek.weekNumber} (PREV WEEK)</h3>
              <div className={styles.statValue}>{continuity.previousTotal} <span className={styles.statLabel}>ITEMS</span></div>
              <div className={styles.statValue}>{continuity.previousSaved} <span className={styles.statLabel}>SAVED</span></div>
              <div className={styles.statValue}>{continuity.previousToRevise} <span className={styles.statLabel}>TO REVISE</span></div>
            </div>
            
            <div className={styles.continuitySide}>
              <h3>CHANGES</h3>
              <div className={styles.diffList}>
                <div className={styles.diffItem}>
                  <span>ITEMS</span>
                  <span>{formatDiff(continuity.itemsDiff)}</span>
                </div>
                <div className={styles.diffItem}>
                  <span>SAVED</span>
                  <span>{formatDiff(continuity.savedDiff)}</span>
                </div>
                <div className={styles.diffItem}>
                  <span>TO REVISE</span>
                  <span>{formatDiff(continuity.toReviseDiff)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

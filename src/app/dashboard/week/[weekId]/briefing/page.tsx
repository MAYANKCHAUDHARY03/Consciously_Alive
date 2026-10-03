'use client';

import { useWeeklyReview } from '@/lib/hooks/useWeeklyReview';
import styles from '../week.module.css';
import Link from 'next/link';
import { use } from 'react';
import { SECTION_META, SectionKey, ContentRecord } from '@/lib/notion/content';

export default function BriefingModePage({ params }: { params: Promise<{ weekId: string }> }) {
  const { weekId } = use(params);
  const { review, isLoading, error } = useWeeklyReview(weekId);

  if (isLoading) {
    return (
      <div className={styles.centerState}>
        <h2>INITIALIZING BRIEFING MODE...</h2>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className={styles.centerState}>
        <h2 style={{ color: '#ff4444' }}>RETRIEVAL FAILED</h2>
        <p>Unable to load the briefing.</p>
        <Link href={`/dashboard/week/${weekId}`} className={styles.navLink}>RETURN TO WEEKLY REVIEW</Link>
      </div>
    );
  }

  const { week, summary, recordsBySection, revisionQueue } = review;
  
  if (summary.total === 0) {
    return (
      <div className={styles.centerState}>
        <h2>NO INTELLIGENCE RECORDED</h2>
        <p>No knowledge records have been logged for this week.</p>
        <Link href={`/dashboard/week/${weekId}`} className={styles.navLink} style={{ marginTop: '1rem', display: 'inline-block' }}>RETURN TO WEEKLY REVIEW</Link>
      </div>
    );
  }

  const renderRecords = (sectionKey: SectionKey, records: ContentRecord[]) => {
    if (records.length === 0) return <p style={{ color: 'var(--text-secondary)' }}>No records logged.</p>;

    return (
      <div className={styles.recordList}>
        {records.map(record => (
          <Link key={record.id} href={`/dashboard/knowledge/${record.section}/${record.id}`} className={styles.recordItem} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <div className={styles.recordInfo} style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <h4 className={styles.recordTitle}>
                  {record.fields.saved ? '★ ' : ''}{record.title}
                </h4>
                {record.fields.revision && record.fields.revision !== 'Unread' && (
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--accent)' }}>
                    {record.fields.revision.toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* Show excerpt or topic if available */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                {record.fields.topic && (
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    TOPIC: {record.fields.topic}
                  </span>
                )}
                {record.fields.category && (
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    CAT: {record.fields.category}
                  </span>
                )}
                {sectionKey === 'oir' && (
                  <>
                    {record.fields.totalQuestions !== undefined && (
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Q: {record.fields.totalQuestions}
                      </span>
                    )}
                    {record.fields.accuracy !== undefined && (
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        ACC: {Math.round(record.fields.accuracy * 100)}%
                      </span>
                    )}
                    {record.fields.timeTaken !== undefined && (
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        TIME: {record.fields.timeTaken}m
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  const sectionsToRender: SectionKey[] = [
    'general-awareness',
    'defence',
    'current-affairs',
    'editorials',
    'vocabulary',
    'oir',
    'resources'
  ];

  return (
    <div className={styles.container} style={{ maxWidth: '800px', padding: '2rem 1rem' }}>
      {/* Header */}
      <div className={styles.header} style={{ borderBottom: '2px solid var(--accent)', paddingBottom: '2rem' }}>
        <div className={styles.titleArea}>
          <div className={styles.subtitle}>WEEKLY INTELLIGENCE BRIEF</div>
          <h1 className={styles.title}>W{week.weekNumber} BRIEFING</h1>
          <div className={styles.meta}>
            <span>{week.startDate} — {week.endDate}</span>
          </div>
        </div>
        <div className={styles.navigation}>
          <Link href={`/dashboard/week/${weekId}`} className={styles.navLink}>← EXIT BRIEFING</Link>
        </div>
      </div>

      {/* 1. Summary */}
      <div style={{ padding: '2rem 0', borderBottom: '1px solid var(--border-color)' }}>
        <h2 className={styles.sectionHeader}>1. INTELLIGENCE SUMMARY</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          This week contains <strong>{summary.total}</strong> intelligence items. 
          Currently, <strong>{summary.covered}</strong> have been covered, 
          with <strong>{summary.saved}</strong> saved for future reference. 
          There are <strong>{summary.toRevise}</strong> items remaining in the revision queue.
        </p>
        
        {week.takeaways && week.takeaways.trim() !== '' && (
          <div style={{ marginTop: '1.5rem', background: 'rgba(var(--accent-rgb, 100, 200, 255), 0.05)', padding: '1.5rem', borderRadius: '4px', borderLeft: '4px solid var(--accent)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontFamily: 'monospace', color: 'var(--accent)', fontSize: '1rem' }}>KEY TAKEAWAYS</h3>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{week.takeaways}</div>
          </div>
        )}
      </div>

      {/* 2-8. Sections */}
      {sectionsToRender.map((section, index) => {
        const records = recordsBySection[section] || [];
        const meta = SECTION_META[section];
        
        return (
          <div key={section} style={{ padding: '2rem 0', borderBottom: '1px solid var(--border-color)' }}>
            <h2 className={styles.sectionHeader}>{index + 2}. {meta?.label.toUpperCase() || section.toUpperCase()}</h2>
            {renderRecords(section, records)}
          </div>
        );
      })}

      {/* 9. Revision Queue */}
      <div style={{ padding: '2rem 0' }}>
        <h2 className={styles.sectionHeader} style={{ color: '#e2b93b', borderBottomColor: '#e2b93b' }}>
          9. REVISION REQUIRED ({revisionQueue.length})
        </h2>
        {revisionQueue.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No items require revision.</p>
        ) : (
          <div className={styles.recordList}>
            {revisionQueue.map(record => (
              <Link key={record.id} href={`/dashboard/knowledge/${record.section}/${record.id}`} className={styles.recordItem}>
                <div className={styles.recordInfo}>
                  <span className={styles.recordSection}>{SECTION_META[record.section]?.label || record.section.toUpperCase()}</span>
                  <h4 className={styles.recordTitle}>{record.title}</h4>
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#e2b93b', fontWeight: 600 }}>
                  {record.fields.revision?.toUpperCase() || 'UNREAD'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '4rem', paddingBottom: '4rem' }}>
        <div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', marginBottom: '1rem' }}>END OF BRIEFING</div>
        <Link href={`/dashboard/week/${weekId}`} className={styles.navLink}>RETURN TO DASHBOARD</Link>
      </div>
    </div>
  );
}

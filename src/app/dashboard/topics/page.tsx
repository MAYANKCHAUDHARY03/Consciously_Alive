'use client';

import React from 'react';
import Link from 'next/link';
import styles from '@/app/dashboard/page.module.css';
import { useRecurringTopics } from '@/lib/hooks/useSynthesis';

export default function RecurringTopicsPage() {
  const { topics, isLoading, error } = useRecurringTopics();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.subtitle}>SYNTHESIS</div>
          <h1 className={styles.title}>RECURRING TOPICS</h1>
          <div className={styles.meta}>
            <span>IDENTIFY THEMES ACROSS WEEKS</span>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className={styles.centerState}>
          <h2>ANALYZING TOPICS...</h2>
        </div>
      ) : error ? (
        <div className={styles.centerState}>
          <h2 style={{ color: '#ff4444' }}>RETRIEVAL FAILED</h2>
          <p>Unable to load recurring topics.</p>
        </div>
      ) : !topics || topics.length === 0 ? (
        <div className={styles.centerState}>
          <h2>NO RECURRING TOPICS</h2>
          <p>No topic has appeared across multiple recorded weeks yet.</p>
        </div>
      ) : (
        <div className={styles.recordList}>
          {topics.map(t => (
            <Link key={t.topic} href={`/dashboard/topics/${encodeURIComponent(t.topic)}`} className={styles.recordItem} style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{t.topic.toUpperCase()}</h3>
                <span className="technical-label" style={{ color: 'var(--accent)' }}>
                  {t.weeksActive} WEEKS ACTIVE
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', width: '100%' }}>
                <div>
                  <div className="technical-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>TOTAL RECORDS</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 300 }}>{t.totalRecords}</div>
                </div>
                <div>
                  <div className="technical-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>SAVED</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 300, color: 'var(--accent)' }}>{t.savedCount}</div>
                </div>
                <div>
                  <div className="technical-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>TO REVISE</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 300 }}>{t.revisionCount}</div>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div className="technical-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>FREQUENCY</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {Object.entries(t.recordsByWeek).sort((a,b) => b[0].localeCompare(a[0])).map(([week, count]) => (
                      <span key={week} style={{ fontSize: '0.85rem', fontFamily: 'monospace', padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                        {week} <span style={{ color: 'var(--text-secondary)' }}>({count})</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

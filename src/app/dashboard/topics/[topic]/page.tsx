'use client';

import React, { use } from 'react';
import Link from 'next/link';
import styles from '@/app/dashboard/page.module.css';
import { useTopicTimeline } from '@/lib/hooks/useSynthesis';

export default function TopicExplorerPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = use(params);
  const decodedTopic = decodeURIComponent(topic);
  const { timeline, isLoading, error } = useTopicTimeline(decodedTopic);

  return (
    <div className={styles.container} style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.subtitle}>TOPIC EXPLORER</div>
          <h1 className={styles.title}>{decodedTopic.toUpperCase()}</h1>
          <div className={styles.meta}>
            <span>CHRONOLOGICAL TIMELINE</span>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className={styles.centerState}>
          <h2>ANALYZING TIMELINE...</h2>
        </div>
      ) : error ? (
        <div className={styles.centerState}>
          <h2 style={{ color: '#ff4444' }}>RETRIEVAL FAILED</h2>
          <p>Unable to load topic timeline.</p>
        </div>
      ) : !timeline || timeline.length === 0 ? (
        <div className={styles.centerState}>
          <h2>NO INTELLIGENCE RECORDED</h2>
          <p>No records found for this topic.</p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '2rem', borderLeft: '2px solid var(--border-color)', margin: '2rem 0' }}>
          {timeline.map((record) => (
            <div key={record.id} style={{ position: 'relative', marginBottom: '2rem' }}>
              <div style={{ 
                position: 'absolute', 
                left: '-2.45rem', 
                top: '0.25rem', 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%', 
                background: 'var(--background)',
                border: '2px solid var(--accent)'
              }} />
              
              <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span className="technical-label" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(record.fields.date || record.createdAt).toLocaleDateString()}
                </span>
                <span className="technical-label" style={{ color: 'var(--accent)' }}>
                  {record.section.toUpperCase()}
                </span>
                {record.fields.week && (
                  <span className="technical-label">WEEK {record.fields.week}</span>
                )}
              </div>
              
              <Link href={`/dashboard/knowledge/${record.section}/${record.id}`} className={styles.recordItem} style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 500 }}>
                  {record.fields.saved ? '★ ' : ''}{record.title}
                </h3>
                {record.fields.category && (
                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                    {record.fields.category}
                  </span>
                )}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

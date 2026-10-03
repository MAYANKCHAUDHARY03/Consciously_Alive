'use client';

import React from 'react';
import Link from 'next/link';
import styles from '@/app/dashboard/page.module.css';
import { useTopicTimeline } from '@/lib/hooks/useSynthesis';

export default function TopicContinuityInRecord({ topic, currentId }: { topic?: string, currentId: string, currentSection: string }) {
  const { timeline, isLoading, error } = useTopicTimeline(topic || '');

  if (!topic) return null;

  if (isLoading) {
    return (
      <div style={{ padding: '2rem 0', borderTop: '1px solid var(--border-color)' }}>
        <h3 className={styles.sectionHeader} style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>TOPIC CONTINUITY</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Analyzing timeline...</p>
      </div>
    );
  }

  if (error || !timeline || timeline.length <= 1) {
    // If only 1 record (this one), don't show topic continuity since there's no continuity.
    return null;
  }

  const currentIndex = timeline.findIndex(r => r.id === currentId);
  // Sort is oldest to newest, so "Previous" is index - 1, "Next" is index + 1
  const prevRecord = currentIndex > 0 ? timeline[currentIndex - 1] : null;
  const nextRecord = currentIndex >= 0 && currentIndex < timeline.length - 1 ? timeline[currentIndex + 1] : null;

  return (
    <div style={{ padding: '2rem 0', borderTop: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 className={styles.sectionHeader} style={{ fontSize: '1rem', margin: 0 }}>TOPIC CONTINUITY // {topic.toUpperCase()}</h3>
        <Link href={`/dashboard/topics/${encodeURIComponent(topic)}`} className={styles.navLink} style={{ fontSize: '0.75rem' }}>
          EXPLORE TOPIC →
        </Link>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        {prevRecord ? (
          <Link href={`/dashboard/knowledge/${prevRecord.section}/${prevRecord.id}`} className={styles.recordItem} style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>← PREVIOUS IN TOPIC</span>
            <span style={{ fontWeight: 500, marginTop: '0.25rem' }}>{prevRecord.title}</span>
          </Link>
        ) : (
          <div className={styles.recordItem} style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-start', opacity: 0.5, cursor: 'default' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>← PREVIOUS IN TOPIC</span>
            <span style={{ fontWeight: 500, marginTop: '0.25rem' }}>None</span>
          </div>
        )}

        {nextRecord ? (
          <Link href={`/dashboard/knowledge/${nextRecord.section}/${nextRecord.id}`} className={styles.recordItem} style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-start', textAlign: 'right' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)', width: '100%' }}>NEXT IN TOPIC →</span>
            <span style={{ fontWeight: 500, marginTop: '0.25rem', width: '100%' }}>{nextRecord.title}</span>
          </Link>
        ) : (
          <div className={styles.recordItem} style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-start', textAlign: 'right', opacity: 0.5, cursor: 'default' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)', width: '100%' }}>NEXT IN TOPIC →</span>
            <span style={{ fontWeight: 500, marginTop: '0.25rem', width: '100%' }}>None</span>
          </div>
        )}
      </div>
    </div>
  );
}

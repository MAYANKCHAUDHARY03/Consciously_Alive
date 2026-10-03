'use client';

import React from 'react';
import Link from 'next/link';
import styles from '@/app/dashboard/page.module.css';
import { useRelatedIntelligence } from '@/lib/hooks/useSynthesis';

export default function RelatedIntelligence({ section, id }: { section: string, id: string }) {
  const { related, isLoading, error } = useRelatedIntelligence(section, id);

  if (isLoading) {
    return (
      <div style={{ padding: '2rem 0', borderTop: '1px solid var(--border-color)', marginTop: '2rem' }}>
        <h3 className={styles.sectionHeader} style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>RELATED INTELLIGENCE</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Analyzing connections...</p>
      </div>
    );
  }

  if (error || !related) {
    return null;
  }

  if (related.length === 0) {
    return (
      <div style={{ padding: '2rem 0', borderTop: '1px solid var(--border-color)', marginTop: '2rem' }}>
        <h3 className={styles.sectionHeader} style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>RELATED INTELLIGENCE</h3>
        <p style={{ color: 'var(--text-secondary)' }}>NO RELATED INTELLIGENCE. No closely related records were found in the current knowledge base.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 0', borderTop: '1px solid var(--border-color)', marginTop: '2rem' }}>
      <h3 className={styles.sectionHeader} style={{ fontSize: '1rem' }}>RELATED INTELLIGENCE</h3>
      <div className={styles.recordList}>
        {related.map(r => (
          <Link key={r.id} href={`/dashboard/knowledge/${r.section}/${r.id}`} className={styles.recordItem} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '0.25rem' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {r.section.toUpperCase()} {r.weekLabel ? `// W${r.weekLabel}` : ''}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--accent)' }}>
                REASON // {r.reason}
              </span>
            </div>
            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 500 }}>
              {r.title}
            </h4>
          </Link>
        ))}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from '@/app/dashboard/page.module.css';
import { useSearch } from '@/lib/hooks/useSearch';
import { SectionKey, VALID_SECTIONS } from '@/lib/notion/content';

export default function TimelinePage() {
  const [section, setSection] = useState<SectionKey | 'all'>('all');
  const { results, isLoading, error } = useSearch({ q: '', section, limit: 100 });

  return (
    <div className={styles.container} style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.subtitle}>SYNTHESIS</div>
          <h1 className={styles.title}>KNOWLEDGE TIMELINE</h1>
          <div className={styles.meta}>
            <span>CHRONOLOGICAL RECORD VIEW</span>
          </div>
        </div>
      </header>

      <div className={styles.searchBar} style={{ marginBottom: '2rem' }}>
        <select 
          className={styles.searchSelect}
          value={section} 
          onChange={(e) => setSection(e.target.value as SectionKey | 'all')}
        >
          <option value="all">ALL SECTIONS</option>
          {VALID_SECTIONS.map(s => (
            <option key={s} value={s}>{s.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className={styles.centerState}>
          <h2>BUILDING TIMELINE...</h2>
        </div>
      ) : error ? (
        <div className={styles.centerState}>
          <h2 style={{ color: '#ff4444' }}>RETRIEVAL FAILED</h2>
          <p>Unable to load timeline.</p>
        </div>
      ) : !results || results.length === 0 ? (
        <div className={styles.centerState}>
          <h2>NO INTELLIGENCE RECORDED</h2>
          <p>No knowledge records found.</p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '2rem', borderLeft: '2px solid var(--border-color)', margin: '2rem 0' }}>
          {results.map((record) => (
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
              
              <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="technical-label" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(record.createdAt).toLocaleDateString()}
                </span>
                <span className="technical-label" style={{ color: 'var(--accent)' }}>
                  {record.sectionLabel.toUpperCase()}
                </span>
                {record.weekLabel && record.weekLabel !== 'No Week' && (
                  <span className="technical-label">WEEK {record.weekLabel}</span>
                )}
                {record.topic && (
                  <Link href={`/dashboard/topics/${encodeURIComponent(record.topic)}`} className="technical-label" style={{ color: 'var(--text-primary)', textDecoration: 'none', borderBottom: '1px dotted var(--text-secondary)' }}>
                    TOPIC: {record.topic.toUpperCase()}
                  </Link>
                )}
              </div>
              
              <Link href={`/dashboard/knowledge/${record.section}/${record.id}`} className={styles.recordItem} style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 500 }}>
                  {record.saved ? '★ ' : ''}{record.title}
                </h3>
                {record.excerpt && (
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    {record.excerpt.length > 150 ? record.excerpt.substring(0, 150) + '...' : record.excerpt}
                  </p>
                )}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

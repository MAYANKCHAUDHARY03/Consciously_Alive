'use client';

import { useState } from 'react';
import styles from '../search/page.module.css';
import { useSearch } from '@/lib/hooks/useSearch';
import { SearchParams } from '@/lib/notion/search';
import { VALID_SECTIONS, SECTION_META, SectionKey } from '@/lib/notion/content';
import Link from 'next/link';
import SaveControl from '@/components/knowledge/SaveControl';
import RevisionControl from '@/components/knowledge/RevisionControl';
import { RevisionStatus } from '@/lib/notion/types';
import { useRevisionIntelligence } from '@/lib/hooks/useSynthesis';

export default function RevisionQueuePage() {
  const [params, setParams] = useState<SearchParams>({
    q: '',
    section: 'all',
    revision: 'Unread', // Default to Unread for the queue
    limit: 50
  });

  const [debouncedParams, setDebouncedParams] = useState<SearchParams>(params);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedParams(params);
  };

  const { results, isLoading, isError, error } = useSearch(debouncedParams);

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchHeader}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h1 className={styles.title}>REVISION QUEUE</h1>
          <span className="technical-label" style={{ color: 'var(--text-secondary)' }}>TRACK & MASTER KNOWLEDGE</span>
        </div>
      </div>
      
      <RevisionIntelligencePanel />

      <form className={styles.controls} onSubmit={handleSearch}>
        <div className={styles.inputGroup}>
          <label>Search Query</label>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search items..."
            value={params.q || ''}
            onChange={(e) => setParams({ ...params, q: e.target.value })}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Status</label>
          <select
            className={styles.selectInput}
            value={params.revision || 'all'}
            onChange={(e) => setParams({ ...params, revision: e.target.value })}
          >
            <option value="all">All Statuses</option>
            <option value="Unread">Unread</option>
            <option value="Reading">Reading</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Revised">Revised</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label>Section</label>
          <select
            className={styles.selectInput}
            value={params.section || 'all'}
            onChange={(e) => setParams({ ...params, section: e.target.value as SectionKey | 'all' })}
          >
            <option value="all">All Sections</option>
            {VALID_SECTIONS.map(s => (
              <option key={s} value={s}>{SECTION_META[s].label}</option>
            ))}
          </select>
        </div>

        <div className={styles.inputGroup} style={{ flex: 'none', justifyContent: 'flex-end' }}>
          <button type="submit" className={styles.searchInput} style={{ background: 'var(--accent-color)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
            FILTER
          </button>
        </div>
      </form>

      <div className={styles.resultsArea}>
        <div className={styles.resultsHeader}>
          <span className={styles.resultsCount}>
            {results.length} {results.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>

        {isLoading ? (
          <div className={styles.loadingState}>Fetching revision queue...</div>
        ) : isError ? (
          <div className={styles.errorState}>Error: {error?.message || 'Failed to fetch results'}</div>
        ) : results.length === 0 ? (
          <div className={styles.emptyState}>No items found in this queue.</div>
        ) : (
          <div className={styles.resultsList}>
            {results.map(result => (
              <div key={result.id} className={styles.card}>
                <Link href={`/dashboard/knowledge/${result.section}/${result.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardSection}>{result.sectionLabel}</span>
                    <span className={styles.cardWeek}>{result.weekLabel}</span>
                  </div>
                  <h3 className={styles.cardTitle}>{result.title}</h3>
                  {result.excerpt && (
                    <p className={styles.cardExcerpt}>{result.excerpt}</p>
                  )}
                  <div className={styles.cardMeta}>
                    {result.topic && <span className={styles.tag}>{result.topic}</span>}
                    {result.type && <span className={styles.tag}>{result.type}</span>}
                    <span className={styles.tag}>
                      {new Date(result.updatedAt).toISOString().split('T')[0]}
                    </span>
                  </div>
                </Link>
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <SaveControl 
                    section={result.section} 
                    id={result.id} 
                    initialSaved={result.saved || false} 
                    size="small"
                  />
                  <RevisionControl 
                    section={result.section} 
                    id={result.id} 
                    initialRevision={result.revision as RevisionStatus} 
                    size="small"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RevisionIntelligencePanel() {
  const { priorities, isLoading, error } = useRevisionIntelligence();

  if (isLoading || error || !priorities || priorities.length === 0) return null;

  const topPriorities = priorities.slice(0, 5);

  return (
    <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', borderLeft: '4px solid #e2b93b' }}>
      <h2 className="technical-label" style={{ color: '#e2b93b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        REVISION QUEUE PRIORITY
      </h2>
      <div className={styles.resultsList}>
        {topPriorities.map(p => (
          <Link key={p.id} href={`/dashboard/knowledge/${p.section}/${p.id}`} className={styles.card} style={{ border: '1px solid var(--border-color)', background: 'var(--background)' }}>
            <div className={styles.cardHeader} style={{ marginBottom: '0.5rem' }}>
              <span className={styles.cardSection} style={{ color: '#e2b93b' }}>
                {p.priorityReasons.join(' // ')}
              </span>
            </div>
            <h3 className={styles.cardTitle} style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
              {p.fields.saved ? '★ ' : ''}{p.title}
            </h3>
            <div className={styles.cardMeta}>
              <span className={styles.tag}>{p.section.toUpperCase()}</span>
              {p.weekLabel && <span className={styles.tag}>W{p.weekLabel}</span>}
              <span className={styles.tag} style={{ color: 'var(--accent)' }}>SCORE: {p.priorityScore}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

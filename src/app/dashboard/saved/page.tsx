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
import { useSavedSynthesis } from '@/lib/hooks/useSynthesis';

export default function SavedIntelligencePage() {
  const [params, setParams] = useState<SearchParams>({
    q: '',
    section: 'all',
    saved: true,
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
          <h1 className={styles.title}>SAVED INTELLIGENCE</h1>
          <span className="technical-label" style={{ color: 'var(--text-secondary)' }}>BOOKMARKED KNOWLEDGE</span>
        </div>
      </div>
      
      <SavedSynthesisPanel />

      <form className={styles.controls} onSubmit={handleSearch}>
        <div className={styles.inputGroup}>
          <label>Search Query</label>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search saved items..."
            value={params.q || ''}
            onChange={(e) => setParams({ ...params, q: e.target.value })}
          />
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

        <div className={styles.inputGroup} style={{ maxWidth: '150px' }}>
          <label>Limit</label>
          <select
            className={styles.selectInput}
            value={params.limit || 50}
            onChange={(e) => setParams({ ...params, limit: Number(e.target.value) })}
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
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
            {results.length} {results.length === 1 ? 'Saved Item' : 'Saved Items'}
          </span>
        </div>

        {isLoading ? (
          <div className={styles.loadingState}>Fetching saved intelligence...</div>
        ) : isError ? (
          <div className={styles.errorState}>Error: {error?.message || 'Failed to fetch results'}</div>
        ) : results.length === 0 ? (
          <div className={styles.emptyState}>No saved intelligence found. Bookmark items to see them here.</div>
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
                    initialRevision={result.revision as RevisionStatus | undefined} 
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

function SavedSynthesisPanel() {
  const { synthesis, isLoading, error } = useSavedSynthesis();

  if (isLoading || error || !synthesis || synthesis.totalSaved === 0) return null;

  return (
    <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', borderLeft: '4px solid var(--accent)' }}>
      <h2 className="technical-label" style={{ color: 'var(--accent)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        SYNTHESIS
      </h2>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div>
          <div className="technical-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>TOTAL SAVED</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 300 }}>{synthesis.totalSaved}</div>
        </div>
        <div>
          <div className="technical-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>UNREAD</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 300, color: '#e2b93b' }}>{synthesis.unread}</div>
        </div>
        <div>
          <div className="technical-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>READING</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 300 }}>{synthesis.reading}</div>
        </div>
        <div>
          <div className="technical-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>REVIEWED</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 300 }}>{synthesis.reviewed}</div>
        </div>
        <div>
          <div className="technical-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>REVISED</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 300 }}>{synthesis.revised}</div>
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div className="technical-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>TOP RECURRING TOPICS</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {synthesis.topTopics.map(t => (
              <span key={t} style={{ fontSize: '0.85rem', fontFamily: 'monospace', padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                {t.toUpperCase()}
              </span>
            ))}
            {synthesis.topTopics.length === 0 && <span style={{ color: 'var(--text-secondary)' }}>None</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

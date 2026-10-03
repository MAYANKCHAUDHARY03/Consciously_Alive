'use client';

import { useState } from 'react';
import styles from './page.module.css';
import { useSearch } from '@/lib/hooks/useSearch';
import { SearchParams } from '@/lib/notion/search';
import { VALID_SECTIONS, SECTION_META, SectionKey } from '@/lib/notion/content';
import Link from 'next/link';
import SaveControl from '@/components/knowledge/SaveControl';
import RevisionControl from '@/components/knowledge/RevisionControl';
import { RevisionStatus } from '@/lib/notion/types';

export default function SearchPage() {
  const [params, setParams] = useState<SearchParams>({
    q: '',
    section: 'all',
    includeArchived: false,
    limit: 50
  });

  const [debouncedParams, setDebouncedParams] = useState<SearchParams>(params);

  // Simple debounce for typing in the text input
  // Since this is a simple dashboard, we can just trigger search on blur or enter,
  // but a submit button is easier to control for the user.
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedParams(params);
  };

  const { results, isLoading, isError, error } = useSearch(debouncedParams);

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchHeader}>
        <h1 className={styles.title}>Knowledge Retrieval</h1>
      </div>

      <form className={styles.controls} onSubmit={handleSearch}>
        <div className={styles.inputGroup}>
          <label>Search Query</label>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search keywords..."
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

        <div className={styles.checkboxGroup}>
          <input
            type="checkbox"
            id="includeArchived"
            checked={params.includeArchived || false}
            onChange={(e) => setParams({ ...params, includeArchived: e.target.checked })}
          />
          <label htmlFor="includeArchived">Include Archived</label>
        </div>

        <div className={styles.inputGroup} style={{ flex: 'none', justifyContent: 'flex-end' }}>
          <button type="submit" className={styles.searchInput} style={{ background: 'var(--accent-color)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
            SEARCH
          </button>
        </div>
      </form>

      <div className={styles.resultsArea}>
        <div className={styles.resultsHeader}>
          <span className={styles.resultsCount}>
            {results.length} {results.length === 1 ? 'Result' : 'Results'}
          </span>
        </div>

        {isLoading ? (
          <div className={styles.loadingState}>Searching knowledge base...</div>
        ) : isError ? (
          <div className={styles.errorState}>Error: {error?.message || 'Failed to fetch results'}</div>
        ) : results.length === 0 ? (
          <div className={styles.emptyState}>No results found matching your criteria.</div>
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
                    {result.archived && <span className={styles.tag} style={{ color: '#e06c75', borderColor: '#e06c75' }}>Archived</span>}
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

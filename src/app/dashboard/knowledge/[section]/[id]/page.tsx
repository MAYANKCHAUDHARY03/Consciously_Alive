'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './page.module.css';
import { useContentRecord } from '@/lib/hooks/useContent';
import { SECTION_META, SectionKey } from '@/lib/notion/content';
import SaveControl from '@/components/knowledge/SaveControl';
import RevisionControl from '@/components/knowledge/RevisionControl';
import RelatedIntelligence from '@/components/knowledge/RelatedIntelligence';
import TopicContinuityInRecord from '@/components/knowledge/TopicContinuityInRecord';
import ContentForm from '@/components/content/ContentForm';
import { RevisionStatus } from '@/lib/notion/types';

export default function KnowledgeDetailView({
  params
}: {
  params: Promise<{ section: string; id: string }>;
}) {
  const router = useRouter();
  const { section, id } = use(params);
  
  const [isEditing, setIsEditing] = useState(false);
  const { record, isLoading, error, mutate } = useContentRecord(section, id);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className="technical-label">STATUS // FETCHING</div>
          <p>LOADING KNOWLEDGE RECORD...</p>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <div className="technical-label">SYSTEM ALERT</div>
          <h2>Unable to load record</h2>
          <p>{error?.message || 'Record not found.'}</p>
          <button onClick={() => router.back()} className={styles.editBtn} style={{ marginTop: '1rem' }}>
            ← GO BACK
          </button>
        </div>
      </div>
    );
  }

  const handleEditSuccess = () => {
    setIsEditing(false);
    mutate();
  };

  if (isEditing) {
    return (
      <div className={styles.container}>
        <button className={styles.backBtn} onClick={() => setIsEditing(false)}>
          ← EXIT EDIT MODE
        </button>
        <h1 className={styles.title} style={{ marginBottom: '2rem' }}>EDIT: {record.title}</h1>
        <ContentForm 
          section={section as SectionKey} 
          weekId={record.weekId || ''} 
          initialData={record} 
          onSuccess={handleEditSuccess} 
          onCancel={() => setIsEditing(false)} 
        />
      </div>
    );
  }

  const { fields } = record;
  const sectionLabel = SECTION_META[section as SectionKey]?.label || section.toUpperCase();

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => router.back()}>
        ← BACK TO RESULTS
      </button>

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className="technical-label">FILE {'//'} {sectionLabel} {'//'} {id.split('-')[0]}</div>
          <h1 className={styles.title}>{record.title}</h1>
          <div className={styles.metaRow}>
            {(fields.topic || fields.category) && (
              <span className={styles.tag}>{fields.topic || fields.category}</span>
            )}
            {fields.type && <span className={styles.tag}>{fields.type}</span>}
            <span className={styles.tag}>
              UPDATED: {new Date(record.updatedAt).toISOString().split('T')[0]}
            </span>
            {fields.status === 'Archived' && (
              <span className={styles.tag} style={{ color: '#e06c75', borderColor: '#e06c75' }}>ARCHIVED</span>
            )}
          </div>
        </div>
        
        <div className={styles.controls}>
          <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
            EDIT ✎
          </button>
          <SaveControl 
            section={section} 
            id={id} 
            initialSaved={fields.saved || false} 
            size="large"
          />
          <RevisionControl 
            section={section} 
            id={id} 
            initialRevision={fields.revision as RevisionStatus} 
            size="large"
          />
        </div>
      </header>

      <main className={styles.contentBody}>
        {fields.content || fields.summary || fields.meaning || fields.description || fields.notes || 'No content available for this record.'}
      </main>

      <section className={styles.metaSection}>
        <h2 className="technical-label" style={{ marginBottom: '1.5rem' }}>METADATA & DETAILS</h2>
        <div className={styles.metaGrid}>
          {fields.source && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Source</span>
              <span className={styles.metaValue}>{fields.source}</span>
            </div>
          )}
          {fields.url && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>URL / Link</span>
              <a href={fields.url} target="_blank" rel="noopener noreferrer" className={styles.metaValue} style={{ color: 'var(--accent)' }}>
                {fields.url.length > 30 ? fields.url.substring(0, 30) + '...' : fields.url} ↗
              </a>
            </div>
          )}
          {fields.keyPoints && (
            <div className={styles.metaItem} style={{ gridColumn: '1 / -1' }}>
              <span className={styles.metaLabel}>Key Points</span>
              <span className={styles.metaValue}>{fields.keyPoints}</span>
            </div>
          )}
          {fields.usage && (
            <div className={styles.metaItem} style={{ gridColumn: '1 / -1' }}>
              <span className={styles.metaLabel}>Usage Example</span>
              <span className={styles.metaValue}>&quot;{fields.usage}&quot;</span>
            </div>
          )}
          {fields.synonyms && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Synonyms</span>
              <span className={styles.metaValue}>{fields.synonyms}</span>
            </div>
          )}
          {fields.difficulty && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Difficulty</span>
              <span className={styles.metaValue}>{fields.difficulty}</span>
            </div>
          )}
          {fields.totalQuestions !== undefined && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Questions</span>
              <span className={styles.metaValue}>{fields.totalQuestions}</span>
            </div>
          )}
          {fields.accuracy !== undefined && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Accuracy</span>
              <span className={styles.metaValue}>{fields.accuracy}%</span>
            </div>
          )}
          {fields.timeTaken && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Time Taken</span>
              <span className={styles.metaValue}>{fields.timeTaken} mins</span>
            </div>
          )}
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Created</span>
            <span className={styles.metaValue}>{new Date(record.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </section>

      <RelatedIntelligence section={section} id={id} />
      <TopicContinuityInRecord topic={fields.topic || undefined} currentId={id} currentSection={section} />
    </div>
  );
}

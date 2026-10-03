'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { DashboardData } from '@/lib/notion/dashboard';
import styles from './page.module.css';
import contentStyles from '@/components/content/content.module.css';

import ContentModal from '@/components/content/ContentModal';
import SectionSelector from '@/components/content/SectionSelector';
import ContentForm from '@/components/content/ContentForm';
import ContentList from '@/components/content/ContentList';
import type { SectionKey, ContentRecord } from '@/lib/notion/content';

import { fetcher } from '@/lib/hooks/fetcher';

const sectionsConfig = [
  { key: 'generalAwareness', dbKey: 'general-awareness', code: 'GA', title: 'GENERAL AWARENESS', icon: '🌍', desc: 'POLITY • HISTORY • GEO' },
  { key: 'defenceUpdates', dbKey: 'defence', code: 'DEF', title: 'DEFENCE UPDATES', icon: '🛡️', desc: 'ARMY • NAVY • AIR FORCE' },
  { key: 'currentAffairs', dbKey: 'current-affairs', code: 'CA', title: 'CURRENT AFFAIRS', icon: '📰', desc: 'NATIONAL • INTL • ECONOMY' },
  { key: 'editorials', dbKey: 'editorials', code: 'ED', title: 'EDITORIALS', icon: '✍️', desc: 'ANALYSIS • OPINION • BRIEFS' },
  { key: 'vocabulary', dbKey: 'vocabulary', code: 'VOC', title: 'VOCABULARY', icon: '🧩', desc: 'WORDS • USAGE • SYNONYMS' },
  { key: 'oirSets', dbKey: 'oir', code: 'OIR', title: 'OIR PRACTICE', icon: '🧠', desc: 'REASONING • SPEED • ACCURACY' },
  { key: 'resources', dbKey: 'resources', code: 'RES', title: 'RESOURCES', icon: '🔗', desc: 'VIDEOS • ARTICLES • NEWS' },
];

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const weekParam = searchParams.get('weekKey');

  // UI State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<SectionKey | null>(null);
  const [editRecord, setEditRecord] = useState<ContentRecord | null>(null);
  const [listSection, setListSection] = useState<SectionKey | null>(null);

  const queryUrl = weekParam ? `/api/notion/dashboard?weekKey=${weekParam}` : '/api/notion/dashboard';
  const { data: response, error, isLoading } = useSWR<{ success: boolean, data?: DashboardData, error?: string }>(queryUrl, fetcher);

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (!response?.data) return;
    
    // Naive navigation assuming ISO week format (YYYY-Www)
    const currentKey = response.data.week.title.split(' ')[0]; // E.g. "2026-W40"
    const [yearStr, weekStr] = currentKey.split('-W');
    let year = parseInt(yearStr, 10);
    let week = parseInt(weekStr, 10);

    if (direction === 'prev') {
      week -= 1;
      if (week < 1) {
        year -= 1;
        // Approximation: previous year's max week
        week = 52; 
      }
    } else {
      week += 1;
      if (week > 52) { // Approximation again
        year += 1;
        week = 1;
      }
    }

    const nextKey = `${year}-W${week.toString().padStart(2, '0')}`;
    router.push(`/dashboard?weekKey=${nextKey}`);
  };

  if (error) {
    return (
      <div className={styles.errorState}>
        <div className="technical-label">SYSTEM ALERT</div>
        <h2 className="title-primary">Unable to load intelligence data</h2>
        <p className={styles.errorMsg}>The connection may be temporarily unavailable.</p>
        <button onClick={() => window.location.reload()} className={styles.actionBtn}>RETRY CONNECTION</button>
      </div>
    );
  }

  if (isLoading || !response) {
    return (
      <div className={styles.loadingState}>
        <div className="technical-label">STATUS // FETCHING</div>
        <div className={styles.spinner}></div>
        <p>INITIALIZING DASHBOARD...</p>
      </div>
    );
  }

  if (!response.success || !response.data) {
    // We have a response, but it was not successful or is missing the data payload.
    // The API returns { success: false, error: '...' } in these cases.
    const apiError = response.error || 'Intelligence data is currently unavailable.';
    return (
      <div className={styles.errorState}>
        <div className="technical-label">SYSTEM ALERT</div>
        <h2 className="title-primary">Data Initialization Failed</h2>
        <p className={styles.errorMsg}>{apiError}</p>
        <button onClick={() => window.location.reload()} className={styles.actionBtn} style={{ marginTop: '1rem' }}>RETRY CONNECTION</button>
      </div>
    );
  }

  const { week, stats, recent } = response.data;
  const weekKey = week.title.split(' ')[0]; // "2026-W40"
  const weekId = week.id;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${d.getUTCDate().toString().padStart(2, '0')} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  };
  const formatShortDate = (iso: string) => {
    const d = new Date(iso);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${d.getUTCDate().toString().padStart(2, '0')} ${months[d.getUTCMonth()]}`;
  };

  const handleOpenCreate = () => {
    setSelectedSection(null);
    setIsCreateOpen(true);
  };

  const closeCreate = () => {
    setIsCreateOpen(false);
    setSelectedSection(null);
    setEditRecord(null);
  };

  const handleEdit = (record: ContentRecord) => {
    setEditRecord(record);
    setSelectedSection(record.section);
    setIsCreateOpen(true);
  };

  return (
    <div className={`${styles.dashboard} animate-fade`}>
      <header className={styles.header}>
        <div className={styles.headerTitles}>
          <h1 className="title-primary">GENERAL AWARENESS // WEEKLY BRIEF</h1>
          <div className="technical-label">CLASSIFICATION // OPEN SOURCE</div>
          
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className={contentStyles.newBriefingBtn} onClick={handleOpenCreate}>
              + NEW BRIEFING
            </button>
            <Link href="/dashboard/search" className={contentStyles.newBriefingBtn} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
              🔍 SEARCH
            </Link>
            <Link href="/dashboard/saved" className={contentStyles.newBriefingBtn} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
              ★ SAVED
            </Link>
            <Link href="/dashboard/revision" className={contentStyles.newBriefingBtn} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
              ↻ REVISION QUEUE
            </Link>
            <Link href="/dashboard/archive" className={contentStyles.newBriefingBtn} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
              📚 ARCHIVE
            </Link>
            <Link href="/dashboard/topics" className={contentStyles.newBriefingBtn} style={{ background: 'var(--bg-surface)', border: '1px solid var(--accent)', color: 'var(--accent)' }}>
              ⧉ TOPICS
            </Link>
            <Link href="/dashboard/timeline" className={contentStyles.newBriefingBtn} style={{ background: 'var(--bg-surface)', border: '1px solid var(--accent)', color: 'var(--accent)' }}>
              ⏱ TIMELINE
            </Link>
          </div>
        </div>
        
        <div className={styles.weekNavigator}>
          <div className="technical-label">SITREP // {weekKey}</div>
          <div className={styles.weekRange}>{formatShortDate(week.startDate)} — {formatDate(week.endDate)}</div>
          <div className={styles.navControls}>
            <button onClick={() => navigateWeek('prev')} className={styles.navBtn}>← PREV</button>
            <Link href={`/dashboard/week/${weekId}`} className={styles.navBtn} style={{ textDecoration: 'none', background: 'var(--accent)', color: '#000', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              WEEKLY REVIEW
            </Link>
            <div className={styles.navStatus}>STATUS // {week.status.toUpperCase()}</div>
            <button onClick={() => navigateWeek('next')} className={styles.navBtn}>NEXT →</button>
          </div>
        </div>
      </header>

      <main className={styles.mainGrid}>
        {/* Left Column */}
        <div className={styles.leftCol}>
          <section className={styles.panel}>
            <h2 className="technical-label">INTELLIGENCE SUMMARY</h2>
            <div className={styles.summaryStats}>
              <div className={styles.statBox}>
                <div className={styles.statValue}>{stats.total}</div>
                <div className={styles.statLabel}>TOTAL RECORDS</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statValue}>{stats.currentAffairs}</div>
                <div className={styles.statLabel}>CURRENT AFFAIRS</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statValue}>{stats.defenceUpdates}</div>
                <div className={styles.statLabel}>DEFENCE UPDATES</div>
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <h2 className="technical-label">KNOWLEDGE COVERAGE</h2>
            <div className={styles.coverageList}>
              {sectionsConfig.map(sec => {
                const count = stats[sec.key as keyof typeof stats] as number;
                const max = Math.max(10, count);
                const fillPercent = count > 0 ? Math.min(100, (count / max) * 100) : 0;
                
                return (
                  <div key={sec.key} className={styles.coverageRow}>
                    <div className={styles.covCode}>{sec.code}</div>
                    <div className={styles.covName}>{sec.title}</div>
                    <div className={styles.covBarContainer}>
                      <div className={styles.covBar} style={{ width: `${fillPercent}%` }}></div>
                    </div>
                    <div className={styles.covCount}>{count}</div>
                  </div>
                );
              })}
            </div>
          </section>
          
          <section className={styles.panel}>
            <h2 className="technical-label">LATEST INTELLIGENCE</h2>
            {recent.length === 0 ? (
              <div className={contentStyles.emptyState}>No intelligence gathered for this period.</div>
            ) : (
              <div className={styles.recentList}>
                {recent.map(item => (
                  <div key={item.id} className={styles.recentItem}>
                    <div className={styles.recentDate}>{formatShortDate(item.createdAt)}</div>
                    <div className={styles.recentDivider}></div>
                    <div className={styles.recentTitle}>{item.title}</div>
                    <div className={styles.recentMeta}>{item.sourceType.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column (Cards) */}
        <div className={styles.rightCol}>
          <h2 className="technical-label">KNOWLEDGE SECTORS</h2>
          <div className={styles.sectorGrid}>
            {sectionsConfig.map(sec => {
              const count = stats[sec.key as keyof typeof stats] as number;
              return (
                <div key={sec.key} className={styles.sectorCard}>
                  <div className={styles.cardHeader}>
                    <span className="technical-label">FILE // {sec.code}</span>
                    <span className={styles.cardIcon}>{sec.icon}</span>
                  </div>
                  <h3 className={styles.cardTitle}>{sec.title}</h3>
                  <div className={styles.cardCount}>{count} RECORDS</div>
                  <div className={styles.cardDesc}>{sec.desc}</div>
                  <button 
                    className={styles.cardAction}
                    onClick={() => setListSection(sec.dbKey as SectionKey)}
                  >
                    ACCESS FILE →
                  </button>
                  {sec.dbKey === 'oir' && (
                    <Link
                      href="/dashboard/oir"
                      className={styles.cardAction}
                      style={{ marginTop: '0.5rem', display: 'inline-block' }}
                    >
                      OIR DEEP DIVE →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Creation / Edit Modal */}
      <ContentModal
        isOpen={isCreateOpen}
        onClose={closeCreate}
        title={editRecord ? 'EDIT BRIEFING' : (selectedSection ? 'NEW BRIEFING' : 'CONTENT INTAKE')}
        code={selectedSection ? sectionsConfig.find(s => s.dbKey === selectedSection)?.code : 'SYSTEM'}
      >
        {!selectedSection ? (
          <SectionSelector onSelect={(sec) => setSelectedSection(sec as SectionKey)} />
        ) : (
          <ContentForm
            section={selectedSection}
            weekId={weekId}
            initialData={editRecord}
            onSuccess={closeCreate}
            onCancel={closeCreate}
          />
        )}
      </ContentModal>

      {/* List Modal */}
      <ContentModal
        isOpen={!!listSection}
        onClose={() => setListSection(null)}
        title="CONTENT REGISTER"
        code={listSection ? sectionsConfig.find(s => s.dbKey === listSection)?.code : ''}
      >
        {listSection && (
          <ContentList
            section={listSection}
            weekId={weekId}
            onEdit={(record) => {
              setListSection(null);
              handleEdit(record);
            }}
          />
        )}
      </ContentModal>

    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className={styles.loadingState}>
        <div className="technical-label">STATUS // FETCHING</div>
        <div className={styles.spinner}></div>
        <p>INITIALIZING DASHBOARD...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

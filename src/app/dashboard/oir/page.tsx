'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useOirAnalytics } from '@/lib/hooks/useOirAnalytics';
import type { AnalyticsRange } from '@/lib/notion/oirAnalytics';

import OirSummaryCards from '@/components/analytics/OirSummaryCards';
import AccuracyTrendChart from '@/components/analytics/AccuracyTrendChart';
import TopicRadarChart from '@/components/analytics/TopicRadarChart';
import SpeedVsAccuracyChart from '@/components/analytics/SpeedVsAccuracyChart';
import RecentPracticeTable from '@/components/analytics/RecentPracticeTable';

import styles from './oir.module.css';
import analyticsStyles from '@/components/analytics/analytics.module.css';

const RANGES: { key: AnalyticsRange; label: string }[] = [
  { key: '4w', label: '4 WEEKS' },
  { key: '8w', label: '8 WEEKS' },
  { key: '12w', label: '12 WEEKS' },
  { key: '24w', label: '24 WEEKS' },
  { key: 'all', label: 'ALL' },
];

const INSIGHT_ICONS: Record<string, string> = {
  improvement: '📈',
  regression: '📉',
  best_week: '🏆',
  strongest_topic: '💪',
  weakest_topic: '⚠️',
  info: 'ℹ️',
};

export default function OirAnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>('12w');
  const { analytics, error, isLoading } = useOirAnalytics(range);

  // Error state
  if (error) {
    return (
      <div className={`${styles.page} animate-fade`}>
        <div className={styles.errorState}>
          <div className="technical-label">SYSTEM ALERT</div>
          <h2 className="title-primary">ANALYTICS TRANSMISSION ERROR</h2>
          <p className={styles.errorMsg}>Unable to retrieve OIR performance data.</p>
          <button
            onClick={() => window.location.reload()}
            className={styles.retryBtn}
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || !analytics) {
    return (
      <div className={`${styles.page} animate-fade`}>
        <header className={styles.header}>
          <div>
            <Link href="/dashboard" className={styles.backLink}>← DASHBOARD</Link>
            <h1 className={`title-primary ${styles.titleAccent}`}>OIR PERFORMANCE // ANALYTICS</h1>
            <div className="technical-label">LOADING PERFORMANCE DATA...</div>
          </div>
        </header>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>RETRIEVING ANALYTICS...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!analytics.dataAvailable) {
    return (
      <div className={`${styles.page} animate-fade`}>
        <header className={styles.header}>
          <div>
            <Link href="/dashboard" className={styles.backLink}>← DASHBOARD</Link>
            <h1 className={`title-primary ${styles.titleAccent}`}>OIR PERFORMANCE // ANALYTICS</h1>
            <div className="technical-label">OIR // PERFORMANCE INTELLIGENCE</div>
          </div>
          <div className={styles.rangeSelector}>
            {RANGES.map(r => (
              <button
                key={r.key}
                className={`${styles.rangeBtn} ${range === r.key ? styles.rangeBtnActive : ''}`}
                onClick={() => setRange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </header>
        <div className={styles.emptyPage}>
          <div style={{ fontSize: '3rem', opacity: 0.3 }}>🧠</div>
          <h2 className="title-secondary">NO OIR DATA</h2>
          <p style={{ color: 'var(--muted-text)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            No practice records are available for this period.
          </p>
          <Link href="/dashboard" className={styles.retryBtn}>
            GO TO DASHBOARD
          </Link>
        </div>
      </div>
    );
  }

  const selectedRangeLabel = RANGES.find(r => r.key === range)?.label || range;

  return (
    <div className={`${styles.page} animate-fade`}>
      {/* ── Header ──────────────────────────────────────────── */}
      <header className={styles.header}>
        <div>
          <Link href="/dashboard" className={styles.backLink}>← DASHBOARD</Link>
          <h1 className={`title-primary ${styles.titleAccent}`}>OIR PERFORMANCE // ANALYTICS</h1>
          <div className="technical-label">
            ANALYTIC PERIOD // {selectedRangeLabel} · OPEN-SOURCE PERFORMANCE DATA
          </div>
        </div>
        <div className={styles.rangeSelector}>
          {RANGES.map(r => (
            <button
              key={r.key}
              className={`${styles.rangeBtn} ${range === r.key ? styles.rangeBtnActive : ''}`}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Summary ─────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className="technical-label">PERFORMANCE SUMMARY</h2>
        <OirSummaryCards summary={analytics.summary} />
      </section>

      {/* ── Two Column Grid ─────────────────────────────────── */}
      <div className={styles.analyticsGrid}>
        {/* Accuracy Trend */}
        <section className={styles.panel}>
          <h2 className="technical-label">ACCURACY TREND</h2>
          <AccuracyTrendChart data={analytics.weeklyTrend} />
        </section>

        {/* Topic Performance */}
        <section className={styles.panel}>
          <h2 className="technical-label">KNOWLEDGE SECTOR PERFORMANCE</h2>
          <TopicRadarChart data={analytics.topicPerformance} />
        </section>
      </div>

      {/* ── Speed vs Accuracy ───────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.panel}>
          <h2 className="technical-label">SPEED // ACCURACY CORRELATION</h2>
          <SpeedVsAccuracyChart
            data={analytics.speedAccuracy}
            speedAvailable={analytics.speedAvailable}
          />
        </div>
      </section>

      {/* ── Insights ────────────────────────────────────────── */}
      {analytics.insights.length > 0 && (
        <section className={styles.section}>
          <div className={styles.panel}>
            <h2 className="technical-label">PERFORMANCE INSIGHTS</h2>
            <div className={analyticsStyles.insightsList}>
              {analytics.insights.map((insight, i) => (
                <div
                  key={i}
                  className={analyticsStyles.insightItem}
                  data-type={insight.type}
                >
                  <span className={analyticsStyles.insightIcon}>
                    {INSIGHT_ICONS[insight.type] || 'ℹ️'}
                  </span>
                  <span>{insight.message}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Recent Practice Log ─────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.panel}>
          <h2 className="technical-label">PRACTICE LOG</h2>
          <RecentPracticeTable data={analytics.recentPractice} />
        </div>
      </section>
    </div>
  );
}

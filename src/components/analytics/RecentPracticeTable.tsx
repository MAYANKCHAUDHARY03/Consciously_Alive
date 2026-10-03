'use client';

import type { RecentPracticeEntry } from '@/lib/notion/oirAnalytics';
import styles from './analytics.module.css';

interface RecentPracticeTableProps {
  data: RecentPracticeEntry[];
}

/** Presentation thresholds — explicitly defined */
const THRESHOLDS = {
  high: 80,   // >= 80%
  medium: 60, // >= 60%
  // < 60% = low
};

function accuracyBadge(accuracy: number): { label: string; className: string } {
  if (accuracy >= THRESHOLDS.high) return { label: 'HIGH', className: styles.badgeHigh };
  if (accuracy >= THRESHOLDS.medium) return { label: 'MEDIUM', className: styles.badgeMedium };
  return { label: 'LOW', className: styles.badgeLow };
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${d.getUTCDate().toString().padStart(2, '0')} ${months[d.getUTCMonth()]}`;
}

export default function RecentPracticeTable({ data }: RecentPracticeTableProps) {
  if (data.length === 0) {
    return (
      <div className={styles.emptyChart}>
        <div className={styles.emptyIcon}>📋</div>
        <div className={styles.emptyTitle}>NO RECENT PRACTICE</div>
        <div className={styles.emptyText}>
          Recent OIR practice sessions will be listed here.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.practiceTable}>
      <div className={styles.practiceHeader}>
        <span className={styles.colDate}>DATE</span>
        <span className={styles.colTopic}>TOPIC</span>
        <span className={styles.colQuestions}>Q</span>
        <span className={styles.colCorrect}>CORRECT</span>
        <span className={styles.colAccuracy}>ACC</span>
        <span className={styles.colSpeed}>SPEED</span>
        <span className={styles.colBadge}>LEVEL</span>
      </div>
      {data.map((entry) => {
        const badge = accuracyBadge(entry.accuracy);
        return (
          <div key={entry.id} className={styles.practiceRow}>
            <span className={styles.colDate}>{formatDate(entry.createdAt)}</span>
            <span className={styles.colTopic}>{entry.topic}</span>
            <span className={styles.colQuestions}>{entry.totalQuestions}</span>
            <span className={styles.colCorrect}>{entry.correctAnswers}</span>
            <span className={styles.colAccuracy}>{entry.accuracy}%</span>
            <span className={styles.colSpeed}>
              {entry.timePerQuestion !== null ? `${entry.timePerQuestion}m/Q` : '—'}
            </span>
            <span className={`${styles.colBadge} ${badge.className}`}>{badge.label}</span>
          </div>
        );
      })}
      <div className={styles.thresholdNote}>
        Thresholds: HIGH ≥ {THRESHOLDS.high}% · MEDIUM ≥ {THRESHOLDS.medium}% · LOW &lt; {THRESHOLDS.medium}%
      </div>
    </div>
  );
}

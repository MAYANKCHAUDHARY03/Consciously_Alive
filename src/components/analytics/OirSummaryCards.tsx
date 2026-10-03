'use client';

import type { OirSummary } from '@/lib/notion/oirAnalytics';
import styles from './analytics.module.css';

interface OirSummaryCardsProps {
  summary: OirSummary;
}

export default function OirSummaryCards({ summary }: OirSummaryCardsProps) {
  return (
    <div className={styles.summaryGrid}>
      <div className={styles.summaryCard}>
        <div className={styles.summaryValue}>{summary.totalQuestions}</div>
        <div className={styles.summaryLabel}>TOTAL QUESTIONS</div>
      </div>

      <div className={styles.summaryCard}>
        <div className={styles.summaryValue}>{summary.accuracy}%</div>
        <div className={styles.summaryLabel}>GLOBAL ACCURACY</div>
        <div className={styles.summaryDetail}>
          {summary.totalCorrect} / {summary.totalQuestions}
        </div>
      </div>

      <div className={styles.summaryCard}>
        <div className={styles.summaryValue}>{summary.practiceSets}</div>
        <div className={styles.summaryLabel}>PRACTICE SETS</div>
      </div>

      <div className={styles.summaryCard}>
        {summary.speedAvailable && summary.averageTimePerQuestion !== null ? (
          <>
            <div className={styles.summaryValue}>{summary.averageTimePerQuestion}</div>
            <div className={styles.summaryLabel}>MIN / QUESTION</div>
          </>
        ) : (
          <>
            <div className={styles.summaryValueMuted}>—</div>
            <div className={styles.summaryLabel}>SPEED</div>
            <div className={styles.summaryDetail}>NOT TRACKED</div>
          </>
        )}
      </div>
    </div>
  );
}

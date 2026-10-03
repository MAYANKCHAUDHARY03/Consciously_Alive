/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import type { TopicPerformance } from '@/lib/notion/oirAnalytics';
import styles from './analytics.module.css';

interface TopicRadarChartProps {
  data: TopicPerformance[];
}

export default function TopicRadarChart({ data }: TopicRadarChartProps) {
  if (data.length === 0) {
    return (
      <div className={styles.emptyChart}>
        <div className={styles.emptyIcon}>🎯</div>
        <div className={styles.emptyTitle}>NO TOPIC DATA</div>
        <div className={styles.emptyText}>
          Topic performance will appear when practice sets include topic categorization.
        </div>
      </div>
    );
  }

  // Radar charts need at least 3 points to be meaningful
  const useRadar = data.length >= 3;

  return (
    <div className={styles.topicSection}>
      {useRadar && (
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="topic"
                tick={{ fontSize: 11, fill: 'var(--muted-text)' }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: 'var(--muted-text)' }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--panel)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: '0.8rem',
                }}
                formatter={((value: any) => [`${value}%`, 'Accuracy']) as any}
              />
              <Radar
                name="Accuracy"
                dataKey="accuracy"
                stroke="var(--accent)"
                fill="var(--accent)"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Always show the ranked topic list */}
      <div className={styles.topicList}>
        {data.map((t, i) => (
          <div key={t.topic} className={styles.topicRow}>
            <div className={styles.topicRank}>{i + 1}</div>
            <div className={styles.topicName}>
              {t.topic}
              {!t.sufficientData && (
                <span className={styles.lowSample}> (LOW SAMPLE)</span>
              )}
            </div>
            <div className={styles.topicBarContainer}>
              <div
                className={styles.topicBar}
                style={{ width: `${Math.min(100, t.accuracy)}%` }}
              />
            </div>
            <div className={styles.topicAccuracy}>{t.accuracy}%</div>
            <div className={styles.topicCount}>{t.totalQuestions}Q</div>
          </div>
        ))}
      </div>
    </div>
  );
}

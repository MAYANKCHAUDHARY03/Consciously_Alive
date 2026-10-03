/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { WeeklyTrendPoint } from '@/lib/notion/oirAnalytics';
import styles from './analytics.module.css';

interface AccuracyTrendChartProps {
  data: WeeklyTrendPoint[];
}

export default function AccuracyTrendChart({ data }: AccuracyTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className={styles.emptyChart}>
        <div className={styles.emptyIcon}>📊</div>
        <div className={styles.emptyTitle}>NO TREND DATA</div>
        <div className={styles.emptyText}>
          Accuracy trend will appear after multiple weeks of practice.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="weekLabel"
            stroke="var(--muted-text)"
            tick={{ fontSize: 11, fill: 'var(--muted-text)' }}
            axisLine={{ stroke: 'var(--border)' }}
          />
          <YAxis
            domain={[0, 100]}
            stroke="var(--muted-text)"
            tick={{ fontSize: 11, fill: 'var(--muted-text)' }}
            axisLine={{ stroke: 'var(--border)' }}
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
            labelFormatter={(label) => `Week: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="accuracy"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={{ fill: 'var(--accent)', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: 'var(--accent)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

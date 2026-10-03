/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import type { SpeedAccuracyPoint } from '@/lib/notion/oirAnalytics';
import styles from './analytics.module.css';

interface SpeedVsAccuracyChartProps {
  data: SpeedAccuracyPoint[];
  speedAvailable: boolean;
}

export default function SpeedVsAccuracyChart({ data, speedAvailable }: SpeedVsAccuracyChartProps) {
  if (!speedAvailable || data.length === 0) {
    return (
      <div className={styles.unavailableState}>
        <div className={styles.unavailableIcon}>⏱️</div>
        <div className={styles.unavailableTitle}>
          {speedAvailable ? 'INSUFFICIENT SPEED DATA' : 'SPEED DATA NOT AVAILABLE'}
        </div>
        <div className={styles.unavailableText}>
          {speedAvailable
            ? 'Not enough practice sets with timing data to render this chart.'
            : 'Current OIR records do not contain timing information. Speed analytics can be enabled when timing data is recorded during practice sessions.'}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="timePerQuestion"
            type="number"
            name="Time/Q"
            unit=" min"
            stroke="var(--muted-text)"
            tick={{ fontSize: 11, fill: 'var(--muted-text)' }}
            axisLine={{ stroke: 'var(--border)' }}
            label={{
              value: 'TIME PER QUESTION (MIN)',
              position: 'insideBottom',
              offset: -5,
              style: { fontSize: 10, fill: 'var(--muted-text)', letterSpacing: '0.1em' },
            }}
          />
          <YAxis
            dataKey="accuracy"
            type="number"
            domain={[0, 100]}
            name="Accuracy"
            unit="%"
            stroke="var(--muted-text)"
            tick={{ fontSize: 11, fill: 'var(--muted-text)' }}
            axisLine={{ stroke: 'var(--border)' }}
            label={{
              value: 'ACCURACY (%)',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              style: { fontSize: 10, fill: 'var(--muted-text)', letterSpacing: '0.1em' },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: '0.8rem',
            }}
            formatter={((value: any, name: any) => {
              if (name === 'Time/Q') return [`${value} min`, 'Time/Question'];
              if (name === 'Accuracy') return [`${value}%`, 'Accuracy'];
              return [`${value}`, `${name}`];
            }) as any}
            labelFormatter={() => ''}
          />
          <Scatter data={data} fill="var(--accent)">
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill="var(--accent)" opacity={0.8} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

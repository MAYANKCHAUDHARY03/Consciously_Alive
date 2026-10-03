'use client';

import { useState } from 'react';
import { updateContentRecord } from '@/lib/hooks/useContent';
import { RevisionStatus } from '@/lib/notion/types';

interface RevisionControlProps {
  section: string;
  id: string;
  initialRevision?: RevisionStatus;
  onUpdate?: (newRevision: RevisionStatus) => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const REVISION_COLORS: Record<RevisionStatus, string> = {
  'Unread': 'var(--text-secondary)',
  'Reading': '#e2b93b',
  'Reviewed': '#98c379',
  'Revised': 'var(--accent)'
};

export default function RevisionControl({
  section,
  id,
  initialRevision = 'Unread',
  onUpdate,
  className = '',
  size = 'medium'
}: RevisionControlProps) {
  const [revision, setRevision] = useState<RevisionStatus>(initialRevision || 'Unread');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    if (isLoading) return;

    const newValue = e.target.value as RevisionStatus;
    const oldValue = revision;
    
    setRevision(newValue);
    setIsLoading(true);

    try {
      await updateContentRecord(section, id, { revision: newValue });
      if (onUpdate) onUpdate(newValue);
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Failed to update revision status', e);
      alert(`Failed to update revision: ${e.message || 'Unknown error'}`);
      // Revert on failure
      setRevision(oldValue);
    } finally {
      setIsLoading(false);
    }
  };

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    background: 'var(--bg-secondary)',
    border: `1px solid var(--border-color)`,
    color: REVISION_COLORS[revision] || 'var(--text-primary)',
    borderRadius: '4px',
    fontWeight: 600,
    fontFamily: 'monospace',
    transition: 'all 0.2s ease',
    opacity: isLoading ? 0.7 : 1,
    outline: 'none'
  };

  const sizeStyles = {
    small: { fontSize: '0.75rem', padding: '0.15rem 0.4rem' },
    medium: { fontSize: '0.875rem', padding: '0.25rem 0.5rem' },
    large: { fontSize: '1rem', padding: '0.4rem 0.75rem' }
  };

  return (
    <select
      className={className}
      value={revision}
      onChange={handleChange}
      style={{ ...baseStyle, ...sizeStyles[size] }}
      disabled={isLoading}
      onClick={e => e.stopPropagation()} // prevent clicking select from bubbling to card
    >
      <option value="Unread">● UNREAD</option>
      <option value="Reading">◐ READING</option>
      <option value="Reviewed">○ REVIEWED</option>
      <option value="Revised">✓ REVISED</option>
    </select>
  );
}

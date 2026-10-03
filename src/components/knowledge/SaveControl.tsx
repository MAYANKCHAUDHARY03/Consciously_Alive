'use client';

import { useState } from 'react';
import { updateContentRecord } from '@/lib/hooks/useContent';

interface SaveControlProps {
  section: string;
  id: string;
  initialSaved: boolean;
  onUpdate?: (newSaved: boolean) => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function SaveControl({
  section,
  id,
  initialSaved,
  onUpdate,
  className = '',
  size = 'medium'
}: SaveControlProps) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;

    const newValue = !isSaved;
    setIsSaved(newValue);
    setIsLoading(true);

    try {
      await updateContentRecord(section, id, { saved: newValue });
      if (onUpdate) onUpdate(newValue);
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Failed to update save status', e);
      alert(`Failed to save: ${e.message || 'Unknown error'}`);
      // Revert on failure
      setIsSaved(!newValue);
    } finally {
      setIsLoading(false);
    }
  };

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    background: isSaved ? 'rgba(var(--accent-rgb, 100, 200, 255), 0.15)' : 'transparent',
    border: `1px solid ${isSaved ? 'var(--accent)' : 'var(--border-color)'}`,
    color: isSaved ? 'var(--accent)' : 'var(--text-secondary)',
    borderRadius: '4px',
    fontWeight: 600,
    fontFamily: 'monospace',
    transition: 'all 0.2s ease',
    opacity: isLoading ? 0.7 : 1,
  };

  const sizeStyles = {
    small: { fontSize: '0.75rem', padding: '0.15rem 0.4rem' },
    medium: { fontSize: '0.875rem', padding: '0.25rem 0.5rem' },
    large: { fontSize: '1rem', padding: '0.4rem 0.75rem' }
  };

  return (
    <button 
      className={className} 
      onClick={toggleSave}
      style={{ ...baseStyle, ...sizeStyles[size] }}
      disabled={isLoading}
      title={isSaved ? 'Remove from Saved Intelligence' : 'Save Intelligence'}
    >
      {isSaved ? '★ SAVED' : '☆ SAVE'}
    </button>
  );
}

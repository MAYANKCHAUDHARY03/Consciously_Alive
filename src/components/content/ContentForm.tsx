'use client';

import { useState, FormEvent, useEffect } from 'react';
import styles from './content.module.css';
import { useSectionSchema, createContentRecord, updateContentRecord } from '@/lib/hooks/useContent';
import type { SectionKey, ContentRecord } from '@/lib/notion/content';

interface ContentFormProps {
  section: SectionKey;
  weekId: string;
  initialData?: ContentRecord | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ContentForm({ section, weekId, initialData, onSuccess, onCancel }: ContentFormProps) {
  const schema = useSectionSchema(section);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<any>({ weekId, status: 'Active' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({ ...initialData.fields, title: initialData.title, weekId });
    }
  }, [initialData, weekId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setFormData((prev: any) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setFormData((prev: any) => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (initialData?.id) {
        await updateContentRecord(section, initialData.id, formData);
      } else {
        await createContentRecord(section, formData);
      }
      onSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!schema) {
    return <div className={styles.loadingInline}>Loading form configuration...</div>;
  }

  const renderInput = (name: string, label: string, type = 'text', required = false) => (
    <div className={styles.fieldGroup}>
      <label className={`${styles.label} ${required ? styles.required : ''}`}>{label}</label>
      <input
        type={type}
        name={name}
        className={styles.input}
        value={formData[name] ?? ''}
        onChange={handleChange}
        required={required}
      />
    </div>
  );

  const renderTextarea = (name: string, label: string, required = false) => (
    <div className={styles.fieldGroup}>
      <label className={`${styles.label} ${required ? styles.required : ''}`}>{label}</label>
      <textarea
        name={name}
        className={styles.textarea}
        value={formData[name] ?? ''}
        onChange={handleChange}
        required={required}
      />
    </div>
  );

  const renderSelect = (name: string, label: string, options: string[], required = false) => (
    <div className={styles.fieldGroup}>
      <label className={`${styles.label} ${required ? styles.required : ''}`}>{label}</label>
      <select
        name={name}
        className={styles.select}
        value={formData[name] ?? ''}
        onChange={handleChange}
        required={required}
      >
        <option value="">-- Select --</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );

  const renderCheckbox = (name: string, label: string) => (
    <div className={styles.fieldGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
      <input
        type="checkbox"
        name={name}
        checked={formData[name] || false}
        onChange={handleChange}
      />
      <label className={styles.label}>{label}</label>
    </div>
  );

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && <div className={styles.errorInline}>{error}</div>}

      <div className={styles.fieldRow}>
        {section !== 'oir' && renderInput('title', section === 'vocabulary' ? 'Word' : 'Title', 'text', true)}
        {section === 'oir' && renderInput('title', 'Title (Optional)', 'text', false)}
        
        {(section === 'general-awareness' || section === 'defence' || section === 'current-affairs') && 
          renderSelect('category', 'Category', (schema.categories as string[]) || [])}
        
        {section === 'editorials' && renderSelect('source', 'Source', (schema.sources as string[]) || [])}
        {section === 'oir' && renderSelect('topic', 'Topic', (schema.topics as string[]) || [])}
        {section === 'resources' && renderSelect('type', 'Type', (schema.types as string[]) || [])}
      </div>

      {(section === 'general-awareness' || section === 'defence' || section === 'current-affairs') && (
        <div className={styles.fieldRow}>
          {renderInput('topic', 'Topic')}
          {renderInput('source', 'Source')}
        </div>
      )}

      {section === 'current-affairs' && (
        <div className={styles.fieldRow}>
          {renderInput('date', 'Date', 'date')}
        </div>
      )}

      {section === 'editorials' && (
        <>
          <div className={styles.fieldRow}>
            {renderInput('url', 'URL', 'url')}
            {renderInput('date', 'Date', 'date')}
          </div>
          <div className={styles.fieldRow}>
            {renderInput('topic', 'Topic')}
          </div>
        </>
      )}

      {section === 'resources' && (
        <div className={styles.fieldRow}>
          {renderInput('url', 'URL', 'url')}
          {renderInput('category', 'Category')}
        </div>
      )}

      {section === 'vocabulary' && (
        <>
          <div className={styles.fieldRow}>
            {renderInput('synonyms', 'Synonyms')}
            {renderInput('source', 'Source')}
          </div>
          {renderTextarea('meaning', 'Meaning', true)}
          {renderTextarea('usage', 'Usage')}
        </>
      )}

      {section === 'oir' && (
        <div className={styles.fieldRow}>
          {renderInput('totalQuestions', 'Total Questions', 'number')}
          {renderInput('correctAnswers', 'Correct Answers', 'number')}
          {renderInput('timeTaken', 'Time Taken (min)', 'number')}
          {renderSelect('difficulty', 'Difficulty', (schema.difficulties as string[]) || [])}
        </div>
      )}

      {(section === 'general-awareness' || section === 'defence' || section === 'current-affairs') && 
        renderTextarea('content', 'Content')}

      {section === 'editorials' && (
        <>
          {renderTextarea('summary', 'Summary')}
          {renderTextarea('keyPoints', 'Key Points')}
        </>
      )}

      {section === 'resources' && renderTextarea('description', 'Description')}
      {section === 'oir' && renderTextarea('notes', 'Notes')}

      <div className={styles.fieldRow}>
        {section !== 'oir' && renderSelect('status', 'Status', (schema.statuses as string[]) || [], true)}
        {section === 'oir' && renderSelect('status', 'Status', (schema.statuses as string[]) || [])}
        
        {(section === 'general-awareness' || section === 'defence' || section === 'current-affairs' || section === 'editorials' || section === 'resources') && 
          renderSelect('priority', 'Priority', (schema.priorities as string[]) || [])}
          
        {(section === 'general-awareness' || section === 'defence' || section === 'current-affairs' || section === 'editorials' || section === 'vocabulary') && 
          renderSelect('revision', 'Revision', (schema.revisions as string[]) || [])}
          
        {section === 'vocabulary' && renderSelect('difficulty', 'Difficulty', (schema.difficulties as string[]) || [])}
      </div>
      
      {section === 'vocabulary' && renderCheckbox('mastered', 'Mastered')}
      {section === 'resources' && renderCheckbox('completed', 'Completed')}

      <div className={styles.modalFooter} style={{ margin: '1.5rem -1.5rem -1.5rem -1.5rem' }}>
        <button type="button" className={styles.btnSecondary} onClick={onCancel} disabled={isSubmitting}>
          CANCEL
        </button>
        <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
          {isSubmitting ? 'SAVING...' : 'SAVE RECORD'}
        </button>
      </div>
    </form>
  );
}

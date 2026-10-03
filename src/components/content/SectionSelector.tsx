'use client';

import styles from './content.module.css';

interface SectionSelectorProps {
  onSelect: (section: string) => void;
}

const SECTIONS = [
  { key: 'general-awareness', code: 'GA', label: 'General Awareness', icon: '🌍' },
  { key: 'defence',           code: 'DEF', label: 'Defence Updates', icon: '🛡️' },
  { key: 'current-affairs',   code: 'CA', label: 'Current Affairs', icon: '📰' },
  { key: 'editorials',        code: 'ED', label: 'Editorials', icon: '✍️' },
  { key: 'vocabulary',        code: 'VOC', label: 'Vocabulary', icon: '🧩' },
  { key: 'oir',               code: 'OIR', label: 'OIR Practice', icon: '🧠' },
  { key: 'resources',         code: 'RES', label: 'Resources', icon: '🔗' },
];

export default function SectionSelector({ onSelect }: SectionSelectorProps) {
  return (
    <div>
      <div className="technical-label" style={{ marginBottom: '1rem' }}>
        SELECT KNOWLEDGE SECTOR
      </div>
      <div className={styles.sectionGrid}>
        {SECTIONS.map((sec) => (
          <button
            key={sec.key}
            className={styles.sectionOption}
            onClick={() => onSelect(sec.key)}
            type="button"
          >
            <span className={styles.sectionIcon}>{sec.icon}</span>
            <div className={styles.sectionInfo}>
              <span className={styles.sectionName}>{sec.label}</span>
              <span className={styles.sectionCodeLabel}>FILE // {sec.code}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Notion property builder helpers.
 * Converts clean JS values into Notion property format and back.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Build Properties (App → Notion) ─────────────────────────

export function titleProp(text: string) {
  return {
    title: [{ text: { content: text } }],
  };
}

export function richTextProp(text: string) {
  return {
    rich_text: [{ text: { content: text } }],
  };
}

export function numberProp(value: number) {
  return { number: value };
}

export function selectProp(value: string) {
  if (!value) return { select: null };
  return { select: { name: value } };
}

export function multiSelectProp(values: string[]) {
  if (!values || values.length === 0) return { multi_select: [] };
  return {
    multi_select: values.map((name) => ({ name })),
  };
}

export function dateProp(start: string, end?: string) {
  return {
    date: { start, end: end ?? null },
  };
}

export function checkboxProp(value: boolean) {
  return { checkbox: value };
}

export function urlProp(value: string) {
  return { url: value || null };
}

export function relationProp(pageIds: string[]) {
  return {
    relation: pageIds.map((id) => ({ id })),
  };
}

// ─── Read Properties (Notion → App) ──────────────────────────

export function readTitle(property: any): string {
  if (!property || property.type !== 'title') return '';
  return property.title?.map((t: any) => t.plain_text).join('') ?? '';
}

export function readRichText(property: any): string {
  if (!property || property.type !== 'rich_text') return '';
  return property.rich_text?.map((t: any) => t.plain_text).join('') ?? '';
}

export function readNumber(property: any): number {
  if (!property || property.type !== 'number') return 0;
  return property.number ?? 0;
}

export function readSelect(property: any): string {
  if (!property || property.type !== 'select') return '';
  return property.select?.name ?? '';
}

export function readMultiSelect(property: any): string[] {
  if (!property || property.type !== 'multi_select') return [];
  return property.multi_select?.map((s: any) => s.name) ?? [];
}

export function readDate(property: any): string {
  if (!property || property.type !== 'date') return '';
  return property.date?.start ?? '';
}

export function readDateEnd(property: any): string {
  if (!property || property.type !== 'date') return '';
  return property.date?.end ?? '';
}

export function readCheckbox(property: any): boolean {
  if (!property || property.type !== 'checkbox') return false;
  return property.checkbox ?? false;
}

export function readUrl(property: any): string {
  if (!property || property.type !== 'url') return '';
  return property.url ?? '';
}

export function readRelation(property: any): string[] {
  if (!property || property.type !== 'relation') return [];
  return property.relation?.map((r: any) => r.id) ?? [];
}

export function readFormula(property: any): number | string | boolean {
  if (!property || property.type !== 'formula') return 0;
  const formula = property.formula;
  if (formula.type === 'number') return formula.number ?? 0;
  if (formula.type === 'string') return formula.string ?? '';
  if (formula.type === 'boolean') return formula.boolean ?? false;
  return 0;
}

export function readCreatedTime(page: any): string {
  return page.created_time ?? '';
}

export function readLastEditedTime(page: any): string {
  return page.last_edited_time ?? '';
}

// ─── Filter Builders ─────────────────────────────────────────

export function equalsFilter(property: string, type: 'select' | 'status', value: string) {
  return { property, [type]: { equals: value } };
}

export function containsFilter(property: string, value: string) {
  return { property, rich_text: { contains: value } };
}

export function titleContainsFilter(property: string, value: string) {
  return { property, title: { contains: value } };
}

export function relationFilter(property: string, pageId: string) {
  return { property, relation: { contains: pageId } };
}

export function dateAfterFilter(property: string, date: string) {
  return { property, date: { on_or_after: date } };
}

export function dateBeforeFilter(property: string, date: string) {
  return { property, date: { on_or_before: date } };
}

export function checkboxFilter(property: string, value: boolean) {
  return { property, checkbox: { equals: value } };
}

export function selectEqualsFilter(property: string, value: string) {
  return { property, select: { equals: value } };
}

export function multiSelectContainsFilter(property: string, value: string) {
  return { property, multi_select: { contains: value } };
}

export function numberGreaterThanFilter(property: string, value: number) {
  return { property, number: { greater_than: value } };
}

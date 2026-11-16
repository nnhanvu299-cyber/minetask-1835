/**
 * Utilities for Vietnamese text processing, diacritics removal, and robust user searching
 */

export function removeDiacritics(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

export interface SearchableUser {
  id?: string;
  name?: string;
  email?: string;
}

export function matchesUserSearch(u: SearchableUser, query: string): boolean {
  if (!query || !query.trim()) return true;

  const rawQ = query.trim().toLowerCase();
  const normQ = removeDiacritics(query);

  const rawName = (u.name || '').toLowerCase();
  const normName = removeDiacritics(u.name || '');

  const rawEmail = (u.email || '').toLowerCase();
  const normEmail = removeDiacritics(u.email || '');

  const emailPrefix = rawEmail.includes('@') ? rawEmail.split('@')[0] : '';
  const normEmailPrefix = removeDiacritics(emailPrefix);

  // Exact or substring match in raw string
  if (rawName.includes(rawQ) || rawEmail.includes(rawQ) || emailPrefix.includes(rawQ)) {
    return true;
  }

  // Exact or substring match in normalized diacritic-free string
  if (normName.includes(normQ) || normEmail.includes(normQ) || normEmailPrefix.includes(normQ)) {
    return true;
  }

  if (u.id && u.id.toLowerCase().includes(rawQ)) {
    return true;
  }

  // Flexible multi-word matching (e.g. "van tuan" matches "Nguyễn Văn Tuấn")
  const tokens = normQ.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    const allTokensMatch = tokens.every((token) => normName.includes(token) || normEmail.includes(token));
    if (allTokensMatch) return true;
  }

  return false;
}

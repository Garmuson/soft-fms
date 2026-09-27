/** Trim and cap free text before it is sent to the database. */
export function cleanText(v: string, max = 500) {
  return v.trim().slice(0, max);
}

/**
 * Cleans a search term used inside an ilike filter: strips SQL/filter
 * metacharacters (quotes, semicolons, commas, parentheses, wildcards,
 * comment markers) so the term is treated as plain text only.
 */
export function cleanSearch(v: string, max = 60) {
  return v
    .replace(/--|\/\*|\*\//g, "")
    .replace(/[%_'";,()\\*<>=]/g, "")
    .trim()
    .slice(0, max);
}

/** Rejects identifier-like fields (numbers, codes) that contain SQL metacharacters. */
export function isSafeCode(v: string) {
  return !/[;'"\\<>=]|--|\/\*/.test(v);
}

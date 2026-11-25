/**
 * Join location parts (room, sub-room, floor...) into one label.
 * Empty parts are dropped; returns '-' only when every part is empty.
 */
export function formatLocation(parts: Array<string | null | undefined>, separator = ', '): string {
  const cleaned = parts.map((p) => (p ?? '').trim()).filter(Boolean);
  return cleaned.length ? cleaned.join(separator) : '-';
}

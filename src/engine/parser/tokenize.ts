export function tokenize(raw: string): string[] {
  return raw
    .trim()
    .toLowerCase()
    .replace(/,/g, " , ")
    .split(/\s+/)
    .filter(Boolean);
}

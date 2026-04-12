export function tokenize(raw: string): string[] {
  return raw
    .trim()
    .replace(/[’‘]/g, "'")
    .toLowerCase()
    .replace(/[.!?;:]/g, " ")
    .replace(/,/g, " , ")
    .split(/\s+/)
    .filter(Boolean);
}

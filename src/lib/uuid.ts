/**
 * Generate a deterministic UUID v4 from a string
 * This ensures the same string always produces the same UUID
 */
export function stringToUUID(str: string): string {
  let hash = 0;
  let hex = '';
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
    hex += char.toString(16).padStart(2, '0');
  }
  
  hex += Math.abs(hash).toString(16);
  
  while (hex.length < 32) {
    hex += hex;
  }
  
  hex = hex.slice(0, 32);
  
  const part1 = hex.slice(0, 8);
  const part2 = hex.slice(8, 12);
  const part3 = '4' + hex.slice(12, 15); // Version 4
  const part4 = '8' + hex.slice(15, 18); // Variant 8 (8, 9, A, or B)
  const part5 = hex.slice(18, 30).padEnd(12, '0'); // Last 12 chars
  
  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}

/**
 * Fuzzy search for similar tool names
 * Uses Levenshtein distance for similarity matching
 */

export interface SimilarTool {
  id: string;
  name: string;
  slug: string;
  similarity: number; // 0-1, where 1 is exact match
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(
    str1.toLowerCase().trim(),
    str2.toLowerCase().trim()
  );
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  return 1 - distance / maxLength;
}

/**
 * Find similar tools from a list
 */
export function findSimilarTools(
  searchName: string,
  tools: Array<{ id: string; name: string; slug: string }>,
  threshold: number = 0.6 // Minimum similarity (60%)
): SimilarTool[] {
  if (!searchName || !searchName.trim()) {
    return [];
  }

  const normalizedSearch = searchName.toLowerCase().trim();
  const results: SimilarTool[] = [];

  // Early exit: check for exact match first
  const exactMatch = tools.find(
    (tool) => tool.name.toLowerCase().trim() === normalizedSearch
  );
  if (exactMatch) {
    return [{
      id: exactMatch.id,
      name: exactMatch.name,
      slug: exactMatch.slug,
      similarity: 1.0,
    }];
  }

  for (const tool of tools) {
    const similarity = calculateSimilarity(normalizedSearch, tool.name);

    if (similarity >= threshold) {
      results.push({
        id: tool.id,
        name: tool.name,
        slug: tool.slug,
        similarity,
      });
    }

    // Early exit if we found 10+ similar tools (enough to show)
    if (results.length >= 10) break;
  }

  // Sort by similarity (highest first)
  results.sort((a, b) => b.similarity - a.similarity);

  // Return top 5 most similar
  return results.slice(0, 5);
}

/**
 * Check if search name is likely a duplicate
 */
export function isLikelyDuplicate(
  searchName: string,
  tools: Array<{ id: string; name: string; slug: string }>
): boolean {
  const similar = findSimilarTools(searchName, tools, 0.85); // 85% similarity threshold
  return similar.length > 0;
}

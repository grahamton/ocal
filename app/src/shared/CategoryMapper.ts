export type IconCategory = 'mineral' | 'fossil' | 'artifact' | 'unknown';

/**
 * Maps a list of keywords or a scientific name to a broad category
 * for icon display.
 */
export function getCategoryFromTags(
  tags: string[] | undefined,
  name?: string,
): IconCategory {
  const searchTerms = [...(tags || []), name || ''].map(t => t.toLowerCase());

  // Check for Fossils
  if (
    searchTerms.some(
      t =>
        t.includes('fossil') ||
        t.includes('bone') ||
        t.includes('tooth') ||
        t.includes('ammonite') ||
        t.includes('trilobite') ||
        t.includes('shell') ||
        t.includes('shark'),
    )
  ) {
    return 'fossil';
  }

  // Check for Artifacts
  if (
    searchTerms.some(
      t =>
        t.includes('glass') ||
        t.includes('ceramic') ||
        t.includes('pottery') ||
        t.includes('metal') ||
        t.includes('plastic') ||
        t.includes('bottle') ||
        t.includes('arrowhead') ||
        t.includes('flake') ||
        t.includes('tool'),
    )
  ) {
    return 'artifact';
  }

  // Check for known Minerals (Optional, as this is default)
  // But good to have if we want to distinguish "Unknown" from "Mineral"
  if (
    searchTerms.some(
      t =>
        t.includes('agate') ||
        t.includes('quartz') ||
        t.includes('jasper') ||
        t.includes('chalcedony') ||
        t.includes('rock') ||
        t.includes('stone') ||
        t.includes('mineral'),
    )
  ) {
    return 'mineral';
  }

  // If we have data but no specific match, default to mineral for rocks
  if (searchTerms.length > 0 && searchTerms[0] !== '') {
    return 'mineral';
  }

  return 'unknown';
}

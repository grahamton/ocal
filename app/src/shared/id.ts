export function createId() {
  // Simple, dependency-free unique-ish id for local records.
  return `find-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

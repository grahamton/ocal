export function createId(prefix = 'find') {
  // Simple, dependency-free unique-ish id for local records.
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

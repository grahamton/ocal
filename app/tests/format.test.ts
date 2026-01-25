import test from 'node:test';
import assert from 'node:assert';
import {formatCoords} from '../src/shared/format';
import {createId} from '../src/shared/id';

test('formatCoords renders lat/long to four decimals', () => {
  const result = formatCoords(44.312345, -124.109876);
  assert.strictEqual(result, '44.3123, -124.1099');
});

test('formatCoords handles missing coordinates', () => {
  assert.strictEqual(formatCoords(null, null), 'No GPS saved');
  assert.strictEqual(formatCoords(44.1, null), 'No GPS saved');
  assert.strictEqual(formatCoords(null, -124.1), 'No GPS saved');
});

test('createId returns unique-ish ids', () => {
  const id1 = createId();
  const id2 = createId();
  assert.notStrictEqual(id1, id2);
  assert.ok(id1.startsWith('find-'));
});

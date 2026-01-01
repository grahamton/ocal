import { getRangerSchema, getRangerSystemPrompt } from './RangerConfig';

console.log('--- EXPLORE MODE ---');
console.log('Prompt suffix:', getRangerSystemPrompt('explore').slice(-400));
const exploreSchema = getRangerSchema('explore');
console.log('Strict:', exploreSchema.strict);
console.log('Has discovered_signals:', 'discovered_signals' in exploreSchema.schema.properties);
console.log('Has ranger_summary:', 'ranger_summary' in exploreSchema.schema.properties);

console.log('\n--- SHIP MODE ---');
console.log('Prompt suffix:', getRangerSystemPrompt('ship').slice(-200));
const shipSchema = getRangerSchema('ship');
console.log('Strict:', shipSchema.strict);
console.log('Has discovered_signals:', 'discovered_signals' in shipSchema.schema.properties);

const { RockIdSchema } = require('./rockIdSchema');

const ROCK_ID_SYSTEM_PROMPT = `
You are "Ranger Al," a retired Geologist and friendly guide.
Goal: Identify the specimen and provide rich Geologic Context tailored to the Pacific Coast.

*** CRITICAL INSTRUCTIONS ***
1. CONCISENESS PROTOCOL: The user is on a mobile device.
   - STRUCTURED FIELDS (e.g., texture, taxonomy, origin) must be DATA ONLY (1-5 words). NO sentences. NO explanations.
   - NARRATIVE FIELDS (ranger_summary, historical_fact) are the ONLY place for sentences.
   - Do NOT fill a field to its max length just because you can. "Granite" is better than "It is a granite stone."

2. ROLE SEPARATION:
   - For 'best_guess', 'category_details', and 'tags': Act as a MUSEUM CURATOR. Precise, clinical, dry.
   - For 'ranger_summary' and 'historical_fact': Act as RANGER AL. Warm, educational, storyteller.

3. CONFIDENCE CALIBRATION:
   - If ID is uncertain (<0.9), use words like "Possible", "Resembles", or "Likely".
   - Do NOT state guesses as absolute facts.
   - If it's just a generic rock, say "Unidentified Rock" rather than hallucinating a rare mineral.

4. TONE ADAPTATION:
   - Your tone should adapt to the user's context. If the 'time_of_day' is provided, let it influence your 'ranger_summary'.
   - Morning: Cheerful and forward-looking ("A great find to start the day!").
   - Afternoon: More educational and detailed.
   - Evening: A more reflective, "campfire story" tone.

5. UNCERTAINTY GUIDANCE:
   - If confidence is low (<0.8), use the 'ranger_summary' to briefly explain what makes the identification difficult.
   - Suggest what would help improve the ID, e.g., "A photo showing the rock's texture when wet could help distinguish it," or "Knowing if it's unusually heavy for its size would be a good clue."

Output Rules:
- Output must be valid JSON matching the provided schema.
- Geology Hypothesis: Provide 'name' (Formation), 'confidence', and 'evidence'.
- Category Details: Fill the specific object (mineral/rock/fossil/artifact) based on the category.
- Safety: If the item looks heavy, metallic, or crumbling, add a safety brief.
- Lapidary Check: Tumblers need Mohs > 6 and non-porous structure.
- Catalog Tags: All values must be lowercase snake_case.
`.trim();

function buildRockIdUserPrompt(params = {}) {
  const { location_hint, context_notes, user_goal, session_context } = params;

  let prompt = [
    'Identify this specimen for cataloging.',
  ];

  if (session_context) {
    const sessionName = session_context.name || 'an unnamed session';
    const sessionLocation = session_context.locationName ? `at ${session_context.locationName}` : '';
    const sessionStartTime = session_context.startTime ? new Date(session_context.startTime) : null;
    
    let timeOfDay = '';
    if (sessionStartTime) {
      const hour = sessionStartTime.getHours();
      if (hour < 12) timeOfDay = 'Morning';
      else if (hour < 17) timeOfDay = 'Afternoon';
      else timeOfDay = 'Evening';
    }

    prompt.push(`Context: The user is on a walk during "${sessionName}" ${sessionLocation}. The time of day is ${timeOfDay}. Please consider this regional and temporal context in your analysis.`);
  }
  
  if (user_goal === 'learning') {
    prompt.push('User goal is LEARNING. Please provide a detailed ranger_summary and historical_fact.');
  } else if (user_goal === 'catalog_tagging') {
    prompt.push('User goal is CATALOGING. Focus on providing comprehensive and accurate catalog_tags.');
  } else {
    prompt.push('User goal is QUICK ID. Keep the ranger_summary concise.');
  }

  if (location_hint) prompt.push(`location_hint: ${location_hint}`);
  if (context_notes) prompt.push(`context_notes: ${context_notes}`);

  prompt.push('Return JSON only.');

  return prompt.join('\n');
}

module.exports = {
  RockIdSchema,
  ROCK_ID_SYSTEM_PROMPT,
  buildRockIdUserPrompt,
};

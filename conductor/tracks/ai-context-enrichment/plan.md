# Implementation Plan: AI Context Enrichment

**Track ID**: `ai-context-enrichment`

## 1. Objective

To improve the quality and personalization of AI-generated rock identifications by providing the "Ranger Al" persona with context about the user's current session (e.g., location name, start time). This will allow the AI to generate more relevant geological insights, as outlined in Phase 6 of the project roadmap.

## 2. Implementation Steps

### Phase 1: Update Client-Side AI Service

- [x] 1. **Modify `identifyRock.ts`**:
  - Update the function signature of the main AI call function to accept an optional `session` object of type `Session`.
  - In the function body, add the `session` data to the request payload that is sent to the Firebase Cloud Function.

### Phase 2: Update Server-Side Cloud Function

- [x] 1. **Modify `functions/src/index.ts`**:
  - Update the Cloud Function's request handler to receive the new `session` data in its payload.
  - Add logic to the prompt generation step. If `session` data is present, prepend a contextual statement to the prompt sent to the Gemini API.
  - **Example Prompt Prefix**: "Context: The user is on a walk at '{session.locationName}', which started around '{formatted session.startTime}'. Please consider this regional and temporal context in your analysis."

### Phase 3: Integrate with the Identify Queue

- [x] 1. **Modify `IdentifyQueueService.ts`**:
  - This service needs access to the current session. This may require refactoring the service to be a React hook (`useIdentifyQueue`) or passing `activeSession` into the `addToQueue` method.
  - When an item is processed from the queue, retrieve the `activeSession` at that moment.
  - Pass the `activeSession` object to the `identifyRock` function call.

## 3. Definition of Done

- The Firebase Cloud Function receives session data when a rock is identified.
- The prompt sent to the Gemini API includes the user's session context.
- The `IdentifyQueueService` correctly passes the session data from the client.
- The overall AI identification process continues to work reliably, both with and without an active session.

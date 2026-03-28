# Implementation Plan: The Poster Feature

**Track ID**: `feature-poster`

## 1. Objective

Allow users to generate a printable or shareable image grid of their favorite finds (a "fossil plate" style layout). This follows Phase 5 of the project roadmap.

## 2. Requirements

- [x] **Selection**: Integrate with the existing `useSelectionStore` to identify items for the poster.
- [x] **UI Component**: Create a `PosterGrid` component to render the selected items in a clean, high-contrast grid.
- [x] **Customization**:
    - [x] Caption toggles (Name, Date, Location).
    - [x] Monochrome vs. Color mode.
    - [x] Grid layout (e.g., 2x2, 3x3, 4x4).
- [x] **Export**:
    - [x] Use `react-native-view-shot` (or similar) to capture the grid as an image.
    - [x] Use `expo-sharing` to share the generated image.
- [x] **Entry Point**: Update `BatchActionBar` in `GalleryScreen` to launch the poster generation flow.

## 3. Implementation Steps

### Phase 1: Research & Setup

- [x] 1. **Evaluate Export Libraries**: Determine the best way to capture a React Native view as a high-resolution image. `react-native-view-shot` is a common choice.
- [x] 2. **Install Dependencies**:
    - `expo install react-native-view-shot`
- [x] 3. **Draft Poster UI**: Define the visual style for the "fossil plate" (Cream/Ink theme, simple typography).

### Phase 2: Poster Layout Component

- [x] 1. **Create `PosterPreview.tsx`**: A component that takes a list of `FindRecord` items and renders them in a grid.
- [x] 2. **Add Layout Logic**: Handle different grid sizes (2x2, 3x3, etc.) based on the number of selected items.
- [x] 3. **Add Caption Logic**: Include metadata (name, date) below each image in the grid.

### Phase 3: Poster Customization Modal

- [x] 1. **Create `PosterModal.tsx`**: A modal that appears when the user clicks the 🖼️ icon in the `BatchActionBar`.
- [x] 2. **Integrate Preview**: Show the `PosterPreview` inside the modal.
- [x] 3. **Add Controls**: Buttons/Toggles for theme (Color/B&W) and sharing.

### Phase 4: Export & Sharing

- [x] 1. **Implement Capture Function**: Use `captureRef` from `react-native-view-shot` to generate an image of the `PosterPreview`.
- [x] 2. **Implement Sharing**: Pass the generated image URI to `expo-sharing`.

### Phase 5: Polish & Cleanup

- [x] 1. **Finalize Styles**: Ensure the poster looks professional and follows the "Silent Partner" aesthetic.
- [x] 2. **Refactor**: Ensure code adheres to project standards (no relative imports, <200 lines per file).

## 4. Definition of Done

- Users can select 1-16 items in the gallery and click the "Poster" icon.
- A modal appears with a preview of the poster.
- The user can toggle between Color and Monochrome themes.
- The user can share the generated high-resolution poster image.
- The feature works correctly offline.

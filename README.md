# Ocal: The Rock Buddy (v2.0)

**"Your Silent Partner in Discovery"**

Ocal is an offline-first, high-contrast rock identification app designed for senior beachcombers on the Pacific Coast. It prioritizes clarity, safety, and field utility over social features or gamification.

## 🌟 Key Features

### 🌲 Ranger Al Persona (Gemini 3.1)

Powered by the latest **Gemini 3.1 Flash** model, Ranger Al provides deep geological context with full traceability.

- **Campfire Storyteller**: Explains _why_ the rock matters with deep geologic history.
- **Safety with Sense**: Only warns for immediate dangers (UXO), not for every sharp rock.
- **Humility**: Admits when it's unsure ("It's a bit of a mystery...") rather than guessing.
- **Traceability**: Every identification logs the specific AI model and schema version used.

### 💎 The Polish Guide (Lapidary Advice)

A dedicated **"Ranger's Workshop"** analysis for rock tumblers.

- **Green Badge**: "TUMBLE CANDIDATE" for hard stones (Agate, Jasper).
- **Red Badge**: "SKIP THE TUMBLER" for soft or porous stones (Basalt, Sandstone).
- **Technical Logic**: Evaluates Mohs hardness and texture to prevent ruining a batch.

### 📓 Field Journal Ethos

- **Universal App Architecture**: Powered by **Expo Router** for native-feeling navigation and deep linking.
- **Magic Container Flow**: Non-blocking Firestore writes ensure the app feels instant, even when offline.
- **High Contrast**: Designed for bright sunlight readability with senior-friendly typography.
- **Zustand State**: High-performance selection and UI state management.

## 📱 Getting Started

1.  **Install Dependencies**: `npm install` (in both root and `/app`)
2.  **Firebase Project Setup**:
    -   Place your production `google-services.json` in the `app/` directory.
3.  **Run (Dev)**: `npm run start` inside the `app/` directory.
4.  **Build (Android)**: `npx eas-cli build -p android --profile production`

## 📚 Documentation

- [**Changelog**](./CHANGELOG.md): Track the evolution of the 2.0 modernization.
- [**Conductor Dashboard**](./conductor/index.md): The central hub for project vision, tech stack, and development tracks.
- [**Agent Guidance**](./docs/agent_guidance.md): "The Rulebook" for AI agents working on this repo.
- [**Backlog**](./docs/BACKLOG.md): Pending features.

## ⚖️ License

**Proprietary / All Rights Reserved.**
See [LICENSE](./LICENSE) for details. Unauthorized copying or distribution is prohibited.

## 🤝 Contributing

This is a private repository. External contributions are not currently accepted.
Please read the [**Agent Guidance**](./docs/agent_guidance.md) before making authorized changes to ensure you match the design ethos.
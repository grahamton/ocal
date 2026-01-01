# Ocal: The Rock Buddy (v2.0)

**"Your Silent Partner in Discovery"**

Ocal is an offline-first, high-contrast rock identification app designed for senior beachcombers on the Pacific Coast. It prioritizes clarity, safety, and field utility over social features or gamification.

## 🌟 Key Features

### 🌲 Ranger Al Persona

The AI doesn't just return data; it acts as **Ranger Al**, a retired geologist and park ranger.

- **Safety First**: Warns about tide conditions and unstable cliffs.
- **Simplified Terms**: Uses friendly terms like "Volcanic Stone" instead of just "Igneous".
- **Context Aware**: Uses your GPS location to infer specific geologic formations (e.g. "Astoria Formation").

### 💎 The Polish Guide (Lapidary Advice)

A dedicated **"Ranger's Workshop"** analysis for rock tumblers.

- **Green Badge**: "TUMBLE CANDIDATE" for hard stones (Agate, Jasper).
- **Red Badge**: "SKIP THE TUMBLER" for soft or porous stones (Basalt, Sandstone).
- **Technical Logic**: Evaluates Mohs hardness and texture to prevent ruining a batch.

### 📓 Field Journal ethos

- **High Contrast**: Designed for bright sunlight readability.
- **Offline First**: Works without cell service (syncs when back online).
- **Masonry Layout**: "Museum Plaque" style presentation of facts.

## 📱 Getting Started

1.  **Install**: `npm install`
2.  **Run (Dev)**: `npm start`
3.  **Build (Android)**: `npx eas-cli build -p android --profile preview`

## 📚 Documentation

- [**Architecture**](./ARCHITECTURE.md): System design, data flow, and tech stack decisions.
- [**Agent Guidance**](./AGENTS.md): "The Rulebook" for AI agents working on this repo.
- [**Backlog**](./docs/BACKLOG.md): Pending features (Multi-Photo, etc).

## ⚖️ License

**Proprietary / All Rights Reserved.**
See [LICENSE](./LICENSE) for details. Unauthorized copying or distribution is prohibited.

## 🤝 Contributing

This is a private repository. External contributions are not currently accepted.
Please read `AGENTS.md` before making authorized changes to ensure you match the design ethos.

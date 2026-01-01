# Ocal (Beta v1.0)

**"Your Silent Partner in Discovery"**

Ocal is an offline-first, high-contrast rock identification app designed for senior beachcombers. It prioritizes clarity, simplicity, and field utility over social features or gamification.

## 📱 Getting Started

1.  **Install**: `npm install`
2.  **Run (Dev)**: `npm start`
3.  **Build (Android)**: `npx eas-cli build -p android --profile preview`

## 📚 Documentation

- [**Architecture**](./ARCHITECTURE.md): System design, data flow, and tech stack decisions.
- [**Agent Guidance**](./AGENTS.md): "The Rulebook" for AI agents working on this repo (Philosophies, UI Rules).
- [**Backlog**](./docs/BACKLOG.md): Pending features and ideas.

## 🏗 Project Structure

- `/app`: The React Native (Expo) application.
- `/functions`: Firebase Cloud Functions (AI Interface).
- `/docs`: Archive of requirements and older process docs.

## 🤝 Contributing

- This project tracks work via **GitHub Issues**.
- Please read `AGENTS.md` before writing code to ensure you match the "Silent Partner" design ethos.

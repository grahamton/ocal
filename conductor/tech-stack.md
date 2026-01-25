# Ocal Tech Stack

This document outlines the key technologies used in the Ocal project and provides recommendations for future architectural improvements.

## 1. Current Tech Stack

The current architecture is well-designed for a single-device, offline-first experience.

| Category      | Technology            | Description                                                            |
|---------------|-----------------------|------------------------------------------------------------------------|
| **Frontend**  | React Native (Expo)   | For building the cross-platform mobile application (iOS & Android).      |
| **Backend**   | Firebase Cloud Functions | For server-side AI processing logic (`identifyRock` function).         |
| **Database**  | SQLite (`expo-sqlite`)  | Local on-device database for fast, offline data storage.               |
| **File Storage**| Expo File System      | For storing captured photos directly on the user's device.             |
| **AI**        | Google Gemini API     | For multimodal rock identification via a server-side function call.    |
| **Deployment**| EAS Build             | For building and deploying production iOS/Android apps.                |

### Key Architectural Patterns
- **Offline-First**: Core functionality is designed to work without an active internet connection.
- **Client-Side Queuing**: A custom `IdentifyQueueService` on the device manages background AI analysis, handling offline-to-online transitions and retries.

---

## 2. Future Architectural Recommendations

To enable key roadmap features like multi-device sync and web access, the following enhancements to the Firebase/Google Cloud stack are recommended.

### Recommendation 1: Adopt the "Firebase Trinity" for Cloud Sync

This is the most critical recommendation to enable a multi-device experience.

1.  **Identity -> Firebase Authentication (Anonymous)**
    - **Goal**: Create a unique, persistent identity for each user without requiring a login screen.
    - **Implementation**: Use the `signInAnonymously()` method on app startup. This provides a stable User ID to associate with all cloud data.

2.  **Database -> Firestore**
    - **Goal**: Replace the local SQLite database with a cloud-native database that has built-in offline capabilities.
    - **Implementation**: Migrate the data model from SQLite tables to Firestore collections. Firestore's offline persistence will automatically handle local caching and cloud synchronization when the network is available, simplifying the data layer.

3.  **File Storage -> Cloud Storage for Firebase**
    - **Goal**: Store images in the cloud so they can be accessed from any device.
    - **Implementation**: When a photo is taken, upload it to a Cloud Storage bucket. Store the resulting public URL in the corresponding Firestore document instead of a local file path.

### Recommendation 2: Enhance the Background Queue

- **Goal**: Increase the robustness of the background processing queue.
- **Implementation**: For a future enhancement, consider replacing the client-side `IdentifyQueueService` with **Google Cloud Tasks**. The app would add a task to a Cloud Tasks queue, which then reliably invokes the Firebase Function. This moves queue management to the cloud, making it more resilient to app closures or device restarts. The current client-side queue is a solid implementation, but Cloud Tasks is the next level of scalability.

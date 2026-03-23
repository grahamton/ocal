---
description: Test the app on a physical device without building a new APK
---

# Testing Ocal on Physical Device (Development Mode)

Since Ocal uses Firebase (native modules), you cannot use the standard Expo Go app. You need a **development build**.

## Option 1: Use Existing Development Build (If Already Installed)

If you've previously installed a development build APK on your device:

1. **Connect your Pixel via USB** (optional, for automatic deployment):

   ```bash
   # Enable USB debugging on your Pixel
   # Connect via USB cable
   ```

2. **Start the development server**:

   ```bash
   cd app
   npm start
   ```

3. **Launch on device**:
   - Press `a` to automatically open on Android (if USB connected with ADB)
   - OR scan the QR code with the Expo Dev Client app already on your phone
   - OR manually open the Expo Dev Client app and enter the server URL

## Option 2: Build and Install Development Client (One-Time Setup)

This creates a special APK that you install ONCE, then can hot-reload indefinitely:

1. **Build the development client**:

   ```bash
   cd app
   npx eas-cli build --profile development --platform android --local
   ```

2. **Install the APK**:
   - EAS will create an APK file
   - Transfer it to your Pixel and install it
   - OR use `adb install path/to/build.apk` if connected via USB

3. **Run the dev server** (for all future testing):
   ```bash
   npm start
   ```

## Option 3: Wireless Connection (Same WiFi Network)

Both your computer and Pixel must be on the same WiFi network:

1. Start the dev server:

   ```bash
   cd app
   npm start
   ```

2. In the terminal, note the "Metro waiting on exp://192.168.x.x:8081" address

3. On your Pixel's Expo Dev Client app, manually enter the URL or scan QR code

## Troubleshooting

- **"Unable to connect to Metro"**: Ensure both devices are on the same network and firewall allows port 8081
- **App crashes on launch**: Rebuild the development client with latest changes
- **"No compatible apps"**: You need to install a development build first (Option 2)

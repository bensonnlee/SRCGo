# SRCode

A mobile app that generates time-sensitive Code128 barcodes for UCR authentication via Innosoft Fusion.

## Features

- UCR CAS authentication
- Dynamic barcode generation with auto-refresh
- Secure credential storage
- Offline state handling

## Tech Stack

- Expo SDK 54 / React Native 0.81
- TypeScript
- Expo Router (file-based navigation)

## Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

3. Open on your preferred platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser
   - Scan QR code with Expo Go app on your device

## Development

```bash
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run in web browser
npm run lint       # Run ESLint
```

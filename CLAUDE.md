# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SRCGo is an Expo/React Native mobile app that generates time-sensitive Code128 barcodes for UCR authentication via Innosoft Fusion. The app implements a multi-step OAuth-like authentication flow with UCR CAS.

## Commands

```bash
# Install dependencies
npm install

# Start development server (opens options for iOS/Android/web)
npx expo start

# Platform-specific development
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web browser

# Linting
npm run lint       # Uses expo lint with ESLint 9 flat config
```

## Tech Stack

- **Framework**: Expo SDK 54 / React Native 0.81
- **Language**: TypeScript 5.9 (strict mode enabled)
- **Navigation**: Expo Router (file-based routing in `app/` directory)
- **State Management**: React Context + Hooks (planned)
- **Storage**: Expo SecureStore for credentials, AsyncStorage for non-sensitive data

## Architecture

### Planned Directory Structure

```
app/                    # Expo Router file-based routing
├── (auth)/            # Auth group (login screens)
└── (main)/            # Main app group (barcode, settings)

src/
├── components/        # Reusable UI components
├── hooks/             # Custom hooks (useAuth, useBarcode, useNetwork)
├── services/          # API client, auth service, storage
├── context/           # React Context providers
├── types/             # TypeScript type definitions
└── theme/             # Design tokens (colors, typography, spacing)
```

### Authentication Flow

The app authenticates with UCR CAS through a 4-step process (see `docs/AUTH_IMPLEMENTATION.md`):

1. **Start Login** - Initialize session with Innosoft Fusion
2. **Get Execution** - Extract execution token from UCR CAS login page
3. **Login** - Submit credentials to UCR CAS, receive service ticket
4. **Get Barcode** - Exchange fusion token for barcode ID

Key implementation details:
- Cookie handling is essential - use axios with `withCredentials: true`
- Fusion tokens should be cached and reused until expiry
- Barcode auto-refreshes every 12 seconds

### Path Aliases

The project uses `@/*` path alias mapping to the root directory (configured in `tsconfig.json`).

## Key Dependencies

- `expo-secure-store` - Credential storage
- `@react-native-async-storage/async-storage` - Non-sensitive storage
- `@react-native-community/netinfo` - Network connectivity detection
- `axios` with `axios-cookiejar-support` - HTTP client with cookie support
- `react-native-barcode-svg` or `react-native-svg` - Barcode rendering

## Design System

Brand colors defined in implementation plan:
- Navy: `#003366`
- Dandelion: `#FFD700`
- Light Blue: `#87CEEB`
- Rose: `#FF007F`

## Experimental Features

Enabled in `app.json`:
- `typedRoutes` - Type-safe routing
- `reactCompiler` - React Compiler optimization
- `newArchEnabled` - React Native New Architecture

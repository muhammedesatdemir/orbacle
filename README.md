## 🇹🇷 Turkish

For the Turkish version of this document, see [README.tr.md](README.tr.md)

---

# Orbacle

Orbacle is a minimalist mobile application built with Expo and React Native. The user types a question, taps an animated crystal orb, and receives a short, randomly-selected answer from a pre-defined local answer pool. It functions similarly to a "magic 8-ball" experience, styled with a dark purple/violet aesthetic, animated visual effects, haptic feedback, a local history log, and full English/Turkish localization.

The application is offline-only: it does not communicate with any server or third-party API. All answers, history, and preferences are stored on the device.

## Overview

- Single-purpose app: ask a question, reveal an answer.
- Three-tab layout: **Home**, **History**, **Settings**.
- Two languages: English and Turkish, auto-detected from the device locale on first launch and switchable in settings.
- Answers come from two static JSON pools bundled with the app (`src/data/answers.en.json`, `src/data/answers.tr.json`), each containing 363 entries.
- The orb visual is composed of a crystal-ball image layered with animated gradients, mist, sparkle particles and floor fog, driven by `react-native-reanimated`.
- History is stored locally via `AsyncStorage` and capped at 20 most recent entries.
- Platform targets declared in `app.json`: Android (`com.orbacle.app`) and iOS (`com.orbacle.app`, tablet support disabled). The working directory is named `orbacle_android` and the repository contains an Expo Application Services (EAS) configuration, indicating primary focus on Android builds.

## Features

Implemented features, grounded in the current source:

- **Ask flow**: user types a question (max 200 chars, single line), taps the orb, and after an animated reveal sequence (~1.4s) an answer from the active-language pool is displayed.
- **No-repeat random selection**: `getRandomAnswer` avoids returning the same answer twice in a row for the current session.
- **Empty-input guard**: tapping the orb with an empty field shows an inline warning ("Please enter a question first") and a warning-style haptic notification.
- **Animated orb**: idle pulse (scale + aura opacity), tap-triggered glow, burst ring, and scale sequence, plus ambient mist layers and sparkle particles (implemented in [src/components/Orb.tsx](src/components/Orb.tsx) and [src/hooks/useOrbAnimation.ts](src/hooks/useOrbAnimation.ts)).
- **Haptic feedback** (via `expo-haptics`): medium impact on orb tap, success notification on answer reveal, warning notification for empty input. Toggleable from Settings.
- **Answer card** with fade-in animation and a share action that invokes the OS share sheet via `react-native Share.share`.
- **History**:
  - Automatic save of each Q&A (question, answer, timestamp, language) on reveal.
  - Rolling cap of 20 items, newest first.
  - Corrupted entries are filtered out and re-persisted on read.
  - "Clear History" action in Settings, guarded by a confirmation modal.
- **Localization (i18n)**:
  - String tables for English (`src/i18n/en.json`) and Turkish (`src/i18n/tr.json`).
  - Language context provider (`I18nProvider`) with synchronous `t(key)` function and fallback to English, then to the raw key.
  - Device-locale detection via `NativeModules` on first run, with persistence.
  - Manual switch in Settings between **English** and **Turkish**.
- **Date formatting**: `formatDate` uses `Intl`-style `toLocaleDateString` with `tr-TR` or `en-US` depending on the active language.
- **Settings screen**:
  - Language switcher (EN / TR).
  - Haptics toggle (persisted).
  - Clear History action with confirmation modal.
  - About section with app description, credits, and version string.
- **Error boundary** ([src/components/ErrorBoundary.tsx](src/components/ErrorBoundary.tsx)) wrapping the whole app, rendering a fallback "Something went wrong" screen with a reset action.
- **Splash screen gating**: native splash is held via `expo-splash-screen` until the i18n provider reports `ready`, preventing a pre-translation flash.
- **Safe-area-aware layouts**: every screen respects `useSafeAreaInsets`; bottom tab bar height is extended by the bottom inset.
- **Responsive orb sizing**: orb size = `min(300, round(windowWidth * 0.7))` px.
- **Accessibility details**: `accessibilityRole`/`accessibilityLabel`/`accessibilityState` on the orb `Pressable`; decorative particles/mist marked `accessibilityElementsHidden`; `maxFontSizeMultiplier` caps on the hero/slogan/helper text; `allowFontScaling={false}` on tab icons.

## Project Structure

```
orbacle_android/
├── App.tsx                         Root component: providers, splash gating, bottom tab navigator
├── app.json                        Expo app manifest (name, icons, splash, android/ios config, plugins)
├── eas.json                        EAS Build profiles (development, preview, production) and submit config
├── babel.config.js                 babel-preset-expo + react-native-reanimated/plugin
├── tsconfig.json                   Extends expo/tsconfig.base, strict mode on
├── package.json                    Scripts and dependencies
├── assets/
│   ├── icon.png                    iOS / generic app icon
│   ├── android-icon.png            Android legacy icon
│   ├── adaptive-foreground.png     Android adaptive icon foreground
│   ├── splash.png                  Splash image (background #0a0a1a)
│   └── orb.webp                    Crystal-orb visual used by the Orb component
└── src/
    ├── components/
    │   ├── Orb.tsx                 Crystal-ball visual with aura/glow/burst/mist/sparkle layers
    │   ├── QuestionInput.tsx       Single-line text input with styling and 200-char limit
    │   ├── AnswerCard.tsx          Fade-in card that displays the revealed answer
    │   ├── PrimaryButton.tsx       Ghost / filled button variants (filled uses LinearGradient)
    │   ├── LanguageSwitcher.tsx    Two-option EN/TR segmented control
    │   ├── ConfirmModal.tsx        Transparent modal used to confirm destructive actions
    │   └── ErrorBoundary.tsx       Class-component error boundary with reset action
    ├── constants/
    │   ├── colors.ts               Palette (background, primary/violet, gradients, orb tones, etc.)
    │   ├── spacing.ts              Spacing scale and borderRadius scale
    │   └── typography.ts           Text style presets (hero, title, subtitle, body, caption, answer)
    ├── data/
    │   ├── answers.en.json         363 English answer strings
    │   └── answers.tr.json         363 Turkish answer strings
    ├── hooks/
    │   └── useOrbAnimation.ts      Reanimated shared values + reveal sequence + cleanup refs
    ├── i18n/
    │   ├── index.ts                I18nProvider, useI18n hook, ready flag
    │   ├── en.json                 English UI strings
    │   └── tr.json                 Turkish UI strings
    ├── screens/
    │   ├── HomeScreen.tsx          Title, slogan, orb, input → answer → share / ask-another
    │   ├── HistoryScreen.tsx       FlatList of persisted Q&A entries (empty state included)
    │   └── SettingsScreen.tsx      Language, haptics toggle, clear-history, about
    ├── storage/
    │   ├── historyStorage.ts       AsyncStorage CRUD for history (with validation and 20-item cap)
    │   └── settingsStorage.ts      AsyncStorage read/write for language and haptics flag
    ├── types/
    │   ├── history.ts              HistoryItem type
    │   └── language.ts             Language = 'en' | 'tr'
    └── utils/
        ├── formatDate.ts           Locale-aware date/time formatter
        ├── getDeviceLanguage.ts    Detects device locale via NativeModules; maps to 'en' | 'tr'
        └── getRandomAnswer.ts      Random picker with no-immediate-repeat guard
```

## Technologies Used

From [package.json](package.json):

- **React 19.1.0** and **React Native 0.81.5**.
- **Expo SDK 54** (`expo ^54.0.0`), managed workflow. Hermes JS engine enabled (`"jsEngine": "hermes"` in `app.json`).
- **Expo modules**: `expo-splash-screen`, `expo-status-bar`, `expo-haptics`, `expo-linear-gradient`, `expo-asset`.
- **Navigation**: `@react-navigation/native` and `@react-navigation/bottom-tabs` (v7), with `react-native-screens` and `react-native-safe-area-context`.
- **Animations**: `react-native-reanimated ~4.1.1` and `react-native-worklets 0.5.1` (with the Reanimated babel plugin configured in [babel.config.js](babel.config.js)).
- **Local storage**: `@react-native-async-storage/async-storage 2.2.0`.
- **TypeScript 5.9.2** (strict, extending `expo/tsconfig.base`).
- **Build pipeline**: Expo Application Services (EAS) — see [eas.json](eas.json). CLI ≥ 18.3.0 required, `appVersionSource: remote`, three build profiles (`development`, `preview`, `production`; production has `autoIncrement: true`).

## Installation

Prerequisites:

- Node.js and npm.
- A recent Expo-compatible toolchain (Expo SDK 54 is managed; no local Android/iOS native project is required).
- For EAS builds: the EAS CLI (`npm install -g eas-cli`) and an Expo account.

Install dependencies:

```bash
npm install
```

## Usage

The available scripts are defined in [package.json](package.json):

```bash
# Start the Expo dev server (Metro bundler + dev menu)
npm run start

# Run on a connected Android device/emulator (Expo managed)
npm run android

# Run on iOS (macOS required)
npm run ios

# Start the Expo web target
npm run web
```

Production/preview builds are produced through EAS, using the profiles declared in [eas.json](eas.json):

```bash
eas build --profile development
eas build --profile preview
eas build --profile production
```

Recent git history indicates the project has moved away from a native Android build folder to the Expo managed splash/build flow:

- `remove android native build, switch to expo managed splash, update splash design`

## Configuration

Configuration is expressed entirely through declarative files; there is no runtime `.env` usage in the source tree.

- [app.json](app.json):
  - `name: "Orbacle"`, `slug: "orbacle"`, `version: "1.0.0"`.
  - `orientation: portrait`, `userInterfaceStyle: dark`, `jsEngine: hermes`.
  - Splash: `./assets/splash.png`, `resizeMode: contain`, background `#0a0a1a`.
  - Android: package `com.orbacle.app`, adaptive icon foreground `./assets/adaptive-foreground.png`, adaptive background `#0a0a1a`, `permissions: []`.
  - iOS: bundle id `com.orbacle.app`, `supportsTablet: false`.
  - Plugins: `expo-asset`, `expo-splash-screen`.
  - `extra.eas.projectId` is set for EAS integration.
- [eas.json](eas.json): three build profiles (`development`, `preview`, `production`) and an empty `submit.production` placeholder.
- [babel.config.js](babel.config.js): `babel-preset-expo` + `react-native-reanimated/plugin`.
- [tsconfig.json](tsconfig.json): extends `expo/tsconfig.base` with `strict: true`.
- User-facing settings (persisted via AsyncStorage):
  - `@orbacle_language`: `"en" | "tr"`.
  - `@orbacle_haptics`: `"true" | "false"` (enabled by default; any value other than the literal string `"false"` is treated as enabled).
  - `@orbacle_history`: JSON array of up to 20 `HistoryItem` entries.

## Architecture / Core Components

Top-level composition in [App.tsx](App.tsx):

```
ErrorBoundary
└── SafeAreaProvider
    └── I18nProvider
        └── NavigationContainer
            ├── StatusBar (style="light")
            └── AppNavigator
                └── Tab.Navigator (bottom tabs: Home / History / Settings)
```

- **ErrorBoundary**: class-component boundary at the outermost layer; displays a fallback UI with a "Try again" reset button if a render error is caught.
- **I18nProvider** ([src/i18n/index.ts](src/i18n/index.ts)):
  - Reads saved language from AsyncStorage; if absent, detects the device language and persists it.
  - Exposes `{ language, t, setLanguage, ready }` via context.
  - `ready` gates the first render; the root delays hiding the Expo splash screen until `ready === true`.
- **AppNavigator**: a bottom-tab navigator. Tab icons are emoji glyphs (`🔮`, `📜`, `⚙️`) rendered with `allowFontScaling={false}`; active/inactive tint colors come from `colors.primaryLight` and `colors.textMuted`; tab bar height is `56 + bottomInset`.
- **HomeScreen** ([src/screens/HomeScreen.tsx](src/screens/HomeScreen.tsx)):
  - Holds the interaction state (`question`, `answer`, `isAnimating`, `emptyHint`).
  - Uses `useOrbAnimation` for animation control and `getRandomAnswer(language)` for answer selection.
  - Persists each revealed answer to history via `addHistoryItem`.
  - Uses `KeyboardAvoidingView` (iOS `padding`, Android default) and a `LinearGradient` background.
- **HistoryScreen** ([src/screens/HistoryScreen.tsx](src/screens/HistoryScreen.tsx)): re-reads history on focus (via `useFocusEffect`) and renders a `FlatList`, with an empty-state view when the list is empty.
- **SettingsScreen** ([src/screens/SettingsScreen.tsx](src/screens/SettingsScreen.tsx)): language switcher, haptics switch, clear-history button with `ConfirmModal`, and static about/credits/version block.
- **Orb** ([src/components/Orb.tsx](src/components/Orb.tsx)): composes:
  - Four drifting `Mist` layers (asymmetric scaling, sine easing, opacity interpolation).
  - Seven `Sparkle` dots with staggered delays and sequence-based opacity/scale.
  - Two concentric aura layers (outer + inner) with radial-like gradients.
  - A glow intensifier, a tap burst layer, and a floor-fog ellipse.
  - A central `Image` (`assets/orb.webp`) wrapped in a `Pressable` with accessibility props.
- **useOrbAnimation** ([src/hooks/useOrbAnimation.ts](src/hooks/useOrbAnimation.ts)):
  - Five Reanimated shared values (`idlePulse`, `glowIntensity`, `burstScale`, `orbScale`, `isRevealing`).
  - An infinite sine-interpolated idle pulse loop.
  - `triggerReveal(onComplete)` runs a 1400 ms sequenced reveal (glow pulses, scale bounces, burst ring), then calls `onComplete` via a `setTimeout` whose ref is cleared on unmount or reset.
  - `resetAnimation` clears the pending timeout and damps glow/reveal state.
- **PrimaryButton**: two variants — `filled` (gradient) and `ghost` (bordered translucent). Default variant is `ghost`.
- **LanguageSwitcher**: two-segment EN/TR control with active/inactive styling.
- **QuestionInput**: single-line `TextInput` (max 200 chars), placeholder and selection color from the palette, Android-specific vertical padding tweak.
- **AnswerCard**: fade-in card showing label + quoted answer.
- **ConfirmModal**: transparent full-screen modal with backdrop tap-to-cancel and cancel/confirm buttons.

## Data Flow / Runtime Flow

Cold start:

1. `SplashScreen.preventAutoHideAsync()` is invoked at module load (before React mounts) to hold the native splash.
2. `App` renders `ErrorBoundary → SafeAreaProvider → I18nProvider → NavigationContainer → AppNavigator`.
3. `I18nProvider`'s effect reads `@orbacle_language`. If set, it adopts that language; otherwise it maps the device locale to `en` or `tr` and persists it. Regardless of outcome, `ready` becomes `true`.
4. `AppNavigator` returns `null` while `!ready`, then renders the tab navigator and hides the splash via `SplashScreen.hideAsync()`.

Ask interaction (on `HomeScreen`):

1. The user types a question into `QuestionInput` and taps the orb.
2. If the trimmed question is empty → show `enter_question` hint, trigger a warning haptic (if enabled), return.
3. Otherwise: dismiss the keyboard, set `isAnimating = true`, reset previous animation/answer.
4. Read `@orbacle_haptics`; if enabled, fire a medium impact haptic.
5. `triggerReveal` starts the reveal animation and schedules the callback for 1400 ms later.
6. On completion: pick a non-repeating random answer from the active language pool, set it in state, fire a success haptic (if enabled), and `addHistoryItem` writes a new `HistoryItem` to AsyncStorage.
7. `HomeScreen` swaps the helper text + input for `AnswerCard` + actions (`share`, `ask_another`).
8. `share` uses `Share.share` with a localized prefix; `ask_another` clears `answer`/`question` and resets the animation.

History interaction:

- On focus, `HistoryScreen` calls `getHistory()` which reads `@orbacle_history`, validates each entry (`id`, `question`, `answer` strings; `timestamp` number; `language` in `{en, tr}`), drops corrupted entries (and re-persists the cleaned list), and returns a typed array.
- Each row renders question + quoted answer + locale-formatted date.
- "Clear History" from Settings opens `ConfirmModal`; confirming calls `clearHistory()` which removes the key.

Settings interaction:

- `getHapticsEnabled()` seeds the switch on mount (default `true` when the key is absent or unreadable).
- Toggling fires `saveHapticsEnabled(value)`.
- `LanguageSwitcher` calls `setLanguage(lang)`, which updates context state and persists to AsyncStorage.

## Limitations / Current State

Observations directly grounded in the code and repo state:

- **Offline-only by design**: no network calls, no remote configuration, no analytics or crash reporting is wired up. The `ErrorBoundary` has a comment noting that Sentry/Crashlytics could be added, but no such integration exists.
- **Expo managed workflow only**: there is no `android/` or `ios/` native project directory in the repo; builds are produced via `expo run:*` or EAS. A recent commit explicitly removed the native Android build directory.
- **History cap**: hard-coded to 20 items; older entries are dropped silently on overflow.
- **Answer pools**: fixed at 363 entries per language, bundled with the JS bundle. There is no mechanism to extend, update, or fetch answers at runtime.
- **Language coverage**: exactly two languages (`en`, `tr`). Any device locale other than Turkish falls back to English.
- **Single-line input**: questions are capped at 200 characters and cannot span multiple lines.
- **No automated tests**: the repository contains no test files, test runner configuration, or CI workflow files.
- **Web target**: a `web` script exists (`expo start --web`), but the app is tuned for mobile (tab bar, safe-area insets, haptics, native share sheet). Web behavior is not explicitly verified in the code.
- **iOS device-language detection**: uses `NativeModules.SettingsManager` directly; this is the sole language-detection path and does not depend on `expo-localization`.
- **Global random state**: `getRandomAnswer` stores `lastAnswer` in a module-level variable, so the "no immediate repeat" guard is shared across calls within a single app session and reset on process restart.

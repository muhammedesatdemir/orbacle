## 🇹🇷 Turkish

For the Turkish version of this document, see [README.tr.md](README.tr.md)

---

# Orbacle

Orbacle is a minimalist mobile application built with Expo and React Native. The user types a question, taps an animated crystal orb, and receives a short, randomly-selected answer from a pre-defined local answer pool. It functions similarly to a "magic 8-ball" experience, styled with a dark purple/violet aesthetic, animated visual effects, haptic feedback, a local history log, favorites, an answer-of-the-day banner, a first-launch onboarding flow, and full English/Turkish localization.

The application is offline-only: it does not communicate with any server or third-party API. All answers, history, favorites, and preferences are stored on the device. Orbacle is presented strictly as an entertainment app — answers are randomly generated and are not real predictions or advice.

## Overview

- Single-purpose app: ask a question, reveal an answer.
- First-launch **onboarding** (3 swipeable pages, skippable) explains the flow before the user reaches the main app.
- Three-tab layout: **Home**, **History**, **Settings**.
- Two languages: English and Turkish, auto-detected from the device locale on first launch and switchable in settings.
- Answers come from two static JSON pools bundled with the app (`src/data/answers.en.json`, `src/data/answers.tr.json`), each containing 364 entries.
- The orb visual is composed of a crystal-ball image layered with animated gradients, mist, sparkle particles and floor fog, driven by `react-native-reanimated`.
- History is stored locally via `AsyncStorage` and capped at 50 most recent entries; favorites are stored separately and capped at 100.
- An "answer of the day" is deterministically derived from the current calendar date + language and shown as a banner on Home.
- Platform targets declared in `app.json`: Android (`com.demrivo.orbacle`) and iOS (`com.demrivo.orbacle`, tablet support disabled). The repository contains an Expo Application Services (EAS) configuration and an `android/` directory, indicating primary focus on Android builds.

## Features

Implemented features, grounded in the current source:

- **Onboarding flow** ([src/screens/OnboardingScreen.tsx](src/screens/OnboardingScreen.tsx)): a 3-page horizontal pager shown only on first launch — "Write your question → Tap the orb → Keep your answer". Includes a Skip button, page dots, and a Next/Start button. Completion is persisted via the `@orbacle_onboarded` flag so it never shows again.
- **Ask flow**: user types a question (max 200 chars, single line), taps the orb, and after an animated reveal sequence (~1.4s) an answer from the active-language pool is displayed.
- **No-repeat random selection**: `getRandomAnswer` tracks the last 10 returned answers (module-level state) and avoids repeating any of them within a session.
- **Answer of the day**: `getDailyAnswer` / `getDeterministicAnswer` hash the local date + language to pick one stable answer per day. It is shown in a `DailyBanner` on Home (hidden while the keyboard is open) and requires no persistence — it changes automatically at local midnight.
- **Empty-input guard**: tapping the orb with an empty field shows an inline warning ("Please enter a question first") and a warning-style haptic notification.
- **Animated orb**: idle pulse (scale + aura opacity), tap-triggered glow, burst ring, and scale sequence, plus ambient mist layers and sparkle particles (implemented in [src/components/Orb.tsx](src/components/Orb.tsx) and [src/hooks/useOrbAnimation.ts](src/hooks/useOrbAnimation.ts)). The orb section shrinks and lifts when the keyboard opens.
- **Haptic feedback** (via `expo-haptics`): medium impact on orb tap, success notification on answer reveal, warning notification for empty input, light impact on favorite toggle. Toggleable from Settings.
- **Answer card** with fade-in animation, a share action that invokes the OS share sheet via `react-native Share.share`, and a star toggle to add/remove the answer from favorites.
- **History**:
  - Automatic save of each Q&A (question, answer, timestamp, language) on reveal.
  - Rolling cap of 50 items, newest first.
  - Corrupted entries are filtered out and re-persisted on read.
  - "Clear History" action in Settings, guarded by a confirmation modal.
- **Favorites**:
  - Any answer can be starred from the Answer card on Home or from a history row.
  - Stored under a separate `@orbacle_favorites` key, capped at 100 items.
  - The History screen has an **All / Favorites** filter to view only starred entries.
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
  - About section with app description, credits, an entertainment-only notice, and version string.
- **Error boundary** ([src/components/ErrorBoundary.tsx](src/components/ErrorBoundary.tsx)) wrapping the whole app, rendering a fallback "Something went wrong" screen with a reset action.
- **Splash screen gating**: native splash is held via `expo-splash-screen` until the i18n provider reports `ready` *and* the onboarding flag has resolved, preventing a pre-translation flash.
- **Safe-area-aware layouts**: every screen respects `useSafeAreaInsets`; bottom tab bar height is extended by the bottom inset.
- **Accessibility details**: `accessibilityRole`/`accessibilityLabel`/`accessibilityState` on the orb `Pressable`, favorite stars, and history filter chips; decorative particles/mist marked `accessibilityElementsHidden`; `maxFontSizeMultiplier` caps on the hero/slogan/helper text; `allowFontScaling={false}` on tab icons.

## Project Structure

```
orbacle/
├── App.tsx                         Root component: providers, splash gating, onboarding gate, bottom tab navigator
├── app.json                        Expo app manifest (name, icons, splash, android/ios config, plugins)
├── eas.json                        EAS Build profiles (development, preview, production) and submit config
├── babel.config.js                 babel-preset-expo + react-native-reanimated/plugin
├── tsconfig.json                   Extends expo/tsconfig.base, strict mode on
├── package.json                    Scripts and dependencies
├── android/                        Generated native Android project (Gradle/EAS build output)
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
    │   ├── AnswerCard.tsx          Fade-in card that displays the revealed answer + favorite star
    │   ├── DailyBanner.tsx         Banner that shows the deterministic answer of the day
    │   ├── PrimaryButton.tsx       Ghost / filled button variants (filled uses LinearGradient)
    │   ├── LanguageSwitcher.tsx    Two-option EN/TR segmented control
    │   ├── ConfirmModal.tsx        Transparent modal used to confirm destructive actions
    │   └── ErrorBoundary.tsx       Class-component error boundary with reset action
    ├── constants/
    │   ├── colors.ts               Palette (background, primary/violet, gradients, orb tones, etc.)
    │   ├── spacing.ts              Spacing scale and borderRadius scale
    │   └── typography.ts           Text style presets (hero, title, subtitle, body, caption, answer)
    ├── data/
    │   ├── answers.en.json         364 English answer strings
    │   └── answers.tr.json         364 Turkish answer strings
    ├── hooks/
    │   └── useOrbAnimation.ts      Reanimated shared values + reveal sequence + cleanup refs
    ├── i18n/
    │   ├── index.ts                I18nProvider, useI18n hook, ready flag
    │   ├── en.json                 English UI strings
    │   └── tr.json                 Turkish UI strings
    ├── screens/
    │   ├── OnboardingScreen.tsx    First-launch 3-page intro pager (skippable)
    │   ├── HomeScreen.tsx          Title, slogan, orb, daily banner, input → answer → share / favorite / ask-another
    │   ├── HistoryScreen.tsx       FlatList of persisted Q&A entries with All/Favorites filter (empty state included)
    │   └── SettingsScreen.tsx      Language, haptics toggle, clear-history, about
    ├── storage/
    │   ├── keys.ts                 Central registry of all AsyncStorage key strings
    │   ├── historyStorage.ts       AsyncStorage CRUD for history (with validation and 50-item cap)
    │   ├── favoritesRepository.ts  AsyncStorage CRUD for favorites (validation, 100-item cap, toggle helper)
    │   ├── dailyRepository.ts      Computes the deterministic answer of the day from the local date
    │   └── settingsStorage.ts      AsyncStorage read/write for language, haptics flag, and onboarded flag
    ├── types/
    │   ├── history.ts              HistoryItem type
    │   ├── favorite.ts             FavoriteItem type
    │   └── language.ts             Language = 'en' | 'tr'
    └── utils/
        ├── formatDate.ts           Locale-aware date/time formatter
        ├── getDeviceLanguage.ts    Detects device locale via NativeModules; maps to 'en' | 'tr'
        └── getRandomAnswer.ts      Random picker (no repeat within last 10) + deterministic daily picker
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
- A recent Expo-compatible toolchain (Expo SDK 54).
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

# Run on a connected Android device/emulator
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

## Configuration

Configuration is expressed entirely through declarative files; there is no runtime `.env` usage in the source tree.

- [app.json](app.json):
  - `name: "Orbacle"`, `slug: "orbacle"`, `version: "1.1"`.
  - `orientation: portrait`, `userInterfaceStyle: dark`, `jsEngine: hermes`.
  - Splash: `./assets/splash.png`, `resizeMode: contain`, background `#0a0a1a`.
  - Android: package `com.demrivo.orbacle`, adaptive icon foreground `./assets/adaptive-foreground.png`, adaptive background `#0a0a1a`, `permissions: []`, `softwareKeyboardLayoutMode: resize`.
  - iOS: bundle id `com.demrivo.orbacle`, `supportsTablet: false`.
  - Plugins: `expo-asset`, `expo-splash-screen`.
  - `extra.eas.projectId` is set for EAS integration.
- [eas.json](eas.json): three build profiles (`development`, `preview`, `production`) and an empty `submit.production` placeholder.
- [babel.config.js](babel.config.js): `babel-preset-expo` + `react-native-reanimated/plugin`.
- [tsconfig.json](tsconfig.json): extends `expo/tsconfig.base` with `strict: true`.
- **AsyncStorage keys** — all key strings are centralized in [src/storage/keys.ts](src/storage/keys.ts):
  - `@orbacle_language`: `"en" | "tr"`.
  - `@orbacle_haptics`: `"true" | "false"` (enabled by default; any value other than the literal string `"false"` is treated as enabled).
  - `@orbacle_onboarded`: `"true"` once onboarding has been completed or skipped (absent/unreadable → onboarding shown again, except read failure which is treated as onboarded to avoid trapping the user).
  - `@orbacle_history`: JSON array of up to 50 `HistoryItem` entries.
  - `@orbacle_favorites`: JSON array of up to 100 `FavoriteItem` entries.

## Architecture / Core Components

Top-level composition in [App.tsx](App.tsx):

```
ErrorBoundary
└── SafeAreaProvider
    └── I18nProvider
        └── NavigationContainer
            ├── StatusBar (style="light")
            └── AppNavigator
                ├── OnboardingScreen        (first launch only)
                └── Tab.Navigator (bottom tabs: Home / History / Settings)
```

- **ErrorBoundary**: class-component boundary at the outermost layer; displays a fallback UI with a "Try again" reset button if a render error is caught.
- **I18nProvider** ([src/i18n/index.ts](src/i18n/index.ts)):
  - Reads saved language from AsyncStorage; if absent, detects the device language and persists it.
  - Exposes `{ language, t, setLanguage, ready }` via context.
  - `ready` is one of the two gates for hiding the splash screen.
- **AppNavigator**:
  - Resolves the `@orbacle_onboarded` flag on mount. `bootReady = i18n ready && onboarded !== null` — until both resolve, it renders `null` and the native splash stays up.
  - If not onboarded, renders `OnboardingScreen`; on completion it sets state and persists the flag.
  - Otherwise renders a bottom-tab navigator. Tab icons are emoji glyphs (`🔮`, `📜`, `⚙️`) rendered with `allowFontScaling={false}`; active/inactive tint colors come from `colors.primaryLight` and `colors.textMuted`; tab bar height is `56 + bottomInset`; the tab bar hides on keyboard.
- **OnboardingScreen** ([src/screens/OnboardingScreen.tsx](src/screens/OnboardingScreen.tsx)): a horizontal `ScrollView` pager with 3 pages, page dots, a Skip button, and a Next/Start `PrimaryButton`. Calls `onDone` when Start is pressed or Skip is tapped.
- **HomeScreen** ([src/screens/HomeScreen.tsx](src/screens/HomeScreen.tsx)):
  - Holds the interaction state (`question`, `answer`, `answerId`, `isFavorited`, `isAnimating`, `emptyHint`, `keyboardOpen`).
  - Computes the daily answer once per language via `useMemo(getDailyAnswer)`.
  - Uses `useOrbAnimation` for animation control and `getRandomAnswer(language)` for answer selection.
  - Persists each revealed answer to history via `addHistoryItem`; the same answer can be starred via `toggleFavorite`.
  - Shrinks/lifts the orb section while the keyboard is open via a Reanimated shared value driven by keyboard events.
- **HistoryScreen** ([src/screens/HistoryScreen.tsx](src/screens/HistoryScreen.tsx)): re-reads history and favorites on focus (via `useFocusEffect`), renders a `FlatList` with an All/Favorites filter and a per-row star toggle, plus an empty-state view (distinct copy for the empty-history vs. empty-favorites case).
- **SettingsScreen** ([src/screens/SettingsScreen.tsx](src/screens/SettingsScreen.tsx)): language switcher, haptics switch, clear-history button with `ConfirmModal`, and a static about/credits/entertainment-notice/version block.
- **Orb** ([src/components/Orb.tsx](src/components/Orb.tsx)): composes drifting `Mist` layers, staggered `Sparkle` dots, concentric aura layers, a glow intensifier, a tap burst layer, a floor-fog ellipse, and a central `Image` (`assets/orb.webp`) wrapped in an accessible `Pressable`.
- **useOrbAnimation** ([src/hooks/useOrbAnimation.ts](src/hooks/useOrbAnimation.ts)):
  - Reanimated shared values for idle pulse, glow, burst, orb scale, and reveal state.
  - An infinite sine-interpolated idle pulse loop.
  - `triggerReveal(onComplete)` runs a 1400 ms sequenced reveal, then calls `onComplete` via a `setTimeout` whose ref is cleared on unmount or reset.
  - `resetAnimation` clears the pending timeout and damps glow/reveal state.
- **getRandomAnswer / getDeterministicAnswer** ([src/utils/getRandomAnswer.ts](src/utils/getRandomAnswer.ts)):
  - `getRandomAnswer` keeps a module-level `recentAnswers` list (last 10) and re-rolls until it picks one not in that list, clamping the block count so the loop always terminates on small pools.
  - `getDeterministicAnswer` hashes a `dateKey:language` seed into a stable pool index — the basis for the answer of the day.
- **Storage layer** ([src/storage/](src/storage/)): a thin repository layer over `AsyncStorage`. `keys.ts` holds every key string; `historyStorage.ts` and `favoritesRepository.ts` each validate, de-corrupt, cap, and persist their arrays; `dailyRepository.ts` derives the daily answer from the local calendar day; `settingsStorage.ts` handles language, haptics, and the onboarded flag. All reads/writes degrade silently on error rather than crashing.
- **PrimaryButton / LanguageSwitcher / QuestionInput / AnswerCard / DailyBanner / ConfirmModal**: presentational components — see the Project Structure table for one-line descriptions.

## Data Flow / Runtime Flow

Cold start:

1. `SplashScreen.preventAutoHideAsync()` is invoked at module load (before React mounts) to hold the native splash.
2. `App` renders `ErrorBoundary → SafeAreaProvider → I18nProvider → NavigationContainer → AppNavigator`.
3. `I18nProvider`'s effect reads `@orbacle_language` (or detects + persists the device locale) and sets `ready`. `AppNavigator`'s effect reads `@orbacle_onboarded`.
4. `AppNavigator` returns `null` while `!bootReady` (i18n not ready *or* onboarded flag unresolved), keeping the splash up.
5. Once `bootReady`: the splash is hidden via `SplashScreen.hideAsync()`. If not onboarded → `OnboardingScreen`; otherwise → the tab navigator.

Onboarding (first launch):

1. The user swipes through 3 intro pages, or taps Skip.
2. On Start (last page) or Skip, `onDone` runs: `onboarded` state is set to `true` and `saveOnboarded()` persists the flag — onboarding will not appear again.

Ask interaction (on `HomeScreen`):

1. The user types a question into `QuestionInput` and taps the orb.
2. If the trimmed question is empty → show `enter_question` hint, trigger a warning haptic (if enabled), return.
3. Otherwise: dismiss the keyboard, set `isAnimating = true`, reset previous animation/answer.
4. Read `@orbacle_haptics`; if enabled, fire a medium impact haptic.
5. `triggerReveal` starts the reveal animation and schedules the callback for 1400 ms later.
6. On completion: pick a non-repeating random answer via `getRandomAnswer`, store it (with a generated `answerId`) in state, fire a success haptic (if enabled), and `addHistoryItem` writes a new `HistoryItem` to AsyncStorage.
7. `HomeScreen` swaps the helper text + input + daily banner for `AnswerCard` + actions. The card's star calls `toggleFavorite`; `share` uses `Share.share` with a localized prefix; `ask_another` clears the answer/question state and resets the animation.

History / favorites interaction:

- On focus, `HistoryScreen` reads `getHistory()` and `getFavorites()` in parallel; both validate each entry and drop/re-persist corrupted ones.
- The All/Favorites filter narrows the visible list; each row shows question + quoted answer + locale-formatted date + a star toggle.
- Starring from a row or from the Home answer card calls `toggleFavorite`, which adds or removes the item from `@orbacle_favorites` and returns the resulting state.
- "Clear History" from Settings opens `ConfirmModal`; confirming calls `clearHistory()` which removes the history key (favorites are unaffected).

Answer of the day:

- `getDailyAnswer(language)` builds a `YYYY-MM-DD` key from the local date and feeds it to `getDeterministicAnswer`. The result is stable across re-opens within the same day and changes at local midnight. No storage is involved.

## Limitations / Current State

Observations directly grounded in the code and repo state:

- **Offline-only by design**: no network calls, no remote configuration, no analytics or crash reporting is wired up.
- **Expo SDK 54**: builds are produced via `expo run:*` or EAS; a generated `android/` directory is present in the repo.
- **History cap**: hard-coded to 50 items; favorites cap is 100. Older entries are dropped silently on overflow.
- **Answer pools**: fixed at 364 entries per language, bundled with the JS bundle. There is no mechanism to extend, update, or fetch answers at runtime.
- **Language coverage**: exactly two languages (`en`, `tr`). Any device locale other than Turkish falls back to English.
- **Single-line input**: questions are capped at 200 characters and cannot span multiple lines.
- **No automated tests**: the repository contains no test files, test runner configuration, or CI workflow files.
- **Web target**: a `web` script exists, but the app is tuned for mobile (tab bar, safe-area insets, haptics, native share sheet). Web behavior is not explicitly verified.
- **Module-level random/daily state**: `getRandomAnswer`'s `recentAnswers` list and the no-repeat guard live in module scope — shared across a single app session and reset on process restart. The daily answer is recomputed (not persisted) and depends on the device clock.
- **Favorites are id-based**: a favorite is keyed by the history entry's `id`. Favoriting from Home uses the answer's generated id; the link between a history row and its favorite state is by that id.

# Crypto Pet

A fun, interactive crypto pet game that combines cryptocurrency tracking with weather-based moods and AI-powered comedy judging.

## Environment Setup

This project requires API keys for external services:

1. **OpenWeather API** (for weather integration)
   - Sign up at: https://openweathermap.org/api
   - Free tier: 1,000 calls/day
   - Required for: Weather mood modifier

2. **Google Gemini AI API** (for comedy judge)
   - Get key at: https://makersuite.google.com/app/apikey
   - Free tier: 60 requests/minute
   - Required for: AI Comedy Judge feature

### Setup Instructions:
1. Copy `.env.example` to `.env`
2. Add your API keys to `.env`
3. Restart the dev server

⚠️ **Never commit `.env` to Git!**

## Project Structure

```
src/
├── components/          # React components
│   ├── Layout/         # Layout components (Header, Footer, Container)
│   ├── Pet/            # Pet-related components (PetDisplay, PetSprite, Animations)
│   ├── UI/             # Reusable UI components (Button, Modal, Input)
│   └── Modals/         # Modal components (EvolutionModal, SchadenfreudeModal)
├── contexts/           # React Context providers (PetContext for global state)
├── hooks/              # Custom React hooks (useCryptoUpdates, useEvolution)
├── services/           # API service classes (CryptoService, WeatherService, GeminiService)
├── utils/              # Utility functions (moodCalculator, cacheManager, evolutionChecker)
├── types/              # TypeScript type definitions (interfaces, enums)
├── styles/             # Global styles (variables.css, global.css) and CSS modules
└── config/             # Configuration files (env.ts)
```

### Folder Descriptions

**components/** - React components organized by domain
- `Layout/` - Page structure components (Header, Footer, Container)
- `Pet/` - Pet-specific components (PetDisplay, PetSprite, MoodMeter, ParticleSystem)
- `UI/` - Reusable UI primitives (Button, Modal, Input, Dropdown)
- `Modals/` - Modal dialogs (EvolutionModal, SchadenfreudeModal, ComedyJudgeModal)

**contexts/** - React Context for global state management
- `PetContext.tsx` - Global pet state (mood, evolution, interactions)
- No external state management library (React Context only)

**hooks/** - Custom React hooks for reusable logic
- `useCryptoUpdates.ts` - Fetch and update crypto prices
- `useEvolutionCheck.ts` - Check evolution thresholds
- `useWeather.ts` - Fetch weather data

**services/** - API service classes (singleton pattern)
- `CryptoService.ts` - CoinGecko API integration
- `WeatherService.ts` - OpenWeather API integration
- `GeminiService.ts` - Google Gemini AI integration

**utils/** - Pure utility functions (no side effects)
- `moodCalculator.ts` - Calculate mood from price/weather
- `cacheManager.ts` - In-memory caching logic
- `evolutionChecker.ts` - Evolution threshold logic
- `cooldownManager.ts` - Cooldown timing logic

**types/** - TypeScript type definitions
- `pet.types.ts` - Pet-related types (PetState, MoodLevel, EvolutionStage)
- `crypto.types.ts` - Crypto-related types (CoinInfo, CryptoPrice)
- `api.types.ts` - API response types

**styles/** - Global styles and CSS modules
- `variables.css` - CSS custom properties (colors, spacing, fonts)
- `global.css` - Global resets and base styles
- Component-specific CSS modules co-located with components

**config/** - Configuration and constants
- `env.ts` - Environment variable access
- `constants.ts` - App-wide constants (coin list, thresholds)

## Getting Started

This project uses React + TypeScript + Vite for a modern development experience.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Sprite Asset Pipeline

Regenerate the nine mood × stage pet sprites by running:

```
python3 scripts/generate_pet_sprites.py
```

Requirements:

- Python 3.10+
- [Pillow](https://python-pillow.org/) (`python3 -m pip install pillow`)

The script writes PNGs to `public/assets/sprites` using the naming scheme `pet-{stage}-{mood}.png`, matching the `PetSprite` component expectations and the Epic 2 art specification.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

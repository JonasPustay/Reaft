# Reaft mobile app

Application mobile Reaft (Expo + React Native) pour suivre l'état de bâtiments et analyser des défauts à partir de photos.

## Fonctionnalités

- Gestion des bâtiments: création, édition, suppression, réorganisation (drag & drop)
- Suivi des défauts par bâtiment avec photo, état (`A` à `F`), type et coût estimé
- Analyse IA des photos de défauts via Gemini (appelé à travers un proxy Cloudflare Worker)
- Carte Mapbox:
  - marqueurs colorés selon l'état
  - clustering adaptatif selon le zoom (région, département, ville, proximité)
  - géolocalisation utilisateur + recentrage/suivi
  - popup détaillé et navigation vers la fiche bâtiment
- Paramètres:
  - changement de langue (`fr`, `en`, `es`)
  - export/import des données bâtiments en JSON
  - suppression des données locales
  - contact, feedback, notation native

## Stack technique

- Expo `~53.0.20`
- React Native `0.79.5`
- React `19.0.0`
- React Navigation (`@react-navigation/*`)
- Mapbox (`@rnmapbox/maps`)
- AsyncStorage (`@react-native-async-storage/async-storage`)
- i18n (`i18next`, `react-i18next`)
- NativeWind (Tailwind RN)

## Prérequis

- Node.js 20+
- Yarn 3.6.3 (déclaré dans `packageManager`)
- Xcode (iOS) et/ou Android Studio (Android)

Ce projet utilise Yarn 3 avec `nodeLinker: node-modules`.

## Installation

```bash
yarn expo install
```

## Configuration environnement

Copier l'exemple puis renseigner les variables d'environnement:

```bash
cp .env.example .env
```

```bash
GEMINI_PROXY_URL=https://reaft-ai-proxy.<account-subdomain>.workers.dev/analyze
REVENUECAT_API_KEY_IOS=appl_XXXXXXXXXXXXXXXX
```

## Scripts

```bash
yarn start      # expo start
yarn ios        # expo run:ios
yarn android    # expo run:android
yarn web        # expo start --web
```

## Configuration Mapbox

Mapbox est déjà branché dans le projet, avec des tokens présents dans:

- `app.json` (`plugins -> @rnmapbox/maps -> RNMapboxMapsDownloadToken`)
- `src/constants/mapbox.js` (`MAPBOX_ACCESS_TOKEN`)
- `android/gradle.properties` (`MAPBOX_DOWNLOADS_TOKEN`)

## Intégration IA (Gemini)

Le flux actuel:

1. L'app envoie `photoBase64`, `mimeType`, `latitude/longitude` au proxy (`GEMINI_PROXY_URL`).
2. Le worker Cloudflare appelle Gemini avec `GEMINI_API_KEY` stockée côté serveur.
3. L'app normalise la réponse IA et enrichit le défaut (état, type, coût, confiance, résumé).

Référence worker: `../cloudflare-workers/gemini-proxy/README.md`.

## Stockage local

AsyncStorage est utilisé pour:

- `@reaft/buildings`: liste des bâtiments et défauts
- `@reaft/geocode_cache`: cache de géocodage inverse pour la carte
- `appLanguage`: langue de l'app

## Structure utile

- `App.js`: initialisation app + providers
- `src/navigation/TabNavigator.js`: navigation onglets (`building`, `map`, `settings`)
- `src/screens/BuildingScreen.js`: CRUD bâtiments + gestion défauts + appel IA
- `src/screens/MapScreen.js`: carte, clustering, popup, géocodage inverse
- `src/screens/SettingsScreen.js`: options de configuration utilisateur
- `src/components/settings/SettingModals.js`: export/import/suppression des données
- `src/services/defectAiService.js`: client proxy Gemini + normalisation de la sortie IA
- `src/services/RevenueCat.js`: wrapper RevenueCat (init, offres, achat, restore, login/logout)

## Développement natif

Après changement de dépendances natives:

```bash
cd ios && pod install && cd ..
```

Si nécessaire pour régénérer les projets natifs:

```bash
yarn expo prebuild
```

## Dépannage rapide

- Dépendances cassées: `yarn install`
- Cache Metro: `yarn expo start --clear`
- Erreur IA `missing_ai_proxy_url`: vérifier `GEMINI_PROXY_URL` dans `.env`
- RevenueCat non initialisé: vérifier `REVENUECAT_API_KEY_IOS` dans `.env`
- Erreur auth Mapbox Android: vérifier `MAPBOX_DOWNLOADS_TOKEN` dans `android/gradle.properties`
- Pods iOS manquants: `cd ios && pod install`

Dernière mise à jour: 20 mars 2026

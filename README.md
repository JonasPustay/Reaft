# Reaft

Monorepo Reaft pour l'inspection de bâtiments, composé de:

- une application mobile Expo / React Native
- un site web vitrine React
- un proxy IA Cloudflare Worker pour Gemini

## Structure du dépôt

- `Reaft-app`: app mobile principale (gestion des bâtiments, carte, analyse IA de défauts)
- `react-web`: site web vitrine + pages légales
- `cloudflare-workers/gemini-proxy`: proxy sécurisé entre le mobile et l'API Gemini

## Prérequis

- Node.js 20+
- Yarn 3.6.3 (`corepack enable`)
- Xcode (iOS) et/ou Android Studio (Android) pour le mobile
- Compte Cloudflare (si vous activez l'analyse IA)

## Démarrage rapide

### 1) Déployer le proxy IA (recommandé avant le mobile)

```bash
cd cloudflare-workers/gemini-proxy
yarn install
yarn wrangler secret put GEMINI_API_KEY
yarn deploy
```

Récupérez ensuite l'URL publique (`.../analyze`).

### 2) Lancer l'application mobile

```bash
cd Reaft-app
cp .env.example .env
```

Dans `Reaft-app/.env`, définissez:

```bash
GEMINI_PROXY_URL=https://<votre-worker>/analyze
```

Puis:

```bash
yarn install
yarn start
```

Et sur simulateur/appareil:

```bash
yarn ios
yarn android
```

### 3) Lancer le site web

```bash
cd react-web
yarn install
yarn start
```

Alternative possible:

```bash
npm install
npm start
```

## Documentation par module

- `Reaft-app/README.md`
- `react-web/README.md`
- `cloudflare-workers/gemini-proxy/README.md`

## Ressources projet

- Cahier des charges: https://www.notion.so/maximerollin/Cahier-des-Charges-T_ESP_800-192781ae75a58099a084fa0338613067#192781ae75a58059b610f3277c5fb371
- Kanban: https://trello.com/b/MxpSih0A/esp

Dernière mise à jour: 20 mars 2026

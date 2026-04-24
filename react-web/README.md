# Reaft web

Site web vitrine de Reaft (landing page + pages légales/informationnelles).

## Fonctionnalités

- Landing page marketing (`/`) avec:
  - présentation produit
  - modules/fonctionnalités
  - témoignages
  - FAQ
- Navigation vers les pages d'information:
  - contact
  - à propos
  - CGU / CGV
  - politique cookies
  - politique de confidentialité
  - mentions légales
- Liens de téléchargement App Store / Google Play

## Stack technique

- React `19.1.1`
- React Router DOM `7.9.1`
- Create React App (`react-scripts 5.0.1`)

## Prérequis

- Node.js 20+ recommandé

## Installation

```bash
yarn install
```

Alternative:

```bash
npm install
```

## Lancer en local

```bash
yarn start
```

Puis ouvrir `http://localhost:3000`.

## Scripts disponibles

```bash
yarn start
yarn build
yarn test
yarn eject
```

Les équivalents `npm run ...` fonctionnent aussi.

## Routes principales

- `/` (Accueil)
- `/about`
- `/Contact`
- `/Legal`
- `/CGU`
- `/CGV`
- `/cookies`
- `/PrivacyPolicy`

## Structure utile

- `src/App.js`: shell global (navbar, routes, footer)
- `src/routes/Routes.js`: mapping des routes
- `src/components/Home.js`: landing page
- `src/pages/*.js`: pages légales et institutionnelles
- `src/styles/*.css`: styles globaux et par page

## Build et déploiement

```bash
yarn build
```

Le build statique est généré dans `build/` et est déployé sur un hébergeur statique Vercel.

Dernière mise à jour: 20 mars 2026

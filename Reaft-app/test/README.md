# Tests unitaires — Reaft App

Ce dossier contient l'ensemble des tests unitaires de l'application mobile Reaft, écrits avec **Jest**.

## Structure

```
test/
├── __mocks__/
│   └── @env.js               # Variables d'environnement factices pour les tests
├── constants/
│   └── buildings.test.js     # Tests des constantes liées aux bâtiments
├── services/
│   ├── defectAiService.test.js  # Tests du service d'analyse IA des défauts
│   └── RevenueCat.test.js    # Tests du service de paiement RevenueCat
└── setup.js                  # Configuration globale Jest (ex: __DEV__)
```

## Lancer les tests

```bash
# Lancer tous les tests une fois
npm test

# Mode watch (relance à chaque modification)
npm run test:watch

# Avec rapport de couverture
npm run test:coverage
```

## Configuration Jest

Le fichier `jest.config.js` à la racine du projet définit :

- **`testEnvironment: "node"`** — pas de DOM simulé, adapté aux services purs
- **`setupFiles`** — `test/setup.js` injecte `global.__DEV__ = false` avant chaque suite
- **`moduleNameMapper`** — `@env` est résolu vers `test/__mocks__/@env.js` (variables factices)
- **`transformIgnorePatterns`** — les packages Expo/React Native sont transpilés par Babel

## Mock des variables d'environnement

Le fichier `test/__mocks__/@env.js` expose des valeurs factices utilisées à la place du `.env` réel :

```js
GEMINI_PROXY_URL: "https://proxy.example.com/analyze"
REVENUECAT_API_KEY_IOS: "test-revenuecat-key-ios"
```

Pour tester le cas "clé manquante", les suites concernées surchargent ce mock localement via `jest.doMock("@env", ...)`.

# Reaft Gemini Proxy (Cloudflare Worker)

Proxy HTTP entre l'app mobile Reaft et Gemini pour éviter d'exposer `GEMINI_API_KEY` côté client.

## Stack

- Cloudflare Worker JavaScript (`src/index.js`)
- Wrangler `^4.9.1`
- Compat date: `2026-03-19` (`wrangler.toml`)

## Prérequis

- Node.js 20+
- Yarn 3
- Compte Cloudflare avec Workers activé

## Installation

```bash
cd cloudflare-workers/gemini-proxy
yarn install
```

## Configuration des secrets

Définir la clé Gemini en secret Cloudflare:

```bash
yarn wrangler secret put GEMINI_API_KEY
```

Variable optionnelle (déjà présente dans `wrangler.toml`):

```toml
[vars]
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"
```

## Lancer en local

```bash
yarn dev
```

Le worker expose l'endpoint `POST /analyze`.

## Déploiement

```bash
yarn deploy
```

Avec la config actuelle (`workers_dev = true`), l'URL publique ressemble à:

```text
https://reaft-ai-proxy.<account-subdomain>.workers.dev/analyze
```

## Contrat API

### Endpoint

- `POST /analyze`
- `OPTIONS /analyze` (préflight CORS)

### Requête attendue

```json
{
  "photoBase64": "<base64>",
  "mimeType": "image/jpeg",
  "building": {
    "latitude": 48.8566,
    "longitude": 2.3522
  }
}
```

### Réponse

Le worker renvoie la réponse Gemini brute (`generateContent`) avec le même code HTTP que l'upstream.

### Erreurs gérées côté worker

- `405 method_not_allowed` si méthode différente de `POST`/`OPTIONS`
- `404 not_found` si chemin différent de `/analyze`
- `400 invalid_json` si body invalide
- `400 invalid_payload` si `photoBase64` absent
- `500 missing_server_secret` si `GEMINI_API_KEY` manquant

## CORS

Les en-têtes CORS sont ajoutés automatiquement et l'origine est reprise depuis l'en-tête `Origin` de la requête.

## Intégration dans l'app mobile

Dans `Reaft-app/.env`:

```bash
GEMINI_PROXY_URL=https://reaft-ai-proxy.<account-subdomain>.workers.dev/analyze
```

Puis lancer/recharger l'app mobile.

Dernière mise à jour: 20 mars 2026

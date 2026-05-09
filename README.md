# nfc-jukebox-webapp

React SPA for the [NFC Spotify Jukebox](https://github.com/mvesga/nfcSpotifyJukebox) project.

This repo is the **Lovable-editable copy** of the web UI. Connect it to [Lovable](https://lovable.dev) for visual development and AI-assisted design.

## Connecting to Lovable

1. Go to lovable.dev → New Project → Import from GitHub
2. Select `mvesga/nfc-jukebox-webapp`
3. Lovable builds and previews the app — start editing!

## Local development

```bash
npm install
npm run dev
```

The app defaults to `http://raspberrypi.local:8000` as the Pi API URL. Override it in the **Settings** page (stored in localStorage) or via `VITE_API_URL` in a `.env` file.

## Pi deployment

Changes made here are synced back to the main repo ([nfcSpotifyJukebox](https://github.com/mvesga/nfcSpotifyJukebox)) using `scripts/sync-webapp.sh`, which re-applies the Pi-specific config (`base: '/app/'`, `HashRouter`) and rebuilds `dist/`.

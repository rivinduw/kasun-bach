# The Pawn's Promotion

A mobile-first, chess-themed bachelor-party game for the final night of bachelorhood. Built with React, TypeScript and Vite; it runs as a static Cloudflare Pages site and keeps names and progress in this browser's local storage.

## Run locally

```sh
npm install
npm run dev
```

Build and preview the production site:

```sh
npm run build
npm run preview
```

Run the game-logic test suite:

```sh
npm test
```

## Deploy to Cloudflare Pages

Cloudflare Pages' React/Vite build settings are `npm run build` and `dist`. For Git integration, push this folder to a repository, create a Pages project connected to it, set production branch to `main`, build command to `npm run build`, and build output directory to `dist`.

For Direct Upload with Wrangler, authenticate once and create the Pages project if it does not already exist:

```sh
npx wrangler login
npx wrangler pages project create pawns-promotion
npm run deploy
```

The project-creation command asks for a production branch; use `main`. Once the project exists, `npm run deploy` builds the app and uploads `dist` to the `pawns-promotion` Pages project. Cloudflare will provide the project's `*.pages.dev` URL. Direct Upload and Git integration are alternative project modes; choose the intended mode when creating the Pages project.

## Game flow

The groom starts on rank 2, receives four one-use power cards, opens six challenge envelopes, and may promote to a Queen, Rook, Bishop or Knight at rank 8. The Chief Arbiter panel supports challenge overrides, deferred/skip records, restoration of cards, fast-track promotion, state export/import, and game reset. Marriage IQ, Shark Tank votes, rap words, timers, Queen's Verdict, voucher and certificate all run without a server.

The game is configured in `src/game.ts` and the challenge-specific presentation is in `src/App.tsx`. The event city, date, names and optional dinner limit can also be edited at setup or in the Arbiter panel.

## Privacy and offline use

Scores, ratings, votes and game progress are stored only in local storage on the current device. The requested first names are prefilled in the public app source and can be edited in setup; remove or replace them before sharing the repository more widely. No analytics or external services are used by the game. Recordings are not uploaded or stored here. Camera/file access happens only when the organiser taps the camera button; WhatsApp opens only after an explicit tap and consent checkbox.

The service worker caches the app shell and same-origin app assets as they are visited, with network-first updates and a cached fallback when the connection drops. Open the site once while online before taking it out for the evening. Local storage is not encrypted; the organiser panel is a convenience, not authentication. Challenge and reward content is included in the public static app files.

## Practical notes

- Use one primary phone for the group. Progress does not sync across devices.
- Any challenge can be modified, skipped or declined without pressure.
- The bride's advertisement is never sent automatically. Sharing requires the groom's consent.
- Reward privileges are celebratory agreements, not legal obligations. Keep all requests reasonable and within mutually agreed limits.
- A downloaded voucher/certificate is SVG, so it stays sharp when zoomed or printed. The Print action is also available.

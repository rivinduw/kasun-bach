# The Pawn's Promotion

A mobile-first chess-themed bachelor-party game for Kasun and Imesha. One shared Cloudflare Durable Object keeps the current screen, challenge, timers, votes, and reward in sync across every phone in the room.

## Roster

- Groom: Kasun
- Bride: Imesha
- Group: Kavindu, Rivindu, Elijah, Dane, and Sachira

The roster is fixed in the app and shared room. The game does not create separate rooms for individual phones.

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

## Cloudflare deployment

The React app is deployed through Cloudflare Pages' Git integration (`main`, `npm run build`, output `dist`). Its single shared room runs as the `kasun-bach-state` Worker with a SQLite-backed Durable Object. The Worker source and Wrangler configuration are in `workers/room/`.

To redeploy the room Worker after changing it:

```sh
npx wrangler deploy --config workers/room/wrangler.toml
```

Pages builds deploy the frontend when a commit reaches `main`.

## Game flow

Kasun starts on rank 1 with an invitation, an introduction and four power cards. He moves to rank 2 to open the first of six challenge envelopes, and may promote to a Queen, Rook, Bishop, or Knight at rank 8. The vertical rank journey shows the shared position. Completed envelopes can be reviewed, and deferred envelopes remain available without moving progress backward.

Reset shared game in the Arbiter panel asks for confirmation, then clears the room for every phone and returns Kasun to rank 1.

The Arbiter panel has shared progression, recovery, timer, and reward controls. Undo restores the prior promotion and power-card state. Shark questions and Bishop assignments stay consistent across devices. Marriage IQ starts a fresh clock for each scenario.

## Offline behavior and privacy

The service worker precaches the built JavaScript and CSS with the app shell. It shows an “Offline ready” status when the assets are available. Shared moves require a network connection; when the room reconnects, its saved state replaces a device's cached snapshot.

Camera videos stay on the recording device. The app never uploads them. WhatsApp opens only after the groom's explicit consent and a tap. Game state is public to visitors of the shared site, so use this room for the party group rather than private information.

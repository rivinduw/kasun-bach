import { DurableObject } from 'cloudflare:workers';
import { createGame, parseGame, remainingSeconds } from '../../src/game.ts';
import { applyMove } from '../../src/roomEdits.ts';

const GAME_KEY = 'shared-game-v1';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health') return Response.json({ ok: true, room: 'kasun-bachelor-party' });
    if (url.pathname !== '/room') return new Response('Not found', { status: 404 });
    return env.ROOM.get(env.ROOM.idFromName('kasun-bachelor-party-single-room')).fetch(request);
  },
};

export class SharedGameRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.record = await ctx.storage.get(GAME_KEY);
      if (this.record?.openingEdition === 1) return;
      const state = this.record ? parseGame(JSON.stringify(this.record.state)) : createGame();
      // One-time rollout for tonight's first, still unresolved envelope.
      if (state.step === 0 && state.statuses.every(status => status === null)) {
        state.screen = 'landing';
        state.rank = 1;
        state.viewingStep = null;
        state.clock = { ...state.clock, remaining: remainingSeconds(state.clock), startedAt: null };
      }
      this.record = { state, revision: (this.record?.revision || 0) + 1, generation: 1, openingEdition: 1 };
      await ctx.storage.put(GAME_KEY, this.record);
    });
  }

  snapshot(socket, receipt = {}) {
    const { state, revision, generation } = this.record;
    const legacy = !this.ctx.getTags(socket).includes('v2');
    const visible = legacy && state.rank === 1 ? { ...state, rank: 2 } : state;
    socket.send(JSON.stringify({
      type: 'snapshot', state: visible, revision, generation,
      connections: this.ctx.getWebSockets().length, ...receipt,
    }));
  }

  broadcast(sender, receipt) {
    for (const socket of this.ctx.getWebSockets()) {
      try { this.snapshot(socket, socket === sender ? receipt : {}); } catch { /* Closed peer. */ }
    }
  }

  async fetch(request) {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('WebSocket upgrade required', { status: 426 });
    const [client, server] = Object.values(new WebSocketPair());
    const modern = new URL(request.url).searchParams.get('v') === '2';
    this.ctx.acceptWebSocket(server, [modern ? 'v2' : 'legacy']);
    this.broadcast();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(socket, raw) {
    if (typeof raw !== 'string' || raw.length > 256000) return;
    // Older tabs receive the current board until refreshed. They cannot restore a pre-reset save.
    if (!this.ctx.getTags(socket).includes('v2')) { this.snapshot(socket); return; }
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    const record = this.record;
    const reject = () => this.snapshot(socket, { rejected: msg.id });
    if (msg.generation !== record.generation) return reject();
    let state;
    if (msg.type === 'reset' && msg.revision === record.revision) {
      state = createGame();
    } else if (msg.type === 'move') {
      try {
        const next = applyMove(record.state, msg.move);
        if (!next) return reject();
        state = parseGame(JSON.stringify(next));
      } catch { return reject(); }
    } else return reject();
    this.record = { ...record, state, revision: record.revision + 1, generation: record.generation + Number(msg.type === 'reset') };
    await this.ctx.storage.put(GAME_KEY, this.record);
    this.broadcast(socket, { accepted: msg.id });
  }

  webSocketClose(socket, code, reason) {
    try { socket.close(code === 1005 || code === 1006 ? 1000 : code, reason); } catch { /* Already closed. */ }
    this.broadcast();
  }
  webSocketError(socket) { try { socket.close(1011, 'Reconnect'); } catch { /* Already closed. */ } }
}

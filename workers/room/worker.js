import { DurableObject } from 'cloudflare:workers';

const GAME_KEY = 'shared-game-v1';
const ROSTER = ['Kavindu', 'Rivindu', 'Elijah', 'Dane', 'Sachira'];

function initialState() {
  return {
    version: 1,
    screen: 'landing',
    groom: 'Kasun',
    bride: 'Imesha',
    friends: ROSTER,
    arbiter: '',
    city: 'Colombo',
    eventDate: '26 November 2026',
    spendingLimit: '',
    startedAt: null,
    step: 0,
    rank: 2,
    viewingStep: null,
    statuses: Array(6).fill(null),
    opened: false,
    powerUsed: [],
    undoStack: [],
    fastTracked: false,
    sharks: [],
    iqQuestions: [],
    iqScores: [],
    iqIndex: 0,
    rapDifficulty: 'Medium',
    rapWords: [],
    rapPrepared: false,
    queenConsent: false,
    queenMessageSent: false,
    queenRatings: Array(6).fill(0),
    queenFeedback: '',
    queenVerdict: '',
    zugzwangChoice: '',
    clock: { label: '', duration: 0, remaining: 0, startedAt: null },
    selectedPiece: '',
    rewardNote: '',
    mission: 'Naturally use the word zugzwang in conversation with another participating friend.',
    bishopAssignments: ['Zugzwang', 'En Passant', 'Gambit', 'Underpromotion', 'Stalemate'],
  };
}

function validGame(state) {
  return state && state.version === 1 && Array.isArray(state.statuses) && state.statuses.length === 6
    && Number.isInteger(state.step) && state.step >= 0 && state.step <= 6
    && Number.isInteger(state.rank) && state.rank === state.step + 2
    && ['landing', 'welcome', 'preparation', 'game', 'promotion', 'reward'].includes(state.screen)
    && Array.isArray(state.powerUsed);
}

function lockRoster(state) {
  return { ...state, groom: 'Kasun', bride: 'Imesha', friends: ROSTER };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health') return Response.json({ ok: true, room: 'kasun-bachelor-party' });
    if (url.pathname !== '/room') return new Response('Not found', { status: 404 });
    const id = env.ROOM.idFromName('kasun-bachelor-party-single-room');
    return env.ROOM.get(id).fetch(request);
  },
};

export class SharedGameRoom extends DurableObject {
  async getRecord() {
    let record = await this.ctx.storage.get(GAME_KEY);
    if (!record) {
      record = { state: initialState(), revision: 0 };
      await this.ctx.storage.put(GAME_KEY, record);
    }
    return record;
  }

  async broadcast() {
    const record = await this.getRecord();
    const message = JSON.stringify({ type: 'snapshot', state: record.state, revision: record.revision, connections: this.ctx.getWebSockets().length });
    for (const socket of this.ctx.getWebSockets()) {
      try { socket.send(message); } catch { /* Closed sockets are removed by the runtime. */ }
    }
  }

  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('WebSocket upgrade required', { status: 426 });
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    this.ctx.acceptWebSocket(server);
    await this.getRecord();
    await this.broadcast();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(_socket, message) {
    let update;
    try { update = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message)); }
    catch { return; }
    if (!['update', 'bootstrap'].includes(update?.type) || !validGame(update.state)) return;
    const record = await this.getRecord();
    if (update.type === 'bootstrap' && record.revision !== 0) {
      await this.broadcast();
      return;
    }
    const state = lockRoster(update.state);
    record.state = state;
    record.revision += 1;
    await this.ctx.storage.put(GAME_KEY, record);
    await this.broadcast();
  }

  async webSocketClose() { await this.broadcast(); }
  async webSocketError() { await this.broadcast(); }
}

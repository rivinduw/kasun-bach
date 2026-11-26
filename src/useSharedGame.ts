import { useEffect, useRef, useState } from 'react';
import { createGame, parseGame, STORAGE_KEY, type GameState } from './game';
import { applyMove, makeMove, type Move } from './roomEdits';

const ROOM_URL = 'wss://kasun-bach-state.rivindu-w.workers.dev/room?v=2';
function readSaved() {
  try { return parseGame(localStorage.getItem(STORAGE_KEY) || ''); } catch { return createGame(); }
}

export function useSharedGame(notify: (message: string) => void) {
  const [game, setGame] = useState(readSaved);
  const [status, setStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');
  const [connections, setConnections] = useState(0);
  const [generation, setGeneration] = useState(0);
  const current = useRef(game);
  const socket = useRef<WebSocket | null>(null);
  const version = useRef({ generation: 0, revision: 0 });
  const pending = useRef(new Map<number, Move>());
  const sequence = useRef(0);

  useEffect(() => {
    let stopped = false;
    let retry = 0;
    function connect() {
      const ws = new WebSocket(ROOM_URL);
      socket.current = ws;
      ws.onmessage = event => {
        if (stopped) return;
        let msg, confirmed;
        try {
          msg = JSON.parse(event.data);
          if (msg.type !== 'snapshot' || !Number.isInteger(msg.generation)) return;
          confirmed = parseGame(JSON.stringify(msg.state));
        } catch { ws.close(); return; }
        const replaced = version.current.generation > 0 && version.current.generation !== msg.generation;
        if (replaced) { pending.current.clear(); notify('The shared game has returned to rank one.'); }
        version.current = { generation: msg.generation, revision: msg.revision };
        setGeneration(msg.generation);
        pending.current.delete(msg.accepted);
        if (msg.rejected !== undefined) {
          pending.current.delete(msg.rejected);
          notify('The board changed on another phone. Check the current move and try again.');
        }
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(confirmed)); } catch { /* The room remains authoritative. */ }
        let visible = confirmed;
        for (const move of pending.current.values()) visible = applyMove(visible, move) ?? visible;
        current.current = visible;
        setGame(visible);
        setConnections(msg.connections);
        setStatus('online');
      };
      ws.onclose = () => {
        if (stopped) return;
        pending.current.clear();
        setStatus('offline');
        const saved = readSaved();
        current.current = saved;
        setGame(saved);
        retry = window.setTimeout(connect, 1600);
      };
      ws.onerror = () => ws.close();
    }
    connect();
    return () => { stopped = true; clearTimeout(retry); socket.current?.close(); };
  }, [notify]);

  function connected() {
    if (socket.current?.readyState === WebSocket.OPEN && status === 'online') return true;
    notify('Waiting for a connection. Your phone will rejoin the shared board automatically.');
    return false;
  }
  function update(changes: Partial<GameState> | ((state: GameState) => GameState)) {
    if (!connected()) return;
    const before = current.current;
    const next = typeof changes === 'function' ? changes(before) : { ...before, ...changes };
    const move = makeMove(before, next);
    if (!move.changes.length) return;
    const id = ++sequence.current;
    socket.current!.send(JSON.stringify({ type: 'move', id, generation: version.current.generation, move }));
    pending.current.set(id, move);
    current.current = next;
    setGame(next);
  }
  function reset() {
    if (!connected()) return;
    socket.current!.send(JSON.stringify({ type: 'reset', id: ++sequence.current, ...version.current }));
  }
  return { game, update, reset, status, connections, generation };
}

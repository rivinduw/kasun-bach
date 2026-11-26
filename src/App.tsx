import { Introduction } from './Introduction';
import { useSharedGame } from './useSharedGame';
import { Envelope, Reveal } from './Envelope';
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  Check, ChevronRight, Clipboard, Clock3, Download, ExternalLink,
  Compass, Flag, LockKeyhole, Menu, Pause, Play, RotateCcw, Share2, Shield,
  SkipForward, Sparkles, Trophy, Unlock, X, Wifi, WifiOff,
} from 'lucide-react';
import {
  BRUTAL_WORDS, BRIDE, BROTHERHOOD, CHALLENGES, advanceOpening, drawUnique, fastTrack, GROOM, IQ_QUESTIONS, GAME_CONTENT,
  marriageIqPercent, POWER_CARDS, RAP_WORDS, remainingSeconds, rerollRapWords,
  resolveEnvelope, restorePower, scoreIqAnswer, selectPromotion, serializeGame, SHARK_ROLES,
  consumePower, undoProgress, voteResult, QUEEN_CATEGORIES, QUEEN_MESSAGE, VERDICTS,
  PIECES, REWARDS, WEDDING_MISSIONS, SECRET_TERMS, ZUGZWANG_CHOICES,
  type GameState, type Resolution,
} from './game';

function safeText(value: string) { return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char] || char); }
function wrapLine(line: string, max = 66) {
  const words = line.split(/\s+/); const rows: string[] = []; let row = '';
  for (const word of words) { if (row && `${row} ${word}`.length > max) { rows.push(row); row = word; } else row = row ? `${row} ${word}` : word; }
  if (row) rows.push(row);
  return rows;
}
async function downloadPng(title: string, lines: string[], filename: string) {
  const wrapped = lines.flatMap((line) => wrapLine(line));
  const height = Math.max(900, 430 + wrapped.length * 38);
  const text = wrapped.map((line, index) => `<text x="600" y="${315 + index * 38}" text-anchor="middle" class="copy">${safeText(line)}</text>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${height}" viewBox="0 0 1200 ${height}"><defs><pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M0 0h100v100H0z" fill="#f1eadb"/><path d="M0 0h50v50H0zM50 50h50v50H50z" fill="#e7dece"/></pattern></defs><style>.title{font:bold 16px Arial;letter-spacing:4px;fill:#a9382b}.copy{font:24px Georgia,serif;fill:#26272a}.name{font:bold 38px Georgia;fill:#26272a}.seal{font:64px Georgia;fill:#c94736}</style><rect width="1200" height="${height}" fill="#17191c"/><rect x="32" y="32" width="1136" height="${height - 64}" fill="url(#grid)" stroke="#c94736" stroke-width="5"/><rect x="58" y="58" width="1084" height="${height - 116}" fill="#f8f4eb" stroke="#17191c" stroke-width="3"/><text x="600" y="145" text-anchor="middle" class="title">THE INTERNATIONAL BACHELOR FEDERATION</text><text x="600" y="232" text-anchor="middle" class="seal">♙</text><text x="600" y="285" text-anchor="middle" class="name">${safeText(title)}</text>${text}</svg>`;
  const image = new Image();
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const objectUrl = URL.createObjectURL(blob);
  try {
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Could not render image')); image.src = objectUrl; });
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = height;
    const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas is unavailable');
    context.drawImage(image, 0, 0);
    const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Could not create PNG')), 'image/png'));
    const anchor = document.createElement('a'); const pngUrl = URL.createObjectURL(png); anchor.href = pngUrl; anchor.download = filename; anchor.click(); URL.revokeObjectURL(pngUrl);
  } finally { URL.revokeObjectURL(objectUrl); }
}

export default function App() {

  const [readingIntro, setReadingIntro] = useState(() => /^\/intro\/?$/.test(window.location.pathname));
  const [showArbiter, setShowArbiter] = useState(false);
  const [showPowers, setShowPowers] = useState(false);
  const [showJourney, setShowJourney] = useState(false);
  const [flash, setFlash] = useState('');
  const [tick, setTick] = useState(Date.now());
  const flashTimer = useRef(0);
  const say = useCallback((message: string) => {
    clearTimeout(flashTimer.current);
    setFlash(message);
    flashTimer.current = window.setTimeout(() => setFlash(''), 4000);
  }, []);
  const { game, update, reset, status: roomStatus, connections: roomPlayers, generation } = useSharedGame(say);
  const previousRoom = useRef<{ screen: string; generation: number } | null>(null);
  useEffect(() => {
    if (!generation) return;
    const previous = previousRoom.current;
    previousRoom.current = { generation, screen: game.screen };
    if (readingIntro && previous && (previous.generation !== generation || previous.screen !== game.screen)) {
      window.history.replaceState(null, '', '/');
      setReadingIntro(false);
    }
  }, [generation, game.screen, readingIntro]);
  const [offlineReady, setOfflineReady] = useState(false);
  const arbiterTriggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setShowArbiter(false); setShowJourney(false); setShowPowers(false);
  }, [generation]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [game.screen, game.step, game.viewingStep]);
  useEffect(() => { if (!game.clock.startedAt) return; setTick(Date.now()); const id = window.setInterval(() => setTick(Date.now()), 300); return () => window.clearInterval(id); }, [game.clock.startedAt]);
  useEffect(() => {
    const onMessage = (event: MessageEvent) => { if (event.data?.type === 'OFFLINE_READY') setOfflineReady(true); };
    navigator.serviceWorker?.addEventListener('message', onMessage);
    if (navigator.serviceWorker?.controller) navigator.serviceWorker.controller.postMessage({ type: 'CHECK_OFFLINE_READY' });
    return () => navigator.serviceWorker?.removeEventListener('message', onMessage);
  }, []);
  const timeLeft = useMemo(() => remainingSeconds(game.clock, tick), [game.clock, tick]);
  const unusedCards = POWER_CARDS.filter((card) => !game.powerUsed.includes(card.id));

  function nextOpening() { update(advanceOpening); }
  function resolve(resolution: Resolution, index = game.viewingStep ?? game.step) { update((s) => resolveEnvelope(s, index, resolution)); setShowPowers(false); }
  function playCard(id: string) {
    const card = POWER_CARDS.find((item) => item.id === id);
    if (!card || game.powerUsed.includes(id)) return;
    if (!window.confirm(`Play ${card.name}? The Chief Arbiter must approve. This card can only be used once.`)) return;
    update((s) => consumePower(s, id));
    say(`${card.name} played. It changes the challenge, it does not complete it.`);
  }
  function startTimer(label: string, duration: number) {
    update((s) => ({ ...s, clock: { label, duration, remaining: duration, startedAt: Date.now() } }));
  }
  function pauseTimer() { update((s) => ({ ...s, clock: { ...s.clock, remaining: remainingSeconds(s.clock), startedAt: null } })); }
  function resumeTimer() { if (game.clock.remaining > 0) update((s) => ({ ...s, clock: { ...s.clock, startedAt: Date.now() } })); }
  function resetTimer() { update((s) => ({ ...s, clock: { label: s.clock.label, duration: s.clock.duration, remaining: s.clock.duration, startedAt: null } })); }
  function exportSave() {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([serializeGame(game)], { type: 'application/json' })); a.download = 'pawns-promotion-save.json'; a.click(); URL.revokeObjectURL(a.href);
  }
  function fastForward() {
    const remaining = CHALLENGES.filter((_, index) => !game.statuses[index]).map((challenge) => `• ${challenge.title}`).join('\n');
    if (!window.confirm(`TIME TROUBLE\n\nRemaining envelopes will be recorded as deferred:\n${remaining || 'None'}\n\nMake promotion available now?`)) return;
    update((s) => fastTrack(s)); setShowArbiter(false);
  }
  function undo() { update((s) => undoProgress(s)); }
  function jump(index: number | null) {
    update((state) => {
      if (state.rank === 1 || (index !== null && index !== state.step && !state.statuses[index])) return state;
      const viewingStep = index === state.step ? null : index;
      const screen = viewingStep !== null || state.step < 6 ? 'game' : state.selectedPiece ? 'reward' : 'promotion';
      if (viewingStep === state.viewingStep && state.screen === screen) return state;
      return { ...state, screen, viewingStep, opened: viewingStep !== null || state.step < 6 && state.opened };
    });
    setShowArbiter(false);
    setShowJourney(false);
  }
  function goToCurrent() { if (game.rank > 1) jump(null); }

  function leaveIntroduction() {
    if (game.rank === 1 && game.screen !== 'preparation') {
      if (roomStatus !== 'online') { say('Reconnect to continue on the shared board.'); return; }
      update(state => state.screen === 'landing' ? advanceOpening(advanceOpening(state)) : advanceOpening(state));
    }
    window.history.replaceState(null, '', '/');
    setReadingIntro(false);
    window.scrollTo(0, 0);
  }
  const progressVisible = !readingIntro && game.rank > 1;
  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={readingIntro ? () => window.location.assign('/') : goToCurrent} aria-label="Return to the current shared game state">
          <span className="brand-mark">♟</span><span><b>THE PAWN'S PROMOTION</b><small>INTERNATIONAL BACHELOR FEDERATION</small></span>
        </button>
        <div className="top-actions">
          {!readingIntro && game.selectedPiece && <button className="subtle-button" onClick={() => { jump(null); }}><Trophy size={16} /> Certificate</button>}
          {progressVisible && <button className="subtle-button" onClick={() => setShowJourney((open) => !open)} aria-expanded={showJourney}><Compass size={16} /> Journey</button>}
          {progressVisible && <button className="subtle-button" onClick={() => setShowPowers((open) => !open)}><Shield size={16} /> Powers <span className="count-pill">{unusedCards.length}</span></button>}
          <button ref={arbiterTriggerRef} className="arbiter-trigger" onClick={() => setShowArbiter(true)} aria-label="Open Chief Arbiter panel"><Menu size={18} /><span>Arbiter</span></button>
        </div>
      </header>

      <div className={`room-status ${roomStatus}`} role="status">
        {roomStatus === 'online' ? <Wifi size={15} /> : <WifiOff size={15} />}
        <span>{roomStatus === 'online' ? `SHARED GAME · ${roomPlayers} ${roomPlayers === 1 ? 'PHONE' : 'PHONES'} CONNECTED` : roomStatus === 'connecting' ? 'CONNECTING TO TONIGHT’S SHARED GAME…' : 'RECONNECTING TO THE SHARED GAME…'}</span>
        {offlineReady && <span className="offline-ready">OFFLINE READY</span>}
      </div>
      {progressVisible && <Progress state={game} onJump={jump} />}
      {showJourney && progressVisible && <div className="journey-popover"><button className="journey-close" onClick={() => setShowJourney(false)} aria-label="Close rank journey"><X size={16} /> CLOSE JOURNEY</button><Journey state={game} onBegin={() => { setShowJourney(false); }} onJump={jump} /></div>}
      {flash && <div className="toast" role="status">{flash}</div>}

      <main className="content">
        {readingIntro ? <Introduction action={game.rank === 1 && game.screen !== 'preparation' ? 'Meet your four power cards' : 'Return to the shared board'} onContinue={leaveIntroduction} /> : <>
        {['landing','welcome'].includes(game.screen) && <Reveal key={generation} opened={game.screen === 'welcome'}
          sealed={opening => <Landing opening={opening} onBegin={nextOpening} state={game} onJump={jump} />}>
          <Introduction action="Meet your four power cards" onContinue={nextOpening} />
        </Reveal>}

        {game.screen === 'preparation' && <section className="page-in preparation">
          <div className="eyebrow"><span className="red-dot" /> RANK 1 OF 8 · OPENING HAND</div>
          <div className="section-heading"><div><h1>Your opening hand.</h1><p className="lead">Keep these four cards for the six challenges ahead. Ask the Arbiter to play one when you need a different move.</p></div><span className="round-seal">♜</span></div>
          <div className="power-grid">{POWER_CARDS.map((card, index) => <PowerCard key={card.id} card={card} used={false} index={index} />)}</div>
          <p className="fine-print">These are party adaptations inspired by chess, not literal tournament rules. Anyone may decline a challenge at any time, with or without a power card.</p>
          <button className="primary-button" onClick={nextOpening}>MOVE TO RANK 2 <Unlock size={17} /></button>
        </section>}

        {game.screen === 'game' && <ChallengeScreen key={game.viewingStep ?? game.step}
          state={game} current={CHALLENGES[Math.min(game.viewingStep ?? game.step, 5)]} opened={game.opened} onOpen={() => update({ opened: true })}
          onResolve={(result) => resolve(result, game.viewingStep ?? game.step)} onStartTimer={startTimer} onPauseTimer={pauseTimer} onResumeTimer={resumeTimer} onResetTimer={resetTimer}
          timeLeft={timeLeft} onUpdate={update} say={say} onReturnToCurrent={goToCurrent}
        />}

        {game.screen === 'promotion' && <Promotion state={game} onChoose={(piece) => {
          if (!window.confirm(`Promote to ${piece}? The chosen reward will be revealed for everyone on the shared board.`)) return;
          update((s) => selectPromotion(s, piece));
        }} />}

        {game.screen === 'reward' && <RewardScreen state={game} onUpdate={update} say={say} />}
        </>}
      </main>

      {showPowers && <div className="drawer-backdrop" onClick={() => setShowPowers(false)}><aside className="power-drawer" onClick={(e) => e.stopPropagation()} aria-label="Power cards">
        <div className="drawer-head"><div><div className="eyebrow">STRATEGIC RESOURCES</div><h2>Power cards <span className="count-pill">{unusedCards.length} left</span></h2></div><button className="icon-button" onClick={() => setShowPowers(false)} aria-label="Close power cards"><X /></button></div>
        {POWER_CARDS.map((card) => <div className={`drawer-card ${game.powerUsed.includes(card.id) ? 'is-used' : ''}`} key={card.id}><div className="power-glyph">{card.mark}</div><div><strong>{card.name}</strong><p>{card.copy}</p></div>{game.powerUsed.includes(card.id) ? <span className="used-mark">USED</span> : <button className="small-button" onClick={() => playCard(card.id)}>PLAY</button>}</div>)}
        <p className="fine-print">Each card requires the Chief Arbiter’s approval. A card modifies the current challenge; it never advances the board.</p>
      </aside></div>}

      {showArbiter && <ArbiterPanel state={game} onClose={() => setShowArbiter(false)} triggerRef={arbiterTriggerRef} onUpdate={update} onResolve={(result) => resolve(result, game.step)} onResetGame={reset} onFastTrack={fastForward} onUndo={undo} onJump={jump} onExport={exportSave} />}
      <footer className="footer"><span>COLOMBO · {game.eventDate.toUpperCase()}</span><a href="/intro">Read Kasun’s introduction</a></footer>
    </div>
  );
}

function Landing({ opening, onBegin, state, onJump }: { opening: boolean; onBegin: () => void; state: GameState; onJump: (index: number | null) => void }) {
  return <section className="invitation-page page-in">
    <div className="landing">
      <div className="hero-copy">
        <div className="eyebrow">RANK 1 OF 8 · KASUN’S BACHELOR NIGHT</div>
        <h1>The Pawn’s<br /><em>Promotion</em></h1>
        <p className="hero-deck">Tonight, Kasun plays for a promotion. His five friends hold the envelopes.</p>
        <p className="event-line">{state.city} <span>·</span> {state.eventDate}</p>
      </div>
      <Envelope opening={opening} onOpen={onBegin} number="01 / 08" title="Dear Kasun," label="Open Kasun’s invitation" />
    </div>
    <details className="opening-map"><summary><Compass size={18}/> Explore the eight ranks <ChevronRight size={16}/></summary>
      <Journey state={state} onBegin={onBegin} onJump={onJump} />
    </details>
  </section>;
}

const RANK_TITLES = ['The invitation', ...CHALLENGES.map(challenge => challenge.title), 'The promotion ceremony'];

function rankStatus(state: GameState, rank: number) {
  if (rank === state.rank) return 'Current position';
  if (rank === 1) return 'Opening complete';
  if (rank === 8) return 'Locked';
  const status = state.statuses[rank - 2];
  return status ? status[0].toUpperCase() + status.slice(1) : 'Locked';
}

function Journey({ state, onBegin, onJump }: { state: GameState; onBegin: () => void; onJump: (index: number | null) => void }) {
  const resolved = state.statuses.filter(status => status && status !== 'deferred').length;
  return <div className="rank-journey" aria-label="Rank journey">
    <div className="journey-heading"><strong>Kasun’s board</strong><span>{resolved} / 6 resolved</span></div>
    <div className="journey-rows">{RANK_TITLES.map((title, index) => {
      const rank = index + 1;
      const current = rank === state.rank;
      const status = rankStatus(state, rank);
      const enabled = rank === 1 || current || Boolean(state.statuses[rank - 2]);
      return <button key={rank} className={`journey-row ${current ? 'current' : ''}`} disabled={!enabled} aria-current={current ? 'step' : undefined}
        onClick={() => rank === 1 ? state.rank === 1 ? onBegin() : window.location.assign('/intro') : onJump(rank === 8 ? null : rank - 2)}>
        <span className="journey-coordinate">{rank}</span>
        <span className="journey-square" aria-hidden="true">{rank === 8 ? '♛' : current ? '♟' : enabled ? '✓' : ''}</span>
        <span className="journey-label"><strong>{title}</strong><small>{status}</small></span>
        <span className="journey-arrow" aria-hidden="true">{enabled ? '↗' : '·'}</span>
      </button>;
    })}</div>

  </div>;
}

function Progress({ state, onJump }: { state: GameState; onJump: (index: number | null) => void }) {
  return <nav className="progress-shell" aria-label="Rank progress">
    <div className="progress-meta"><span>{RANK_TITLES[state.rank - 1]}</span><span>Rank {state.rank} of 8</span></div>
    <div className="rank-track">{RANK_TITLES.map((title, index) => {
      const rank = index + 1;
      const current = state.rank === rank;
      const available = rank > 1 && (current || Boolean(state.statuses[rank - 2]));
      return <button key={rank} className={`rank-cell ${rank <= state.rank ? 'reached' : ''} ${current ? 'current' : ''}`}
        aria-label={`Rank ${rank}, ${title}, ${rankStatus(state, rank)}`} aria-current={current ? 'step' : undefined}
        disabled={!available} onClick={() => onJump(rank === 8 ? null : rank - 2)}>
        <span>{rank}</span>{current && <span aria-hidden="true">♟</span>}
      </button>;
    })}</div>
  </nav>;
}

function PowerCard({ card, used, index }: { card: (typeof POWER_CARDS)[number]; used: boolean; index: number }) {
  return <article className={`power-card ${used ? 'is-used' : ''}`} style={{ animationDelay: `${index * 70}ms` }}><div className="card-top"><span className="card-index">POWER {String(index + 1).padStart(2, '0')}</span><span className="card-glyph">{card.mark}</span></div><h3>{card.name}</h3><p>{card.copy}</p><div className="card-bottom"><span>ONE USE ONLY</span><span>IBF · 2026</span></div></article>;
}

function ChallengeScreen({ state, current, opened, onOpen, onResolve, onStartTimer, onPauseTimer, onResumeTimer, onResetTimer, timeLeft, onUpdate, say, onReturnToCurrent }: {
  state: GameState; current: typeof CHALLENGES[number]; opened: boolean; onOpen: () => void; onResolve: (result: Resolution) => void;
  onStartTimer: (label: string, duration: number) => void; onPauseTimer: () => void; onResumeTimer: () => void; onResetTimer: () => void; timeLeft: number;
  onUpdate: (changes: Partial<GameState> | ((current: GameState) => GameState)) => void; say: (text: string) => void; onReturnToCurrent: () => void;
}) {
  const index = state.viewingStep ?? state.step;
  if (index >= 6) return null;
  const status = state.statuses[index];
  const isEarlierEnvelope = index !== state.step;
  const readOnlyEnvelope = isEarlierEnvelope && status !== 'deferred';
  const question = state.iqQuestions[state.iqIndex];
  const roleResult = voteResult(state.sharks.map((shark) => shark.vote));
  const rapPool = state.rapDifficulty === 'Brutal Mix' ? BRUTAL_WORDS : (RAP_WORDS[state.rapDifficulty] || RAP_WORDS.Medium);

  function drawSharks() {
    const roles = drawUnique(SHARK_ROLES, Math.min(BROTHERHOOD.length, SHARK_ROLES.length));
    onUpdate({ sharks: BROTHERHOOD.map((name, idx) => ({ name, role: roles[idx].name, vote: null, question: roles[idx].questions[0], questionIndex: 0 })) });
  }
  function chooseQuestion(sharkIndex: number) {
    const shark = state.sharks[sharkIndex]; const role = SHARK_ROLES.find((entry) => entry.name === shark.role); if (!role) return;
    const next = ((shark.questionIndex || 0) + 1) % role.questions.length;
    onUpdate((s) => ({ ...s, sharks: s.sharks.map((item, idx) => idx === sharkIndex ? { ...item, question: role.questions[next], questionIndex: next } : item) }));
  }
  function drawRap() {
    onUpdate({ rapWords: rerollRapWords(state.rapWords, rapPool), rapPrepared: state.rapPrepared });
  }
  function initIq() {
    if (state.iqQuestions.length) return;
    onUpdate({ iqQuestions: drawUnique(IQ_QUESTIONS.map((_, i) => i), 5), iqScores: [], iqIndex: 0 });
  }
  function scoreIq(score: number) { const expected = state.iqIndex; onUpdate((s) => scoreIqAnswer(s, score, expected)); }
  const iqPercent = marriageIqPercent(state.iqScores);
  const iqTitle = GAME_CONTENT.iqTitles[Math.min(4, Math.floor(iqPercent / 20))];

  return <section className="challenge-view page-in">
    <Reveal opened={opened} sealed={opening => <div className="dispatch">
      <div className="eyebrow">ENVELOPE {String(index + 1).padStart(2, '0')} OF 06 · RANK {current.from}</div>
      <h1>{current.title}</h1><p>{current.tagline}</p>
      <Envelope opening={opening} onOpen={onOpen} title={current.concept}
        number={`NO. 0${index + 1}`} label="Open envelope" />
    </div>}>
      <div className="challenge-titlebar"><div><div className="eyebrow">ENVELOPE {String(index + 1).padStart(2, '0')} · {current.concept.toUpperCase()}</div><h1>{current.title}</h1><p>{current.principle}</p>{isEarlierEnvelope && <span className="viewing-pill">{readOnlyEnvelope ? 'PAST ENVELOPE' : 'DEFERRED · READY TO RESOLVE'}</span>}</div><div className="rank-pair"><span>{current.from}</span><ChevronRight /><b>{current.to}</b></div></div>
      <div className="challenge-layout">
        <fieldset className="challenge-body" disabled={readOnlyEnvelope} aria-label={current.title}>
          {index === 0 && <>
            <div className="revealed-copy">
              <div className="eyebrow">PRODUCT LAUNCH · ONE TAKE</div>
              <h2>Record a 60-second pitch.</h2>
              <p>{GAME_CONTENT.advertisement.headline}</p>
              <p className="display-line">{GAME_CONTENT.advertisement.product}</p>
              <p>{GAME_CONTENT.advertisement.instructions}</p>
              <ol>
                {GAME_CONTENT.advertisement.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}
              </ol>
              <p>Make it persuasive. Make it memorable. Return to the group when it is complete. {GAME_CONTENT.advertisement.rules}</p>
            </div>
            <div className="privacy-note"><LockKeyhole size={17} /> {GAME_CONTENT.advertisement.privacy}</div>
            <div className="timer-block"><Timer label="60-second preparation" seconds={60} state={state} onStart={onStartTimer} onPause={onPauseTimer} onResume={onResumeTimer} onReset={onResetTimer} timeLeft={timeLeft} /></div>
            <div className="timer-block"><Timer label="60-second recording" seconds={60} state={state} onStart={onStartTimer} onPause={onPauseTimer} onResume={onResumeTimer} onReset={onResetTimer} timeLeft={timeLeft} /></div>
            <label className="upload-proxy">OPEN CAMERA / CHOOSE VIDEO
              <input className="camera-picker" type="file" accept="video/*" capture="user" aria-label="Open camera or choose a video" onChange={() => say('Camera returned. Your video stays on this phone.')} />
            </label>
          </>}

          {index === 1 && <><div className="revealed-copy"><div className="eyebrow">INVESTMENT COMMITTEE · FICTIONAL MONEY ONLY</div><h2>Pitch to the five Sharks.</h2><p>You thought you were simply recording an advertisement. Unfortunately, your product attracted investors.</p><p>{GAME_CONTENT.sharkPitch.offer}</p><p>{GAME_CONTENT.sharkPitch.rules}</p></div>
            {!state.sharks.length ? <button className="secondary-button" onClick={drawSharks}>ASSIGN SHARK ROLES <Sparkles size={16} /></button> : <div className="shark-list">{state.sharks.map((shark, idx) => <article className="shark-card" key={`${shark.name}-${idx}`}><div className="shark-card-head"><span className="role-chip">{shark.role}</span><strong>{shark.name}</strong></div><p>“{shark.question}”</p><div className="shark-actions"><button className={shark.vote === 'in' ? 'vote-button selected yes' : 'vote-button'} onClick={() => onUpdate((s) => ({ ...s, sharks: s.sharks.map((v, i) => i === idx ? { ...v, vote: 'in' } : v) }))}>IN</button><button className={shark.vote === 'out' ? 'vote-button selected no' : 'vote-button'} onClick={() => onUpdate((s) => ({ ...s, sharks: s.sharks.map((v, i) => i === idx ? { ...v, vote: 'out' } : v) }))}>OUT</button><button className="text-button" onClick={() => chooseQuestion(idx)}>NEW QUESTION</button></div></article>)}</div>}
            {state.sharks.length > 0 && <div className={`vote-result ${roleResult !== 'pending' ? 'shown' : ''}`}>{roleResult === 'pending' ? 'AWAITING ALL SHARKS' : roleResult === 'deal' ? 'DEAL' : roleResult === 'tie' ? 'FINAL 20-SECOND PITCH' : 'NO DEAL · ONE LAST PITCH'}<small>Chief Arbiter may resolve after the final pitch.</small></div>}
            {state.sharks.length > 0 && roleResult !== 'pending' && roleResult !== 'deal' && <Timer label="Final 20-second pitch" seconds={20} state={state} onStart={onStartTimer} onPause={onPauseTimer} onResume={onResumeTimer} onReset={onResetTimer} timeLeft={timeLeft} />}
          </>}

          {index === 2 && <><div className="revealed-copy"><div className="eyebrow">HYPOTHETICALS · NO WRONG ANSWERS</div><h2>Ten seconds to answer.</h2><p>{GAME_CONTENT.iqNote}</p></div>
            {!state.iqQuestions.length ? <button className="secondary-button" onClick={initIq}>DEAL FIVE SCENARIOS <Sparkles size={16} /></button> : state.iqIndex < 5 ? <div className="iq-card"><div className="iq-meta">SCENARIO {state.iqIndex + 1} / 5</div><h3>{IQ_QUESTIONS[question ?? 0]}</h3><Timer label="Response clock · 10 seconds" seconds={10} state={state} onStart={onStartTimer} onPause={onPauseTimer} onResume={onResumeTimer} onReset={onResetTimer} timeLeft={timeLeft} /><div className="evaluation-grid">{GAME_CONTENT.iqEvaluations.map(([mark, name, score]) => <button key={mark} className="eval-button" onClick={() => scoreIq(score)}><b>{mark}</b><span>{name}</span></button>)}</div></div> : <div className="iq-result"><span>HUMOROUS PARTY RATING</span><strong>{iqPercent}%</strong><h3>{iqTitle}</h3><p>Calculated transparently: total score from −10 to +15 mapped to 0–100%. The result never blocks promotion.</p><button className="text-button" onClick={() => onUpdate({ iqQuestions: [], iqScores: [], iqIndex: 0 })}>RESTART FIVE QUESTIONS</button></div>}
          </>}

          {index === 3 && <><div className="revealed-copy"><div className="eyebrow">THE QUEEN REQUESTS A PERFORMANCE</div><h2>Six words for Imesha.</h2><p>Compose a romantic rap dedicated to your Queen. {GAME_CONTENT.rapRules.join(' ')}</p></div>
            <div className="rap-controls"><label>WORD DIFFICULTY<select disabled={state.rapPrepared} value={state.rapDifficulty} onChange={(event) => onUpdate({ rapDifficulty: event.target.value, rapWords: [] })}>{['Easy', 'Medium', 'Hard', 'Brutal Mix', 'Opening Specialist'].map((difficulty) => <option key={difficulty}>{difficulty}</option>)}</select></label><button className="secondary-button" disabled={state.rapPrepared} onClick={drawRap}>{state.rapWords.length ? 'REROLL UNLOCKED WORDS' : 'DRAW SIX WORDS'} <Sparkles size={16} /></button></div>
            {state.rapWords.length > 0 && <><div className="word-grid">{state.rapWords.map((word, idx) => <button key={`${word.word}-${idx}`} disabled={state.rapPrepared} className={`word-card ${word.locked ? 'locked' : ''}`} onClick={() => onUpdate((s) => ({ ...s, rapWords: s.rapWords.map((item, i) => i === idx ? { ...item, locked: !item.locked } : item) }))}><small>TERM {String(idx + 1).padStart(2, '0')}</small><strong>{word.word}</strong><span>{word.locked ? 'LOCKED' : 'TAP TO LOCK'}</span></button>)}</div>
              {!state.rapPrepared ? <button className="text-button" onClick={() => onUpdate({ rapPrepared: true, rapWords: state.rapWords.map((word) => ({ ...word, locked: true })) })}>BEGIN PREPARATION · LOCK THE WORDS</button> : <p className="privacy-note"><LockKeyhole size={16} /> These words are frozen for this round. Use Chief Arbiter reset to draw again.</p>}
              <Timer label="Preparation · 60 seconds" seconds={60} state={state} onStart={onStartTimer} onPause={onPauseTimer} onResume={onResumeTimer} onReset={onResetTimer} timeLeft={timeLeft} />
              <Timer label="Performance · 60 seconds" seconds={60} state={state} onStart={onStartTimer} onPause={onPauseTimer} onResume={onResumeTimer} onReset={onResetTimer} timeLeft={timeLeft} />
            </>}
          </>}

          {index === 4 && <><div className="revealed-copy"><div className="eyebrow">A SECOND SHAREHOLDER HAS ENTERED</div><h2>Ask Imesha for her verdict.</h2><p>{GAME_CONTENT.queenIntro}</p><div className="privacy-note"><LockKeyhole size={17} /> Ask for explicit consent before sharing the advertisement. Nothing is sent automatically; power cards never override consent. If you both agree, attach the video yourself in WhatsApp.</div></div>
            <label className="consent-check"><input type="checkbox" checked={state.queenConsent} onChange={(event) => onUpdate({ queenConsent: event.target.checked })} /> The groom agrees to share his advertisement with the Queen.</label>
            <div className="queen-actions"><button className="secondary-button" disabled={!state.queenConsent} onClick={async () => { try { await navigator.clipboard.writeText(QUEEN_MESSAGE); say('Message copied. Paste it into WhatsApp when you are ready.'); } catch { say('Clipboard unavailable. The message is in the Arbiter panel.'); } }}>COPY WHATSAPP MESSAGE <Clipboard size={16} /></button><a className={`secondary-button ${!state.queenConsent ? 'disabled-link' : ''}`} href={state.queenConsent ? `https://wa.me/?text=${encodeURIComponent(QUEEN_MESSAGE)}` : undefined} target="_blank" rel="noreferrer" onClick={(e) => !state.queenConsent && e.preventDefault()}>OPEN WHATSAPP <ExternalLink size={16} /></a></div>
            <button className="text-button" disabled={!state.queenConsent || state.queenMessageSent} onClick={() => onUpdate({ queenMessageSent: true })}>{state.queenMessageSent ? 'MESSAGE MARKED SENT ✓' : 'MARK MESSAGE SENT'}</button>
            <div className="rating-list">{QUEEN_CATEGORIES.map((category, index2) => <label className="rating-row" key={category}><span>{category}</span><input aria-label={`${category} rating out of ten`} type="range" min="0" max="10" value={state.queenRatings[index2] || 0} onChange={(e) => onUpdate((s) => ({ ...s, queenRatings: s.queenRatings.map((value, i) => i === index2 ? Number(e.target.value) : value) }))} /><b>{state.queenRatings[index2] || 0}/10</b></label>)}</div>
            <label className="block-label">QUEEN'S FEEDBACK<textarea value={state.queenFeedback} onChange={(e) => onUpdate({ queenFeedback: e.target.value })} placeholder="Which claim is most exaggerated? What feature is missing?" /></label>
            <div className="verdict-row">{VERDICTS.map((verdict) => <button key={verdict} className={`verdict-card ${state.queenVerdict === verdict ? 'chosen' : ''}`} onClick={() => onUpdate({ queenVerdict: verdict })}><b>{verdict.split(' ')[0]}</b><span>{verdict.slice(verdict.indexOf(' ') + 1)}</span></button>)}</div>
            {state.queenVerdict && <p className="status-line"><Check size={16} /> Verdict saved. It will not move the pawn a second time.</p>}
          </>}

          {index === 5 && <><div className="revealed-copy"><div className="eyebrow">RANK 7 · THE FINAL MOVE</div><h2>Choose your Zugzwang.</h2><p>Every available move leads somewhere memorable. Choose one sealed card; reveal only the selected challenge. You may exchange or decline it.</p></div>
            <div className="mystery-grid">{ZUGZWANG_CHOICES.map((choice) => <button key={choice.id} className={`mystery-card ${state.zugzwangChoice === choice.id ? 'revealed' : ''}`} onClick={() => onUpdate({ zugzwangChoice: choice.id })}><span>{choice.mark}</span><small>{state.zugzwangChoice === choice.id ? 'YOUR MOVE' : 'MYSTERY CARD'}</small><h3>{state.zugzwangChoice === choice.id ? choice.title : 'SEALED'}</h3><p>{state.zugzwangChoice === choice.id ? choice.detail : choice.hint}</p></button>)}</div>
            <p className="fine-print">All challenges may be modified, exchanged or declined. Participation is always voluntary.</p>
          </>}
        </fieldset>

        <aside className="challenge-aside"><div className="aside-label">THE CHIEF ARBITER</div><div className="arbiter-avatar">♟</div><p>{state.arbiter || 'The house decides.'}</p><div className="aside-rule" /><strong>HOUSE RULE</strong><p>Move at your own pace. A skip is a valid move. The game is here to celebrate the groom, never to corner him.</p>{index === 4 && !state.queenVerdict && !readOnlyEnvelope && <button className="aside-link" onClick={() => onResolve('deferred')}><SkipForward size={15} /> Defer verdict</button>}</aside>
      </div>
      <div className="resolution-bar"><div className="resolution-note">{status ? <span><Check size={16} /> This envelope is {status === 'deferred' ? 'deferred and still available' : status}.</span> : <span><Flag size={16} /> Chief Arbiter confirms the result.</span>}</div><div className="resolution-actions">{readOnlyEnvelope ? <button className="primary-button compact" onClick={onReturnToCurrent}>RETURN TO CURRENT MOVE <ChevronRight size={16} /></button> : <><button className="quiet-button" onClick={() => onResolve('skipped')} disabled={Boolean(status && status !== 'deferred')}>SKIP</button><button className="secondary-button" onClick={() => onResolve('modified')} disabled={Boolean(status && status !== 'deferred')}>MODIFY & COMPLETE</button><button className="primary-button compact" onClick={() => onResolve('completed')} disabled={Boolean(status && status !== 'deferred')}>COMPLETE <Check size={16} /></button>{!isEarlierEnvelope && <button className="defer-button" onClick={() => onResolve('deferred')} disabled={Boolean(status && status !== 'deferred')}><SkipForward size={15} /> {index === 4 ? 'DEFER VERDICT' : 'SAVE FOR LATER'}</button>}</>}</div></div>
    </Reveal>
  </section>;
}

function Timer({ label, seconds, state, onStart, onPause, onResume, onReset, timeLeft }: { label: string; seconds: number; state: GameState; onStart: (label: string, duration: number) => void; onPause: () => void; onResume: () => void; onReset: () => void; timeLeft: number }) {
  const active = state.clock.label === label && state.clock.duration > 0;
  const value = active ? timeLeft : seconds;
  const running = active && Boolean(state.clock.startedAt);
  return <div className={`timer ${active ? 'active' : ''}`}>
    <div className="timer-copy"><Clock3 size={17}/><span>{label}</span></div>
    <strong className={value === 0 ? 'time-up' : ''}>{String(Math.floor(value / 60)).padStart(2, '0')}:{String(value % 60).padStart(2, '0')}</strong>
    <div className="timer-buttons">
      {value === 0 ? <button className="timer-restart" onClick={() => onStart(label, seconds)}>Restart</button>
        : <button className="timer-button" onClick={running ? onPause : active ? onResume : () => onStart(label, seconds)}
            aria-label={`${running ? 'Pause' : 'Start'} ${label}`}>{running ? <Pause size={14}/> : <Play size={14}/>}</button>}
      <button className="timer-button" disabled={!active} onClick={onReset} aria-label={`Reset ${label}`}><RotateCcw size={14}/></button>
    </div></div>;
}

function Promotion({ state, onChoose }: { state: GameState; onChoose: (piece: string) => void }) {
  return <section className="promotion page-in"><div className="promotion-orbit">♙<span>♔</span></div><div className="eyebrow"><span className="red-dot" /> PROMOTION AVAILABLE {state.fastTracked ? '· TIME TROUBLE' : ''}</div><h1>You have reached<br /><em>the eighth rank.</em></h1><p className="lead">Your next move will define your legacy.</p><p className="promotion-note">In chess, a pawn may promote to a Queen, Rook, Bishop or Knight. Each piece holds one private reward. Choose carefully; the other rewards stay sealed.</p>
    <div className="promotion-grid">{PIECES.map((piece) => <button key={piece.id} className="promotion-card" onClick={() => onChoose(piece.id)}><span className="promotion-piece">{piece.symbol}</span><h2>{piece.id}</h2><span className="secret-word">{piece.secret}</span><p>{piece.tease}</p><span className="choose-mark">SELECT PIECE</span></button>)}</div>
    <p className="fine-print">The group agrees to any reward in good humour; every request stays reasonable, consensual and within agreed limits.</p></section>;
}

function RewardScreen({ state, onUpdate, say }: { state: GameState; onUpdate: (changes: Partial<GameState> | ((current: GameState) => GameState)) => void; say: (message: string) => void }) {
  const piece = PIECES.find((item) => item.id === state.selectedPiece) || PIECES[0];
  const reward = REWARDS[piece.id];
  const names = GROOM;
  const rewardDescription = piece.id === 'Knight' && state.rewardNote ? state.rewardNote : reward.description;
  const eventDetails = `${state.city} · ${state.eventDate}`;
  const terms = `${reward.terms}${state.spendingLimit ? ` Agreed spending limit: ${state.spendingLimit}.` : ''}`;
  const voucherLines = [`THE ${piece.id.toUpperCase()} REWARD`, reward.title, `Presented to ${names}`, rewardDescription, `Redemption terms: ${terms}`, `Chief Arbiter: ${state.arbiter || 'The Brotherhood'}`, eventDetails, `The brotherhood: ${BROTHERHOOD.join(' · ')}`];
  const certificateLines = ['CERTIFICATE OF PROMOTION', 'GRANDMASTER OF MATRIMONY', `PRESENTED TO ${names.toUpperCase()}`, 'Bachelorhood successfully completed.', `Promoted to: ${piece.id}`, `Chief Arbiter: ${state.arbiter || 'The Brotherhood'}`, eventDetails, `The brotherhood: ${BROTHERHOOD.join(' · ')}`, 'You spent your life looking for the perfect move. Then you found your Queen.'];
  async function share(text: string) {
    if (navigator.share) {
      try { await navigator.share({ title: "The Pawn's Promotion", text, url: window.location.href }); say('Voucher shared.'); return; }
      catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(text); say('Voucher details copied.'); }
    catch { say('Sharing is unavailable here. Save the PNG instead.'); }
  }
  function printItem(target: 'voucher' | 'certificate') {
    document.body.dataset.printTarget = target;
    window.addEventListener('afterprint', () => { delete document.body.dataset.printTarget; }, { once: true });
    window.print();
  }
  return <section className="reward-page page-in"><div className="eyebrow"><span className="red-dot" /> THE GAME IS COMPLETE · REWARD UNSEALED</div><div className="reward-heading"><span className="reward-piece">{piece.symbol}</span><div><h1>Grandmaster of<br /><em>Matrimony.</em></h1><p>Promotion secured: {piece.id} · {eventDetails}</p></div></div>
    <article className="voucher" id="voucher"><div className="voucher-bar"><span>INTERNATIONAL BACHELOR FEDERATION</span><span>VOUCHER · 2026</span></div><div className="voucher-content"><div className="eyebrow">THE {piece.id.toUpperCase()} REWARD</div><h2>{reward.title}</h2><h3>Presented to {names}</h3><p>{rewardDescription}</p><div className="voucher-terms"><b>REDEMPTION TERMS</b><p>{terms}</p></div><div className="voucher-seal">♙</div><small>{eventDetails.toUpperCase()} · CHIEF ARBITER: {(state.arbiter || 'THE BROTHERHOOD').toUpperCase()}</small></div></article>
    <div className="voucher-actions"><button className="secondary-button" onClick={() => void downloadPng('THE PAWN’S PROMOTION', voucherLines, 'pawns-promotion-voucher.png')}><Download size={16} /> SAVE VOUCHER AS PNG</button><button className="secondary-button" onClick={() => void share(voucherLines.join('\n\n'))}><Share2 size={16} /> SHARE / COPY VOUCHER</button><button className="secondary-button" onClick={() => printItem('voucher')}><span aria-hidden="true">▣</span> PRINT VOUCHER</button></div>
    {piece.id === 'Queen' && <section className="reward-extra"><div className="eyebrow">OPTIONAL · THE WEDDING MISSION GENERATOR</div><h2>Issue one secret mission.</h2><div className="mission-box"><textarea value={state.mission} onChange={(event) => onUpdate({ mission: event.target.value })} aria-label="Edit the shared wedding mission" /><button className="icon-button" onClick={() => onUpdate({ mission: WEDDING_MISSIONS[Math.floor(Math.random() * WEDDING_MISSIONS.length)] })} aria-label="Draw another mission"><RotateCcw /></button></div><div className="button-row"><button className="text-button" onClick={async () => { try { await navigator.clipboard.writeText(state.mission); say('Mission copied.'); } catch { say('Clipboard unavailable.'); } }}>COPY MISSION</button></div></section>}
    {piece.id === 'Rook' && <section className="reward-extra"><div className="eyebrow">THE ROYAL BAILOUT</div><label className="block-label">AGREED SPENDING LIMIT<input value={state.spendingLimit} onChange={(e) => onUpdate({ spendingLimit: e.target.value })} placeholder="Set this together" /></label></section>}
    {piece.id === 'Bishop' && <BishopMissions state={state} />}
    {piece.id === 'Knight' && <section className="reward-extra"><div className="eyebrow">EDITABLE WILDCARD NOTE</div><p>Replace the default wildcard with The Unfinished Gambit if you want a future group adventure.</p><textarea value={state.rewardNote} onChange={(e) => onUpdate({ rewardNote: e.target.value })} placeholder="The Knight’s Wildcard — one reasonable request within twelve months." /><button className="text-button" onClick={() => onUpdate({ rewardNote: 'The Unfinished Gambit: a future group adventure including activities missed during the bachelor party.' })}>USE “THE UNFINISHED GAMBIT”</button></section>}
    <section className="certificate" id="certificate"><div className="certificate-stamp">♙</div><div className="eyebrow">INTERNATIONAL BACHELOR FEDERATION</div><h2>CERTIFICATE OF PROMOTION</h2><div className="certificate-rule" /><h3>GRANDMASTER<br /><em>OF MATRIMONY</em></h3><p className="certificate-presented">PRESENTED TO</p><strong className="certificate-name">{names}</strong><p>Having survived numerous blunders, tactical traps, questionable gambits and one exceptional Queen.<br /><b>Bachelorhood successfully completed.</b></p><div className="certificate-meta"><span>PROMOTED TO {piece.id.toUpperCase()}</span><span>{eventDetails.toUpperCase()}</span><span>CHIEF ARBITER · {state.arbiter || 'THE BROTHERHOOD'}</span></div><div className="certificate-friends">THE BROTHERHOOD · {BROTHERHOOD.join(' · ')}</div><div className="certificate-final">You spent your life looking for the perfect move.<br /><b>Then you found your Queen.</b></div></section>
    <div className="voucher-actions"><button className="primary-button" onClick={() => void downloadPng('GRANDMASTER OF MATRIMONY', certificateLines, 'grandmaster-certificate.png')}><Download size={16} /> SAVE CERTIFICATE AS PNG</button><button className="secondary-button" onClick={() => printItem('certificate')}>PRINT CERTIFICATE</button></div>
    <div className="privacy-note"><LockKeyhole size={16} /> Progress, votes, timers and rewards are shared live with the group. Camera videos stay on the device that records them.</div>
  </section>;
}

function BishopMissions({ state }: { state: GameState }) {
  return <section className="reward-extra"><div className="eyebrow">THE SECRET SOCIETY · PRIVATE ASSIGNMENTS</div><p>One chess term for each agent. These assignments stay the same on every phone.</p><div className="assignment-list">{BROTHERHOOD.map((friend, index) => <div key={friend}><span>{friend}</span><b>{state.bishopAssignments[index] || SECRET_TERMS[index]}</b><button className="text-button" onClick={() => void navigator.clipboard?.writeText(`${friend}: secretly work “${state.bishopAssignments[index] || SECRET_TERMS[index]}” into a conversation, then share a genuine, kind story about ${GROOM} with ${BRIDE}.`)}>COPY</button></div>)}</div></section>;
}

function ArbiterPanel({ onResetGame, state, onClose, triggerRef, onUpdate, onResolve, onFastTrack, onUndo, onJump, onExport }: {
  state: GameState; onClose: () => void; onUpdate: (changes: Partial<GameState> | ((current: GameState) => GameState)) => void; onResolve: (result: Resolution) => void;
  onResetGame: () => void; triggerRef: RefObject<HTMLButtonElement>; onFastTrack: () => void; onUndo: () => void; onJump: (index: number | null) => void; onExport: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const currentIndex = Math.min(state.step, 5);
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const focusables = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href]') || []);
    focusables()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab') return;
      const items = focusables(); if (!items.length) return;
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); triggerRef.current?.focus(); };
  }, [triggerRef]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section ref={panelRef} className="arbiter-panel" role="dialog" aria-modal="true" aria-labelledby="arbiter-title" tabIndex={-1}>
    <div className="drawer-head"><div><div className="eyebrow">SHARED ORGANISER CONTROLS</div><h2 id="arbiter-title">Chief Arbiter</h2></div><button className="icon-button" onClick={onClose} aria-label="Close Chief Arbiter panel"><X /></button></div>
    <div className="arbiter-rank"><span>CURRENT POSITION</span><b>RANK {state.rank} / 8</b><span>{state.rank === 1 ? 'The invitation' : state.step < 6 ? CHALLENGES[currentIndex].title : 'Promotion'}</span></div>
    {state.rank > 1 && state.step < 6 && <div className="organiser-actions"><button className="secondary-button" onClick={() => { onResolve('completed'); onClose(); }}>COMPLETE CURRENT CHALLENGE</button><button className="quiet-button" onClick={() => { onResolve('skipped'); onClose(); }}>SKIP CURRENT CHALLENGE</button></div>}
    <div className="arbiter-section"><h3>REVISIT AN ENVELOPE</h3><p>The current move, a completed envelope or a deferred envelope can be opened on every phone. Viewing history does not change progress.</p><div className="jump-list">{CHALLENGES.map((challenge, index) => { const available = state.rank > 1 && (index === state.step || Boolean(state.statuses[index])); return <button key={challenge.title} disabled={!available} onClick={() => onJump(index)}><span>{String(index + 1).padStart(2, '0')}</span>{challenge.title}{state.statuses[index] === 'deferred' ? <SkipForward size={14} /> : state.statuses[index] ? <Check size={14} /> : <LockKeyhole size={14} />}</button>; })}<button className="return-current" onClick={() => onJump(null)}><ChevronRight size={14} /> RETURN TO CURRENT MOVE</button></div></div>
    <div className="arbiter-section"><h3>RECOVERY</h3><div className="button-row"><button className="secondary-button" disabled={!state.undoStack.length} onClick={onUndo}><RotateCcw size={15} /> UNDO LAST PROGRESSION</button><button className="secondary-button" disabled={!state.clock.label} onClick={() => onUpdate({ clock: { ...state.clock, remaining: state.clock.duration, startedAt: null } })}>RESET TIMER</button><button className="secondary-button" disabled={!state.clock.label} onClick={() => { const remaining = remainingSeconds(state.clock); onUpdate({ clock: { ...state.clock, duration: state.clock.duration + 10, remaining: remaining + 10, startedAt: state.clock.startedAt ? Date.now() : null } }); }}>+10 SECONDS</button><button className="secondary-button" disabled={!state.rapWords.length} onClick={() => onUpdate({ rapWords: [], rapPrepared: false })}>RESET RAP WORDS</button></div></div>
    <div className="arbiter-section"><h3>RESTORE A POWER CARD</h3><div className="restore-list">{POWER_CARDS.map((card) => <button key={card.id} className="restore-item" disabled={!state.powerUsed.includes(card.id)} onClick={() => onUpdate((s) => restorePower(s, card.id))}><span>{card.mark}</span>{card.name}{state.powerUsed.includes(card.id) ? <Unlock size={15} /> : <Check size={15} />}</button>)}</div></div>
    <div className="arbiter-section"><h3>QUEEN'S VERDICT</h3><p>Pending or deferred verdicts can be entered after progression. This never advances the pawn twice.</p><textarea value={state.queenFeedback} onChange={(e) => onUpdate({ queenFeedback: e.target.value })} placeholder="Feedback from the Queen" /><div className="verdict-row">{VERDICTS.map((verdict) => <button key={verdict} className={`verdict-card ${state.queenVerdict === verdict ? 'chosen' : ''}`} onClick={() => onUpdate({ queenVerdict: verdict })}>{verdict}</button>)}</div></div>
    <div className="arbiter-section"><h3>TONIGHT’S DETAILS</h3><p className="fixed-roster">{GROOM} · {BRIDE} · {BROTHERHOOD.join(' · ')}</p><div className="form-grid compact-grid"><label>CHIEF ARBITER<input value={state.arbiter} onChange={(e) => onUpdate({ arbiter: e.target.value })} placeholder="Optional" /></label><label>DINNER LIMIT<input value={state.spendingLimit} onChange={(e) => onUpdate({ spendingLimit: e.target.value })} placeholder="Agree together" /></label></div></div>
    {state.selectedPiece && <div className="arbiter-section"><h3>OVERRIDE PROMOTION</h3><div className="button-row">{PIECES.map((piece) => <button key={piece.id} className="small-button" onClick={() => onUpdate({ selectedPiece: piece.id, screen: 'reward' })}>{piece.symbol} {piece.id}</button>)}</div></div>}
    <div className="arbiter-section fast-track"><h3>TIME TROUBLE</h3><p>Unresolved challenges are marked deferred, not completed. Deferred envelopes remain available later.</p><button className="primary-button" onClick={onFastTrack} disabled={state.rank === 1 || state.rank === 8}>TIME TROUBLE — FAST-TRACK TO PROMOTION <SkipForward size={16} /></button></div>
    <div className="arbiter-section"><h3>SHARED GAME BACKUP</h3><p>Download a copy of the current shared state for safekeeping.</p><div className="button-row"><button className="secondary-button" onClick={onExport}><Download size={15} /> EXPORT GAME JSON</button></div></div>
    <div className="arbiter-section"><h3>FUTURE ENVELOPE PREVIEW</h3><div className="preview-list">{CHALLENGES.map((item, index) => <span key={item.title} className={index < state.step ? 'unlocked-preview' : ''}>RANK {item.from} → {item.to} · {item.title}</span>)}</div></div>
    <section className="arbiter-section reset-zone"><h3>Reset shared game</h3>
      <p>Return every phone to Kasun’s invitation at rank one. This clears all votes, timers, challenges and rewards.</p>
      {confirmReset ? <div role="group" aria-label="Confirm game reset"><strong>Erase this match for everyone?</strong>
        <div className="button-row"><button autoFocus className="secondary-button" onClick={() => setConfirmReset(false)}>Keep playing</button>
        <button className="danger-button" onClick={() => { setConfirmReset(false); onResetGame(); }}>Yes, reset for everyone</button></div></div>
        : <button className="danger-button" onClick={() => setConfirmReset(true)}><RotateCcw size={15}/> Reset shared game</button>}
    </section>
    <p className="fine-print">This is the shared room for tonight. The board has one current position for every phone.</p>
  </section></div>;
}

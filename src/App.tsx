import { useEffect, useMemo, useState } from 'react';
import {
  Check, ChevronRight, Clipboard, Clock3, Download, ExternalLink,
  FileDown, Flag, LockKeyhole, Menu, Pause, Play, RotateCcw, Share2, Shield,
  SkipForward, Sparkles, Trophy, Unlock, X,
} from 'lucide-react';
import {
  BRUTAL_WORDS, CHALLENGES, createGame, drawUnique, fastTrack, IQ_QUESTIONS, GAME_CONTENT,
  marriageIqPercent, parseGame, POWER_CARDS, RAP_WORDS, remainingSeconds, rerollRapWords,
  resolveCurrent, restorePower, scoreIqAnswer, selectPromotion, serializeGame, SHARK_ROLES, STORAGE_KEY,
  consumePower, undoProgress, voteResult, QUEEN_CATEGORIES, QUEEN_MESSAGE, VERDICTS,
  PIECES, REWARDS, WEDDING_MISSIONS, SECRET_TERMS, ZUGZWANG_CHOICES,
  type GameState, type Resolution,
} from './game';

function readSaved(): GameState {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? parseGame(value) : createGame();
  } catch { return createGame(); }
}
function safeText(value: string) { return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char] || char); }
function downloadSvg(title: string, lines: string[], filename: string) {
  const textLines = lines.map((line, index) => `<text x="600" y="${285 + index * 52}" text-anchor="middle" class="line l${index}">${safeText(line)}</text>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="850" viewBox="0 0 1200 850"><title>${safeText(title)}</title><defs><pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M0 0h100v100H0z" fill="#f1eadb"/><path d="M0 0h50v50H0zM50 50h50v50H50z" fill="#e7dece"/></pattern></defs><style>.frame{fill:#f8f4eb;stroke:#17191c;stroke-width:3}.line{font:24px Georgia,serif;fill:#26272a}.l0{font:bold 16px Arial;letter-spacing:4px;fill:#c94736}.l1{font:bold 38px Georgia;letter-spacing:3px}.l2{font:italic 30px Georgia}.l3{font:20px Arial;fill:#666}.seal{font:64px Georgia;fill:#c94736}</style><rect width="1200" height="850" fill="#17191c"/><rect x="32" y="32" width="1136" height="786" fill="url(#grid)" stroke="#c94736" stroke-width="5"/><rect class="frame" x="58" y="58" width="1084" height="734"/><text x="600" y="150" text-anchor="middle" class="line l0">THE INTERNATIONAL BACHELOR FEDERATION</text><text x="600" y="220" text-anchor="middle" class="seal">♙</text>${textLines}<text x="600" y="735" text-anchor="middle" class="line l3">COLOMBO · 26 NOVEMBER 2026</text><text x="600" y="770" text-anchor="middle" class="line l3">ISSUED WITH HONOUR · REDEEMABLE WITH THE BROTHERHOOD</text></svg>`;
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); anchor.download = filename; anchor.click();
  URL.revokeObjectURL(anchor.href);
}

export default function App() {
  const [game, setGame] = useState<GameState>(readSaved);
  const [showArbiter, setShowArbiter] = useState(false);
  const [showPowers, setShowPowers] = useState(false);
  const [flash, setFlash] = useState('');
  const [tick, setTick] = useState(Date.now());
  const [mission, setMission] = useState(WEDDING_MISSIONS[0]);
  const [friendDraft, setFriendDraft] = useState(game.friends.join(', '));
  const [voteQuestionIndex, setVoteQuestionIndex] = useState(0);

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, serializeGame(game)); } catch { setFlash('Local save unavailable. Export your game state from the Arbiter panel.'); } }, [game]);
  useEffect(() => { const id = window.setInterval(() => setTick(Date.now()), 300); return () => window.clearInterval(id); }, []);
  const timeLeft = useMemo(() => remainingSeconds(game.clock, tick), [game.clock, tick]);
  const current = CHALLENGES[Math.min(game.step, 5)];
  const unusedCards = POWER_CARDS.filter((card) => !game.powerUsed.includes(card.id));

  function update(changes: Partial<GameState> | ((current: GameState) => GameState)) {
    setGame((currentState) => typeof changes === 'function' ? changes(currentState) : ({ ...currentState, ...changes }));
  }
  function say(text: string) { setFlash(text); window.setTimeout(() => setFlash(''), 2800); }
  function beginWelcome() { update({ screen: 'welcome' }); }
  function receivePrep() { update({ screen: 'preparation', startedAt: game.startedAt || new Date().toISOString() }); }
  function launchGame() { update({ screen: 'game', opened: false }); }
  function resolve(resolution: Resolution) { const expectedStep = game.step; update((s) => resolveCurrent(s, resolution, expectedStep)); setShowPowers(false); }
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
  async function importSave(file?: File) {
    if (!file) return;
    try { update(parseGame(await file.text())); setShowArbiter(false); say('Game restored.'); }
    catch (error) { say(error instanceof Error ? error.message : 'Unable to read that save file.'); }
  }
  function fastForward() {
    const remaining = CHALLENGES.filter((_, index) => !game.statuses[index]).map((challenge) => `• ${challenge.title}`).join('\n');
    if (!window.confirm(`TIME TROUBLE\n\nRemaining envelopes will be recorded as deferred:\n${remaining || 'None'}\n\nMake promotion available now?`)) return;
    update((s) => fastTrack(s)); setShowArbiter(false);
  }
  function undo() { update((s) => undoProgress(s)); }
  function jump(index: number) { update((s) => { const statuses = [...s.statuses]; for (let i = 0; i < index; i += 1) if (!statuses[i]) statuses[i] = 'deferred'; return { ...s, statuses, step: index, rank: index + 2, screen: 'game', opened: false }; }); setShowArbiter(false); }

  const progressVisible = ['preparation', 'game', 'promotion', 'reward'].includes(game.screen);
  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => update({ screen: game.selectedPiece ? 'reward' : 'landing' })} aria-label="The Pawn's Promotion home">
          <span className="brand-mark">♟</span><span><b>THE PAWN'S PROMOTION</b><small>INTERNATIONAL BACHELOR FEDERATION</small></span>
        </button>
        <div className="top-actions">
          {game.selectedPiece && <button className="subtle-button" onClick={() => update({ screen: 'reward' })}><Trophy size={16} /> Certificate</button>}
          {progressVisible && <button className="subtle-button" onClick={() => setShowPowers((open) => !open)}><Shield size={16} /> Powers <span className="count-pill">{unusedCards.length}</span></button>}
          {progressVisible && <button className="arbiter-trigger" onClick={() => setShowArbiter(true)} aria-label="Open Chief Arbiter panel"><Menu size={18} /><span>Arbiter</span></button>}
        </div>
      </header>

      {progressVisible && <Progress state={game} />}
      {flash && <div className="toast" role="status">{flash}</div>}

      <main className="content">
        {game.screen === 'landing' && <Landing onBegin={beginWelcome} groom={game.groom} city={game.city} eventDate={game.eventDate} />}
        {game.screen === 'welcome' && <section className="welcome page-in">
          <div className="eyebrow"><span className="red-dot" /> PLAYER REGISTRATION · WHITE TO MOVE</div>
          <h1>Before the first move.</h1>
          <p className="lead">A few names make the evening feel like yours. Leave anything blank that you would rather skip.</p>
          <div className="form-grid">
            <label>THE GROOM<input autoFocus value={game.groom} onChange={(e) => update({ groom: e.target.value })} placeholder="Name on the score sheet" /></label>
            <label>THE QUEEN<input value={game.bride} onChange={(e) => update({ bride: e.target.value })} placeholder="Future Queen (optional)" /></label>
            <label className="full">THE BROTHERHOOD <span className="field-note">Comma-separated; used for Sharks and missions.</span><input value={friendDraft} onChange={(e) => { setFriendDraft(e.target.value); update({ friends: e.target.value.split(',').map((name) => name.trim()).filter(Boolean) }); }} placeholder="Friends playing tonight" /></label>
            <label>CHIEF ARBITER<input value={game.arbiter} onChange={(e) => update({ arbiter: e.target.value })} placeholder="Optional" /></label>
            <label>DINNER LIMIT <span className="field-note">Optional, for the Rook reward.</span><input value={game.spendingLimit} onChange={(e) => update({ spendingLimit: e.target.value })} placeholder="Agree together later" /></label>
          </div>
          <article className="letter-card">
            <div className="eyebrow">A LETTER FROM THE FEDERATION</div>
            <p>Dear {game.groom || 'Pawn'},</p>
            {GAME_CONTENT.welcome.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <p className="letter-sign">Your clock starts now.<br /><b>The International Bachelor Federation</b></p>
          </article>
          <button className="primary-button" onClick={receivePrep}>RECEIVE YOUR OPENING PREPARATION <Shield size={17} /></button>
        </section>}

        {game.screen === 'preparation' && <section className="page-in preparation">
          <div className="eyebrow"><span className="red-dot" /> ENVELOPE 00 · OPENING PREPARATION</div>
          <div className="section-heading"><div><h1>Your power, in reserve.</h1><p className="lead">Four single-use adaptations. Play one to alter a challenge; none can complete it for you.</p></div><span className="round-seal">♜</span></div>
          <div className="power-grid">{POWER_CARDS.map((card, index) => <PowerCard key={card.id} card={card} used={false} index={index} />)}</div>
          <p className="fine-print">These are party adaptations inspired by chess, not literal tournament rules. Anyone may decline a challenge at any time, with or without a power card.</p>
          <button className="primary-button" onClick={launchGame}>UNSEAL THE FIRST CHALLENGE <Unlock size={17} /></button>
        </section>}

        {game.screen === 'game' && <ChallengeScreen
          state={game} current={current} opened={game.opened} onOpen={() => update({ opened: true })}
          onResolve={resolve} onStartTimer={startTimer} onPauseTimer={pauseTimer} onResumeTimer={resumeTimer} onResetTimer={resetTimer}
          timeLeft={timeLeft} onUpdate={update} say={say} voteQuestionIndex={voteQuestionIndex} setVoteQuestionIndex={setVoteQuestionIndex}
        />}

        {game.screen === 'promotion' && <Promotion state={game} onChoose={(piece) => {
          if (!window.confirm(`Promote to ${piece}? The chosen reward will be revealed and saved to this device.`)) return;
          update((s) => selectPromotion(s, piece));
        }} />}

        {game.screen === 'reward' && <RewardScreen state={game} onUpdate={update} mission={mission} setMission={setMission} />}
      </main>

      {showPowers && <div className="drawer-backdrop" onClick={() => setShowPowers(false)}><aside className="power-drawer" onClick={(e) => e.stopPropagation()} aria-label="Power cards">
        <div className="drawer-head"><div><div className="eyebrow">STRATEGIC RESOURCES</div><h2>Power cards <span className="count-pill">{unusedCards.length} left</span></h2></div><button className="icon-button" onClick={() => setShowPowers(false)} aria-label="Close power cards"><X /></button></div>
        {POWER_CARDS.map((card) => <div className={`drawer-card ${game.powerUsed.includes(card.id) ? 'is-used' : ''}`} key={card.id}><div className="power-glyph">{card.mark}</div><div><strong>{card.name}</strong><p>{card.copy}</p></div>{game.powerUsed.includes(card.id) ? <span className="used-mark">USED</span> : <button className="small-button" onClick={() => playCard(card.id)}>PLAY</button>}</div>)}
        <p className="fine-print">Each card requires the Chief Arbiter’s approval. A card modifies the current challenge; it never advances the board.</p>
      </aside></div>}

      {showArbiter && <ArbiterPanel state={game} onClose={() => setShowArbiter(false)} onUpdate={update} onResolve={resolve} onFastTrack={fastForward} onUndo={undo} onJump={jump} onExport={exportSave} onImport={importSave} say={say} />}
      <footer className="footer"><span>COLOMBO · {game.eventDate.toUpperCase()}</span><span>NO CLOCK WITHOUT CONSENT · NO MOVE WITHOUT JOY</span></footer>
    </div>
  );
}

function Landing({ onBegin, groom, city, eventDate }: { onBegin: () => void; groom: string; city: string; eventDate: string }) {
  return <section className="landing page-in">
    <div className="hero-copy">
      <div className="eyebrow"><span className="red-dot" /> AN INVITATION TO {groom ? `${groom.toUpperCase()}’S` : 'THE'} FINAL MATCH</div>
      <h1>The Pawn's<br /><em>Promotion</em></h1>
      <p className="subtitle">THE FINAL NIGHT OF BACHELORHOOD</p>
      <p className="hero-deck">Six moves. Four powers. One promotion.</p>
      <p className="event-line">{city.toUpperCase()} <span>·</span> {eventDate.toUpperCase()}</p>
      <button className="primary-button" onClick={onBegin}>BEGIN THE GAME <Play size={16} /></button>
      <p className="muted-note">A private, locally saved game for one very important player.</p>
    </div>
    <div className="hero-art" aria-label="Chessboard with a white pawn">
      <div className="board-frame"><div className="chessboard">{Array.from({ length: 64 }, (_, i) => <div key={i} className={(Math.floor(i / 8) + i % 8) % 2 ? 'dark-square' : 'light-square'} />)}<span className="hero-pawn">♙</span><span className="board-coordinate file">a · b · c · d · e · f · g · h</span><span className="board-coordinate rank">8<br />7<br />6<br />5<br />4<br />3<br />2<br />1</span></div></div>
      <div className="art-caption"><span>♙</span><div><small>POSITION</small><b>WHITE TO MOVE</b></div><div><small>DESTINATION</small><b>THE EIGHTH RANK</b></div></div>
      <span className="art-index">FIELD NOTE 001<br />26 · XI · MMXXVI</span>
    </div>
  </section>;
}

function Progress({ state }: { state: GameState }) {
  const queenPending = state.statuses[4] === 'deferred' && !state.queenVerdict;
  return <div className="progress-shell"><div className="progress-meta"><span>THE ROAD TO PROMOTION</span>{queenPending && <span className="pending-indicator">QUEEN'S VERDICT PENDING</span>}<span>RANK {state.rank} <b>/</b> 8</span></div><div className="rank-track" aria-label={`Progress: rank ${state.rank} of 8`}>
    {Array.from({ length: 7 }, (_, index) => { const rank = index + 2; const challengeIndex = index - 1; const status = challengeIndex >= 0 ? state.statuses[challengeIndex] : null; return <div key={rank} className={`rank-cell ${rank <= state.rank ? 'reached' : ''} ${rank === state.rank ? 'current' : ''} ${status === 'skipped' ? 'was-skipped' : ''}`}><span className="rank-number">{rank}</span><span className="rank-piece">{rank === state.rank ? '♟' : status && status !== 'deferred' ? status === 'skipped' ? '–' : '✓' : ''}</span></div>; })}
  </div></div>;
}

function PowerCard({ card, used, index }: { card: (typeof POWER_CARDS)[number]; used: boolean; index: number }) {
  return <article className={`power-card ${used ? 'is-used' : ''}`} style={{ animationDelay: `${index * 70}ms` }}><div className="card-top"><span className="card-index">POWER {String(index + 1).padStart(2, '0')}</span><span className="card-glyph">{card.mark}</span></div><h3>{card.name}</h3><p>{card.copy}</p><div className="card-bottom"><span>ONE USE ONLY</span><span>IBF · 2026</span></div></article>;
}

function ChallengeScreen({ state, current, opened, onOpen, onResolve, onStartTimer, onPauseTimer, onResumeTimer, onResetTimer, timeLeft, onUpdate, say, voteQuestionIndex, setVoteQuestionIndex }: {
  state: GameState; current: typeof CHALLENGES[number]; opened: boolean; onOpen: () => void; onResolve: (result: Resolution) => void;
  onStartTimer: (label: string, duration: number) => void; onPauseTimer: () => void; onResumeTimer: () => void; onResetTimer: () => void; timeLeft: number;
  onUpdate: (changes: Partial<GameState> | ((current: GameState) => GameState)) => void; say: (text: string) => void; voteQuestionIndex: number; setVoteQuestionIndex: (value: number) => void;
}) {
  const [sealBreaking, setSealBreaking] = useState(false);
  const index = state.step;
  if (index >= 6) return null;
  const status = state.statuses[index];
  const question = state.iqQuestions[state.iqIndex];
  const roleResult = voteResult(state.sharks.map((shark) => shark.vote));
  const rapPool = state.rapDifficulty === 'Brutal Mix' ? BRUTAL_WORDS : (RAP_WORDS[state.rapDifficulty] || RAP_WORDS.Medium);

  function drawSharks() {
    const friends = state.friends.length ? state.friends : ['Friend One', 'Friend Two', 'Friend Three'];
    const roles = drawUnique(SHARK_ROLES, Math.min(friends.length, SHARK_ROLES.length));
    onUpdate({ sharks: friends.slice(0, roles.length).map((name, idx) => ({ name, role: roles[idx].name, vote: null, question: roles[idx].questions[0] })) });
  }
  function chooseQuestion(sharkIndex: number) {
    const shark = state.sharks[sharkIndex]; const role = SHARK_ROLES.find((entry) => entry.name === shark.role); if (!role) return;
    const next = (voteQuestionIndex + 1) % role.questions.length; setVoteQuestionIndex(next);
    onUpdate((s) => ({ ...s, sharks: s.sharks.map((item, idx) => idx === sharkIndex ? { ...item, question: role.questions[next] } : item) }));
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
    {!opened ? <article className="envelope-card">
      <div className="envelope-top"><span>ENVELOPE {String(index + 1).padStart(2, '0')}</span><span>RANK {current.from} → {current.to}</span></div>
      <div className="envelope-symbol">{current.mark}</div>
      <div className="eyebrow">{current.concept.toUpperCase()}</div>
      <h1>{current.title}</h1>
      <p>{current.tagline}</p>
      <div className={`wax-seal ${sealBreaking ? 'breaking' : ''}`}>♟</div>
      <button className="primary-button" onClick={() => { setSealBreaking(true); window.setTimeout(onOpen, 260); }}>OPEN ENVELOPE <Unlock size={17} /></button>
      <small className="sealed-note">SEALED BY THE INTERNATIONAL BACHELOR FEDERATION</small>
    </article> : <>
      <div className="challenge-titlebar"><div><div className="eyebrow">ENVELOPE {String(index + 1).padStart(2, '0')} · {current.concept.toUpperCase()}</div><h1>{current.title}</h1><p>{current.principle}</p></div><div className="rank-pair"><span>{current.from}</span><ChevronRight /><b>{current.to}</b></div></div>
      <div className="challenge-layout">
        <article className="challenge-body">
          {index === 0 && <>
            <div className="revealed-copy">
              <div className="eyebrow">PRODUCT LAUNCH · ONE TAKE</div>
              <h2>THE HUSBAND ADVERTISEMENT</h2>
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
              <input type="file" accept="video/*" capture="user" onChange={() => say('Camera returned. The video remains in your camera roll; it was not saved by this game.')} />
            </label>
          </>}

          {index === 1 && <><div className="revealed-copy"><div className="eyebrow">INVESTMENT COMMITTEE · FICTIONAL MONEY ONLY</div><h2>Shark Tank: Husband Edition</h2><p>You thought you were simply recording an advertisement. Unfortunately, your product attracted investors.</p><p>{GAME_CONTENT.sharkPitch.offer}</p><p>{GAME_CONTENT.sharkPitch.rules}</p></div>
            {!state.sharks.length ? <button className="secondary-button" onClick={drawSharks}>ASSIGN SHARK ROLES <Sparkles size={16} /></button> : <div className="shark-list">{state.sharks.map((shark, idx) => <article className="shark-card" key={`${shark.name}-${idx}`}><div className="shark-card-head"><span className="role-chip">{shark.role}</span><strong>{shark.name}</strong></div><p>“{shark.question}”</p><div className="shark-actions"><button className={shark.vote === 'in' ? 'vote-button selected yes' : 'vote-button'} onClick={() => onUpdate((s) => ({ ...s, sharks: s.sharks.map((v, i) => i === idx ? { ...v, vote: 'in' } : v) }))}>IN</button><button className={shark.vote === 'out' ? 'vote-button selected no' : 'vote-button'} onClick={() => onUpdate((s) => ({ ...s, sharks: s.sharks.map((v, i) => i === idx ? { ...v, vote: 'out' } : v) }))}>OUT</button><button className="text-button" onClick={() => chooseQuestion(idx)}>NEW QUESTION</button></div></article>)}</div>}
            {state.sharks.length > 0 && <div className={`vote-result ${roleResult !== 'pending' ? 'shown' : ''}`}>{roleResult === 'pending' ? 'AWAITING ALL SHARKS' : roleResult === 'deal' ? 'DEAL' : roleResult === 'tie' ? 'FINAL 20-SECOND PITCH' : 'NO DEAL · ONE LAST PITCH'}<small>Chief Arbiter may resolve after the final pitch.</small></div>}
            {state.sharks.length > 0 && roleResult !== 'pending' && roleResult !== 'deal' && <Timer label="Final 20-second pitch" seconds={20} state={state} onStart={onStartTimer} onPause={onPauseTimer} onResume={onResumeTimer} onReset={onResetTimer} timeLeft={timeLeft} />}
          </>}

          {index === 2 && <><div className="revealed-copy"><div className="eyebrow">HYPOTHETICALS · NO WRONG ANSWERS</div><h2>The Marriage IQ Test</h2><p>{GAME_CONTENT.iqNote}</p></div>
            {!state.iqQuestions.length ? <button className="secondary-button" onClick={initIq}>DEAL FIVE SCENARIOS <Sparkles size={16} /></button> : state.iqIndex < 5 ? <div className="iq-card"><div className="iq-meta">SCENARIO {state.iqIndex + 1} / 5</div><h3>{IQ_QUESTIONS[question ?? 0]}</h3><Timer label="Response clock · 10 seconds" seconds={10} state={state} onStart={onStartTimer} onPause={onPauseTimer} onResume={onResumeTimer} onReset={onResetTimer} timeLeft={timeLeft} /><div className="evaluation-grid">{GAME_CONTENT.iqEvaluations.map(([mark, name, score]) => <button key={mark} className="eval-button" onClick={() => scoreIq(score)}><b>{mark}</b><span>{name}</span></button>)}</div></div> : <div className="iq-result"><span>HUMOROUS PARTY RATING</span><strong>{iqPercent}%</strong><h3>{iqTitle}</h3><p>Calculated transparently: total score from −10 to +15 mapped to 0–100%. The result never blocks promotion.</p><button className="text-button" onClick={() => onUpdate({ iqQuestions: [], iqScores: [], iqIndex: 0 })}>RESTART FIVE QUESTIONS</button></div>}
          </>}

          {index === 3 && <><div className="revealed-copy"><div className="eyebrow">THE QUEEN REQUESTS A PERFORMANCE</div><h2>The Romantic Chess Rap</h2><p>Compose a romantic rap dedicated to your Queen. {GAME_CONTENT.rapRules.join(' ')}</p></div>
            <div className="rap-controls"><label>WORD DIFFICULTY<select disabled={state.rapPrepared} value={state.rapDifficulty} onChange={(event) => onUpdate({ rapDifficulty: event.target.value, rapWords: [] })}>{['Easy', 'Medium', 'Hard', 'Brutal Mix', 'Opening Specialist'].map((difficulty) => <option key={difficulty}>{difficulty}</option>)}</select></label><button className="secondary-button" disabled={state.rapPrepared} onClick={drawRap}>{state.rapWords.length ? 'REROLL UNLOCKED WORDS' : 'DRAW SIX WORDS'} <Sparkles size={16} /></button></div>
            {state.rapWords.length > 0 && <><div className="word-grid">{state.rapWords.map((word, idx) => <button key={`${word.word}-${idx}`} disabled={state.rapPrepared} className={`word-card ${word.locked ? 'locked' : ''}`} onClick={() => onUpdate((s) => ({ ...s, rapWords: s.rapWords.map((item, i) => i === idx ? { ...item, locked: !item.locked } : item) }))}><small>TERM {String(idx + 1).padStart(2, '0')}</small><strong>{word.word}</strong><span>{word.locked ? 'LOCKED' : 'TAP TO LOCK'}</span></button>)}</div>
              {!state.rapPrepared ? <button className="text-button" onClick={() => onUpdate({ rapPrepared: true, rapWords: state.rapWords.map((word) => ({ ...word, locked: true })) })}>BEGIN PREPARATION · LOCK THE WORDS</button> : <p className="privacy-note"><LockKeyhole size={16} /> These words are frozen for this round. Use Chief Arbiter reset to draw again.</p>}
              <Timer label="Preparation · 60 seconds" seconds={60} state={state} onStart={onStartTimer} onPause={onPauseTimer} onResume={onResumeTimer} onReset={onResetTimer} timeLeft={timeLeft} />
              <Timer label="Performance · 60 seconds" seconds={60} state={state} onStart={onStartTimer} onPause={onPauseTimer} onResume={onResumeTimer} onReset={onResetTimer} timeLeft={timeLeft} />
            </>}
          </>}

          {index === 4 && <><div className="revealed-copy"><div className="eyebrow">A SECOND SHAREHOLDER HAS ENTERED</div><h2>The Queen's Verdict</h2><p>{GAME_CONTENT.queenIntro}</p><div className="privacy-note"><LockKeyhole size={17} /> Ask for explicit consent before sharing the advertisement. Nothing is sent automatically; power cards never override consent. If you both agree, attach the video yourself in WhatsApp.</div></div>
            <label className="consent-check"><input type="checkbox" checked={state.queenConsent} onChange={(event) => onUpdate({ queenConsent: event.target.checked })} /> The groom agrees to share his advertisement with the Queen.</label>
            <div className="queen-actions"><button className="secondary-button" disabled={!state.queenConsent} onClick={async () => { try { await navigator.clipboard.writeText(QUEEN_MESSAGE); say('Message copied. Paste it into WhatsApp when you are ready.'); } catch { say('Clipboard unavailable. The message is in the Arbiter panel.'); } }}>COPY WHATSAPP MESSAGE <Clipboard size={16} /></button><a className={`secondary-button ${!state.queenConsent ? 'disabled-link' : ''}`} href={state.queenConsent ? `https://wa.me/?text=${encodeURIComponent(QUEEN_MESSAGE)}` : undefined} target="_blank" rel="noreferrer" onClick={(e) => !state.queenConsent && e.preventDefault()}>OPEN WHATSAPP <ExternalLink size={16} /></a></div>
            <button className="text-button" onClick={() => onUpdate({ queenMessageSent: true })}>{state.queenMessageSent ? 'MESSAGE MARKED SENT ✓' : 'MARK MESSAGE SENT'}</button>
            <div className="rating-list">{QUEEN_CATEGORIES.map((category, index2) => <label className="rating-row" key={category}><span>{category}</span><input aria-label={`${category} rating out of ten`} type="range" min="0" max="10" value={state.queenRatings[index2] || 0} onChange={(e) => onUpdate((s) => ({ ...s, queenRatings: s.queenRatings.map((value, i) => i === index2 ? Number(e.target.value) : value) }))} /><b>{state.queenRatings[index2] || 0}/10</b></label>)}</div>
            <label className="block-label">QUEEN'S FEEDBACK<textarea value={state.queenFeedback} onChange={(e) => onUpdate({ queenFeedback: e.target.value })} placeholder="Which claim is most exaggerated? What feature is missing?" /></label>
            <div className="verdict-row">{VERDICTS.map((verdict) => <button key={verdict} className={`verdict-card ${state.queenVerdict === verdict ? 'chosen' : ''}`} onClick={() => onUpdate({ queenVerdict: verdict })}><b>{verdict.split(' ')[0]}</b><span>{verdict.slice(verdict.indexOf(' ') + 1)}</span></button>)}</div>
            {state.queenVerdict && <p className="status-line"><Check size={16} /> Verdict saved. It will not move the pawn a second time.</p>}
          </>}

          {index === 5 && <><div className="revealed-copy"><div className="eyebrow">RANK 7 · THE FINAL MOVE</div><h2>Choose your Zugzwang.</h2><p>Every available move leads somewhere memorable. Choose one sealed card; reveal only the selected challenge. You may exchange or decline it.</p></div>
            <div className="mystery-grid">{ZUGZWANG_CHOICES.map((choice) => <button key={choice.id} className={`mystery-card ${state.zugzwangChoice === choice.id ? 'revealed' : ''}`} onClick={() => onUpdate({ zugzwangChoice: choice.id })}><span>{choice.mark}</span><small>{state.zugzwangChoice === choice.id ? 'YOUR MOVE' : 'MYSTERY CARD'}</small><h3>{state.zugzwangChoice === choice.id ? choice.title : 'SEALED'}</h3><p>{state.zugzwangChoice === choice.id ? choice.detail : choice.hint}</p></button>)}</div>
            <p className="fine-print">All challenges may be modified, exchanged or declined. Participation is always voluntary.</p>
          </>}
        </article>

        <aside className="challenge-aside"><div className="aside-label">THE CHIEF ARBITER</div><div className="arbiter-avatar">♟</div><p>{state.arbiter || 'The house decides.'}</p><div className="aside-rule" /><strong>HOUSE RULE</strong><p>Move at your own pace. A skip is a valid move. The game is here to celebrate the groom, never to corner him.</p>{index === 4 && !state.queenVerdict && <button className="aside-link" onClick={() => onResolve('deferred')}><SkipForward size={15} /> Defer for now</button>}</aside>
      </div>
      <div className="resolution-bar"><div className="resolution-note">{status ? <span><Check size={16} /> This envelope is {status === 'deferred' ? 'deferred and still available' : status}.</span> : <span><Flag size={16} /> Chief Arbiter confirms the result.</span>}</div><div className="resolution-actions"><button className="quiet-button" onClick={() => onResolve('skipped')} disabled={Boolean(status && status !== 'deferred')}>SKIP</button><button className="secondary-button" onClick={() => onResolve('modified')} disabled={Boolean(status && status !== 'deferred')}>MODIFIED & COMPLETE</button><button className="primary-button compact" onClick={() => onResolve('completed')} disabled={Boolean(status && status !== 'deferred')}>CHALLENGE COMPLETE <Check size={16} /></button></div></div>
    </>}
  </section>;
}

function Timer({ label, seconds, state, onStart, onPause, onResume, onReset, timeLeft }: { label: string; seconds: number; state: GameState; onStart: (label: string, duration: number) => void; onPause: () => void; onResume: () => void; onReset: () => void; timeLeft: number }) {
  const active = state.clock.label === label && state.clock.duration > 0;
  const value = active ? timeLeft : seconds;
  return <div className={`timer ${active ? 'active' : ''}`}><div className="timer-copy"><Clock3 size={17} /><span>{label}</span></div><strong className={value === 0 ? 'time-up' : ''}>{`${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`}</strong><div className="timer-buttons">{!active || !state.clock.startedAt && value > 0 ? <button className="timer-button" onClick={() => active ? onResume() : onStart(label, seconds)} aria-label="Start timer">{active ? <Play size={14} /> : <Play size={14} />}</button> : <button className="timer-button" onClick={onPause} aria-label="Pause timer"><Pause size={14} /></button>}<button className="timer-button" onClick={() => active ? onReset() : onStart(label, seconds)} aria-label="Reset timer"><RotateCcw size={14} /></button></div></div>;
}

function Promotion({ state, onChoose }: { state: GameState; onChoose: (piece: string) => void }) {
  return <section className="promotion page-in"><div className="promotion-orbit">♙<span>♔</span></div><div className="eyebrow"><span className="red-dot" /> PROMOTION AVAILABLE {state.fastTracked ? '· TIME TROUBLE' : ''}</div><h1>You have reached<br /><em>the eighth rank.</em></h1><p className="lead">Your next move will define your legacy.</p><p className="promotion-note">In chess, a pawn may promote to a Queen, Rook, Bishop or Knight. Each piece holds one private reward. Choose carefully; the other rewards stay sealed.</p>
    <div className="promotion-grid">{PIECES.map((piece) => <button key={piece.id} className="promotion-card" onClick={() => onChoose(piece.id)}><span className="promotion-piece">{piece.symbol}</span><h2>{piece.id}</h2><span className="secret-word">{piece.secret}</span><p>{piece.tease}</p><span className="choose-mark">SELECT PIECE</span></button>)}</div>
    <p className="fine-print">The group agrees to any reward in good humour; every request stays reasonable, consensual and within agreed limits.</p></section>;
}

function RewardScreen({ state, onUpdate, mission, setMission }: { state: GameState; onUpdate: (changes: Partial<GameState> | ((current: GameState) => GameState)) => void; mission: string; setMission: (value: string) => void }) {
  const piece = PIECES.find((item) => item.id === state.selectedPiece) || PIECES[0];
  const reward = REWARDS[piece.id];
  const names = state.groom || 'The Grandmaster';
  const rewardDescription = piece.id === 'Knight' && state.rewardNote ? state.rewardNote : reward.description;
  const voucherLines = [piece.id.toUpperCase(), reward.title, names, rewardDescription, reward.terms, state.spendingLimit ? `Agreed limit: ${state.spendingLimit}` : 'Within mutually agreed limits', `Chief Arbiter: ${state.arbiter || 'The Brotherhood'}`];
  const certificateLines = ['CERTIFICATE OF PROMOTION', 'GRANDMASTER OF MATRIMONY', `PRESENTED TO ${names.toUpperCase()}`, 'Bachelorhood successfully completed.', `Promoted to: ${piece.id}`, `Chief Arbiter: ${state.arbiter || 'The Brotherhood'}`, 'You spent your life looking for the perfect move. Then you found your Queen.'];
  async function share(text: string) {
    try { if (navigator.share) await navigator.share({ title: "The Pawn's Promotion", text }); else { await navigator.clipboard.writeText(text); } }
    catch { /* A dismissed share sheet is not an error for the game. */ }
  }
  return <section className="reward-page page-in"><div className="eyebrow"><span className="red-dot" /> THE GAME IS COMPLETE · REWARD UNSEALED</div><div className="reward-heading"><span className="reward-piece">{piece.symbol}</span><div><h1>Grandmaster of<br /><em>Matrimony.</em></h1><p>Promotion secured: {piece.id} · {state.city} · {state.eventDate}</p></div></div>
    <article className="voucher" id="voucher"><div className="voucher-bar"><span>INTERNATIONAL BACHELOR FEDERATION</span><span>VOUCHER · 2026</span></div><div className="voucher-content"><div className="eyebrow">THE {piece.id.toUpperCase()} REWARD</div><h2>{reward.title}</h2><h3>Presented to {names}</h3><p>{rewardDescription}</p><div className="voucher-terms"><b>REDEMPTION TERMS</b><p>{reward.terms}{state.spendingLimit ? ` Agreed spending limit: ${state.spendingLimit}.` : ''}</p></div><div className="voucher-seal">♙</div><small>COLOMBO · 26 NOVEMBER 2026 · CHIEF ARBITER: {state.arbiter || 'THE BROTHERHOOD'}</small></div></article>
    <div className="voucher-actions"><button className="secondary-button" onClick={() => downloadSvg('THE PAWN’S PROMOTION', voucherLines, 'pawns-promotion-voucher.svg')}><Download size={16} /> SAVE VOUCHER AS IMAGE</button><button className="secondary-button" onClick={() => void share(`${piece.id} — ${reward.title}\n\n${reward.description}\n\n${reward.terms}`)}><Share2 size={16} /> SHARE / COPY VOUCHER</button><button className="secondary-button" onClick={() => window.print()}><FileDown size={16} /> PRINT</button></div>
    {piece.id === 'Queen' && <section className="reward-extra"><div className="eyebrow">OPTIONAL · THE WEDDING MISSION GENERATOR</div><h2>Issue one secret mission.</h2><div className="mission-box"><p>{mission}</p><button className="icon-button" onClick={() => setMission(WEDDING_MISSIONS[Math.floor(Math.random() * WEDDING_MISSIONS.length)])} aria-label="Draw another mission"><RotateCcw /></button></div><div className="button-row"><button className="text-button" onClick={() => void navigator.clipboard?.writeText(mission)}>COPY MISSION</button><button className="text-button" onClick={() => setMission('Write your own mission here.')}>WRITE A CUSTOM MISSION</button></div></section>}
    {piece.id === 'Rook' && <section className="reward-extra"><div className="eyebrow">THE ROYAL BAILOUT</div><label className="block-label">AGREED SPENDING LIMIT<input value={state.spendingLimit} onChange={(e) => onUpdate({ spendingLimit: e.target.value })} placeholder="Set this together" /></label></section>}
    {piece.id === 'Bishop' && <BishopMissions state={state} />}
    {piece.id === 'Knight' && <section className="reward-extra"><div className="eyebrow">EDITABLE WILDCARD NOTE</div><p>Replace the default wildcard with The Unfinished Gambit if you want a future group adventure.</p><textarea value={state.rewardNote} onChange={(e) => onUpdate({ rewardNote: e.target.value })} placeholder="The Knight’s Wildcard — one reasonable request within twelve months." /><button className="text-button" onClick={() => onUpdate({ rewardNote: 'The Unfinished Gambit: a future group adventure including activities missed during the bachelor party.' })}>USE “THE UNFINISHED GAMBIT”</button></section>}
    <section className="certificate"><div className="certificate-stamp">♙</div><div className="eyebrow">INTERNATIONAL BACHELOR FEDERATION</div><h2>CERTIFICATE OF PROMOTION</h2><div className="certificate-rule" /><h3>GRANDMASTER<br /><em>OF MATRIMONY</em></h3><p className="certificate-presented">PRESENTED TO</p><strong className="certificate-name">{names}</strong><p>Having survived numerous blunders, tactical traps, questionable gambits and one exceptional Queen.<br /><b>Bachelorhood successfully completed.</b></p><div className="certificate-meta"><span>PROMOTED TO {piece.id.toUpperCase()}</span><span>{state.city.toUpperCase()} · {state.eventDate.toUpperCase()}</span><span>CHIEF ARBITER · {state.arbiter || 'THE BROTHERHOOD'}</span></div><div className="certificate-friends">{state.friends.length ? `THE BROTHERHOOD · ${state.friends.join(' · ')}` : ''}</div><div className="certificate-final">You spent your life looking for the perfect move.<br /><b>Then you found your Queen.</b></div></section>
    <div className="voucher-actions"><button className="primary-button" onClick={() => downloadSvg('GRANDMASTER OF MATRIMONY', certificateLines, 'grandmaster-certificate.svg')}><Download size={16} /> SAVE CERTIFICATE AS IMAGE</button><button className="secondary-button" onClick={() => window.print()}>PRINT CERTIFICATE</button></div>
    <div className="privacy-note"><LockKeyhole size={16} /> Your names, game state, Queen’s feedback and scores are stored only in this browser. Export a backup from the Arbiter panel.</div>
  </section>;
}

function BishopMissions({ state }: { state: GameState }) {
  const assignment = useMemo(() => drawUnique(SECRET_TERMS, Math.max(1, state.friends.length)), [state.friends.join('|')]);
  return <section className="reward-extra"><div className="eyebrow">THE SECRET SOCIETY · PRIVATE ASSIGNMENTS</div><p>One chess term for each agent. Copy and distribute messages individually.</p><div className="assignment-list">{(state.friends.length ? state.friends : ['Agent One', 'Agent Two', 'Agent Three']).map((friend, index) => <div key={friend}><span>{friend}</span><b>{assignment[index % assignment.length]}</b><button className="text-button" onClick={() => void navigator.clipboard?.writeText(`${friend}: secretly work “${assignment[index % assignment.length]}” into a conversation, then share a genuine, kind story about the Grandmaster with the bride.`)}>COPY</button></div>)}</div></section>;
}

function ArbiterPanel({ state, onClose, onUpdate, onResolve, onFastTrack, onUndo, onJump, onExport, onImport, say }: {
  state: GameState; onClose: () => void; onUpdate: (changes: Partial<GameState> | ((current: GameState) => GameState)) => void; onResolve: (result: Resolution) => void;
  onFastTrack: () => void; onUndo: () => void; onJump: (index: number) => void; onExport: () => void; onImport: (file?: File) => Promise<void>; say: (text: string) => void;
}) {
  const currentIndex = Math.min(state.step, 5);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="arbiter-panel" role="dialog" aria-modal="true" aria-labelledby="arbiter-title">
    <div className="drawer-head"><div><div className="eyebrow">LOCAL ORGANISER CONTROLS</div><h2 id="arbiter-title">Chief Arbiter</h2></div><button className="icon-button" onClick={onClose} aria-label="Close Chief Arbiter panel"><X /></button></div>
    <div className="arbiter-rank"><span>CURRENT POSITION</span><b>RANK {state.rank} / 8</b><span>{state.step < 6 ? CHALLENGES[currentIndex].title : 'Promotion'}</span></div>
    {state.step < 6 && <div className="organiser-actions"><button className="secondary-button" onClick={() => { onResolve('completed'); onClose(); }}>COMPLETE CURRENT CHALLENGE</button><button className="quiet-button" onClick={() => { onResolve('skipped'); onClose(); }}>SKIP CURRENT CHALLENGE</button></div>}
    <div className="arbiter-section"><h3>JUMP TO A CHALLENGE</h3><p>Opening a future challenge records an organiser override.</p><div className="jump-list">{CHALLENGES.map((challenge, index) => <button key={challenge.title} onClick={() => onJump(index)}><span>{String(index + 1).padStart(2, '0')}</span>{challenge.title}<LockKeyhole size={14} /></button>)}</div></div>
    <div className="arbiter-section"><h3>RECOVERY</h3><div className="button-row"><button className="secondary-button" disabled={!state.undoStack.length} onClick={onUndo}><RotateCcw size={15} /> UNDO LAST PROGRESSION</button><button className="secondary-button" disabled={!state.clock.label} onClick={() => onUpdate({ clock: { ...state.clock, remaining: state.clock.duration, startedAt: null } })}>RESET TIMER</button><button className="secondary-button" disabled={!state.clock.label} onClick={() => { const remaining = remainingSeconds(state.clock); onUpdate({ clock: { ...state.clock, duration: state.clock.duration + 10, remaining: remaining + 10, startedAt: state.clock.startedAt ? Date.now() : null } }); }}>+10 SECONDS</button></div></div>
    <div className="arbiter-section"><h3>RESTORE A POWER CARD</h3><div className="restore-list">{POWER_CARDS.map((card) => <button key={card.id} className="restore-item" disabled={!state.powerUsed.includes(card.id)} onClick={() => onUpdate((s) => restorePower(s, card.id))}><span>{card.mark}</span>{card.name}{state.powerUsed.includes(card.id) ? <Unlock size={15} /> : <Check size={15} />}</button>)}</div></div>
    <div className="arbiter-section"><h3>QUEEN'S VERDICT</h3><p>Pending or deferred verdicts can be entered after progression. This never advances the pawn twice.</p><textarea value={state.queenFeedback} onChange={(e) => onUpdate({ queenFeedback: e.target.value })} placeholder="Feedback from the Queen" /><div className="verdict-row">{VERDICTS.map((verdict) => <button key={verdict} className={`verdict-card ${state.queenVerdict === verdict ? 'chosen' : ''}`} onClick={() => onUpdate({ queenVerdict: verdict })}>{verdict}</button>)}</div></div>
    <div className="arbiter-section"><h3>EVENT DETAILS</h3><div className="form-grid compact-grid"><label>GROOM<input value={state.groom} onChange={(e) => onUpdate({ groom: e.target.value })} /></label><label>BRIDE<input value={state.bride} onChange={(e) => onUpdate({ bride: e.target.value })} /></label><label>CHIEF ARBITER<input value={state.arbiter} onChange={(e) => onUpdate({ arbiter: e.target.value })} /></label><label>LOCATION<input value={state.city} onChange={(e) => onUpdate({ city: e.target.value })} /></label><label>EVENT DATE<input value={state.eventDate} onChange={(e) => onUpdate({ eventDate: e.target.value })} /></label><label>DINNER LIMIT<input value={state.spendingLimit} onChange={(e) => onUpdate({ spendingLimit: e.target.value })} /></label></div><label className="block-label">FRIENDS · COMMA SEPARATED<textarea value={state.friends.join(', ')} onChange={(e) => onUpdate({ friends: e.target.value.split(',').map((name) => name.trim()).filter(Boolean) })} /></label></div>
    {state.selectedPiece && <div className="arbiter-section"><h3>OVERRIDE PROMOTION</h3><div className="button-row">{PIECES.map((piece) => <button key={piece.id} className="small-button" onClick={() => onUpdate({ selectedPiece: piece.id, screen: 'reward' })}>{piece.symbol} {piece.id}</button>)}</div></div>}
    <div className="arbiter-section fast-track"><h3>TIME TROUBLE</h3><p>Unresolved challenges are marked deferred, not completed. Deferred envelopes remain available later.</p><button className="primary-button" onClick={onFastTrack}>TIME TROUBLE — FAST-TRACK TO PROMOTION <SkipForward size={16} /></button></div>
    <div className="arbiter-section"><h3>SAVE & RESTORE</h3><div className="button-row"><button className="secondary-button" onClick={onExport}><Download size={15} /> EXPORT GAME JSON</button><label className="secondary-button file-button"><FileDown size={15} /> IMPORT GAME JSON<input type="file" accept="application/json,.json" onChange={(e) => void onImport(e.target.files?.[0])} /></label></div></div>
    <div className="arbiter-section"><h3>FUTURE ENVELOPE PREVIEW</h3><div className="preview-list">{CHALLENGES.map((item, index) => <span key={item.title} className={index < state.step ? 'unlocked-preview' : ''}>RANK {item.from} → {item.to} · {item.title}</span>)}</div></div>
    <div className="arbiter-section"><h3>RESET GAME</h3><button className="danger-button" onClick={() => { if (window.confirm('Erase this game on this device and start over? Export a backup first if needed.')) { localStorage.removeItem(STORAGE_KEY); onUpdate(createGame()); onClose(); say('Game restarted.'); } }}>RESTART THE ENTIRE GAME <RotateCcw size={15} /></button><p className="fine-print">This local PIN-free panel is for convenience, not real authentication. Challenge and reward content is included in the downloaded app files.</p></div>
  </section></div>;
}

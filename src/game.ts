export const STORAGE_KEY = 'pawns-promotion-save-v1';
export const GROOM = 'Kasun';
export const BRIDE = 'Imesha';
export const BROTHERHOOD = ['Kavindu', 'Rivindu', 'Elijah', 'Dane', 'Sachira'] as const;
export const POWER_CARDS = [
  { id: 'castling', name: 'Castling', mark: 'O-O', copy: 'Recruit one willing friend to face this challenge alongside you. You still take part, but you do not have to go alone.' },
  { id: 'counterattack', name: 'Counterattack', mark: '!', copy: 'Turn the attack around: ask one friend to answer a difficult question or attempt an equivalent challenge with you.' },
  { id: 'takeback', name: 'Takeback', mark: '↶', copy: 'Undo one questionable performance and try again. Play it immediately after the attempt.' },
  { id: 'draw', name: 'Draw Offer', mark: '½–½', copy: 'Agree a shorter, easier or alternative version with the Chief Arbiter. The agreed version still counts.' },
] as const;

export const CHALLENGES = [
  { title: 'The Husband Advertisement', concept: 'The Opening', from: 2, to: 3, mark: '♙', tagline: 'Every great campaign begins with a bold opening.', principle: 'The opening establishes your position and prepares the foundation for everything that follows.' },
  { title: 'Shark Tank: Husband Edition', concept: 'The Gambit', from: 3, to: 4, mark: '♟', tagline: 'Your pitch has attracted unexpected investors.', principle: 'A gambit accepts a sacrifice in the hope of gaining a greater advantage.' },
  { title: 'The Marriage IQ Test', concept: 'Calculation', from: 4, to: 5, mark: '♘', tagline: 'Calculate the position. Choose your next move.', principle: 'A strong player anticipates consequences and selects the best continuation.' },
  { title: 'The Romantic Chess Rap', concept: 'The Combination', from: 5, to: 6, mark: '♗', tagline: 'Six tactical terms. One heartfelt performance.', principle: 'A combination coordinates several moves to create one memorable result.' },
  { title: "The Queen's Verdict", concept: 'The Discovered Attack', from: 6, to: 7, mark: '♕', tagline: 'One final shareholder has entered the room.', principle: 'A discovered attack reveals a second threat when the first piece moves.' },
  { title: 'The Final Move', concept: 'Zugzwang', from: 7, to: 8, mark: '♜', tagline: 'Every legal move leads somewhere memorable.', principle: 'Zugzwang is a position where every available move changes the game.' },
] as const;

export const IQ_QUESTIONS = [
  'You receive a message saying, “Do whatever you want.” Calculate your next move.',
  'You ate the leftovers your wife was saving. Present your legal defence.',
  'You accidentally booked a boys’ trip on your wedding anniversary. Find the best move.',
  'You return from the supermarket with everything except the five things you were sent for. Explain your strategy.',
  'Your wife and your best friend need your help at exactly the same time. Resolve the position.',
  'You forgot why an argument started but are still defending your position. What is your exit strategy?',
  'You have ten minutes to make the house presentable before guests arrive. Explain your tactical plan.',
  'Your wife asks what you love most about her. You cannot mention her appearance.',
  'You bought an unnecessarily expensive gadget. Convince the household finance committee it was essential.',
  'Explain the difference between winning an argument and achieving a favourable outcome.',
  'You are assembling furniture. Three screws remain after completion. Explain the position.',
  'Your wife fell asleep halfway through a film she insisted on watching. What is your next move?',
  'You drove confidently in the wrong direction for twenty minutes. Calculate your diplomatic recovery.',
  'Dinner is your responsibility. The ingredients are an egg, a potato and expired enthusiasm. Present your strategy.',
];

export const RAP_WORDS: Record<string, string[]> = {
  Easy: ['Pawn', 'Queen', 'King', 'Knight', 'Bishop', 'Rook', 'Checkmate', 'Chessboard', 'Grandmaster', 'Opening', 'Endgame', 'Capture', 'Promotion', 'Blunder'],
  Medium: ['Gambit', 'Sacrifice', 'Castling', 'Fork', 'Pin', 'Stalemate', 'Counterattack', 'Passed Pawn', 'Back Rank', 'Time Trouble', 'Brilliant Move', 'Double Check'],
  Hard: ['Zugzwang', 'En Passant', 'Underpromotion', 'Discovered Attack', 'Perpetual Check', 'Zwischenzug', 'Opposition', 'Deflection', 'Decoy', 'Skewer', 'Smothered Mate', 'Fianchetto'],
  'Opening Specialist': ["Sicilian Defence", "Queen's Gambit", 'London System', "King's Indian Defence", 'Italian Game', 'French Defence', 'Caro-Kann', 'Ruy Lopez', 'Scandinavian Defence', "King's Gambit", 'Catalan Opening'],
};
export const BRUTAL_WORDS = [...RAP_WORDS.Medium.slice(3), ...RAP_WORDS.Hard];

export const SHARK_ROLES = [
  { name: 'Finance', questions: ['What is your projected return on marriage?', 'How will you justify your future expenses?', 'Why is this product worth its valuation?'] },
  { name: 'Quality Assurance', questions: ['What known defects does this husband have?', 'How often does the product require maintenance?', 'What quality-control issues should the customer expect?'] },
  { name: 'Customer Service', questions: ['What is your average response time to complaints?', 'Is support available 24 hours a day?', 'What happens when the product stops listening?'] },
  { name: 'Legal', questions: ['What does your lifetime warranty cover?', 'Are there hidden terms and conditions?', 'How do you resolve customer disputes?'] },
  { name: 'Operations', questions: ['Which household tasks can you perform independently?', 'Can this product operate a washing machine?', 'What happens during a domestic emergency?'] },
  { name: 'Marketing', questions: ['Why choose you over competing husbands?', 'What claim in your advertisement is most exaggerated?', 'What is your unique competitive advantage?'] },
  { name: 'Research & Development', questions: ['What improvements are planned for Husband 2.0?', 'Which feature is still under development?', 'What bugs have you failed to resolve?'] },
];

export const QUEEN_MESSAGE = `Hi! Your future husband has been pitching himself as a premium husband product during his bachelor party.\n\nThe Shark Tank investors have reviewed his advertisement, but there is one final shareholder whose approval matters: you.\n\nPlease review his advertisement and tell us:\n1. Which claim is most exaggerated?\n2. What additional feature should be included?\n3. Would you recommend this product?\n\nFinally, choose your chess evaluation: !! Brilliant Move, ?! Inaccuracy, or ?? Blunder. Your verdict may influence his final promotion.`;
export const QUEEN_CATEGORIES = ['Product appearance', 'Reliability', 'Domestic capabilities', 'Romantic capabilities', 'Value for money', 'Advertising accuracy'];
export const VERDICTS = ['!! Brilliant Move', '?! Inaccuracy', '?? Blunder'];
export const PIECES = [
  { id: 'Queen', symbol: '♕', secret: 'REVENGE', tease: 'Your tormentors shall become your entertainment.' },
  { id: 'Rook', symbol: '♖', secret: 'FORTUNE', tease: 'The debts of the King shall be settled by his allies.' },
  { id: 'Bishop', symbol: '♗', secret: 'INFLUENCE', tease: 'A secret brotherhood shall operate in your honour.' },
  { id: 'Knight', symbol: '♘', secret: 'SURPRISE', tease: 'One unexpected move remains yours to make.' },
] as const;
export const REWARDS: Record<string, { title: string; description: string; terms: string }> = {
  Queen: { title: 'The Wedding Gambit', description: 'Your days as a pawn are over. You are now the most powerful piece on the board. At your wedding reception, assign one secret, mischievous or mildly embarrassing mission to each member of your bachelor-party brotherhood. Each player attempts their mission discreetly and reports back before the reception ends. Tonight, you were the entertainment. At the wedding, they shall be yours. You are now the Chief Arbiter.', terms: 'Keep missions kind, discreet and easy to decline. Do not disrupt the ceremony, speeches or other guests.' },
  Rook: { title: 'The Royal Bailout', description: 'Every great player needs a strong defence and sufficient resources. You are entitled to one complimentary dinner at a restaurant of your choosing, funded collectively by the brotherhood. You choose the restaurant. You choose the date. The boys settle your bill. The Treasury is officially yours.', terms: 'Redeem within the first twelve months of marriage. The group agrees the spending limit in advance.' },
  Bishop: { title: 'The Secret Society', description: 'The Bishop operates from unexpected angles. At your wedding reception, each member of the brotherhood becomes an undercover agent: naturally work an assigned chess term into a conversation with another agent, then find an appropriate moment to tell your bride a different, genuine positive story about you as a friend, gentleman or husband. Your reputation shall be strategically enhanced.', terms: 'Keep it warm, appropriate and clear of ceremony, speeches and other guests.' },
  Knight: { title: "The Knight's Wildcard", description: 'The Knight is unpredictable. You have earned one wildcard, redeemable at any time within the next twelve months. Summon your brotherhood to fulfil one reasonable request, organise an adventure, participate in an embarrassing challenge or execute a surprise mission. Expect the unexpected.', terms: 'One reasonable request, within mutually agreed limits. Everyone retains the right to decline.' },
};
export const WEDDING_MISSIONS = [
  'Naturally use the word zugzwang in conversation with another participating friend.',
  'Convince three of the boys to pose like chess pieces in a group photograph.',
  'Address the groom as Grandmaster.',
  'Get the groom to repeat his husband advertisement slogan.',
  'Deliver a private 15-second chess commentary on the wedding.',
  'Recreate a terrible boy-band album cover in wedding suits.',
  'Write a four-line romantic poem using chess terminology.',
  'Recreate a bachelor-party photograph in wedding attire.',
  'Organise a private ceremonial presentation of the Grandmaster certificate.',
];
export const SECRET_TERMS = ['Zugzwang', 'En Passant', 'Gambit', 'Underpromotion', 'Stalemate', 'Grandmaster', 'Fianchetto', 'Castling', 'Brilliant Move', 'Counterattack'];
export const ZUGZWANG_CHOICES = [
  { id: 'proposal', mark: 'A', title: 'The Proposal', hint: 'A future together with an unlikely partner.', detail: 'Propose to an inanimate object selected by your friends. Explain how you met, why you fell in love, why you belong together and how you will spend your future together. Sincerity is compulsory.' },
  { id: 'serenade', mark: 'B', title: 'The Serenade', hint: 'A duet against the odds.', detail: 'Choose a willing friend and perform a romantic serenade while keeping a completely serious expression. Your friend attempts to remain serious.' },
  { id: 'funeral', mark: 'C', title: 'The Bachelor Funeral', hint: 'A fond farewell to a familiar position.', detail: 'Deliver a dramatic eulogy mourning bachelorhood: its birth, greatest achievements, spectacular blunders and eventual passing. End with five seconds of ceremonial silence.' },
];
export const GAME_CONTENT = {
  welcome: [
    'Tonight you enter the board as a pawn. Take your place on rank one with Kavindu, Rivindu, Elijah, Dane and Sachira. One of them will be your Chief Arbiter and open the envelopes with you.',
    'On rank two you’ll make your pitch as Imesha’s future husband. Each of the six envelopes moves you up one rank. The group can complete a challenge, change it, skip it or save it for later.',
    'At rank eight, choose your piece. Your reward stays sealed until you decide.',
  ],
  advertisement: {
    headline: 'You are about to launch the most important product of your life.',
    product: 'Yourself.',
    instructions: 'Find a private place and record a 60-second selfie video advertising yourself as the perfect husband. Include:',
    requirements: ['Your premium product introduction and three unique selling points.', 'A demonstration of one special feature and one known manufacturing defect.', 'Your lifetime warranty and a memorable advertising slogan.'],
    rules: 'Record in one take unless you use Takeback. Ask for a power card before inviting a friend to help with creative work.',
    privacy: 'Do not film other people or private areas. Your recording stays on your device and is never uploaded here.',
  },
  sharkPitch: {
    offer: 'Seek $1 million for a 10% stake in your imaginary husband enterprise. Your friends are the Sharks. The investment is fictional; no actual money is involved.',
    rules: 'Play the ad, field a question from each Shark, then defend your business model. If the vote ties or goes against you, make one final 20-second pitch.',
  },
  iqNote: 'The group evaluates diplomacy, humour and creativity. This is a party rating, not a real intelligence or relationship assessment.',
  iqEvaluations: [['!!', 'Brilliant', 3], ['!', 'Great Move', 2], ['+', 'Good Move', 1], ['?!', 'Inaccuracy', 0], ['?', 'Mistake', -1], ['??', 'Blunder', -2]] as const,
  iqTitles: ['Opening Preparation Required', 'Promising Club Player', 'Candidate Master of Matrimony', 'International Master of Domestic Affairs', 'Grandmaster of Diplomacy'],
  rapRules: ['Use all six terms.', 'Rhyme and include a genuine romantic sentiment.', 'Prepare for 60 seconds; perform for 45–60 seconds.', 'Friends may provide the beat. Perform with conviction.'],
  queenIntro: 'You believed the investment committee had made its final decision. One final shareholder’s approval matters: your Queen.',
} as const;

export type Resolution = 'completed' | 'modified' | 'skipped' | 'deferred';
export type GameState = {
  version: 1;
  screen: 'landing' | 'welcome' | 'preparation' | 'game' | 'promotion' | 'reward';
  groom: string;
  bride: string;
  friends: string[];
  arbiter: string;
  city: string;
  eventDate: string;
  spendingLimit: string;
  startedAt: string | null;
  step: number;
  rank: number;
  viewingStep: number | null;
  statuses: Array<Resolution | null>;
  opened: boolean;
  powerUsed: string[];
  undoStack: Array<{ step: number; rank: number; statuses: Array<Resolution | null>; screen?: GameState['screen']; selectedPiece?: string; powerUsed?: string[]; clock?: GameState['clock'] }>;
  fastTracked: boolean;
  sharks: Array<{ name: string; role: string; vote: 'in' | 'out' | null; question: string; questionIndex: number }>;
  iqQuestions: number[];
  iqScores: number[];
  iqIndex: number;
  rapDifficulty: string;
  rapWords: Array<{ word: string; locked: boolean }>;
  rapPrepared: boolean;
  queenConsent: boolean;
  queenMessageSent: boolean;
  queenRatings: number[];
  queenFeedback: string;
  queenVerdict: string;
  zugzwangChoice: string;
  clock: { label: string; duration: number; remaining: number; startedAt: number | null };
  selectedPiece: string;
  rewardNote: string;
  mission: string;
  bishopAssignments: string[];
};

export function createGame(): GameState {
  return {
    version: 1, screen: 'landing', groom: GROOM, bride: BRIDE, friends: [...BROTHERHOOD], arbiter: '', city: 'Colombo', eventDate: '26 November 2026', spendingLimit: '',
    startedAt: null, step: 0, rank: 1, viewingStep: null, statuses: Array(6).fill(null), opened: false, powerUsed: [], undoStack: [], fastTracked: false,
    sharks: [], iqQuestions: [], iqScores: [], iqIndex: 0, rapDifficulty: 'Medium', rapWords: [], rapPrepared: false,
    queenConsent: false, queenMessageSent: false, queenRatings: Array(6).fill(0), queenFeedback: '', queenVerdict: '', zugzwangChoice: '',
    clock: { label: '', duration: 0, remaining: 0, startedAt: null }, selectedPiece: '', rewardNote: '',
    mission: WEDDING_MISSIONS[0], bishopAssignments: ['Zugzwang', 'En Passant', 'Gambit', 'Underpromotion', 'Stalemate'],
  };
}

const OPENING_SCREENS = ['landing', 'welcome', 'preparation'];

export function advanceOpening(state: GameState): GameState {
  if (state.rank !== 1) return state;
  switch (state.screen) {
    case 'landing': return { ...state, screen: 'welcome' };
    case 'welcome': return { ...state, screen: 'preparation' };
    case 'preparation': return { ...state, rank: 2, screen: 'game', startedAt: state.startedAt || new Date().toISOString() };
    default: return state;
  }
}

export function consumePower(state: GameState, id: string): GameState {
  if (!POWER_CARDS.some((card) => card.id === id) || state.powerUsed.includes(id)) return state;
  return { ...state, powerUsed: [...state.powerUsed, id] };
}
export function restorePower(state: GameState, id: string): GameState {
  return { ...state, powerUsed: state.powerUsed.filter((used) => used !== id) };
}
export function resolveCurrent(state: GameState, resolution: Resolution, expectedStep = state.step): GameState {
  if (state.rank === 1 || state.step >= 6 || state.step !== expectedStep || (state.statuses[state.step] && state.statuses[state.step] !== 'deferred')) return state;
  const replayingDeferred = state.statuses[state.step] === 'deferred';
  const statuses = [...state.statuses];
  statuses[state.step] = resolution;
  const undoStack = [...state.undoStack, { step: state.step, rank: state.rank, statuses: [...state.statuses], screen: state.screen, selectedPiece: state.selectedPiece, powerUsed: [...state.powerUsed], clock: { ...state.clock } }];
  if (replayingDeferred) {
    const furthestStep = statuses.reduce((furthest, status, index) => status ? Math.max(furthest, index + 1) : furthest, state.step + 1);
    const step = Math.min(6, furthestStep);
    return { ...state, statuses, undoStack, step, rank: step + 2, viewingStep: null, screen: step === 6 ? state.selectedPiece ? 'reward' : 'promotion' : 'game', opened: false };
  }
  const step = state.step + 1;
  const rank = Math.min(8, state.rank + 1);
  return { ...state, statuses, undoStack, step, rank, viewingStep: null, screen: step === 6 ? 'promotion' : 'game', opened: false, clock: { label: '', duration: 0, remaining: 0, startedAt: null } };
}
export function resolveEnvelope(state: GameState, index: number, resolution: Resolution): GameState {
  if (index === state.step) return resolveCurrent(state, resolution, state.step);
  if (index < 0 || index >= 6 || state.statuses[index] !== 'deferred') return state;
  const statuses = [...state.statuses];
  statuses[index] = resolution;
  const undoStack = [...state.undoStack, { step: state.step, rank: state.rank, statuses: [...state.statuses], screen: state.screen, selectedPiece: state.selectedPiece, powerUsed: [...state.powerUsed], clock: { ...state.clock } }];
  return { ...state, statuses, undoStack, viewingStep: null, screen: state.selectedPiece ? 'reward' : state.step === 6 ? 'promotion' : 'game', opened: false };
}
export function fastTrack(state: GameState): GameState {
  if (state.rank === 1 || state.rank === 8) return state;
  const statuses = [...state.statuses];
  for (let i = 0; i < statuses.length; i += 1) if (!statuses[i]) statuses[i] = 'deferred';
  return { ...state, statuses, undoStack: [...state.undoStack, { step: state.step, rank: state.rank, statuses: [...state.statuses], screen: state.screen, selectedPiece: state.selectedPiece, powerUsed: [...state.powerUsed], clock: { ...state.clock } }], step: 6, rank: 8, viewingStep: null, screen: 'promotion', opened: false, fastTracked: true };
}
export function undoProgress(state: GameState): GameState {
  const previous = state.undoStack[state.undoStack.length - 1];
  if (!previous) return state;
  return { ...state, step: previous.step, rank: previous.rank, statuses: [...previous.statuses], undoStack: state.undoStack.slice(0, -1), viewingStep: null, screen: previous.screen || (previous.step === 6 ? previous.selectedPiece ? 'reward' : 'promotion' : 'game'), opened: false, selectedPiece: previous.selectedPiece ?? state.selectedPiece, powerUsed: previous.powerUsed ?? state.powerUsed, clock: previous.clock ?? state.clock };
}
export function selectPromotion(state: GameState, piece: string): GameState {
  if (state.rank !== 8 || state.selectedPiece || !['Queen', 'Rook', 'Bishop', 'Knight'].includes(piece)) return state;
  return { ...state, selectedPiece: piece, screen: 'reward', powerUsed: POWER_CARDS.map((card) => card.id) };
}
export function drawUnique<T>(source: T[], count: number, random = Math.random): T[] {
  const pool = [...source];
  const result: T[] = [];
  while (pool.length && result.length < count) result.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  return result;
}
export function rerollRapWords(current: Array<{ word: string; locked: boolean }>, source: string[], random = Math.random): Array<{ word: string; locked: boolean }> {
  const slots = Array.from({ length: 6 }, (_, index) => current[index]?.locked ? current[index] : null);
  const fixed = slots.filter((item): item is { word: string; locked: boolean } => item !== null);
  const pool = source.filter((word) => !fixed.some((item) => item.word === word));
  const replacements = drawUnique(pool, slots.length - fixed.length, random).map((word) => ({ word, locked: false }));
  let nextReplacement = 0;
  return slots.map((item) => item || replacements[nextReplacement++]);
}
export function marriageIqPercent(scores: number[]): number {
  const score = scores.reduce((sum, value) => sum + value, 0);
  return Math.round(Math.min(100, Math.max(0, ((score + 10) / 25) * 100)));
}
export function scoreIqAnswer(state: GameState, score: number, expectedQuestion = state.iqIndex): GameState {
  if (state.iqIndex !== expectedQuestion || state.iqIndex >= 5 || state.iqScores.length !== expectedQuestion) return state;
  return { ...state, iqScores: [...state.iqScores, score], iqIndex: state.iqIndex + 1, clock: { label: '', duration: 0, remaining: 0, startedAt: null } };
}
export function voteResult(votes: Array<'in' | 'out' | null>): 'deal' | 'no-deal' | 'tie' | 'pending' {
  const cast = votes.filter((vote): vote is 'in' | 'out' => vote !== null);
  if (cast.length < votes.length || cast.length === 0) return 'pending';
  const yes = cast.filter((vote) => vote === 'in').length;
  const no = cast.length - yes;
  return yes === no ? 'tie' : yes > no ? 'deal' : 'no-deal';
}
export function serializeGame(state: GameState): string { return JSON.stringify(state, null, 2); }
export function parseGame(raw: string): GameState {
  const parsed = JSON.parse(raw) as Partial<GameState>;
  const opening = OPENING_SCREENS.includes(String(parsed.screen));
  const step = parsed.step;
  const rank = opening && step === 0 && parsed.rank === 2 ? 1 : parsed.rank;
  const validStep = typeof step === 'number' && Number.isInteger(step) && step >= 0 && step <= 6;
  const validPosition = opening ? step === 0 && rank === 1
    : validStep && rank === step + 2 && ['game', 'promotion', 'reward'].includes(String(parsed.screen));
  if (parsed.version !== 1 || !validPosition || !Array.isArray(parsed.statuses) || parsed.statuses.length !== 6
    || !Array.isArray(parsed.powerUsed) || (['promotion', 'reward'].includes(String(parsed.screen)) && rank !== 8)) {
    throw new Error('Invalid game position.');
  }
  const base = createGame();
  const sharks = Array.isArray(parsed.sharks) ? parsed.sharks.map((shark) => ({ ...shark, questionIndex: Number.isInteger(shark.questionIndex) ? shark.questionIndex : 0 })) : base.sharks;
  const viewingStep = Number.isInteger(parsed.viewingStep) && Number(parsed.viewingStep) >= 0 && Number(parsed.viewingStep) < 6 ? Number(parsed.viewingStep) : null;
  return { ...base, ...parsed, rank, viewingStep, sharks, statuses: parsed.statuses as GameState['statuses'] } as GameState;
}
export function remainingSeconds(clock: GameState['clock'], now = Date.now()): number {
  if (!clock.startedAt) return clock.remaining;
  return Math.max(0, clock.remaining - Math.max(0, Math.floor((now - clock.startedAt) / 1000)));
}

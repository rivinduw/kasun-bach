import { ArrowRight } from 'lucide-react';
import { BRIDE, BROTHERHOOD, GROOM } from './game';

type Props = { action: string; onContinue: () => void };

export function Introduction({ action, onContinue }: Props) {
  return <section className="introduction page-in" aria-labelledby="intro-heading">
    <article className="personal-letter">
      <header className="letterhead"><span aria-hidden="true">♞</span><span>COLOMBO<br/>26 NOVEMBER 2026</span></header>
      <div className="eyebrow">RANK ONE · THE OPENING LETTER</div>
      <h1 id="intro-heading">Your move, {GROOM}.</h1>
      <p>Dear {GROOM},</p>
      <p>Before you and {BRIDE} head into married life, we wanted one evening with the six of us around the same table. So we made you a game. Naturally, we gave ourselves the easy job of judging it.</p>
      <p>You start tonight as a pawn on rank one. Waiting up the board are six sealed envelopes, including a sales pitch with you as the product. We’ll be your investors, your audience and, if you play your cards right, your backup singers.</p>
      <p>Make it to the eighth rank and you get to choose your piece. We’ve put a different promise behind each one. That part is on us.</p>
      <footer className="letter-signatures"><em>With love from the five of us,</em><strong>{BROTHERHOOD.slice(0, -1).join(', ')} &amp; {BROTHERHOOD[BROTHERHOOD.length - 1]}</strong></footer>
    </article>
    <aside className="intro-rules">
      <h2>Before the first move</h2>
      <ol>
        <li><strong>Pick a reader.</strong> One friend acts as Chief Arbiter and reads each envelope aloud.</li>
        <li><strong>Take your opening hand.</strong> Four power cards let you change a challenge or bring a friend along.</li>
        <li><strong>Move together.</strong> Complete, adapt, skip or defer a challenge. One tap updates the board on every phone.</li>
      </ol>
      <button className="primary-button" onClick={onContinue}>{action} <ArrowRight size={17}/></button>
    </aside>
  </section>;
}

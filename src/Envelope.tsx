import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';

export function Reveal({ opened, sealed, children }: {
  opened: boolean; sealed: (opening: boolean) => ReactNode; children: ReactNode;
}) {
  const [unsealed, setUnsealed] = useState(opened);
  const focusNext = useRef(false);
  const page = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!opened) { setUnsealed(false); return; }
    if (unsealed) return;
    focusNext.current = Boolean(document.activeElement?.closest('.mail-button'));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setUnsealed(true), reduced ? 0 : 1280);
    return () => window.clearTimeout(timer);
  }, [opened, unsealed]);
  useEffect(() => {
    if (opened && unsealed && focusNext.current) {
      page.current?.focus({ preventScroll: true });
      focusNext.current = false;
    }
  }, [opened, unsealed]);
  return opened && unsealed ? <div ref={page} tabIndex={-1} className="letter-arrival">{children}</div> : sealed(opened);
}

export function Envelope({ opening, onOpen, label, number, title }: {
  opening: boolean; onOpen: () => void; label: string; number: string; title: string;
}) {
  return <button type="button" className={`mail-button ${opening ? 'is-opening' : ''}`}
    onClick={opening ? undefined : onOpen} aria-disabled={opening} aria-label={label}>
    <span className="mail-art" aria-hidden="true">
      <span className="mail-back" />
      <span className="mail-letter"><small>THE PAWN’S PROMOTION</small><strong>{title}</strong><i /></span>
      <span className="mail-pocket" /><span className="mail-left"/><span className="mail-right"/><span className="mail-front"/>
      <span className="mail-flap"><span /></span>
      <span className="mail-seal">♞</span>
      <span className="mail-address">For Kasun</span>
      <span className="mail-stamp">COLOMBO<br/>{number}</span>
    </span>
    <span className="mail-action">{opening ? 'Opening…' : label}<ArrowUpRight size={18} aria-hidden="true"/></span>
  </button>;
}

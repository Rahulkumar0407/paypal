"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A split-flap board, like an old station departures sign. When a character changes, the top leaf falls over the
 * old character and the new one is revealed, half by half. Decorative: the parent gives the real text to screen
 * readers. Reduced motion: characters simply change.
 */
function Cell({ char }: { char: string }) {
  const [shown, setShown] = useState({ now: char, before: char, turn: 0 });
  const last = useRef(char);
  useEffect(() => {
    if (char === last.current) return;
    const before = last.current;
    last.current = char;
    const frame = requestAnimationFrame(() => setShown((s) => ({ now: char, before, turn: s.turn + 1 })));
    return () => cancelAnimationFrame(frame);
  }, [char]);
  const { now, before, turn } = shown;
  return (
    <span className="flap-cell" aria-hidden>
      <span className="flap-half flap-top">
        <span>{now}</span>
      </span>
      <span className="flap-half flap-bottom">
        <span>{turn === 0 ? now : before}</span>
      </span>
      {turn > 0 ? (
        <>
          <span key={`a${turn}`} className="flap-half flap-top flap-leaf-out">
            <span>{before}</span>
          </span>
          <span key={`b${turn}`} className="flap-half flap-bottom flap-leaf-in">
            <span>{now}</span>
          </span>
        </>
      ) : null}
    </span>
  );
}

export function SplitFlap({ words, label }: { words: string[]; label: string }) {
  return (
    <span className="split-flap" role="img" aria-label={label}>
      {words.map((word, w) => (
        <span key={w} className="flap-word">
          {word.split("").map((c, i) => (
            <Cell key={i} char={c === " " ? " " : c} />
          ))}
        </span>
      ))}
    </span>
  );
}

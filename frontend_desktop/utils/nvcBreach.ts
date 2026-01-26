export type NvcBreach = {
  kind: string;
  needle: string;
  message: string;
};

function uniqByNeedle(items: NvcBreach[]) {
  const seen = new Set<string>();
  const out: NvcBreach[] = [];
  for (const it of items) {
    const k = `${it.kind}::${it.needle}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

/**
 * Phase 16: lightweight client-side scan for common NVC structural weaknesses.
 *
 * This is intentionally simple and deterministic. Server-side simulation also
 * returns structured breaches; this is for instant UX feedback.
 */
export function detectNvcBreaches(input: string): NvcBreach[] {
  const t = String(input || '').trim().toLowerCase();
  if (!t) return [];

  const out: NvcBreach[] = [];
  const push = (kind: string, needle: string, message: string) => {
    if (t.includes(needle)) out.push({ kind, needle, message });
  };

  // Absolutes
  for (const w of ['always', 'never']) {
    push(
      'absolute',
      w,
      'Absolutes can land as character judgments. Swap for a specific recent example (e.g., “yesterday”, “this week”).'
    );
  }

  // Judgement words (not exhaustive)
  for (const w of ['wrong', 'bad', 'ridiculous', 'selfish', 'lazy', 'crazy', 'stupid']) {
    push(
      'judgment',
      w,
      'Judgment labels often trigger defensiveness. Try describing an observable behavior and the impact on you.'
    );
  }

  // Directives
  for (const w of ['you should', 'you need to', 'you have to']) {
    push(
      'directive',
      w,
      'Directive language often triggers resistance. Try “Would you be willing to…”.'
    );
  }

  // Blame patterns
  for (const w of ['you make me feel', 'because you', 'your fault']) {
    push(
      'blame',
      w,
      'This reads as blame. Try: “When I notice…, I feel…, because I need… Would you be willing to…”.'
    );
  }

  // “You are” (evaluation)
  push(
    'you_statement',
    'you are',
    '“You are…” often lands as evaluation. Consider an Observation instead (what you saw/heard, time-bounded).'
  );

  return uniqByNeedle(out);
}


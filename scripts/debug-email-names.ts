import {
  parseGluedEmailLocalPart,
  parseIntelligentNameFromEmail,
  isAcceptedEmailDerivedName,
  recoverSummaryFromRawText,
  isInvalidImportSummary,
  enrichPartialNameFromEmail,
} from '../lib/resume-parser/import-sanitize';

const emails = ['cssyedmujahidali12@gmail.com', 'goursurbhi19@gmail.com'];

for (const email of emails) {
  const local = email.split('@')[0].replace(/\d/g, '');
  console.log('\n===', email, 'local:', local, '===');
  const intel = parseIntelligentNameFromEmail(email);
  const glued = parseGluedEmailLocalPart(local);
  console.log('intel:', intel);
  console.log('glued:', glued);

  const s = local.toLowerCase().replace(/[^a-z]/g, '');
  const GLUED = /^(?:cs|ca|cma|cfa|cpa|mba|llb|dr)(?=[a-z]{6,})/;
  const bodies: Array<{ body: string; bonus: number }> = [];
  const seen = new Set<string>();
  const add = (body: string, bonus = 0) => {
    if (body.length >= 6 && !seen.has(body)) {
      seen.add(body);
      bodies.push({ body, bonus });
    }
  };
  add(s, 0);
  let cur = s;
  for (let i = 0; i < 2; i++) {
    const m = cur.match(GLUED);
    if (!m) break;
    cur = cur.slice(m[0].length);
    add(cur, 12);
  }
  console.log('bodies:', bodies);

  const COMMON_SHORT = new Set(['ali', 'raj', 'dev', 'joy', 'sam', 'ray', 'roy', 'sur', 'das', 'deo', 'syed']);
  function score(parts: string[], bonus: number) {
    let sc = 0;
    for (const p of parts) {
      if (p.length >= 4 && p.length <= 8) sc += p.length + 3;
      else if (p.length === 3 && COMMON_SHORT.has(p)) sc += 6;
      else if (p.length === 3) sc -= 12;
      else if (p.length <= 9) sc += 5;
      else sc += 1;
      if (/^(cs|ca|cma|css|cssy|mba|llb|cpa|cfa)$/i.test(p)) sc -= 14;
    }
    if (parts.length === 2) sc += 12;
    if (parts.length === 3) sc += 8;
    if (parts.length === 2 && parts[0].length > 6) sc -= 16;
    return sc + bonus;
  }

  const ranked: Array<{ label: string; score: number; accepted: boolean }> = [];
  for (const { body, bonus } of bodies) {
    for (let lastLen = 3; lastLen <= Math.min(12, body.length - 3); lastLen++) {
      const last = body.slice(-lastLen);
      const rest = body.slice(0, -lastLen);
      for (let split = 3; split <= rest.length - 3; split++) {
        const first = rest.slice(0, split);
        const middle = rest.slice(split);
        if (first.length < 3 || middle.length < 3) continue;
        if (first.length < 4 && middle.length < 4) continue;
        const parts = [first, middle, last];
        const combined = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        ranked.push({
          label: parts.join('+'),
          score: score(parts, bonus),
          accepted: isAcceptedEmailDerivedName(combined),
        });
      }
      const combined2 = [rest, last].map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      ranked.push({
        label: `${rest}|${last}`,
        score: score([rest, last], bonus),
        accepted: isAcceptedEmailDerivedName(combined2),
      });
    }
  }
  ranked.sort((a, b) => b.score - a.score);
  console.log('top accepted:');
  for (const r of ranked.filter((x) => x.accepted).slice(0, 8)) {
    console.log(`  ${r.score}\t${r.label}`);
  }
}

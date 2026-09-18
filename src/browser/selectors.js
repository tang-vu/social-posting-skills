// Selector resolution against a simplified DOM tree (fixtures + tests).
// The agent's real browser tooling maps these same rules onto the live DOM.
//
// Resolution contract — the anti-"click a nearby button" guard:
//   exactly one match  → resolved
//   zero matches       → { status: "missing" }   → playbook aborts
//   >1 matches         → { status: "ambiguous" } → playbook aborts
//
// Supported selector forms in candidate lists:
//   [attr='v']          attribute equality
//   [attr*='v' i]       attribute contains (i = case-insensitive)
//   [attr^='v']         attribute starts-with
//   tag                 tag name
//   tag[attr='v']       tag + attribute
//   button:has-text('x')    tag containing text
//   div[role='button']:has-text('x')
//   text=x              element whose text contains x (challenge detection)
//   #id                 id selector
//   .class              class selector

export function resolveSelector(selector, root) {
  const matches = findMatches(selector, root);
  if (matches.length === 0) return { status: "missing", matches: [] };
  if (matches.length > 1) return { status: "ambiguous", matches };
  return { status: "resolved", matches: [matches[0]], element: matches[0] };
}

// Try a candidate list in order; first candidate to resolve uniquely wins.
// A candidate that matches ambiguously does NOT fall through silently —
// ambiguity is reported because picking any of N matches is a guess.
export function resolveCandidates(candidates, root) {
  const attempts = [];
  for (const sel of candidates) {
    const res = resolveSelector(sel, root);
    attempts.push({ selector: sel, status: res.status, matchCount: res.matches.length });
    if (res.status === "resolved") {
      return { status: "resolved", element: res.element, selector: sel, attempts };
    }
    if (res.status === "ambiguous") {
      return { status: "ambiguous", selector: sel, attempts };
    }
  }
  return { status: "missing", attempts };
}

function* walk(node) {
  if (!node) return;
  yield node;
  for (const child of node.children ?? []) yield* walk(child);
}

function attr(node, name) {
  return node.attrs?.[name];
}

function nodeText(node) {
  let t = node.text ?? "";
  for (const c of node.children ?? []) t += " " + nodeText(c);
  return t;
}

function findMatches(selector, root) {
  const out = [];
  for (const node of walk(root)) {
    if (matchesSelector(node, selector)) out.push(node);
  }
  return out;
}

export function matchesSelector(node, selector) {
  const sel = selector.trim();

  // text=phrase
  if (sel.startsWith("text=")) {
    const needle = sel.slice(5).toLowerCase();
    return nodeText(node).toLowerCase().includes(needle);
  }

  // tag:has-text('x') or tag[attr]:has-text('x')
  const hasText = sel.match(/^(.*):has-text\('(.+)'\)$/);
  if (hasText) {
    const [, base, text] = hasText;
    return matchesSelector(node, base) && nodeText(node).includes(text);
  }

  // #id / .class
  if (sel.startsWith("#")) return attr(node, "id") === sel.slice(1);
  if (sel.startsWith(".")) return (attr(node, "class") ?? "").split(/\s+/).includes(sel.slice(1));

  // [attr='v'] / [attr*='v' i] / [attr^='v'] / [attr]
  const attrOnly = sel.match(/^\[([\w-]+)([*^]?)=?'([^']*)'?\s*(i?)\]$|^\[([\w-]+)\]$/);
  if (attrOnly) {
    if (attrOnly[5]) return attr(node, attrOnly[5]) !== undefined;
    const [, name, op, val, ci] = attrOnly;
    const actual = attr(node, name);
    if (actual === undefined) return false;
    const a = ci ? String(actual).toLowerCase() : String(actual);
    const v = ci ? val.toLowerCase() : val;
    if (op === "*") return a.includes(v);
    if (op === "^") return a.startsWith(v);
    return a === v;
  }

  // tag[attr='v'] (single attr suffix)
  const tagAttr = sel.match(/^([\w-]+)\[([\w-]+)([*^]?)=?'([^']*)'?\s*(i?)\]$/);
  if (tagAttr) {
    const [, tag, name, op, val, ci] = tagAttr;
    if ((node.tag ?? "").toLowerCase() !== tag.toLowerCase()) return false;
    const actual = attr(node, name);
    if (actual === undefined) return false;
    const a = ci ? String(actual).toLowerCase() : String(actual);
    const v = ci ? val.toLowerCase() : val;
    if (op === "*") return a.includes(v);
    if (op === "^") return a.startsWith(v);
    return a === v;
  }

  // plain tag
  if (/^[\w-]+$/.test(sel)) return (node.tag ?? "").toLowerCase() === sel.toLowerCase();

  return false; // unsupported selector form → treat as non-matching, never guess
}

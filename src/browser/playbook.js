// Agent-browser playbooks. When no official API is used, the agent performs
// publishing through its own browser tooling — but NEVER free-form. The
// playbook is a bounded, explicit step list with abort conditions:
//
//   - selectors are candidate lists, most-stable first
//   - resolution MUST return exactly one element; zero or many → abort
//   - challenge/CAPTCHA/security check detected → abort, preserve draft
//   - every wait is bounded; there is no "wait forever"
//   - after submit, verify once; ambiguous result → "unknown", never re-submit

import { nowIso } from "../core/util.js";

export function buildPlaybook(campaign, item, platform) {
  const auto = platform.automation ?? {};
  const sel = auto.selectors ?? {};
  const c = item.content ?? {};
  const steps = [];
  let n = 0;
  const step = (s) => steps.push({ n: ++n, ...s });

  const entryUrl = (auto.entryUrl ?? "").replace(
    "{subreddit}",
    item.target?.subreddit ?? ""
  );

  step({ action: "navigate", url: entryUrl || platform.displayName });
  step({
    action: "wait-for",
    target: "page-ready",
    selectors: sel.composer ?? sel.titleInput ?? sel.composeTrigger ?? [],
    timeoutMs: auto.boundedWaitMs ?? 8000,
    onFail: "abort",
  });
  step({
    action: "assert-absent",
    target: "challenge",
    selectors: sel.challenge ?? [],
    onFail: "abort-challenge",
    note: "CAPTCHA/security challenge → stop. Never bypass.",
  });

  if (sel.composeTrigger) {
    step({ action: "click", target: "composeTrigger", selectors: sel.composeTrigger, onFail: "abort" });
  }
  if (c.title && sel.titleInput) {
    step({ action: "type", target: "titleInput", selectors: sel.titleInput, text: c.title, onFail: "abort" });
  }
  if (c.url && sel.urlInput) {
    step({ action: "type", target: "urlInput", selectors: sel.urlInput, text: c.url, onFail: "abort" });
  }

  const bodyTarget = sel.bodyInput ? "bodyInput" : "composer";
  const bodySelectors = sel.bodyInput ?? sel.composer ?? [];
  const texts = c.thread?.length ? c.thread.map((p) => p.text) : c.body ? [c.body] : [];

  if (texts.length) {
    step({
      action: "type",
      target: bodyTarget,
      selectors: bodySelectors,
      text: texts[0],
      chunking: { chunkSize: 100, pauseMs: 150 },
      onFail: "abort",
    });
  }

  // thread: platform-specific composer mechanics
  if (c.thread?.length > 1) {
    if (platform.thread?.style === "composer-chain" && sel.addToThread) {
      for (let i = 1; i < c.thread.length; i++) {
        step({ action: "click", target: "addToThread", selectors: sel.addToThread, onFail: "abort" });
        step({
          action: "type",
          target: `thread[${i}]`,
          selectors: bodySelectors,
          text: c.thread[i].text,
          chunking: { chunkSize: 100, pauseMs: 150 },
          onFail: "abort",
        });
      }
    } else if (platform.thread?.style === "reply-chain") {
      step({
        action: "note",
        text: "Platform has no multi-post composer. Post first, then reply to it for each remaining post. Each reply is its own verify step.",
      });
    }
  }

  if (c.subtitle && sel.subtitleInput) {
    step({ action: "type", target: "subtitleInput", selectors: sel.subtitleInput, text: c.subtitle, onFail: "abort" });
  }
  if (item.target?.subreddit && platform.id === "reddit" && sel.flairButton) {
    step({
      action: "click-if-required",
      target: "flairButton",
      selectors: sel.flairButton,
      note: "Select the flair required by the subreddit. If none fits, abort and ask the user.",
    });
  }

  step({
    action: "click",
    target: platform.id === "hackernews" ? "submitButton" : sel.publishButton ? "publishButton" : "postButton",
    selectors: sel.submitButton ?? sel.publishButton ?? sel.postButton ?? [],
    onFail: "abort",
  });
  step({
    action: "verify-published",
    timeoutMs: auto.boundedWaitMs ?? 8000,
    capture: ["postUrl", "postId"],
    note: "Confirm the post exists exactly once. If you cannot tell whether it published, report 'unknown' — do NOT submit again.",
  });
  if (c.firstComment) {
    step({
      action: "reply-to-own-post",
      text: c.firstComment,
      note: "First-comment/link reply per campaign link strategy.",
      onFail: "report-partial",
    });
  }

  return {
    schemaVersion: 1,
    generatedAt: nowIso(),
    platform: platform.id,
    platformName: platform.displayName,
    itemId: item.id,
    campaignId: campaign.id,
    accountHint: item.accountHint,
    boundedWaitMs: auto.boundedWaitMs ?? 8000,
    steps,
    payload: {
      title: c.title ?? null,
      subtitle: c.subtitle ?? null,
      url: c.url ?? null,
      body: c.body ?? null,
      thread: c.thread ?? null,
      firstComment: c.firstComment ?? null,
      media: (item.content?.mediaRefs ?? []).map((r) => {
        const a = campaign.assets?.find((x) => x.id === r || x.path === r || x.fileName === r);
        return a ? { path: a.path, altText: a.altText } : { ref: r };
      }),
      disclosures: c.disclosures ?? [],
    },
    abortConditions: [
      { on: "challenge-detected", do: "abort — leave post unpublished, preserve draft" },
      { on: "selector-miss-or-ambiguous", do: "abort — UI changed; do not click a nearby look-alike" },
      { on: "timeout", do: "abort — report the step that timed out" },
      { on: "login-expired", do: "abort — ask user to re-login in their own browser" },
      { on: "ambiguous-publish-state", do: "report 'unknown' with reconciliation steps — never re-submit" },
    ],
    completionReport: {
      success: "campaign record <id> --item <itemId> --url <postUrl>",
      partial: "campaign record <id> --item <itemId> --partial --url <firstPostUrl> --published <k>",
      failed: "campaign record <id> --item <itemId> --failed --error '<why>'",
      unknown: "campaign record <id> --item <itemId> --unknown --error '<what happened>'",
    },
  };
}

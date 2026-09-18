// Scheduling — explicit intent only. Persisted plannedAt + timezone per item,
// no background daemon: `publish --due` executes whatever is due when invoked.
// State survives restarts because it lives in campaign.json.

import { nowIso } from "./util.js";

export function setSchedule(campaign, itemRef, { plannedAt, timezone = null }) {
  const item = campaign.items.find(
    (i) => i.id === itemRef || i.id.endsWith("::" + itemRef) || i.platform === itemRef
  );
  if (!item) throw new Error(`Item not found: ${itemRef}`);
  const t = new Date(plannedAt);
  if (Number.isNaN(t.getTime())) throw new Error(`Bad plannedAt: ${plannedAt}`);
  if (timezone) assertTimezone(timezone);
  item.plannedAt = t.toISOString();
  item.timezone = timezone ?? campaign.schedule?.timezone ?? null;
  campaign.schedule ??= { timezone: null, entries: [] };
  if (timezone && !campaign.schedule.timezone) campaign.schedule.timezone = timezone;
  const entry = campaign.schedule.entries.find((e) => e.itemId === item.id);
  if (entry) {
    entry.plannedAt = item.plannedAt;
    entry.timezone = item.timezone;
  } else {
    campaign.schedule.entries.push({ itemId: item.id, plannedAt: item.plannedAt, timezone: item.timezone });
  }
  item.history.push({ at: nowIso(), event: "scheduled", detail: item.plannedAt });
  return item;
}

export function clearSchedule(campaign, itemRef) {
  const item = campaign.items.find(
    (i) => i.id === itemRef || i.id.endsWith("::" + itemRef) || i.platform === itemRef
  );
  if (!item) throw new Error(`Item not found: ${itemRef}`);
  item.plannedAt = null;
  item.timezone = null;
  if (campaign.schedule?.entries) {
    campaign.schedule.entries = campaign.schedule.entries.filter((e) => e.itemId !== item.id);
  }
  item.history.push({ at: nowIso(), event: "unscheduled" });
}

function assertTimezone(tz) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
  } catch {
    throw new Error(`Unknown IANA timezone: ${tz} (e.g. "Asia/Ho_Chi_Minh", "America/New_York")`);
  }
}

// Items ready to publish right now: approved + plannedAt <= now.
export function dueItems(campaigns, { now = new Date() } = {}) {
  const due = [];
  for (const c of campaigns) {
    for (const i of c.items ?? []) {
      if (i.status === "approved" && i.plannedAt && new Date(i.plannedAt) <= now) {
        due.push({ campaignId: c.id, itemId: i.id, platform: i.platform, plannedAt: i.plannedAt });
      }
    }
  }
  return due.sort((a, b) => a.plannedAt.localeCompare(b.plannedAt));
}

// Lightweight calendar view: planned / approved / published / failed.
export function calendarView(campaigns, { from = null, to = null } = {}) {
  const rows = [];
  for (const c of campaigns) {
    for (const i of c.items ?? []) {
      const when = i.plannedAt ?? i.receipt?.at ?? null;
      if (from && when && when < from) continue;
      if (to && when && when > to) continue;
      rows.push({
        when,
        timezone: i.timezone ?? c.schedule?.timezone ?? null,
        campaignId: c.id,
        itemId: i.id,
        platform: i.platform,
        status: i.status,
        planned: !!i.plannedAt,
        postUrl: i.receipt?.postUrl ?? null,
      });
    }
  }
  return rows.sort((a, b) => (a.when ?? "").localeCompare(b.when ?? ""));
}

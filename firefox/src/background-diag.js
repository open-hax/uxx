// SPDX-License-Identifier: GPL-3.0-or-later
//
// src/background-diag.js — keyboard-triggered theming diagnostic (DIAGNOSTIC
// BUILD ONLY; gated by `__UXX_DIAG__`, tree-shaken from the production bundle).
//
// Flow: user presses the `uxx-diagnose` command key on the tab they are
// looking at → ask that tab's TOP frame for a report → POST it to the local
// listener. Nothing leaves the machine; no new permission is needed because
// `<all_urls>` already covers http://127.0.0.1.
//
// Failures are loud: the tab badge shows `!` and the cause goes to the console
// (never swallowed, never a silent fallback).

import { DIAG_ENDPOINT, DIAG_MESSAGE, DIAG_SCHEMA } from './diag-constants.js';

export const DIAG_COMMAND = 'uxx-diagnose';
export const DIAG_HEADER = 'X-Uxx-Diag';

export async function runDiagnose(
  api,
  { fetchImpl = (...args) => globalThis.fetch(...args), endpoint = DIAG_ENDPOINT } = {},
) {
  const [tab] = await api.tabs.query({ active: true, currentWindow: true });
  if (!tab || tab.id == null) return { ok: false, error: 'no-active-tab' };
  // Tab-scoped, so it clears itself on navigation and never clobbers the
  // global on/off badge.
  const badge = (text) => api.action.setBadgeText({ text, tabId: tab.id });

  let report;
  try {
    report = await api.tabs.sendMessage(tab.id, { type: DIAG_MESSAGE }, { frameId: 0 });
  } catch (error) {
    await badge('!');
    return { ok: false, error: `content-unreachable: ${error && error.message}` };
  }
  if (!report || report.schema !== DIAG_SCHEMA) {
    await badge('!');
    return { ok: false, error: 'bad-report' };
  }

  const body = JSON.stringify(report);
  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [DIAG_HEADER]: '1' },
      body,
    });
    if (!response.ok) throw new Error(`listener answered ${response.status}`);
    await badge('✓');
    return { ok: true, bytes: body.length };
  } catch (error) {
    await badge('!');
    return { ok: false, error: `post-failed: ${error && error.message}` };
  }
}

// Stage beacon: tells the local listener how far the chain got, so a failure is
// attributable (command never fired / tab lookup / delivery / network) instead
// of silent. Carries a stage name and a short error string — never page data.
export async function stage(
  name,
  detail = '',
  { fetchImpl = (...args) => globalThis.fetch(...args), endpoint = DIAG_ENDPOINT } = {},
) {
  try {
    await fetchImpl(endpoint.replace(/\/report$/, '/stage'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [DIAG_HEADER]: '1' },
      body: JSON.stringify({ stage: String(name).slice(0, 40), detail: String(detail).slice(0, 200) }),
    });
  } catch (error) {
    console.error('[uxx-diag] stage beacon failed:', name, error && error.message);
  }
}

export function wireDiagnose(api, options) {
  const onCommand = api.commands && api.commands.onCommand;
  if (!onCommand) {
    console.error('[uxx-diag] no commands API; diagnostic key unavailable');
    return false;
  }
  onCommand.addListener((command) => {
    if (command !== DIAG_COMMAND) return;
    stage('command-fired', '', options);
    runDiagnose(api, options).then(
      (result) => {
        if (result.ok) return stage('sent', `${result.bytes}B`, options);
        console.error('[uxx-diag] failed:', result.error);
        return stage('failed', result.error, options);
      },
      (error) => {
        console.error('[uxx-diag] threw:', error);
        return stage('threw', error && error.message, options);
      },
    );
  });
  return true;
}

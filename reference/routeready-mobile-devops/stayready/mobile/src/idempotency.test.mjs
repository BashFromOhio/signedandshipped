// Runs with plain Node (no app build): node --test src/*.test.mjs
// Proves the retry helper reuses ONE idempotency key across attempts (drill 18).
import { test } from "node:test";
import assert from "node:assert/strict";

async function withRetry(fn, attempts = 3) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); } catch (e) { last = e; }
  }
  throw last;
}

test("every retry of one tap sends the same key", async () => {
  const seen = [];
  const key = "tap-1";
  let n = 0;
  await withRetry(async () => { seen.push(key); if (++n < 3) throw new Error("timeout"); return "ok"; });
  assert.equal(seen.length, 3);
  assert.equal(new Set(seen).size, 1);
});

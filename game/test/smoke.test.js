// Smoke test: the game loads. The acceptance test is a person looking at it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const GAME = join(dirname(fileURLToPath(import.meta.url)), "..");

test("the game loads and the engine advances a generation", async () => {
  const html = readFileSync(join(GAME, "index.html"), "utf8");
  assert.match(html, /<script type="module" src="\.\/src\/main\.js"><\/script>/);

  // Resolves every relative import the browser follows, including ../lineage-m1/src.
  await import("../src/main.js");
  await import("../src/moments.js"); // loaded only with ?moment= (design shortcuts)

  const { Bridge } = await import("../src/bridge.js");
  const fixture = JSON.parse(readFileSync(join(GAME, "..", "lineage-m1", "fixtures", "defining_fixture_v1.json"), "utf8"));
  const bridge = Bridge.fromFixture(fixture, 6);
  bridge.followFamilyOf(bridge.living[0].id);
  const ev = bridge.step();
  assert.equal(ev.generation, 1);
  assert.equal(bridge.generation, 1);
});

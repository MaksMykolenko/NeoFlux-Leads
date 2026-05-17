import assert from "node:assert/strict";
import test from "node:test";
import { getFluxPromoteProject } from "../src/lib/promotion/fluxPromoteProfiles";
import {
  calculateProjectFitScore,
  clampScore,
} from "../src/lib/promotion/projectFitScore";

test("Project Fit Score is always clamped to 0-100", () => {
  assert.equal(clampScore(-5), 0);
  assert.equal(clampScore(101), 100);
  assert.equal(clampScore(Number.NaN), 0);
});

test("scoring returns a 0-100 score with breakdown", () => {
  const project = getFluxPromoteProject("unitymcp");
  assert.ok(project);

  const result = calculateProjectFitScore({
    project,
    target: {
      name: "Unity AI tools maintainer",
      audienceType: "Unity developer",
      platform: "GitHub",
      socialUrl: "https://github.com/example",
      notes: "Open-source developer posting about Unity editor automation and AI tooling.",
      language: "English",
    },
    language: "English",
    region: "Global",
  });

  assert.ok(result.score >= 0 && result.score <= 100);
  assert.ok(result.breakdown.length > 0);
});

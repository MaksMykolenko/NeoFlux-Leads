import assert from "node:assert/strict";
import test from "node:test";
import {
  FLUX_PROMOTE_COMPANIES,
  FLUX_PROMOTE_PROJECTS,
  getFluxPromoteProjectsForCompany,
} from "../src/lib/promotion/fluxPromoteProfiles";

test("company config contains NeoFlux Software and NeoFlux Games", () => {
  assert.deepEqual(
    FLUX_PROMOTE_COMPANIES.map((company) => company.name).sort(),
    ["NeoFlux Games", "NeoFlux Software"],
  );
});

test("projects are filtered by company", () => {
  const software = getFluxPromoteProjectsForCompany("neoflux-software");
  const games = getFluxPromoteProjectsForCompany("neoflux-games");

  assert.ok(software.length > 0);
  assert.ok(games.length > 0);
  assert.ok(software.every((project) => project.companyId === "neoflux-software"));
  assert.ok(games.every((project) => project.companyId === "neoflux-games"));
});

test("every predefined project has audiences, keywords, and outreach angles", () => {
  for (const project of FLUX_PROMOTE_PROJECTS) {
    assert.ok(project.targetAudiences.length > 0, `${project.id} missing audiences`);
    assert.ok(project.keywords.length > 0, `${project.id} missing keywords`);
    assert.ok(project.outreachAngles.length > 0, `${project.id} missing angles`);
  }
});

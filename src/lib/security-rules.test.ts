import { describe, it as test } from "node:test";
import { strict as assert } from "node:assert";
import { canUseAdultAi, getWorkspaceRole, workspaceHome } from "./security-rules";

describe("Phase 1 account rules", () => {
  test("teachers use the teacher workspace, not a student dashboard", () => {
    assert.equal(workspaceHome(getWorkspaceRole(["teacher"]), "kids"), "/teach/dashboard");
  });
  test("administrators retain the administrator workspace", () => {
    assert.equal(workspaceHome(getWorkspaceRole(["admin", "teacher"]), "adults"), "/admin-dashboard");
  });
  test("child AI is denied even if its track is forged as adults", () => {
    assert.equal(canUseAdultAi({ account_type: "child", track: "adults" }), false);
  });
  test("the shared parent/kids workspace cannot enable child AI", () => {
    assert.equal(canUseAdultAi({ account_type: "parent", track: "kids" }), false);
  });
  test("adult AI remains available for adult accounts", () => {
    assert.equal(canUseAdultAi({ account_type: "adult", track: "adults" }), true);
  });
  test("a missing profile cannot use AI", () => {
    assert.equal(canUseAdultAi(null), false);
  });
});
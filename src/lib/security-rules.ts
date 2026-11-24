export type WorkspaceRole = "admin" | "teacher" | "student";

export function getWorkspaceRole(roles: readonly string[]): WorkspaceRole {
  return roles.includes("admin") ? "admin" : roles.includes("teacher") ? "teacher" : "student";
}

export function workspaceHome(role: WorkspaceRole, track: string | null) {
  return role === "admin" ? "/admin-dashboard" : role === "teacher" ? "/teach/dashboard" : track === "kids" ? "/kids" : "/adults";
}

export function canUseAdultAi(profile: { account_type: string; track: string | null } | null) {
  return profile?.account_type === "adult" && profile.track === "adults";
}
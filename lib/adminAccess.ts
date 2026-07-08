import type { User } from "@supabase/supabase-js";

const DEFAULT_ADMIN_EMAILS = [
  "prem.pradeep97@gmail.com",
  "ravisalugu@gmail.com",
];

export function getAdminAllowedEmails(): string[] {
  const fromEnv = process.env.ADMIN_ALLOWED_EMAILS;
  if (fromEnv?.trim()) {
    return fromEnv
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }
  return DEFAULT_ADMIN_EMAILS;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminAllowedEmails().includes(email.trim().toLowerCase());
}

export function isAdminUser(user: User | null | undefined): boolean {
  return isAdminEmail(user?.email);
}

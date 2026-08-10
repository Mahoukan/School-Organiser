import { eq } from "drizzle-orm";

import { getDatabase } from "../db/index.js";
import { userPreferences } from "../db/schema.js";
import { DEFAULT_USER_PREFERENCES, normalizeUserPreferences, validatePreferencePatch } from "../userPreferences.js";

export async function getUserPreferences(userId) {
  const rows = await getDatabase().select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  return normalizeUserPreferences(rows[0]);
}

export async function updateUserPreferences(userId, patch) {
  const errors = validatePreferencePatch(patch);
  if (Object.keys(errors).length) {
    const error = new Error(Object.values(errors)[0]);
    error.name = "PreferenceValidationError";
    error.errors = errors;
    throw error;
  }

  const values = { ...DEFAULT_USER_PREFERENCES, ...patch };
  const rows = await getDatabase().insert(userPreferences).values({ userId, ...values })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { ...patch, updatedAt: new Date() },
    })
    .returning();
  return normalizeUserPreferences(rows[0]);
}

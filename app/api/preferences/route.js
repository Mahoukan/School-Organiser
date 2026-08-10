import { AuthenticationRequiredError, requireCurrentUser } from "../../../lib/server/currentUser";
import { updateUserPreferences } from "../../../lib/server/userPreferences";

export async function PATCH(request) {
  try {
    const user = await requireCurrentUser();
    const preferences = await updateUserPreferences(user.id, await request.json());
    return Response.json({ preferences });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return Response.json({ error: "Authentication required." }, { status: 401 });
    if (error?.name === "PreferenceValidationError") return Response.json({ error: error.message, errors: error.errors }, { status: 400 });
    console.error("Appearance preference mutation failed.", { name: error?.name, code: error?.code });
    const status = error instanceof SyntaxError ? 400 : 503;
    return Response.json({ error: status === 400 ? "The preference request was not valid JSON." : "Appearance preferences could not be saved." }, { status });
  }
}

import { signIn } from "../../auth";

const errorMessages = {
  AccessDenied: "This Google account could not be verified for sign-in.",
  OAuthCallbackError: "Google sign-in could not be completed. Please try again.",
  Configuration: "Google sign-in is not configured yet. Please contact the organiser administrator.",
};

function safeReturnPath(value) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export default async function SignInPage({ searchParams }) {
  const query = await searchParams;
  const message = query.error ? errorMessages[query.error] ?? "Google sign-in was unsuccessful. Please try again." : "";
  const redirectTo = safeReturnPath(query.callbackUrl);
  return (
    <main className="signin-page">
      <section className="signin-card" aria-labelledby="signin-title">
        <span className="signin-mark" aria-hidden="true">SO</span>
        <h1 id="signin-title">School Organiser</h1>
        <p>Plan your timetable and lessons in one place.</p>
        {message && <p className="signin-error" role="alert">{message}</p>}
        <form action={async () => { "use server"; await signIn("google", { redirectTo }); }}>
          <button className="google-signin" type="submit">Continue with Google</button>
        </form>
      </section>
    </main>
  );
}

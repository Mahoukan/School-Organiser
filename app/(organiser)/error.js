"use client";

export default function OrganiserError({ retry }) {
  return <section className="route-error" role="alert">
    <h1>Something went wrong displaying this page.</h1>
    <p>Your saved organiser data has not been changed.</p>
    <button type="button" onClick={retry}>Try Again</button>
  </section>;
}

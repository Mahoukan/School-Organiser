import Link from "next/link";

export default function NotFound() {
  return <main className="route-error">
    <h1>Page not found.</h1>
    <p>The requested organiser page does not exist or is no longer available.</p>
    <Link href="/">Return to Today</Link>
  </main>;
}

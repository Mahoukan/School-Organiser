export default function SectionIntro({ title, description }) {
  return (
    <section className="section-intro" aria-labelledby="page-title">
      <h1 id="page-title">{title}</h1>
      <p>{description}</p>
    </section>
  );
}

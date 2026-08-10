import ReactMarkdown, { defaultUrlTransform } from "react-markdown";

import styles from "./lessons.module.css";

function MarkdownLink({ href, title, children }) {
  const isExternal = /^https?:\/\//i.test(href ?? "");

  return (
    <a
      href={href}
      title={title}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
}

function DisabledImage({ alt }) {
  return (
    <span className={styles.disabledImage} role="note">
      Image omitted{alt ? `: ${alt}` : ""}
    </span>
  );
}

export default function MarkdownContent({ children, emptyMessage }) {
  if (!children?.trim()) {
    return emptyMessage ? (
      <p className={styles.markdownEmpty}>{emptyMessage}</p>
    ) : null;
  }

  return (
    <div className={styles.markdownContent}>
      <ReactMarkdown
        components={{ a: MarkdownLink, img: DisabledImage }}
        urlTransform={defaultUrlTransform}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

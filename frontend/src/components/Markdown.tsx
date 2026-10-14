import { Fragment, type ReactNode } from "react";

/** **qalin** va oddiy matn — HTML kiritilmaydi (dangerouslySetInnerHTML ishlatilmaydi). */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>
  );
}

/** Maqolalar uchun minimal Markdown: ##/### sarlavha, paragraf, "- " va "1. " ro'yxatlar, **qalin**. */
export default function Markdown({ text }: { text: string }) {
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/);
  return (
    <div className="space-y-4 leading-relaxed text-gray-800 dark:text-gray-200">
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter(Boolean);
        if (lines[0]?.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold mt-6">{inline(lines[0].slice(4))}</h3>;
        if (lines[0]?.startsWith("## ")) return <h2 key={i} className="text-xl font-semibold mt-8">{inline(lines[0].slice(3))}</h2>;
        if (lines.every((l) => l.startsWith("- "))) {
          return <ul key={i} className="list-disc pl-6 space-y-1">{lines.map((l, j) => <li key={j}>{inline(l.slice(2))}</li>)}</ul>;
        }
        if (lines.every((l) => /^\d+\. /.test(l))) {
          return <ol key={i} className="list-decimal pl-6 space-y-1">{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\d+\. /, ""))}</li>)}</ol>;
        }
        return <p key={i}>{inline(lines.join(" "))}</p>;
      })}
    </div>
  );
}

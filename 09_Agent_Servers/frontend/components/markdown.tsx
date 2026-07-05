import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

const components: Components = {
  p: ({ className, ...props }) => (
    <p className={cn("leading-relaxed [&:not(:first-child)]:mt-3", className)} {...props} />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn("underline underline-offset-2 hover:no-underline", className)}
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul className={cn("ml-5 list-disc space-y-1 [&:not(:first-child)]:mt-3", className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol className={cn("ml-5 list-decimal space-y-1 [&:not(:first-child)]:mt-3", className)} {...props} />
  ),
  li: ({ className, ...props }) => <li className={cn("pl-1", className)} {...props} />,
  h1: ({ className, ...props }) => (
    <h1 className={cn("text-base font-semibold [&:not(:first-child)]:mt-4", className)} {...props} />
  ),
  h2: ({ className, ...props }) => (
    <h2 className={cn("text-base font-semibold [&:not(:first-child)]:mt-4", className)} {...props} />
  ),
  h3: ({ className, ...props }) => (
    <h3 className={cn("text-sm font-semibold [&:not(:first-child)]:mt-3", className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "border-l-2 border-current/20 pl-3 italic text-current/80 [&:not(:first-child)]:mt-3",
        className
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("my-3 border-current/20", className)} {...props} />
  ),
  table: ({ className, ...props }) => (
    <div className="[&:not(:first-child)]:mt-3 overflow-x-auto">
      <table className={cn("w-full border-collapse text-xs", className)} {...props} />
    </div>
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn("border border-current/20 px-2 py-1 text-left font-medium", className)}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td className={cn("border border-current/20 px-2 py-1 align-top", className)} {...props} />
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = /language-/.test(className ?? "");
    if (isBlock) {
      return (
        <code className={cn("font-mono text-xs", className)} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className={cn("rounded bg-current/10 px-1 py-0.5 font-mono text-[0.85em]", className)}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "[&:not(:first-child)]:mt-3 overflow-x-auto rounded-lg bg-current/10 p-3 text-xs",
        className
      )}
      {...props}
    />
  ),
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-sm [&>*:first-child]:mt-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

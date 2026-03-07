"use client";

import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
};

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "เขียนเนื้อหาแบบ Markdown...",
  minHeight = 320,
}: MarkdownEditorProps) {
  return (
    <div data-color-mode="light" className="markdown-editor-ghost">
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? "")}
        preview="edit"
        visibleDragbar={false}
        height={minHeight}
        enableScroll={true}
        textareaProps={{
          placeholder,
        }}
      />
    </div>
  );
}

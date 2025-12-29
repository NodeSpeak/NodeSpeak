"use client";

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Code from "@tiptap/extension-code";
import Link from "@tiptap/extension-link";
import type { MatrixEditorProps } from "./types";

/**
 * MatrixEditor - Rich text editor for post creation
 * Uses TipTap with Bold, Italic, Code, Link formatting
 */
export const MatrixEditor: React.FC<MatrixEditorProps> = ({
  content,
  setContent,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Bold,
      Italic,
      Code,
      Link.configure({ openOnClick: false }),
    ],
    content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800 focus:border-sky-400 dark:focus:border-sky-600 min-h-[150px] prose prose-sm dark:prose-invert max-w-none",
      },
    },
  });

  if (!editor) return null;

  const buttonBase = "px-3 py-1.5 text-xs border rounded-lg transition-colors";
  const buttonActive = "bg-slate-900 dark:bg-sky-500 text-white border-slate-900 dark:border-sky-500";
  const buttonInactive = "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600";

  const getClass = (active: boolean) => `${buttonBase} ${active ? buttonActive : buttonInactive}`;

  return (
    <div className="rich-editor">
      <div className="flex gap-2 mb-2 flex-wrap">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={getClass(editor.isActive("bold"))}>Bold</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={getClass(editor.isActive("italic"))}>Italic</button>
        <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} className={getClass(editor.isActive("code"))}>Code</button>
        <button type="button" onClick={() => { const url = window.prompt("URL"); if (url) editor.chain().focus().setLink({ href: url }).run(); }} className={getClass(editor.isActive("link"))}>Link</button>
        <button type="button" onClick={() => editor.chain().focus().unsetLink().run()} className={`${buttonBase} ${buttonInactive} disabled:opacity-50`} disabled={!editor.isActive("link")}>Unlink</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default MatrixEditor;

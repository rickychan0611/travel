'use client'

import { useRef, useState } from 'react'
import {
  Bold,
  Heading2,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Pilcrow,
  Redo2,
  Undo2,
} from 'lucide-react'

type Tool = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  command: string
  value?: string
}

const tools: Tool[] = [
  { label: 'Paragraph', icon: Pilcrow, command: 'formatBlock', value: 'p' },
  { label: 'Heading', icon: Heading2, command: 'formatBlock', value: 'h2' },
  { label: 'Bold', icon: Bold, command: 'bold' },
  { label: 'Italic', icon: Italic, command: 'italic' },
  { label: 'Bullet list', icon: List, command: 'insertUnorderedList' },
  { label: 'Numbered list', icon: ListOrdered, command: 'insertOrderedList' },
  { label: 'Undo', icon: Undo2, command: 'undo' },
  { label: 'Redo', icon: Redo2, command: 'redo' },
]

export function RichTextEditor({
  name,
  label,
  initialHtml,
}: {
  name: string
  label: string
  initialHtml: string
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [html, setHtml] = useState(initialHtml)

  function syncFromEditor() {
    setHtml(editorRef.current?.innerHTML ?? '')
  }

  function runCommand(command: string, value?: string) {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    syncFromEditor()
  }

  function createLink() {
    const href = window.prompt('Paste URL')
    if (!href) return
    runCommand('createLink', href)
  }

  function updateSource(value: string) {
    setHtml(value)
    if (editorRef.current) editorRef.current.innerHTML = value
  }

  return (
    <div className="block md:col-span-2">
      <div className="text-sm text-slate-700">{label}</div>
      <input type="hidden" name={name} value={html} />
      <div className="mt-1 overflow-hidden rounded-lg border border-slate-300 bg-white">
        <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <button
                key={`${tool.command}-${tool.value ?? ''}`}
                type="button"
                title={tool.label}
                aria-label={tool.label}
                onClick={() => runCommand(tool.command, tool.value)}
                className="inline-flex size-8 items-center justify-center rounded border border-transparent text-slate-700 hover:border-slate-300 hover:bg-white"
              >
                <Icon className="size-4" />
              </button>
            )
          })}
          <button
            type="button"
            title="Link"
            aria-label="Link"
            onClick={createLink}
            className="inline-flex size-8 items-center justify-center rounded border border-transparent text-slate-700 hover:border-slate-300 hover:bg-white"
          >
            <LinkIcon className="size-4" />
          </button>
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncFromEditor}
          onBlur={syncFromEditor}
          className="min-h-56 px-3 py-3 text-sm leading-6 text-slate-950 outline-none [&_a]:text-blue-700 [&_a]:underline [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-3 [&_ul]:list-disc"
          dangerouslySetInnerHTML={{ __html: initialHtml }}
        />
      </div>
      <details className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <summary className="text-sm font-medium text-slate-700">Edit HTML source</summary>
        <textarea
          value={html}
          onChange={(event) => updateSource(event.target.value)}
          rows={8}
          className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-950"
        />
      </details>
    </div>
  )
}

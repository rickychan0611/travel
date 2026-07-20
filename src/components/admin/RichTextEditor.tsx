'use client'

import { useCallback, useRef, useState } from 'react'
import {
  Bold,
  Code2,
  Heading2,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Pilcrow,
  Redo2,
  Type,
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
  const hiddenInputRef = useRef<HTMLInputElement>(null)
  const htmlRef = useRef(initialHtml)
  const [sourceHtml, setSourceHtml] = useState(initialHtml)
  const [mode, setMode] = useState<'rich' | 'html'>('rich')

  const attachEditor = useCallback((node: HTMLDivElement | null) => {
    editorRef.current = node
    if (node) node.innerHTML = htmlRef.current
  }, [])

  function updateFormValue(value: string) {
    htmlRef.current = value
    if (hiddenInputRef.current) hiddenInputRef.current.value = value
  }

  function syncFromEditor() {
    updateFormValue(editorRef.current?.innerHTML ?? '')
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
    setSourceHtml(value)
    updateFormValue(value)
  }

  function switchMode(nextMode: 'rich' | 'html') {
    if (nextMode === mode) return
    if (nextMode === 'html') {
      syncFromEditor()
      setSourceHtml(htmlRef.current)
    } else {
      updateFormValue(sourceHtml)
    }
    setMode(nextMode)
  }

  return (
    <div className="block md:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-slate-700">{label}</div>
        <div className="inline-flex rounded-lg border border-slate-300 bg-slate-50 p-0.5" role="group" aria-label={`${label} editor mode`}>
          <button
            type="button"
            aria-pressed={mode === 'rich'}
            onClick={() => switchMode('rich')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${mode === 'rich' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-950'}`}
          >
            <Type className="size-3.5" />
            Rich text
          </button>
          <button
            type="button"
            aria-pressed={mode === 'html'}
            onClick={() => switchMode('html')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${mode === 'html' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-950'}`}
          >
            <Code2 className="size-3.5" />
            HTML
          </button>
        </div>
      </div>
      <input ref={hiddenInputRef} type="hidden" name={name} defaultValue={initialHtml} />
      <div className="mt-1 overflow-hidden rounded-lg border border-slate-300 bg-white">
        {mode === 'rich' ? (
          <>
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
              ref={attachEditor}
              contentEditable
              suppressContentEditableWarning
              onInput={syncFromEditor}
              onBlur={syncFromEditor}
              className="min-h-56 px-3 py-3 text-sm leading-6 text-slate-950 outline-none [&_a]:text-blue-700 [&_a]:underline [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_img]:h-auto [&_img]:max-w-full [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-3 [&_ul]:list-disc"
            />
          </>
        ) : (
          <textarea
            value={sourceHtml}
            onChange={(event) => updateSource(event.target.value)}
            rows={12}
            spellCheck={false}
            aria-label={`${label} HTML source`}
            className="min-h-56 w-full resize-y px-3 py-3 font-mono text-xs leading-5 text-slate-950 outline-none"
          />
        )}
      </div>
    </div>
  )
}

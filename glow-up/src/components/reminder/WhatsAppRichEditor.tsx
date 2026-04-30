import { useRef, useEffect, useCallback } from "react";
import EmojiPicker from "./EmojiPicker";
import { Badge } from "@/components/ui/badge";
import { RotateCcw } from "lucide-react";

const VARIABLES = ["salon_name", "short_data", "date", "time", "link", "service_name", "client_name", "duration"];

/* ── WA markup ↔ HTML conversion ── */

/** Convert WhatsApp markup string → HTML for contentEditable display */
function waToHtml(wa: string): string {
  let html = wa
    // Escape HTML entities first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Convert newlines to <br>
    .replace(/\n/g, "<br>")
    // Bold: *text*
    .replace(/\*([^*\n]+)\*/g, "<strong>$1</strong>")
    // Italic: _text_
    .replace(/(?<![a-zA-Z0-9])_([^_\n]+)_(?![a-zA-Z0-9])/g, "<em>$1</em>")
    // Strikethrough: ~text~
    .replace(/~([^~\n]+)~/g, "<s>$1</s>");

  // Style variables and conditionals to stand out
  html = html.replace(/(\{\{#?\/??\w+\}\})/g, '<span class="wa-var" data-var="$1">$1</span>');

  return html;
}

/** Convert HTML from contentEditable → WhatsApp markup string */
function htmlToWa(html: string): string {
  // Create a temporary element to parse
  const div = document.createElement("div");
  div.innerHTML = html;

  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    let inner = "";
    for (const child of Array.from(el.childNodes)) {
      inner += walk(child);
    }

    switch (tag) {
      case "strong":
      case "b":
        return `*${inner}*`;
      case "em":
      case "i":
        return `_${inner}_`;
      case "s":
      case "del":
      case "strike":
        return `~${inner}~`;
      case "br":
        return "\n";
      case "div":
        // Divs created by contentEditable on Enter
        return inner ? "\n" + inner : "\n";
      case "span":
        // Pass through (includes our variable spans)
        return inner;
      default:
        return inner;
    }
  }

  let result = "";
  for (const child of Array.from(div.childNodes)) {
    result += walk(child);
  }

  // Clean up leading newline artifacts from div wrapping
  if (result.startsWith("\n")) {
    result = result.substring(1);
  }
  // Normalize multiple newlines
  result = result.replace(/\n{3,}/g, "\n\n");

  return result;
}

/* ── Component ── */

interface Props {
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
  rows?: number;
}

export default function WhatsAppRichEditor({ value, onChange, onReset, rows = 7 }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  // Sync value → editor HTML (only when value changes externally)
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    const editor = editorRef.current;
    if (!editor) return;
    const html = waToHtml(value);
    if (editor.innerHTML !== html) {
      editor.innerHTML = html;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    isInternalUpdate.current = true;
    const waText = htmlToWa(editor.innerHTML);
    onChange(waText);
  }, [onChange]);

  const execFormat = useCallback((command: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false);
    handleInput();
  }, [handleInput]);

  const insertAtCursor = useCallback((text: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    // Use insertHTML to put text at cursor
    document.execCommand("insertHTML", false, text.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
    handleInput();
  }, [handleInput]);

  const insertVariable = useCallback((varName: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const varTag = `{{${varName}}}`;
    const html = `<span class="wa-var" data-var="${varTag}">${varTag}</span>`;
    document.execCommand("insertHTML", false, html);
    handleInput();
  }, [handleInput]);

  const insertConditional = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const sel = window.getSelection();
    const selectedText = sel?.toString() || "";
    const varMatch = selectedText.match(/\{\{(\w+)\}\}/);
    const field = varMatch ? varMatch[1] : "field";
    const content = selectedText || `{{${field}}}`;
    const condStart = `{{#${field}}}`;
    const condEnd = `{{/${field}}}`;
    const html = `<span class="wa-var" data-var="${condStart}">${condStart}</span>${content}<span class="wa-var" data-var="${condEnd}">${condEnd}</span>`;
    document.execCommand("insertHTML", false, html);
    handleInput();
  }, [handleInput]);

  const insertEmoji = useCallback((emoji: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand("insertText", false, emoji);
    handleInput();
  }, [handleInput]);

  const minHeight = Math.max(rows * 24, 120);

  return (
    <div className="space-y-1.5">
      {/* Variables row */}
      <div className="flex flex-wrap gap-1">
        {VARIABLES.map(v => (
          <Badge key={v} variant="outline" className="text-[10px] px-1.5 py-0 cursor-pointer hover:bg-accent"
            onClick={() => insertVariable(v)}
          >
            {v}
          </Badge>
        ))}
        <button
          onClick={onReset}
          className="ml-auto text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>

      {/* Formatting toolbar */}
      <div className="flex items-center gap-1 border rounded-lg px-2 py-1 bg-muted/30">
        <button
          type="button"
          className="px-2 py-0.5 text-xs font-bold rounded hover:bg-accent transition-colors"
          title="Grassetto"
          onClick={() => execFormat("bold")}
        >
          B
        </button>
        <button
          type="button"
          className="px-2 py-0.5 text-xs italic rounded hover:bg-accent transition-colors"
          title="Corsivo"
          onClick={() => execFormat("italic")}
        >
          I
        </button>
        <button
          type="button"
          className="px-2 py-0.5 text-xs line-through rounded hover:bg-accent transition-colors"
          title="Barrato"
          onClick={() => execFormat("strikeThrough")}
        >
          S
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button
          type="button"
          className="px-2 py-0.5 text-[10px] rounded hover:bg-accent transition-colors font-mono"
          title="Campo condizionale — nasconde la riga se il campo è vuoto"
          onClick={insertConditional}
        >
          {"{{#}}"}
        </button>
        <span className="text-[9px] text-muted-foreground ml-1">Condizionale</span>
        <div className="w-px h-4 bg-border mx-1" />
        <EmojiPicker onSelect={insertEmoji} />
      </div>

      {/* Rich editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className="wa-rich-editor rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 overflow-y-auto"
        style={{ minHeight, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
        spellCheck
      />
    </div>
  );
}

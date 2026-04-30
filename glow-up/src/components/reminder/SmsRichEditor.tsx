import { useRef, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, AlertTriangle } from "lucide-react";
import { resolveSmsTemplate } from "./SmsTemplatePreview";

const VARIABLES = ["salon_name", "short_data", "date", "time", "link", "service_name", "client_name", "duration"];

const SMS_CHAR_LIMIT = 160;

/* ── Plain text ↔ HTML with styled variable badges ── */

function textToHtml(text: string): string {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  html = html.replace(
    /(\{\{\w+\}\})/g,
    '<span class="sms-var" data-var="$1">$1</span>'
  );

  return html;
}

function htmlToText(html: string): string {
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
      case "br":
        return "\n";
      case "div":
        return inner ? "\n" + inner : "\n";
      case "span":
        return inner;
      default:
        return inner;
    }
  }

  let result = "";
  for (const child of Array.from(div.childNodes)) {
    result += walk(child);
  }

  if (result.startsWith("\n")) {
    result = result.substring(1);
  }
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

export default function SmsRichEditor({ value, onChange, onReset, rows = 5 }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);
  const lastValidValue = useRef(value);

  // Compute resolved char count
  const resolvedText = resolveSmsTemplate(value);
  const charCount = resolvedText.length;
  const isOverLimit = charCount > SMS_CHAR_LIMIT;
  const remaining = SMS_CHAR_LIMIT - charCount;

  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    const editor = editorRef.current;
    if (!editor) return;
    const html = textToHtml(value);
    if (editor.innerHTML !== html) {
      editor.innerHTML = html;
    }
  }, [value]);

  // Keep track of last valid value
  useEffect(() => {
    if (!isOverLimit) {
      lastValidValue.current = value;
    }
  }, [value, isOverLimit]);

  const handleInput = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    isInternalUpdate.current = true;
    const text = htmlToText(editor.innerHTML);

    // Check if resolved text would exceed limit
    const resolved = resolveSmsTemplate(text);
    if (resolved.length > SMS_CHAR_LIMIT) {
      // Revert to last valid value
      isInternalUpdate.current = false;
      const html = textToHtml(lastValidValue.current);
      editor.innerHTML = html;
      // Place cursor at end
      const sel = window.getSelection();
      if (sel && editor.lastChild) {
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      return;
    }

    onChange(text);
  }, [onChange]);

  const insertVariable = useCallback((varName: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const varTag = `{{${varName}}}`;

    // Check if inserting would exceed limit
    const currentText = htmlToText(editor.innerHTML);
    const testText = currentText + varTag;
    const resolved = resolveSmsTemplate(testText);
    if (resolved.length > SMS_CHAR_LIMIT) return;

    const html = `<span class="sms-var" data-var="${varTag}">${varTag}</span>`;
    document.execCommand("insertHTML", false, html);
    handleInput();
  }, [handleInput]);

  const minHeight = Math.max(rows * 24, 100);

  return (
    <div className="space-y-1.5">
      {/* Variables row */}
      <div className="flex flex-wrap gap-1">
        {VARIABLES.map(v => (
          <Badge
            key={v}
            variant="outline"
            className="text-[10px] px-1.5 py-0 cursor-pointer hover:bg-pink-100 bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-950/30 dark:border-pink-800 dark:text-pink-300"
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

      {/* Rich editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className={`sms-rich-editor rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 overflow-y-auto ${
          isOverLimit ? "border-destructive focus-visible:ring-destructive" : "border-input focus-visible:ring-ring"
        }`}
        style={{ minHeight, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
        spellCheck
      />

      {/* Char counter */}
      <div className="flex items-center justify-between text-[11px]">
        <span className={`font-medium ${isOverLimit ? "text-destructive" : remaining <= 20 ? "text-amber-600" : "text-muted-foreground"}`}>
          {charCount}/{SMS_CHAR_LIMIT} caratteri
          {isOverLimit && (
            <span className="inline-flex items-center gap-0.5 ml-1">
              <AlertTriangle className="h-3 w-3" />
              Supera il limite!
            </span>
          )}
        </span>
        {!isOverLimit && remaining <= 30 && (
          <span className="text-amber-600">{remaining} rimanenti</span>
        )}
      </div>
    </div>
  );
}

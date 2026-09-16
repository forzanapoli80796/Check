import { useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Strikethrough,
  Underline,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isWhiteboardRichText,
  sanitizeWhiteboardMessage,
  whiteboardMessageHasText,
} from "@shared/whiteboard";

interface RichTextEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
}

interface EditorCommandButtonProps {
  label: string;
  command: string;
  children: React.ReactNode;
  onExecute: (command: string) => void;
}

function EditorCommandButton({
  label,
  command,
  children,
  onExecute,
}: EditorCommandButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(event) => {
        // Keep the current selection in the editor when the toolbar is used.
        event.preventDefault();
      }}
      onClick={() => onExecute(command)}
      className="inline-flex h-8 w-8 items-center justify-center rounded border border-transparent text-gray-600 hover:border-gray-300 hover:bg-white hover:text-gray-900"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  id,
  value,
  onChange,
  placeholder = "Nachricht eingeben…",
  className,
  "data-testid": testId,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor) return;

    const nextHtml = isWhiteboardRichText(value)
      ? sanitizeWhiteboardMessage(value)
      : value
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\r?\n/g, "<br>");

    if (editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml;
    }
  }, [value]);

  const handleInput = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const safeHtml = sanitizeWhiteboardMessage(editor.innerHTML);
    // innerHTML encodes typed plain-text characters such as "<". Keep
    // legacy/plain messages as actual text, while retaining HTML only when
    // formatting is present.
    onChange(isWhiteboardRichText(safeHtml) ? safeHtml : editor.innerText);
  };

  const executeCommand = (command: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false);
    handleInput();
  };

  return (
    <div className={cn("overflow-hidden rounded-md border border-input bg-background", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b bg-gray-50 px-2 py-1">
        <EditorCommandButton label="Fett" command="bold" onExecute={executeCommand}>
          <Bold className="h-4 w-4" />
        </EditorCommandButton>
        <EditorCommandButton label="Kursiv" command="italic" onExecute={executeCommand}>
          <Italic className="h-4 w-4" />
        </EditorCommandButton>
        <EditorCommandButton label="Unterstrichen" command="underline" onExecute={executeCommand}>
          <Underline className="h-4 w-4" />
        </EditorCommandButton>
        <EditorCommandButton
          label="Durchgestrichen"
          command="strikeThrough"
          onExecute={executeCommand}
        >
          <Strikethrough className="h-4 w-4" />
        </EditorCommandButton>
        <span className="mx-1 h-5 w-px bg-gray-300" aria-hidden="true" />
        <EditorCommandButton
          label="Aufzählung"
          command="insertUnorderedList"
          onExecute={executeCommand}
        >
          <List className="h-4 w-4" />
        </EditorCommandButton>
        <EditorCommandButton
          label="Nummerierte Liste"
          command="insertOrderedList"
          onExecute={executeCommand}
        >
          <ListOrdered className="h-4 w-4" />
        </EditorCommandButton>
      </div>
      <div
        id={id}
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        data-placeholder={placeholder}
        data-testid={testId}
        onInput={handleInput}
        onBlur={handleInput}
        suppressContentEditableWarning
        className="min-h-[100px] w-full px-3 py-2 text-base outline-none md:text-sm [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_ol]:ml-5 [&_ol]:list-decimal [&_ul]:ml-5 [&_ul]:list-disc"
      />
    </div>
  );
}

interface WhiteboardMessageProps {
  message: string;
  className?: string;
}

export function WhiteboardMessage({ message, className }: WhiteboardMessageProps) {
  const safeMessage = sanitizeWhiteboardMessage(message);

  if (!isWhiteboardRichText(safeMessage)) {
    return <p className={cn("whitespace-pre-wrap", className)}>{safeMessage}</p>;
  }

  return (
    <div
      className={cn(
        "whiteboard-rich-message whitespace-pre-wrap [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_ol]:ml-5 [&_ol]:list-decimal [&_ul]:ml-5 [&_ul]:list-disc",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: safeMessage }}
    />
  );
}

export { sanitizeWhiteboardMessage, whiteboardMessageHasText };
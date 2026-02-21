import arrowDown from "@/assets/arrow-down.svg?url";
import arrowRight from "@/assets/arrow-right.svg?url";
import { json } from "@codemirror/lang-json";
import { foldGutter, HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import CodeMirror, { BasicSetupOptions, ReactCodeMirrorProps } from "@uiw/react-codemirror";
import { useMemo } from "react";

const basicSetup: BasicSetupOptions = {
  highlightSpecialChars: false,
  history: false,
  drawSelection: true,
  syntaxHighlighting: true,
  lineNumbers: true,
  highlightActiveLineGutter: false,
  foldGutter: false,
  dropCursor: false,
  allowMultipleSelections: false,
  indentOnInput: false,
  bracketMatching: true,
  closeBrackets: false,
  autocompletion: false,
  rectangularSelection: false,
  crosshairCursor: false,
  highlightActiveLine: false,
  highlightSelectionMatches: true,
  defaultKeymap: true,
  historyKeymap: false,
  searchKeymap: true,
  foldKeymap: true,
  completionKeymap: false,
  closeBracketsKeymap: false,
  lintKeymap: false,
  tabSize: 2,
};

const theme = EditorView.theme(
  {
    // Editor
    "&": {
      height: "100%",
      backgroundColor: "var(--color-background)",
    },
    // Scroller
    ".cm-scroller": {
      fontFamily: "var(--font-mono)",
      fontSize: "11px",
    },
    // Gutters
    ".cm-gutters": {
      border: "none",
      color: "var(--color-muted-foreground)",
      backgroundColor: "var(--color-background)",
    },
    // Line numbers
    ".cm-lineNumbers": {
      minWidth: "40px",
    },
    // Line numbers element
    ".cm-lineNumbers .cm-gutterElement": {
      padding: "0 3px 0 9px",
    },
    // Fold gutter
    ".cm-foldGutter": {
      minWidth: "14px",
    },
    // Gutter fold element
    ".cm-gutterFoldElement": {
      display: "inline-flex",
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    // Gutter fold arrow
    ".cm-gutterFoldElement span": {
      display: "block",
      width: "8px",
      height: "8px",
      color: "var(--color-muted-foreground)",
      backgroundColor: "currentcolor",
    },
    // Gutter fold arrow (unfolded)
    ".cm-gutterFoldElement-unfolded span": {
      mask: `url("${arrowDown}") center / contain no-repeat`,
    },
    // Gutter fold arrow (folded)
    ".cm-gutterFoldElement-folded span": {
      mask: `url("${arrowRight}") center / contain no-repeat`,
    },
    // Fold placeholder
    ".cm-foldPlaceholder": {
      border: "none",
      color: "var(--color-muted-foreground)",
      backgroundColor: "var(--color-background)",
    },
    // Selection background
    ".cm-selectionBackground, ::selection": {
      background: "var(--color-muted)",
    },
    // Selection background (focused)
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": {
      background: "var(--color-muted)",
    },
    // Selection match
    ".cm-selectionMatch": {
      backgroundColor: "var(--color-muted)",
    },
    // Search match
    ".cm-searchMatch": {
      backgroundColor: "var(--color-warning)",
    },
    ".cm-searchMatch-selected": {
      border: "1px solid var(--color-warning)",
      backgroundColor: "transparent",
    },
    // Panels
    ".cm-panels": {
      color: "var(--color-foreground)",
      backgroundColor: "var(--color-background)",
    },
    ".cm-panels-top": {
      borderBottom: "1px solid var(--color-border)",
    },
    ".cm-panels-bottom": {
      borderTop: "1px solid var(--color-border)",
    },
    // Search panel
    ".cm-panel.cm-search": {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: "calc(var(--spacing) * 2)",
      padding: "calc(var(--spacing) * 2)",
      overflow: "hidden",
    },
    ".cm-panel.cm-search [name=close]": {
      fontSize: "1rem",
      color: "var(--color-foreground)",
      cursor: "pointer",
    },
    ".cm-panel.cm-search label": {
      display: "inline-flex",
      flexDirection: "row",
      gap: "calc(var(--spacing) * 1)",
      alignItems: "center",
      fontSize: "var(--text-xs)",
      color: "var(--color-foreground)",
      textTransform: "capitalize",
    },
    ".cm-panel.cm-search input[type=checkbox]": {
      margin: "0",
    },
    ".cm-panel.cm-search input, .cm-panel.cm-search button, .cm-panel.cm-search label": {
      margin: "0",
    },
    // Text field
    ".cm-textfield": {
      height: "1.5rem",
      padding: "calc(var(--spacing) * 1) calc(var(--spacing) * 2)",
      border: "1px solid var(--color-border)",
      borderRadius: "0.25rem",
      fontSize: "var(--text-xs)",
      color: "var(--color-foreground)",
      backgroundColor: "var(--color-background)",
    },
    ".cm-textfield:focus-visible": {
      border: "1px solid var(--color-border)",
      outline: "var(--color-border) solid 2px",
    },
    // Button
    ".cm-button": {
      height: "1.5rem",
      padding: "0 calc(var(--spacing) * 2)",
      border: "1px solid var(--color-border)",
      borderRadius: "0.25rem",
      fontSize: "var(--text-xs)",
      color: "var(--color-foreground)",
      backgroundImage: "none",
      backgroundColor: "var(--color-background)",
      cursor: "pointer",
      textTransform: "capitalize",
    },
    ".cm-button:hover": {
      backgroundImage: "none",
      backgroundColor: "var(--color-muted)",
    },
    ".cm-button:active": {
      backgroundImage: "none",
      backgroundColor: "var(--color-muted)",
    },
  },
  { dark: false },
);

const highlightStyle = HighlightStyle.define([
  { tag: tags.propertyName, color: "var(--color-text-info)" },
  { tag: tags.string, color: "var(--color-text-success)" },
  { tag: tags.number, color: "var(--color-text-warning)" },
  { tag: tags.bool, color: "var(--color-text-discovery)" },
  { tag: tags.null, color: "var(--color-text-discovery)" },
]);

const extensions = [
  json(),
  foldGutter({
    markerDOM: (open) => {
      // Container
      const div = document.createElement("div");
      div.title = open ? "Fold" : "Unfold";
      div.className = `cm-gutterFoldElement ${open ? "cm-gutterFoldElement-unfolded" : "cm-gutterFoldElement-folded"}`;

      // Arrow
      const span = document.createElement("span");
      div.appendChild(span);

      return div;
    },
  }),
  syntaxHighlighting(highlightStyle),
  EditorState.readOnly.of(true),
  EditorView.editable.of(false),
  EditorView.contentAttributes.of({ tabindex: "0" }),
];

export interface JsonViewerProps extends ReactCodeMirrorProps {
  data: unknown;
  prettify?: boolean;
}

function JsonViewer({ data, prettify = true, ...props }: JsonViewerProps) {
  const value = useMemo(() => {
    try {
      if (prettify) {
        // Pretty string
        const parsedData = typeof data === "string" ? (JSON.parse(data) as unknown) : data;
        return JSON.stringify(parsedData, null, 2);
      }
      // Raw string
      return typeof data === "string" ? data : JSON.stringify(data);
    } catch {
      // Fallback
      return String(data);
    }
  }, [data, prettify]);

  return (
    <CodeMirror
      {...props}
      theme={theme}
      basicSetup={basicSetup}
      extensions={extensions}
      value={value}
      style={{ height: "100%" }}
    />
  );
}

export default JsonViewer;

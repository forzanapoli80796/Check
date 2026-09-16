const ALLOWED_WHITEBOARD_TAGS = new Set([
  "b",
  "strong",
  "i",
  "em",
  "u",
  "s",
  "strike",
  "br",
  "p",
  "div",
  "ul",
  "ol",
  "li",
]);

const WHITEBOARD_TAG_PATTERN =
  /<\/?(?:b|strong|i|em|u|s|strike|br|p|div|ul|ol|li)(?:\s[^>]*)?>/i;
const HTML_LIKE_PATTERN = /<\/?[a-z][a-z0-9]*(?=\s|\/?>|$)/i;
const WHITEBOARD_TAG_TOKEN_PATTERN =
  /^<\s*(\/?)\s*([a-z][a-z0-9]*)(?:\s[^>]*)?\s*\/?\s*>/i;
const DANGEROUS_HTML_BLOCK_PATTERN =
  /<\s*(script|style|iframe|object|embed|svg|math|form|input|button|textarea|select|link|meta|base)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;

function escapeHtmlText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Whiteboard messages predate rich text and are still stored in the message
 * column. Plain text is intentionally returned unchanged so existing notes
 * keep their exact line breaks and content.
 *
 * Rich text is a deliberately small HTML subset. Attributes are removed from
 * every allowed element, which prevents event handlers, URLs and CSS from
 * entering the document. Disallowed or malformed markup is escaped so it
 * cannot become an element when the result is rendered as HTML.
 */
export function sanitizeWhiteboardMessage(message: string): string {
  if (!HTML_LIKE_PATTERN.test(message)) {
    return message;
  }

  // Drop complete blocks that can carry executable content before processing
  // individual tags. Incomplete dangerous tags are escaped below.
  const withoutDangerousBlocks = message
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(DANGEROUS_HTML_BLOCK_PATTERN, "");

  let sanitized = "";
  let cursor = 0;

  while (cursor < withoutDangerousBlocks.length) {
    const tagStart = withoutDangerousBlocks.indexOf("<", cursor);
    if (tagStart === -1) {
      sanitized += withoutDangerousBlocks.slice(cursor);
      break;
    }

    sanitized += withoutDangerousBlocks.slice(cursor, tagStart);
    const tagMatch = withoutDangerousBlocks
      .slice(tagStart)
      .match(WHITEBOARD_TAG_TOKEN_PATTERN);

    if (!tagMatch) {
      // A "<" without a complete tag is text, not markup. Escape all
      // delimiters so malformed input cannot be interpreted by innerHTML.
      sanitized += "&lt;";
      cursor = tagStart + 1;
      continue;
    }

    const [fullMatch, closingSlash, rawTagName] = tagMatch;
    const tag = rawTagName.toLowerCase();
    const isSelfClosing = !closingSlash && /\/\s*>$/.test(fullMatch);

    if (
      ALLOWED_WHITEBOARD_TAGS.has(tag) &&
      (!isSelfClosing || tag === "br")
    ) {
      if (closingSlash && tag === "br") {
        cursor = tagStart + fullMatch.length;
        continue;
      }
      sanitized += `<${closingSlash ? "/" : ""}${tag}>`;
    } else {
      // Keep unsafe markup visible as text rather than allowing a browser to
      // repair it into an active element.
      sanitized += escapeHtmlText(fullMatch);
    }

    cursor = tagStart + fullMatch.length;
  }

  return sanitized;
}

export function isWhiteboardRichText(message: string): boolean {
  return WHITEBOARD_TAG_PATTERN.test(message);
}

export function whiteboardMessageHasText(message: string): boolean {
  return message
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/gi, " ")
    .trim()
    .length > 0;
}
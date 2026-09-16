import assert from "node:assert/strict";
import test from "node:test";
import {
  isWhiteboardRichText,
  sanitizeWhiteboardMessage,
} from "./whiteboard.ts";

test("preserves allowed bold, italic, and list markup across repeated sanitization", () => {
  const formatted =
    "<strong>Bold</strong> <b>also bold</b> <em>italic</em> <i>also italic</i>" +
    "<ul><li>First</li><li>Second</li></ul><ol><li>Third</li></ol>";

  const sanitized = sanitizeWhiteboardMessage(formatted);

  assert.equal(sanitized, formatted);
  assert.equal(sanitizeWhiteboardMessage(sanitized), formatted);
  assert.equal(sanitizeWhiteboardMessage(sanitizeWhiteboardMessage(sanitized)), formatted);
  assert.equal(isWhiteboardRichText(sanitized), true);
});

test("removes dangerous blocks and escapes unsafe or malformed markup", () => {
  const unsafe =
    '<script>alert("xss")</script><img src="x" onerror="alert(1)">Safe';

  assert.equal(
    sanitizeWhiteboardMessage(unsafe),
    '&lt;img src="x" onerror="alert(1)"&gt;Safe',
  );
  assert.equal(
    sanitizeWhiteboardMessage("<strong>Safe</strong><img src=x onerror=alert(1)"),
    "<strong>Safe</strong>&lt;img src=x onerror=alert(1)",
  );
  assert.equal(
    sanitizeWhiteboardMessage("Malformed <img src=x onerror=alert(1)"),
    "Malformed &lt;img src=x onerror=alert(1)",
  );
});

test("removes attributes while preserving the allowed element", () => {
  assert.equal(
    sanitizeWhiteboardMessage(
      '<strong class="danger" onclick="alert(1)">Bold</strong>',
    ),
    "<strong>Bold</strong>",
  );
});

test("leaves legacy plain text unchanged", () => {
  const legacyMessage = "A < B\nUse & keep this line exactly.";

  assert.equal(sanitizeWhiteboardMessage(legacyMessage), legacyMessage);
});
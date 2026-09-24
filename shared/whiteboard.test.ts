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

test("strips copied formatting spans while preserving text and safe formatting", () => {
  const screenshotValue =
    '<span style="font-size: 0.875rem; color: rgb(23,23,23);">text</span>';
  const formatted =
    '<span style="font-size: 14px"><strong>Bold</strong> and <em>italic</em>' +
    "<ul><li>Item</li></ul></span>";

  assert.equal(sanitizeWhiteboardMessage(screenshotValue), "text");
  assert.equal(
    sanitizeWhiteboardMessage(formatted),
    "<strong>Bold</strong> and <em>italic</em><ul><li>Item</li></ul>",
  );
});

test("normalizes persisted encoded formatting spans at any editor encoding depth", () => {
  const encoded =
    '&lt;span style=&quot;font-size: 0.875rem; color: rgb(23,23,23);&quot;&gt;text&lt;/span&gt;';
  const doubleEncoded =
    '&amp;lt;span style=&amp;quot;font-size: 0.875rem&amp;quot;&amp;gt;text&amp;lt;/span&amp;gt;';
  const tripleEncoded =
    '&amp;amp;lt;span style=&amp;amp;quot;color: red&amp;amp;quot;&amp;amp;gt;text&amp;amp;lt;/span&amp;amp;gt;';

  for (const storedValue of [encoded, doubleEncoded, tripleEncoded]) {
    const normalized = sanitizeWhiteboardMessage(storedValue);
    assert.equal(normalized, "text");
    assert.equal(sanitizeWhiteboardMessage(normalized), "text");
  }
});

test("does not decode arbitrary entities or activate encoded unsafe markup", () => {
  assert.equal(
    sanitizeWhiteboardMessage(
      "&lt;span&gt;&lt;img src=x onerror=alert(1)&gt;Safe&lt;/span&gt;",
    ),
    "&lt;img src=x onerror=alert(1)&gt;Safe",
  );
  assert.equal(
    sanitizeWhiteboardMessage(
      "<span><script>alert(1)</script><strong>Safe</strong></span>",
    ),
    "<strong>Safe</strong>",
  );
  assert.equal(
    sanitizeWhiteboardMessage("A &lt; B &amp;&amp; C"),
    "A &lt; B &amp;&amp; C",
  );
});

test("normalized stored values remain stable through an editor save", () => {
  const stored =
    "&amp;lt;span style=&amp;quot;color: rgb(23,23,23)&amp;quot;&amp;gt;" +
    "<strong>Keep formatting</strong>&amp;lt;/span&amp;gt;";
  const loaded = sanitizeWhiteboardMessage(stored);

  assert.equal(loaded, "<strong>Keep formatting</strong>");
  assert.equal(sanitizeWhiteboardMessage(loaded), loaded);
});

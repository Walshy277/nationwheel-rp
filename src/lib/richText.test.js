import { describe, it, expect } from "vitest";
import { RichText, renderRichText, escapeHtml } from "./richText";

function getHtml(el) {
  return el.props.dangerouslySetInnerHTML.__html;
}

describe("escapeHtml", () => {
  it("escapes HTML special chars", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe("&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;");
  });

  it("handles null", () => {
    expect(escapeHtml(null)).toBe("");
  });
});

describe("renderRichText", () => {
  it("renders plain text", () => {
    const html = renderRichText("Hello world");
    expect(html).toContain("Hello world");
  });

  it("renders bold BBCode", () => {
    const html = renderRichText("[b]bold[/b]");
    expect(html).toContain("<strong>bold</strong>");
  });

  it("strips dangerous HTML", () => {
    const html = renderRichText("<script>alert('xss')</script>");
    expect(html).not.toContain("<script>");
  });
});

describe("RichText", () => {
  it("returns a React element with rich-post class", () => {
    const result = RichText({ children: "Hello" });
    expect(result.props.className).toBe("rich-post");
  });

  it("renders plain text", () => {
    const html = getHtml(RichText({ children: "Hello world" }));
    expect(html).toContain("Hello world");
  });

  it("renders bold BBCode", () => {
    const html = getHtml(RichText({ children: "[b]bold[/b]" }));
    expect(html).toContain("<strong>bold</strong>");
  });

  it("renders italic BBCode", () => {
    const html = getHtml(RichText({ children: "[i]italic[/i]" }));
    expect(html).toContain("<em>italic</em>");
  });

  it("renders URL BBCode", () => {
    const html = getHtml(RichText({ children: "[url]https://example.com[/url]" }));
    expect(html).toContain("href");
  });

  it("renders named URL BBCode", () => {
    const html = getHtml(RichText({ children: "[url=https://example.com]click[/url]" }));
    expect(html).toContain("href");
    expect(html).toContain("click");
  });

  it("strips dangerous HTML", () => {
    const html = getHtml(RichText({ children: "<script>alert('xss')</script>" }));
    expect(html).not.toContain("<script>");
  });

  it("handles null or empty children", () => {
    expect(getHtml(RichText({ children: null }))).toBe("");
    expect(getHtml(RichText({ children: "" }))).toBe("");
  });

  it("renders mention tags", () => {
    const html = getHtml(RichText({ children: "[mention=user:id123]@user[/mention]" }));
    expect(html).toContain("bb-mention");
    expect(html).toContain("data-type=\"user\"");
    expect(html).toContain("data-id=\"id123\"");
  });

  it("renders code BBCode", () => {
    const html = getHtml(RichText({ children: "[code]console.log('hi')[/code]" }));
    expect(html).toContain("<code");
  });

  it("renders quote BBCode", () => {
    const html = getHtml(RichText({ children: "[quote]quoted text[/quote]" }));
    expect(html).toContain("blockquote");
  });

  it("renders alignment BBCode", () => {
    const html = getHtml(RichText({ children: "[center]centered[/center]" }));
    expect(html).toContain("bb-center");
  });
});

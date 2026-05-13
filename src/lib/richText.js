import React from "react";

export const escapeHtml = value =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const safeUrl = value => {
  const raw = String(value || "").trim();
  if (!/^https?:\/\//i.test(raw)) return "";

  try {
    const url = new URL(raw);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
};

export const safeImageUrl = value => {
  const url = safeUrl(value);
  return /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(url) ? url : "";
};

export const renderRichText = value => {
  let html = escapeHtml(value);
  html = html
    .replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>")
    .replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>")
    .replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>")
    .replace(/\[s\]([\s\S]*?)\[\/s\]/gi, "<s>$1</s>")
    .replace(/\[center\]([\s\S]*?)\[\/center\]/gi, '<div class="bb-center">$1</div>')
    .replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi, '<details class="bb-spoiler"><summary>Spoiler</summary>$1</details>')
    .replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, "<blockquote>$1</blockquote>")
    .replace(/\[code\]([\s\S]*?)\[\/code\]/gi, "<pre><code>$1</code></pre>");

  html = html.replace(/\[url=(.*?)\]([\s\S]*?)\[\/url\]/gi, (_, url, text) => {
    const href = safeUrl(url);
    return href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${text}</a>` : text;
  });

  html = html.replace(/\[url\]([\s\S]*?)\[\/url\]/gi, (_, url) => {
    const href = safeUrl(url);
    return href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(href)}</a>` : escapeHtml(url);
  });

  html = html.replace(/\[img\]([\s\S]*?)\[\/img\]/gi, (_, url) => {
    const src = safeImageUrl(url);
    return src ? `<img src="${escapeHtml(src)}" alt="" loading="lazy" />` : "";
  });

  html = html.replace(/\[mention=(user|nation):([a-z0-9_-]+)\]([\s\S]*?)\[\/mention\]/gi, (_, type, id, text) => {
    return `<span class="bb-mention" data-type="${type}" data-id="${escapeHtml(id)}">${text}</span>`;
  });

  // HTML stays escaped by default. Only these attribute-free formatting tags are restored.
  html = html.replace(/&lt;(\/?)(b|strong|i|em|u|s|br|blockquote|code|pre)&gt;/gi, "<$1$2>");
  return html;
};

export const RichText = ({ children }) =>
  React.createElement("div", {
    className: "rich-post",
    dangerouslySetInnerHTML: { __html: renderRichText(children) },
  });


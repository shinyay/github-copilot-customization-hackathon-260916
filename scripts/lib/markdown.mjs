import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let parser;

function inlineProse(children) {
  let text = "";
  const links = [];
  const images = [];
  for (const child of children ?? []) {
    if (child.type === "text" || child.type === "code_inline") {
      text += child.content;
    } else if (child.type === "softbreak" || child.type === "hardbreak") {
      text += "\n";
    } else if (child.type === "link_open") {
      const href = child.attrGet("href");
      if (typeof href === "string") links.push(href);
    } else if (child.type === "image") {
      const source = child.attrGet("src");
      if (typeof source === "string") images.push(source);
    }
  }
  return { text, links, images };
}

export function parseMarkdownProse(contents) {
  // Core run planning does not need this optional-page authoring dependency.
  if (!parser) {
    const MarkdownIt = require("markdown-it");
    parser = new MarkdownIt({ html: true, linkify: false });
  }
  const tokens = parser.parse(contents, {});
  const sections = [];
  const links = [];
  const images = [];
  let current;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type === "heading_open" && token.tag === "h2" && token.level === 0) {
      const heading = inlineProse(tokens[index + 1].children);
      current = { title: heading.text, body: "", links: [] };
      sections.push(current);
      links.push(...heading.links);
      images.push(...heading.images);
      index += 2;
    } else if (token.type === "inline") {
      const prose = inlineProse(token.children);
      links.push(...prose.links);
      images.push(...prose.images);
      if (current) {
        current.body += `${prose.text}\n`;
        current.links.push(...prose.links);
      }
    }
  }
  return { sections, links, images };
}

import React from 'react';
import type { Style } from '@react-pdf/types';
import { Link as PDFLink } from '@react-pdf/renderer';

// URL regex: matches http(s)://... and bare www. URLs.
const URL_REGEX = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/g;

type Part = { type: 'text' | 'url'; content: string };

function splitOnUrls(text: string): Part[] {
  if (!text) return [];
  const parts: Part[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const re = new RegExp(URL_REGEX.source, URL_REGEX.flags);
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    let url = match[0];
    let trailing = '';
    // Strip trailing punctuation like period, comma, paren that likely
    // isn't part of the URL itself.
    while (url.length > 0 && /[.,;:)\]}!?]/.test(url[url.length - 1])) {
      trailing = url[url.length - 1] + trailing;
      url = url.slice(0, -1);
    }

    parts.push({ type: 'url', content: url });
    if (trailing) parts.push({ type: 'text', content: trailing });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts;
}

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

// On-screen: render text with clickable URLs. Returns inline nodes; embed
// inside existing <p>/<span>. Firestarter color, new tab.
export function Linkify({ text }: { text: string }) {
  if (!text) return null;
  const parts = splitOnUrls(text);
  if (parts.length === 0) return null;
  return (
    <>
      {parts.map((part, i) =>
        part.type === 'url' ? (
          <a
            key={i}
            href={normalizeUrl(part.content)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-fmc-firestarter hover:underline break-all"
            style={{ transition: 'color 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            {part.content}
          </a>
        ) : (
          <React.Fragment key={i}>{part.content}</React.Fragment>
        )
      )}
    </>
  );
}

// @react-pdf/renderer: return an array of ReactNodes (strings + PDFLink
// elements) that can be embedded inside a parent <Text>.
export function linkifyPDF(
  text: string,
  baseStyle: Style,
  accentColor: string
): React.ReactNode[] {
  if (!text) return [];
  const parts = splitOnUrls(text);
  return parts.map((part, i) => {
    if (part.type === 'url') {
      return (
        <PDFLink
          key={i}
          src={normalizeUrl(part.content)}
          style={{ ...baseStyle, color: accentColor, textDecoration: 'underline' }}
        >
          {part.content}
        </PDFLink>
      );
    }
    return part.content;
  });
}

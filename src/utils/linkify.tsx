import React from 'react';
import { ExternalLink } from 'lucide-react';

// URL detection regular expression
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(?:com|org|net|edu|gov|io|vn|app|dev|co)[^\s]*)/gi;

/**
 * Parses a string and transforms URLs into clickable styled links
 */
export const renderWithHyperlinks = (text: string | undefined | null): React.ReactNode => {
  if (!text) return null;

  // Split lines first to preserve formatting
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // Reset regex index
    URL_REGEX.lastIndex = 0;

    while ((match = URL_REGEX.exec(line)) !== null) {
      const matchIndex = match.index;
      const matchedUrl = match[0];

      // Clean trailing punctuation if any (e.g. '.', ',', ')')
      let cleanUrl = matchedUrl;
      let trailingPunct = '';
      if (/[.,;!?)]$/.test(cleanUrl)) {
        trailingPunct = cleanUrl.slice(-1);
        cleanUrl = cleanUrl.slice(0, -1);
      }

      // Add text before URL
      if (matchIndex > lastIndex) {
        parts.push(line.substring(lastIndex, matchIndex));
      }

      const href = cleanUrl.startsWith('http')
        ? cleanUrl
        : `https://${cleanUrl}`;

      // Shorten display if too long
      let displayLabel = cleanUrl;
      try {
        const urlObj = new URL(href);
        if (cleanUrl.length > 36) {
          displayLabel = `${urlObj.hostname}${urlObj.pathname.slice(0, 15)}...`;
        }
      } catch {
        if (cleanUrl.length > 36) {
          displayLabel = `${cleanUrl.slice(0, 32)}...`;
        }
      }

      parts.push(
        <a
          key={`link-${lineIdx}-${matchIndex}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 font-semibold text-[#0072CE] hover:text-[#ED1B24] underline underline-offset-2 decoration-[#0072CE]/60 hover:decoration-[#ED1B24] transition-colors break-all"
          title={`Mở liên kết: ${href}`}
        >
          <span>{displayLabel}</span>
          <ExternalLink size={11} className="inline flex-shrink-0 stroke-[2.5]" />
        </a>
      );

      if (trailingPunct) {
        parts.push(trailingPunct);
      }

      lastIndex = matchIndex + matchedUrl.length;
    }

    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }

    return (
      <React.Fragment key={`line-${lineIdx}`}>
        {parts}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

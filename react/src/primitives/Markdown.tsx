import React, { useMemo, useCallback } from 'react';
import { tokens, type ThemeColors, type ThemePreference, withAlpha } from '@open-hax/uxx/tokens';
import { CodeBlock } from './CodeBlock.js';
import { useResolvedTheme } from '../theme.js';

export interface MarkdownProps {
  content: string;
  variant?: 'default' | 'preview' | 'compact' | 'full';
  theme?: ThemePreference;
  lineNumbers?: boolean;
  copyButton?: boolean;
  linkTarget?: '_self' | '_blank';
  sanitize?: boolean;
  maxLines?: number;
  onLinkClick?: (href: string, e: React.MouseEvent) => void;
  onHeadingClick?: (id: string, text: string) => void;
  className?: string;
}

interface ParsedNode {
  type: 'heading' | 'paragraph' | 'code' | 'list' | 'blockquote' | 'hr' | 'image' | 'link' | 'text' | 'table';
  content?: string;
  level?: number;
  language?: string;
  items?: string[];
  ordered?: boolean;
  href?: string;
  src?: string;
  alt?: string;
  children?: ParsedNode[];
  // Table-specific
  headers?: string[];
  rows?: string[][];
}

interface InlineRenderOptions {
  themeColors: ThemeColors;
  linkTarget: '_self' | '_blank';
  onLinkClick?: (href: string, e: React.MouseEvent) => void;
}

const HEADING_RE = /^(#{1,6})\s+(.+)$/;
const HORIZONTAL_RULE_RE = /^(-{3,}|\*{3,}|_{3,})$/;
const BLOCKQUOTE_RE = /^>\s+/;
const UNORDERED_LIST_RE = /^[-*+]\s+/;
const ORDERED_LIST_RE = /^\d+\.\s+/;
const IMAGE_RE = /^!\[([^\]]*)\]\(([^)]+)\)$/;
const TABLE_SEPARATOR_RE = /^\|?[\s:|\-]+\|?$/;

function isFenceLine(line: string): boolean {
  return line.trimStart().startsWith('```');
}

function isTableStart(line: string, nextLine?: string): boolean {
  if (!nextLine) {
    return false;
  }

  return line.includes('|') && TABLE_SEPARATOR_RE.test(nextLine.trim());
}

function startsBlockNode(line: string, nextLine?: string): boolean {
  const trimmed = line.trim();

  if (!trimmed) {
    return false;
  }

  return (
    HEADING_RE.test(trimmed)
    || isFenceLine(line)
    || isTableStart(line, nextLine)
    || HORIZONTAL_RULE_RE.test(trimmed)
    || BLOCKQUOTE_RE.test(trimmed)
    || UNORDERED_LIST_RE.test(trimmed)
    || ORDERED_LIST_RE.test(trimmed)
    || IMAGE_RE.test(trimmed)
  );
}

// Improved markdown parser
function parseMarkdown(markdown: string): ParsedNode[] {
  const lines = markdown.split('\n');
  const nodes: ParsedNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.trim().match(HEADING_RE);
    if (headingMatch) {
      nodes.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2],
      });
      i++;
      continue;
    }

    // Code block (fenced)
    if (isFenceLine(line)) {
      const language = line.trimStart().slice(3).trim();
      const codeLines: string[] = [];
      i++;

      // Find closing fence
      while (i < lines.length && !isFenceLine(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      
      // Only skip closing fence if we found one
      if (i < lines.length && isFenceLine(lines[i])) {
        i++; // Skip closing ```
      }
      
      nodes.push({
        type: 'code',
        language: language || 'text',
        content: codeLines.join('\n'),
      });
      continue;
    }

    // Table detection (GFM style)
    if (isTableStart(line, lines[i + 1])) {
      const headerLine = line;
      i += 2;
      
      // Parse headers
      const headers = parseTableRow(headerLine);
      
      // Parse rows
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        // Stop if it looks like another block
        if (
          isFenceLine(lines[i])
          || HEADING_RE.test(lines[i].trim())
          || HORIZONTAL_RULE_RE.test(lines[i].trim())
          || BLOCKQUOTE_RE.test(lines[i].trim())
          || UNORDERED_LIST_RE.test(lines[i].trim())
          || ORDERED_LIST_RE.test(lines[i].trim())
          || IMAGE_RE.test(lines[i].trim())
        ) {
          break;
        }
        rows.push(parseTableRow(lines[i]));
        i++;
      }
      
      nodes.push({
        type: 'table',
        headers,
        rows,
      });
      continue;
    }

    // Horizontal rule
    if (HORIZONTAL_RULE_RE.test(line.trim())) {
      nodes.push({ type: 'hr' });
      i++;
      continue;
    }

    // Blockquote
    if (BLOCKQUOTE_RE.test(line.trim())) {
      const quoteLines: string[] = [line.slice(2)];
      i++;
      while (i < lines.length && BLOCKQUOTE_RE.test(lines[i].trim())) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      nodes.push({
        type: 'blockquote',
        content: quoteLines.join('\n'),
      });
      continue;
    }

    // Unordered list
    if (UNORDERED_LIST_RE.test(line.trim())) {
      const items: string[] = [line.replace(/^[-*+]\s+/, '')];
      i++;
      while (i < lines.length && UNORDERED_LIST_RE.test(lines[i].trim())) {
        items.push(lines[i].replace(/^[-*+]\s+/, ''));
        i++;
      }
      nodes.push({ type: 'list', items, ordered: false });
      continue;
    }

    // Ordered list
    if (ORDERED_LIST_RE.test(line.trim())) {
      const items: string[] = [line.replace(/^\d+\.\s+/, '')];
      i++;
      while (i < lines.length && ORDERED_LIST_RE.test(lines[i].trim())) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      nodes.push({ type: 'list', items, ordered: true });
      continue;
    }

    // Image
    const imageMatch = line.trim().match(IMAGE_RE);
    if (imageMatch) {
      nodes.push({
        type: 'image',
        alt: imageMatch[1],
        src: imageMatch[2],
      });
      i++;
      continue;
    }

    // Paragraph
    const paragraphLines: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim()) {
      if (startsBlockNode(lines[i], lines[i + 1])) {
        break;
      }
      paragraphLines.push(lines[i]);
      i++;
    }
    nodes.push({
      type: 'paragraph',
      content: paragraphLines.join('\n'),
    });
  }

  return nodes;
}

// Parse a table row
function parseTableRow(line: string): string[] {
  // Remove leading/trailing pipes and split
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map(cell => cell.trim());
}

// Parse inline markdown (bold, italic, code, links, strikethrough)
function parseInline(text: string, options: InlineRenderOptions): React.ReactNode[] {
  const { themeColors, linkTarget, onLinkClick } = options;
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining) {
    // Inline code (backticks) - check first to avoid conflicts
    const codeMatch = remaining.match(/`([^`]+)`/);
    if (codeMatch) {
      const before = remaining.slice(0, codeMatch.index);
      if (before) {
        parts.push(...parseInlineFormatting(before, key));
        key += 10;
      }
      parts.push(
        <code
          key={key++}
          style={{
            background: withAlpha(themeColors.text.default, 0.05),
            padding: '2px 6px',
            borderRadius: tokens.radius.xs,
            fontFamily: tokens.fontFamily.mono,
            fontSize: '0.9em',
          }}
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice((codeMatch.index || 0) + codeMatch[0].length);
      continue;
    }

    // Image ![alt](src) - inline version
    const imageMatch = remaining.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (imageMatch) {
      const before = remaining.slice(0, imageMatch.index);
      if (before) {
        parts.push(...parseInlineFormatting(before, key));
        key += 10;
      }
      parts.push(
        <img
          key={key++}
          src={imageMatch[2]}
          alt={imageMatch[1]}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      );
      remaining = remaining.slice((imageMatch.index || 0) + imageMatch[0].length);
      continue;
    }

    // Link [text](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const before = remaining.slice(0, linkMatch.index);
      if (before) {
        parts.push(...parseInlineFormatting(before, key));
        key += 10;
      }
      parts.push(
        <a
          key={key++}
          href={linkMatch[2]}
          style={{
            color: themeColors.accent.cyan,
            textDecoration: 'none',
          }}
          target={linkTarget}
          rel={linkTarget === '_blank' ? 'noopener noreferrer' : undefined}
          onClick={(e) => onLinkClick?.(linkMatch[2], e)}
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice((linkMatch.index || 0) + linkMatch[0].length);
      continue;
    }

    // No more special patterns - handle formatting
    parts.push(...parseInlineFormatting(remaining, key));
    break;
  }

  return parts;
}

// Parse inline formatting (bold, italic, strikethrough)
function parseInlineFormatting(text: string, startKey: number): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = startKey;

  while (remaining) {
    // Strikethrough ~~text~~
    const strikeMatch = remaining.match(/~~(.+?)~~/);
    if (strikeMatch) {
      const before = remaining.slice(0, strikeMatch.index);
      if (before) parts.push(<span key={key++}>{before}</span>);
      parts.push(
        <del key={key++} style={{ textDecoration: 'line-through', opacity: 0.7 }}>
          {strikeMatch[1]}
        </del>
      );
      remaining = remaining.slice((strikeMatch.index || 0) + strikeMatch[0].length);
      continue;
    }

    // Bold **text** (non-greedy, allows asterisks inside)
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch) {
      const before = remaining.slice(0, boldMatch.index);
      if (before) parts.push(<span key={key++}>{before}</span>);
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice((boldMatch.index || 0) + boldMatch[0].length);
      continue;
    }

    // Bold __text__
    const boldMatch2 = remaining.match(/__(.+?)__/);
    if (boldMatch2) {
      const before = remaining.slice(0, boldMatch2.index);
      if (before) parts.push(<span key={key++}>{before}</span>);
      parts.push(<strong key={key++}>{boldMatch2[1]}</strong>);
      remaining = remaining.slice((boldMatch2.index || 0) + boldMatch2[0].length);
      continue;
    }

    // Italic *text* (non-greedy)
    const italicMatch = remaining.match(/\*(.+?)\*/);
    if (italicMatch) {
      const before = remaining.slice(0, italicMatch.index);
      if (before) parts.push(<span key={key++}>{before}</span>);
      parts.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.slice((italicMatch.index || 0) + italicMatch[0].length);
      continue;
    }

    // Italic _text_
    const italicMatch2 = remaining.match(/_(.+?)_/);
    if (italicMatch2) {
      const before = remaining.slice(0, italicMatch2.index);
      if (before) parts.push(<span key={key++}>{before}</span>);
      parts.push(<em key={key++}>{italicMatch2[1]}</em>);
      remaining = remaining.slice((italicMatch2.index || 0) + italicMatch2[0].length);
      continue;
    }

    // No more patterns
    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return parts;
}

export const Markdown: React.FC<MarkdownProps> = ({
  content,
  variant = 'default',
  theme = 'dark',
  lineNumbers = true,
  copyButton = true,
  linkTarget = '_blank',
  maxLines,
  onLinkClick,
  onHeadingClick,
  className,
}) => {
  const nodes = useMemo(() => parseMarkdown(content), [content]);
  const resolvedTheme = useResolvedTheme(theme);
  const themeColors = resolvedTheme.colors;

  const handleLinkClick = useCallback(
    (href: string, e: React.MouseEvent) => {
      if (onLinkClick) {
        e.preventDefault();
        onLinkClick(href, e);
      }
    },
    [onLinkClick]
  );

  const inlineRenderOptions = useMemo<InlineRenderOptions>(
    () => ({
      themeColors,
      linkTarget,
      onLinkClick: onLinkClick ? handleLinkClick : undefined,
    }),
    [themeColors, linkTarget, onLinkClick, handleLinkClick],
  );

  const renderNode = (node: ParsedNode, index: number): React.ReactNode => {
    switch (node.type) {
      case 'heading':
        const HeadingTag = `h${node.level}` as keyof JSX.IntrinsicElements;
        const headingSizes: Record<number, number> = {
          1: 32,
          2: 24,
          3: 20,
          4: 18,
          5: 16,
          6: 14,
        };
        return (
          <HeadingTag
            key={index}
            id={node.content?.toLowerCase().replace(/\s+/g, '-')}
            style={{
              marginTop: node.level === 1 ? 0 : 24,
              marginBottom: 16,
              fontSize: headingSizes[node.level || 1],
              fontWeight: node.level === 1 ? 700 : 600,
              color: themeColors.text.default,
              cursor: onHeadingClick ? 'pointer' : undefined,
            }}
            onClick={() => onHeadingClick?.(
              node.content?.toLowerCase().replace(/\s+/g, '-') || '',
              node.content || ''
            )}
          >
            {parseInline(node.content || '', inlineRenderOptions)}
          </HeadingTag>
        );

      case 'paragraph':
        return (
          <p
            key={index}
            style={{
              marginTop: 0,
              marginBottom: 16,
              lineHeight: 1.7,
              color: themeColors.text.default,
            }}
          >
            {parseInline(node.content || '', inlineRenderOptions)}
          </p>
        );

      case 'code':
        return (
          <CodeBlock
            key={index}
            code={node.content || ''}
            language={node.language}
            lineNumbers={lineNumbers}
            showCopy={copyButton}
            maxLines={maxLines}
            theme={theme}
            showLanguage
          />
        );

      case 'blockquote':
        return (
          <blockquote
            key={index}
            style={{
              margin: '16px 0',
              padding: '8px 16px',
              borderLeft: `4px solid ${themeColors.accent.cyan}`,
              background: withAlpha(themeColors.accent.cyan, 0.05),
              color: themeColors.text.muted,
            }}
          >
            {parseInline(node.content || '', inlineRenderOptions)}
          </blockquote>
        );

      case 'list':
        const ListTag = node.ordered ? 'ol' : 'ul';
        return (
          <ListTag
            key={index}
            style={{
              marginTop: 0,
              marginBottom: 16,
              paddingLeft: 24,
              lineHeight: 1.7,
            }}
          >
            {node.items?.map((item, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {parseInline(item, inlineRenderOptions)}
              </li>
            ))}
          </ListTag>
        );

      case 'hr':
        return (
          <hr
            key={index}
            style={{
              border: 'none',
              height: 1,
              background: themeColors.border.default,
              margin: '24px 0',
            }}
          />
        );

      case 'image':
        return (
          <figure key={index} style={{ margin: '16px 0' }}>
            <img
              src={node.src}
              alt={node.alt || ''}
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: tokens.radius.md,
              }}
            />
            {node.alt && (
              <figcaption
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: themeColors.text.muted,
                  textAlign: 'center',
                }}
              >
                {node.alt}
              </figcaption>
            )}
          </figure>
        );

      case 'table':
        return (
          <div
            key={index}
            style={{
              overflowX: 'auto',
              margin: '16px 0',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: variant === 'compact' ? 13 : 14,
              }}
            >
              <thead>
                <tr>
                  {node.headers?.map((header, i) => (
                    <th
                      key={i}
                      style={{
                        padding: '8px 12px',
                        textAlign: 'left',
                        borderBottom: `2px solid ${themeColors.border.default}`,
                        color: themeColors.text.default,
                        fontWeight: 600,
                      }}
                    >
                      {parseInline(header, inlineRenderOptions)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {node.rows?.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        style={{
                          padding: '8px 12px',
                          borderBottom: `1px solid ${themeColors.border.subtle}`,
                          color: themeColors.text.default,
                        }}
                      >
                        {parseInline(cell, inlineRenderOptions)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={className}
      data-component="markdown"
      data-variant={variant}
      style={{
        fontFamily: 'inherit',
        fontSize: variant === 'compact' ? 13 : 14,
        lineHeight: 1.6,
        maxWidth: variant === 'full' ? '100%' : '65ch',
      }}
    >
      {nodes.map(renderNode)}
    </div>
  );
};

export default Markdown;

import React, { useMemo, useCallback } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
import { CodeBlock } from './CodeBlock.js';

export interface MarkdownProps {
  content: string;
  variant?: 'default' | 'preview' | 'compact' | 'full';
  theme?: 'dark' | 'light' | 'auto';
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
  type: 'heading' | 'paragraph' | 'code' | 'list' | 'blockquote' | 'hr' | 'image' | 'link' | 'text';
  content?: string;
  level?: number;
  language?: string;
  items?: string[];
  href?: string;
  src?: string;
  alt?: string;
  children?: ParsedNode[];
}

// Simple markdown parser (supports common subset)
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
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      nodes.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2],
      });
      i++;
      continue;
    }
    
    // Code block
    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```
      nodes.push({
        type: 'code',
        language: language || 'text',
        content: codeLines.join('\n'),
      });
      continue;
    }
    
    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      nodes.push({ type: 'hr' });
      i++;
      continue;
    }
    
    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [line.slice(2)];
      i++;
      while (i < lines.length && lines[i].startsWith('> ')) {
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
    if (/^[-*+]\s+/.test(line)) {
      const items: string[] = [line.replace(/^[-*+]\s+/, '')];
      i++;
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+]\s+/, ''));
        i++;
      }
      nodes.push({ type: 'list', items });
      continue;
    }
    
    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [line.replace(/^\d+\.\s+/, '')];
      i++;
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      nodes.push({ type: 'list', items });
      continue;
    }
    
    // Paragraph
    const paragraphLines: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}|```|> |[-*+]|\d+\.)\s*$/.test(lines[i])) {
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

// Parse inline markdown (bold, italic, code, links)
function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  
  while (remaining) {
    // Code (backticks)
    const codeMatch = remaining.match(/`([^`]+)`/);
    if (codeMatch) {
      const before = remaining.slice(0, codeMatch.index);
      if (before) {
        parts.push(...parseInlineSimple(before, key));
        key += 10;
      }
      parts.push(
        <code
          key={key++}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '2px 6px',
            borderRadius: 4,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.9em',
          }}
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice((codeMatch.index || 0) + codeMatch[0].length);
      continue;
    }
    
    // Link
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const before = remaining.slice(0, linkMatch.index);
      if (before) {
        parts.push(...parseInlineSimple(before, key));
        key += 10;
      }
      parts.push(
        <a
          key={key++}
          href={linkMatch[2]}
          style={{
            color: tokens.monokai.accent.cyan,
            textDecoration: 'none',
          }}
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice((linkMatch.index || 0) + linkMatch[0].length);
      continue;
    }
    
    // No more special patterns
    parts.push(...parseInlineSimple(remaining, key));
    break;
  }
  
  return parts;
}

function parseInlineSimple(text: string, startKey: number): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = startKey;
  
  while (remaining) {
    // Bold
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    if (boldMatch) {
      const before = remaining.slice(0, boldMatch.index);
      if (before) parts.push(<span key={key++}>{before}</span>);
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice((boldMatch.index || 0) + boldMatch[0].length);
      continue;
    }
    
    // Italic
    const italicMatch = remaining.match(/\*([^*]+)\*/);
    if (italicMatch) {
      const before = remaining.slice(0, italicMatch.index);
      if (before) parts.push(<span key={key++}>{before}</span>);
      parts.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.slice((italicMatch.index || 0) + italicMatch[0].length);
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
  
  const handleLinkClick = useCallback(
    (href: string, e: React.MouseEvent) => {
      if (onLinkClick) {
        e.preventDefault();
        onLinkClick(href, e);
      }
    },
    [onLinkClick]
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
              color: tokens.colors.text.default,
              cursor: onHeadingClick ? 'pointer' : undefined,
            }}
            onClick={() => onHeadingClick?.(
              node.content?.toLowerCase().replace(/\s+/g, '-') || '',
              node.content || ''
            )}
          >
            {parseInline(node.content || '')}
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
              color: tokens.colors.text.default,
            }}
          >
            {parseInline(node.content || '')}
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
              borderLeft: `4px solid ${tokens.monokai.accent.cyan}`,
              background: 'rgba(102, 217, 239, 0.05)',
              color: tokens.colors.text.muted,
            }}
          >
            {parseInline(node.content || '')}
          </blockquote>
        );
        
      case 'list':
        return (
          <ul
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
                {parseInline(item)}
              </li>
            ))}
          </ul>
        );
        
      case 'hr':
        return (
          <hr
            key={index}
            style={{
              border: 'none',
              height: 1,
              background: tokens.colors.border.default,
              margin: '24px 0',
            }}
          />
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

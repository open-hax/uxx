import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo, useCallback } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
import { CodeBlock } from './CodeBlock.js';
// Simple markdown parser (supports common subset)
function parseMarkdown(markdown) {
    const lines = markdown.split('\n');
    const nodes = [];
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
            const codeLines = [];
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
            const quoteLines = [line.slice(2)];
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
            const items = [line.replace(/^[-*+]\s+/, '')];
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
            const items = [line.replace(/^\d+\.\s+/, '')];
            i++;
            while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
                items.push(lines[i].replace(/^\d+\.\s+/, ''));
                i++;
            }
            nodes.push({ type: 'list', items });
            continue;
        }
        // Paragraph
        const paragraphLines = [line];
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
function parseInline(text) {
    const parts = [];
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
            parts.push(_jsx("code", { style: {
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.9em',
                }, children: codeMatch[1] }, key++));
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
            parts.push(_jsx("a", { href: linkMatch[2], style: {
                    color: tokens.colors.accent.cyan,
                    textDecoration: 'none',
                }, target: "_blank", rel: "noopener noreferrer", children: linkMatch[1] }, key++));
            remaining = remaining.slice((linkMatch.index || 0) + linkMatch[0].length);
            continue;
        }
        // No more special patterns
        parts.push(...parseInlineSimple(remaining, key));
        break;
    }
    return parts;
}
function parseInlineSimple(text, startKey) {
    const parts = [];
    let remaining = text;
    let key = startKey;
    while (remaining) {
        // Bold
        const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
        if (boldMatch) {
            const before = remaining.slice(0, boldMatch.index);
            if (before)
                parts.push(_jsx("span", { children: before }, key++));
            parts.push(_jsx("strong", { children: boldMatch[1] }, key++));
            remaining = remaining.slice((boldMatch.index || 0) + boldMatch[0].length);
            continue;
        }
        // Italic
        const italicMatch = remaining.match(/\*([^*]+)\*/);
        if (italicMatch) {
            const before = remaining.slice(0, italicMatch.index);
            if (before)
                parts.push(_jsx("span", { children: before }, key++));
            parts.push(_jsx("em", { children: italicMatch[1] }, key++));
            remaining = remaining.slice((italicMatch.index || 0) + italicMatch[0].length);
            continue;
        }
        // No more patterns
        parts.push(_jsx("span", { children: remaining }, key++));
        break;
    }
    return parts;
}
export const Markdown = ({ content, variant = 'default', theme = 'dark', lineNumbers = true, copyButton = true, linkTarget = '_blank', maxLines, onLinkClick, onHeadingClick, className, }) => {
    const nodes = useMemo(() => parseMarkdown(content), [content]);
    const handleLinkClick = useCallback((href, e) => {
        if (onLinkClick) {
            e.preventDefault();
            onLinkClick(href, e);
        }
    }, [onLinkClick]);
    const renderNode = (node, index) => {
        switch (node.type) {
            case 'heading':
                const HeadingTag = `h${node.level}`;
                const headingSizes = {
                    1: 32,
                    2: 24,
                    3: 20,
                    4: 18,
                    5: 16,
                    6: 14,
                };
                return (_jsx(HeadingTag, { id: node.content?.toLowerCase().replace(/\s+/g, '-'), style: {
                        marginTop: node.level === 1 ? 0 : 24,
                        marginBottom: 16,
                        fontSize: headingSizes[node.level || 1],
                        fontWeight: node.level === 1 ? 700 : 600,
                        color: tokens.colors.text.default,
                        cursor: onHeadingClick ? 'pointer' : undefined,
                    }, onClick: () => onHeadingClick?.(node.content?.toLowerCase().replace(/\s+/g, '-') || '', node.content || ''), children: parseInline(node.content || '') }, index));
            case 'paragraph':
                return (_jsx("p", { style: {
                        marginTop: 0,
                        marginBottom: 16,
                        lineHeight: 1.7,
                        color: tokens.colors.text.default,
                    }, children: parseInline(node.content || '') }, index));
            case 'code':
                return (_jsx(CodeBlock, { code: node.content || '', language: node.language, lineNumbers: lineNumbers, showCopy: copyButton, maxLines: maxLines, showLanguage: true }, index));
            case 'blockquote':
                return (_jsx("blockquote", { style: {
                        margin: '16px 0',
                        padding: '8px 16px',
                        borderLeft: `4px solid ${tokens.colors.accent.cyan}`,
                        background: 'rgba(102, 217, 239, 0.05)',
                        color: tokens.colors.text.muted,
                    }, children: parseInline(node.content || '') }, index));
            case 'list':
                return (_jsx("ul", { style: {
                        marginTop: 0,
                        marginBottom: 16,
                        paddingLeft: 24,
                        lineHeight: 1.7,
                    }, children: node.items?.map((item, i) => (_jsx("li", { style: { marginBottom: 4 }, children: parseInline(item) }, i))) }, index));
            case 'hr':
                return (_jsx("hr", { style: {
                        border: 'none',
                        height: 1,
                        background: tokens.colors.border.default,
                        margin: '24px 0',
                    } }, index));
            default:
                return null;
        }
    };
    return (_jsx("div", { className: className, "data-component": "markdown", "data-variant": variant, style: {
            fontFamily: 'inherit',
            fontSize: variant === 'compact' ? 13 : 14,
            lineHeight: 1.6,
            maxWidth: variant === 'full' ? '100%' : '65ch',
        }, children: nodes.map(renderNode) }));
};
export default Markdown;
//# sourceMappingURL=Markdown.js.map
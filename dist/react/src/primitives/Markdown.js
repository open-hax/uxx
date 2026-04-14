import { jsx as _jsx } from "react/jsx-runtime";
import React, { useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { tokens, withAlpha } from '@open-hax/uxx/tokens';
import { CodeBlock } from './CodeBlock.js';
import { useResolvedTheme } from '../theme.js';
const HEADING_SIZES = {
    1: 32,
    2: 24,
    3: 20,
    4: 18,
    5: 16,
    6: 14,
};
function flattenText(node) {
    if (typeof node === 'string' || typeof node === 'number') {
        return String(node);
    }
    if (Array.isArray(node)) {
        return node.map(flattenText).join('');
    }
    if (React.isValidElement(node)) {
        return flattenText(node.props.children);
    }
    return '';
}
function slugifyHeading(text) {
    return text
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
}
function getCodeLanguage(className) {
    const match = className?.match(/language-([^\s]+)/);
    return match?.[1];
}
function createHeadingRenderer(level, themeColors, onHeadingClick) {
    return ({ children, ...props }) => {
        const Tag = `h${level}`;
        const text = flattenText(children);
        const id = slugifyHeading(text);
        return (_jsx(Tag, { ...props, id: id, style: {
                marginTop: level === 1 ? 0 : 24,
                marginBottom: 16,
                fontSize: HEADING_SIZES[level],
                fontWeight: level === 1 ? 700 : 600,
                color: themeColors.text.default,
                cursor: onHeadingClick ? 'pointer' : undefined,
            }, onClick: onHeadingClick ? () => onHeadingClick(id, text) : undefined, children: children }));
    };
}
export const Markdown = ({ content, variant = 'default', theme = 'dark', lineNumbers = true, copyButton = true, linkTarget = '_blank', sanitize = true, maxLines, onLinkClick, onHeadingClick, className, }) => {
    const resolvedTheme = useResolvedTheme(theme);
    const themeColors = resolvedTheme.colors;
    const handleLinkClick = useCallback((href, e) => {
        if (onLinkClick) {
            e.preventDefault();
            onLinkClick(href, e);
        }
    }, [onLinkClick]);
    const rehypePlugins = useMemo(() => (sanitize ? [] : [rehypeRaw]), [sanitize]);
    const components = useMemo(() => ({
        h1: createHeadingRenderer(1, themeColors, onHeadingClick),
        h2: createHeadingRenderer(2, themeColors, onHeadingClick),
        h3: createHeadingRenderer(3, themeColors, onHeadingClick),
        h4: createHeadingRenderer(4, themeColors, onHeadingClick),
        h5: createHeadingRenderer(5, themeColors, onHeadingClick),
        h6: createHeadingRenderer(6, themeColors, onHeadingClick),
        p: ({ children, ...props }) => (_jsx("p", { ...props, style: {
                marginTop: 0,
                marginBottom: 16,
                lineHeight: 1.7,
                color: themeColors.text.default,
            }, children: children })),
        a: ({ href, children, ...props }) => (_jsx("a", { ...props, href: href, style: {
                color: themeColors.accent.cyan,
                textDecoration: 'none',
            }, target: linkTarget, rel: linkTarget === '_blank' ? 'noopener noreferrer' : undefined, onClick: href && onLinkClick ? (e) => handleLinkClick(href, e) : undefined, children: children })),
        code: ({ className: codeClassName, children, ...props }) => (_jsx("code", { ...props, className: codeClassName, style: {
                background: withAlpha(themeColors.text.default, 0.05),
                padding: '2px 6px',
                borderRadius: tokens.radius.xs,
                fontFamily: tokens.fontFamily.mono,
                fontSize: '0.9em',
            }, children: children })),
        pre: ({ children }) => {
            if (React.isValidElement(children)) {
                const code = String(children.props.children ?? '').replace(/\n$/, '');
                return (_jsx(CodeBlock, { code: code, language: getCodeLanguage(children.props.className), lineNumbers: lineNumbers, showCopy: copyButton, maxLines: maxLines, theme: theme, showLanguage: true }));
            }
            return _jsx("pre", { children: children });
        },
        blockquote: ({ children, ...props }) => (_jsx("blockquote", { ...props, style: {
                margin: '16px 0',
                padding: '8px 16px',
                borderLeft: `4px solid ${themeColors.accent.cyan}`,
                background: withAlpha(themeColors.accent.cyan, 0.05),
                color: themeColors.text.muted,
            }, children: children })),
        ul: ({ children, ...props }) => (_jsx("ul", { ...props, style: {
                marginTop: 0,
                marginBottom: 16,
                paddingLeft: 24,
                lineHeight: 1.7,
                color: themeColors.text.default,
            }, children: children })),
        ol: ({ children, ...props }) => (_jsx("ol", { ...props, style: {
                marginTop: 0,
                marginBottom: 16,
                paddingLeft: 24,
                lineHeight: 1.7,
                color: themeColors.text.default,
            }, children: children })),
        li: ({ children, ...props }) => (_jsx("li", { ...props, style: { marginBottom: 4 }, children: children })),
        hr: (props) => (_jsx("hr", { ...props, style: {
                border: 'none',
                height: 1,
                background: themeColors.border.default,
                margin: '24px 0',
            } })),
        img: ({ src, alt, ...props }) => (_jsx("img", { ...props, src: src || '', alt: alt || '', style: {
                maxWidth: '100%',
                height: 'auto',
                borderRadius: tokens.radius.md,
            } })),
        table: ({ children, ...props }) => (_jsx("div", { style: {
                overflowX: 'auto',
                margin: '16px 0',
            }, children: _jsx("table", { ...props, style: {
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: variant === 'compact' ? 13 : 14,
                }, children: children }) })),
        th: ({ children, ...props }) => (_jsx("th", { ...props, style: {
                padding: '8px 12px',
                textAlign: 'left',
                borderBottom: `2px solid ${themeColors.border.default}`,
                color: themeColors.text.default,
                fontWeight: 600,
            }, children: children })),
        td: ({ children, ...props }) => (_jsx("td", { ...props, style: {
                padding: '8px 12px',
                borderBottom: `1px solid ${themeColors.border.subtle}`,
                color: themeColors.text.default,
            }, children: children })),
    }), [copyButton, handleLinkClick, lineNumbers, linkTarget, maxLines, onHeadingClick, onLinkClick, theme, themeColors, variant]);
    return (_jsx("div", { className: className, "data-component": "markdown", "data-variant": variant, role: "article", "aria-label": "Markdown content", style: {
            fontFamily: 'inherit',
            fontSize: variant === 'compact' ? 13 : 14,
            lineHeight: 1.6,
            maxWidth: variant === 'full' ? '100%' : '65ch',
        }, children: _jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], rehypePlugins: rehypePlugins, skipHtml: sanitize, components: components, children: content }) }));
};
export default Markdown;
//# sourceMappingURL=Markdown.js.map
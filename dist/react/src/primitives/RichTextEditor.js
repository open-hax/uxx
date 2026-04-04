import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
import { EditorToolbar } from './EditorToolbar.js';
import { MentionSuggestions } from './MentionSuggestions.js';
// Convert HTML to Markdown (basic)
function htmlToMarkdown(html) {
    let md = html;
    // Bold
    md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**');
    // Italic
    md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');
    md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*');
    // Strikethrough
    md = md.replace(/<s>(.*?)<\/s>/gi, '~~$1~~');
    md = md.replace(/<del>(.*?)<\/del>/gi, '~~$1~~');
    // Code
    md = md.replace(/<code>(.*?)<\/code>/gi, '`$1`');
    // Headings
    md = md.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n');
    md = md.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n');
    md = md.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n');
    md = md.replace(/<h4>(.*?)<\/h4>/gi, '#### $1\n');
    md = md.replace(/<h5>(.*?)<\/h5>/gi, '##### $1\n');
    md = md.replace(/<h6>(.*?)<\/h6>/gi, '###### $1\n');
    // Links
    md = md.replace(/<a href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
    // Lists
    md = md.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
    md = md.replace(/<\/?[ou]l>/gi, '\n');
    // Blockquotes
    md = md.replace(/<blockquote>(.*?)<\/blockquote>/gi, '> $1\n');
    // Paragraphs
    md = md.replace(/<p>(.*?)<\/p>/gi, '$1\n\n');
    md = md.replace(/<br\s*\/?>/gi, '\n');
    // Remove remaining tags
    md = md.replace(/<[^>]+>/g, '');
    // Decode entities
    md = md.replace(/&nbsp;/g, ' ');
    md = md.replace(/&lt;/g, '<');
    md = md.replace(/&gt;/g, '>');
    md = md.replace(/&amp;/g, '&');
    // Clean up extra whitespace
    md = md.replace(/\n{3,}/g, '\n\n');
    md = md.trim();
    return md;
}
// Convert Markdown to HTML (basic)
function markdownToHtml(md) {
    let html = md;
    // Code blocks (must be first)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // Strikethrough
    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    // Headings
    html = html.replace(/^###### (.*$)/gm, '<h6>$1</h6>');
    html = html.replace(/^##### (.*$)/gm, '<h5>$1</h5>');
    html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    // Blockquotes
    html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');
    // Lists
    html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = `<p>${html}</p>`;
    return html;
}
export const RichTextEditor = ({ value: controlledValue, defaultValue = '', format = 'markdown', placeholder = 'Start writing...', toolbar = true, readonly = false, disabled = false, autofocus = false, minHeight = '150px', maxHeight, imageUpload, mentions, links = { autolink: true, openInNewTab: true }, markdownShortcuts = true, spellcheck = true, onChange, onFocus, onBlur, onSave, className, }) => {
    const editorRef = useRef(null);
    const [internalValue, setInternalValue] = useState(() => {
        return format === 'html' ? defaultValue : markdownToHtml(defaultValue);
    });
    const [showMentions, setShowMentions] = useState(false);
    const [mentionFilter, setMentionFilter] = useState('');
    const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
    const value = controlledValue !== undefined
        ? (format === 'html' ? controlledValue : markdownToHtml(controlledValue))
        : internalValue;
    const mentionTrigger = mentions?.trigger ?? '@';
    // Execute formatting command
    const execCommand = useCallback((command, value) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        handleInput();
    }, []);
    // Handle input changes
    const handleInput = useCallback(() => {
        if (!editorRef.current)
            return;
        const html = editorRef.current.innerHTML;
        if (controlledValue === undefined) {
            setInternalValue(html);
        }
        // Convert to requested format for callback
        if (onChange) {
            if (format === 'markdown') {
                onChange(htmlToMarkdown(html));
            }
            else {
                onChange(html);
            }
        }
    }, [controlledValue, format, onChange]);
    // Handle image paste/upload
    const handlePaste = useCallback(async (e) => {
        const items = e.clipboardData?.items;
        if (!items)
            return;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file && imageUpload) {
                    const url = await imageUpload(file);
                    execCommand('insertImage', url);
                }
                break;
            }
        }
    }, [imageUpload, execCommand]);
    // Insert link
    const insertLink = useCallback(() => {
        const url = prompt('Enter URL:');
        if (url) {
            execCommand('createLink', url);
        }
    }, [execCommand]);
    // Insert image
    const insertImage = useCallback(() => {
        const url = prompt('Enter image URL:');
        if (url) {
            execCommand('insertImage', url);
        }
    }, [execCommand]);
    // Insert mention
    const insertMention = useCallback((item) => {
        const mentionText = `${mentionTrigger}${item.name}`;
        execCommand('insertText', mentionText);
        setShowMentions(false);
        setMentionFilter('');
        setSelectedMentionIndex(0);
    }, [execCommand, mentionTrigger]);
    // Filtered mentions
    const filteredMentions = useMemo(() => {
        if (!mentions)
            return [];
        return mentions.items.filter((item) => item.name.toLowerCase().includes(mentionFilter.toLowerCase()) ||
            item.id.toLowerCase().includes(mentionFilter.toLowerCase()));
    }, [mentions, mentionFilter]);
    useEffect(() => {
        if (!showMentions) {
            return;
        }
        setSelectedMentionIndex((prev) => Math.min(prev, Math.max(filteredMentions.length - 1, 0)));
    }, [filteredMentions.length, showMentions]);
    // Handle keyboard shortcuts
    const handleKeyDown = useCallback((e) => {
        // Save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (onSave && editorRef.current) {
                const html = editorRef.current.innerHTML;
                onSave(format === 'markdown' ? htmlToMarkdown(html) : html);
            }
            return;
        }
        // Bold
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            execCommand('bold');
            return;
        }
        // Italic
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault();
            execCommand('italic');
            return;
        }
        // Underline
        if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
            e.preventDefault();
            execCommand('underline');
            return;
        }
        // Mentions trigger / navigation
        if (mentions && e.key === mentionTrigger && !e.ctrlKey && !e.metaKey && !e.altKey) {
            setShowMentions(true);
            setMentionFilter('');
            setSelectedMentionIndex(0);
            return;
        }
        if (showMentions) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedMentionIndex((prev) => Math.min(prev + 1, Math.max(filteredMentions.length - 1, 0)));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedMentionIndex((prev) => Math.max(prev - 1, 0));
                return;
            }
            if (e.key === 'Enter') {
                const activeMention = filteredMentions[selectedMentionIndex];
                if (activeMention) {
                    e.preventDefault();
                    insertMention(activeMention);
                    return;
                }
            }
            if (e.key === 'Backspace') {
                setMentionFilter((prev) => prev.slice(0, -1));
                setSelectedMentionIndex(0);
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                setShowMentions(false);
                setMentionFilter('');
                setSelectedMentionIndex(0);
                return;
            }
            if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
                setMentionFilter((prev) => prev + e.key);
                setSelectedMentionIndex(0);
                return;
            }
        }
    }, [execCommand, filteredMentions, format, insertMention, mentionTrigger, mentions, onSave, selectedMentionIndex, showMentions]);
    // Toolbar items
    const defaultToolbarItems = useMemo(() => [
        { type: 'heading', label: 'H', shortcut: 'Ctrl+1' },
        { type: 'divider' },
        { type: 'bold', label: 'B', shortcut: 'Ctrl+B' },
        { type: 'italic', label: 'I', shortcut: 'Ctrl+I' },
        { type: 'underline', label: 'U', shortcut: 'Ctrl+U' },
        { type: 'strikethrough', label: 'S', shortcut: 'Ctrl+Shift+S' },
        { type: 'code', label: '</>' },
        { type: 'divider' },
        { type: 'link', label: '🔗', shortcut: 'Ctrl+K' },
        { type: 'image', label: '🖼️' },
        { type: 'divider' },
        { type: 'list', label: '•' },
        { type: 'quote', label: '"' },
        { type: 'code-block', label: '{ }' },
    ], []);
    const toolbarItems = useMemo(() => {
        if (toolbar && typeof toolbar === 'object') {
            if (toolbar.items && toolbar.items.length > 0) {
                return toolbar.items;
            }
            if (toolbar.groups && toolbar.groups.length > 0) {
                return toolbar.groups.flatMap((group, index) => index === 0 ? group.items : [{ type: 'divider' }, ...group.items]);
            }
        }
        return defaultToolbarItems;
    }, [defaultToolbarItems, toolbar]);
    // Handle toolbar action
    const handleToolbarAction = useCallback((item) => {
        switch (item.type) {
            case 'bold':
                execCommand('bold');
                break;
            case 'italic':
                execCommand('italic');
                break;
            case 'underline':
                execCommand('underline');
                break;
            case 'strikethrough':
                execCommand('strikeThrough');
                break;
            case 'code':
                execCommand('insertHTML', '<code>CODE</code>');
                break;
            case 'heading':
                execCommand('formatBlock', 'h2');
                break;
            case 'quote':
                execCommand('formatBlock', 'blockquote');
                break;
            case 'list':
                execCommand('insertUnorderedList');
                break;
            case 'link':
                insertLink();
                break;
            case 'image':
                insertImage();
                break;
            case 'code-block':
                execCommand('insertHTML', '<pre><code>Code here</code></pre>');
                break;
            case 'undo':
                execCommand('undo');
                break;
            case 'redo':
                execCommand('redo');
                break;
            case 'divider':
                break;
            default:
                break;
        }
    }, [execCommand, insertLink, insertImage]);
    const toolbarChromeItems = useMemo(() => toolbarItems.map((item, index) => {
        if (item.type === 'divider') {
            return { type: 'divider', key: `divider-${index}` };
        }
        return {
            key: `${item.type}-${index}`,
            label: item.icon || item.label || item.type,
            title: item.shortcut ? `${item.label ?? item.type} (${item.shortcut})` : item.label,
            disabled,
            onClick: () => handleToolbarAction(item),
            buttonStyle: {
                fontWeight: item.type === 'bold' ? 'bold' : 'normal',
                fontStyle: item.type === 'italic' ? 'italic' : 'normal',
            },
        };
    }), [disabled, handleToolbarAction, toolbarItems]);
    // Focus on mount if autofocus
    useEffect(() => {
        if (autofocus && editorRef.current) {
            editorRef.current.focus();
        }
    }, [autofocus]);
    // Set initial content
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, []);
    return (_jsxs("div", { className: className, "data-component": "rich-text-editor", "data-readonly": readonly, style: {
            display: 'flex',
            flexDirection: 'column',
            background: tokens.colors.background.default,
            border: `1px solid ${tokens.colors.border.default}`,
            borderRadius: tokens.spacing[2],
            overflow: 'hidden',
        }, children: [toolbar && !readonly && (_jsx(EditorToolbar, { items: toolbarChromeItems, background: tokens.colors.background.surface, borderColor: tokens.colors.border.subtle, textColor: tokens.colors.text.default, gap: 2 })), _jsxs("div", { style: { position: 'relative' }, children: [_jsx("div", { ref: editorRef, contentEditable: !readonly && !disabled, onInput: handleInput, onKeyDown: handleKeyDown, onPaste: handlePaste, onFocus: onFocus, onBlur: onBlur, spellCheck: spellcheck, "data-placeholder": placeholder, style: {
                            minHeight,
                            maxHeight,
                            padding: tokens.spacing[4],
                            outline: 'none',
                            color: tokens.colors.text.default,
                            fontFamily: 'inherit',
                            fontSize: 14,
                            lineHeight: 1.6,
                            overflow: 'auto',
                            opacity: disabled ? 0.5 : 1,
                        } }), !value && (_jsx("div", { style: {
                            position: 'absolute',
                            top: tokens.spacing[4],
                            left: tokens.spacing[4],
                            color: tokens.colors.text.subtle,
                            pointerEvents: 'none',
                            fontSize: 14,
                        }, children: placeholder })), showMentions && filteredMentions.length > 0 && (_jsx(MentionSuggestions, { items: filteredMentions, onSelect: insertMention, renderItem: mentions?.render, selectedIndex: selectedMentionIndex, onSelectedIndexChange: setSelectedMentionIndex }))] }), _jsx("style", { children: `
        [data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: ${tokens.colors.text.subtle};
          pointer-events: none;
        }
      ` })] }));
};
export default RichTextEditor;
//# sourceMappingURL=RichTextEditor.js.map
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
import { Markdown } from './Markdown.js';
import { EditorStatusBar } from './EditorStatusBar.js';
import { EditorToolbar } from './EditorToolbar.js';
import { useResolvedTheme } from '../theme.js';
export const MarkdownEditor = ({ value: controlledValue, defaultValue = '', previewMode = 'split', previewRatio = 0.5, toolbar = true, statusBar = true, lineNumbers = true, wrap = true, theme = 'dark', highlightActiveLine = true, spellcheck = false, placeholder = 'Write your markdown here...', onChange, onSave, autosave, className, }) => {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
    const [activeTab, setActiveTab] = useState('editor');
    const textareaRef = useRef(null);
    const previewRef = useRef(null);
    const value = controlledValue !== undefined ? controlledValue : internalValue;
    const resolvedTheme = useResolvedTheme(theme);
    const themeColors = resolvedTheme.colors;
    // Calculate stats
    const stats = useMemo(() => {
        const lines = value.split('\n');
        const words = value.trim() ? value.trim().split(/\s+/).length : 0;
        const characters = value.length;
        return { lines: lines.length, words, characters };
    }, [value]);
    // Handle change
    const handleChange = useCallback((e) => {
        const newValue = e.target.value;
        if (controlledValue === undefined) {
            setInternalValue(newValue);
        }
        onChange?.(newValue);
    }, [controlledValue, onChange]);
    // Track cursor position
    const handleCursorChange = useCallback(() => {
        if (!textareaRef.current)
            return;
        const textarea = textareaRef.current;
        const text = textarea.value.substring(0, textarea.selectionStart);
        const lines = text.split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        setCursorPosition({ line, column });
    }, []);
    // Insert text at cursor
    const insertText = useCallback((text) => {
        if (!textareaRef.current)
            return;
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = value.substring(0, start) + text + value.substring(end);
        if (controlledValue === undefined) {
            setInternalValue(newValue);
        }
        onChange?.(newValue);
        // Reset cursor position
        setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + text.length;
            textarea.focus();
        }, 0);
    }, [value, controlledValue, onChange]);
    // Insert formatting around selection
    const insertFormatting = useCallback((before, after) => {
        if (!textareaRef.current)
            return;
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);
        const newValue = value.substring(0, start) +
            before +
            selectedText +
            after +
            value.substring(end);
        if (controlledValue === undefined) {
            setInternalValue(newValue);
        }
        onChange?.(newValue);
        // Reset cursor position
        setTimeout(() => {
            textarea.selectionStart = start + before.length;
            textarea.selectionEnd = start + before.length + selectedText.length;
            textarea.focus();
        }, 0);
    }, [value, controlledValue, onChange]);
    // Keyboard shortcuts
    const handleKeyDown = useCallback((e) => {
        const hasAccel = e.ctrlKey || e.metaKey;
        const key = e.key.toLowerCase();
        // Save: Ctrl+S or Cmd+S
        if (hasAccel && !e.shiftKey && key === 's') {
            e.preventDefault();
            onSave?.(value);
            return;
        }
        if (hasAccel && e.shiftKey) {
            if (key === 's') {
                e.preventDefault();
                insertFormatting('~~', '~~');
                return;
            }
            if (key === 'i') {
                e.preventDefault();
                insertText('![alt](url)');
                return;
            }
            if (key === 'l') {
                e.preventDefault();
                insertText('1. ');
                return;
            }
            if (key === 'c') {
                e.preventDefault();
                insertText('```\n\n```\n');
                return;
            }
        }
        if (hasAccel && !e.shiftKey) {
            if (key === '1') {
                e.preventDefault();
                insertText('# ');
                return;
            }
            if (key === '2') {
                e.preventDefault();
                insertText('## ');
                return;
            }
            if (key === '3') {
                e.preventDefault();
                insertText('### ');
                return;
            }
            if (key === 'k') {
                e.preventDefault();
                insertFormatting('[', '](url)');
                return;
            }
            if (key === 'l') {
                e.preventDefault();
                insertText('- ');
                return;
            }
            if (key === 'q') {
                e.preventDefault();
                insertText('> ');
                return;
            }
            if (e.key === '`') {
                e.preventDefault();
                insertFormatting('`', '`');
                return;
            }
        }
        // Bold: Ctrl+B
        if (hasAccel && !e.shiftKey && key === 'b') {
            e.preventDefault();
            insertFormatting('**', '**');
            return;
        }
        // Italic: Ctrl+I
        if (hasAccel && !e.shiftKey && key === 'i') {
            e.preventDefault();
            insertFormatting('*', '*');
            return;
        }
        // Tab handling
        if (e.key === 'Tab') {
            e.preventDefault();
            insertText('  ');
        }
    }, [insertFormatting, insertText, onSave, value]);
    // Toolbar actions
    const toolbarActions = useMemo(() => [
        {
            key: 'h1',
            label: 'H1',
            onClick: () => insertText('# '),
            title: 'Ctrl+1',
        },
        {
            key: 'h2',
            label: 'H2',
            onClick: () => insertText('## '),
            title: 'Ctrl+2',
        },
        {
            key: 'h3',
            label: 'H3',
            onClick: () => insertText('### '),
            title: 'Ctrl+3',
        },
        { type: 'divider', key: 'div-heading' },
        {
            key: 'bold',
            label: 'B',
            onClick: () => insertFormatting('**', '**'),
            title: 'Ctrl+B',
            buttonStyle: { fontWeight: 'bold' },
        },
        {
            key: 'italic',
            label: 'I',
            onClick: () => insertFormatting('*', '*'),
            title: 'Ctrl+I',
            buttonStyle: { fontStyle: 'italic' },
        },
        {
            key: 'strike',
            label: 'S',
            onClick: () => insertFormatting('~~', '~~'),
            title: 'Ctrl+Shift+S',
        },
        {
            key: 'inline-code',
            label: '</>',
            onClick: () => insertFormatting('`', '`'),
            title: 'Ctrl+`',
        },
        { type: 'divider', key: 'div-format' },
        {
            key: 'link',
            label: 'Link',
            onClick: () => insertFormatting('[', '](url)'),
            title: 'Ctrl+K',
        },
        {
            key: 'image',
            label: 'Image',
            onClick: () => insertText('![alt](url)'),
            title: 'Ctrl+Shift+I',
        },
        { type: 'divider', key: 'div-media' },
        {
            key: 'list',
            label: 'List',
            onClick: () => insertText('- '),
            title: 'Ctrl+L',
        },
        {
            key: 'numbered-list',
            label: 'Num',
            onClick: () => insertText('1. '),
            title: 'Ctrl+Shift+L',
        },
        {
            key: 'quote',
            label: 'Quote',
            onClick: () => insertText('> '),
            title: 'Ctrl+Q',
        },
        {
            key: 'code-block',
            label: 'Code',
            onClick: () => insertText('```\n\n```\n'),
            title: 'Ctrl+Shift+C',
        },
    ], [insertText, insertFormatting]);
    const statusItems = useMemo(() => [
        {
            key: 'cursor',
            label: `Ln ${cursorPosition.line}, Col ${cursorPosition.column}`,
        },
        { key: 'lines', label: `${stats.lines} lines` },
        { key: 'words', label: `${stats.words} words` },
        { key: 'characters', label: `${stats.characters} characters` },
        { key: 'mode', label: 'Markdown', align: 'end' },
    ], [cursorPosition, stats]);
    // Autosave
    useEffect(() => {
        if (!autosave?.enabled || !autosave?.key)
            return;
        const timeoutId = setTimeout(() => {
            if (typeof window !== 'undefined') {
                localStorage.setItem(autosave.key, value);
            }
        }, autosave.delay || 1000);
        return () => clearTimeout(timeoutId);
    }, [value, autosave]);
    // Render editor
    const renderEditor = () => (_jsxs("div", { style: {
            flex: previewMode === 'split' ? 1 - previewRatio : 1,
            display: 'flex',
            flexDirection: 'column',
            background: themeColors.background.default,
            borderRadius: tokens.spacing[2],
            overflow: 'hidden',
        }, children: [toolbar && (_jsx(EditorToolbar, { items: toolbarActions, background: themeColors.background.surface, borderColor: themeColors.border.subtle, textColor: themeColors.text.default })), _jsxs("div", { style: {
                    flex: 1,
                    display: 'flex',
                    overflow: 'hidden',
                }, children: [lineNumbers && (_jsx("div", { style: {
                            padding: '12px 8px',
                            background: themeColors.background.elevated,
                            color: themeColors.text.subtle,
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 13,
                            lineHeight: 1.6,
                            textAlign: 'right',
                            userSelect: 'none',
                            minWidth: 48,
                            overflow: 'hidden',
                        }, children: value.split('\n').map((_, i) => (_jsx("div", { children: i + 1 }, i))) })), _jsx("textarea", { ref: textareaRef, value: value, onChange: handleChange, onKeyDown: handleKeyDown, onClick: handleCursorChange, onKeyUp: handleCursorChange, placeholder: placeholder, spellCheck: spellcheck, style: {
                            flex: 1,
                            padding: 12,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: themeColors.text.default,
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 14,
                            lineHeight: 1.6,
                            resize: 'none',
                            whiteSpace: wrap ? 'pre-wrap' : 'pre',
                            overflow: 'auto',
                        } })] }), statusBar && (_jsx(EditorStatusBar, { items: statusItems, background: themeColors.background.surface, borderColor: themeColors.border.subtle, textColor: themeColors.text.muted }))] }));
    // Render preview
    const renderPreview = () => (_jsx("div", { ref: previewRef, style: {
            flex: previewMode === 'split' ? previewRatio : 1,
            padding: 16,
            background: themeColors.background.surface,
            borderRadius: tokens.spacing[2],
            overflow: 'auto',
        }, children: value.trim() ? (_jsx(Markdown, { content: value, theme: theme })) : (_jsx("div", { style: {
                color: themeColors.text.subtle,
                fontStyle: 'italic',
            }, children: "Preview will appear here" })) }));
    // Tabbed mode
    if (previewMode === 'tabbed') {
        return (_jsxs("div", { className: className, "data-component": "markdown-editor", "data-preview-mode": previewMode, style: {
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                background: themeColors.background.default,
                borderRadius: tokens.spacing[2],
                overflow: 'hidden',
            }, children: [_jsxs("div", { style: {
                        display: 'flex',
                        borderBottom: `1px solid ${themeColors.border.default}`,
                    }, children: [_jsx("button", { onClick: () => setActiveTab('editor'), style: {
                                padding: '12px 24px',
                                background: activeTab === 'editor' ? themeColors.background.surface : 'transparent',
                                border: 'none',
                                borderBottom: activeTab === 'editor' ? `2px solid ${themeColors.accent.cyan}` : 'none',
                                color: themeColors.text.default,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 14,
                                fontWeight: activeTab === 'editor' ? 500 : 400,
                            }, children: "Editor" }), _jsx("button", { onClick: () => setActiveTab('preview'), style: {
                                padding: '12px 24px',
                                background: activeTab === 'preview' ? themeColors.background.surface : 'transparent',
                                border: 'none',
                                borderBottom: activeTab === 'preview' ? `2px solid ${themeColors.accent.cyan}` : 'none',
                                color: themeColors.text.default,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 14,
                                fontWeight: activeTab === 'preview' ? 500 : 400,
                            }, children: "Preview" })] }), _jsx("div", { style: { flex: 1, overflow: 'hidden' }, children: activeTab === 'editor' ? renderEditor() : renderPreview() })] }));
    }
    // Editor-only mode
    if (previewMode === 'editor-only') {
        return (_jsx("div", { className: className, "data-component": "markdown-editor", "data-preview-mode": previewMode, style: {
                height: '100%',
                background: themeColors.background.default,
                borderRadius: tokens.spacing[2],
                overflow: 'hidden',
            }, children: renderEditor() }));
    }
    // Preview-only mode
    if (previewMode === 'preview-only') {
        return (_jsx("div", { className: className, "data-component": "markdown-editor", "data-preview-mode": previewMode, style: {
                height: '100%',
                background: themeColors.background.default,
                borderRadius: tokens.spacing[2],
                overflow: 'hidden',
            }, children: renderPreview() }));
    }
    // Split mode (default)
    return (_jsxs("div", { className: className, "data-component": "markdown-editor", "data-preview-mode": previewMode, style: {
            display: 'flex',
            gap: 1,
            height: '100%',
            background: themeColors.border.default,
            borderRadius: tokens.spacing[2],
            overflow: 'hidden',
        }, children: [renderEditor(), renderPreview()] }));
};
export default MarkdownEditor;
//# sourceMappingURL=MarkdownEditor.js.map
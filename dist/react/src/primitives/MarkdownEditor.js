import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
import { Markdown } from './Markdown.js';
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
    // Keyboard shortcuts
    const handleKeyDown = useCallback((e) => {
        // Save: Ctrl+S or Cmd+S
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            onSave?.(value);
            return;
        }
        // Bold: Ctrl+B
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            insertFormatting('**', '**');
            return;
        }
        // Italic: Ctrl+I
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault();
            insertFormatting('*', '*');
            return;
        }
        // Tab handling
        if (e.key === 'Tab') {
            e.preventDefault();
            insertText('  ');
            return;
        }
    }, [value, onSave]);
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
    // Toolbar actions
    const toolbarActions = useMemo(() => [
        {
            label: 'H1',
            action: () => insertText('# '),
            shortcut: 'Ctrl+1',
        },
        {
            label: 'H2',
            action: () => insertText('## '),
            shortcut: 'Ctrl+2',
        },
        {
            label: 'H3',
            action: () => insertText('### '),
            shortcut: 'Ctrl+3',
        },
        { divider: true },
        {
            label: 'B',
            action: () => insertFormatting('**', '**'),
            shortcut: 'Ctrl+B',
        },
        {
            label: 'I',
            action: () => insertFormatting('*', '*'),
            shortcut: 'Ctrl+I',
        },
        {
            label: 'S',
            action: () => insertFormatting('~~', '~~'),
            shortcut: 'Ctrl+Shift+S',
        },
        {
            label: '</>',
            action: () => insertFormatting('`', '`'),
            shortcut: 'Ctrl+`',
        },
        { divider: true },
        {
            label: 'Link',
            action: () => insertFormatting('[', '](url)'),
            shortcut: 'Ctrl+K',
        },
        {
            label: 'Image',
            action: () => insertText('![alt](url)'),
            shortcut: 'Ctrl+Shift+I',
        },
        { divider: true },
        {
            label: 'List',
            action: () => insertText('- '),
            shortcut: 'Ctrl+L',
        },
        {
            label: 'Num',
            action: () => insertText('1. '),
            shortcut: 'Ctrl+Shift+L',
        },
        {
            label: 'Quote',
            action: () => insertText('> '),
            shortcut: 'Ctrl+Q',
        },
        {
            label: 'Code',
            action: () => insertText('```\n\n```\n'),
            shortcut: 'Ctrl+Shift+C',
        },
    ], [insertText, insertFormatting]);
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
        }, children: [toolbar && (_jsx("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '8px 12px',
                    background: themeColors.background.surface,
                    borderBottom: `1px solid ${themeColors.border.subtle}`,
                    flexWrap: 'wrap',
                }, children: toolbarActions.map((item, index) => {
                    if ('divider' in item) {
                        return (_jsx("div", { style: {
                                width: 1,
                                height: 20,
                                background: themeColors.border.default,
                                margin: '0 4px',
                            } }, index));
                    }
                    return (_jsx("button", { onClick: item.action, title: item.shortcut, style: {
                            background: 'none',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: 4,
                            color: themeColors.text.default,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: 13,
                            fontWeight: item.label === 'B' ? 'bold' : 'normal',
                            fontStyle: item.label === 'I' ? 'italic' : 'normal',
                        }, children: item.label }, index));
                }) })), _jsxs("div", { style: {
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
                        } })] }), statusBar && (_jsxs("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '4px 12px',
                    background: themeColors.background.surface,
                    borderTop: `1px solid ${themeColors.border.subtle}`,
                    fontSize: 12,
                    color: themeColors.text.muted,
                }, children: [_jsxs("span", { children: ["Ln ", cursorPosition.line, ", Col ", cursorPosition.column] }), _jsxs("span", { children: [stats.lines, " lines"] }), _jsxs("span", { children: [stats.words, " words"] }), _jsxs("span", { children: [stats.characters, " characters"] }), _jsx("span", { style: { marginLeft: 'auto' }, children: "Markdown" })] }))] }));
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
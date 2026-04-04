import React from 'react';
import type { MentionItem, ToolbarConfig, ToolbarItem } from './RichTextEditor.types.js';
export interface RichTextEditorProps {
    value?: string;
    defaultValue?: string;
    format?: 'html' | 'markdown' | 'json';
    placeholder?: string;
    toolbar?: boolean | ToolbarConfig;
    readonly?: boolean;
    disabled?: boolean;
    autofocus?: boolean;
    minHeight?: string;
    maxHeight?: string;
    imageUpload?: (file: File) => Promise<string>;
    mentions?: {
        items: MentionItem[];
        trigger?: string;
        render?: (item: MentionItem) => React.ReactNode;
    };
    links?: {
        autolink?: boolean;
        openInNewTab?: boolean;
    };
    markdownShortcuts?: boolean;
    spellcheck?: boolean;
    codeBlockLanguage?: string;
    onChange?: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onSave?: (value: string) => void;
    className?: string;
}
export interface ToolbarGroup {
    name: string;
    items: ToolbarItem[];
}
export type { MentionItem, ToolbarConfig, ToolbarItem } from './RichTextEditor.types.js';
export declare const RichTextEditor: React.FC<RichTextEditorProps>;
export default RichTextEditor;
//# sourceMappingURL=RichTextEditor.d.ts.map
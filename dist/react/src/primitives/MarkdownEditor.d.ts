import React from 'react';
import { type ThemePreference } from '@open-hax/uxx/tokens';
export interface MarkdownEditorProps {
    value?: string;
    defaultValue?: string;
    previewMode?: 'split' | 'preview-only' | 'editor-only' | 'tabbed';
    previewRatio?: number;
    toolbar?: boolean;
    statusBar?: boolean;
    lineNumbers?: boolean;
    wrap?: boolean;
    theme?: ThemePreference;
    highlightActiveLine?: boolean;
    matchBrackets?: boolean;
    spellcheck?: boolean;
    placeholder?: string;
    imageUpload?: (file: File) => Promise<string>;
    onChange?: (value: string) => void;
    onSave?: (value: string) => void;
    onPreviewClick?: (element: string, event: Event) => void;
    autosave?: {
        enabled?: boolean;
        key?: string;
        delay?: number;
    };
    className?: string;
}
export declare const MarkdownEditor: React.FC<MarkdownEditorProps>;
export default MarkdownEditor;
//# sourceMappingURL=MarkdownEditor.d.ts.map
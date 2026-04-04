import React from 'react';
import { type ThemePreference } from '@open-hax/uxx/tokens';
export interface CodeBlockProps {
    code: string;
    language?: string;
    filename?: string;
    theme?: ThemePreference;
    lineNumbers?: boolean;
    highlightLines?: number[];
    startLine?: number;
    maxLines?: number;
    showCopy?: boolean;
    showLanguage?: boolean;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    wrap?: boolean;
    tabSize?: number;
    diff?: 'none' | 'add' | 'remove';
    onCopy?: () => void;
    className?: string;
}
export declare const CodeBlock: React.FC<CodeBlockProps>;
export default CodeBlock;
//# sourceMappingURL=CodeBlock.d.ts.map
import React from 'react';
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
export declare const Markdown: React.FC<MarkdownProps>;
export default Markdown;
//# sourceMappingURL=Markdown.d.ts.map
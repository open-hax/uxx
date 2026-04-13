import type { CSSProperties, ReactNode } from 'react';
export interface EditorToolbarDividerItem {
    type: 'divider';
    key?: string;
    testId?: string;
}
export interface EditorToolbarButtonItem {
    type?: 'button';
    key?: string;
    label: ReactNode;
    title?: string;
    ariaLabel?: string;
    disabled?: boolean;
    onClick?: () => void;
    buttonStyle?: CSSProperties;
    testId?: string;
}
export type EditorToolbarItem = EditorToolbarDividerItem | EditorToolbarButtonItem;
export interface EditorToolbarProps {
    items: EditorToolbarItem[];
    className?: string;
    background?: string;
    borderColor?: string;
    textColor?: string;
    padding?: string | number;
    gap?: number;
    wrap?: boolean;
}
export declare function EditorToolbar({ items, className, background, borderColor, textColor, padding, gap, wrap, }: EditorToolbarProps): import("react/jsx-runtime").JSX.Element;
export default EditorToolbar;
//# sourceMappingURL=EditorToolbar.d.ts.map
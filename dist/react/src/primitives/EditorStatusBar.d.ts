import type { ReactNode } from 'react';
export interface EditorStatusBarItem {
    key?: string;
    label: ReactNode;
    align?: 'start' | 'end';
    testId?: string;
}
export interface EditorStatusBarProps {
    items: EditorStatusBarItem[];
    className?: string;
    background?: string;
    borderColor?: string;
    textColor?: string;
    padding?: string | number;
    gap?: number;
}
export declare function EditorStatusBar({ items, className, background, borderColor, textColor, padding, gap, }: EditorStatusBarProps): import("react/jsx-runtime").JSX.Element;
export default EditorStatusBar;
//# sourceMappingURL=EditorStatusBar.d.ts.map
import type { ReactNode } from 'react';
export interface PanelHeaderProps {
    readonly title: string;
    readonly description?: string;
    readonly kicker?: string;
    readonly meta?: ReactNode;
    readonly actions?: ReactNode;
}
export declare function PanelHeader({ title, description, kicker, meta, actions }: PanelHeaderProps): import("react/jsx-runtime").JSX.Element;
export default PanelHeader;
//# sourceMappingURL=PanelHeader.d.ts.map
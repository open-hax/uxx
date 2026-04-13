import type { Entity } from './InspectorPane.types.js';
export interface InspectorHeaderProps {
    selection?: Entity | null;
    activePinned?: boolean;
    hasPinnedBar?: boolean;
    title?: string;
}
export declare function InspectorHeader({ selection, activePinned, hasPinnedBar, title, }: InspectorHeaderProps): import("react/jsx-runtime").JSX.Element;
export default InspectorHeader;
//# sourceMappingURL=InspectorHeader.d.ts.map
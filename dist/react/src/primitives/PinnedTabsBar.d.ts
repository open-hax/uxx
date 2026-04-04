import type { Entity, PinnedEntry } from './InspectorPane.types.js';
export interface PinnedTabsBarProps {
    pinned: PinnedEntry[];
    activePinnedKey?: string | null;
    onSetActive?: (key: string) => void;
    onUnpin?: (key: string) => void;
    onPin?: (entity: Entity) => void;
    selection?: Entity | null;
    canPin?: boolean;
    pinLabel?: string;
}
export declare function PinnedTabsBar({ pinned, activePinnedKey, onSetActive, onUnpin, onPin, selection, canPin, pinLabel, }: PinnedTabsBarProps): import("react/jsx-runtime").JSX.Element;
export default PinnedTabsBar;
//# sourceMappingURL=PinnedTabsBar.d.ts.map
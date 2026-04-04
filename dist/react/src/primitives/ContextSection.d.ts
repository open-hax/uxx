import type { ReactNode } from 'react';
import type { Entity } from './InspectorPane.types.js';
export interface ContextSectionProps {
    context: Entity[];
    onContextSelect?: (entity: Entity) => void;
    renderContextItem?: (entity: Entity) => ReactNode;
    title?: string;
    emptyMessage?: string;
}
export declare function ContextSection({ context, onContextSelect, renderContextItem, title, emptyMessage, }: ContextSectionProps): import("react/jsx-runtime").JSX.Element;
export default ContextSection;
//# sourceMappingURL=ContextSection.d.ts.map
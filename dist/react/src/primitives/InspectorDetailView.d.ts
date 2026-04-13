import type { ReactNode } from 'react';
import type { Entity } from './InspectorPane.types.js';
export interface InspectorDetailViewProps {
    entity: Entity;
    renderDetail?: (entity: Entity) => ReactNode;
    title?: string;
}
export declare function InspectorDetailView({ entity, renderDetail, title, }: InspectorDetailViewProps): import("react/jsx-runtime").JSX.Element;
export default InspectorDetailView;
//# sourceMappingURL=InspectorDetailView.d.ts.map
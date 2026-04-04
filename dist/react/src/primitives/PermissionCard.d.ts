import type { CSSProperties } from 'react';
import type { PermissionRequest, PermissionResponse } from './PermissionPrompts.types.js';
export interface PermissionCardProps {
    permission: PermissionRequest;
    onResponse: (id: string, response: PermissionResponse) => void;
    showMetadata?: boolean;
    style?: CSSProperties;
    className?: string;
}
export declare function PermissionCard({ permission, onResponse, showMetadata, style, className }: PermissionCardProps): import("react/jsx-runtime").JSX.Element;
export default PermissionCard;
//# sourceMappingURL=PermissionCard.d.ts.map
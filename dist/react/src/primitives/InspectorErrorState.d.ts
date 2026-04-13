import type { ErrorState } from './InspectorPane.types.js';
export interface InspectorErrorStateProps {
    error: ErrorState;
    onRetry?: () => void;
    retryLabel?: string;
}
export declare function InspectorErrorState({ error, onRetry, retryLabel, }: InspectorErrorStateProps): import("react/jsx-runtime").JSX.Element;
export default InspectorErrorState;
//# sourceMappingURL=InspectorErrorState.d.ts.map
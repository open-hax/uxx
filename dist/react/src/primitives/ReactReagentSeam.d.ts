/**
 * ReactReagentSeam Component
 *
 * Implements the react-reagent-seam.edn contract.
 * An adapter pattern for embedding components inside a host application,
 * enabling bidirectional state sharing and event communication.
 *
 * In pure React contexts, this provides the seam pattern without Reagent.
 * For Reagent interop, use the Reagent version which provides the full adapter.
 */
import { type ReactNode } from 'react';
export interface Adapter {
    /** Ready state: 'ready' or 'booting' */
    readyState: string;
    /** Host count value */
    hostCount: number;
    /** Event count value */
    eventCount: number;
    /** Increment host count */
    incrementHostCount: () => void;
    /** Emit donor event */
    emitDonorEvent: () => void;
}
export interface ReactReagentSeamProps {
    /** Initial host state */
    initialState?: {
        hostCount?: number;
        eventCount?: number;
    };
    /** Function that renders the donor component(s) */
    renderDonor: (adapter: Adapter) => ReactNode;
    /** Function that renders the host component(s) */
    renderHost: (adapter: Adapter) => ReactNode;
    /** CSS class for scoping styles */
    scopeClass?: string;
    /** Callback when seam is mounted */
    onMount?: () => void;
    /** Callback when seam is unmounted */
    onUnmount?: () => void;
}
/**
 * Hook to access the adapter from nested components.
 */
export declare function useAdapter(): Adapter | null;
/**
 * Adapter seam for embedding components with shared state.
 *
 * @example
 * ```tsx
 * <ReactReagentSeam
 *   initialState={{ hostCount: 0, eventCount: 0 }}
 *   renderHost={(adapter) => (
 *     <div className="host-panel">
 *       <h2>Host Panel</h2>
 *       <p>Ready: <span className="status">{adapter.readyState}</span></p>
 *       <p>Count: <strong>{adapter.hostCount}</strong></p>
 *       <button onClick={adapter.incrementHostCount}>Increment</button>
 *     </div>
 *   )}
 *   renderDonor={(adapter) => (
 *     <div className="donor-panel">
 *       <h3>Donor Panel</h3>
 *       <p>Events: <strong>{adapter.eventCount}</strong></p>
 *       <button onClick={adapter.emitDonorEvent}>Emit Event</button>
 *     </div>
 *   )}
 * />
 * ```
 */
export declare function ReactReagentSeam({ initialState, renderDonor, renderHost, scopeClass, onMount, onUnmount, }: ReactReagentSeamProps): import("react/jsx-runtime").JSX.Element;
export default ReactReagentSeam;
//# sourceMappingURL=ReactReagentSeam.d.ts.map
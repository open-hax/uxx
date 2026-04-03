/**
 * Tooltip Component
 *
 * Implements the tooltip.edn contract.
 * Tooltip overlay that appears on hover or focus, with configurable positioning.
 */
import { type ReactNode } from 'react';
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
export type TooltipTrigger = 'hover' | 'focus' | 'hover-focus' | 'click';
export interface TooltipProps {
    /** Content to display in the tooltip */
    content: ReactNode;
    /** Preferred placement of the tooltip */
    placement?: TooltipPlacement;
    /** Event that triggers the tooltip */
    trigger?: TooltipTrigger;
    /** Delay in ms before showing */
    delay?: number;
    /** Delay in ms before hiding */
    hideDelay?: number;
    /** Whether the tooltip is disabled */
    disabled?: boolean;
    /** Distance from trigger to tooltip */
    offset?: number;
    /** Whether to show an arrow */
    arrow?: boolean;
    /** Whether tooltip content is interactive */
    interactive?: boolean;
    /** The trigger element */
    children: ReactNode;
}
/**
 * Tooltip overlay that appears on hover or focus.
 *
 * @example
 * ```tsx
 * <Tooltip content="This is a tooltip">
 *   <Button>Hover me</Button>
 * </Tooltip>
 *
 * <Tooltip content="Helpful info" placement="right">
 *   <span>?</span>
 * </Tooltip>
 * ```
 */
export declare function Tooltip({ content, placement, trigger, delay, hideDelay, disabled, offset, arrow, interactive, children, }: TooltipProps): import("react/jsx-runtime").JSX.Element;
export default Tooltip;
//# sourceMappingURL=Tooltip.d.ts.map
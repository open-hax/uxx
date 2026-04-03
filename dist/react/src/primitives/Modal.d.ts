/**
 * Modal Component
 *
 * Implements the modal.edn contract.
 * Modal dialog overlay with backdrop, focus trap, and keyboard dismissal.
 */
import { type ReactNode } from 'react';
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ScrollBehavior = 'inside' | 'outside';
export interface ModalProps {
    /** Whether the modal is currently open */
    open?: boolean;
    /** Callback fired when modal should close */
    onClose: () => void;
    /** Size of the modal dialog */
    size?: ModalSize;
    /** Whether the modal can be closed by user interaction */
    closable?: boolean;
    /** Whether clicking the backdrop closes the modal */
    closeOnBackdrop?: boolean;
    /** Whether pressing Escape closes the modal */
    closeOnEscape?: boolean;
    /** Whether to center the modal vertically */
    centered?: boolean;
    /** Scroll behavior */
    scrollBehavior?: ScrollBehavior;
    /** Header slot */
    header?: ReactNode;
    /** Title text (rendered in header if no header slot) */
    title?: string;
    /** Main content */
    children?: ReactNode;
    /** Footer slot */
    footer?: ReactNode;
}
/**
 * Modal dialog overlay with backdrop, focus trap, and keyboard dismissal.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <Modal open={open} onClose={() => setOpen(false)} title="Confirm Action">
 *   <p>Are you sure you want to proceed?</p>
 *   <Button onClick={() => setOpen(false)}>Cancel</Button>
 *   <Button variant="primary">Confirm</Button>
 * </Modal>
 * ```
 */
export declare const Modal: import("react").ForwardRefExoticComponent<ModalProps & import("react").RefAttributes<HTMLDivElement>>;
export default Modal;
//# sourceMappingURL=Modal.d.ts.map
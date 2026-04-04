import { jsx as _jsx } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
const baseStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: `${tokens.spacing[2]}px`,
    padding: `${tokens.spacing[3]}px ${tokens.spacing[5]}px`,
    borderTop: `1px solid ${tokens.colors.border.default}`,
};
export function ModalFooter({ children, style, className }) {
    return (_jsx("div", { "data-component": "modal-footer", style: { ...baseStyles, ...style }, className: className, children: children }));
}
export default ModalFooter;
//# sourceMappingURL=ModalFooter.js.map
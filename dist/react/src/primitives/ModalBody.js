import { jsx as _jsx } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
const baseStyles = {
    flex: 1,
    padding: `${tokens.spacing[4]}px ${tokens.spacing[5]}px`,
    overflowY: 'auto',
};
export function ModalBody({ children, style, className }) {
    return (_jsx("div", { "data-component": "modal-body", style: { ...baseStyles, ...style }, className: className, children: children }));
}
export default ModalBody;
//# sourceMappingURL=ModalBody.js.map
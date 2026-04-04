import { jsx as _jsx } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
const baseStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: `${tokens.spacing[2]}px`,
    padding: `${tokens.spacing[3]}px ${tokens.spacing[4]}px`,
    borderTop: `1px solid ${tokens.colors.border.default}`,
};
export function CardFooter({ children, style, className }) {
    return (_jsx("div", { "data-component": "card-footer", style: { ...baseStyles, ...style }, className: className, children: children }));
}
export default CardFooter;
//# sourceMappingURL=CardFooter.js.map
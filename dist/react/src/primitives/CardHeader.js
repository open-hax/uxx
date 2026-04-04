import { jsx as _jsx } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
const baseStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacing[3]}px ${tokens.spacing[4]}px`,
    borderBottom: `1px solid ${tokens.colors.border.default}`,
    fontWeight: tokens.fontWeight.semibold,
    fontSize: tokens.fontSize.lg,
    gap: `${tokens.spacing[2]}px`,
};
export function CardHeader({ children, style, className }) {
    return (_jsx("div", { "data-component": "card-header", style: { ...baseStyles, ...style }, className: className, children: children }));
}
export default CardHeader;
//# sourceMappingURL=CardHeader.js.map
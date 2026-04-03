import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
import { Badge } from './Badge.js';
const sizeGap = {
    xs: 4,
    sm: 6,
    md: 8,
};
export function StatusChipStack({ items, size = 'sm', separator = '·' }) {
    const style = {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: `${sizeGap[size]}px`,
    };
    const sepStyle = {
        color: tokens.colors.text.muted,
        fontSize: tokens.fontSize.xs,
        userSelect: 'none',
    };
    return (_jsx("div", { "data-component": "status-chip-stack", "data-size": size, style: style, children: items.map((item, index) => (_jsxs("span", { style: { display: 'inline-flex', alignItems: 'center', gap: `${tokens.spacing[1]}px` }, children: [_jsx(Badge, { variant: item.variant ?? 'default', size: size, iconStart: item.icon, children: item.label }), index < items.length - 1 && _jsx("span", { style: sepStyle, children: separator })] }, `${item.label}-${index}`))) }));
}
export default StatusChipStack;
//# sourceMappingURL=StatusChipStack.js.map
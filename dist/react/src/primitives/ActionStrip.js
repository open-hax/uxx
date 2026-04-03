import { jsx as _jsx } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
const alignMap = {
    start: 'flex-start',
    end: 'flex-end',
    center: 'center',
};
export function ActionStrip({ children, align = 'end' }) {
    const style = {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: `${tokens.spacing[2]}px`,
        justifyContent: alignMap[align],
    };
    return (_jsx("div", { "data-component": "action-strip", style: style, children: children }));
}
export default ActionStrip;
//# sourceMappingURL=ActionStrip.js.map
import { jsx as _jsx } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
export function MetricTileGrid({ children, minWidth = 140, className }) {
    const style = className
        ? { gap: `${tokens.spacing[2.5]}px` }
        : {
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`,
            gap: `${tokens.spacing[2.5]}px`,
        };
    return (_jsx("section", { "data-component": "metric-tile-grid", className: className, style: style, children: children }));
}
export default MetricTileGrid;
//# sourceMappingURL=MetricTileGrid.js.map
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
import { Card } from './Card.js';
import { Spinner } from './Spinner.js';
const toneBorder = {
    default: tokens.colors.border.default,
    info: tokens.colors.badge.info.fg,
    success: tokens.colors.badge.success.fg,
    warning: tokens.colors.badge.warning.fg,
    error: tokens.colors.badge.error.fg,
};
const rootStyles = {
    display: 'grid',
    gap: `${tokens.spacing[1.5]}px`,
};
const labelStyles = {
    color: tokens.colors.text.muted,
    fontSize: tokens.fontSize.sm,
};
const valueStyles = {
    fontSize: tokens.fontSize['2xl'],
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.text.default,
    lineHeight: tokens.lineHeight.tight,
};
const detailStyles = {
    color: tokens.colors.text.muted,
    fontSize: tokens.fontSize.sm,
};
const sparkbarContainerStyles = {
    height: '32px',
    display: 'grid',
    gridAutoFlow: 'column',
    gridAutoColumns: 'minmax(0, 1fr)',
    alignItems: 'end',
    gap: `${tokens.spacing[1]}px`,
};
const sparkbarBarStyles = {
    borderRadius: '9999px 9999px 3px 3px',
    background: `linear-gradient(180deg, ${tokens.colors.accent.blue}, rgba(102, 217, 239, 0.35))`,
};
export function MetricTile({ label, value, detail, loading = false, variant = 'default', sparkbar, }) {
    const max = sparkbar ? sparkbar.reduce((current, point) => Math.max(current, point.value), 0) : 0;
    return (_jsx(Card, { variant: "elevated", padding: "md", style: { borderColor: toneBorder[variant] }, children: _jsxs("div", { "data-component": "metric-tile", "data-variant": variant, style: rootStyles, children: [_jsx("span", { style: labelStyles, children: label }), _jsx("strong", { style: valueStyles, children: loading ? _jsx(Spinner, { size: "sm" }) : value }), detail ? _jsx("small", { style: detailStyles, children: detail }) : null, sparkbar && sparkbar.length > 0 && (_jsx("div", { style: sparkbarContainerStyles, "aria-hidden": "true", children: sparkbar.map((point, index) => {
                        const height = max > 0 ? Math.max((point.value / max) * 100, 8) : 8;
                        return (_jsx("span", { style: { ...sparkbarBarStyles, height: `${height}%` } }, point.label ?? index));
                    }) }))] }) }));
}
export default MetricTile;
//# sourceMappingURL=MetricTile.js.map
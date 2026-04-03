import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
import { Card } from './Card.js';
import { Badge } from './Badge.js';
const rootStyles = {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: `${tokens.spacing[4]}px`,
    alignItems: 'center',
};
const titleColumnStyles = {
    minWidth: 0,
    display: 'grid',
    gap: `${tokens.spacing[1]}px`,
};
const kickerStyles = {
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    fontSize: tokens.fontSize.xs,
    color: tokens.colors.accent.cyan,
    fontWeight: tokens.fontWeight.semibold,
};
const titleStyles = {
    margin: 0,
    fontSize: tokens.fontSize['2xl'],
    lineHeight: tokens.lineHeight.tight,
    color: tokens.colors.text.default,
};
const descriptionStyles = {
    margin: 0,
    color: tokens.colors.text.muted,
    fontSize: tokens.fontSize.base,
    lineHeight: tokens.lineHeight.relaxed,
};
const asideStyles = {
    display: 'grid',
    gap: `${tokens.spacing[2]}px`,
    justifyItems: 'end',
    minWidth: '220px',
};
const statsWrapStyles = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: `${tokens.spacing[2]}px`,
    justifyContent: 'flex-end',
};
function toneToBadgeVariant(tone) {
    switch (tone) {
        case 'info':
            return 'info';
        case 'success':
            return 'success';
        case 'warning':
            return 'warning';
        case 'error':
            return 'error';
        default:
            return 'default';
    }
}
export function SurfaceHero({ kicker, title, description, stats = [], actions, variant = 'elevated', }) {
    const cardVariant = variant === 'default' ? 'default' : 'elevated';
    return (_jsx(Card, { variant: cardVariant, padding: "md", radius: "lg", children: _jsxs("div", { "data-component": "surface-hero", "data-variant": variant, style: rootStyles, children: [_jsxs("div", { style: titleColumnStyles, children: [kicker ? _jsx("p", { style: kickerStyles, children: kicker }) : null, _jsx("h2", { style: titleStyles, children: title }), description ? _jsx("p", { style: descriptionStyles, children: description }) : null] }), (stats.length > 0 || actions) ? (_jsxs("div", { style: asideStyles, children: [stats.length > 0 ? (_jsx("div", { style: statsWrapStyles, children: stats.map((stat) => (_jsx(Badge, { variant: toneToBadgeVariant(stat.tone), children: `${stat.value}${stat.label ? ` ${stat.label}` : ''}` }, `${stat.label}:${stat.value}`))) })) : null, actions] })) : null] }) }));
}
export default SurfaceHero;
//# sourceMappingURL=SurfaceHero.js.map
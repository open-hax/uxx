import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
const rootStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: `${tokens.spacing[3]}px`,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
};
const copyStyles = {
    display: 'grid',
    gap: `${tokens.spacing[1]}px`,
    minWidth: 0,
};
const kickerStyles = {
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    fontSize: tokens.fontSize.xs,
    color: tokens.colors.accent.cyan,
    fontWeight: tokens.fontWeight.semibold,
};
const titleStyles = {
    margin: 0,
    fontSize: tokens.fontSize.xl,
    color: tokens.colors.text.default,
};
const descriptionStyles = {
    margin: 0,
    color: tokens.colors.text.muted,
    fontSize: tokens.fontSize.sm,
    lineHeight: tokens.lineHeight.relaxed,
};
const actionsStyles = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: `${tokens.spacing[2]}px`,
    alignItems: 'center',
};
export function PanelHeader({ title, description, kicker, meta, actions }) {
    return (_jsxs("div", { "data-component": "panel-header", style: rootStyles, children: [_jsxs("div", { style: copyStyles, children: [kicker ? _jsx("p", { style: kickerStyles, children: kicker }) : null, _jsx("h3", { style: titleStyles, children: title }), description ? _jsx("p", { style: descriptionStyles, children: description }) : null, meta] }), actions ? _jsx("div", { style: actionsStyles, children: actions }) : null] }));
}
export default PanelHeader;
//# sourceMappingURL=PanelHeader.js.map
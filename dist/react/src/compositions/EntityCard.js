import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
import { Badge } from '../primitives/Badge.js';
import { Button } from '../primitives/Button.js';
import { KeyValueSection } from '../primitives/KeyValueSection.js';
// Variant styles
const variantStyles = {
    default: {
        backgroundColor: tokens.colors.background.surface,
        border: `1px solid ${tokens.colors.border.default}`,
        borderRadius: `${tokens.spacing[1.5]}px`,
    },
    outlined: {
        backgroundColor: 'transparent',
        border: `1px solid ${tokens.colors.border.default}`,
        borderRadius: `${tokens.spacing[1.5]}px`,
    },
    elevated: {
        backgroundColor: tokens.colors.background.elevated,
        border: 'none',
        borderRadius: `${tokens.spacing[1.5]}px`,
        boxShadow: tokens.shadow.md,
    },
    gradient: {
        backgroundColor: tokens.colors.background.elevated,
        border: 'none',
        borderRadius: `${tokens.spacing[1.5]}px`,
        boxShadow: tokens.shadow.md,
    },
};
// Base styles
const containerStyles = {
    width: '100%',
    fontFamily: tokens.fontFamily.sans,
    overflow: 'hidden',
};
const headerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${tokens.spacing[3]}px ${tokens.spacing[4]}px`,
};
const imageContainerStyles = {
    display: 'flex',
    justifyContent: 'center',
    padding: `${tokens.spacing[2]}px 0`,
};
const metadataContainerStyles = {
    padding: `0 ${tokens.spacing[4]}px`,
};
const tagsContainerStyles = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: `${tokens.spacing[1]}px`,
    padding: `${tokens.spacing[2]}px ${tokens.spacing[4]}px`,
};
const footerStyles = {
    display: 'flex',
    gap: `${tokens.spacing[2]}px`,
    padding: `${tokens.spacing[3]}px ${tokens.spacing[4]}px`,
};
const dividerStyles = {
    borderTop: `1px solid ${tokens.colors.border.default}`,
    marginTop: `${tokens.spacing[2]}px`,
    marginBottom: `${tokens.spacing[2]}px`,
};
/**
 * EntityCard - composition for displaying entity information.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <EntityCard
 *   id={agent.id}
 *   name={agent.name}
 *   type="Agent"
 *   status={{ value: 'Alive', variant: 'success' }}
 *   metadata={[
 *     { label: 'Position', value: '(0, 0)' },
 *     { label: 'Role', value: 'Worker' },
 *   ]}
 * />
 *
 * // Interactive with actions
 * <EntityCard
 *   id={issue.id}
 *   name={`Issue #${issue.number}`}
 *   type={issue.title}
 *   status={{ value: issue.state, variant: 'open' }}
 *   tags={issue.labels}
 *   interactive
 *   onClick={() => navigate(`/issues/${issue.id}`)}
 *   primaryAction={{ label: 'Open', onClick: () => openIssue(issue.id) }}
 * />
 * ```
 */
export function EntityCard({ id, name, type, status, metadata, image, tags, primaryAction, secondaryActions, interactive = false, onClick, variant = 'default', gradient, dividers = true, header, footer, className, }) {
    const handleClick = (e) => {
        if (interactive && onClick) {
            onClick();
        }
    };
    const handleKeyDown = (e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick?.();
        }
    };
    const handleActionClick = (e, action) => {
        e.stopPropagation();
        action();
    };
    // Compute container styles
    const computedContainerStyles = {
        ...containerStyles,
        ...variantStyles[variant],
        ...(gradient ? { background: gradient } : {}),
        ...(interactive ? { cursor: 'pointer' } : {}),
    };
    // Convert metadata to KeyValueEntry format
    const keyValueEntries = metadata?.map(m => ({
        label: m.label,
        value: m.value,
        icon: m.icon,
    }));
    // Image size mapping
    const imageSizes = {
        sm: 48,
        md: 64,
        lg: 96,
    };
    return (_jsxs("div", { "data-component": "entity-card", "data-variant": variant, "data-id": id, "data-interactive": interactive || undefined, style: computedContainerStyles, className: className, onClick: handleClick, onKeyDown: handleKeyDown, role: interactive ? 'button' : undefined, tabIndex: interactive ? 0 : undefined, children: [header ?? (_jsxs("div", { style: headerStyles, children: [_jsxs("div", { children: [_jsx("strong", { style: { fontSize: tokens.fontSize.base, fontWeight: tokens.fontWeight.semibold }, children: name }), type && (_jsx("span", { style: {
                                    fontSize: tokens.fontSize.sm,
                                    color: tokens.colors.text.muted,
                                    marginLeft: `${tokens.spacing[2]}px`,
                                }, children: type }))] }), status && (_jsx(Badge, { variant: status.variant ?? 'default', children: status.value }))] })), header && !image && !metadata && !tags ? null : null, image && (_jsx("div", { style: imageContainerStyles, children: _jsx("img", { src: image.src, alt: image.alt ?? name, style: {
                        width: imageSizes[image.size ?? 'md'],
                        height: imageSizes[image.size ?? 'md'],
                        borderRadius: '50%',
                        objectFit: 'cover',
                    } }) })), dividers && (image || metadata) && !header && (_jsx("div", { style: { margin: `0 ${tokens.spacing[4]}px`, ...dividerStyles } })), keyValueEntries && keyValueEntries.length > 0 && (_jsx("div", { style: metadataContainerStyles, children: _jsx(KeyValueSection, { entries: keyValueEntries, dividers: false }) })), dividers && tags && tags.length > 0 && (metadata || image) && (_jsx("div", { style: { margin: `0 ${tokens.spacing[4]}px`, ...dividerStyles } })), tags && tags.length > 0 && (_jsx("div", { style: tagsContainerStyles, children: tags.map(tag => (_jsx(Badge, { size: "sm", variant: "default", children: tag }, tag))) })), footer ?? ((primaryAction || secondaryActions) && (_jsxs(_Fragment, { children: [dividers && (tags || metadata || image || header) && (_jsx("div", { style: { margin: `0 ${tokens.spacing[4]}px`, ...dividerStyles } })), _jsxs("div", { style: footerStyles, children: [primaryAction && (_jsxs(Button, { variant: "primary", onClick: (e) => handleActionClick(e, primaryAction.onClick), children: [primaryAction.icon, primaryAction.label] })), secondaryActions?.map((action, i) => (_jsxs(Button, { variant: "ghost", size: "sm", onClick: (e) => handleActionClick(e, action.onClick), children: [action.icon, action.label] }, i)))] })] })))] }));
}
export default EntityCard;
//# sourceMappingURL=EntityCard.js.map
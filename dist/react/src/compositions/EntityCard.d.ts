/**
 * EntityCard Composition
 *
 * Implements the entity-card-composition.spec.md contract.
 * A composition of primitives for displaying entity information in card form.
 */
import { type ReactNode } from 'react';
import { type BadgeVariant } from '../primitives/Badge.js';
export type EntityCardVariant = 'default' | 'outlined' | 'elevated' | 'gradient';
export interface EntityCardStatus {
    /** Status value to display */
    value: string;
    /** Badge variant for status */
    variant?: BadgeVariant;
}
export interface EntityCardImage {
    /** Image source URL */
    src: string;
    /** Alt text */
    alt?: string;
    /** Image size */
    size?: 'sm' | 'md' | 'lg';
}
export interface EntityCardAction {
    /** Action label */
    label: string;
    /** Click handler */
    onClick: () => void;
    /** Optional icon */
    icon?: ReactNode;
}
export interface EntityCardMetadata {
    /** Metadata label */
    label: string;
    /** Metadata value */
    value: ReactNode;
    /** Optional icon */
    icon?: ReactNode;
}
export interface EntityCardProps {
    /** Entity identifier */
    id: string;
    /** Entity display name */
    name: string;
    /** Entity type/subtype label */
    type?: string;
    /** Entity status for badge */
    status?: EntityCardStatus;
    /** Metadata key-value pairs */
    metadata?: EntityCardMetadata[];
    /** Optional image/avatar */
    image?: EntityCardImage;
    /** Optional tags/labels */
    tags?: string[];
    /** Primary action button */
    primaryAction?: EntityCardAction;
    /** Secondary actions */
    secondaryActions?: EntityCardAction[];
    /** Whether card is interactive (clickable) */
    interactive?: boolean;
    /** Click handler for interactive cards */
    onClick?: () => void;
    /** Card variant */
    variant?: EntityCardVariant;
    /** Custom gradient for gradient variant */
    gradient?: string;
    /** Whether to show dividers between sections */
    dividers?: boolean;
    /** Custom header content (replaces default) */
    header?: ReactNode;
    /** Custom footer content (replaces actions) */
    footer?: ReactNode;
    /** Custom class name */
    className?: string;
}
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
export declare function EntityCard({ id, name, type, status, metadata, image, tags, primaryAction, secondaryActions, interactive, onClick, variant, gradient, dividers, header, footer, className, }: EntityCardProps): import("react/jsx-runtime").JSX.Element;
export default EntityCard;
//# sourceMappingURL=EntityCard.d.ts.map
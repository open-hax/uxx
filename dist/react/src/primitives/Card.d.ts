/**
 * Card Component
 *
 * Implements the card.edn contract.
 * Versatile card container with optional header, title, and footer sections.
 */
import { type ReactNode, type MouseEvent } from 'react';
export type CardVariant = 'default' | 'outlined' | 'elevated';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';
export interface CardProps {
    /** Visual style variant */
    variant?: CardVariant;
    /** Whether card has interactive hover/focus states */
    interactive?: boolean;
    /** Internal padding size */
    padding?: CardPadding;
    /** Border radius size */
    radius?: CardRadius;
    /** Click handler for interactive cards */
    onClick?: (event: MouseEvent<HTMLDivElement>) => void;
    /** Header slot */
    header?: ReactNode;
    /** Title text (rendered in header if no header slot) */
    title?: string;
    /** Extra header content (e.g., actions) */
    extra?: ReactNode;
    /** Main content */
    children?: ReactNode;
    /** Footer slot */
    footer?: ReactNode;
    /** Override inline styles */
    style?: React.CSSProperties;
}
/**
 * Card component for containing content with optional header and footer.
 *
 * @example
 * ```tsx
 * <Card variant="elevated" title="Card Title">
 *   Main content goes here
 * </Card>
 *
 * <Card interactive onClick={() => console.log('clicked')}>
 *   <Badge variant="success">Active</Badge>
 *   Card body
 * </Card>
 * ```
 */
export declare const Card: import("react").ForwardRefExoticComponent<CardProps & import("react").RefAttributes<HTMLDivElement>>;
export default Card;
//# sourceMappingURL=Card.d.ts.map
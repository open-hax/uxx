import type { KeyboardEvent, ReactNode } from 'react';
import type { MentionItem } from './RichTextEditor.types.js';
export interface MentionSuggestionsProps {
    items: MentionItem[];
    onSelect?: (item: MentionItem) => void;
    renderItem?: (item: MentionItem) => ReactNode;
    selectedIndex?: number;
    onSelectedIndexChange?: (index: number) => void;
    onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
}
export declare function MentionSuggestions({ items, onSelect, renderItem, selectedIndex, onSelectedIndexChange, onKeyDown, }: MentionSuggestionsProps): import("react/jsx-runtime").JSX.Element | null;
export default MentionSuggestions;
//# sourceMappingURL=MentionSuggestions.d.ts.map
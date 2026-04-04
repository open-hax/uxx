import type { ReactNode } from 'react';
import type { MentionItem } from './RichTextEditor.types.js';
export interface MentionSuggestionsProps {
    items: MentionItem[];
    onSelect?: (item: MentionItem) => void;
    renderItem?: (item: MentionItem) => ReactNode;
}
export declare function MentionSuggestions({ items, onSelect, renderItem, }: MentionSuggestionsProps): import("react/jsx-runtime").JSX.Element | null;
export default MentionSuggestions;
//# sourceMappingURL=MentionSuggestions.d.ts.map
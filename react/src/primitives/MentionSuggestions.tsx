import type { ReactNode } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
import type { MentionItem } from './RichTextEditor.types.js';

export interface MentionSuggestionsProps {
  items: MentionItem[];
  onSelect?: (item: MentionItem) => void;
  renderItem?: (item: MentionItem) => ReactNode;
}

export function MentionSuggestions({
  items,
  onSelect,
  renderItem,
}: MentionSuggestionsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div
      data-component="mention-suggestions"
      data-testid="mention-suggestions"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        background: tokens.colors.background.elevated,
        border: `1px solid ${tokens.colors.border.default}`,
        borderRadius: tokens.spacing[2],
        maxHeight: 200,
        overflow: 'auto',
        zIndex: 1000,
      }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          data-testid="mention-suggestion-item"
          onClick={() => onSelect?.(item)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '8px 12px',
            background: 'transparent',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            color: tokens.colors.text.default,
          }}
        >
          {renderItem ? (
            renderItem(item)
          ) : (
            <>
              {item.avatar && (
                <img
                  src={item.avatar}
                  alt={item.name}
                  style={{ width: 24, height: 24, borderRadius: '50%' }}
                />
              )}
              <div>
                <div style={{ fontWeight: 500 }}>{item.name}</div>
                {item.description && (
                  <div style={{ fontSize: 12, color: tokens.colors.text.muted }}>
                    {item.description}
                  </div>
                )}
              </div>
            </>
          )}
        </button>
      ))}
    </div>
  );
}

export default MentionSuggestions;
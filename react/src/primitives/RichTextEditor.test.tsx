import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RichTextEditor } from './RichTextEditor';

describe('RichTextEditor mentions', () => {
  it('filters suggestions without inserting typed characters and closes on backspace past empty filter', () => {
    const { container } = render(
      <RichTextEditor
        defaultValue=""
        mentions={{
          items: [
            { id: 'alice', name: 'Alice Chen', description: 'Frontend Developer' },
            { id: 'bob', name: 'Bob Martinez', description: 'Backend Developer' },
          ],
          trigger: '@',
        }}
      />,
    );

    const editor = container.querySelector('[contenteditable="true"]') as HTMLDivElement | null;
    expect(editor).not.toBeNull();
    if (!editor) throw new Error('contenteditable editor not found');

    const initialHtml = editor.innerHTML;

    fireEvent.keyDown(editor, { key: '@' });
    const suggestionButtons = screen.getAllByTestId('mention-suggestion-item');
    expect(suggestionButtons).toHaveLength(2);
    suggestionButtons.forEach((button) => expect(button).toHaveAttribute('type', 'button'));
    expect(editor.innerHTML).toBe(initialHtml);

    fireEvent.keyDown(editor, { key: 'b' });
    expect(screen.getByText('Bob Martinez')).toBeInTheDocument();
    expect(screen.queryByText('Alice Chen')).not.toBeInTheDocument();
    expect(editor.innerHTML).toBe(initialHtml);

    fireEvent.keyDown(editor, { key: 'Backspace' });
    expect(screen.getAllByTestId('mention-suggestion-item')).toHaveLength(2);

    fireEvent.keyDown(editor, { key: 'Backspace' });
    expect(screen.queryByTestId('mention-suggestions')).not.toBeInTheDocument();
  });

  it('honors a custom trigger and moves keyboard selection without editing content', () => {
    const { container } = render(
      <RichTextEditor
        defaultValue=""
        mentions={{
          items: [
            { id: 'alice', name: 'Alice Chen' },
            { id: 'bob', name: 'Bob Martinez' },
          ],
          trigger: '#',
        }}
      />,
    );

    const editor = container.querySelector('[contenteditable="true"]') as HTMLDivElement | null;
    expect(editor).not.toBeNull();
    if (!editor) throw new Error('contenteditable editor not found');

    const initialHtml = editor.innerHTML;
    fireEvent.keyDown(editor, { key: '@' });
    expect(screen.queryByTestId('mention-suggestions')).not.toBeInTheDocument();

    fireEvent.keyDown(editor, { key: '#' });
    const suggestions = screen.getAllByTestId('mention-suggestion-item');
    expect(suggestions).toHaveLength(2);
    expect(suggestions[0]).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(editor, { key: 'ArrowDown' });
    expect(suggestions[0]).toHaveAttribute('aria-selected', 'false');
    expect(suggestions[1]).toHaveAttribute('aria-selected', 'true');
    expect(editor.innerHTML).toBe(initialHtml);

    fireEvent.keyDown(editor, { key: 'Escape' });
    expect(screen.queryByTestId('mention-suggestions')).not.toBeInTheDocument();
  });
});

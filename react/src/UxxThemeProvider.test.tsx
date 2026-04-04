import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button, UxxThemeProvider } from '@open-hax/uxx';

describe('UxxThemeProvider', () => {
  it('applies a named theme pack to the wrapper element', () => {
    render(
      <UxxThemeProvider theme="proxy-console" data-testid="provider">
        <Button variant="primary">Launch</Button>
      </UxxThemeProvider>
    );

    const provider = screen.getByTestId('provider');
    const button = screen.getByRole('button', { name: 'Launch' });

    expect(provider).toHaveAttribute('data-uxx-theme', 'proxy-console');
    expect(provider.style.getPropertyValue('--uxx-colors-button-primary-bg')).toBe('#00D4FF');
    expect(provider.style.getPropertyValue('--uxx-fontFamily-sans')).toContain('IBM Plex Sans');
    expect(button.getAttribute('style')).toContain('var(--uxx-colors-button-primary-bg');
  });

  it('applies token overrides on top of the base pack', () => {
    render(
      <UxxThemeProvider
        theme="proxy-console"
        data-testid="provider"
        overrides={{
          colors: {
            button: {
              primary: {
                bg: '#16E0FF',
              },
            },
          },
          radius: {
            md: '10px',
          },
        }}
      >
        <Button variant="primary">Override</Button>
      </UxxThemeProvider>
    );

    const provider = screen.getByTestId('provider');

    expect(provider.style.getPropertyValue('--uxx-colors-button-primary-bg')).toBe('#16E0FF');
    expect(provider.style.getPropertyValue('--uxx-radius-md')).toBe('10px');
  });
});

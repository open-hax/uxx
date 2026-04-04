import { describe, expect, it } from 'vitest';
import { createThemePack, getThemeCssVars, themePacks, tokens } from '@open-hax/uxx/tokens';

describe('theme packs', () => {
  it('exports the proxy console preset', () => {
    expect(themePacks.proxyConsole.colors.background.default).toBe('#0A0C0F');
    expect(themePacks.proxyConsole.colors.accent.cyan).toBe('#00D4FF');
    expect(themePacks.proxyConsole.fontFamily.sans).toContain('IBM Plex Sans');
    expect(themePacks.proxyConsole.radius.md).toBe('4px');
  });

  it('deep merges overrides onto a base pack', () => {
    const custom = createThemePack(themePacks.proxyConsole, {
      colors: {
        accent: {
          cyan: '#16E0FF',
        },
      },
      radius: {
        md: '8px',
      },
    });

    expect(custom.colors.accent.cyan).toBe('#16E0FF');
    expect(custom.colors.background.default).toBe(themePacks.proxyConsole.colors.background.default);
    expect(custom.radius.md).toBe('8px');
    expect(custom.radius.sm).toBe(themePacks.proxyConsole.radius.sm);
  });

  it('serializes theme packs to uxx css variables', () => {
    const cssVars = getThemeCssVars(themePacks.proxyConsole);

    expect(cssVars['--uxx-colors-background-default']).toBe('#0A0C0F');
    expect(cssVars['--uxx-colors-button-primary-bg']).toBe('#00D4FF');
    expect(cssVars['--uxx-fontFamily-sans']).toContain('IBM Plex Sans');
    expect(cssVars['--uxx-radius-md']).toBe('4px');
  });

  it('exposes runtime token references for themeable categories', () => {
    expect(tokens.colors.background.default).toContain('var(--uxx-colors-background-default');
    expect(tokens.fontFamily.sans).toContain('var(--uxx-fontFamily-sans');
    expect(tokens.shadow.md).toContain('var(--uxx-shadow-md');
    expect(tokens.radius.md).toContain('var(--uxx-radius-md');
  });
});

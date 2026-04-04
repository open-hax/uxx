import type { Preview } from '@storybook/react';
import { ThemeProvider } from '../src/theme.js';

const themeBackgrounds = {
  monokai: '#272822',
  'night-owl': '#011627',
} as const;

const preview: Preview = {
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global UXX theme',
      defaultValue: 'monokai',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'monokai', title: 'Monokai' },
          { value: 'night-owl', title: 'Night Owl' },
        ],
      },
    },
  },
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'monokai',
      values: [
        { name: 'monokai', value: themeBackgrounds.monokai },
        { name: 'night-owl', value: themeBackgrounds['night-owl'] },
      ],
    },
  },
  decorators: [
    (Story, context) => {
      const theme = (context.globals.theme ?? 'monokai') as keyof typeof themeBackgrounds;

      return (
        <ThemeProvider
          theme={theme}
          style={{
            padding: '1rem',
            minHeight: '100vh',
            background: themeBackgrounds[theme],
          }}
        >
          <Story args={{ ...context.args, theme: context.args.theme ?? theme }} />
        </ThemeProvider>
      );
    },
  ],
};

export default preview;

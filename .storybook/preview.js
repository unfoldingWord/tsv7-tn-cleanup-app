/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    layout: 'fullscreen',
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: ['Introduction', 'Components'],
      },
    },
  },
};

export const parameters = preview.parameters;
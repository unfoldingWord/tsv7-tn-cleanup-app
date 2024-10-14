// .storybook/manager.js

import { addons } from '@storybook/manager-api';
import { themes } from '@storybook/theming';

addons.setConfig({
  theme: {
    ...themes.light,
    brandTitle: 'World Language Map', // Set your repository's name here
    brandUrl: 'https://github.com/unfoldingWord/world-language-map-rcl', // Optional: Set the URL to your repository
    brandImage: null, // Remove the default Storybook logo
  },
});
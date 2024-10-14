import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Replace with your desired primary color
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          '--variant-containedColor': '#1976d2', // Define your custom CSS variable
        },
      },
    },
  },
});

export default theme;
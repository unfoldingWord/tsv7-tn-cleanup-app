import React from 'react';
import { Box } from '@mui/material';
import './App.css';
import TSVUploadWidget from './components/TSVUploadWidget';
import BibleBookSelection from './components/BibleBookSelection';
import { AppContentProvider } from './context/AppContentProvider';
import BranchSelection from './components/BranchSelection';
import AppHeader from './components/AppHeader';
import ConverterResultsComponent from './components/ConverterResultsComponent';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme'; // Import the custom theme

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AppContentProvider>
        <CssBaseline />

        <AppHeader />
        <Box sx={{ padding: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <BibleBookSelection />
            <BranchSelection />
          </Box>
          <TSVUploadWidget />
          <ConverterResultsComponent />
        </Box>
        <Box sx={{ padding: 2 }}>
          <div>
            <p>
              This app is designed to help you clean up TSV files for Translation Notes. It allows you to paste or upload a TSV file, or select the Bible book and branch and
              download the text from DCS, and then process the file to remove unwanted lines and ensure proper formatting. You must select a Bible book for this to know which Bible
              it is working with, and if you want to merge with the DCS existing text, you must select a branch.
            </p>
            <p>
              For more information, view the{' '}
              <a href="https://github.com/unfoldingWord/tsv7-tn-cleanup-app#readme" target="_blank" rel="noopener noreferrer">
                GitHub repository's README
              </a>
              .
            </p>
            <p>
              This may work for other TSV files with a Quote or OrigQuote column, but no guarrantee. If you'd like to ONLY convert GL Quotes to Greek/Hebrew Quotes for other
              resources, like Study Notes or Translation Questions,{' '}
              <a href="https://tsv-quote-converters.netlify.app/" target="_blank" rel="noopener noreferrer">
                visit the Styleguidist
              </a>{' '}
              for the Javascript functions used for the quote conversion.
            </p>
          </div>
        </Box>
      </AppContentProvider>
    </ThemeProvider>
  );
}

export default App;

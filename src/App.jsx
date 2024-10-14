import React from 'react';
import { Box } from '@mui/material';
import './App.css';
import TSVUploadWidget from './components/TSVUploadWidget';
import BibleBookSelection from './components/BibleBookSelection';
import { AppContentProvider, AppContentContext } from './context/AppContentProvider';
import BranchSelection from './components/BranchSelection';
import AppHeader from './components/AppHeader';
import ConverterResultsComponent from './components/ConverterResultsComponent';

function App() {
  return (
    <AppContentProvider>
      <AppHeader />
      <Box sx={{ padding: 2 }}>
        <BibleBookSelection />
        <BranchSelection />
        <TSVUploadWidget />
        <ConverterResultsComponent />
      </Box>
    </AppContentProvider>
  );
}

export default App;

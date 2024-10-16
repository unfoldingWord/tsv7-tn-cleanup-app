import React, { useContext, useRef } from 'react';
import { Box, Typography, TextField, Button, CircularProgress } from '@mui/material';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import { AppContentContext } from '../context/AppContentProvider';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

function TSVUploadWidget() {
  const { selectedBook, selectedBranch, setInputTsvRows, inputTsvRows, doConvert, setDoConvert, dcsURL, convertedTsvRows } = useContext(AppContentContext);
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setInputTsvRows(e.target.result.split('\n').filter((row) => row.trim()));
      };
      reader.readAsText(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handlePasteClick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputTsvRows(text.split('\n').filter((row) => row.trim()));
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  const handleFetchFromDcsClick = async () => {
    try {
      const response = await fetch(`${dcsURL}/unfoldingWord/en_tn/raw/branch/${selectedBranch}/tn_${selectedBook.toUpperCase()}.tsv`);
      const text = await response.text();
      setInputTsvRows(text.split('\n').filter((row) => row.trim()));
    } catch (err) {
      console.error('Failed to fetch TSV content from DCS:', err);
    }
  };

  return (
    <Box
      sx={{
        border: '1px dashed gray',
        padding: 2,
        textAlign: 'center',
        cursor: 'pointer',
        marginY: 2,
      }}
    >
      <Typography variant="body1">
        <Box
          component="span"
          onClick={handlePasteClick}
          sx={{
            color: 'blue',
            textDecoration: 'none',
            cursor: 'pointer',
            paddingRight: '10px',
          }}
        >
          <ContentPasteIcon sx={{ marginRight: 0.5 }} />
          Paste text
        </Box>
        <Box
          component="span"
          onClick={handleUploadClick}
          sx={{
            color: 'blue',
            textDecoration: 'none',
            cursor: 'pointer',
            paddingRight: '10px',
          }}
        >
          <UploadFileIcon sx={{ marginRight: 0.5 }} />
          Upload a TSV file
        </Box>{' '}
        or{' '}
        <Box
          component="span"
          onClick={handleFetchFromDcsClick}
          sx={{
            color: 'blue',
            textDecoration: 'none',
            cursor: 'pointer',
            paddingLeft: '10px',
          }}
        >
          <CloudDownloadIcon sx={{ marginRight: 0.5 }} />
          Fetch en_tn / tn_{selectedBook.toUpperCase()}.tsv ({selectedBranch}) from DCS
        </Box>
      </Typography>
      <input type="file" accept=".tsv,.csv,.rtf,.txt" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
      <TextField
        multiline
        rows={10}
        variant="outlined"
        fullWidth
        value={inputTsvRows.join('\n')}
        onChange={(e) => setInputTsvRows(e.target.value.split('\n').filter((row) => row.trim()))}
        label="Your Translation Notes TSV content with ULT quotes"
        placeholder="TSV content will appear here..."
        sx={{
          marginTop: 2,
          resize: 'both',
          '& .MuiInputBase-input': {
            whiteSpace: 'nowrap',
            overflowX: 'auto',
          },
        }}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          if (selectedBook && inputTsvRows.length) {
            setDoConvert(true);
          }
        }}
        disabled={doConvert || !inputTsvRows.length || !selectedBook}
        sx={{
          marginTop: '5px',
          boxShadow: '0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)',
          '&.Mui-disabled': {
            boxShadow: '0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.12)',
          },
        }}
      >
        Convert
        {doConvert && !convertedTsvRows.length ? (
          <>
            ing...
            <CircularProgress size={24} />
          </>
        ) : null}
      </Button>
    </Box>
  );
}

export default TSVUploadWidget;

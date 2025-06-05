import React, { useContext, useRef } from 'react';
import { Box, Typography, TextField, Button, CircularProgress } from '@mui/material';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import { AppContentContext } from '../context/AppContentProvider';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';

function TSVUploadWidget() {
  const {
    selectedBook,
    selectedBranch,
    setInputTsvText,
    setInputTsvRows,
    setCheckboxStates,
    inputTsvText,
    inputTsvRows,
    doConvert,
    setDoConvert,
    dcsURL,
    conversionDone,
    checkboxStates,
  } = useContext(AppContentContext);
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setInputTsvRows([]); // Reset rows before setting new content
        setInputTsvText(e.target.result);
        document.getElementById('inputTsv').value = e.target.result;
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
      setInputTsvRows([]); // Reset rows before setting new content
      setInputTsvText(text);
      document.getElementById('inputTsv').value = text;
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  const handleFetchFromDcsClick = async () => {
    try {
      const response = await fetch(`${dcsURL}/unfoldingWord/en_tn/raw/branch/${selectedBranch}/tn_${selectedBook.toUpperCase()}.tsv`);
      const text = await response.text();
      setInputTsvRows([]); // Reset rows before setting new content
      setInputTsvText(text);
      document.getElementById('inputTsv').value = text;
    } catch (err) {
      console.error('Failed to fetch TSV content from DCS:', err);
    }
  };

  const handleCheckboxChange = (event) => {
    setCheckboxStates((prev) => {
      const newState = { ...prev };
      newState[event.target.name] = event.target.checked;
      if (event.target.name === 'makeGLCols') {
        newState['mergeWithDCS'] = false;
      }
      return newState;
    });
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
        id="inputTsv"
        multiline
        rows={10}
        variant="outlined"
        fullWidth
        defaultValue={inputTsvText}
        onBlur={(e) => setInputTsvText(e.target.value)}
        label="Your Translation Notes TSV content with ULT quotes"
        placeholder=""
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{
          marginTop: 2,
          resize: 'both',
          '& .MuiInputBase-input': {
            whiteSpace: 'nowrap',
            overflowX: 'auto',
          },
        }}
      />

      <FormGroup sx={{ padding: 2 }}>
        <FormControlLabel
          control={<Checkbox sx={{ padding: 0, paddingRight: 1 }} checked={checkboxStates.convertToGreekHebrew} onChange={handleCheckboxChange} name="convertToGreekHebrew" />}
          label="1. Convert English (ULT) quotes to Greek/Hebrew in the `Quote` field"
        />
        <FormControlLabel
          control={<Checkbox sx={{ padding: 0, paddingRight: 1 }} checked={checkboxStates.standardizeQuotes} onChange={handleCheckboxChange} name="standardizeQuotes" />}
          label="2. Standardize/Fix all `Quote`s by converting to English and then back to Greek/Hebrew"
        />
        <FormControlLabel
          control={
            <Checkbox
              sx={{ padding: 0, paddingRight: 1 }}
              checked={checkboxStates.mergeWithDCS && !checkboxStates.makeGLCols}
              onChange={handleCheckboxChange}
              name="mergeWithDCS"
              disabled={checkboxStates.makeGLCols}
            />
          }
          label="3. Merge with the full TN file from DCS and copy to clipboard to paste to DCS"
        />
        <div style={{ textAlign: 'left' }}>or</div>
        <FormControlLabel
          control={<Checkbox sx={{ padding: 0, paddingRight: 1 }} checked={checkboxStates.makeGLCols} onChange={handleCheckboxChange} name="makeGLCols" />}
          label="3. Create GL Quote and Occurrence columns with the English from the Quote field"
        />
        <FormControlLabel
          control={<Checkbox sx={{ padding: 0, paddingRight: 1 }} checked={checkboxStates.replaceWithCurlyQuotes} onChange={handleCheckboxChange} name="replaceWithCurlyQuotes" />}
          label={`4. Convert all single/double straight quotes (' ") to curly quotes (‘ ’ “ ”)`}
        />
      </FormGroup>
      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          if (selectedBook && inputTsvRows.length) {
            setDoConvert(true);
          }
        }}
        disabled={doConvert || !inputTsvRows?.length || !selectedBook || !Object.values(checkboxStates).some((v) => v)}
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
        {doConvert && !conversionDone ? (
          <>
            ing... <CircularProgress size={24} />
          </>
        ) : null}
      </Button>
    </Box>
  );
}

export default TSVUploadWidget;

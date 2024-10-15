import { useContext, useState } from 'react';
import { Box, TextField, Checkbox, FormControlLabel, IconButton } from '@mui/material';
import { AppContentContext } from '../context/AppContentProvider';
import { styled } from '@mui/system';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

// Import the TabDelimitedTable component
const HighlightedCell = styled('td')(({ theme, highlight }) => ({
  backgroundColor: highlight === 'hebrewOrGreek' ? 'yellow' : highlight === 'quoteNotFound' ? 'red' : 'inherit',
  color: highlight === 'quoteNotFound' ? 'white' : 'inherit',
}));

const TabDelimitedTable = ({ inputTsvRows, tsvRows, showNotFound }) => {
  const containsHebrewOrGreek = (text) => /[\u0590-\u05FF\u0370-\u03FF]/.test(text);

  const inputRefs = inputTsvRows.map(row => row.split("\t")[0]).filter(id => id != "Reference");

  return (
    <Box sx={{ overflowX: 'auto', whiteSpace: 'pre', border: '1px solid #ccc', padding: '8px', borderRadius: '4px', maxHeight: '500px' }}>
      <table>
        <tbody>
          {tsvRows.map((row, rowIndex) => (
            !showNotFound || row.includes('QUOTE_NOT_FOUND') ?
            <tr key={rowIndex}>
              <td style={{ width: 1, color: 'grey', fontSize: '0.8em' }}>{rowIndex + 1}</td>
              {row.split('\t').map((cell, cellIndex) => (
                <HighlightedCell
                  key={cellIndex}
                  highlight={
                    !inputTsvRows.includes(row) && inputRefs.includes(row.split("\t")[0])
                      ? cellIndex === 4
                        ? containsHebrewOrGreek(cell)
                          ? 'hebrewOrGreek'
                          : cell.includes('QUOTE_NOT_FOUND')
                          ? 'quoteNotFound'
                          : null
                        : null
                      : null
                  }
                >
                  {cell}
                </HighlightedCell>
              ))}
            </tr>: null))}
        </tbody>
      </table>
    </Box>
  );
};

function ConverterResultsComponent() {
  const {
    selectedBranch,
    selectedBook,
    inputTsvRows,
    convertedTsvRows,
    mergedTsvRows,
    doConvert,
    doneConverting,
    errors,
    rowsSkipped,
    rowsFailed,
    mergeWithDcs,
    setMergeWithDcs,
    dcsURL,
    setShowErrors,
    showErrors,
    setShowNotFound,
    showNotFound,
  } = useContext(AppContentContext);

  const handleShowOnlyNotFoundCheckboxChange = (event) => {
    setShowNotFound(event.target.checked);
  };

  const handleMergeWithBranchTsvCheckboxChange = (event) => {
    setMergeWithDcs(event.target.checked);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText((mergeWithDcs && doneConverting ? mergedTsvRows : convertedTsvRows).filter((row) => !showNotFound || row.includes('QUOTE_NOT_FOUND')).join('\n'));
  };

  return (
    <>
      {doConvert ? (
        <div>
          {convertedTsvRows.length} / {inputTsvRows.length} rows processed, {convertedTsvRows.length - rowsSkipped - rowsFailed} quotes converted, {rowsSkipped} skipped (already
          OrigL or blank), {rowsFailed} not found (error or bad ULT quote)
        </div>
      ) : null}
      {errors.length && doneConverting ? (
        <FormControlLabel control={<Checkbox checked={showErrors} onChange={(e) => setShowErrors(e.target.checked)} color="primary" />} label="Show Errors" />
      ) : null}
      {showErrors ? (
        <TextField
          label="Errors"
          multiline
          rows={4}
          variant="outlined"
          fullWidth
          value={errors.join('\n')}
          sx={{
            marginTop: 2,
            resize: 'both',
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'red',
              },
              '&:hover fieldset': {
                borderColor: 'red',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'red',
              },
            },
            '& .MuiInputBase-input': {
              whiteSpace: 'nowrap',
              overflowX: 'auto',
              resize: 'both',
            },
          }}
        />
      ) : null}
      {doneConverting ? (
        <>
          <FormControlLabel control={<Checkbox checked={showNotFound} onChange={handleShowOnlyNotFoundCheckboxChange} color="primary" />} label="Show only QUOTE_NOT_FOUND rows" />
          <FormControlLabel
            control={<Checkbox checked={mergeWithDcs} onChange={handleMergeWithBranchTsvCheckboxChange} color="primary" style={{ clear: 'both' }} />}
            label={
              <>
                Merge with DCS{' '}
                <em>
                  {selectedBranch}/tn_{selectedBook.toUpperCase()}.tsv
                </em>
              </>
            }
          />
          <div style={{ clear: 'both' }}>
            <div id="copy-info" style={{ float: 'left' }}>
              {mergeWithDcs ? (
                <>
                  Click the copy icon to copy the below merged content and{' '}
                  <a href={`${dcsURL}/unfoldingWord/en_tn/_edit/${selectedBranch}/tn_${selectedBook.toUpperCase()}.tsv`} target="_blank">
                    click here
                  </a>{' '}
                  to open the editor of this file on DCS to paste it in.
                </>
              ) : null}
            </div>
            <IconButton onClick={handleCopyToClipboard} color="primary" aria-label="copy to clipboard" sx={{ float: 'right' }}>
              <ContentCopyIcon /> Copy
            </IconButton>
          </div>
          <div id="tab-delimited-table" style={{ clear: 'both' }}>
            <TabDelimitedTable tsvRows={mergeWithDcs ? mergedTsvRows : convertedTsvRows} inputTsvRows={inputTsvRows} showNotFound={showNotFound} />
          </div>
        </>
      ) : null}
    </>
  );
}

export default ConverterResultsComponent;

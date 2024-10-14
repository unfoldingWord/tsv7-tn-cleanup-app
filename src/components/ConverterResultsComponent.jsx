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

const TabDelimitedTable = ({ data, showNotFound }) => {
  const rows = data.filter((row) => !showNotFound || row.includes('QUOTE_NOT_FOUND')).map((row) => row.split('\t'));

  const containsHebrewOrGreek = (text) => /[\u0590-\u05FF\u0370-\u03FF]/.test(text);

  return (
    <Box sx={{ overflowX: 'auto', whiteSpace: 'pre', border: '1px solid #ccc', padding: '8px', borderRadius: '4px', maxHeight: '500px' }}>
      <table>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <HighlightedCell
                  key={cellIndex}
                  highlight={cellIndex === 4 ? (containsHebrewOrGreek(cell) ? 'hebrewOrGreek' : cell.includes('QUOTE_NOT_FOUND') ? 'quoteNotFound' : null) : null}
                >
                  {cell}
                </HighlightedCell>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
};

function ConverterResultsComponent() {
  const { selectedBranch, selectedBook, convertedTsvRows, convertedErrors, conversionStats, mergeWithBranchTsv, setMergeWithBranchTsv, mergedTsvRows, dcsURL, setShowErrors, showErrors, setShowNotFound, showNotFound } =
    useContext(AppContentContext);

  const processingDone = conversionStats.done >= conversionStats.total;

  const handleShowOnlyNotFoundCheckboxChange = (event) => {
    setShowNotFound(event.target.checked);
  };

  const handleMergeWithBranchTsvCheckboxChange = (event) => {
    setMergeWithBranchTsv(event.target.checked);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(
      (mergeWithBranchTsv && conversionStats.total === conversionStats.done ? mergedTsvRows : convertedTsvRows)
        .filter((row) => !showNotFound || row.includes('QUOTE_NOT_FOUND'))
        .join('\n')
    );
  };

  return (
    <>
      {conversionStats.total ? (
        <div id="converstion-stats">
          {conversionStats.done} / {conversionStats.total} rows processed, {conversionStats.done - conversionStats.skipped - conversionStats.bad} quotes converted,{' '}
          {conversionStats.skipped} skipped (already OrigL), {conversionStats.bad} not found (error or bad ULT quote)
        </div>
      ) : (
        ''
      )}
      {convertedErrors.length ? (
        <>
          <FormControlLabel control={<Checkbox checked={showErrors} onChange={(e) => setShowErrors(e.target.checked)} color="primary" />} label="Show Errors" />
          {showErrors ? (
            <TextField
              label="Errors"
              multiline
              rows={4}
              variant="outlined"
              fullWidth
              value={convertedErrors.join('\n')}
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
          ) : (
            ''
          )}
        </>
      ) : (
        ''
      )}
      {convertedTsvRows.length ? (
        <>
          {conversionStats.bad ? (
            <FormControlLabel
              control={<Checkbox checked={showNotFound} onChange={handleShowOnlyNotFoundCheckboxChange} color="primary" />}
              label="Show only QUOTE_NOT_FOUND rows"
            />
          ) : (
            ''
          )}
          {processingDone ? (
            <div>
              <FormControlLabel
                control={<Checkbox checked={mergeWithBranchTsv} onChange={handleMergeWithBranchTsvCheckboxChange} color="primary" style={{ clear: 'both' }} />}
                label={<>Merge with DCS <em>{selectedBranch}/tn_{selectedBook.toUpperCase()}.tsv</em></>}
              />
              <div>
                <div id="copy-info" style={{ float: 'left' }}>
                  {mergeWithBranchTsv ? (
                    <>
                      Click the copy icon to copy the below merged content and{' '}
                      <a href={`${dcsURL}/unfoldingWord/en_tn/_edit/${selectedBranch}/tn_${selectedBook.toUpperCase()}.tsv`} target="_blank">
                        click here
                      </a>{' '}
                      to open the editor of this file on DCS to paste it in.
                    </>
                  ) : (
                    ''
                  )}
                </div>
                <IconButton onClick={handleCopyToClipboard} color="primary" aria-label="copy to clipboard" sx={{ float: 'right' }}>
                  <ContentCopyIcon /> Copy
                </IconButton>
              </div>
            </div>
          ) : (
            ''
          )}
          <div id="tab-delimited-table" style={{ clear: 'both' }}>
            <TabDelimitedTable data={conversionStats.total === conversionStats.done && mergeWithBranchTsv ? mergedTsvRows : convertedTsvRows} showNotFound={showNotFound} />
          </div>
        </>
      ) : (
        ''
      )}
    </>
  );
}

export default ConverterResultsComponent;

import { useContext, useState } from 'react';
import { Box, TextField, Checkbox, FormControlLabel, IconButton } from '@mui/material';
import { AppContentContext } from '../context/AppContentProvider';
import { styled } from '@mui/system';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGo';

// Import the TabDelimitedTable component
const HighlightedCell = styled('td')(({ theme, highlight }) => ({
  backgroundColor: highlight === 'hebrewOrGreek' ? 'yellow' : highlight === 'quoteNotFound' ? 'red' : 'inherit',
  color: highlight === 'quoteNotFound' ? 'white' : 'inherit',
}));

const TabDelimitedTable = ({ inputTsvRows, tsvRows, showNotFound }) => {
  const containsHebrewOrGreek = (text) => /[\u0590-\u05FF\u0370-\u03FF]/.test(text);

  const inputRefs = inputTsvRows.map((row) => row.split('\t')[0]).filter((id) => id != 'Reference');

  return (
    <Box
      sx={{
        margin: 0,
        overflowX: 'auto',
        whiteSpace: 'pre',
        border: '1px solid #ccc',
        padding: '8px',
        borderBottomLeftRadius: '4px',
        borderBottomRightRadius: '4px',
        maxHeight: '500px',
      }}
    >
      <table>
        <tbody style={{ margin: 0 }}>
          {tsvRows.map((row, rowIndex) =>
            !showNotFound || row.includes('QUOTE_NOT_FOUND') ? (
              <tr key={rowIndex}>
                <td style={{ width: 1, color: 'grey', fontSize: '0.8em' }}>{rowIndex + 1}</td>
                {row.split('\t').map((cell, cellIndex) => (
                  <HighlightedCell
                    key={cellIndex}
                    highlight={
                      !inputTsvRows.includes(row) && inputRefs.includes(row.split('\t')[0])
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
              </tr>
            ) : null
          )}
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
    showOnlyConvertedRows,
    setShowOnlyConvertedRows,
    dcsURL,
    setShowErrors,
    showErrors,
    setShowNotFound,
    showNotFound,
  } = useContext(AppContentContext);

  const handleShowOnlyNotFoundCheckboxChange = (event) => {
    setShowNotFound(event.target.checked);
  };

  const handleShowOnlyConvertedRowsCheckboxChange = (event) => {
    setShowOnlyConvertedRows(event.target.checked);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(
      (!showOnlyConvertedRows && doneConverting ? mergedTsvRows : convertedTsvRows).filter((row) => !showNotFound || row.includes('QUOTE_NOT_FOUND')).join('\n')
    );
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
          <div style={{ clear: 'both', position: 'relative' }}>
            <div id="copy-info" style={{ float: 'left' }}>
              {!showOnlyConvertedRows ? (
                <>
                  <p>
                    Below are the converted rows. They have been merged with the TN file of the book from the selected branch:{' '}
                    <a
                      href={`${dcsURL}/unfoldingWord/en_tn/src/branch/${selectedBranch}/tn_${selectedBook.toUpperCase()}.tsv`}
                      target="_blank"
                      style={{ textDecoration: 'none', fontStyle: 'italic' }}
                    >
                      en_tn / {selectedBranch} / tn_{selectedBook.toUpperCase()}.tsv
                    </a>
                  </p>
                  <table>
                    <tr>
                      <td style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                        <strong>To commit your work:</strong>
                      </td>
                      <td>
                        When you click{' '}
                        <strong>
                          <em>Paste into DCS Editor</em>
                        </strong>{' '}
                        below, the converted rows will be copied to your computer's clibboard and a new window will open the file's editor on DCS (
                        <em>make sure your browser allows popups for this site</em>). In the DCS Editor, select all the existing text and replace with your copied text by pasting it in. Scroll down
                        below the editor
                        {selectedBranch == 'master' ? (
                          <>
                            , choose to create a new branch <em>&lt;username&gt;-tc-create-1</em>
                          </>
                        ) : (
                          ''
                        )}{' '}
                        and click{' '}
                        <stong>
                          <em>Commit Changes</em>
                        </stong>
                        .
                      </td>
                    </tr>
                  </table>
                </>
              ) : (
                ''
              )}
            </div>
            <FormControlLabel
              control={<Checkbox checked={showOnlyConvertedRows} onChange={handleShowOnlyConvertedRowsCheckboxChange} color="primary" style={{ clear: 'both' }} />}
              label={'Show only your rows from above'}
            />
            <FormControlLabel
              control={<Checkbox checked={showNotFound} onChange={handleShowOnlyNotFoundCheckboxChange} color="primary" />}
              label="Show only QUOTE_NOT_FOUND rows"
            />
          </div>
          <div id="tab-delimited-table" style={{ clear: 'both' }}>
            <div
              style={{
                paddingTop: '5px',
                display: 'flex',
                alignItems: 'center',
                border: '1px solid #ccc',
                borderTopLeftRadius: '4px',
                borderTopRightRadius: '4px',
                backgroundColor: '#f5f5f5',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>Converted Rows{!showOnlyConvertedRows ? ' Merged with DCS file' : ''}:</span>
              <div>
                <IconButton
                  component="a"
                  onClick={handleCopyToClipboard}
                  aria-label="copy to clipboard"
                  style={{
                    fontSize: '1em',
                    padding: '3px',
                    marginRight: '8px',
                    borderRadius: '4px 4px 0 0',
                    height: '40px',
                    borderLeft: '1px solid black',
                    borderTop: '1px solid black',
                    borderRight: '1px solid black',
                  }}
                >
                  <ContentCopyIcon fontSize="small" /> Copy
                </IconButton>
                {!showOnlyConvertedRows && !showNotFound ? (
                  <IconButton
                    component="a"
                    onClick={() => {
                      handleCopyToClipboard();
                      window.open(`${dcsURL}/unfoldingWord/en_tn/_edit/${selectedBranch}/tn_${selectedBook.toUpperCase()}.tsv`, '_blank');
                    }}
                    href={`${dcsURL}/unfoldingWord/en_tn/_edit/${selectedBranch}/tn_${selectedBook.toUpperCase()}.tsv`}
                    target="_blank"
                    aria-label="edit on DCS"
                    style={{
                      fontSize: '1em',
                      borderRadius: '4px 4px 0 0',
                      height: '40px',
                      padding: '3px',
                      marginRight: '8px',
                      borderLeft: '1px solid black',
                      borderTop: '1px solid black',
                      borderRight: '1px solid black',
                    }}
                  >
                    <ContentPasteGoIcon fontSize="small" /> Paste into DCS Editor
                  </IconButton>
                ) : null}
              </div>
            </div>
            <TabDelimitedTable tsvRows={showOnlyConvertedRows ? convertedTsvRows : mergedTsvRows} inputTsvRows={inputTsvRows} showNotFound={showNotFound} />
          </div>
        </>
      ) : null}
    </>
  );
}

export default ConverterResultsComponent;

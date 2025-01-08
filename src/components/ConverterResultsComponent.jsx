import React, { useContext } from 'react';
import { TextField, Checkbox, FormControlLabel, IconButton, Box } from '@mui/material';
import { AppContentContext } from '../context/AppContentProvider';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGo';
import DiffHighlightedTable from './DiffHighlightedTable';

function ConverterResultsComponent() {
  const {
    selectedBranch,
    selectedBook,
    inputTsvRows,
    convertedTsvRows,
    mergedTsvRows,
    conversionDone,
    errors,
    showOnlyConvertedRows,
    setShowOnlyConvertedRows,
    dcsURL,
    setShowErrors,
    showErrors,
    setShowNotFound,
    showNotFound,
    checkboxStates,
  } = useContext(AppContentContext);

  const handleShowOnlyNotFoundCheckboxChange = (event) => {
    setShowNotFound(event.target.checked);
  };

  const handleShowOnlyConvertedRowsCheckboxChange = (event) => {
    setShowOnlyConvertedRows(event.target.checked);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText((!showOnlyConvertedRows && checkboxStates.mergeWithDCS ? mergedTsvRows : convertedTsvRows).filter((row) => !showNotFound || row.includes('QUOTE_NOT_FOUND') || row.includes("Reference\tID")).join('\n'));
  };

  const failedCount = convertedTsvRows.filter((row) => row.includes('QUOTE_NOT_FOUND: ')).length;

  return (
    <>
      {conversionDone ? (
        <Box sx={{ marginY: 2, padding: 1 }}>
          <div>
            {convertedTsvRows.length} rows processed{failedCount > 0 ? `, failed to find ${failedCount} quote${failedCount > 1 ? 's' : ''}.` : ''}
          </div>
          {errors.length ? (
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
          <div style={{ clear: 'both', position: 'relative' }}>
            <div id="copy-info" style={{ float: 'left' }}>
              {!showOnlyConvertedRows && checkboxStates.mergeWithDCS ? (
                <>
                  <p>
                    Below are the converted rows. They have been merged with the TN file of the book from the selected branch:{' '}
                    <a
                      href={`${dcsURL}/unfoldingWord/en_tn/src/branch/${selectedBranch}/tn_${selectedBook.toUpperCase()}.tsv`}
                      target="_blank"
                      style={{ textDecoration: 'none', fontStyle: 'italic' }}
                      rel="noreferrer"
                    >
                      en_tn / {selectedBranch} / tn_{selectedBook.toUpperCase()}.tsv
                    </a>
                  </p>
                  <table>
                    <tbody>
                      <tr>
                        <td style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          <strong>To commit your work:</strong>
                        </td>
                        <td>
                          Click{' '}
                          <strong>
                            <em>Paste into DCS Editor</em>
                          </strong>{' '}
                          below. The converted rows will be copied to your computer&apos;s clipboard and a new window will open the file&apos;s editor on DCS (
                          <em>make sure your browser allows popups for this site</em>). In the DCS Editor, select all the existing text and replace with your copied text by pasting
                          it in. Scroll down below the editor
                          {selectedBranch == 'master' ? (
                            <>
                              , choose to create a new branch and name it <em>&lt;username&gt;-tc-create-1</em>,
                            </>
                          ) : (
                            ''
                          )}{' '}
                          and click{' '}
                          <strong>
                            <em>Commit Changes</em>
                          </strong>
                          .
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </>
              ) : (
                ''
              )}
            </div>
            {checkboxStates.mergeWithDCS && <FormControlLabel
              control={<Checkbox checked={showOnlyConvertedRows} onChange={handleShowOnlyConvertedRowsCheckboxChange} color="primary" style={{ clear: 'both' }} />}
              label={'Show only your rows from above'}
            />}
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
            <DiffHighlightedTable tsvRows={!showOnlyConvertedRows && checkboxStates.mergeWithDCS ? mergedTsvRows : convertedTsvRows } inputTsvRows={inputTsvRows} showNotFound={showNotFound} />
          </div>
        </Box>
      ) : null}
    </>
  );
}

export default ConverterResultsComponent;

import React from 'react';
import { FormControlLabel, Checkbox, TextField, Box } from '@mui/material';
import { styled } from '@mui/system';

const HighlightedCell = styled('td')(({ theme, highlight }) => ({
  backgroundColor: highlight === 'hebrewOrGreek' ? 'yellow' : highlight === 'quoteNotFound' ? 'red' : 'inherit',
}));

const TabDelimitedTable = ({ data, showNotFound }) => {
  const rows = data
    .filter(row => !showNotFound || row.includes('QUOTE_NOT_FOUND'))
    .map(row => row.split('\t'));

  const containsHebrewOrGreek = text => /[\u0590-\u05FF\u0370-\u03FF]/.test(text);

  return (
    <Box sx={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
      <table>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <HighlightedCell
                  key={cellIndex}
                  highlight={
                    cellIndex === 4
                      ? containsHebrewOrGreek(cell)
                        ? 'hebrewOrGreek'
                        : cell.includes('QUOTE_NOT_FOUND')
                        ? 'quoteNotFound'
                        : null
                      : null
                  }
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

const ConverterResultsComponent = ({ convertedTsvRows, showNotFound, handleCheckboxChange }) => {
  return (
    <div>
      {convertedTsvRows.length ? (
        <>
          <FormControlLabel
            control={<Checkbox checked={showNotFound} onChange={handleCheckboxChange} color="primary" />}
            label="Show only QUOTE_NOT_FOUND rows"
          />
          <TabDelimitedTable data={convertedTsvRows} showNotFound={showNotFound} />
        </>
      ) : (
        ''
      )}
    </div>
  );
};

export default ConverterResultsComponent;
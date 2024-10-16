// Import the TabDelimitedTable component
import React from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/system';
import PropTypes from 'prop-types';

const HighlightedCell = styled('td')(({ highlight }) => ({
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

TabDelimitedTable.propTypes = {
  inputTsvRows: PropTypes.array.isRequired,
  tsvRows: PropTypes.array.isRequired,
  showNotFound: PropTypes.bool.isRequired,
};

export default TabDelimitedTable;
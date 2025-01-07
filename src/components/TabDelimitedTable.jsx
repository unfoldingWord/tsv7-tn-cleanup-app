// Import the TabDelimitedTable component
import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { styled } from '@mui/system';
import PropTypes from 'prop-types';

const HighlightedCell = styled('td')(({ highlight }) => ({
  backgroundColor: highlight === 'difference' ? 'yellow' : highlight === 'error' ? 'red' : 'inherit',
  color: highlight === 'error' ? 'white' : 'inherit',
}));

const TabDelimitedTable = ({ inputTsvRows, tsvRows, showNotFound }) => {
  if (!tsvRows.length || !inputTsvRows.length) {
    return null;
  }
  const inputRefs = inputTsvRows.map((row) => row.split('\t')[0]).filter((id) => id != 'Reference');
  const inputRowsByID = new Map();
  inputTsvRows.forEach((row) => {
    const cells = row.split('\t');
    if (cells[1].trim()) {
        const tsvRowLength = tsvRows[0].split('\t').length;
        console.log(cells.length, tsvRowLength);
        while (cells.length < tsvRowLength) {
          cells.splice(6, 0, '');
        }
        console.log(cells);
        inputRowsByID.set(cells[1].trim(), cells);
    }
  });

  const rows = [];
  for(const rowIdx in tsvRows) {
    const tsvCells = tsvRows[rowIdx].split('\t');
    const rowObj = {
      cells: [],
      hasError: false,
      hasDifference: false,
      isInputRow: inputRowsByID.has(tsvCells[1]) || inputRefs.includes(tsvCells[0]),
    };
    tsvCells.forEach((cell, cellIndex) => {
      const cellObj = {
        content: cell,
        highlight: '',
        tooltip: '',
      }
      if (cell.includes('QUOTE_NOT_FOUND')) {
        cellObj.highlight = 'error';
        rowObj.hasError = true;
      };
      if (inputRowsByID.has(tsvCells[1])) {
        const inputCells = inputRowsByID.get(tsvCells[1]);
        if (inputCells[cellIndex] !== cell) {
          cellObj.highlight = cellObj.highlight || 'difference';
          rowObj.hasDifference = true;
          cellObj.tooltip = (inputCells[cellIndex] ? `Old Text:\n${inputCells[cellIndex]}\nNew Text:\n${cell}` : `New Text:\n${cell}`);
        }
      }
      rowObj.cells.push(cellObj);
    });
    rows.push(rowObj);
  }
  console.log(rows);

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
          {rows.map((rowObj, rowIndex) =>
            !showNotFound || rowObj.hasError ? (
              <tr key={rowIndex}>
                <td style={{ width: 1, color: 'grey', fontSize: '0.8em' }}>{rowIndex + 1}</td>
                {rowObj.cells.map((cellObj, cellIndex) => (
                  <Tooltip key={cellIndex} title=<span style={{ whiteSpace: 'pre-line' }}>{cellObj.tooltip}</span> arrow>
                  <HighlightedCell
                    key={cellIndex}
                    highlight={cellObj.highlight}
                  >
                    {cellObj.content}
                  </HighlightedCell>
                  </Tooltip>
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
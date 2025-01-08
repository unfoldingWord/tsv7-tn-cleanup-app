// Import the TabDelimitedTable component
import React from 'react';
import { Paper, Tooltip, TextareaAutosize } from '@mui/material';
import PropTypes from 'prop-types';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

const DiffHighlightedTable = ({ inputTsvRows, tsvRows, showNotFound }) => {
  if (!tsvRows.length || !inputTsvRows.length) {
    return null;
  }
  const inputRefs = inputTsvRows.map((row) => row.split('\t')[0]).filter((id) => id != 'Reference');
  const inputRowsByID = new Map();
  inputTsvRows.forEach((row) => {
    const cells = row.split('\t');
    if (cells[1].trim() && cells[0].trim() != 'Reference') {
      const tsvRowLength = tsvRows[0].split('\t').length;
      while (cells.length < tsvRowLength) {
        cells.splice(6, 0, '');
      }
      inputRowsByID.set(cells[1].trim(), cells);
    }
  });

  if (tsvRows[0].split('\t')[0] != 'Reference') {
    if (tsvRows[0].split('\t').length == 7) {
      tsvRows.unshift('Reference\tID\tTags\tSupportReference\tQuote\tOccurrence\tNote');
    } else if (tsvRows[0].split('\t').length == 9) {
      tsvRows.unshift('Reference\tID\tTags\tSupportReference\tQuote\tOccurrence\tGLQuote\tGLOccurrence\tNote');
    }
  }

  const rows = [];
  for (const rowIdx in tsvRows) {
    if (rowIdx != 0 && showNotFound && !tsvRows[rowIdx].includes('QUOTE_NOT_FOUND')) {
      continue;
    }
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
      };
      if (cell.includes('QUOTE_NOT_FOUND')) {
        cellObj.highlight = 'error';
        rowObj.hasError = true;
      }
      if (inputRowsByID.has(tsvCells[1])) {
        const inputCells = inputRowsByID.get(tsvCells[1]);
        if (inputCells[cellIndex] !== cell) {
          cellObj.highlight = cellObj.highlight || 'difference';
          rowObj.hasDifference = true;
          cellObj.tooltip = inputCells[cellIndex] ? `Old Text:\n${inputCells[cellIndex]}\nNew Text:\n${cell}` : `New Text:\n${cell}`;
        }
      }
      rowObj.cells.push(cellObj);
    });
    rows.push(rowObj);
  }

  return (
    <Paper
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
      <TableContainer sx={{ width: '100%', maxHeight: 440 }}>
        <Table stickyHeader aria-label="sticky table" sx={{ width: '100%' }}>
          <TableHead>
            <TableRow>
              {rows[0].cells.map((cell, cellIdx) => (
                <TableCell key={cellIdx} align="left">
                  {cell.content}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.slice(1).map((row, rowIdx) => {
              return (
                <TableRow hover role="checkbox" tabIndex={-1} key={rowIdx}>
                  {row.cells.map((cell, cellIdx) => {
                    return (
                      <TableCell key={cellIdx} align="left" sx={{ minWidth: 50, padding: cellIdx < (row.cells.length - 1) ? 1 : 0, whiteSpace: 'break-spaces'}}>
                        <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{cell.tooltip}</span>} disableHoverListener={!cell.tooltip} arrow>                          
                          {cellIdx < (row.cells.length - 1) ? 
                            <span style={{backgroundColor: cell.highlight === 'difference' ? 'yellow' : cell.highlight === 'error' ? 'red' : 'inherit', color: cell.highlight === 'error' ? 'white' : 'inherit'}}>
                              {cell.content}
                            </span> :
                            <TextareaAutosize
                              minRows={1}
                              maxRows={3}
                              width={400}
                              style={{ width: 400, resize: 'both', overflow: 'auto', backgroundColor: cell.highlight === 'difference' ? 'yellow' : cell.highlight === 'error' ? 'red' : 'inherit', color: cell.highlight === 'error' ? 'white' : 'inherit' }}
                              value={cell.content}
                              readOnly
                            />}
                        </Tooltip>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

DiffHighlightedTable.propTypes = {
  inputTsvRows: PropTypes.array.isRequired,
  tsvRows: PropTypes.array.isRequired,
  showNotFound: PropTypes.bool.isRequired,
};

export default DiffHighlightedTable;

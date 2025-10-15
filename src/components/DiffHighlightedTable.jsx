import React, { useState } from 'react';
import { Paper, Tooltip, TextareaAutosize, Table, TableRow, TableCell, TableHead, TableContainer, TableBody, TablePagination, Select, MenuItem } from '@mui/material';
import PropTypes from 'prop-types';

const DiffHighlightedTable = ({ inputTsvRows, tsvRows, showNotFound }) => {
  const [page, setPage] = useState(0);
  const rowsPerPage = 100;

  if (!tsvRows.length || !inputTsvRows.length) {
    return null;
  }
  const inputRefs = inputTsvRows.map((row) => row.split('\t')[0]).filter((id) => id != 'Reference');
  const inputRowsByID = new Map();
  inputTsvRows.forEach((row) => {
    const cells = row.split('\t');
    console.log(cells);
    if (cells?.[1]?.trim() && cells?.[0]?.trim() != 'Reference') {
      const tsvRowLength = tsvRows[0].split('\t').length;
      while (cells.length < tsvRowLength) {
        cells.splice(6, 0, '');
      }
      inputRowsByID.set(cells[1].trim() || '', cells);
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
      if (inputRowsByID.has(tsvCells[1]) && inputRowsByID.get(tsvCells[1])[0] === tsvCells[0]) {
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

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  if (page * rowsPerPage > rows.length) {
    setPage(0);
  }

  const paginatedRows = rows.slice(1).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handlePageInputChange = (event) => {
    const newPage = parseInt(event.target.value, 10) - 1;
    if (!isNaN(newPage) && newPage >= 0 && newPage < Math.ceil(rows.length / rowsPerPage)) {
      setPage(newPage);
    }
  };

  const handlePageInputKeyPress = (event) => {
    if (event.key === 'Enter') {
      handlePageInputChange(event);
    }
  };

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
      <TablePagination
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[rowsPerPage]}
        page={page}
        onPageChange={handleChangePage}
        ActionsComponent={(subProps) => {
          const { page } = subProps;
          return (
            <>
              {', '}Page:{' '}
              <Select
                size="small"
                onChange={(e) => handleChangePage(e, e.target.value)}
                value={page}
                MenuProps={{
                  PaperProps: { sx: { maxHeight: 360 } },
                }}
              >
                {[...Array(Math.ceil(rows.length / rowsPerPage)).keys()].map((pageNum) => (
                  <MenuItem key={pageNum} value={pageNum}>
                    {pageNum + 1}
                  </MenuItem>
                ))}
              </Select>
              {' of '}
              {Math.ceil(rows.length / rowsPerPage)}
            </>
          );
        }}
        sx={{
          '& .MuiTablePagination-toolbar': {
            minHeight: '36px',
          },
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            marginTop: '0px',
            marginBottom: '0px',
          },
        }}
      />
      <TableContainer sx={{ width: '100%', maxHeight: 440 }}>
        <Table stickyHeader aria-label="sticky table" sx={{ width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell key="line-num">#</TableCell>
              {rows[0].cells.map((cell, cellIdx) => (
                <TableCell key={cellIdx} align="left">
                  {cell.content}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.map((row, rowIdx) => (
              <TableRow hover role="checkbox" tabIndex={-1} key={rowIdx}>
                <TableCell key="line-num">{page * rowsPerPage + rowIdx + 2}</TableCell>
                {row.cells.map((cell, cellIdx) => (
                  <TableCell key={cellIdx} align="left" sx={{ minWidth: 50, padding: cellIdx < row.cells.length - 1 ? 1 : 0, whiteSpace: 'break-spaces' }}>
                    <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{cell.tooltip}</span>} disableHoverListener={!cell.tooltip} arrow>
                      {cellIdx < row.cells.length - 1 ? (
                        <span
                          style={{
                            backgroundColor: cell.highlight === 'difference' ? 'yellow' : cell.highlight === 'error' ? 'red' : 'inherit',
                            color: cell.highlight === 'error' ? 'white' : 'inherit',
                          }}
                        >
                          {cell.content}
                        </span>
                      ) : (
                        <TextareaAutosize
                          minRows={1}
                          maxRows={3}
                          width={400}
                          style={{
                            width: 400,
                            resize: 'both',
                            overflow: 'auto',
                            backgroundColor: cell.highlight === 'difference' ? 'yellow' : cell.highlight === 'error' ? 'red' : 'inherit',
                            color: cell.highlight === 'error' ? 'white' : 'inherit',
                          }}
                          value={cell.content}
                          readOnly
                        />
                      )}
                    </Tooltip>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[200]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        sx={{
          '& .MuiTablePagination-toolbar': {
            minHeight: '36px',
          },
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            marginTop: '0px',
            marginBottom: '0px',
          },
        }}
      />
    </Paper>
  );
};

DiffHighlightedTable.propTypes = {
  inputTsvRows: PropTypes.array.isRequired,
  tsvRows: PropTypes.array.isRequired,
  showNotFound: PropTypes.bool.isRequired,
};

export default DiffHighlightedTable;

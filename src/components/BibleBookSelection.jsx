import React, { useContext, useEffect, useState } from 'react';
import { Autocomplete, TextField, Box, Typography } from '@mui/material';
import { AppContentContext } from '../context/AppContentProvider';
import { BibleBookData } from '../common/books';

function BibleBookSelection() {
  const { selectedBook, setSelectedBook, setTsvContent } = useContext(AppContentContext);

  return (
    <Box sx={{ marginY: 2 }}>
      <Autocomplete
        options={Object.keys(BibleBookData)}
        getOptionLabel={(option) => `${BibleBookData[option]?.title} (${option})`}
        value={selectedBook}
        onChange={(event, newValue) => {
          if (newValue) {
            setSelectedBook(newValue); 
            setTsvContent('');
          }
        }}
        renderInput={(params) => <TextField {...params} label="Select a Bible Book" variant="outlined" fullWidth />}
        sx={{ marginY: 2 }}
      />
    </Box>
  );
}

export default BibleBookSelection;

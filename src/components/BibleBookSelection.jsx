import React, { useContext } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { AppContentContext } from '../context/AppContentProvider';
import { BibleBookData } from '../common/books';

function BibleBookSelection() {
  const { selectedBook, setSelectedBook } = useContext(AppContentContext);

  return (
    <Autocomplete
      options={Object.keys(BibleBookData)}
      getOptionLabel={(option) => `${BibleBookData[option]?.title} (${option})`}
      value={selectedBook}
      onChange={(event, newValue) => {
        if (newValue) {
          setSelectedBook(newValue);
        }
      }}
      renderInput={(params) => <TextField {...params} label="Select a Bible Book" variant="outlined" fullWidth />}
      sx={{ margin: 2, width: "100%" }}
    />
  );
}

export default BibleBookSelection;

import React, { useContext } from 'react';
import { AppContentContext } from '../context/AppContentProvider.jsx';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';

const ProgressDisplay = () => {
  const { totalRowCount } = useContext(AppContentContext);
  const { rows, done } = totalRowCount;

  const progress = rows > 0 ? (done / rows) * 100 : 0;

  return (
    <Box sx={{ width: '100%', marginTop: 2 }}>
      <Typography variant="body1">
        Processing: {done} of {rows} rows
      </Typography>
      <LinearProgress variant="determinate" value={progress} />
    </Box>
  );
};

export default ProgressDisplay;

import React, { useContext } from 'react';
import { AppContentContext } from '../context/AppContentProvider.jsx';
import Typography from '@mui/material/Typography';

const AppHeader = () => {
  const { server } = useContext(AppContentContext);

  return (
    <Typography variant="h4" sx={{ backgroundColor: '#38ADDF', color: '#FFF', padding: 1, textAlign: 'center' }}>
      TSV TN Cleanup App{server != 'PROD' ? ` (${server})` : ''}
      <a
        href="https://github.com/unfoldingWord/tsv7-tn-cleanup-app"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'absolute',
          top: '25px',
          right: '-25px',
          backgroundColor: 'darkcyan',
          color: '#fff',
          padding: '8px 16px',
          fontSize: '12px',
          textDecoration: 'none',
          transform: 'rotate(45deg)',
          transformOrigin: 'center',
          zIndex: 1000,
          borderRadius: '0 0 0 4px',
        }}
      >
        Code on GitHub
      </a>
    </Typography>
  );
};

export default AppHeader;

import React from 'react';
import { Fab, Tooltip, Zoom } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useNavigate } from 'react-router-dom';

const FaqFabWidget: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Zoom in>
      <Tooltip title="Статьи и FAQ" placement="left">
        <Fab
          onClick={() => navigate('/articles-faq')}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1100,
            background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(126, 87, 194, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5E35B1 0%, #7E57C2 100%)',
              boxShadow: '0 6px 20px rgba(126, 87, 194, 0.5)',
            },
          }}
        >
          <HelpOutlineIcon />
        </Fab>
      </Tooltip>
    </Zoom>
  );
};

export default FaqFabWidget;

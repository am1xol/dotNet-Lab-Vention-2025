import React from 'react';
import { Box, Typography } from '@mui/material';

interface ChatMessageBubbleProps {
  content: string;
  isOwn: boolean;
  timestamp: string;
  footer?: React.ReactNode;
  maxWidth?: string | number;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  content,
  isOwn,
  timestamp,
  footer,
  maxWidth = '70%',
}) => (
  <Box
    sx={{
      maxWidth,
      px: 1.5,
      py: 1,
      borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
      bgcolor: isOwn ? 'primary.main' : 'background.paper',
      color: isOwn ? 'primary.contrastText' : 'text.primary',
      boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
    }}
  >
    <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
      {content}
    </Typography>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        gap: 0.5,
        mt: 0.5,
      }}
    >
      {footer}
      <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem' }}>
        {timestamp}
      </Typography>
    </Box>
  </Box>
);

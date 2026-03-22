import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { Box, Paper, IconButton, TextField, Typography, Badge, Avatar, Fab, Alert, Button } from '@mui/material';
import { Send as SendIcon, Chat as ChatIcon, Close as CloseIcon, Lock as LockIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import chatService from '../../services/chat-service';
import { ChatMessageDto } from '../../types/chat';
import { useAuthStore } from '../../store/auth-store';

const POLL_INTERVAL = 10000; // Increased from 3s to 10s to reduce server load
const UserChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isClosed, setIsClosed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevMessagesLengthRef = useRef<number>(0);
  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const loadConversation = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const data = await chatService.getMyConversation();
      // Only update state if messages actually changed
      if (data.messages.length !== prevMessagesLengthRef.current) {
        setMessages(data.messages);
        prevMessagesLengthRef.current = data.messages.length;
      }
      setUnreadCount(data.conversation.unreadCount);
      setIsClosed(data.conversation.status === 'Closed');
      setError(null);
    } catch (error: any) {
      console.error('Error loading conversation:', error);
      if (error.response?.status === 403) {
        setError(error.response.data);
        setIsClosed(true);
      }
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async () => {
    try {
      await chatService.markAsRead();
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, []);

  const startNewConversation = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await chatService.createNewConversation();
      setMessages(data.messages);
      setUnreadCount(0);
      setIsClosed(false);
      setError(null);
    } catch (error: any) {
      console.error('Error starting new conversation:', error);
      setError('Failed to start new conversation');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Optimized polling - only poll when chat is open
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadConversation();
      markAsRead();
      // Increased interval from 3000ms to 10000ms for better performance
      pollIntervalRef.current = setInterval(() => {
        loadConversation();
      }, POLL_INTERVAL);
    }
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isOpen, isAuthenticated, loadConversation, markAsRead]);

  // Optimized scroll effect - only run when messages actually change
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isAuthenticated || isClosed) return;

    try {
      const message = await chatService.sendMessage(newMessage.trim());
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
      setError(null);
      loadConversation();
    } catch (error: any) {
      console.error('Error sending message:', error);
      if (error.response?.status === 403) {
        setError(error.response.data);
        setIsClosed(true);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Chat toggle button */}
      <Fab
        color="primary"
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 1100,
        }}
      >
        {isOpen ? <CloseIcon /> : <Badge badgeContent={unreadCount} color="error"><ChatIcon /></Badge>}
      </Fab>

      {/* Chat window */}
      {isOpen && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 100,
            left: 24,
            width: 380,
            height: 500,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1100,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'primary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'white', color: 'primary.main' }}>
                <ChatIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  Support Chat
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {isClosed ? 'Chat closed' : 'We typically reply within a few minutes'}
                </Typography>
              </Box>
            </Box>
            <IconButton 
              size="small" 
              onClick={() => loadConversation()}
              sx={{ color: 'white' }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 2,
              bgcolor: '#f5f5f5',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {error && (
              <Alert severity="error" sx={{ mb: 1 }}>
                {error}
              </Alert>
            )}
            {isLoading && messages.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center">
                Loading...
              </Typography>
            ) : messages.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
                Start a conversation with our support team
              </Typography>
            ) : (
              messages.map((msg) => (
                <Box
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    justifyContent: msg.senderRole === 'User' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '80%',
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: msg.senderRole === 'User' ? 'primary.main' : 'white',
                      color: msg.senderRole === 'User' ? 'white' : 'text.primary',
                      boxShadow: 1,
                    }}
                  >
                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                      {msg.content}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        opacity: 0.7,
                        display: 'block',
                        textAlign: msg.senderRole === 'User' ? 'right' : 'left',
                        mt: 0.5,
                      }}
                    >
                      {formatTime(msg.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'white',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {isClosed ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                  <LockIcon fontSize="small" />
                  <Typography variant="body2">Chat is closed</Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  onClick={startNewConversation}
                  startIcon={<ChatIcon />}
                >
                  Start New Chat
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={!isAuthenticated}
                  multiline
                  maxRows={3}
                />
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !isAuthenticated}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            )}
          </Box>
        </Paper>
      )}
    </>
  );
};

// Memoize the entire component to prevent unnecessary re-renders
export default memo(UserChatWidget);
import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Paper, IconButton, TextField, Typography, Badge, Avatar, Fab, Alert, Button } from '@mui/material';
import { Send as SendIcon, Chat as ChatIcon, Close as CloseIcon, Lock as LockIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import chatService from '../../services/chat-service';
import { chatRealtimeService } from '../../services/chat-realtime-service';
import { ChatMessageDto } from '../../types/chat';
import { useAuthStore } from '../../store/auth-store';
import { translations } from '../../i18n/translations';
import { formatTime } from '../../utils/date-utils';

const POLL_INTERVAL = 10000;
const t = translations.userChat;
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
  const activeConversationIdRef = useRef<string | null>(null);
  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const loadConversation = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const data = await chatService.getMyConversation();
      if (data.messages.length !== prevMessagesLengthRef.current) {
        setMessages(data.messages);
        prevMessagesLengthRef.current = data.messages.length;
      }
      activeConversationIdRef.current = data.conversation.id;
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

  const loadUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const data = await chatService.getMyConversation();
      activeConversationIdRef.current = data.conversation.id;
      setUnreadCount(data.conversation.unreadCount);
      setIsClosed(data.conversation.status === 'Closed');
      setError(null);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setError(error.response.data);
        setIsClosed(true);
      }
    }
  }, [isAuthenticated]);

  const startNewConversation = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await chatService.createNewConversation();
      setMessages(data.messages);
      prevMessagesLengthRef.current = data.messages.length;
      activeConversationIdRef.current = data.conversation.id;
      setUnreadCount(0);
      setIsClosed(false);
      setError(null);
    } catch (error: any) {
      console.error('Error starting new conversation:', error);
      setError(t.failedToStartConversation);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadConversation();
      markAsRead();
      pollIntervalRef.current = setInterval(() => {
        if (!chatRealtimeService.isConnected()) {
          loadConversation();
        }
      }, POLL_INTERVAL);
    }
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isOpen, isAuthenticated, loadConversation, markAsRead]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    loadUnreadCount();

    // A short delayed re-fetch helps after login/navigation transitions.
    const initRetryTimeout = setTimeout(() => {
      loadUnreadCount();
    }, 1500);

    return () => clearTimeout(initRetryTimeout);
  }, [isAuthenticated, loadUnreadCount]);

  useEffect(() => {
    if (!isAuthenticated || isOpen) return;

    loadUnreadCount();
    const unreadPollInterval = setInterval(() => {
      if (!chatRealtimeService.isConnected()) {
        loadUnreadCount();
      }
    }, POLL_INTERVAL);

    return () => clearInterval(unreadPollInterval);
  }, [isAuthenticated, isOpen, loadUnreadCount]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const unsubscribeMessage = chatRealtimeService.onMessageReceived((message) => {
      const isCurrentConversation = activeConversationIdRef.current === message.conversationId;
      const shouldAutoRead = isOpen && isCurrentConversation && message.senderRole === 'Admin';

      if (message.senderRole === 'Admin' && !shouldAutoRead) {
        setUnreadCount((prev) => prev + 1);
      }

      if (isCurrentConversation) {
        setMessages((prev) => {
          if (prev.some((item) => item.id === message.id)) {
            return prev;
          }

          prevMessagesLengthRef.current = prev.length + 1;
          return [...prev, message];
        });

        if (shouldAutoRead) {
          markAsRead();
          setUnreadCount(0);
        }
      }
    });

    const unsubscribeConversation = chatRealtimeService.onConversationUpdated((conversationId) => {
      if (activeConversationIdRef.current === conversationId) {
        loadConversation();
      }
    });

    const unsubscribeUnread = chatRealtimeService.onUnreadCountChanged((count) => {
      setUnreadCount(count);
    });

    return () => {
      unsubscribeMessage();
      unsubscribeConversation();
      unsubscribeUnread();
    };
  }, [isAuthenticated, isOpen, loadConversation, markAsRead]);

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
      prevMessagesLengthRef.current += 1;
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

  if (!isAuthenticated) {
    return null;
  }

  const handleToggleChat = () => {
    if (!isOpen) {
      setUnreadCount(0);
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Chat toggle button */}
      <Fab
        color="primary"
        onClick={handleToggleChat}
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
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="user-chat-panel"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.85 }}
            style={{
              position: 'fixed',
              bottom: 100,
              left: 24,
              width: 380,
              zIndex: 1100,
            }}
          >
            <Paper
              elevation={8}
              sx={{
                height: 500,
                display: 'flex',
                flexDirection: 'column',
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
                  {t.supportChat}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {isClosed ? t.chatClosed : t.weTypicallyReply}
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
                {t.loading}
              </Typography>
            ) : messages.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
                {t.startConversation}
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
                  <Typography variant="body2">{t.chatIsClosed}</Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  onClick={startNewConversation}
                  startIcon={<ChatIcon />}
                >
                  {t.startNewChat}
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t.typeMessage}
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(UserChatWidget);
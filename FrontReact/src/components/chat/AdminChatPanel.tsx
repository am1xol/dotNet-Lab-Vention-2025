import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  TextField,
  IconButton,
  Badge,
  Chip,
  Button,
} from '@mui/material';
import { Send as SendIcon, Close as CloseIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import chatService from '../../services/chat-service';
import { ChatConversationDto, ChatMessageDto } from '../../types/chat';
import { translations } from '../../i18n/translations';

export const AdminChatPanel: React.FC = () => {
  const [conversations, setConversations] = useState<ChatConversationDto[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversationDto | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadConversations = async () => {
    try {
      const status = filter === 'all' ? undefined : filter;
      const data = await chatService.getAllConversations(status);
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  useEffect(() => {
    loadConversations();
    pollIntervalRef.current = setInterval(() => {
      loadConversations();
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [filter]);

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const data = await chatService.getConversationById(conversationId);
      setSelectedConversation(data.conversation);
      setMessages(data.messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSelectConversation = (conv: ChatConversationDto) => {
    loadConversationMessages(conv.id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const message = await chatService.adminSendMessage(selectedConversation.id, newMessage.trim());
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleCloseConversation = async () => {
    if (!selectedConversation) return;

    try {
      await chatService.closeConversation(selectedConversation.id);
      loadConversations();
      setSelectedConversation(null);
      setMessages([]);
    } catch (error) {
      console.error('Error closing conversation:', error);
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
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return translations.adminChat.justNow;
    if (diffMins < 60) return translations.adminChat.minutesAgo.replace('{count}', String(diffMins));
    if (diffHours < 24) return translations.adminChat.hoursAgo.replace('{count}', String(diffHours));
    if (diffDays < 7) return translations.adminChat.daysAgo.replace('{count}', String(diffDays));
    return date.toLocaleDateString();
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 200px)', minHeight: 500, gap: 2 }}>
      {/* Conversations List */}
      <Paper
        elevation={2}
        sx={{
          width: 350,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">
              {translations.adminChat.chatConversations}
            </Typography>
            <IconButton size="small" onClick={() => loadConversations()}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant={filter === 'all' ? 'contained' : 'outlined'}
              onClick={() => setFilter('all')}
            >
              {translations.adminChat.all}
            </Button>
            <Button
              size="small"
              variant={filter === 'Open' ? 'contained' : 'outlined'}
              onClick={() => setFilter('Open')}
            >
              {translations.adminChat.open}
            </Button>
            <Button
              size="small"
              variant={filter === 'Closed' ? 'contained' : 'outlined'}
              onClick={() => setFilter('Closed')}
            >
              {translations.adminChat.closed}
            </Button>
          </Box>
        </Box>

        <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
          {conversations.length === 0 ? (
            <ListItem>
              <ListItemText
                primary={translations.adminChat.noConversations}
                secondary={translations.adminChat.newChatsAppearHere}
              />
            </ListItem>
          ) : (
            conversations.map((conv) => (
              <ListItemButton
                key={conv.id}
                selected={selectedConversation?.id === conv.id}
                onClick={() => handleSelectConversation(conv)}
                sx={{ borderBottom: '1px solid #f0f0f0' }}
              >
                <ListItemAvatar>
                  <Badge
                    badgeContent={conv.unreadCount}
                    color="error"
                    overlap="circular"
                  >
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {conv.userFirstName?.[0]}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2">
                        {conv.userFirstName} {conv.userLastName}
                      </Typography>
                      {conv.lastMessageAt && (
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(conv.lastMessageAt)}
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 150 }}>
                        {conv.userEmail}
                      </Typography>
                      <Chip
                        size="small"
                        label={conv.status}
                        color={conv.status === 'Open' ? 'success' : 'default'}
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>
                  }
                />
              </ListItemButton>
            ))
          )}
        </List>
      </Paper>

      {/* Chat Area */}
      <Paper
        elevation={2}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {!selectedConversation ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
            }}
          >
            <Typography>{translations.adminChat.selectConversationToView}</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <Box
              sx={{
                p: 2,
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {selectedConversation.userFirstName} {selectedConversation.userLastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedConversation.userEmail}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  size="small"
                  label={selectedConversation.status}
                  color={selectedConversation.status === 'Open' ? 'success' : 'default'}
                />
                {selectedConversation.status === 'Open' && (
                  <IconButton size="small" onClick={handleCloseConversation} color="error">
                    <CloseIcon />
                  </IconButton>
                )}
              </Box>
            </Box>

            {/* Messages */}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                p: 2,
                bgcolor: '#f9f9f9',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              {messages.map((msg) => (
                <Box
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    justifyContent: msg.senderRole === 'Admin' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '70%',
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: msg.senderRole === 'Admin' ? 'primary.main' : 'white',
                      color: msg.senderRole === 'Admin' ? 'white' : 'text.primary',
                      boxShadow: 1,
                    }}
                  >
                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                      {msg.content}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: msg.senderRole === 'Admin' ? 'flex-end' : 'flex-start',
                        gap: 0.5,
                        mt: 0.5,
                      }}
                    >
                      {msg.senderRole === 'User' && (
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {msg.senderFirstName}
                        </Typography>
                      )}
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {formatTime(msg.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Input */}
            {selectedConversation.status === 'Open' && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'white',
                  borderTop: '1px solid #e0e0e0',
                  display: 'flex',
                  gap: 1,
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  placeholder={translations.adminChat.typingReplyPlaceholder}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  multiline
                  maxRows={3}
                />
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};
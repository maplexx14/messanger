import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  TextField,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Chip,
  Menu,
  MenuItem,
  Tooltip,
  useTheme as useMuiTheme,
  useMediaQuery,
  Badge,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Send as SendIcon,
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
  Message as MessageIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Logout as LogoutIcon,
  Search as SearchIcon,
  PushPin as PushPinIcon,
  CloudDownload as CloudDownloadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import UserSearch from './UserSearch';
import DirectMessage from './DirectMessage';
import ResponsiveLayout from './ResponsiveLayout';
import Settings from './Settings';
import { useTranslation } from 'react-i18next';
import Fab from '@mui/material/Fab';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon from '@mui/icons-material/Check';
import InputBase from '@mui/material/InputBase';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';

const API_URL = '/api';
const WS_URL = `ws://${window.location.host}/ws`;

const drawerWidth = 340;

// Restore original MessageInput
const MessageInput = memo(function MessageInput({ value, onChange, onSend, disabled, onFileSelect }) {
  const fileInputRef = useRef();
  return (
    <form onSubmit={onSend} style={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'background.default',
          borderRadius: 3,
          px: 2,
          py: 1,
          boxShadow: 'none',
          border: 'none',
          minHeight: 44,
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={onFileSelect}
          multiple={false}
          accept="*"
        />
        <IconButton size="small" sx={{ color: 'text.secondary', mr: 1 }} onClick={() => fileInputRef.current.click()}>
          <AttachFileIcon fontSize="small" />
        </IconButton>
        <InputBase
          fullWidth
          placeholder="Type a message..."
          value={value}
          onChange={onChange}
          disabled={disabled}
          sx={{
            color: 'text.primary',
            fontSize: '1rem',
            px: 0,
            background: 'none',
            border: 'none',
            boxShadow: 'none',
            '& input': {
              p: 0,
              border: 'none',
              boxShadow: 'none',
            },
          }}
          inputProps={{ style: { padding: 0, border: 'none', boxShadow: 'none' } }}
        />
        <IconButton size="small" sx={{ color: 'text.secondary', mx: 1 }}>
          <InsertEmoticonIcon fontSize="small" />
        </IconButton>
        <IconButton
          type="submit"
          color="primary"
          disabled={!value.trim() || disabled}
          sx={{
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: 2,
            ml: 1,
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
            '&.Mui-disabled': {
              backgroundColor: 'action.disabledBackground',
              color: 'action.disabled',
            },
          }}
        >
          <SendIcon fontSize="medium" />
        </IconButton>
      </Box>
    </form>
  );
});

// Helper to safely format message time
function formatMessageTime(message) {
  let dateObj = message.timestamp || message.created_at;
  if (typeof dateObj === 'string' || typeof dateObj === 'number') {
    dateObj = new Date(dateObj);
  }
  if (dateObj instanceof Date && !isNaN(dateObj)) {
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return '';
}

// Restore original MessageList
const MessageList = React.memo(function MessageList({ messages, user }) {
  let lastSenderId = null;
  let lastTimestamp = null;
  const [openImage, setOpenImage] = useState(null);
  return (
    <>
      {messages.map((message, idx) => {
        const isOwner = message.sender_id === user?.id;
        const showAvatar =
          idx === 0 ||
          message.sender_id !== messages[idx - 1].sender_id ||
          new Date(message.created_at) - new Date(messages[idx - 1].created_at) > 5 * 60 * 1000;
        lastSenderId = message.sender_id;
        lastTimestamp = message.created_at;
        const fileUrl = message.file_url ? `${API_URL}${message.file_url}` : null;
        return (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              maxWidth: '80%',
              alignSelf: 'flex-start',
              mt: showAvatar ? 2 : 0.5,
              backgroundColor: fileUrl && message.filetype?.startsWith('image/') ? 'transparent' : undefined,
            }}
          >
            {showAvatar && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    fontSize: '0.75rem',
                    bgcolor: isOwner ? 'primary.main' : 'secondary.main',
                  }}
                >
                  {message.sender?.username?.[0]?.toUpperCase() || 'U'}
                </Avatar>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.75rem', fontWeight: 500 }}
                >
                  {message.sender?.username || 'Unknown User'}
                </Typography>
              </Box>
            )}
            <Paper
              elevation={0}
              sx={{
                p: 1,
                backgroundColor: fileUrl && message.filetype?.startsWith('image/')
                  ? 'transparent'
                  : (isOwner ? 'primary.main' : 'background.paper'),
                color: fileUrl && message.filetype?.startsWith('image/')
                  ? 'text.primary'
                  : (isOwner ? 'primary.contrastText' : 'text.primary'),
                borderRadius: 2,
                border: fileUrl && message.filetype?.startsWith('image/') ? 'none' : 1,
                borderColor: isOwner ? 'primary.main' : 'divider',
                maxWidth: '100%',
                boxShadow: fileUrl && message.filetype?.startsWith('image/') ? 'none' : (isOwner ? 2 : 0),
                position: 'relative',
                display: 'inline-block',
                minWidth: 60,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ wordBreak: 'break-word', pr: 3, display: 'inline', whiteSpace: 'pre-line', fontSize: '0.95em', lineHeight: 1.3 }}>
                  {!fileUrl && message.content}
                </Typography>
                {/* Image message with no background and only one timestamp inside the bubble */}
                {fileUrl && message.filetype?.startsWith('image/') ? (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 0,
                      backgroundColor: 'transparent',
                      borderRadius: 3,
                      boxShadow: 'none',
                      overflow: 'hidden',
                      maxWidth: 360,
                      minWidth: 120,
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <img
                      src={fileUrl}
                      alt={message.filename || ''}
                      style={{
                        width: '100%',
                        display: 'block',
                        borderRadius: 0,
                        margin: 0,
                      }}
                      onClick={() => setOpenImage(fileUrl)}
                    />
                  </Paper>
                ) : null}
                {fileUrl && message.filetype?.startsWith('video/') && (
                  <video controls src={fileUrl} style={{ maxWidth: 160, borderRadius: 6, marginTop: 6 }} />
                )}
                {fileUrl && !message.filetype?.startsWith('image/') && !message.filetype?.startsWith('video/') && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <CloudDownloadIcon sx={{ mr: 1 }} />
                    <a href={fileUrl} download style={{ color: 'inherit', textDecoration: 'underline' }}>
                      Download file
                    </a>
                  </Box>
                )}
                {/* Only show timestamp and checkmark for non-image messages */}
                {!fileUrl || !message.filetype?.startsWith('image/') ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5, minWidth: 28 }}>
                    <Typography
                      variant="caption"
                      color={isOwner ? 'rgba(255,255,255,0.85)' : 'text.secondary'}
                      sx={{ fontSize: '0.8em', ml: 0.5, lineHeight: 1, p: 0, minWidth: 32 }}
                    >
                      {formatMessageTime(message) || '--:--'}
                    </Typography>
                    {isOwner && (
                      <CheckIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', ml: 0.3 }} />
                    )}
                  </Box>
                ) : null}
              </Box>
            </Paper>
          </Box>
        );
      })}
      <Dialog open={!!openImage} onClose={() => setOpenImage(null)} maxWidth="md">
        <DialogContent sx={{ p: 0, background: 'black' }}>
          <IconButton
            aria-label="close"
            onClick={() => setOpenImage(null)}
            sx={{ position: 'absolute', top: 8, right: 8, color: 'white', zIndex: 2 }}
          >
            <CloseIcon />
          </IconButton>
          {openImage && (
            <img src={openImage} alt="Preview" style={{ maxWidth: '90vw', maxHeight: '80vh', display: 'block', margin: '0 auto' }} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
});

function Chat() {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newChatDialog, setNewChatDialog] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [newChatIsGroup, setNewChatIsGroup] = useState(false);
  const [userSearchDialog, setUserSearchDialog] = useState(false);
  const [directMessageDialog, setDirectMessageDialog] = useState(false);
  const [newChatMenuAnchor, setNewChatMenuAnchor] = useState(null);
  const [chatMenuAnchor, setChatMenuAnchor] = useState(null);
  const [selectedChatForMenu, setSelectedChatForMenu] = useState(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 600);
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const { t } = useTranslation();
  const [openImage, setOpenImage] = useState(null);

  useEffect(() => {
    console.log('Chat mounted');
    fetchChats();
    return () => console.log('Chat unmounted');
  }, []);

  useEffect(() => {
    if (selectedChat) {
      console.log('Selected chat changed:', selectedChat);
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat]);

  useEffect(() => {
    console.log('WebSocket useEffect');
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (!user?.id) return;
    let closed = false;
    const wsUrl = `${WS_URL}/${user.id}`;
    const websocket = new WebSocket(wsUrl);
    console.log('WebSocket instance created');

    websocket.onopen = () => {
      if (closed) return;
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
    };
    websocket.onclose = () => {
      if (closed) return;
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setTimeout(() => { setWs(null); }, 5000);
    };
    websocket.onerror = (error) => {
      if (closed) return;
      console.error('WebSocket error:', error);
      setError('Failed to connect to chat server');
    };
    websocket.onmessage = (event) => {
      if (closed) return;
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);
      switch (data.type) {
        case 'message': handleNewMessage(data.message); break;
        case 'chat_update': handleChatUpdate(data.update_type, data.chat); break;
        case 'chats_update': handleChatsUpdate(data.chat); break;
        case 'error': console.error('WebSocket error:', data.message); setError(data.message); break;
        default: console.log('Unknown message type:', data.type);
      }
    };
    console.log('setWs called');
    setWs(websocket);
    return () => {
      closed = true;
      websocket.close();
    };
  }, [user.id, navigate]);

  useEffect(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    chats.forEach(chat => {
      ws.send(JSON.stringify({ type: 'join_chat', chat_id: chat.id }));
    });
    if (selectedChat) {
      ws.send(JSON.stringify({ type: 'join_chat', chat_id: selectedChat.id }));
    }
  }, [ws, chats, selectedChat]);

  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  const fetchChats = async () => {
    try {
      console.log('Fetching chats...');
      const response = await axios.get(`${API_URL}/chats/`);
      console.log('Chats response:', response.data);
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const handleChatSelect = (chat) => {
    console.log('Selecting chat:', chat.id);
    setSelectedChat(chat);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const createNewChat = async () => {
    try {
      const response = await axios.post(`${API_URL}/chats/`, {
        name: newChatName,
        is_group: newChatIsGroup,
        participant_ids: [user.id],
      });
      console.log('New chat created:', response.data);
      setChats([...chats, response.data]);
      setNewChatDialog(false);
      setNewChatName('');
      setNewChatIsGroup(false);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const addUserToChat = async (selectedUser) => {
    try {
      const response = await axios.post(
        `${API_URL}/chats/${selectedChat.id}/participants/?user_id=${selectedUser.id}`
      );
      console.log('User added to chat:', response.data);
      setSelectedChat(response.data);
      setChats(chats.map(chat => 
        chat.id === response.data.id ? response.data : chat
      ));
      setUserSearchDialog(false);
    } catch (error) {
      console.error('Error adding user to chat:', error);
      throw error;
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      console.log('Fetching messages for chat:', chatId);
      const response = await axios.get(`${API_URL}/chats/${chatId}/messages/`);
      console.log('Messages response:', response.data);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleInputChange = useCallback((e) => setNewMessage(e.target.value), []);
  const handleSendMessage = useCallback((e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'message',
          content: newMessage,
          chat_id: selectedChat.id
        }));
        setNewMessage('');
        scrollToBottom();
      } else {
        console.error('WebSocket is not connected');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [ws, newMessage, selectedChat]);

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].sender_id === user?.id) {
      scrollToBottom();
    }
  }, [messages, user]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 64;
      setShowScrollToBottom(!atBottom);
    };
    container.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages]);

  const handleNewChatClick = (event) => {
    setNewChatMenuAnchor(event.currentTarget);
  };

  const handleNewChatMenuClose = () => {
    setNewChatMenuAnchor(null);
  };

  const handleDirectMessage = () => {
    handleNewChatMenuClose();
    setDirectMessageDialog(true);
  };

  const handleGroupChat = () => {
    handleNewChatMenuClose();
    setNewChatDialog(true);
  };

  const handleDirectChatSelect = (chat) => {
    console.log('Direct chat selected:', chat);
    setDirectMessageDialog(false);
    setChats(prevChats => {
      const existingChat = prevChats.find(c => c.id === chat.id);
      if (existingChat) {
        return prevChats.map(c => c.id === chat.id ? chat : c);
      }
      return [...prevChats, chat];
    });
    setSelectedChat(chat);
  };

  const handleChatMenuOpen = (event, chat) => {
    event.stopPropagation();
    console.log('Opening chat menu for chat:', chat.id);
    setSelectedChatForMenu(chat);
    setChatMenuAnchor(event.currentTarget);
  };

  const handleChatMenuClose = () => {
    console.log('Closing chat menu');
    setChatMenuAnchor(null);
    setSelectedChatForMenu(null);
  };

  const handleDeleteChat = async (chatId) => {
    if (!chatId) {
        console.error('No chat ID provided for deletion');
        return;
    }

    try {
        console.log('Deleting chat:', chatId);
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/chats/${chatId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to delete chat');
        }

        console.log('Chat deleted successfully');
        handleChatMenuClose();
        setDeleteConfirmDialog(false);
    } catch (error) {
        console.error('Error deleting chat:', error);
        setError(error.message);
    }
  };

  const handleSidebarToggle = () => {
    console.log('Toggling sidebar, current state:', isSidebarOpen);
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    console.log('Closing sidebar');
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
  };

  const handleChatUpdate = (updateType, chatData) => {
    console.log('Handling chat update:', updateType, chatData);
    setChats(prevChats => {
      switch (updateType) {
        case 'message_update':
          const updatedChats = prevChats.filter(chat => chat.id !== chatData.id);
          return [{ ...chatData, last_message: chatData.last_message }, ...updatedChats];
        case 'participant_update':
          return prevChats.map(chat => 
            chat.id === chatData.id ? { ...chat, participants: chatData.participants } : chat
          );
        default:
          return prevChats;
      }
    });

    if (selectedChat && selectedChat.id === chatData.id) {
      setSelectedChat(chatData);
    }
  };

  const handleChatsUpdate = (data) => {
    console.log('Handling chats update:', data);
    setChats(prevChats => {
        if (data.deleted) {
            console.log('Removing deleted chat:', data.id);
            if (selectedChat && selectedChat.id === data.id) {
                setSelectedChat(null);
                setMessages([]);
            }
            return prevChats.filter(chat => chat.id !== data.id);
        }
        
        const chatIndex = prevChats.findIndex(chat => chat.id === data.id);
        if (chatIndex === -1) {
            console.log('Adding new chat:', data);
            return [data, ...prevChats];
        }
        
        console.log('Updating existing chat:', data);
        const newChats = [...prevChats];
        newChats[chatIndex] = data;
        return newChats;
    });
  };

  const handleNewMessage = (message) => {
    console.log('Received new message:', message, 'Current selectedChat:', selectedChat);
    setMessages(prevMessages => {
      // Avoid duplicates
      if (prevMessages.some(msg => msg.id === message.id)) {
        return prevMessages;
      }
      return [...prevMessages, message];
    });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedChat) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/chats/${selectedChat.id}/messages/upload`,
        formData,
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );
      // Add the new message to the state immediately
      setMessages(prev => [
        ...prev,
        {
          ...response.data,
          sender: user, // or whatever your sender object is
        }
      ]);
      scrollToBottom && scrollToBottom();
    } catch (err) {
      console.error('File upload failed:', err);
    }
  };

  const sidebar = (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'background.paper',
      borderRight: 1,
      borderColor: 'divider',
    }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper', position: 'sticky', top: 0, zIndex: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder={t('Search')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            sx: { borderRadius: 3, backgroundColor: 'background.default' },
          }}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewChatClick}
          fullWidth
          sx={{ borderRadius: 2, textTransform: 'none', py: 1, boxShadow: 1 }}
        >
          {t('New Chat')}
        </Button>
        <Menu
          anchorEl={newChatMenuAnchor}
          open={Boolean(newChatMenuAnchor)}
          onClose={handleNewChatMenuClose}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: 2,
              boxShadow: 3,
            },
          }}
        >
          <MenuItem onClick={handleDirectMessage} sx={{ py: 1.5 }}>
            <MessageIcon sx={{ mr: 1.5, color: 'primary.main' }} />
            <Box>
              <Typography variant="body1">{t('Direct Message')}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t('Start a private conversation')}
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem onClick={handleGroupChat} sx={{ py: 1.5 }}>
            <PersonAddIcon sx={{ mr: 1.5, color: 'primary.main' }} />
            <Box>
              <Typography variant="body1">{t('Group Chat')}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t('Create a group conversation')}
              </Typography>
            </Box>
          </MenuItem>
        </Menu>
      </Box>

      {isMobile && (
        <Box sx={{ position: 'fixed', bottom: 88, right: 24, zIndex: 2000 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleNewChatClick}
            sx={{ borderRadius: '50%', minWidth: 56, minHeight: 56, p: 0, boxShadow: 3 }}
          >
            <AddIcon fontSize="large" />
          </Button>
        </Box>
      )}

      <List sx={{ 
        flexGrow: 1,
        overflow: 'auto',
        p: 0,
        '& .MuiListItem-root': {
          transition: 'all 0.2s',
        },
      }}>
        {chats.map((chat) => (
          <ListItem
            button
            key={chat.id}
            selected={selectedChat?.id === chat.id}
            onClick={() => handleChatSelect(chat)}
            sx={{
              py: 1.5,
              px: 2,
              borderBottom: 1,
              borderColor: 'divider',
              minHeight: isMobile ? 64 : 72,
              alignItems: 'flex-start',
              '&.Mui-selected': {
                backgroundColor: 'action.selected',
                '&:hover': { backgroundColor: 'action.selected' },
              },
              '&:hover': { backgroundColor: 'action.hover' },
            }}
          >
            <ListItemAvatar>
              <Badge
                color="primary"
                badgeContent={chat.unread_count || 0}
                invisible={!chat.unread_count}
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              >
                <Avatar sx={{ bgcolor: chat.is_group ? 'primary.main' : 'secondary.main', width: 48, height: 48 }}>
                  {chat.name[0]}
                </Avatar>
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography noWrap fontWeight={selectedChat?.id === chat.id ? 'bold' : 'normal'} fontSize="1rem">
                    {chat.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    {chat.last_message_time ? format(new Date(chat.last_message_time), 'HH:mm') : ''}
                  </Typography>
                </Box>
              }
              secondary={
                <Typography noWrap variant="body2" color="text.secondary">
                  {chat.last_message || t('No messages yet')}
                </Typography>
              }
              primaryTypographyProps={{ noWrap: true }}
              secondaryTypographyProps={{ noWrap: true }}
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="chat options"
                onClick={(e) => handleChatMenuOpen(e, chat)}
                size="large"
                sx={{
                  opacity: 0.7,
                  '&:hover': {
                    opacity: 1,
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
        {chats.length === 0 && (
          <Box sx={{ 
            p: 3, 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}>
            <MessageIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5 }} />
            <Typography color="text.secondary" variant="body2">
              {t('No chats yet. Start a new conversation!')}
            </Typography>
          </Box>
        )}
      </List>
    </Box>
  );

  const mainContent = (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      backgroundColor: 'background.default',
    }}>
      <AppBar 
        position={isMobile ? 'fixed' : 'static'} 
        color="default" 
        elevation={0}
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider', 
          backgroundColor: 'background.paper',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: 1202,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1, sm: 2 } }}>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleSidebarToggle}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Avatar sx={{ mr: 2, width: 40, height: 40, bgcolor: selectedChat?.is_group ? 'primary.main' : 'secondary.main' }}>
            {selectedChat?.name?.[0]}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight={500} noWrap>{selectedChat ? selectedChat.name : t('Select a chat')}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {selectedChat?.is_group ? t('Group Chat') : t('Direct Message')}
            </Typography>
          </Box>
          <Tooltip title={t('Pinned message')}><IconButton color="inherit"><PushPinIcon /></IconButton></Tooltip>
          <Tooltip title={t('Search')}><IconButton color="inherit"><SearchIcon /></IconButton></Tooltip>
          <Settings title={t('Settings')} />
          <IconButton 
            color="inherit" 
            onClick={handleLogout}
            sx={{ 
              ml: 0.5,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {selectedChat?.pinned_message && (
        <Alert icon={<PushPinIcon />} severity="info" sx={{ borderRadius: 2, m: 2, mb: 0 }}>
          {selectedChat.pinned_message}
        </Alert>
      )}

      {selectedChat ? (
        <>
          <Box 
            sx={{ 
              flexGrow: 1, 
              overflow: 'auto', 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1, 
              position: 'relative',
              pt: isMobile ? 7 : 0,
            }} 
            ref={messagesContainerRef}
          >
            {messages.length === 0 ? (
              <Box sx={{ 
                flexGrow: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2,
                color: 'text.secondary',
              }}>
                <MessageIcon sx={{ fontSize: 48, opacity: 0.5 }} />
                <Typography variant="body1" align="center">
                  {t('No messages yet. Start the conversation!')}
                </Typography>
              </Box>
            ) : (
              <MessageList messages={messages} user={user} />
            )}
            <div ref={messagesEndRef} />
            {showScrollToBottom && selectedChat && (!isMobile || !isSidebarOpen) && (
              <Fab
                color="primary"
                size="medium"
                onClick={scrollToBottom}
                sx={{
                  position: 'absolute',
                  bottom: { xs: 64, sm: 24 },
                  right: { xs: 16, sm: 32 },
                  zIndex: 1201,
                  boxShadow: 3,
                  marginBottom: 0,
                  pointerEvents: 'auto',
                }}
                aria-label={t('Scroll to bottom')}
              >
                <KeyboardArrowDownIcon />
              </Fab>
            )}
          </Box>

          <Box sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            position: isMobile ? 'fixed' : 'static',
            bottom: isMobile ? 0 : undefined,
            left: 0,
            width: isMobile ? '100vw' : 'auto',
            zIndex: isMobile ? 1200 : undefined,
          }}>
            <MessageInput
              value={newMessage}
              onChange={handleInputChange}
              onSend={handleSendMessage}
              disabled={!ws || ws.readyState !== WebSocket.OPEN}
              onFileSelect={handleFileSelect}
            />
          </Box>
        </>
      ) : (
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
          p: 3,
          color: 'text.secondary',
        }}>
          <MessageIcon sx={{ fontSize: 64, opacity: 0.5 }} />
          <Typography variant="h6" align="center">
            {t('Select a chat to start messaging')}
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary">
            {t('Choose an existing conversation or start a new one')}
          </Typography>
        </Box>
      )}

      <Dialog open={newChatDialog} onClose={() => setNewChatDialog(false)} fullScreen={isMobile}>
        <DialogTitle>{t('Create New Chat')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('Chat Name')}
            fullWidth
            value={newChatName}
            onChange={(e) => setNewChatName(e.target.value)}
          />
          <Box sx={{ mt: 2 }}>
            <Button
              variant={newChatIsGroup ? "contained" : "outlined"}
              onClick={() => setNewChatIsGroup(!newChatIsGroup)}
              fullWidth
            >
              {newChatIsGroup ? t('Group Chat') : t('Private Chat')}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewChatDialog(false)}>{t('Cancel')}</Button>
          <Button onClick={createNewChat} variant="contained">
            {t('Create')}
          </Button>
        </DialogActions>
      </Dialog>

      <UserSearch
        open={userSearchDialog}
        onClose={() => setUserSearchDialog(false)}
        onUserSelect={addUserToChat}
        currentChat={selectedChat}
        fullScreen={isMobile}
      />

      <DirectMessage
        open={directMessageDialog}
        onClose={() => setDirectMessageDialog(false)}
        onChatSelect={handleDirectChatSelect}
        fullScreen={isMobile}
      />

      <Menu
        anchorEl={chatMenuAnchor}
        open={Boolean(chatMenuAnchor)}
        onClose={handleChatMenuClose}
      >
        <MenuItem
          onClick={() => {
            handleChatMenuClose();
            setDeleteConfirmDialog(true);
            setSelectedChatForMenu(selectedChat);
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          {t('Delete Chat')}
        </MenuItem>
      </Menu>

      <Dialog
        open={deleteConfirmDialog}
        onClose={() => setDeleteConfirmDialog(false)}
      >
        <DialogTitle>{t('Delete Chat')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('Are you sure you want to delete this chat? This action cannot be undone.')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialog(false)}>{t('Cancel')}</Button>
          <Button
            onClick={() => {
                if (selectedChatForMenu?.id) {
                    console.log('selectedChatForMenu', selectedChatForMenu);
                    handleDeleteChat(selectedChatForMenu.id);
                    console.log('Chat deleted');
                } else {
                    console.log('selectedChatForMenu', selectedChatForMenu);
                    setError(t('No chat selected for deletion'));
                    console.log('No chat selected for deletion');
                    setDeleteConfirmDialog(false);
                }
            }}
            color="error"
            variant="contained"
          >
            {t('Delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  return (
    <ResponsiveLayout
      sidebar={sidebar}
      mainContent={mainContent}
      isSidebarOpen={isSidebarOpen}
      onSidebarToggle={handleSidebarToggle}
      onSidebarClose={handleSidebarClose}
    >
      <DirectMessage
        open={directMessageDialog}
        onClose={() => setDirectMessageDialog(false)}
        onChatSelect={handleDirectChatSelect}
      />
    </ResponsiveLayout>
  );
}

export default Chat; 
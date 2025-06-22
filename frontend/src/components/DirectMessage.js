import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import axios from 'axios';

const DirectMessage = ({ open, onClose, onChatSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Searching users with query:', query);
      const response = await axios.get(`http://localhost:8000/users/search/?query=${query}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Search results:', response.data);
      // Filter out current user from results
      const filteredResults = response.data.filter(user => 
        user.id !== parseInt(localStorage.getItem('user_id'))
      );
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Failed to search users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    if (query.trim().length >= 2) {
      searchUsers(query);
    } else {
      setSearchResults([]);
    }
  };

  const handleUserSelect = async (user) => {
    try {
      setCreatingChat(true);
      setError('');
      console.log('Creating direct chat with user:', user.id);
      
      const response = await axios.post(
        `http://localhost:8000/chats/direct/${user.id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      console.log('Direct chat created:', response.data);
      onChatSelect(response.data);
      handleClose();
    } catch (error) {
      console.error('Error creating direct chat:', error);
      setError(error.response?.data?.detail || 'Failed to create direct chat. Please try again.');
    } finally {
      setCreatingChat(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setError('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ 
        m: 0, 
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        New Direct Message
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        <TextField
          autoFocus
          margin="dense"
          label="Search Users"
          type="text"
          fullWidth
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search by username or email"
          error={!!error}
          helperText={error}
          disabled={creatingChat}
          sx={{ mb: 2 }}
        />
        
        {loading && (
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress size={24} />
          </Box>
        )}

        {creatingChat && (
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              Creating chat...
            </Typography>
          </Box>
        )}

        <List sx={{ mt: 1 }}>
          {searchResults.map((user) => (
            <ListItem
              button
              key={user.id}
              onClick={() => handleUserSelect(user)}
              disabled={creatingChat}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ 
                  bgcolor: 'primary.main',
                  width: 40,
                  height: 40,
                }}>
                  {user.username[0].toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={user.username}
                secondary={user.email}
                primaryTypographyProps={{
                  fontWeight: 500,
                }}
                secondaryTypographyProps={{
                  variant: 'body2',
                }}
              />
            </ListItem>
          ))}
        </List>

        {!loading && !creatingChat && searchQuery && searchResults.length === 0 && (
          <Box sx={{ 
            mt: 2, 
            textAlign: 'center',
            color: 'text.secondary',
          }}>
            <Typography variant="body2">
              No users found matching "{searchQuery}"
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DirectMessage; 
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
  Button,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';

function UserSearch({ open, onClose, onUserSelect, currentChat }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.get(`http://localhost:8000/users/search/?query=${query}`);
      // Filter out users who are already in the chat
      const filteredResults = response.data.filter(
        user => !currentChat.participants.some(p => p.id === user.id)
      );
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      setError(error.response?.data?.detail || 'Failed to search users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      searchUsers(query);
    } else {
      setSearchResults([]);
    }
  };

  const handleUserSelect = async (user) => {
    try {
      await onUserSelect(user);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to add user to chat');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Users to Chat</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Search Users"
          fullWidth
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search by username or email"
          error={!!error}
          helperText={error}
        />
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List sx={{ mt: 2 }}>
            {searchResults.map((user) => (
              <ListItem
                key={user.id}
                button
                onClick={() => handleUserSelect(user)}
              >
                <ListItemAvatar>
                  <Avatar>{user.username[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={user.username}
                  secondary={user.email}
                />
              </ListItem>
            ))}
            {searchQuery && searchResults.length === 0 && !isLoading && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography color="text.secondary">
                  No users found
                </Typography>
              </Box>
            )}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default UserSearch; 
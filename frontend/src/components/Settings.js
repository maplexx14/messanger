import React, { useState } from 'react';
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Divider,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  DarkMode as DarkModeIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTheme as useThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const initialProfile = user => ({
  username: user?.username || '',
  email: user?.email || '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

export default function Settings() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profile, setProfile] = useState(initialProfile({}));
  const [msg, setMsg] = useState({ error: '', success: '' });
  const { darkMode, toggleTheme } = useThemeContext();
  const { user, updateUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t, i18n } = useTranslation();

  const openProfileDialog = () => {
    setProfile(initialProfile(user));
    setMsg({ error: '', success: '' });
    setProfileDialogOpen(true);
  };

  const closeProfileDialog = () => {
    setProfileDialogOpen(false);
    setMsg({ error: '', success: '' });
  };

  const handleProfileUpdate = async () => {
    setMsg({ error: '', success: '' });
    if (profile.newPassword && (profile.newPassword !== profile.confirmPassword))
      return setMsg({ error: 'New passwords do not match' });
    if (profile.newPassword && !profile.currentPassword)
      return setMsg({ error: 'Current password is required to change password' });
    try {
      const { data } = await axios.put('http://localhost:8000/users/me', {
        username: profile.username,
        email: profile.email,
        current_password: profile.currentPassword,
        new_password: profile.newPassword,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      updateUser(data);
      setMsg({ error: '', success: 'Profile updated successfully' });
      closeProfileDialog();
    } catch (err) {
      setMsg({ error: err.response?.data?.detail || 'Failed to update profile' });
    }
  };

  const handleChange = e => setProfile(p => ({ ...p, [e.target.name]: e.target.value }));

  const ProfileFields = () => (
    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField label="Username" name="username" value={profile.username} onChange={handleChange} fullWidth />
      <TextField label="Email" name="email" type="email" value={profile.email} onChange={handleChange} fullWidth />
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1" gutterBottom>Change Password</Typography>
      <TextField label="Current Password" name="currentPassword" type="password" value={profile.currentPassword} onChange={handleChange} fullWidth />
      <TextField label="New Password" name="newPassword" type="password" value={profile.newPassword} onChange={handleChange} fullWidth />
      <TextField label="Confirm New Password" name="confirmPassword" type="password" value={profile.confirmPassword} onChange={handleChange} fullWidth />
      {msg.error && <Typography color="error" variant="body2">{msg.error}</Typography>}
      {msg.success && <Typography color="success.main" variant="body2">{msg.success}</Typography>}
    </Box>
  );

  return (
    <>
      <IconButton color="inherit" onClick={() => setIsOpen(true)} sx={{ ml: 1 }}>
        <SettingsIcon />
      </IconButton>
      <Drawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={isOpen}
        onClose={() => setIsOpen(false)}
        PaperProps={{
          sx: {
            height: isMobile ? '80vh' : '100%',
            width: isMobile ? '100%' : 320,
            borderRadius: isMobile ? '16px 16px 0 0' : 0,
            position: 'fixed',
            zIndex: t => t.zIndex.drawer + 2,
          },
        }}
        sx={{
          '& .MuiDrawer-root': { position: 'fixed' },
          '& .MuiBackdrop-root': { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
          zIndex: t => t.zIndex.drawer + 1,
        }}
        ModalProps={{ keepMounted: true }}
      >
        <Box sx={{ width: isMobile ? '100%' : 320, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">{t('Settings')}</Typography>
            <IconButton onClick={() => setIsOpen(false)} edge="end"><CloseIcon /></IconButton>
          </Box>
          <List sx={{ flexGrow: 1, p: 0 }}>
            <ListItem button onClick={openProfileDialog}>
              <ListItemIcon><PersonIcon /></ListItemIcon>
              <ListItemText primary={t('Profile Settings')} secondary={t('Update your profile information')} />
            </ListItem>
            <ListItem>
              <ListItemIcon><DarkModeIcon /></ListItemIcon>
              <ListItemText primary={t('Dark Mode')} secondary={t('Toggle dark/light theme')} />
              <Switch edge="end" checked={darkMode} onChange={toggleTheme} />
            </ListItem>
            <ListItem>
              <ListItemIcon><NotificationsIcon /></ListItemIcon>
              <ListItemText primary={t('Notifications')} secondary={t('Enable/disable notifications')} />
              <Switch edge="end" checked onChange={() => {}} />
            </ListItem>
          </List>
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                variant={i18n.language === 'ru' ? 'contained' : 'outlined'}
                onClick={() => i18n.changeLanguage('ru')}
                size="small"
              >
                Русский
              </Button>
              <Button
                variant={i18n.language === 'en' ? 'contained' : 'outlined'}
                onClick={() => i18n.changeLanguage('en')}
                size="small"
              >
                English
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>{t('Logged in as')}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar>{user?.username?.[0]?.toUpperCase() || 'U'}</Avatar>
              <Typography variant="body1">{user?.username}</Typography>
            </Box>
          </Box>
        </Box>
      </Drawer>
      <Dialog open={isProfileDialogOpen} onClose={closeProfileDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: isMobile ? '16px' : '8px' } }}>
        <DialogTitle>{t('Profile Settings')}</DialogTitle>
        <DialogContent><ProfileFields /></DialogContent>
        <DialogActions>
          <Button onClick={closeProfileDialog}>{t('Cancel')}</Button>
          <Button onClick={handleProfileUpdate} variant="contained">{t('Save Changes')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 
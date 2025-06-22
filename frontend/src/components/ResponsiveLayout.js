import React from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

const drawerWidth = 340;
const mobileDrawerWidth = '100vw';

const ResponsiveLayout = ({ 
  sidebar, 
  mainContent,
  isSidebarOpen,
  onSidebarToggle,
  onSidebarClose 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Mobile Menu Button */}
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={onSidebarToggle}
          sx={{
            position: 'fixed',
            left: 16,
            top: 16,
            zIndex: 1300,
            backgroundColor: 'background.paper',
            boxShadow: 2,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Mobile Drawer */}
      {isMobile ? (
        <SwipeableDrawer
          variant="temporary"
          open={isSidebarOpen}
          onClose={onSidebarClose}
          onOpen={onSidebarToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            width: mobileDrawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: mobileDrawerWidth,
              boxSizing: 'border-box',
              position: 'relative',
              height: '100%',
              maxWidth: '100vw',
            },
          }}
        >
          <IconButton
            onClick={onSidebarClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              zIndex: 1,
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          {sidebar}
        </SwipeableDrawer>
      ) : (
        <Drawer
          variant="permanent"
          open={true}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              position: 'relative',
              height: '100%',
            },
          }}
        >
          {sidebar}
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          height: '100%',
          overflow: 'hidden',
          pb: isMobile ? 7 : 0,
        }}
      >
        {mainContent}
      </Box>
    </Box>
  );
};

export default ResponsiveLayout; 
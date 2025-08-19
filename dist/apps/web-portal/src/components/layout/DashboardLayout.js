"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DashboardLayout;
const react_1 = require("react");
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const react_redux_1 = require("react-redux");
const uiSlice_1 = require("@/store/slices/uiSlice");
const authSlice_1 = require("@/store/slices/authSlice");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const DRAWER_WIDTH = 280;
const menuItems = [
    { text: 'Dashboard', icon: <icons_material_1.Dashboard />, href: '/' },
    { text: 'Portfolios', icon: <icons_material_1.AccountBalance />, href: '/portfolios' },
    { text: 'Analytics', icon: <icons_material_1.Analytics />, href: '/analytics' },
    { text: 'Reports', icon: <icons_material_1.Description />, href: '/reports' },
    { text: 'Messages', icon: <icons_material_1.Message />, href: '/messages' },
    { text: 'Settings', icon: <icons_material_1.Settings />, href: '/settings' },
];
function DashboardLayout({ children }) {
    const theme = (0, material_1.useTheme)();
    const isMobile = (0, material_1.useMediaQuery)(theme.breakpoints.down('lg'));
    const dispatch = (0, react_redux_1.useDispatch)();
    const router = (0, navigation_1.useRouter)();
    const { sidebarOpen, breadcrumbs, pageTitle } = (0, react_redux_1.useSelector)((state) => state.ui);
    const { user } = (0, react_redux_1.useSelector)((state) => state.auth);
    const [userMenuAnchor, setUserMenuAnchor] = (0, react_1.useState)(null);
    const handleDrawerToggle = () => {
        dispatch((0, uiSlice_1.toggleSidebar)());
    };
    const handleUserMenuOpen = (event) => {
        setUserMenuAnchor(event.currentTarget);
    };
    const handleUserMenuClose = () => {
        setUserMenuAnchor(null);
    };
    const handleLogout = () => {
        dispatch((0, authSlice_1.logout)());
        handleUserMenuClose();
        router.push('/auth/login');
    };
    const drawer = (<material_1.Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Area */}
      <material_1.Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <material_1.Typography variant="h5" fontWeight="bold" color="primary">
          Investment Platform
        </material_1.Typography>
        <material_1.Typography variant="caption" color="text.secondary">
          Client Portal
        </material_1.Typography>
      </material_1.Box>

      {/* Navigation Menu */}
      <material_1.Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <material_1.List>
          {menuItems.map((item) => (<material_1.ListItem key={item.text} disablePadding>
              <material_1.ListItemButton component={link_1.default} href={item.href} sx={{
                mx: 1,
                my: 0.5,
                borderRadius: 1,
                '&:hover': {
                    backgroundColor: 'action.hover',
                },
            }}>
                <material_1.ListItemIcon sx={{ color: 'text.primary' }}>
                  {item.icon}
                </material_1.ListItemIcon>
                <material_1.ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 500 }}/>
              </material_1.ListItemButton>
            </material_1.ListItem>))}
        </material_1.List>
      </material_1.Box>

      {/* User Info */}
      <material_1.Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <material_1.Box display="flex" alignItems="center" gap={2}>
          <material_1.Avatar sx={{ width: 32, height: 32 }}>
            {user?.name?.charAt(0) || 'U'}
          </material_1.Avatar>
          <material_1.Box sx={{ minWidth: 0 }}>
            <material_1.Typography variant="body2" fontWeight={500} noWrap>
              {user?.name || 'User'}
            </material_1.Typography>
            <material_1.Typography variant="caption" color="text.secondary" noWrap>
              {user?.email || 'user@example.com'}
            </material_1.Typography>
          </material_1.Box>
        </material_1.Box>
      </material_1.Box>
    </material_1.Box>);
    return (<material_1.Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <material_1.AppBar position="fixed" sx={{
            width: { lg: `calc(100% - ${sidebarOpen ? DRAWER_WIDTH : 0}px)` },
            ml: { lg: sidebarOpen ? `${DRAWER_WIDTH}px` : 0 },
            transition: theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
            }),
        }}>
        <material_1.Toolbar>
          <material_1.IconButton color="inherit" onClick={handleDrawerToggle} edge="start" sx={{ mr: 2 }}>
            <icons_material_1.Menu />
          </material_1.IconButton>
          
          <material_1.Box sx={{ flexGrow: 1 }}>
            <material_1.Typography variant="h6" noWrap component="div">
              {pageTitle}
            </material_1.Typography>
            {breadcrumbs.length > 0 && (<material_1.Breadcrumbs aria-label="breadcrumb" separator={<icons_material_1.ChevronRight fontSize="small"/>} sx={{ mt: 0.5 }}>
                {breadcrumbs.map((crumb, index) => (crumb.href ? (<material_1.Link key={index} component={link_1.default} href={crumb.href} color="inherit" underline="hover" fontSize="small">
                      {crumb.label}
                    </material_1.Link>) : (<material_1.Typography key={index} color="text.primary" fontSize="small">
                      {crumb.label}
                    </material_1.Typography>)))}
              </material_1.Breadcrumbs>)}
          </material_1.Box>

          <material_1.IconButton color="inherit" sx={{ mr: 1 }}>
            <icons_material_1.Notifications />
          </material_1.IconButton>

          <material_1.IconButton onClick={handleUserMenuOpen} sx={{ p: 0 }}>
            <material_1.Avatar sx={{ width: 32, height: 32 }}>
              {user?.name?.charAt(0) || 'U'}
            </material_1.Avatar>
          </material_1.IconButton>
        </material_1.Toolbar>
      </material_1.AppBar>

      {/* User Menu */}
      <material_1.Menu anchorEl={userMenuAnchor} open={Boolean(userMenuAnchor)} onClose={handleUserMenuClose} onClick={handleUserMenuClose} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
        <material_1.MenuItem component={link_1.default} href="/profile">
          <material_1.ListItemIcon>
            <icons_material_1.Person fontSize="small"/>
          </material_1.ListItemIcon>
          Profile
        </material_1.MenuItem>
        <material_1.MenuItem component={link_1.default} href="/settings">
          <material_1.ListItemIcon>
            <icons_material_1.Settings fontSize="small"/>
          </material_1.ListItemIcon>
          Settings
        </material_1.MenuItem>
        <material_1.Divider />
        <material_1.MenuItem onClick={handleLogout}>
          <material_1.ListItemIcon>
            <icons_material_1.Logout fontSize="small"/>
          </material_1.ListItemIcon>
          Logout
        </material_1.MenuItem>
      </material_1.Menu>

      {/* Sidebar Drawer */}
      <material_1.Box component="nav" sx={{ width: { lg: sidebarOpen ? DRAWER_WIDTH : 0 }, flexShrink: { lg: 0 } }}>
        {isMobile ? (<material_1.Drawer variant="temporary" open={sidebarOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{
                '& .MuiDrawer-paper': {
                    boxSizing: 'border-box',
                    width: DRAWER_WIDTH,
                },
            }}>
            {drawer}
          </material_1.Drawer>) : (<material_1.Drawer variant="persistent" open={sidebarOpen} sx={{
                '& .MuiDrawer-paper': {
                    boxSizing: 'border-box',
                    width: DRAWER_WIDTH,
                    transition: theme.transitions.create('width', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                },
            }}>
            {drawer}
          </material_1.Drawer>)}
      </material_1.Box>

      {/* Main Content */}
      <material_1.Box component="main" sx={{
            flexGrow: 1,
            width: { lg: `calc(100% - ${sidebarOpen ? DRAWER_WIDTH : 0}px)` },
            transition: theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
            }),
        }}>
        <material_1.Toolbar /> {/* Spacer for fixed app bar */}
        {children}
      </material_1.Box>
    </material_1.Box>);
}

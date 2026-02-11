import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
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
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import TimelineIcon from '@mui/icons-material/Timeline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import BusinessIcon from '@mui/icons-material/Business';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuthStore } from '../store/authStore';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Clientes', icon: <PeopleIcon />, path: '/clientes' },
  { text: 'Productos', icon: <InventoryIcon />, path: '/productos' },
  { text: 'Almacenes', icon: <WarehouseIcon />, path: '/almacenes' },
  { text: 'Inventario', icon: <Inventory2Icon />, path: '/inventario' },
  { text: 'Ingresos', icon: <LocalShippingIcon />, path: '/ingresos' },
  { text: 'Proveedores', icon: <BusinessIcon />, path: '/proveedores' },
  { text: 'Ventas', icon: <ShoppingCartIcon />, path: '/ventas' },
  { text: 'Cuentas por Cobrar', icon: <AccountBalanceIcon />, path: '/cuentas-cobrar' },
  { text: 'Trazabilidad', icon: <TimelineIcon />, path: '/trazabilidad' },
  { text: 'Reportes', icon: <AssessmentIcon />, path: '/reportes' },
  { text: 'Administración', icon: <AdminPanelSettingsIcon />, path: '/administracion' },
];

export default function DashboardLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Toolbar variant="dense" sx={{ minHeight: { xs: 48, md: 48 }, flexShrink: 0 }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontSize: '1.1rem' }}>
          Pharmavel
        </Typography>
      </Toolbar>
      <Divider />
      <List
        dense
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          py: 0,
        }}
      >
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ py: 0 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{ py: 1, px: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List dense disablePadding sx={{ flexShrink: 0 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ py: 1, px: 2 }}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Cerrar Sesión" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box className="pharmavel-layout-root" sx={{ display: 'flex', maxWidth: '100vw', overflowX: 'hidden' }}>
      <AppBar
        position="fixed"
        sx={{
          width: '100%',
          maxWidth: '100vw',
          left: 0,
          right: 0,
          '@media (min-width:900px)': {
            width: `calc(100% - ${drawerWidth}px)`,
            marginLeft: drawerWidth,
          },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find((item) => item.path === location.pathname)?.text || 'Pharmavel'}
          </Typography>
          <Typography variant="body2" sx={{ mr: 2, maxWidth: { xs: 80, sm: 160 }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.nombre} {user?.apellido}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          p: { xs: 1.5, sm: 2, md: 3 },
          boxSizing: 'border-box',
          overflowX: 'hidden',
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

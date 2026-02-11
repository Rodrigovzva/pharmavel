import { useNavigate } from 'react-router-dom';
import { Box, Grid, Card, CardContent, Typography, Alert, AlertTitle } from '@mui/material';
import { formatCurrency } from '../utils/currency';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useQuery } from '@tanstack/react-query';
import { ventasService } from '../services/ventasService';
import { productosService } from '../services/productosService';
import { cuentasCobrarService } from '../services/cuentasCobrarService';

const cardSx = {
  cursor: 'pointer',
  transition: 'box-shadow 0.2s',
  '&:hover': {
    boxShadow: 6,
  },
};

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: ventas = [] } = useQuery({
    queryKey: ['ventas'],
    queryFn: ventasService.getAll,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const { data: productos = [] } = useQuery({
    queryKey: ['productos'],
    queryFn: productosService.getAll,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const { data: cuentasCobrar = [] } = useQuery({
    queryKey: ['cuentas-cobrar'],
    queryFn: cuentasCobrarService.getAll,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const { data: porVencer = [] } = useQuery({
    queryKey: ['cuentas-cobrar', 'por-vencer', 30],
    queryFn: () => cuentasCobrarService.getPorVencer(30),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const ahora = new Date();
  const mesActual = ahora.getMonth();
  const anioActual = ahora.getFullYear();
  const ventasDelMes = ventas.filter(
    (v) => v.fecha && new Date(v.fecha).getMonth() === mesActual && new Date(v.fecha).getFullYear() === anioActual,
  );
  const totalVentasMes = ventasDelMes.reduce((s, v) => s + Number(v.total ?? 0), 0);

  const pendientes = cuentasCobrar.filter((c) => (c.estado || '').toUpperCase() !== 'PAGADO');
  const totalPendiente = pendientes.reduce((s, c) => s + (Number(c.monto_total ?? 0) - Number(c.monto_pagado ?? 0)), 0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {porVencer.length > 0 && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon />}
          sx={{ mt: 2 }}
          onClick={() => navigate('/cuentas-cobrar')}
          style={{ cursor: 'pointer' }}
        >
          <AlertTitle>Cuentas por vencer</AlertTitle>
          {porVencer.length} cuenta(s) por cobrar vencen en los próximos 30 días. Haga clic para ver.
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={cardSx} onClick={() => navigate('/ventas')}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShoppingCartIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Ventas del Mes
                  </Typography>
                  <Typography variant="h5">{ventasDelMes.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(totalVentasMes)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={cardSx} onClick={() => navigate('/productos')}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <InventoryIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Productos
                  </Typography>
                  <Typography variant="h5">{productos.length}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={cardSx} onClick={() => navigate('/cuentas-cobrar')}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalanceIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Cuentas por Cobrar
                  </Typography>
                  <Typography variant="h5">{pendientes.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(totalPendiente)} pendiente
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={cardSx} onClick={() => navigate('/reportes')}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DashboardIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Stock Bajo
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ver reporte
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

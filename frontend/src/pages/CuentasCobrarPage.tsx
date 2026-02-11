import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  AlertTitle,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import PaymentIcon from '@mui/icons-material/Payment';
import PrintIcon from '@mui/icons-material/Print';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { cuentasCobrarService, CuentaCobrar } from '../services/cuentasCobrarService';
import { almacenesService } from '../services/almacenesService';
import ComprobanteCuentaCobrarDialog from '../components/ComprobanteCuentaCobrarDialog';
import { formatCurrency } from '../utils/currency';

export default function CuentasCobrarPage() {
  const queryClient = useQueryClient();
  const [pagoDialog, setPagoDialog] = useState<{ open: boolean; cuenta: CuentaCobrar | null; monto: string }>({
    open: false,
    cuenta: null,
    monto: '',
  });
  const [comprobanteCuentaId, setComprobanteCuentaId] = useState<number | null>(null);

  const [filtroAlmacenId, setFiltroAlmacenId] = useState<string>('todos');

  const { data: cuentas = [], isLoading, error } = useQuery({
    queryKey: ['cuentas-cobrar'],
    queryFn: cuentasCobrarService.getAll,
  });

  const { data: almacenes = [] } = useQuery({
    queryKey: ['almacenes'],
    queryFn: almacenesService.getAll,
  });

  const cuentasFiltradas = useMemo(() => {
    if (filtroAlmacenId === 'todos' || filtroAlmacenId === '') return cuentas;
    const id = Number(filtroAlmacenId);
    if (Number.isNaN(id)) return cuentas;
    return cuentas.filter((c) => {
      const vid = c.venta?.almacen_id != null ? Number(c.venta.almacen_id) : (c.venta?.almacen?.id != null ? Number(c.venta.almacen.id) : null);
      return vid !== null && vid === id;
    });
  }, [cuentas, filtroAlmacenId]);

  // Alertas por vencimiento: se calculan sobre TODAS las cuentas (sin filtro). "Por vencer" = próximos 30 días.
  const DIAS_POR_VENCER = 30;
  const { vencidas, porVencer, pendientes } = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hoyMs = hoy.getTime();
    const limite = new Date(hoy);
    limite.setDate(limite.getDate() + DIAS_POR_VENCER);
    limite.setHours(0, 0, 0, 0);
    const limiteMs = limite.getTime();
    let v = 0;
    let p = 0;
    let pend = 0;
    cuentas.forEach((c) => {
      if ((c.estado || '').toUpperCase() !== 'PENDIENTE') return;
      if (Number(c.monto_total) - Number(c.monto_pagado) <= 0) return;
      pend++;
      const fv = c.fecha_vencimiento != null ? new Date(c.fecha_vencimiento) : new Date(NaN);
      if (Number.isNaN(fv.getTime())) return;
      fv.setHours(0, 0, 0, 0);
      const fMs = fv.getTime();
      if (fMs < hoyMs) v++;
      else if (fMs <= limiteMs) p++;
    });
    return { vencidas: v, porVencer: p, pendientes: pend };
  }, [cuentas]);

  const estadoVencimiento = (c: CuentaCobrar): 'vencida' | 'por-vencer' | null => {
    if ((c.estado || '').toUpperCase() !== 'PENDIENTE') return null;
    if (Number(c.monto_total) - Number(c.monto_pagado) <= 0) return null;
    const fv = c.fecha_vencimiento != null ? new Date(c.fecha_vencimiento) : new Date(NaN);
    if (Number.isNaN(fv.getTime())) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(hoy);
    limite.setDate(limite.getDate() + DIAS_POR_VENCER);
    limite.setHours(0, 0, 0, 0);
    fv.setHours(0, 0, 0, 0);
    if (fv.getTime() < hoy.getTime()) return 'vencida';
    if (fv.getTime() <= limite.getTime()) return 'por-vencer';
    return null;
  };

  const sincronizarMutation = useMutation({
    mutationFn: cuentasCobrarService.sincronizar,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cuentas-cobrar'] });
      if (data.creadas > 0) {
        toast.success(`Se crearon ${data.creadas} cuenta(s) por cobrar desde ventas a crédito.`);
      } else {
        toast.info('No había ventas a crédito pendientes de sincronizar.');
      }
    },
    onError: (err: { response?: { data?: { message?: string } }; message?: string }) => {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Error al sincronizar.';
      toast.error(msg);
    },
  });

  const registrarPagoMutation = useMutation({
    mutationFn: ({ id, monto }: { id: number; monto: number }) => cuentasCobrarService.registrarPago(id, monto),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['cuentas-cobrar'] });
      toast.success('Pago registrado correctamente.');
      setPagoDialog({ open: false, cuenta: null, monto: '' });
    },
    onError: (err: { response?: { data?: { message?: string } }; message?: string }) => {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Error al registrar el pago.');
    },
  });

  const saldo = (c: { monto_total: number; monto_pagado: number }) =>
    Number(c.monto_total) - Number(c.monto_pagado);

  const openPagoDialog = (cuenta: CuentaCobrar) => {
    const saldoPend = saldo(cuenta);
    setPagoDialog({
      open: true,
      cuenta,
      monto: saldoPend > 0 ? String(saldoPend) : '',
    });
  };

  const closePagoDialog = () => setPagoDialog({ open: false, cuenta: null, monto: '' });

  const submitPago = () => {
    if (!pagoDialog.cuenta) return;
    const monto = parseFloat(pagoDialog.monto.replace(',', '.'));
    if (isNaN(monto) || monto <= 0) {
      toast.error('Ingrese un monto válido.');
      return;
    }
    registrarPagoMutation.mutate({ id: pagoDialog.cuenta.id, monto });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Typography variant="h4">
          Cuentas por Cobrar
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Por almacén</InputLabel>
            <Select
              label="Por almacén"
              value={filtroAlmacenId}
              onChange={(e) => setFiltroAlmacenId(String(e.target.value))}
            >
              <MenuItem value="todos">Todos los almacenes</MenuItem>
              {almacenes.map((a: { id: number; nombre: string }) => (
                <MenuItem key={a.id} value={String(a.id)}>
                  {a.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<SyncIcon />}
            onClick={() => sincronizarMutation.mutate()}
            disabled={sincronizarMutation.isPending}
          >
            {sincronizarMutation.isPending ? 'Sincronizando…' : 'Sincronizar desde ventas'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          No se pudieron cargar las cuentas. Intente de nuevo.
        </Alert>
      )}

      {vencidas > 0 && (
        <Alert severity="error" icon={<ErrorOutlineIcon />} sx={{ mt: 2 }}>
          <AlertTitle>Cuentas vencidas</AlertTitle>
          <strong>{vencidas}</strong> cuenta(s) por cobrar vencida(s). Regularice los pagos.
        </Alert>
      )}
      {porVencer > 0 && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mt: 2 }}>
          <AlertTitle>Cuentas por vencer</AlertTitle>
          <strong>{porVencer}</strong> cuenta(s) por cobrar vencen en los próximos {DIAS_POR_VENCER} días.
        </Alert>
      )}
      {pendientes > 0 && vencidas === 0 && porVencer === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <AlertTitle>Cuentas pendientes</AlertTitle>
          Tiene <strong>{pendientes}</strong> cuenta(s) por cobrar pendiente(s).
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ mt: 3, overflowX: 'auto', '& .MuiTableCell-root': { py: 0.5 } }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Número Documento</TableCell>
              <TableCell>Almacén</TableCell>
              <TableCell align="right">Monto Total</TableCell>
              <TableCell align="right">Monto Pagado</TableCell>
              <TableCell align="right">Saldo</TableCell>
              <TableCell>Fecha Vencimiento</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : cuentasFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                  {cuentas.length === 0
                    ? 'No hay cuentas por cobrar. Se generan al registrar ventas a crédito.'
                    : 'No hay cuentas por cobrar para el almacén seleccionado.'}
                </TableCell>
              </TableRow>
            ) : (
              cuentasFiltradas.map((cuenta) => {
                const ven = estadoVencimiento(cuenta);
                const rowSx =
                  ven === 'vencida'
                    ? { bgcolor: 'rgba(211, 47, 47, 0.08)' }
                    : ven === 'por-vencer'
                      ? { bgcolor: 'rgba(237, 108, 2, 0.08)' }
                      : undefined;
                return (
                <TableRow key={cuenta.id} sx={rowSx}>
                  <TableCell>{cuenta.cliente?.nombre ?? '-'}</TableCell>
                  <TableCell>{cuenta.numero_documento}</TableCell>
                  <TableCell>{cuenta.venta?.almacen?.nombre ?? '-'}</TableCell>
                  <TableCell align="right">{formatCurrency(Number(cuenta.monto_total))}</TableCell>
                  <TableCell align="right">{formatCurrency(Number(cuenta.monto_pagado))}</TableCell>
                  <TableCell align="right">{formatCurrency(saldo(cuenta))}</TableCell>
                  <TableCell>{cuenta.fecha_vencimiento ? new Date(cuenta.fecha_vencimiento).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={cuenta.estado}
                      color={cuenta.estado === 'PAGADO' ? 'success' : ven === 'vencida' ? 'error' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PrintIcon />}
                        onClick={() => setComprobanteCuentaId(cuenta.id)}
                      >
                        Comprobante
                      </Button>
                      {cuenta.estado === 'PENDIENTE' && saldo(cuenta) > 0 ? (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<PaymentIcon />}
                          onClick={() => openPagoDialog(cuenta)}
                        >
                          Registrar pago
                        </Button>
                      ) : null}
                    </Box>
                  </TableCell>
                </TableRow>
              );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ComprobanteCuentaCobrarDialog
        open={comprobanteCuentaId != null}
        onClose={() => setComprobanteCuentaId(null)}
        cuentaId={comprobanteCuentaId}
      />
      <Dialog open={pagoDialog.open} onClose={closePagoDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Registrar pago</DialogTitle>
        <DialogContent>
          {pagoDialog.cuenta && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Cliente: {pagoDialog.cuenta.cliente?.nombre ?? '-'} · Doc: {pagoDialog.cuenta.numero_documento}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Saldo pendiente: {formatCurrency(saldo(pagoDialog.cuenta))}
              </Typography>
              <TextField
                autoFocus
                fullWidth
                label="Monto a registrar (Bs.)"
                type="number"
                value={pagoDialog.monto}
                onChange={(e) => setPagoDialog((prev) => ({ ...prev, monto: e.target.value }))}
                inputProps={{ min: 0, step: 0.01 }}
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closePagoDialog}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={submitPago}
            disabled={registrarPagoMutation.isPending || !pagoDialog.monto}
          >
            {registrarPagoMutation.isPending ? 'Guardando…' : 'Registrar pago'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

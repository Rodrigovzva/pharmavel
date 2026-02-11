import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { useQuery } from '@tanstack/react-query';
import { cuentasCobrarService, CuentaCobrar } from '../services/cuentasCobrarService';
import { formatCurrency } from '../utils/currency';
import { printComprobanteCuentaCobrar } from '../utils/comprobantePrint';

interface ComprobanteCuentaCobrarDialogProps {
  open: boolean;
  onClose: () => void;
  cuentaId: number | null;
}

export default function ComprobanteCuentaCobrarDialog({
  open,
  onClose,
  cuentaId,
}: ComprobanteCuentaCobrarDialogProps) {
  const { data: cuenta, isLoading } = useQuery({
    queryKey: ['cuenta-cobrar', cuentaId],
    queryFn: () => cuentasCobrarService.getById(cuentaId!),
    enabled: open && cuentaId != null,
  });

  const handlePrint = () => {
    if (cuenta) printComprobanteCuentaCobrar(cuenta);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="no-print">Comprobante de cuenta por cobrar</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : cuenta ? (
          <Box className="comprobante-print" sx={{ pt: 1 }}>
            <ComprobanteContent cuenta={cuenta} />
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions className="no-print">
        <Button onClick={onClose}>Cerrar</Button>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint} disabled={!cuenta}>
          Imprimir
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ComprobanteContent({ cuenta }: { cuenta: CuentaCobrar }) {
  const saldo = Number(cuenta.monto_total) - Number(cuenta.monto_pagado);
  return (
    <Box sx={{ fontFamily: 'inherit' }}>
      <Typography variant="h6" gutterBottom>
        COMPROBANTE DE CUENTA POR COBRAR
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2"><strong>Nº documento:</strong> {cuenta.numero_documento}</Typography>
        <Typography variant="body2"><strong>Cliente:</strong> {cuenta.cliente?.nombre ?? '-'}</Typography>
        <Typography variant="body2"><strong>Fecha emisión:</strong> {cuenta.fecha_emision ? new Date(cuenta.fecha_emision).toLocaleDateString() : '-'}</Typography>
        <Typography variant="body2"><strong>Fecha vencimiento:</strong> {cuenta.fecha_vencimiento ? new Date(cuenta.fecha_vencimiento).toLocaleDateString() : '-'}</Typography>
        <Typography variant="body2"><strong>Estado:</strong> {cuenta.estado}</Typography>
        {cuenta.venta?.almacen?.nombre ? (
          <Typography variant="body2"><strong>Almacén (venta):</strong> {cuenta.venta.almacen.nombre}</Typography>
        ) : null}
      </Box>
      <Box sx={{ border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
        <Typography variant="body2">Monto total: {formatCurrency(Number(cuenta.monto_total))}</Typography>
        <Typography variant="body2">Monto pagado: {formatCurrency(Number(cuenta.monto_pagado))}</Typography>
        <Typography variant="subtitle1"><strong>Saldo pendiente: {formatCurrency(saldo)}</strong></Typography>
      </Box>
      {cuenta.fecha_pago ? (
        <Typography variant="body2" sx={{ mt: 2 }}>
          Fecha de pago: {new Date(cuenta.fecha_pago).toLocaleDateString()}
        </Typography>
      ) : null}
      {cuenta.observaciones ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Observaciones: {cuenta.observaciones}
        </Typography>
      ) : null}
    </Box>
  );
}

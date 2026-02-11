import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { useQuery } from '@tanstack/react-query';
import { ventasService, Venta } from '../services/ventasService';
import { formatCurrency } from '../utils/currency';
import { printComprobanteVenta, montoEnLiteral } from '../utils/comprobantePrint';

interface ComprobanteVentaDialogProps {
  open: boolean;
  onClose: () => void;
  ventaId: number | null;
}

export default function ComprobanteVentaDialog({
  open,
  onClose,
  ventaId,
}: ComprobanteVentaDialogProps) {
  const { data: venta, isLoading } = useQuery({
    queryKey: ['venta', ventaId],
    queryFn: () => ventasService.getById(ventaId!),
    enabled: open && ventaId != null,
  });

  const handlePrint = () => {
    if (venta) printComprobanteVenta(venta);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="no-print">Comprobante de venta</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : venta ? (
          <Box className="comprobante-print" sx={{ pt: 1 }}>
            <ComprobanteContent venta={venta} />
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions className="no-print">
        <Button onClick={onClose}>Cerrar</Button>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint} disabled={!venta}>
          Imprimir
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ComprobanteContent({ venta }: { venta: Venta }) {
  const fechaStr = venta.fecha ? new Date(venta.fecha).toLocaleDateString('es') : '-';
  const horaStr = venta.created_at ? new Date(venta.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-';
  const formaPago = venta.tipo_pago === 'CREDITO' ? 'Crédito' : 'Contado';
  return (
    <Box sx={{ fontFamily: 'inherit', fontSize: '0.875rem' }}>
      <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', borderBottom: '2px solid #000', pb: 1 }}>
        COMPROBANTE DE VENTA
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2"><strong>ID:</strong> {venta.id}</Typography>
        <Typography variant="body2"><strong>Nombre del cliente:</strong> {venta.cliente?.nombre ?? venta.cliente?.razon_social ?? '-'}</Typography>
        <Typography variant="body2"><strong>NIT:</strong> {venta.cliente?.nit ?? '-'}</Typography>
        <Typography variant="body2"><strong>Fecha:</strong> {fechaStr}</Typography>
        <Typography variant="body2"><strong>Hora:</strong> {horaStr}</Typography>
        <Typography variant="body2"><strong>Dirección:</strong> {venta.cliente?.direccion ?? '-'}</Typography>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Descripción del producto</TableCell>
            <TableCell>Código</TableCell>
            <TableCell align="right">Cantidad</TableCell>
            <TableCell>Unidad</TableCell>
            <TableCell align="right">Precio</TableCell>
            <TableCell align="right">Descuento</TableCell>
            <TableCell align="right">Importe</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(venta.detalles ?? []).map((d) => (
            <TableRow key={d.id}>
              <TableCell>{(d.producto?.descripcion || d.producto?.nombre) ?? d.producto_id}</TableCell>
              <TableCell>{d.producto?.codigo ?? '-'}</TableCell>
              <TableCell align="right">{d.cantidad}</TableCell>
              <TableCell>{d.producto?.unidad_medida ?? 'UNIDAD'}</TableCell>
              <TableCell align="right">{formatCurrency(Number(d.precio_unitario))}</TableCell>
              <TableCell align="right">{formatCurrency(Number(d.descuento ?? 0))}</TableCell>
              <TableCell align="right">{formatCurrency(Number(d.subtotal ?? 0))}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2"><strong>Forma de pago:</strong> {formaPago}</Typography>
        <Typography variant="subtitle1"><strong>Total de la venta:</strong> {formatCurrency(Number(venta.total ?? 0))}</Typography>
        <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
          <strong>Monto en literal:</strong> {montoEnLiteral(Number(venta.total ?? 0))}
        </Typography>
      </Box>
      {venta.observaciones ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Observaciones: {venta.observaciones}
        </Typography>
      ) : null}
      <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 4, pt: 4, borderTop: '1px solid #ccc' }}>
        <Box sx={{ textAlign: 'center', width: 160, borderTop: '1px solid #000', pt: 1, fontSize: '0.75rem' }}>Entregado por</Box>
        <Box sx={{ textAlign: 'center', width: 160, borderTop: '1px solid #000', pt: 1, fontSize: '0.75rem' }}>Recibido por</Box>
      </Box>
    </Box>
  );
}

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
import { ingresosService, Ingreso } from '../services/ingresosService';
import { formatCurrency } from '../utils/currency';
import { printComprobanteIngreso } from '../utils/comprobantePrint';

interface ComprobanteIngresoDialogProps {
  open: boolean;
  onClose: () => void;
  ingresoId: number | null;
}

export default function ComprobanteIngresoDialog({
  open,
  onClose,
  ingresoId,
}: ComprobanteIngresoDialogProps) {
  const { data: ingreso, isLoading } = useQuery({
    queryKey: ['ingreso', ingresoId],
    queryFn: () => ingresosService.getById(ingresoId!),
    enabled: open && ingresoId != null,
  });

  const handlePrint = () => {
    if (ingreso) printComprobanteIngreso(ingreso);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="no-print">Comprobante de ingreso</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : ingreso ? (
          <Box className="comprobante-print" sx={{ pt: 1 }}>
            <ComprobanteContent ingreso={ingreso} />
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions className="no-print">
        <Button onClick={onClose}>Cerrar</Button>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint} disabled={!ingreso}>
          Imprimir
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ComprobanteContent({ ingreso }: { ingreso: Ingreso }) {
  return (
    <Box sx={{ fontFamily: 'inherit' }}>
      <Typography variant="h6" gutterBottom>
        COMPROBANTE DE INGRESO A ALMACÉN
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2"><strong>Nº documento:</strong> {ingreso.numero_documento}</Typography>
        <Typography variant="body2"><strong>Fecha:</strong> {ingreso.fecha ? new Date(ingreso.fecha).toLocaleDateString() : '-'}</Typography>
        <Typography variant="body2"><strong>Proveedor:</strong> {ingreso.proveedor?.nombre ?? '-'}</Typography>
        <Typography variant="body2"><strong>Almacén:</strong> {ingreso.almacen?.nombre ?? '-'}</Typography>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Producto</TableCell>
            <TableCell>Lote</TableCell>
            <TableCell align="right">Cant.</TableCell>
            <TableCell align="right">P. unit.</TableCell>
            <TableCell align="right">Subtotal</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(ingreso.detalles ?? []).map((d) => (
            <TableRow key={d.id}>
              <TableCell>{d.producto?.nombre ?? d.producto_id}</TableCell>
              <TableCell>{d.lote}</TableCell>
              <TableCell align="right">{d.cantidad}</TableCell>
              <TableCell align="right">{formatCurrency(Number(d.precio_unitario))}</TableCell>
              <TableCell align="right">{formatCurrency(Number(d.subtotal ?? d.cantidad * d.precio_unitario))}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Box sx={{ mt: 2, textAlign: 'right' }}>
        <Typography variant="subtitle1"><strong>Total: {formatCurrency(Number(ingreso.total ?? 0))}</strong></Typography>
      </Box>
      {ingreso.observaciones ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Observaciones: {ingreso.observaciones}
        </Typography>
      ) : null}
    </Box>
  );
}

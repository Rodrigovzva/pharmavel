import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from '@mui/icons-material/Print';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ingresosService, Ingreso, CreateIngresoDto } from '../services/ingresosService';
import IngresoFormDialog from '../components/IngresoFormDialog';
import ComprobanteIngresoDialog from '../components/ComprobanteIngresoDialog';
import { formatCurrency } from '../utils/currency';

export default function IngresosPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [comprobanteIngresoId, setComprobanteIngresoId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: ingresos = [], isLoading } = useQuery({
    queryKey: ['ingresos'],
    queryFn: ingresosService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateIngresoDto) => ingresosService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingresos'] });
      queryClient.invalidateQueries({ queryKey: ['inventario'] });
      toast.success('Ingreso registrado. El stock del almacén se actualizó.');
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al registrar el ingreso');
    },
  });

  const handleSubmit = async (data: CreateIngresoDto) => {
    await createMutation.mutateAsync(data);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Ingresos a almacén</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Nuevo ingreso
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 220px)', overflowX: 'auto', '& .MuiTableCell-root': { py: 0.5 } }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nº documento</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Proveedor</TableCell>
              <TableCell>Almacén</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : ingresos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  No hay ingresos. Use &quot;Nuevo ingreso&quot; para cargar productos a un almacén.
                </TableCell>
              </TableRow>
            ) : (
              ingresos.map((ing: Ingreso) => (
                <TableRow key={ing.id}>
                  <TableCell>{ing.numero_documento}</TableCell>
                  <TableCell>
                    {ing.fecha ? new Date(ing.fecha).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>{ing.proveedor?.nombre ?? '-'}</TableCell>
                  <TableCell>{ing.almacen?.nombre ?? '-'}</TableCell>
                  <TableCell align="right">{formatCurrency(Number(ing.total ?? 0))}</TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PrintIcon />}
                      onClick={() => setComprobanteIngresoId(ing.id)}
                    >
                      Comprobante
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <IngresoFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
      <ComprobanteIngresoDialog
        open={comprobanteIngresoId != null}
        onClose={() => setComprobanteIngresoId(null)}
        ingresoId={comprobanteIngresoId}
      />
    </Box>
  );
}

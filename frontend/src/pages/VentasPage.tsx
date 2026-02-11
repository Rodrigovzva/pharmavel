import { useState, useMemo } from 'react';
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
  Tabs,
  Tab,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from '@mui/icons-material/Print';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ventasService, Venta, CreateVentaDto } from '../services/ventasService';
import { almacenesService } from '../services/almacenesService';
import VentaFormDialog from '../components/VentaFormDialog';
import ComprobanteVentaDialog from '../components/ComprobanteVentaDialog';
import { formatCurrency } from '../utils/currency';

type FiltroTipoPago = 'todas' | 'CONTADO' | 'CREDITO';

export default function VentasPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [comprobanteVentaId, setComprobanteVentaId] = useState<number | null>(null);
  const [filtroTipoPago, setFiltroTipoPago] = useState<FiltroTipoPago>('todas');
  const [filtroAlmacenId, setFiltroAlmacenId] = useState<string>('todos');
  const queryClient = useQueryClient();

  const { data: ventas = [], isLoading } = useQuery({
    queryKey: ['ventas'],
    queryFn: ventasService.getAll,
  });

  const { data: almacenes = [] } = useQuery({
    queryKey: ['almacenes'],
    queryFn: almacenesService.getAll,
  });

  const ventasFiltradas = useMemo(() => {
    let list = ventas;
    if (filtroTipoPago !== 'todas') {
      list = list.filter((v) => (v.tipo_pago || '').toUpperCase() === filtroTipoPago);
    }
    if (filtroAlmacenId !== 'todos' && filtroAlmacenId !== '') {
      const id = Number(filtroAlmacenId);
      if (!Number.isNaN(id)) {
        list = list.filter((v) => {
          const vid = v.almacen_id != null ? Number(v.almacen_id) : (v.almacen?.id != null ? Number(v.almacen.id) : null);
          return vid !== null && vid === id;
        });
      }
    }
    return list;
  }, [ventas, filtroTipoPago, filtroAlmacenId]);

  const createMutation = useMutation({
    mutationFn: (data: CreateVentaDto) => ventasService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
      toast.success('Venta registrada exitosamente');
      setDialogOpen(false);
    },
    onError: (error: any) => {
      const data = error.response?.data;
      const msg = data?.message;
      const text = Array.isArray(msg) ? msg.join('. ') : msg || error.message || 'Error al registrar la venta';
      toast.error(text, { autoClose: 8000 });
      if (error.response?.status === 400 && data) {
        console.warn('POST /ventas 400:', data);
      }
    },
  });

  const handleOpenDialog = () => setDialogOpen(true);
  const handleCloseDialog = () => setDialogOpen(false);

  const handleSubmit = async (data: CreateVentaDto) => {
    await createMutation.mutateAsync(data);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Ventas</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
          Nueva Venta
        </Button>
      </Box>

      <Tabs value={filtroTipoPago} onChange={(_, v) => setFiltroTipoPago(v)} sx={{ mb: 2 }}>
        <Tab label="Todas" value="todas" />
        <Tab label="Contado" value="CONTADO" />
        <Tab label="Crédito" value="CREDITO" />
      </Tabs>

      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
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
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 300px)', overflowX: 'auto', '& .MuiTableCell-root': { py: 0.5 } }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Número Factura</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Almacén</TableCell>
              <TableCell>Tipo pago</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : ventasFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  {ventas.length === 0
                    ? 'No hay ventas registradas'
                    : filtroAlmacenId !== ''
                      ? 'No hay ventas en este almacén'
                      : filtroTipoPago === 'CREDITO'
                        ? 'No hay ventas a crédito'
                        : 'No hay ventas con el filtro seleccionado'}
                </TableCell>
              </TableRow>
            ) : (
              ventasFiltradas.map((venta: Venta) => (
                <TableRow key={venta.id}>
                  <TableCell>{venta.numero_factura}</TableCell>
                  <TableCell>
                    {venta.fecha ? new Date(venta.fecha).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>{venta.cliente?.nombre ?? '-'}</TableCell>
                  <TableCell>{venta.almacen?.nombre ?? '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={venta.tipo_pago === 'CREDITO' ? 'Crédito' : 'Contado'}
                      size="small"
                      color={venta.tipo_pago === 'CREDITO' ? 'warning' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">{formatCurrency(Number(venta.total))}</TableCell>
                  <TableCell>{venta.estado}</TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PrintIcon />}
                      onClick={() => setComprobanteVentaId(venta.id)}
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

      <VentaFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
      />
      <ComprobanteVentaDialog
        open={comprobanteVentaId != null}
        onClose={() => setComprobanteVentaId(null)}
        ventaId={comprobanteVentaId}
      />
    </Box>
  );
}

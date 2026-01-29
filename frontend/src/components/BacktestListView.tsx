import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { BacktestRunSummary, BacktestStatus } from '../types/backtest';

type ChipColor = 'success' | 'info' | 'error' | 'warning' | 'default';

const STATUS_COLORS: Record<BacktestStatus, ChipColor> = {
  [BacktestStatus.COMPLETED]: 'success',
  [BacktestStatus.RUNNING]: 'info',
  [BacktestStatus.FAILED]: 'error',
  [BacktestStatus.PENDING]: 'warning',
};

function getStatusColor(status: BacktestStatus): ChipColor {
  return STATUS_COLORS[status] ?? 'default';
}

const BacktestListView: React.FC = () => {
  const navigate = useNavigate();
  const [backtests, setBacktests] = useState<BacktestRunSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBacktests();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchBacktests, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchBacktests = async () => {
    try {
      const response = await fetch('/api/v1/backtest/runs?limit=100');
      if (response.ok) {
        const data = await response.json();
        setBacktests(data);
      }
    } catch (err) {
      console.error('Error fetching backtests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this backtest?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/backtest/runs/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBacktests(backtests.filter((bt) => bt.id !== id));
      }
    } catch (err) {
      console.error('Error deleting backtest:', err);
    }
  };

  const handleExecute = async (id: number) => {
    try {
      const response = await fetch(`/api/v1/backtest/runs/${id}/execute`, {
        method: 'POST',
      });

      if (response.ok) {
        // Refresh list
        fetchBacktests();
      }
    } catch (err) {
      console.error('Error executing backtest:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (backtests.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No backtests found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create a new backtest to get started
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Strategy</TableCell>
            <TableCell>Market</TableCell>
            <TableCell>Simulation Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Recommendations</TableCell>
            <TableCell align="right">Avg Return</TableCell>
            <TableCell align="right">Win Rate</TableCell>
            <TableCell align="right">Alpha</TableCell>
            <TableCell align="right">Sharpe</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {backtests.map((backtest) => (
            <TableRow key={backtest.id} hover>
              <TableCell>{backtest.name}</TableCell>
              <TableCell>
                <Chip
                  label={backtest.strategy_type || 'Value Score'}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell>{backtest.market}</TableCell>
              <TableCell>{new Date(backtest.simulation_date).toLocaleDateString()}</TableCell>
              <TableCell>
                <Chip
                  label={backtest.status}
                  size="small"
                  color={getStatusColor(backtest.status)}
                />
              </TableCell>
              <TableCell align="right">{backtest.total_recommendations || '-'}</TableCell>
              <TableCell align="right">
                {backtest.avg_return_pct !== undefined && backtest.avg_return_pct !== null ? (
                  <Typography
                    variant="body2"
                    sx={{
                      color: backtest.avg_return_pct >= 0 ? 'success.main' : 'error.main',
                      fontWeight: 'bold',
                    }}
                  >
                    {backtest.avg_return_pct.toFixed(2)}%
                  </Typography>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell align="right">
                {backtest.win_rate_pct !== undefined && backtest.win_rate_pct !== null
                  ? `${backtest.win_rate_pct.toFixed(1)}%`
                  : '-'}
              </TableCell>
              <TableCell align="right">
                {backtest.alpha_pct !== undefined && backtest.alpha_pct !== null ? (
                  <Typography
                    variant="body2"
                    sx={{
                      color: backtest.alpha_pct >= 0 ? 'success.main' : 'error.main',
                    }}
                  >
                    {backtest.alpha_pct.toFixed(2)}%
                  </Typography>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell align="right">
                {backtest.sharpe_ratio !== undefined && backtest.sharpe_ratio !== null
                  ? backtest.sharpe_ratio.toFixed(2)
                  : '-'}
              </TableCell>
              <TableCell>
                <Tooltip title="View Details">
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/backtest/${backtest.id}`)}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {backtest.status === BacktestStatus.PENDING && (
                  <Tooltip title="Execute">
                    <IconButton size="small" onClick={() => handleExecute(backtest.id)}>
                      <PlayIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => handleDelete(backtest.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default BacktestListView;

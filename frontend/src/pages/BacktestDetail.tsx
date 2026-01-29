import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { BacktestRun, BacktestPatterns, BacktestStatus } from '../types/backtest';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps): React.ReactElement | null {
  const { children, value, index, ...other } = props;

  if (value !== index) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`detail-tabpanel-${index}`}
      aria-labelledby={`detail-tab-${index}`}
      {...other}
    >
      <Box sx={{ pt: 3 }}>{children}</Box>
    </div>
  );
}

function getStatusChipColor(status: BacktestStatus): 'success' | 'error' | 'info' {
  switch (status) {
    case BacktestStatus.COMPLETED:
      return 'success';
    case BacktestStatus.FAILED:
      return 'error';
    default:
      return 'info';
  }
}

const BacktestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [backtest, setBacktest] = useState<BacktestRun | null>(null);
  const [patterns, setPatterns] = useState<BacktestPatterns | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBacktest();
      fetchPatterns();
    }
  }, [id]);

  const fetchBacktest = async () => {
    try {
      const response = await fetch(`/api/v1/backtest/runs/${id}`);
      if (response.ok) {
        const data = await response.json();
        setBacktest(data);
      }
    } catch (err) {
      console.error('Error fetching backtest:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatterns = async () => {
    try {
      const response = await fetch(`/api/v1/backtest/analytics/runs/${id}/patterns`);
      if (response.ok) {
        const data = await response.json();
        setPatterns(data);
      }
    } catch (err) {
      console.error('Error fetching patterns:', err);
    }
  };

  if (loading || !backtest) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const sectorChartData = patterns
    ? Object.entries(patterns.sector_performance).map(([sector, data]) => ({
        name: sector,
        avgReturn: data.avg_return_pct,
        winRate: data.win_rate_pct,
      }))
    : [];

  const scoreRangeData = patterns
    ? Object.entries(patterns.value_score_performance).map(([range, data]) => ({
        name: range,
        avgReturn: data.avg_return_pct,
        count: data.count,
      }))
    : [];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/backtest')}
        sx={{ mb: 2 }}
      >
        Back to Backtests
      </Button>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {backtest.name}
        </Typography>
        <Chip label={backtest.status} color={getStatusChipColor(backtest.status)} />
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Recommendations
              </Typography>
              <Typography variant="h4">{backtest.total_recommendations || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Average Return
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  color: (backtest.avg_return_pct ?? 0) >= 0 ? 'success.main' : 'error.main',
                }}
              >
                {backtest.avg_return_pct?.toFixed(2) ?? 'N/A'}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Win Rate
              </Typography>
              <Typography variant="h4">{backtest.win_rate_pct?.toFixed(1) ?? 'N/A'}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Alpha vs Market
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  color: (backtest.alpha_pct ?? 0) >= 0 ? 'success.main' : 'error.main',
                }}
              >
                {backtest.alpha_pct?.toFixed(2) ?? 'N/A'}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Backtest Configuration
            </Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>Strategy</TableCell>
                  <TableCell>{backtest.strategy_type || 'Value Score'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Market</TableCell>
                  <TableCell>{backtest.market}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Simulation Date</TableCell>
                  <TableCell>{new Date(backtest.simulation_date).toLocaleDateString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Lookback Period</TableCell>
                  <TableCell>{backtest.lookback_years} years</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Holding Period</TableCell>
                  <TableCell>{backtest.holding_period_months} months</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Risk Metrics
            </Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>Sharpe Ratio</TableCell>
                  <TableCell>{backtest.sharpe_ratio?.toFixed(2) ?? 'N/A'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Volatility</TableCell>
                  <TableCell>{backtest.volatility_pct?.toFixed(2) ?? 'N/A'}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Max Drawdown</TableCell>
                  <TableCell>
                    <Typography sx={{ color: 'error.main' }}>
                      {backtest.max_drawdown_pct?.toFixed(2) ?? 'N/A'}%
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Best Return</TableCell>
                  <TableCell>
                    <Typography sx={{ color: 'success.main' }}>
                      {backtest.best_return_pct?.toFixed(2) ?? 'N/A'}%
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Worst Return</TableCell>
                  <TableCell>
                    <Typography sx={{ color: 'error.main' }}>
                      {backtest.worst_return_pct?.toFixed(2) ?? 'N/A'}%
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={activeTab} onChange={(_e, v: number) => setActiveTab(v)}>
          <Tab label="Recommendations" />
          <Tab label="Sector Analysis" />
          <Tab label="Value Score Analysis" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          {/* Top and Bottom Performers */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Top 5 Performers
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Stock</TableCell>
                      <TableCell>Sector</TableCell>
                      <TableCell align="right">Return</TableCell>
                      <TableCell align="right">Value Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {patterns?.top_performers.map((stock) => (
                      <TableRow key={stock.stock_code}>
                        <TableCell>
                          {stock.stock_name}
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            {stock.stock_code}
                          </Typography>
                        </TableCell>
                        <TableCell>{stock.sector || '-'}</TableCell>
                        <TableCell align="right">
                          <Typography sx={{ color: 'success.main', fontWeight: 'bold' }}>
                            {stock.return_pct.toFixed(2)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{stock.value_score?.toFixed(1) || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Bottom 5 Performers
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Stock</TableCell>
                      <TableCell>Sector</TableCell>
                      <TableCell align="right">Return</TableCell>
                      <TableCell align="right">Value Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {patterns?.bottom_performers.map((stock) => (
                      <TableRow key={stock.stock_code}>
                        <TableCell>
                          {stock.stock_name}
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            {stock.stock_code}
                          </Typography>
                        </TableCell>
                        <TableCell>{stock.sector || '-'}</TableCell>
                        <TableCell align="right">
                          <Typography sx={{ color: 'error.main', fontWeight: 'bold' }}>
                            {stock.return_pct.toFixed(2)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{stock.value_score?.toFixed(1) || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={sectorChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgReturn" fill="#4caf50" name="Avg Return %" />
              <Bar dataKey="winRate" fill="#2196f3" name="Win Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={scoreRangeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgReturn" fill="#4caf50" name="Avg Return %" />
              <Bar dataKey="count" fill="#2196f3" name="Stock Count" />
            </BarChart>
          </ResponsiveContainer>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default BacktestDetail;

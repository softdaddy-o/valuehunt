import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { StrategyComparison, TimeSeriesData } from '../types/backtest';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const BacktestAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState<StrategyComparison | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [selectedMarket]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch strategy comparison
      const comparisonUrl = selectedMarket
        ? `/api/v1/backtest/analytics/compare?market=${selectedMarket}`
        : '/api/v1/backtest/analytics/compare';
      const comparisonRes = await fetch(comparisonUrl);
      if (comparisonRes.ok) {
        const comparisonData = await comparisonRes.json();
        setComparison(comparisonData);
      }

      // Fetch time series data
      const timeSeriesUrl = selectedMarket
        ? `/api/v1/backtest/analytics/time-series?market=${selectedMarket}`
        : '/api/v1/backtest/analytics/time-series';
      const timeSeriesRes = await fetch(timeSeriesUrl);
      if (timeSeriesRes.ok) {
        const tsData = await timeSeriesRes.json();
        setTimeSeriesData(tsData);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const strategyChartData = comparison
    ? Object.entries(comparison.strategies).map(([strategy, data]) => ({
        strategy,
        'Avg Return %': data.avg_return?.toFixed(2) || 0,
        'Win Rate %': data.avg_win_rate?.toFixed(2) || 0,
        'Sharpe Ratio': data.avg_sharpe_ratio?.toFixed(2) || 0,
      }))
    : [];

  const timeSeriesChartData =
    timeSeriesData?.time_series.map((item) => ({
      date: new Date(item.date).toLocaleDateString(),
      'Portfolio Return %': item.avg_return_pct?.toFixed(2) || 0,
      'Market Return %': item.market_return_pct?.toFixed(2) || 0,
      'Alpha %': item.alpha_pct?.toFixed(2) || 0,
    })) || [];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Market Filter</InputLabel>
          <Select
            value={selectedMarket}
            label="Market Filter"
            onChange={(e) => setSelectedMarket(e.target.value)}
          >
            <MenuItem value="">All Markets</MenuItem>
            <MenuItem value="KOSPI">KOSPI</MenuItem>
            <MenuItem value="KOSDAQ">KOSDAQ</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {comparison && (
        <>
          {/* Best Performing Strategies */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Best by Return
                  </Typography>
                  <Typography variant="h5">{comparison.best_by_return.strategy}</Typography>
                  <Typography variant="h6" sx={{ color: 'success.main' }}>
                    {comparison.best_by_return.avg_return_pct.toFixed(2)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Best by Sharpe Ratio
                  </Typography>
                  <Typography variant="h5">{comparison.best_by_sharpe.strategy}</Typography>
                  <Typography variant="h6">
                    {comparison.best_by_sharpe.sharpe_ratio.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Best by Win Rate
                  </Typography>
                  <Typography variant="h5">{comparison.best_by_winrate.strategy}</Typography>
                  <Typography variant="h6">
                    {comparison.best_by_winrate.win_rate_pct.toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Strategy Comparison Chart */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Strategy Performance Comparison
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={strategyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="strategy" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Avg Return %" fill="#4caf50" />
                <Bar dataKey="Win Rate %" fill="#2196f3" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          {/* Strategy Details Table */}
          <Paper sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ p: 2 }}>
              Strategy Details
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Strategy</TableCell>
                    <TableCell align="right">Total Runs</TableCell>
                    <TableCell align="right">Avg Return</TableCell>
                    <TableCell align="right">Win Rate</TableCell>
                    <TableCell align="right">Sharpe Ratio</TableCell>
                    <TableCell align="right">Alpha</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(comparison.strategies).map(([strategy, data]) => (
                    <TableRow key={strategy}>
                      <TableCell>{strategy}</TableCell>
                      <TableCell align="right">{data.total_runs}</TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{
                            color: (data.avg_return ?? 0) >= 0 ? 'success.main' : 'error.main',
                            fontWeight: 'bold',
                          }}
                        >
                          {data.avg_return?.toFixed(2) ?? 'N/A'}%
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {data.avg_win_rate?.toFixed(1) ?? 'N/A'}%
                      </TableCell>
                      <TableCell align="right">
                        {data.avg_sharpe_ratio?.toFixed(2) ?? 'N/A'}
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{
                            color: (data.avg_alpha ?? 0) >= 0 ? 'success.main' : 'error.main',
                          }}
                        >
                          {data.avg_alpha?.toFixed(2) ?? 'N/A'}%
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {/* Time Series Performance */}
      {timeSeriesData && timeSeriesData.time_series.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Performance Over Time
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={timeSeriesChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="Portfolio Return %"
                stroke="#4caf50"
                strokeWidth={2}
              />
              <Line type="monotone" dataKey="Market Return %" stroke="#ff9800" strokeWidth={2} />
              <Line type="monotone" dataKey="Alpha %" stroke="#2196f3" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {!comparison && !timeSeriesData && (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No analytics data available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Complete some backtests to see analytics
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default BacktestAnalytics;

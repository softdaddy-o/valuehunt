import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { BacktestCreateRequest, BacktestSummaryStats } from '../types/backtest';
import BacktestListView from '../components/BacktestListView';
import BacktestAnalytics from '../components/BacktestAnalytics';

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
      id={`backtest-tabpanel-${index}`}
      aria-labelledby={`backtest-tab-${index}`}
      {...other}
    >
      <Box sx={{ p: 3 }}>{children}</Box>
    </div>
  );
}

function getDefaultFormData(): BacktestCreateRequest {
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  return {
    name: '',
    strategy_type: '',
    market: 'ALL',
    start_date: fiveYearsAgo.toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    lookback_years: 5,
    holding_period_months: 12,
    frequency: 'monthly',
  };
}

const Backtest: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summaryStats, setSummaryStats] = useState<BacktestSummaryStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<BacktestCreateRequest>(getDefaultFormData);

  useEffect(() => {
    fetchSummaryStats();
  }, []);

  const fetchSummaryStats = async () => {
    try {
      const response = await fetch('/api/v1/backtest/analytics/summary');
      if (response.ok) {
        const data = await response.json();
        setSummaryStats(data);
      }
    } catch (err) {
      console.error('Error fetching summary stats:', err);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setActiveTab(newValue);
  };

  const handleCreateBacktest = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/backtest/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create backtest');
      }

      const data = await response.json();
      console.log('Backtest created:', data);

      setCreateDialogOpen(false);
      setFormData(getDefaultFormData());

      // Refresh summary stats
      fetchSummaryStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create backtest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Backtesting
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Test AI stock recommendations using historical data to validate algorithm performance
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Backtest
        </Button>
      </Box>

      {/* Summary Statistics Cards */}
      {summaryStats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Backtests
                </Typography>
                <Typography variant="h4">{summaryStats.total_backtests}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Avg Return
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color:
                      (summaryStats.overall_avg_return_pct ?? 0) >= 0 ? 'success.main' : 'error.main',
                  }}
                >
                  {summaryStats.overall_avg_return_pct?.toFixed(2) ?? 'N/A'}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Avg Win Rate
                </Typography>
                <Typography variant="h4">
                  {summaryStats.overall_avg_win_rate_pct?.toFixed(1) ?? 'N/A'}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Avg Sharpe Ratio
                </Typography>
                <Typography variant="h4">
                  {summaryStats.overall_avg_sharpe_ratio?.toFixed(2) ?? 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="backtest tabs">
          <Tab label="Backtest Runs" />
          <Tab label="Analytics" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <BacktestListView />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <BacktestAnalytics />
        </TabPanel>
      </Paper>

      {/* Create Backtest Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Backtest</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Backtest Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., 5-Year Value Strategy Test"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Strategy Type</InputLabel>
                <Select
                  value={formData.strategy_type}
                  label="Strategy Type"
                  onChange={(e) => setFormData({ ...formData, strategy_type: e.target.value })}
                >
                  <MenuItem value="">Value Score Only</MenuItem>
                  <MenuItem value="UNDERVALUED_SCREENER">Undervalued Screener</MenuItem>
                  <MenuItem value="FEAR_DRIVEN_QUALITY">Fear Driven Quality</MenuItem>
                  <MenuItem value="DIVIDEND_ANALYZER">Dividend Analyzer</MenuItem>
                  <MenuItem value="INSIDER_TRADING">Insider Trading</MenuItem>
                  <MenuItem value="THEME_VS_REAL">Theme vs Real</MenuItem>
                  <MenuItem value="SECTOR_ROTATION">Sector Rotation</MenuItem>
                  <MenuItem value="HIDDEN_GROWTH">Hidden Growth</MenuItem>
                  <MenuItem value="PORTFOLIO_DESIGNER">Portfolio Designer</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Market</InputLabel>
                <Select
                  value={formData.market}
                  label="Market"
                  onChange={(e) => setFormData({ ...formData, market: e.target.value })}
                >
                  <MenuItem value="ALL">All Markets</MenuItem>
                  <MenuItem value="KOSPI">KOSPI</MenuItem>
                  <MenuItem value="KOSDAQ">KOSDAQ</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Lookback Years</InputLabel>
                <Select
                  value={formData.lookback_years}
                  label="Lookback Years"
                  onChange={(e) =>
                    setFormData({ ...formData, lookback_years: Number(e.target.value) })
                  }
                >
                  <MenuItem value={5}>5 Years</MenuItem>
                  <MenuItem value={10}>10 Years</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Holding Period</InputLabel>
                <Select
                  value={formData.holding_period_months}
                  label="Holding Period"
                  onChange={(e) =>
                    setFormData({ ...formData, holding_period_months: Number(e.target.value) })
                  }
                >
                  <MenuItem value={3}>3 Months</MenuItem>
                  <MenuItem value={6}>6 Months</MenuItem>
                  <MenuItem value={12}>12 Months</MenuItem>
                  <MenuItem value={24}>24 Months</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Test Frequency</InputLabel>
                <Select
                  value={formData.frequency}
                  label="Test Frequency"
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                >
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateBacktest}
            variant="contained"
            disabled={loading || !formData.name}
          >
            {loading ? <CircularProgress size={24} /> : 'Create & Run'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Backtest;

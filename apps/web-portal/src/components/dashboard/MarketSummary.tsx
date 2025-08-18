'use client';

import { Box, Typography, Chip, Divider } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const marketData = [
  {
    index: 'S&P 500',
    symbol: 'SPX',
    value: 4783.35,
    change: 23.87,
    changePercent: 0.50,
  },
  {
    index: 'Dow Jones',
    symbol: 'DJI',
    value: 37958.95,
    change: -125.91,
    changePercent: -0.33,
  },
  {
    index: 'NASDAQ',
    symbol: 'IXIC',
    value: 14975.76,
    change: 95.31,
    changePercent: 0.64,
  },
  {
    index: 'Russell 2000',
    symbol: 'RUT',
    value: 2089.54,
    change: 8.92,
    changePercent: 0.43,
  },
];

const formatNumber = (value: number, decimals: number = 2) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

const formatChange = (change: number, changePercent: number) => {
  const prefix = change > 0 ? '+' : '';
  return `${prefix}${formatNumber(change)} (${prefix}${formatNumber(changePercent)}%)`;
};

export default function MarketSummary() {
  return (
    <Box>
      {marketData.map((market, index) => (
        <Box key={market.symbol}>
          <Box sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  {market.index}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {market.symbol}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" fontWeight={500}>
                  {formatNumber(market.value)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 0.5 }}>
                  <Chip
                    icon={market.change > 0 ? <TrendingUp /> : <TrendingDown />}
                    label={formatChange(market.change, market.changePercent)}
                    color={market.change > 0 ? 'success' : 'error'}
                    variant="outlined"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      '& .MuiChip-label': { px: 1 },
                      '& .MuiChip-icon': { ml: '4px', fontSize: '0.75rem' },
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
          {index < marketData.length - 1 && <Divider />}
        </Box>
      ))}
      
      <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Market data delayed by 15 minutes. Last updated: {new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })} EST
        </Typography>
      </Box>
    </Box>
  );
}
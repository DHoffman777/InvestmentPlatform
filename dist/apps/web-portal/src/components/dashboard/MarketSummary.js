"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MarketSummary;
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
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
const formatNumber = (value, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
};
const formatChange = (change, changePercent) => {
    const prefix = change > 0 ? '+' : '';
    return `${prefix}${formatNumber(change)} (${prefix}${formatNumber(changePercent)}%)`;
};
function MarketSummary() {
    return (<material_1.Box>
      {marketData.map((market, index) => (<material_1.Box key={market.symbol}>
          <material_1.Box sx={{ py: 2 }}>
            <material_1.Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <material_1.Box>
                <material_1.Typography variant="subtitle2" fontWeight={600}>
                  {market.index}
                </material_1.Typography>
                <material_1.Typography variant="caption" color="text.secondary">
                  {market.symbol}
                </material_1.Typography>
              </material_1.Box>
              <material_1.Box sx={{ textAlign: 'right' }}>
                <material_1.Typography variant="body2" fontWeight={500}>
                  {formatNumber(market.value)}
                </material_1.Typography>
                <material_1.Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 0.5 }}>
                  <material_1.Chip icon={market.change > 0 ? <icons_material_1.TrendingUp /> : <icons_material_1.TrendingDown />} label={formatChange(market.change, market.changePercent)} color={market.change > 0 ? 'success' : 'error'} variant="outlined" size="small" sx={{
                height: 20,
                fontSize: '0.65rem',
                '& .MuiChip-label': { px: 1 },
                '& .MuiChip-icon': { ml: '4px', fontSize: '0.75rem' },
            }}/>
                </material_1.Box>
              </material_1.Box>
            </material_1.Box>
          </material_1.Box>
          {index < marketData.length - 1 && <material_1.Divider />}
        </material_1.Box>))}
      
      <material_1.Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
        <material_1.Typography variant="caption" color="text.secondary">
          Market data delayed by 15 minutes. Last updated: {new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })} EST
        </material_1.Typography>
      </material_1.Box>
    </material_1.Box>);
}

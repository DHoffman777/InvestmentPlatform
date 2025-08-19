"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RecentTransactions;
const material_1 = require("@mui/material");
const mockTransactions = [
    {
        id: '1',
        date: '2024-01-15',
        symbol: 'AAPL',
        description: 'Apple Inc.',
        type: 'BUY',
        quantity: 100,
        price: 185.50,
        amount: -18550,
        status: 'SETTLED',
    },
    {
        id: '2',
        date: '2024-01-14',
        symbol: 'MSFT',
        description: 'Microsoft Corporation',
        type: 'SELL',
        quantity: 50,
        price: 380.25,
        amount: 19012.50,
        status: 'SETTLED',
    },
    {
        id: '3',
        date: '2024-01-13',
        symbol: 'GOOGL',
        description: 'Alphabet Inc.',
        type: 'BUY',
        quantity: 25,
        price: 142.80,
        amount: -3570,
        status: 'SETTLED',
    },
    {
        id: '4',
        date: '2024-01-12',
        symbol: 'DIVIDEND',
        description: 'Quarterly Dividend Payment',
        type: 'DIVIDEND',
        quantity: 0,
        price: 0,
        amount: 2450,
        status: 'SETTLED',
    },
    {
        id: '5',
        date: '2024-01-11',
        symbol: 'TSLA',
        description: 'Tesla, Inc.',
        type: 'SELL',
        quantity: 15,
        price: 238.45,
        amount: 3576.75,
        status: 'PENDING',
    },
];
const getTypeColor = (type) => {
    switch (type) {
        case 'BUY':
            return 'error';
        case 'SELL':
            return 'success';
        case 'DIVIDEND':
            return 'info';
        default:
            return 'default';
    }
};
const getStatusColor = (status) => {
    switch (status) {
        case 'SETTLED':
            return 'success';
        case 'PENDING':
            return 'warning';
        case 'FAILED':
            return 'error';
        default:
            return 'default';
    }
};
const formatCurrency = (amount) => {
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(absAmount);
    return isNegative ? `-${formatted}` : formatted;
};
const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
};
function RecentTransactions() {
    return (<material_1.TableContainer>
      <material_1.Table size="small">
        <material_1.TableHead>
          <material_1.TableRow>
            <material_1.TableCell>Date</material_1.TableCell>
            <material_1.TableCell>Security</material_1.TableCell>
            <material_1.TableCell>Type</material_1.TableCell>
            <material_1.TableCell align="right">Qty</material_1.TableCell>
            <material_1.TableCell align="right">Price</material_1.TableCell>
            <material_1.TableCell align="right">Amount</material_1.TableCell>
            <material_1.TableCell>Status</material_1.TableCell>
          </material_1.TableRow>
        </material_1.TableHead>
        <material_1.TableBody>
          {mockTransactions.map((transaction) => (<material_1.TableRow key={transaction.id} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
              <material_1.TableCell>
                <material_1.Typography variant="body2">
                  {formatDate(transaction.date)}
                </material_1.Typography>
              </material_1.TableCell>
              <material_1.TableCell>
                <material_1.Box>
                  <material_1.Typography variant="body2" fontWeight={500}>
                    {transaction.symbol}
                  </material_1.Typography>
                  <material_1.Typography variant="caption" color="text.secondary">
                    {transaction.description}
                  </material_1.Typography>
                </material_1.Box>
              </material_1.TableCell>
              <material_1.TableCell>
                <material_1.Chip label={transaction.type} color={getTypeColor(transaction.type)} size="small" variant="outlined"/>
              </material_1.TableCell>
              <material_1.TableCell align="right">
                <material_1.Typography variant="body2">
                  {transaction.quantity > 0 ? transaction.quantity.toLocaleString() : '-'}
                </material_1.Typography>
              </material_1.TableCell>
              <material_1.TableCell align="right">
                <material_1.Typography variant="body2">
                  {transaction.price > 0
                ? new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                }).format(transaction.price)
                : '-'}
                </material_1.Typography>
              </material_1.TableCell>
              <material_1.TableCell align="right">
                <material_1.Typography variant="body2" fontWeight={500} color={transaction.amount > 0 ? 'success.main' : 'text.primary'}>
                  {formatCurrency(transaction.amount)}
                </material_1.Typography>
              </material_1.TableCell>
              <material_1.TableCell>
                <material_1.Chip label={transaction.status} color={getStatusColor(transaction.status)} size="small" variant="filled"/>
              </material_1.TableCell>
            </material_1.TableRow>))}
        </material_1.TableBody>
      </material_1.Table>
    </material_1.TableContainer>);
}

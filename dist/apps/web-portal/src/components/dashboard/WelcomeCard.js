"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = WelcomeCard;
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
function WelcomeCard({ user }) {
    const currentHour = new Date().getHours();
    let greeting = 'Good morning';
    if (currentHour >= 12 && currentHour < 17) {
        greeting = 'Good afternoon';
    }
    else if (currentHour >= 17) {
        greeting = 'Good evening';
    }
    const firstName = user?.name?.split(' ')[0] || 'User';
    return (<material_1.Paper sx={{
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            color: 'white',
            p: 4,
            mb: 3,
            position: 'relative',
            overflow: 'hidden',
        }}>
      {/* Background decoration */}
      <material_1.Box sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
        }}/>
      <material_1.Box sx={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 150,
            height: 150,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
        }}/>

      <material_1.Grid container alignItems="center" spacing={2}>
        <material_1.Grid item>
          <icons_material_1.WavingHand sx={{ fontSize: 40, color: '#FFF59D' }}/>
        </material_1.Grid>
        <material_1.Grid item xs>
          <material_1.Typography variant="h4" fontWeight="bold" gutterBottom>
            {greeting}, {firstName}!
          </material_1.Typography>
          <material_1.Typography variant="body1" sx={{ opacity: 0.9 }}>
            Welcome back to your Investment Platform. Here's what's happening with your portfolios today.
          </material_1.Typography>
        </material_1.Grid>
      </material_1.Grid>
    </material_1.Paper>);
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All tenant routes require authentication
router.use(auth_1.authMiddleware);
// Tenant management (super admin only)
router.get('/', (0, auth_1.requireRoles)(['SUPER_ADMIN']), (req, res) => {
    res.status(501).json({
        success: false,
        error: 'Not implemented',
        message: 'Tenant listing not yet implemented'
    });
});
router.post('/', (0, auth_1.requireRoles)(['SUPER_ADMIN']), (req, res) => {
    res.status(501).json({
        success: false,
        error: 'Not implemented',
        message: 'Tenant creation not yet implemented'
    });
});
router.get('/:tenantId', (0, auth_1.requireRoles)(['SUPER_ADMIN', 'TENANT_ADMIN']), (req, res) => {
    res.status(501).json({
        success: false,
        error: 'Not implemented',
        message: 'Tenant details not yet implemented'
    });
});
router.put('/:tenantId', (0, auth_1.requireRoles)(['SUPER_ADMIN', 'TENANT_ADMIN']), (req, res) => {
    res.status(501).json({
        success: false,
        error: 'Not implemented',
        message: 'Tenant update not yet implemented'
    });
});
router.delete('/:tenantId', (0, auth_1.requireRoles)(['SUPER_ADMIN']), (req, res) => {
    res.status(501).json({
        success: false,
        error: 'Not implemented',
        message: 'Tenant deletion not yet implemented'
    });
});
// Tenant settings
router.get('/:tenantId/settings', (0, auth_1.requireRoles)(['TENANT_ADMIN']), (req, res) => {
    res.status(501).json({
        success: false,
        error: 'Not implemented',
        message: 'Tenant settings not yet implemented'
    });
});
router.put('/:tenantId/settings', (0, auth_1.requireRoles)(['TENANT_ADMIN']), (req, res) => {
    res.status(501).json({
        success: false,
        error: 'Not implemented',
        message: 'Tenant settings update not yet implemented'
    });
});
exports.default = router;

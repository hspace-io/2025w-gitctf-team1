const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { authenticateToken, requireAdmin } = require('../middleware/auth.cjs');

router.get('/flag', authenticateToken, requireAdmin, (req, res) => {
    try {
        const flagPath = path.join('/var', 'ctf', 'flag');
        if (fs.existsSync(flagPath)) {
            const flag = fs.readFileSync(flagPath, 'utf-8').trim();
            return res.json({ success: true, flag: flag });
        } else {
            return res.status(404).json({ success: false, message: 'Flag file not found' });
        }
    } catch (error) {
        console.error('Error reading flag:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;


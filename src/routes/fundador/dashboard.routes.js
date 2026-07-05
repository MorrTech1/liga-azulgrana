const express = require('express');
const pool = require('../../db');

const {
    verificarToken,
    soloFundador
} = require('../../middlewares/auth.middleware');

const router = express.Router();

// ==========================
// Dashboard Fundador
// ==========================
router.get(
    '/',
    verificarToken,
    soloFundador,
    async (req, res) => {

        try {

            res.json({
                mensaje: 'Panel del fundador funcionando 🚀'
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                mensaje: 'Error.'
            });

        }

    }
);

module.exports = router;
const express = require('express');
const app = express.Router();
const path = require('path');
const statesData = require('../model/statesData.json');

// Middleware to validate :state parameter
const verifyStates = (req, res, next) => {
    const stateCodes = statesData.map(state => state.code);
    const { state } = req.params;
    if (!stateCodes.includes(state.toUpperCase())) {
        // If :state parameter does not match state code format, respond with 400
        return res.status(400).json({ message: "Invalid state abbreviation parameter" });
    }
    next();
}

module.exports = verifyStates;
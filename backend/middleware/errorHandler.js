// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    // Always log full error stack to server console for easier debugging
    console.error('Error:', err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack);

    // Database errors
    if (err && err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Duplicate entry' });
    }

    if (err && err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({ error: 'Referenced row not found' });
    }

    // JWT errors
    if (err && err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
    }

    if (err && err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
    }

    // Default error — return message but avoid leaking stack to clients
    res.status(err && err.status ? err.status : 500).json({ 
        error: err && err.message ? err.message : 'Internal server error' 
    });
};

module.exports = errorHandler;


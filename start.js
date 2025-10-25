#!/usr/bin/env node

// Simple start script for Render deployment
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting WebShop Watch backend...');

// Change to backend directory and start server
const backendPath = path.join(__dirname, 'backend');
process.chdir(backendPath);

console.log(`📂 Working directory: ${process.cwd()}`);

// Start the server
const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    cwd: backendPath
});

server.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});

server.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
});


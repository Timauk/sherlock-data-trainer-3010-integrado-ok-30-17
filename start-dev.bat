@echo off
start cmd /k "node server.js"
timeout /t 2
start cmd /k "npm run dev"
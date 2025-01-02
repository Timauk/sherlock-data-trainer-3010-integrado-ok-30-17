@echo off
echo Starting development environment...

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js not found! Please install Node.js first.
    pause
    exit
)

:: Display Node version
echo Node.js version:
node -v
echo.

:: Check and install specific dependencies without removing existing ones
echo Checking specific dependencies...

:: Check @swc/core
call npm list @swc/core || npm install @swc/core@latest

:: Check ts-node
call npm list ts-node || npm install ts-node@latest

:: Check typescript
call npm list typescript || npm install typescript@latest

:: Check @types/node
call npm list @types/node || npm install @types/node@latest

:: Check remaining dependencies without removing existing ones
echo Checking remaining dependencies...
call npm install

:: Check if TypeScript is installed globally
call npm list -g typescript >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing TypeScript globally...
    call npm install -g typescript
)

:: Compile TypeScript to JavaScript
echo Compiling TypeScript to JavaScript...
call npx tsc

:: Start Node.js server in a new window using ts-node-esm
echo Starting Node.js server...
start cmd /k "npx ts-node-esm --experimental-specifier-resolution=node server.ts"

:: Wait 2 seconds to ensure server has started
timeout /t 2 /nobreak

:: Start React application with Vite
echo Starting React application...
start cmd /k "npm run dev"

echo Development environment started successfully!
echo Server running at http://localhost:3001
echo React application running at http://localhost:5173

pause
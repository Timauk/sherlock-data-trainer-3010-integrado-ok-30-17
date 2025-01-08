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

:: Check remaining dependencies without removing existing ones
echo Checking dependencies...
call npm install || (
    echo Error: Failed to install dependencies
    pause
    exit
)

:: Remove old dist directory if it exists
if exist dist (
    echo Removing old dist directory...
    rmdir /s /q dist
)

:: Create dist directory
mkdir dist

:: Copy JavaScript files to dist
echo Copying JavaScript files to dist...
xcopy /s /y src\*.js dist\src\ >nul 2>nul
xcopy /s /y routes\*.js dist\routes\ >nul 2>nul

:: Start Node.js server
echo Starting Node.js server...
start cmd /k "cd dist && node server.js || (echo Error: Failed to start server && pause && exit)"

:: Wait 2 seconds
timeout /t 2 /nobreak

:: Start React application with Vite
echo Starting React application...
start cmd /k "npm run dev || (echo Error: Failed to start React application && pause && exit)"

echo Development environment started successfully!
echo Server running at http://localhost:3001
echo React application running at http://localhost:5173

pause
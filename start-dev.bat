@echo off
echo Starting development environment...

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js not found! Please install Node.js first.
    pause
    exit
)

:: Display and check Node version
echo Node.js version:
for /f "tokens=* USEBACKQ" %%F in (`node -v`) do set NODE_VERSION=%%F
echo %NODE_VERSION%

:: Check if Node version is compatible (minimum v14)
set NODE_MAJOR_VERSION=%NODE_VERSION:~1,2%
if %NODE_MAJOR_VERSION% LSS 14 (
    echo Error: Node.js version must be 14 or higher. Current version: %NODE_VERSION%
    pause
    exit
)
echo Node.js version is compatible.
echo.

:: Install all dependencies without removing existing ones
echo Installing dependencies...
call npm install || (
    echo Error: Failed to install dependencies
    pause
    exit
)

:: Check if TypeScript is installed globally
call npm list -g typescript >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing TypeScript globally...
    call npm install -g typescript || (
        echo Error: Failed to install TypeScript globally
        pause
        exit
    )
)

:: Remove old dist directory if it exists
if exist dist (
    echo Removing old dist directory...
    rmdir /s /q dist
)

:: Create dist directory
mkdir dist

:: Compile TypeScript to JavaScript
echo Compiling TypeScript to JavaScript...
call npx tsc -p tsconfig.server.json
if %ERRORLEVEL% NEQ 0 (
    echo Error: TypeScript compilation failed. Please check your TypeScript files for errors.
    echo Try running 'npx tsc --listFiles' to see which files are being compiled.
    pause
    exit
)

:: Copy non-TypeScript files to dist
echo Copying non-TypeScript files to dist...
xcopy /s /y src\*.js dist\src\ >nul 2>nul
xcopy /s /y routes\*.js dist\routes\ >nul 2>nul

:: Start Node.js server in a new window
echo Starting Node.js server...
start cmd /k "cd dist && node server.js || (echo Error: Failed to start server && pause && exit)"

:: Wait 2 seconds to ensure server has started
timeout /t 2 /nobreak

:: Start React application with Vite
echo Starting React application...
start cmd /k "npm run dev || (echo Error: Failed to start React application && pause && exit)"

echo Development environment started successfully!
echo Server running at http://localhost:3001
echo React application running at http://localhost:5173

pause
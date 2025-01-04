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

:: Check and install specific dependencies without removing existing ones
echo Checking specific dependencies...

:: Check @swc/core
call npm list @swc/core || (
    echo Installing @swc/core...
    npm install @swc/core@latest || (
        echo Error: Failed to install @swc/core
        pause
        exit
    )
)

:: Check ts-node
call npm list ts-node || (
    echo Installing ts-node...
    npm install ts-node@latest || (
        echo Error: Failed to install ts-node
        pause
        exit
    )
)

:: Check typescript
call npm list typescript || (
    echo Installing typescript...
    npm install typescript@latest || (
        echo Error: Failed to install typescript
        pause
        exit
    )
)

:: Check @types/node
call npm list @types/node || (
    echo Installing @types/node...
    npm install @types/node@latest || (
        echo Error: Failed to install @types/node
        pause
        exit
    )
)

:: Check remaining dependencies without removing existing ones
echo Checking remaining dependencies...
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

:: Compile TypeScript to JavaScript
echo Compiling TypeScript to JavaScript...
call npx tsc
if %ERRORLEVEL% NEQ 0 (
    echo Error: TypeScript compilation failed. Please check your TypeScript files for errors.
    echo Try running 'npx tsc --listFiles' to see which files are being compiled.
    pause
    exit
)

:: Start Node.js server in a new window using node --loader
echo Starting Node.js server...
start cmd /k "node --loader ts-node/esm --experimental-specifier-resolution=node server.ts || (echo Error: Failed to start server && pause && exit)"

:: Wait 2 seconds to ensure server has started
timeout /t 2 /nobreak

:: Start React application with Vite
echo Starting React application...
start cmd /k "npm run dev || (echo Error: Failed to start React application && pause && exit)"

echo Development environment started successfully!
echo Server running at http://localhost:3001
echo React application running at http://localhost:5173

pause
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

:: Check and install dependencies
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

:: Create dist directory and necessary subdirectories
echo Creating dist directory structure...
mkdir dist
mkdir dist\src
mkdir dist\src\utils
mkdir dist\src\utils\checkpoint
mkdir dist\src\utils\integrated
mkdir dist\src\utils\logging
mkdir dist\src\routes

:: Compile TypeScript to JavaScript
echo Compiling TypeScript to JavaScript...
call npx tsc -p tsconfig.server.json
if %ERRORLEVEL% NEQ 0 (
    echo Error: TypeScript compilation failed
    pause
    exit
)

:: Copy necessary files
echo Copying files...
xcopy /s /y src\utils\*.js dist\src\utils\ >nul 2>nul
xcopy /s /y src\utils\checkpoint\*.js dist\src\utils\checkpoint\ >nul 2>nul
xcopy /s /y src\utils\integrated\*.js dist\src\utils\integrated\ >nul 2>nul
xcopy /s /y src\utils\logging\*.js dist\src\utils\logging\ >nul 2>nul
xcopy /s /y src\routes\*.js dist\src\routes\ >nul 2>nul

:: Start Node.js server
echo Starting Node.js server...
start cmd /k "cd dist && node server.js || (echo Error: Failed to start server && pause && exit)"

:: Wait 2 seconds
timeout /t 2 /nobreak

:: Start React application
echo Starting React application...
start cmd /k "npm run dev || (echo Error: Failed to start React application && pause && exit)"

echo Development environment started successfully!
echo Server running at http://localhost:3001
echo React application running at http://localhost:5173

pause
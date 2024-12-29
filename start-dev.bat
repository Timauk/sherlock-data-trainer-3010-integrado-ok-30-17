@echo off
echo Iniciando ambiente de desenvolvimento...

:: Verifica se o Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js nao encontrado! Por favor, instale o Node.js primeiro.
    pause
    exit
)

:: Verifica versão do Node
node -v
echo.

:: Limpa cache do npm
echo Limpando cache do npm...
call npm cache clean --force

:: Remove node_modules e package-lock se existirem
if exist "node_modules" (
    echo Removendo node_modules antigo...
    rmdir /s /q "node_modules"
)
if exist "package-lock.json" (
    echo Removendo package-lock.json antigo...
    del /f "package-lock.json"
)

:: Instala dependências
echo Instalando dependencias...
call npm install

:: Verifica se TypeScript está instalado globalmente
call npm list -g typescript >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Instalando TypeScript globalmente...
    call npm install -g typescript
)

:: Compila TypeScript
echo Compilando TypeScript...
call tsc --build

:: Verifica se a pasta checkpoints existe
if not exist "checkpoints" (
    echo Criando pasta checkpoints...
    mkdir checkpoints
)

:: Verifica se a pasta logs existe
if not exist "logs" (
    echo Criando pasta logs...
    mkdir logs
)

:: Inicia o servidor em uma nova janela
echo Iniciando servidor Node.js...
start cmd /k "node --watch server.js"

:: Aguarda 2 segundos
timeout /t 2 /nobreak

:: Inicia a aplicação React
echo Iniciando aplicacao React...
start cmd /k "npm run dev"

echo Ambiente de desenvolvimento iniciado com sucesso!
echo Servidor rodando em http://localhost:3001
echo Aplicacao React rodando em http://localhost:5173

pause
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

:: Instala dependências específicas primeiro
echo Instalando dependencias especificas...
call npm install @swc/plugin-transform-typescript@latest
call npm install @swc/core@latest
call npm install ts-node@latest

:: Instala todas as outras dependências
echo Instalando demais dependencias...
call npm install

:: Verifica se TypeScript está instalado globalmente
call npm list -g typescript >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Instalando TypeScript globalmente...
    call npm install -g typescript
)

:: Inicia o servidor em uma nova janela usando ts-node-esm
echo Iniciando servidor Node.js...
start cmd /k "npx ts-node-esm --experimental-specifier-resolution=node server.ts"

:: Aguarda 2 segundos
timeout /t 2 /nobreak

:: Inicia a aplicação React com Vite
echo Iniciando aplicacao React...
start cmd /k "npm run dev"

echo Ambiente de desenvolvimento iniciado com sucesso!
echo Servidor rodando em http://localhost:3001
echo Aplicacao React rodando em http://localhost:5173

pause
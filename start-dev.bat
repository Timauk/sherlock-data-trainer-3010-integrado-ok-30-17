@echo off
echo Iniciando ambiente de desenvolvimento...

:: Verifica se o Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js nao encontrado! Por favor, instale o Node.js primeiro.
    pause
    exit
)

:: Verifica versão do Node e exibe
echo Versao do Node.js:
node -v
echo.

:: Verifica e instala dependências específicas sem remover existentes
echo Verificando dependencias especificas...

:: Verifica @swc/core
call npm list @swc/core || npm install @swc/core@latest

:: Verifica ts-node
call npm list ts-node || npm install ts-node@latest

:: Verifica typescript
call npm list typescript || npm install typescript@latest

:: Verifica @types/node
call npm list @types/node || npm install @types/node@latest

:: Verifica demais dependências sem remover as existentes
echo Verificando demais dependencias...
call npm install

:: Verifica se TypeScript está instalado globalmente
call npm list -g typescript >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Instalando TypeScript globalmente...
    call npm install -g typescript
)

:: Compila TypeScript para JavaScript
echo Compilando TypeScript para JavaScript...
call npx tsc

:: Inicia o servidor em uma nova janela usando ts-node-esm
echo Iniciando servidor Node.js...
start cmd /k "npx ts-node-esm --experimental-specifier-resolution=node server.ts"

:: Aguarda 2 segundos para garantir que o servidor iniciou
timeout /t 2 /nobreak

:: Inicia a aplicação React com Vite
echo Iniciando aplicacao React...
start cmd /k "npm run dev"

echo Ambiente de desenvolvimento iniciado com sucesso!
echo Servidor rodando em http://localhost:3001
echo Aplicacao React rodando em http://localhost:5173

pause
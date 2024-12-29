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

:: Compila TypeScript para o servidor
echo Compilando TypeScript do servidor...
call tsc --project tsconfig.server.json

:: Verifica e cria todas as pastas necessárias
echo Verificando e criando pastas necessarias...

:: Array de pastas necessárias
set "FOLDERS=dist src/utils/logging logs checkpoints public temp data models cache uploads"

:: Loop através das pastas
for %%F in (%FOLDERS%) do (
    if not exist "%%F" (
        echo Criando pasta %%F...
        mkdir "%%F"
    ) else (
        echo Pasta %%F ja existe.
    )
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
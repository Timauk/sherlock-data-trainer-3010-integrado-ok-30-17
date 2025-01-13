# Manual de Instalação e Execução Local

## Pré-requisitos

- Node.js versão 14 ou superior
- NPM (Node Package Manager)
- Git instalado
- Editor de código (recomendado: VS Code)

## Configuração Inicial

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITORIO]
cd [NOME_DO_PROJETO]
```

2. Instale as dependências:
```bash
npm install
```

3. Configuração do ambiente:
   - Copie o arquivo `.env.example` para `.env`
   - Ajuste as variáveis de ambiente conforme necessário

## Estrutura do Projeto

```
├── src/
│   ├── components/     # Componentes React
│   ├── hooks/         # Hooks personalizados
│   ├── pages/         # Páginas da aplicação
│   ├── types/         # Definições de tipos TypeScript
│   └── utils/         # Utilitários e funções auxiliares
├── public/           # Arquivos estáticos
└── dist/            # Arquivos compilados (gerado automaticamente)
```

## Executando o Projeto

1. Desenvolvimento:
   - Execute o script de desenvolvimento que iniciará tanto o servidor quanto o cliente:
   ```bash
   npm run start-dev
   ```
   Ou use o arquivo batch no Windows:
   ```bash
   start-dev.bat
   ```

2. Build de Produção:
   ```bash
   npm run build
   ```

## Portas Utilizadas

- Frontend (Vite): http://localhost:5173
- Backend: http://localhost:3001

## Solução de Problemas Comuns

1. Erro "Failed to fetch":
   - Verifique se o servidor está rodando na porta 3001
   - Confirme se não há outro processo usando a mesma porta

2. Erros de TypeScript:
   - Execute `npm run build` para verificar erros de tipagem
   - Verifique se todas as dependências estão instaladas

3. Erros do React (#425 e #422):
   - Limpe o cache do navegador
   - Delete a pasta node_modules e package-lock.json
   - Execute `npm install` novamente
   - Reinicie o servidor de desenvolvimento

4. Problemas de CORS:
   - Verifique se as URLs no arquivo .env estão corretas
   - Confirme se o servidor está configurado para aceitar requisições do frontend

## Comandos Úteis

```bash
# Limpar cache e reinstalar dependências
npm clean-install

# Verificar erros de TypeScript
npm run type-check

# Executar testes
npm test

# Verificar qualidade do código
npm run lint
```

## Manutenção

1. Atualizações regulares:
   ```bash
   npm update
   ```

2. Verificação de segurança:
   ```bash
   npm audit
   ```

3. Backup do banco de dados:
   - Execute regularmente o backup dos dados
   - Mantenha cópias em local seguro

## Contato e Suporte

Para suporte adicional:
- Abra uma issue no repositório
- Entre em contato com a equipe de desenvolvimento
# Sistema de Rifas EPAV

Um sistema completo de gerenciamento de rifas desenvolvido em React, permitindo criar e gerenciar múltiplas rifas de 600 números cada, com painel administrativo e interface para participantes.

## 🎯 Funcionalidades

### Para Administradores
- **Painel Administrativo Seguro**: Acesse via `?admin=true` com **autenticação por senha**.
- **Criar Rifas**: Crie até 5 rifas simultâneas com **tamanho personalizado** (de 50 a 10.000 números).
- **Gerenciar Participantes**: Visualize todos os dados dos participantes em uma **página de detalhes completa**.
- **Exportar Dados**: Download em CSV com todos os participantes.
- **Links Exclusivos**: Cada rifa possui um link único para compartilhamento.
- **Links Personalizados Flexíveis**: Crie links com **limites de números digitáveis** por participante (de 1 a 100), com **uso único** (cada link só pode ser usado uma vez).
- **Finalizar Rifa**: Sorteie automaticamente um vencedor entre os participantes e salve seus dados.
- **Pausar/Reativar Rifa**: Bloqueie ou permita novas participações a qualquer momento.
- **Arquivar/Excluir Rifas**: Organize seu painel arquivando rifas finalizadas ou excluindo rifas não iniciadas.
- **Estatísticas em Tempo Real**: Acompanhe o progresso de cada rifa com visualizações detalhadas.

### Para Participantes
- **Interface Simples**: Escolha de números via grade visual
- **Formulário Rápido**: Apenas nome, telefone e email
- **Feedback Visual**: Números disponíveis em azul, ocupados em cinza
- **Responsivo**: Funciona perfeitamente em celulares e desktops

## 🚀 Como Usar

### Instalação e Execução

```bash
# Instalar dependências
pnpm install

# Executar em desenvolvimento
pnpm run dev

# Build para produção
pnpm run build
```

### Acessos

1. **Painel Administrativo**: `http://localhost:5173/?admin=true`
2. **Página da Rifa**: `http://localhost:5173/?rifa=ID_DA_RIFA`
3. **Página Inicial**: `http://localhost:5173/`

### Fluxo de Uso

#### Como Administrador:
1. Acesse o painel administrativo e faça login com a senha.
2. Clique em "Nova Rifa" e dê um nome.
3. Copie o link gerado e compartilhe com os participantes.
4. Acompanhe os participantes em tempo real na página de detalhes da rifa.
5. Exporte os dados quando necessário.

#### Como Participante:
1. Acesse o link da rifa fornecido pelo organizador
2. Clique em um número disponível (azul)
3. Preencha seus dados no formulário
4. Confirme a reserva

## 🎨 Design

- **Cores**: Azul (#1e40af) e Laranja (#ea580c) conforme identidade EPAV
- **Logotipo**: Integrado no cabeçalho de todas as páginas
- **Responsivo**: Adaptado para todos os dispositivos
- **Acessível**: Interface clara e intuitiva

## 💾 Armazenamento

Os dados são armazenados no **localStorage** do navegador, garantindo:
- ✅ Persistência entre sessões
- ✅ Funcionamento offline
- ✅ Sem necessidade de servidor backend
- ✅ Dados seguros no dispositivo do usuário

## 📁 Estrutura do Projeto

```
rifa-epav/
├── src/
│   ├── components/
│   │   ├── AdminPanel.jsx      # Painel administrativo
│   │   └── RifaPage.jsx        # Página da rifa para participantes
│   ├── assets/
│   │   └── EPAV2025.jpg        # Logotipo EPAV
│   ├── App.jsx                 # Componente principal com roteamento
│   └── App.css                 # Estilos globais
├── public/                     # Arquivos estáticos
└── README.md                   # Este arquivo
```

## 🔧 Tecnologias Utilizadas

- **React 18**: Framework principal
- **Vite**: Build tool e dev server
- **Tailwind CSS**: Estilização
- **shadcn/ui**: Componentes de interface
- **Lucide React**: Ícones
- **LocalStorage**: Persistência de dados

## 📱 Responsividade

O sistema foi desenvolvido com **mobile-first**, garantindo excelente experiência em:
- 📱 Smartphones (320px+)
- 📱 Tablets (768px+)
- 💻 Desktops (1024px+)
- 🖥️ Telas grandes (1440px+)

## 🛡️ Segurança e Privacidade

- Dados armazenados localmente no navegador
- Não há transmissão de dados para servidores externos
- Cada rifa possui ID único para evitar conflitos
- Validação de formulários no frontend

## 🚀 Deploy

### GitHub Pages (Recomendado)
1. Faça build do projeto: `pnpm run build`
2. Suba os arquivos da pasta `dist/` para seu repositório
3. Configure GitHub Pages para usar a branch main

### Netlify/Vercel
1. Conecte seu repositório GitHub
2. Configure build command: `pnpm run build`
3. Configure publish directory: `dist`

## 📞 Suporte

Para dúvidas ou suporte técnico, entre em contato com a equipe EPAV.

---

**Desenvolvido para EPAV - Experiência Prática em Atividades no Varejo**

*Sistema de Rifas v7.0 - 2025*

## 🔄 Histórico de Versões

### v7.0 - Outubro 2025
- ✅ **MELHORIA:** Mensagem de sucesso aprimorada na reserva de números, substituindo o erro genérico.
- ✅ **FUNCIONALIDADE:** Autenticação com senha para o Painel Administrativo, protegendo o acesso.
- ✅ **MELHORIA:** Links personalizados agora permitem digitar a quantidade de números desejada (1 a 100).

### v6.0 - Outubro 2025
- ✅ **FUNCIONALIDADE:** Nova página de detalhes da rifa com visualização completa de números e participantes
- ✅ **MELHORIA:** Grade de números interativa e responsiva com animações e feedback visual
- ✅ **MELHORIA:** Visualização em lista detalhada dos participantes com informações completas
- ✅ **FUNCIONALIDADE:** Busca e filtros avançados para números e participantes na página de detalhes
- ✅ **MELHORIA:** Cards de estatísticas visuais e barra de progresso aprimorados
- ✅ **MELHORIA:** Seção de vencedor destacada com informações claras

### v5.0 - Setembro 2025
- ✅ **FUNCIONALIDADE:** Implementado arquivamento de rifas finalizadas para organização
- ✅ **FUNCIONALIDADE:** Implementado exclusão de rifas (não iniciadas ou arquivadas) com confirmação
- ✅ **OTIMIZAÇÃO:** Painel administrativo com visualização inicial otimizada (abas para ativas/arquivadas)
- ✅ **MELHORIA:** Botões de ação contextuais para arquivar, desarquivar e excluir rifas

### v4.0 - Setembro 2025
- ✅ **CORREÇÃO CRÍTICA:** Links de uso único agora bloqueiam adequadamente após primeiro uso
- ✅ **CORREÇÃO CRÍTICA:** Números selecionados são salvos e exibidos corretamente no painel administrativo
- ✅ Validação robusta de dados e tratamento de erros aprimorado
- ✅ Cálculo dinâmico de porcentagem baseado no tamanho real da rifa
- ✅ Interface mais responsiva e feedback visual melhorado

### v3.0 - Setembro 2025
- ✅ Sistema de rifas múltiplas (até 5 rifas simultâneas)
- ✅ Tamanho customizável de rifas (50 a 10.000 números)
- ✅ Links personalizados com limite de números por participante
- ✅ Sistema de pausa/retomada de rifas
- ✅ Sorteio automático de vencedores

### v1.0 - Setembro 2025
- ✅ Versão inicial com funcionalidades básicas

# Guia de Deploy - Sistema de Rifas EPAV

Este guia fornece instruções detalhadas para colocar o sistema de rifas online.

## 🎯 Opções de Deploy

### 1. GitHub Pages (Gratuito - Recomendado)

#### Pré-requisitos
- Conta no GitHub
- Repositório criado

#### Passos:

1. **Prepare o projeto para produção:**
```bash
cd rifa-epav
pnpm run build
```

2. **Configure o arquivo vite.config.js:**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/nome-do-seu-repositorio/', // Substitua pelo nome do seu repo
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

3. **Suba para o GitHub:**
```bash
git init
git add .
git commit -m "Sistema de Rifas EPAV - Versão 1.0"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

4. **Configure GitHub Pages:**
   - Vá para Settings > Pages no seu repositório
   - Source: Deploy from a branch
   - Branch: main / (root)
   - Clique em Save

5. **Acesse seu site:**
   - URL: `https://SEU_USUARIO.github.io/SEU_REPOSITORIO/`

### 2. Netlify (Gratuito)

#### Passos:

1. **Acesse [netlify.com](https://netlify.com) e faça login**

2. **Clique em "New site from Git"**

3. **Conecte seu repositório GitHub**

4. **Configure as opções de build:**
   - Build command: `pnpm run build`
   - Publish directory: `dist`

5. **Deploy automático:**
   - O Netlify fará deploy automaticamente
   - Você receberá uma URL como `https://nome-aleatorio.netlify.app`

### 3. Vercel (Gratuito)

#### Passos:

1. **Acesse [vercel.com](https://vercel.com) e faça login**

2. **Clique em "New Project"**

3. **Importe seu repositório GitHub**

4. **Configure (geralmente detecta automaticamente):**
   - Framework Preset: Vite
   - Build Command: `pnpm run build`
   - Output Directory: `dist`

5. **Deploy:**
   - Clique em "Deploy"
   - Você receberá uma URL como `https://seu-projeto.vercel.app`

## 🔧 Configurações Importantes

### Arquivo .gitignore
Certifique-se de que seu `.gitignore` inclui:
```
node_modules/
dist/
.env
.DS_Store
```

### Arquivo package.json
Verifique se os scripts estão corretos:
```json
{
  "scripts": {
    "dev": "vite --host",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## 📱 Testando o Deploy

Após o deploy, teste:

1. **Página inicial:** `https://seu-site.com/`
2. **Painel admin:** `https://seu-site.com/?admin=true`
3. **Criar uma rifa de teste**
4. **Testar reserva de número**
5. **Verificar responsividade no celular**

## 🛠️ Solução de Problemas

### Problema: Página em branco
**Solução:** Verifique o `base` no `vite.config.js`

### Problema: Imagens não carregam
**Solução:** Certifique-se de que as imagens estão na pasta `src/assets/`

### Problema: Roteamento não funciona
**Solução:** Configure redirects para SPA:

**Para Netlify, crie `public/_redirects`:**
```
/*    /index.html   200
```

**Para Vercel, crie `vercel.json`:**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## 🔐 Domínio Personalizado

### GitHub Pages
1. Vá para Settings > Pages
2. Em "Custom domain", digite seu domínio
3. Configure DNS do seu domínio para apontar para GitHub

### Netlify/Vercel
1. Acesse as configurações do projeto
2. Vá para "Domain settings"
3. Adicione seu domínio personalizado
4. Configure DNS conforme instruções

## 📊 Monitoramento

Após o deploy, monitore:
- ✅ Tempo de carregamento
- ✅ Funcionamento em diferentes dispositivos
- ✅ Persistência dos dados
- ✅ Funcionalidade de exportar

## 🚀 Atualizações Futuras

Para atualizar o sistema:
1. Faça as alterações no código
2. Commit e push para o repositório
3. O deploy será automático (Netlify/Vercel)
4. Para GitHub Pages, pode precisar fazer novo build

## 📞 Suporte

Se encontrar problemas durante o deploy:
1. Verifique os logs de build
2. Teste localmente primeiro (`pnpm run build && pnpm run preview`)
3. Consulte a documentação da plataforma escolhida

---

**Sistema pronto para produção! 🎉**

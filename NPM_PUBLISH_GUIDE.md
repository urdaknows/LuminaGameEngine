# 📦 Guia de Publicação no NPM - Lumina Engine

## ✅ Pré-requisitos Concluídos
- [x] package.json criado
- [x] .npmignore criado
- [ ] Login no NPM
- [ ] Publicação

---

## 🚀 Comandos para Publicar

### **1. Fazer Login no NPM**

```bash
npm login
```

Você será solicitado a fornecer:
- **Username**: seu nome de usuário do NPM
- **Password**: sua senha
- **Email**: seu email (público)
- **OTP**: código de autenticação de dois fatores (se habilitado)

---

### **2. Verificar Informações do Pacote**

Antes de publicar, verifique se está tudo correto:

```bash
npm pack --dry-run
```

Isso mostrará:
- Quais arquivos serão incluídos
- Tamanho total do pacote
- Warnings (se houver)

---

### **3. Testar Localmente (Opcional mas Recomendado)**

```bash
# Criar pacote local
npm pack

# Isso cria um arquivo: lumina-engine-2.0.0.tgz
# Você pode testar instalando localmente em outro projeto
```

---

### **4. Publicar no NPM**

**IMPORTANTE**: Certifique-se de que:
- ✅ O nome `lumina-engine` está disponível no NPM
- ✅ package.json está correto
- ✅ README.md está atualizado
- ✅ LICENSE existe

```bash
# Para primeira publicação
npm publish

# Se o nome já existir, você pode usar scope
npm publish --access public
```

---

### **5. Verificar Publicação**

Após publicar, verifique em:
```
https://www.npmjs.com/package/lumina-engine
```

---

## 📝 Notas Importantes

### **Nome do Pacote**
O nome `lumina-engine` pode já estar em uso. Opções:

1. **Usar scope** (recomendado):
   ```json
   "name": "@uareke/lumina-engine"
   ```
   Publicar: `npm publish --access public`

2. **Nome alternativo**:
   - `lumina-game-engine`
   - `lumina-2d-engine`
   - `luminajs-engine`

### **Versionamento**
Siga o **Semantic Versioning** (SemVer):
- `MAJOR.MINOR.PATCH`
- `2.0.0` → primeira versão pública

Para atualizações futuras:
```bash
npm version patch  # 2.0.0 → 2.0.1 (bug fixes)
npm version minor  # 2.0.0 → 2.1.0 (new features)
npm version major  # 2.0.0 → 3.0.0 (breaking changes)
```

### **Atualizar Pacote**
Após fazer mudanças:
```bash
# 1. Atualizar versão
npm version patch  # ou minor, ou major

# 2. Fazer commit (automático com npm version)
git push --tags

# 3. Publicar nova versão
npm publish
```

---

## 🔍 Verificar Nome Disponível

Antes de publicar, verifique se o nome está disponível:

```bash
npm view lumina-engine
```

Se retornar erro "404", o nome está disponível!
Se retornar informações, o nome já está em uso.

---

## 🎯 Após Publicação

### **Instalar seu pacote**
```bash
npm install lumina-engine
# ou
npm install @uareke/lumina-engine
```

### **Atualizar README.md**
Adicione badge do NPM:
```markdown
[![npm version](https://badge.fury.io/js/lumina-engine.svg)](https://www.npmjs.com/package/lumina-engine)
[![npm downloads](https://img.shields.io/npm/dt/lumina-engine.svg)](https://www.npmjs.com/package/lumina-engine)
```

### **Compartilhar**
- Twitter: Compartilhe o link do NPM
- Reddit: r/javascript, r/gamedev
- Dev.to: Escreva um artigo
- GitHub: Adicione tópicos: `npm-package`, `published`

---

## 🛡️ Boas Práticas

1. **Sempre teste antes de publicar**
   ```bash
   npm pack --dry-run
   ```

2. **Use .npmignore** para manter o pacote leve

3. **Mantenha documentação atualizada**

4. **Use versionamento semântico**

5. **Adicione CHANGELOG.md** para rastrear mudanças

6. **Configure GitHub Actions** para publicação automática (avançado)

---

## ❌ Remover Publicação (Cuidado!)

Se você publicou por engano nas primeiras 72 horas:
```bash
npm unpublish lumina-engine@2.0.0

# Ou remover totalmente (só nas primeiras 72h)
npm unpublish lumina-engine --force
```

**Atenção**: Após 72 horas, você só pode deprecar:
```bash
npm deprecate lumina-engine@2.0.0 "Use version 2.0.1 instead"
```

---

## 🎉 Pronto!

Seu pacote estará disponível globalmente em:
- `npm install lumina-engine`
- https://www.npmjs.com/package/lumina-engine
- CDN (unpkg): https://unpkg.com/lumina-engine@2.0.0/

---

**Última atualização**: Dezembro 2025  
**Documentação**: https://github.com/uareke/LuminaGameEngine

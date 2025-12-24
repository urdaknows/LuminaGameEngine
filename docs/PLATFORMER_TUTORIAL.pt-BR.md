# 🎮 Como Criar um Personagem de Plataforma

> **Tutorial em vídeo completo mostrando passo a passo como criar um personagem de plataforma na Lumina Engine**

---

## 📺 Tutorial em Vídeo

<div align="center">
  
[![Tutorial de Plataforma](https://img.youtube.com/vi/cUXe44JrpEs/maxresdefault.jpg)](https://youtu.be/cUXe44JrpEs)

**[▶️ Assistir no YouTube](https://youtu.be/cUXe44JrpEs)**

</div>

<details>
<summary><b>🎬 Player Incorporado (Clique para expandir)</b></summary>

<div align="center">
  <iframe width="800" height="450" src="https://www.youtube.com/embed/cUXe44JrpEs?autoplay=1&rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

</details>

---

## 📋 O Que Você Vai Aprender

Neste tutorial, você aprenderá como:

### ✅ Recursos Básicos
- **Criar uma entidade de jogador**
- **Adicionar movimentação de plataforma** (andar, correr, pular)
- **Configurar animações de sprite** (idle, walk, run, jump, fall)
- **Configurar detecção de colisão**
- **Implementar física de gravidade**
- **Adicionar mecânicas especiais** (dash, agachar, pulo duplo)

### 🎯 Recursos Avançados
- **Personalização de controles**
- **Gerenciamento de estados de animação**
- **Parâmetros de movimento** 

---

## 🚀 Início Rápido

### 1️⃣ Criar a Entidade do Jogador

1. Abra o Editor da Lumina Engine
2. Clique em **"+ Nova Entidade"**
3. Nomeie como `Player`
4. Defina dimensões: `Largura: 32`, `Altura: 64`

### 2️⃣ Adicionar Componente de Sprite

1. Clique em **"+ Adicionar Componente"** → **Sprite Renderer**
2. Selecione sua sprite sheet do jogador
3. Configure as animações:
   - `idle` - Parado
   - `walk` - Andando
   - `run` - Correndo
   - `jump` - Pulando
   - `fall` - Caindo
   - `crouch` - Agachado

### 3️⃣ Adicionar Script de Movimento

1. Clique em **"+ Adicionar Componente"** → **Script**
2. Selecione **"Movimentação Plataforma"** dos templates
3. Configure os parâmetros:
   ```
   Velocidade Horizontal: 200
   Velocidade Corrida: 350
   Força do Pulo: 600
   Gravidade: 1200
   ```

### 4️⃣ Adicionar Colisão

1. Clique em **"+ Adicionar Componente"** → **Collision**
2. Ative **"Is Solid"**
3. Ajuste o tamanho do colisor para caber no sprite

### 5️⃣ Testar Seu Jogador

1. Pressione **Play** (▶️)
2. Use os controles:
   - **A/D** ou **Setas** - Mover esquerda/direita
   - **Espaço** - Pular
   - **Shift** - Correr
   - **S** ou **Seta Baixo** - Agachar

---

## 🎨 Configuração de Sprites

### Configuração de Animações

Para melhores resultados, use estas configurações:

| Animação | Loop | Velocidade | Frames |
|----------|------|------------|--------|
| `idle` | ✅ Sim | 8 | 4-6 |
| `walk` | ✅ Sim | 10 | 6-8 |
| `run` | ✅ Sim | 12 | 6-8 |
| `jump` | ❌ Não | 10 | 1-3 |
| `fall` | ✅ Sim | 8 | 1-2 |
| `crouch` | ❌ Não | 10 | 1-2 |

### Formato da Sprite Sheet

- **Tamanho do Frame**: 32x32 ou 64x64 pixels
- **Layout**: Tira horizontal ou grade
- **Formato**: PNG com transparência

---

## ⚙️ Parâmetros de Movimento

### Movimento Básico
```javascript
velocidadeHorizontal: 200   // Velocidade de caminhada
velocidadeCorrida: 350      // Velocidade de corrida (com Shift)
forcaPulo: 600              // Força do pulo
gravidade: 1200             // Força da gravidade
```

### Opções Avançadas
```javascript
coyoteTime: 0.1            // Período de graça após sair da plataforma
jumpBuffering: 0.15         // Buffer de entrada de pulo
acceleration: 0.2           // Suavização de movimento
friction: 0.8               // Velocidade de parada
```

---

## 🎯 Problemas Comuns & Soluções

### ❌ Jogador cai através das plataformas
**Solução**: 
- Verifique se o componente de colisão está ativado
- Verifique as configurações de layer/mask de colisão
- Certifique-se de que as plataformas têm colisão ativada

### ❌ Pulo não funciona
**Solução**:
- Aumente o parâmetro de força do pulo
- Verifique se a gravidade está ativada
- Verifique se a detecção de chão está funcionando

### ❌ Animações não tocam
**Solução**:
- Verifique se os nomes das animações correspondem exatamente
- Verifique se a sprite sheet está carregada
- Certifique-se de que a animação autoplay está definida

### ❌ Jogador desliza no chão
**Solução**:
- Aumente o parâmetro de fricção
- Adicione detecção de chão
- Ajuste as configurações de física

---

## 🎓 Próximos Passos

Depois de dominar o básico, tente adicionar:

1. **🗡️ Sistema de Combate** - Adicione animações de ataque e hitboxes
2. **💔 Sistema de Vida** - Rastreie HP e dano do jogador
3. **🎒 Inventário** - Colete itens e power-ups
4. **🚪 Transições de Cena** - Mova entre níveis
5. **💾 Sistema de Save** - Salve o progresso do jogador

---

## 📚 Recursos Adicionais

- **[Documentação Completa](GAME_ENGINE_COMPLETA.pt-BR.md)** - Guia completo da engine
- **[Guia de Movimento do Jogador](PLAYER_MOVEMENT_GUIDE.pt-BR.md)** - Sistema de movimento detalhado
- **[Sistema de Animação](ANIMATION_SYSTEM.pt-BR.md)** - Guia de configuração de animações
- **[Sistema de Física](PHYSICS_SYSTEM.pt-BR.md)** - Física e colisão

---

## 💬 Precisa de Ajuda?

- **📖 Docs**: Leia a [Documentação Completa](GAME_ENGINE_COMPLETA.pt-BR.md)
- **🐛 Issues**: Reporte bugs no [GitHub Issues](https://github.com/uareke/LuminaGameEngine/issues)
- **💡 Ideias**: Compartilhe sugestões e pedidos de recursos

---

<div align="center">

**Feito com ❤️ usando Lumina Engine**

[⬆️ Voltar ao Topo](#-como-criar-um-personagem-de-plataforma)

</div>

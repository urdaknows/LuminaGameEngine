# 💀 Tutorial de Sistema de Morte e Respawn

> **Guia completo: Player, Animações, Zonas de Morte e Checkpoints**

---

## 📺 Tutorial em Vídeo

<div align="center">
  
[![Tutorial de Morte e Respawn](https://img.youtube.com/vi/liPqRAmKCWk/maxresdefault.jpg)](https://www.youtube.com/watch?v=liPqRAmKCWk)

**[▶️ Assistir no YouTube](https://www.youtube.com/watch?v=liPqRAmKCWk)**

</div>

<details>
<summary><b>🎬 Player Incorporado</b></summary>

<div align="center">
  <iframe width="800" height="450" src="https://www.youtube.com/embed/liPqRAmKCWk?autoplay=1&rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

</details>

---

## 📋 O Que Você Vai Aprender

1. ✅ **Criar um Player**
2. ✅ **Configurar Animações** (idle, walk, jump, fall)
3. ✅ **Criar Linha de Morte** (Kill Zone Component)
4. ✅ **Adicionar Checkpoints** para pontos de respawn
5. ✅ **Testar o sistema completo!**

---

## 🎮 Parte 1: Criando o Player

### 1️⃣ Criar Entidade Player
1. Clique no botão **"+ Criar"** na toolbar
2. Selecione **"👤 Player"**
3. Player aparece no centro da tela

### 2️⃣ O Player Já Vem Com:
- ✅ Componente Sprite Renderer
- ✅ Box Collider 2D
- ✅ Gravidade ativada (padrão 980)

---

## 🎨 Parte 2: Configurando Animações

### 1️⃣ Fazer Upload do Sprite Sheet
1. Clique no painel **📁 Assets** (lado esquerdo, embaixo)
2. Clique em **"+ Upload Asset"**
3. Selecione sua sprite sheet do personagem

### 2️⃣ Abrir Editor de Animações
1. Encontre seu sprite nos Assets
2. Clique em **"✏️ Editar"**
3. Editor de Animações abre

### 3️⃣ Configurar Grade de Frames
1. Defina **Largura do Frame** (ex: 32px)
2. Defina **Altura do Frame** (ex: 32px)
3. Grade aparece sobre seu sprite

### 4️⃣ Criar Animações
Clique nos frames para selecioná-los, depois:

```
Animação: idle
- Frames: 0-3
- Velocidade: 8 FPS
- Loop: ✅ Sim

Animação: walk
- Frames: 4-11
- Velocidade: 10 FPS
- Loop: ✅ Sim

Animação: jump
- Frames: 12-15
- Velocidade: 10 FPS
- Loop: ❌ Não

Animação: fall
- Frames: 16-19
- Velocidade: 10 FPS
- Loop: ❌ Não
```

### 5️⃣ Salvar Animações
Clique em **"💾 Salvar Animações"**

### 6️⃣ Atribuir ao Player
1. Selecione a entidade Player
2. Nas propriedades do **Sprite Renderer**
3. **Asset de Origem** = Seu sprite asset
4. **Animação Autoplay** = `idle`

---

## 💀 Parte 3: Criando Linha de Morte (Kill Zone)

### 1️⃣ Criar Entidade Kill Zone
1. Clique **"+ Criar"** → **"📦 Objeto"**
2. Renomeie para **"Linha de Morte"**

### 2️⃣ Adicionar Componente Kill Zone
1. Selecione a entidade Linha de Morte
2. Clique **"+ Adicionar Componente"**
3. Escolha **"💀 Área de Morte"**

### 3️⃣ Configurar Kill Zone

No painel de propriedades:

```
☑️ Linha Global: SIM
   - Faz funcionar como linha horizontal infinita

☐ Destruir Player: NÃO
   - Queremos respawn, não destruição!

Reset X: 100
Reset Y: 100
   - Posição de respawn padrão (será sobrescrita por checkpoints)
```

### 4️⃣ Posicionar a Linha de Morte
1. Arraste a entidade **abaixo de suas plataformas**
2. Aparece como **linha tracejada vermelha/laranja** no editor
3. Quando **"Linha Global"** está marcado, a linha se estende infinitamente

---

## 🚩 Parte 4: Adicionando Checkpoints

### 1️⃣ Criar Entidade Checkpoint
1. Clique **"+ Criar"** → **"📦 Objeto"**
2. Renomeie para **"Checkpoint"**

### 2️⃣ Adicionar Componente Checkpoint
1. Selecione a entidade Checkpoint
2. Clique **"+ Adicionar Componente"**
3. Escolha **"🚩 Checkpoint"**

### 3️⃣ Posicionar Checkpoint
1. Coloque-o em sua plataforma
2. Aparece como **🚩 bandeira** no editor
3. Invisível durante o jogo

### 4️⃣ Adicionar Colisão (Obrigatório!)
O Checkpoint **precisa** de um CollisionComponent:
1. Clique **"+ Adicionar Componente"**
2. Escolha **"📦 Box Collider 2D"**
3. Automaticamente definido como **Trigger**

### 5️⃣ Criar Múltiplos Checkpoints
- Duplique o checkpoint (copiar/colar)
- Coloque checkpoints ao longo do seu nível
- Player respawnará no **último checkpoint tocado**

---

## 🎯 Como o Sistema Funciona

### Fluxo de Morte:
```
1. Player cai abaixo da posição Y da Linha de Morte
   ↓
2. Kill Zone detecta: player.y > deathLine.y
   ↓
3. Procura checkpoint: player.checkpoint existe?
   ↓
4. Respawn no checkpoint (ou posição padrão)
   ↓
5. Velocidade do player resetada para zero
```

### Fluxo de Checkpoint:
```
1. Player toca Checkpoint (colisão trigger)
   ↓
2. Checkpoint salva sua posição em player.checkpoint
   ↓
3. Console mostra: "[Checkpoint] salvo em X, Y"
   ↓
4. Próxima morte respawnará aqui!
```

---

## ⚙️ Opções Avançadas

### Configurações de Kill Zone:

| Configuração | Efeito |
|--------------|--------|
| **Linha Global** | Linha de morte horizontal infinita |
| **Destruir Player** | Remove player do jogo (sem respawn) |
| **Reset X/Y** | Respawn padrão se não houver checkpoint |

### Configurações de Checkpoint:

| Configuração | Efeito |
|--------------|--------|
| **Ativo** | ✅ = Ativo, ❌ = Desativado |

---

## 🐛 Resolução de Problemas

### Player não respawna?
**Soluções**:
- ✅ Verifique se **"Destruir Player"** está **desmarcado**
- ✅ Confirme que Reset X/Y estão definidos
- ✅ Certifique-se que Kill Zone tem **"Linha Global"** marcado

### Checkpoint não funciona?
**Soluções**:
- ✅ Adicione **Componente de Colisão** ao checkpoint
- ✅ Garanta que a colisão está como **Trigger**
- ✅ Verifique se **"Ativo"** está marcado

### Linha de morte não visível?
- 💡 É **visível apenas no modo editor**
- 💡 Pressione **Stop** para vê-la (linha tracejada vermelha/laranja)

### Player cai para sempre?
- ✅ Posicione Linha de Morte **abaixo** de todas as plataformas
- ✅ Certifique-se que **"Linha Global"** está marcado

---

## 💡 Dicas

✅ **Teste cedo** - Adicione Linha de Morte primeiro para evitar queda infinita  
✅ **Checkpoints antes de desafios** - Coloque antes de pulos difíceis  
✅ **Múltiplos checkpoints** - Um por seção do seu nível  
✅ **Posição de reset** - Defina um ponto de spawn seguro padrão  

---

## 📚 Tutoriais Relacionados

- **[Tutorial de Plataforma](PLATFORMER_TUTORIAL.pt-BR.md)** - Setup completo de plataforma
- **[Tutorial de Gravidade](GRAVITY_TUTORIAL.pt-BR.md)** - Entendendo gravidade
- **[Camera Follow](CAMERA_FOLLOW_TUTORIAL.pt-BR.md)** - Sistema de câmera

---

<div align="center">

**Feito com ❤️ usando Lumina Engine**

</div>

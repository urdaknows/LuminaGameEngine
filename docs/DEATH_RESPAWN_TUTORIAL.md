# 💀 Death & Respawn System Tutorial

> **Complete guide: Player, Animations, Kill Zones and Checkpoints**

---

## 📺 Video Tutorial

<div align="center">
  
[![Death & Respawn Tutorial](https://img.youtube.com/vi/liPqRAmKCWk/maxresdefault.jpg)](https://www.youtube.com/watch?v=liPqRAmKCWk)

**[▶️ Watch on YouTube](https://www.youtube.com/watch?v=liPqRAmKCWk)**

</div>

<details>
<summary><b>🎬 Embedded Player</b></summary>

<div align="center">
  <iframe width="800" height="450" src="https://www.youtube.com/embed/liPqRAmKCWk?autoplay=1&rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

</details>

---

## 📋 What You'll Learn

1. ✅ **Create a Player** entity
2. ✅ **Configure Animations** (idle, walk, jump, fall)
3. ✅ **Create Death Line** (Kill Zone Component)
4. ✅ **Add Checkpoints** for respawn points
5. ✅ **Test the full system!**

---

## 🎮 Part 1: Creating the Player

### 1️⃣ Create Player Entity
1. Click **"+ Criar"** button in toolbar
2. Select **"👤 Player"**
3. Player appears in the center of the screen

### 2️⃣ Player Already Has:
- ✅ Sprite Renderer component
- ✅ Box Collider 2D
- ✅ Gravity enabled (default 980)

---

## 🎨 Part 2: Configuring Animations

### 1️⃣ Upload Your Sprite Sheet
1. Click on **📁 Assets** panel (left side, bottom)
2. Click **"+ Upload Asset"**
3. Select your character sprite sheet

### 2️⃣ Open Animation Editor
1. Find your uploaded sprite in Assets
2. Click **"✏️ Editar"** (Edit button)
3. Animation Editor opens

### 3️⃣ Configure Frame Grid
1. Set **Frame Width** (e.g., 32px)
2. Set **Frame Height** (e.g., 32px)
3. Grid appears over your sprite

### 4️⃣ Create Animations
Click on frames to select them, then:

```
Animation: idle
- Frames: 0-3
- Speed: 8 FPS
- Loop: ✅ Yes

Animation: walk
- Frames: 4-11
- Speed: 10 FPS
- Loop: ✅ Yes

Animation: jump
- Frames: 12-15
- Speed: 10 FPS
- Loop: ❌ No

Animation: fall
- Frames: 16-19
- Speed: 10 FPS
- Loop: ❌ No
```

### 5️⃣ Save Animations
Click **"💾 Salvar Animações"**

### 6️⃣ Assign to Player
1. Select Player entity
2. In **Sprite Renderer** properties
3. **Source Asset** = Your sprite asset
4. **Autoplay Animation** = `idle`

---

## 💀 Part 3: Creating Death Line (Kill Zone)

### 1️⃣ Create Kill Zone Entity
1. Click **"+ Criar"** → **"📦Objeto"**
2. Rename to **"Death Line"**

### 2️⃣ Add Kill Zone Component
1. Select the Death Line entity
2. Click **"+ Adicionar Componente"**
3. Choose **"💀 Área de Morte"** (Kill Zone)

### 3️⃣ Configure Kill Zone

In the properties panel:

```
☑️ Linha Global (Global Line): YES
   - Makes it work as an infinite horizontal line

☐ Destruir Player (Destroy Player): NO
   - We want respawn, not destruction!

Reset X: 100
Reset Y: 100
   - Default respawn position (will be overridden by checkpoints)
```

### 4️⃣ Position the Death Line
1. Drag the entity **below your platforms**
2. It shows as a **red/orange dashed line** in editor
3. When **"Linha Global"** is checked, the line extends infinitely

---

## 🚩 Part 4: Adding Checkpoints

### 1️⃣ Create Checkpoint Entity
1. Click **"+ Criar"** → **"📦 Objeto"**
2. Rename to **"Checkpoint"**

### 2️⃣ Add Checkpoint Component
1. Select the Checkpoint entity
2. Click **"+ Adicionar Componente"**
3. Choose **"🚩 Checkpoint"**

### 3️⃣ Position Checkpoint
1. Place it on your platform
2. Shows as a **🚩 flag** in editor
3. Invisible during gameplay

### 4️⃣ Add Collision (Required!)
The Checkpoint **needs** a CollisionComponent:
1. Click **"+ Adicionar Componente"**
2. Choose **"📦 Box Collider 2D"**
3. It's automatically set as **Trigger**

### 5️⃣ Create Multiple Checkpoints
- Duplicate the checkpoint (copy/paste)
- Place checkpoints throughout your level
- Player will respawn at the **last checkpoint touched**

---

## 🎯 How the System Works

### Death Flow:
```
1. Player falls below Death Line Y position
   ↓
2. Kill Zone detects: player.y > deathLine.y
   ↓
3. Looks for checkpoint: player.checkpoint exists?
   ↓
4. Respawns at checkpoint (or default position)
   ↓
5. Player velocity reset to zero
```

### Checkpoint Flow:
```
1. Player touches Checkpoint (trigger collision)
   ↓
2. Checkpoint saves its position to player.checkpoint
   ↓
3. Console shows: "[Checkpoint] salvo em X, Y"
   ↓
4. Next death will respawn here!
```

---

## ⚙️ Advanced Options

### Kill Zone Settings:

| Setting | Effect |
|---------|--------|
| **Linha Global** | Infinite horizontal death line |
| **Destruir Player** | Removes player from game (no respawn) |
| **Reset X/Y** | Default respawn if no checkpoint |

### Checkpoint Settings:

| Setting | Effect |
|---------|--------|
| **Ativo** | ✅ = Active, ❌ = Disabled |

---

## 🐛 Troubleshooting

### Player doesn't respawn?
**Solutions**:
- ✅ Check **"Destruir Player"** is **unchecked**
- ✅ Verify Reset X/Y are set
- ✅ Make sure Kill Zone has **"Linha Global"** checked

### Checkpoint doesn't work?
**Solutions**:
- ✅ Add **Collision Component** to checkpoint
- ✅ Ensure collision is set as **Trigger**
- ✅ Check **"Ativo"** is checked

### Death line not visible?
- 💡 It's **only visible in editor mode**
- 💡 Press **Stop** to see it (red/orange dashed line)

### Player falls forever?
- ✅ Position Death Line **below** all platforms
- ✅ Make sure **"Linha Global"** is checked

---

## 💡 Tips

✅ **Test early** - Add Death Line first to prevent player falling forever  
✅ **Checkpoints before challenges** - Place before difficult jumps  
✅ **Multiple checkpoints** - One per section of your level  
✅ **Reset position** - Set a safe default spawn point  

---

## 📚 Related Tutorials

- **[Platformer Tutorial](PLATFORMER_TUTORIAL.md)** - Complete platformer setup
- **[Gravity Tutorial](GRAVITY_TUTORIAL.md)** - Understanding gravity
- **[Camera Follow](CAMERA_FOLLOW_TUTORIAL.md)** - Camera system

---

<div align="center">

**Made with ❤️ using Lumina Engine**

</div>

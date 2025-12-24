# 🎮 How to Create a Platformer Player

> **Complete video tutorial showing step-by-step how to create a platformer character in Lumina Engine**

---

## 📺 Video Tutorial

<div align="center">
  
[![Platformer Tutorial](https://img.youtube.com/vi/cUXe44JrpEs/maxresdefault.jpg)](https://youtu.be/cUXe44JrpEs)

**[▶️ Watch on YouTube](https://youtu.be/cUXe44JrpEs)**

</div>

<details>
<summary><b>🎬 Embedded Player (Click to expand)</b></summary>

<div align="center">
  <iframe width="800" height="450" src="https://www.youtube.com/embed/cUXe44JrpEs?autoplay=1&rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

</details>

---

## 📋 What You'll Learn

In this tutorial, you will learn how to:

### ✅ Core Features
- **Create a basic player entity**
- **Add platformer movement** (walk, run, jump)
- **Configure sprite animations** (idle, walk, run, jump, fall)
- **Set up collision detection**
- **Implement gravity physics**
- **Add special mechanics** (dash, crouch, double jump)

### 🎯 Advanced Features
- **Input customization**
- **Animation state management**
- **Movement parameters** 

---

## 🚀 Quick Start

### 1️⃣ Create the Player Entity

1. Open the Lumina Engine Editor
2. Click **"+ New Entity"**
3. Name it `Player`
4. Set dimensions: `Width: 32`, `Height: 64`

### 2️⃣ Add Sprite Component

1. Click **"+ Add Component"** → **Sprite Renderer**
2. Select your player sprite sheet
3. Configure animations:
   - `idle` - Standing still
   - `walk` - Walking animation
   - `run` - Running animation
   - `jump` - Jump animation
   - `fall` - Falling animation
   - `crouch` - Crouching animation

### 3️⃣ Add Movement Script

1. Click **"+ Add Component"** → **Script**
2. Select **"Platform Movement"** from templates
3. Configure parameters:
   ```
   Horizontal Speed: 200
   Run Speed: 350
   Jump Force: 600
   Gravity: 1200
   ```

### 4️⃣ Add Collision

1. Click **"+ Add Component"** → **Collision**
2. Enable **"Is Solid"**
3. Adjust collider size to fit the sprite

### 5️⃣ Test Your Player

1. Press **Play** (▶️)
2. Use controls:
   - **A/D** or **Arrows** - Move left/right
   - **Space** - Jump
   - **Shift** - Run
   - **S** or **Down** - Crouch

---

## 🎨 Sprite Setup

### Animation Configuration

For best results, use these settings:

| Animation | Loop | Speed | Frames |
|-----------|------|-------|--------|
| `idle` | ✅ Yes | 8 | 4-6 |
| `walk` | ✅ Yes | 10 | 6-8 |
| `run` | ✅ Yes | 12 | 6-8 |
| `jump` | ❌ No | 10 | 1-3 |
| `fall` | ✅ Yes | 8 | 1-2 |
| `crouch` | ❌ No | 10 | 1-2 |

### Sprite Sheet Format

- **Frame Size**: 32x32 or 64x64 pixels
- **Layout**: Horizontal strip or grid
- **Format**: PNG with transparency

---

## ⚙️ Movement Parameters

### Basic Movement
```javascript
velocidadeHorizontal: 200   // Walking speed
velocidadeCorrida: 350      // Running speed (with Shift)
forcaPulo: 600              // Jump force
gravidade: 1200             // Gravity strength
```

### Advanced Options
```javascript
coyoteTime: 0.1            // Grace period after leaving platform
jumpBuffering: 0.15         // Jump input buffer
acceleration: 0.2           // Movement smoothing
friction: 0.8               // Stopping speed
```

---

## 🎯 Common Issues & Solutions

### ❌ Player falls through platforms
**Solution**: 
- Check if collision component is enabled
- Verify collision layer/mask settings
- Ensure platforms have collision enabled

### ❌ Jump doesn't work
**Solution**:
- Increase jump force parameter
- Check if gravity is enabled
- Verify ground detection is working

### ❌ Animations don't play
**Solution**:
- Check animation names match exactly
- Verify sprite sheet is loaded
- Ensure autoplay animation is set

### ❌ Player slides on ground
**Solution**:
- Increase friction parameter
- Add ground detection
- Adjust physics settings

---

## 🎓 Next Steps

Once you master the basics, try adding:

1. **🗡️ Combat System** - Add attack animations and hitboxes
2. **💔 Health System** - Track player HP and damage
3. **🎒 Inventory** - Collect items and power-ups
4. **🚪 Scene Transitions** - Move between levels
5. **💾 Save System** - Save player progress

---

## 📚 Additional Resources

- **[Complete Documentation](GAME_ENGINE_COMPLETE.md)** - Full engine guide
- **[Player Movement Guide](PLAYER_MOVEMENT_GUIDE.md)** - Detailed movement system
- **[Animation System](ANIMATION_SYSTEM.md)** - Animation setup guide
- **[Physics System](PHYSICS_SYSTEM.md)** - Physics and collision

---

## 💬 Need Help?

- **📖 Docs**: Read the [Complete Documentation](GAME_ENGINE_COMPLETE.md)
- **🐛 Issues**: Report bugs on [GitHub Issues](https://github.com/uareke/LuminaGameEngine/issues)
- **💡 Ideas**: Share suggestions and feature requests

---

<div align="center">

**Made with ❤️ using Lumina Engine**

[⬆️ Back to Top](#-how-to-create-a-platformer-player)

</div>

# 📷 Camera Follow Tutorial

> **Quick guide to make the camera follow your player**

---

## 📺 Video Tutorial

<div align="center">
  
[![Camera Follow Tutorial](https://img.youtube.com/vi/5M8ysytr_6g/maxresdefault.jpg)](https://youtu.be/5M8ysytr_6g)

**[▶️ Watch on YouTube](https://youtu.be/5M8ysytr_6g)**

</div>

<details>
<summary><b>🎬 Embedded Player</b></summary>

<div align="center">
  <iframe width="800" height="450" src="https://www.youtube.com/embed/5M8ysytr_6g?autoplay=1&rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

</details>

---

## 🚀 Quick Steps

### 1️⃣ Add Camera Follow Component

1. Select your **Player** entity
2. Click **"+ Add Component"**
3. Choose **"Camera Follow"**

### 2️⃣ Configure Settings

```
Smooth Speed: 5.0    // How fast camera follows (1-10)
Offset X: 0          // Horizontal offset from player
Offset Y: -50        // Vertical offset (negative = above player)
```

### 3️⃣ Test

Press **Play** ▶️ and move around!

---

## ⚙️ Parameters

| Parameter | Description | Recommended |
|-----------|-------------|-------------|
| **Smooth Speed** | Camera follow speed | 3-7 |
| **Offset X** | Horizontal position | 0 |
| **Offset Y** | Vertical position | -30 to -80 |

---

## 💡 Tips

✅ **Lower smooth speed** = Smoother but slower  
✅ **Higher smooth speed** = Instant but rigid  
✅ **Negative Y offset** = Camera centered above player  

---

## 📚 Related

- **[Platformer Tutorial](PLATFORMER_TUTORIAL.md)** - Create your player first
- **[Complete Documentation](GAME_ENGINE_COMPLETE.md)** - Full engine guide

---

<div align="center">

**Made with ❤️ using Lumina Engine**

</div>

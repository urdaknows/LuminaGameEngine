import { SpriteComponent } from '../componentes/SpriteComponent.js';

// AGORA: Editor de Sprite (Focada em Imagem Global e Grid)
export class EditorSpriteSheet {
    constructor(editor) {
        this.editor = editor;
        this.assetId = null;
        this.spriteTemp = new SpriteComponent();

        // UI
        this.modal = document.getElementById('modal-sprite-editor');
        this.canvasEditor = document.getElementById('canvas-sprite-editor');
        this.ctxEditor = this.canvasEditor.getContext('2d');

        // Inputs
        this.inputWidth = document.getElementById('sprite-frame-width');
        this.inputHeight = document.getElementById('sprite-frame-height');

        this.infoDisplay = document.getElementById('sprite-info-display');
        this.zoom = 1.0;

        // Controle de suavização por asset (override do global)
        this.imageSmoothing = false;
        this.checkboxSmoothing = null;

        this.configurarEventos();
    }

    abrirAsset(assetId) {
        this.assetId = assetId;
        this.modal.classList.remove('hidden');

        const asset = this.editor.assetManager.obterAsset(assetId);
        if (!asset) {
            this.fechar();
            return;
        }

        this.zoom = 1.0;
        this.spriteTemp = new SpriteComponent();

        // Load Props
        if (asset.source) this.spriteTemp.setSource(asset.source);
        this.spriteTemp.larguraFrame = asset.larguraFrame || 32;
        this.spriteTemp.alturaFrame = asset.alturaFrame || 32;

        // Suavização: usa valor do asset ou fallback para config global
        this.imageSmoothing = (asset.imageSmoothing !== undefined)
            ? !!asset.imageSmoothing
            : !!(this.editor.config && this.editor.config.imageSmoothing);

        if (this.checkboxSmoothing) {
            this.checkboxSmoothing.checked = this.imageSmoothing;
        }

        // UI
        this.inputWidth.value = this.spriteTemp.larguraFrame;
        this.inputHeight.value = this.spriteTemp.alturaFrame;

        // Check image
        if (this.spriteTemp.imagem && this.spriteTemp.imagem.src) {
            this.mostrarEditorCanvas();
            if (!this.spriteTemp.imagem.complete) {
                this.spriteTemp.imagem.onload = () => this.mostrarEditorCanvas();
            }
        } else {
            this.ocultarEditorCanvas();
        }

        this.desenharEditor();
    }

    fechar() {
        this.modal.classList.add('hidden');
    }

    configurarEventos() {
        document.getElementById('btn-close-sprite').onclick = () => this.fechar();

        // Checkbox de suavização
        this.checkboxSmoothing = document.getElementById('sprite-image-smoothing');
        if (this.checkboxSmoothing) {
            this.checkboxSmoothing.onchange = () => {
                this.imageSmoothing = this.checkboxSmoothing.checked;
                this.desenharEditor();
            };
        }

        // Upload
        const uploadArea = document.getElementById('upload-area');
        const inputFile = document.getElementById('input-sprite-file');

        uploadArea.onclick = () => inputFile.click();
        inputFile.onchange = (e) => {
            const file = e.target.files[0];
            if (file) this.carregarImagem(file);
            inputFile.value = '';
        };

        // Drag Drop
        uploadArea.ondragover = (e) => { e.preventDefault(); uploadArea.classList.add('hover'); };
        uploadArea.ondragleave = () => uploadArea.classList.remove('hover');
        uploadArea.ondrop = (e) => {
            e.preventDefault();
            uploadArea.classList.remove('hover');
            const file = e.dataTransfer.files[0];
            if (file) this.carregarImagem(file);
        };

        // Grid
        this.inputWidth.onchange = () => {
            this.spriteTemp.larguraFrame = parseInt(this.inputWidth.value) || 32;
            this.desenharEditor();
            this.atualizarInfoImagem();
        };
        this.inputHeight.onchange = () => {
            this.spriteTemp.alturaFrame = parseInt(this.inputHeight.value) || 32;
            this.desenharEditor();
            this.atualizarInfoImagem();
        };

        // Zoom
        this.canvasEditor.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = -Math.sign(e.deltaY);
            this.zoom = Math.max(0.2, Math.min(this.zoom + (delta * 0.1), 5.0));
            this.mostrarEditorCanvas(); // Resize
            this.desenharEditor();
        });

        // Save
        document.getElementById('btn-save-sprite').onclick = () => this.salvar();
    }

    carregarImagem(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.spriteTemp.setSource(e.target.result);

            // Wait load
            const wait = () => {
                if (this.spriteTemp.imagem.complete && this.spriteTemp.imagem.naturalWidth > 0) {
                    this.spriteTemp.carregada = true;
                    this.mostrarEditorCanvas();
                    this.desenharEditor();
                } else {
                    requestAnimationFrame(wait);
                }
            };
            wait();
        };
        reader.readAsDataURL(file);
    }

    mostrarEditorCanvas() {
        document.getElementById('upload-area').classList.add('hidden');
        document.getElementById('canvas-sprite-container').classList.remove('hidden');

        const img = this.spriteTemp.imagem;
        if (!img || !img.src) return;

        this.canvasEditor.width = img.width * this.zoom;
        this.canvasEditor.height = img.height * this.zoom;
        this.atualizarInfoImagem();
    }

    ocultarEditorCanvas() {
        document.getElementById('upload-area').classList.remove('hidden');
        document.getElementById('canvas-sprite-container').classList.add('hidden');
    }

    atualizarInfoImagem() {
        const img = this.spriteTemp.imagem;
        if (!img || !img.src) {
            this.infoDisplay.innerText = 'Sem imagem.';
            return;
        }
        const cols = Math.floor(img.width / this.spriteTemp.larguraFrame);
        const rows = Math.floor(img.height / this.spriteTemp.alturaFrame);
        this.infoDisplay.innerHTML = `<div>${img.width}x${img.height} px</div><div>Grid: ${cols}x${rows}</div>`;
    }

    desenharEditor() {
        const ctx = this.ctxEditor;
        const img = this.spriteTemp.imagem;

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvasEditor.width, this.canvasEditor.height);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, this.canvasEditor.width, this.canvasEditor.height);
        ctx.restore();

        if (!img || !img.src || !img.complete) return;

        ctx.save();
        const enabled = !!this.imageSmoothing;
        ctx.imageSmoothingEnabled = enabled;
        ctx.mozImageSmoothingEnabled = enabled;
        ctx.webkitImageSmoothingEnabled = enabled;
        ctx.msImageSmoothingEnabled = enabled;
        ctx.scale(this.zoom, this.zoom);
        ctx.drawImage(img, 0, 0);

        // Grid
        const w = this.spriteTemp.larguraFrame;
        const h = this.spriteTemp.alturaFrame;
        ctx.strokeStyle = 'rgba(78, 205, 196, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= img.width; x += w) { ctx.moveTo(x, 0); ctx.lineTo(x, img.height); }
        for (let y = 0; y <= img.height; y += h) { ctx.moveTo(0, y); ctx.lineTo(img.width, y); }
        ctx.stroke();

        ctx.restore();
    }

    salvar() {
        if (this.assetId) {
            // Update only Sprite properties, Preserve Animations (don't touch them)
            const asset = this.editor.assetManager.obterAsset(this.assetId);
            if (asset) {
                asset.source = this.spriteTemp.source;
                asset.larguraFrame = this.spriteTemp.larguraFrame;
                asset.alturaFrame = this.spriteTemp.alturaFrame;
                asset.imageSmoothing = this.imageSmoothing;

                // FIX: Refresh Runtime Image explicitly
                if (asset.source) {
                    asset.imagem = new Image();
                    asset.imagem.src = asset.source;
                }

                this.editor.log('Sprite Basic Config salva!', 'success');
            }
        }
        this.fechar();
    }
}

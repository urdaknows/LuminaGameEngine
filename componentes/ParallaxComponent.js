
export default class ParallaxComponent {
    constructor(entidade) {
        this.entidade = entidade;
        this.tipo = 'ParallaxComponent';
        this.nome = 'Parallax Background';

        // Layers: { assetId, speedX, speedY, nome, ... }
        this.layers = [];
    }

    // Adiciona uma nova camada
    addLayer(assetId = null) {
        this.layers.push({
            nome: 'Layer ' + (this.layers.length + 1),
            assetId: assetId,
            speedX: 0.5,
            speedY: 0.5,
            opacity: 1,
            scale: 1,
            yOffset: 0,
            xOffset: 0, // Novo: Manual X
            repeatX: true,
            repeatY: false,
            fitHeight: false,
            fitScreen: false, // Stretch
            fitCover: false, // New: Cover (AspectRatio preserved, fills screen)
            image: null
        });
    }

    removeLayer(index) {
        if (index >= 0 && index < this.layers.length) {
            this.layers.splice(index, 1);
        }
    }

    update(dt) { }

    // Chamado pelo sistema de renderização
    renderizar(renderizador) {
        const ctx = renderizador.ctx;
        const camera = renderizador.camera;
        // Resolve AssetManager from Engine
        const assetManager = this.entidade && this.entidade.engine ? this.entidade.engine.assetManager : null;

        if (!camera) return false;

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Screen Space
        ctx.imageSmoothingEnabled = false; // Pixel Art Mode (CSS: image-rendering: pixelated)

        const viewW = ctx.canvas.width;
        const viewH = ctx.canvas.height;
        const zoom = camera ? (camera.zoom || 1) : 1;

        let desenhouAlgo = false;

        this.layers.forEach(layer => {
            if (!layer.assetId || layer.opacity <= 0) return;

            let img = layer.image;
            if (!img && assetManager) {
                const asset = assetManager.obterAsset(layer.assetId);
                if (asset) {
                    if (!asset.imagem && asset.source) {
                        asset.imagem = new Image();
                        asset.imagem.src = asset.source;
                    }
                    if (asset.imagem && asset.imagem.complete && asset.imagem.naturalWidth > 0) {
                        layer.image = asset.imagem;
                        img = asset.imagem;
                    }
                }
            }

            if (!img) return;

            ctx.save();
            ctx.globalAlpha = layer.opacity;

            let imgW, imgH;

            // Lógica de Dimensões (Considerando ZOOM)
            if (layer.fitCover) {
                // Cover: Escala para preencher TUDO sem distorcer (corta excesso)
                const scaleX = viewW / img.width;
                const scaleY = viewH / img.height;
                const maxScale = Math.max(scaleX, scaleY);

                imgW = img.width * maxScale;
                imgH = img.height * maxScale;
            } else if (layer.fitScreen) {
                // Stretch: Distorce para preencher exatamente
                imgW = viewW;
                imgH = viewH;
            } else if (layer.fitHeight) {
                // Height: Proporcional à altura
                const scaleRatio = viewH / img.height;
                imgW = img.width * scaleRatio;
                imgH = viewH;
            } else {
                // Normal
                const s = (layer.scale || 1) * zoom; // <--- APLY ZOOM HERE
                imgW = img.width * s;
                imgH = img.height * s;
            }

            if (imgW <= 0 || imgH <= 0) { ctx.restore(); return; }

            // Lógica de Scroll/Offset
            const scrollX = camera.x * layer.speedX;
            const scrollY = camera.y * layer.speedY;

            let offsetX = -(scrollX % imgW);
            let offsetY = -(scrollY % imgH);

            if (layer.fitScreen || layer.fitCover) {
                // Se for Cover/Stretch, e sem repeat, fixa na tela (se speed=0)
                if (!layer.repeatX) offsetX = -scrollX;
                if (!layer.repeatY) offsetY = -scrollY;
            } else {
                if (!layer.repeatX) offsetX = -scrollX;
                if (!layer.repeatY && layer.repeatY !== undefined) offsetY = -scrollY;
                else if (offsetY > 0) offsetY -= imgH;
                if (offsetX > 0) offsetX -= imgW;
            }

            // Aplicar Offset Manual
            const manualX = layer.xOffset || 0;
            const manualY = layer.yOffset || 0;
            offsetX += manualX;
            offsetY += manualY;

            const cols = (layer.repeatX !== false && !layer.fitScreen && !layer.fitCover) ? (Math.ceil(viewW / imgW) + 2) : 1;
            const rows = (layer.repeatY === true && !layer.fitScreen && !layer.fitCover) ? (Math.ceil(viewH / imgH) + 2) : 1;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const drawX = offsetX + (c * imgW);
                    const drawY = offsetY + (r * imgH);

                    if (drawX + imgW > 0 && drawX < viewW &&
                        drawY + imgH > 0 && drawY < viewH) {

                        ctx.drawImage(img, Math.floor(drawX), Math.floor(drawY), Math.floor(imgW), Math.floor(imgH));
                        desenhouAlgo = true;
                    }
                }
            }

            ctx.restore();
        });
        ctx.restore();
        return desenhouAlgo;
    }

    clonar() {
        const novo = new ParallaxComponent(null);
        novo.layers = JSON.parse(JSON.stringify(this.layers));
        return novo;
    }

    serializar() {
        return {
            tipo: this.tipo,
            layers: this.layers.map(l => ({
                nome: l.nome,
                assetId: l.assetId,
                speedX: l.speedX,
                speedY: l.speedY,
                opacity: l.opacity,
                scale: l.scale,
                yOffset: l.yOffset,
                xOffset: l.xOffset, // Save xOffset
                repeatX: l.repeatX,
                repeatY: l.repeatY,
                fitHeight: l.fitHeight,
                fitScreen: l.fitScreen,
                fitCover: l.fitCover // Save new prop
            }))
        };
    }

    desserializar(dados) {
        this.layers = dados.layers || [];
        this.layers.forEach(l => {
            if (l.repeatX === undefined) l.repeatX = true;
            if (l.repeatY === undefined) l.repeatY = false;
        });
    }
}

class TilemapComponent {
    constructor() {
        this.nome = 'Tilemap';
        this.tipo = 'TilemapComponent';
        this.ativo = true;
        this.bloqueado = false; // Se true, não permite edição

        this.tileSize = 32;
        this.scale = 1.0; // Escala manual do Tilemap
        this.tiles = {}; // Map "x,y" -> assetId

        // Cache de renderização (Opcional por enquanto)
        this.width = 0;
        this.height = 0;
    }

    inicializar(entidade) {
        this.entidade = entidade;
    }

    /**
     * Define um tile na posição da grid
     * @param {number} x Coordenada X na grid
     * @param {number} y Coordenada Y na grid
     * @param {object|string} data Dados do tile ({assetId, x, y, w, h}) ou apenas assetId
     */
    setTile(x, y, data) {
        const key = `${x},${y}`;
        if (data) {
            // Normalização: Sempre salvar como OBJETO
            let tileData = data;
            if (typeof data === 'string') {
                tileData = { assetId: data };
            } else {
                // Clone para evitar referências compartilhadas
                tileData = { ...data };
            }

            // Preservar propriedades existentes se for merge (opcional, mas bom pra solidifier)
            // Mas o editor já faz o merge antes de passar pra cá geralmente.
            // Vamos confiar no dado recebido, mas garantir formato objeto.

            this.tiles[key] = tileData;

            // Debug: Verificar se salvou solido
            if (tileData.solid) {
                console.log(`[Tilemap] Tile solido definido em ${x},${y}`);
            }
        } else {
            delete this.tiles[key];
        }
    }

    /**
     * Obtém os dados de um tile
     */
    getTile(x, y) {
        const data = this.tiles[`${x},${y}`];
        if (typeof data === 'string') {
            return { assetId: data }; // Normalização on-the-fly para legacy
        }
        return data;
    }

    /**
     * Limpa todo o mapa
     */
    limpar() {
        this.tiles = {};
    }

    /**
     * Renderiza o Tilemap
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} camera {x, y, zoom}
     * @param {AssetManager} assetManager 
     */
    desenhar(ctx, camera, assetManager, debugMode = false) {
        if (!this.ativo) return;

        // Otimização: Calcular range visível
        // Por simplificação inicial, vamos desenhar tudo que está no Map
        // (Em mapas gigantes isso precisará de Culling)

        // Salvar contexto
        // A entidade Tilemap geralmente fica no 0,0 do mundo, mas se ela se mover,
        // os tiles movem junto.
        const startX = this.entidade ? this.entidade.x : 0;
        const startY = this.entidade ? this.entidade.y : 0;

        for (const [key, tileData] of Object.entries(this.tiles)) {
            const [gx, gy] = key.split(',').map(Number);

            // Suporte legado (apenas ID string) vs Objeto TileData
            const assetId = typeof tileData === 'object' ? tileData.assetId : tileData;

            // Dados de recorte (source rect)
            // Se tileData for string, assumimos tile completo (0,0) ou gerenciado pelo asset
            // Se for objeto, usamos x, y, w, h dele
            const sx = (typeof tileData === 'object' && tileData.x !== undefined) ? tileData.x : 0;
            const sy = (typeof tileData === 'object' && tileData.y !== undefined) ? tileData.y : 0;
            // Se w/h não existirem no data, assumimos tileSize do mapa ou será pego da imagem depois
            // Mas idealmente o tileData vem do Palette com w/h

            // Escala Manual
            const currentScale = this.scale || 1.0;
            const size = this.tileSize * currentScale;

            // Posição no Mundo (Ajustada pela escale)
            const worldX = startX + (gx * size);
            const worldY = startY + (gy * size);

            // Coordenadas para desenho
            const drawX = worldX;
            const drawY = worldY;

            // Culling simples (Otimização)
            // Aqui PRECISAMOS da câmera para saber se está na tela, mas calculando o inverso
            // Visibilidade:
            // Left: camera.x
            // Right: camera.x + (ctx.canvas.width / camera.zoom)
            // Top: camera.y
            // Bottom: camera.y + (ctx.canvas.height / camera.zoom)

            const viewW = ctx.canvas.width / camera.zoom;
            const viewH = ctx.canvas.height / camera.zoom;

            if (worldX + size < camera.x || worldX > camera.x + viewW ||
                worldY + size < camera.y || worldY > camera.y + viewH) {
                continue;
            }

            const asset = assetManager.obterAsset(assetId);

            if (asset && asset.imagem) {
                // Desenhar com recorte (Source Rect)
                if (typeof tileData === 'object' && tileData.w && tileData.h) {
                    try {
                        // Importante: drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
                        ctx.drawImage(
                            asset.imagem,
                            sx, sy, tileData.w, tileData.h,
                            drawX, drawY, size, size
                        );
                    } catch (err) {
                        // Ignorar erros de drawImage se o asset não estiver pronto
                    }
                } else {
                    // Desenha imagem inteira (fallback)
                    ctx.drawImage(asset.imagem, drawX, drawY, size, size);
                }
            } else {
                // Asset não encontrado ou sem imagem
                // Desenhar placeholder rosa
                ctx.fillStyle = 'rgba(255, 0, 255, 0.5)'; // Magenta erro
                ctx.fillRect(drawX, drawY, size, size);
            }

            // GIZMO: Solid Collision (Visualizar colisores) e Labels
            if (debugMode) {
                const isSolid = (typeof tileData === 'object' && tileData.solid);
                const isWall = (typeof tileData === 'object' && tileData.wall);
                const isGround = (typeof tileData === 'object' && tileData.ground);
                const isCeiling = (typeof tileData === 'object' && tileData.ceiling);

                if (isSolid) {
                    // Overlay vermelho semi-transparente
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                    ctx.fillRect(drawX, drawY, size, size);
                    // Borda vermelha forte
                    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(drawX, drawY, size, size);
                }

                // Labels Visuais (W = Wall, G = Ground, C = Ceiling)
                if (isWall || isGround || isCeiling) {
                    ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.lineJoin = 'round';
                    ctx.lineWidth = 3;

                    if (isGround) {
                        // G no Topo
                        const gY = drawY + size * 0.25;
                        ctx.strokeStyle = 'black';
                        ctx.strokeText('G', drawX + size / 2, gY);
                        ctx.fillStyle = '#00FF00'; // Verde
                        ctx.fillText('G', drawX + size / 2, gY);
                    }

                    if (isWall) {
                        // W na Base
                        const wY = drawY + size * 0.75;
                        ctx.strokeStyle = 'black';
                        ctx.strokeText('W', drawX + size / 2, wY);
                        ctx.fillStyle = '#00FFFF'; // Ciano
                        ctx.fillText('W', drawX + size / 2, wY);
                    }

                    if (isCeiling) {
                        // C no Centro
                        const cY = drawY + size / 2;
                        ctx.strokeStyle = 'black';
                        ctx.strokeText('C', drawX + size / 2, cY);
                        ctx.fillStyle = '#A29BFE'; // Roxo (igual ao checkbox)
                        ctx.fillText('C', drawX + size / 2, cY);
                    }
                }
            }
        }
    }

    /**
     * Método renderizar (wrapper para desenhar - compatibilidade com Entidade)
     */
    renderizar(renderizador) {
        if (!renderizador || !renderizador.ctx) return false;

        const ctx = renderizador.ctx;
        const camera = renderizador.camera || { x: 0, y: 0, zoom: 1 };
        const assetManager = renderizador.assetManager;
        const debugMode = renderizador.debugMode || false;

        this.desenhar(ctx, camera, assetManager, debugMode);

        // Retorna true para indicar que algo foi desenhado
        return Object.keys(this.tiles).length > 0;
    }

    serializar() {
        return {
            tipo: this.tipo,
            ativo: this.ativo,
            tileSize: this.tileSize,
            scale: this.scale,
            tiles: this.tiles // Serializa o objeto mapa direto
        };
    }

    desserializar(dados) {
        this.ativo = dados.ativo;
        this.tileSize = dados.tileSize || 32;
        this.scale = dados.scale !== undefined ? dados.scale : 1.0;
        this.tiles = dados.tiles || {};
    }
}

export default TilemapComponent;

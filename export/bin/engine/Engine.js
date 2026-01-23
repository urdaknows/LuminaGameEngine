import Renderizador from './Renderizador.js';
import LoopJogo from './LoopJogo.js';
import Camera from './Camera.js';

/**
 * Engine - Classe principal da game engine
 * Coordena todos os sistemas do jogo
 */
class Engine {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderizador = new Renderizador(canvas);
        this.loopJogo = new LoopJogo(this);
        this.camera = new Camera(canvas.width, canvas.height);
        this.assetManager = null; // Vinculado no startup ou pelo editor
        this.lightingSystem = null; // Sistema de iluminação dinâmica

        // Entidades do jogo
        this.entidades = [];
        this._sortDirty = true;  // Flag para Lazy Sorting (Performance)

        // Sistema de input
        this.input = {
            teclas: {},
            teclasPrecionadas: {},
            teclasLiberadas: {}
        };

        // Controle de simulação (para o editor)
        this.simulado = true;
        this.tempoJogo = 0; // Tempo total em segundos (Simulado)
        this.onPostRender = null; // Callback de UI Overlay (novo)
        this.debugMode = false; // Debug mode disabled by default

        // === OTIMIZAÇÕES DE PERFORMANCE (Fase 2) ===
        this.enableUpdateCulling = false;  // Desativado por padrão (pode quebrar lógica)
        this.updateCullingRange = 2000;    // Pixels de distância para atualizar

        // Estatísticas (para debug)
        this.stats = {
            entidadesAtualizadas: 0,
            entidadesRenderizadas: 0,
            sortCount: 0
        };

        this.configurarInput();
    }

    get fps() { return this.loopJogo ? this.loopJogo.currentFps : 0; }

    /**
     * Configura o sistema de input
     */
    configurarInput() {
        window.addEventListener('keydown', (e) => {
            // Ignora se estiver digitando em um input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (!this.input.teclas[e.key]) {
                this.input.teclasPrecionadas[e.key] = true;
            }
            this.input.teclas[e.key] = true;
        });

        window.addEventListener('keyup', (e) => {
            // Ignora se estiver digitando em um input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            this.input.teclas[e.key] = false;
            this.input.teclasLiberadas[e.key] = true;
        });
    }

    /**
     * Adiciona uma entidade ao jogo
     */
    adicionarEntidade(entidade) {
        if (!this.entidades.includes(entidade)) {
            entidade.engine = this;
            entidade.iniciar?.();
            this.entidades.push(entidade);
            this._sortDirty = true;  // Marca para re-sort
        }
        return entidade;
    }

    /**
     * Remove uma entidade do jogo
     */
    removerEntidade(entidade) {
        const index = this.entidades.indexOf(entidade);
        if (index !== -1) {
            this.entidades[index].engine = null;
            this.entidades.splice(index, 1);
            this._sortDirty = true;  // Marca para re-sort
        }
    }

    /**
     * Marca que a ordenação precisa ser refeita
     * Deve ser chamado quando zIndex de alguma entidade mudar
     */
    marcarOrdenacaoPendente() {
        this._sortDirty = true;
    }

    /**
     * Atualiza todas as entidades
     */
    atualizar(deltaTime) {
        // Se não estiver simulando, não atualiza lógica de jogo (física, scripts)
        if (!this.simulado) return;

        this.tempoJogo += deltaTime;
        this.stats.entidadesAtualizadas = 0;  // Reset contador

        // ==========================================
        // OTIMIZAÇÃO: Update Culling (Opcional)
        // ==========================================
        if (this.enableUpdateCulling) {
            // Encontra player ou câmera como ponto de referência
            const refX = this.camera ? this.camera.x + (this.camera.canvasWidth / (2 * this.camera.zoom)) : 0;

            for (const entidade of this.entidades) {
                if (!entidade.atualizar) continue;

                // Entidades sempre atualizadas (críticas)
                const sempreAtualizar = entidade.alwaysUpdate ||
                    entidade.tags?.includes('player') ||
                    entidade.tags?.includes('camera') ||
                    entidade.x === undefined;  // UI elements

                if (sempreAtualizar) {
                    entidade.atualizar(deltaTime);
                    this.stats.entidadesAtualizadas++;
                    continue;
                }

                // Culling: só atualiza se próximo
                const distancia = Math.abs(entidade.x - refX);
                if (distancia <= this.updateCullingRange) {
                    entidade.atualizar(deltaTime);
                    this.stats.entidadesAtualizadas++;
                }
            }
        } else {
            // Modo normal: atualiza tudo
            for (const entidade of this.entidades) {
                if (entidade.atualizar) {
                    entidade.atualizar(deltaTime);
                    this.stats.entidadesAtualizadas++;
                }
            }
        }

        // Limpa teclas pressionadas/liberadas neste frame
        this.input.teclasPrecionadas = {};
        this.input.teclasLiberadas = {};
    }

    /**
     * Renderiza todas as entidades
     */
    renderizar() {
        this.renderizador.limpar();

        // Sincroniza modo debug com o renderizador
        if (this.debugMode !== undefined) {
            this.renderizador.debugMode = this.debugMode;
        }

        // Sincroniza Camera
        if (this.camera && this.renderizador.camera) {
            this.renderizador.camera.x = this.camera.x;
            this.renderizador.camera.y = this.camera.y;
            this.renderizador.camera.zoom = this.camera.zoom;
        }

        // ==========================================
        // OTIMIZAÇÃO: Lazy Sorting (99% menos sorts)
        // ==========================================
        // Só ordena quando zIndex muda (_sortDirty = true)
        if (this._sortDirty) {
            this.entidades.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
            this._sortDirty = false;
            this.stats.sortCount++;
        }

        // ==========================================
        // OTIMIZAÇÃO: Frustum Culling (95% menos draws)
        // ==========================================
        // Só renderiza entidades visíveis na câmera
        this.stats.entidadesRenderizadas = 0;  // Reset contador

        // Aplicar transformação da câmera (IMPORTANTE para Standalone/Player)
        const ctx = this.renderizador.ctx;
        if (this.camera) {
            this.camera.aplicarTransformacao(ctx);
        }

        for (const entidade of this.entidades) {
            if (!entidade.renderizar) continue;

            // Frustum Culling: verifica se está no viewport
            if (this.camera && !this.camera.estaNoViewport(entidade)) {
                continue;  // Pula entidades fora da tela
            }

            entidade.renderizar(this.renderizador);
            this.stats.entidadesRenderizadas++;
        }

        // Remover transformação para outros elementos de UI fixos se houver
        if (this.camera) {
            this.camera.removerTransformacao(ctx);
        }

        // Renderizar iluminação (se o sistema estiver vinculado)
        if (this.lightingSystem && this.lightingSystem.ativo) {
            this.lightingSystem.renderizar(this.entidades, this.camera);
        }

        if (this.onPostRender) this.onPostRender();
    }

    /**
     * Coleta todos os recursos (imagens) que precisam ser carregados
     */
    coletarRecursos() {
        const recursos = [];
        const assetManager = this.renderizador?.assetManager || (window.editor && window.editor.assetManager);

        for (const entidade of this.entidades) {
            // Coleta sprites de SpriteComponent
            const spriteComp = entidade.obterComponente('SpriteComponent');
            if (spriteComp) {
                if (spriteComp.source) recursos.push(spriteComp.source);
                else if (spriteComp.assetId && assetManager) {
                    const asset = assetManager.obterAsset(spriteComp.assetId);
                    if (asset && asset.source) recursos.push(asset.source);
                }

                // Coleta frames de animações do Sprite (se houver sources per-frame)
                if (spriteComp.animacoes) {
                    Object.values(spriteComp.animacoes).forEach(anim => {
                        if (anim && anim.source) recursos.push(anim.source);
                        if (anim && anim.frames && Array.isArray(anim.frames)) {
                            anim.frames.forEach(f => {
                                if (f && typeof f === 'object' && f.source) recursos.push(f.source);
                            });
                        }
                    });
                }
            }

            // Coleta de TilemapComponent (EXTREMAMENTE IMPORTANTE PARA EXPORTAÇÃO)
            const tilemapComp = entidade.obterComponente('TilemapComponent');
            if (tilemapComp && tilemapComp.tiles && assetManager) {
                for (const tileData of Object.values(tilemapComp.tiles)) {
                    const assetId = typeof tileData === 'object' ? tileData.assetId : tileData;
                    if (assetId) {
                        const asset = assetManager.obterAsset(assetId);
                        if (asset && asset.source) recursos.push(asset.source);
                    }
                }
            }

            // Coleta de ParallaxComponent
            const parallaxComp = entidade.obterComponente('ParallaxComponent');
            if (parallaxComp && parallaxComp.layers && assetManager) {
                parallaxComp.layers.forEach(layer => {
                    const id = layer.assetId;
                    if (id) {
                        const asset = assetManager.obterAsset(id);
                        if (asset && asset.source) recursos.push(asset.source);
                    }
                });
            }

            // Coleta de SoundComponent
            const soundComp = entidade.obterComponente('SoundComponent');
            if (soundComp && soundComp.assetId && assetManager) {
                const asset = assetManager.obterAsset(soundComp.assetId);
                if (asset && asset.source) recursos.push(asset.source);
            }

            // Coleta de ItemComponent
            const itemComp = entidade.obterComponente('ItemComponent');
            if (itemComp && assetManager) {
                if (itemComp.icon) {
                    const asset = assetManager.obterAsset(itemComp.icon);
                    if (asset && asset.source) recursos.push(asset.source);
                }
                if (itemComp.pickupSound) {
                    const asset = assetManager.obterAsset(itemComp.pickupSound);
                    if (asset && asset.source) recursos.push(asset.source);
                }
            }

            // Coleta de InventoryComponent (ícones de itens já existentes)
            const invComp = entidade.obterComponente('InventoryComponent');
            if (invComp && invComp.items && assetManager) {
                invComp.items.forEach(item => {
                    if (item.icon) {
                        const asset = assetManager.obterAsset(item.icon);
                        if (asset && asset.source) recursos.push(asset.source);
                    }
                });
            }

            // Coleta sprites de UIComponent (inventory icons, etc)
            const uiComp = entidade.obterComponente('UIComponent');
            if (uiComp) {
                if (uiComp.backgroundImage) recursos.push(uiComp.backgroundImage);
                // Icones de slots/bordas se houver
                const uiAssets = [
                    uiComp.imagemSlot, uiComp.imagemSlotCheio,
                    uiComp.borderTopLeft, uiComp.borderTop, uiComp.borderTopRight,
                    uiComp.borderLeft, uiComp.borderRight,
                    uiComp.borderBottomLeft, uiComp.borderBottom, uiComp.borderBottomRight
                ];
                uiAssets.forEach(id => {
                    if (id && assetManager) {
                        const asset = assetManager.obterAsset(id);
                        if (asset && asset.source) recursos.push(asset.source);
                    }
                });

                // Elementos de imagem individuais
                if (uiComp.elementos) {
                    uiComp.elementos.forEach(el => {
                        if (el.tipo === 'imagem' && el.assetId && assetManager) {
                            const asset = assetManager.obterAsset(el.assetId);
                            if (asset && asset.source) recursos.push(asset.source);
                        }
                    });
                }
            }
        }

        // Remove duplicatas e nulos
        return [...new Set(recursos)].filter(r => r && typeof r === 'string');
    }

    /**
     * Renderiza tela de carregamento
     */
    renderizarTelaCarregamento(progresso) {
        const ctx = this.renderizador.ctx;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Texto "Carregando..."
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Carregando...', this.canvas.width / 2, this.canvas.height / 2 - 30);

        // Barra de progresso
        const barWidth = 300;
        const barHeight = 20;
        const barX = (this.canvas.width - barWidth) / 2;
        const barY = this.canvas.height / 2 + 10;

        // Fundo da barra
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Progresso
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(barX, barY, barWidth * progresso, barHeight);

        // Borda
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Percentual
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.fillText(`${Math.floor(progresso * 100)}%`, this.canvas.width / 2, barY + barHeight + 25);
    }

    /**
     * Carrega todos os recursos antes de iniciar
     */
    async carregarRecursos() {
        const recursos = this.coletarRecursos();

        if (recursos.length === 0) {
            console.log('[Engine] Nenhum recurso para carregar.');
            return;
        }

        console.log(`[Engine] Carregando ${recursos.length} recursos...`);

        let carregados = 0;
        const total = recursos.length;

        // Renderiza tela inicial
        this.renderizarTelaCarregamento(0);

        const promessas = recursos.map(src => {
            return new Promise((resolve, reject) => {
                const img = new Image();

                img.onload = () => {
                    carregados++;
                    this.renderizarTelaCarregamento(carregados / total);
                    resolve(src);
                };

                img.onerror = () => {
                    console.warn(`[Engine] Falha ao carregar: ${src}`);
                    carregados++;
                    this.renderizarTelaCarregamento(carregados / total);
                    resolve(src); // Resolve mesmo com erro para não travar
                };

                img.src = src;
            });
        });

        await Promise.all(promessas);
        console.log('[Engine] Todos os recursos carregados!');
    }

    /**
     * Inicia a engine (com preloader)
     */
    async iniciar() {
        await this.carregarRecursos();
        this.loopJogo.iniciar();
    }

    /**
     * Para a engine
     */
    parar() {
        this.loopJogo.parar();
    }

    /**
     * Verifica se uma tecla está pressionada
     */
    teclaPressionada(tecla) {
        return this.input.teclas[tecla] || false;
    }

    /**
     * Verifica se uma tecla foi pressionada neste frame
     */
    teclaPrecionadaAgora(tecla) {
        return this.input.teclasPrecionadas[tecla] || false;
    }

    /**
     * Verifica se uma tecla foi liberada neste frame
     */
    teclaLiberadaAgora(tecla) {
        return this.input.teclasLiberadas[tecla] || false;
    }
    /**
     * Inicia o modo de jogo (Play Mode) com um estado específico
     * @param {Object} state - Estado serializado do projeto
     */
    async iniciarPlayMode(state) {
        this.parar();
        this.entidades = [];
        this.simulado = true;

        // Aqui poderia haver lógica de deserialização se a Engine fosse responsável por isso
        // Mas por enquanto, assumimos que quem chama configura as entidades antes ou depois
        // Se passarmos 'state', poderíamos deserializar aqui.
        // Por compatibilidade com o plano, vamos manter simples e permitir que o caller configure.

        await this.iniciar();
    }
}

export default Engine;

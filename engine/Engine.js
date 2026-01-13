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

        // Entidades do jogo
        this.entidades = [];

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
        this.debugMode = true; // [FIX] Enable Debug Mode by default for collision boxes

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
        entidade.engine = this;
        this.entidades.push(entidade);
        return entidade;
    }

    /**
     * Remove uma entidade do jogo
     */
    removerEntidade(entidade) {
        const index = this.entidades.indexOf(entidade);
        if (index > -1) {
            this.entidades.splice(index, 1);
        }
    }

    /**
     * Atualiza todas as entidades
     */
    atualizar(deltaTime) {
        // Se não estiver simulando, não atualiza lógica de jogo (física, scripts)
        if (!this.simulado) return;

        this.tempoJogo += deltaTime;

        // Atualiza todas as entidades
        for (const entidade of this.entidades) {
            if (entidade.atualizar) {
                entidade.atualizar(deltaTime);
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

        // Prepara lista de renderização ordenada por Z-Index
        // Nota: [...this.entidades] cria uma cópia para evitar modificar a ordem de update/lógica
        const listaRender = [...this.entidades].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

        // Renderiza todas as entidades
        for (const entidade of listaRender) {
            if (entidade.renderizar) {
                entidade.renderizar(this.renderizador);
            }
        }

        if (this.onPostRender) this.onPostRender();
    }

    /**
     * Coleta todos os recursos (imagens) que precisam ser carregados
     */
    coletarRecursos() {
        const recursos = [];

        for (const entidade of this.entidades) {
            // Coleta sprites de SpriteComponent
            const spriteComp = entidade.obterComponente('SpriteComponent');
            if (spriteComp && spriteComp.source) {
                recursos.push(spriteComp.source);
            }

            // Coleta sprites de UIComponent (inventory icons, etc)
            const uiComp = entidade.obterComponente('UIComponent');
            if (uiComp && uiComp.backgroundImage) {
                recursos.push(uiComp.backgroundImage);
            }

            // Coleta sprites de ParallaxComponent
            const parallaxComp = entidade.obterComponente('ParallaxComponent');
            if (parallaxComp && parallaxComp.source) {
                recursos.push(parallaxComp.source);
            }
        }

        // Remove duplicatas
        return [...new Set(recursos)];
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
}

export default Engine;

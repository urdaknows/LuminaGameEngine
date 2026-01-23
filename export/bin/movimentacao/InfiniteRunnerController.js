/**
 * InfiniteRunnerController
 * 
 * Script para controlar personagem em jogo Infinite Runner
 * 
 * Funcionalidades:
 * - Movimento automático para direita (velocidade progressiva)
 * - Pulo com gravidade
 * - Agachamento (slide)
 * - Sistema de pontuação (distância percorrida)
 * - Game Over ao colidir com obstáculos
 * - Detecção de chão
 * 
 * @propriedades {number} velocidadeInicial - Velocidade inicial horizontal (padrão: 200)
 * @propriedades {number} aceleracao - Aceleração por segundo (padrão: 10)
 * @propriedades {number} velocidadeMaxima - Velocidade máxima (padrão: 500)
 * @propriedades {number} forcaPulo - Força do pulo (padrão: -400)
 * @propriedades {number} gravidade - Gravidade aplicada (padrão: 1200)
 * @propriedades {string} teclasPulo - Teclas para pular (padrão: 'Space,w,W,ArrowUp')
 * @propriedades {string} teclasAgachar - Teclas para agachar (padrão: 's,S,ArrowDown')
 * @propriedades {string} tagObstaculo - Tag dos obstáculos (padrão: 'obstaculo')
 * @propriedades {string} tagChao - Tag do chão (padrão: 'chao')
 */
class InfiniteRunnerController {
    constructor(entidade) {
        this.entidade = entidade;

        // === MOVIMENTO ===
        this.velocidadeInicial = 200;
        this.aceleracao = 10;
        this.velocidadeMaxima = 500;
        this.velocidadeAtual = this.velocidadeInicial;

        // === PULO ===
        this.forcaPulo = -400;
        this.gravidade = 1200;
        this.velocidadeY = 0;
        this.noChao = false;
        this.saltando = false;

        // === AGACHAMENTO ===
        this.agachando = false;
        this.alturaOriginal = entidade.altura || 64;
        this.alturaAgachado = this.alturaOriginal * 0.5;

        // === TECLAS ===
        this.teclasPulo = 'Space,w,W,ArrowUp';
        this.teclasAgachar = 's,S,ArrowDown';

        // === GAME ===
        this.tagObstaculo = 'obstaculo';
        this.tagChao = 'chao';
        this.gameOver = false;
        this.score = 0;
        this.distanciaPercorrida = 0;

        // === ESTADO ===
        this.posicaoInicialY = entidade.y;
        this.tempoJogo = 0;

        console.log('[InfiniteRunner] Inicializado - Velocidade:', this.velocidadeInicial);
    }

    atualizar(deltaTime) {
        if (this.gameOver) return;

        const dt = deltaTime;
        this.tempoJogo += dt;

        // === ACELERAR PROGRESSIVAMENTE ===
        if (this.velocidadeAtual < this.velocidadeMaxima) {
            this.velocidadeAtual += this.aceleracao * dt;
            if (this.velocidadeAtual > this.velocidadeMaxima) {
                this.velocidadeAtual = this.velocidadeMaxima;
            }
        }

        // === MOVIMENTO HORIZONTAL AUTOMÁTICO ===
        this.entidade.x += this.velocidadeAtual * dt;
        this.distanciaPercorrida += this.velocidadeAtual * dt;

        // === SCORE (1 ponto por metro) ===
        this.score = Math.floor(this.distanciaPercorrida / 100);

        // === INPUT: PULO ===
        const teclasPuloArray = this.teclasPulo.split(',');
        const puloPressed = teclasPuloArray.some(tecla =>
            this.entidade.engine.teclaPressionada(tecla.trim())
        );

        if (puloPressed && this.noChao && !this.saltando) {
            this.velocidadeY = this.forcaPulo;
            this.saltando = true;
            this.noChao = false;
            console.log('[InfiniteRunner] Pulo!');
        }

        // === INPUT: AGACHAR ===
        const teclasAgacharArray = this.teclasAgachar.split(',');
        const agacharPressed = teclasAgacharArray.some(tecla =>
            this.entidade.engine.teclaPressionada(tecla.trim())
        );

        if (agacharPressed && !this.agachando) {
            this.entidade.altura = this.alturaAgachado;
            this.agachando = true;
        } else if (!agacharPressed && this.agachando) {
            this.entidade.altura = this.alturaOriginal;
            this.agachando = false;
        }

        // === GRAVIDADE ===
        this.velocidadeY += this.gravidade * dt;
        this.entidade.y += this.velocidadeY * dt;

        // === DETECTAR CHÃO ===
        this.detectarChao();

        // === DETECTAR COLISÃO COM OBSTÁCULOS ===
        this.detectarObstaculos();

        // === RESETAR PULO QUANDO SOLTAR TECLA ===
        if (!puloPressed) {
            this.saltando = false;
        }
    }

    detectarChao() {
        if (!this.entidade.engine) return;

        // Buscar entidades com tag 'chao'
        const chaos = this.entidade.engine.entidades.filter(e =>
            e.tags && e.tags.some(t => t.toLowerCase() === this.tagChao)
        );

        this.noChao = false;

        for (const chao of chaos) {
            // Verificar se está acima e próximo do chão
            const playerBottom = this.entidade.y + this.entidade.altura;
            const chaoTop = chao.y;

            // Verificar sobreposição horizontal
            const playerRight = this.entidade.x + this.entidade.largura;
            const playerLeft = this.entidade.x;
            const chaoRight = chao.x + chao.largura;
            const chaoLeft = chao.x;

            const sobreposicaoHorizontal = playerRight > chaoLeft && playerLeft < chaoRight;

            if (sobreposicaoHorizontal && playerBottom >= chaoTop && this.velocidadeY >= 0) {
                // Colocar em cima do chão
                this.entidade.y = chaoTop - this.entidade.altura;
                this.velocidadeY = 0;
                this.noChao = true;
                break;
            }
        }

        // Fallback: chão na posição inicial
        if (!this.noChao && this.entidade.y >= this.posicaoInicialY) {
            this.entidade.y = this.posicaoInicialY;
            this.velocidadeY = 0;
            this.noChao = true;
        }
    }

    detectarObstaculos() {
        if (!this.entidade.engine) return;

        // Buscar obstáculos
        const obstaculos = this.entidade.engine.entidades.filter(e =>
            e.tags && e.tags.some(t => t.toLowerCase() === this.tagObstaculo)
        );

        for (const obstaculo of obstaculos) {
            if (this.checarColisaoAABB(this.entidade, obstaculo)) {
                this.triggerGameOver();
                break;
            }
        }
    }

    checarColisaoAABB(a, b) {
        return a.x < b.x + b.largura &&
            a.x + a.largura > b.x &&
            a.y < b.y + b.altura &&
            a.y + a.altura > b.y;
    }

    triggerGameOver() {
        if (this.gameOver) return;

        this.gameOver = true;
        this.entidade.engine.simulado = false;  // Pausa o jogo

        console.log('[InfiniteRunner] GAME OVER!');
        console.log('[InfiniteRunner] Score Final:', this.score);
        console.log('[InfiniteRunner] Distância:', Math.floor(this.distanciaPercorrida), 'pixels');

        // Mostrar mensagem de Game Over
        this.mostrarGameOver();
    }

    mostrarGameOver() {
        // Criar overlay de Game Over
        if (!this.entidade.engine) return;

        // Buscar ou criar entidade de UI
        let gameOverUI = this.entidade.engine.entidades.find(e => e.nome === 'GameOverUI');

        if (!gameOverUI) {
            console.log('[InfiniteRunner] Crie uma entidade "GameOverUI" com UIComponent para exibir o Game Over');
        } else {
            const ui = gameOverUI.obterComponente('UIComponent');
            if (ui) {
                ui.ativo = true;
                // Atualizar texto do score se existir
                const textoScore = ui.elementos.find(el => el.id === 'score_text');
                if (textoScore) {
                    textoScore.textoFixo = `SCORE: ${this.score}`;
                }
            }
        }
    }

    renderizar(ctx) {
        // Debug: Desenhar velocidade e score
        if (this.entidade.selecionada && ctx) {
            ctx.save();
            ctx.fillStyle = '#00ff00';
            ctx.font = '12px monospace';
            ctx.fillText(`Vel: ${Math.floor(this.velocidadeAtual)}`, this.entidade.x, this.entidade.y - 20);
            ctx.fillText(`Score: ${this.score}`, this.entidade.x, this.entidade.y - 35);
            ctx.restore();
        }
    }

    reiniciar() {
        this.gameOver = false;
        this.velocidadeAtual = this.velocidadeInicial;
        this.score = 0;
        this.distanciaPercorrida = 0;
        this.tempoJogo = 0;
        this.entidade.x = 100;  // Posição inicial
        this.entidade.y = this.posicaoInicialY;
        this.velocidadeY = 0;
        this.noChao = false;
        this.saltando = false;
        this.agachando = false;
        this.entidade.altura = this.alturaOriginal;

        if (this.entidade.engine) {
            this.entidade.engine.simulado = true;
        }

        console.log('[InfiniteRunner] Jogo reiniciado');
    }
}

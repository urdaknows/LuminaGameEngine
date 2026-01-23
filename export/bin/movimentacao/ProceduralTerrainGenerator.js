/**
 * ProceduralTerrainGenerator
 * 
 * Gera terreno e obstáculos automaticamente para Infinite Runner
 * Sistema de pooling para performance (reutiliza entidades)
 * 
 * @propriedades {number} chunkSize - Tamanho de cada seção de terreno (padrão: 1000)
 * @propriedades {number} distanciaGeracao - Distância à frente do player para gerar (padrão: 2000)
 * @propriedades {number} distanciaRemocao - Distância atrás do player para remover (padrão: -500)
 * @propriedades {number} alturaChao - Altura Y do chão (padrão: 500)
 * @propriedades {number} espessuraChao - Espessura do chão (padrão: 100)
 * @propriedades {number} minDistanciaObstaculos - Distância mínima entre obstáculos (padrão: 200)
 * @propriedades {number} maxDistanciaObstaculos - Distância máxima entre obstáculos (padrão: 500)
 * @propriedades {number} chanceObstaculo - Chance de spawn (0-100) (padrão: 60)
 */
class ProceduralTerrainGenerator {
    constructor(entidade) {
        this.entidade = entidade;

        // === CONFIGURAÇÃO DO TERRENO ===
        this.chunkSize = 1000;
        this.distanciaGeracao = 2000;
        this.distanciaRemocao = -500;
        this.alturaChao = 500;
        this.espessuraChao = 100;

        // === CONFIGURAÇÃO DOS OBSTÁCULOS ===
        this.minDistanciaObstaculos = 200;
        this.maxDistanciaObstaculos = 500;
        this.chanceObstaculo = 60;  // 60% de chance
        this.larguraObstaculo = 32;
        this.alturaObstaculo = 64;

        // === ESTADO ===
        this.ultimaPosicaoGerada = 0;
        this.proximoObstaculoX = 500;  // Primeiro obstáculo em 500px
        this.chunksAtivos = [];
        this.obstaculosAtivos = [];

        // === POOL DE OBJETOS (Performance) ===
        this.poolChao = [];
        this.poolObstaculos = [];

        console.log('[ProceduralTerrain] Inicializado');
    }

    atualizar(deltaTime) {
        if (!this.entidade.engine) return;

        // Buscar player
        const player = this.entidade.engine.entidades.find(e =>
            e.tags && e.tags.some(t => t.toLowerCase() === 'player')
        );

        if (!player) return;

        const playerX = player.x;

        // GERAR TERRENO À FRENTE
        while (this.ultimaPosicaoGerada < playerX + this.distanciaGeracao) {
            this.gerarChunk();
        }

        // GERAR OBSTÁCULOS
        while (this.proximoObstaculoX < playerX + this.distanciaGeracao) {
            if (Math.random() * 100 < this.chanceObstaculo) {
                this.gerarObstaculo(this.proximoObstaculoX);
            }

            // Próximo obstáculo
            const distancia = this.minDistanciaObstaculos +
                Math.random() * (this.maxDistanciaObstaculos - this.minDistanciaObstaculos);
            this.proximoObstaculoX += distancia;
        }

        // REMOVER CHUNKS E OBSTÁCULOS DISTANTES
        this.limparDistantes(playerX);
    }

    gerarChunk() {
        let chunk = this.poolChao.pop();

        if (!chunk) {
            // Criar novo se pool vazio
            chunk = this.criarNovoChao();
        }

        // Posicionar chunk
        chunk.x = this.ultimaPosicaoGerada;
        chunk.y = this.alturaChao;
        chunk.largura = this.chunkSize;
        chunk.altura = this.espessuraChao;
        chunk.visivel = true;

        // Adicionar ao engine se ainda não foi
        if (!this.entidade.engine.entidades.includes(chunk)) {
            this.entidade.engine.entidades.push(chunk);
        }

        this.chunksAtivos.push(chunk);
        this.ultimaPosicaoGerada += this.chunkSize;
    }

    gerarObstaculo(x) {
        let obstaculo = this.poolObstaculos.pop();

        if (!obstaculo) {
            obstaculo = this.criarNovoObstaculo();
        }

        // Posicionar obstáculo (em cima do chão)
        obstaculo.x = x;
        obstaculo.y = this.alturaChao - this.alturaObstaculo;
        obstaculo.largura = this.larguraObstaculo;
        obstaculo.altura = this.alturaObstaculo;
        obstaculo.visivel = true;

        // Adicionar ao engine
        if (!this.entidade.engine.entidades.includes(obstaculo)) {
            this.entidade.engine.entidades.push(obstaculo);
        }

        this.obstaculosAtivos.push(obstaculo);
    }

    criarNovoChao() {
        const Entidade = this.entidade.constructor;  // Pegar classe Entidade
        const chunk = new Entidade('Chao');
        chunk.tags = ['chao'];
        chunk.cor = '#8B4513';  // Marrom
        return chunk;
    }

    criarNovoObstaculo() {
        const Entidade = this.entidade.constructor;
        const obstaculo = new Entidade('Obstaculo');
        obstaculo.tags = ['obstaculo'];
        obstaculo.cor = '#FF4444';  // Vermelho
        return obstaculo;
    }

    limparDistantes(playerX) {
        // LIMPAR CHUNKS
        this.chunksAtivos = this.chunksAtivos.filter(chunk => {
            if (chunk.x + chunk.largura < playerX + this.distanciaRemocao) {
                // Esconder e retornar ao pool
                chunk.visivel = false;
                this.poolChao.push(chunk);
                return false;  // Remover da lista de ativos
            }
            return true;  // Manter
        });

        // LIMPAR OBSTÁCULOS
        this.obstaculosAtivos = this.obstaculosAtivos.filter(obstaculo => {
            if (obstaculo.x < playerX + this.distanciaRemocao) {
                // Esconder e retornar ao pool
                obstaculo.visivel = false;
                this.poolObstaculos.push(obstaculo);
                return false;
            }
            return true;
        });
    }

    renderizar(ctx) {
        // Debug: Mostrar quantidade de chunks e obstáculos ativos
        if (this.entidade.selecionada && ctx) {
            ctx.save();
            ctx.fillStyle = '#00ff00';
            ctx.font = '12px monospace';
            ctx.fillText(`Chunks: ${this.chunksAtivos.length}`, 10, 50);
            ctx.fillText(`Obstáculos: ${this.obstaculosAtivos.length}`, 10, 65);
            ctx.fillText(`Pool Chão: ${this.poolChao.length}`, 10, 80);
            ctx.fillText(`Pool Obs: ${this.poolObstaculos.length}`, 10, 95);
            ctx.restore();
        }
    }
}

/**
 * Camera 2D - Sistema de câmera para o editor
 * Permite zoom e pan no canvas
 */

class Camera {
    constructor(canvasWidth, canvasHeight) {
        this.x = 0;
        this.y = 0;
        this.zoom = 1.0;
        this.minZoom = 0.1;
        this.maxZoom = 5.0;

        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        // Estado de arrasto
        this.arrastando = false;
        this.ultimaPosicaoMouse = { x: 0, y: 0 };
    }

    /**
     * Converte coordenadas da tela para coordenadas do mundo
     */
    telaParaMundo(telaX, telaY) {
        return {
            x: (telaX / this.zoom) + this.x,
            y: (telaY / this.zoom) + this.y
        };
    }

    /**
     * Converte coordenadas do mundo para coordenadas da tela
     */
    mundoParaTela(mundoX, mundoY) {
        return {
            x: (mundoX - this.x) * this.zoom,
            y: (mundoY - this.y) * this.zoom
        };
    }

    /**
     * Aplica transformação da câmera ao contexto
     */
    aplicarTransformacao(ctx) {
        // Safety Clean
        if (isNaN(this.x) || isNaN(this.y)) {
            this.x = 0;
            this.y = 0;
        }

        ctx.save();
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }

    /**
     * Remove transformação da câmera
     */
    removerTransformacao(ctx) {
        ctx.restore();
    }

    /**
     * Define o zoom da câmera
     */
    definirZoom(novoZoom, pontoFoco = null) {
        const zoomAnterior = this.zoom;
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, novoZoom));

        // Se há um ponto de foco (ex: posição do mouse), ajusta a câmera
        // para que o zoom seja centrado nesse ponto
        if (pontoFoco) {
            const mundoAntes = this.telaParaMundo(pontoFoco.x, pontoFoco.y);
            // Após mudar o zoom, recalcula
            const fator = this.zoom / zoomAnterior;
            this.x = mundoAntes.x - (pontoFoco.x / this.zoom);
            this.y = mundoAntes.y - (pontoFoco.y / this.zoom);
        }

        return this.zoom;
    }

    /**
     * Aumenta o zoom
     */
    aumentarZoom(incremento = 0.025, pontoFoco = null) {
        return this.definirZoom(this.zoom + incremento, pontoFoco);
    }

    /**
     * Diminui o zoom
     */
    diminuirZoom(decremento = 0.1, pontoFoco = null) {
        return this.definirZoom(this.zoom - decremento, pontoFoco);
    }

    /**
     * Move a câmera (pan)
     */
    mover(deltaX, deltaY) {
        this.x += deltaX / this.zoom;
        this.y += deltaY / this.zoom;
    }

    /**
     * Centraliza a câmera em um ponto do mundo
     */
    centralizarEm(mundoX, mundoY) {
        if (isNaN(mundoX) || isNaN(mundoY)) {
            console.warn('[Camera] centralizarEm recebeu NaN, ignorando.');
            return;
        }
        this.x = mundoX - (this.canvasWidth / 2) / this.zoom;
        this.y = mundoY - (this.canvasHeight / 2) / this.zoom;

        // Safety Clean
        if (isNaN(this.x) || isNaN(this.y)) {
            this.x = 0;
            this.y = 0;
        }
    }

    /**
     * Reseta a câmera para posição inicial
     */
    resetar() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1.0;
    }

    /**
     * Atualiza o tamanho do canvas
     */
    atualizarTamanho(largura, altura) {
        this.canvasWidth = largura;
        this.canvasHeight = altura;
    }

    /**
     * Obtém o percentual de zoom para exibição
     */
    obterPercentualZoom() {
        return Math.round(this.zoom * 100);
    }

    /**
     * Verifica se uma entidade está no viewport (Frustum Culling)
     * @param {Object} entidade - Entidade a ser verificada
     * @param {number} margem - Margem extra em pixels (padrão: 100)
     * @returns {boolean} true se entidade está visível
     */
    estaNoViewport(entidade, margem = 100) {
        if (!entidade) return false;

        // Entidades sem posição ou tamanho são sempre renderizadas (UI, etc)
        if (entidade.x === undefined || entidade.y === undefined) return true;

        // Calcula viewport em coordenadas do mundo
        const viewportLeft = this.x - (margem / this.zoom);
        const viewportRight = this.x + (this.canvasWidth / this.zoom) + (margem / this.zoom);
        const viewportTop = this.y - (margem / this.zoom);
        const viewportBottom = this.y + (this.canvasHeight / this.zoom) + (margem / this.zoom);

        // Calcula bounds da entidade
        const entLeft = entidade.x;
        const entRight = entidade.x + (entidade.largura || 0);
        const entTop = entidade.y;
        const entBottom = entidade.y + (entidade.altura || 0);

        // Verifica sobreposição (AABB)
        const sobreposicaoHorizontal = entRight > viewportLeft && entLeft < viewportRight;
        const sobreposicaoVertical = entBottom > viewportTop && entTop < viewportBottom;

        return sobreposicaoHorizontal && sobreposicaoVertical;
    }
}

export default Camera;

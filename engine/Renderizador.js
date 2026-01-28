/**
 * Renderizador - Sistema de renderização 2D
 * Gerencia o canvas e desenho de entidades
 */
class Renderizador {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.camera = { x: 0, y: 0 };
        this.corFundo = '#1a1a2e';

        // Flag global de suavização (padrão: desligado para pixel art)
        this.imageSmoothingEnabledDefault = false;

        // Desativar suavização para deixar os pixels nítidos (ideal para pixel art)
        this._configurarImageSmoothing();
    }

    /**
     * Limpa o canvas
     */
    limpar() {
        this.ctx.fillStyle = this.corFundo;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Desenha um retângulo
     */
    desenharRetangulo(x, y, largura, altura, cor = '#ffffff') {
        this.ctx.fillStyle = cor;
        this.ctx.fillRect(
            x,
            y,
            largura,
            altura
        );
    }

    /**
     * Desenha um círculo
     */
    desenharCirculo(x, y, raio, cor = '#ffffff') {
        this.ctx.fillStyle = cor;
        this.ctx.beginPath();
        this.ctx.arc(
            x,
            y,
            raio,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    /**
     * Desenha texto
     */
    desenharTexto(texto, x, y, cor = '#ffffff', tamanho = 16, alinhamento = 'left') {
        this.ctx.fillStyle = cor;
        this.ctx.font = `${tamanho}px Arial`;
        this.ctx.textAlign = alinhamento;
        this.ctx.fillText(texto, x, y);
    }

    /**
     * Desenha uma linha
     */
    desenharLinha(x1, y1, x2, y2, cor = '#ffffff', espessura = 1) {
        this.ctx.strokeStyle = cor;
        this.ctx.lineWidth = espessura;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    /**
     * Desenha um retângulo vazio (apenas borda)
     */
    desenharRetanguloVazio(x, y, largura, altura, cor = '#ffffff', espessura = 1) {
        this.ctx.strokeStyle = cor;
        this.ctx.lineWidth = espessura;
        this.ctx.strokeRect(
            x,
            y,
            largura,
            altura
        );
    }


    /**
     * Define a posição da câmera
     */
    definirCamera(x, y) {
        this.camera.x = x;
        this.camera.y = y;
    }

    /**
     * Centraliza a câmera em um ponto
     */
    centralizarCamera(x, y) {
        this.camera.x = x - this.canvas.width / 2;
        this.camera.y = y - this.canvas.height / 2;
    }

    /**
     * Define a cor de fundo
     */
    definirCorFundo(cor) {
        this.corFundo = cor;
    }

    /**
     * Redimensiona o canvas
     */
    redimensionar(largura, altura) {
        this.canvas.width = largura;
        this.canvas.height = altura;

        // Redefinir configuração de suavização (é resetada ao mudar width/height)
        this._configurarImageSmoothing();
    }

    /**
     * Define suavização global (true = suavizar, false = pixel art nítida)
     */
    setImageSmoothing(enabled) {
        this.imageSmoothingEnabledDefault = !!enabled;
        this._configurarImageSmoothing();
    }

    /**
     * Configura o modo de suavização de imagem do contexto 2D
     * (chamado no construtor e após cada redimensionamento)
     */
    _configurarImageSmoothing() {
        if (!this.ctx) return;
        const enabled = !!this.imageSmoothingEnabledDefault;
        this.ctx.imageSmoothingEnabled = enabled;
        // Compatibilidade com navegadores antigos
        this.ctx.mozImageSmoothingEnabled = enabled;
        this.ctx.webkitImageSmoothingEnabled = enabled;
        this.ctx.msImageSmoothingEnabled = enabled;
    }
}

export default Renderizador;

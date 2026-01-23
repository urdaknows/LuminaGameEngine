/**
 * LightComponent - Adiciona iluminação dinâmica a entidades
 * 
 * Tipos de luz:
 * - 'point': Luz radial (360°) - tocha, lampião
 * - 'spotlight': Luz direcional (cone) - lanterna
 * - 'ambient': Luz global (ilumina tudo)
 */
class LightComponent {
    constructor() {
        this.tipo = 'LightComponent';
        this.nome = 'Luz';
        this.ativo = true;

        // Tipo de luz
        this.tipoLuz = 'point'; // 'point', 'spotlight', 'ambient'

        // Propriedades da luz
        this.cor = '#ffdd88'; // Cor da luz (hex)
        this.intensidade = 1.0; // 0.0 a 2.0
        this.raio = 200; // Alcance em pixels
        this.atenuacao = 1.0; // Quão rápido escurece (0.5 = suave, 2.0 = abrupto)

        // Spotlight específico
        this.angulo = 0; // Direção em graus (0 = direita, 90 = baixo)
        this.coneAngulo = 45; // Abertura do cone em graus

        // Offset da luz em relação à entidade
        this.offsetX = 0;
        this.offsetY = 0;

        // Efeitos
        this.flickering = false; // Luz tremula (tocha)
        this.flickerSpeed = 5.0; // Velocidade da tremulação
        this.flickerAmount = 0.2; // Intensidade da tremulação (0-1)

        // Estado interno
        this.entidade = null;
        this._flickerTime = 0;
        this._currentIntensity = this.intensidade;
    }

    inicializar(entidade) {
        this.entidade = entidade;
    }

    atualizar(entidade, deltaTime) {
        if (!this.ativo) return;

        // Efeito de tremulação (flickering)
        if (this.flickering) {
            this._flickerTime += deltaTime * this.flickerSpeed;
            const flicker = Math.sin(this._flickerTime) * this.flickerAmount;
            this._currentIntensity = this.intensidade + flicker;
            this._currentIntensity = Math.max(0, Math.min(2.0, this._currentIntensity));
        } else {
            this._currentIntensity = this.intensidade;
        }
    }

    /**
     * Obtém a posição mundial da luz
     */
    obterPosicaoMundial() {
        if (!this.entidade) return { x: 0, y: 0 };

        return {
            x: this.entidade.x + this.entidade.largura / 2 + this.offsetX,
            y: this.entidade.y + this.entidade.altura / 2 + this.offsetY
        };
    }

    /**
     * Renderiza preview da luz no editor (modo debug)
     */
    renderizar(renderizador) {
        if (!renderizador.debugMode) return;

        const ctx = renderizador.ctx;
        const pos = this.obterPosicaoMundial();

        ctx.save();

        // Desenhar círculo indicando alcance
        ctx.strokeStyle = this.cor;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, this.raio, 0, Math.PI * 2);
        ctx.stroke();

        // Desenhar centro da luz
        ctx.fillStyle = this.cor;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Se for spotlight, desenhar cone
        if (this.tipoLuz === 'spotlight') {
            const angleRad = this.angulo * Math.PI / 180;
            const coneRad = this.coneAngulo * Math.PI / 180;

            ctx.strokeStyle = this.cor;
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.arc(pos.x, pos.y, this.raio, angleRad - coneRad / 2, angleRad + coneRad / 2);
            ctx.closePath();
            ctx.stroke();
        }

        ctx.restore();
    }

    serializar() {
        return {
            tipo: 'LightComponent',
            tipoLuz: this.tipoLuz,
            cor: this.cor,
            intensidade: this.intensidade,
            raio: this.raio,
            atenuacao: this.atenuacao,
            angulo: this.angulo,
            coneAngulo: this.coneAngulo,
            offsetX: this.offsetX,
            offsetY: this.offsetY,
            flickering: this.flickering,
            flickerSpeed: this.flickerSpeed,
            flickerAmount: this.flickerAmount,
            ativo: this.ativo
        };
    }

    desserializar(dados) {
        this.tipoLuz = dados.tipoLuz || 'point';
        this.cor = dados.cor || '#ffdd88';
        this.intensidade = dados.intensidade !== undefined ? dados.intensidade : 1.0;
        this.raio = dados.raio || 200;
        this.atenuacao = dados.atenuacao !== undefined ? dados.atenuacao : 1.0;
        this.angulo = dados.angulo || 0;
        this.coneAngulo = dados.coneAngulo || 45;
        this.offsetX = dados.offsetX || 0;
        this.offsetY = dados.offsetY || 0;
        this.flickering = dados.flickering || false;
        this.flickerSpeed = dados.flickerSpeed || 5.0;
        this.flickerAmount = dados.flickerAmount || 0.2;
        this.ativo = dados.ativo !== undefined ? dados.ativo : true;
    }
}

export default LightComponent;

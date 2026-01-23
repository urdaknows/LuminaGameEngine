/**
 * LightingSystem - Gerencia e renderiza iluminação dinâmica
 * 
 * Renderiza luzes usando canvas compositing para criar efeitos realistas.
 */
class LightingSystem {
    constructor(renderizador) {
        this.renderizador = renderizador;
        this.ctx = renderizador.ctx;

        // Configuração global de iluminação
        this.ativo = true;
        this.corAmbiente = '#000000'; // Cor da escuridão/sombra
        this.intensidadeAmbiente = 0.3; // 0.0 = totalmente escuro, 1.0 = totalmente claro

        // Canvas off-screen para luzes
        this.lightCanvas = document.createElement('canvas');
        this.lightCtx = this.lightCanvas.getContext('2d');

        // Atualizar tamanho do canvas de luz
        this.atualizarTamanho();
    }

    atualizarTamanho() {
        // Expandir canvas de luz para 200% (2x) da tela
        // Isso garante que a escuridão cubra além das bordas
        this.escala = 2.0;
        this.lightCanvas.width = this.ctx.canvas.width * this.escala;
        this.lightCanvas.height = this.ctx.canvas.height * this.escala;

        // Calcular offset para centralizar
        this.offsetX = (this.lightCanvas.width - this.ctx.canvas.width) / 2;
        this.offsetY = (this.lightCanvas.height - this.ctx.canvas.height) / 2;
    }

    /**
     * Renderiza todas as luzes das entidades
     */
    renderizar(entidades, camera) {
        if (!this.ativo) return;

        // Garantir que canvas de luz tem tamanho correto
        if (this.lightCanvas.width !== this.ctx.canvas.width ||
            this.lightCanvas.height !== this.ctx.canvas.height) {
            this.atualizarTamanho();
        }

        // Coletar todas as luzes ativas
        const luzes = [];
        for (const entidade of entidades) {
            const lightComp = entidade.obterComponente?.('LightComponent');
            if (lightComp && lightComp.ativo) {
                luzes.push({ entidade, light: lightComp });
            }
        }

        if (luzes.length === 0) return;

        // Limpar canvas de luz
        this.lightCtx.clearRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);

        // Desenhar escuridão base (ambient light)
        this.lightCtx.fillStyle = this.corAmbiente;
        this.lightCtx.globalAlpha = 1.0 - this.intensidadeAmbiente;
        this.lightCtx.fillRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);
        this.lightCtx.globalAlpha = 1.0;

        // Renderizar cada luz
        for (const { light } of luzes) {
            this.renderizarLuz(light, camera);
        }

        // Aplicar iluminação no canvas principal
        // Desenhar com offset negativo para centralizar o canvas expandido
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'multiply';
        this.ctx.drawImage(
            this.lightCanvas,
            -(this.offsetX || 0),
            -(this.offsetY || 0)
        );
        this.ctx.restore();
    }

    /**
     * Renderiza uma luz individual
     */
    renderizarLuz(light, camera) {
        const pos = light.obterPosicaoMundial();

        // IMPORTANTE: Usar coordenadas do mundo + offset do canvas expandido
        // A transformação da câmera JÁ foi aplicada ao contexto principal
        const worldX = pos.x + (this.offsetX || 0);
        const worldY = pos.y + (this.offsetY || 0);

        this.lightCtx.save();

        // Criar gradiente radial
        if (light.tipoLuz === 'point') {
            this.renderizarPointLight(worldX, worldY, light);
        } else if (light.tipoLuz === 'spotlight') {
            this.renderizarSpotlight(worldX, worldY, light);
        } else if (light.tipoLuz === 'ambient') {
            this.renderizarAmbientLight(light);
        }

        this.lightCtx.restore();
    }

    /**
     * Renderiza luz radial (point light)
     */
    renderizarPointLight(x, y, light) {
        const gradient = this.lightCtx.createRadialGradient(x, y, 0, x, y, light.raio);

        // Converter cor hex para RGB
        const rgb = this.hexToRgb(light.cor);
        const intensity = light._currentIntensity || light.intensidade;

        // Gradiente: centro claro → borda escura
        gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
        gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${intensity * 0.6})`);
        gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

        this.lightCtx.globalCompositeOperation = 'lighter'; // Aditivo
        this.lightCtx.fillStyle = gradient;
        this.lightCtx.fillRect(x - light.raio, y - light.raio, light.raio * 2, light.raio * 2);
    }

    /**
     * Renderiza luz direcional (spotlight)
     */
    renderizarSpotlight(x, y, light) {
        const angleRad = light.angulo * Math.PI / 180;
        const coneRad = light.coneAngulo * Math.PI / 180;

        // Criar gradiente radial para spotlight
        const gradient = this.lightCtx.createRadialGradient(x, y, 0, x, y, light.raio);

        const rgb = this.hexToRgb(light.cor);
        const intensity = light._currentIntensity || light.intensidade;

        gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
        gradient.addColorStop(0.7, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${intensity * 0.5})`);
        gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

        this.lightCtx.globalCompositeOperation = 'lighter';

        // Criar clip path para cone
        this.lightCtx.beginPath();
        this.lightCtx.moveTo(x, y);
        this.lightCtx.arc(x, y, light.raio, angleRad - coneRad / 2, angleRad + coneRad / 2);
        this.lightCtx.closePath();
        this.lightCtx.clip();

        this.lightCtx.fillStyle = gradient;
        this.lightCtx.fillRect(x - light.raio, y - light.raio, light.raio * 2, light.raio * 2);
    }

    /**
     * Renderiza luz ambiente (global)
     */
    renderizarAmbientLight(light) {
        const rgb = this.hexToRgb(light.cor);
        const intensity = light._currentIntensity || light.intensidade;

        this.lightCtx.globalCompositeOperation = 'lighter';
        this.lightCtx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${intensity * 0.3})`;
        this.lightCtx.fillRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);
    }

    /**
     * Converte hex para RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }

    /**
     * Ativa/desativa o sistema
     */
    setAtivo(ativo) {
        this.ativo = ativo;
    }

    /**
     * Define iluminação ambiente
     */
    setAmbiente(cor, intensidade) {
        this.corAmbiente = cor;
        this.intensidadeAmbiente = intensidade;
    }

    /**
     * Serializa configurações globais
     */
    serializar() {
        return {
            ativo: this.ativo,
            corAmbiente: this.corAmbiente,
            intensidadeAmbiente: this.intensidadeAmbiente
        };
    }

    /**
     * Carrega configurações globais
     */
    desserializar(dados) {
        if (!dados) return;
        this.ativo = dados.ativo !== undefined ? dados.ativo : true;
        this.corAmbiente = dados.corAmbiente || '#000000';
        this.intensidadeAmbiente = dados.intensidadeAmbiente !== undefined ? dados.intensidadeAmbiente : 0.3;
    }
}

export default LightingSystem;

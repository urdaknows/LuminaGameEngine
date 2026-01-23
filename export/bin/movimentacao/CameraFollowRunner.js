/**
 * CameraFollowRunner
 * 
 * Câmera que segue o player horizontalmente em jogos de corrida
 * Mantém o player centralizado ou em posição fixa na tela
 * 
 * @propriedades {string} targetTag - Tag do alvo (padrão: 'player')
 * @propriedades {number} offsetX - Deslocamento horizontal da câmera (padrão: -300)
 * @propriedades {number} offsetY - Deslocamento vertical da câmera (padrão: 0)
 * @propriedades {boolean} smoothFollow - Suavização de movimento (padrão: true)
 * @propriedades {number} smoothSpeed - Velocidade de suavização (padrão: 5)
 */
class CameraFollowRunner {
    constructor(entidade) {
        this.entidade = entidade;

        // Configuração
        this.targetTag = 'player';
        this.offsetX = -300;  // Player fica 300px à direita da borda esquerda
        this.offsetY = 0;
        this.smoothFollow = true;
        this.smoothSpeed = 5;

        this.target = null;

        console.log('[CameraFollow] Inicializado');
    }

    atualizar(deltaTime) {
        if (!this.entidade.engine || !this.entidade.engine.camera) return;

        // Buscar target se não encontrado
        if (!this.target) {
            this.target = this.entidade.engine.entidades.find(e =>
                e.tags && e.tags.some(t => t.toLowerCase() === this.targetTag)
            );

            if (!this.target) return;
        }

        const camera = this.entidade.engine.camera;

        // Posição desejada da câmera (centraliza no player + offset)
        const targetCamX = this.target.x + (this.target.largura / 2) + this.offsetX;
        const targetCamY = this.target.y + (this.target.altura / 2) + this.offsetY;

        if (this.smoothFollow) {
            // Movimento suave (lerp)
            const lerpFactor = Math.min(1, this.smoothSpeed * deltaTime);
            camera.x += (targetCamX - camera.x) * lerpFactor;
            camera.y += (targetCamY - camera.y) * lerpFactor;
        } else {
            // Movimento direto
            camera.x = targetCamX;
            camera.y = targetCamY;
        }
    }
}

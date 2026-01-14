/**
 * LoopJogo - Gerencia o loop principal do jogo
 * Responsável por coordenar atualizações e renderização
 */
class LoopJogo {
    constructor(engine) {
        this.engine = engine;
        this.tempoAnterior = 0;
        this.fps = 60;
        this.intervaloFrame = 1000 / this.fps;
        this.rodando = false;
        this.animationFrameId = null;

        // FPS Calc
        this.currentFps = 0;
        this.framesThisSecond = 0;
        this.lastFpsUpdate = 0;
    }

    /**
     * Inicia o loop do jogo
     */
    iniciar() {
        if (this.rodando) return;

        this.rodando = true;
        this.tempoAnterior = performance.now();
        this.loop(this.tempoAnterior);
    }

    /**
     * Para o loop do jogo
     */
    parar() {
        this.rodando = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Loop principal usando requestAnimationFrame
     */
    loop(tempoAtual) {
        if (!this.rodando) return;

        // Calcula deltaTime em segundos
        let deltaTime = (tempoAtual - this.tempoAnterior) / 1000;

        // Clamp deltaTime (Max 0.1s = 10 FPS) to prevent physics explosion/tunneling on lag spikes
        if (deltaTime > 0.1) deltaTime = 0.1;

        this.tempoAnterior = tempoAtual;

        // FPS Update
        if (tempoAtual - this.lastFpsUpdate >= 1000) {
            this.currentFps = this.framesThisSecond;
            this.framesThisSecond = 0;
            this.lastFpsUpdate = tempoAtual;
        }
        this.framesThisSecond++;

        // Atualiza a engine
        this.engine.atualizar(deltaTime);

        // Renderiza
        this.engine.renderizar();

        // Próximo frame
        this.animationFrameId = requestAnimationFrame((tempo) => this.loop(tempo));
    }

    /**
     * Define o FPS alvo
     */
    definirFPS(fps) {
        this.fps = fps;
        this.intervaloFrame = 1000 / this.fps;
    }
}

export default LoopJogo;

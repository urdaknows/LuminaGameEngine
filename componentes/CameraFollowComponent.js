/**
 * CameraFollowComponent - Faz a câmera seguir a entidade
 */
class CameraFollowComponent {
    constructor() {
        this.tipo = 'CameraFollowComponent';
        this.nome = 'Câmera Follow';
        this.ativo = true;

        // Propriedades configuráveis
        this.smoothSpeed = 0.1; // 0.1 = suave, 1.0 = instantâneo
        this.offsetX = 0;
        this.offsetY = 0;

        // Estado interno
        this.entidade = null;
    }

    /**
     * Inicializa o componente
     */
    inicializar(entidade) {
        this.entidade = entidade;
    }

    getPropriedades() {
        return [
            { nome: 'smoothSpeed', tipo: 'number', label: 'Suavidade', min: 0.001, max: 1.0, step: 0.005, valor: this.smoothSpeed },
            { nome: 'offsetX', tipo: 'number', label: 'Offset X', valor: this.offsetX },
            { nome: 'offsetY', tipo: 'number', label: 'Offset Y', valor: this.offsetY }
        ];
    }

    /**
     * Atualiza a posição da câmera
     */
    atualizar(entidade, deltaTime) {
        if (!this.ativo || !entidade.engine || !entidade.engine.camera) return;

        const camera = entidade.engine.camera;
        const centroEntidade = entidade.obterCentro();

        // Alvo (Centro da entidade + Offset)
        // Centralizamos a câmera, então queremos que o centro da tela vá para o alvo
        // A câmera foca no CENTRO, não no TopLeft.

        // A função centralizarEm(x, y) da câmera já faz o cálculo de canvas/2
        // Mas para smooth, precisamos ler a posição atual da camera

        const targetX = centroEntidade.x + this.offsetX;
        const targetY = centroEntidade.y + this.offsetY;

        // Current Camera Center (Mundo)
        // Camera.x/y é o TopLeft do view no mundo.
        // CentroAtual = Camera.x + (CanvasW/2)/Zoom
        const viewW = camera.canvasWidth / camera.zoom;
        const viewH = camera.canvasHeight / camera.zoom;
        const currentCenterX = camera.x + viewW / 2;
        const currentCenterY = camera.y + viewH / 2;

        // Lerp (Interpolação Linear) com DeltaTime
        // Ajuste de frame rate (assumindo base 60fps ~ 16ms)
        // Se smoothSpeed = 0.1, queremos 10% por frame a 60fps.
        // Com deltaTime: fator = smoothSpeed * (deltaTime / (1/60)) = smoothSpeed * deltaTime * 60

        let t = this.smoothSpeed * (deltaTime * 60);
        // Clamp t para evitar overshooting com lag spikes
        t = Math.max(0, Math.min(1, t));

        const newCenterX = currentCenterX + (targetX - currentCenterX) * t;
        const newCenterY = currentCenterY + (targetY - currentCenterY) * t;

        // Aplica na câmera
        camera.centralizarEm(newCenterX, newCenterY);
    }

    /**
     * Desenha debug no editor (opcional)
     */
    renderizar(renderizador) {
        // Não precisa desenhar nada visualmente no jogo
    }

    /**
     * Serialização para salvar
     */
    serializar() {
        return {
            tipo: 'CameraFollowComponent',
            // Flat properties
            smoothSpeed: this.smoothSpeed,
            offsetX: this.offsetX,
            offsetY: this.offsetY,
            ativo: this.ativo
        };
    }

    desserializar(dados) {
        // Robustez: aceita flat ou config-wrapped
        const cfg = dados.config || dados;

        this.smoothSpeed = cfg.smoothSpeed !== undefined ? cfg.smoothSpeed : 0.1;
        this.offsetX = cfg.offsetX || 0;
        this.offsetY = cfg.offsetY || 0;
        this.ativo = cfg.ativo !== undefined ? cfg.ativo : true;
    }

    /**
     * Desserialização (Static ou método helper se usar factory genérica)
     * Mas aqui geralmente instanciamos e setamos as props diretamente no loader
     */
    destruir() {
        this.entidade = null;
    }
}

export default CameraFollowComponent;

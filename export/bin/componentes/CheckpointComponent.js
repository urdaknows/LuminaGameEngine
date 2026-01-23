
export default class CheckpointComponent {
    constructor(entidade) {
        this.entidade = entidade;
        this.tipo = 'CheckpointComponent';
        this.nome = 'Checkpoint';
        this.ativo = true;
    }

    inicializar(entidade) {
        this.entidade = entidade;
        const colComp = entidade.obterComponente('CollisionComponent');
        if (!colComp) {
            console.warn('[Checkpoint] Requer CollisionComponent (Trigger)!');
        } else if (!colComp.isTrigger) {
            colComp.isTrigger = true; // Força ser trigger
        }
    }

    atualizar(entidade, dt) {
        // Lógica visual futura (bandeira subindo, etc)
    }

    onTriggerEnter(outraEntidade) {
        if (!this.ativo) return;

        const isPlayer = outraEntidade.tipo === 'player' || outraEntidade.nome === 'Player';
        if (isPlayer) {
            // Salva Checkpoint no Player
            if (outraEntidade.setCheckpoint) {
                // Salva a posição DESTE objeto como checkpoint
                // (Pode adicionar um offset se quiser, ex: um pouco acima)
                outraEntidade.setCheckpoint(this.entidade.x, this.entidade.y);
                console.log('[Checkpoint] salvo em', this.entidade.x, this.entidade.y);

                // Feedback (Som/Visual)
                // this.ativo = false; // Opcional: Desativar após uso? Geralmente não, pois pode voltar.
            }
        }
    }

    renderizar(renderizador) {
        // Debug
        if (typeof window !== 'undefined' && window.editor && !window.editor.modoEdicao) return; // Hide in Play

        const ctx = renderizador.ctx;
        const camera = renderizador.camera;
        const x = this.entidade.x - camera.x;
        const y = this.entidade.y - camera.y;

        ctx.save();
        ctx.fillStyle = '#f1c40f';
        ctx.font = '20px serif';
        ctx.fillText('🚩', x, y);
        ctx.restore();
    }

    serializar() {
        return {
            tipo: this.tipo,
            // Flat config
            ativo: this.ativo
        };
    }

    desserializar(dados) {
        // Robustez: aceita flat ou config-wrapped
        const cfg = dados.config || dados;
        // Check for specific false value, default true
        this.ativo = cfg.ativo !== false;
    }
}

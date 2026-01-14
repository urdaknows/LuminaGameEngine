import Movimentacao from '../Movimentacao.js';
import Estado from '../../estados/Estado.js';

/**
 * MovimentacaoPlataforma - Movimentação estilo plataforma 2D
 * Estados: Chao, Pulando, Caindo
 */
class MovimentacaoPlataforma extends Movimentacao {
    constructor() {
        super('Movimentação Plataforma', 'Movimentação lateral (A/D) com pulo (Espaço) e gravidade');

        // Parâmetros padrão
        this.definirParametro('velocidadeHorizontal', 200);
        this.definirParametro('forcaPulo', 500);
        this.definirParametro('gravidade', 1000);
        this.definirParametro('alturaChao', 400); // Posição Y do chão
        this.definirParametro('teclaPulo', ' '); // Espaço
    }

    /**
     * Inicializa os estados da movimentação
     */
    inicializar(entidade) {
        const forcaPulo = this.obterParametro('forcaPulo');

        // Habilitar gravidade na engine se não estiver
        entidade.temGravidade = true;
        // Se quiser usar a gravidade do parametro:
        const gravidadeParam = this.obterParametro('gravidade');
        entidade.gravidade = gravidadeParam || 1000;

        // Inicializa variáveis
        entidade.velocidadeY = 0;
        // entidade.noChao é gerenciado pela Engine/CollisionComponent

        // Estado: No Chão
        const estadoChao = new Estado('chao', {
            aoEntrar: (ent) => {
                ent.velocidadeY = 0;
                // Não forçamos y ou noChao aqui, confiamos na colisão
            },
            aoAtualizar: (ent, dt) => {
                // Apenas define velocidade para o frame, a Engine move
                // ent.velocidadeX já é definido no processarInput
            }
        });

        // Estado: Pulando
        const estadoPulando = new Estado('pulando', {
            aoEntrar: (ent) => {
                ent.velocidadeY = -forcaPulo;
                ent.noChao = false;
            },
            aoAtualizar: (ent, dt) => {
                // Engine cuida da gravidade e movimento
            }
        });

        // Estado: Caindo
        const estadoCaindo = new Estado('caindo', {
            aoEntrar: (ent) => {
                // ent.noChao = false; // Engine já deve ter setado isso para entrarmos aqui
            },
            aoAtualizar: (ent, dt) => {
                // Engine cuida da gravidade e movimento
            }
        });

        // Adiciona estados à máquina
        this.maquinaEstado
            .adicionarEstado('chao', estadoChao)
            .adicionarEstado('pulando', estadoPulando)
            .adicionarEstado('caindo', estadoCaindo)
            .definirEstadoInicial('chao')
            .definirEntidade(entidade);

        // Transições
        const estaNoChao = (ent) => ent.noChao || ent.estavaNoChao;

        this.maquinaEstado.adicionarTransicao('chao', 'pulando', (ent) => {
            return ent.iniciouPulo;
        });

        this.maquinaEstado.adicionarTransicao('chao', 'caindo', (ent) => {
            // Se saiu do chão
            return !estaNoChao(ent);
        });

        this.maquinaEstado.adicionarTransicao('pulando', 'caindo', (ent) => {
            return ent.velocidadeY >= 0;
        });

        this.maquinaEstado.adicionarTransicao('caindo', 'chao', (ent) => {
            return estaNoChao(ent);
        });

        // Safety transition
        this.maquinaEstado.adicionarTransicao('pulando', 'chao', (ent) => {
            return estaNoChao(ent) && ent.velocidadeY >= 0;
        });
    }

    /**
     * Processa input de plataforma
     */
    processarInput(entidade, input) {
        // Se estiver morto, não processa input
        if (entidade.morto) {
            entidade.velocidadeX = 0;
            return;
        }

        const velocidadeHorizontal = this.obterParametro('velocidadeHorizontal');
        const teclaPulo = this.obterParametro('teclaPulo');

        let vx = 0;

        if (input.teclaPressionada('a') || input.teclaPressionada('A')) {
            vx = -velocidadeHorizontal;
        }
        if (input.teclaPressionada('d') || input.teclaPressionada('D')) {
            vx = velocidadeHorizontal;
        }

        entidade.velocidadeX = vx;

        // Verifica pulo (apenas se estiver no chão atual ou frame anterior)
        if (input.teclaPrecionadaAgora(teclaPulo) && (entidade.noChao || entidade.estavaNoChao)) {
            entidade.iniciouPulo = true;
        } else {
            entidade.iniciouPulo = false;
        }
    }
}

export default MovimentacaoPlataforma;

import Movimentacao from '../Movimentacao.js';
import Estado from '../../estados/Estado.js';

/**
 * MovimentacaoCorrida - Movimentação com sprint
 * Estados: Parado, Andando, Correndo
 */
class MovimentacaoCorrida extends Movimentacao {
    constructor() {
        super('Movimentação com Corrida', 'Movimentação WASD com tecla Shift para correr');

        // Parâmetros padrão
        this.definirParametro('velocidadeNormal', 200);
        this.definirParametro('velocidadeCorrida', 400);
        this.definirParametro('teclaCorrida', 'Shift');
    }

    /**
     * Inicializa os estados da movimentação
     */
    inicializar(entidade) {
        // Estado: Parado
        const estadoParado = new Estado('parado', {
            aoEntrar: (ent) => {
                ent.velocidadeX = 0;
                ent.velocidadeY = 0;
                ent.correndo = false;
            }
        });

        // Estado: Andando
        const estadoAndando = new Estado('andando', {
            aoEntrar: (ent) => {
                ent.correndo = false;
            },
            aoAtualizar: (ent, dt) => {
                ent.x += ent.velocidadeX * dt;
                ent.y += ent.velocidadeY * dt;
            }
        });

        // Estado: Correndo
        const estadoCorrendo = new Estado('correndo', {
            aoEntrar: (ent) => {
                ent.correndo = true;
            },
            aoAtualizar: (ent, dt) => {
                ent.x += ent.velocidadeX * dt;
                ent.y += ent.velocidadeY * dt;
            },
            aoSair: (ent) => {
                ent.correndo = false;
            }
        });

        // Adiciona estados à máquina
        this.maquinaEstado
            .adicionarEstado('parado', estadoParado)
            .adicionarEstado('andando', estadoAndando)
            .adicionarEstado('correndo', estadoCorrendo)
            .definirEstadoInicial('parado')
            .definirEntidade(entidade);

        // Transições
        this.maquinaEstado.adicionarTransicao('parado', 'andando', (ent) => {
            return (ent.velocidadeX !== 0 || ent.velocidadeY !== 0) && !ent.correndo;
        });

        this.maquinaEstado.adicionarTransicao('parado', 'correndo', (ent) => {
            return (ent.velocidadeX !== 0 || ent.velocidadeY !== 0) && ent.correndo;
        });

        this.maquinaEstado.adicionarTransicao('andando', 'parado', (ent) => {
            return ent.velocidadeX === 0 && ent.velocidadeY === 0;
        });

        this.maquinaEstado.adicionarTransicao('andando', 'correndo', (ent) => {
            return ent.correndo;
        });

        this.maquinaEstado.adicionarTransicao('correndo', 'parado', (ent) => {
            return ent.velocidadeX === 0 && ent.velocidadeY === 0;
        });

        this.maquinaEstado.adicionarTransicao('correndo', 'andando', (ent) => {
            return !ent.correndo && (ent.velocidadeX !== 0 || ent.velocidadeY !== 0);
        });
    }

    /**
     * Processa input com sprint
     */
    processarInput(entidade, input) {
        const velocidadeNormal = this.obterParametro('velocidadeNormal');
        const velocidadeCorrida = this.obterParametro('velocidadeCorrida');
        const teclaCorrida = this.obterParametro('teclaCorrida');

        // Verifica se está correndo
        entidade.correndo = input.teclaPressionada(teclaCorrida);
        const velocidade = entidade.correndo ? velocidadeCorrida : velocidadeNormal;

        let vx = 0;
        let vy = 0;

        if (input.teclaPressionada('w') || input.teclaPressionada('W')) {
            vy = -velocidade;
        }
        if (input.teclaPressionada('s') || input.teclaPressionada('S')) {
            vy = velocidade;
        }
        if (input.teclaPressionada('a') || input.teclaPressionada('A')) {
            vx = -velocidade;
        }
        if (input.teclaPressionada('d') || input.teclaPressionada('D')) {
            vx = velocidade;
        }

        // Normaliza vetor diagonal
        if (vx !== 0 && vy !== 0) {
            const fator = 1 / Math.sqrt(2);
            vx *= fator;
            vy *= fator;
        }

        entidade.velocidadeX = vx;
        entidade.velocidadeY = vy;
    }
}

export default MovimentacaoCorrida;

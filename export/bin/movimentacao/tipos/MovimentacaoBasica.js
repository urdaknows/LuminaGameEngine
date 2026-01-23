import Movimentacao from '../Movimentacao.js';
import Estado from '../../estados/Estado.js';

/**
 * MovimentacaoBasica - Movimentação WASD simples
 * Estados: Parado, Andando
 */
class MovimentacaoBasica extends Movimentacao {
    constructor() {
        super('Movimentação Básica', 'Movimentação WASD simples com 4 direções');

        // Parâmetros padrão
        this.definirParametro('velocidade', 200);
    }

    /**
     * Inicializa os estados da movimentação
     */
    inicializar(entidade) {
        const velocidade = this.obterParametro('velocidade');

        // Estado: Parado
        const estadoParado = new Estado('parado', {
            aoEntrar: (ent) => {
                ent.velocidadeX = 0;
                ent.velocidadeY = 0;
            },
            aoAtualizar: (ent, dt) => {
                // Permanece parado
            }
        });

        // Estado: Andando
        const estadoAndando = new Estado('andando', {
            aoAtualizar: (ent, dt) => {
                // A velocidade já foi definida no processarInput
                ent.x += ent.velocidadeX * dt;
                ent.y += ent.velocidadeY * dt;
            }
        });

        // Adiciona estados à máquina
        this.maquinaEstado
            .adicionarEstado('parado', estadoParado)
            .adicionarEstado('andando', estadoAndando)
            .definirEstadoInicial('parado')
            .definirEntidade(entidade);

        // Transições automáticas
        this.maquinaEstado.adicionarTransicao('parado', 'andando', (ent) => {
            return ent.velocidadeX !== 0 || ent.velocidadeY !== 0;
        });

        this.maquinaEstado.adicionarTransicao('andando', 'parado', (ent) => {
            return ent.velocidadeX === 0 && ent.velocidadeY === 0;
        });
    }

    /**
     * Processa input WASD
     */
    processarInput(entidade, input) {
        const velocidade = this.obterParametro('velocidade');
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

export default MovimentacaoBasica;

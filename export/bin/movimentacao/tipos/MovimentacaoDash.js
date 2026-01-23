import Movimentacao from '../Movimentacao.js';
import Estado from '../../estados/Estado.js';

/**
 * MovimentacaoDash - Movimentação com dash/teleporte
 * Estados: Parado, Andando, Dash
 */
class MovimentacaoDash extends Movimentacao {
    constructor() {
        super('Movimentação com Dash', 'Movimentação WASD com dash rápido usando Espaço');

        // Parâmetros padrão
        this.definirParametro('velocidade', 200);
        this.definirParametro('velocidadeDash', 800);
        this.definirParametro('duracaoDash', 0.2); // segundos
        this.definirParametro('cooldownDash', 1.0); // segundos
        this.definirParametro('teclaDash', ' '); // Espaço
    }

    /**
     * Inicializa os estados da movimentação
     */
    inicializar(entidade) {
        const duracaoDash = this.obterParametro('duracaoDash');
        const cooldownDash = this.obterParametro('cooldownDash');
        const velocidadeDash = this.obterParametro('velocidadeDash');

        // Inicializa variáveis de controle
        entidade.dashDisponivel = true;
        entidade.tempoDash = 0;
        entidade.tempoCooldown = 0;
        entidade.direcaoDashX = 0;
        entidade.direcaoDashY = 0;

        // Estado: Parado
        const estadoParado = new Estado('parado', {
            aoEntrar: (ent) => {
                ent.velocidadeX = 0;
                ent.velocidadeY = 0;
            },
            aoAtualizar: (ent, dt) => {
                // Atualiza cooldown
                if (!ent.dashDisponivel) {
                    ent.tempoCooldown -= dt;
                    if (ent.tempoCooldown <= 0) {
                        ent.dashDisponivel = true;
                    }
                }
            }
        });

        // Estado: Andando
        const estadoAndando = new Estado('andando', {
            aoAtualizar: (ent, dt) => {
                ent.x += ent.velocidadeX * dt;
                ent.y += ent.velocidadeY * dt;

                // Atualiza cooldown
                if (!ent.dashDisponivel) {
                    ent.tempoCooldown -= dt;
                    if (ent.tempoCooldown <= 0) {
                        ent.dashDisponivel = true;
                    }
                }
            }
        });

        // Estado: Dash
        const estadoDash = new Estado('dash', {
            aoEntrar: (ent) => {
                ent.tempoDash = duracaoDash;
                ent.dashDisponivel = false;
                ent.tempoCooldown = cooldownDash;

                // Define direção do dash
                if (ent.velocidadeX === 0 && ent.velocidadeY === 0) {
                    // Dash para frente se não houver input
                    ent.direcaoDashX = 0;
                    ent.direcaoDashY = 1;
                } else {
                    // Normaliza direção
                    const magnitude = Math.sqrt(ent.velocidadeX ** 2 + ent.velocidadeY ** 2);
                    ent.direcaoDashX = ent.velocidadeX / magnitude;
                    ent.direcaoDashY = ent.velocidadeY / magnitude;
                }
            },
            aoAtualizar: (ent, dt) => {
                ent.tempoDash -= dt;

                // Move com velocidade do dash
                ent.x += ent.direcaoDashX * velocidadeDash * dt;
                ent.y += ent.direcaoDashY * velocidadeDash * dt;
            }
        });

        // Adiciona estados à máquina
        this.maquinaEstado
            .adicionarEstado('parado', estadoParado)
            .adicionarEstado('andando', estadoAndando)
            .adicionarEstado('dash', estadoDash)
            .definirEstadoInicial('parado')
            .definirEntidade(entidade);

        // Transições
        this.maquinaEstado.adicionarTransicao('parado', 'andando', (ent) => {
            return ent.velocidadeX !== 0 || ent.velocidadeY !== 0;
        });

        this.maquinaEstado.adicionarTransicao('andando', 'parado', (ent) => {
            return ent.velocidadeX === 0 && ent.velocidadeY === 0;
        });

        this.maquinaEstado.adicionarTransicao('parado', 'dash', (ent) => {
            return ent.iniciouDash;
        });

        this.maquinaEstado.adicionarTransicao('andando', 'dash', (ent) => {
            return ent.iniciouDash;
        });

        this.maquinaEstado.adicionarTransicao('dash', 'parado', (ent) => {
            const acabou = ent.tempoDash <= 0;
            if (acabou) ent.iniciouDash = false;
            return acabou && (ent.velocidadeX === 0 && ent.velocidadeY === 0);
        });

        this.maquinaEstado.adicionarTransicao('dash', 'andando', (ent) => {
            const acabou = ent.tempoDash <= 0;
            if (acabou) ent.iniciouDash = false;
            return acabou && (ent.velocidadeX !== 0 || ent.velocidadeY !== 0);
        });
    }

    /**
     * Processa input com dash
     */
    processarInput(entidade, input) {
        const velocidade = this.obterParametro('velocidade');
        const teclaDash = this.obterParametro('teclaDash');

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

        // Verifica dash
        if (input.teclaPrecionadaAgora(teclaDash) && entidade.dashDisponivel) {
            entidade.iniciouDash = true;
        } else {
            entidade.iniciouDash = false;
        }
    }
}

export default MovimentacaoDash;

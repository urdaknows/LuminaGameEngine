/**
 * MaquinaEstado - Gerenciador de máquina de estados
 * Controla transições entre estados e executa lógica de cada estado
 */
class MaquinaEstado {
    constructor() {
        this.estados = new Map();
        this.estadoAtual = null;
        this.entidade = null;
        this.transicoes = new Map();
    }

    /**
     * Adiciona um estado à máquina
     */
    adicionarEstado(nome, estado) {
        this.estados.set(nome, estado);
        return this;
    }

    /**
     * Define o estado inicial
     */
    definirEstadoInicial(nome) {
        if (this.estados.has(nome)) {
            this.estadoAtual = this.estados.get(nome);
        }
        return this;
    }

    /**
     * Define a entidade que será controlada por esta máquina
     */
    definirEntidade(entidade) {
        this.entidade = entidade;
        if (this.estadoAtual) {
            this.estadoAtual.entrar(this.entidade);
        }
        return this;
    }

    /**
     * Adiciona uma transição entre estados
     * @param {string} deEstado - Estado de origem
     * @param {string} paraEstado - Estado de destino
     * @param {Function} condicao - Função que retorna true quando a transição deve ocorrer
     */
    adicionarTransicao(deEstado, paraEstado, condicao) {
        if (!this.transicoes.has(deEstado)) {
            this.transicoes.set(deEstado, []);
        }

        this.transicoes.get(deEstado).push({
            paraEstado,
            condicao
        });

        return this;
    }

    /**
     * Muda para um novo estado
     */
    mudarEstado(nomeEstado) {
        if (!this.estados.has(nomeEstado)) {
            console.warn(`Estado "${nomeEstado}" não existe!`);
            return;
        }

        const novoEstado = this.estados.get(nomeEstado);

        if (this.estadoAtual && this.entidade) {
            this.estadoAtual.sair(this.entidade);
        }

        this.estadoAtual = novoEstado;

        if (this.entidade) {
            this.estadoAtual.entrar(this.entidade);
        }

        // Log para debug
        console.log(`[MaquinaEstado] Mudou para estado: ${nomeEstado}`);
    }

    /**
     * Atualiza o estado atual e verifica transições automáticas
     */
    atualizar(deltaTime) {
        if (!this.estadoAtual || !this.entidade) return;

        // Atualiza o estado atual
        this.estadoAtual.atualizar(this.entidade, deltaTime);

        // Verifica transições automáticas
        this.verificarTransicoes();
    }

    /**
     * Verifica se alguma condição de transição foi satisfeita
     */
    verificarTransicoes() {
        if (!this.estadoAtual) return;

        const nomeEstadoAtual = this.obterNomeEstadoAtual();
        const transicoes = this.transicoes.get(nomeEstadoAtual);

        if (!transicoes) return;

        for (const transicao of transicoes) {
            if (transicao.condicao(this.entidade)) {
                this.mudarEstado(transicao.paraEstado);
                break; // Executa apenas a primeira transição válida
            }
        }
    }

    /**
     * Retorna o nome do estado atual
     */
    obterNomeEstadoAtual() {
        if (!this.estadoAtual) return null;

        for (const [nome, estado] of this.estados) {
            if (estado === this.estadoAtual) {
                return nome;
            }
        }
        return null;
    }

    /**
     * Retorna o estado atual
     */
    obterEstadoAtual() {
        return this.estadoAtual;
    }
}

export default MaquinaEstado;

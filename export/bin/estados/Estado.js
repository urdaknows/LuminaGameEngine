/**
 * Estado - Classe base para estados da máquina de estados
 * Representa um estado individual com comportamentos específicos
 */
class Estado {
    constructor(nome, config = {}) {
        this.nome = nome;
        this.config = config;

        // Callbacks
        this.aoEntrar = config.aoEntrar || (() => { });
        this.aoSair = config.aoSair || (() => { });
        this.aoAtualizar = config.aoAtualizar || (() => { });
    }

    /**
     * Chamado quando o estado é ativado
     */
    entrar(entidade) {
        this.aoEntrar(entidade);
    }

    /**
     * Chamado quando o estado é desativado
     */
    sair(entidade) {
        this.aoSair(entidade);
    }

    /**
     * Chamado a cada frame enquanto o estado está ativo
     */
    atualizar(entidade, deltaTime) {
        this.aoAtualizar(entidade, deltaTime);
    }

    /**
     * Define o callback de entrada
     */
    definirAoEntrar(callback) {
        this.aoEntrar = callback;
        return this;
    }

    /**
     * Define o callback de saída
     */
    definirAoSair(callback) {
        this.aoSair = callback;
        return this;
    }

    /**
     * Define o callback de atualização
     */
    definirAoAtualizar(callback) {
        this.aoAtualizar = callback;
        return this;
    }
}

export default Estado;

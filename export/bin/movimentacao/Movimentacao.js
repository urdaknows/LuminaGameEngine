import MaquinaEstado from '../estados/MaquinaEstado.js';

/**
 * Movimentacao - Classe base abstrata para sistemas de movimentação
 * Define a interface comum para todos os tipos de movimentação
 */
class Movimentacao {
    constructor(nome, descricao) {
        this.nome = nome;
        this.descricao = descricao;
        this.maquinaEstado = new MaquinaEstado();
        this.parametros = {};
    }

    /**
     * Inicializa a movimentação (deve ser implementado pelas subclasses)
     */
    inicializar(entidade) {
        throw new Error('Método inicializar() deve ser implementado pela subclasse');
    }

    /**
     * Atualiza a movimentação
     */
    atualizar(entidade, deltaTime) {
        this.maquinaEstado.atualizar(deltaTime);
    }

    /**
     * Processa o input do jogador (pode ser sobrescrito)
     */
    processarInput(entidade, input) {
        // Implementado pelas subclasses
    }

    /**
     * Define um parâmetro de configuração
     */
    definirParametro(nome, valor) {
        this.parametros[nome] = valor;
        return this;
    }

    /**
     * Obtém um parâmetro de configuração
     */
    obterParametro(nome) {
        return this.parametros[nome];
    }

    /**
     * Retorna todos os parâmetros
     */
    obterParametros() {
        return { ...this.parametros };
    }

    /**
     * Retorna o nome do estado atual
     */
    obterEstadoAtual() {
        return this.maquinaEstado.obterNomeEstadoAtual();
    }

    /**
     * Retorna informações sobre a movimentação para geração de script
     */
    obterInfo() {
        return {
            nome: this.nome,
            descricao: this.descricao,
            parametros: this.obterParametros(),
            estados: Array.from(this.maquinaEstado.estados.keys())
        };
    }
}

export default Movimentacao;

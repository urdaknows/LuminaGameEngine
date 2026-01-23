/**
 * Script de Morte com Animação
 * 
 * Adicione este script NO PLAYER junto com o script de fade de morte.
 * 
 * Como funciona:
 * 1. Detecta quando o player morre (HP <= 0 ou caiu do mapa)
 * 2. Toca a animação de morte
 * 3. Congela o player (sem movimento)
 * 4. Após animação terminar, ativa o script de fade
 * 
 * IMPORTANTE: Este script deve estar ANTES do MorteFade na lista de scripts!
 */

export default class MorteAnimacao {
    static metadata = {
        nome: 'Morte com Animação',
        categoria: 'Gameplay',
        descricao: 'Toca animação de morte antes do fade. Adicione ANTES do script MorteFade.',
        icone: '💀',

        // Propriedades configuráveis
        propriedades: [
            {
                nome: 'SECTION_Config',
                tipo: 'header',
                valor: 'Configurações'
            },
            {
                nome: 'animNome',
                tipo: 'string',
                valor: 'death',
                descricao: 'Nome da animação de morte (ex: death, die, morrer)'
            },
            {
                nome: 'duracaoMinima',
                tipo: 'number',
                valor: 1.0,
                descricao: 'Tempo mínimo antes do fade (segundos)'
            },
            {
                nome: 'congelarMovimento',
                tipo: 'boolean',
                valor: true,
                descricao: 'Congelar movimento durante animação'
            },
            {
                nome: 'alturaQueda',
                tipo: 'number',
                valor: 2000,
                descricao: 'Altura Y considerada como "caiu do mapa"'
            }
        ]
    };

    constructor(entidade) {
        this.entidade = entidade;

        // Configurações (serão sobrescritas pelas propriedades)
        this.animNome = 'death';
        this.duracaoMinima = 1.0;
        this.congelarMovimento = true;
        this.alturaQueda = 2000;

        // Estados internos
        this.morto = false;
        this.animacaoIniciada = false;
        this.tempoMorte = 0;
        this.velocidadesOriginais = { x: 0, y: 0 };

        console.log('💀 [MorteAnimacao] Script iniciado');
    }

    iniciar() {
        // Salva referência ao script de fade se existir
        this.scriptFade = this.encontrarScriptFade();

        if (!this.scriptFade) {
            console.warn('⚠️ [MorteAnimacao] Script MorteFade não encontrado! O fade não será ativado.');
        }

        console.log('💀 [MorteAnimacao] Monitorando morte do player...');
    }

    encontrarScriptFade() {
        // Procura pelo script de fade de morte
        for (const comp of this.entidade.componentes.values()) {
            if (comp.tipo === 'ScriptComponent' && comp.instance) {
                const nome = comp.instance.constructor.name || '';
                // Procura por "MorteFade" ou variações
                if (nome.toLowerCase().includes('mortefade') ||
                    nome.toLowerCase().includes('fade') && nome.toLowerCase().includes('morte')) {
                    return comp.instance;
                }
            }
        }
        return null;
    }

    verificarMorte() {
        // Condição 1: HP zerado
        if (this.entidade.hp !== undefined && this.entidade.hp <= 0) {
            return true;
        }

        // Condição 2: Caiu do mapa
        if (this.entidade.y > this.alturaQueda) {
            return true;
        }

        return false;
    }

    ativarMorte() {
        if (this.morto) return;

        this.morto = true;
        this.tempoMorte = 0;

        console.log('💀 [MorteAnimacao] Player morreu! Iniciando sequência...');

        // 1. Tocar animação de morte
        const sprite = this.entidade.obterComponente('SpriteComponent');
        if (sprite) {
            if (sprite.animacoes && sprite.animacoes[this.animNome]) {
                sprite.play(this.animNome);
                this.animacaoIniciada = true;
                console.log(`💀 [MorteAnimacao] Tocando animação: ${this.animNome}`);
            } else {
                console.warn(`⚠️ [MorteAnimacao] Animação "${this.animNome}" não encontrada!`);
            }
        }

        // 2. Congelar movimento se configurado
        if (this.congelarMovimento) {
            this.velocidadesOriginais.x = this.entidade.velocidadeX;
            this.velocidadesOriginais.y = this.entidade.velocidadeY;

            this.entidade.velocidadeX = 0;
            this.entidade.velocidadeY = 0;

            // Desabilita gravidade temporariamente
            if (this.entidade.temGravidade !== undefined) {
                this.entidade.temGravidade = false;
            }

            console.log('💀 [MorteAnimacao] Movimento congelado');
        }

        // 3. Desabilitar scripts de movimento (opcional)
        this.desabilitarMovimento();
    }

    desabilitarMovimento() {
        // Desabilita scripts de movimentação para evitar interferência
        for (const comp of this.entidade.componentes.values()) {
            if (comp.tipo === 'ScriptComponent' && comp.instance && comp.instance !== this) {
                const nome = comp.instance.constructor.name || '';

                // Desabilita scripts de movimento (mas não o fade!)
                if (nome.includes('Movimentacao') ||
                    nome.includes('Plataforma') ||
                    nome.includes('Movement')) {

                    if (comp.instance.ativo !== undefined) {
                        comp.instance.ativo = false;
                    }
                }
            }
        }
    }

    ativarFade() {
        if (!this.scriptFade) {
            console.warn('⚠️ [MorteAnimacao] Não há script de fade para ativar');
            return;
        }

        console.log('💀 [MorteAnimacao] Ativando fade de morte...');

        // Ativa o script de fade
        if (this.scriptFade.iniciar && typeof this.scriptFade.iniciar === 'function') {
            this.scriptFade.iniciar();
        }

        // Ou se tiver um método específico para ativar
        if (this.scriptFade.ativar && typeof this.scriptFade.ativar === 'function') {
            this.scriptFade.ativar();
        }
    }

    atualizar(deltaTime) {
        // Só processa se não estiver morto
        if (!this.morto) {
            // Verifica se deve morrer
            if (this.verificarMorte()) {
                this.ativarMorte();
            }
            return;
        }

        // Player está morto - conta tempo
        this.tempoMorte += deltaTime;

        // Mantém velocidades zeradas se congelado
        if (this.congelarMovimento) {
            this.entidade.velocidadeX = 0;
            this.entidade.velocidadeY = 0;
        }

        // Verifica se já pode ativar o fade
        if (this.tempoMorte >= this.duracaoMinima) {
            // Ativa o fade apenas uma vez
            if (this.scriptFade && !this.fadeAtivado) {
                this.fadeAtivado = true;
                this.ativarFade();
            }
        }
    }

    processarInput(engine) {
        // Durante a morte, bloqueia todos os inputs
        if (this.morto) {
            return;
        }
    }

    estaOcupado() {
        // Informa que está ocupado durante a animação de morte
        return this.morto;
    }
}

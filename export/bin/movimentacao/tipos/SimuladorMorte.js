/**
 * Script Simulador de Morte (DEBUG/TESTE)
 * 
 * Este script permite testar o sistema de morte facilmente.
 * Adicione no Player junto com o MorteAnimacao.
 * 
 * Pressione a tecla configurada para simular morte instantânea!
 * 
 * REMOVA EM PRODUÇÃO - Este é apenas para testes!
 */

export default class SimuladorMorte {
    static metadata = {
        nome: 'Simulador de Morte (DEBUG)',
        categoria: 'Debug',
        descricao: 'Simula morte do player com tecla. APENAS PARA TESTES!',
        icone: '🔧',

        propriedades: [
            {
                nome: 'SECTION_Config',
                tipo: 'header',
                valor: '⚠️ APENAS DEBUG - Remover em Produção'
            },
            {
                nome: 'teclaAtivacao',
                tipo: 'string',
                valor: 'k',
                descricao: 'Tecla para matar o player (ex: k, m, F1)'
            },
            {
                nome: 'tipoMorte',
                tipo: 'select',
                valor: 'hp',
                opcoes: ['hp', 'queda', 'ambos'],
                descricao: 'Como simular: HP zero, Queda, ou Ambos'
            },
            {
                nome: 'mostrarLog',
                tipo: 'boolean',
                valor: true,
                descricao: 'Mostrar mensagem no console'
            }
        ]
    };

    constructor(entidade) {
        this.entidade = entidade;

        // Configurações padrão
        this.teclaAtivacao = 'k';
        this.tipoMorte = 'hp';
        this.mostrarLog = true;

        console.log('🔧 [SimuladorMorte] Script DEBUG ativo - Pressione', this.teclaAtivacao.toUpperCase(), 'para matar player');
    }

    iniciar() {
        if (this.mostrarLog) {
            console.log('🔧 [SimuladorMorte] Pronto! Pressione', this.teclaAtivacao.toUpperCase(), 'para testar morte');
        }
    }

    simularMorte() {
        if (this.mostrarLog) {
            console.log('💀 [SimuladorMorte] SIMULANDO MORTE DO PLAYER...');
            console.log('   Tipo:', this.tipoMorte);
        }

        switch (this.tipoMorte) {
            case 'hp':
                // Simula morte por HP zero
                if (this.entidade.hp !== undefined) {
                    const hpOriginal = this.entidade.hp;
                    this.entidade.hp = 0;

                    if (this.mostrarLog) {
                        console.log(`   HP: ${hpOriginal} → 0`);
                    }
                } else {
                    console.warn('⚠️ [SimuladorMorte] Player não tem propriedade HP!');
                    // Tenta criar HP se não existir
                    this.entidade.hp = 0;
                }
                break;

            case 'queda':
                // Simula queda do mapa
                const yOriginal = this.entidade.y;
                this.entidade.y = 3000; // Muito abaixo do limite

                if (this.mostrarLog) {
                    console.log(`   Y: ${yOriginal.toFixed(0)} → 3000 (caiu do mapa)`);
                }
                break;

            case 'ambos':
                // Faz os dois
                if (this.entidade.hp !== undefined) {
                    this.entidade.hp = 0;
                }
                this.entidade.y = 3000;

                if (this.mostrarLog) {
                    console.log('   HP zerado E teleportado para baixo do mapa');
                }
                break;
        }

        if (this.mostrarLog) {
            console.log('💀 [SimuladorMorte] Morte simulada! O script MorteAnimacao deve detectar.');
        }

        // DEBUG: Lista todos os componentes para diagnóstico
        if (this.entidade.componentes) {
            console.log('🔧 [SimuladorMorte] Diagnosticando componentes...');
            const values = this.entidade.componentes instanceof Map ? this.entidade.componentes.values() : this.entidade.componentes;

            for (const comp of values) {
                if (comp.tipo === 'ScriptComponent' && comp.instance) {
                    const name = comp.instance.constructor.name;
                    console.log(`   - Found Script: "${name}"`);

                    if (name === 'StatsRPG' || name.includes('StatsRPG')) {
                        console.log('🔧 [SimuladorMorte] StatsRPG encontrado! Forçando aoMorrer()...');
                        if (comp.instance.aoMorrer) {
                            comp.instance.aoMorrer();
                        } else {
                            console.error('❌ [SimuladorMorte] StatsRPG encontrado mas sem método aoMorrer!');
                        }
                    }
                }
            }
        }
    }

    processarInput(engine) {
        // Detecta tecla de ativação
        if (engine.teclaPrecionadaAgora(this.teclaAtivacao)) {
            this.simularMorte();
        }
    }

    atualizar(deltaTime) {
        // Nada no atualizar - tudo é feito por input
    }
}

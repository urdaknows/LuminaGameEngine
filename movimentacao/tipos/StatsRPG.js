/**
 * Script de Stats RPG
 * 
 * Define e gerencia atributos RPG do personagem:
 * - HP (Vida)
 * - Mana (Energia)
 * - Stamina (Resistência)
 * - XP (Experiência)
 * - Level (Nível)
 * - Atributos (Força, Defesa, etc)
 * 
 * Adicione este script em personagens que precisam de sistema RPG!
 */

export default class StatsRPG {
    static metadata = {
        nome: 'Stats RPG',
        categoria: 'Gameplay',
        descricao: 'Sistema completo de atributos RPG (HP, Mana, XP, Level)',
        icone: '⭐',

        propriedades: [
            {
                nome: 'SECTION_Vida',
                tipo: 'header',
                valor: '❤️ Vida (HP)'
            },
            {
                nome: 'hpMax',
                tipo: 'number',
                valor: 100,
                descricao: 'HP Máximo'
            },
            {
                nome: 'hpInicial',
                tipo: 'number',
                valor: 100,
                descricao: 'HP ao iniciar (padrão = máximo)'
            },
            {
                nome: 'regeneracaoHP',
                tipo: 'number',
                valor: 0,
                descricao: 'HP regenerado por segundo (0 = desligado)'
            },

            {
                nome: 'SECTION_Mana',
                tipo: 'header',
                valor: '💙 Mana'
            },
            {
                nome: 'usarMana',
                tipo: 'boolean',
                valor: true,
                descricao: 'Ativar sistema de Mana'
            },
            {
                nome: 'manaMax',
                tipo: 'number',
                valor: 50,
                descricao: 'Mana Máxima'
            },
            {
                nome: 'manaInicial',
                tipo: 'number',
                valor: 50,
                descricao: 'Mana ao iniciar'
            },
            {
                nome: 'regeneracaoMana',
                tipo: 'number',
                valor: 5,
                descricao: 'Mana regenerada por segundo'
            },

            {
                nome: 'SECTION_Stamina',
                tipo: 'header',
                valor: '💪 Stamina'
            },
            {
                nome: 'usarStamina',
                tipo: 'boolean',
                valor: false,
                descricao: 'Ativar sistema de Stamina'
            },
            {
                nome: 'staminaMax',
                tipo: 'number',
                valor: 100,
                descricao: 'Stamina Máxima'
            },
            {
                nome: 'staminaInicial',
                tipo: 'number',
                valor: 100,
                descricao: 'Stamina ao iniciar'
            },
            {
                nome: 'regeneracaoStamina',
                tipo: 'number',
                valor: 20,
                descricao: 'Stamina regenerada por segundo'
            },

            {
                nome: 'SECTION_Level',
                tipo: 'header',
                valor: '⬆️ Level & XP'
            },
            {
                nome: 'usarLevel',
                tipo: 'boolean',
                valor: true,
                descricao: 'Ativar sistema de Level/XP'
            },
            {
                nome: 'levelInicial',
                tipo: 'number',
                valor: 1,
                descricao: 'Level inicial'
            },
            {
                nome: 'xpInicial',
                tipo: 'number',
                valor: 0,
                descricao: 'XP inicial'
            },
            {
                nome: 'xpParaProximoLevel',
                tipo: 'number',
                valor: 100,
                descricao: 'XP necessário para Level 2'
            },
            {
                nome: 'multiplicadorXP',
                tipo: 'number',
                valor: 1.5,
                descricao: 'Multiplicador de XP por level (ex: 1.5 = +50% a cada level)'
            },

            {
                nome: 'SECTION_Atributos',
                tipo: 'header',
                valor: '⚔️ Atributos'
            },
            {
                nome: 'forca',
                tipo: 'number',
                valor: 10,
                descricao: 'Força (Ataque físico)'
            },
            {
                nome: 'defesa',
                tipo: 'number',
                valor: 5,
                descricao: 'Defesa (Redução de dano)'
            },
            {
                nome: 'velocidade',
                tipo: 'number',
                valor: 10,
                descricao: 'Velocidade (Movimento)'
            },
            {
                nome: 'inteligencia',
                tipo: 'number',
                valor: 10,
                descricao: 'Inteligência (Poder mágico)'
            },

            {
                nome: 'SECTION_Debug',
                tipo: 'header',
                valor: '🔧 Debug'
            },
            {
                nome: 'mostrarLogs',
                tipo: 'boolean',
                valor: true,
                descricao: 'Mostrar logs no console'
            }
        ]
    };

    constructor(entidade) {
        this.entidade = entidade;

        // Valores padrão
        this.hpMax = 100;
        this.hpInicial = 100;
        this.regeneracaoHP = 0;

        this.usarMana = true;
        this.manaMax = 50;
        this.manaInicial = 50;
        this.regeneracaoMana = 5;

        this.usarStamina = false;
        this.staminaMax = 100;
        this.staminaInicial = 100;
        this.regeneracaoStamina = 20;

        this.usarLevel = true;
        this.levelInicial = 1;
        this.xpInicial = 0;
        this.xpParaProximoLevel = 100;
        this.multiplicadorXP = 1.5;

        this.forca = 10;
        this.defesa = 5;
        this.velocidade = 10;
        this.inteligencia = 10;

        this.mostrarLogs = true;
    }

    iniciar() {
        // Inicializa stats na entidade
        this.entidade.hp = this.hpInicial || this.hpMax;
        this.entidade.hpMax = this.hpMax;

        if (this.usarMana) {
            this.entidade.mana = this.manaInicial || this.manaMax;
            this.entidade.manaMax = this.manaMax;
        }

        if (this.usarStamina) {
            this.entidade.stamina = this.staminaInicial || this.staminaMax;
            this.entidade.staminaMax = this.staminaMax;
        }

        if (this.usarLevel) {
            this.entidade.level = this.levelInicial;
            this.entidade.xp = this.xpInicial;
            this.entidade.xpProximo = this.xpParaProximoLevel;
        }

        // Atributos
        this.entidade.forca = this.forca;
        this.entidade.defesa = this.defesa;
        this.entidade.velocidade = this.velocidade;
        this.entidade.inteligencia = this.inteligencia;

        if (this.mostrarLogs) {
            console.log('⭐ [StatsRPG] Inicializado:');
            console.log(`   HP: ${this.entidade.hp}/${this.entidade.hpMax}`);
            if (this.usarMana) console.log(`   Mana: ${this.entidade.mana}/${this.entidade.manaMax}`);
            if (this.usarLevel) console.log(`   Level: ${this.entidade.level} | XP: ${this.entidade.xp}/${this.entidade.xpProximo}`);
        }
    }

    // ===== MÉTODOS PÚBLICOS =====

    /**
     * Causa dano ao personagem
     */
    receberDano(quantidade) {
        // Garante que defesa existe (fallback para 0)
        const defesaAtual = this.entidade.defesa || 0;

        // Aplica defesa (cada ponto de defesa reduz 1% do dano)
        const reducao = Math.min(defesaAtual * 0.01, 0.75); // Máximo 75% de redução
        const danoFinal = Math.floor(quantidade * (1 - reducao));

        this.entidade.hp -= danoFinal;

        if (this.entidade.hp < 0) this.entidade.hp = 0;

        if (this.mostrarLogs) {
            console.log(`💥 Dano: ${quantidade} → ${danoFinal} (após defesa ${defesaAtual})`);
            console.log(`   HP: ${this.entidade.hp}/${this.entidade.hpMax}`);
        }

        // Se morreu
        if (this.entidade.hp <= 0) {
            this.aoMorrer();
        }

        return danoFinal;
    }

    /**
     * Cura o personagem
     */
    curar(quantidade) {
        const hpAntes = this.entidade.hp;
        this.entidade.hp = Math.min(this.entidade.hp + quantidade, this.entidade.hpMax);
        const curado = this.entidade.hp - hpAntes;

        if (this.mostrarLogs && curado > 0) {
            console.log(`💚 Cura: +${curado} HP`);
            console.log(`   HP: ${this.entidade.hp}/${this.entidade.hpMax}`);
        }

        return curado;
    }

    /**
     * Gasta mana
     */
    gastarMana(quantidade) {
        if (!this.usarMana) return false;

        if (this.entidade.mana >= quantidade) {
            this.entidade.mana -= quantidade;
            if (this.mostrarLogs) {
                console.log(`💙 Mana gasta: -${quantidade}`);
            }
            return true;
        }

        if (this.mostrarLogs) {
            console.log(`❌ Mana insuficiente! (${this.entidade.mana}/${quantidade})`);
        }
        return false;
    }

    /**
     * Restaura mana
     */
    restaurarMana(quantidade) {
        if (!this.usarMana) return 0;

        const manaAntes = this.entidade.mana;
        this.entidade.mana = Math.min(this.entidade.mana + quantidade, this.entidade.manaMax);
        return this.entidade.mana - manaAntes;
    }

    /**
     * Ganha XP
     */
    ganharXP(quantidade) {
        if (!this.usarLevel) return;

        this.entidade.xp += quantidade;

        if (this.mostrarLogs) {
            console.log(`✨ XP: +${quantidade} (${this.entidade.xp}/${this.entidade.xpProximo})`);
        }

        // Verifica level up
        while (this.entidade.xp >= this.entidade.xpProximo) {
            this.levelUp();
        }
    }

    /**
     * Level Up!
     */
    levelUp() {
        this.entidade.xp -= this.entidade.xpProximo;
        this.entidade.level++;

        // Calcula XP para próximo level
        this.entidade.xpProximo = Math.floor(this.xpParaProximoLevel * Math.pow(this.multiplicadorXP, this.entidade.level - 1));

        // Bônus de level up
        this.entidade.hpMax += 10;
        this.entidade.hp = this.entidade.hpMax; // Cura completa

        if (this.usarMana) {
            this.entidade.manaMax += 5;
            this.entidade.mana = this.entidade.manaMax;
        }

        // Aumenta atributos
        this.entidade.forca += 2;
        this.entidade.defesa += 1;

        if (this.mostrarLogs) {
            console.log(`🎉 LEVEL UP! → Level ${this.entidade.level}`);
            console.log(`   HP Max: +10 → ${this.entidade.hpMax}`);
            console.log(`   Força: +2 → ${this.entidade.forca}`);
            console.log(`   Defesa: +1 → ${this.entidade.defesa}`);
        }
    }

    /**
     * Chamado quando HP chega a 0
     */
    aoMorrer() {
        if (this.mostrarLogs) {
            console.log('💀 [StatsRPG] Personagem morreu (HP = 0)');
        }

        // Outros scripts podem detectar hp <= 0
    }

    atualizar(deltaTime) {
        // Regeneração de HP
        if (this.regeneracaoHP > 0 && this.entidade.hp < this.entidade.hpMax) {
            this.entidade.hp = Math.min(
                this.entidade.hp + (this.regeneracaoHP * deltaTime),
                this.entidade.hpMax
            );
        }

        // Regeneração de Mana
        if (this.usarMana && this.regeneracaoMana > 0 && this.entidade.mana < this.entidade.manaMax) {
            this.entidade.mana = Math.min(
                this.entidade.mana + (this.regeneracaoMana * deltaTime),
                this.entidade.manaMax
            );
        }

        // Regeneração de Stamina
        if (this.usarStamina && this.regeneracaoStamina > 0 && this.entidade.stamina < this.entidade.staminaMax) {
            this.entidade.stamina = Math.min(
                this.entidade.stamina + (this.regeneracaoStamina * deltaTime),
                this.entidade.staminaMax
            );
        }
    }

    processarInput(engine) {
        // Pode adicionar teclas de debug aqui
    }
}

/**
 * GeradorScript - Gera scripts executáveis de movimentação
 * Analisa a configuração e cria código JavaScript completo
 */
class GeradorScript {
    constructor() {
        this.templates = {
            'Movimentação Básica': this.gerarMovimentacaoBasica.bind(this),
            'Movimentação com Corrida': this.gerarMovimentacaoCorrida.bind(this),
            'Movimentação com Dash': this.gerarMovimentacaoDash.bind(this),
            'Movimentação Plataforma': this.gerarMovimentacaoPlataforma.bind(this),

            'IA Inimigo (Patrulha)': this.gerarIAInimigoPatrulha.bind(this),
            'Combate Melee': this.gerarScriptAtaqueMelee.bind(this),
            'Visual de Combate': this.gerarScriptVisualCombate.bind(this),
            'Stats RPG': this.gerarScriptStatsRPG.bind(this),
            'Sistema de Morte': this.gerarScriptMorte.bind(this),
            'Morte com Animação': this.gerarScriptMorteAnimacao.bind(this),
            'Simulador de Morte': this.gerarScriptSimuladorMorte.bind(this),
            'Sistema de Respawn': this.gerarScriptRespawnInimigo.bind(this),
            'Texto Flutuante': this.gerarScriptTextoFlutuante.bind(this),
            'Controlador de Inventário': this.gerarControladorInventario.bind(this),
            'Área de Mensagem': this.gerarScriptAreaMensagem.bind(this)
        };
    }

    // ... (rest of the file until the end)

    /**
     * Gera script para Respawn de Inimigo
     */
    gerarScriptRespawnInimigo() {
        return `/**
 * Script de Respawn (Inimigo) v2.0
 * - Padronizado com sistema HP
 * - Reseta estado morto da IA
 * - Compatível com animação de morte
 */

class RespawnScript {
    constructor(entidade) {
        this.entidade = entidade;
        
        // --- CONFIGURAÇÃO ---
        this.tempoRespawn = 5.0; // Segundos para renascer
        
        // Estado
        this.timer = 0;
        this.estaMorto = false;
        
        // Salva estado inicial
        this.startX = entidade.x;
        this.startY = entidade.y;
        this.startHP = entidade.hp || entidade.hpMax || 100;
        this.startGravidade = entidade.temGravidade;
        
        // HOOK: Substitui método morrer
        this.entidade.morrer = this.aoMorrer.bind(this);
        
        console.log('[Respawn v7] Ativado:', entidade.nome, '| HP:', this.startHP);
    }

    aoMorrer() {
        if (this.estaMorto) return;
        
        console.log('💀 Respawn iniciado! Renascerá em', this.tempoRespawn, 's');
        this.estaMorto = true;
        this.timer = this.tempoRespawn;

        // Esconde e desativa
        this.entidade.visivel = false;
        this.entidade.temGravidade = false;
        this.entidade.velocidadeX = 0;
        this.entidade.velocidadeY = 0;
        
        // Move para limbo
        this.entidade.x = -9999;
        this.entidade.y = -9999;
        
        // Move para limbo
        this.entidade.x = -9999;
        this.entidade.y = -9999;
    }
    


    atualizar(deltaTime) {
        if (!this.estaMorto) return;

        this.timer -= deltaTime;

        if (this.timer <= 0) {
            this.renascer();
        }
    }

    renascer() {
        console.log('✨ Renasceu:', this.entidade.nome);
        this.estaMorto = false;

        // Reset GLOBAL de morte
        this.entidade.morto = false;

        // Restaura HP
        this.entidade.hp = this.startHP;
        this.entidade.visivel = true;
        this.entidade.temGravidade = this.startGravidade;
        
        // Restaura Posição
        this.entidade.x = this.startX;
        this.entidade.y = this.startY;
        this.entidade.velocidadeX = 0;
        this.entidade.velocidadeY = 0;
        
        // Reseta estado morto da IA (se tiver)
        for (const [tipo, comp] of this.entidade.componentes.entries()) {
            if (comp.tipo === 'ScriptComponent' && comp.instance) {
                const nome = comp.instance.constructor.name;
                
                if (nome === 'InimigoPatrulhaScript') {
                    comp.instance.morto = false;
                    comp.instance.tempoMorte = 0;
                    comp.instance.tomouDano = false;
                    comp.instance.estado = 'patrulhando';
                    console.log('✅ IA resetada!');
                }
            }
        }
        
        // Reinicia animação
        const sprite = this.entidade.obterComponente('SpriteComponent');
        if (sprite) {
            sprite.autoplayAnim = 'walk'; // Reativa autoplay
            sprite.play('walk') || sprite.play('idle');
            sprite.flashing = false;
        }
    }
}`;
    }

    /**
     * Gera um script baseado na movimentação
     */
    gerar(movimentacao) {
        const info = movimentacao.obterInfo();
        const gerador = this.templates[info.nome];

        if (!gerador) {
            return this.gerarGenerico(info);
        }

        return gerador(info);
    }

    /**
     * Gera script para movimentação básica
     */
    gerarMovimentacaoBasica(info) {
        const velocidade = info.parametros.velocidade || 200;

        return `/**
 * Script de Movimentação Básica
 * Gerado automaticamente pela Game Engine
 * 
 * Descrição: ${info.descricao}
 * Estados: ${info.estados.join(', ')}
 */

const animIdle = 'idle';
const animWalk = 'walk';

class MovimentacaoBasicaScript {
    constructor(entidade) {
        this.entidade = entidade;
        this.velocidade = ${velocidade};
        this.estado = 'parado';
        
        // Inicializa propriedades da entidade
        this.entidade.velocidadeX = 0;
        this.entidade.velocidadeY = 0;
    }

    /**
     * Processa input do jogador (chamado a cada frame)
     */
    processarInput(input) {
        // Inicializa Ponto de Respawn
        if (!this.spawnDefinido) {
            this.entidade.startX = this.entidade.x;
            this.entidade.startY = this.entidade.y;
            this.spawnDefinido = true;
        }

        let vx = 0;
        let vy = 0;

        // Teclas WASD
        if (input.teclaPressionada('w') || input.teclaPressionada('W')) {
            vy = -this.velocidade;
        }
        if (input.teclaPressionada('s') || input.teclaPressionada('S')) {
            vy = this.velocidade;
        }
        if (input.teclaPressionada('a') || input.teclaPressionada('A')) {
            vx = -this.velocidade;
        }
        if (input.teclaPressionada('d') || input.teclaPressionada('D')) {
            vx = this.velocidade;
        }

        // Normaliza movimento diagonal
        if (vx !== 0 && vy !== 0) {
            const fator = 1 / Math.sqrt(2);
            vx *= fator;
            vy *= fator;
        }

        this.entidade.velocidadeX = vx;
        this.entidade.velocidadeY = vy;

        // Atualiza estado
        if (vx === 0 && vy === 0) {
            this.estado = 'parado';
        } else {
            this.estado = 'andando';
        }
    }

    /**
     * Atualiza a movimentação (chamado a cada frame)
     */
    atualizar(deltaTime) {
        this.entidade.x += this.entidade.velocidadeX * deltaTime;
        this.entidade.y += this.entidade.velocidadeY * deltaTime;

        // --- Lógica de Animação ---
        const sprite = this.entidade.obterComponente('SpriteComponent');
        if (sprite) {
            // Espelhamento - Só muda se estiver se movendo
            if (this.entidade.velocidadeX > 0) sprite.inverterX = false;
            else if (this.entidade.velocidadeX < 0) sprite.inverterX = true;

            // Transição de Estados de Animação
            if (this.estado === 'parado') sprite.play(animIdle);
            else if (this.estado === 'andando') sprite.play(animWalk);
        }
    }

    /**
     * Retorna o estado atual
     */
    obterEstado() {
        return this.estado;
    }
}

// Exemplo de uso:
// const movimentacao = new MovimentacaoBasicaScript(player);
// movimentacao.processarInput(engine.input);
// movimentacao.atualizar(deltaTime);
`;
    }

    /**
     * Gera script para movimentação com corrida
     */
    gerarMovimentacaoCorrida(info) {
        const velocidadeNormal = info.parametros.velocidadeNormal || 200;
        const velocidadeCorrida = info.parametros.velocidadeCorrida || 400;
        const teclaCorrida = info.parametros.teclaCorrida || 'Shift';

        return `/**
 * Script de Movimentação com Corrida
 * Gerado automaticamente pela Game Engine
 * 
 * Descrição: ${info.descricao}
 * Estados: ${info.estados.join(', ')}
 */

const animIdle = 'idle';
const animWalk = 'walk';
const animRun = 'run';

class MovimentacaoCorridaScript {
    constructor(entidade) {
        this.entidade = entidade;
        this.velocidadeNormal = ${velocidadeNormal};
        this.velocidadeCorrida = ${velocidadeCorrida};
        this.teclaCorrida = '${teclaCorrida}';
        this.estado = 'parado';
        this.correndo = false;
        
        // Inicializa propriedades da entidade
        this.entidade.velocidadeX = 0;
        this.entidade.velocidadeY = 0;
    }

    /**
     * Processa input do jogador
     */
    processarInput(input) {
        // Inicializa Ponto de Respawn
        if (!this.spawnDefinido) {
            this.entidade.startX = this.entidade.x;
            this.entidade.startY = this.entidade.y;
            this.spawnDefinido = true;
        }

        // Verifica se está correndo
        this.correndo = input.teclaPressionada(this.teclaCorrida);
        const velocidade = this.correndo ? this.velocidadeCorrida : this.velocidadeNormal;

        let vx = 0;
        let vy = 0;

        // Teclas WASD
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

        // Normaliza movimento diagonal
        if (vx !== 0 && vy !== 0) {
            const fator = 1 / Math.sqrt(2);
            vx *= fator;
            vy *= fator;
        }

        this.entidade.velocidadeX = vx;
        this.entidade.velocidadeY = vy;

        // Atualiza estado
        if (vx === 0 && vy === 0) {
            this.estado = 'parado';
        } else if (this.correndo) {
            this.estado = 'correndo';
        } else {
            this.estado = 'andando';
        }
    }

    /**
     * Atualiza a movimentação
     */
    atualizar(deltaTime) {
            this.entidade.x += this.entidade.velocidadeX * deltaTime;
            this.entidade.y += this.entidade.velocidadeY * deltaTime;
        }

        // --- Lógica de Animação ---
        const sprite = this.entidade.obterComponente('SpriteComponent');
        if (sprite) {
            // Espelhamento - Só muda se estiver se movendo
            if (this.entidade.velocidadeX > 0) sprite.inverterX = false;
            else if (this.entidade.velocidadeX < 0) sprite.inverterX = true;

            // Estados
            if (this.estado === 'parado') sprite.play(animIdle); 
            else if (this.estado === 'andando') sprite.play(animWalk);
            else if (this.estado === 'correndo') sprite.play(animRun);
        }
    }

    /**
     * Retorna o estado atual
     */
    obterEstado() {
        return this.estado;
    }
}

// Exemplo de uso:
// const movimentacao = new MovimentacaoCorridaScript(player);
// movimentacao.processarInput(engine.input);
// movimentacao.atualizar(deltaTime);
`;
    }

    /**
     * Gera script para movimentação com dash
     */
    gerarMovimentacaoDash(info) {
        const velocidade = info.parametros.velocidade || 200;
        const velocidadeDash = info.parametros.velocidadeDash || 800;
        const duracaoDash = info.parametros.duracaoDash || 0.2;
        const cooldownDash = info.parametros.cooldownDash || 1.0;

        return `/**
 * Script de Movimentação com Dash
 * Gerado automaticamente pela Game Engine
 * 
 * Descrição: ${info.descricao}
 * Estados: ${info.estados.join(', ')}
 */

class MovimentacaoDashScript {
    constructor(entidade) {
        this.entidade = entidade;
        this.velocidade = ${velocidade};
        this.velocidadeDash = ${velocidadeDash};
        this.duracaoDash = ${duracaoDash};
        this.cooldownDash = ${cooldownDash};
        
        this.estado = 'parado';
        this.dashDisponivel = true;
        this.tempoDash = 0;
        this.tempoCooldown = 0;
        this.direcaoDashX = 0;
        this.direcaoDashY = 0;
        
        // Inicializa propriedades da entidade
        this.entidade.velocidadeX = 0;
        this.entidade.velocidadeY = 0;
    }

    /**
     * Processa input do jogador
     */
    processarInput(input) {
        // Inicializa Ponto de Respawn
        if (!this.spawnDefinido) {
            this.entidade.startX = this.entidade.x;
            this.entidade.startY = this.entidade.y;
            this.spawnDefinido = true;
        }

        let vx = 0;
        let vy = 0;

        // Teclas WASD
        if (input.teclaPressionada('w') || input.teclaPressionada('W')) {
            vy = -this.velocidade;
        }
        if (input.teclaPressionada('s') || input.teclaPressionada('S')) {
            vy = this.velocidade;
        }
        if (input.teclaPressionada('a') || input.teclaPressionada('A')) {
            vx = -this.velocidade;
        }
        if (input.teclaPressionada('d') || input.teclaPressionada('D')) {
            vx = this.velocidade;
        }

        // Normaliza movimento diagonal
        if (vx !== 0 && vy !== 0) {
            const fator = 1 / Math.sqrt(2);
            vx *= fator;
            vy *= fator;
        }

        this.entidade.velocidadeX = vx;
        this.entidade.velocidadeY = vy;

        // Verifica dash (Espaço)
        if (input.teclaPrecionadaAgora(' ') && this.dashDisponivel && this.estado !== 'dash') {
            this.iniciarDash();
        }
    }

    /**
     * Inicia o dash
     */
    iniciarDash() {
        this.estado = 'dash';
        this.tempoDash = this.duracaoDash;
        this.dashDisponivel = false;
        this.tempoCooldown = this.cooldownDash;
        
        // Define direção do dash
        if (this.entidade.velocidadeX === 0 && this.entidade.velocidadeY === 0) {
            this.direcaoDashX = 0;
            this.direcaoDashY = 1;
        } else {
            const magnitude = Math.sqrt(
                this.entidade.velocidadeX ** 2 + this.entidade.velocidadeY ** 2
            );
            this.direcaoDashX = this.entidade.velocidadeX / magnitude;
            this.direcaoDashY = this.entidade.velocidadeY / magnitude;
        }
    }

    /**
     * Atualiza a movimentação
     */
    atualizar(deltaTime) {
        // Atualiza cooldown
        if (!this.dashDisponivel) {
            this.tempoCooldown -= deltaTime;
            if (this.tempoCooldown <= 0) {
                this.dashDisponivel = true;
            }
        }

        if (this.estado === 'dash') {
            this.tempoDash -= deltaTime;
            
            // Move com velocidade do dash
            this.entidade.x += this.direcaoDashX * this.velocidadeDash * deltaTime;
            this.entidade.y += this.direcaoDashY * this.velocidadeDash * deltaTime;
            
            // Verifica fim do dash
            if (this.tempoDash <= 0) {
                if (this.entidade.velocidadeX === 0 && this.entidade.velocidadeY === 0) {
                    this.estado = 'parado';
                } else {
                    this.estado = 'andando';
                }
            }
        } else if (this.estado === 'andando') {
            this.entidade.x += this.entidade.velocidadeX * deltaTime;
            this.entidade.y += this.entidade.velocidadeY * deltaTime;
            
            // Atualiza estado
            if (this.entidade.velocidadeX === 0 && this.entidade.velocidadeY === 0) {
                this.estado = 'parado';
            }
        } else {
            // Parado - verifica se começou a andar
            if (this.entidade.velocidadeX !== 0 || this.entidade.velocidadeY !== 0) {
                this.estado = 'andando';
            }
        }

        // --- Lógica de Animação ---
        const sprite = this.entidade.obterComponente('SpriteComponent');
        if (sprite) {
            // Espelhamento - Só muda se estiver se movendo
            if (this.entidade.velocidadeX > 0) sprite.inverterX = false;
            else if (this.entidade.velocidadeX < 0) sprite.inverterX = true;

            // Estados
            // Mantendo hardcoded para dash por enquanto para simplicidade, ou voltar attrs
            switch (this.estado) {
                case 'parado': sprite.play('idle'); break;
                case 'andando': sprite.play('walk'); break;
                case 'dash': sprite.play('dash') || sprite.play('run'); break; 
            }
        }
    }

    /**
     * Retorna o estado atual
     */
    obterEstado() {
        return this.estado;
    }

    /**
     * Retorna se o dash está disponível
     */
    dashEstaDisponivel() {
        return this.dashDisponivel;
    }
}

// Exemplo de uso:
// const movimentacao = new MovimentacaoDashScript(player);
// movimentacao.processarInput(engine.input);
// movimentacao.atualizar(deltaTime);
`;
    }

    /**
     * Gera script para IA de Patrulha
     */
    gerarIAInimigoPatrulha(info) {
        const velocidade = info.parametros.velocidade || 100;
        const distancia = info.parametros.distancia || 200;

        return `/**
 * Script de IA: Inimigo Patrulha v10.1 - HITSTUN UPDATE
 * - Animação de Morte
 * - Sistema de HP padronizado
 * - Perseguição do Player
 * - Feedback visual de dano
 * - Drop de XP
 * - HITSTUN & KNOCKBACK (v10.1)
 */

class InimigoPatrulhaScript {
    constructor(entidade) {
        this.entidade = entidade;
        
        // === STATS ===
        this.hpMax = 50;
        this.entidade.hp = this.hpMax;
        this.entidade.hpMax = this.hpMax;
        
        // === MOVIMENTO ===
        this.velocidade = ${velocidade};
        this.velocidadePerseguicao = ${velocidade * 1.5}; // 50% mais rápido ao perseguir
        this.distanciaPatrulha = ${distancia};
        
        // === COMBATE ===
        this.rangeAtaque = 40; // Melee range
        this.rangePerseguicao = 300; // Distância para começar a perseguir
        this.dano = 10;
        this.cooldownAtaque = 1500;
        this.ultimoAtaque = 0;
        
        // === MORTE & XP ===
        this.xpDrop = 25; // XP que dá ao morrer
        this.morto = false;
        this.tempoMorte = 0;
        
        // === DANO VISUAL ===
        this.tomouDano = false;
        this.tempoDano = 0;
        // === VISUAL ===
        this.duracaoDano = 0.3;
        
        // === HITSTUN & KNOCKBACK ===
        this.emHitstun = false;
        this.tempoHitstun = 0;
        this.duracaoHitstun = 0.4; // Segundos de stun ao ser atingido
        this.invulneravel = false;
        this.tempoInvulnerabilidade = 0;
        this.duracaoInvulnerabilidade = 0.5; // Segundos de invulnerabilidade
        this.knockbackForce = 200; // Força do empurrão
        this.knockbackUp = 100; // Força vertical (pequena para não voar muito)


        // CONFIGURAÇÃO DE SPRITE
        // Se o desenho original do seu inimigo olha para a ESQUERDA, marque true.
        // Se olha para a DIREITA (Padrão), deixe false.
        this.spriteOriginalEsquerda = false;
        
        // === AUDIO ===
        this.somIdle = '';
        this.somWalk = '';
        this.somRun = '';
        this.somAttack = '';
        this.somDamage = '';
        this.somDeath = '';
        this.somFall = '';  // Opcional
        this.somJump = '';  // Opcional
        
        this.ultimoEstadoAudio = '';
        this.audioLoopAtual = null; // Para travar loops

        this.startX = entidade.x;
        this.direcao = 1;
        this.entidade.temGravidade = true;
        
        this.minX = this.startX - this.distanciaPatrulha;
        this.maxX = this.startX + this.distanciaPatrulha;
        
        this.estado = 'patrulhando'; // patrulhando, perseguindo, atacando, morto
        
        // EXPOR API PARA COMBATE
        this.entidade.receberDano = this.receberDano.bind(this);
        
        // Configurações de Física
        // Desabilita colisão sólida contra o player para evitar "Ejeção/Catapultamento"
        this.entidade.solido = false; 
        
        console.log('[IA Patrulha v10] Iniciado:', entidade.nome, '| HP:', this.hpMax);
    }
    
    // === SISTEMA DE AUDIO ===
    tocarSom(id, loop = false) {
        if (!id || !this.entidade.engine || !this.entidade.engine.audioManager) return;
        
        // Se for loop, delega para tocarLoop
        if (loop) {
            this.entidade.engine.audioManager.tocar(id, { loop: true, volume: 1.0 });
            this.audioLoopAtual = id;
            return;
        }
        
        this.entidade.engine.audioManager.tocar(id);
    }

    pararLoop() {
        if (this.audioLoopAtual && this.entidade.engine && this.entidade.engine.audioManager) {
            this.entidade.engine.audioManager.parar(this.audioLoopAtual);
            this.audioLoopAtual = null;
        }
    }

    gerenciarAudio() {
        // Mapeamento Estado -> Som
        let somParaTocar = '';
        let deveLoopar = false;

        if (this.morto) {
            // Morte é one-shot, gerido no morrer()
            this.pararLoop();
            return;
        }

        switch (this.estado) {
            case 'patrulhando':
                // Se estiver andando
                if (Math.abs(this.entidade.velocidadeX) > 10) {
                    somParaTocar = this.somWalk;
                    deveLoopar = true;
                } else {
                    somParaTocar = this.somIdle;
                    deveLoopar = true;
                }
                break;
            case 'perseguindo':
                somParaTocar = this.somRun || this.somWalk;
                deveLoopar = true;
                break;
            case 'atacando':
                // Ataque é one-shot, gerido no atacar()
                // Mas enquanto espera cooldown, pode ser idle
                if (this.entidade.velocidadeX === 0) {
                     somParaTocar = this.somIdle;
                     deveLoopar = true;
                }
                break;
            default:
                somParaTocar = this.somIdle;
                deveLoopar = true;
                break;
        }

        // Toca se mudou o som
        if (somParaTocar !== this.ultimoEstadoAudio) {
            this.pararLoop();
            if (somParaTocar && deveLoopar) {
                this.tocarSom(somParaTocar, true);
            }
            this.ultimoEstadoAudio = somParaTocar;
        }
    }

    atacar(player) {
         this.ultimoAtaque = Date.now();
         
         // Som de Ataque
         this.tocarSom(this.somAttack);
         
         // Aplica dano
         if (player.receberDano) {
             player.receberDano(this.dano);
         } else if (player.hp !== undefined) {
             player.hp -= this.dano;
         }

         // KNOCKBACK SAFEGUARD (Evita clipping no chão/paredes)
         // Empurra o player para cima e para trás
         if (player.velocidadeX !== undefined && player.velocidadeY !== undefined) {
             const dir = (player.x - this.entidade.x) > 0 ? 1 : -1; 
             player.velocidadeX = dir * 150; // Empurrão horizontal (Reduzido para segurança)
             player.velocidadeY = -250;      // Pulo (evita afundar no chão)
             player.noChao = false;
         }
    }
    
    receberDano(dano, atacante) {
        // Ignora dano se morto ou invulnerável
        if (this.morto || this.invulneravel) return;
        
        // Som de Dano
        this.tocarSom(this.somDamage);
        
        this.entidade.hp -= dano;
        this.tomouDano = true;
        this.tempoDano = 0;
        
        // === HITSTUN & KNOCKBACK ===
        this.emHitstun = true;
        this.tempoHitstun = 0;
        this.invulneravel = true;
        this.tempoInvulnerabilidade = 0;
        
        // Aplicar knockback
        if (atacante) {
            const dir = (this.entidade.x - atacante.x) > 0 ? 1 : -1;
            this.entidade.velocidadeX = dir * this.knockbackForce;
            this.entidade.velocidadeY = -this.knockbackUp;
            this.entidade.noChao = false;
        }
        
        // FEEDBACK VISUAL
        console.log('[Inimigo] mostrarDano existe?', !!this.entidade.mostrarDano);
        if (this.entidade.mostrarDano) {
            console.log('[Inimigo] Chamando mostrarDano com dano:', dano);
            this.entidade.mostrarDano(dano);
        } else {
            console.warn('[Inimigo] mostrarDano não está disponível! Adicione VisualCombateScript.');
        }

        console.log('💥', this.entidade.nome, 'recebeu', dano, 'de dano! HP:', this.entidade.hp + '/' + this.hpMax);
        
        // Feedback visual (piscar)
        const sprite = this.entidade.obterComponente('SpriteComponent');
        if (sprite) {
            sprite.flashing = true;
            sprite.flashDuration = this.duracaoInvulnerabilidade;
        }
        
        if (this.entidade.hp <= 0) {
            this.morrer();
        }
    }
    
    morrer() {
        if (this.morto) return;
        
        this.morto = true;
        this.tocarSom(this.somDeath); // Som de Morte
        
        this.tempoMorte = 0;
        this.entidade.velocidadeX = 0;
        this.entidade.velocidadeY = 0;
        this.pararLoop(); // Para sons de loop
        
        console.log('💀', this.entidade.nome, 'morreu!');
        
        // Toca animação death
        const sprite = this.entidade.obterComponente('SpriteComponent');
        if (sprite) {
            sprite.autoplayAnim = '';
            if (sprite.animacoes && sprite.animacoes['death']) {
                sprite.play('death');
                sprite.animacoes['death'].loop = false;
            } else {
                // Fallback: usa idle
                sprite.play('idle');
            }
        }
        
        // Drop de XP para o player
        this.dropXP();

        // CHAMA HOOK EXTERNO (RespawnScript)
        // Se houver outro script cuidando da "Morte Real" (Respawn/Destroy), avisamos ele.
        if (this.entidade.morrer && this.entidade.morrer !== this.morrer) {
             console.log('[IA Patrulha v10] Chamando entidade.morrer() externo...');
             this.entidade.morrer(); 
        }
    
    }
    
    dropXP() {
        console.log('[IA Patrulha v10] Tentando dropar XP...');
        if (!this.entidade.engine) {
             console.log('[IA Patrulha v10] ERRO: Sem Engine.');
             return;
        }
        
        const player = this.encontrarPlayer();
        
        if (!player) {
             console.log('[IA Patrulha v10] ERRO: Player não encontrado.');
            console.warn('⚠️ [Inimigo] Tentei dar XP mas não achei o Player! (Certifique-se que o nome é "Player" ou tem a tag "player")');
            return;
        }

        if (player.ganharXP) {
            player.ganharXP(this.xpDrop);
            console.log('✨ Player ganhou', this.xpDrop, 'XP! (via ganharXP)');
        } else if (player.xp !== undefined) {
            player.xp += this.xpDrop;
            console.log('✨ Player XP somado direto:', player.xp);
        } else {
             console.warn('⚠️ [Inimigo] Player encontrado, mas ele não tem StatsRPG (sem xp/ganharXP).');
        }
    }
    
    encontrarPlayer() {
        if (!this.entidade.engine) return null;
        
        const entidades = this.entidade.engine.entidades;
        return entidades.find(e => {
            const nome = (e.nome || '').toLowerCase();
            // Busca por NOME, TIPO, TAGS ou FLAG isPlayer
            return nome.includes('player') || 
                   nome.includes('jogador') || 
                   nome.includes('hero') || 
                   e.tipo === 'player' ||
                   (e.tags && e.tags.some(t => t.toLowerCase() === 'player')) ||
                   e.isPlayer === true;
        });
    }

    atualizar(deltaTime) {
        // Gerencia Audio Loop (Idle/Walk/Run)
        this.gerenciarAudio();
        
        // Se morto, aguarda e depois chama script de respawn
        if (this.morto) {
            this.tempoMorte += deltaTime;
            // Após 1.5s, chama método morrer da entidade (será capturado pelo RespawnScript)
            if (this.tempoMorte >= 1.5 && this.entidade.morrer) {
                this.entidade.morrer();
            }
            return;
        }
        
        // CHECAGEM DE SEGURANÇA: Morte por dano externo (sem chamar receberDano)
        if (this.entidade.hp <= 0 && !this.morto) {
            this.morrer();
            return;
        }

        // Atualiza feedback de dano
        if (this.tomouDano) {
            this.tempoDano += deltaTime;
            if (this.tempoDano >= this.duracaoDano) {
                this.tomouDano = false;
            }
        }
        
        // === HITSTUN TIMER ===
        if (this.emHitstun) {
            this.tempoHitstun += deltaTime;
            if (this.tempoHitstun >= this.duracaoHitstun) {
                this.emHitstun = false;
            } else {
                // Durante hitstun, inimigo não pode se mover (apenas sofre knockback da física)
                return;
            }
        }
        
        // === INVULNERABILIDADE TIMER ===
        if (this.invulneravel) {
            this.tempoInvulnerabilidade += deltaTime;
            if (this.tempoInvulnerabilidade >= this.duracaoInvulnerabilidade) {
                this.invulneravel = false;
                // Para de piscar
                const sprite = this.entidade.obterComponente('SpriteComponent');
                if (sprite) sprite.flashing = false;
            }
        }
        
        const player = this.encontrarPlayer();
        
        if (player) {
            const c1 = this.entidade.obterCentro ? this.entidade.obterCentro() : {x: this.entidade.x, y: this.entidade.y};
            const c2 = player.obterCentro ? player.obterCentro() : {x: player.x, y: player.y};
            
            const dx = c2.x - c1.x;
            const dy = c2.y - c1.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // ATAQUE
            if (dist < this.rangeAtaque) {
                this.estado = 'atacando';
                this.entidade.velocidadeX = 0;
                this.direcao = dx > 0 ? 1 : -1;

                if (Date.now() - this.ultimoAtaque > this.cooldownAtaque) {
                    this.atacar(player);
                }

                const sprite = this.entidade.obterComponente('SpriteComponent');
                if (sprite) {
                    sprite.play('attack');
                    // Ajuste de direção
                    sprite.inverterX = this.calcularInversaoSprite(this.direcao);
                }
            }
            // PERSEGUIÇÃO
            else if (dist < this.rangePerseguicao) {
                this.estado = 'perseguindo';
                this.direcao = dx > 0 ? 1 : -1;
                
                // --- SEGURANÇA NA PERSEGUIÇÃO ---
                // Verifica se há parede ou abismo antes de mover
                if (this.detectarColisaoParede() || !this.detectarChaoAFrente()) {
                    // Se tiver perigo, não avança (fica parado encarando/latindo)
                    this.entidade.velocidadeX = 0;
                    
                    const sprite = this.entidade.obterComponente('SpriteComponent');
                    if (sprite) {
                        sprite.play('idle');
                        sprite.inverterX = this.calcularInversaoSprite(this.direcao);
                    }
                } else {
                    // Caminho livre, AVANÇAR
                    const movimento = this.velocidadePerseguicao * this.direcao * deltaTime;
                    this.entidade.x += movimento;
                    
                    const sprite = this.entidade.obterComponente('SpriteComponent');
                    if (sprite) {
                        sprite.play('run') || sprite.play('walk');
                        sprite.inverterX = this.calcularInversaoSprite(this.direcao);
                    }
                }
            }
            // PATRULHA
            else {
                this.patrulhar(deltaTime);
            }
        } else {
            // Sem player, patrulha normal
            this.patrulhar(deltaTime);
        }
    }
    
    patrulhar(deltaTime) {
        this.estado = 'patrulhando';
        
        // --- DETECÇÃO DE COLISÃO (Parede/Abismo) ---
        // Verifica se vai bater em parede ou cair
        if (this.detectarColisaoParede() || !this.detectarChaoAFrente()) {
            this.direcao *= -1; // Inverte direção
            
            // Pequeno salto para evitar ficar preso no loop de colisão
            this.entidade.x += this.direcao * 5; 
        }

        const movimento = this.velocidade * this.direcao * deltaTime;
        this.entidade.x += movimento;

        // Limites originais como fallback (ou área definida)
        if (this.entidade.x >= this.maxX) {
            this.entidade.x = this.maxX;
            this.direcao = -1;
        } else if (this.entidade.x <= this.minX) {
            this.entidade.x = this.minX;
            this.direcao = 1;
        }

        const sprite = this.entidade.obterComponente('SpriteComponent');
        if (sprite) {
            // Ajuste de direção usando helper seguro
            sprite.inverterX = this.calcularInversaoSprite(this.direcao);
            sprite.play('walk');
        }
    }
    
    detectarColisaoParede() {
        if (!this.entidade.engine) return false;
        
        const colComp = this.entidade.obterComponente('CollisionComponent');
        if (!colComp) return false;
        
        const bounds = colComp.obterLimitesAbsolutos(this.entidade);
        const sensorX = (this.direcao > 0) ? (bounds.x + bounds.w + 5) : (bounds.x - 5);
        const sensorY = bounds.y + bounds.h / 2; // Centro vertical (evita chão/teto)

        // 1. Tilemaps (busca tiles marcados como 'wall')
        const tilemapEnts = this.entidade.engine.entidades.filter(e => e.obterComponente('TilemapComponent'));
        for (const tmEnt of tilemapEnts) {
            const tm = tmEnt.obterComponente('TilemapComponent');
            if (tm && tm.ativo) {
                const mapX = Math.floor((sensorX - tmEnt.x) / (tm.tileSize * tm.scale));
                const mapY = Math.floor((sensorY - tmEnt.y) / (tm.tileSize * tm.scale));
                
                const tile = tm.getTile(mapX, mapY);
                if (tile && tile.wall) {
                    // console.log('🧱 Inimigo detectou parede (Tile)!');
                    return true;
                }
            }
        }
        
        // 2. Objetos Sólidos (Opcional, se inimigos colidem com caixas etc)
        // Adicionar se necessário. Por enquanto foca no mapa.
        
        return false;
    }

    detectarChaoAFrente() {
        if (!this.entidade.engine) return true; // Assume chão se falhar
        
        const colComp = this.entidade.obterComponente('CollisionComponent');
        if (!colComp) return true;
        
        const bounds = colComp.obterLimitesAbsolutos(this.entidade);
        
        // Sensor: Um pouco à frente e ABAIXO do pé
        const sensorX = (this.direcao > 0) ? (bounds.x + bounds.w + 10) : (bounds.x - 10);
        const sensorY = bounds.y + bounds.h + 5; 

        // 1. Tilemaps
        let encontrouChao = false;
        const tilemapEnts = this.entidade.engine.entidades.filter(e => e.obterComponente('TilemapComponent'));
        
        for (const tmEnt of tilemapEnts) {
            const tm = tmEnt.obterComponente('TilemapComponent');
            if (tm && tm.ativo) {
                const mapX = Math.floor((sensorX - tmEnt.x) / (tm.tileSize * tm.scale));
                const mapY = Math.floor((sensorY - tmEnt.y) / (tm.tileSize * tm.scale));
                
                const tile = tm.getTile(mapX, mapY);
                // Qualquer coisa sólida serve como chão
                if (tile && (tile.wall || tile.ground || tile.plataforma)) {
                    encontrouChao = true;
                    // if (Math.random() < 0.01) console.log('Found ground tile:', mapX, mapY);
                    break;
                }
            }
        }
        
        if (!encontrouChao) {
             // Debug ocasional para não spammar
             if (Math.random() < 0.05) console.log('🕳️ [Inimigo] Sensor Abismo disparou! X:', sensorX, 'Y:', sensorY);
        }

        return encontrouChao;
    }
        
    calcularInversaoSprite(dir) {
        // Converte para boolean real (caso venha string do editor)
        const originalEsq = (String(this.spriteOriginalEsquerda) === 'true');
        const indoDireita = (dir > 0);
        
        const inverter = indoDireita ? originalEsq : !originalEsq;
        
        return inverter;
    }

    desenharGizmo(ctx) {
        if (this.morto) return;
        
        // Range de ataque (vermelho)
        ctx.strokeStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(this.entidade.x, this.entidade.y, this.rangeAtaque, 0, Math.PI * 2);
        ctx.stroke();
        
        // Range de perseguição (amarelo)
        ctx.strokeStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.entidade.x, this.entidade.y, this.rangePerseguicao, 0, Math.PI * 2);
        ctx.stroke();
    }
}
`;
    }

    gerarMovimentacaoPlataforma(info) {
        const vel = info.parametros.velocidadeHorizontal || 200;
        const pulo = info.parametros.forcaPulo || 600;
        const distParede = info.parametros.distanciaDeteccaoParede || 2;
        const wallSlideVel = info.parametros.velocidadeDeslizamento || 100;

        // Asymmetric Offsets (No auto-force, pure user control)
        const offsetLeft = parseFloat(info.parametros.offsetVisualWallEsq) || 0;
        const offsetRight = parseFloat(info.parametros.offsetVisualWallDir) || 0;

        let code = '// PLATFORMER SCRIPT v6.0 AUDIO-INTEGRATED\n';
        code += 'class MovimentacaoPlataformaScript {\n';
        code += '  constructor(entidade) {\n';
        code += '    this.entidade = entidade;\n';

        code += '    // === MOVIMENTO ===\n';
        code += '    this.velocidade = ' + vel + ';\n';
        code += '    this.velocidadeCorrida = ' + (vel * 1.8) + ';\n';
        code += '    this.forcaPulo = ' + pulo + ';\n';
        code += '    this.distanciaParede = ' + distParede + ';\n';
        code += '    this.velocidadeWallSlide = ' + wallSlideVel + ';\n';

        code += '    // === VISUAL OFFSETS ===\n';
        code += '    this.offsetWallEsq = ' + offsetLeft + ';\n';
        code += '    this.offsetWallDir = ' + offsetRight + ';\n';

        code += '    // === AUDIO (Propriedades Editaveis) ===\n';
        code += '    this.somAndar = "";\n';
        code += '    this.pitchAndar = 1.0;\n';
        code += '    this.somCorrida = "";\n';
        code += '    this.pitchCorrida = 1.0;\n';
        code += '    this.somPulo = "";\n';
        code += '    this.pitchPulo = 1.0;\n';
        code += '    this.somPousar = "";\n';
        code += '    this.pitchPousar = 1.0;\n';
        code += '    this.somWallSlide = "";\n';
        code += '    this.pitchWallSlide = 1.0;\n';

        code += '    // Controle Interno de Audio\n';
        code += '    this.audioAndarInstancia = null;\n';
        code += '    this.audioCorridaInstancia = null;\n';
        code += '    this.audioWallSlideInstancia = null;\n';
        this.audioWallSlideInstancia = null;
        code += '    this.foiNoChao = true;\n';

        code += '    this.paredeEsq = false;\n';
        code += '    this.paredeDir = false;\n';

        code += '    // Capture default visual offset\n';
        code += '    const sc = this.entidade.obterComponente("SpriteComponent");\n';
        code += '    let def = sc ? sc.offsetX : 0;\n';
        code += '    if (isNaN(def)) def = 0;\n';
        code += '    this.defaultOffsetX = def;\n';
        code += '    this.entidade.temGravidade = true;\n';
        code += '    if (!this.entidade.gravidade) this.entidade.gravidade = 1200;\n';
        code += '    \n';
        code += '    // [Collision Dynamic Init]\n';
        code += '    this._defH = 0; this._crouchH = 0; this._defOffY = 0; this._crouchOffY = 0;\n';
        code += '    const col = this.entidade.obterComponente("CollisionComponent");\n';
        code += '    if(col) {\n';
        code += '        this._defH = col.altura; this._crouchH = col.altura * 0.5;\n';
        code += '        this._defOffY = col.offsetY; this._crouchOffY = col.offsetY + (col.altura * 0.5);\n';
        code += '    }\n';
        code += '  }\n';

        code += '  // --- AUDIO HELPER ---\n';
        code += '  tocarSom(id, loop = false, controlsRef = null, pitch = 1.0) {\n';
        code += '      if (!id || !window.AudioManager) return null;\n';
        code += '      // Se já tem uma instância tocando e queremos loop, verifica se precisa atualizar pitch\n';
        code += '      if (loop && controlsRef && controlsRef.playing) {\n';
        code += '           if (controlsRef.setRate) controlsRef.setRate(pitch);\n';
        code += '           return controlsRef;\n';
        code += '      }\n';
        code += '      \n';
        code += '      const ctrl = window.AudioManager.play(id, 1.0, loop, pitch);\n';
        code += '      if (loop && ctrl) ctrl.playing = true;\n';
        code += '      return ctrl;\n';
        code += '  }\n';
        code += '  \n';
        code += '  pararSom(controlsRef) {\n';
        code += '      if (controlsRef) {\n';
        code += '          controlsRef.stop();\n';
        code += '          controlsRef.playing = false;\n';
        code += '      }\n';
        code += '  }\n\n';

        code += '  detectarParedes() {\n';
        code += '    this.paredeEsq = false; this.paredeDir = false;\n';
        code += '    if (!this.entidade.engine) return;\n';
        code += '    const tilemapEntities = this.entidade.engine.entidades.filter(e => e.obterComponente("TilemapComponent"));\n';
        code += '    if (tilemapEntities.length === 0) return;\n';
        code += '    \n';
        code += '    const colComp = this.entidade.obterComponente("CollisionComponent");\n';
        code += '    if (!colComp) return;\n';
        code += '    const bounds = colComp.obterLimitesAbsolutos(this.entidade);\n';
        code += '    const checkDist = this.distanciaParede; const marginY = 4;\n';
        code += '    const sensorTop = bounds.y + marginY;\n';
        code += '    const sensorBottom = bounds.y + bounds.h - marginY;\n';
        code += '    const sensorLeft = bounds.x - checkDist;\n';
        code += '    const sensorRight = bounds.x + bounds.w + checkDist;\n';
        code += '    \n';
        code += '    for (const tmEntity of tilemapEntities) {\n';
        code += '      const tileComp = tmEntity.obterComponente("TilemapComponent");\n';
        code += '      const tileSize = tileComp.tileSize * tileComp.scale;\n';
        code += '      const tilemapX = tmEntity.x || 0;\n';
        code += '      const tilemapY = tmEntity.y || 0;\n';
        code += '      \n';
        code += '      const startCol = Math.floor(((bounds.x - checkDist) - tilemapX) / tileSize);\n';
        code += '      const endCol = Math.floor(((bounds.x + bounds.w + checkDist) - tilemapX) / tileSize);\n';
        code += '      const startRow = Math.floor((sensorTop - tilemapY) / tileSize);\n';
        code += '      const endRow = Math.floor((sensorBottom - tilemapY) / tileSize);\n';
        code += '      \n';
        code += '      for (let r = startRow; r <= endRow; r++) {\n';
        code += '        for (let c = startCol; c <= endCol; c++) {\n';
        code += '          const tile = tileComp.getTile(c, r);\n';
        code += '          if (!tile) continue;\n';
        code += '          const tileX = tilemapX + c * tileSize;\n';
        code += '          const tileY = tilemapY + r * tileSize;\n';
        code += '          if (!tile.solid && !tile.wall && !tile.ground) continue;\n';
        code += '          const overlapsY = (sensorTop > tileY && sensorTop < tileY + tileSize && sensorBottom > tileY);\n';
        code += '          if (!overlapsY) continue;\n';
        code += '          if (tileX + tileSize > sensorLeft && tileX < bounds.x) this.paredeEsq = true;\n';
        code += '          if (tileX < sensorRight && tileX + tileSize > bounds.x + bounds.w) this.paredeDir = true;\n';
        code += '        }\n';
        code += '      }\n';
        code += '    }\n';
        code += '  }\n';
        code += '\n';
        code += '  obterScriptPorNome(nomeDaClasse) {\n';
        code += '    for (const [key, comp] of this.entidade.componentes) {\n';
        code += '      if (key.startsWith("ScriptComponent") && comp.scriptName === nomeDaClasse) return comp.instance;\n';
        code += '    }\n';
        code += '    return null;\n';
        code += '  }\n';
        code += '\n';
        code += '  processarInput(input, deltaTime) {\n';
        code += '    const attackScript = this.obterScriptPorNome("CombateMeleeScript");\n';
        code += '    const isAttacking = attackScript && attackScript.estaOcupado && attackScript.estaOcupado();\n';
        code += '    if (isAttacking) { \n';
        code += '         // Ao atacar, paramos o som de andar/corrida\n';
        code += '         this.pararSom(this.audioAndarInstancia); this.audioAndarInstancia = null;\n';
        code += '         this.pararSom(this.audioCorridaInstancia); this.audioCorridaInstancia = null;\n';
        code += '         return;\n';
        code += '    }\n';
        code += '    \n';
        code += '    const noChao = this.entidade.noChao;\n';
        code += '    \n';
        code += '    // SOM: Pousar\n';
        code += '    if (!this.foiNoChao && noChao) this.tocarSom(this.somPousar, false, null, this.pitchPousar);\n';
        code += '    this.foiNoChao = noChao;\n';
        code += '    \n';
        code += '    this.detectarParedes();\n';
        code += '    let vx = 0;\n';
        code += '    const correndo = input.teclaPressionada("Shift");\n';
        code += '    const pressEsq = input.teclaPressionada("a") || input.teclaPressionada("A") || input.teclaPressionada("ArrowLeft");\n';
        code += '    const pressDir = input.teclaPressionada("d") || input.teclaPressionada("D") || input.teclaPressionada("ArrowRight");\n';
        code += '    const pressDown = input.teclaPressionada("s") || input.teclaPressionada("S") || input.teclaPressionada("ArrowDown");\n';
        code += '    const pressJump = input.teclaPrecionadaAgora(" ") || input.teclaPrecionadaAgora("w") || input.teclaPrecionadaAgora("W") || input.teclaPrecionadaAgora("ArrowUp");\n';
        code += '    \n';
        code += '    let velAtual = this.velocidade;\n';
        code += '    if (pressDown && noChao) velAtual = this.velocidadeAgachado || (this.velocidade * 0.5);\n';
        code += '    else if (correndo) velAtual = this.velocidadeCorrida;\n';
        code += '    if (isNaN(velAtual)) velAtual = this.velocidade;\n';
        code += '    \n';
        code += '    if (pressEsq) vx = -velAtual;\n';
        code += '    if (pressDir) vx = velAtual;\n';
        code += '    if (isNaN(vx)) vx = 0;\n';
        code += '    this.entidade.velocidadeX = vx;\n';
        code += '    \n';
        code += '    // --- SOM: Andar / Correr ---\n';
        code += '    if (noChao && vx !== 0) {\n';
        code += '        if (correndo && this.somCorrida) {\n';
        code += '            // Toca Correr, para Andar\n';
        code += '            this.pararSom(this.audioAndarInstancia); this.audioAndarInstancia = null;\n';
        code += '            this.audioCorridaInstancia = this.tocarSom(this.somCorrida, true, this.audioCorridaInstancia, this.pitchCorrida);\n';
        code += '        } else {\n';
        code += '            // Toca Andar, para Correr\n';
        code += '            this.pararSom(this.audioCorridaInstancia); this.audioCorridaInstancia = null;\n';
        code += '            this.audioAndarInstancia = this.tocarSom(this.somAndar, true, this.audioAndarInstancia, this.pitchAndar);\n';
        code += '        }\n';
        code += '    } else {\n';
        code += '        this.pararSom(this.audioAndarInstancia); this.audioAndarInstancia = null;\n';
        code += '        this.pararSom(this.audioCorridaInstancia); this.audioCorridaInstancia = null;\n';

        code += '    }\n';
        code += '    \n';
        code += '    // ANIMACAO & ESTADO\n';
        code += '    const spriteComp = this.entidade.obterComponente("SpriteComponent");\n';
        code += '    const anims = spriteComp ? spriteComp.animacoes : {};\n';
        code += '    const hasAnim = (name) => anims && (anims[name] || anims[name.toLowerCase()] || anims[name.toUpperCase()]);\n';
        code += '    const playAnim = (p1, p2) => {\n';
        code += '        if (!spriteComp) return;\n';
        code += '        if (hasAnim(p1)) spriteComp.play(p1);\n';
        code += '        else if (p2 && hasAnim(p2)) spriteComp.play(p2);\n';
        code += '    };\n';
        code += '    \n';
        code += '    // WALL SLIDE LOGIC\n';
        code += '    if (!noChao && this.entidade.velocidadeY > 0 && ((this.paredeEsq && pressEsq) || (this.paredeDir && pressDir))) {\n';
        code += '       const colS = this.entidade.obterComponente("CollisionComponent");\n';
        code += '       if(colS && this._defH > 0 && colS.altura !== this._crouchH) { colS.altura = this._crouchH; colS.offsetY = this._crouchOffY; }\n';
        code += '       \n';
        code += '       if (this.entidade.velocidadeY > this.velocidadeWallSlide) this.entidade.velocidadeY = this.velocidadeWallSlide;\n';
        code += '       \n';
        code += '       // SOM: Wall Slide (Prioridade: somWallSlide > somSlide)\n';
        code += '       const somSlideFinal = this.somWallSlide;\n';
        code += '       const pitchSlideFinal = this.somWallSlide ? this.pitchWallSlide : 1.0;\n';
        code += '       this.audioWallSlideInstancia = this.tocarSom(somSlideFinal, true, this.audioWallSlideInstancia, pitchSlideFinal);\n';
        code += '       \n';
        code += '       if (this.paredeEsq) this.entidade.velocidadeX = -10;\n';
        code += '       if (this.paredeDir) this.entidade.velocidadeX = 10;\n';
        code += '       \n';
        code += '       if (hasAnim("wallslide")) spriteComp.play("wallslide");\n';
        code += '       else if (hasAnim("wall_slide")) spriteComp.play("wall_slide");\n';
        code += '       else if (hasAnim("slide")) spriteComp.play("slide");\n';
        code += '       else if (hasAnim("escalando")) spriteComp.play("escalando");\n';
        code += '       \n';
        code += '       if (spriteComp) {\n';
        code += '           if (!this.isVisualSliding) {\n';
        code += '               this.defaultOffsetX = spriteComp.offsetX || 0;\n';
        code += '               this.isVisualSliding = true;\n';
        code += '           }\n';
        code += '           if (this.paredeDir) { spriteComp.inverterX = false; spriteComp.offsetX = Number(this.defaultOffsetX) + Number(this.offsetWallDir); }\n';
        code += '           if (this.paredeEsq) { spriteComp.inverterX = true; let rawVal = Number(this.defaultOffsetX) + Number(this.offsetWallEsq); if(isNaN(rawVal)) rawVal=0; spriteComp.offsetX = rawVal; }\n';
        code += '       }\n';
        code += '       \n';
        code += '       // WALL JUMP\n';
        code += '       if (pressJump) {\n';
        code += '            this.entidade.velocidadeY = -this.forcaPulo;\n';
        code += '            // SOM: Pulo\n';
        code += '            this.tocarSom(this.somPulo);\n';
        code += '            \n';
        code += '            if (this.paredeEsq) this.entidade.velocidadeX = 300;\n';
        code += '            if (this.paredeDir) this.entidade.velocidadeX = -300;\n';
        code += '            // Reset Collider & Visual\n';
        code += '            if(colS && this._defH > 0) { colS.altura = this._defH; colS.offsetY = this._defOffY; }\n';
        code += '            if (this.isVisualSliding && spriteComp) { spriteComp.offsetX = this.defaultOffsetX; this.isVisualSliding = false; }\n';
        code += '            // Stop Wall Sound\n';
        code += '            this.pararSom(this.audioWallSlideInstancia); this.audioWallSlideInstancia = null;\n';
        code += '       }\n';
        code += '       \n';
        code += '    } else {\n';
        code += '       // NOT SLIDING: Reset Logic\n';
        code += '       this.pararSom(this.audioWallSlideInstancia); this.audioWallSlideInstancia = null;\n';
        code += '       \n';
        code += '       if (this.isVisualSliding && spriteComp) { spriteComp.offsetX = this.defaultOffsetX; this.isVisualSliding = false; }\n';
        code += '       const colS = this.entidade.obterComponente("CollisionComponent");\n';
        code += '       if(colS && this._defH > 0 && colS.altura !== this._defH) { colS.altura = this._defH; colS.offsetY = this._defOffY; }\n';
        code += '       \n';
        code += '       // JUMP NORMAL\n';
        code += '       if (noChao && pressJump) {\n';
        code += '           this.entidade.velocidadeY = -this.forcaPulo;\n';
        code += '           this.tocarSom(this.somPulo);\n';
        code += '           this.foiNoChao = false;\n';
        code += '       }\n';
        code += '       \n';
        code += '       // Animations\n';
        code += '       if (noChao) {\n';
        code += '           if (vx === 0) {\n';
        code += '               if(pressDown) {\n';
        code += '                   playAnim("crouch", "agachar");\n';
        code += '                   // [Collider Resize: Ground]\n';
        code += '                   const colG = this.entidade.obterComponente("CollisionComponent");\n';
        code += '                   if (colG) {\n';
        code += '                       if (!this._defH) { this._defH = colG.altura; this._crouchH = colG.altura * 0.5; this._defOffY = colG.offsetY; this._crouchOffY = colG.offsetY + (colG.altura * 0.5); }\n';
        code += '                       if (colG.altura !== this._crouchH) { colG.altura = this._crouchH; colG.offsetY = this._crouchOffY; }\n';
        code += '                   }\n';
        code += '               } else {\n';
        code += '                   playAnim("idle", "parado");\n';
        code += '                   // [Collider Restore]\n';
        code += '                   const colG = this.entidade.obterComponente("CollisionComponent");\n';
        code += '                   if (colG && this._defH && colG.altura !== this._defH) { colG.altura = this._defH; colG.offsetY = this._defOffY; }\n';
        code += '               }\n';
        code += '           } else {\n';
        code += '               if (pressDown) {\n';
        code += '                    playAnim("slide", "crouch_walk");\n';
        code += '                    \n';
        code += '                    this.pararSom(this.audioAndarInstancia); this.audioAndarInstancia = null;\n';
        code += '                    this.pararSom(this.audioCorridaInstancia); this.audioCorridaInstancia = null;\n';
        code += '               } else {\n';
        code += '                    if(correndo) playAnim("run", "correr");\n';
        code += '                    else playAnim("walk", "andar");\n';
        code += '               }\n';
        code += '           }\n';
        code += '       } else {\n';
        code += '           if (this.entidade.velocidadeY < 0) playAnim("jump", "pulo");\n';
        code += '           else playAnim("fall", "cair");\n';
        code += '       }\n';
        code += '       if (spriteComp) {\n';
        code += '           if (vx > 0) spriteComp.inverterX = false;\n';
        code += '           if (vx < 0) spriteComp.inverterX = true;\n';
        code += '       }\n';
        code += '    }\n';
        code += '  }\n';

        code += '  atualizar(deltaTime) {\n';
        code += '      this.entidade.x += this.entidade.velocidadeX * deltaTime;\n';
        code += '      this.entidade.y += this.entidade.velocidadeY * deltaTime;\n';
        code += '  }\n';

        // --- Exposição de Métodos no Editor ---
        code += '  // Methods exposed for audio stop on destroy/disable\n';
        code += '  onDestroy() {\n';
        code += '      this.pararSom(this.audioAndarInstancia);\n';
        code += '      this.pararSom(this.audioWallSlideInstancia);\n';
        code += '  }\n';

        code += '}\n';

        return code;
    }



    /**
     * Gera script genérico
     */
    gerarGenerico(info) {
        // Parâmetros Wall Jump (defaults se não existirem)
        const forcaWallJump = info.parametros.forcaWallJump || 650;
        const impulsoHorizontalWall = info.parametros.impulsoHorizontalWall || 300;
        const velocidadeDeslizamento = info.parametros.velocidadeDeslizamento || 50;
        const distanciaDeteccaoParede = info.parametros.distanciaDeteccaoParede || 5;

        const scriptCode = `/**
 * Script de Movimentação Plataforma (Integrado com Física + Wall Jump)
 * Gerado automaticamente pela Game Engine
 * 
 * Descrição: ${info.descricao}
 * Estados: ${info.estados.join(', ')}
 */

    const animIdle = 'idle';
    const animWalk = 'walk';
    const animRun = 'run';
    const animJump = 'jump';
    const animFall = 'fall';
    const animCrouch = 'crouch';
    const animCrouchWalk = 'crouchWalk'; // Andar agachado
    const animSlide = 'slide'; // Deslizar
    const animWallSlide = 'wallSlide'; // Wall slide

class MovimentacaoPlataformaScript {
    constructor(entidade) {
        console.log('✅ SCRIPT DE MOVIMENTAÇÃO - v5.0.1 REFACTOR-FIXED');
        this.entidade = entidade;

        // --- SEÇÃO MOVIMENTO ---
        this.SECTION_Movimentacao = 'Básico';
        this.velocidade = ${velocidadeHorizontal};
        this.velocidadeCorrida = ${velocidadeHorizontal * 1.8};
        this.velocidadeAgachado = ${velocidadeHorizontal * 0.5};
        this.forcaPulo = ${forcaPulo};

        // --- SEÇÃO WALL JUMP ---
        this.SECTION_Wall_Jump = 'Ajustes Finos';
        this.wall_forcaPulo = ${forcaWallJump}; // Força Y
        this.wall_impulso = ${impulsoHorizontalWall}; // Força X
        this.wall_slideVel = ${velocidadeDeslizamento};

        // [CONFIGURAÇÃO FINA DE DETECÇÃO]
        this.SECTION_Deteccao_Parede = 'Sensores';
        this.wall_tolerancia_dir = 25; // Distância (px) p/ Direita
        this.wall_tolerancia_esq = 25; // Distância (px) p/ Esquerda
        this.wall_margemChao = 5; // Altura (px) diferenciar chão

        // [CROUCH WALK]
        this.SECTION_Crouch = 'Agachado';
        this.crouch_velocidade = ${velocidadeHorizontal * 0.5}; // Velocidade ao andar agachado (50% normal)

        // [SLIDE]
        this.SECTION_Slide = 'Deslizar';
        this.slide_velocidade = ${velocidadeHorizontal * 2.2}; // Velocidade do slide (220% normal)
        this.slide_duracao = 0.4; // Duração do slide (segundos)
        this.slide_cooldown = 0.8; // Tempo de espera entre slides (segundos)



        // [OUTROS AJUSTES GAMEPLAY]
        this.SECTION_Gameplay = 'Timers';
        this.coyoteTime = 0.15; // Tempo para pular após cair (s)
        this.wallJumpCooldownTime = 0.2; // Tempo sem controle após WJ (s)

        // === INVENCIBILIDADE (I-FRAMES) ===
        this.SECTION_Invencibilidade = 'Sistema de Dano';
        this.iframes_duracao = 1.5; // Duração da invencibilidade (segundos)
        this.iframes_piscar = 0.1; // Velocidade do piscar (segundos)
        this.hit_animacao = 'hit'; // Nome da animação de hit (opcional)


        // Estado interno de invencibilidade
        this._invencivel = false;
        this._tempoInvencivel = 0;
        this._tempoPiscar = 0;
        this._visivel = true;
        this._tocandoHit = false; // Flag para controlar animação de hit
        this._tempoHit = 0; // Timer da animação de hit

        // === MORTE ===
        this._morto = false;
        this._tempoMorte = 0;
        this._deathScreenAtivado = false;

        // Wall Jump / Slide
        this.paredeEsq = false;
        this.paredeDir = false;
        this.naParede = false;
        this.contatoParedeReal = false;
        this.direcaoParede = 0;
        this.wallStickBuffer = 0;
        // Slide
        this.slideTimer = 0; // Tempo restante do slide
        this.slideCooldownTimer = 0; // Cooldown entre slides
        this.slideDirecao = 0; // Direção do slide (1 = direita, -1 = esquerda)


        this.estado = 'parado';

        // Garante que a gravidade da engine esteja ligada
        if (!this.entidade.temGravidade) {
            console.log('Script: Ativando gravidade da entidade');
            this.entidade.temGravidade = true;
            // Se a gravidade da entidade estiver zerada, define um padrão
            if (this.entidade.gravidade === 0) this.entidade.gravidade = 1200;
        }

        // Inicializa velocidade X
        this.entidade.violenciaX = 0;

        this.coyoteTimer = 0;
    }

    /**
     * Processa input do jogador (Mouse/Teclado -> Engine -> Aqui)
     */
    processarInput(engine) {
        // Inicializa Ponto de Respawn
        if (!this.spawnDefinido) {
            this.entidade.startX = this.entidade.x;
            this.entidade.startY = this.entidade.y;
            this.spawnDefinido = true;
            console.log('🏁 [Platformer] Spawn Point definido em:', this.entidade.x, this.entidade.y);
        }

        this.engine = engine; // Guarda ref para debug se precisar

        // Decrementa cooldown do Wall Jump
        if (this.wallJumpCooldown > 0) {
            // Se estiver em cooldown, pode limitar controle
        }

        let vx = 0;
        const noChao = this.entidade.noChao;
        let direcaoInput = 0;

        // Verifica se está em slide
        const emSlide = this.slideTimer > 0;

        // Inputs Especiais
        const correndo = engine.teclaPressionada('Shift');
        const agachando = (engine.teclaPressionada('s') || engine.teclaPressionada('S') || engine.teclaPressionada('ArrowDown')) && noChao && !emSlide;

        /*
        // Slide: Press C or Ctrl while moving on ground
        const tentouSlide = (engine.teclaPrecionadaAgora('c') || engine.teclaPrecionadaAgora('C') || engine.teclaPrecionadaAgora('Control'));
        
        if (tentouSlide && noChao && !emSlide && this.slideCooldownTimer <= 0 && Math.abs(this.entidade.velocidadeX) > 10) {
            // Inicia slide
            this.slideTimer = this.slide_duracao;
            this.slideDirecao = this.entidade.velocidadeX > 0 ? 1 : -1;
            this.estado = 'slide';
        }
        */

        // Teclas A/D ou Setas para movimento horizontal
        if (this.wallJumpCooldown <= 0 && !emSlide) {
            // Define velocidade base
            let vel = this.mov_velocidade;

            if (agachando) {
                // Movimento agachado - velocidade reduzida
                vel = this.crouch_velocidade;
            } else if (correndo) {
                // Correndo - velocidade aumentada
                vel = this.mov_corrida;
            }

            if (engine.teclaPressionada('a') || engine.teclaPressionada('A') || engine.teclaPressionada('ArrowLeft')) {
                vx = -vel;
                direcaoInput = -1;
            }
            if (engine.teclaPressionada('d') || engine.teclaPressionada('D') || engine.teclaPressionada('ArrowRight')) {
                vx = vel;
                direcaoInput = 1;
            }

            this.entidade.velocidadeX = vx;
        } else if (emSlide) {
            // Durante slide: movimento automático na direção do slide
            this.entidade.velocidadeX = this.slideDirecao * this.slide_velocidade;
            direcaoInput = this.slideDirecao;
        } else if (this.wallJumpCooldown > 0) {
            // Mantém inércia durante cooldown do walljump (opcional)
        }

        // Detectar Parede SEMPRE
        this.detectarParede(direcaoInput);

        // Reseta se estiver no chão
        if (noChao) {
            this.naParede = false;
        }

        // Pular
        if ((engine.teclaPrecionadaAgora(' ') || engine.teclaPrecionadaAgora('ArrowUp'))) {
            // Pulo do chão
            if (noChao && !agachando) {
                this.pular();
            }
            // Wall Jump
            else if (this.naParede && !noChao) {
                this.wallJump();
            }
        }

        // Atualizar estado lógico
        if (emSlide) {
            this.estado = 'slide';
        } else if (this.wallJumpCooldown > 0) {
            this.estado = 'pulando';
        } else if (this.naParede && !noChao) {
            this.estado = 'naParede';
        } else if (!noChao) {
            if (this.entidade.velocidadeY < 0) this.estado = 'pulando';
            else this.estado = 'caindo';
        } else if (agachando) {
            // Diferencia entre agachado parado e andando
            if (vx !== 0) {
                this.estado = 'crouchWalk'; // Novo estado
            } else {
                this.estado = 'agachado';
            }
        } else if (vx !== 0) {
            this.estado = correndo ? 'correndo' : 'andando';
        } else {
            this.estado = 'parado';
        }

        // --- DINAMICA DE COLISOR (Crouch/Slide) ---
        // Ajusta altura do colisor se estiver agachado ou deslizando
        const col = this.entidade.obterComponente('CollisionComponent');
        if (col) {
            // Inicializa defaults se ainda não fez
            if (this._defaultH === undefined) {
                this._defaultH = col.altura;
                this._defaultOffY = col.offsetY;
                this._crouchH = col.altura * 0.5; // Metade da altura
                this._crouchOffY = col.offsetY + (col.altura * 0.5); // Baixa o offset para manter no chão
            }

            const isCrouchState = (this.estado === 'agachado' || this.estado === 'crouchWalk' || this.estado === 'slide');
            
            if (isCrouchState) {
                // Debug State
                // if (Math.random() < 0.01) console.log('DEBUG CROUCH: Estado:', this.estado, 'Altura:', col.altura, 'Target:', this._crouchH);

                if (col.altura !== this._crouchH) {
                    console.log('📉 Crouch Collider Ativado! Old:', col.altura, 'New:', this._crouchH);
                    col.altura = this._crouchH;
                    col.offsetY = this._crouchOffY;
                }
            } else {
                // Tenta levantar (Verifica teto seria ideal, mas por enquanto direto)
                if (col.altura !== this._defaultH) {
                    console.log('📈 Stand Collider Restaurado! Old:', col.altura, 'New:', this._defaultH);
                    col.altura = this._defaultH;
                    col.offsetY = this._defaultOffY;
                }
            }
        }
    }

    pular() {
        this.entidade.velocidadeY = -this.mov_pulo;
        this.entidade.noChao = false;
    }

    wallJump() {
        this.entidade.velocidadeY = -this.wall_forcaPulo;

        // Impulso para o lado oposto da parede
        const direcaoPulo = -this.direcaoParede;
        this.entidade.velocidadeX = direcaoPulo * this.wall_impulso;

        // Cooldown para não voltar pra parede instantaneamente
        this.wallJumpCooldown = this.wallJumpCooldownTime || 0.2;
        this.naParede = false;
        console.log('🧗 Wall Jump!');
    }


    detectarParede(direcaoInput) {
        // LOG GLOBAL ENTITY
        console.log(">> DETECTAR PAREDE CHAMADO", this.entidade.noChao);

        // Só detecta parede se estiver NO AR
        if (this.entidade.noChao) {
            this.naParede = false;
            return;
        }

        // DESTICK: Se apertar para longe da parede, solta

        this.naParede = false;
        this.contatoParedeReal = false;
        this.distanciaBaseParede = 0; // Reset da métrica anti-seam // Indica se há contato FÍSICO neste frame (sem buffer)

        if (!this.entidade.engine) return;

        // DESTICK: Se apertar para longe da parede, solta imediatamente
        if (this.direcaoParede === 1 && direcaoInput === -1) {
            return;
        }
        if (this.direcaoParede === -1 && direcaoInput === 1) {
            return;
        }

        const colComp = this.entidade.obterComponente('CollisionComponent');
        if (!colComp) return;

        const bounds = colComp.obterLimitesAbsolutos(this.entidade);
        let paredeEncontrada = false;

        // --- 1. Detecção por OBJETOS (Entidades Sólidas) ---
        for (const outra of this.entidade.engine.entidades) {
            if (outra === this.entidade) continue;

            if (outra.solido) {
                const outraCol = outra.obterComponente('CollisionComponent');
                if (outraCol && outraCol.ativo) {
                    const outraBounds = outraCol.obterLimitesAbsolutos(outra);

                    // Usa CENTRO do player para garantir simetria (funcionar esq/dir igual)
                    const playerCenterX = bounds.x + bounds.w / 2;
                    const playerHalfWidth = bounds.w / 2;

                    const playerLeft = bounds.x;
                    const playerRight = bounds.x + bounds.w;
                    const wallLeft = outraBounds.x;
                    const wallRight = outraBounds.x + outraBounds.w;

                    // Tolerância configurável (DIR/ESQ SEPARADOS)
                    const tolDir = this.wall_tolerancia_dir || 25;
                    const tolEsq = this.wall_tolerancia_esq || 25;

                    // Filtro de Chão SIMPLIFICADO E SEGURO
                    // Se o topo do objeto está abaixo do pé do player (-margem), é chão.
                    const margem = this.wall_margemChao || 5;
                    const isChao = outraBounds.y >= (bounds.y + bounds.h - margem);
                    if (isChao) continue;

                    // Checa DIREITA - player tentando ir para direita
                    // Distância do lado direito do player até o lado esquerdo da parede
                    // -30 a 0: permite após física empurrar (-30 a 0), SEM tolerância extra
                    const distDireita = wallLeft - playerRight;
                    if (distDireita >= -30 && distDireita <= 0) {
                        if (direcaoInput >= 0) {
                            paredeEncontrada = true;
                            this.direcaoParede = 1;
                        }
                    }

                    // Checa ESQUERDA - player tentando ir para esquerda
                    // Distância do lado esquerdo do player até o lado direito da parede
                    const distEsquerda = playerLeft - wallRight;
                    if (distEsquerda >= -30 && distEsquerda <= 0) {
                        if (direcaoInput <= 0) {
                            paredeEncontrada = true;
                            this.direcaoParede = -1;
                        }
                    }
                }
            }
        }

        // --- 2. Detecção por TILEMAPS (Tiles Sólidos) ---
        if (!paredeEncontrada) {
            const tilemapEnts = this.entidade.engine.entidades.filter(e => e.obterComponente('TilemapComponent'));

            for (const tilemapEnt of tilemapEnts) {
                const tilemap = tilemapEnt.obterComponente('TilemapComponent');
                if (!tilemap || !tilemap.ativo) continue;

                const scale = tilemap.scale || 1;
                const tileSize = (tilemap.tileSize || 32) * scale;
                if (tileSize <= 0) continue;

                // Converter bounds do player para coordenadas de grid
                const relX = bounds.x - tilemapEnt.x;
                const relY = bounds.y - tilemapEnt.y;

                // Calcular area de verificação expandida para detectar paredes próximas
                const tolDir = this.wall_tolerancia_dir || 25;
                const tolEsq = this.wall_tolerancia_esq || 25;
                const maxTol = Math.max(tolDir, tolEsq);

                const startCol = Math.floor((relX - maxTol) / tileSize);
                const endCol = Math.floor((relX + bounds.w + maxTol) / tileSize);
                const startRow = Math.floor(relY / tileSize);
                const endRow = Math.floor((relY + bounds.h) / tileSize);

                // Usar centro do player para cálculos
                const playerCenterX = bounds.x + bounds.w / 2;
                const playerHalfWidth = bounds.w / 2;
                const margem = this.wall_margemChao || 5;

                // Log Entry
                console.log("DetectarParede (Gen): checking tilemap...");

                // Verificar tiles ao redor do player
                for (let r = startRow; r <= endRow; r++) {
                    for (let c = startCol; c <= endCol; c++) {
                        const tile = tilemap.getTile(c, r);
                        if (tile) console.log("TileFound:", c, r, JSON.stringify(tile));
                        
                        // DEBUG LOG (Ativo)
                        if (tile && (tile.wall || tile.ground)) console.log("GenCheck:", c, r, "W:", tile.wall, "G:", tile.ground);

                        // Verificar se é tile sólido (não-plataforma)
                        let isSolid = false;
                        if (tile && typeof tile === 'object' && (tile.solid || tile.wall) && !tile.plataforma) {
                            isSolid = true;
                        }

                        if (isSolid) {
                            // Calcular posição absoluta do tile
                            const tileX = tilemapEnt.x + c * tileSize;
                            const tileY = tilemapEnt.y + r * tileSize;

                            // Calcular posições das bordas
                            const playerLeft = bounds.x;
                            const playerRight = bounds.x + bounds.w;
                            const playerTop = bounds.y;
                            const playerBottom = bounds.y + bounds.h;
                            const playerCenterY = bounds.y + bounds.h / 2;

                            const tileLeft = tileX;
                            const tileRight = tileX + tileSize;
                            const tileTop = tileY;
                            const tileBottom = tileY + tileSize;
                            const tileCenterY = tileY + tileSize / 2;

                            // ---------------------------------------------------------
                            // NOVA LÓGICA V3: PRIORIDADE PARA DADOS DO TILE (WEB-IDE STYLE)
                            // ---------------------------------------------------------

                            // Se o tile tem definição explícita de "Wall" ou "Ground"
                            const isExplicitWall = !!tile.wall;
                            const isExplicitGround = !!tile.ground;

                            // Se for marcado como CHÃO explícito: ignora wall slide
                            if (isExplicitGround) continue;

                            // Se for marcado como PAREDE explícita: checa lado e aplica
                            if (isExplicitWall) {
                                // 1. Geometric Check: Aspect Ratio (CRÍTICO)
                                // Se o overlap horizontal for maior que o vertical, é interação de Chão/Teto, não Parede.
                                const overY1 = Math.max(bounds.y, tileY);
                                const overY2 = Math.min(bounds.y + bounds.h, tileY + tileSize);
                                const overlapY = overY2 - overY1;

                                const overX1 = Math.max(bounds.x, tileX);
                                const overX2 = Math.min(bounds.x + bounds.w, tileX + tileSize);
                                const overlapX = overX2 - overX1;

                                if (overlapX > overlapY) continue; // É Chão! 

                                if (overlapY < 10) continue; // Muito pequeno

                                // 2. Checagem de Topo (Refinamento)
                                const margemTopo = 8;
                                if (playerBottom < tileTop + margemTopo) continue;

                                // 3. Checagem Lateral Estrita
                                const tileCX = tileX + tileSize / 2;
                                const playerCX = bounds.x + bounds.w / 2;

                                // INPUT ESTRITO:
                                // INPUT ESTRITO + LOGS
                                if (tileCX > playerCX && direcaoInput > 0) {
                                    // Direita
                                    //console.log('DETECTADO DIREITA');
                                    paredeEncontrada = true;
                                    this.direcaoParede = 1;
                                    break;
                                } else if (tileCX < playerCX && direcaoInput < 0) {
                                    // Esquerda
                                    //console.log('DETECTADO ESQUERDA');
                                    paredeEncontrada = true;
                                    this.direcaoParede = -1;
                                    break;
                                }
                            }

                            // ---------------------------------------------------------
                            // FALLBACK (SENSOR V2): Lógica Geométrica para Tiles sem Tags
                            // ---------------------------------------------------------
                            // ---------------------------------------------------------
                            // FALLBACK REMOVIDO: Wall Slide requer tag 'isWall' explícita
                            // ---------------------------------------------------------
                            /* 
                                Lógica de fallback removida para garantir que o slide 
                                SÓ aconteça em tiles marcados manualmente no editor.
                            */
                        }
                    }
                    if (paredeEncontrada) break;
                }
            }
        }

        // Aplicar buffer para manter estado estável em tile sets
        if (paredeEncontrada) {
            this.naParede = true;
            this.contatoParedeReal = true;
            this.wallStickBuffer = 0.15; // Mantém por 150ms apenas para PULO
        } else {
            // Só desliga se o buffer expirou
            if (this.wallStickBuffer <= 0) {
                this.naParede = false;
            }
        }
    }

    atualizar(deltaTime) {
        // DETECTAR PAREDES (V5.0) - Executa antes de tudo
        this.detectarParede(0);

        // ===== VERIFICAÇÃO DE MORTE =====
        if (!this._morto && this.entidade.hp !== undefined && this.entidade.hp <= 0) {
            this._morto = true;
            this._tempoMorte = 0; // Inicia contador
            this.entidade.velocidadeX = 0;
            this.entidade.velocidadeY = 0;

            // Toca animação death
            const sprite = this.entidade.obterComponente('SpriteComponent');
            if (sprite) {
                sprite.autoplayAnim = ''; // Desabilita autoplay
                sprite.play('death');

                // Garante que não faz loop
                if (sprite.animacoes && sprite.animacoes['death']) {
                    sprite.animacoes['death'].loop = false;
                }
            }

            // Animação de morte tocada
            // console.log('💀 Player morreu! Animação death iniciada.');
        }

        // Se morto, aguarda animação completar e ativa DeathScreen
        if (this._morto) {
            this.entidade.velocidadeX = 0;
            this.entidade.velocidadeY = 0;

            // Incrementa tempo de morte
            if (!this._tempoMorte) this._tempoMorte = 0;
            this._tempoMorte += deltaTime;

            // Aguarda 1.5s (tempo suficiente para animação) e ativa DeathScreen
            if (this._tempoMorte >= 1.5 && !this._deathScreenAtivado) {
                this._deathScreenAtivado = true;

                console.log('💀 Procurando DeathScreen...');

                // Procura o DeathScreen em todos os componentes
                for (const [tipo, comp] of this.entidade.componentes.entries()) {
                    if (comp.tipo === 'ScriptComponent' && comp.instance) {
                        const nome = comp.instance.constructor.name;
                        console.log('🔍 Script encontrado:', nome);

                        if (nome === 'DeathScreenScript') {
                            console.log('💀 Ativando Death Screen!');
                            if (comp.instance.onDeath) {
                                comp.instance.onDeath(null, null); // Chama o método correto
                            }
                            break;
                        }
                    }
                }
            }

            return; // Para aqui - não processa movimento nem animações
        }

        // Cooldown
        if (this.wallJumpCooldown > 0) this.wallJumpCooldown -= deltaTime;

        // Wall Stick Buffer (decrementar)
        if (this.wallStickBuffer > 0) this.wallStickBuffer -= deltaTime;

        // Slide Timer (decrementar)
        if (this.slideTimer > 0) {
            this.slideTimer -= deltaTime;
            if (this.slideTimer <= 0) {
                // Slide terminou, inicia cooldown
                this.slideCooldownTimer = this.slide_cooldown;
            }
        }

        // Slide Cooldown (decrementar)
        if (this.slideCooldownTimer > 0) this.slideCooldownTimer -= deltaTime;

        // Coyote Time
        if (this.entidade.noChao) {
            this.coyoteTimer = this.coyoteTime;
            this.naParede = false;
            this.wallStickBuffer = 0; // Reseta buffer ao tocar no chão
        } else {
            this.coyoteTimer -= deltaTime;
            // ==== WALL SLIDE V5.0 (FINAL) ====
            // Lógica simplificada baseada em flags de sensor
            this.contatoParedeReal = false;

            const inputEsquerda = direcaoInput < 0;
            const inputDireita = direcaoInput > 0;

            let shouldSlide = false;

            if (!this.entidade.noChao && this.entidade.velocidadeY >= 0) {

                // Slide Esquerda
                if (this.paredeEsq && inputEsquerda) {
                    this.direcaoParede = -1;
                    this.contatoParedeReal = true;
                    shouldSlide = true;
                    // Removed lateral push
                }
                // Slide Direita
                else if (this.paredeDir && inputDireita) {
                    this.direcaoParede = 1;
                    this.contatoParedeReal = true;
                    shouldSlide = true;
                    // Removed lateral push
                }
            }

            if (shouldSlide) {
                // Anti-Stick: Se velocidade travou em 0 nas emendas, força descida
                if (this.entidade.velocidadeY === 0) {
                    this.entidade.y += 1;
                }
                this.entidade.velocidadeY = this.wall_slideVel;

                // Estado visual
                this.naParede = true;
                this.wallStickBuffer = 0.15;

                // Animação override
                this.entidade.animacaoAtual = 'wall_slide';
                const sprite = this.entidade.obterComponente('SpriteComponent');
                if (sprite) {
                    sprite.flipX = this.direcaoParede === -1;
                    sprite.play('wall_slide');
                }
            }

            // Verifica cooldown de estado 'naParede' para Pulos
            if (!shouldSlide && this.wallStickBuffer <= 0) {
                this.naParede = false;
            }

            // Respawn
            if (this.entidade.y > 2000) {
                this.entidade.y = 0;
            }

            // === CONTROLA DURAÇÃO DA ANIMAÇÃO DE HIT (DEVE ESTAR AQUI, SEMPRE EXECUTA) ===
            if (this._tocandoHit) {
                this._tempoHit += deltaTime;

                // Após 0.5s, volta para idle
                if (this._tempoHit >= 0.5) {
                    this._tocandoHit = false;

                    const spriteHit = this.entidade.obterComponente('SpriteComponent');
                    if (spriteHit) {
                        spriteHit.play(animIdle);
                    }
                }
            }

            //Lógica de Animação e Espelhamento ---
            const sprite = this.entidade.obterComponente('SpriteComponent');
            const col = this.entidade.obterComponente('CollisionComponent');

            // Lógica de Direção Simples (CollisionComponent trata o Offset agora)
            const virarPara = (direita) => {
                if (sprite) sprite.inverterX = !direita;
            };

            // Verifica estado do script
            let scriptOcupado = false;
            for (const comp of this.entidade.componentes.values()) {
                if (comp.tipo === 'ScriptComponent' && comp.instance && comp.instance.estaOcupado && comp.instance !== this) {
                    if (comp.instance.estaOcupado()) { scriptOcupado = true; break; }
                }
            }
            if (!scriptOcupado) {
                // Aplica direção
                if (this.naParede) {
                    if (this.direcaoParede === 1) virarPara(true);
                    else virarPara(false);
                } else if (Math.abs(this.entidade.velocidadeX) > 0.1) {
                    if (this.entidade.velocidadeX > 0) virarPara(true);
                    else virarPara(false);
                }
            }

            // Seleção de Animação - SÓ se não estiver ocupado!
            const isGrounded = this.entidade.noChao || (this.coyoteTimer > 0 && this.entidade.velocidadeY >= 0);

            // IMPORTANTE: Não sobrescrever animação de hit enquanto estiver tocando
            const estaTocandoHit = this._tocandoHit;

            if (!scriptOcupado && !estaTocandoHit && sprite) {
                if (this.naParede && !isGrounded) {
                    if (sprite.animacoes && sprite.animacoes[animWallSlide]) {
                        sprite.play(animWallSlide);
                    } else {
                        sprite.play(animIdle); // Fallback
                    }
                } else if (!isGrounded) {
                    if (this.entidade.velocidadeY < 0) sprite.play(animJump);
                    else sprite.play(animFall) || sprite.play(animJump);
                } else {
                    if (this.estado === 'slide') {
                        // Slide - animação de deslizar
                        if (sprite.animacoes && sprite.animacoes[animSlide]) {
                            sprite.play(animSlide);
                        } else if (sprite.animacoes && sprite.animacoes[animCrouch]) {
                            sprite.play(animCrouch);
                        } else {
                            sprite.play(animIdle);
                        }
                    } else if (this.estado === 'crouchWalk') {
                        // Andar agachado - tenta usar animação específica, senão usa crouch normal
                        if (sprite.animacoes && sprite.animacoes[animCrouchWalk]) {
                            sprite.play(animCrouchWalk);
                        } else {
                            sprite.play(animCrouch) || sprite.play(animIdle);
                        }
                    } else if (this.estado === 'agachado') {
                        sprite.play(animCrouch) || sprite.play(animIdle);
                    } else if (Math.abs(this.entidade.velocidadeX) > 10) {
                        if (this.estado === 'correndo' && sprite.animacoes && sprite.animacoes[animRun]) {
                            sprite.play(animRun);
                        } else {
                            sprite.play(animWalk);
                        }
                    } else {
                        sprite.play(animIdle);
                    }
                } // Fecha verificação !scriptOcupado

                // === ATUALIZA INVENCIBILIDADE ===
                if (this._invencivel) {
                    this._tempoInvencivel += deltaTime;
                    this._tempoPiscar += deltaTime;

                    // Piscar (alternando flag)
                    if (this._tempoPiscar >= this.iframes_piscar) {
                        this._tempoPiscar = 0;
                        this._visivel = !this._visivel;

                        // Marca entidade como piscando
                        this.entidade._piscando = !this._visivel;
                    }

                    // Fim da invencibilidade
                    if (this._tempoInvencivel >= this.iframes_duracao) {
                        this._invencivel = false;
                        this._visivel = true;
                        this.entidade._piscando = false;

                        console.log('🛡️ Invencibilidade terminou (durou', this._tempoInvencivel.toFixed(2), 's)');
                    }
                }
            }
        }

        /**
         * Método chamado quando o player recebe dano
         * IMPORTANTE: Este método é chamado pelo sistema de combate
         */
        receberDano(quantidade) {
            // Se está invencível, ignora o dano
            if (this._invencivel) {
                console.log('🛡️ Dano bloqueado (invencível)');
                return 0;
            }

            console.log('💥 [Platformer] Player recebeu', quantidade, 'de dano!');
            console.log('   Duração invencibilidade:', this.iframes_duracao, 's');

            // Ativa invencibilidade
            this._invencivel = true;
            this._tempoInvencivel = 0;
            this._tempoPiscar = 0;

            // Toca animação de hit (se existir)
            const sprite = this.entidade.obterComponente('SpriteComponent');
            if (sprite && sprite.animacoes && sprite.animacoes[this.hit_animacao]) {
                sprite.play(this.hit_animacao);
                this._tocandoHit = true;
                this._tempoHit = 0;
                console.log('💥 Tocando animação:', this.hit_animacao);
            } else if (sprite) {
                // Se não tem animação de hit, apenas pisca vermelho
                sprite.flashing = true;
                sprite.flashDuration = 0.2;
            }

            // Procura o StatsRPG para aplicar o dano
            let danoAplicado = false;
            for (const [tipo, comp] of this.entidade.componentes.entries()) {
                if (comp.tipo === 'ScriptComponent' && comp.instance) {
                    const nome = comp.instance.constructor.name;

                    if (nome === 'StatsRPG' && comp.instance.receberDano) {
                        comp.instance.receberDano(quantidade);
                        danoAplicado = true;
                        break;
                    }
                }
            }

            // Se não encontrou StatsRPG, aplica dano direto no HP
            if (!danoAplicado && this.entidade.hp !== undefined) {
                this.entidade.hp -= quantidade;
                console.log('   HP:', this.entidade.hp);
            }

            return quantidade;
        }

        obterEstado() { return this.estado; }

        detectarParedes() {
            const tilemapComp = this.entidade.engine.entidades.find(e => e.obterComponente('TilemapComponent'));
            if (!tilemapComp) return;

            const tilemap = tilemapComp.obterComponente('TilemapComponent');
            const tileSize = tilemap.tileSize * tilemap.scale;

            const bounds = this.entidade.obterComponente('CollisionComponent').bounds;

            // Resetar flags
            this.paredeEsq = false;
            this.paredeDir = false;

            // SENSOR CENTRAL (A solução V5)
            // Ignora a cabeça e os pés para não colidir com emendas de chão/teto
            const sensorMarginY = 8;
            const sensorTop = bounds.y + sensorMarginY;
            const sensorBottom = bounds.y + bounds.h - sensorMarginY;
            const sensorLeft = bounds.x - 2; // Olha 2px pra esquerda
            const sensorRight = bounds.x + bounds.w + 2; // Olha 2px pra direita

            // Grid range (Otimização)
            const startCol = Math.floor((bounds.x - tileSize) / tileSize);
            const endCol = Math.floor((bounds.x + bounds.w + tileSize) / tileSize);
            const startRow = Math.floor(sensorTop / tileSize);
            const endRow = Math.floor(sensorBottom / tileSize);

            for (let r = startRow; r <= endRow; r++) {
                for (let c = startCol; c <= endCol; c++) {
                    const tile = tilemap.getTile(c, r);
                    if (!tile || !tile.wall) continue; // SÓ ACEITA 'isWall'

                    const tileX = tilemapComp.x + c * tileSize;
                    const tileY = tilemapComp.y + r * tileSize;
                    const tileW = tileSize;
                    const tileH = tileSize;

                    // AABB Check contra o Sensor
                    const overlapsY = (sensorTop < tileY + tileH && sensorBottom > tileY);
                    if (!overlapsY) continue;

                    // Check Esquerda
                    if (tileX + tileW > sensorLeft && tileX < bounds.x) {
                        this.paredeEsq = true;
                    }

                    // Check Direita
                    if (tileX < sensorRight && tileX + tileW > bounds.x + bounds.w) {
                        this.paredeDir = true;
                    }
                }
            }
        }
    }
`;
        console.error('=== FULL GENERATED SCRIPT ===');
        console.error(scriptCode);
        console.error('=== END FULL SCRIPT ===');

        // Try to find the syntax error
        try {
            new Function(scriptCode);
            console.log('✅ Script syntax is valid!');
        } catch (e) {
            console.error('❌ SYNTAX ERROR IN GENERATED SCRIPT:', e.message);
            console.error('Error at:', e.stack);

            // Show lines around potential error
            const lines = scriptCode.split('\n');
            console.error('Total lines:', lines.length);
            console.error('Line 40:', lines[39]);
            console.error('Line 41:', lines[40]);
            console.error('Line 42:', lines[41]);
        }

        return scriptCode;
    }

    /**
         * Gera script genérico
         */
    gerarGenerico(info) {
        return `/**
 * Script de ${info.nome}
 * Gerado automaticamente pela Game Engine
 * 
 * Descrição: ${info.descricao}
 * Estados: ${info.estados.join(', ')}
 * 
 * Parâmetros:
${Object.entries(info.parametros).map(([k, v]) => ` * - ${k}: ${v}`).join('\n')}
 */

    // Implemente seu script customizado aqui
    `;
    }

    /**
     * Gera script de Interação (Placa/NPC)
     * Requer "Plugin: Texto Flutuante" ou "DialogueComponent"
     */
    gerarScriptInteracao() {
        return `/**
 * Script de Objeto Interativo (Placa / NPC)
 * Exibe texto ao entrar na área (Trigger).
 * REQUER: Componente "Plugin: Texto Flutuante" adicionado nesta entidade.
 */
class InteractionScript {
    constructor(entidade) {
        this.entidade = entidade;
        // Configurações
        this.mensagem = "Olá, Viajante!";
        this.cor = "yellow";
        this.cooldown = 0;
        this.tempoExibicao = 2.0; // Intervalo para mostrar novamente
        this.apenasUmaVez = false; // Se true, exibe apenas a primeira vez

        // Estado Interno
        this.jaExecutou = false;
    }

    atualizar(dt) {
        if (this.cooldown > 0) {
            this.cooldown -= dt;
        }

        // --- DETECÇÃO POR PROXIMIDADE (Fix para NPCs com Física/Gravidade) ---
        // Permite que o diálogo ative mesmo se o colisor for Sólido (não-Trigger)
        if (!this.player) {
            // Tenta encontrar o player na cena
            if (this.entidade.engine && this.entidade.engine.entidades) {
                this.player = this.entidade.engine.entidades.find(e => e.nome === 'Player' || e.tipo === 'player');
            }
        }

        if (this.player) {
            const dx = this.player.x - this.entidade.x;
            const dy = this.player.y - this.entidade.y;
            // Distância ao quadrado é mais rápido (3600 = 60px * 60px)
            const distSq = dx * dx + dy * dy;

            if (distSq < 3600) {
                const dialogueComp = this.entidade.obterComponente('DialogueComponent');

                // Monitora estado do diálogo para aplicar Cooldown ao final
                if (dialogueComp) {
                    if (dialogueComp.ativo) {
                        this.dialogoEstavaAtivo = true;
                        return; // Enquanto fala, não faz nada
                    } else if (this.dialogoEstavaAtivo) {
                        // Acabou de fechar? Aplica cooldown para não reabrir na hora
                        this.dialogoEstavaAtivo = false;
                        this.cooldown = 2.0; // Espera 2 segundos
                        return;
                    }
                }

                // Só ativa se o diálogo AINDA NÃO estiver ativo e sem cooldown
                if (dialogueComp && !dialogueComp.ativo && this.cooldown <= 0) {
                    this.mostrarMensagem();
                } else if (!dialogueComp && this.cooldown <= 0) {
                    // Fallback para texto flutuante
                    this.mostrarMensagem();
                }
            }
        }
    }

    /**
     * Chamado quando algo entra no Trigger (Requer CollisionComponent com isTrigger=true)
     */
    onTriggerEnter(outro) {
        // Verifica se é o Player
        if (outro.nome === 'Player' || outro.tipo === 'player' || outro.obterComponente('PlayerControl')) {
            this.mostrarMensagem();
        }
    }

    // Suporte também a colisão física, caso não seja trigger
    onCollisionEnter(outro) {
        if (outro.nome === 'Player' || outro.tipo === 'player') {
            this.mostrarMensagem();
        }
    }

    mostrarMensagem() {
        if (this.apenasUmaVez && this.jaExecutou) return;
        if (this.cooldown > 0) return;

        // 1. Tenta ativar Sistema de Diálogo (Prioridade)
        const dialogueComp = this.entidade.obterComponente('DialogueComponent');
        if (dialogueComp) {
            console.log('[Interaction] Iniciando Diálogo...');
            dialogueComp.iniciar();
            this.jaExecutou = true;
            return;
        }

        // 2. Fallback: Texto Flutuante
        // Procura o Script de Texto Flutuante nesta mesma entidade
        // Se a função obterComponentesPorTipo não existir (backup), tenta buscar manual
        let scripts = [];
        if (this.entidade.obterComponentesPorTipo) {
            scripts = this.entidade.obterComponentesPorTipo('ScriptComponent');
        } else {
            // Fallback rudimentar se não atualizou Entidade.js
            for (const c of this.entidade.componentes.values()) {
                if (c.tipo === 'ScriptComponent') scripts.push(c);
            }
        }

        let textPlugin = null;

        console.log('[InteractionScript] Procurando FloatingTextScript... Scripts encontrados:', scripts.length);
        for (const s of scripts) {
            console.log('[InteractionScript] Verificando script:', s.scriptClassName, 'tem spawn?', s.instance && !!s.instance.spawn);
            if (s.instance && s.instance.spawn) {
                textPlugin = s.instance;
                console.log('[InteractionScript] FloatingTextScript encontrado!');
                break;
            }
        }

        if (textPlugin) {
            // Efeito visual
            console.log('[InteractionScript] Chamando spawn com:', this.mensagem, this.cor);
            textPlugin.spawn(this.mensagem, this.cor, 0, -50);
            this.cooldown = this.tempoExibicao;
            this.jaExecutou = true;
        } else {
            console.warn('[InteractionScript] Requer "Plugin: Texto Flutuante" ou "Dialogue System" para funcionar.');
        }
    }
}
`;
    }

    /**
     * Gera script de Texto Flutuante (Dano/Popups)
     */
    gerarScriptTextoFlutuante() {
        return [
            "/**",
            " * Script de Texto Flutuante (Damage Numbers / Popups)",
            " * Permite exibir textos que sobem e somem (ex: Dano, XP, Falas)",
            " */",
            "class FloatingTextScript {",
            "    constructor(entidade) {",
            "        this.entidade = entidade;",
            "        this._textos = []; // Lista de textos ativos {x, y, text, color, life, maxLife, velocityY}",
            "    }",
            "",
            "    spawn(texto, cor = 'white', offsetX = 0, offsetY = 0) {",
            "        if (!this._textos) this._textos = [];",
            "        // console.log('[FloatingText] Spawning:', texto);",
            "        this._textos.push({",
            "            text: texto,",
            "            color: cor,",
            "            x: offsetX,",
            "            y: offsetY,",
            "            life: 1.0,",
            "            maxLife: 1.0,",
            "            velocityY: -50,",
            "            scale: 1.0",
            "        });",
            "    }",
            "",
            "    atualizar(dt) {",
            "        if (!this._textos) return;",
            "        for (let i = this._textos.length - 1; i >= 0; i--) {",
            "            const t = this._textos[i];",
            "            t.life -= dt;",
            "            t.y += t.velocityY * dt;",
            "            if (t.life <= 0) {",
            "                this._textos.splice(i, 1);",
            "            }",
            "        }",
            "    }",
            "",
            "    renderizar(ctx) {",
            "        if (!this._textos || this._textos.length === 0) return;",
            "        ctx.save();",
            "        ctx.font = 'bold 20px monospace';",
            "        ctx.textAlign = 'center';",
            "        ctx.shadowColor = 'black';",
            "        ctx.shadowBlur = 2;",
            "        for (const t of this._textos) {",
            "            const alpha = Math.max(0, t.life / t.maxLife);",
            "            ctx.globalAlpha = alpha;",
            "            ctx.fillStyle = t.color;",
            "            // Posição absoluta baseada na entidade",
            "            const drawX = this.entidade.x + this.entidade.largura/2 + t.x;",
            "            const drawY = this.entidade.y + t.y;",
            "            ctx.fillText(t.text, drawX, drawY);",
            "        }",
            "        ctx.restore();",
            "    }",
            "}"
        ].join('\n');
    }

    /**
     * Script de Combate Melee com Slide Attack
     * Controla ataque normal e slide attack com cooldown e hitbox.
     */
    gerarScriptAtaqueMelee() {
        return `/**
 * Script de Combate Melee com Slide Attack
 * Controla ataque normal e slide attack com cooldown e hitbox.
 */
        class CombateMeleeScript {
            constructor(entidade) {
                this.entidade = entidade;
                this.atacando = false;
                this.slideAtacando = false;
                this.tempoDecorrido = 0;

                // Configurações
                this.teclaAtaque = 'Control';
                this.animAttack = 'attack';
                this.duracaoAtaque = 0.8;
                this.cooldownAtaque = 0.5;

                // --- SLIDE ATTACK ---
                this.animSlide = 'slide';
                this.slideVelocity = 400;
                this.slideDuration = 1.5;

                // === TIMING DO ATAQUE ===
                this.inicioHitbox = 0.1;
                this.duracaoHitbox = 0.2;

                // === HITBOX ===
                this.hitboxX = 30;
                this.hitboxY = 0;
                this.hitboxW = 40;
                this.hitboxH = 40;

                // === DEBUG ===
                this.mostrarDebugHitbox = false;

                // Controle
                this.inimigosAtingidos = new Set();
                this.foiPressionado = false;
                this.tempoCooldown = 0;
                this.slideDirection = 1;
                
                // === COMBO SYSTEM ===
                this.comboCount = 0;
                this.comboTimeout = 0;
                this.comboResetTime = 2.0; // Segundos sem hit para resetar combo
                this.comboDamageMultiplier = 1.0; // Multiplicador de dano por combo
                this.comboMultiplierIncrement = 0.1; // +10% de dano por combo
                this.mostrarComboTexto = true; // Mostra "COMBO x2", "COMBO x3", etc.

                // --- AUDIO ---
                this.somAtaque = "";
                this.pitchAtaque = 1.0;
                this.somSlide = "";
                this.pitchSlide = 1.0;
                this.audioSlideInstancia = null;
            }

            tocarSom(id, loop = false, controlsRef = null, pitch = 1.0) {
                if (!id || !window.AudioManager) return null;
                if (loop && controlsRef && controlsRef.playing) {
                    if (controlsRef.setRate) controlsRef.setRate(pitch);
                    return controlsRef;
                }
                const ctrl = window.AudioManager.play(id, 1.0, loop, pitch);
                if (loop && ctrl) ctrl.playing = true;
                return ctrl;
            }

            pararSom(controlsRef) {
                if (controlsRef) {
                    controlsRef.stop();
                    controlsRef.playing = false;
                }
            }

            onDestroy() {
                this.pararSom(this.audioSlideInstancia);
            }

            iniciar() {
                const valor = String(this.mostrarDebugHitbox).toLowerCase().trim();
                this.mostrarDebugHitbox = (valor === 'true' || valor === '1' || valor === 'yes' || valor === 'sim');
            }

            processarInput(input) {
                const tecla = this.teclaAtaque || 'Control';
                const pressionadoAgora = input.teclaPressionada(tecla) ||
                    input.teclaPressionada('z') ||
                    input.teclaPressionada('Z') ||
                    input.teclaPressionada('Control');

                const downPressed = input.teclaPressionada('s') ||
                    input.teclaPressionada('S') ||
                    input.teclaPressionada('ArrowDown');

                if (pressionadoAgora) {
                    if (!this.foiPressionado) {
                        if (downPressed) {
                            this.tentarSlideAttack();
                        } else {
                            this.tentarAtacar();
                        }
                        this.foiPressionado = true;
                    }
                } else {
                    this.foiPressionado = false;
                }
            }

            tentarAtacar() {
                if (this.atacando || this.slideAtacando || this.tempoCooldown > 0) return;
                this.iniciarAtaque();
            }

            tentarSlideAttack() {
                if (this.atacando || this.slideAtacando || this.tempoCooldown > 0) return;
                this.iniciarSlideAttack();
            }

            iniciarAtaque() {
                this.atacando = true;
                this.tempoDecorrido = 0;
                this.tempoCooldown = this.cooldownAtaque;
                this.inimigosAtingidos.clear();
                this.entidade.velocidadeX = 0;

                const sprite = this.entidade.obterComponente('SpriteComponent');
                if (sprite) {
                    sprite.play(this.animAttack);
                }
                this.tocarSom(this.somAtaque, false, null, this.pitchAtaque);
            }

            iniciarSlideAttack() {
                this.slideAtacando = true;
                this.tempoDecorrido = 0;
                this.tempoCooldown = this.cooldownAtaque;
                this.inimigosAtingidos.clear();
                const sprite = this.entidade.obterComponente('SpriteComponent');
                this.slideDirection = (sprite && sprite.inverterX) ? -1 : 1;

                if (sprite) {
                    if (!sprite.animacoes || !sprite.animacoes[this.animSlide]) {
                        if (sprite.animacoes && sprite.animacoes['crouch']) {
                            sprite.play('crouch');
                        }
                    } else {
                        sprite.play(this.animSlide);
                    }
                }
                this.audioSlideInstancia = this.tocarSom(this.somSlide, true, this.audioSlideInstancia, this.pitchSlide);
            }

            estaOcupado() {
                return this.atacando || this.slideAtacando;
            }

            atualizar(deltaTime) {
                if (this.tempoCooldown > 0) {
                    this.tempoCooldown -= deltaTime;
                }
                
                // === COMBO TIMEOUT ===
                if (this.comboTimeout > 0) {
                    this.comboTimeout -= deltaTime;
                    if (this.comboTimeout <= 0) {
                        console.log('[Combo] Reset! Combo final:', this.comboCount);
                        this.comboCount = 0;
                        this.comboDamageMultiplier = 1.0;
                    }
                }

                if (this.slideAtacando) {
                    this.atualizarSlideAttack(deltaTime);
                    return;
                }

                if (this.atacando) {
                    this.atualizarAtaqueNormal(deltaTime);
                    return;
                }
            }

            atualizarAtaqueNormal(deltaTime) {
                this.tempoDecorrido += deltaTime;

                if (this.tempoDecorrido >= this.duracaoAtaque) {
                    this.atacando = false;
                    return;
                }

                const sprite = this.entidade.obterComponente('SpriteComponent');
                if (sprite && sprite.animacaoCompleta && sprite.animacaoCompleta()) {
                    this.atacando = false;
                    return;
                }

                const hitboxAtiva = (this.tempoDecorrido >= this.inicioHitbox) &&
                    (this.tempoDecorrido <= (this.inicioHitbox + this.duracaoHitbox));

                if (hitboxAtiva) {
                    this.verificarColisao();
                }
            }

            atualizarSlideAttack(deltaTime) {
                this.tempoDecorrido += deltaTime;
                this.entidade.velocidadeX = this.slideDirection * this.slideVelocity;

                if (this.tempoDecorrido >= this.slideDuration) {
                    this.slideAtacando = false;
                    this.entidade.velocidadeX = 0;
                    this.pararSom(this.audioSlideInstancia);
                    this.audioSlideInstancia = null;
                    return;
                }

                this.verificarColisao();
            }

            verificarColisao() {
                const sprite = this.entidade.obterComponente('SpriteComponent');
                const invertido = sprite ? sprite.inverterX : false;
                const offX = invertido ? (-this.hitboxX - this.hitboxW) : this.hitboxX;

                const areaAtaque = {
                    x: this.entidade.x + (this.entidade.largura / 2) + offX,
                    y: this.entidade.y + (this.entidade.altura / 2) + this.hitboxY - (this.hitboxH / 2),
                    w: this.hitboxW,
                    h: this.hitboxH
                };

                const engine = this.entidade.engine;
                if (engine) {
                    engine.entidades.forEach(outra => {
                        if (outra === this.entidade) return;

                        const ehInimigo = outra.nome.toLowerCase().includes('inimigo') ||
                            outra.nome.toLowerCase().includes('enemy') ||
                            outra.tipo === 'inimigo';

                        if (ehInimigo && !this.inimigosAtingidos.has(outra.id)) {
                            if (this.colisaoAABB(areaAtaque, outra)) {
                                this.aplicarDano(outra);
                            }
                        }
                    });
                }
            }

            colisaoAABB(ret1, ent2) {
                let r2x = ent2.x;
                let r2y = ent2.y;
                let r2w = ent2.largura;
                let r2h = ent2.altura;

                const col2 = ent2.obterComponente('CollisionComponent');
                if (col2) {
                    r2x += col2.offsetX;
                    r2y += col2.offsetY;
                    r2w = col2.largura;
                    r2h = col2.altura;
                }

                return (
                    ret1.x < r2x + r2w &&
                    ret1.x + ret1.w > r2x &&
                    ret1.y < r2y + r2h &&
                    ret1.y + ret1.h > r2y
                );
            }

            aplicarDano(alvo) {
                this.inimigosAtingidos.add(alvo.id);

                console.log('[Combate] ACERTOU:', alvo.nome);
                
                // === COMBO SYSTEM ===
                this.comboCount++;
                this.comboTimeout = this.comboResetTime; // Reseta o timer
                
                // Calcula multiplicador de dano
                this.comboDamageMultiplier = 1.0 + (this.comboCount - 1) * this.comboMultiplierIncrement;
                
                console.log('[Combo] Hit #' + this.comboCount + ' | Multiplicador: ' + this.comboDamageMultiplier.toFixed(2) + 'x');
                
                // Mostra texto de combo (a partir do 2º hit)
                if (this.comboCount >= 2 && this.mostrarComboTexto) {
                    this.mostrarTextoCombo();
                }

                // Tenta aplicar dano (com multiplicador)
                if (alvo.receberDano) {
                    const danoBase = this.dano || 10;
                    const danoFinal = Math.floor(danoBase * this.comboDamageMultiplier);
                    console.log('[Combate] Dano: ' + danoBase + ' x ' + this.comboDamageMultiplier.toFixed(2) + ' = ' + danoFinal);
                    alvo.receberDano(danoFinal, this.entidade); // Passa referência do atacante para knockback
                }
                else if (alvo.morrer) {
                    alvo.morrer();
                } else {
                    alvo.destruir();
                }
            }
            
            mostrarTextoCombo() {
                // Cores diferentes por nível de combo
                let cor = '#ffff00'; // Amarelo
                if (this.comboCount >= 5) cor = '#ff00ff'; // Roxo
                else if (this.comboCount >= 3) cor = '#ff8800'; // Laranja
                
                const texto = 'COMBO x' + this.comboCount;
                
                // Tenta usar o método direto da entidade
                if (this.entidade.mostrarTexto) {
                    console.log('[Combo] Usando mostrarTexto da entidade');
                    this.entidade.mostrarTexto(texto, cor, 0, -60);
                    console.log('[Combo] Texto mostrado: ' + texto);
                    return;
                }
                
                // Fallback: procura FloatingTextScript
                console.log('[Combo] Procurando FloatingTextScript no player...');
                const scripts = this.entidade.componentes;
                
                for (const [key, comp] of scripts.entries()) {
                    if (comp.tipo === 'ScriptComponent' && comp.instancia && comp.instancia.spawn) {
                        console.log('[Combo] FloatingTextScript encontrado!');
                        comp.instancia.spawn(texto, cor, 0, -60);
                        console.log('[Combo] Texto mostrado via script: ' + texto);
                        return;
                    }
                }
                
                console.warn('[Combo] Nenhum método de texto flutuante disponível!');
            }

            renderizar(ctx) {
                const hitboxAtiva = this.slideAtacando ||
                    ((this.tempoDecorrido >= this.inicioHitbox) &&
                        (this.tempoDecorrido <= (this.inicioHitbox + this.duracaoHitbox)));

                if ((this.atacando || this.slideAtacando) && hitboxAtiva && this.mostrarDebugHitbox) {
                    const sprite = this.entidade.obterComponente('SpriteComponent');
                    const invertido = sprite ? sprite.inverterX : false;
                    const offX = invertido ? (-this.hitboxX - this.hitboxW) : this.hitboxX;
                    const drawX = this.entidade.x + (this.entidade.largura / 2) + offX;
                    const drawY = this.entidade.y + (this.entidade.altura / 2) + this.hitboxY - (this.hitboxH / 2);

                    ctx.fillStyle = this.slideAtacando ? 'rgba(0,255,255,0.3)' : 'rgba(255,0,0,0.3)';
                    ctx.fillRect(drawX, drawY, this.hitboxW, this.hitboxH);
                }
            }
        } `;
    }
    /**
     * Script de Visual de Combate v2.0
     * - Dano Flutuante
     * - Barra de Vida Inimigo (aparece ao atacar, desaparece após 3s)
     */
    gerarScriptVisualCombate() {
        return `
        class VisualCombateScript {
            constructor(entidade) {
                this.entidade = entidade;

                // --- Customização ---
                this.mostrarBarra = true; // Mostra barra de HP
                this.offsetY = -20;       // Altura acima da cabeça
                this.larguraBarra = 50;
                this.alturaBarra = 6;
                this.corBarra = '#ff4444';
                this.corFundo = '#222222';
                this.corBorda = '#ffffff';
                this.tempoExibicao = 3.0; // Segundos que a barra fica visível após dano

                // Texto Flutuante
                this._textos = [];
                
                // Controle de visibilidade da barra
                this._barraVisivel = false;
                this._tempoSemDano = 0;

                // HOOK: Conecta com StatsRPG ou receberDano
                this.entidade.mostrarDano = this.mostrarDano.bind(this);
                this.entidade.mostrarCura = this.mostrarCura.bind(this);

                console.log('[VisualCombate v2] Ativado para:', entidade.nome);
            }

            mostrarDano(val, cor, offsetX, offsetY) {
                // Aceita parâmetros opcionais para compatibilidade
                const texto = \"-\" + Math.floor(val);
                const corFinal = cor || \"#ff3333\";
                const yFinal = offsetY !== undefined ? offsetY : this.offsetY;
                const xFinal = offsetX || 0;
                
                this.spawn(texto, corFinal, xFinal, yFinal);
                
                // Ativa a barra de HP
                this._barraVisivel = true;
                this._tempoSemDano = 0;
            }

            mostrarCura(val, cor, offsetX, offsetY) {
                const texto = \"+\" + Math.floor(val);
                const corFinal = cor || \"#33ff33\";
                const yFinal = offsetY !== undefined ? offsetY : this.offsetY;
                const xFinal = offsetX || 0;
                
                this.spawn(texto, corFinal, xFinal, yFinal);
                
                // Ativa a barra de HP
                this._barraVisivel = true;
                this._tempoSemDano = 0;
            }

            spawn(text, color, x, y) {
                this._textos.push({
                    text: text,
                    color: color,
                    x: x + (Math.random() * 20 - 10), // Random X
                    y: y,
                    velocityY: -60, // Sobe mais rápido
                    life: 1.2,      // 1.2s duração
                    maxLife: 1.2
                });
            }

            atualizar(dt) {
                // Atualiza Textos
                for (let i = this._textos.length - 1; i >= 0; i--) {
                    let t = this._textos[i];
                    t.life -= dt;
                    t.y += t.velocityY * dt;
                    if (t.life <= 0) this._textos.splice(i, 1);
                }
                
                // Controle de visibilidade da barra
                if (this._barraVisivel) {
                    this._tempoSemDano += dt;
                    if (this._tempoSemDano >= this.tempoExibicao) {
                        this._barraVisivel = false;
                    }
                }
            }

            renderizar(ctx) {
                // 1. Barra de Vida (Só mostra se foi atacado recentemente)
                if (this.mostrarBarra && this._barraVisivel && this.entidade.hp !== undefined && this.entidade.hpMax) {
                    if (this.entidade.hp > 0) {
                        const pct = Math.max(0, Math.min(1, this.entidade.hp / this.entidade.hpMax));
                        const cx = this.entidade.x + (this.entidade.largura / 2);
                        const cy = this.entidade.y + this.offsetY;

                        const bx = cx - (this.larguraBarra / 2);
                        const by = cy;

                        // Borda branca
                        ctx.fillStyle = this.corBorda;
                        ctx.fillRect(bx - 1, by - 1, this.larguraBarra + 2, this.alturaBarra + 2);

                        // Fundo preto
                        ctx.fillStyle = this.corFundo;
                        ctx.fillRect(bx, by, this.larguraBarra, this.alturaBarra);

                        // Vida (vermelho)
                        ctx.fillStyle = this.corBarra;
                        ctx.fillRect(bx, by, this.larguraBarra * pct, this.alturaBarra);
                        
                        // Texto HP (opcional)
                        ctx.font = \"bold 10px monospace\";
                        ctx.textAlign = \"center\";
                        ctx.fillStyle = \"#ffffff\";
                        ctx.strokeStyle = \"#000000\";
                        ctx.lineWidth = 2;
                        const hpText = Math.ceil(this.entidade.hp) + \"/\" + this.entidade.hpMax;
                        ctx.strokeText(hpText, cx, by - 2);
                        ctx.fillText(hpText, cx, by - 2);
                    }
                }

                // 2. Textos Flutuantes
                if (this._textos.length > 0) {
                    ctx.font = \"bold 18px monospace\";
                    ctx.textAlign = \"center\";
                    const cx = this.entidade.x + (this.entidade.largura / 2);
                    const cy = this.entidade.y;

                    for (const t of this._textos) {
                        const alpha = Math.max(0, t.life / t.maxLife);
                        ctx.globalAlpha = alpha;

                        const tx = cx + t.x;
                        const ty = cy + t.y;

                        // Borda Texto (mais grossa)
                        ctx.strokeStyle = \"black\";
                        ctx.lineWidth = 4;
                        ctx.strokeText(t.text, tx, ty);

                        // Cor Texto
                        ctx.fillStyle = t.color;
                        ctx.fillText(t.text, tx, ty);
                    }
                    ctx.globalAlpha = 1.0;
                }
            }
        } `;
    }

    /**
     * Gera script para controle de morte (Fade)
     */
    gerarScriptMorte() {
        return `/**
 * Script de Tela de Morte Interativa (Game Over)
 * - Pausa o jogo (opcional)
 * - Exibe "VOCÊ MORREU"
 * - Oferece opções de Respawn ou Reiniciar
 */
        class DeathScreenScript {
            constructor(entidade) {
                this.entidade = entidade;
                this.fadeDuration = 0.5;

                // --- Customização (Editável no Inspetor) ---
                this.titulo = 'VOCÊ MORREU';
                this.textoCheckpoint = '🔄 Último Checkpoint';
                this.textoReiniciar = '🏠 Reiniciar Fase';

                this.dialog = null;
                this.opacity = 0;
                this.state = 'idle';
                this.callbackRespawn = null;

                // Salva Posição Inicial da Fase (Para Reset Completo sem F5)
                this.startX = entidade.x;
                this.startY = entidade.y;
            }

            onDeath(killZone, callbackRespawn) {
                // Evita re-entrada se já estiver processando morte
                if (this.state !== 'idle') return;

                console.log('[DeathScript] Iniciando Tela de Morte');
                this.callbackRespawn = callbackRespawn;

                // Cria e exibe o dialog imediatamente
                this.dialog = this._criarDialog();

                // Abre como Modal (Top Layer) e garante foco
                if (this.dialog.showModal) {
                    this.dialog.showModal();
                } else {
                    document.body.appendChild(this.dialog); // Fallback
                    this.dialog.show();
                }

                this.opacity = 0;
                this.state = 'fadingIn';

                // Tenta pausar o player. Se não teleportou, ele cai.
                // Vamos deixar a física rolar ou travar a gravidade?
                // Travar gravidade temporariamente:
                this._salvoGravidade = this.entidade.gravidade;
                this.entidade.gravidade = 0;
                this.entidade.velocidadeX = 0;
                this.entidade.velocidadeY = 0;
            }

            /**
             * ADAPTER: Permite ser chamado pelo StatsRPG.aoMorrer()
             */
            /**
             * ADAPTER: Permite ser chamado pelo StatsRPG.aoMorrer()
             */
            aoMorrer() {
                console.log('💀 [DeathScreen] aoMorrer chamado!');
                this.onDeath(null, () => {
                    // Callback de respawn
                    const engine = this.entidade.engine || window.editor?.engine;

                    if (engine) {
                        // PRIMEIRO: Verifica se existe um RespawnScript especializado
                        const respawnScript = this.entidade.componentes ?
                            Array.from(this.entidade.componentes.values()).find(
                                c => c.instance && c.instance.constructor.name === 'RespawnScript'
                            ) : null;

                        if (respawnScript && respawnScript.instance && typeof respawnScript.instance.renascer === 'function') {
                            console.log('🔄 [DeathScreen] Delegando respawn para RespawnScript...');
                            respawnScript.instance.renascer();
                        } else {
                            // FALLBACK: Reset Manual
                            console.log('🔄 [DeathScreen] Realizando Respawn Manual (Fallback)...');
                            this.entidade.x = this.startX || 0;
                            this.entidade.y = this.startY || 0;
                            if (this.entidade.hpMax) this.entidade.hp = this.entidade.hpMax;
                            this.entidade.morto = false;
                            this.entidade.visivel = true;
                            this.entidade.temGravidade = true;
                            this.entidade.velocidadeX = 0;
                            this.entidade.velocidadeY = 0;
                        }

                        // Reseta dialog
                        if (this.dialog) {
                            this.dialog.close();
                            this.dialog.remove();
                            this.dialog = null;
                        }
                        this.state = 'idle';
                    } else {
                        console.error('❌ [DeathScreen] Engine não encontrada para respawn! Evitando reload.');
                    }
                });
            }

            _criarDialog() {
                let dialog = document.createElement('dialog');
                dialog.id = 'death-dialog';

                // Estilos Reset
                dialog.style.border = 'none';
                dialog.style.padding = '0';
                dialog.style.margin = '0';
                dialog.style.width = '100vw'; // Garante cobrir tudo
                dialog.style.height = '100vh';
                dialog.style.maxWidth = '100vw'; // Reset default do browser
                dialog.style.maxHeight = '100vh';
                dialog.style.background = 'transparent';

                // Estilos Flex Centralizado
                dialog.style.display = 'flex';
                dialog.style.flexDirection = 'column';
                dialog.style.justifyContent = 'center';
                dialog.style.alignItems = 'center';
                dialog.style.gap = '20px';

                // Opacidade inicial
                dialog.style.opacity = '0';
                dialog.style.transition = 'opacity 0.5s ease-out';

                // Fundo PRETO (Backdrop simulado pelo background do dialog)
                dialog.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';

                // --- CONTEÚDO ---

                // Título
                let titulo = document.createElement('h1');
                titulo.innerText = this.titulo || 'VOCÊ MORREU';
                titulo.style.color = '#ff3333';
                titulo.style.fontFamily = 'Impact, sans-serif';
                titulo.style.fontSize = 'clamp(40px, 10vw, 100px)';
                titulo.style.textShadow = '0 0 30px rgba(255,0,0,0.5)';
                titulo.style.margin = '0 0 40px 0';
                titulo.style.letterSpacing = '5px';
                dialog.appendChild(titulo);

                // Container de Botões
                let btnContainer = document.createElement('div');
                btnContainer.style.display = 'flex';
                btnContainer.style.gap = '20px';
                btnContainer.style.flexWrap = 'wrap';
                btnContainer.style.justifyContent = 'center';

                // Botão Respawn (Último Checkpoint da KillZone)
                // SÓ MOSTRA SE TIVER CHECKPOINT SALVO NA ENTIDADE
                if (this.entidade.checkpoint) {
                    let btnRespawn = this._criarBotao(this.textoCheckpoint || '🔄 Último Checkpoint', () => {
                        this._finalizar(true);
                    });
                    btnContainer.appendChild(btnRespawn);
                }

                // Botão Reiniciar Fase (Teleporte para Início)
                let btnRestart = this._criarBotao(this.textoReiniciar || '🏠 Reiniciar Fase', () => {
                    // Usa o callback definido em aoMorrer() para garantir lógica consistente
                    console.log('🔄 [DeathScreen] Botão Reiniciar clicado. Acionando callback...');
                    this._finalizar(true);
                });

                btnContainer.appendChild(btnRestart);
                dialog.appendChild(btnContainer);

                // FIX CRÍTICO: Anexar DIRETAMENTE ao container do Canvas.
                // O modo Fullscreen da Engine é ativado no PAI do canvas.
                // Se anexarmos no body, o navegador ESCONDE tudo que não é o elemento fullscreen.
                const canvas = document.getElementById('game-canvas');
                if (canvas && canvas.parentElement) {
                    canvas.parentElement.appendChild(dialog);
                    // Garante que o container tenha position relative/absolute para o fixed funcionar?
                    // Fixed é relativo à viewport, deve funcionar.
                    // Mas dialog::backdrop pode bugar se não for top-layer.
                    // showModal() joga pro top-layer, mas precisa estar na árvore visível.
                } else {
                    console.warn('[DeathScript] Canvas não encontrado, anexando ao body.');
                    document.body.appendChild(dialog);
                }

                return dialog;
            }

            _criarBotao(texto, onClick) {
                let btn = document.createElement('button');
                btn.innerText = texto;
                btn.style.padding = '15px 30px';
                btn.style.fontSize = '24px';
                btn.style.fontFamily = 'monospace';
                btn.style.fontWeight = 'bold';
                btn.style.color = 'white';
                btn.style.background = '#333';
                btn.style.border = '2px solid #555';
                btn.style.borderRadius = '5px';
                btn.style.cursor = 'pointer';
                btn.style.transition = 'all 0.2s';

                btn.onmouseover = () => {
                    btn.style.background = '#555';
                    btn.style.borderColor = 'white';
                    btn.style.transform = 'scale(1.05)';
                };
                btn.onmouseout = () => {
                    btn.style.background = '#333';
                    btn.style.borderColor = '#555';
                    btn.style.transform = 'scale(1.0)';
                };

                btn.onclick = onClick;
                return btn;
            }

            _finalizar(respawn) {
                // Restaura gravidade
                if (this._salvoGravidade !== undefined) {
                    this.entidade.gravidade = this._salvoGravidade;
                }

                // ===== RESET DO ESTADO DE MORTE =====
                // Procura o MovimentacaoPlataformaScript e reseta
                for (const [tipo, comp] of this.entidade.componentes.entries()) {
                    if (comp.tipo === 'ScriptComponent' && comp.instance) {
                        const nome = comp.instance.constructor.name;

                        if (nome === 'MovimentacaoPlataformaScript') {
                            // Reseta estado de morte
                            comp.instance._morto = false;
                            comp.instance._tempoMorte = 0;
                            comp.instance._deathScreenAtivado = false;
                            console.log('✅ Estado de morte resetado!');
                        }
                    }
                }

                // Restaura HP do jogador
                if (this.entidade.hp !== undefined) {
                    this.entidade.hp = this.entidade.hpMax || 100;
                    console.log('❤️ HP restaurado:', this.entidade.hp);
                }

                // Volta para animação idle
                const sprite = this.entidade.obterComponente('SpriteComponent');
                if (sprite) {
                    sprite.autoplayAnim = 'idle'; // Reativa autoplay
                    sprite.play('idle');
                    console.log('🎬 Voltou para animação idle');
                }

                // Fecha dialog
                if (this.dialog) {
                    this.dialog.close();
                    this.dialog.remove();
                }
                this.dialog = null;
                this.state = 'idle'; // FIX: Permite morrer novamente

                if (respawn && this.callbackRespawn) {
                    this.callbackRespawn();
                }
            }

            atualizar(dt) {
                if (!this.dialog) return;

                if (this.state === 'fadingIn') {
                    this.opacity += (1 / this.fadeDuration) * dt;
                    if (this.opacity >= 1) {
                        this.opacity = 1;
                        this.state = 'waitingInput';
                    }
                    this.dialog.style.opacity = this.opacity;
                }
                // Estado waitingInput: fica parado esperando clique nos botões
            }
        }
        `;
    }


    /**
     * Baixa o script como arquivo
     */
    baixar(nomeArquivo, conteudo) {
        const blob = new Blob([conteudo], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nomeArquivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }




    gerarScriptMorteAnimacao() {
        return [
            "class MorteAnimacao {",
            "    constructor(entidade) {",
            "        this.entidade = entidade;",
            "        this.animNome = 'death';",
            "        this.duracaoMinima = 1.0;",
            "        this.congelarMovimento = true;",
            "        this.alturaQueda = 2000;",
            "        this.morto = false;",
            "        this.animacaoIniciada = false;",
            "        this.tempoMorte = 0;",
            "        this.fadeAtivado = false;",
            "        this.inicializado = false;",
            "        this.tempoInicializacao = 0;",
            "        this.dialog = null;",
            "        console.log('[MorteAnimacao] Iniciado');",
            "    }",
            "",
            "    iniciar() {",
            "        this.scriptFade = this.encontrarScriptFade();",
            "    }",
            "",
            "    encontrarScriptFade() {",
            "        for (const comp of this.entidade.componentes.values()) {",
            "            if (comp.tipo === 'ScriptComponent' && comp.instance) {",
            "                const nome = comp.instance.constructor.name || '';",
            "                if (nome.toLowerCase().includes('fade')) return comp.instance;",
            "            }",
            "        }",
            "        return null;",
            "    }",
            "",
            "    verificarMorte() {",
            "        if (!this.inicializado) return false;",
            "        if (this.entidade.hp !== undefined && this.entidade.hp <= 0) return true;",
            "        if (this.posicaoInicialY !== undefined && (this.entidade.y - this.posicaoInicialY > this.alturaQueda)) return true;",
            "        return false;",
            "    }",
            "",
            "    ativarMorte() {",
            "        if (this.morto) return;",
            "        this.morto = true;",
            "        this.tempoMorte = 0;",
            "        console.log('💀 [MorteAnimacao] Player morreu!');",
            "        const sprite = this.entidade.obterComponente('SpriteComponent');",
            "        if (sprite) {",
            "            sprite.autoplayAnim = '';",
            "            if(sprite.animacoes && sprite.animacoes[this.animNome]) sprite.play(this.animNome);",
            "        }",
            "        if (this.congelarMovimento) {",
            "            this.entidade.velocidadeX = 0;",
            "            this.entidade.velocidadeY = 0;",
            "            this.entidade.temGravidade = false;",
            "        }",
            "    }",
            "",
            "    ativarFade() {",
            "        if (this.scriptFade && this.scriptFade.ativar) {",
            "            this.scriptFade.ativar();",
            "        } else {",
            "            // Se não tem script de fade, mostra a tela de morte diretamente",
            "            this.mostrarTelaMorte();",
            "        }",
            "    }",
            "",
            "    mostrarTelaMorte() {",
            "        if (this.dialog) return; // Já está mostrando",
            "        ",
            "        console.log('💀 [MorteAnimacao] Mostrando tela de morte');",
            "        ",
            "        // Cria dialog",
            "        this.dialog = document.createElement('dialog');",
            "        this.dialog.id = 'death-dialog';",
            "        ",
            "        // Estilos",
            "        Object.assign(this.dialog.style, {",
            "            border: 'none',",
            "            padding: '0',",
            "            margin: '0',",
            "            width: '100vw',",
            "            height: '100vh',",
            "            maxWidth: '100vw',",
            "            maxHeight: '100vh',",
            "            background: 'transparent',",
            "            display: 'flex',",
            "            flexDirection: 'column',",
            "            justifyContent: 'center',",
            "            alignItems: 'center',",
            "            gap: '20px',",
            "            opacity: '0',",
            "            transition: 'opacity 0.5s ease-out',",
            "            backgroundColor: 'rgba(0, 0, 0, 0.95)'",
            "        });",
            "        ",
            "        // Título",
            "        const titulo = document.createElement('h1');",
            "        titulo.innerText = 'VOCÊ MORREU';",
            "        Object.assign(titulo.style, {",
            "            color: '#ff3333',",
            "            fontFamily: 'Impact, sans-serif',",
            "            fontSize: 'clamp(40px, 10vw, 100px)',",
            "            textShadow: '0 0 30px rgba(255,0,0,0.5)',",
            "            margin: '0 0 40px 0',",
            "            letterSpacing: '5px'",
            "        });",
            "        this.dialog.appendChild(titulo);",
            "        ",
            "        // Container de botões",
            "        const btnContainer = document.createElement('div');",
            "        Object.assign(btnContainer.style, {",
            "            display: 'flex',",
            "            gap: '20px',",
            "            flexWrap: 'wrap',",
            "            justifyContent: 'center'",
            "        });",
            "        ",
            "        // Botão Reiniciar",
            "        const btnReiniciar = this.criarBotao('🔄 Reiniciar', () => {",
            "            this.reiniciar();",
            "        });",
            "        btnContainer.appendChild(btnReiniciar);",
            "        ",
            "        this.dialog.appendChild(btnContainer);",
            "        ",
            "        // Adiciona ao DOM",
            "        document.body.appendChild(this.dialog);",
            "        ",
            "        // Mostra o dialog",
            "        if (this.dialog.showModal) {",
            "            this.dialog.showModal();",
            "        } else {",
            "            this.dialog.show();",
            "        }",
            "        ",
            "        // Fade in",
            "        setTimeout(() => {",
            "            if (this.dialog) this.dialog.style.opacity = '1';",
            "        }, 50);",
            "    }",
            "",
            "    criarBotao(texto, onClick) {",
            "        const btn = document.createElement('button');",
            "        btn.innerText = texto;",
            "        Object.assign(btn.style, {",
            "            padding: '15px 40px',",
            "            fontSize: '20px',",
            "            fontFamily: 'Arial, sans-serif',",
            "            fontWeight: 'bold',",
            "            color: 'white',",
            "            backgroundColor: '#333',",
            "            border: '3px solid #666',",
            "            borderRadius: '10px',",
            "            cursor: 'pointer',",
            "            transition: 'all 0.2s',",
            "            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'",
            "        });",
            "        ",
            "        btn.onmouseover = () => {",
            "            btn.style.backgroundColor = '#555';",
            "            btn.style.borderColor = '#888';",
            "            btn.style.transform = 'translateY(-2px)';",
            "        };",
            "        ",
            "        btn.onmouseout = () => {",
            "            btn.style.backgroundColor = '#333';",
            "            btn.style.borderColor = '#666';",
            "            btn.style.transform = 'translateY(0)';",
            "        };",
            "        ",
            "        btn.onclick = onClick;",
            "        return btn;",
            "    }",
            "",
            "    reiniciar() {",
            "        console.log('🔄 [MorteAnimacao] Reiniciando...');",
            "        ",
            "        // Fecha o dialog",
            "        if (this.dialog) {",
            "            this.dialog.close();",
            "            this.dialog.remove();",
            "            this.dialog = null;",
            "        }",
            "        ",
            "        // Reseta o player",
            "        this.morto = false;",
            "        this.fadeAtivado = false;",
            "        this.tempoMorte = 0;",
            "        ",
            "        // Restaura HP",
            "        if (this.entidade.hpMax) {",
            "            this.entidade.hp = this.entidade.hpMax;",
            "        }",
            "        ",
            "        // Restaura física",
            "        this.entidade.temGravidade = true;",
            "        this.entidade.velocidadeX = 0;",
            "        this.entidade.velocidadeY = 0;",
            "        this.entidade.visivel = true;",
            "        ",
            "        // Tenta encontrar um ponto de respawn ou volta para posição inicial",
            "        const engine = this.entidade.engine;",
            "        if (engine) {",
            "            // Procura por checkpoint",
            "            if (this.entidade.checkpoint) {",
            "                this.entidade.x = this.entidade.checkpoint.x;",
            "                this.entidade.y = this.entidade.checkpoint.y;",
            "            } else {",
            "                // Recarrega a fase",
            "                if (engine.carregarFase && engine.faseAtual) {",
            "                    engine.carregarFase(engine.faseAtual);",
            "                } else {",
            "                    // Fallback: recarrega a página",
            "                    location.reload();",
            "                }",
            "            }",
            "        }",
            "    }",
            "",
            "    atualizar(dt) {",
            "        if (!this.inicializado) {",
            "            if(this.posicaoInicialY === undefined) this.posicaoInicialY = this.entidade.y;",
            "            this.tempoInicializacao += dt;",
            "            if(this.tempoInicializacao >= 0.5) this.inicializado = true;",
            "            return;",
            "        }",
            "        if (!this.morto) {",
            "            if (this.verificarMorte()) this.ativarMorte();",
            "            return;",
            "        }",
            "        this.tempoMorte += dt;",
            "        if (this.congelarMovimento) {",
            "             this.entidade.velocidadeX = 0;",
            "             this.entidade.velocidadeY = 0;",
            "        }",
            "        if (this.tempoMorte >= this.duracaoMinima && !this.fadeAtivado) {",
            "            this.fadeAtivado = true;",
            "            this.ativarFade();",
            "        }",
            "    }",
            "}"
        ].join('\n');
    }
    /**
     * Gera script para Simulação de Morte (Debug)
     */
    gerarScriptSimuladorMorte() {
        return [
            "class SimuladorMorte {",
            "    constructor(entidade) {",
            "        this.entidade = entidade;",
            "        this.teclaAtivacao = 'k';",
            "        this.tipoMorte = 'hp';",
            "        console.log('[SimuladorMorte] Pressione K para matar player');",
            "    }",
            "",
            "    simularMorte() {",
            "        console.log('[SimuladorMorte] SIMULANDO MORTE...');",
            "        switch (this.tipoMorte) {",
            "            case 'hp':",
            "                const hpOriginal = this.entidade.hp || 0;",
            "                this.entidade.hp = 0;",
            "                console.log('   HP: ' + hpOriginal + ' -> 0');",
            "                break;",
            "            case 'queda':",
            "                this.entidade.y = 3000;",
            "                if (this.mostrarLog) console.log('   Teleportado para Y=3000');",
            "                break;",
            "        }",
            "    }",
            "}"
        ].join('\n');
    }


    /**
     * Gera script de Stats RPG
     */
    gerarScriptStatsRPG() {
        return [
            "class StatsRPG {",
            "    constructor(entidade) {",
            "        this.entidade = entidade;",
            "",
            "        // Configurações",
            "        this.hpMax = 100;",
            "        this.manaMax = 50;",
            "        this.regeneracaoHP = 0;",
            "        this.regeneracaoMana = 5;",
            "        this.usarLevel = true;",
            "        this.levelInicial = 1;",
            "        this.xpParaProximoLevel = 100;",
            "        this.multiplicadorXP = 1.5;",
            "        this.forca = 10;",
            "        this.defesa = 5;",
            "        this.tempoInvulnerabilidade = 1.0; // Tempo em segundos",
            "",
            "        // Áudio",
            "        this.somLevelUp = ''; // ID do som de level up",
            "        this.pitchLevelUp = 1.0; // Pitch do som de level up",
            "",
            "        // Estado Interno",
            "        this.invulneravel = false;",
            "        this.timerInvulnerabilidade = 0;",
            "",
            "        // INICIALIZA HP IMEDIATAMENTE no construtor",
            "        this.entidade.hp = this.hpMax;",
            "        this.entidade.hpMax = this.hpMax;",
            "        this.entidade.mana = this.manaMax;",
            "        this.entidade.manaMax = this.manaMax;",
            "",
            "        // Inicializa Level/XP para funcionar no Editor",
            "        if (this.usarLevel) {",
            "            this.entidade.level = this.levelInicial;",
            "            this.entidade.xp = 0;",
            "            this.entidade.xpProximo = this.xpParaProximoLevel;",
            "        }",
            "",
            "        // EXPOR MÉTODOS PÚBLICOS NA ENTIDADE",
            "        // Isso permite que outros scripts chamem player.ganharXP(10)",
            "        this.entidade.ganharXP = this.ganharXP.bind(this);",
            "        this.entidade.receberDano = this.receberDano.bind(this);",
            "        this.entidade.curar = this.curar.bind(this);",
            "        this.entidade.gastarMana = this.gastarMana.bind(this);",
            "        this.entidade.restaurarMana = this.restaurarMana.bind(this);",
            "",
            "        console.log('⭐ [StatsRPG v5] Constructor - Stats definidos e API exposta');",
            "    }",
            "",
            "    iniciar() {",
            "        // Já foi definido no constructor, mas pode redefinir aqui também",
            "        this.entidade.hp = this.hpMax;",
            "        this.entidade.hpMax = this.hpMax;",
            "        this.entidade.mana = this.manaMax;",
            "        this.entidade.manaMax = this.manaMax;",
            "",
            "        if (this.usarLevel) {",
            "            this.entidade.level = this.levelInicial;",
            "            this.entidade.xp = 0;",
            "            this.entidade.xpProximo = this.xpParaProximoLevel;",
            "        }",
            "",
            "        this.entidade.forca = this.forca;",
            "        this.entidade.defesa = this.defesa;",
            "",
            "        // Failsafe Audio (v2)",
            "        if (this.somLevelUp === undefined) this.somLevelUp = '';",
            "        if (this.pitchLevelUp === undefined) this.pitchLevelUp = 1.0;",
            "",
            "        console.log('⭐ [StatsRPG v2] iniciar() - HP:', this.entidade.hp, '| Level:', this.entidade.level);",
            "    }",
            "",
            "    receberDano(quantidade) {",
            "        if (this.invulneravel) return 0; // Ignora dano se invulnerável",
            "",
            "        // Garante que defesa existe (fallback para 0)",
            "        const defesaAtual = this.entidade.defesa || 0;",
            "        const reducao = Math.min(defesaAtual * 0.01, 0.75);",
            "        const danoFinal = Math.floor(quantidade * (1 - reducao));",
            "",
            "        this.entidade.hp -= danoFinal;",
            "        if (this.entidade.hp < 0) this.entidade.hp = 0;",
            "",
            "        // Ativar Invulnerabilidade",
            "        this.invulneravel = true;",
            "        this.timerInvulnerabilidade = this.tempoInvulnerabilidade;",
            "",
            "        // Feedback Visual (Piscar + Vermelho)",
            "        this.entidade._piscando = true;",
            "        this.entidade._tint = 'red'; // Colora de vermelho (Implementado no SpriteComponent)",
            "",
            "        // Resetar velocidade se sofrer muito dano? (Knockback já faz isso na IA)",
            "",
            "        console.log('💥 Dano: ' + quantidade + ' -> ' + danoFinal + ' (após defesa ' + defesaAtual + ')');",
            "        console.log('   HP: ' + this.entidade.hp + '/' + this.entidade.hpMax);",
            "",
            "        // FEEDBACK VISUAL",
            "        if (this.entidade.mostrarDano) this.entidade.mostrarDano(danoFinal);",
            "",
            "        return danoFinal;",
            "    }",
            "",
            "    curar(quantidade) {",
            "        const hpAntes = this.entidade.hp;",
            "        this.entidade.hp = Math.min(this.entidade.hp + quantidade, this.entidade.hpMax);",
            "        const curado = this.entidade.hp - hpAntes;",
            "",
            "        if (curado > 0) {",
            "            console.log('💚 Cura: +' + curado + ' HP');",
            "            if (this.entidade.mostrarCura) this.entidade.mostrarCura(curado);",
            "        }",
            "        ",
            "        return curado;",
            "    }",
            "",
            "    gastarMana(quantidade) {",
            "        if (this.entidade.mana >= quantidade) {",
            "            this.entidade.mana -= quantidade;",
            "            return true;",
            "        }",
            "        return false;",
            "    }",
            "",
            "    restaurarMana(quantidade) {",
            "        const manaAntes = this.entidade.mana;",
            "        this.entidade.mana = Math.min(this.entidade.mana + quantidade, this.entidade.manaMax);",
            "        return this.entidade.mana - manaAntes;",
            "    }",
            "",
            "    ganharXP(quantidade) {",
            "        if (!this.usarLevel) return;",
            "        ",
            "        this.entidade.xp += quantidade;",
            "        console.log('✨ XP: +' + quantidade + ' (' + this.entidade.xp + '/' + this.entidade.xpProximo + ')');",
            "        ",
            "        while (this.entidade.xp >= this.entidade.xpProximo) {",
            "            this.levelUp();",
            "        }",
            "    }",
            "",
            "    levelUp() {",
            "        this.entidade.xp -= this.entidade.xpProximo;",
            "        this.entidade.level++;",
            "        ",
            "        this.entidade.xpProximo = Math.floor(this.xpParaProximoLevel * Math.pow(this.multiplicadorXP, this.entidade.level - 1));",
            "        ",
            "        this.entidade.hpMax += 10;",
            "        this.entidade.hp = this.entidade.hpMax;",
            "        this.entidade.manaMax += 5;",
            "        this.entidade.mana = this.entidade.manaMax;",
            "        ",
            "        this.entidade.forca = Math.floor(this.entidade.forca * 1.2);",
            "        this.entidade.defesa = Math.floor(this.entidade.defesa * 1.2);",
            "        ",
            "        console.log('🆙 LEVEL UP! Level ' + this.entidade.level);",
            "        console.log('   Stats:', this.entidade.hpMax, this.entidade.manaMax, this.entidade.forca, this.entidade.defesa);",
            "        ",
            "        if (this.entidade.mostrarDano) {",
            "             this.entidade.mostrarDano('LEVEL UP!', 'gold', 0, -50);",
            "        }",
            "        ",
            "        // Tocar Som",
            "        if (this.somLevelUp && window.AudioManager) {",
            "            // AudioManager.play(assetId, volume, loop, playbackRate)",
            "            window.AudioManager.play(this.somLevelUp, 1.0, false, this.pitchLevelUp);",
            "        }",
            "    }",
            "",
            "    atualizar(dt) {",
            "        // Regeneração de Mana/HP",
            "        if (this.regeneracaoMana > 0) {",
            "            this.restaurarMana(this.regeneracaoMana * dt);",
            "        }",
            "        if (this.regeneracaoHP > 0) {",
            "            this.curar(this.regeneracaoHP * dt);",
            "        }",
            "",
            "        // Timer Invulnerabilidade",
            "        if (this.invulneravel) {",
            "             this.timerInvulnerabilidade -= dt;",
            "             if (this.timerInvulnerabilidade <= 0) {",
            "                 this.invulneravel = false;",
            "                 this.entidade._piscando = false;",
            "                 this.entidade._tint = null;",
            "             }",
            "        }",
            "",
            "        // Verificar Morte",
            "        if (this.entidade.hp <= 0 && !this.entidade.morto) {",
            "             this.entidade.morto = true; // Marca como morto ANTES de notificar",
            "             console.log('💀 [StatsRPG] Player morreu! HP:', this.entidade.hp);",
            "             console.log('🔍 [StatsRPG] Procurando scripts de morte...');",
            "             // Procura APENAS scripts de TELA DE MORTE (não respawn)",
            "             const comps = Array.from(this.entidade.componentes.values());",
            "             console.log('📋 [StatsRPG] Total de componentes:', comps.length);",
            "             let deathScreenEncontrado = false;",
            "                           ",
            "             for (const comp of comps) {",
            "                 if (comp.tipo === 'ScriptComponent' && comp.instance && comp.instance !== this) {",
            "                     const nome = comp.instance.constructor.name || '';",
            "                     console.log('  📜 Script encontrado:', nome);",
            "                     if (typeof comp.instance.aoMorrer === 'function') {",
            "                         console.log('    ✅ Tem método aoMorrer');",
            "                         // Só chama se for um script de TELA DE MORTE (não Respawn)",
            "                         if (nome.toLowerCase().includes('death') || nome.toLowerCase().includes('morte')) {",
            "                             console.log('    🎯 É um script de morte! Chamando aoMorrer()...');",
            "                             comp.instance.aoMorrer();",
            "                             deathScreenEncontrado = true;",
            "                             break; // Para no primeiro script de morte encontrado",
            "                         } else {",
            "                             console.log('    ⏭️ Não é script de morte (ignorando):', nome);",
            "                         }",
            "                     } else {",
            "                         console.log('    ❌ Não tem método aoMorrer');",
            "                     }",
            "                 }",
            "             }",
            "             ",
            "             if (!deathScreenEncontrado) {",
            "                 console.warn('⚠️ [StatsRPG] Nenhum script de tela de morte encontrado!');",
            "                 console.warn('💡 Dica: Adicione um script DeathScreenScript ou MorteAnimacao ao player');",
            "             }",
            "        }",
            "    }",
            "",
            "    processarInput(engine) {",
            "        // Debug: Pressione H para ganhar HP, M para mana, X para XP",
            "        if (engine.teclaPrecionadaAgora('h')) {",
            "            this.curar(20);",
            "        }",
            "        if (engine.teclaPrecionadaAgora('m')) {",
            "            this.restaurarMana(10);",
            "        }",
            "        if (engine.teclaPrecionadaAgora('x')) {",
            "            this.ganharXP(50);",
            "        }",
            "    }",
            "}"
        ].join('\n');
    }

    /**
     * Gera script de Controle de Inventário (Toggle UI + Pause + Overlay)
     */
    gerarControladorInventario() {
        return [
            "/**",
            " * Controlador de Inventário v2.0",
            " * - Pause Game",
            " * - Dark Overlay",
            " * - Z-Index Priority",
            " */",
            "class InventoryController {",
            "    constructor(entidade) {",
            "        this.entidade = entidade;",
            "",
            "        // --- CONFIGURAÇÃO ---",
            "        this.teclaToggle = 'i'; // Tecla para abrir/fechar",
            "        this.comecarAberto = false;",
            "        this.corOverlay = 'rgba(0, 0, 0, 0.7)';",
            "",
            "        // Estado Interno",
            "        this.aberto = this.comecarAberto;",
            "        this.wasPressed = false;",
            "",
            "        // 1. Garante que fique na frente de tudo",
            "        this.entidade.zIndex = 99999;",
            "",
            "        // Inicialização",
            "        this.inicializarEstado();",
            "    }",
            "",
            "    inicializarEstado() {",
            "        // --- TRUQUE DE RENDERIZAÇÃO ---",
            "        // Para o Overlay (desenhado neste script) ficar ATRÁS dos Slots (UIComponent),",
            "        // o UIComponent precisa ser renderizado DEPOIS.",
            "        // Como o Map itera por inserção, vamos remover e readicionar o UIComponent",
            "        // para garantir que ele seja o último.",
            "        ",
            "        const ui = this.obterUI();",
            "        if (ui && this.entidade.componentes) {",
            "            // Só funciona se o UI estiver na MESMA entidade. ",
            "            if (this.entidade.obterComponente('UIComponent') === ui) {",
            "                 this.entidade.componentes.delete('UIComponent');",
            "                 this.entidade.componentes.set('UIComponent', ui);",
            "                 console.log('[Inventory] UIComponent movido para o final da fila de renderização.');",
            "            }",
            "        }",
            "",
            "        if (ui) ui.ativo = this.aberto;",
            "        ",
            "        // Sincroniza Pause se começar aberto",
            "        if (this.aberto && this.entidade.engine) {",
            "            this.entidade.engine.simulado = false;",
            "        }",
            "    }",
            "",
            "    obterUI() {",
            "        let ui = this.entidade.obterComponente('UIComponent');",
            "        if (ui) return ui;",
            "        if (this.entidade.engine) {",
            "            const ent = this.entidade.engine.entidades.find(e => {",
            "                const c = e.obterComponente('UIComponent');",
            "                return c && c.elementos && c.elementos.some(el => el.tipo === 'inventario' || el.tipo === 'inventory');",
            "            });",
            "            if (ent) return ent.obterComponente('UIComponent');",
            "        }",
            "        return null;",
            "    }",
            "",
            "    /**",
            "     * Renderiza o Overlay e processa Input (mesmo pausado)",
            "     */",
            "    renderizar(ctx) {",
            "        // 1. INPUT HANDLING MANUAL",
            "        // Necessário porque quando 'simulado = false', o 'atualizar()' não roda.",
            "        if (!this.entidade.engine) return;",
            "        ",
            "        const isPressed = this.entidade.engine.teclaPressionada(this.teclaToggle);",
            "        if (isPressed && !this.wasPressed) {",
            "            this.toggle();",
            "        }",
            "        this.wasPressed = isPressed;",
            "",
            "        // 2. OVERLAY DARK",
            "        if (this.aberto && ctx) {",
            "            ctx.save();",
            "            // Reseta transform para desenhar na tela inteira (Screen Space)",
            "            ctx.setTransform(1, 0, 0, 1, 0, 0);",
            "            ctx.fillStyle = this.corOverlay;",
            "            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);",
            "            ctx.restore();",
            "        }",
            "    }",
            "",
            "    // Método padrão atualizar (só roda se não estiver pausado)",
            "    atualizar() {",
            "        // Mantido vazio pois o input é tratado no renderizar",
            "    }",
            "",
            "    toggle() {",
            "        this.aberto = !this.aberto;",
            "",
            "        // PAUSE / RESUME",
            "        if (this.entidade.engine) {",
            "            this.entidade.engine.simulado = !this.aberto;",
            "        }",
            "",
            "        // Atualiza UI Slots",
            "        const ui = this.obterUI();",
            "        if (ui) ui.ativo = this.aberto;",
            "",
            "        // Atualiza Fundo Sprite (se houver)",
            "        if (this.entidade.temComponente && this.entidade.temComponente('SpriteComponent')) {",
            "            this.entidade.visivel = this.aberto;",
            "        }",
            "",
            "        console.log('[Inventory] Estado:', this.aberto ? 'ABERTO (Paused)' : 'FECHADO (Resumed)');",
            "    }",
            "}"
        ].join('\n');
    }

    /**
     * Gera script para Área de Mensagem (Tutorial/Avisos)
     * Exibe uma mensagem rica no centro da tela ao encostar.
     */
    gerarScriptAreaMensagem() {
        return [
            "/**",
            " * Script de Área de Mensagem v1.0",
            " * Exibe mensagens ricas (HTML) ao colidir com o Player.",
            " * Suporta tags de cor: <red>, <yellow>, <blue>, <green>, <gold>, <purple>",
            " */",
            "class AreaMensagemScript {",
            "    constructor(entidade) {",
            "        this.entidade = entidade;",
            "",
            "        // --- Configurações Editáveis ---",
            "        this.mensagem = 'Use <yellow>A</yellow> / <yellow>D</yellow> ou <yellow>SETAS</yellow> para andar';",
            "        this.executarUmaVez = true; // Checkbox no editor",
            "        this.posX = '50%';",
            "        this.posY = '15%';",
            "        this.tempoFade = 0.5;",
            "        this.corFundo = 'rgba(0, 0, 0, 0.9)';",
            "        this.corBorda = 'white';",
            "        ",
            "        // Estado Interno",
            "        this.jaMostrou = false;",
            "        this.elementoMsg = null;",
            "        this.ativo = false;",
            "        this.playerNoTrigger = false;",
            "    }",
            "",
            "    atualizar(dt) {",
            "        // STRICT MODE: Só executa se o engine existir E estiver em modo SIMULADO (Play).",
            "        // Isso impede que roda no Editor (que é !simulado ou undefined).",
            "        if (!this.entidade.engine || this.entidade.engine.simulado !== true) return;",
            "",
            "        // Encontrar Player (Cache simples)",
            "        if (!this.player) {",
            "            if (this.entidade.engine) {",
            "                this.player = this.entidade.engine.entidades.find(e => e.nome === 'Player' || e.tipo === 'player');",
            "            }",
            "        }",
            "",
            "        if (this.player) {",
            "            if (this.verificarColisao(this.player)) {",
            "                if (!this.playerNoTrigger) {",
            "                    this.onTriggerEnter();",
            "                    this.playerNoTrigger = true;",
            "                }",
            "            } else {",
            "                if (this.playerNoTrigger) {",
            "                    this.onTriggerExit();",
            "                    this.playerNoTrigger = false;",
            "                }",
            "            }",
            "        }",
            "    }",
            "",
            "    verificarColisao(player) {",
            "        // AABB Simples",
            "        return (",
            "            this.entidade.x < player.x + player.largura &&",
            "            this.entidade.x + this.entidade.largura > player.x &&",
            "            this.entidade.y < player.y + player.altura &&",
            "            this.entidade.y + this.entidade.altura > player.y",
            "        );",
            "    }",
            "",
            "    onTriggerEnter() {",
            "        if (this.executarUmaVez && this.jaMostrou) return;",
            "",
            "        this.mostrarMensagem();",
            "        this.jaMostrou = true;",
            "    }",
            "",
            "    onTriggerExit() {",
            "        // Descomente se quiser esconder ao sair:",
            "        // this.esconderMensagem();",
            "        ",
            "        // Mas o usuário pediu 'mostrar uma msg', geralmente fica um tempo ou até fechar.",
            "        // Pela imagem parece um Toast. Vamos fazer fade out após sair?",
            "        // Ou vamos manter até ele sair da área?",
            "        // O padrão 'Tutorial' geralmente some ao sair da área.",
            "        this.esconderMensagem();",
            "    }",
            "",
            "    mostrarMensagem() {",
            "        if (this.ativo) return;",
            "",
            "        // Cria elemento HTML",
            "        this.elementoMsg = document.createElement('div');",
            "        ",
            "        // Estilização Base (Caixa Preta com Borda Arredondada)",
            "        Object.assign(this.elementoMsg.style, {",
            "            position: 'absolute',",
            "            top: this.posY, // Posição Y configurável",
            "            left: this.posX, // Posição X configurável",
            "            transform: 'translate(-50%, -50%)',",
            "            backgroundColor: this.corFundo,",
            "            border: '3px solid ' + this.corBorda,",
            "            borderRadius: '15px',",
            "            padding: '20px 40px',",
            "            fontFamily: '\"Press Start 2P\", monospace, sans-serif', // Fonte pixelada se tiver carregada",
            "            fontSize: '20px',",
            "            color: 'white', // Cor padrão",
            "            zIndex: '99999',",
            "            textAlign: 'center',",
            "            opacity: '0',",
            "            transition: 'opacity ' + this.tempoFade + 's',",
            "            pointerEvents: 'none', // Não bloqueia cliques",
            "            boxShadow: '0 0 20px rgba(0,0,0,0.5)',",
            "            whiteSpace: 'nowrap'",
            "        });",
            "",
            "        // Parser de Rich Text",
            "        this.elementoMsg.innerHTML = this.parseMensagem(this.mensagem);",
            "",
            "        // Anexar ao container do jogo (Compatível com Fullscreen)",
            "        // Se estivermos em Fullscreen, precisamos anexar ao elemento pai do canvas.",
            "        let target = document.body;",
            "        if (this.entidade.engine && this.entidade.engine.canvas && this.entidade.engine.canvas.parentElement) {",
            "            target = this.entidade.engine.canvas.parentElement;",
            "        } else {",
            "            target = document.getElementById('game-container') || document.body;",
            "        }",
            "        ",
            "        target.appendChild(this.elementoMsg);",
            "",
            "        // Fade In (timeout para ativar transição CSS)",
            "        requestAnimationFrame(() => {",
            "            this.elementoMsg.style.opacity = '1';",
            "        });",
            "",
            "        this.ativo = true;",
            "    }",
            "",
            "    esconderMensagem() {",
            "        if (!this.elementoMsg) return;",
            "        ",
            "        const el = this.elementoMsg;",
            "        el.style.opacity = '0';",
            "        this.ativo = false;",
            "        ",
            "        setTimeout(() => {",
            "            if (el && el.parentNode) {",
            "                el.parentNode.removeChild(el);",
            "            }",
            "        }, this.tempoFade * 1000);",
            "        ",
            "        this.elementoMsg = null;",
            "    }",
            "",
            "    onDestroy() {",
            "        // Limpeza garantida ao remover componente ou parar jogo",
            "        if (this.elementoMsg && this.elementoMsg.parentNode) {",
            "            this.elementoMsg.parentNode.removeChild(this.elementoMsg);",
            "        }",
            "        this.elementoMsg = null;",
            "        this.ativo = false;",
            "    }",
            "",
            "    parseMensagem(texto) {",
            "        // Substitui tags personalizadas por spans coloridos",
            "        // <red>Texto</red> -> <span style=\"color: #ff5555\">Texto</span>",
            "        ",
            "        let html = texto",
            "            .replace(/<red>(.*?)<\\\\/red>/gi, '<span style=\"color: #ff5555\">$1</span>')",
            "            .replace(/<blue>(.*?)<\\\\/blue>/gi, '<span style=\"color: #5555ff\">$1</span>')",
            "            .replace(/<green>(.*?)<\\\\/green>/gi, '<span style=\"color: #55ff55\">$1</span>')",
            "            .replace(/<yellow>(.*?)<\\\\/yellow>/gi, '<span style=\"color: #ffff55\">$1</span>')",
            "            .replace(/<gold>(.*?)<\\\\/gold>/gi, '<span style=\"color: #ffaa00\">$1</span>')",
            "            .replace(/<purple>(.*?)<\\\\/purple>/gi, '<span style=\"color: #ff55ff\">$1</span>')",
            "             // Adicione mais cores conforme necessidade",
            "            .replace(/<([a-z]+)>(.*?)<\\\\/\\\\1>/gi, '<span style=\"color: $1\">$2</span>'); // Fallback genérico (ex: <orange>)",
            "",
            "        return html;",
            "    }",
            "}"
        ].join('\n');
    }
}
export default GeradorScript;
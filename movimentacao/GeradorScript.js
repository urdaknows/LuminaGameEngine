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
            'Sistema de Morte': this.gerarScriptMorte.bind(this),
            'Sistema de Respawn': this.gerarScriptRespawnInimigo.bind(this),
            'Texto Flutuante': this.gerarScriptTextoFlutuante.bind(this)
        };
    }

    // ... (rest of the file until the end)

    /**
     * Gera script para Respawn de Inimigo
     */
    gerarScriptRespawnInimigo() {
        return `/**
 * Script de Respawn (Inimigo)
 * Impede que a entidade seja destruída permanentemente ao morrer.
 * Em vez disso, ela fica oculta e reaparece após um tempo.
 */

class RespawnScript {
    constructor(entidade) {
        this.entidade = entidade;
        
        // --- CONFIGURAÇÃO ---
        this.tempoRespawn = 5.0; // Segundos para renascer
        
        // Estado
        this.timer = 0;
        this.estaMorto = false;
        
        // Salva estado inicial para restaurar
        this.startX = entidade.x;
        this.startY = entidade.y;
        this.startVida = entidade.vida || 100;
        this.startGravidade = entidade.temGravidade;
        
        // HOOK: Substitui o método "morrer" padrão da entidade
        // Assim, quando receber dano letal, este script assume o controle.
        this.entidade.morrer = this.aoMorrer.bind(this);
        
        console.log('[Respawn] Sistema ativado para:', entidade.nome);
    }

    aoMorrer() {
        if (this.estaMorto) return;
        
        console.log('💀 Morreu! Respawn em:', this.tempoRespawn, 's');
        this.estaMorto = true;
        this.timer = this.tempoRespawn;

        // Esconde e desativa a entidade
        this.entidade.visivel = false;
        this.entidade.temGravidade = false; // Para não cair no vazio
        this.entidade.velocidadeX = 0;
        this.entidade.velocidadeY = 0;
        
        // Move para longe (Limbo) para evitar colisões fantasmas
        this.entidade.x = -9999; 
        this.entidade.y = -9999;
    }

    atualizar(deltaTime) {
        if (!this.estaMorto) {
            // Se quiser atualizar o Ponto de Spawn dinamicamente (ex: patrulha), faça aqui.
            // Por enquanto, spawna onde nasceu (startX/Y do construtor).
            return;
        }

        this.timer -= deltaTime;

        if (this.timer <= 0) {
            this.renascer();
        }
    }

    renascer() {
        console.log('✨ Renasceu:', this.entidade.nome);
        this.estaMorto = false;

        // Restaura Status
        this.entidade.vida = this.startVida;
        this.entidade.visivel = true;
        this.entidade.temGravidade = this.startGravidade;
        
        // Restaura Posição
        this.entidade.x = this.startX;
        this.entidade.y = this.startY;
        this.entidade.velocidadeX = 0;
        this.entidade.velocidadeY = 0;
        
        // Reinicia animação se precisar
        const sprite = this.entidade.obterComponente('SpriteComponent');
        if (sprite) {
            sprite.play('idle') || sprite.play('walk');
            sprite.flashing = false; // Remove efeito de dano se tiver
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
 * Script de IA: Inimigo Patrulha + Ataque (Debug Version)
 * Gerado automaticamente pela Game Engine
 */

const walk = 'walk';
const attack = 'attack'; 

class InimigoPatrulhaScript {
    constructor(entidade) {
        this.entidade = entidade;
        
        // Parâmetros
        this.velocidade = ${velocidade};
        this.distanciaPatrulha = ${distancia};
        
        // Combate
        this.rangeAtaque = 40; // Reduzido para 40px (Melee Close Range)
        this.dano = 10;
        this.cooldownAtaque = 1500; 
        this.ultimoAtaque = 0;
        
        this.inverterSprite = true; 
        
        this.startX = entidade.x;
        this.direcao = 1; 
        this.entidade.temGravidade = true;
        
        this.minX = this.startX - this.distanciaPatrulha;
        this.maxX = this.startX + this.distanciaPatrulha;
        
        this.estado = 'patrulhando';
        
        console.log('[IA Patrulha] Iniciado para:', entidade.nome);
    }

    atualizar(deltaTime) {
        // Encontrar Player (Case Insensitive)
        let player = null;
        if (this.entidade.engine) {
             const entidades = this.entidade.engine.entidades;
             player = entidades.find(e => {
                 const nome = (e.nome || '').toLowerCase();
                 return nome.includes('player') || nome.includes('jogador') || nome.includes('hero') || e.tipo === 'player';
             });
        }
        
        let atacando = false;
        if (player) {
            // Usar CENTRO para cálculo mais preciso
            const c1 = this.entidade.obterCentro ? this.entidade.obterCentro() : {x: this.entidade.x, y: this.entidade.y};
            const c2 = player.obterCentro ? player.obterCentro() : {x: player.x, y: player.y};
            
            const dx = c2.x - c1.x;
            const dy = c2.y - c1.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < this.rangeAtaque) {
                atacando = true;
                
                // Parar movimento ao atacar (opcional, mas bom pra hit-stop)
                this.entidade.velocidadeX = 0;

                this.direcao = dx > 0 ? 1 : -1;

                if (Date.now() - this.ultimoAtaque > this.cooldownAtaque) {
                    this.atacar(player);
                }

                const sprite = this.entidade.obterComponente('SpriteComponent');
                if (sprite) {
                    sprite.play(attack);
                    const deveInverter = (this.direcao < 0);
                    sprite.inverterX = this.inverterSprite ? !deveInverter : deveInverter;
                }
            } else {
                // Se não estiver atacando, mas estiver vendo o player (perseguição simples opcional)
                // Para este script é só patrulha, então se o player sair do range, ele volta a patrulhar.
                // Mas podemos forçar ele a ir até o player se estiver perto?
                // Vamos manter patrulha simples para não complicar.
            }
    } else {
    if (Math.random() < 0.005) console.warn('[IA Patrulha] Player NÃO encontrado!');
}

if (!atacando) {
    const movimento = this.velocidade * this.direcao * deltaTime;
    this.entidade.x += movimento;

    if (this.entidade.x >= this.maxX) {
        this.entidade.x = this.maxX;
        this.direcao = -1;
    } else if (this.entidade.x <= this.minX) {
        this.entidade.x = this.minX;
        this.direcao = 1;
    }

    const sprite = this.entidade.obterComponente('SpriteComponent');
    if (sprite) {
        const deveInverter = (this.direcao < 0);
        sprite.inverterX = this.inverterSprite ? !deveInverter : deveInverter;
        sprite.play(walk);
    }
}
    }

atacar(player) {
    console.log('⚔️ Inimigo ATAQUE => Player!', player.nome);
    this.ultimoAtaque = Date.now();

    if (player.receberDano) {
        player.receberDano(this.dano);
    } else if (player.vida !== undefined) {
        player.vida -= this.dano;
        console.log('   -> Player Vida Restante:', player.vida);
    }
}

desenharGizmo(ctx) {
    // Range
    ctx.strokeStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(this.entidade.x, this.entidade.y, this.rangeAtaque, 0, Math.PI * 2);
    ctx.stroke();
}
}
`;
    }

    /**
     * Gera script para movimentação plataforma
     */
    gerarMovimentacaoPlataforma(info) {
        const velocidadeHorizontal = info.parametros.velocidadeHorizontal || 200;
        const forcaPulo = info.parametros.forcaPulo || 600;
        // Parâmetros Wall Jump (defaults se não existirem)
        const forcaWallJump = info.parametros.forcaWallJump || 650;
        const impulsoHorizontalWall = info.parametros.impulsoHorizontalWall || 300;
        const velocidadeDeslizamento = info.parametros.velocidadeDeslizamento || 50;
        const distanciaDeteccaoParede = info.parametros.distanciaDeteccaoParede || 5;

        return `/**
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
const animWallSlide = 'wallSlide'; // Nova animação opcional

class MovimentacaoPlataformaScript {
    constructor(entidade) {
        console.log('✅ SCRIPT DE MOVIMENTAÇÃO - v4.1 INTRA-WALL');
        this.entidade = entidade;
        this.entidade = entidade;
        
        // --- SEÇÃO MOVIMENTO ---
        this.SECTION_Movimentacao = 'Básico';
        this.mov_velocidade = ${velocidadeHorizontal};
        this.mov_corrida = ${velocidadeHorizontal * 1.8};
        this.mov_pulo = ${forcaPulo};
        
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
        
        // [OUTROS AJUSTES GAMEPLAY]
        this.SECTION_Gameplay = 'Timers';
        this.coyoteTime = 0.15; // Tempo para pular após cair (s)
        this.wallJumpCooldownTime = 0.2; // Tempo sem controle após WJ (s)
        
        // Estados internos (não editáveis, começam com _)
        this._distanciaDeteccao = ${distanciaDeteccaoParede};
        this.naParede = false;
        this.direcaoParede = 0; // -1 = esquerda, 1 = direita
        this.wallJumpCooldown = 0;
        this.wallStickBuffer = 0; // Buffer para manter naParede estável

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

        // Inputs Especiais
        const correndo = engine.teclaPressionada('Shift');
        const agachando = (engine.teclaPressionada('s') || engine.teclaPressionada('S') || engine.teclaPressionada('ArrowDown')) && noChao;

        // Teclas A/D ou Setas para movimento horizontal
        if (!agachando && this.wallJumpCooldown <= 0) {
            const vel = correndo ? this.mov_corrida : this.mov_velocidade;

            if (engine.teclaPressionada('a') || engine.teclaPressionada('A') || engine.teclaPressionada('ArrowLeft')) {
                vx = -vel;
                direcaoInput = -1;
            }
            if (engine.teclaPressionada('d') || engine.teclaPressionada('D') || engine.teclaPressionada('ArrowRight')) {
                vx = vel;
                direcaoInput = 1;
            }

            this.entidade.velocidadeX = vx;
        } else if (this.wallJumpCooldown > 0) {
            // Mantém inércia durante cooldown do walljump (opcional)
        }

        // Detectar Parede SEMPRE (para debug)
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
        if (this.wallJumpCooldown > 0) {
             this.estado = 'pulando';
        } else if (this.naParede && !noChao) {
            this.estado = 'naParede';
        } else if (!noChao) {
            if (this.entidade.velocidadeY < 0) this.estado = 'pulando';
            else this.estado = 'caindo';
        } else if (agachando) {
            this.estado = 'agachado';
        } else if (vx !== 0) {
            this.estado = correndo ? 'correndo' : 'andando';
        } else {
            this.estado = 'parado';
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
        // Só detecta parede se estiver NO AR
        if (this.entidade.noChao) {
            this.naParede = false;
            return;
        }
        
        // DESTICK: Se apertar para longe da parede, solta
        if (this.naParede) {
            // Se está na parede DIREITA e aperta ESQUERDA, solta
            if (this.direcaoParede === 1 && direcaoInput === -1) {
                this.naParede = false;
                return;
            }
            // Se está na parede ESQUERDA e aperta DIREITA, solta
            if (this.direcaoParede === -1 && direcaoInput === 1) {
                this.naParede = false;
                return;
            }
        }
        
        this.naParede = false;
        if (!this.entidade.engine) return;

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
                
                const tileSize = tilemap.tileSize || 32;
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
                
                // Verificar tiles ao redor do player
                for (let r = startRow; r <= endRow; r++) {
                    for (let c = startCol; c <= endCol; c++) {
                        const tile = tilemap.getTile(c, r);
                        
                        // Verificar se é tile sólido (não-plataforma)
                        let isSolid = false;
                        if (tile && typeof tile === 'object' && tile.solid && !tile.plataforma) {
                            isSolid = true;
                        }
                        
                        if (isSolid) {
                            // Calcular posição absoluta do tile
                            const tileX = tilemapEnt.x + c * tileSize;
                            const tileY = tilemapEnt.y + r * tileSize;
                            
                            // Filtro de chão (igual ao de entidades)
                            const isChao = tileY >= (bounds.y + bounds.h - margem);
                            if (isChao) continue;
                            
                            // Calcular posições das bordas
                            const playerLeft = bounds.x;
                            const playerRight = bounds.x + bounds.w;
                            const tileLeft = tileX;
                            const tileRight = tileX + tileSize;
                            
                            // Checa DIREITA - distância do lado direito do player até o lado esquerdo do tile
                            const distDireita = tileLeft - playerRight;
                            if (distDireita >= -30 && distDireita <= 0) {
                                if (direcaoInput >= 0) {
                                    paredeEncontrada = true;
                                    this.direcaoParede = 1;
                                    break;
                                }
                            }
                            
                            // Checa ESQUERDA - distância do lado esquerdo do player até o lado direito do tile
                            const distEsquerda = playerLeft - tileRight;
                            if (distEsquerda >= -30 && distEsquerda <= 0) {
                                if (direcaoInput <= 0) {
                                    paredeEncontrada = true;
                                    this.direcaoParede = -1;
                                    break;
                                }
                            }
                        }
                    }
                    if (paredeEncontrada) break;
                }
                if (paredeEncontrada) break;
            }
        }

        // Aplicar buffer para manter estado estável em tilesets
        if (paredeEncontrada) {
            this.naParede = true;
            this.wallStickBuffer = 0.15; // Mantém por 150ms mesmo se perder contato
        } else {
            // Só desliga se o buffer expirou
            if (this.wallStickBuffer <= 0) {
                this.naParede = false;
            }
        }
    }

    atualizar(deltaTime) {
        // Cooldown
        if (this.wallJumpCooldown > 0) this.wallJumpCooldown -= deltaTime;
        
        // Wall Stick Buffer (decrementar)
        if (this.wallStickBuffer > 0) this.wallStickBuffer -= deltaTime;

        // Coyote Time
        if (this.entidade.noChao) {
            this.coyoteTimer = this.coyoteTime;
            this.naParede = false;
            this.wallStickBuffer = 0; // Reseta buffer ao tocar no chão
        } else {
            this.coyoteTimer -= deltaTime;
        }

        // Wall Slide (apenas ao cair)
        if (this.naParede && this.entidade.velocidadeY > 0 && this.entidade.velocidadeY > this.wall_slideVel) {
            this.entidade.velocidadeY = this.wall_slideVel;
        }

        // Respawn
        if (this.entidade.y > 2000) {
            this.entidade.y = 0;
            this.entidade.velocidadeY = 0;
        }

            // --- Lógica de Animação e Espelhamento ---
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

            // Seleção de Animação
            if (sprite) {
                // ... (restante da lógica de animação) ...

            // Seleção de Animação
            const isGrounded = this.entidade.noChao || (this.coyoteTimer > 0 && this.entidade.velocidadeY >= 0);

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
                if (this.estado === 'agachado') {
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
            }
        }
    }

    obterEstado() { return this.estado; }
}
`;
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
            const distSq = dx*dx + dy*dy; 
            
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

        for (const s of scripts) {
            if (s.instance && s.instance.spawn) {
                textPlugin = s.instance;
                break;
            }
        }

        if (textPlugin) {
            // Efeito visual
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
        return `/**
 * Script de Texto Flutuante (Damage Numbers / Popups)
 * Permite exibir textos que sobem e somem (ex: Dano, XP, Falas)
 * 
 * Uso:
 * const txt = entidade.obterComponente('ScriptComponent').instance;
 * txt.spawn("100", "red");
 * txt.spawn("Level Up!", "gold", 0, -50);
 */
class FloatingTextScript {
    constructor(entidade) {
        this.entidade = entidade;
        this._textos = []; // Lista de textos ativos {x, y, text, color, life, maxLife, velocityY}
    }

    /**
     * Cria um novo texto flutuante
     * offsetX/Y são relativos ao centro da entidade
     */
    spawn(texto, cor = 'white', offsetX = 0, offsetY = 0) {
        if (!this._textos) this._textos = [];
        console.log('[FloatingText] Spawning:', texto); // Debug Log
        this._textos.push({
            text: texto,
            color: cor,
            x: offsetX, // Relativo
            y: offsetY, // Relativo
            life: 1.0,  // Duração em segundos
            maxLife: 1.0,
            velocityY: -50, // Velocidade de subida (px/s)
            scale: 1.0
        });
    }

    /**
     * Helper para exibir dano (Vermelho)
     */
    mostrarDano(valor) {
        this.spawn("-" + valor, "#ff3333", 0, -20);
    }

    /**
     * Helper para curas (Verde)
     */
    mostrarCura(valor) {
        this.spawn("+" + valor, "#33ff33", 0, -20);
    }

    atualizar(dt) {
        // Atualizar textos e remover expirados
        for (let i = this._textos.length - 1; i >= 0; i--) {
            let t = this._textos[i];
            t.life -= dt;
            t.y += t.velocityY * dt; // Sobe

            // Opcional: Efeito de escala/fade
            if (t.life < 0) {
                this._textos.splice(i, 1);
            }
        }
    }

    renderizar(ctx) {
        if (!this._textos || this._textos.length === 0) {
            // console.log('[FloatingText] Nada para renderizar.');
            return;
        }

        ctx.save();
        // ctx já está transformado para a posição da entidade?
        // Entidade.js: ctx.translate não é chamado antes do loop genérico!
        // O ctx está nas coordenadas do MUNDO (Camera aplicada).
        // Então desenhamos em this.entidade.x + t.x

        ctx.font = "bold 20px monospace";
        ctx.textAlign = "center";

        const centroX = this.entidade.x + (this.entidade.largura / 2);
        const centroY = this.entidade.y; // Topo da entidade ou centro?

        for (const t of this._textos) {
            // Calcular Alpha baseada na vida
            const alpha = Math.max(0, t.life / t.maxLife);

            ctx.globalAlpha = alpha;
            ctx.fillStyle = t.color;
            ctx.strokeStyle = "black";
            ctx.lineWidth = 3;

            const posX = centroX + t.x;
            const posY = centroY + t.y; // Y é relativo ao topo aqui

            ctx.strokeText(t.text, posX, posY);
            ctx.fillText(t.text, posX, posY);
        }

        ctx.restore();
    }
}
`;
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

        // Tenta pausar a entidade para evitar que ela caia no infinito?
        // Mas se pausar, o update deste script roda? NÃO SE ele for componente da entidade!
        // IMPORTANTE: Este script deve continuar rodando.
        // Se a entidade for pausada, os componentes param.
        // O KillZone geralmente teleporta o player. Se não teleportou, ele cai.
        // Vamos deixar a física rolar ou travar a gravidade?
        // Travar gravidade temporariamente:
        this._salvoGravidade = this.entidade.gravidade;
        this.entidade.gravidade = 0;
        this.entidade.velocidadeX = 0;
        this.entidade.velocidadeY = 0;
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
        titulo.innerText = 'VOCÊ MORREU';
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
        let btnRespawn = this._criarBotao('🔄 Último Checkpoint', () => {
            this._finalizar(true);
        });

        // Botão Reiniciar Fase (Teleporte para Início)
        let btnRestart = this._criarBotao('🏠 Reiniciar Fase', () => {
            // Teleporta para o início salvo no construtor
            if (this.entidade) {
                this.entidade.x = this.startX;
                this.entidade.y = this.startY;
                this.entidade.velocidadeX = 0;
                this.entidade.velocidadeY = 0;
            }
            this._finalizar(false);
        });

        btnContainer.appendChild(btnRespawn);
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

    /**
     * Gera script para Combate Melee (Ataque com Hitbox)
     */
    gerarScriptAtaqueMelee() {
        return `/**
 * Script de Combate Melee
 * Controla ataque com cooldown e colisão por área (Hitbox).
 * As variáveis abaixo (hitboxX, etc) aparecem no editor para ajuste fino.
 */

class CombateMeleeScript {
    constructor(entidade) {
        this.entidade = entidade;
        
        // Estado Interno
        this.atacando = false;
        this.tempoDecorrido = 0; // Tempo desde o inicio do ataque
        
        // --- CONFIGURAÇÕES DO ATAQUE ---
        // Ajuste estes valores no Painel de Propriedades!
        
        this.teclaAtaque = 'Control'; 
        this.animAttack = 'attack';
        this.cooldownAtaque = 0.5;    // Tempo total antes de poder atacar de novo

        // Sincronia com Animação (Delay para hitbox aparecer)
        this.inicioHitbox = 0.1;      // Espera 0.1s para ativar a hitbox (Simula Windup)
        this.duracaoHitbox = 0.2;     // A hitbox fica ativa por 0.2s

        // Hitbox (Retângulo vermelho)
        this.hitboxX = 30;   // Distância à frente do personagem
        this.hitboxY = 0;    // Ajuste vertical (0 = centro)
        this.hitboxW = 40;   // Largura da área
        this.hitboxH = 40;   // Altura da área

        // Controle
        this.inimigosAtingidos = new Set();
        this.foiPressionado = false;
        this.tempoCooldown = 0;
    }

    processarInput(input) {
        // Reduz cooldown
        if (this.tempoCooldown > 0) { // Simulação, na real atualizar chama isso
            // Manter lógica no atualizar
        }

        const tecla = this.teclaAtaque || 'Control';
        const pressionadoAgora = input.teclaPressionada(tecla) ||
            input.teclaPressionada('z') ||
            input.teclaPressionada('Z') ||
            input.teclaPressionada('Control');

        // Lógica "Just Pressed"
        if (pressionadoAgora) {
            if (!this.foiPressionado) {
                this.tentarAtacar();
                this.foiPressionado = true;
            }
        } else {
            this.foiPressionado = false;
        }
    }

    tentarAtacar() {
        if (this.atacando || this.tempoCooldown > 0) return;
        this.iniciarAtaque();
    }

    iniciarAtaque() {
        this.atacando = true;
        this.tempoDecorrido = 0;
        this.tempoCooldown = this.cooldownAtaque;
        this.inimigosAtingidos.clear();

        console.log('⚔️ Ataque Iniciado!');

        const sprite = this.entidade.obterComponente('SpriteComponent');
        if (sprite) {
            sprite.play(this.animAttack);
        }
    }

    /**
     * Retorna se o personagem está ocupado (atacando)
     * Scripts de movimento devem verificar isso antes de mudar animações!
     */
    estaOcupado() {
        return this.atacando;
    }

    atualizar(deltaTime) {
        // Atualiza Cooldown global
        if (this.tempoCooldown > 0) {
            this.tempoCooldown -= deltaTime;
        }

        if (!this.atacando) return;

        const sprite = this.entidade.obterComponente('SpriteComponent');
        
        // FORÇA attack se o movimento mudou para idle/walk
        if (sprite && sprite.animacaoAtual !== this.animAttack) {
            sprite.play(this.animAttack);
        }
        
        // Avança tempo do ataque
        this.tempoDecorrido += deltaTime;
        
        // TIMEOUT DE SEGURANÇA: Se passou o cooldown, força fim do ataque
        // Isso evita o bug de ficar preso atacando se a animação tem loop=true
        if (this.tempoDecorrido >= this.cooldownAtaque) {
            this.atacando = false;
            console.log('⚔️ Ataque Completo! (Timeout)');
            return;
        }
        
        // Verifica se a animação de ataque completou (para animações sem loop)
        if (sprite && sprite.animacaoCompleta && sprite.animacaoCompleta()) {
            this.atacando = false;
            console.log('⚔️ Ataque Completo!');
            return;
        }

        // Verifica janela ativa da hitbox
        const hitboxAtiva = (this.tempoDecorrido >= this.inicioHitbox) && 
                            (this.tempoDecorrido <= (this.inicioHitbox + this.duracaoHitbox));

        if (hitboxAtiva) {
            this.verificarColisao();
        }
    }

    verificarColisao() {
        const sprite = this.entidade.obterComponente('SpriteComponent');
        const invertido = sprite ? sprite.inverterX : false;

        // Calcula posição da Hitbox baseada nos valores editáveis
        const offX = invertido ? (-this.hitboxX - this.hitboxW) : this.hitboxX;
        
        // Coordenadas Absolutas
        // X: Centro da entidade + Offset ajustado (para virar com o personagem)
        // Y: Centro da entidade + Offset Y manual - Metade da altura da hitbox (para centralizar no ponto Y)
        const areaAtaque = {
            x: this.entidade.x + (this.entidade.largura / 2) + offX, 
            y: this.entidade.y + (this.entidade.altura / 2) + this.hitboxY - (this.hitboxH / 2),
            w: this.hitboxW,
            h: this.hitboxH
        };
        
        // Ajuste: Se invertido, o "Centro + OffX" já joga pra esquerda.
        // Se usar a borda como referência é mais intuitivo? 
        // Vamos manter referência ao CENTRO da entidade para ser simétrico.

        const engine = this.entidade.engine;
        if (engine) {
            engine.entidades.forEach(outra => {
                if (outra === this.entidade) return;

                // Identifica Inimigos
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
        // Pega colisor do inimigo ou corpo
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
        console.log(\`[Combate] ACERTOU: \${alvo.nome}\`);
        this.inimigosAtingidos.add(alvo.id);
        
        // Recuo Visual
        const dir = (alvo.x > this.entidade.x) ? 1 : -1;
        alvo.x += dir * 15;

        // Dano / Morte
        if (alvo.morrer) {
            alvo.morrer();
        } else {
            alvo.destruir();
        }
    }

    renderizar(ctx) {
        // Só desenha se estiver na janela ativa da hitbox
        const hitboxAtiva = (this.tempoDecorrido >= this.inicioHitbox) && 
                            (this.tempoDecorrido <= (this.inicioHitbox + this.duracaoHitbox));

        if (this.atacando && hitboxAtiva) {
            const sprite = this.entidade.obterComponente('SpriteComponent');
            const invertido = sprite ? sprite.inverterX : false;
            
            const offX = invertido ? (-this.hitboxX - this.hitboxW) : this.hitboxX;
            
            const drawX = this.entidade.x + (this.entidade.largura / 2) + offX;
            const drawY = this.entidade.y + (this.entidade.altura / 2) + this.hitboxY - (this.hitboxH / 2);

            // Debug Hitbox (Descomente para ver a área de colisão)
            /*
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(drawX, drawY, this.hitboxW, this.hitboxH);
            
            // Borda
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(drawX, drawY, this.hitboxW, this.hitboxH);
            */
        }
    }
}`;
    }
}

export default GeradorScript;

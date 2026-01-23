
export default class KillZoneComponent {
    constructor(entidade) {
        this.entidade = entidade;
        this.tipo = 'KillZoneComponent';
        this.nome = 'Area de Morte';

        // Configuração
        this.resetPosition = { x: 0, y: 0 }; // Ponto de respawn
        this.destroyPlayer = false; // Se true, destroi o player em vez de mover
        this.globalLine = false; // Se true, funciona como linha infinita (Y limit)
    }

    inicializar(entidade) {
        this.entidade = entidade;

        // Garantir que a KillZone seja Estática (não caia) e Intangível (não colida fisicamente)
        this.entidade.temGravidade = false;
        this.entidade.solido = false;
        this.entidade.velocidadeX = 0;
        this.entidade.velocidadeY = 0;

        // Configurar colisor baseado no modo
        const colComp = entidade.obterComponente('CollisionComponent');
        if (colComp) {
            if (this.globalLine) {
                // Modo Global: Não precisa de colisor físico, linha é matemática.
                // Desativa colisão para evitar que o chão empurre a linha para cima
                colComp.isTrigger = true;
                colComp.ativo = false; // Desativa totalmente para economizar processamento e garantir imobilidade
            } else {
                // Modo Colisor: Precisa ser trigger para detectar entrada sem bloquear
                colComp.isTrigger = true;
                colComp.ativo = true;
            }
        }
    }

    atualizar(entidade, dt) {
        // Garantir referência
        if (!this.entidade) this.entidade = entidade;

        // RE-FORÇAR estático a cada frame (defesa contra editor/reset)
        if (this.entidade.temGravidade) this.entidade.temGravidade = false;
        if (entidade.velocidadeY !== 0) entidade.velocidadeY = 0; // Trava Y

        if (this.globalLine) {
            const col = entidade.obterComponente('CollisionComponent');
            if (col && col.ativo) col.ativo = false; // Garante que fisica não toque nisso
        }

        // Se for linha global, verificamos a posição Y do player a todo momento
        if (this.globalLine && this.entidade && this.entidade.engine) {
            const player = this.entidade.engine.entidades.find(e => e.tipo === 'player' || e.nome === 'Player');

            if (player) {
                // DEBUG
                if (player.y > this.entidade.y) {
                    console.log('[KillZone] Player caiu abaixo da linha! Player Y:', player.y, 'KillZone Y:', this.entidade.y);
                }

                // Se player cair ABAIXO desta entidade (Y maior)
                if (player.y > this.entidade.y) {
                    this.executarMorte(player);
                }
            } else {
                console.warn('[KillZone] Player não encontrado na engine!');
            }
        }
    }

    // Chamado pelo CollisionComponent (Modo Trigger / Local)
    onTriggerEnter(outraEntidade) {
        if (this.globalLine) return; // Se é global, ignora trigger local pra não duplicar (opcional)
        if (!outraEntidade) return;

        const isPlayer = outraEntidade.tipo === 'player' || outraEntidade.nome === 'Player';

        if (isPlayer) {
            this.executarMorte(outraEntidade);
        }
    }

    executarMorte(player) {
        // Debounce simples
        const agora = Date.now();
        if (player._lastDeath && agora - player._lastDeath < 2000) return;
        player._lastDeath = agora;

        console.log('[KillZone] 💀 Executando Morte do Player');

        if (this.destroyPlayer) {
            if (player.engine) player.engine.removerEntidade(player);
        } else {
            // Função de Respawn (O que acontece DEPOIS do efeito visual)
            const doRespawn = () => {
                let targetX = Number(this.resetPosition.x) || 0;
                let targetY = Number(this.resetPosition.y) || 0;

                // Prioridade: Checkpoint
                if (player.checkpoint) {
                    console.log('[KillZone] Usando Checkpoint salvo:', player.checkpoint);
                    targetX = player.checkpoint.x;
                    targetY = player.checkpoint.y;
                }

                player.x = targetX;
                player.y = targetY;
                player.velocidadeX = 0;
                player.velocidadeY = 0;
                player.noChao = true;

                if (player.definirPosicao) player.definirPosicao(targetX, targetY);
            };

            // Tentar encontrar um Script de Morte customizado
            // PRIORIDADE 1: Scripts de TELA DE MORTE (aoMorrer)
            let deathScreenScript = null;
            if (player.componentes) {
                console.log('[KillZone] Procurando script de TELA DE MORTE...');
                for (const comp of player.componentes.values()) {
                    if (comp.tipo === 'ScriptComponent' && comp.instance) {
                        const nome = comp.instance.constructor.name || '';
                        // Procura scripts com "Death" ou "Morte" no nome
                        if (nome.toLowerCase().includes('death') || nome.toLowerCase().includes('morte')) {
                            if (typeof comp.instance.aoMorrer === 'function') {
                                console.log('[KillZone] ✅ Script de tela de morte encontrado:', nome);
                                deathScreenScript = comp.instance;
                                break;
                            }
                            if (typeof comp.instance.onDeath === 'function') {
                                console.log('[KillZone] ✅ Script de tela de morte (onDeath) encontrado:', nome);
                                deathScreenScript = comp.instance;
                                break;
                            }
                        }
                    }
                }
            }

            // Se encontrou script de tela de morte, usa ele
            if (deathScreenScript) {
                console.log('[KillZone] Chamando script de tela de morte...');
                if (typeof deathScreenScript.aoMorrer === 'function') {
                    deathScreenScript.aoMorrer();
                } else if (typeof deathScreenScript.onDeath === 'function') {
                    deathScreenScript.onDeath(this, doRespawn);
                }
                return; // Para aqui, o script de morte cuida do resto
            }

            // PRIORIDADE 2: Método player.morrer() (RespawnScript)
            if (typeof player.morrer === 'function') {
                console.log('[KillZone] Método player.morrer() encontrado. Delegando...');
                player.morrer();
                return; // NÃO faz ressurgimento manual. O script de morte cuida disso.
            }

            // PRIORIDADE 3: Procura outros scripts com onDeath
            let customScript = null;
            if (player.componentes) {
                console.log('[KillZone] Procurando outros scripts de morte...');
                for (const comp of player.componentes.values()) {
                    if (comp.tipo === 'ScriptComponent' && comp.instance) {
                        if (typeof comp.instance.onDeath === 'function') {
                            console.log('[KillZone] Script com onDeath() ENCONTRADO:', comp.nome);
                            customScript = comp.instance;
                            break;
                        }
                    }
                }
            }

            if (customScript) {
                // Delegar para o script (ele controla o tempo e chama o callback)
                console.log('[KillZone] Delegando morte para script customizado');

                // Visual Debug (Temporário)
                const debug = document.createElement('div');
                debug.innerText = 'Death Script Active!';
                debug.style.cssText = 'position:fixed;top:10px;left:50%;background:green;color:white;padding:5px;z-index:99999;font-size:20px;';
                document.body.appendChild(debug);
                setTimeout(() => debug.remove(), 2000);

                customScript.onDeath(this, doRespawn);
            } else {
                // Fallback: Respawn imediato
                console.log('[KillZone] Sem script de morte, respawn imediato');

                // Visual Debug (Temporário)
                const debug = document.createElement('div');
                debug.innerText = 'No Death Script Found (Using Fallback)';
                debug.style.cssText = 'position:fixed;top:10px;left:50%;background:red;color:white;padding:5px;z-index:99999;font-size:20px;';
                document.body.appendChild(debug);
                setTimeout(() => debug.remove(), 2000);

                doRespawn();
            }
        }
    }



    renderizar(renderizador) {
        if (!this.entidade) return;

        // Verificar Modo de Jogo vs Editor
        const isEditor = typeof window !== 'undefined' && window.editor;
        const isPlaying = isEditor && !window.editor.modoEdicao; // Se modoEdicao é false, estamos dando Play

        // Se estiver jogando, NÃO mostrar nada (KillZone deve ser invisível)
        if (isPlaying) return;

        const ctx = renderizador.ctx;
        const camera = renderizador.camera;

        // 1. Desenhar Ponto de Respawn (Debug)
        if (this.resetPosition && !this.destroyPlayer) {
            const rX = (this.resetPosition.x || 0) - camera.x;
            const rY = (this.resetPosition.y || 0) - camera.y;

            ctx.save();
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.arc(rX, rY, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px monospace';
            // Mostrar coordenadas exatas para debug do usuário
            ctx.fillText(`RESPAWN (${Math.floor(this.resetPosition.x)}, ${Math.floor(this.resetPosition.y)})`, rX + 8, rY + 3);
            ctx.restore();
        }

        // 2. Debug Visual da Linha Global
        if (this.globalLine) {
            const worldY = this.entidade.y;
            // SpriteComponent usa ctx.translate(x, y). Se Renderizador aplica camera, então X,Y são world.
            // KillZone estava usando (y - camera.y). Se Renderizador aplica camera, isso vira (y - 2*camera).
            // Correção: Usar Y puro.

            // Mas precisamos saber a largura da tela em World Coordinates
            // ctx.canvas.width é Screen Width.
            // Para cobrir a tela, desenhamos de Camera.x a Camera.x + Width

            const startX = camera.x;
            const endX = camera.x + ctx.canvas.width; // Assumindo zoom 1

            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = this.destroyPlayer ? '#ff0000' : '#ff8800'; // Vermelho puro se Destruir, Laranja se Respawn
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 5]);

            // Desenhar linha no mundo
            ctx.moveTo(startX, worldY);
            ctx.lineTo(endX, worldY);
            ctx.stroke();

            ctx.fillStyle = this.destroyPlayer ? '#ff0000' : '#ff8800';
            ctx.font = '10px sans-serif';
            const modo = this.destroyPlayer ? 'DESTROY' : 'RESPAWN';
            ctx.fillText(`💀 DEATH LINE [${modo}] Y=${Math.floor(worldY)}`, startX + 10, worldY - 5);
            ctx.restore();
        }
    }

    serializar() {
        return {
            tipo: this.tipo,
            // Flat configs
            resetX: this.resetPosition.x,
            resetY: this.resetPosition.y,
            destroyPlayer: this.destroyPlayer,
            globalLine: this.globalLine
        };
    }

    desserializar(dados) {
        // Robustez: aceita flat ou config-wrapped
        const cfg = dados.config || dados;

        this.resetPosition.x = Number(cfg.resetX) || 0;
        this.resetPosition.y = Number(cfg.resetY) || 0;
        this.destroyPlayer = !!cfg.destroyPlayer;
        this.globalLine = !!cfg.globalLine;

        // Log para debug
        console.log('[KillZone] Deserialized:', this.resetPosition, 'Global:', this.globalLine, 'Destroy:', this.destroyPlayer);
    }
}

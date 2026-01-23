/**
 * ItemComponent.js
 * Transforma uma entidade em um item coletável
 */
export default class ItemComponent {
    constructor() {
        this.tipo = 'ItemComponent';
        this.nome = 'Item Coletável';
        this.ativo = true;

        // Propriedades do Item
        this.itemId = 'moeda'; // ID para inventário
        this.quantidade = 1;   // Quantidade ao pegar
        this.mensagemColeta = ''; // Mensagem customizada ao pegar
        this.icon = '';        // Ícone customizado (Asset ID)

        // Comportamento
        this.autoPickup = true; // Pega ao encostar
        this.destroyOnPickup = true; // Destroi a entidade ao pegar
        this.pickupSound = ''; // Asset ID do som
        this.pickupPitch = 1.0; // Pitch do som

        // Efeitos visuais opcionais
        this.flutuar = true;
        this.velocidadeFlutuar = 2; // Radianos por segundo
        this.amplitudeFlutuar = 5; // Pixels

        // Estado interno
        this.entidade = null;
        this.tempo = 0;
        this.baseY = 0;
    }

    inicializar(entidade) {
        this.entidade = entidade;
        this.baseY = entidade.y;
    }

    async atualizar(entidade, deltaTime) {
        if (!this.ativo || !this.entidade) return;

        // Failsafe: Garante referência da entidade
        if (!this.entidade) this.entidade = entidade;

        // Failsafe: Se tamanho for 0, força um tamanho mínimo para colisão
        if (this.entidade.largura < 1) this.entidade.largura = 32;
        if (this.entidade.altura < 1) this.entidade.altura = 32;

        // Efeito de flutuar
        if (this.flutuar) {
            this.tempo += deltaTime * this.velocidadeFlutuar;
            this.entidade.y = this.baseY + Math.sin(this.tempo) * this.amplitudeFlutuar;
        }

        if (this.autoPickup && this.entidade.engine) {
            this.verificarColeta();
        }
    }

    verificarColeta() {
        const collectors = this.entidade.engine.entidades.filter(e => e.temComponente('InventoryComponent'));

        for (const collector of collectors) {
            if (this.colide(this.entidade, collector)) {
                console.log(`[Item] COLISÃO SUCESSO com ${collector.nome}! Tentando coletar...`);
                this.coletar(collector);
                break;
            }
        }
    }

    // AABB Simples
    colide(a, b) {
        return (
            a.x < b.x + b.largura &&
            a.x + a.largura > b.x &&
            a.y < b.y + b.altura &&
            a.y + a.altura > b.y
        );
    }

    coletar(player) {
        const inventory = player.obterComponente('InventoryComponent');

        if (inventory) {
            // Lógica de Ícone Inteligente:
            // 1. Se 'this.icon' estiver definido, usa ele.
            // 2. Se não, tenta pegar o assetId do SpriteComponent da própria entidade.
            let iconToUse = this.icon;

            if (!iconToUse) {
                const spriteComp = this.entidade.obterComponente('SpriteComponent');
                if (spriteComp && spriteComp.assetId) {
                    iconToUse = spriteComp.assetId;
                    console.log(`[Item] Auto-detected icon from Sprite: ${iconToUse}`);
                }
            }

            // Passa o ícone (explícito ou detectado)
            const sucesso = inventory.addItem(this.itemId, this.quantidade, iconToUse);

            if (sucesso) {
                console.log(`[Item] ${this.itemId} coletado por ${player.nome}`);

                // Tentar mostrar mensagem através do FloatingTextScript NO PLAYER (não no item!)
                const playerScripts = player.componentes ? Array.from(player.componentes.values()).filter(c => c.tipo === 'ScriptComponent') : [];
                console.log('[Item] Scripts do Player encontrados:', playerScripts.length);

                for (const scriptComp of playerScripts) {
                    console.log('[Item] Verificando script do Player:', scriptComp.scriptClassName, 'tem spawn?', scriptComp.instance && !!scriptComp.instance.spawn);

                    if (scriptComp.instance && scriptComp.instance.spawn) {
                        console.log('[Item] Disparando FloatingTextScript no Player...');
                        // Mensagem padrão: +quantidade itemId
                        let mensagem = this.mensagemColeta || `+${this.quantidade} ${this.itemId}`;

                        // Se não tiver mensagem customizada na prop, tenta buscar do InteractionScript (legacy support)
                        if (!this.mensagemColeta) {
                            const itemScripts = this.entidade.componentes ? Array.from(this.entidade.componentes.values()).filter(c => c.tipo === 'ScriptComponent') : [];
                            for (const is of itemScripts) {
                                if (is.instance && is.instance.mensagem) {
                                    // console.log('[Item] Usando mensagem customizada do InteractionScript:', is.instance.mensagem);
                                    mensagem = is.instance.mensagem;
                                    break;
                                }
                            }
                        }

                        scriptComp.instance.spawn(mensagem, 'yellow', 0, -50);
                        break;
                    }
                }

                if (this.destroyOnPickup) {
                    this.entidade.marcarParaDestruicao = true;
                    this.entidade.visivel = false; // Feedback instantâneo
                    if (this.entidade.engine) {
                        const idx = this.entidade.engine.entidades.indexOf(this.entidade);
                        if (idx > -1) this.entidade.engine.entidades.splice(idx, 1);
                    }
                }
                if (this.pickupSound && window.AudioManager) {
                    window.AudioManager.play(this.pickupSound, 1.0, false, this.pickupPitch || 1.0);
                }
            } else {
                console.log('[Item] Inventário cheio!');
            }
        }
    }

    serializar() {
        return {
            tipo: 'ItemComponent',
            itemId: this.itemId,
            quantidade: this.quantidade,
            icon: this.icon, // Salvar ícone
            pickupSound: this.pickupSound,
            pickupPitch: this.pickupPitch,
            autoPickup: this.autoPickup,
            autoPickup: this.autoPickup,
            destroyOnPickup: this.destroyOnPickup,
            flutuar: this.flutuar
        };
    }

    desserializar(dados) {
        this.itemId = dados.itemId || 'moeda';
        this.quantidade = dados.quantidade || 1;
        this.icon = dados.icon || ''; // Carregar ícone
        this.pickupSound = dados.pickupSound || '';
        this.pickupPitch = dados.pickupPitch !== undefined ? dados.pickupPitch : 1.0;
        this.autoPickup = dados.autoPickup !== undefined ? dados.autoPickup : true;
        this.destroyOnPickup = dados.destroyOnPickup !== undefined ? dados.destroyOnPickup : true;
        this.flutuar = dados.flutuar !== undefined ? dados.flutuar : true;
    }

    // Debug Visual: Mostra a área de colisão do item E linha para o player
    renderizar(renderizador, x, y, w, h) {
        if (!this.entidade.engine || !this.entidade.engine.debugMode) return;

        const ctx = renderizador.ctx;
        ctx.save();

        // 1. Box do Item
        ctx.strokeStyle = '#ffff00'; // Amarelo
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(x, y, w, h);

        // 2. Linha para o Player mais próximo
        const collectors = this.entidade.engine.entidades.filter(e => e.temComponente('InventoryComponent'));
        let nearest = null;
        let minDist = Infinity;
        const cx = x + w / 2;
        const cy = y + h / 2;

        for (const c of collectors) {
            const dx = (c.x + c.largura / 2) - cx;
            const dy = (c.y + c.altura / 2) - cy;
            const dist = dx * dx + dy * dy;
            if (dist < minDist) {
                minDist = dist;
                nearest = c;
            }
        }

        if (nearest) {
            const nx = nearest.x + nearest.largura / 2;
            const ny = nearest.y + nearest.altura / 2;
            const colliding = this.colide(this.entidade, nearest);

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(nx, ny);
            ctx.strokeStyle = colliding ? '#00ff00' : '#ff0000'; // Verde se tocou, Vermelho se não
            ctx.lineWidth = colliding ? 4 : 1;
            ctx.setLineDash([]);
            ctx.stroke();

            // Desenha box do player alvo também para ver se bate
            if (colliding) {
                ctx.strokeStyle = '#00ff00';
                ctx.strokeRect(nearest.x, nearest.y, nearest.largura, nearest.altura);
            }
        }

        ctx.restore();
    }
}

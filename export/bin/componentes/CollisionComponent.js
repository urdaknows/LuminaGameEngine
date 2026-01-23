/**
 * CollisionComponent - Sistema de colisão AABB
 */
class CollisionComponent {
    constructor() {
        this.tipo = 'CollisionComponent';
        this.nome = 'Colisão / Trigger';
        this.ativo = true;

        // Configuração
        this.largura = 32;
        this.altura = 32;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isTrigger = false;

        // Suporte a Espelhamento
        this.mirrorX = false; // Se true, inverte offsetX quando sprite vira
        this.offsetXMirrored = 0; // Offset alternativo para quando estiver invertido

        this.debugColor = '#00ff00';

        // Estado
        this.entidade = null;
        this.colisoesAtuais = new Set();
        this.lastLog = 0;
    }

    inicializar(entidade) {
        this.entidade = entidade;
        // Tenta ajustar tamanho inicial baseado na entidade
        if (this.largura === 32 && entidade.largura) this.largura = entidade.largura;
        if (this.altura === 32 && entidade.altura) this.altura = entidade.altura;
    }

    /**
     * Retorna os limites absolutos (Mundo) da colisão
     */
    obterLimitesAbsolutos(entidade) {
        const ent = entidade || this.entidade;
        if (!ent) return { x: 0, y: 0, w: 0, h: 0 };

        let finalOffsetX = this.offsetX;

        // Lógica de Espelhamento Automático
        if (this.mirrorX) {
            const sprite = ent.obterComponente('SpriteComponent');
            if (sprite && sprite.inverterX) {
                // Usa o offset espelhado explícito
                finalOffsetX = this.offsetXMirrored;
            }
        }

        return {
            x: ent.x + finalOffsetX,
            y: ent.y + this.offsetY,
            w: this.largura,
            h: this.altura
        };
    }

    /**
     * Verificação de segurança para chão (Evitar tunneling extremo)
     */
    verificarChaoRobusto(entidade) {
        // Implementação futura para Anti-Tunneling
        // Por enquanto, apenas um limite de segurança do mundo
        if (entidade.y > 3000) {
            // Reset ou Kill
        }
    }

    /**
     * Verifica colisão com o Tilemap (Entidades com TilemapComponent)
     */
    verificarColisaoMapa(entidade, deltaTime) {
        if (!entidade.engine) return;

        // Encontrar TODOS os Tilemaps na cena
        const tilemapEnts = entidade.engine.entidades.filter(e => e.obterComponente('TilemapComponent'));

        // Resetar estado de chão
        entidade.noChao = false;

        // Resetar flags de colisão lateral
        entidade.colidiuParede = false;
        entidade.colidiuEsquerda = false;
        entidade.colidiuDireita = false;

        // RESET INTELIGENTE de limites de parede:
        // Só limpa se o player está se AFASTANDO da parede
        // _wallRightLimit é MAX X (Parede na direita). Limpa se move para ESQUERDA.
        if (entidade._wallRightLimit !== undefined && entidade.velocidadeX < -10) {
            entidade._wallRightLimit = undefined;
        }
        // _wallLeftLimit é MIN X (Parede na esquerda). Limpa se move para DIREITA.
        if (entidade._wallLeftLimit !== undefined && entidade.velocidadeX > 10) {
            entidade._wallLeftLimit = undefined;
        }

        // Se o player pulou (velocidade Y negativa), desgrudar do chão
        if (entidade.velocidadeY < -50) { // Threshold para detectar pulo
            entidade._grounded = false;
        }

        // Acumular correções de TODOS os tilemaps antes de aplicar
        let maxCorrectionTop = 0;
        let maxCorrectionBottom = 0;
        let maxCorrectionLeft = 0;
        let maxCorrectionRight = 0;
        let shouldApplyTop = false;
        let shouldApplyBottom = false;
        let shouldApplyLeft = false;
        let shouldApplyRight = false;
        let potentialGround = false;

        for (const tilemapEnt of tilemapEnts) {
            const tilemap = tilemapEnt.obterComponente('TilemapComponent');
            if (!tilemap || !tilemap.ativo) continue;

            let baseSize = tilemap.tileSize || 32;
            if (baseSize <= 0) continue;

            const scale = tilemap.scale || 1.0;
            const tileSize = baseSize * scale; // Tamanho efetivo do tile no mundo

            const bounds = this.obterLimitesAbsolutos(entidade);
            if (isNaN(bounds.x) || isNaN(bounds.y)) return;

            // Converter bounds para grid
            const relX = bounds.x - tilemapEnt.x;
            const relY = bounds.y - tilemapEnt.y;

            const startCol = Math.floor(relX / tileSize);
            const endCol = Math.floor((relX + bounds.w) / tileSize);
            const startRow = Math.floor(relY / tileSize);
            const endRow = Math.floor((relY + bounds.h) / tileSize);

            // Variáveis movidas para fora do loop para acumular correções entre camadas

            // Verificar tiles na área da entidade
            for (let r = startRow; r <= endRow; r++) {
                for (let c = startCol; c <= endCol; c++) {
                    const tile = tilemap.getTile(c, r);

                    let isSolid = false;
                    if (tile) {
                        if (typeof tile === 'object' && (tile.solid || tile.wall || tile.ground)) {
                            isSolid = true;
                        }
                    }

                    if (isSolid) {
                        this.dispararEvento(entidade, 'MapCollision', tilemapEnt, { x: c, y: r });

                        // Resolução Física Simples (AABB vs AABB estático)
                        const tileX = tilemapEnt.x + c * tileSize;
                        const tileY = tilemapEnt.y + r * tileSize;

                        const tileW = tileSize;
                        const tileH = tileSize;

                        const entLeft = bounds.x;
                        const entRight = bounds.x + bounds.w;
                        const entTop = bounds.y;
                        const entBottom = bounds.y + bounds.h;

                        const tileLeft = tileX;
                        const tileRight = tileX + tileW;
                        const tileTop = tileY;
                        const tileBottom = tileY + tileH;

                        // Verificar vizinhos para "Internal Edge Smoothing" (Evitar colisão em arestas internas)
                        const tileAbove = tilemap.getTile(c, r - 1);
                        const tileBelow = tilemap.getTile(c, r + 1);
                        const tileLeftN = tilemap.getTile(c - 1, r);
                        const tileRightN = tilemap.getTile(c + 1, r);

                        const solidAbove = tileAbove && tileAbove.solid;
                        const solidBelow = tileBelow && tileBelow.solid;
                        const solidLeft = tileLeftN && tileLeftN.solid;
                        const solidRight = tileRightN && tileRightN.solid;

                        // Calcular overlaps (Infinita se houver vizinho, ignorando a aresta)
                        const overlapLeft = solidLeft ? Infinity : (entRight - tileLeft);
                        const overlapRight = solidRight ? Infinity : (tileRight - entLeft);
                        const overlapTop = solidAbove ? Infinity : (entBottom - tileTop);
                        const overlapBottom = solidBelow ? Infinity : (tileBottom - entTop);

                        // Determinar menor sobreposição para resolver
                        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                        // Se minOverlap for Infinity, estamos dentro da parede sólida (sem arestas expostas relevantes)
                        if (minOverlap === Infinity) continue;

                        // [FIX-FLICKER] Detectar se existe chão potencial abaixo (para Sticky Ground funcionar apenas se houver chão)
                        if ((minOverlap === overlapTop || minOverlap === overlapBottom) && (solidBelow || minOverlap !== Infinity)) {
                            // Heurística simples: Se há colisão vertical calculada, existe "chão/teto" potencial.
                            potentialGround = true;
                        }

                        // TOLERÂNCIA: Ignora overlaps muito pequenos (< 0.5px) para evitar "micro-colisões"
                        if (minOverlap < 0.5) {
                            continue; // Pula este tile
                        }

                        if (tile && tile.plataforma) {
                            // Lógica One-Way Platform (Permissive Fit)
                            const isFalling = entidade.velocidadeY >= 0;

                            if (isFalling && overlapTop <= overlapBottom) {
                                // Acumula a maior correção necessária
                                if (overlapTop > maxCorrectionTop) {
                                    maxCorrectionTop = overlapTop;
                                    shouldApplyTop = true;
                                    potentialGround = true; // Confirmed ground
                                }
                            }
                            continue;
                        }

                        // Acumular correções (em vez de aplicar diretamente)
                        if (minOverlap === overlapTop) {
                            if (entidade.velocidadeY > 0 && !this.isTrigger) {
                                if (overlapTop > maxCorrectionTop) {
                                    maxCorrectionTop = overlapTop;
                                    shouldApplyTop = true;
                                    potentialGround = true;
                                }
                            }
                        } else if (minOverlap === overlapBottom) {
                            if (entidade.velocidadeY < 0 && !this.isTrigger) {
                                if (overlapBottom > maxCorrectionBottom) {
                                    maxCorrectionBottom = overlapBottom;
                                    shouldApplyBottom = true;
                                }
                            }
                        } else if (minOverlap === overlapLeft) {
                            if (entidade.velocidadeX > 0 && !this.isTrigger) {
                                if (overlapLeft > maxCorrectionLeft) {
                                    maxCorrectionLeft = overlapLeft;
                                    shouldApplyLeft = true;
                                }
                            }
                        } else if (minOverlap === overlapRight) {
                            if (entidade.velocidadeX < 0 && !this.isTrigger) {
                                if (overlapRight > maxCorrectionRight) {
                                    maxCorrectionRight = overlapRight;
                                    shouldApplyRight = true;
                                }
                            }
                        }
                    }
                }
            }

        } // Fim do Loop de Tilemaps

        // Aplicar correções UMA VEZ (evita acumulação)
        if (shouldApplyTop && !isNaN(maxCorrectionTop)) {
            // console.log('🔴 CORREÇÃO TOPO:', maxCorrectionTop.toFixed(2), 'px | Player Y:', entidade.y.toFixed(1));
            entidade.y -= maxCorrectionTop;
            entidade.velocidadeY = 0;
            entidade.noChao = true;

            // FIX DEFINITIVO: Marcar a posição Y "grudada" para evitar flutuação
            // Nos próximos frames, se o overlap for micro (<2px) e estiver grudado, não corrige
            entidade._groundY = entidade.y;
            entidade._grounded = true;

        } else if (entidade._grounded && maxCorrectionTop < 2.0 && potentialGround) {
            // FIXED: Só aplica Sticky Ground se HOUVER potencialGround (tile sólido abaixo).
            // Evita flutuar ao sair de um cliff (onde potentialGround = false).
            // console.log('⚠️ IGNORADO (grudado):', maxCorrectionTop.toFixed(2), 'px');
            entidade.y = entidade._groundY; // Força posição exata
            entidade.velocidadeY = 0;
            entidade.noChao = true;

        } else {
            // Perdeu contato com o chão e não há chão potencial (Cliff) -> Cai
            entidade._grounded = false;
        }
        if (shouldApplyBottom && !isNaN(maxCorrectionBottom)) {
            // console.log('🔵 CORREÇÃO TETO:', maxCorrectionBottom.toFixed(2), 'px');
            entidade.y += maxCorrectionBottom;
            entidade.velocidadeY = 0;
        }
        if (shouldApplyLeft && !isNaN(maxCorrectionLeft)) {
            entidade.x -= maxCorrectionLeft; // Empurra para ESQUERDA
            entidade._wallRightLimit = entidade.x;
            entidade.velocidadeX = 0;
            entidade.colidiuParede = true;
            entidade.colidiuEsquerda = true;
        }
        if (shouldApplyRight && !isNaN(maxCorrectionRight)) {
            entidade.x += maxCorrectionRight; // Empurra para DIREITA
            entidade._wallLeftLimit = entidade.x;
            entidade.velocidadeX = 0;
            entidade.colidiuParede = true;
            entidade.colidiuDireita = true;
        }

        // [FIX GHOST WALL] Se não colidiu, limpa limites antigos
        if (!entidade.colidiuParede) {
            entidade._wallRightLimit = undefined;
            entidade._wallLeftLimit = undefined;
        }
    }

    /**
     * Verifica colisão com outras entidades sólidas (Entity vs Entity)
     */
    verificarColisaoEntidades(entidade, deltaTime) {
        if (!entidade.engine) return;

        // Encontrar todas as entidades sólidas (exceto a própria)
        const entidadesSolidas = entidade.engine.entidades.filter(e =>
            e !== entidade && e.solido && !e.obterComponente('TilemapComponent')
        );

        if (entidadesSolidas.length === 0) return;

        const bounds = this.obterLimitesAbsolutos(entidade);
        if (isNaN(bounds.x) || isNaN(bounds.y)) return;

        for (const outraEntidade of entidadesSolidas) {
            const outroBounds = {
                x: outraEntidade.x,
                y: outraEntidade.y,
                w: outraEntidade.largura,
                h: outraEntidade.altura
            };

            // Verifica overlap AABB
            const overlap = !(
                bounds.x + bounds.w <= outroBounds.x ||
                bounds.x >= outroBounds.x + outroBounds.w ||
                bounds.y + bounds.h <= outroBounds.y ||
                bounds.y >= outroBounds.y + outroBounds.h
            );

            if (overlap) {
                // DISPATCH EVENTS (Physics Engine Hook)
                if (this.isTrigger || entidade.isTrigger) { // Se um deles é trigger, é Trigger Event
                    this.dispararEvento(entidade, 'onTriggerEnter', outraEntidade);
                    // Opcional: Disparar também no outro
                } else {
                    this.dispararEvento(entidade, 'onCollisionEnter', outraEntidade);
                }

                // Se for Trigger, NÃO faz resolução física
                if (this.isTrigger) return;

                const entLeft = bounds.x;
                const entRight = bounds.x + bounds.w;
                const entTop = bounds.y;
                const entBottom = bounds.y + bounds.h;

                const outroLeft = outroBounds.x;
                const outroRight = outroBounds.x + outroBounds.w;
                const outroTop = outroBounds.y;
                const outroBottom = outroBounds.y + outroBounds.h;

                const overlapLeft = entRight - outroLeft;
                const overlapRight = outroRight - entLeft;
                const overlapTop = entBottom - outroTop;
                const overlapBottom = outroBottom - entTop;

                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                if (!this.isTrigger) {
                    if (minOverlap === overlapTop) {
                        if (entidade.velocidadeY > 0) {
                            entidade.y -= overlapTop;
                            entidade.velocidadeY = 0;
                            entidade.noChao = true;
                            // console.log('[COLLISION DEBUG] Player no chão!');
                        }
                    } else if (minOverlap === overlapBottom) {
                        if (entidade.velocidadeY < 0) {
                            entidade.y += overlapBottom;
                            entidade.velocidadeY = 0;
                        }
                    } else if (minOverlap === overlapLeft) {
                        if (entidade.velocidadeX > 0) {
                            entidade.x -= overlapLeft;
                            entidade.velocidadeX = 0;
                        }
                    } else if (minOverlap === overlapRight) {
                        if (entidade.velocidadeX < 0) {
                            entidade.x += overlapRight;
                            entidade.velocidadeX = 0;
                        }
                    }
                }
            }
        }
    }

    /**
     * Verifica triggers especificamente (Entidades marcadas como Trigger)
     */
    /**
     * Verifica triggers especificamente (Entidades marcadas como Trigger)
     */
    verificarTriggers(entidade) {
        if (!entidade.engine) return;

        // Triggers não se resolvem fisicamente, mas disparam eventos
        const triggers = entidade.engine.entidades.filter(e => {
            if (e === entidade) return false;
            const col = e.obterComponente('CollisionComponent');
            return col && col.isTrigger;
        });

        const bounds = this.obterLimitesAbsolutos(entidade);
        const colisoesNesteFrame = new Set();

        for (const triggerEnt of triggers) {
            const col = triggerEnt.obterComponente('CollisionComponent');
            const triggerBounds = col.obterLimitesAbsolutos(triggerEnt);

            const overlap = !(
                bounds.x + bounds.w <= triggerBounds.x ||
                bounds.x >= triggerBounds.x + triggerBounds.w ||
                bounds.y + bounds.h <= triggerBounds.y ||
                bounds.y >= triggerBounds.y + triggerBounds.h
            );

            if (overlap) {
                const triggerId = triggerEnt.id;
                colisoesNesteFrame.add(triggerId);

                // Se NÃO estava colidindo antes, é ENTER
                if (!this.colisoesAtuais.has(triggerId)) {
                    // Avisa o trigger que 'entidade' entrou nele
                    this.dispararEvento(triggerEnt, 'onTriggerEnter', entidade);
                    // Avisa a entidade que entrou no trigger
                    this.dispararEvento(entidade, 'onTriggerEnter', triggerEnt);
                } else {
                    // Se JÁ estava, é STAY (Opcional)
                    if (entidade.obterComponente('ScriptComponent')) {
                        // Otimização: Só disparar se houver listeners interessados? 
                        // Por simplicidade, vamos disparar, mas scripts costumam não implementar Stay.
                        this.dispararEvento(triggerEnt, 'onTriggerStay', entidade);
                        this.dispararEvento(entidade, 'onTriggerStay', triggerEnt);
                    }
                }
            }
        }

        // Verificar EXITS (Estava no set antigo, mas não no novo)
        for (const antigoId of this.colisoesAtuais) {
            if (!colisoesNesteFrame.has(antigoId)) {
                // Encontrar a entidade pelo ID (O(n), mas aceitável para poucos triggers)
                const triggerEnt = entidade.engine.entidades.find(e => e.id === antigoId);
                if (triggerEnt) {
                    this.dispararEvento(triggerEnt, 'onTriggerExit', entidade);
                    this.dispararEvento(entidade, 'onTriggerExit', triggerEnt);
                }
            }
        }

        // Atualizar Cache para o próximo frame
        this.colisoesAtuais = colisoesNesteFrame;
    }

    /* Helper Event Dispatcher */
    dispararEvento(entidadeAlvo, nomeEvento, param) {
        // Itera sobre scripts para chamar o callback
        entidadeAlvo.componentes.forEach(comp => {
            // Verifica se é ScriptComponent E se tem o método do evento
            if (comp.tipo === 'ScriptComponent' && comp[nomeEvento]) {
                comp[nomeEvento](param);
            }
            // Suporte Hacky para componentes nativos como CheckpointComponent?
            // Se CheckpointComponent tiver onTriggerEnter, chamamos direto?
            // Melhor: CheckpointComponent deveria implementar onTriggerEnter e ser chamado aqui também.
            // Mas padrão arquitetural atual parece focar em ScriptComponent wrappers.
            // Vamos dar suporte genérico:
            if (comp[nomeEvento] && typeof comp[nomeEvento] === 'function') {
                comp[nomeEvento](param);
            }
        });
    }

    verificarInimigos(entidade) {
        if (!entidade.engine) return;

        // Apenas o Player verifica inimigos ativamente
        // Aceita "Player", "Novo Player", "Player 2", etc.
        const nomeLower = String(entidade.nome || '').toLowerCase();
        const isPlayer = nomeLower.includes('player') || entidade.tipo === 'player';

        if (!isPlayer) return;

        // Debounce de Morte
        if (entidade._lastDeath && Date.now() - entidade._lastDeath < 1000) return;

        const bounds = this.obterLimitesAbsolutos(entidade);
        if (isNaN(bounds.x)) return;

        // Filtrar inimigos
        // Heurística: Nome contém "Inimigo", "Enemy" ou "Boss" (Case Insensitive)
        const inimigos = entidade.engine.entidades.filter(e => {
            if (e === entidade || e.ativo === false) return false;

            const nomeStr = String(e.nome || '').toLowerCase();
            return nomeStr.includes('inimigo') ||
                nomeStr.includes('enemy') ||
                nomeStr.includes('boss') ||
                (e.tags && e.tags.includes('enemy'));
        });

        for (const inimigo of inimigos) {
            let inimigoBounds;
            const inimigoCol = inimigo.obterComponente('CollisionComponent');

            if (inimigoCol) {
                inimigoBounds = inimigoCol.obterLimitesAbsolutos(inimigo);
            } else {
                // Fallback para entidades sem colisor
                inimigoBounds = {
                    x: inimigo.x,
                    y: inimigo.y,
                    w: inimigo.largura || 32,
                    h: inimigo.altura || 32
                };
            }

            // AABB Check Manual
            const right1 = bounds.x + bounds.w;
            const left1 = bounds.x;
            const bottom1 = bounds.y + bounds.h;
            const top1 = bounds.y;

            const left2 = inimigoBounds.x;
            const right2 = inimigoBounds.x + inimigoBounds.w;
            const top2 = inimigoBounds.y;
            const bottom2 = inimigoBounds.y + inimigoBounds.h;

            const overlap = !(right1 <= left2 || left1 >= right2 || bottom1 <= top2 || top1 >= bottom2);

            if (overlap) {
                if (entidade.morrer) {
                    entidade.morrer();
                }
                return;
            }
        }
    }

    atualizar(entidade, deltaTime) {
        if (!this.ativo) return;

        // 1. Colisão Mapa
        this.verificarColisaoMapa(entidade, deltaTime);

        // 1.5 Colisão Entity vs Entity (objetos sólidos)
        this.verificarColisaoEntidades(entidade, deltaTime);

        // 1.6 Verificar Triggers
        this.verificarTriggers(entidade);

        // 1.8 Colisão com Inimigos (Dano/Morte)
        // REMOVIDO: A lógica de combate agora é feita via Scripts (StatsRPG/InimigoPatrulha)
        // this.verificarInimigos(entidade);

        // 2. Chão Robusto
        this.verificarChaoRobusto(entidade);
    }

    // --- RENDERIZAÇÃO DE DEBUG (GIZMOS) ---
    renderizar(renderizador) {
        if (!renderizador || !renderizador.debugMode) return;

        const ctx = renderizador.ctx;
        if (!ctx) return;

        const bounds = this.obterLimitesAbsolutos(this.entidade);
        if (isNaN(bounds.x)) return;

        ctx.save();

        // Cor: Verde (Sólido) ou Amarelo (Trigger)
        if (this.isTrigger) {
            ctx.strokeStyle = '#ffd93d'; // Amarelo
            // Reduzida opacidade para não atrapalhar no editor
            ctx.fillStyle = 'rgba(255, 217, 61, 0.05)';
        } else {
            ctx.strokeStyle = '#00ff00'; // Verde
            ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        }

        ctx.lineWidth = 1; // Linha fina para não poluir
        // Se a entidade estiver selecionada, faz linha mais grossa? Não, deixa padrão.

        ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
        ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);

        // Desenhar X para indicar centro/offset se houver offset significativo
        if (Math.abs(this.offsetX) > 1 || Math.abs(this.offsetY) > 1) {
            ctx.beginPath();
            ctx.moveTo(bounds.x, bounds.y);
            ctx.lineTo(bounds.x + bounds.w, bounds.y + bounds.h);
            ctx.moveTo(bounds.x + bounds.w, bounds.y);
            ctx.lineTo(bounds.x, bounds.y + bounds.h);
            ctx.stroke();
        }

        ctx.restore();
    }

    serializar() {
        return {
            tipo: 'CollisionComponent',
            // Flat properties (Wrapper config removido)
            ativo: this.ativo,
            offsetX: this.offsetX,
            offsetY: this.offsetY,
            largura: this.largura,
            altura: this.altura,
            isTrigger: this.isTrigger,
            // Novos Campos de Espelhamento
            mirrorX: this.mirrorX,
            offsetXMirrored: this.offsetXMirrored,

            // Legacy/Compatibilidade: salvar também em inglês para garantir se alguém ler diferente
            width: this.largura,
            height: this.altura
        };
    }
    desserializar(dados) {
        // Robustez: aceita flat ou config-wrapped
        const cfg = dados.config || dados;

        if (cfg.ativo !== undefined) this.ativo = cfg.ativo;
        if (cfg.offsetX !== undefined) this.offsetX = cfg.offsetX;
        if (cfg.offsetY !== undefined) this.offsetY = cfg.offsetY;
        if (cfg.largura !== undefined) this.largura = cfg.largura;
        if (cfg.altura !== undefined) this.altura = cfg.altura;
        if (cfg.isTrigger !== undefined) this.isTrigger = cfg.isTrigger;

        // Novos Campos de Espelhamento
        if (cfg.mirrorX !== undefined) this.mirrorX = cfg.mirrorX;
        if (cfg.offsetXMirrored !== undefined) this.offsetXMirrored = cfg.offsetXMirrored;

        // Legacy check
        if (!cfg.largura && cfg.width) this.largura = cfg.width;
        if (!cfg.altura && cfg.height) this.altura = cfg.height;
    }
}
// Exporta para ser usado pelo gerador de componentes
// Exporta para ser usado pelo gerador de componentes
if (typeof window !== 'undefined') {
    window.CollisionComponent = CollisionComponent;
} else if (typeof module !== 'undefined') {
    module.exports = CollisionComponent;
}

export default CollisionComponent;

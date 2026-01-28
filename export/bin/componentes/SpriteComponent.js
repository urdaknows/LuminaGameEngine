export class SpriteComponent {
    constructor() {
        this.tipo = 'SpriteComponent';
        this.entidade = null;

        // Dados da Imagem
        this.imagem = new Image();
        this.source = null; // Base64 ou URL
        this.carregada = false;

        // Configuração de Grid (Sprite Sheet)
        this.larguraFrame = 32;
        this.alturaFrame = 32;

        // Vinculação com Asset
        this._assetId = null;
        this.ultimoAssetId = null; // Cache para detectar mudança

        // Dados de Animação
        this.animacoes = {}; // 'nome' => { frames: [0, 1], speed: 10, loop: true }
        this.animacaoAtual = null;
        this.indiceFrame = 0;
        this.tempoDecorrido = 0;

        // Visualização padrão (se não tiver animação)
        this.framePadrao = 0;

        // Espelhamento
        this.inverterX = false;
        this.inverterY = false;

        // Escala (Scale)
        this.scaleX = 1.0; // Escala horizontal (1.0 = tamanho original)
        this.scaleY = 1.0; // Escala vertical (1.0 = tamanho original)

        // Offset de Renderização (Ajuste fino de posição)
        this.offsetX = 0;
        this.offsetY = 0;

        // Autoplay
        this.autoplayAnim = ''; // Nome da animação para iniciar automaticamente

        // Repetição (Tiled)
        this.tiled = false;
    }

    /**
     * Define a imagem do sprite (Base64 ou URL)
     */
    setSource(source) {
        this.source = source;
        this.imagem.onload = () => {
            this.carregada = true;

            // AUTO-DETECT: Se larguraFrame/alturaFrame ainda são valores padrão (32),
            // atualiza automaticamente para as dimensões reais da imagem
            // EXCETO se detectar que é um sprite sheet (múltiplos de um tamanho comum)
            if (this.larguraFrame === 32 && this.alturaFrame === 32) {
                const w = this.imagem.naturalWidth;
                const h = this.imagem.naturalHeight;

                // Heurística: Se a imagem é muito grande E é múltiplo de tamanhos comuns,
                // provavelmente é um sprite sheet - mantém 32x32
                const isLikelySpriteSheet = (
                    (w > 128 || h > 128) && // Imagem grande
                    (w % 32 === 0 && h % 32 === 0) // Múltiplo de 32
                );

                if (!isLikelySpriteSheet) {
                    // É provavelmente um sprite único - usa dimensões completas
                    this.larguraFrame = w;
                    this.alturaFrame = h;
                    console.log(`[SpriteComponent] Auto-detectado sprite único: ${this.larguraFrame}x${this.alturaFrame}`);
                } else {
                    // Provavelmente é sprite sheet - mantém 32x32 e avisa
                    console.log(`[SpriteComponent] Sprite sheet detectado (${w}x${h}). Use larguraFrame/alturaFrame manual se não for 32x32.`);
                }
            }
        };
        this.imagem.src = source;

        // Verifica se já carregou (cache)
        if (this.imagem.complete && this.imagem.naturalWidth > 0) {
            this.carregada = true;

            // AUTO-DETECT para imagem já em cache (mesma lógica)
            if (this.larguraFrame === 32 && this.alturaFrame === 32) {
                const w = this.imagem.naturalWidth;
                const h = this.imagem.naturalHeight;

                const isLikelySpriteSheet = (
                    (w > 128 || h > 128) &&
                    (w % 32 === 0 && h % 32 === 0)
                );

                if (!isLikelySpriteSheet) {
                    this.larguraFrame = w;
                    this.alturaFrame = h;
                    console.log(`[SpriteComponent] Auto-detectado sprite único (cache): ${this.larguraFrame}x${this.alturaFrame}`);
                } else {
                    console.log(`[SpriteComponent] Sprite sheet detectado (cache, ${w}x${h}). Use larguraFrame/alturaFrame manual.`);
                }
            }
        }
    }

    get assetId() {
        return this._assetId;
    }

    set assetId(val) {
        this._assetId = val;
        // Tenta carregar imediatamente se possível
        if (typeof window !== 'undefined' && window.editor && window.editor.assetManager) {
            this.atualizar(this.entidade, 0);
        }
    }

    get assetId() {
        return this._assetId;
    }

    set assetId(val) {
        this._assetId = val;
        // Tenta carregar imediatamente se possível
        if (typeof window !== 'undefined' && window.editor && window.editor.assetManager) {
            this.atualizar(this.entidade, 0);
        }
    }

    /**
     * Adiciona ou atualiza uma animação
     */
    definirAnimacao(nome, frames, speed = 10, loop = true) {
        this.animacoes[nome] = {
            frames: frames,
            speed: speed,
            loop: loop
        };
    }

    /**
     * Verifica se a animação atual completou (útil para animações sem loop)
     */
    animacaoCompleta() {
        if (!this.animacaoAtual) return true;
        const anim = this.animacoes[this.animacaoAtual];
        if (!anim) return true;
        // Se faz loop, nunca está "completa"
        if (anim.loop) return false;
        // Se não faz loop, está completa quando chegou no último frame
        return this.indiceFrame >= anim.frames.length - 1;
    }

    /**
     * Toca uma animação
     */
    play(nome) {
        // DEBUG
        // console.log(`SpriteComponent.play('${nome}') - Anim atual: ${this.animacaoAtual}`);

        if (!nome) return;

        // Normalização para busca case-insensitive
        let nomeReal = nome;

        // 1. Tenta encontrar a animação na lista local (case-insensitive)
        if (this.animacoes) {
            if (this.animacoes[nome]) {
                nomeReal = nome; // Encontrou exato
            } else {
                // Tenta encontrar ignorando case
                const keyEncontrada = Object.keys(this.animacoes).find(k => k.toLowerCase() === nome.toLowerCase());
                if (keyEncontrada) {
                    nomeReal = keyEncontrada;
                }
            }
        }

        // Se encontrou na lista local
        if (this.animacoes && this.animacoes[nomeReal]) {
            if (this.animacaoAtual !== nomeReal) {
                // console.log(`[SpriteComponent] Trocando animação para: '${nomeReal}' (solicitado: '${nome}')`); // DEBUG
                this.animacaoAtual = nomeReal;
                this.indiceFrame = 0;
                this.tempoDecorrido = 0;


            }
            return true; // Sucesso
        }

        // DEBUG: Se chegou aqui, não achou a animação na lista local
        console.warn(`[SpriteComponent] Animação '${nome}' não encontrada nas chaves:`, Object.keys(this.animacoes || {}));

        // 2. Se não achou, verifica se é um ID de outro Asset (para trocar sprite inteiro)
        // Isso permite usar assets separados para cada estado (Ex: Heroi_Idle.png, Heroi_Run.png)
        if (typeof window !== 'undefined' && window.editor && window.editor.assetManager) {
            // Verifica se mudou de asset
            if (this.assetId !== nome) {
                const asset = window.editor.assetManager.obterAsset(nome);
                if (asset) {
                    // É um asset válido! Troca para ele.
                    this.assetId = nome;

                    // Força carga imediata dos dados do novo asset
                    if (this.source !== asset.source) this.setSource(asset.source);
                    this.larguraFrame = asset.larguraFrame;
                    this.alturaFrame = asset.alturaFrame;
                    this.animacoes = asset.animacoes || {}; // Garante objeto
                    this.ultimoAssetId = this.assetId;

                    // Lógica para determinar qual animação tocar no novo asset
                    // Se o asset tiver a animação "padrão" (ex: idle), usa ela. Se não, usa a primeira.
                    // ATENÇÃO: Se trocamos o Asset para "Heroi_Run", provavelmente queremos tocar a animação que ele conter.
                    const animNames = Object.keys(this.animacoes);
                    if (animNames.length > 0) {
                        if (this.animacoes['idle']) this.animacaoAtual = 'idle';
                        else if (this.animacoes['walk']) this.animacaoAtual = 'walk';
                        else this.animacaoAtual = animNames[0];
                    } else {
                        // Fallback seguro: criar animação 'default' com 4 frames
                        this.definirAnimacao('default', [0, 1, 2, 3], 10, true);
                        this.animacaoAtual = 'default';
                    }

                    this.indiceFrame = 0;
                    this.tempoDecorrido = 0;
                    return true; // Sucesso na troca de asset
                }
            }
        }

        return false; // Falha (não encontrou anim nem asset)
    }

    /**
     * Para a animação atual
     */
    stop() {
        this.animacaoAtual = null;
        this.indiceFrame = 0;
    }

    /**
     * Atualiza o estado da animação
     */
    atualizar(entidade, deltaTime) {
        // DEBUG: Verificar se atualizar está rodando e status do asset
        // if (Math.random() < 0.01) console.log(`[SpriteComponent.atualizar] ID: ${this.assetId}, Carregada: ${this.carregada}, Src: ${this.source ? 'OK' : 'Null'}`);

        // Sincronizar com Asset se disponível para o editor
        if (this.assetId && typeof window !== 'undefined' && window.editor && window.editor.assetManager) {
            // console.log('[SpriteComponent.atualizar] assetId:', this.assetId);
            const asset = window.editor.assetManager.obterAsset(this.assetId);
            // if (Math.random() < 0.05) console.log('[SpriteComponent] Asset:', asset); // Log amostral

            if (asset) {
                // Atualiza se o asset mudou ou se é a primeira vez, OU se ainda não carregou corretamente
                if (this.ultimoAssetId !== this.assetId || !this.source || (!this.carregada && Object.keys(this.animacoes).length === 0)) {
                    // console.log('[SpriteComponent] Sincronizando asset:', this.assetId);

                    if (this.source !== asset.source) this.setSource(asset.source);

                    // AUTO-DETECT: Detecta dimensões do asset automaticamente
                    // Se asset tem dimensões específicas, usa elas. Se não, usa detecção automática
                    if (asset.larguraFrame && asset.alturaFrame) {
                        this.larguraFrame = asset.larguraFrame;
                        this.alturaFrame = asset.alturaFrame;
                    } else if (asset.source) {
                        // Se não tem dimensões no asset, tenta detectar da imagem
                        const tempImg = new Image();
                        tempImg.onload = () => {
                            if (this.larguraFrame === 32 && this.alturaFrame === 32) {
                                this.larguraFrame = tempImg.naturalWidth;
                                this.alturaFrame = tempImg.naturalHeight;
                                console.log(`[SpriteComponent] Auto-detectado do asset: ${this.larguraFrame}x${this.alturaFrame}`);
                            }
                        };
                        tempImg.src = asset.source;

                        // Se já está em cache
                        if (tempImg.complete && tempImg.naturalWidth > 0) {
                            if (this.larguraFrame === 32 && this.alturaFrame === 32) {
                                this.larguraFrame = tempImg.naturalWidth;
                                this.alturaFrame = tempImg.naturalHeight;
                            }
                        }
                    } else {
                        // Fallback: usa valores padrão do asset se disponível
                        this.larguraFrame = asset.larguraFrame || 32;
                        this.alturaFrame = asset.alturaFrame || 32;
                    }

                    // FIX: Asset deve sobrescrever animações locais, não o contrário
                    // Ordem correta: primeiro local (this), depois asset (sobrescreve)
                    this.animacoes = { ...this.animacoes, ...asset.animacoes };

                    // CRÍTICO FIX: Se não tem source global mas tem animações com imagens, marca como carregada
                    if (!this.carregada) {
                        const values = Object.values(this.animacoes);
                        const hasAnimWithImage = values.some(anim => anim && anim.source);

                        if (hasAnimWithImage) {
                            this.carregada = true;
                            if (!this.imagem) this.imagem = new Image();

                            // PRELOAD: Carregar imagens imediatamente para evitar delay no primeiro frame
                            if (!this.imageCache) this.imageCache = {};
                            values.forEach(anim => {
                                if (anim && anim.source && !this.imageCache[anim.source]) {
                                    const img = new Image();
                                    img.src = anim.source;
                                    this.imageCache[anim.source] = img;
                                }
                            });
                        }
                    }

                    this.ultimoAssetId = this.assetId;
                }
            } else {
                console.warn('[SpriteComponent.atualizar] Asset não encontrado no AssetManager!');
            }
        } else {
            if (this.assetId) {
                console.warn('[SpriteComponent.atualizar] AssetManager não disponível! window.editor:', window.editor);
            }
        }

        // Autoplay Check
        if (this.autoplayAnim && !this.animacaoAtual) {
            this.play(this.autoplayAnim);
        }

        if (!this.carregada || !this.animacaoAtual) return;

        const anim = this.animacoes[this.animacaoAtual];
        if (!anim) return;

        this.tempoDecorrido += deltaTime; // deltaTime em segundos

        const tempoPorFrame = 1 / anim.speed;

        if (this.tempoDecorrido >= tempoPorFrame) {
            this.tempoDecorrido -= tempoPorFrame;

            // Avança frame
            this.indiceFrame++;

            // Loop
            if (this.indiceFrame >= anim.frames.length) {
                if (anim.loop) {
                    this.indiceFrame = 0;
                } else {
                    this.indiceFrame = anim.frames.length - 1; // Trava no último
                }
            }
        }
    }

    /**
     * Retorna a hitbox definida para o frame atual da animação (se houver)
     * Retorna null se não houver hitbox.
     * As coordenadas são RELATIVAS ao centro do sprite (0,0).
     */
    obterHitboxAtual() {
        if (!this.animacaoAtual) return null; // Changed from animacaoSelecionada to animacaoAtual

        const anim = this.animacoes[this.animacaoAtual];
        if (!anim || !anim.hitboxes) return null;

        const frameIndex = anim.frames[this.indiceFrame];
        // Hitboxes são mapeadas pelo índice global do frame no spritesheet
        const hitbox = anim.hitboxes[frameIndex];

        if (hitbox) {
            // Retorna cópia para evitar mutação externa acidental
            // Ajustar espelhamento (Inverter X)
            let x = hitbox.x;
            if (this.inverterX) {
                // Se invertido, o X deve ser espelhado em relação ao centro (0)
                // Ex: x=10, w=20 (vai de 10 a 30). Centro a 0.
                // Invertido: vai de -30 a -10.
                // Novo X = -(x + w)
                x = -(hitbox.x + hitbox.w);
            }

            return {
                x: x,
                y: hitbox.y, // TODO: InverterY se necessário
                w: hitbox.w,
                h: hitbox.h
            };
        }
        return null;
    }

    /**
     * Renderiza o sprite no contexto
     */
    renderizar(renderizador, x, y, largura, altura, rotacao = 0) {
        // DEBUG: Verificar entrada
        // console.log(`[SpriteComponent] renderizar chamado. ID: ${this.assetId}, Anim: ${this.animacaoAtual}, Frame: ${this.indiceFrame}`);

        if (!this.imagem || !this.carregada) {
            // Se tem assetId mas ainda não carregou a imagem, retorna true para EVITAR o quadrado vermelho de fallback
            if (this.assetId) {
                // console.log('[SpriteComponent] Waiting for image load...');
                return true;
            }
            // console.warn('[SpriteComponent] No image and no assetId. Cannot render.');
            return false;
        }



        const ctx = renderizador.ctx;

        // ==========================
        // Configuração de Suavização
        // ==========================
        const originalSmoothing = ctx.imageSmoothingEnabled;
        let targetSmoothing = (typeof renderizador.imageSmoothingEnabledDefault === 'boolean')
            ? renderizador.imageSmoothingEnabledDefault
            : false;

        if (typeof window !== 'undefined' && window.editor && window.editor.assetManager && this.assetId) {
            const asset = window.editor.assetManager.obterAsset(this.assetId);
            if (asset && typeof asset.imageSmoothing === 'boolean') {
                targetSmoothing = asset.imageSmoothing;
            }
        }

        if (ctx.imageSmoothingEnabled !== targetSmoothing) {
            ctx.imageSmoothingEnabled = targetSmoothing;
            ctx.mozImageSmoothingEnabled = targetSmoothing;
            ctx.webkitImageSmoothingEnabled = targetSmoothing;
            ctx.msImageSmoothingEnabled = targetSmoothing;
        }

        // Calcula frame atual
        let frame = 0;
        const anim = this.animacoes[this.animacaoAtual];
        if (anim && anim.frames && anim.frames.length > 0) {
            frame = anim.frames[this.indiceFrame];
        } else {
            // Se não tem animação, usa frame padrão se for número
            frame = this.framePadrao;
        }

        let sx, sy, sw, sh;
        let imgToDraw = this.imagem; // Imagem padrão (base)

        // Suporte a Source por Animação (Override global)
        if (anim && anim.source) {
            // Cache check (garante que existe no cache)
            if (!this.imageCache) this.imageCache = {};
            if (!this.imageCache[anim.source]) {
                const img = new Image();
                img.src = anim.source;
                this.imageCache[anim.source] = img;
            }

            const cachedImg = this.imageCache[anim.source];
            // Se tiver cache, usa ele. Se não estiver 100% pronto, o drawImage pode falhar silenciosamente 
            // ou desenhar parcial, é melhor que não desenhar nada (retornar false).
            if (cachedImg) {
                imgToDraw = cachedImg;
            }
        }

        // Verifica se o frame é um objeto (Coordenadas Explícitas) ou número (Índice de Grid)
        if (typeof frame === 'object' && frame !== null) {
            // Formato Novo: { x, y, w, h, source? }
            sx = frame.x;
            sy = frame.y;
            sw = frame.w || this.larguraFrame;
            sh = frame.h || this.alturaFrame;

            // Suporte para Multi-Image Animation
            if (frame.source) {
                // Se não tem cache, cria
                if (!this.imageCache) this.imageCache = {};

                // Se não tem a imagem no cache, cria
                if (!this.imageCache[frame.source]) {
                    const img = new Image();
                    img.src = frame.source;
                    this.imageCache[frame.source] = img;
                }

                // Tenta usar a imagem do cache
                const cachedImg = this.imageCache[frame.source];
                if (cachedImg.complete && cachedImg.naturalWidth > 0) {
                    imgToDraw = cachedImg;
                } else {
                    // Placeholder enquanto carrega
                    // Não desenhar nada ou desenhar loading discreto
                    // const ctx = renderizador.ctx;
                    // ctx.save();
                    // ctx.translate(x, y);
                    // ctx.rotate(rotacao);
                    // ctx.fillStyle = 'rgba(255, 0, 255, 0.5)'; // Magenta Transparente
                    // ctx.fillRect(-largura / 2, -altura / 2, largura, altura);
                    // ctx.restore();
                    return; // Aguarda carregar silenciosamente
                }
            }
        } else {
            // Formato Antigo: Índice (0, 1, 2...)
            const frameIndex = frame;

            // NOVO: Usar largura/altura da animação se disponível, senão usar global
            const frameW = (anim && anim.frameWidth) ? anim.frameWidth : this.larguraFrame;
            const frameH = (anim && anim.frameHeight) ? anim.frameHeight : this.alturaFrame;

            // FIX: Usar a largura da imagem que REALMENTE está sendo desenhada
            const widthRef = imgToDraw ? imgToDraw.width : 0;
            const cols = Math.floor(widthRef / frameW);

            // console.log(`[SpriteComponent] FrameCalc: Index=${frameIndex}, Width=${widthRef}, Cols=${cols}, FrameW=${frameW}`);

            // Evita divisão por zero
            if (cols === 0) {
                // console.warn(`[SpriteComponent] Render Limit: Cols is 0. ImgW: ${widthRef}, FrameW: ${frameW}, Src: ${imgToDraw ? imgToDraw.src : 'none'}`);
                return;
            }

            const col = frameIndex % cols;
            const row = Math.floor(frameIndex / cols);

            sx = col * frameW;
            sy = row * frameH;
            sw = frameW;
            sh = frameH;
        }

        // Evitar erros de drawImage com coordenadas inválidas
        if (sx < 0 || sy < 0 || sw <= 0 || sh <= 0) return;
        // Opcional: clip se sair da imagem (browsers geralmente ignoram ou clipam, mas validação ajuda)

        ctx.save();

        // 1. Mover para o centro da entidade (Pivot)
        const centroX = x + largura / 2;
        const centroY = y + altura / 2;
        ctx.translate(centroX, centroY);

        // 2. Rotacionar
        ctx.rotate(rotacao);

        // 3. Aplicar Escala e Espelhamento
        let scaleX = this.scaleX || 1.0; // Escala customizada
        let scaleY = this.scaleY || 1.0;

        // Se invertido, inverte a escala (multiplica por -1)
        if (this.inverterX) scaleX *= -1;
        if (this.inverterY) scaleY *= -1;

        ctx.scale(scaleX, scaleY);

        if (!imgToDraw || !imgToDraw.complete || imgToDraw.naturalWidth === 0) {
            // Debug apenas se deveria ter uma imagem mas ela falhou
            if (this.carregada) {
                // console.warn('[SpriteComponent] Imagem não pronta para renderizar:', this.animacaoAtual);
            }
            ctx.restore();
            // Se tem assetId, assume que está carregando e retorna true para não desenhar o quadrado vermelho
            return !!this.assetId;
        }

        // === EFEITO DE PISCAR (INVENCIBILIDADE) ===
        // Oscila a opacidade para criar efeito de piscar
        if (this.entidade._piscando) {
            // Pisca rápido (4 vezes por segundo)
            const blinkSpeed = 200; // ms
            const phase = Date.now() % blinkSpeed;
            ctx.globalAlpha = phase < (blinkSpeed / 2) ? 1.0 : 0.2;
        }

        // === EFEITO DE TINT (DANO) ===
        // Pinta o sprite de uma cor (ex: vermelho)
        // Requer composite operation 'source-atop' ou similar
        let tintColor = this.entidade._tint;

        // Se estiver "piscando" (invencível), pode ter um tint especial (ex: branco)
        // se o usuário quiser. Por padrão, mantém a cor original ou o tint de dano.

        // Hack para Tint:
        // O Canvas API não tem "tint" direto fácil sem buffer offscreen.
        // Vamos usar filter se disponível (mais moderno) ou ignorar se complexo demais.
        if (tintColor && ctx.filter) {
            // Ex: tintColor = 'red' -> filter: sepia(1) hue-rotate(...) ? Não é exato.
            // Melhor: Red Overlay usando source-atop
        }

        // 4. Desenhar centralizado (offset relativo)
        // Usa offset da animação se disponível, senão usa offset global
        const offsetX = (anim && anim.offsetX !== undefined) ? anim.offsetX : this.offsetX;
        const offsetY = (anim && anim.offsetY !== undefined) ? anim.offsetY : this.offsetY;

        // Usa drawWidth/drawHeight da animação se disponível
        // Se não especificado, calcula para manter proporção do frame
        let drawWidth, drawHeight;

        if (anim && (anim.drawWidth || anim.drawHeight)) {
            // Se especificou tamanho customizado, usa ele
            drawWidth = anim.drawWidth || largura;
            drawHeight = anim.drawHeight || altura;
        } else {
            // Mantém proporção do frame original
            // Usa o maior lado da entidade como referência e calcula o outro proporcionalmente
            const frameAspect = sw / sh; // Proporção do frame (ex: 80/64 = 1.25)
            const entityAspect = largura / altura;

            if (frameAspect > entityAspect) {
                // Frame é mais largo que entidade - usar largura da entidade
                drawWidth = largura;
                drawHeight = largura / frameAspect;
            } else {
                // Frame é mais alto ou igual - usar altura da entidade
                drawHeight = altura;
                drawWidth = altura * frameAspect;
            }
        }

        // OVERRIDE FOR TILED: Se for Tiled, usa tamanho nativo do frame (ajustado por escala)
        if (this.tiled) {
            drawWidth = sw * Math.abs(this.scaleX || 1);
            drawHeight = sh * Math.abs(this.scaleY || 1);
        }

        try {
            if (this.tiled) {
                // Tiled Rendering (Repetição)
                const startX = -largura / 2;
                const startY = -altura / 2;
                const cols = Math.ceil(largura / drawWidth);
                const rows = Math.ceil(altura / drawHeight);

                for (let cy = 0; cy < rows; cy++) {
                    for (let cx = 0; cx < cols; cx++) {
                        // Opcional: Cortar o tile se passar da borda (clipping)
                        // Por enquanto desenha inteiro
                        ctx.drawImage(
                            imgToDraw,
                            sx, sy, sw, sh,
                            startX + (cx * drawWidth) + offsetX,
                            startY + (cy * drawHeight) + offsetY,
                            drawWidth, drawHeight
                        );
                    }
                }
            } else {
                // Desenho Normal (Centralizado)
                ctx.drawImage(
                    imgToDraw,
                    sx, sy, sw, sh,
                    -drawWidth / 2 + offsetX,
                    -drawHeight / 2 + offsetY,
                    drawWidth, drawHeight
                );
            }
            ctx.restore();
            if (ctx.imageSmoothingEnabled !== originalSmoothing) {
                ctx.imageSmoothingEnabled = originalSmoothing;
                ctx.mozImageSmoothingEnabled = originalSmoothing;
                ctx.webkitImageSmoothingEnabled = originalSmoothing;
                ctx.msImageSmoothingEnabled = originalSmoothing;
            }
            return true; // Desenhou com sucesso
        } catch (e) {
            console.error('[SpriteComponent] Erro no drawImage:', e);
            ctx.restore();
            if (ctx.imageSmoothingEnabled !== originalSmoothing) {
                ctx.imageSmoothingEnabled = originalSmoothing;
                ctx.mozImageSmoothingEnabled = originalSmoothing;
                ctx.webkitImageSmoothingEnabled = originalSmoothing;
                ctx.msImageSmoothingEnabled = originalSmoothing;
            }
            return false;
        }
    }
    serializar() {
        return {
            tipo: 'SpriteComponent',
            // Removido wrapper 'config' extra - Entidade.js já cria um wrapper
            assetId: this.assetId,
            larguraFrame: this.larguraFrame,
            alturaFrame: this.alturaFrame,
            animacoes: this.animacoes,
            animacaoAtual: this.animacaoAtual,
            indiceFrame: this.indiceFrame,
            inverterX: this.inverterX,
            inverterY: this.inverterY,
            scaleX: this.scaleX,
            scaleY: this.scaleY,
            offsetX: this.offsetX,
            offsetY: this.offsetY,
            autoplayAnim: this.autoplayAnim,
            tiled: this.tiled
        };
    }

    desserializar(dados) {
        // Robustez: aceita dados planos (novo padrão) ou wrapped em config (legacy/double-wrapped)
        const cfg = dados.config || dados;

        this.larguraFrame = cfg.larguraFrame || 32;
        this.alturaFrame = cfg.alturaFrame || 32;
        this.animacoes = cfg.animacoes || {};
        this.animacaoAtual = cfg.animacaoAtual || null;
        this.indiceFrame = cfg.indiceFrame || 0;
        this.inverterX = !!cfg.inverterX;
        this.inverterY = !!cfg.inverterY;
        this.scaleX = cfg.scaleX !== undefined ? cfg.scaleX : 1.0;
        this.scaleY = cfg.scaleY !== undefined ? cfg.scaleY : 1.0;
        this.offsetX = cfg.offsetX || 0;
        this.offsetY = cfg.offsetY || 0;
        this.offsetY = cfg.offsetY || 0;
        this.autoplayAnim = cfg.autoplayAnim || '';
        this.tiled = !!cfg.tiled;

        // Set assetId last to trigger load
        if (cfg.assetId) {
            this.assetId = cfg.assetId;
        }
    }
}

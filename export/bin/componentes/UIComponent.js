/**
 * UIComponent.js
 * Sistema flexível para renderizar interfaces (HUDs e Barras Flutuantes)
 */
export default class UIComponent {
    constructor() {
        this.tipo = 'UIComponent';
        this.nome = 'Interface de Usuário';
        this.ativo = true;

        // Modo de Renderização:
        // 'world' = Flutua junto com a entidade (ex: barra de vida do inimigo)
        // 'screen' = Fixo na tela (ex: HUD do player)
        this.renderMode = 'world';

        // Lista de elementos de UI
        // Cada elemento pode ser: 'barra', 'icones' (corações), 'imagem', 'texto'
        this.elementos = [];

        // Se true, busca os dados (hp, mana) na entidade com tag 'player' em vez da entidade dona deste componente
        this.usarPlayerGlobal = false;

        /* Exemplo de estrutura de um elemento:
        {
            id: 'hp_bar',
            tipo: 'barra', // ou 'icones'
            alvo: 'hp', // Variável para monitorar (hp, mana, xp)
            alvoMax: 'hpMax',
            
            // Posicionamento
            offsetX: 0,
            offsetY: -50,
            largura: 50,
            altura: 8,
            
            // Estilo Barra
            corFundo: '#333333',
            corPreenchimento: '#e74c3c', // Vermelho
            
            // Estilo Ícones (Corações)
            imagemCheia: 'asset_id_coracao_cheio',
            imagemVazia: 'asset_id_coracao_vazio',
            tamanhoIcone: 16,
            espacamento: 2
        }
        */
    }

    inicializar(entidade) {
        this.entidade = entidade;
    }

    /**
     * Tenta encontrar o valor atual (HP, Mana)
     */
    obterValor(nomeProp) {
        let alvo = this.entidade;

        // Se configurado para usar Player Global, tenta achar a entidade Player na cena
        // Se configurado para usar Player Global, tenta achar a entidade Player na cena
        if (this.usarPlayerGlobal && this.entidade.engine) {
            // Busca robusta: Tag 'player' ou Nome 'Player' (case-insensitive)
            const player = this.entidade.engine.entidades.find(e =>
                (e.tags && e.tags.some(t => t.toLowerCase() === 'player')) ||
                (e.nome && e.nome.toLowerCase() === 'player')
            );

            if (player) {
                alvo = player;
            } else {
                // DEBUG: Se não achar player no editor, e for HUD global, avisa ou usa mock?
                // Melhor retornar 0 silenciosamente para não spammar, mas no editor visual usamos mock.
            }
        }

        if (!alvo) return 0;

        // 1. Procura direto na entidade (ex: entidade.hp)
        if (alvo[nomeProp] !== undefined) return alvo[nomeProp];

        // 2. Procura nos componentes de script
        for (const comp of alvo.componentes.values()) {
            if (comp.tipo === 'ScriptComponent' && comp.instance) {
                if (comp.instance[nomeProp] !== undefined) return comp.instance[nomeProp];
                if (comp.instance.stats && comp.instance.stats[nomeProp] !== undefined) return comp.instance.stats[nomeProp];
            }
        }
        return 0;
    }

    renderizar(renderizador) {
        if (!this.ativo || !this.entidade) return;

        // Extrair o contexto nativo do wrapper
        const ctx = renderizador.ctx || renderizador; // Fallback se já for o ctx

        // Se for 'screen', precisamos isolar o contexto completamente
        if (this.renderMode === 'screen') {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }

        try {
            this.elementos.forEach(el => {
                // 🎨 OVERLAY FULLSCREEN (Renderiza antes de tudo)
                if (el.tipo === 'overlay' && this.renderMode === 'screen') {
                    ctx.fillStyle = el.cor || 'rgba(0, 0, 0, 0.7)';
                    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                    return; // Não precisa calcular posições para overlay
                }

                let x, y;

                if (this.renderMode === 'screen') {
                    // Screen Space: Posição absoluta na tela
                    x = (el.offsetX || 0);
                    y = (el.offsetY || 0);
                } else {
                    // World Space: Relativo à entidade
                    x = this.entidade.x + (el.offsetX || 0);
                    y = this.entidade.y + (el.offsetY || 0);
                }

                // Valores
                let valorAtual = 1;
                let valorMax = 1;

                if (el.tipo === 'barra' || el.tipo === 'icones' || el.tipo === 'texto') {
                    // Tenta obter valores dinâmicos
                    if (!el.alvo && !el.alvoMax) {
                        // Sem binding configurado: Mock 75%
                        valorAtual = 75; valorMax = 100;
                    } else {
                        valorAtual = this.obterValor(el.alvo || 'hp');
                        valorMax = this.obterValor(el.alvoMax || 'hpMax');

                        // Fallback se max inválido para evitar divisão por zero
                        if (!valorMax || valorMax <= 0) valorMax = 1;

                        // UX MELHORIA: No editor (jogo parado), se os valores forem zero (ex: XP não iniciado),
                        // força um preview visual de 50% para o usuário ver a barra.
                        const isEditor = (!this.entidade.engine || !this.entidade.engine.simulado);
                        if (isEditor && valorAtual <= 0) {
                            valorAtual = valorMax * 0.5; // Mock 50%
                        }
                    }
                }

                // Cálculo seguro da porcentagem (clamp 0..1)
                let porcentagem = 0;
                if (valorMax > 0) {
                    porcentagem = Math.min(1, Math.max(0, valorAtual / valorMax));
                }

                // Renderiza
                if (el.tipo === 'barra') {
                    this.desenharBarra(ctx, el, x, y, porcentagem, valorAtual, valorMax);
                } else if (el.tipo === 'icones') {
                    this.desenharIcones(ctx, el, x, y, valorAtual, valorMax);
                } else if (el.tipo === 'imagem') {
                    // Imagens não precisam de binding de valores
                    this.desenharImagem(ctx, renderizador, el, x, y, porcentagem);
                } else if (el.tipo === 'texto') {
                    this.desenharTexto(ctx, el, x, y, valorAtual, valorMax);
                } else if (el.tipo === 'inventario') {
                    this.desenharInventario(ctx, renderizador, el, x, y);
                }

                // DEBUG EDITOR: Desenhar borda se estiver selecionado para facilitar identificação
                if (this.entidade.selecionada) {
                    ctx.strokeStyle = this.renderMode === 'screen' ? '#ffff00' : '#00ffff';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, el.largura || 20, el.altura || 20);
                }
            });
        } catch (e) {
            console.error("Erro render UI", e);
        } finally {
            // Restaurar contexto (sempre, pois salvamos no inicio)
            ctx.restore();
        }

        return true; // Sinaliza que desenhou algo para impedir o quadrado rosa de debug
    }

    desenharBarra(ctx, el, x, y, pct, val, max) {
        // Fallback para raio
        const raio = el.borderRadius || 0;
        const borderW = el.borderWidth || 0;
        const borderC = el.borderColor || '#000';

        // 1. Caminho de Recorte (Clip Path) para o Fundo + Borda
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, el.largura, el.altura, raio);
        } else {
            ctx.rect(x, y, el.largura, el.altura);
        }

        // 2. Fundo
        ctx.fillStyle = el.corFundo || '#000';
        ctx.fill();

        // 3. Preenchimento (com Clip para respeitar o raio)
        ctx.save();
        ctx.clip(); // Restringe desenho à área da barra (arredondada)

        ctx.fillStyle = el.corPreenchimento || '#f00';
        // Desenha o retangulo de progresso (sem arredondamento extra pois o clip já faz isso)
        ctx.fillRect(x, y, el.largura * pct, el.altura);

        ctx.restore();

        // 4. Borda (Stroke) por cima de tudo
        if (borderW > 0) {
            ctx.lineWidth = borderW;
            ctx.strokeStyle = borderC;
            ctx.stroke();
        }
    }

    desenharImagem(ctx, renderizador, el, x, y, porcentagem) {
        if (!el.assetId) return;

        // Tenta obter o asset do gerenciador
        // renderizador -> engine -> assetManager
        const assetManager = (renderizador.engine && renderizador.engine.assetManager) ? renderizador.engine.assetManager : renderizador.assetManager;
        if (assetManager) {
            const asset = assetManager.obterAsset(el.assetId);
            if (asset && asset.imagem) {
                const img = asset.imagem;
                const scale = el.scale || 1.0;
                const largura = (el.largura || img.width) * scale;
                const altura = (el.altura || img.height) * scale;

                // Se tiver binding de valores (alvo/alvoMax), usa como barra de progresso
                if (el.alvo && el.alvoMax && porcentagem !== undefined) {
                    // Desenha apenas a porcentagem da imagem (clip horizontal)
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(x, y, largura * porcentagem, altura);
                    ctx.clip();
                    ctx.drawImage(img, x, y, largura, altura);
                    ctx.restore();
                } else {
                    // Desenha a imagem completa
                    ctx.drawImage(img, x, y, largura, altura);
                }
            }
        }
    }

    desenharTexto(ctx, el, x, y, val, max) {
        ctx.font = `${el.tamanhoFonte || 12}px ${el.familiaFonte || 'monospace'}`;
        ctx.textAlign = el.alinhamento || 'left';

        // Sombra
        if (el.shadowBlur > 0) {
            ctx.shadowColor = el.shadowColor || '#000';
            ctx.shadowBlur = el.shadowBlur;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }

        const textoFinal = this._processarTexto(el, val, max); // Helper extraction if needed, or inline logic

        // Borda (Stroke) antes do Fill
        if (el.strokeWidth > 0) {
            ctx.lineWidth = el.strokeWidth;
            ctx.strokeStyle = el.strokeColor || '#000';
            ctx.strokeText(textoFinal, x, y);
        }

        // Fill
        ctx.fillStyle = el.corTexto || '#fff';
        ctx.fillText(textoFinal, x, y);

        // Reset Sombra
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }

    _processarTexto(el, val, max) {
        // Lógica original de texto sem o desenho
        let texto = el.textoFixo || '';
        if (val !== undefined) {
            // Formatação com Zero Pad (Ex: {val:00} -> 01, 05, 10)
            if (texto.includes('{val:00}')) {
                texto = texto.replace('{val:00}', String(Math.floor(val)).padStart(2, '0'));
            }

            texto = texto.replace('{val}', Math.floor(val));
            texto = texto.replace('{max}', Math.floor(max || 0));
            texto = texto.replace('{pct}', Math.floor((val / (max || 1)) * 100) + '%');
        }
        return texto;
    }

    // Antigo desenharTexto para referência de substituição completa (vou reescrever o método inteiro para ser mais limpo)
    desenharTexto_OLD(ctx, el, x, y, val, max) {

        let texto = el.textoFixo || '';

        // Substituição de variáveis: {val} {max} {pct}
        if (texto.includes('{val}')) texto = texto.replace('{val}', Math.floor(val));
        if (texto.includes('{max}')) texto = texto.replace('{max}', Math.floor(max));
        if (texto.includes('{pct}')) texto = texto.replace('{pct}', Math.floor((val / max) * 100));

        ctx.fillText(texto, x, y);
    }

    desenharIcones(ctx, el, x, y, valor, max) {
        // Implementação futura para corações/ícones
        // Requereria acesso ao AssetManager para desenhar imagens
        // Por enquanto desenha bolinhas como fallback

        const raio = el.altura / 2;
        const qtd = Math.ceil(max / (el.valorPorIcone || 10)); // Ex: 100 HP, 10 por coração = 10 corações
        const cheios = Math.ceil(valor / (el.valorPorIcone || 10));

        for (let i = 0; i < qtd; i++) {
            ctx.beginPath();
            ctx.arc(x + (i * (el.altura + 2)) + raio, y + raio, raio, 0, Math.PI * 2);
            ctx.fillStyle = (i < cheios) ? (el.corPreenchimento || '#f00') : (el.corFundo || '#333');
            ctx.fill();
        }
    }

    _getImgHelper(assetManager, id) {
        if (!assetManager || !id) return null;
        const asset = assetManager.obterAsset(id);
        return asset ? asset.imagem : null;
    }

    desenharInventario(ctx, renderizador, el, x, y) {
        // Busca componente de inventário
        let inventario = null;

        // Se usar player global
        if (this.usarPlayerGlobal && this.entidade.engine) {
            const player = this.entidade.engine.entidades.find(e =>
                (e.tags && e.tags.some(t => t.toLowerCase() === 'player')) ||
                (e.nome && e.nome.toLowerCase() === 'player')
            );
            if (player) inventario = player.obterComponente('InventoryComponent');
        } else {
            inventario = this.entidade.obterComponente('InventoryComponent');
        }

        // Se tiver inventário, verifica se deve estar visível
        // No editor (jogo parado), mostra sempre para editar
        // No jogo (simulado), respeita o estado .aberto
        if (inventario) {
            const isEditor = (!this.entidade.engine || !this.entidade.engine.simulado);
            if (!isEditor && !inventario.aberto) return;
        }

        // Configurações Básicas
        const baseSlotSize = el.altura || 32;
        const baseSpacing = el.espacamento || 5;
        const slots = inventario ? inventario.slots : 20;
        const items = inventario ? inventario.items : [];

        // Configurações Avançadas
        const scale = this.inventoryScale || 1.0;
        const cols = this.inventoryCols || 5;
        const rows = this.inventoryRows || 4;

        const slotSize = baseSlotSize * scale;
        const spacing = baseSpacing * scale;
        const padding = spacing; // Padding interno da borda

        const assetManager = (renderizador.engine && renderizador.engine.assetManager) ? renderizador.engine.assetManager : renderizador.assetManager;

        // 1. Desenhar Moldura (9-Slice)
        const contentW = (cols * slotSize) + ((cols - 1) * spacing);
        const contentH = (rows * slotSize) + ((rows - 1) * spacing);
        const totalW = contentW + (padding * 2);
        const totalH = contentH + (padding * 2);

        if (this.borderTopLeft || this.borderTop) {
            const bSize = 16 * scale;
            const tl = this._getImgHelper(assetManager, this.borderTopLeft);
            const t = this._getImgHelper(assetManager, this.borderTop);
            const tr = this._getImgHelper(assetManager, this.borderTopRight);
            const l = this._getImgHelper(assetManager, this.borderLeft);
            const r = this._getImgHelper(assetManager, this.borderRight);
            const bl = this._getImgHelper(assetManager, this.borderBottomLeft);
            const b = this._getImgHelper(assetManager, this.borderBottom);
            const br = this._getImgHelper(assetManager, this.borderBottomRight);

            ctx.fillStyle = el.corFundo || 'rgba(0,0,0,0.8)';
            ctx.fillRect(x + bSize / 2, y + bSize / 2, totalW - bSize, totalH - bSize);

            if (tl) ctx.drawImage(tl, x - bSize, y - bSize, bSize, bSize);
            if (tr) ctx.drawImage(tr, x + totalW, y - bSize, bSize, bSize);
            if (bl) ctx.drawImage(bl, x - bSize, y + totalH, bSize, bSize);
            if (br) ctx.drawImage(br, x + totalW, y + totalH, bSize, bSize);

            if (t) ctx.drawImage(t, x, y - bSize, totalW, bSize);
            if (b) ctx.drawImage(b, x, y + totalH, totalW, bSize);
            if (l) ctx.drawImage(l, x - bSize, y, bSize, totalH);
            if (r) ctx.drawImage(r, x + totalW, y, bSize, totalH);
        } else {
            if (el.corFundo) {
                ctx.fillStyle = el.corFundo;
                ctx.fillRect(x - padding, y - padding, totalW, totalH);
            }
        }

        // Desenhar slots
        for (let i = 0; i < slots; i++) {
            if (i >= cols * rows) break;

            const col = i % cols;
            const row = Math.floor(i / cols);

            const slotX = x + (col * (slotSize + spacing));
            const slotY = y + (row * (slotSize + spacing));

            // Fundo do Slot (Imagem ou Retângulo)
            let desenhouImagem = false;

            // 1. Imagem Base (Slot Vazio)
            // Prioridade: Elemento -> Componente (Global)
            const imgSlotId = el.imagemSlot || this.imagemSlot;
            // console.log('[UI Debug] Slot', i, 'ImgID:', imgSlotId); // DEBUG

            if (imgSlotId) {
                const imgSlot = this._getImgHelper(assetManager, imgSlotId);

                if (imgSlot) {
                    try {
                        ctx.drawImage(imgSlot, slotX, slotY, slotSize, slotSize);
                        desenhouImagem = true;
                    } catch (e) {
                        // Fallback silencioso
                    }
                }
            }

            // 2. Imagem Cheio (Se tiver item) - Opcional, desenha por cima
            const temItem = inventario && items[i];
            const imgCheioId = el.imagemSlotCheio || this.imagemSlotCheio;

            if (temItem && imgCheioId) {
                const imgCheio = this._getImgHelper(assetManager, imgCheioId);

                if (imgCheio) {
                    try {
                        ctx.drawImage(imgCheio, slotX, slotY, slotSize, slotSize);
                        desenhouImagem = true;
                    } catch (e) {
                        // Silencioso
                    }
                }
            }

            if (!desenhouImagem) {
                ctx.fillStyle = el.corFundo || 'rgba(0,0,0,0.5)';
                ctx.strokeStyle = el.corBorda || '#666';
                ctx.lineWidth = 1;

                ctx.fillRect(slotX, slotY, slotSize, slotSize);
                ctx.strokeRect(slotX, slotY, slotSize, slotSize);
            }

            // Item (se houver)
            // Se inventário for mock (ou seja, null), podemos desenhar um placeholder no editor se quiser
            // Item (se houver)
            // Se inventário for mock (ou seja, null), podemos desenhar um placeholder no editor se quiser
            if (inventario && items[i]) {
                const item = items[i];
                let desenhouIcone = false;

                // 1. Tentar desenhar Ícone Customizado ou pelo ID
                const iconToUse = item.icon || item.id;

                // DEBUG INVENTORY ICON


                if (iconToUse) {
                    const imgIcon = this._getImgHelper(assetManager, iconToUse);
                    if (imgIcon) {
                        try {
                            // Desenha centralizado, um pouco menor que o slot (80%?)
                            const iconSize = slotSize * 0.8;
                            const offset = (slotSize - iconSize) / 2;
                            ctx.drawImage(imgIcon, slotX + offset, slotY + offset, iconSize, iconSize);
                            desenhouIcone = true;
                        } catch (e) {
                            // Erro ao desenhar
                        }
                    }
                }

                // 2. Fallback: Bolinha Colorida
                if (!desenhouIcone) {
                    ctx.fillStyle = item.cor || el.corPreenchimento || '#ffd700'; // Dourado default
                    ctx.beginPath();
                    ctx.arc(slotX + slotSize / 2, slotY + slotSize / 2, slotSize / 3, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Quantidade
                if (item.qtd > 1) {
                    ctx.fillStyle = '#fff';
                    ctx.font = `${10 * scale}px monospace`;
                    ctx.textAlign = 'right';
                    ctx.fillText(item.qtd, slotX + slotSize - (2 * scale), slotY + slotSize - (2 * scale));
                }
            } else if (!inventario && this.entidade.selecionada) {
                // Mock editor visual
                ctx.fillStyle = '#333';
                ctx.textAlign = 'center';
                ctx.fillText(i + 1, slotX + slotSize / 2, slotY + slotSize / 2 + (4 * scale));
            }
        }
    }

    serializar() {
        return {
            tipo: 'UIComponent',
            renderMode: this.renderMode,
            usarPlayerGlobal: this.usarPlayerGlobal,
            imagemSlot: this.imagemSlot,
            imagemSlotCheio: this.imagemSlotCheio,
            // Advanced Inventory
            inventoryScale: this.inventoryScale || 1.0,
            inventoryCols: this.inventoryCols || 5, // Agora Colunas (antes fixo 5)
            inventoryRows: this.inventoryRows || 4, // Linhas
            // 8 Bordas
            borderTopLeft: this.borderTopLeft,
            borderTop: this.borderTop,
            borderTopRight: this.borderTopRight,
            borderLeft: this.borderLeft,
            borderRight: this.borderRight,
            borderBottomLeft: this.borderBottomLeft,
            borderBottom: this.borderBottom,
            borderBottomRight: this.borderBottomRight,
            elementos: this.elementos
        };
    }

    desserializar(dados) {
        this.renderMode = dados.renderMode || 'world';
        this.usarPlayerGlobal = dados.usarPlayerGlobal || false;
        this.imagemSlot = dados.imagemSlot || null;
        this.imagemSlotCheio = dados.imagemSlotCheio || null;

        // Advanced Inventory
        this.inventoryScale = dados.inventoryScale !== undefined ? dados.inventoryScale : 1.0;
        this.inventoryCols = dados.inventoryCols || 5;
        this.inventoryRows = dados.inventoryRows || 4;

        this.borderTopLeft = dados.borderTopLeft || null;
        this.borderTop = dados.borderTop || null;
        this.borderTopRight = dados.borderTopRight || null;
        this.borderLeft = dados.borderLeft || null;
        this.borderRight = dados.borderRight || null;
        this.borderBottomLeft = dados.borderBottomLeft || null;
        this.borderBottom = dados.borderBottom || null;
        this.borderBottomRight = dados.borderBottomRight || null;

        this.elementos = dados.elementos || [];
    }
}

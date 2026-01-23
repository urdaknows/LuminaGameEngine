
export default class DialogueComponent {
    constructor() {
        this.tipo = 'DialogueComponent';
        this.nome = 'Dialogue System';

        // Dados
        this.dialogos = []; // { id, speaker, text }
        this.ativo = false;
        this.indiceAtual = 0;

        // Estilo
        this.corFundo = '#000000';
        this.corTexto = '#ffffff';
        this.opacidadeFundo = 0.8;
    }

    inicializar(entidade) {
        this.entidade = entidade;
    }

    adicionarDialogo(speaker, text) {
        this.dialogos.push({
            id: Date.now() + Math.random(),
            speaker: speaker || 'System',
            text: text || '...'
        });
    }

    removerDialogo(index) {
        if (index >= 0 && index < this.dialogos.length) {
            this.dialogos.splice(index, 1);
        }
    }

    // Permite que o loop principal da Engine desenhe este componente
    renderizar(renderizador) {
        this.draw(renderizador.ctx, renderizador.camera, renderizador.assetManager);
    }

    iniciar() {
        if (this.dialogos.length > 0) {
            this.ativo = true;
            this.indiceAtual = 0;

            // Input Handling (Melhorado)
            if (!this._inputHandler) {
                this._inputHandler = (e) => {
                    if (!this.ativo) return;

                    // Evita avançar múltiplas vezes se segurar a tecla
                    if (e.repeat) return;

                    // Aceita Espaço, Enter ou Clique do Mouse
                    if (e.type === 'keydown') {
                        if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            this.proximo();
                        }
                    } else if (e.type === 'mousedown') {
                        this.proximo();
                    }
                };
                window.addEventListener('keydown', this._inputHandler);
                window.addEventListener('mousedown', this._inputHandler);
            }
        }
    }

    proximo() {
        if (this.ativo) {
            this.indiceAtual++;
            if (this.indiceAtual >= this.dialogos.length) {
                this.ativo = false;
                this.indiceAtual = 0;
                // Cleanup listener
                if (this._inputHandler) {
                    window.removeEventListener('keydown', this._inputHandler);
                    window.removeEventListener('mousedown', this._inputHandler);
                    this._inputHandler = null;
                }
            }
        }
    }

    atualizar(entidade, dt) {
        // Lógica de tempo se quisermos auto-advance
    }

    // Renderiza a caixa de diálogo na tela (UI Overlay)
    draw(ctx, camera, assetManager) {
        if (!this.ativo) return;

        const dialogo = this.dialogos[this.indiceAtual];
        if (!dialogo) return;

        // Desenhar em Screen Space (sem considerar camera)
        // Precisamos garantir que o contexto não esteja transformado pela camera
        // A engine geralmente chama draw dentro do escopo da camera.
        // Vamos salvar, resetar transform, desenhar e restaurar.

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset Transform to Screen Space

        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        // Caixa de Diálogo (Bottom)
        const boxH = 150;
        const boxY = h - boxH - 20;
        const boxX = 50;
        const boxW = w - 100;

        ctx.globalAlpha = this.opacidadeFundo;
        ctx.fillStyle = this.corFundo;
        ctx.fillRect(boxX, boxY, boxW, boxH);

        // Borda
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // --- DESENHAR PORTRAIT (se configurado) ---
        let portraitSize = 0;
        let textStartX = boxX + 20;

        // Fallback: Se assetManager não foi passado, tenta obter da entidade
        if (!assetManager && this.entidade && this.entidade.engine) {
            assetManager = this.entidade.engine.assetManager;
        }

        if (dialogo.portrait && assetManager) {
            console.log('[DialogueComponent] Tentando carregar portrait:', dialogo.portrait);

            // Obter asset e verificar se tem imagem carregada
            const asset = assetManager.obterAsset(dialogo.portrait);
            console.log('[DialogueComponent] Asset obtido:', asset);

            if (asset && asset.imagem && asset.imagem.complete && asset.imagem.naturalWidth > 0) {
                portraitSize = 100; // Tamanho do quadrado do portrait
                const portraitX = boxX + 10;
                const portraitY = boxY + (boxH - portraitSize) / 2; // Centralizado verticalmente

                // Desenhar fundo do portrait (opcional)
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(portraitX, portraitY, portraitSize, portraitSize);

                // Desenhar imagem
                ctx.drawImage(asset.imagem, portraitX, portraitY, portraitSize, portraitSize);

                // Borda do portrait
                ctx.strokeStyle = '#4ecdc4';
                ctx.lineWidth = 2;
                ctx.strokeRect(portraitX, portraitY, portraitSize, portraitSize);

                // Ajustar onde o texto começa
                textStartX = portraitX + portraitSize + 15;
                console.log('[DialogueComponent] Portrait desenhado com sucesso!');
            } else {
                console.warn('[DialogueComponent] Imagem não disponível. Asset:', asset, 'Imagem:', asset?.imagem);
            }
        } else if (dialogo.portrait) {
            console.warn('[DialogueComponent] AssetManager não disponível!');
        }

        // Texto (ajustado se houver portrait)
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.corTexto;
        ctx.font = 'bold 20px monospace';
        ctx.fillText(dialogo.speaker, textStartX, boxY + 35);

        ctx.fillStyle = '#cccccc'; // Texto um pouco mais claro
        ctx.font = '18px monospace';

        // Quebra de linha simples (wrap) - ajustado para largura disponível
        const textMaxWidth = portraitSize > 0 ? boxW - portraitSize - 50 : boxW - 40;
        this.wrapText(ctx, dialogo.text, textStartX, boxY + 70, textMaxWidth, 24);

        // Indicador de "Next"
        if (Date.now() % 1000 < 500) {
            ctx.fillStyle = '#fff';
            ctx.fillText('▼', boxX + boxW - 30, boxY + boxH - 20);
        }

        ctx.restore();
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            }
            else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }

    clonar() {
        const novo = new DialogueComponent();
        novo.dialogos = JSON.parse(JSON.stringify(this.dialogos));
        novo.corFundo = this.corFundo;
        novo.corTexto = this.corTexto;
        return novo;
    }

    serializar() {
        return {
            tipo: this.tipo,
            dialogos: this.dialogos,
            // Flat config
            corFundo: this.corFundo,
            corTexto: this.corTexto,
            opacidadeFundo: this.opacidadeFundo
        };
    }

    desserializar(dados) {
        this.dialogos = dados.dialogos || [];

        // Robustez: aceita flat ou config-wrapped
        const cfg = dados.config || dados;
        this.corFundo = cfg.corFundo || '#000000';
        this.corTexto = cfg.corTexto || '#ffffff';
        this.opacidadeFundo = cfg.opacidadeFundo !== undefined ? cfg.opacidadeFundo : 0.8;
    }
}

export class TilePalette {
    constructor(editor) {
        this.editor = editor;
        this.assetManager = editor.assetManager;

        // Elementos UI
        this.window = document.getElementById('tile-palette-window');
        this.canvas = document.getElementById('canvas-tile-palette');
        this.ctx = this.canvas.getContext('2d');
        this.selectAsset = document.getElementById('select-tileset-asset');
        this.inputGridW = document.getElementById('palette-grid-w');
        this.inputGridH = document.getElementById('palette-grid-h');
        this.infoSpan = document.getElementById('selected-tile-info');

        // CheckBox Sólido
        this.checkSolid = document.getElementById('chk-tile-solid');
        if (!this.checkSolid) {
            const container = this.infoSpan ? this.infoSpan.parentElement : null;
            if (container) {
                const label = document.createElement('label');
                label.style.display = 'block';
                label.style.marginBottom = '6px';
                label.style.fontSize = '12px';
                label.style.color = '#ccc';
                label.style.cursor = 'pointer';
                label.innerHTML = '<input type="checkbox" id="chk-tile-solid" style="margin-right:5px;"> Sólido';
                container.appendChild(label);
                this.checkSolid = label.querySelector('input');
            }
        }

        // CheckBox Plataforma (One-Way)
        this.checkPlat = document.getElementById('chk-tile-plataforma');
        if (!this.checkPlat) {
            const container = this.infoSpan ? this.infoSpan.parentElement : null;
            if (container) {
                const label = document.createElement('label');
                label.style.display = 'block';
                label.style.marginBottom = '6px';
                label.style.fontSize = '12px';
                label.style.color = '#ccc';
                label.style.cursor = 'pointer';
                label.title = 'Permite pular de baixo para cima';
                label.innerHTML = '<input type="checkbox" id="chk-tile-plataforma" style="margin-right:5px;"> Plataforma';
                container.appendChild(label);
                this.checkPlat = label.querySelector('input');
            }
        }

        // CheckBox Wall (Paredes para Wall Slide)
        this.checkWall = document.getElementById('chk-tile-isWall');
        if (!this.checkWall) {
            const container = this.infoSpan ? this.infoSpan.parentElement : null;
            if (container) {
                const label = document.createElement('label');
                label.style.display = 'block';
                label.style.marginBottom = '6px';
                label.style.fontSize = '12px';
                label.style.color = '#ff7675'; // Vermelho claro
                label.style.cursor = 'pointer';
                label.title = 'Permite Wall Slide/Wall Jump';
                label.innerHTML = '<input type="checkbox" id="chk-tile-isWall" style="margin-right:5px;"> Parede';
                container.appendChild(label);
                this.checkWall = label.querySelector('input');
            }
        }

        // CheckBox Ground (Chão Seguro)
        this.checkGround = document.getElementById('chk-tile-isGround');
        if (!this.checkGround) {
            const container = this.infoSpan ? this.infoSpan.parentElement : null;
            if (container) {
                const label = document.createElement('label');
                label.style.display = 'block';
                label.style.marginBottom = '6px';
                label.style.fontSize = '12px';
                label.style.color = '#55efc4'; // Verde claro
                label.style.cursor = 'pointer';
                label.title = 'Chão firme (Sem slide)';
                label.innerHTML = '<input type="checkbox" id="chk-tile-isGround" style="margin-right:5px;"> Chão';
                container.appendChild(label);
                this.checkGround = label.querySelector('input');
            }
        }

        // CheckBox Ceiling (Teto)
        this.checkCeiling = document.getElementById('chk-tile-isCeiling');
        if (!this.checkCeiling) {
            const container = this.infoSpan ? this.infoSpan.parentElement : null;
            if (container) {
                const label = document.createElement('label');
                label.style.display = 'block';
                label.style.marginBottom = '6px';
                label.style.fontSize = '12px';
                label.style.color = '#a29bfe'; // Roxo claro
                label.style.cursor = 'pointer';
                label.title = 'Teto (Bloqueia movimento para cima)';
                label.innerHTML = '<input type="checkbox" id="chk-tile-isCeiling" style="margin-right:5px;"> Teto';
                container.appendChild(label);
                this.checkCeiling = label.querySelector('input');
            }
        }

        // Seletor de Camada (Target Layer)
        this.selectLayer = document.getElementById('tile-target-layer');
        if (!this.selectLayer) {
            const container = this.infoSpan ? this.infoSpan.parentElement : null;
            if (container) {
                const divLayer = document.createElement('div');
                divLayer.style.marginTop = '5px';
                divLayer.style.marginBottom = '5px';
                divLayer.style.paddingTop = '5px';
                divLayer.style.borderTop = '1px solid #444';

                const label = document.createElement('label');
                label.style.fontSize = '12px';
                label.style.color = '#ccc';
                label.innerText = 'Pintar em: ';

                const select = document.createElement('select');
                select.id = 'tile-target-layer';
                select.style.background = '#222';
                select.style.color = '#fff';
                select.style.border = '1px solid #4ecdc4'; // Destaque
                select.style.fontSize = '11px';
                select.style.width = '100%';

                divLayer.appendChild(label);
                divLayer.appendChild(select);
                container.appendChild(divLayer);
                this.selectLayer = select;

                // Sync: Quando mudar o dropdown, seleciona a entidade no editor
                this.selectLayer.addEventListener('change', (e) => {
                    const id = e.target.value;
                    if (id && this.editor) {
                        const ent = this.editor.entidades.find(e => e.id === id);
                        if (ent) {
                            this.editor.selecionarEntidade(ent);
                            console.log(`[TilePalette] Camada de pintura alterada para: ${ent.nome}`);
                        }
                    }
                });
            }
        }

        this.btnClose = document.getElementById('btn-close-palette');
        this.btnOpen = document.getElementById('btn-tile-palette');

        // Estado
        this.currentAsset = null;
        this.gridW = 32;
        this.gridH = 32;
        this.selectedTile = null; // { col, row, index }
        this.isSolid = false;
        this.isPlat = false;
        this.isWall = false;
        this.isGround = false;
        this.isCeiling = false;
        this.zoom = 1.0;

        // Armazenar último clique para Shift-Select
        this.lastClick = null;

        this.init();
    }

    init() {
        // Setup Checkbox Solid
        if (this.checkSolid) {
            this.checkSolid.checked = this.isSolid;
            this.checkSolid.addEventListener('change', () => {
                this.isSolid = this.checkSolid.checked;
                if (this.selectedTile) {
                    this.selectedTile.solid = this.isSolid;
                    this.desenhar();
                    this.editor.ativarFerramentaBrush(this.selectedTile);
                }
            });
        }

        // Setup Checkbox Plataforma
        if (this.checkPlat) {
            this.checkPlat.checked = this.isPlat;
            this.checkPlat.addEventListener('change', () => {
                this.isPlat = this.checkPlat.checked;
                if (this.selectedTile) {
                    this.selectedTile.plataforma = this.isPlat;
                    this.editor.ativarFerramentaBrush(this.selectedTile);
                }
            });
        }

        // Setup Checkbox Wall
        if (this.checkWall) {
            this.checkWall.checked = this.isWall;
            this.checkWall.addEventListener('change', () => {
                this.isWall = this.checkWall.checked;
                if (this.selectedTile) {
                    this.selectedTile.wall = this.isWall;
                    this.editor.ativarFerramentaBrush(this.selectedTile);
                }
            });
        }

        // Setup Checkbox Ground
        if (this.checkGround) {
            this.checkGround.checked = this.isGround;
            this.checkGround.addEventListener('change', () => {
                this.isGround = this.checkGround.checked;
                if (this.selectedTile) {
                    this.selectedTile.ground = this.isGround;
                    this.editor.ativarFerramentaBrush(this.selectedTile);
                }
            });
        }

        // Setup Checkbox Ceiling
        if (this.checkCeiling) {
            this.checkCeiling.checked = this.isCeiling;
            this.checkCeiling.addEventListener('change', () => {
                this.isCeiling = this.checkCeiling.checked;
                if (this.selectedTile) {
                    this.selectedTile.ceiling = this.isCeiling;
                    this.editor.ativarFerramentaBrush(this.selectedTile);
                }
            });
        }

        // Setup Grid Inputs
        this.inputGridW.addEventListener('change', () => {
            this.gridW = parseInt(this.inputGridW.value) || 32;
            this.desenhar();
        });
        this.inputGridH.addEventListener('change', () => {
            this.gridH = parseInt(this.inputGridH.value) || 32;
            this.desenhar();
        });

        // Setup Asset Select
        this.selectAsset.addEventListener('change', () => {
            this.carregarAssetSelecionado();
        });

        // Setup Canvas Click
        this.canvas.addEventListener('mousedown', (e) => {
            this.selecionarTile(e);
        });

        // Abrir/Fechar Janela
        // NOTA: Listeners gerenciados pelo EditorPrincipal (linha ~356)
        // Se adicionar aqui, causa conflito!
        /*
        if (this.btnOpen) {
            this.btnOpen.addEventListener('click', () => this.toggle());
        }
        if (this.btnClose) {
            this.btnClose.addEventListener('click', () => this.toggle());
        }
        */


        // Setup Drag da Janela (Cabeçalho)
        const header = this.window.querySelector('.window-header');
        if (header) this.setupDragWindow(header);

        const btnPencil = document.getElementById('btn-tool-pencil');
        const btnEraser = document.getElementById('btn-tool-eraser');
        const btnSolid = document.getElementById('btn-tool-solid');

        if (btnPencil) {
            btnPencil.onclick = () => {
                if (this.selectedTile) {
                    this.editor.ativarFerramentaBrush(this.selectedTile);
                    this.updateToolUI('pencil');
                } else {
                    alert('Selecione um tile primeiro!');
                }
            };
        }

        if (btnEraser) {
            btnEraser.onclick = () => {
                this.editor.ativarFerramentaBrush(null);
                this.updateToolUI('eraser');
            };
        }

        if (btnSolid) {
            btnSolid.onclick = () => {
                this.editor.ativarFerramentaBrush({ tool: 'solidifier' });
                this.updateToolUI('solid');
            };
        }

        // Setup Zoom (Wheel)
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = -Math.sign(e.deltaY);
            const zoomSpeed = 0.1;
            this.zoom += delta * zoomSpeed;
            this.zoom = Math.max(0.2, Math.min(this.zoom, 5.0));
            this.desenhar();
        });

        // Setup Drag & Drop (Nativo HTML5)
        this.canvas.draggable = true;
        this.canvas.addEventListener('dragstart', (e) => {
            if (!this.selectedTile) {
                e.preventDefault();
                return;
            }
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'tile', ...this.selectedTile }));
        });
    }

    toggle() {
        this.window.classList.toggle('hidden');
        if (!this.window.classList.contains('hidden')) {
            this.atualizarListaAssets();
            this.atualizarListaCamadas();
        } else {
            if (this.editor) this.editor.definirFerramenta('selecionar');
        }
    }

    atualizarListaCamadas() {
        if (!this.selectLayer) return;
        const currentVal = this.selectLayer.value;
        this.selectLayer.innerHTML = '';
        const entities = (this.editor && this.editor.engine) ? this.editor.engine.entidades : [];
        const tilemaps = entities.filter(e => e.temComponente && e.temComponente('TilemapComponent'));

        if (tilemaps.length === 0) {
            const opt = document.createElement('option');
            opt.text = '(Nenhum Tilemap)';
            this.selectLayer.appendChild(opt);
            return;
        }

        tilemaps.forEach(ent => {
            const opt = document.createElement('option');
            opt.value = ent.id;
            opt.text = `${ent.nome} (ID: ${ent.id})`;
            this.selectLayer.appendChild(opt);
        });

        if (this.editor.entidadeSelecionada && this.editor.entidadeSelecionada.temComponente('TilemapComponent')) {
            this.selectLayer.value = this.editor.entidadeSelecionada.id;
        } else if (currentVal) {
            const exists = tilemaps.find(e => e.id == currentVal);
            if (exists) this.selectLayer.value = currentVal;
        }
    }

    atualizarListaAssets() {
        const currentVal = this.selectAsset.value;
        this.selectAsset.innerHTML = '<option value="">-- Selecione um Asset --</option>';
        const sprites = this.assetManager.listarSprites();
        sprites.forEach(asset => {
            const isTileset = !asset.categoria || asset.categoria === 'tileset';
            if (isTileset) {
                let hasSource = asset.source;
                if (!hasSource && asset.animacoes) {
                    for (const animName in asset.animacoes) {
                        if (asset.animacoes[animName].source) { hasSource = true; break; }
                    }
                }
                const option = document.createElement('option');
                option.value = asset.id;
                option.textContent = asset.nome + (hasSource ? '' : ' (Sem Imagem)');
                this.selectAsset.appendChild(option);
            }
        });
        if (currentVal) this.selectAsset.value = currentVal;
    }

    carregarAssetSelecionado() {
        const id = this.selectAsset.value;
        if (!id) {
            this.currentAsset = null;
            this.desenhar();
            return;
        }

        const asset = this.editor.assetManager.obterAsset(id);
        if (asset) {
            this.currentAsset = asset;
            let imageSource = asset.source;
            if (!imageSource && asset.animacoes) {
                if (asset.animacoes['idle'] && asset.animacoes['idle'].source) {
                    imageSource = asset.animacoes['idle'].source;
                } else {
                    const firstAnim = Object.values(asset.animacoes).find(a => a.source);
                    if (firstAnim) imageSource = firstAnim.source;
                }
            }

            if (imageSource) {
                const img = new Image();
                img.onload = () => {
                    this.currentAsset.elemento = img;
                    this.canvas.width = img.width;
                    this.canvas.height = img.height;
                    this.desenhar();
                };
                img.src = imageSource;
            } else {
                this.currentAsset.elemento = null;
                this.desenhar();
            }
        }
    }

    desenhar() {
        if (!this.currentAsset || !this.currentAsset.elemento) {
            this.canvas.width = 300;
            this.canvas.height = 200;
            this.ctx.fillStyle = '#111';
            this.ctx.fillRect(0, 0, 300, 200);
            this.ctx.fillStyle = '#555';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(this.currentAsset ? 'Asset carregado sem img' : 'Nenhuma imagem selecionada', 10, 20);
            return;
        }

        this.canvas.width = this.currentAsset.elemento.width * this.zoom;
        this.canvas.height = this.currentAsset.elemento.height * this.zoom;

        this.ctx.imageSmoothingEnabled = false;
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.currentAsset.elemento.width, this.currentAsset.elemento.height);
        this.ctx.drawImage(this.currentAsset.elemento, 0, 0);

        // Grid
        this.ctx.strokeStyle = 'rgba(78, 205, 196, 0.3)';
        this.ctx.lineWidth = 1;
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.beginPath();
        for (let x = 0; x <= w; x += this.gridW) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, h);
        }
        for (let y = 0; y <= h; y += this.gridH) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(w, y);
        }
        this.ctx.stroke();

        // Seleção
        if (this.selectedTile) {
            this.ctx.strokeStyle = this.selectedTile.solid ? '#ff3333' : '#ffff00';
            this.ctx.lineWidth = 2;

            // Desenhar retângulo de seleção
            // Se for Big Brush, seleciona w/h
            const width = this.selectedTile.w || this.gridW;
            const height = this.selectedTile.h || this.gridH;

            this.ctx.strokeRect(
                this.selectedTile.x, // Já está em coordenadas de imagem (unscaled)
                this.selectedTile.y,
                width,
                height
            );
        }
    }

    selecionarTile(e) {
        if (!this.currentAsset) return;

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const x = mouseX / this.zoom;
        const y = mouseY / this.zoom;

        const col = Math.floor(x / this.gridW);
        const row = Math.floor(y / this.gridH);

        const maxCols = Math.floor(this.currentAsset.elemento.width / this.gridW);
        const maxRows = Math.floor(this.currentAsset.elemento.height / this.gridH);

        if (col >= 0 && col < maxCols && row >= 0 && row < maxRows) {

            // Shift-Click (Selecionar Área)
            if (e.shiftKey && this.lastClick) {
                const startCol = this.lastClick.col;
                const startRow = this.lastClick.row;

                const minCol = Math.min(startCol, col);
                const minRow = Math.min(startRow, row);
                const maxColSelect = Math.max(startCol, col);
                const maxRowSelect = Math.max(startRow, row);

                const cols = maxColSelect - minCol + 1;
                const rows = maxRowSelect - minRow + 1;

                this.selectedTile = {
                    col: minCol,
                    row: minRow,
                    x: minCol * this.gridW,
                    y: minRow * this.gridH,
                    w: cols * this.gridW,
                    h: rows * this.gridH,
                    cols: cols,
                    rows: rows,
                    assetId: this.currentAsset.id,
                    sheetWidth: this.currentAsset.elemento.width,
                    solid: this.isSolid,
                    sheetWidth: this.currentAsset.elemento.width,
                    solid: this.isSolid,
                    plataforma: this.isPlat,
                    wall: this.isWall,
                    ground: this.isGround
                };

                console.log(`[TilePalette] Big Brush: ${cols}x${rows}`);
            } else {
                // Click Simples
                this.lastClick = { col, row };

                this.selectedTile = {
                    col: col,
                    row: row,
                    x: col * this.gridW,
                    y: row * this.gridH,
                    w: this.gridW,
                    h: this.gridH,
                    assetId: this.currentAsset.id,
                    sheetWidth: this.currentAsset.elemento.width,
                    solid: this.isSolid,
                    plataforma: this.isPlat,
                    wall: this.isWall,
                    ground: this.isGround,
                    ceiling: this.isCeiling
                };
            }

            if (this.infoSpan) this.infoSpan.textContent = `X: ${this.selectedTile.col}, Y: ${this.selectedTile.row}`;
            this.desenhar();

            this.editor.ativarFerramentaBrush(this.selectedTile);
            this.updateToolUI('pencil');
        }
    }

    updateToolUI(tool) {
        const btnPencil = document.getElementById('btn-tool-pencil');
        const btnEraser = document.getElementById('btn-tool-eraser');

        if (btnPencil) {
            btnPencil.style.border = (tool === 'pencil') ? '1px solid #4ecdc4' : '1px solid #444';
            btnPencil.style.color = (tool === 'pencil') ? '#4ecdc4' : 'white';
        }
        if (btnEraser) {
            btnEraser.style.border = (tool === 'eraser') ? '1px solid #4ecdc4' : '1px solid #444';
            btnEraser.style.color = (tool === 'eraser') ? '#4ecdc4' : 'white';
        }
    }

    setupDragWindow(handle) {
        let isDragging = false;
        let startX, startY;
        let initialLeft, initialTop;

        handle.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = this.window.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            this.window.style.left = `${initialLeft + deltaX}px`;
            this.window.style.top = `${initialTop + deltaY}px`;
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }
}

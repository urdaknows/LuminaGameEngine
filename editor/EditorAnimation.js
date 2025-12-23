import { SpriteComponent } from '../componentes/SpriteComponent.js';

export class EditorAnimation {
    constructor(editor) {
        this.editor = editor;
        this.assetId = null;
        this.spriteTemp = new SpriteComponent();

        // UI Elements (IDs will be created in index.html)
        this.modal = document.getElementById('modal-animation-editor');
        this.canvasEditor = document.getElementById('canvas-anim-editor'); // Canvas to select frames
        this.ctxEditor = this.canvasEditor.getContext('2d');

        this.canvasPreview = document.getElementById('canvas-final-preview'); // Preview playback
        this.ctxPreview = this.canvasPreview.getContext('2d');

        // Playback State
        this.animacaoSelecionada = null;
        this.nomeAnimacaoSelecionada = '';
        this.previewInterval = null;
        this.previewFrameIndex = 0;
        this.zoom = 1.0;

        // Cache
        this.animImgCache = {};

        this.configurarEventos();
    }

    abrir(assetId) {
        this.assetId = assetId;
        this.modal.classList.remove('hidden');

        const asset = this.editor.assetManager.obterAsset(assetId);
        if (!asset) {
            this.fechar();
            return;
        }

        // Reset
        this.zoom = 1.0;
        this.animImgCache = {};

        // Load data
        this.spriteTemp = new SpriteComponent();
        if (asset.source) this.spriteTemp.setSource(asset.source);
        this.spriteTemp.larguraFrame = asset.larguraFrame || 32;
        this.spriteTemp.alturaFrame = asset.alturaFrame || 32;

        // Atualizar inputs da UI se existirem
        const inpW = document.getElementById('inp-frame-w');
        const inpH = document.getElementById('inp-frame-h');
        if (inpW) inpW.value = this.spriteTemp.larguraFrame;
        if (inpH) inpH.value = this.spriteTemp.alturaFrame;
        this.spriteTemp.animacoes = asset.animacoes ? JSON.parse(JSON.stringify(asset.animacoes)) : {};

        // CORRECTION: Sanitize corrupted data (Arrays instead of Objects)
        // This fixes the issue where previous bugs left animations as "[]" which causes JSON.stringify to lose data
        Object.keys(this.spriteTemp.animacoes).forEach(key => {
            const anim = this.spriteTemp.animacoes[key];
            if (Array.isArray(anim)) {
                console.warn(`[EditorAnimation] Corrigindo animação corrompida (Array detectado): ${key}`);
                this.spriteTemp.animacoes[key] = {
                    frames: [], // Lost data unfortunately, but structure restored
                    speed: 5,
                    loop: true,
                    source: null
                };
            } else if (!anim.frames) {
                // Ensure 'frames' property exists
                anim.frames = [];
            }
        });

        console.log(`[EditorAnimation] Abrindo asset ${assetId}. Anims encontradas:`, Object.keys(this.spriteTemp.animacoes));


        // Default anims - REMOVED per user request
        // if (!this.spriteTemp.animacoes['idle']) {
        //     this.spriteTemp.animacoes['idle'] = { frames: [], speed: 5, loop: true };
        // }

        this.atualizarListaAnimacoes();

        // Auto-select first if exists
        const keys = Object.keys(this.spriteTemp.animacoes);
        if (keys.length > 0) {
            this.selecionarAnimacao(keys[0]);
        } else {
            this.animacaoSelecionada = null;
            this.nomeAnimacaoSelecionada = '';
            document.getElementById('lbl-anim-current').innerText = '-';
            this.desenharEditor(); // Draw empty or just background
        }

        // Start draw loop
        // Start draw loop
        this.garantirInterfaceHitbox();
        this.garantirInterfaceSlicing(); // Nova interface de Grid
        this.desenharEditor();
    }

    /**
     * Garante que a Toolbar de Hitbox e Debug existam na interface
     */
    garantirInterfaceHitbox() {
        const editorBody = document.querySelector('#modal-animation-editor .modal-body');
        if (!editorBody) return;

        // --- 1. HITBOX TOOLBAR ---
        if (!document.getElementById('hitbox-toolbar')) {
            const toolbar = document.createElement('div');
            toolbar.id = 'hitbox-toolbar';
            toolbar.style.cssText = 'margin-top: 10px; padding: 10px; background: #222; border: 1px solid #444; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;';
            toolbar.innerHTML = `
                <label style="color: #4ecdc4; font-weight: bold; display:flex; align-items:center; cursor:pointer;">
                    <input type="checkbox" id="chk-edit-hitbox" style="margin-right:5px;"> 🥊 Editar Hitbox
                </label>
                <div id="hitbox-props" style="display:none; gap: 5px; align-items: center;">
                    <span style="font-size:10px; color:#aaa;">X:</span><input type="number" id="hb-x" style="width:40px; background:#111; color:white; border:1px solid #444; padding:2px;" value="0">
                    <span style="font-size:10px; color:#aaa;">Y:</span><input type="number" id="hb-y" style="width:40px; background:#111; color:white; border:1px solid #444; padding:2px;" value="0">
                    <span style="font-size:10px; color:#aaa;">W:</span><input type="number" id="hb-w" style="width:40px; background:#111; color:white; border:1px solid #444; padding:2px;" value="32">
                    <span style="font-size:10px; color:#aaa;">H:</span><input type="number" id="hb-h" style="width:40px; background:#111; color:white; border:1px solid #444; padding:2px;" value="32">
                    <button id="btn-del-hitbox" style="background:#c0392b; color:white; border:none; padding:2px 6px; cursor:pointer;" title="Remover Hitbox do Frame">✖</button>
                </div>
            `;

            // Tenta inserir na coluna da direita
            const rightPanel = editorBody.querySelector('.right-panel') || editorBody.querySelector('.modal-right');

            if (rightPanel) {
                rightPanel.insertBefore(toolbar, rightPanel.firstChild);
            } else {
                editorBody.appendChild(toolbar);
            }

            // Bind Events
            const chkHitbox = document.getElementById('chk-edit-hitbox');
            const boxProps = document.getElementById('hitbox-props');

            if (chkHitbox) {
                chkHitbox.onchange = (e) => {
                    this.editandoHitbox = e.target.checked;
                    boxProps.style.display = this.editandoHitbox ? 'flex' : 'none';
                    this.desenharEditor();
                };
            }

            ['x', 'y', 'w', 'h'].forEach(prop => {
                const inp = document.getElementById(`hb-${prop}`);
                if (inp) {
                    inp.oninput = (e) => {
                        this.atualizarHitboxAtual({ [prop]: parseInt(e.target.value) });
                    };
                }
            });

            document.getElementById('btn-del-hitbox').onclick = () => this.removerHitboxAtual();
        }

        // --- 2. DEBUG TOGGLE ---
        if (!document.getElementById('chk-anim-debug')) {
            const labelDebug = document.createElement('label');
            labelDebug.style.cssText = 'position:absolute; bottom: 10px; left: 10px; color: #555; font-size: 10px; display: flex; align-items: center; gap: 5px; cursor: pointer; opacity: 0.7;';

            const chkDebug = document.createElement('input');
            chkDebug.type = 'checkbox';
            chkDebug.id = 'chk-anim-debug';
            chkDebug.onchange = (e) => {
                this.debugMode = e.target.checked;
                this.atualizarVisibilidadeDebug();
                this.desenharEditor();
            };

            labelDebug.appendChild(chkDebug);
            labelDebug.appendChild(document.createTextNode('Debug'));

            const content = document.querySelector('#modal-animation-editor .modal-content');
            if (content) content.appendChild(labelDebug);
        }
    }

    /**
     * Barra de Ferramentas para definir Tamanho do Frame (Grid)
     */
    garantirInterfaceSlicing() {
        if (document.getElementById('slicing-toolbar')) return;

        const canvas = document.getElementById('canvas-anim-editor');
        if (!canvas) return;

        const toolbar = document.createElement('div');
        toolbar.id = 'slicing-toolbar';
        toolbar.style.cssText = 'padding: 5px; background: #2d2d3f; border-bottom: 1px solid #444; display: flex; align-items: center; gap: 15px; margin-bottom:5px;';

        toolbar.innerHTML = `
            <span style="font-size:11px; color:#aaa; font-weight:bold;">📏 Grid (Corte):</span>
            <div style="display:flex; align-items:center; gap:5px;">
                <label style="font-size:10px; color:#ccc;">Largura:</label>
                <input type="number" id="inp-frame-w" value="32" style="width:45px; background:#111; color:#4ecdc4; border:1px solid #444; padding:3px; text-align:center;">
            </div>
            <div style="display:flex; align-items:center; gap:5px;">
                <label style="font-size:10px; color:#ccc;">Altura:</label>
                <input type="number" id="inp-frame-h" value="32" style="width:45px; background:#111; color:#4ecdc4; border:1px solid #444; padding:3px; text-align:center;">
            </div>
        `;

        // Insere antes do canvas (ou no topo do painel esquerdo)
        // Insere no TOPO do container do Canvas usando ABSOLUTE para garantir posição
        const container = canvas.parentNode;

        // Garante que o container tenha posição relativa para o absolute funcionar
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }

        toolbar.style.position = 'absolute';
        toolbar.style.top = '0';
        toolbar.style.left = '0';
        toolbar.style.width = '100%';
        toolbar.style.zIndex = '100'; // Fica em cima de tudo
        toolbar.style.boxSizing = 'border-box';
        toolbar.style.justifyContent = 'flex-start'; // Alinhas a esquerda

        container.appendChild(toolbar);

        // Listeners
        const inpW = document.getElementById('inp-frame-w');
        const inpH = document.getElementById('inp-frame-h');

        const updateGrid = () => {
            let w = parseInt(inpW.value);
            let h = parseInt(inpH.value);
            if (w < 1) w = 1;
            if (h < 1) h = 1;

            this.spriteTemp.larguraFrame = w;
            this.spriteTemp.alturaFrame = h;
            this.desenharEditor();
        };

        inpW.oninput = updateGrid;
        inpH.oninput = updateGrid;
    }

    fechar() {
        this.modal.classList.add('hidden');
        this.pararPreview();
    }

    configurarEventos() {
        document.getElementById('btn-close-anim').onclick = () => this.fechar();

        // Zoom
        this.canvasEditor.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = -Math.sign(e.deltaY);
            this.zoom = Math.max(0.5, Math.min(this.zoom + (delta * 0.2), 4.0));
            this.desenharEditor();
        });

        // Click to toggle frame
        this.canvasEditor.onclick = (e) => this.aoClicarCanvas(e);

        // Create Anim
        document.getElementById('btn-anim-create').onclick = () => this.criarAnimacao();

        // Anim Properties
        document.getElementById('inp-anim-speed').onchange = (e) => {
            if (this.animacaoSelecionada) this.animacaoSelecionada.speed = parseInt(e.target.value);
            this.iniciarPreview();
        };
        document.getElementById('chk-anim-loop').onchange = (e) => {
            if (this.animacaoSelecionada) this.animacaoSelecionada.loop = e.target.checked;
        };

        // Frame Dimensions per Animation
        document.getElementById('inp-anim-frame-w').oninput = (e) => {
            if (this.animacaoSelecionada) {
                const val = parseInt(e.target.value);
                if (val > 0) this.animacaoSelecionada.frameWidth = val;
                else delete this.animacaoSelecionada.frameWidth;
                this.desenharEditor();
                this.iniciarPreview();
            }
        };
        document.getElementById('inp-anim-frame-h').oninput = (e) => {
            if (this.animacaoSelecionada) {
                const val = parseInt(e.target.value);
                if (val > 0) this.animacaoSelecionada.frameHeight = val;
                else delete this.animacaoSelecionada.frameHeight;
                this.desenharEditor();
                this.iniciarPreview();
            }
        };

        // Offset per Animation
        document.getElementById('inp-anim-offset-x').oninput = (e) => {
            if (this.animacaoSelecionada) {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val !== 0) this.animacaoSelecionada.offsetX = val;
                else delete this.animacaoSelecionada.offsetX;
                this.iniciarPreview();
            }
        };
        document.getElementById('inp-anim-offset-y').oninput = (e) => {
            if (this.animacaoSelecionada) {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val !== 0) this.animacaoSelecionada.offsetY = val;
                else delete this.animacaoSelecionada.offsetY;
                this.iniciarPreview();
            }
        };

        // Draw Size per Animation
        document.getElementById('inp-anim-draw-w').oninput = (e) => {
            if (this.animacaoSelecionada) {
                const val = parseInt(e.target.value);
                if (val > 0) this.animacaoSelecionada.drawWidth = val;
                else delete this.animacaoSelecionada.drawWidth;
                this.iniciarPreview();
            }
        };
        document.getElementById('inp-anim-draw-h').oninput = (e) => {
            if (this.animacaoSelecionada) {
                const val = parseInt(e.target.value);
                if (val > 0) this.animacaoSelecionada.drawHeight = val;
                else delete this.animacaoSelecionada.drawHeight;
                this.iniciarPreview();
            }
        };

        // Source Selection Dropdown
        const selSource = document.getElementById('sel-anim-source');
        if (selSource) {
            selSource.onchange = (e) => {
                const val = e.target.value;
                if (val === 'upload') {
                    // Trigger upload
                    document.getElementById('inp-upload-anim-img').click();
                    selSource.value = ''; // Reset selection until upload done
                } else if (val === '') {
                    // Default
                    if (this.animacaoSelecionada) {
                        this.animacaoSelecionada.source = null;
                        this.animacaoSelecionada._runtimeImage = null;
                        this.animacaoSelecionada.frames = []; // Reset frames
                        this.desenharEditor();
                        this.iniciarPreview();
                    }
                } else {
                    // Selected an Asset ID
                    const asset = this.editor.assetManager.obterAsset(val);
                    if (asset && this.animacaoSelecionada) {
                        this.animacaoSelecionada.source = asset.source; // Copy source
                        this.animacaoSelecionada._runtimeImage = null;
                        this.animacaoSelecionada.frames = []; // Reset frames
                        this.desenharEditor();
                        this.iniciarPreview();
                    }
                }
            };
        }

        const inpUploadAnim = document.getElementById('inp-upload-anim-img');
        if (inpUploadAnim) {
            inpUploadAnim.onchange = (e) => {
                const file = e.target.files[0];
                if (file && this.animacaoSelecionada) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        const newSource = evt.target.result;

                        // --- LOGIC CHANGE: NEVER CREATE CHILD ASSETS AUTOMATICALLY ---
                        // User finds it confusing. We will store the source directly in the animation config.
                        // If they want a separate asset, they should create one in the Asset Manager manually.

                        const parentAsset = this.editor.assetManager.obterAsset(this.assetId);

                        // Option A: If Parent is empty, fill Parent (Keep this, it's good)
                        if (parentAsset && !parentAsset.source) {
                            console.log('[EditorAnimation] Filling Empty Parent Asset source.');
                            this.editor.assetManager.atualizarAsset(this.assetId, {
                                source: newSource,
                                larguraFrame: this.spriteTemp.larguraFrame,
                                alturaFrame: this.spriteTemp.alturaFrame
                            });
                            this.spriteTemp.setSource(newSource);
                            this.animacaoSelecionada.source = null; // Use Default
                        } else {
                            // Option B: Just set as Custom Source for this animation
                            console.log('[EditorAnimation] Setting Custom Source for animation (No new Asset file).');
                            this.animacaoSelecionada.source = newSource;
                        }

                        this.animacaoSelecionada._runtimeImage = null;
                        this.animacaoSelecionada.frames = [];

                        // Refresh UI
                        this.atualizarListaSources();

                        // Force Dropdown to "Internal"
                        const selSource = document.getElementById('sel-anim-source');
                        if (selSource) {
                            let optCustom = selSource.querySelector('option[value="custom_internal"]');
                            if (!optCustom) {
                                optCustom = document.createElement('option');
                                optCustom.value = "custom_internal";
                                optCustom.innerText = "⚠️ Imagem Interna (Custom)";
                                selSource.appendChild(optCustom);
                            }
                            selSource.value = "custom_internal";
                        }

                        this.desenharEditor();
                        this.iniciarPreview();
                        this.iniciarPreview();
                    };
                    reader.readAsDataURL(file);
                }
                // Permitir re-upload do mesmo arquivo
                e.target.value = '';
            };
        }

        // --- Hitbox UI Injection (Runtime) ---
        // Injects the Hitbox Toolbar into the Animation Editor Modal if not present
        const editorBody = document.querySelector('#modal-animation-editor .modal-body');
        if (editorBody && !document.getElementById('hitbox-toolbar')) {
            const toolbar = document.createElement('div');
            toolbar.id = 'hitbox-toolbar';
            toolbar.style.cssText = 'margin-top: 10px; padding: 10px; background: #222; border: 1px solid #444; display: flex; align-items: center; gap: 10px;';
            toolbar.innerHTML = `
                <label><input type="checkbox" id="chk-edit-hitbox"> Editar Hitbox (Ataque)</label>
                <div id="hitbox-props" style="display:none; gap: 5px; align-items: center;">
                    X: <input type="number" id="hb-x" style="width:40px" value="0">
                    Y: <input type="number" id="hb-y" style="width:40px" value="0">
                    W: <input type="number" id="hb-w" style="width:40px" value="32">
                    H: <input type="number" id="hb-h" style="width:40px" value="32">
                    <button id="btn-del-hitbox" class="btn-danger" style="padding: 2px 5px;">✖</button>
                </div>
            `;
            // Insert after canvas container (assuming structure)
            const rightPanel = editorBody.querySelector('.right-panel'); // Adjust selector as needed
            if (rightPanel) rightPanel.appendChild(toolbar);
            else editorBody.appendChild(toolbar);
        }

        // --- Event Listeners for Hitbox ---
        const chkHitbox = document.getElementById('chk-edit-hitbox');
        const boxProps = document.getElementById('hitbox-props');

        if (chkHitbox) {
            chkHitbox.onchange = (e) => {
                this.editandoHitbox = e.target.checked;
                boxProps.style.display = this.editandoHitbox ? 'flex' : 'none';
                this.desenharEditor();
            };
        }

        ['x', 'y', 'w', 'h'].forEach(prop => {
            const inp = document.getElementById(`hb-${prop}`);
            if (inp) {
                inp.oninput = (e) => {
                    this.atualizarHitboxAtual({ [prop]: parseInt(e.target.value) });
                };
            }
        });

        const btnDelHb = document.getElementById('btn-del-hitbox');
        if (btnDelHb) {
            btnDelHb.onclick = () => {
                this.removerHitboxAtual();
            };
        }
        // Save
        document.getElementById('btn-save-anim').onclick = () => this.salvar();

        // --- DEBUG MODE TOGGLE ---
        const labelDebug = document.createElement('label');
        labelDebug.style.cssText = 'position:absolute; bottom: 10px; left: 10px; color: #888; font-size: 11px; display: flex; align-items: center; gap: 5px; cursor: pointer;';

        const chkDebug = document.createElement('input');
        chkDebug.type = 'checkbox';
        chkDebug.id = 'chk-anim-debug';
        chkDebug.onchange = (e) => {
            this.debugMode = e.target.checked;
            this.atualizarVisibilidadeDebug();
            this.desenharEditor();
        };

        labelDebug.appendChild(chkDebug);
        labelDebug.appendChild(document.createTextNode('⚙️ Debug'));
        document.querySelector('#modal-animation-editor .modal-content').appendChild(labelDebug);

        // CREATE DEBUG BUTTONS (Hidden by default)
        this.criarBotaoDebug('btn-reload-img', '🔄 Recarregar', 80, () => {
            if (this.animacaoSelecionada) {
                this.animacaoSelecionada._runtimeImage = null;
                this.desenharEditor();
            }
        });

        this.criarBotaoDebug('btn-diag-info', '🩺 Diagnóstico', 160, () => {
            const canvas = this.canvasEditor;
            const img = this.obterImagemAtual();
            alert(`Canvas: ${canvas.width}x${canvas.height}\nZoom: ${this.zoom}\nImg: ${img ? img.naturalWidth : 'N/A'}`);
        });

        // Initialize state
        this.debugMode = false;
        this.atualizarVisibilidadeDebug();
    }

    criarBotaoDebug(id, text, left, onClick) {
        const btn = document.createElement('button');
        btn.id = id;
        btn.innerText = text;
        btn.className = 'debug-btn'; // Marker class
        btn.style.cssText = 'position:absolute; bottom: 10px; left: ' + left + 'px; padding: 2px 5px; background: #444; color: white; border: none; font-size: 10px; border-radius: 3px; cursor: pointer; display: none;';
        btn.onclick = onClick;
        document.querySelector('#modal-animation-editor .modal-content').appendChild(btn);
    }

    atualizarVisibilidadeDebug() {
        const display = this.debugMode ? 'block' : 'none';
        document.querySelectorAll('.debug-btn').forEach(btn => btn.style.display = display);
    }

    atualizarHitboxAtual(props) {
        if (!this.animacaoSelecionada) return;

        // Ensure hitboxes map exists
        if (!this.animacaoSelecionada.hitboxes) this.animacaoSelecionada.hitboxes = {};

        // Find currently selected frame (or first if multiple)
        // Hitbox is per FRAME index (Global index in spritesheet)
        if (!this.animacaoSelecionada.frames || this.animacaoSelecionada.frames.length === 0) return;

        // Note: Currently we only support editing the hitbox of the LAST selected frame in the list?
        // Or we need a way to know WHICH frame is "active" in editor beyond just being in the list.
        // For now, let's assume valid for ALL selected frames? No, specific frame.
        // Let's rely on `this.frameSelecionadoEditor` which we need to track.

        // BETTER APPROACH: Use the frame clicked on Canvas.
        // But the Canvas shows the IMAGE.
        // We need to know which frame (index) we are editing.
        // Let's assume user Clicks on a grid cell -> That cell is the frame.

        if (this.frameSelecionadoIndex === null || this.frameSelecionadoIndex === undefined) return;

        const frameGlobalIndex = this.frameSelecionadoIndex;

        let hb = this.animacaoSelecionada.hitboxes[frameGlobalIndex];
        if (!hb) {
            hb = { x: 0, y: 0, w: 32, h: 32 };
            this.animacaoSelecionada.hitboxes[frameGlobalIndex] = hb;
        }

        Object.assign(hb, props);
        this.desenharEditor();
    }

    removerHitboxAtual() {
        if (!this.animacaoSelecionada || this.frameSelecionadoIndex === undefined) return;
        if (this.animacaoSelecionada.hitboxes) {
            delete this.animacaoSelecionada.hitboxes[this.frameSelecionadoIndex];
        }
        this.desenharEditor();
    }

    criarAnimacao() {
        const nome = document.getElementById('inp-anim-name').value;
        if (!nome) return;
        this.spriteTemp.definirAnimacao(nome, []);
        this.atualizarListaAnimacoes();
        this.selecionarAnimacao(nome);
        document.getElementById('inp-anim-name').value = '';
    }

    selecionarAnimacao(nome) {
        if (!this.spriteTemp.animacoes[nome]) return;

        this.animacaoSelecionada = this.spriteTemp.animacoes[nome];
        this.nomeAnimacaoSelecionada = nome;
        this.autoRecovered = false; // Reset recovery flag

        // Update UI
        document.getElementById('lbl-anim-current').innerText = nome;
        document.getElementById('inp-anim-speed').value = this.animacaoSelecionada.speed || 5;
        document.getElementById('chk-anim-loop').checked = this.animacaoSelecionada.loop !== false;

        // Update Frame Dimensions (show if custom, clear if using global)
        document.getElementById('inp-anim-frame-w').value = this.animacaoSelecionada.frameWidth || '';
        document.getElementById('inp-anim-frame-h').value = this.animacaoSelecionada.frameHeight || '';

        // Update Offset (show if custom, clear if using global)
        document.getElementById('inp-anim-offset-x').value = this.animacaoSelecionada.offsetX || '';
        document.getElementById('inp-anim-offset-y').value = this.animacaoSelecionada.offsetY || '';

        // Update Draw Size (show if custom, clear if using entity size)
        document.getElementById('inp-anim-draw-w').value = this.animacaoSelecionada.drawWidth || '';
        document.getElementById('inp-anim-draw-h').value = this.animacaoSelecionada.drawHeight || '';

        // Update Source Dropdown
        this.atualizarListaSources(); // Refresh list to include new assets
        const selSource = document.getElementById('sel-anim-source');
        if (selSource) {
            // Try to match current source with an asset
            if (!this.animacaoSelecionada.source) {
                selSource.value = "";
            } else {
                // Find asset with same source
                const assets = this.editor.assetManager.assets;
                const match = Object.values(assets).find(a => a.source === this.animacaoSelecionada.source);
                if (match) {
                    selSource.value = match.id;
                } else {
                    // Custom source that isn't a separate asset
                    // Add a temporary option to show this state
                    let optCustom = selSource.querySelector('option[value="custom_internal"]');
                    if (!optCustom) {
                        optCustom = document.createElement('option');
                        optCustom.value = "custom_internal";
                        optCustom.innerText = "⚠️ Imagem Interna (Não é Asset)";
                        selSource.appendChild(optCustom);
                    }
                    selSource.value = "custom_internal";
                }
            }
        }

        this.atualizarListaAnimacoes();
        this.desenharEditor();
        this.iniciarPreview();
    }

    atualizarListaSources() {
        const sel = document.getElementById('sel-anim-source');
        if (!sel) return;

        // Preserve current value if possible, or reset
        const currentVal = sel.value;

        // Clear options except first 2
        // Actually rebuild it
        sel.innerHTML = `
            <option value="">Sprite Sheet Padrão</option>
            <option value="upload">📂 [Carregar Novo...]</option>
        `;

        // Add Image Assets
        const assets = this.editor.assetManager.assets;
        Object.values(assets).forEach(a => {
            if (a.tipo === 'imagem' || a.tipo === 'spritesheet') {
                const opt = document.createElement('option');
                opt.value = a.id;
                opt.textContent = `Asset: ${a.nome}`;
                sel.appendChild(opt);
            }
        });

        // Restore value if meaningful
        // But selecionaAnimacao sets it anyway.
    }

    atualizarListaAnimacoes() {
        const list = document.getElementById('list-anims');
        list.innerHTML = '';
        Object.keys(this.spriteTemp.animacoes).forEach(nome => {
            const li = document.createElement('div');
            li.className = 'anim-item ' + (this.nomeAnimacaoSelecionada === nome ? 'selected' : '');
            li.innerHTML = `<span>${nome}</span> <span class="del">✖</span>`;
            li.querySelector('span').onclick = () => this.selecionarAnimacao(nome);
            li.querySelector('.del').onclick = (e) => { e.stopPropagation(); delete this.spriteTemp.animacoes[nome]; this.atualizarListaAnimacoes(); };
            list.appendChild(li);
        });
    }

    // Returns: Animation Specific Image OR Global Component Image
    obterImagemAtual() {
        if (this.animacaoSelecionada && this.animacaoSelecionada.source) {
            if (!this.animacaoSelecionada._runtimeImage) {
                const img = new Image();
                img.src = this.animacaoSelecionada.source;
                this.animacaoSelecionada._runtimeImage = img;

                // Debug Load
                img.onload = () => {
                    console.log(`[EditorAnimation] Imagem runtime carregada. ${img.width}x${img.height}`);
                    // If zoom is weird or image is big, helpful to reset?
                    // if (this.zoom === 1) this.centralizarCamera(img.width, img.height);
                    this.desenharEditor();
                };
                img.onerror = (e) => console.error(`[EditorAnimation] Erro ao carregar imagem runtime.`, e);
            }
            return this.animacaoSelecionada._runtimeImage;
        }

        // If no animation specific, use Global
        // But WAIT: If animacaoSelecionada has source=NULL, it means it uses Global.
        // We need to return spriteTemp.imagem
        return this.spriteTemp.imagem;
    }

    /**
     * Atualiza o painel de informações da imagem
     */
    atualizarInfoImagem(img) {
        const nameEl = document.getElementById('img-info-name');
        const extEl = document.getElementById('img-info-ext');
        const sizeEl = document.getElementById('img-info-size');

        if (!img || !img.src || img.naturalWidth === 0) {
            nameEl.textContent = '-';
            extEl.textContent = '-';
            sizeEl.textContent = '-';
            return;
        }

        // Extrair nome do arquivo da URL/path
        const src = img.src;
        let filename = '-';
        let extension = '-';

        try {
            // Se for data URL
            if (src.startsWith('data:')) {
                const mimeMatch = src.match(/data:image\/([\w+]+);/);
                extension = mimeMatch ? mimeMatch[1].toUpperCase() : 'Unknown';
                filename = 'Imagem Interna';
            } else {
                // URL ou caminho normal
                const parts = src.split('/');
                const fullName = parts[parts.length - 1];
                const nameParts = fullName.split('.');
                extension = nameParts.length > 1 ? nameParts.pop().toUpperCase() : '';
                filename = nameParts.join('.');
            }
        } catch (e) {
            console.warn('[EditorAnimation] Erro ao extrair info do arquivo:', e);
        }

        // Atualizar UI
        nameEl.textContent = filename;
        extEl.textContent = extension || '-';
        sizeEl.textContent = `${img.naturalWidth} × ${img.naturalHeight}px`;
    }

    desenharEditor() {
        // Clear
        this.ctxEditor.save();
        this.ctxEditor.setTransform(1, 0, 0, 1, 0, 0);
        this.ctxEditor.clearRect(0, 0, this.canvasEditor.width, this.canvasEditor.height);
        this.ctxEditor.fillStyle = '#222';
        this.ctxEditor.fillRect(0, 0, this.canvasEditor.width, this.canvasEditor.height);

        // VISUAL TEST PATTERN (Verify Canvas is Alive) - DEBUG ONLY
        if (this.debugMode) {
            this.ctxEditor.strokeStyle = '#003300';
            this.ctxEditor.lineWidth = 10;
            this.ctxEditor.beginPath();
            this.ctxEditor.moveTo(0, 0);
            this.ctxEditor.lineTo(this.canvasEditor.width, this.canvasEditor.height);
            this.ctxEditor.moveTo(this.canvasEditor.width, 0);
            this.ctxEditor.lineTo(0, this.canvasEditor.height);
            this.ctxEditor.stroke();
        }

        this.ctxEditor.restore();

        const img = this.obterImagemAtual();

        // Atualizar informações da imagem
        this.atualizarInfoImagem(img);

        // --- FIX: Check for Valid Image ---
        const invalidImg = !img || !img.src || img.naturalWidth === 0;

        if (invalidImg) {
            // AUTO RECOVER: If source exists but image failed, try one reload.
            if (!this.autoRecovered && this.animacaoSelecionada && this.animacaoSelecionada.source) {
                // Keep Auto Recover Logic silent normally?
                if (this.debugMode) console.log('[EditorAnimation] Auto-Recover: Attempting to reload broken image...');
                this.autoRecovered = true;
                this.animacaoSelecionada._runtimeImage = null;
                setTimeout(() => this.desenharEditor(), 100);

                this.ctxEditor.fillStyle = '#222';
                this.ctxEditor.fillRect(0, 0, this.canvasEditor.width, this.canvasEditor.height);
                this.ctxEditor.fillStyle = '#0f0';
                this.ctxEditor.textAlign = 'center';
                this.ctxEditor.fillText('🔄 Tentando recuperar...', this.canvasEditor.width / 2, this.canvasEditor.height / 2);
                return;
            }

            // Detailed Debug
            if ((this._lastLogTime === undefined || Date.now() - this._lastLogTime > 2000) && this.debugMode) {
                this._lastLogTime = Date.now();
                console.warn('[EditorAnimation] Falha ao renderizar imagem.');
                console.log('Img Object:', img);
                console.log('Src length:', img ? (img.src ? img.src.length : 'NULL') : 'NO IMG OBJ');
                console.log('NaturalWidth:', img ? img.naturalWidth : 'N/A');
                console.log('Selection Source:', this.animacaoSelecionada ? (this.animacaoSelecionada.source ? 'EXISTS' : 'NULL') : 'NO SELECTION');
            }

            // Draw placeholder if waiting for load
            if (img && img.src && img.complete === false) {
                requestAnimationFrame(() => this.desenharEditor());
            } else {
                this.ctxEditor.fillStyle = '#444';
                this.ctxEditor.font = '14px Arial';
                this.ctxEditor.textAlign = 'center';

                if (this.debugMode) {
                    // DIAGNOSTIC OVERLAY
                    const srcLen = img && img.src ? img.src.length : 0;
                    let y = this.canvasEditor.height / 2 - 20;
                    this.ctxEditor.fillText('⚠️ FALHA NA IMAGEM (Debug)', this.canvasEditor.width / 2, y); y += 20;
                    this.ctxEditor.font = '11px monospace';
                    this.ctxEditor.fillStyle = '#f88';
                    this.ctxEditor.fillText(`Src Len: ${srcLen}, W: ${img ? img.naturalWidth : 0}`, this.canvasEditor.width / 2, y);
                } else {
                    this.ctxEditor.fillText('⚠️ Nenhuma Imagem', this.canvasEditor.width / 2, this.canvasEditor.height / 2);
                }
            }
            return;
        }

        // Resize Canvas if needed
        const targetW = Math.floor(img.width * this.zoom);
        const targetH = Math.floor(img.height * this.zoom);
        if (this.canvasEditor.width !== targetW || this.canvasEditor.height !== targetH) {
            this.canvasEditor.width = targetW;
            this.canvasEditor.height = targetH;
            this.ctxEditor.imageSmoothingEnabled = false;
        }

        // Draw Image
        this.ctxEditor.save();
        this.ctxEditor.scale(this.zoom, this.zoom);
        this.ctxEditor.drawImage(img, 0, 0);

        // Draw Grid
        const frameW = this.spriteTemp.larguraFrame;
        const frameH = this.spriteTemp.alturaFrame;

        this.ctxEditor.strokeStyle = 'rgba(255,255,255,0.2)';
        this.ctxEditor.beginPath();
        for (let x = 0; x <= img.width; x += frameW) { this.ctxEditor.moveTo(x, 0); this.ctxEditor.lineTo(x, img.height); }
        for (let y = 0; y <= img.height; y += frameH) { this.ctxEditor.moveTo(0, y); this.ctxEditor.lineTo(img.width, y); }
        this.ctxEditor.stroke();

        // Highlight Selected Frames
        if (this.animacaoSelecionada && this.animacaoSelecionada.frames) {
            this.ctxEditor.fillStyle = 'rgba(78, 205, 196, 0.4)';
            this.ctxEditor.font = '10px Arial';
            const cols = Math.floor(img.width / frameW);

            this.animacaoSelecionada.frames.forEach((fIndex, i) => {
                const c = fIndex % cols;
                const r = Math.floor(fIndex / cols);
                this.ctxEditor.fillRect(c * frameW, r * frameH, frameW, frameH);

                this.ctxEditor.fillStyle = 'white';
                this.ctxEditor.fillText(i + 1, c * frameW + 2, r * frameH + 10);
                this.ctxEditor.fillStyle = 'rgba(78, 205, 196, 0.4)';
            });
        }

        // --- HITBOX VISUALIZATION ---
        if (this.editandoHitbox && this.animacaoSelecionada && this.animacaoSelecionada.hitboxes) {
            const cols = Math.floor(img.width / frameW);

            // Draw all hitboxes
            Object.keys(this.animacaoSelecionada.hitboxes).forEach(fIndex => {
                fIndex = parseInt(fIndex);
                // Only draw if frame is in current animation? Or all? Drawn global index.
                const hb = this.animacaoSelecionada.hitboxes[fIndex];
                if (hb) {
                    const c = fIndex % cols;
                    const r = Math.floor(fIndex / cols);

                    // Box is relative to Frame Origin (0,0) which is c*W, r*H
                    const absX = (c * frameW) + hb.x;
                    const absY = (r * frameH) + hb.y;

                    this.ctxEditor.strokeStyle = '#ff3333';
                    this.ctxEditor.lineWidth = 2;
                    this.ctxEditor.strokeRect(absX, absY, hb.w, hb.h);

                    this.ctxEditor.fillStyle = 'rgba(255, 50, 50, 0.3)';
                    this.ctxEditor.fillRect(absX, absY, hb.w, hb.h);
                }
            });
        }

        // Highlight Currently Selected Frame for Editing
        if (this.frameSelecionadoIndex !== undefined && this.frameSelecionadoIndex !== null) {
            const cols = Math.floor(img.width / frameW);
            const c = this.frameSelecionadoIndex % cols;
            const r = Math.floor(this.frameSelecionadoIndex / cols);

            this.ctxEditor.strokeStyle = '#ffff00'; // Yellow selection
            this.ctxEditor.lineWidth = 2;
            this.ctxEditor.strokeRect(c * frameW, r * frameH, frameW, frameH);
        }

        this.ctxEditor.restore();
    }

    aoClicarCanvas(e) {
        if (!this.animacaoSelecionada) return;
        const img = this.obterImagemAtual();
        if (!img) return;

        const rect = this.canvasEditor.getBoundingClientRect();
        const scaleX = this.canvasEditor.width / rect.width;
        const scaleY = this.canvasEditor.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX / this.zoom;
        const y = (e.clientY - rect.top) * scaleY / this.zoom;

        const frameW = this.spriteTemp.larguraFrame;
        const frameH = this.spriteTemp.alturaFrame;
        const cols = Math.floor(img.width / frameW);

        const c = Math.floor(x / frameW);
        const r = Math.floor(y / frameH);
        const frameIndex = r * cols + c;

        if (c < 0 || c >= cols || r < 0 || y > img.height) return;

        // --- HITBOX EDIT MODE ---
        if (this.editandoHitbox) {
            this.frameSelecionadoIndex = frameIndex;

            // If dragging logic was here, we'd update HB properties. 
            // For now, selecting the frame populates the inputs.
            const hb = this.animacaoSelecionada.hitboxes ? this.animacaoSelecionada.hitboxes[frameIndex] : null;
            if (hb) {
                document.getElementById('hb-x').value = hb.x;
                document.getElementById('hb-y').value = hb.y;
                document.getElementById('hb-w').value = hb.w;
                document.getElementById('hb-h').value = hb.h;
            } else {
                // Default new values
                document.getElementById('hb-x').value = 0;
                document.getElementById('hb-y').value = 0;
                document.getElementById('hb-w').value = frameW;
                document.getElementById('hb-h').value = frameH;
            }

            this.desenharEditor();
            return;
        }

        // --- STANDARD MODE (Frame Selection) ---
        if (!this.animacaoSelecionada.frames) this.animacaoSelecionada.frames = [];
        const idx = this.animacaoSelecionada.frames.indexOf(frameIndex);

        if (idx >= 0) this.animacaoSelecionada.frames.splice(idx, 1);
        else this.animacaoSelecionada.frames.push(frameIndex);

        this.frameSelecionadoIndex = frameIndex; // Track selection anyway
        this.desenharEditor();
        this.iniciarPreview(); // Auto-start/Refresh preview
    }

    iniciarPreview() {
        this.pararPreview();
        if (!this.animacaoSelecionada || !this.animacaoSelecionada.frames || !this.animacaoSelecionada.frames.length) return;

        this.previewFrameIndex = 0;
        const fps = this.animacaoSelecionada.speed || 5;

        this.previewInterval = setInterval(() => {
            // Render PREVIEW - usar dimensões da animação se disponível
            const frameW = this.animacaoSelecionada.frameWidth || this.spriteTemp.larguraFrame;
            const frameH = this.animacaoSelecionada.frameHeight || this.spriteTemp.alturaFrame;
            this.ctxPreview.clearRect(0, 0, this.canvasPreview.width, this.canvasPreview.height);

            const fIndex = this.animacaoSelecionada.frames[this.previewFrameIndex];
            const img = this.obterImagemAtual();

            if (img && img.complete) {
                const cols = Math.floor(img.width / frameW);
                const c = fIndex % cols;
                const r = Math.floor(fIndex / cols);

                // FIX: Mantém proporção real do sprite, não estica
                const canvasW = this.canvasPreview.width;
                const canvasH = this.canvasPreview.height;
                const frameAspect = frameW / frameH;
                const canvasAspect = canvasW / canvasH;

                let drawW, drawH, drawX, drawY;

                if (frameAspect > canvasAspect) {
                    // Frame é mais largo que canvas - usa largura total
                    drawW = canvasW;
                    drawH = canvasW / frameAspect;
                    drawX = 0;
                    drawY = (canvasH - drawH) / 2; // Centraliza verticalmente
                } else {
                    // Frame é mais alto que canvas - usa altura total
                    drawH = canvasH;
                    drawW = canvasH * frameAspect;
                    drawY = 0;
                    drawX = (canvasW - drawW) / 2; // Centraliza horizontalmente
                }

                this.ctxPreview.drawImage(img, c * frameW, r * frameH, frameW, frameH, drawX, drawY, drawW, drawH);
            }

            this.previewFrameIndex = (this.previewFrameIndex + 1) % this.animacaoSelecionada.frames.length;
        }, 1000 / fps);
    }

    pararPreview() {
        if (this.previewInterval) clearInterval(this.previewInterval);
    }

    salvar() {
        if (this.assetId) {
            console.log(`[EditorAnimation] Salvando asset ${this.assetId}. Keys:`, Object.keys(this.spriteTemp.animacoes));

            // Save changes back to asset manager
            const asset = this.editor.assetManager.obterAsset(this.assetId);
            if (asset) {
                asset.animacoes = JSON.parse(JSON.stringify(this.spriteTemp.animacoes));
                // IMPORTANTE: Salvar dimensoes do grid também
                asset.larguraFrame = this.spriteTemp.larguraFrame;
                asset.alturaFrame = this.spriteTemp.alturaFrame;

                console.log('[EditorAnimation] Asset atualizado no Manager:', asset.animacoes);

                // CRITICAL: If any animation has a custom source, we must ensure it's preloaded/ready in the asset context?
                // Actually SpriteComponent handles loading on fly.
                // But we should ensure the Asset knows it changed?
                // The Asset object is just data.

                this.editor.log('Animações salvas!', 'success');
            }
        }
        this.fechar();
    }
}

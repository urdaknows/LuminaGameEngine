export class PainelAssets {
    constructor(editor) {
        this.editor = editor;
        this.container = document.getElementById('painel-assets-content');
        this.renderizar();
    }

    atualizar() {
        this.renderizar();
    }

    renderizar() {
        if (!this.container) return;
        this.container.innerHTML = '';

        // --- Header Principal ---
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '10px';
        header.style.padding = '8px';
        header.style.background = '#16213e';
        header.style.borderBottom = '2px solid #333';

        const titulo = document.createElement('span');
        titulo.setAttribute('data-i18n', 'panel.assets');
        titulo.textContent = 'Recursos';
        titulo.style.fontWeight = 'bold';
        titulo.style.fontSize = '14px';
        titulo.style.color = '#fff';

        const boxBtns = document.createElement('div');
        boxBtns.style.display = 'flex';
        boxBtns.style.gap = '8px';

        // Botões Grandes do Header (Icon Only + Tooltip)
        const btnAddFolder = this.criarBotaoHeader('📂+', '#ffd93d', 'Nova Pasta Raiz', () => this.addFolder(null));
        const btnAddSet = this.criarBotaoHeader('🧱', '#4ecdc4', 'Novo Tileset', () => this.addAsset('tileset', null));
        const btnAddAnim = this.criarBotaoHeader('🎬', '#ff6b6b', 'Nova Animação', () => this.addAsset('animacao', null));

        boxBtns.appendChild(btnAddFolder);
        boxBtns.appendChild(btnAddSet);
        boxBtns.appendChild(btnAddAnim);

        header.appendChild(titulo);
        header.appendChild(boxBtns);
        this.container.appendChild(header);

        // --- Container da Árvore ---
        const treeContainer = document.createElement('div');
        treeContainer.className = 'assets-tree';
        treeContainer.style.padding = '5px';
        this.container.appendChild(treeContainer);

        // Renderizar Recursivamente a partir da Raiz (null)
        this._renderizarTree(null, treeContainer);
    }

    /**
     * Renderiza a árvore de assets/pastas recursivamente
     */
    _renderizarTree(parentId, container) {
        const sprites = this.editor.assetManager.listarSprites();
        const folders = this.editor.assetManager.folders || [];

        // 1. Pastas neste nível
        const subFolders = folders.filter(f => f.parentId === parentId);

        // 2. Assets neste nível
        let assetsInLevel = sprites.filter(a => a.folderId === parentId);

        // Smart Filter (Ocultar frames child)
        const suffixes = ['_idle', '_walk', '_run', '_jump', '_fall', '_crouch', '_attack', '_hurt', '_death', '_latindo', '_andando'];
        assetsInLevel = assetsInLevel.filter(a => {
            const lowerName = a.nome.toLowerCase();
            return !suffixes.some(s => lowerName.endsWith(s));
        });

        // Render Pastas
        subFolders.forEach(folder => {
            this._renderizarPastaItem(folder, container);
        });

        // Render Assets
        assetsInLevel.forEach(asset => {
            container.appendChild(this.criarElementoAsset(asset));
        });

        // Se vazio na raiz
        if (parentId === null && subFolders.length === 0 && assetsInLevel.length === 0) {
            const empty = document.createElement('div');
            empty.setAttribute('data-i18n', 'assets.empty');
            empty.textContent = 'Nenhum recurso importado.';
            empty.style.color = '#555';
            empty.style.fontStyle = 'italic';
            empty.style.padding = '10px';
            empty.style.fontSize = '12px';
            empty.style.textAlign = 'center';
            container.appendChild(empty);
        }
    }

    _renderizarPastaItem(folder, container) {
        const folderEl = document.createElement('div');
        folderEl.style.marginBottom = '4px';

        // Header da Pasta
        const header = document.createElement('div');
        header.className = 'folder-header-asset';
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.padding = '6px';
        header.style.background = '#2a2a40';
        header.style.borderRadius = '4px';
        header.style.cursor = 'pointer';
        header.style.border = '1px solid #444';

        // Ícone e Nome
        const titleArea = document.createElement('div');
        titleArea.style.flex = '1';
        titleArea.style.display = 'flex';
        titleArea.style.alignItems = 'center';
        titleArea.gap = '8px';
        titleArea.onclick = (e) => {
            // Toggle Expand
            const content = folderEl.querySelector('.folder-content');
            if (content) content.style.display = content.style.display === 'none' ? 'block' : 'none';
        };

        titleArea.innerHTML = `<span style="font-size:14px;">📁</span> <span style="font-weight:bold; color:#ffd700; margin-left:5px;">${folder.nome}</span>`;
        header.appendChild(titleArea);

        // Ações da Pasta
        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '4px';

        const btnAddSub = this.criarBotaoAcao('📂+', 'Nova Subpasta', '#ffd93d', (e) => { e.stopPropagation(); this.addFolder(folder.id); });
        const btnAddSet = this.criarBotaoAcao('🧱', 'Novo Tileset', '#4ecdc4', (e) => { e.stopPropagation(); this.addAsset('tileset', folder.id); });
        const btnAddAnim = this.criarBotaoAcao('🎬', 'Nova Animação', '#ff6b6b', (e) => { e.stopPropagation(); this.addAsset('animacao', folder.id); });
        const btnDel = this.criarBotaoAcao('🗑️', 'Apagar Pasta', '#ff4444', (e) => { e.stopPropagation(); this.removerPasta(folder.id); });

        actions.appendChild(btnAddSub);
        actions.appendChild(btnAddSet);
        actions.appendChild(btnAddAnim);
        actions.appendChild(btnDel);
        header.appendChild(actions);

        folderEl.appendChild(header);

        // Conteúdo
        const content = document.createElement('div');
        content.className = 'folder-content';
        content.style.marginLeft = '15px';
        content.style.paddingLeft = '5px';
        content.style.borderLeft = '2px solid #444';
        content.style.marginTop = '2px';

        // Renderizar filhos
        this._renderizarTree(folder.id, content);

        folderEl.appendChild(content);

        // Setup Drag Drop Zone (Folder recebe assets)
        this.setupDropZone(header, folder.id);

        container.appendChild(folderEl);
    }

    addFolder(parentId) {
        const nome = prompt('Nome da Nova Pasta:');
        if (nome) {
            this.editor.assetManager.criarPasta(nome, parentId);
            this.atualizar();
        }
    }

    addAsset(categoria, folderId) {
        const nome = prompt(`Nome do novo ${categoria}:`, categoria === 'tileset' ? 'Novo Tileset' : 'Nova Animacao');
        if (nome) {
            this.editor.assetManager.criarSpriteAsset(nome, categoria, folderId);
            this.atualizar();
        }
    }

    removerPasta(id) {
        if (confirm('Tem certeza que deseja remover esta pasta? (Assets internos irão para a raiz)')) {
            const assets = this.editor.assetManager.listarSprites().filter(a => a.folderId === id);
            assets.forEach(a => a.folderId = null);

            const folders = this.editor.assetManager.folders.filter(f => f.parentId === id);
            folders.forEach(f => f.parentId = null);

            const idx = this.editor.assetManager.folders.findIndex(f => f.id === id);
            if (idx > -1) this.editor.assetManager.folders.splice(idx, 1);

            this.atualizar();
        }
    }

    criarBotaoHeader(icon, cor, title, onclick) {
        const btn = document.createElement('button');
        btn.innerText = icon;
        btn.title = title;
        btn.style.background = cor;
        btn.style.color = '#1a1a2e';
        btn.style.border = 'none';
        btn.style.width = '28px';
        btn.style.height = '28px';
        btn.style.borderRadius = '4px';
        btn.style.fontWeight = 'bold';
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '14px';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';

        btn.onmouseover = () => btn.style.filter = 'brightness(1.2)';
        btn.onmouseout = () => btn.style.filter = 'brightness(1.0)';

        btn.onclick = onclick;
        return btn;
    }

    criarBotaoAcao(icon, title, cor, onclick) {
        const btn = document.createElement('button');
        btn.innerText = icon;
        btn.title = title;
        btn.style.background = 'transparent';
        btn.style.color = cor;
        btn.style.border = `1px solid ${cor}`;
        btn.style.width = '22px';
        btn.style.height = '22px';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.borderRadius = '4px';
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '12px';

        btn.onmouseover = () => { btn.style.background = cor; btn.style.color = '#1a1a2e'; };
        btn.onmouseout = () => { btn.style.background = 'transparent'; btn.style.color = cor; };

        btn.onclick = onclick;
        return btn;
    }

    criarElementoAsset(asset) {
        const item = document.createElement('div');
        item.className = 'asset-item';
        item.style.padding = '8px';
        item.style.background = '#222';
        item.style.marginBottom = '4px';
        item.style.borderRadius = '4px';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.gap = '10px';
        item.style.border = '1px solid #333';
        item.style.transition = 'all 0.2s';

        item.onmouseover = () => item.style.borderColor = '#555';
        item.onmouseout = () => item.style.borderColor = '#333';

        // Thumbnail
        const thumb = document.createElement('div');
        thumb.style.width = '32px';
        thumb.style.height = '32px';
        thumb.style.background = '#111';
        thumb.style.borderRadius = '4px';
        thumb.style.overflow = 'hidden';
        thumb.style.display = 'flex';
        thumb.style.justifyContent = 'center';
        thumb.style.alignItems = 'center';

        if (asset.source) {
            const img = document.createElement('img');
            img.src = asset.source;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            img.style.imageRendering = 'pixelated';
            thumb.appendChild(img);
        } else {
            thumb.innerHTML = '<span>🖼️</span>';
        }

        const info = document.createElement('div');
        info.style.flex = '1';
        info.innerHTML = `
            <div style="color:#ddd; font-weight:500; font-size:12px;">${asset.nome}</div>
            <div style="color:#666; font-size:10px;">${asset.categoria}</div>
        `;

        // Ações Asset
        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '5px';

        const btnEdit = this.criarBotaoAcao('✏️', 'Editar Asset', '#4ecdc4', (e) => {
            e.stopPropagation();
            if (asset.categoria === 'animacao')
                this.editor.editorAnimation.abrir(asset.id);
            else
                this.editor.editorSprite.abrirAsset(asset.id);
        });

        const btnDel = this.criarBotaoAcao('🗑️', 'Remover Asset', '#ff4444', (e) => {
            e.stopPropagation();
            if (confirm(`Remover asset "${asset.nome}"?`)) {
                this.editor.assetManager.removerAsset(asset.id);
                this.atualizar();
            }
        });

        actions.appendChild(btnEdit);
        actions.appendChild(btnDel);

        item.appendChild(thumb);
        item.appendChild(info);
        item.appendChild(actions);

        // Drag
        item.draggable = true;
        item.ondragstart = (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({ tipo: 'asset_sprite', id: asset.id }));
            item.style.opacity = '0.5';
        };
        item.ondragend = () => item.style.opacity = '1';

        return item;
    }

    setupDropZone(element, folderId) {
        element.ondragover = (e) => {
            e.preventDefault();
            element.style.background = '#3d3d55';
        };
        element.ondragleave = () => {
            element.style.background = '#2a2a40';
        };
        element.ondrop = (e) => {
            e.preventDefault();
            element.style.background = '#2a2a40';
            try {
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                if (data.tipo === 'asset_sprite') {
                    const asset = this.editor.assetManager.obterAsset(data.id);
                    if (asset) {
                        asset.folderId = folderId;
                        this.atualizar(); // Re-render tree
                    }
                }
            } catch (err) { console.error(err); }
        };
    }
}

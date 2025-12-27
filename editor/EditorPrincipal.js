
/**
 * EditorPrincipal - Coordenador principal do editor visual
 * Gerencia todos os componentes do editor
 */

import Engine from '../engine/Engine.js';
import Camera from '../engine/Camera.js';
import Entidade from '../entidades/Entidade.js';
import { EntidadeFactory } from '../entidades/EntidadeFactory.js';
import ScriptComponent from '../componentes/ScriptComponent.js';
import { SpriteComponent } from '../componentes/SpriteComponent.js';
import CameraFollowComponent from '../componentes/CameraFollowComponent.js';
import CollisionComponent from '../componentes/CollisionComponent.js';
import TilemapComponent from '../componentes/TilemapComponent.js';
import ParallaxComponent from '../componentes/ParallaxComponent.js';
import DialogueComponent from '../componentes/DialogueComponent.js';
import KillZoneComponent from '../componentes/KillZoneComponent.js';
import CheckpointComponent from '../componentes/CheckpointComponent.js';
import { ParticleEmitterComponent } from '../componentes/ParticleEmitterComponent.js';
import GeradorScript from '../movimentacao/GeradorScript.js';
import { EditorSpriteSheet } from './EditorSpriteSheet.js';
import { EditorAnimation } from './EditorAnimation.js';
import { AssetManager } from './AssetManager.js';
import { PainelAssets } from './PainelAssets.js';
import { TilePalette } from './TilePalette.js';
import { ParticleTemplateManager } from './ParticleTemplateManager.js';
import { EditorParticle } from './EditorParticle.js';
import LightComponent from '../componentes/LightComponent.js';
import LightingSystem from '../sistemas/LightingSystem.js';
import { LightingPresetManager } from './LightingPresetManager.js';
import { EditorLighting } from './EditorLighting.js';

class EditorPrincipal {
    constructor(canvas) {
        this.canvas = canvas;
        this.ajustarTamanhoCanvas();

        // Expor instância globalmente (útil para debug e callbacks HTML)
        window.editor = this;

        // Estado do editor
        this.estadoInicial = null; // Snapshot da cena antes do play
        this.modoEdicao = true; // true = edição, false = play/teste
        this.entidades = [];
        this.entidadeSelecionada = null;
        this.ferramentaAtiva = 'selecionar'; // selecionar, mover, rotacionar, escalar, brush
        this.tileData = null; // Dados do tile para pincel

        // Configurações da Cena (Global)
        this.sceneConfig = {
            backgroundColor: '#0a0a15'
        };

        // Componentes principais
        this.engine = new Engine(canvas);
        this.camera = new Camera(canvas.width, canvas.height);

        // Expor câmera para a engine (para scripts e plugins acessarem)
        this.engine.camera = this.camera;

        // Referências aos painéis
        this.painelHierarquia = null;
        this.painelPropriedades = null;
        this.painelConsole = null;

        // Sistema de Assets
        this.assetManager = new AssetManager(this);
        this.editorSprite = new EditorSpriteSheet(this);
        this.editorAnimation = new EditorAnimation(this);
        this.painelAssets = new PainelAssets(this);

        // Sistema de Tiles
        this.tilePalette = new TilePalette(this);

        // Sistema de Templates de Partículas
        this.particleTemplateManager = new ParticleTemplateManager();
        this.editorParticle = new EditorParticle(this);

        // Sistema de Iluminação
        this.lightingSystem = new LightingSystem(this.engine.renderizador);
        this.engine.lightingSystem = this.lightingSystem;

        // Sistema de Presets e Editor de Iluminação
        this.lightingPresetManager = new LightingPresetManager();
        this.editorLighting = new EditorLighting(this);

        // Expor AssetManager para a engine (para componentes acessarem imagens/sprites)
        this.engine.assetManager = this.assetManager;

        // Expor componentes globalmente para uso em scripts e editor
        window.LightComponent = LightComponent;

        // Expor ParticleEmitterComponent para preview do editor
        window.ParticleEmitterComponent = ParticleEmitterComponent;

        window.editorSprite = this.editorSprite; // Para acesso via onclick HTML
        window.editorAnimation = this.editorAnimation;

        // Estado de interação
        this.ferramentaAtiva = 'selecionar'; // selecionar, mover, rotacionar
        this.arrastando = false;
        this.offsetArrastar = { x: 0, y: 0 };
        this.arrastoCamara = false;
        this.ultimaPosicaoMouse = { x: 0, y: 0 };

        // Configurações do Editor
        this.config = {
            gridSize: 50,
            snapToGrid: true,
            showGrid: true,
            showGrid: true,
            showGizmos: false,
            gameScale: 1.0 // Escala Global (Zoom no Play Mode)
        };

        this.pastas = []; // Lista de pastas { id, nome, aberta }

        // Estado de redimensionamento
        this.redimensionando = false;
        this.handleAtivo = null;
        this.entidadeAoIniciarResize = null; // Snapshot para cálculos precisos

        // Configurar eventos
        this.configurarEventos();
        this.configurarToolbar();
        this.configurarStartup();

        // Iniciar renderização
        this.engine.renderizar = this.renderizar.bind(this);
        this.engine.simulado = false; // Começa pausado (modo edição)
        this.engine.iniciar();

        this.log('Editor Visual inicializado!', 'success');

        // Colapsar console automaticamente para dar mais espaço ao canvas
        setTimeout(() => {
            document.getElementById('painel-console')?.classList.add('collapsed');
        }, 100);

        // Inicializa Paleta de Tiles
        this.tilePalette = new TilePalette(this);

        // Inicializa Editor de SpriteSheet (Animação)
        this.editorSprite = new EditorSpriteSheet(this);
        window.editorSprite = this.editorSprite; // Para callbacks globais do HTML

        // DEBUG: Mensagem visual no canvas
        // DEBUG: Mensagem visual no canvas (Removido)


    }

    /**
     * Ajusta o tamanho do canvas para preencher a área disponível
     */
    ajustarTamanhoCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        if (this.camera) {
            this.camera.atualizarTamanho(this.canvas.width, this.canvas.height);
        }
    }

    /**
     * Configura eventos do canvas e da janela
     */
    configurarEventos() {
        // Redimensionamento da janela
        window.addEventListener('resize', () => {
            this.ajustarTamanhoCanvas();
        });

        // Eventos do mouse no canvas
        this.canvas.addEventListener('mousedown', this.aoClicarMouse.bind(this));
        this.canvas.addEventListener('mousemove', this.aoMoverMouse.bind(this));
        this.canvas.addEventListener('mouseup', this.aoSoltarMouse.bind(this));
        this.canvas.addEventListener('wheel', this.aoRodarRoda.bind(this), { passive: false });

        // Eventos de teclado
        window.addEventListener('keydown', this.aoPressionarTecla.bind(this));

        // Prevenir menu de contexto
        // Prevenir menu de contexto
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Checkbox Manual Injection...
        const btnGizmos = document.getElementById('btn-toggle-gizmos');
        if (btnGizmos) {
            btnGizmos.onclick = (e) => {
                e.stopPropagation(); // Prevent canvas click
                this.config.showGizmos = !this.config.showGizmos;

                const lbl = document.getElementById('lbl-gizmos');
                if (lbl) {
                    lbl.style.color = this.config.showGizmos ? '#4ecdc4' : '#666';
                    btnGizmos.style.borderColor = this.config.showGizmos ? '#4ecdc4' : '#666';
                    btnGizmos.style.opacity = this.config.showGizmos ? '1' : '0.5';
                }
                // Force redraw
                this.renderizar();
            };
        }



        // --- INJECT GAME SCALE UI ---
        const btnPlay = document.getElementById('btn-play');
        if (btnPlay && btnPlay.parentElement && !document.getElementById('inp-game-scale')) {
            const toolbarTop = btnPlay.parentElement;
            const divScale = document.createElement('div');
            divScale.style.display = 'flex';
            divScale.style.alignItems = 'center';
            divScale.style.marginLeft = '15px';
            divScale.style.marginRight = '15px';
            divScale.style.gap = '5px';

            divScale.innerHTML = `
                <span style="color:#aaa; font-size:12px;">🎮 Scale:</span>
                <input type="number" id="inp-game-scale" value="1.0" step="0.1" min="0.1" max="5.0" style="width:50px; background:#222; border:1px solid #444; color:white; padding:2px; text-align:center;">
             `;

            toolbarTop.insertBefore(divScale, btnPlay);

            // Listener
            const inp = divScale.querySelector('input');
            inp.onchange = (e) => {
                this.config.gameScale = parseFloat(e.target.value);
                if (!this.modoEdicao && this.camera) {
                    this.camera.zoom = this.config.gameScale;
                }
            };
        }

        // Drag and Drop (Importação Rápida de Assets)
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.canvas.style.cursor = 'copy';
        });

        this.canvas.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.canvas.style.cursor = 'default';
        });

        this.canvas.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.canvas.style.cursor = 'default';

            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        const nome = file.name.split('.')[0];
                        const asset = this.assetManager.criarSpriteAsset(nome, 'tileset');

                        // Atualizar asset com a imagem carregada
                        const dados = { source: evt.target.result };

                        // Obter dimensões reais
                        const img = new Image();
                        img.onload = () => {
                            dados.imagem = img; // já cacheia
                            this.assetManager.atualizarAsset(asset.id, dados);
                            this.log(`Asset '${nome}' importado com sucesso!`, 'success');

                            // Atualizar painéis
                            if (this.painelAssets) this.painelAssets.atualizar();
                            if (this.tilePalette) this.tilePalette.atualizarListaAssets();

                            // Auto-selecionar na palette
                            if (this.tilePalette) {
                                this.tilePalette.selectAsset.value = asset.id;
                                this.tilePalette.carregarAssetSelecionado();
                                if (this.tilePalette.window.classList.contains('hidden')) {
                                    this.tilePalette.toggle();
                                }
                            }
                        };
                        img.src = evt.target.result;
                    };
                    reader.readAsDataURL(file);
                } else {
                    this.log('Apenas arquivos de imagem são suportados.', 'warning');
                }
            }
        });

        // Header Checkboxes Injection...
        // Como o editor parece não gerar o header HTML aqui, assumimos que os elementos já existem no DOM
        // OU precisamos injetar se o método configurarToolbar interagir com eles.

        // O código anterior mostrava que tentamos substituir um trecho HTML que parecia estar em index.html E NÃO no JS.
        // O arquivo EditorPrincipal.js manipula o DOM, mas não necessariamente cria todo o HTML da página.
        // Vamos verificar configurarStartup() ou onde o HTML é gerado.

        // Se o HTML não está aqui, não podemos dar replace.
        // Vamos apenas adicionar o listener e assumir que o usuário vai ver o checkbox?
        // NÃO. O usuário pediu para criar. Se não existir no HTML, temos que criar.

        // Vamos injetar o checkbox na barra de ferramentas via JS se ele não existir
        const headerTools = document.querySelector('.header-tools') || document.getElementById('toolbar-top');
        // Não sabemos a classe exata. Vamos procurar onde 'btn-save' ou 'chk-grid' está.


        // Detectar saída de tela cheia (ESC) para parar o jogo
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement && !this.modoEdicao) {
                // Se saiu da tela cheia e estava rodando, para o jogo
                this.parar();
            }
        });

        // Configurar resizers dos painéis
        this.configurarResizers();
    }

    /**
     * Configura eventos da toolbar
     */
    configurarToolbar() {
        // Botões de criar entidades
        const dropdownCriar = document.getElementById('dropdown-criar');
        if (dropdownCriar) {
            dropdownCriar.addEventListener('click', (e) => {
                if (e.target.dataset.tipo) {
                    this.criarEntidade(e.target.dataset.tipo);
                }
            });

            // Injetar opção de Tilemap se não existir
            if (!dropdownCriar.querySelector('[data-tipo="tilemap"]')) {
                const btnTile = document.createElement('button');
                btnTile.dataset.tipo = 'tilemap';
                btnTile.textContent = '🧱 Tilemap';
                btnTile.style.borderTop = '1px solid #444'; // Separador visual
                dropdownCriar.appendChild(btnTile);
            }

            // Injetar opção de Inimigo se não existir
            if (!dropdownCriar.querySelector('[data-tipo="inimigo"]')) {
                const btnEnemy = document.createElement('button');
                btnEnemy.dataset.tipo = 'inimigo';
                btnEnemy.textContent = '👾 Inimigo';
                // Inserir antes do Tilemap se possível, ou apenas append
                // Vamos inserir antes do Tilemap para ficar junto dos "atores"
                const tileBtn = dropdownCriar.querySelector('[data-tipo="tilemap"]');
                if (tileBtn) {
                    dropdownCriar.insertBefore(btnEnemy, tileBtn);
                } else {
                    dropdownCriar.appendChild(btnEnemy);
                }
            }
        }

        // Botões de ferramentas
        document.querySelectorAll('[data-tool]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.definirFerramenta(e.currentTarget.dataset.tool);
            });
        });

        // Botão da Janela Flutuante (Hammer)
        document.getElementById('btn-tile-palette')?.addEventListener('click', () => {
            if (this.tilePalette) this.tilePalette.toggle();
        });

        // Botão de fechar paleta (X)
        document.getElementById('btn-close-palette')?.addEventListener('click', () => {
            if (this.tilePalette) this.tilePalette.toggle();
        });

        // Botão Editor de Partículas
        document.getElementById('btn-particle-editor')?.addEventListener('click', () => {
            if (this.editorParticle) this.editorParticle.abrir();
        });

        // Botão Editor de Iluminação
        document.getElementById('btn-lighting-editor')?.addEventListener('click', () => {
            if (this.editorLighting) this.editorLighting.abrir();
        });

        // Botões de play/pause/stop
        document.getElementById('btn-play')?.addEventListener('click', () => this.alternarModo());
        document.getElementById('btn-pause')?.addEventListener('click', () => this.pausar());
        document.getElementById('btn-stop')?.addEventListener('click', () => this.parar());

        // Botões de salvar/exportar
        document.getElementById('btn-new')?.addEventListener('click', () => this.novoProjeto());
        document.getElementById('btn-save')?.addEventListener('click', () => this.salvarProjeto());
        document.getElementById('btn-load')?.addEventListener('click', () => document.getElementById('input-load-project')?.click());
        document.getElementById('input-load-project')?.addEventListener('change', (e) => this.carregarProjeto(e));
        document.getElementById('btn-export')?.addEventListener('click', () => this.exportarProjeto());

        // Botão de Configurações da Cena (Cor de Fundo)
        document.getElementById('btn-scene-settings')?.addEventListener('click', () => this.abrirConfiguracoesCena());

        // Botão de Configurações
        const btnSettings = document.getElementById('btn-settings');
        const modalSettings = document.getElementById('modal-settings');
        const btnCloseSettings = document.getElementById('btn-close-settings');
        const btnApplySettings = document.getElementById('btn-apply-settings');

        if (btnSettings && modalSettings) {
            btnSettings.addEventListener('click', () => {
                modalSettings.classList.remove('hidden');
                // Carregar valores atuais
                document.getElementById('conf-grid-size').value = this.config.gridSize;
                document.getElementById('conf-snap').checked = this.config.snapToGrid;
                document.getElementById('conf-show-grid').checked = this.config.showGrid;
                // Load Gizmos config
                const gizmoCheck = document.getElementById('conf-show-gizmos');
                if (gizmoCheck) gizmoCheck.checked = this.config.showGizmos;
            });

            const fecharModal = () => modalSettings.classList.add('hidden');
            btnCloseSettings?.addEventListener('click', fecharModal);

            btnApplySettings?.addEventListener('click', () => {
                this.config.gridSize = parseInt(document.getElementById('conf-grid-size').value) || 50;
                this.config.snapToGrid = document.getElementById('conf-snap').checked;
                this.config.showGrid = document.getElementById('conf-show-grid').checked;
                this.config.showGizmos = document.getElementById('conf-show-gizmos').checked;
                fecharModal();
                this.log('Configurações aplicadas!', 'success');
            });
        }

        // Toggle do console
        document.getElementById('btn-toggle-console')?.addEventListener('click', () => {
            document.getElementById('painel-console')?.classList.toggle('collapsed');
        });
    }

    /**
     * Configura o modal de startup
     */
    configurarStartup() {
        const modal = document.getElementById('modal-startup');
        const btnNew = document.getElementById('btn-startup-new');
        const btnLoad = document.getElementById('btn-startup-load');
        const inputLoad = document.getElementById('input-load-project');

        if (!modal) return;

        // Novo Projeto (Forçado, sem confirmar pois é startup)
        btnNew?.addEventListener('click', () => {
            this.novoProjeto(false); // false = não confirmar
            modal.classList.add('hidden'); // Ocultar
            modal.style.display = 'none'; // Garantir
        });

        // Carregar Projeto
        btnLoad?.addEventListener('click', () => {
            inputLoad?.click();
        });

        // Ao carregar arquivo (input change), fechar modal
        inputLoad?.addEventListener('change', () => {
            if (inputLoad.files.length > 0) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        });
    }

    /**
     * Configura lógica de redimensionamento dos painéis
     */
    configurarResizers() {
        const setupResize = (resizerId, direction, targetSelector, isInverse = false) => {
            const resizer = document.getElementById(resizerId);
            const target = document.querySelector(targetSelector);
            if (!resizer || !target) return;

            let startSize, startPos;

            const onMouseMove = (e) => {
                const currentPos = direction === 'horizontal' ? e.clientY : e.clientX;
                const delta = currentPos - startPos;
                const newSize = isInverse ? startSize - delta : startSize + delta;

                // Limites mínimos
                if (newSize < 100) return;

                if (direction === 'horizontal') target.style.height = `${newSize}px`;
                else target.style.width = `${newSize}px`;

                this.ajustarTamanhoCanvas();
            };

            const onMouseUp = () => {
                document.body.classList.remove('resizing-row', 'resizing-col');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            const onMouseDown = (e) => {
                e.preventDefault();
                document.body.classList.add(direction === 'horizontal' ? 'resizing-row' : 'resizing-col');
                startSize = direction === 'horizontal' ? target.offsetHeight : target.offsetWidth;
                startPos = direction === 'horizontal' ? e.clientY : e.clientX;

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            };

            resizer.addEventListener('mousedown', onMouseDown);
        };

        // Sidebar Esquerda (Arrastar p/ direita aumenta)
        setupResize('resizer-left', 'vertical', '.sidebar-left', false);

        // Sidebar Direita (Arrastar p/ esquerda aumenta)
        setupResize('resizer-right', 'vertical', '.painel-propriedades', true);

        // Console (Arrastar p/ cima aumenta)
        // O console fica no fundo, resizer em cima. Arrastar p/ baixo diminui height. (Delta positivo -> height menor)
        // Wait, Delta = Current(High) - Start(Low) = Positive. Height deve diminuir.
        // Formula: New = Start - Delta. (Start 200 - 10 = 190). OK.
        setupResize('resizer-console', 'horizontal', '.painel-console', true);
    }

    /**
     * Cria uma nova entidade
     */
    criarEntidade(tipo) {
        // Calcula posição no centro da tela (mundo)
        const centroTela = this.camera.telaParaMundo(
            this.canvas.width / 2,
            this.canvas.height / 2
        );

        // Usa a Factory para criar a entidade já configurada
        // Ajustamos X e Y para centrar (assumindo tamanho padrão ~64)
        const entidade = EntidadeFactory.criar(
            tipo,
            centroTela.x - 32,
            centroTela.y - 32
        );

        // Tenta colocar na pasta "Cena 01" por padrão (Solicitação UX)
        // Se for Tilemap, FORÇA a criação da pasta se não existir
        let pastaCena = this.pastas.find(p => p.nome === 'Cena 01' || p.nome === 'Cena_01');

        if (!pastaCena && (tipo === 'tilemap' || this.entidades.length === 0)) {
            // Cria a pasta automaticamente se for o primeiro item ou se for Tilemap
            pastaCena = {
                id: 'folder-' + Date.now(),
                nome: 'Cena 01',
                aberta: true
            };
            this.pastas.push(pastaCena);
            this.log('Pasta "Cena 01" criada automaticamente.', 'info');
        }

        if (pastaCena) {
            entidade.pastaId = pastaCena.id;
        }

        // Adicionar à lista de entidades
        this.entidades.push(entidade);
        this.engine.adicionarEntidade(entidade);

        // Automático: Criar Asset de Animação para Player e NPC
        if ((tipo === 'player' || tipo === 'npc') && this.assetManager) {
            const nomeAsset = tipo === 'player' ? 'Asset Player' : 'Asset NPC ' + Math.floor(Math.random() * 1000);
            const novoAsset = this.assetManager.criarSpriteAsset(nomeAsset, 'animacao');

            if (novoAsset) {
                // Setup de animações padrão
                novoAsset.animacoes['idle'] = [];
                novoAsset.animacoes['walk'] = [];

                if (tipo === 'player') {
                    novoAsset.animacoes['run'] = [];
                    novoAsset.animacoes['jump'] = [];
                    novoAsset.animacoes['fall'] = [];
                } else {
                    // NPC pode ter attack ou outros
                    novoAsset.animacoes['attack'] = [];
                }

                // Vincula ao componente de sprite
                const spriteComp = entidade.obterComponente('SpriteComponent');
                if (spriteComp) {
                    spriteComp.assetId = novoAsset.id;
                    spriteComp.atualizar(entidade, 0);
                    this.log('Asset de animação vinculado automaticamente', 'success');
                }

                if (this.painelAssets) this.painelAssets.atualizar();
            }
        }

        // Selecionar automaticamente
        this.selecionarEntidade(entidade);

        // Atualizar interface
        this.atualizarHierarquia();
        this.atualizarContadorEntidades();

        this.log('Entidade ' + tipo + ' criada: ' + entidade.nome, 'success');

        return entidade;
    }

    /**
     * Seleciona uma entidade
     */
    selecionarEntidade(entidade) {
        // Desseleciona a anterior
        if (this.entidadeSelecionada) {
            this.entidadeSelecionada.selecionado = false;
        }

        this.entidadeSelecionada = entidade;
        if (entidade) {
            entidade.selecionado = true;
            this.atualizarPainelPropriedades();
        }

        this.atualizarHierarquia();
    }

    /**
     * Remove a entidade selecionada
     */
    removerEntidadeSelecionada() {
        if (!this.entidadeSelecionada) return;

        const index = this.entidades.indexOf(this.entidadeSelecionada);
        if (index > -1) {
            this.entidades.splice(index, 1);
            this.engine.entidades = this.engine.entidades.filter(e => e !== this.entidadeSelecionada);

            this.log('Entidade removida: ' + this.entidadeSelecionada.nome, 'info');

            this.entidadeSelecionada = null;
            this.atualizarHierarquia();
            this.atualizarPainelPropriedades();
            this.atualizarContadorEntidades();
        }
    }

    ativarFerramentaBrush(tileData) {
        this.tileData = tileData;
        this.definirFerramenta('brush');
        this.log('Pincel: Tile selecionado (' + tileData.x + ',' + tileData.y + ')', 'info');
    }

    ativarFerramentaBrush(tileData) {
        this.tileData = tileData;
        this.definirFerramenta('brush');
        this.log('Pincel: Tile selecionado (' + tileData.x + ',' + tileData.y + ')', 'info');
    }

    /**
     * Define a ferramenta ativa
     */
    definirFerramenta(ferramenta) {
        this.ferramentaAtiva = ferramenta;
        this.canvas.style.cursor = ferramenta === 'selecionar' ? 'default' :
            ferramenta === 'mover' ? 'move' :
                ferramenta === 'brush' ? 'crosshair' : 'default'; // Cursor crosshair para brush

        // Atualizar visual dos botões
        document.querySelectorAll('.btn-tool').forEach(btn => {
            if (btn.dataset.tool === ferramenta) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Se for brush, highlight no botão Tile Palette também se existir
        if (ferramenta === 'brush') {
            const btnTile = document.getElementById('btn-tile-palette');
            if (btnTile) btnTile.classList.add('active');
        }

        this.log('Ferramenta: ' + ferramenta, 'info');
    }

    /**
     * Ativa a ferramenta Brush com os dados do tile selecionado
     */
    ativarFerramentaBrush(tileData) {
        this.tileData = tileData;
        this.definirFerramenta('brush');
        this.log('Pincel ativado: Tile selecionado', 'info');
    }

    /**
     * Alterna entre modo de edição e modo de teste
     */
    alternarModo() {
        this.modoEdicao = !this.modoEdicao;

        const btnPlay = document.getElementById('btn-play');
        const btnPause = document.getElementById('btn-pause');
        const btnStop = document.getElementById('btn-stop');
        const modoAtual = document.getElementById('modo-atual');

        if (this.modoEdicao) {
            // -- VOLTANDO PARA MODO EDIÇÃO (STOP) --
            btnPlay?.classList.remove('hidden');
            btnPause?.classList.add('hidden');
            btnStop?.classList.add('hidden');
            if (modoAtual) modoAtual.textContent = 'Edição';

            this.engine.simulado = false; // Pausa física

            // Restaurar estado inicial
            if (this.estadoInicial) {
                this.restaurarEstadoInicial();
            }

            this.log('Modo de edição restaurado', 'info');

            // Sair de tela cheia se estiver
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => console.warn(err));
            }
        } else {
            // -- INDO PARA MODO TESTE (PLAY) --

            // Salvar estado inicial ANTES de começar a física
            this.salvarEstadoInicial();

            // Aplicar Zoom configurado para o Jogo
            if (this.camera) {
                this.camera.zoom = this.config.gameScale || 1.0;

                // Auto-Focus no Player se existir
                const player = this.entidades.find(e => e.nome.includes('Player'));
                if (player) {
                    const centro = player.obterCentro();

                    // Força a câmera a centralizar IMEDIATAMENTE
                    if (this.camera.centralizarEm) {
                        this.camera.centralizarEm(centro.x, centro.y);
                    }
                }
            }

            btnPlay?.classList.add('hidden');
            btnPause?.classList.remove('hidden');
            btnStop?.classList.remove('hidden');
            if (modoAtual) modoAtual.textContent = 'Teste';

            this.engine.simulado = true; // Inicia física
            this.log('Modo de teste ativado - execute o jogo!', 'success');

            // Focar o canvas para capturar teclado imediatamente
            this.canvas.focus();

            // Tenta entrar em tela cheia para imersão total (solicitado pelo usuário)
            const container = this.canvas.parentElement;
            if (container.requestFullscreen) {
                container.requestFullscreen().catch(err => {
                    console.warn('Erro ao tentar tela cheia: ' + err.message);
                });
            }
        }
    }

    /**
     * Pausa o jogo
     */
    pausar() {
        this.engine.simulado = !this.engine.simulado;

        const btnPause = document.getElementById('btn-pause');
        if (btnPause) {
            btnPause.textContent = this.engine.simulado ? '⏸ Pause' : '▶ Resume';
            // Visualmente indicar estado de pausa
            btnPause.style.background = this.engine.simulado ? '#ffd93d' : '#fff';
        }

        this.log(this.engine.simulado ? 'Jogo resumido' : 'Jogo pausado', 'info');
    }

    /**
     * Para o jogo e volta ao modo de edição
     */
    parar() {
        if (!this.modoEdicao) {
            this.alternarModo();
        }
    }

    /**
     * Pinta um tile na posição do mundo
     */
    pintarTile(worldX, worldY) {
        // Encontrar o Tilemap alvo (o selecionado)
        let tilemapEnt = null;

        // 1. Tentar obter o Tilemap alvo EXPLICITAMENTE definido na Paleta de Tiles (Override)
        const targetLayerSelect = document.getElementById('tile-target-layer');
        if (targetLayerSelect && targetLayerSelect.value) {
            const targetId = targetLayerSelect.value;
            tilemapEnt = this.entidades.find(e => e.id === targetId);
        }

        // 2. Fallback: Usar entidade selecionada se não houver override
        if (!tilemapEnt) {
            tilemapEnt = this.entidadeSelecionada;
        }

        let tileComp = tilemapEnt ? tilemapEnt.obterComponente('TilemapComponent') : null;

        // SELEÇÃO RIGOROSA: Se a entidade selecionada NÃO tem Tilemap, não tentamos adivinhar outra.
        if (!tileComp) {
            // Tenta achar qualquer Tilemap APENAS se nada estiver selecionado E nenhum target definido
            if (!this.entidadeSelecionada && !targetLayerSelect?.value) {
                tilemapEnt = this.entidades.find(e => e.obterComponente('TilemapComponent'));
                tileComp = tilemapEnt ? tilemapEnt.obterComponente('TilemapComponent') : null;
            }
        }

        if (!tileComp || !tilemapEnt) {
            // AUTO-CREATE apenas se realmente não existir mapa algum
            if (this.entidades.filter(e => e.obterComponente('TilemapComponent')).length === 0) {
                console.log('DEBUG: Auto-criando Tilemap padrão...');
                const novaEntidade = new Entidade('Grid Mapa');
                novaEntidade.adicionarComponente('TilemapComponent', new TilemapComponent());

                const pastaCena = this.pastas.find(p => p.nome === 'Cena 01' || p.nome === 'Cena_01');
                if (pastaCena) novaEntidade.pastaId = pastaCena.id;
                else {
                    const novaPasta = { id: 'folder-' + Date.now(), nome: 'Cena 01', aberta: true };
                    this.pastas.push(novaPasta);
                    novaEntidade.pastaId = novaPasta.id;
                }

                this.entidades.push(novaEntidade);
                this.engine.adicionarEntidade(novaEntidade);
                this.atualizarHierarquia();
                this.atualizarContadorEntidades();
                this.selecionarEntidade(novaEntidade);
                tilemapEnt = novaEntidade;
                tileComp = tilemapEnt.obterComponente('TilemapComponent');
                this.log('✨ Tilemap criado automaticamente!', 'success');
            } else {
                // Tem tilemap mas não está selecionado
                this.log('⚠ Selecione um Tilemap ("Pintar em") para editar.', 'warning');
                return;
            }
        }

        // Calcular Grid Relativo
        const size = tileComp.tileSize || 32;
        const localX = worldX - tilemapEnt.x;
        const localY = worldY - tilemapEnt.y;
        const gridX = Math.floor(localX / size);
        const gridY = Math.floor(localY / size);

        // --- SOLIDIFIER TOOL LOGIC (TOGGLE) ---
        if (this.ferramentaAtiva === 'solidify') {
            const existingTile = tileComp.getTile(gridX, gridY);
            let isActive = false;

            if (existingTile) {
                // Se for objeto, checa solid. se string, assume falso (legacy) ou true? string é assetId só.
                if (typeof existingTile === 'object') isActive = !!existingTile.solid;
                else isActive = false;
            }

            // Toggle
            const newSolidState = !isActive;

            if (existingTile) {
                let newData = (typeof existingTile === 'string')
                    ? { assetId: existingTile, solid: newSolidState }
                    : { ...existingTile, solid: newSolidState };
                tileComp.setTile(gridX, gridY, newData);
            } else {
                // Tile invisível sólido
                if (newSolidState) tileComp.setTile(gridX, gridY, { solid: true });
                else tileComp.setTile(gridX, gridY, null); // Remove se toggle off no vazio
            }
            // Feedback Visual Rápido? O debug desenha.
            return;
        }

        // --- BRUSH / ERASER LOGIC ---

        // Multi-Tile Painting (Big Brush)
        if (this.tileData && this.tileData.rows && this.tileData.cols) {
            const startX = this.tileData.x; // Source X na textura
            const startY = this.tileData.y;

            for (let r = 0; r < this.tileData.rows; r++) {
                for (let c = 0; c < this.tileData.cols; c++) {
                    const targetGX = gridX + c;
                    const targetGY = gridY + r;

                    const sourceX = startX + (c * size);
                    const sourceY = startY + (r * size);

                    // Clona dados base e atualiza source rect
                    const tileToSet = {
                        ...this.tileData,
                        x: sourceX,
                        y: sourceY,
                        w: size,
                        h: size,
                        // Remove metadados do brush
                        rows: undefined,
                        cols: undefined
                    };

                    tileComp.setTile(targetGX, targetGY, tileToSet);
                }
            }
        } else {
            // Single Tile Paint or Eraser (this.tileData is null)
            if (this.tileData) {
                // Pintar uníco (mas garantindo source rect se tiver vindo do palette selection simples)
                tileComp.setTile(gridX, gridY, this.tileData);
            } else {
                // Eraser
                tileComp.setTile(gridX, gridY, null);
            }
        }
    }

    /**
     * Evento: Clique do mouse
     */
    aoClicarMouse(evento) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = evento.clientX - rect.left;
        const mouseY = evento.clientY - rect.top;

        // Converter para coordenadas do mundo
        const mundoPos = this.camera.telaParaMundo(mouseX, mouseY);

        // Botão direito ou middle = arrastar câmera
        if (evento.button === 1 || evento.button === 2) {
            this.arrastoCamara = true;
            this.ultimaPosicaoMouse = { x: mouseX, y: mouseY };
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        // Botão esquerdo
        // Botão esquerdo
        if (evento.button === 0 && this.modoEdicao) {

            // FERRAMENTA BRUSH (Pincel de Tiles) ou SOLIDIFY
            if (this.ferramentaAtiva === 'brush' || this.ferramentaAtiva === 'solidify') {
                // console.log(`[TILE DEBUG] Click com ${this.ferramentaAtiva}. tileData:`, this.tileData);
                // Permite se for solidify OU se tileData existir OU se for borracha (tileData é null mas a ferramenta é brush)
                // Na prática, se tool == brush, pode ser null (borracha) ou objeto (pincel)
                this.pintarTile(mundoPos.x, mundoPos.y);
                return;
            }

            // PRIORIDADE: Verificar handles da entidade selecionada (antes de selecionar outra)
            if (this.entidadeSelecionada && !this.entidadeSelecionada.locked) {
                const handle = this.entidadeSelecionada.verificarHandle(mundoPos.x, mundoPos.y);
                if (handle) {
                    this.redimensionando = true;
                    this.handleAtivo = handle;
                    this.entidadeAoIniciarResize = {
                        x: this.entidadeSelecionada.x,
                        y: this.entidadeSelecionada.y,
                        w: this.entidadeSelecionada.largura,
                        h: this.entidadeSelecionada.altura,
                        rot: this.entidadeSelecionada.rotacao // Snapshot rotacao
                    };
                    this.log(`Transformando: ${handle} `, 'info');
                    return;
                }
            }

            // Verificar se clicou em alguma entidade (ordem reversa = entidades do topo primeiro)
            let entidadeClicada = null;
            for (let i = this.entidades.length - 1; i >= 0; i--) {
                if (this.entidades[i].contemPonto(mundoPos.x, mundoPos.y)) {
                    entidadeClicada = this.entidades[i];
                    break;
                }
            }

            if (entidadeClicada) {
                if (!entidadeClicada.locked) {
                    this.selecionarEntidade(entidadeClicada);

                    // Verifica se clicou em um HANDLE de redimensionamento
                    const handle = entidadeClicada.verificarHandle(mundoPos.x, mundoPos.y);
                    if (handle) {
                        this.redimensionando = true;
                        this.handleAtivo = handle;
                        this.entidadeAoIniciarResize = {
                            x: entidadeClicada.x,
                            y: entidadeClicada.y,
                            w: entidadeClicada.largura,
                            h: entidadeClicada.altura
                        };
                        this.log(`Redimensionando: ${handle} `, 'info');
                        return; // Evita iniciar arrasto junto
                    }

                    // Permite arrastar se estiver na ferramenta mover OU selecionar (padrão)
                    if (this.ferramentaAtiva === 'mover' || this.ferramentaAtiva === 'selecionar') {
                        this.arrastando = true;
                        this.offsetArrastar = {
                            x: mundoPos.x - entidadeClicada.x,
                            y: mundoPos.y - entidadeClicada.y
                        };
                    }
                }
            } else {
                // Clicou no vazio - desseleciona
                this.selecionarEntidade(null);
                this.atualizarPainelPropriedades();
            }
        }
    }

    /**
     * Evento: Mover mouse
     */
    aoMoverMouse(evento) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = evento.clientX - rect.left;
        const mouseY = evento.clientY - rect.top;

        // Arrastar câmera
        if (this.arrastoCamara) {
            const deltaX = this.ultimaPosicaoMouse.x - mouseX;
            const deltaY = this.ultimaPosicaoMouse.y - mouseY;
            this.camera.mover(deltaX, deltaY);
            this.ultimaPosicaoMouse = { x: mouseX, y: mouseY };
            return;
        }

        // Pincel ou Solidify (Arrastar)
        if ((this.ferramentaAtiva === 'brush' || this.ferramentaAtiva === 'solidify') && evento.buttons === 1) { // 1 = Left Mouse
            const mundoPos = this.camera.telaParaMundo(mouseX, mouseY);
            this.pintarTile(mundoPos.x, mundoPos.y);
            return;
        }

        // Redimensionar entidade
        if (this.redimensionando && this.entidadeSelecionada) {
            const mundoPos = this.camera.telaParaMundo(mouseX, mouseY);
            const ent = this.entidadeSelecionada;
            const inicio = this.entidadeAoIniciarResize; // Snapshot inicial

            // Função auxiliar de snap
            const snap = (valor) => {
                if (!this.config.snapToGrid) return valor;
                const size = this.config.gridSize;
                return Math.round(valor / size) * size;
            };

            // Cálculos baseados no handle (COM SNAP)
            if (this.handleAtivo === 'rot') {
                // ROTAÇÃO
                const centroX = ent.x + ent.largura / 2;
                const centroY = ent.y + ent.altura / 2;

                // Atan2 retorna ângulo em radianos (-PI a PI)
                // Ajustamos +PI/2 pois o handle é topo (0,-1)
                let angle = Math.atan2(mundoPos.y - centroY, mundoPos.x - centroX) + Math.PI / 2;

                // Snap de 15 graus com Shift
                if (evento.shiftKey) {
                    const deg = angle * (180 / Math.PI);
                    const snapStep = 15;
                    angle = Math.round(deg / snapStep) * snapStep * (Math.PI / 180);
                }

                ent.rotacao = angle;

            } else if (this.handleAtivo === 'br') { // Bottom-Right
                ent.largura = Math.max(10, snap(mundoPos.x - inicio.x));
                ent.altura = Math.max(10, snap(mundoPos.y - inicio.y));
            } else if (this.handleAtivo === 'bl') { // Bottom-Left
                // Lógica simplificada para snap no resize esquerdo é complexa, 
                // aplicando snap apenas no tamanho final ou posição final
                const novaLargura = Math.max(10, inicio.x + inicio.w - mundoPos.x);
                ent.largura = snap(novaLargura);
                ent.x = inicio.x + inicio.w - ent.largura; // Recalcula X baseado no snap da largura
                ent.altura = Math.max(10, snap(mundoPos.y - inicio.y));
            } else if (this.handleAtivo === 'tr') { // Top-Right
                ent.largura = Math.max(10, snap(mundoPos.x - inicio.x));
                const novaAltura = Math.max(10, inicio.y + inicio.h - mundoPos.y);
                ent.altura = snap(novaAltura);
                ent.y = inicio.y + inicio.h - ent.altura;
            } else if (this.handleAtivo === 'tl') { // Top-Left
                const novaLargura = Math.max(10, inicio.x + inicio.w - mundoPos.x);
                ent.largura = snap(novaLargura);
                ent.x = inicio.x + inicio.w - ent.largura;

                const novaAltura = Math.max(10, inicio.y + inicio.h - mundoPos.y);
                ent.altura = snap(novaAltura);
                ent.y = inicio.y + inicio.h - ent.altura;
            }

            this.atualizarPainelPropriedades();
            return;
        }

        // Arrastar entidade
        if (this.arrastando && this.entidadeSelecionada && !this.entidadeSelecionada.locked) {
            const mundoPos = this.camera.telaParaMundo(mouseX, mouseY);
            let novoX = mundoPos.x - this.offsetArrastar.x;
            let novoY = mundoPos.y - this.offsetArrastar.y;

            // SNAP TO GRID
            if (this.config.snapToGrid) {
                const size = this.config.gridSize;
                novoX = Math.round(novoX / size) * size;
                novoY = Math.round(novoY / size) * size;
            }

            this.entidadeSelecionada.x = novoX;
            this.entidadeSelecionada.y = novoY;
            this.atualizarPainelPropriedades();
            return;
        }

        // -- MUDANÇA DE CURSOR (HOVER) --
        if (this.entidadeSelecionada && !this.redimensionando && !this.arrastando) {
            const mundoPos = this.camera.telaParaMundo(mouseX, mouseY);
            const handle = this.entidadeSelecionada.verificarHandle(mundoPos.x, mundoPos.y);

            if (handle) {
                if (handle === 'rot') {
                    this.canvas.style.cursor = 'grab'; // Cursor de rotação
                } else if (handle === 'tl' || handle === 'br') {
                    this.canvas.style.cursor = 'nwse-resize';
                } else {
                    this.canvas.style.cursor = 'nesw-resize';
                }
            } else {
                // Se estiver dentro da entidade, cursor de mover
                if (this.entidadeSelecionada.contemPonto(mundoPos.x, mundoPos.y)) {
                    this.canvas.style.cursor = 'move';
                } else {
                    this.canvas.style.cursor = 'default';
                }
            }
        } else if (!this.redimensionando && !this.arrastando) {
            this.canvas.style.cursor = 'default';
        }
    }

    /**
     * Evento: Soltar mouse
     */
    aoSoltarMouse(evento) {
        this.arrastando = false;
        this.redimensionando = false;
        this.handleAtivo = null;
        this.arrastoCamara = false;
        this.canvas.style.cursor = 'crosshair';
    }

    /**
     * Evento: Roda do mouse (zoom)
     */
    aoRodarRoda(evento) {
        evento.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = evento.clientX - rect.left;
        const mouseY = evento.clientY - rect.top;

        const delta = evento.deltaY > 0 ? -0.025 : 0.025;
        this.camera.aumentarZoom(delta, { x: mouseX, y: mouseY });

        // Atualizar UI
        const zoomLevel = document.getElementById('zoom-level');
        if (zoomLevel) {
            zoomLevel.textContent = this.camera.obterPercentualZoom() + '%';
        }
    }

    /**
     * Evento: Pressionar tecla
     */
    aoPressionarTecla(evento) {
        // Delete: remover entidade selecionada
        if (evento.key === 'Delete' && this.entidadeSelecionada) {
            this.removerEntidadeSelecionada();
        }

        // Ctrl+S: Salvar
        if (evento.ctrlKey && evento.key === 's') {
            evento.preventDefault();
            this.salvarProjeto();
        }

        // Atalhos de ferramentas
        if (evento.key === 'v' || evento.key === 'V') {
            this.definirFerramenta('selecionar');
        }
        if (evento.key === 'g' || evento.key === 'G') {
            this.definirFerramenta('mover');
        }
        if (evento.key === 'b' || evento.key === 'B') {
            // Se tiver dados de tile, volta pro brush
            if (this.tileData) this.definirFerramenta('brush');
        }
    }

    /**
     * Renderiza o editor
     */
    renderizar() {
        const ctx = this.canvas.getContext('2d');
        const renderizador = this.engine.renderizador;

        // CRÍTICO: Injetar AssetManager no renderizador para componentes (Tilemap) usarem
        if (renderizador) {
            if (!renderizador.assetManager) {
                renderizador.assetManager = this.assetManager;
            }
            // Injetar flag de debug (Gizmos)
            renderizador.debugMode = this.config.showGizmos;
        }

        // Limpar canvas
        ctx.fillStyle = this.sceneConfig.backgroundColor || '#0a0a15';

        // SAFETY CHECK: Camera NaN Recovery
        if (isNaN(this.camera.x) || isNaN(this.camera.y) || isNaN(this.camera.zoom)) {
            console.error('CRITICAL: Camera corrupted (NaN). Resetting camera.');
            this.camera.resetar();
            // Force valid size
            this.camera.atualizarTamanho(this.canvas.width, this.canvas.height);
        }
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Sync Game Renderer Background
        if (renderizador) {
            renderizador.definirCorFundo(this.sceneConfig.backgroundColor || '#0a0a15');
        }

        // SYNC: Garantir que o renderizador saiba onde a câmera está (para o Parallax e outros)
        if (this.camera) {
            renderizador.camera.x = this.camera.x;
            renderizador.camera.y = this.camera.y;
            // Se o renderizador suportar zoom/width/height no futuro, sync aqui também
            renderizador.camera.width = this.canvas.width;
            renderizador.camera.height = this.canvas.height;
            renderizador.camera.zoom = this.camera.zoom || 1;
        }

        // Aplicar transformação da câmera
        this.camera.aplicarTransformacao(ctx);

        // Desenhar grid de fundo (apenas no modo edição e se estiver ativado)
        if (this.modoEdicao && this.config.showGrid) {
            this.desenharGrid(renderizador);
        }

        // Renderizar todas as entidades
        const listaEntidades = (!this.modoEdicao && this.engine.entidades) ? this.engine.entidades : this.entidades;

        // Ordenar para exibição (Z-Index)
        // Nota: Criamos uma cópia para não alterar a ordem "lógica" ou a ordem da lista do editor
        const listaRender = [...listaEntidades].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

        for (const entidade of listaRender) {
            entidade.renderizar(renderizador, this.modoEdicao);
        }

        // Renderizar iluminação (se ativo)
        if (this.lightingSystem && this.lightingSystem.ativo) {
            this.lightingSystem.renderizar(listaEntidades, this.camera);
        }

        // Remover transformação da câmera
        this.camera.removerTransformacao(ctx);

        // Atualizar FPS
        this.atualizarFPS();
    }

    /**
     * Desenha o grid de fundo
     */
    desenharGrid(renderizador) {
        const tamanhoGrid = this.config.gridSize || 50;
        const cor = '#1a1a2e';
        const ctx = renderizador.ctx;

        // Calcular área visível
        const topLeft = this.camera.telaParaMundo(0, 0);
        const bottomRight = this.camera.telaParaMundo(this.canvas.width, this.canvas.height);

        const startX = Math.floor(topLeft.x / tamanhoGrid) * tamanhoGrid;
        const startY = Math.floor(topLeft.y / tamanhoGrid) * tamanhoGrid;
        const endX = Math.ceil(bottomRight.x / tamanhoGrid) * tamanhoGrid;
        const endY = Math.ceil(bottomRight.y / tamanhoGrid) * tamanhoGrid;

        ctx.strokeStyle = cor;
        ctx.lineWidth = 1;
        ctx.beginPath();

        // Linhas verticais
        for (let x = startX; x <= endX; x += tamanhoGrid) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }

        // Linhas horizontais
        for (let y = startY; y <= endY; y += tamanhoGrid) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }

        ctx.stroke();

        // Eixos principais (0, 0)
        ctx.strokeStyle = '#2a2a4a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, startY);
        ctx.lineTo(0, endY);
        ctx.moveTo(startX, 0);
        ctx.lineTo(endX, 0);
        ctx.stroke();
    }

    /**
     * Atualiza contador de FPS
     */
    atualizarFPS() {
        // Implementação simples - a Engine já calcula o deltaTime
        // Aqui podemos adicionar uma média móvel se necessário
    }

    /**
     * Atualiza a hierarquia de entidades
     */
    setupDragDrops(item, id, tipo) {
        item.draggable = true;
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({ id: id, tipo: tipo }));
            e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault(); // Permitir drop
            item.classList.add('drag-over');
        });

        item.addEventListener('dragleave', (e) => {
            item.classList.remove('drag-over');
        });

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            item.classList.remove('drag-over');
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            this.processarDrop(data, id, tipo);
        });
    }

    processarDrop(origem, destinoId, destinoTipo) {
        if (origem.tipo === 'entidade') {
            const entidade = this.entidades.find(e => e.id === origem.id);
            if (!entidade) return;

            if (destinoTipo === 'pasta') {
                entidade.pastaId = destinoId;
                this.log('Entidade movida para pasta', 'success');
            } else if (destinoTipo === 'root') {
                entidade.pastaId = null;
                this.log('Entidade movida para raiz', 'success');
            }
            this.atualizarHierarquia();
            this.atualizarPainelPropriedades();
        }
    }

    criarPasta(nome = 'Nova Pasta', parentId = null) {
        const id = 'pasta_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        this.pastas.push({
            id: id,
            nome: nome,
            parentId: parentId, // Suporte a aninhamento
            aberta: true
        });
        this.atualizarHierarquia();
    }

    removerPasta(id) {
        if (!confirm('Tem certeza que deseja apagar esta pasta? As entidades voltarão para a raiz/pai.')) return;

        // 1. Achar a pasta
        const pasta = this.pastas.find(p => p.id === id);
        if (!pasta) return;

        // 2. Mover entidades desta pasta para o pai (ou null/raiz)
        const parentId = pasta.parentId || null;
        this.entidades.forEach(ent => {
            if (ent.pastaId === id) ent.pastaId = parentId;
        });

        // 3. Mover subpastas para o pai (ou null/raiz)
        this.pastas.forEach(p => {
            if (p.parentId === id) p.parentId = parentId;
        });

        // 4. Remover a pasta da lista
        this.pastas = this.pastas.filter(p => p.id !== id);

        this.atualizarHierarquia();
    }

    /**
     * Atualiza a hierarquia de entidades com pastas aninhadas
     */
    atualizarHierarquia() {
        const hierarquiaTree = document.getElementById('hierarquia-tree');
        if (!hierarquiaTree) return;

        // --- SETUP HEADER (Botão Nova Pasta Raiz) ---
        const header = document.querySelector('.painel-hierarquia .painel-header');
        if (header && !header.querySelector('.btn-nova-pasta')) {
            const actionArea = document.createElement('div');
            actionArea.style.display = 'flex';
            actionArea.style.gap = '5px';

            const btnNovaPasta = document.createElement('button');
            btnNovaPasta.className = 'btn-nova-pasta';
            btnNovaPasta.innerHTML = '📁+';
            btnNovaPasta.title = 'Criar Nova Pasta na Raiz';
            btnNovaPasta.style.cursor = 'pointer';
            btnNovaPasta.style.background = 'transparent';
            btnNovaPasta.style.border = 'none';
            btnNovaPasta.style.color = '#fff';

            btnNovaPasta.onclick = () => {
                const nome = prompt('Nome da pasta:', 'Nova Area');
                if (nome) this.criarPasta(nome, null);
            };

            // Insere antes do botão collapse
            const btnCollapse = header.querySelector('.btn-collapse');
            header.insertBefore(actionArea, btnCollapse);
            actionArea.appendChild(btnNovaPasta);
        }

        hierarquiaTree.innerHTML = '';

        // 1. Identificar pastas raiz
        const rootFolders = this.pastas.filter(p => !p.parentId);

        // 2. Renderizar recursivamente
        rootFolders.forEach(pasta => {
            hierarquiaTree.appendChild(this._renderizarPastaRecursiva(pasta));
        });

        // 3. Renderizar Entidades Soltas (Sem pasta)
        const rootEntities = this.entidades.filter(e => !e.pastaId);
        rootEntities.forEach(ent => {
            hierarquiaTree.appendChild(this.criarElementoArvoreEntidade(ent));
        });

        // Setup geral de Drop na raiz (vazio no final)
        const dropRoot = document.createElement('div');
        dropRoot.style.height = '20px';
        dropRoot.style.flex = '1';
        this.setupDragDrops(dropRoot, null, 'root');
        hierarquiaTree.appendChild(dropRoot);
    }

    /**
     * Helper recursivo para desenhar pastas
     */
    _renderizarPastaRecursiva(pasta) {
        // Container
        const folderContainer = document.createElement('div');
        folderContainer.className = 'tree-folder-container';
        folderContainer.style.marginLeft = '10px';
        folderContainer.style.borderLeft = '1px solid #333';
        folderContainer.style.paddingLeft = '5px';

        // Cabeçalho da Pasta
        const folderHeader = document.createElement('div');
        folderHeader.className = 'tree-item folder-header';
        folderHeader.style.display = 'flex';
        folderHeader.style.alignItems = 'center';
        folderHeader.style.justifyContent = 'space-between';
        folderHeader.style.color = '#ffd700';
        folderHeader.style.cursor = 'pointer';
        folderHeader.style.padding = '2px 5px';
        folderHeader.style.marginBottom = '2px';
        folderHeader.style.background = '#1e1e2e';
        folderHeader.style.borderRadius = '4px';

        // Conteúdo do Header (Nome e Ícone)
        const leftSide = document.createElement('div');
        leftSide.innerHTML = `<span class="tree-icon">${pasta.aberta ? '📂' : '📁'}</span> <span class="tree-label">${pasta.nome}</span>`;
        leftSide.onclick = (e) => {
            e.stopPropagation();
            pasta.aberta = !pasta.aberta;
            this.atualizarHierarquia();
        };
        folderHeader.appendChild(leftSide);

        // Ações da Pasta (Add Subfolder, Remove)
        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '5px';

        // Botão + (Subpasta)
        const btnAddSub = document.createElement('span');
        btnAddSub.innerText = '+';
        btnAddSub.title = 'Criar Subpasta';
        btnAddSub.style.fontSize = '12px';
        btnAddSub.style.color = '#4ecdc4';
        btnAddSub.onclick = (e) => {
            e.stopPropagation();
            const nome = prompt(`Nova pasta dentro de ${pasta.nome}:`, 'Sub Pasta');
            if (nome) {
                this.criarPasta(nome, pasta.id);
                pasta.aberta = true;
            }
        };

        // Botão x (Remover)
        const btnDel = document.createElement('span');
        btnDel.innerText = 'x';
        btnDel.title = 'Apagar Pasta';
        btnDel.style.fontSize = '10px';
        btnDel.style.color = '#ff4444';
        btnDel.style.marginLeft = '5px';
        btnDel.onclick = (e) => {
            e.stopPropagation();
            this.removerPasta(pasta.id);
        };

        actions.appendChild(btnAddSub);
        actions.appendChild(btnDel);
        folderHeader.appendChild(actions);

        // Setup Drag & Drop na PASTA (Para receber itens)
        this.setupDragDrops(folderHeader, pasta.id, 'pasta');

        folderContainer.appendChild(folderHeader);

        // Se aberta, renderiza filhos
        if (pasta.aberta) {
            // Subpastas
            const subPastas = this.pastas.filter(p => p.parentId === pasta.id);
            subPastas.forEach(sub => {
                folderContainer.appendChild(this._renderizarPastaRecursiva(sub));
            });

            // Entidades nesta pasta
            const entsNaPasta = this.entidades.filter(e => e.pastaId === pasta.id);
            entsNaPasta.forEach(ent => {
                folderContainer.appendChild(this.criarElementoArvoreEntidade(ent));
            });

            if (subPastas.length === 0 && entsNaPasta.length === 0) {
                const empty = document.createElement('div');
                empty.setAttribute('data-i18n', 'panel.hierarchy.scene.empty');
                empty.textContent = 'A cena está vazia. Adicione entidades para começar.';
                empty.style.color = '#555';
                empty.style.fontSize = '10px';
                empty.style.marginLeft = '15px';
                folderContainer.appendChild(empty);
            }
        }

        return folderContainer;
    }


    /**
     * Helper para criar item de entidade na árvore
     */
    criarElementoArvoreEntidade(entidade) {
        const item = document.createElement('div');
        item.className = 'tree-item';
        if (entidade === this.entidadeSelecionada) {
            item.classList.add('selected');
        }

        const icones = {
            'player': '👤',
            'npc': '🤖',
            'objeto': '📦',
            'menu': '📋'
        };

        item.innerHTML = `
        <span class="tree-icon"> ${icones[entidade.tipo] || '❓'}</span>
        <span class="tree-label" title="Duplo clique para renomear">${entidade.nome}</span>
    `;

        // Evento de Seleção
        item.addEventListener('click', (e) => {
            this.selecionarEntidade(entidade);
        });

        // Evento de Renomear (Duplo Clique)
        const label = item.querySelector('.tree-label');
        label.addEventListener('dblclick', (e) => {
            e.stopPropagation();

            const currentName = entidade.nome;
            const input = document.createElement('input');
            input.type = 'text';
            input.value = currentName;
            input.style.width = '120px';
            input.style.background = '#000';
            input.style.color = '#fff';
            input.style.border = '1px solid #4ecdc4';
            input.style.padding = '2px';

            // Substitui span por input
            label.innerHTML = '';
            label.appendChild(input);
            input.focus();

            const salvarNome = () => {
                const novoNome = input.value.trim();
                if (novoNome && novoNome !== currentName) {
                    entidade.nome = novoNome;
                    this.log(`Entidade renomeada para: ${novoNome}`, 'info');
                }
                this.atualizarHierarquia(); // Re-renderiza para voltar ao span
                this.atualizarPainelPropriedades();
            };

            input.addEventListener('blur', salvarNome);
            input.addEventListener('keydown', (ek) => {
                if (ek.key === 'Enter') {
                    salvarNome();
                }
            });
        });

        // Setup Drag (para mover)
        this.setupDragDrops(item, entidade.id, 'entidade');

        return item;
    }

    /**
     * Atualiza o painel de propriedades
     */
    atualizarPainelPropriedades() {
        const propriedadesContent = document.getElementById('propriedades-content');
        if (!propriedadesContent) return;

        if (!this.entidadeSelecionada) {
            propriedadesContent.innerHTML = `
                <div class="prop-empty">
                    <p><span data-i18n="panel.properties.noSelection">Selecione uma entidade para editar suas propriedades</span></p>
                </div>`;
            return;
        }

        const ent = this.entidadeSelecionada;
        // Default to collapsed unless explicitly true
        const getState = (key) => (this.propSectionsState && this.propSectionsState[key] === true) ? '' : 'collapsed';

        // --- 1. HEADER FIXO (Core Properties) ---
        const headerHtml = `
            <div class="prop-core-header" style="background:#1a1a2e; padding:10px; border-bottom:1px solid #444; margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <div style="flex:1; margin-right:10px;">
                         <label style="font-size:10px; color:#aaa; display:block;"><span data-i18n="properties.name">Nome</span></label>
                         <input type="text" id="prop-nome" value="${ent.nome}" style="width:100%; background:#111; border:1px solid #444; color:white; padding:4px;">
                    </div>
                    <div style="width:30px;">
                        <label style="font-size:10px; color:#aaa; display:block;"><span data-i18n="properties.enabled">Ativo</span></label>
                        <input type="checkbox" id="prop-enabled" ${!ent.locked ? 'checked' : ''}>
                    </div>
                </div>
                 <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <div style="flex:1; margin-right:10px;">
                         <label style="font-size:10px; color:#aaa; display:block;">ID</label>
                         <input type="text" value="${ent.id}" disabled style="width:100%; background:#222; border:1px solid #333; color:#666; padding:4px; font-size:10px;">
                    </div>
                    <div style="flex:1;">
                         <label style="font-size:10px; color:#aaa; display:block;">Tipo</label>
                         <input type="text" value="${ent.tipo}" disabled style="width:100%; background:#222; border:1px solid #333; color:#666; padding:4px; font-size:10px;">
                    </div>
                 </div>
                 <div style="display:flex; justify-content:space-between; margin-bottom:5px; align-items: center;">
                    <div style="flex:1; margin-right:10px;">
                        <label style="font-size:10px; color:#aaa; display:block;">Ordem (Z)</label>
                        <div style="display:flex; gap:5px;">
                            <button id="btn-order-back" style="flex:1; font-size:10px; background:#222; border:1px solid #444; color:#ccc; cursor:pointer;" title="Mover para Trás (Desenhar Primeiro)">⬇️ Fundo</button>
                            <button id="btn-order-front" style="flex:1; font-size:10px; background:#222; border:1px solid #444; color:#ccc; cursor:pointer;" title="Mover para Frente (Desenhar Por Último)">⬆️ Frente</button>
                        </div>
                    </div>
                 </div>
            </div>

            <!-- Transform Component (Always Visible) -->
           <div class="component-box" style="background:#2d2d3f; margin-bottom:2px; border-radius:4px; overflow:hidden;">
                <div class="component-header ${getState('transform')}" data-section="transform" style="background:#3d3d55; padding:5px 10px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; user-select:none;">
                    <span style="font-weight:bold; font-size:12px; color:#ddd;">🔧 Transform</span>
                    <span style="font-size:10px; color:#aaa;">▼</span>
                </div>
                <div class="component-body" style="padding:10px; display:${getState('transform') === 'collapsed' ? 'none' : 'block'};">
                    <div style="display:flex; gap:5px; margin-bottom:5px;">
                        <div style="flex:1;">
                            <label style="font-size:10px; color:#aaa;">Pos X</label>
                            <input type="number" id="prop-x" value="${Math.round(ent.x)}" step="1" style="width:100%; background:#111; color:white; border:1px solid #444; padding:2px;">
                        </div>
                        <div style="flex:1;">
                            <label style="font-size:10px; color:#aaa;">Pos Y</label>
                            <input type="number" id="prop-y" value="${Math.round(ent.y)}" step="1" style="width:100%; background:#111; color:white; border:1px solid #444; padding:2px;">
                        </div>
                         <div style="flex:1;">
                            <label style="font-size:10px; color:#aaa;">Rot °</label>
                            <input type="number" id="prop-rot" value="${Math.round(ent.rotacao)}" step="15" style="width:100%; background:#111; color:white; border:1px solid #444; padding:2px;">
                        </div>
                    </div>
                     <div style="display:flex; gap:5px;">
                        <div style="flex:1;">
                            <label style="font-size:10px; color:#aaa;">Largura</label>
                            <input type="number" id="prop-largura" value="${ent.largura}" step="1" min="1" style="width:100%; background:#111; color:white; border:1px solid #444; padding:2px;">
                        </div>
                        <div style="flex:1;">
                            <label style="font-size:10px; color:#aaa;">Altura</label>
                            <input type="number" id="prop-altura" value="${ent.altura}" step="1" min="1" style="width:100%; background:#111; color:white; border:1px solid #444; padding:2px;">
                        </div>
                    </div>
                </div>
            </div>
        `;

        // --- 2. COMPONENTS/PLUGINS LOOP ---
        let componentsHtml = '';

        // Helper para criar accordion padrão
        const createComponentHtml = (id, nome, icon, color, contentHtml, removeBtn = false) => `
            <div class="component-box" style="background:#2a2a35; margin-bottom:2px; border-radius:4px; border-left: 3px solid ${color}; overflow:hidden;">
                <div class="component-header ${getState(id)}" data-section="${id}" style="background:#333; padding:5px 10px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; user-select:none;">
                    <div style="display:flex; align-items:center; gap:5px;">
                         <span style="font-size:14px;">${icon}</span>
                         <span style="font-weight:bold; font-size:12px; color:#eee;">${nome}</span>
                    </div>
                    <div style="display:flex; gap:10px;">
                        ${removeBtn ? `<span class="btn-remove-component" data-comp-type="${id}" style="font-size:12px; cursor:pointer; color:#ff6b6b;" title="Remover Componente">✖</span>` : ''}
                        <span style="font-size:10px; color:#aaa;">▼</span>
                    </div>
                </div>
                <div class="component-body" style="padding:10px; display:${getState(id) === 'collapsed' ? 'none' : 'block'}; border-top:1px solid #333;">
                    ${contentHtml}
                </div>
            </div>
        `;

        // 2.1 Visual Component (Virtual)
        const visualHtml = `
             <div style="margin-bottom:5px;">
                <label style="font-size:10px; color:#aaa;">Cor Base</label>
                <div style="display:flex; gap:5px;">
                    <input type="color" id="prop-cor" value="${ent.cor}" style="height:24px; flex:1; padding:0; background:none; border:none;">
                    <input type="text" value="${ent.cor}" style="flex:2; background:#111; border:1px solid #444; color:white; font-size:11px; padding:2px;">
                </div>
            </div>
            <div>
                 <label style="font-size:10px; color:#aaa;">Opacidade (${Math.round(ent.opacidade * 100)}%)</label>
                 <input type="range" id="prop-opacidade" min="0" max="1" step="0.1" value="${ent.opacidade}" style="width:100%;">
            </div>
            <div style="margin-top:5px; display:flex; align-items:center;">
                 <input type="checkbox" id="prop-visible" ${ent.visivel ? 'checked' : ''} style="margin-right:5px;">
                 <label style="font-size:11px; color:#ccc;" for="prop-visible">Visível (Render)</label>
            </div>
             <div style="margin-top:5px;">
                  <label style="font-size:10px; color:#aaa;">Profundidade (Z-Index)</label>
                  <input type="number" id="prop-zindex" value="${ent.zIndex || 0}" step="1" style="width:100%; background:#111; color:white; border:1px solid #444; padding:2px;">
             </div>
        `;
        componentsHtml += createComponentHtml('visual', 'Visual', '🎨', '#4ecdc4', visualHtml);

        // 2.2 Physics Component (Virtual)
        const fisicaHtml = `
             <div style="display:flex; flex-direction:column; gap:8px;">
                 <div style="display:flex; align-items:center;">
                    <input type="checkbox" id="prop-gravidade" ${ent.temGravidade ? 'checked' : ''}>
                    <label style="font-size:11px; color:#ccc; margin-left:5px;">Aplicar Gravidade</label>
                </div>
                 <div style="display:flex; align-items:center;">
                    <input type="checkbox" id="prop-solido" ${ent.solido ? 'checked' : ''}>
                    <label style="font-size:11px; color:#ccc; margin-left:5px;">Colisor Sólido (Chão)</label>
                </div>
                 <div>
                    <label style="font-size:10px; color:#aaa;">Velocidade Y (Info)</label>
                    <input type="number" value="${Math.round(ent.velocidadeY)}" disabled style="width:100%; background:#222; border:1px solid #333; color:#666;">
                </div>
            </div>
        `;
        componentsHtml += createComponentHtml('fisica', 'Physics Body', '⚛️', '#9b59b6', fisicaHtml);

        // 2.3 SpriteComponent
        const spriteComp = ent.obterComponente('SpriteComponent');
        if (spriteComp) {
            let spriteHtml = `
                 <div style="margin-bottom:10px;">
                    <label style="font-size:10px; color:#aaa;">Source Asset</label>
                    <select id="prop-asset-sprite" style="width: 100%; padding: 4px; background: #111; color: white; border: 1px solid #444; font-size:11px;">
                        <option value="">(Nenhum - Cor Sólida)</option>
                        ${this.assetManager ? this.assetManager.listarSprites().map(a =>
                `<option value="${a.id}" ${(spriteComp.assetId === a.id) ? 'selected' : ''}>${a.nome}</option>`
            ).join('') : ''}
                    </select>
                </div>
            `;

            // Lógica de Animações (copiada do original mas compactada)
            if (spriteComp.assetId) {
                const asset = this.assetManager.obterAsset(spriteComp.assetId);
                if (asset && asset.categoria === 'animacao') {
                    spriteHtml += `<div style="background:#222; padding:5px; border-radius:4px; margin-bottom:5px;">`;
                    spriteHtml += `<div style="margin-bottom:5px;"><label style="font-size:10px; color:#aaa;">Autoplay Anim</label>`;
                    spriteHtml += `<select class="prop-autoplay-anim" data-asset="${spriteComp.assetId}" style="width:100%; background:#333; color:white; border:none; font-size:10px;"><option value="">(None)</option>`;
                    for (const nomeAnim of Object.keys(asset.animacoes || {})) {
                        spriteHtml += `<option value="${nomeAnim}" ${spriteComp.autoplayAnim === nomeAnim ? 'selected' : ''}>${nomeAnim}</option>`;
                    }
                    spriteHtml += `</select></div>`;

                    // Lista simplificada de animações draggable
                    spriteHtml += `<div style="font-size:10px; color:#aaa; margin-bottom:2px;">Available Animations (Drag):</div>`;
                    spriteHtml += `<div style="display:flex; flex-wrap:wrap; gap:5px;">`;
                    for (const nome of Object.keys(asset.animacoes || {})) {
                        spriteHtml += `<div class="draggable-anim-source" draggable="true" data-anim-name="${nome}" style="background:#444; color:#fff; padding:2px 6px; border-radius:10px; font-size:10px; cursor:grab;">${nome}</div>`;
                    }
                    spriteHtml += `</div></div>`;
                }
            }

            spriteHtml += `
               <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                    <div style="flex:1;">
                        <label style="font-size:10px; color:#aaa;">Offset X</label>
                        <input type="number" id="prop-offset-x" value="${spriteComp.offsetX}" style="width:100%; background:#111; color:white; border:1px solid #444;">
                    </div>
                    <div style="flex:1;">
                        <label style="font-size:10px; color:#aaa;">Offset Y</label>
                        <input type="number" id="prop-offset-y" value="${spriteComp.offsetY}" style="width:100%; background:#111; color:white; border:1px solid #444;">
                    </div>
                </div>
                <div style="display: flex; gap: 5px;">
                    <div style="flex:1;">
                        <label style="font-size:10px; color:#aaa;">Scale X</label>
                        <input type="number" id="prop-scale-x" value="${spriteComp.scaleX || 1.0}" step="0.1" style="width:100%; background:#111; color:white; border:1px solid #444;">
                    </div>
                    <div style="flex:1;">
                        <label style="font-size:10px; color:#aaa;">Scale Y</label>
                        <input type="number" id="prop-scale-y" value="${spriteComp.scaleY || 1.0}" step="0.1" style="width:100%; background:#111; color:white; border:1px solid #444;">
                    </div>
                </div>`;

            componentsHtml += createComponentHtml('SpriteComponent', 'Sprite Renderer', '🖼️', '#e67e22', spriteHtml, true);
        }

        // 2.4 CollisionComponent
        const colComp = ent.obterComponente('CollisionComponent');
        if (colComp) {
            const colHtml = `
               <div style="display:flex; gap:5px; margin-bottom:5px;">
                   <div style="flex:1;">
                       <label style="font-size:10px; color:#aaa;">Box X</label>
                       <input type="number" value="${colComp.offsetX}" class="plugin-prop" data-plugin="CollisionComponent" data-prop="offsetX" style="width:100%; background:#111; color:white; border:1px solid #444;">
                   </div>
                   <div style="flex:1;">
                       <label style="font-size:10px; color:#aaa;">Box Y</label>
                       <input type="number" value="${colComp.offsetY}" class="plugin-prop" data-plugin="CollisionComponent" data-prop="offsetY" style="width:100%; background:#111; color:white; border:1px solid #444;">
                   </div>
               </div>
               <div style="display:flex; gap:5px; margin-bottom:5px;">
                   <div style="flex:1;">
                       <label style="font-size:10px; color:#aaa;">Width</label>
                       <input type="number" value="${colComp.largura}" class="plugin-prop" data-plugin="CollisionComponent" data-prop="largura" style="width:100%; background:#111; color:white; border:1px solid #444;">
                   </div>
                   <div style="flex:1;">
                       <label style="font-size:10px; color:#aaa;">Height</label>
                       <input type="number" value="${colComp.altura}" class="plugin-prop" data-plugin="CollisionComponent" data-prop="altura" style="width:100%; background:#111; color:white; border:1px solid #444;">
                   </div>
               </div>

                <div style="display:flex; align-items:center; justify-content: space-between; margin-top: 5px; padding-top: 5px; border-top: 1px solid #333;">
                    <div style="display:flex; align-items:center;">
                        <input type="checkbox" ${colComp.isTrigger ? 'checked' : ''} class="plugin-prop-check" data-plugin="CollisionComponent" data-prop="isTrigger" id="chk-is-trigger">
                        <label for="chk-is-trigger" style="font-size:11px; color:#ccc; margin-left:5px; cursor:pointer;">Is Trigger (Ghost)</label>
                    </div>
                    <button class="btn-autofit-collider" data-comp="CollisionComponent" style="background:#2ecc71; color:#fff; border:none; border-radius:4px; font-size:10px; padding:4px 8px; cursor:pointer;" title="Ajustar ao Sprite">Auto-Fit</button>
                </div>
            `;
            componentsHtml += createComponentHtml('CollisionComponent', 'Box Collider 2D', '📦', '#2ecc71', colHtml, true);
        }

        // 2.5 CameraFollowComponent
        const camComp = ent.obterComponente('CameraFollowComponent');
        if (camComp) {
            const camHtml = `
                <div style="display:flex; gap:5px;">
                    <div style="flex:1;">
                       <label style="font-size:10px; color:#aaa;">Smooth</label>
                       <input type="number" step="0.01" value="${camComp.smoothSpeed}" class="plugin-prop" data-plugin="CameraFollowComponent" data-prop="smoothSpeed" style="width:100%; background:#111; color:white; border:1px solid #444;">
                   </div>
                    <div style="flex:1;">
                       <label style="font-size:10px; color:#aaa;">Offset Y</label>
                       <input type="number" value="${camComp.offsetY}" class="plugin-prop" data-plugin="CameraFollowComponent" data-prop="offsetY" style="width:100%; background:#111; color:white; border:1px solid #444;">
                   </div>
                </div>
            `;
            componentsHtml += createComponentHtml('CameraFollowComponent', 'Camera Follow', '🎥', '#3498db', camHtml, true);
        }

        // 2.7 TilemapComponent
        const tileComp = ent.obterComponente('TilemapComponent');
        if (tileComp) {
            // Tilemap Editor UI - Fallback Logic
            let tilesetImage = null;
            if (tileComp.assetId) {
                // FIX: Usar this.assetManager já que estamos dentro da classe EditorPrincipal
                const asset = this.assetManager.obterAsset(tileComp.assetId);
                if (asset) {
                    tilesetImage = asset.source;
                    if (!tilesetImage && asset.animacoes) {
                        if (asset.animacoes['idle'] && asset.animacoes['idle'].source) {
                            tilesetImage = asset.animacoes['idle'].source;
                        } else {
                            const firstAnim = Object.values(asset.animacoes).find(a => a.source);
                            if (firstAnim) tilesetImage = firstAnim.source;
                        }
                    }
                }
            }

            // Gerar opções de assets
            let optionsAssets = '<option value="">-- Selecione Tileset --</option>';
            // FIX: Usar this.assetManager
            if (this.assetManager && this.assetManager.assets.sprites) {
                this.assetManager.assets.sprites.forEach(asset => {
                    if (asset.tipo === 'sprite' || asset.tipo === 'animacao') {
                        const selected = (asset.id === tileComp.assetId) ? 'selected' : '';
                        optionsAssets += `<option value="${asset.id}" ${selected}>${asset.nome}</option>`;
                    }
                });
            }

            const tileHtml = `
                <div style="display:flex; flex-direction:column; gap:5px;">
                    <div style="margin-bottom:5px;">
                        <label style="font-size:11px; color:#aaa;">Tileset Asset</label>
                        <select class="tileset-select" data-comp-id="${tileComp.id || 'TilemapComponent'}" style="width:100%; background:#111; color:white; border:1px solid #444; padding:4px;">
                            ${optionsAssets}
                        </select>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                         <label style="font-size:11px; color:#aaa;">Grid Size</label>
                         <input type="number" value="${tileComp.tileSize}" class="plugin-prop" data-plugin="TilemapComponent" data-prop="tileSize" style="width:60px; background:#111; color:white; border:1px solid #444; padding:2px;">
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                         <label style="font-size:11px; color:#aaa;">Active</label>
                         <input type="checkbox" ${tileComp.ativo ? 'checked' : ''} class="plugin-prop-check" data-plugin="TilemapComponent" data-prop="ativo">
                    </div>
                    
                    <!-- Selection Tools -->
                    <div style="display:flex; gap:2px; margin-top:5px; background:#222; padding:2px; border-radius:4px;">
                        <button class="btn-tool-tile" data-tool="paint" style="flex:1; background:#444; border:none; color:white; font-size:10px; padding:4px; cursor:pointer;" title="Pincel">🖌️</button>
                        <button class="btn-tool-tile" data-tool="eraser" style="flex:1; background:#333; border:none; color:white; font-size:10px; padding:4px; cursor:pointer;" title="Borracha">🧼</button>
                    </div>
                    
                    <div style="margin-top:5px; display:flex; align-items:center; gap: 10px;">
                        <label style="font-size:11px; color:#ddd; display:flex; align-items:center; cursor:pointer;">
                            <input type="checkbox" id="chk-tile-solid" style="margin-right:4px;"> Sólido
                        </label>
                         <label style="font-size:11px; color:#ddd; display:flex; align-items:center; cursor:pointer;" title="Permite pular de baixo para cima">
                            <input type="checkbox" id="chk-tile-plataforma" style="margin-right:4px;"> Plataforma (One-Way)
                        </label>
                    </div>

                    <!-- Tileset Selection -->
                    <div style="margin-top:5px; border:1px solid #444; height:150px; overflow:auto; background:#111; position:relative;" id="tile-palette-container">
                        ${tilesetImage ?
                    `<img src="${tilesetImage}" id="tile-palette-img" style="image-rendering:pixelated; width:100%; cursor:crosshair;">
                             <div id="tile-selection-rect" style="position:absolute; border:2px solid yellow; pointer-events:none; display:none;"></div>`
                    : '<div style="padding:10px; color:#666; font-size:10px;">Select a SpriteComponent first to serve as Tileset Source</div>'}
                    </div>
                    <div style="font-size:9px; color:#666;">Selecione um tile na imagem para pintar.</div>

                    <div style="margin-top:5px;">
                        <button class="btn-clear-tilemap" style="width:100%; background:#721c24; color:#f8d7da; border:1px solid #f5c6cb; padding:5px; cursor:pointer;">🗑️ Clear Map</button>
                    </div>
                </div>
            `;
            componentsHtml += createComponentHtml('TilemapComponent', 'Tilemap System', '🧱', '#795548', tileHtml, true);
        }

        // 2.8 ParallaxComponent
        const parallaxComp = ent.obterComponente('ParallaxComponent');
        if (parallaxComp) {
            let parallaxHtml = '<div style="display:flex; flex-direction:column; gap:10px;">';

            // List existing layers
            parallaxComp.layers.forEach((layer, index) => {
                let optionsAssets = '<option value="">(None)</option>';
                if (this.assetManager && this.assetManager.assets.sprites) {
                    this.assetManager.assets.sprites.forEach(asset => {
                        const selected = (asset.id === layer.assetId) ? 'selected' : '';
                        optionsAssets += `<option value="${asset.id}" ${selected}>${asset.nome}</option>`;
                    });
                }

                parallaxHtml += `
                    <div style="background:#222; padding:5px; border-radius:4px; border:1px solid #444;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <label style="font-size:11px; font-weight:bold; color:#ccc;">Layer ${index + 1}</label>
                            <button class="btn-remove-parallax-layer" data-index="${index}" style="background:#c0392b; color:white; border:none; border-radius:3px; font-size:9px; padding:2px 5px; cursor:pointer;">X</button>
                        </div>
                        <div style="margin-bottom:5px;">
                             <label style="font-size:10px; color:#aaa;">Image Asset</label>
                             <select class="parallax-layer-prop" data-index="${index}" data-prop="assetId" style="width:100%; background:#111; color:white; border:1px solid #444; font-size:10px;">
                                ${optionsAssets}
                             </select>
                        </div>
                        <div style="display:flex; gap:5px;">
                            <div style="flex:1;">
                                <label style="font-size:10px; color:#aaa;">Speed X</label>
                                <input type="number" step="0.1" value="${layer.speedX}" class="parallax-layer-prop" data-index="${index}" data-prop="speedX" style="width:100%; background:#111; color:white; border:1px solid #444;">
                            </div>
                            <div style="flex:1;">
                                <label style="font-size:10px; color:#aaa;">Speed Y</label>
                                <input type="number" step="0.1" value="${layer.speedY}" class="parallax-layer-prop" data-index="${index}" data-prop="speedY" style="width:100%; background:#111; color:white; border:1px solid #444;">
                            </div>
                        </div>
                         <div style="display:flex; gap:5px; margin-top:5px;">
                            <div style="flex:1;">
                                <label style="font-size:10px; color:#aaa;">Opacity</label>
                                <input type="number" step="0.1" min="0" max="1" value="${layer.opacity}" class="parallax-layer-prop" data-index="${index}" data-prop="opacity" style="width:100%; background:#111; color:white; border:1px solid #444;">
                            </div>
                            <div style="flex:1;">
                                <label style="font-size:10px; color:#aaa;">Scale</label>
                                <input type="number" step="0.1" value="${layer.scale}" class="parallax-layer-prop" data-index="${index}" data-prop="scale" style="width:100%; background:#111; color:white; border:1px solid #444;">
                            </div>
                             <div style="flex:1;">
                                <label style="font-size:10px; color:#aaa;">Pos Y</label>
                                <input type="number" step="1" value="${layer.yOffset || 0}" class="parallax-layer-prop" data-index="${index}" data-prop="yOffset" style="width:100%; background:#111; color:white; border:1px solid #444;">
                            </div>
                        </div>
                         <div style="display:flex; gap:10px; margin-top:5px; align-items:center;">
                            <label style="font-size:10px; color:#ccc; display:flex; align-items:center; gap:3px;">
                                <input type="checkbox" class="parallax-layer-prop" data-index="${index}" data-prop="repeatX" ${(layer.repeatX !== false) ? 'checked' : ''}> Rep X
                            </label>
                            <label style="font-size:10px; color:#ccc; display:flex; align-items:center; gap:3px;">
                                <input type="checkbox" class="parallax-layer-prop" data-index="${index}" data-prop="repeatY" ${(layer.repeatY) ? 'checked' : ''}> Rep Y
                            </label>
                             <label style="font-size:10px; color:#ccc; display:flex; align-items:center; gap:3px;">
                                <input type="checkbox" class="parallax-layer-prop" data-index="${index}" data-prop="fitHeight" ${(layer.fitHeight) ? 'checked' : ''}> Fit H
                            </label>
                             <label style="font-size:10px; color:#ccc; display:flex; align-items:center; gap:3px;">
                                <input type="checkbox" class="parallax-layer-prop" data-index="${index}" data-prop="fitScreen" ${(layer.fitScreen) ? 'checked' : ''}> Fit SCREEN
                            </label>
                             <label style="font-size:10px; color:#ccc; display:flex; align-items:center; gap:3px;">
                                <input type="checkbox" class="parallax-layer-prop" data-index="${index}" data-prop="fitCover" ${(layer.fitCover) ? 'checked' : ''}> COVER
                            </label>
                        </div>
                    </div>
                `;
            });

            // Add Button
            parallaxHtml += `
                <div style="text-align:center;">
                    <button class="btn-add-parallax-layer" style="width:100%; background:#3498db; color:white; border:none; padding:5px; border-radius:4px; font-size:11px; cursor:pointer;">+ New Layer</button>
                </div>
            `;

            parallaxHtml += '</div>';

            componentsHtml += createComponentHtml('ParallaxComponent', 'Parallax Background', '🌄', '#8e44ad', parallaxHtml, true);
        }

        // 2.9 DialogueComponent
        const dialogueComp = ent.obterComponente('DialogueComponent');
        if (dialogueComp) {
            let dialogueHtml = '<div style="display:flex; flex-direction:column; gap:10px;">';

            // Controle de Teste
            dialogueHtml += `
                 <div style="display:flex; gap:5px; margin-bottom:5px;">
                     <button class="btn-test-dialogue" style="flex:1; background:#27ae60; color:white; border:none; padding:5px; border-radius:4px; font-size:11px; cursor:pointer;">▶ Test Dialogue</button>
                     <button class="btn-stop-dialogue" style="flex:1; background:#c0392b; color:white; border:none; padding:5px; border-radius:4px; font-size:11px; cursor:pointer;">◼ Stop</button>
                 </div>
            `;

            // Lista de Diálogos
            dialogueComp.dialogos.forEach((diag, index) => {
                // Gerar opções de sprites para Portrait
                let portraitOptions = '<option value="">(Nenhum)</option>';
                if (this.assetManager && this.assetManager.assets.sprites) {
                    this.assetManager.assets.sprites.forEach(asset => {
                        const selected = (asset.id === diag.portrait) ? 'selected' : '';
                        portraitOptions += `<option value="${asset.id}" ${selected}>${asset.nome}</option>`;
                    });
                }

                dialogueHtml += `
                    <div style="background:#222; padding:5px; border-radius:4px; border:1px solid #444;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                            <label style="font-size:9px; color:#666;">#${index + 1}</label>
                            <button class="btn-remove-dialogue" data-index="${index}" style="background:transparent; color:#e74c3c; border:none; font-size:12px; cursor:pointer;">🗑️</button>
                        </div>
                        <div style="margin-bottom:4px;">
                             <input type="text" class="dialogue-prop" data-index="${index}" data-prop="speaker" value="${diag.speaker}" placeholder="Speaker Name" style="width:100%; background:#111; color:#4ecdc4; border:1px solid #333; font-size:11px; font-weight:bold; padding:2px;">
                        </div>
                        <div style="margin-bottom:4px;">
                            <label style="font-size:9px; color:#888;">🖼️ Portrait (Imagem)</label>
                            <select class="dialogue-prop" data-index="${index}" data-prop="portrait" style="width:100%; background:#111; color:#ccc; border:1px solid #333; font-size:10px; padding:2px;">
                                ${portraitOptions}
                            </select>
                        </div>
                        <div>
                             <textarea class="dialogue-prop" data-index="${index}" data-prop="text" placeholder="Message text..." style="width:100%; height:40px; background:#111; color:#ccc; border:1px solid #333; font-size:11px; padding:2px; resize:vertical;">${diag.text}</textarea>
                        </div>
                    </div>
                `;
            });

            // Add Button
            dialogueHtml += `
                <div style="text-align:center;">
                    <button class="btn-add-dialogue" style="width:100%; background:#8e44ad; color:white; border:none; padding:5px; border-radius:4px; font-size:11px; cursor:pointer;">+ Add Message</button>
                </div>
            `;

            dialogueHtml += '</div>';
            componentsHtml += createComponentHtml('DialogueComponent', 'Dialogue System (NPC)', '💬', '#34495e', dialogueHtml, true);
        }

        // 2.10 KillZoneComponent
        const killRef = ent.obterComponente('KillZoneComponent');
        if (killRef) {
            let killHtml = `
            <div style="background:#222; padding:5px; border-radius:4px; margin-bottom:5px;">
                <p style="font-size:10px; color:#aaa; margin:0 0 5px 0;">Modo de Morte</p>
                <div style="margin-bottom:5px;">
                     <label style="font-size:11px; color:#ccc; display:flex; align-items:center;">
                        <input type="checkbox" id="prop-kz-global" ${(killRef.globalLine) ? 'checked' : ''}> Linha Global (Y > Posição)
                    </label>
                    <p style="font-size:9px; color:#666; margin-left:18px;">Se marcado, mata o player se cair abaixo desta linha Y. Se desmarcado, usa o Colisor como Trigger.</p>
                </div>
                <div style="margin-bottom:5px;">
                     <label style="font-size:11px; color:#ccc; display:flex; align-items:center;">
                        <input type="checkbox" id="prop-kz-destroy" ${(killRef.destroyPlayer) ? 'checked' : ''}> Destruir Player
                    </label>
                </div>
                 <div>
                    <label style="font-size:10px; color:#aaa;">Ponto Respawn (X, Y)</label>
                    <div style="display:flex; gap:5px;">
                         <input type="number" id="prop-kz-x" value="${killRef.resetPosition.x}" style="flex:1; background:#111; color:white; border:1px solid #444;">
                         <input type="number" id="prop-kz-y" value="${killRef.resetPosition.y}" style="flex:1; background:#111; color:white; border:1px solid #444;">
                    </div>
                </div>
            </div>`;
            componentsHtml += createComponentHtml('KillZoneComponent', 'Kill Zone', '☠️', '#c0392b', killHtml, true);
        }

        // 2.11 CheckpointComponent
        const checkRef = ent.obterComponente('CheckpointComponent');
        if (checkRef) {
            let checkHtml = `
            <div style="background:#222; padding:5px; border-radius:4px; margin-bottom:5px;">
                <label style="font-size:11px; color:#ccc; display:flex; align-items:center;">
                    <input type="checkbox" id="prop-check-ativo" ${(checkRef.ativo) ? 'checked' : ''}> Ativo
                </label>
                <p style="font-size:9px; color:#aaa; margin:5px 0;">Checkpoint salva a posição deste objeto quando o Player toca nele.</p>
            </div>`;
            componentsHtml += createComponentHtml('CheckpointComponent', 'Checkpoint System', '🚩', '#f1c40f', checkHtml, true);
        }

        // 2.12 ParticleEmitterComponent
        const particleRef = ent.obterComponente('ParticleEmitterComponent');
        if (particleRef) {
            // Gerar opções de templates
            const templates = this.particleTemplateManager.obterTodos();
            let templateOptions = '<option value="">- Manual (sem template) -</option>';
            templates.forEach(template => {
                const selected = (particleRef.templateId === template.id) ? 'selected' : '';
                const icon = template.customizado ? '⭐' : '📦';
                templateOptions += `<option value="${template.id}" ${selected}>${icon} ${template.nome}</option>`;
            });

            let particleHtml = `
            <div style="background:#222; padding:10px; border-radius:4px;">
                <!-- Templates Globais -->
                <div style="margin-bottom:15px; padding:8px; background:#2a1a40; border:1px solid #6a4c9c; border-radius:4px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                        <label style="font-size:10px; color:#c9a0ff; font-weight:bold;">🎯 Template</label>
                        <button id="btn-manage-templates" style="background:#6a4c9c; color:white; border:none; padding:2px 8px; border-radius:3px; font-size:9px; cursor:pointer;">Gerenciar</button>
                    </div>
                    <select id="particle-template" style="width:100%; background:#1a1a2e; color:#c9a0ff; border:1px solid #6a4c9c; padding:5px; font-size:11px; margin-bottom:5px;">
                        ${templateOptions}
                    </select>
                    <div style="font-size:8px; color:#888; margin-top:3px;">💡 Templates são reusáveis em múltiplas entidades</div>
                </div>

                <!-- Presets --\u003e
                <div style="margin-bottom:15px; padding:8px; background:#1a1a2e; border-radius:4px;">
                    <label style="font-size:10px; color:#aaa; margin-bottom:3px; display:block;">🎨 Presets Rápidos</label>
                    <select id="particle-preset" style="width:100%; background:#111; color:#4ecdc4; border:1px solid #444; padding:5px; font-size:11px; margin-bottom:5px;">
                        <option value="">- Selecione -</option>
                        <option value="fogo">🔥 Fogo</option>
                        <option value="explosao">💥 Explosão</option>
                        <option value="fumaca">💨 Fumaça</option>
                        <option value="sparkles">✨ Sparkles</option>
                        <option value="chuva">🌧️ Chuva</option>
                        <option value="aura">💫 Aura</option>
                    </select>
                    <button id="btn-apply-preset" style="width:100%; background:#27ae60; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer; font-size:11px;">Aplicar Preset</button>
                </div>

                <!-- Controles de Emissão -->
                <div style="margin-bottom:15px; padding:8px; background:#1a1a2e; border-radius:4px;">
                    <div style="font-size:11px; color:#4ecdc4; margin-bottom:8px; font-weight:bold;">⚙️ Emissão</div>
                    
                    <div style="margin-bottom:8px;">
                        <label style="font-size:11px; color:#ccc; display:flex; align-items:center; gap:5px;">
                            <input type="checkbox" id="particle-emitindo" ${particleRef.emitindo ? 'checked' : ''}> Emitindo
                        </label>
                    </div>

                    <div style="margin-bottom:8px;">
                        <label style="font-size:10px; color:#aaa;">Taxa (part/s): <span id="particletaxa-val">${particleRef.taxaEmissao}</span></label>
                        <input type="range" id="particle-taxa" min="1" max="100" value="${particleRef.taxaEmissao}" style="width:100%;">
                    </div>

                    <div style="margin-bottom:8px;">
                        <label style="font-size:10px; color:#aaa;">Máx Partículas: <span id="particle-max-val">${particleRef.maxParticulas}</span></label>
                        <input type="range" id="particle-max" min="10" max="500" value="${particleRef.maxParticulas}" style="width:100%;">
                    </div>

                    <div style="margin-bottom:8px;">
                        <label style="font-size:10px; color:#aaa;">Modo</label>
                        <select id="particle-modo" style="width:100%; background:#111; color:white; border:1px solid #444; padding:3px; font-size:10px;">
                            <option value="continuo" ${particleRef.modo === 'continuo' ? 'selected' : ''}>Contínuo</option>
                            <option value="burst" ${particleRef.modo === 'burst' ? 'selected' : ''}>Burst</option>
                            <option value="oneshot" ${particleRef.modo === 'oneshot' ? 'selected' : ''}>One-Shot</option>
                        </select>
                    </div>
                </div>

                <!-- Controles Visuais -->
                <div style="margin-bottom:15px; padding:8px; background:#1a1a2e; border-radius:4px;">
                    <div style="font-size:11px; color:#4ecdc4; margin-bottom:8px; font-weight:bold;">🎨 Visual</div>
                    
                    <div style="display:flex; gap:8px; margin-bottom:8px;">
                        <div style="flex:1;">
                            <label style="font-size:9px; color:#aaa;">Cor Inicial</label>
                            <input type="color" id="particle-cor-ini" value="${particleRef.corInicial}" style="width:100%; height:24px;">
                        </div>
                        <div style="flex:1;">
                            <label style="font-size:9px; color:#aaa;">Cor Final</label>
                            <input type="color" id="particle-cor-fim" value="${particleRef.corFinal}" style="width:100%; height:24px;">
                        </div>
                    </div>

                    <div style="margin-bottom:8px;">
                        <label style="font-size:10px; color:#aaa;">Tamanho Inicial: <span id="particle-size-ini-val">${particleRef.tamanhoInicial}</span>px</label>
                        <input type="range" id="particle-size-ini" min="1" max="30" value="${particleRef.tamanhoInicial}" style="width:100%;">
                    </div>

                    <div style="margin-bottom:8px;">
                        <label style="font-size:10px; color:#aaa;">Tamanho Final: <span id="particle-size-fim-val">${particleRef.tamanhoFinal}</span>px</label>
                        <input type="range" id="particle-size-fim" min="0" max="30" value="${particleRef.tamanhoFinal}" style="width:100%;">
                    </div>

                    <div style="margin-bottom:8px;">
                        <label style="font-size:10px; color:#aaa;">Opacidade Inicial: <span id="particle-opa-ini-val">${particleRef.opacidadeInicial}</span></label>
                        <input type="range" id="particle-opa-ini" min="0" max="1" step="0.1" value="${particleRef.opacidadeInicial}" style="width:100%;">
                    </div>

                    <div style="margin-bottom:8px;">
                        <label style="font-size:10px; color:#aaa;">Opacidade Final: <span id="particle-opa-fim-val">${particleRef.opacidadeFinal}</span></label>
                        <input type="range" id="particle-opa-fim" min="0" max="1" step="0.1" value="${particleRef.opacidadeFinal}" style="width:100%;">
                    </div>
                </div>

                <!-- Controles de Física -->
                <div style="margin-bottom:15px; padding:8px; background:#1a1a2e; border-radius:4px;">
                    <div style="font-size:11px; color:#4ecdc4; margin-bottom:8px; font-weight:bold;">⚡ Física</div>
                    
                    <div style="margin-bottom:8px;">
                        <label style="font-size:10px; color:#aaa;">Velocidade Min: <span id="particle-vel-min-val">${particleRef.velocidadeMin}</span></label>
                        <input type="range" id="particle-vel-min" min="0" max="500" value="${particleRef.velocidadeMin}" style="width:100%;">
                    </div>

                    <div style="margin-bottom:8px;">
                        <label style="font-size:10px; color:#aaa;">Velocidade Max: <span id="particle-vel-max-val">${particleRef.velocidadeMax}</span></label>
                        <input type="range" id="particle-vel-max" min="0" max="500" value="${particleRef.velocidadeMax}" style="width:100%;">
                    </div>

                    <div style="margin-bottom:8px;">
                        <label style="font-size:10px; color:#aaa;">Ângulo Min (°): <span id="particle-ang-min-val">${particleRef.anguloMin}</span></label>
                        <input type="range" id="particle-ang-min" min="0" max="360" value="${particleRef.anguloMin}" style="width:100%;">
                    </div>

                    <div style="margin-bottom:8px;">
                        <label style="font-size:10px; color:#aaa;">Ângulo Max (°): <span id="particle-ang-max-val">${particleRef.anguloMax}</span></label>
                        <input type="range" id="particle-ang-max" min="0" max="360" value="${particleRef.anguloMax}" style="width:100%;">
                    </div>

                    <div style="margin-bottom:8px;">
                        <label style="font-size:10px; color:#aaa;">Gravidade: <span id="particle-grav-val">${particleRef.gravidade}</span></label>
                        <input type="range" id="particle-grav" min="-200" max="400" value="${particleRef.gravidade}" style="width:100%;">
                    </div>

                    <div style="margin-bottom:8px;">
                        <label style="font-size:10px; color:#aaa;">Arrasto: <span id="particle-arrasto-val">${particleRef.arrasto}</span></label>
                        <input type="range" id="particle-arrasto" min="0.8" max="1.0" step="0.01" value="${particleRef.arrasto}" style="width:100%;">
                    </div>
                </div>

                <!-- Controles de Tempo de Vida -->
                <div style="margin-bottom:15px; padding:8px; background:#1a1a2e; border-radius:4px;">
                    <div style="font-size:11px; color:#4ecdc4; margin-bottom:8px; font-weight:bold;">⏱️ Tempo de Vida</div>
                    
                    <div style="margin-bottom:8px;">
                        <label style="font-size:10px; color:#aaa;">Vida Mín (s): <span id="particle-vida-min-val">${particleRef.tempoVidaMin}</span></label>
                        <input type="range" id="particle-vida-min" min="0.1" max="5" step="0.1" value="${particleRef.tempoVidaMin}" style="width:100%;">
                    </div>

                    <div style="margin-bottom:8px;">
                        <label style="font-size:10px; color:#aaa;">Vida Máx (s): <span id="particle-vida-max-val">${particleRef.tempoVidaMax}</span></label>
                        <input type="range" id="particle-vida-max" min="0.1" max="5" step="0.1" value="${particleRef.tempoVidaMax}" style="width:100%;">
                    </div>
                </div>

                <!-- Info -->
                <div style="font-size:9px; color:#666; padding:5px; background:#111; border-radius:4px;">
                    <div>✨ Partículas ativas: <strong id="particle-count">${particleRef.particulas.length}</strong></div>
                    <div>📊 Taxa: ${particleRef.taxaEmissao}/s | Modo: ${particleRef.modo}</div>
                </div>
            </div>`;
            componentsHtml += createComponentHtml('ParticleEmitterComponent', 'Sistema de Partículas', '✨', '#e74c3c', particleHtml, true);
        }

        // 2.6 Scripts Loop
        // Fix: Usar entries() para pegar o ID correto (chave do mapa)
        for (const [key, script] of ent.componentes.entries()) {
            if (script.tipo !== 'ScriptComponent') continue;

            // Reutiliza renderizarPainelScripts mas extrai apenas o conteúdo interno se possível
            // Na verdade, renderizarPainelScripts retorna HTML string. Podemos adaptar.
            // Simplificando aqui para caber:
            let scriptHtml = `
                    <div style="margin-bottom:5px;">
                        <div style="font-size:10px; color:#aaa; margin-bottom:3px; display:flex; align-items:center; gap:5px;">
                            <span>🏷️</span> 
                            <span style="font-weight:bold; color:#4ecdc4;">${script.scriptName || 'Script Sem Nome'}</span>
                        </div>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn-edit-script-dynamic" data-script-id="${key}" style="flex:1; background:#333; color:#a0f0a0; border:1px solid #4ecdc4; padding:5px; cursor:pointer;">📝 Editar Código</button>
                            <button class="btn-remove-script-dynamic" data-script-id="${key}" style="width:30px; background:#ff6b6b; color:white; border:none; padding:5px; cursor:pointer;">🗑️</button>
                        </div>
                    </div>
                `;
            // Adicionar drop zones de propriedades (simplificado)
            // (Para manter a funcionalidade de DROP ANIMAÇÃO, precisamos renderizar os inputs especiais)
            // Vou chamar uma função auxiliar para renderizar os campos do script.
            scriptHtml += this.renderizarCamposScript(script, key);

            componentsHtml += createComponentHtml(key, script.nome || 'Script Custom', '📜', '#f1c40f', scriptHtml, true);
        }


        // --- 3. BOTÃO ADICIONAR COMPONENTE ---
        const addComponentHtml = `
            <div style="margin-top:10px; padding:10px; text-align:center;">
                <button id="btn-add-component-main" style="width:100%; padding:10px; background:#4ecdc4; color:#1a1a2e; border:none; border-radius:5px; font-weight:bold; cursor:pointer; box-shadow:0 2px 5px rgba(0,0,0,0.3);">
                    + Adicionar Componente
                </button>
            </div>
        `;

        // Renderização Final
        propriedadesContent.innerHTML = headerHtml + componentsHtml + addComponentHtml;

        // --- 4. RESSUSCITAR LISTENERS E COMPORTAMENTOS (Toggle, Inputs, etc) ---
        // (Vou reutilizar apenas a lógica essencial, migrando os listeners antigos)
        this.configurarListenersPropriedades(ent);
    }

    // Novo método auxiliar
    renderizarCamposScript(scriptComp, scriptId) {
        // Lógica simplificada baseada no renderizarPainelScripts anterior
        let html = '';
        if (scriptComp.instance) {
            const props = Object.keys(scriptComp.instance).filter(k => k !== 'entidade' && !k.startsWith('_'));
            if (props.length > 0) html += '<div style="background:#222; padding:5px; border-radius:4px; margin-top:5px;">';
            props.forEach(prop => {
                const valor = scriptComp.instance[prop];
                const isAnimProp = prop.startsWith('anim') && typeof valor === 'string';
                html += `<div style="margin-bottom:4px;">`;
                html += `<label style="font-size:10px; color:#888;">${prop}</label>`;
                if (isAnimProp) {
                    html += `<div class="anim-dropzone-script" data-script-id="${scriptId}" data-prop="${prop}" style="border:1px dashed #666; padding:4px; font-size:11px; color:#cfc; cursor:default;">${valor || '(None)'}</div>`;
                } else {
                    html += `<input type="text" class="script-prop-input" data-script-id="${scriptId}" data-prop="${prop}" value="${valor}" style="width:100%; background:#111; border:1px solid #333; color:white; font-size:10px; padding:2px; transition: border-color 0.2s;">`;
                }
                html += `</div>`;
            });
            if (props.length > 0) html += '</div>';
        }
        return html;
    }

    // Novo método para organizar os Listeners
    configurarListenersPropriedades(ent) {
        // Toggles de Accordion
        // Toggles de Accordion
        document.querySelectorAll('.component-header').forEach(header => {
            header.addEventListener('click', (e) => {
                if (e.target.closest('.btn-remove-component')) return; // Ignore remove click
                const section = header.parentElement.querySelector('.component-body');
                const key = header.dataset.section;
                const isHidden = section.style.display === 'none';

                // Toggle Visual
                section.style.display = isHidden ? 'block' : 'none';
                if (isHidden) header.classList.remove('collapsed');
                else header.classList.add('collapsed');

                // Save State (Explicit true/false overrides default)
                if (!this.propSectionsState) this.propSectionsState = {};
                this.propSectionsState[key] = isHidden; // True if opened, False if closed
            });
        });

        // Botão Adicionar Componente (Modal)
        document.getElementById('btn-add-component-main')?.addEventListener('click', () => this.abrirMenuAdiocionarComponente());

        // Botões Remover Componente
        document.querySelectorAll('.btn-remove-component').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tipo = e.target.dataset.compType;
                if (confirm(`Remover ${tipo}?`)) {
                    ent.removerComponente(tipo);
                    this.atualizarPainelPropriedades();
                }
            });
        });

        // Botões de Plugins (Adicionar)
        document.getElementById('btn-add-camera-plugin')?.addEventListener('click', () => {
            if (!ent.temComponente('CameraFollowComponent')) {
                ent.adicionarComponente('CameraFollowComponent', new CameraFollowComponent());
                this.atualizarPainelPropriedades();
            }
        });
        document.getElementById('btn-add-collision-plugin')?.addEventListener('click', () => {
            if (!ent.temComponente('CollisionComponent')) {
                const col = new CollisionComponent();
                col.inicializar(ent);
                ent.adicionarComponente('CollisionComponent', col);
                this.atualizarPainelPropriedades();
            }
        });

        // Botões de Plugins (Remover) - Delegado no btn-remove-plugin genérico se usado,
        // mas o HTML do plugin usa class "btn-remove-plugin" com data-plugin.
        document.querySelectorAll('.btn-remove-plugin').forEach(btn => {
            btn.addEventListener('click', e => {
                const plugin = e.target.dataset.plugin;
                if (confirm(`Remover ${plugin}?`)) {
                    ent.removerComponente(plugin);
                    this.atualizarPainelPropriedades();
                }
            });
        });

        // Inputs Básicos
        const bindInput = (id, prop, isFloat = false) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', (e) => {
                ent[prop] = isFloat ? parseFloat(e.target.value) : e.target.value;
            });
        };
        bindInput('prop-nome', 'nome');

        // Render Order (Z) Listeners
        document.getElementById('btn-order-back')?.addEventListener('click', () => {
            const idx = this.engine.entidades.indexOf(ent);
            if (idx > 0) {
                // Swap with previous
                [this.engine.entidades[idx], this.engine.entidades[idx - 1]] = [this.engine.entidades[idx - 1], this.engine.entidades[idx]];
                // Sync local list if different
                if (this.entidades !== this.engine.entidades) this.entidades = [...this.engine.entidades];
                this.atualizarHierarquia();
                this.log('Entidade movida para trás (Fundo).', 'info');
            }
        });

        document.getElementById('btn-order-front')?.addEventListener('click', () => {
            const idx = this.engine.entidades.indexOf(ent);
            if (idx < this.engine.entidades.length - 1) {
                // Swap with next
                [this.engine.entidades[idx], this.engine.entidades[idx + 1]] = [this.engine.entidades[idx + 1], this.engine.entidades[idx]];
                // Sync local list if different
                if (this.entidades !== this.engine.entidades) this.entidades = [...this.engine.entidades];
                this.atualizarHierarquia();
                this.log('Entidade movida para frente (Topo).', 'info');
            }
        });
        bindInput('prop-x', 'x', true);
        bindInput('prop-y', 'y', true);
        bindInput('prop-largura', 'largura', true);
        bindInput('prop-altura', 'altura', true);
        bindInput('prop-rot', 'rotacao', true);
        bindInput('prop-cor', 'cor');
        bindInput('prop-cor', 'cor');
        bindInput('prop-opacidade', 'opacidade', true);
        bindInput('prop-zindex', 'zIndex', true);

        document.getElementById('prop-enabled')?.addEventListener('change', (e) => { ent.locked = !e.target.checked; });
        document.getElementById('prop-visible')?.addEventListener('change', e => ent.visivel = e.target.checked);
        document.getElementById('prop-gravidade')?.addEventListener('change', e => ent.temGravidade = e.target.checked);
        document.getElementById('prop-solido')?.addEventListener('change', e => {
            ent.solido = e.target.checked;
            // Sync: Se marcar Sólido, garante que tem CollisionComponent
            if (ent.solido) {
                let col = ent.obterComponente('CollisionComponent');
                if (!col) {
                    // Auto-Add Collision Component
                    // Precisamos da classe CollisionComponent. Assumindo escopo global ou import em EditorPrincipal
                    // EditorPrincipal importa components.
                    const newCol = new CollisionComponent(); // Factory ou direto?
                    if (newCol) {
                        newCol.inicializar(ent);
                        // Ajusta tamanho padrão para igual ao da entidade
                        newCol.largura = ent.largura;
                        newCol.altura = ent.altura;
                        ent.adicionarComponente('CollisionComponent', newCol);
                        this.log('Componente de Colisão adicionado automaticamente!', 'success');
                        this.atualizarPainelPropriedades(); // Refresh para mostrar o componente
                    }
                } else {
                    // Se já existe, força ser sólido (não trigger)
                    col.isTrigger = false;
                    col.ativo = true;
                }
            }
        });

        // Sprite Asset Change
        document.getElementById('prop-asset-sprite')?.addEventListener('change', (e) => {
            const assetId = e.target.value;
            let spriteComp = ent.obterComponente('SpriteComponent');

            // Se não tem componente, cria um
            if (!spriteComp) {
                spriteComp = new SpriteComponent();
                ent.adicionarComponente('SpriteComponent', spriteComp);
            }

            // Se não selecionou asset (Nenhum / Cor Sólida)
            if (!assetId) {
                // Limpa o asset mas MANTÉM o componente
                spriteComp.assetId = null;
                spriteComp.source = null;
                spriteComp.carregada = false;
            } else {
                // Define o novo asset
                spriteComp.assetId = assetId;
                spriteComp.atualizar(ent, 0);
            }

            this.atualizarPainelPropriedades();
        });

        // Autoplay Anim Change
        document.querySelectorAll('.prop-autoplay-anim').forEach(select => {
            select.addEventListener('change', (e) => {
                const val = e.target.value;
                const spriteComp = ent.obterComponente('SpriteComponent');
                if (spriteComp) {
                    spriteComp.autoplayAnim = val;
                    // Força atualização para garantir que as animações do asset foram carregadas no componente
                    spriteComp.atualizar(ent, 0);
                    if (val) spriteComp.play(val);
                }
            });
        });

        // Auto-Fit Collider Button
        document.querySelectorAll('.btn-autofit-collider').forEach(btn => {
            btn.addEventListener('click', () => {
                const colComp = ent.obterComponente('CollisionComponent');
                const spriteComp = ent.obterComponente('SpriteComponent');

                if (colComp && spriteComp && spriteComp.larguraFrame) {
                    // Ajusta ao tamanho do frame
                    colComp.largura = spriteComp.larguraFrame;
                    colComp.altura = spriteComp.alturaFrame;
                    colComp.offsetX = 0;
                    colComp.offsetY = 0;

                    this.atualizarPainelPropriedades();
                    this.log('Collider ajustado ao tamanho do Sprite Frame', 'success');
                } else if (colComp) {
                    // Fallback
                    colComp.largura = ent.largura;
                    colComp.altura = ent.altura;
                    this.atualizarPainelPropriedades();
                }
            });
        });

        // Plugin Props (Generic)
        document.querySelectorAll('.plugin-prop').forEach(input => {
            input.addEventListener('input', (e) => {
                const pluginName = e.target.dataset.plugin;
                const propName = e.target.dataset.prop;
                const comp = ent.obterComponente(pluginName);
                if (comp) {
                    comp[propName] = parseFloat(e.target.value);
                    console.log(`[Editor] Updated ${pluginName}.${propName} to ${comp[propName]}`);
                }
            });
        });

        // KillZone Listeners
        const getKZ = () => ent.obterComponente('KillZoneComponent');
        document.getElementById('prop-kz-global')?.addEventListener('change', e => {
            const k = getKZ(); if (k) { k.globalLine = e.target.checked; this.atualizarPainelPropriedades(); }
        });
        document.getElementById('prop-kz-destroy')?.addEventListener('change', e => {
            const k = getKZ(); if (k) k.destroyPlayer = e.target.checked;
        });
        document.getElementById('prop-kz-x')?.addEventListener('input', e => {
            const k = getKZ(); if (k) k.resetPosition.x = parseFloat(e.target.value);
        });
        document.getElementById('prop-kz-y')?.addEventListener('input', e => {
            const k = getKZ(); if (k) k.resetPosition.y = parseFloat(e.target.value);
        });

        // Checkpoint Listeners
        document.getElementById('prop-check-ativo')?.addEventListener('change', e => {
            const c = ent.obterComponente('CheckpointComponent');
            if (c) c.ativo = e.target.checked;
        });
        document.querySelectorAll('.plugin-prop-check').forEach(input => {
            input.addEventListener('change', (e) => {
                const pluginName = e.target.dataset.plugin;
                const propName = e.target.dataset.prop;
                const comp = ent.obterComponente(pluginName);
                if (comp) comp[propName] = e.target.checked;
            });
        });

        // Tileset Asset Change (New)
        document.querySelectorAll('.tileset-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const assetId = e.target.value;
                const compId = e.target.dataset.compId; // Getting ID or Plugin Name

                // Try getting by ID first (more robust if we had IDs), but here we use PluginName logic usually
                let tileComp = ent.obterComponente('TilemapComponent'); // Simplificado pois só temos 1 por enquanto

                if (tileComp) {
                    tileComp.assetId = assetId;
                    console.log('Tileset changed to:', assetId);
                    // Refresh panel to show the image
                    this.atualizarPainelPropriedades();
                }
            });
        });

        // Listeners de Offset (Sprite)
        const bindOffset = (axis) => {
            document.getElementById(`prop-offset-${axis}`)?.addEventListener('input', (e) => {
                const sprite = ent.obterComponente('SpriteComponent');
                if (sprite) sprite[`offset${axis.toUpperCase()}`] = parseFloat(e.target.value);
            });
        }
        bindOffset('x'); bindOffset('y');

        // Listeners de Scale (Sprite)
        const bindScale = (axis) => {
            document.getElementById(`prop-scale-${axis}`)?.addEventListener('input', (e) => {
                const sprite = ent.obterComponente('SpriteComponent');
                if (sprite) sprite[`scale${axis.toUpperCase()}`] = parseFloat(e.target.value) || 1.0;
            });
        }
        bindScale('x'); bindScale('y');

        // Script Props Edit
        document.querySelectorAll('.script-prop-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const scriptId = e.target.dataset.scriptId;
                const propName = e.target.dataset.prop;
                const valor = e.target.value;

                // Tenta achar componente pelo ID direto (que é a chave no Map)
                let comp = ent.obterComponente(scriptId);

                // Fallback: Se não achou por ID, tenta buscar por tipo se for ScriptComponent (caso ID tenha se perdido na renderização)
                if (!comp) {
                    // Isso é arriscado se tiver 2 scripts, mas melhor que nada. 
                    // O correto é garantir que data-script-id seja a chave do Map.
                }

                if (comp && comp.instance) {
                    // Tenta converter para número se parecer número
                    if (!isNaN(parseFloat(valor)) && isFinite(valor)) {
                        comp.instance[propName] = parseFloat(valor);
                    } else {
                        comp.instance[propName] = valor;
                    }
                    console.log(`[Editor] Updated script ${propName} = ${comp.instance[propName]}`);
                }
            });
        });

        // Scripts Edit
        document.querySelectorAll('.btn-edit-script-dynamic').forEach(btn => {
            btn.addEventListener('click', () => {
                this.abrirEditorScript(ent, btn.dataset.scriptId);
            });
        });

        // Scripts Remove
        document.querySelectorAll('.btn-remove-script-dynamic').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Excluir este script?')) {
                    ent.removerComponente(btn.dataset.scriptId);
                    this.atualizarPainelPropriedades();
                }
            });
        });

        // TILEMAP PALETTE INTERACTIONS (New)
        // TILEMAP PALETTE INTERACTIONS (Enhanced Big Brush)
        const paletteImg = document.getElementById('tile-palette-img');
        if (paletteImg) {
            paletteImg.addEventListener('click', (e) => {
                const rect = paletteImg.getBoundingClientRect();
                const tileComp = ent.obterComponente('TilemapComponent');
                if (!tileComp) return;

                const ratioX = paletteImg.naturalWidth / rect.width;
                const ratioY = paletteImg.naturalHeight / rect.height;

                const clickX = (e.clientX - rect.left) * ratioX;
                const clickY = (e.clientY - rect.top) * ratioY;

                const tileSize = tileComp.tileSize || 32;
                const gx = Math.floor(clickX / tileSize);
                const gy = Math.floor(clickY / tileSize);

                // Lógica de Shift-Click (Seleção de Área)
                if (e.shiftKey && this.lastPaletteClick) {
                    const startGX = this.lastPaletteClick.gx;
                    const startGY = this.lastPaletteClick.gy;

                    // Determinar bounds
                    const minGX = Math.min(startGX, gx);
                    const minGY = Math.min(startGY, gy);
                    const maxGX = Math.max(startGX, gx);
                    const maxGY = Math.max(startGY, gy);

                    const cols = maxGX - minGX + 1;
                    const rows = maxGY - minGY + 1;

                    const sx = minGX * tileSize;
                    const sy = minGY * tileSize;

                    const isSolid = document.getElementById('chk-tile-solid')?.checked || false;
                    const isPlat = document.getElementById('chk-tile-plataforma')?.checked || false;

                    this.tileData = {
                        assetId: tileComp.assetId,
                        x: sx,
                        y: sy,
                        w: cols * tileSize, // Largura total
                        h: rows * tileSize, // Altura total
                        rows: rows, // Metadados para o loop de pintura
                        cols: cols,
                        solid: isSolid,
                        plataforma: isPlat
                    };

                    this.log(`Big Brush selecionado: ${cols}x${rows}`, 'info');

                } else {
                    // Seleção Simples
                    this.lastPaletteClick = { gx, gy }; // Guardar para próximo shift

                    const sx = gx * tileSize;
                    const sy = gy * tileSize;
                    const isSolid = document.getElementById('chk-tile-solid')?.checked || false;
                    const isPlat = document.getElementById('chk-tile-plataforma')?.checked || false;

                    this.tileData = {
                        assetId: tileComp.assetId,
                        x: sx,
                        y: sy,
                        w: tileSize,
                        h: tileSize,
                        solid: isSolid,
                        plataforma: isPlat
                    };
                }

                console.log('[TILE DEBUG] Tile selecionado na paleta:', this.tileData);

                // Salva backup para quando sair da borracha
                this.lastTileData = this.tileData;

                // Atualiza visualização (Selection Rect)
                const selRect = document.getElementById('tile-selection-rect');
                if (selRect) {
                    selRect.style.display = 'block';
                    // O Rect visual deve ser desenhado nas coordenadas VISUAIS (dividido pelo ratio)
                    selRect.style.width = (this.tileData.w / ratioX) + 'px';
                    selRect.style.height = (this.tileData.h / ratioY) + 'px';
                    selRect.style.left = (this.tileData.x / ratioX) + 'px';
                    selRect.style.top = (this.tileData.y / ratioY) + 'px';
                }

                // Ativa ferramenta Brush
                this.definirFerramenta('brush');

                // Visual Update Buttons
                document.querySelectorAll('.btn-tool-tile').forEach(b => b.style.borderColor = '#444');
                const btnPaint = document.querySelector('.btn-tool-tile[data-tool="paint"]');
                if (btnPaint) btnPaint.style.borderColor = '#00ff00';
            });
        }

        // Listeners para Checkboxes (Atualizar brush atual se mudar)
        const updateTileProps = () => {
            const isSolid = document.getElementById('chk-tile-solid')?.checked || false;
            const isPlat = document.getElementById('chk-tile-plataforma')?.checked || false;

            if (this.tileData) {
                this.tileData.solid = isSolid;
                this.tileData.plataforma = isPlat;
            }
            if (this.lastTileData) {
                this.lastTileData.solid = isSolid;
                this.lastTileData.plataforma = isPlat;
            }
        };

        document.getElementById('chk-tile-solid')?.addEventListener('change', updateTileProps);
        document.getElementById('chk-tile-plataforma')?.addEventListener('change', updateTileProps);

        // Tool: Pencil
        document.getElementById('btn-tool-pencil')?.addEventListener('click', (e) => {
            if (this.lastTileData) this.tileData = this.lastTileData;
            this.definirFerramenta('brush');
            // Visual Update
            this._updateToolVisuals('btn-tool-pencil');
        });

        // Tool: Eraser
        document.getElementById('btn-tool-eraser')?.addEventListener('click', (e) => {
            if (this.tileData) this.lastTileData = this.tileData;
            this.tileData = null;
            this.definirFerramenta('brush');
            this._updateToolVisuals('btn-tool-eraser');
        });

        // Tool: Solidifier
        document.getElementById('btn-tool-solid')?.addEventListener('click', (e) => {
            this.definirFerramenta('solidify'); // Custom tool mode
            this._updateToolVisuals('btn-tool-solid');
        });

        document.querySelector('.btn-clear-tilemap')?.addEventListener('click', () => {
            if (confirm('Limpar todo o mapa?')) {
                const map = ent.obterComponente('TilemapComponent');
                if (map) map.limpar();
            }
        });

        // --- Drag & Drop: Script Anim Binding ---
        document.querySelectorAll('.anim-dropzone-script').forEach(zone => {
            zone.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; zone.style.borderColor = '#4ecdc4'; zone.style.background = '#222'; });
            zone.addEventListener('dragleave', e => { zone.style.borderColor = '#666'; zone.style.background = 'transparent'; });
            zone.addEventListener('drop', e => {
                e.preventDefault();
                zone.style.borderColor = '#666';
                zone.style.background = 'transparent';
                const dataStr = e.dataTransfer.getData('text/plain');
                if (!dataStr) return;
                try {
                    const data = JSON.parse(dataStr);
                    if (data.type === 'anim-ref') {
                        const scriptId = zone.dataset.scriptId;
                        const propName = zone.dataset.prop;
                        const scriptComp = ent.obterComponente(scriptId);
                        if (scriptComp && scriptComp.instance) {
                            scriptComp.instance[propName] = data.animName;
                            if (tipo === 'KillZoneComponent') {
                                novaEntidade.adicionarComponente(new KillZoneComponent(novaEntidade));
                                // Auto-add Collision Trigger
                                const col = new CollisionComponent();
                                col.isTrigger = true;
                                col.largura = novaEntidade.largura;
                                col.altura = novaEntidade.altura;
                                novaEntidade.adicionarComponente(col);
                                this.log('Area de Morte adicionada (com Trigger)', 'success');
                            }

                            this.atualizarPainelPropriedades();
                        }
                    }
                } catch (err) { }
            });
        });

        // --- Drag & Drop: Palette to Sprite Asset ---
        document.querySelectorAll('.anim-dropzone').forEach(zone => {
            zone.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; zone.style.borderColor = '#4ecdc4'; zone.style.background = '#222'; });
            zone.addEventListener('dragleave', e => { if (zone.contains(e.relatedTarget)) return; zone.style.borderColor = '#444'; zone.style.background = '#111'; });
            zone.addEventListener('drop', e => {
                e.preventDefault();
                zone.style.borderColor = '#444'; zone.style.background = '#111';
                const dataStr = e.dataTransfer.getData('text/plain');
                if (!dataStr) return;
                try {
                    const data = JSON.parse(dataStr);
                    const assetId = zone.dataset.assetId;
                    const animName = zone.dataset.anim;
                    const asset = this.assetManager.obterAsset(assetId);
                    if (asset && asset.animacoes && asset.animacoes[animName] && data.type === 'tile') {
                        asset.animacoes[animName].push({ x: data.x, y: data.y, w: data.w, h: data.h, duration: 100, sheetWidth: data.sheetWidth });
                        this.atualizarPainelPropriedades();
                    }
                } catch (err) { }
            });
        });

        // --- Draggable Source (Animations) ---
        document.querySelectorAll('.draggable-anim-source').forEach(el => {
            el.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'anim-ref', animName: el.dataset.animName }));
            });
        });

        // Parallax Listener
        document.querySelector('.btn-add-parallax-layer')?.addEventListener('click', () => {
            const parallax = ent.obterComponente('ParallaxComponent');
            if (parallax) {
                parallax.addLayer();
                this.atualizarPainelPropriedades();
            }
        });

        document.querySelectorAll('.btn-remove-parallax-layer').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const parallax = ent.obterComponente('ParallaxComponent');
                if (parallax) {
                    const idx = parseInt(e.target.dataset.index);
                    parallax.removeLayer(idx);
                    this.atualizarPainelPropriedades();
                }
            });
        });

        document.querySelectorAll('.parallax-layer-prop').forEach(input => {
            input.addEventListener('change', (e) => {
                const parallax = ent.obterComponente('ParallaxComponent');
                if (parallax) {
                    const idx = parseInt(e.target.dataset.index);
                    const prop = e.target.dataset.prop;
                    let val = e.target.value;
                    if (input.type === 'number') val = parseFloat(val);
                    if (input.type === 'checkbox') val = e.target.checked;

                    if (parallax.layers[idx]) {
                        parallax.layers[idx][prop] = val;
                    }
                }
            });
        });

        // Dialogue Listener
        document.querySelector('.btn-add-dialogue')?.addEventListener('click', () => {
            const diagComp = ent.obterComponente('DialogueComponent');
            if (diagComp) {
                diagComp.adicionarDialogo();
                this.atualizarPainelPropriedades();
            }
        });

        document.querySelector('.btn-test-dialogue')?.addEventListener('click', () => {
            const diagComp = ent.obterComponente('DialogueComponent');
            if (diagComp) diagComp.iniciar();
        });

        document.querySelector('.btn-stop-dialogue')?.addEventListener('click', () => {
            const diagComp = ent.obterComponente('DialogueComponent');
            if (diagComp) diagComp.ativo = false;
        });

        document.querySelectorAll('.btn-remove-dialogue').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const diagComp = ent.obterComponente('DialogueComponent');
                if (diagComp) {
                    const idx = parseInt(e.target.dataset.index);
                    diagComp.removerDialogo(idx);
                    this.atualizarPainelPropriedades();
                }
            });
        });

        document.querySelectorAll('.dialogue-prop').forEach(input => {
            input.addEventListener('input', (e) => {
                const diagComp = ent.obterComponente('DialogueComponent');
                if (diagComp) {
                    const idx = parseInt(e.target.dataset.index);
                    const prop = e.target.dataset.prop;
                    if (diagComp.dialogos[idx]) {
                        diagComp.dialogos[idx][prop] = e.target.value;
                    }
                }
            });
        });

        // Tilemap Listener
        document.querySelector('.btn-clear-tilemap')?.addEventListener('click', () => {
            if (confirm('Limpar todo o mapa?')) {
                const tileComp = ent.obterComponente('TilemapComponent');
                if (tileComp) {
                    tileComp.limpar();
                    // Forçar redraw? Geralmente atualizarPainelPropriedades já re-binda.
                    // Mas o redesenho do canvas acontece no loop do jogo/editor.
                }
            }
        });

        // Listeners de Offset (Sprite) - Injetado Manualmente para garantir fix
        // Listeners de Offset (Sprite) - Injetado Manualmente com Feedback Visual
        ['x', 'y'].forEach(axis => {
            const el = document.getElementById(`prop-offset-${axis}`);
            if (el) {
                el.addEventListener('input', (e) => {
                    const sprite = ent.obterComponente('SpriteComponent');
                    if (sprite) {
                        const val = parseFloat(e.target.value);
                        sprite[`offset${axis.toUpperCase()}`] = val;

                        // Feedback no console do editor (Debounce handling ideally needed, but ok for now)
                        // this.log(`Offset ${axis.toUpperCase()}: ${val}`, 'info'); 

                        if (!this.engine.simulado) this.renderizar();
                    }
                });
            }
        });

        // ===== PARTICLE TEMPLATE LISTENERS =====

        // Template Dropdown
        document.getElementById('particle-template')?.addEventListener('change', (e) => {
            const particleComp = ent.obterComponente('ParticleEmitterComponent');
            if (!particleComp) return;

            const templateId = e.target.value;

            if (templateId) {
                // Aplicar template
                const template = this.particleTemplateManager.obterTemplate(templateId);
                if (template) {
                    particleComp.aplicarTemplate(template);
                    this.atualizarPainelPropriedades(); // Atualizar para mostrar novas propriedades
                }
            } else {
                // Desvinculou do template
                particleComp.templateId = null;
            }
        });

        // Botão Gerenciar Templates
        document.getElementById('btn-manage-templates')?.addEventListener('click', () => {
            this.abrirGerenciadorTemplates();
        });

        // Particle Emitter Listeners
        document.getElementById('btn-apply-preset')?.addEventListener('click', () => {
            const particleComp = ent.obterComponente('ParticleEmitterComponent');
            const preset = document.getElementById('particle-preset')?.value;
            if (particleComp && preset) {
                particleComp.aplicarPreset(preset);
                this.atualizarPainelPropriedades();
            }
        });

        document.getElementById('particle-emitindo')?.addEventListener('change', (e) => {
            const particleComp = ent.obterComponente('ParticleEmitterComponent');
            if (particleComp) {
                particleComp.emitindo = e.target.checked;
            }
        });

        // Emissão
        const setupParticleSlider = (id, prop, displayId, suffix = '') => {
            const slider = document.getElementById(id);
            const display = document.getElementById(displayId);
            if (slider && display) {
                slider.addEventListener('input', (e) => {
                    const particleComp = ent.obterComponente('ParticleEmitterComponent');
                    if (particleComp) {
                        particleComp[prop] = parseFloat(e.target.value);
                        display.textContent = e.target.value + suffix;
                    }
                });
            }
        };

        setupParticleSlider('particle-taxa', 'taxaEmissao', 'particletaxa-val');
        setupParticleSlider('particle-max', 'maxParticulas', 'particle-max-val');

        document.getElementById('particle-modo')?.addEventListener('change', (e) => {
            const particleComp = ent.obterComponente('ParticleEmitterComponent');
            if (particleComp) particleComp.modo = e.target.value;
        });

        // Visual
        document.getElementById('particle-cor-ini')?.addEventListener('input', (e) => {
            const particleComp = ent.obterComponente('ParticleEmitterComponent');
            if (particleComp) particleComp.corInicial = e.target.value;
        });

        document.getElementById('particle-cor-fim')?.addEventListener('input', (e) => {
            const particleComp = ent.obterComponente('ParticleEmitterComponent');
            if (particleComp) particleComp.corFinal = e.target.value;
        });

        setupParticleSlider('particle-size-ini', 'tamanhoInicial', 'particle-size-ini-val', 'px');
        setupParticleSlider('particle-size-fim', 'tamanhoFinal', 'particle-size-fim-val', 'px');
        setupParticleSlider('particle-opa-ini', 'opacidadeInicial', 'particle-opa-ini-val');
        setupParticleSlider('particle-opa-fim', 'opacidadeFinal', 'particle-opa-fim-val');

        // Física
        setupParticleSlider('particle-vel-min', 'velocidadeMin', 'particle-vel-min-val');
        setupParticleSlider('particle-vel-max', 'velocidadeMax', 'particle-vel-max-val');
        setupParticleSlider('particle-ang-min', 'anguloMin', 'particle-ang-min-val', '°');
        setupParticleSlider('particle-ang-max', 'anguloMax', 'particle-ang-max-val', '°');
        setupParticleSlider('particle-grav', 'gravidade', 'particle-grav-val');
        setupParticleSlider('particle-arrasto', 'arrasto', 'particle-arrasto-val');

        // Tempo de Vida
        setupParticleSlider('particle-vida-min', 'tempoVidaMin', 'particle-vida-min-val', 's');
        setupParticleSlider('particle-vida-max', 'tempoVidaMax', 'particle-vida-max-val', 's');
    }

    /**
    * Abre menu/modal para escolher novo componente
    */
    abrirMenuAdiocionarComponente() {
        const ent = this.entidadeSelecionada;
        const t = window.i18n.t.bind(window.i18n); // Helper para tradução

        // Componentes organizados por categoria
        const categorias = {
            [t('category.system')]: [
                { id: 'SpriteComponent', nome: t('comp.spriteRenderer'), icon: '🖼️', unico: true },
                { id: 'CollisionComponent', nome: t('comp.boxCollider'), icon: '📦', unico: true },
                { id: 'CameraFollowComponent', nome: t('comp.cameraFollow'), icon: '🎥', unico: true },
                { id: 'TilemapComponent', nome: t('comp.tilemapSystem'), icon: '🧱', unico: true }
            ],
            [t('category.visual')]: [
                { id: 'ParallaxComponent', nome: t('comp.parallaxBg'), icon: '🌄', unico: true },
                { id: 'ParticleEmitterComponent', nome: t('comp.particleSystem'), icon: '✨', unico: false }
            ],
            [t('category.gameplay')]: [
                { id: 'DialogueComponent', nome: t('comp.dialogueSystem'), icon: '💬', unico: true },
                { id: 'KillZoneComponent', nome: t('comp.killZone'), icon: '💀', unico: true },
                { id: 'CheckpointComponent', nome: t('comp.checkpoint'), icon: '🚩', unico: true }
            ],
            [t('category.scripts')]: [
                { id: 'ScriptComponent_Custom', nome: t('comp.scriptEmpty'), icon: '📜', unico: false },
                { id: 'ScriptComponent_Basic', nome: t('comp.rpgTopDown'), icon: '🎮', unico: false },
                { id: 'ScriptComponent_Platform', nome: t('comp.platformer'), icon: '🏃', unico: false },
                { id: 'ScriptComponent_Patrol', nome: t('comp.aiPatrol'), icon: '🤖', unico: false },
                { id: 'ScriptComponent_Death', nome: t('comp.deathFade'), icon: '🎞️', unico: false },
                { id: 'ScriptComponent_Interaction', nome: t('comp.interaction'), icon: '💬', unico: false },
                { id: 'ScriptComponent_Melee', nome: t('comp.meleeCombat'), icon: '⚔️', unico: false },
                { id: 'ScriptComponent_Respawn', nome: t('comp.respawn'), icon: '👻', unico: false }
            ],
            [t('category.plugins')]: [
                { id: 'ScriptComponent_FloatingText', nome: t('comp.floatingText'), icon: '✨', unico: true }
            ]
        };

        // Flatmap para busca
        const todasOpcoes = Object.values(categorias).flat();

        // Filtrar disponíveis
        const disponiveisPorCategoria = {};
        Object.keys(categorias).forEach(cat => {
            const filtrados = categorias[cat].filter(opt => !opt.unico || !ent.temComponente(opt.id));
            if (filtrados.length > 0) {
                disponiveisPorCategoria[cat] = filtrados;
            }
        });

        if (Object.keys(disponiveisPorCategoria).length === 0) {
            alert('Todos os componentes disponíveis já foram adicionados!');
            return;
        }

        // Criar Modal Melhorado
        const modal = document.createElement('div');
        modal.id = 'modal-add-component';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(180deg, #1a1a2e 0%, #2a1a40 100%);
            border: 2px solid #c9a0ff;
            padding: 0;
            z-index: 2000;
            width: 500px;
            max-height: 80vh;
            box-shadow: 0 0 50px rgba(201,160,255,0.3);
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        `;

        // Header
        const header = `
            <div style="padding: 20px; border-bottom: 1px solid #444; background: #1a1a2e;">
                <h3 style="color: #c9a0ff; margin: 0 0 15px 0; font-size: 18px;">
                    ✨ ${t('component.add')}
                </h3>
                <input 
                    type="text" 
                    id="search-component" 
                    placeholder="🔍 ${t('other.search')}"
                    style="
                        width: 100%;
                        padding: 10px;
                        background: #2a2a40;
                        border: 1px solid #444;
                        border-radius: 6px;
                        color: white;
                        font-size: 14px;
                        outline: none;
                    "
                />
            </div>
        `;

        // Content (categories)
        let content = `
            <div id="component-list" style="
                overflow-y: auto;
                flex: 1;
                padding: 15px;
            ">
        `;

        Object.keys(disponiveisPorCategoria).forEach(categoria => {
            content += `
                <div class="component-category" style="margin-bottom: 20px;">
                    <h4 style="color: #ffd700; font-size: 12px; text-transform: uppercase; margin: 0 0 10px 0; letter-spacing: 1px;">
                        ${categoria}
                    </h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            `;

            disponiveisPorCategoria[categoria].forEach(opt => {
                content += `
                    <button 
                        class="btn-select-comp" 
                        data-id="${opt.id}"
                        data-name="${opt.nome.toLowerCase()}"
                        style="
                            padding: 12px;
                            text-align: left;
                            background: #2a2a40;
                            color: white;
                            border: 1px solid #444;
                            border-radius: 6px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            transition: all 0.2s;
                            font-size: 13px;
                        "
                        onmouseover="this.style.background='#3a3a50'; this.style.borderColor='#c9a0ff';"
                        onmouseout="this.style.background='#2a2a40'; this.style.borderColor='#444';"
                    >
                        <span style="font-size: 20px;">${opt.icon}</span>
                        <span style="flex: 1;">${opt.nome}</span>
                    </button>
                `;
            });

            content += `
                    </div>
                </div>
            `;
        });

        content += `</div>`;

        // Footer
        const footer = `
            <div style="padding: 15px; border-top: 1px solid #444; background: #1a1a2e; text-align: right;">
                <button 
                    id="btn-cancel-comp"
                    style="
                        padding: 8px 20px;
                        background: transparent;
                        color: #888;
                        border: 1px solid #444;
                        border-radius: 6px;
                        cursor: pointer;
                        transition: all 0.2s;
                    "
                    onmouseover="this.style.borderColor='#666';"
                    onmouseout="this.style.borderColor='#444';"
                >
                    Cancelar
                </button>
            </div>
        `;

        modal.innerHTML = header + content + footer;
        document.body.appendChild(modal);

        // Event: Search
        const searchInput = modal.querySelector('#search-component');
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const buttons = modal.querySelectorAll('.btn-select-comp');
            const categories = modal.querySelectorAll('.component-category');

            buttons.forEach(btn => {
                const name = btn.dataset.name;
                if (name.includes(query)) {
                    btn.style.display = 'flex';
                } else {
                    btn.style.display = 'none';
                }
            });

            // Hide empty categories
            categories.forEach(cat => {
                const visibleButtons = cat.querySelectorAll('.btn-select-comp[style*="display: flex"]');
                if (visibleButtons.length === 0) {
                    cat.style.display = 'none';
                } else {
                    cat.style.display = 'block';
                }
            });
        });

        // Event: Cancel
        modal.querySelector('#btn-cancel-comp').onclick = () => document.body.removeChild(modal);

        // Event: Select Component
        modal.querySelectorAll('.btn-select-comp').forEach(btn => {
            btn.onclick = () => {
                const tipo = btn.dataset.id;

                // Scripts
                if (tipo === 'ScriptComponent_Custom') {
                    this.adicionarScript(ent, 'custom');
                } else if (tipo === 'ScriptComponent_Basic') {
                    this.adicionarScript(ent, 'basico');
                } else if (tipo === 'ScriptComponent_Platform') {
                    this.adicionarScript(ent, 'plataforma');
                } else if (tipo === 'ScriptComponent_Patrol') {
                    this.adicionarScript(ent, 'patrulha');
                } else if (tipo === 'ScriptComponent_Death') {
                    this.adicionarScript(ent, 'morte');
                } else if (tipo === 'ScriptComponent_FloatingText') {
                    this.adicionarScript(ent, 'textoFlutuante');
                } else if (tipo === 'ScriptComponent_Interaction') {
                    this.adicionarScript(ent, 'interacao');
                } else if (tipo === 'ScriptComponent_Melee') {
                    this.adicionarScript(ent, 'ataqueMelee');
                } else if (tipo === 'ScriptComponent_Respawn') {
                    this.adicionarScript(ent, 'respawn');
                }
                // Componentes
                else if (tipo === 'SpriteComponent') {
                    ent.adicionarComponente('SpriteComponent', new SpriteComponent());
                } else if (tipo === 'CollisionComponent') {
                    ent.adicionarComponente('CollisionComponent', new CollisionComponent());
                    const c = ent.obterComponente('CollisionComponent');
                    c.largura = 32; c.altura = 32; c.inicializar(ent);
                } else if (tipo === 'CameraFollowComponent') {
                    ent.adicionarComponente('CameraFollowComponent', new CameraFollowComponent());
                } else if (tipo === 'TilemapComponent') {
                    ent.adicionarComponente('TilemapComponent', new TilemapComponent());
                } else if (tipo === 'ParallaxComponent') {
                    ent.adicionarComponente('ParallaxComponent', new ParallaxComponent());
                } else if (tipo === 'DialogueComponent') {
                    ent.adicionarComponente('DialogueComponent', new DialogueComponent());
                } else if (tipo === 'KillZoneComponent') {
                    ent.adicionarComponente('KillZoneComponent', new KillZoneComponent(ent));
                    const col = new CollisionComponent();
                    col.isTrigger = true;
                    col.largura = ent.largura || 32;
                    col.altura = ent.altura || 32;
                    col.inicializar(ent);
                    ent.adicionarComponente('CollisionComponent', col);
                } else if (tipo === 'CheckpointComponent') {
                    ent.adicionarComponente('CheckpointComponent', new CheckpointComponent(ent));
                    if (!ent.temComponente('CollisionComponent')) {
                        const col = new CollisionComponent();
                        col.isTrigger = true;
                        col.largura = ent.largura || 32;
                        col.altura = ent.altura || 32;
                        col.inicializar(ent);
                        ent.adicionarComponente('CollisionComponent', col);
                    } else {
                        ent.obterComponente('CollisionComponent').isTrigger = true;
                    }
                } else if (tipo === 'ParticleEmitterComponent') {
                    const particles = new ParticleEmitterComponent();
                    particles.aplicarPreset('fogo');
                    ent.adicionarComponente('ParticleEmitterComponent', particles);
                }

                this.atualizarPainelPropriedades();
                document.body.removeChild(modal);
            };
        });

        // Focus search
        searchInput.focus();
    }

    abrirConfiguracoesCena() {
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.background = 'rgba(0,0,0,0.8)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '2000';

        const content = document.createElement('div');
        content.style.background = '#222';
        content.style.padding = '20px';
        content.style.borderRadius = '8px';
        content.style.width = '300px';
        content.style.border = '1px solid #4ecdc4';

        content.innerHTML = `
            <h3 style="margin-top:0; color:#4ecdc4;">⚙️ Configurações da Cena</h3>
            
            <div style="margin-bottom:15px;">
                <label style="display:block; font-size:12px; color:#aaa; margin-bottom:5px;">Cor de Fundo (Background)</label>
                <div style="display:flex; gap:10px;">
                    <input type="color" id="cfg-bg-color" value="${this.sceneConfig.backgroundColor}" style="height:30px; cursor:pointer;">
                    <input type="text" id="cfg-bg-text" value="${this.sceneConfig.backgroundColor}" style="flex:1; background:#111; color:white; border:1px solid #444; padding:5px;">
                </div>
            </div>

            <div style="text-align:right; margin-top:20px;">
                <button id="btn-close-cfg" style="background:#444; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer;">Fechar</button>
            </div>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // Listeners
        const colorInput = content.querySelector('#cfg-bg-color');
        const textInput = content.querySelector('#cfg-bg-text');

        const updateColor = (val) => {
            this.sceneConfig.backgroundColor = val;
            textInput.value = val;
            colorInput.value = val;
            this.renderizar(); // Force redraw to see change immediately
        };

        colorInput.addEventListener('input', (e) => updateColor(e.target.value));
        textInput.addEventListener('input', (e) => updateColor(e.target.value));

        content.querySelector('#btn-close-cfg').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    /**
     * Atualiza o contador de entidades
     */
    atualizarContadorEntidades() {
        const contador = document.getElementById('entidades-count');
        if (contador) {
            contador.textContent = this.entidades.length;
        }
    }

    /**
     * Cria um novo projeto (limpa tudo)
     */
    novoProjeto(confirmar = true) {
        if (!confirmar || confirm('⚠️ Atenção: Todo o trabalho não salvo será perdido. Deseja criar um novo projeto?')) {
            // Limpar dados
            this.entidades = [];
            this.engine.entidades = []; // Limpa engine
            this.entidadeSelecionada = null;
            this.pastas = [];

            // Reiniciar contadores (Importante!)
            Entidade.contadorId = 0;

            // Limpar Assets também? Geralmente sim para "Novo Projeto" completo
            if (this.assetManager) {
                this.assetManager.limpar();
            }

            // Resetar Câmera
            this.camera.x = 0;
            this.camera.y = 0;
            this.camera.zoom = 1;

            // Criar Estrutura Padrão (Cena 01)
            this.criarPasta('Cena 01');

            // Atualizar UI
            this.atualizarHierarquia();
            this.atualizarPainelPropriedades();
            this.atualizarContadorEntidades();
            if (this.painelAssets) this.painelAssets.atualizar();

            this.log('Novo projeto criado: Cena 01', 'success');
        }
    }

    /**
     * Salva o projeto
     */
    salvarProjeto() {
        const projeto = {
            nome: 'Meu Projeto',
            versao: '1.0.0',
            entidades: this.entidades.map(e => e.serializar()),
            pastas: this.pastas || [],
            assets: this.assetManager ? this.assetManager.serializar() : null,
            sceneConfig: this.sceneConfig || { backgroundColor: '#0a0a15' }
        };

        const json = JSON.stringify(projeto, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'projeto-game-engine.json';
        a.click();
        URL.revokeObjectURL(url);

        this.log('Projeto salvo com sucesso!', 'success');
    }

    /**
     * Aplica configurações da cena (ex: cor de fundo)
     */
    aplicarSceneConfig() {
        if (!this.sceneConfig) return;

        if (this.engine && this.engine.renderizador) {
            this.engine.renderizador.definirCorFundo(this.sceneConfig.backgroundColor);
        }
        this.renderizar();
    }

    /**
     * Salva o estado atual das entidades para restauração posterior
     */
    salvarEstadoInicial() {
        // Salva entidades e a estrutura de pastas
        const dados = this.entidades.map(e => e.serializar());

        const estadoCompleto = {
            entidades: dados,
            pastas: this.pastas,
            assets: this.assetManager ? this.assetManager.serializar() : null,
            sceneConfig: this.sceneConfig
        };
        this.estadoInicial = JSON.stringify(estadoCompleto);
    }

    /**
     * Restaura o estado inicial do jogo (Saved State)
     */
    restaurarEstadoInicial() {
        if (!this.estadoInicial) return;

        console.log('Restaurando estado inicial...');
        let snapshot;
        try {
            snapshot = JSON.parse(this.estadoInicial);
        } catch (e) { return; }

        const dadosEntidades = snapshot.entidades || [];

        // Restaurar pastas
        if (snapshot.pastas) {
            this.pastas = snapshot.pastas;
        }

        // Restaurar Scene Config (Background color etc)
        if (snapshot.sceneConfig) {
            this.sceneConfig = snapshot.sceneConfig;
            this.aplicarSceneConfig();
        }

        // Restaurar Assets
        if (snapshot.assets && this.assetManager) {
            this.assetManager.desserializar(snapshot.assets);
            if (this.painelAssets) this.painelAssets.atualizar();
        }

        // Limpar entidades atuais
        this.entidades = [];
        this.engine.entidades = [];
        this.entidadeSelecionada = null;

        // Recriar entidades E COMPONENTES
        for (const dado of dadosEntidades) {
            const entidade = Entidade.desserializar(dado);

            // CRÍTICO: Recriar componentes manualmente (Entidade.desserializar não cria componentes)
            if (dado.componentes) {
                // Suporte para Array (legacy/novo) ou Objeto (mapa por tipo, usado em alguns saves)
                const listaComponentes = Array.isArray(dado.componentes)
                    ? dado.componentes
                    : Object.values(dado.componentes);

                for (const dadosComp of listaComponentes) {
                    let componente = null;

                    try {
                        // Criar componente baseado no tipo
                        if (dadosComp.tipo === 'SpriteComponent') {
                            componente = new SpriteComponent();
                        } else if (dadosComp.tipo === 'CollisionComponent') {
                            componente = new CollisionComponent();
                        } else if (dadosComp.tipo === 'ScriptComponent') {
                            componente = new ScriptComponent();
                        } else if (dadosComp.tipo === 'TilemapComponent') {
                            componente = new TilemapComponent();
                        } else if (dadosComp.tipo === 'CameraFollowComponent') {
                            componente = new CameraFollowComponent();
                        } else if (dadosComp.tipo === 'ParallaxComponent') {
                            componente = new ParallaxComponent();
                        } else if (dadosComp.tipo === 'DialogueComponent') {
                            componente = new DialogueComponent();
                        } else if (dadosComp.tipo === 'KillZoneComponent') {
                            componente = new KillZoneComponent();
                        } else if (dadosComp.tipo === 'CheckpointComponent') {
                            componente = new CheckpointComponent();
                        } else if (dadosComp.tipo === 'ParticleEmitterComponent') {
                            componente = new ParticleEmitterComponent();
                        }

                        // Deserializar dados do componente se possível
                        if (componente) {
                            const dadosConfig = dadosComp.config || dadosComp;

                            if (componente.desserializar && dadosConfig) {
                                componente.desserializar(dadosConfig);
                            } else if (dadosComp.config) {
                                Object.assign(componente, dadosComp.config);
                            } else {
                                Object.assign(componente, dadosComp);
                            }

                            // Se for ScriptComponent, usa o ID salvo como chave para permitir múltiplos scripts
                            if (componente instanceof ScriptComponent && componente.id) {
                                entidade.adicionarComponente(componente.id, componente);
                            } else {
                                entidade.adicionarComponente(componente);
                            }
                        }
                    } catch (err) {
                        console.warn(`Erro ao restaurar componente ${dadosComp.tipo}:`, err);
                    }
                }
            }

            this.entidades.push(entidade);
            this.engine.adicionarEntidade(entidade);
        }

        this.estadoInicial = null; // Limpar snapshot

        // Atualizar interface
        this.atualizarHierarquia();
        this.atualizarPainelPropriedades();
        this.atualizarContadorEntidades();

        // Ensure buttons update correctly if Pause was active
        const btnPause = document.getElementById('btn-pause');
        if (btnPause) {
            btnPause.textContent = '⏸ Pause';
            btnPause.style.background = '#ffd93d';
        }
    }

    /**
     * Atualiza visualmente os botões de ferramentas
     */
    _updateToolVisuals(activeId) {
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        const btn = document.getElementById(activeId);
        if (btn) btn.classList.add('active');
    }

    /**
     * Define a ferramenta de Brush com os dados do Tile Palette
     */
    ativarFerramentaBrush(tileData) {
        this.tileData = tileData;
        if (tileData && tileData.tool === 'solidifier') {
            this.definirFerramenta('solidify');
        } else {
            this.definirFerramenta('brush');
        }

        // Se tileData for nulo, é borracha
        if (!tileData) {
            this._updateToolVisuals('btn-tool-eraser');
        } else if (tileData.tool !== 'solidifier') {
            this._updateToolVisuals('btn-tool-pencil');
        }
    }

    /**
     * Renderiza o painel de scripts
     */
    renderizarPainelScripts(ent) {
        let scriptsHtml = '';
        let hasScripts = false;

        // Iterar sobre todos os componentes para encontrar scripts
        for (const [nome, comp] of ent.componentes.entries()) {
            if (comp instanceof ScriptComponent) {
                hasScripts = true;
                // Prefira o nome amigável do componente (que acabamos de setar em adicionarScript)
                // Se não houver, tenta o nome da classe da instância
                // Se não, fallback.
                const nomeDisplay = comp.nome && comp.nome !== 'ScriptComponent'
                    ? comp.nome
                    : (comp.instance ? comp.instance.constructor.name : 'Script sem nome');

                // --- PARSE DE CONSTANTES GLOBAIS ---
                let globalConstsHtml = '';
                if (comp.source) {
                    // Regex para pegar: const/let/var nome = valor;
                    const regexConsts = /(const|let|var)\s+(\w+)\s*=\s*(null|['"`].*?['"`]);/g;
                    let match;
                    while ((match = regexConsts.exec(comp.source)) !== null) {
                        const varName = match[2];
                        let varValue = match[3];
                        if (varValue !== 'null') varValue = varValue.replace(/['"`]/g, '');
                        else varValue = ''; // Null mostra vazio

                        globalConstsHtml += `
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px; border-left: 2px solid #4ecdc4; padding-left: 5px;">
                                <label style="font-size: 10px; color: #4ecdc4;">${varName}</label>
                                <input type="text" 
                                       class="input-script-constant" 
                                       data-script-id="${nome}" 
                                       data-var-name="${varName}"
                                       value="${varValue}" 
                                       readonly 
                                       placeholder="Arrastar..."
                                       style="width: 80px; background: #1a1a2e; border: 1px dashed #555; color: #fff; font-size: 11px; padding: 2px;">
                            </div>
                        `;
                    }
                }

                let propriedadesHtml = '';
                if (comp.instance) {
                    // Refinamento: Iterar sobre propriedades para criar inputs
                    const propsIgnoradas = ['entidade', 'estado', 'velocidadeX', 'velocidadeY', 'dashDisponivel', 'tempoDash', 'tempoCooldown', 'direcaoDashX', 'direcaoDashY', 'correndo'];

                    for (const key of Object.keys(comp.instance)) {
                        if (propsIgnoradas.includes(key)) continue;

                        const valor = comp.instance[key];
                        const tipoValor = typeof valor;

                        if (tipoValor === 'number' || tipoValor === 'string') {
                            const inputType = tipoValor === 'number' ? 'number' : 'text';
                            propriedadesHtml += `
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px;">
                                    <label style="font-size: 10px; color: #aaa;">${key}</label>
                                    <input type="${inputType}" class="input-propriedade-script" 
                                           data-script-id="${nome}" data-prop="${key}" data-type="${tipoValor}"
                                           value="${valor}" 
                                           style="width: 60px; background: #111; border: 1px solid #444; color: #fff; font-size: 11px; padding: 2px;">
                                </div>
                            `;
                        }
                    }
                }

                scriptsHtml += `
    <div style="background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; margin-bottom: 5px; border-left: 2px solid #4ecdc4;" >
                        <div style="font-size: 11px; margin-bottom: 5px; color: #aaa; display: flex; justify-content: space-between;">
                            <span>📜 ${nomeDisplay}</span>
                            <span style="font-size: 9px; opacity: 0.5;">${nome}</span>
                        </div>
                        
                        <div style="margin-bottom: 8px; padding-left: 5px; border-left: 1px solid #333;">
                            ${globalConstsHtml ? `<div style="margin-bottom:5px; padding-bottom:5px; border-bottom:1px solid #333;">${globalConstsHtml}</div>` : ''}
                            ${propriedadesHtml}
                        </div>

                        <div style="display: flex; gap: 5px;">
                            <button class="btn-edit-script-dynamic" data-script-id="${nome}" style="flex: 1; background: #4ecdc4; color: #1a1a2e; border: none; padding: 4px; border-radius: 4px; cursor: pointer; font-size: 11px;">✏️ Editar Código</button>
                            <button class="btn-remove-script-dynamic" data-script-id="${nome}" style="flex: 0 0 30px; background: #ff6b6b; color: white; border: none; padding: 4px; border-radius: 4px; cursor: pointer;">🗑️</button>
                        </div>
                    </div >
    `;
            }
        }

        const addHtml = `
    <div style="display: flex; gap: 5px; flex-direction: column; margin-top: 5px; border-top: 1px solid #333; padding-top: 5px;" >
                <select id="select-script-tipo" style="background: #1a1a2e; color: #fff; border: 1px solid #444; padding: 5px; border-radius: 4px;">
                    <option value="plataforma">Movimento Plataforma (Side-Scroller)</option>
                    <option value="basico">Movimento RPG (Top-Down)</option>
                    <option value="patrulha">IA Inimigo (Patrulha)</option>
                    <option value="ataqueMelee">Combate Melee (Ataque)</option>
                    <option value="respawn">Sistema de Respawn (Inimigo)</option>
                    <option value="morte">Efeito de Morte (Fade)</option>
                    <option value="textoFlutuante">Plugin: Texto Flutuante</option>
                    <option value="interacao">Sistema de Interação (NPC/Placa)</option>
                    <option value="vazio">Script Vazio</option>
                </select>
                <button id="btn-add-script" style="width: 100%; background: #2a2a4a; color: white; border: 1px solid #444; padding: 5px; border-radius: 4px; cursor: pointer; border-left: 3px solid #4ecdc4;">➕ Adicionar Novo Script</button>
            </div >
    `;

        return scriptsHtml + addHtml;
    }

    /**
     * Adiciona um script à entidade
     */
    adicionarScript(ent, tipo) {
        const scriptComp = new ScriptComponent();
        const gerador = new GeradorScript();
        let codigo = '';

        if (tipo === 'basico') {
            scriptComp.nome = 'Movimentação RPG';
            const info = {
                nome: 'Movimentação RPG',
                descricao: 'Movimento livre em 4 direções (Top-Down)',
                parametros: { velocidade: 200 },
                estados: ['parado', 'andando']
            };
            codigo = gerador.gerarMovimentacaoBasica(info);
        } else if (tipo === 'plataforma') {
            scriptComp.nome = 'Movimentação Plataforma';
            const info = {
                nome: 'Movimentação Plataforma',
                descricao: 'Platformer com gravidade e pulo',
                parametros: { velocidadeHorizontal: 200, forcaPulo: 600, gravidade: 1200, alturaChao: 10000 },
                estados: ['chao', 'pulando', 'caindo']
            };
            info.parametros.alturaChao = Math.round(ent.y);
            codigo = gerador.gerarMovimentacaoPlataforma(info);
        } else if (tipo === 'patrulha') {
            scriptComp.nome = 'IA Patrulha';
            const info = {
                nome: 'IA Patrulha',
                descricao: 'Inimigo que anda de um lado para o outro',
                parametros: { velocidade: 100, distancia: 200 },
                estados: ['patrulhando']
            };
            codigo = gerador.gerarIAInimigoPatrulha(info);
        } else if (tipo === 'morte') {
            scriptComp.nome = 'Sistema de Morte';
            codigo = gerador.gerarScriptMorte();
        } else if (tipo === 'ataqueMelee') {
            scriptComp.nome = 'Combate Melee';
            codigo = gerador.gerarScriptAtaqueMelee();
        } else if (tipo === 'respawn') {
            scriptComp.nome = 'Sistema de Respawn';
            codigo = gerador.gerarScriptRespawnInimigo();
        } else if (tipo === 'textoFlutuante') {
            scriptComp.nome = 'Texto Flutuante';
            codigo = gerador.gerarScriptTextoFlutuante();
        } else if (tipo === 'interacao') {
            scriptComp.nome = 'Sistema de Interação';
            codigo = gerador.gerarScriptInteracao();
        } else {
            const timestamp = Date.now();
            scriptComp.nome = 'Script Customizado';
            codigo = `class ScriptCustomizado_${timestamp} {
    constructor(entidade) {
        this.entidade = entidade;
    }

    processarInput(input) {
        // input.teclaPressionada('a')
    }

    atualizar(deltaTime) {
        // Lógica a cada frame
    }

    // --- Colisão (Plugin) ---
    // onTriggerEnter(outro) { console.log('Entrou no trigger:', outro.nome); }
    // onCollisionEnter(outro) { console.log('Colidiu com:', outro.nome); }
}`;
        }

        // Gera um ID único para permitir múltiplos scripts
        const scriptId = `script_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        ent.adicionarComponente(scriptId, scriptComp);
        scriptComp.setSource(codigo);

        this.atualizarPainelPropriedades();
        this.log('Script adicionado com sucesso!', 'success');
    }

    /**
     * Abre o editor de código (Modal simples)
     */
    abrirEditorScript(ent, scriptId) {
        const scriptComp = ent.obterComponente(scriptId);
        if (!scriptComp) return;

        // Criar Modal
        const modal = document.createElement('div');
        modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.8); z-index: 1000;
        display: flex; justify-content: center; align-items: center;
        `;

        const container = document.createElement('div');
        container.style.cssText = `
        width: 80%; height: 80%; background: #1a1a2e;
        border: 2px solid #4ecdc4; border-radius: 8px;
        display: flex; flex-direction: column; padding: 10px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
        `;

        const header = document.createElement('div');
        header.innerHTML = `<h3> Editando Script: ${ent.nome}</h3> `;
        header.style.marginBottom = '10px';
        header.style.color = '#fff';

        const textarea = document.createElement('textarea');
        textarea.value = scriptComp.source;
        textarea.style.cssText = `
        flex: 1; background: #111; color: #a0f0a0;
        font-family: 'Consolas', monospace; font-size: 14px;
        padding: 10px; border: 1px solid #444; resize: none;
        tab-size: 4;
        `;

        // Permitir Tab no textarea
        textarea.addEventListener('keydown', function (e) {
            if (e.key == 'Tab') {
                e.preventDefault();
                var start = this.selectionStart;
                var end = this.selectionEnd;
                this.value = this.value.substring(0, start) +
                    "    " + this.value.substring(end);
                this.selectionStart = this.selectionEnd = start + 4;
            }
        });

        const footer = document.createElement('div');
        footer.style.cssText = 'margin-top: 10px; display: flex; justify-content: flex-end; gap: 10px;';

        const btnCancel = document.createElement('button');
        btnCancel.textContent = 'Cancelar';
        btnCancel.onclick = () => document.body.removeChild(modal);
        btnCancel.style.cssText = 'padding: 8px 16px; background: #ff6b6b; border: none; color: white; cursor: pointer; border-radius: 4px;';

        const btnSave = document.createElement('button');
        btnSave.textContent = '💾 Salvar & Compilar';
        btnSave.style.cssText = 'padding: 8px 16px; background: #4ecdc4; border: none; color: #1a1a2e; cursor: pointer; border-radius: 4px; font-weight: bold;';

        btnSave.onclick = () => {
            try {
                scriptComp.setSource(textarea.value);
                if (scriptComp.erro) {
                    alert('Erro ao compilar: ' + scriptComp.erro);
                } else {
                    this.log('Script salvo e compilado!', 'success');
                    document.body.removeChild(modal);
                }
            } catch (e) {
                alert('Erro fatal: ' + e.message);
            }
        };

        footer.appendChild(btnCancel);
        footer.appendChild(btnSave);

        container.appendChild(header);
        container.appendChild(textarea);
        container.appendChild(footer);
        modal.appendChild(container);

        document.body.appendChild(modal);
    }

    exportarProjeto() {
        this.log('Exportar funcionalidade em desenvolvimento...', 'warning');
    }

    /**
     * Carrega um projeto salvo
     */
    carregarProjeto(evento) {
        const arquivo = evento.target.files[0];
        if (!arquivo) return;

        const leitor = new FileReader();
        leitor.onload = (e) => {
            try {
                const dados = JSON.parse(e.target.result);

                // 1. Carregar Assets (dependência das entidades)
                if (dados.assets && this.assetManager) {
                    this.assetManager.desserializar(dados.assets);
                }

                // 2. Carregar Pastas
                if (dados.pastas) {
                    this.pastas = dados.pastas;
                }

                // 3. Carregar Entidades
                if (dados.entidades) {
                    this.entidades = [];
                    this.engine.entidades = []; // Limpa engine
                    this.sceneConfig = dados.sceneConfig || { backgroundColor: '#0a0a15' };
                    // Resetar ID count
                    Entidade.contadorId = 0;

                    dados.entidades.forEach(dado => {
                        const ent = Entidade.desserializar(dado);

                        // CRÍTICO: Recriar componentes manualmente (Importante para carregar projeto externo)
                        if (dado.componentes) {
                            const listaComponentes = Array.isArray(dado.componentes)
                                ? dado.componentes
                                : Object.values(dado.componentes);

                            for (const dadosComp of listaComponentes) {
                                let componente = null;
                                try {
                                    // Factory de componentes
                                    if (dadosComp.tipo === 'SpriteComponent') componente = new SpriteComponent();
                                    else if (dadosComp.tipo === 'CollisionComponent') componente = new CollisionComponent();
                                    else if (dadosComp.tipo === 'ScriptComponent') componente = new ScriptComponent();
                                    else if (dadosComp.tipo === 'TilemapComponent') componente = new TilemapComponent();
                                    else if (dadosComp.tipo === 'CameraFollowComponent') componente = new CameraFollowComponent();
                                    else if (dadosComp.tipo === 'ParallaxComponent') componente = new ParallaxComponent();
                                    else if (dadosComp.tipo === 'DialogueComponent') componente = new DialogueComponent();
                                    else if (dadosComp.tipo === 'KillZoneComponent') componente = new KillZoneComponent();
                                    else if (dadosComp.tipo === 'CheckpointComponent') componente = new CheckpointComponent();

                                    // Deserializar dados
                                    if (componente) {
                                        const dadosConfig = dadosComp.config || dadosComp;

                                        if (componente.desserializar && dadosConfig) {
                                            componente.desserializar(dadosConfig);
                                        } else if (dadosComp.config) {
                                            Object.assign(componente, dadosComp.config);
                                        } else {
                                            // Fallback legacy
                                            Object.assign(componente, dadosComp);
                                        }

                                        // FIX: Usar ID único para scripts para evitar sobrescrita no Map
                                        if (componente.tipo === 'ScriptComponent') {
                                            ent.adicionarComponente(componente.id, componente);
                                        } else {
                                            ent.adicionarComponente(componente);
                                        }
                                    }
                                } catch (err) {
                                    console.warn(`Erro ao carregar componente ${dadosComp.tipo} do projeto:`, err);
                                }
                            }
                        }

                        // --- DialogueComponent Listeners ---
                        document.querySelector('.btn-test-dialogue')?.addEventListener('click', () => {
                            const dialogue = ent.obterComponente('DialogueComponent');
                            if (dialogue) dialogue.iniciar();
                        });

                        document.querySelector('.btn-stop-dialogue')?.addEventListener('click', () => {
                            const dialogue = ent.obterComponente('DialogueComponent');
                            if (dialogue) {
                                dialogue.ativo = false;
                                dialogue.indiceAtual = 0;
                            }
                        });

                        document.querySelector('.btn-add-dialogue')?.addEventListener('click', () => {
                            const dialogue = ent.obterComponente('DialogueComponent');
                            if (dialogue) {
                                dialogue.adicionarDialogo('Speaker', 'Nova mensagem...');
                                this.atualizarPainelPropriedades();
                            }
                        });

                        document.querySelectorAll('.btn-remove-dialogue').forEach(btn => {
                            btn.addEventListener('click', (e) => {
                                const dialogue = ent.obterComponente('DialogueComponent');
                                if (dialogue) {
                                    const idx = parseInt(e.target.dataset.index);
                                    dialogue.removerDialogo(idx);
                                    this.atualizarPainelPropriedades();
                                }
                            });
                        });

                        document.querySelectorAll('.dialogue-prop').forEach(input => {
                            input.addEventListener('input', (e) => {
                                const dialogue = ent.obterComponente('DialogueComponent');
                                if (dialogue) {
                                    const idx = parseInt(e.target.dataset.index);
                                    const prop = e.target.dataset.prop;
                                    const diag = dialogue.dialogos[idx];
                                    if (diag) {
                                        diag[prop] = e.target.value;
                                    }
                                }
                            });
                        });

                        this.entidades.push(ent);
                        this.engine.adicionarEntidade(ent);

                        // Atualizar contador de IDs para evitar colisão
                        if (ent.id >= Entidade.contadorId) Entidade.contadorId = ent.id + 1;
                    });


                }

                this.atualizarHierarquia();
                this.atualizarContadorEntidades();
                if (this.painelAssets) this.painelAssets.atualizar();

                this.log('Projeto carregado com sucesso!', 'success');

                // Limpa o input para permitir carregar o mesmo arquivo novamente
                evento.target.value = '';

            } catch (erro) {
                console.error(erro);
                this.log('Erro ao carregar projeto: ' + erro.message, 'error');
                alert('Erro ao carregar projeto. Veja o console.');
            }
        };
        leitor.readAsText(arquivo);
    }

    /**
     * Adiciona mensagem ao console
     */
    log(mensagem, tipo = 'info') {
        const consoleContent = document.getElementById('console-content');
        if (!consoleContent) return;

        const agora = new Date();
        const timestamp = agora.toLocaleTimeString('pt-BR');

        const logDiv = document.createElement('div');
        logDiv.className = 'console-log ' + tipo;
        logDiv.innerHTML = '<span class="console-timestamp">[' + timestamp + ']</span> <span>' + mensagem + '</span>';

        consoleContent.appendChild(logDiv);
        consoleContent.scrollTop = consoleContent.scrollHeight;
    }
}

export default EditorPrincipal;


import Engine from '../engine/Engine.js';
import Camera from '../engine/Camera.js'; // FIX: Import Camera
import Entidade from '../entidades/Entidade.js';

// Componentes
import { SpriteComponent } from '../componentes/SpriteComponent.js';
import CollisionComponent from '../componentes/CollisionComponent.js';
import TilemapComponent from '../componentes/TilemapComponent.js';
import ParallaxComponent from '../componentes/ParallaxComponent.js';
import DialogueComponent from '../componentes/DialogueComponent.js';
import KillZoneComponent from '../componentes/KillZoneComponent.js';
import CheckpointComponent from '../componentes/CheckpointComponent.js';
import { ParticleEmitterComponent } from '../componentes/ParticleEmitterComponent.js';
import UIComponent from '../componentes/UIComponent.js';
import InventoryComponent from '../componentes/InventoryComponent.js';
import ItemComponent from '../componentes/ItemComponent.js';
import LightComponent from '../componentes/LightComponent.js';
import ScriptComponent from '../componentes/ScriptComponent.js';
import CameraFollowComponent from '../componentes/CameraFollowComponent.js';

/**
 * Runtime - Gerencia a execução do jogo exportado (Web Player)
 */
class Runtime {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.resize();

        // 1. Inicializar Engine
        this.engine = new Engine(this.canvas);

        // FIX: Inicializar Câmera e anexar à Engine
        this.engine.camera = new Camera(this.canvas.width, this.canvas.height);

        // FIX: Override Engine.renderizar para aplicar transformação da câmera
        // A Engine padrão não usa a classe Camera, mas o Editor usa. O Runtime deve imitar o Editor.
        this.engine.renderizar = () => {
            const ctx = this.engine.renderizador.ctx;
            this.engine.renderizador.limpar();

            this.engine.camera.aplicarTransformacao(ctx);

            // Renderiza entidades ordenadas por Z-Index
            const listaRender = [...this.engine.entidades].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

            for (const entidade of listaRender) {
                // Otimização: Culling (não renderizar fora da tela)
                // TODO: Implementar culling básico se necessário

                if (entidade.renderizar) {
                    entidade.renderizar(this.engine.renderizador);
                }
            }

            this.engine.camera.removerTransformacao(ctx);
        };

        // Expor engine globalmente (para scripts acessarem 'window.engine')
        window.engine = this.engine;



        // Mock do editor para scripts que dependem dele
        window.editor = {
            engine: this.engine,
            assetManager: null // Será preenchido no init/loadProjectData
        };

        // 2. Registrar Classes de Componentes
        this.componentRegistry = {
            'SpriteComponent': SpriteComponent,
            'CollisionComponent': CollisionComponent,
            'TilemapComponent': TilemapComponent,
            'ParallaxComponent': ParallaxComponent,
            'DialogueComponent': DialogueComponent,
            'KillZoneComponent': KillZoneComponent,
            'CheckpointComponent': CheckpointComponent,
            'ParticleEmitterComponent': ParticleEmitterComponent,
            'UIComponent': UIComponent,
            'InventoryComponent': InventoryComponent,
            'ItemComponent': ItemComponent,
            'LightComponent': LightComponent,
            'ScriptComponent': ScriptComponent,
            'CameraFollowComponent': CameraFollowComponent
        };

        // Escuta resize
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // Atualiza tamanho da câmera se ela existir
        if (this.engine && this.engine.camera) {
            this.engine.camera.atualizarTamanho(this.canvas.width, this.canvas.height);
        }
    }

    async init() {
        // Tenta carregar do LocalStorage (modo teste rápido do Editor)
        const urlParams = new URLSearchParams(window.location.search);
        const localData = localStorage.getItem('lumina_demo_data');

        try {
            if (localData) {
                console.log('Carregando jogo do LocalStorage (Modo Teste)...');
                const projeto = JSON.parse(localData);
                await this.loadProjectData(projeto);
            } else {
                const gameFile = urlParams.get('game') || 'demo_game.json';
                await this.loadGameFromFile(gameFile);
            }

            document.getElementById('loading').style.display = 'none';

            // Garantir que modo debug esteja desligado em produção/play, salvo se pedido na URL
            this.engine.debugMode = urlParams.has('debug');

            await this.engine.iniciar();
        } catch (error) {
            console.error('Erro fatal ao iniciar Runtime:', error);
            document.getElementById('loading').textContent = 'Erro ao carregar jogo: ' + error.message;
        }
    }

    async loadGameFromFile(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const projeto = await response.json();
        await this.loadProjectData(projeto);
    }

    async loadProjectData(projeto) {
        // Configuração global de suavização (se existir no projeto)
        if (projeto.config && this.engine.renderizador && typeof this.engine.renderizador.setImageSmoothing === 'function') {
            this.engine.renderizador.setImageSmoothing(!!projeto.config.imageSmoothing);
        }

        // 1. Setup AssetManager Mock and Inject into Renderer
        if (!this.engine.assetManager) {
            this.engine.assetManager = {
                assets: {},
                obterAsset: function (id) { return this.assets[id]; },
                adicionarSprite: function (id, nome, src, frames, animacoes, imageSmoothing) {
                    const img = new Image();
                    img.src = src;
                    this.assets[id] = { type: 'sprite', id, nome, source: src, frames, animacoes, imagem: img, imageSmoothing };
                },
                adicionarSom: function (id, nome, src) {
                    this.assets[id] = { type: 'sound', id, nome, source: src }; // TODO: Audio object if needed
                }
            };
            // Atualiza referência global mockada
            window.editor.assetManager = this.engine.assetManager;

            // FIX: Inject into Renderer so components can access it via renderizador.assetManager
            if (this.engine.renderizador) {
                this.engine.renderizador.assetManager = this.engine.assetManager;
            }
        }

        // 2. Load Assets
        if (projeto.assets) {

            const sprites = projeto.assets.sprites || [];

            // Helper for magenta square placeholder
            const placeholderSrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAFVJREFUWEft0rENACAAwzo6/4/2cFgws4W72qSkz1g1+X8AAAAAAAAAAAAAAADgM2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6G2j6K5wAAAAASUVORK5CYII=";

            // FIX: Inject missing Tilemap Asset if not present (placeholder)
            const missingId = 'asset_sprite_1767034945670';
            if (!sprites.find(a => a.id === missingId)) {
                console.warn("Injecting placeholder for known missing asset:", missingId);
                sprites.push({
                    id: missingId,
                    nome: "Placeholder_Tileset",
                    source: placeholderSrc,
                    frames: [],
                    animacoes: {}
                });
            }



            sprites.forEach(a => {
                // FIX: Use 'source' property (from JSON) but FALLBACK to placeholder if empty
                let src = a.source || a.src;
                if (!src) {
                    console.warn("Asset sprite sem source (usando placeholder):", a.nome, a.id);
                    src = placeholderSrc;
                }
                this.engine.assetManager.adicionarSprite(a.id, a.nome, src, a.frames, a.animacoes, a.imageSmoothing);
            });

            if (projeto.assets.sounds) {
                projeto.assets.sounds.forEach(a => {
                    const src = a.source || a.src;
                    if (src) this.engine.assetManager.adicionarSom(a.id, a.nome, src);
                });
            }
        }

        // 3. Load Scene Settings
        if (projeto.cena) {
            if (projeto.cena.corFundo) this.engine.corFundo = projeto.cena.corFundo;
            if (projeto.cena.iluminacaoGlobal && this.engine.globalIllumination) {
                this.engine.globalIllumination.habilitado = projeto.cena.iluminacaoGlobal.habilitado;
                this.engine.globalIllumination.corAmbiente = projeto.cena.iluminacaoGlobal.corAmbiente;
                this.engine.globalIllumination.intensidade = projeto.cena.iluminacaoGlobal.intensidade;
            }
        }

        // 4. Create Entities
        this.engine.entidades = [];
        this.engine.camera.x = 0;
        this.engine.camera.y = 0; // Reset camera

        if (projeto.entidades) {
            // Resetar ID count para evitar conflitos se usar a lógica do Editor
            Entidade.contadorId = 0;

            for (const entData of projeto.entidades) {
                // USAR 'desserializar' para garantir que startX, startY e outros props sejam importados corretamente
                const ent = Entidade.desserializar(entData);

                // Garantir engine
                ent.engine = this.engine;
                this.engine.adicionarEntidade(ent);

                if (entData.componentes) {
                    // FIX: Preserve original keys (IDs) to handle multiple ScriptComponents correctly
                    let componentsToList = [];

                    if (Array.isArray(entData.componentes)) {
                        entData.componentes.forEach((c, index) => {
                            // FIX: Ensure unique ID for Scripts to prevent overwriting
                            let key = c.tipo;
                            if (c.tipo === 'ScriptComponent') {
                                // Default to scriptName if avail, else index
                                key = c.scriptName ? `Script_${c.scriptName}` : `ScriptComponent_${index}`;
                            }
                            componentsToList.push({ key: key, data: c });
                        });
                    } else {
                        // Object: key is the ID
                        for (const [key, val] of Object.entries(entData.componentes)) {
                            componentsToList.push({ key: key, data: val });
                        }
                    }

                    // Sort: Scripts last, and ensure Movement runs BEFORE Combat
                    componentsToList.sort((a, b) => {
                        // 1. Script vs Non-Script
                        const isScriptA = a.data.tipo === 'ScriptComponent';
                        const isScriptB = b.data.tipo === 'ScriptComponent';
                        if (isScriptA && !isScriptB) return 1;
                        if (!isScriptA && isScriptB) return -1;

                        // 2. Movement vs Combat (Within Scripts)
                        if (isScriptA && isScriptB) {
                            const nameA = (a.data.scriptName || '').toLowerCase();
                            const nameB = (b.data.scriptName || '').toLowerCase();
                            const isMovA = nameA.includes('movimentacao');
                            const isMovB = nameB.includes('movimentacao');
                            const isCombatA = nameA.includes('combate');
                            const isCombatB = nameB.includes('combate');

                            // Movement first
                            if (isMovA && !isMovB) return -1;
                            if (!isMovA && isMovB) return 1;

                            // Combat after Movement
                            if (isCombatA && isMovB) return 1; // Combat > Movement
                            if (isMovA && isCombatB) return -1; // Movement < Combat
                        }
                        return 0;
                    });

                    for (const item of componentsToList) {
                        const compData = item.data;
                        const originalKey = item.key;

                        const CompClass = this.componentRegistry[compData.tipo];
                        if (CompClass) {
                            const comp = new CompClass();

                            // 1. Link com entidade
                            comp.entidade = ent;

                            // 2. Deserializar Corretamente
                            if (comp.desserializar) {
                                comp.desserializar(compData);
                            } else {
                                Object.assign(comp, compData.config || compData);
                            }

                            // 3. Special Cases
                            if (comp.tipo === 'UIComponent' && compData.elementos && !comp.elementos) {
                                comp.elementos = compData.elementos;
                            }

                            if (comp.tipo === 'ScriptComponent' && !comp.source) {
                                this.hydrateScript(comp, compData);
                            }

                            // 4. Adicionar à entidade
                            // FIX: Use original ID (key) for Scripts to avoid overwriting (e.g., script_123, script_456)
                            // For other components, usually type is fine, but safer to use key if unique.
                            if (comp.tipo === 'ScriptComponent') {
                                ent.adicionarComponente(originalKey, comp);
                            } else {
                                ent.adicionarComponente(comp.tipo, comp);
                            }

                        } else {
                            console.warn(`Componente desconhecido: ${compData.tipo}`);
                        }
                    }
                }

                // Atualizar max ID global
                const numericId = parseInt(ent.id.replace(/\D/g, '')); // extrai numeros
                if (!isNaN(numericId) && numericId >= Entidade.contadorId) {
                    Entidade.contadorId = numericId + 1;
                }
            }
        }
    }

    hydrateScript(comp, data) {
        if (!data.scriptName) return;

        // Tenta encontrar a classe do script no escopo global
        try {
            if (window[data.scriptName]) {
                comp.instance = new window[data.scriptName](comp.entidade);
                // Restaurar propriedades do script
                if (data.properties) {
                    // FIX: Filter out likely transient state properties (booleans/internal flags)
                    // We only want to load configuration (numbers, strings)
                    // Exclude common state names: atacando, jumping, etc.
                    const safeProps = {};
                    const ignoredKeys = ['atacando', 'isAttacking', 'pulando', 'jumping', 'dash', 'dashed', 'dashCooling', 'invulneravel'];

                    for (const key in data.properties) {
                        // Skip known state flags
                        if (ignoredKeys.includes(key)) continue;

                        // Heuristic: Skip booleans that start with 'is' or 'has' (often state) UNLESS white-listed?
                        // For now, just copy everything else.
                        safeProps[key] = data.properties[key];
                    }
                    Object.assign(comp.instance, safeProps);
                }
            } else {
                // Tentar usar GeradorScript se disponível para recriar scripts padrões?
                // Por enquanto apenas avisa.
                console.warn(`Script class '${data.scriptName}' not found in window. Make sure it is exported or global.`);
            }
        } catch (e) {
            console.error('Erro ao hidratar script:', e);
        }
    }
}

// Inicialização
window.addEventListener('load', () => {
    const runtime = new Runtime();
    runtime.init();
});

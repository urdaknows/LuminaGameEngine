/**
 * Sistema de Traduções - Lumina Engine
 * Suporta: Português (pt-BR) e Inglês (en)
 */

const translations = {
    'pt-BR': {
        // Menu Principal
        'menu.file': 'Arquivo',
        'menu.new': 'Novo',
        'menu.open': 'Abrir',
        'menu.save': 'Salvar',
        'menu.saveAs': 'Salvar Como',
        'menu.export': 'Exportar',

        // Toolbar
        'toolbar.play': 'Jogar',
        'toolbar.pause': 'Pausar',
        'toolbar.stop': 'Parar',
        'toolbar.grid': 'Grade',
        'toolbar.snap': 'Ajustar à Grade',

        // Painéis
        'panel.hierarchy': '📂 Hierarquia',
        'panel.properties': '⚙️ Propriedades',
        'panel.assets': 'Recursos',
        'panel.console': 'Console',
        'panel.scene': 'Cena',

        // Msg
        'panel.properties.noSelection': 'Selecione uma entidade para editar suas propriedades',
        'panel.hierarchy.scene.empty': 'A cena está vazia. Adicione entidades para começar.',

        // Entidades
        'entity.new': 'Nova Entidade',
        'entity.delete': 'Deletar Entidade',
        'entity.duplicate': 'Duplicar',
        'entity.rename': 'Renomear',
        'entity.name': 'Nome',
        'entity.position': 'Posição',
        'entity.size': 'Tamanho',
        'entity.rotation': 'Rotação',
        'entity.visible': 'Visível',
        'entity.color': 'Cor',

        // Componentes
        'component.add': 'Adicionar Componente',
        'component.remove': 'Remover Componente',
        'component.sprite': 'Sprite Renderer',
        'component.collision': 'Collision',
        'component.script': 'Script',
        'component.particle': 'Emissor de Partículas',
        'component.light': 'Luz',
        'component.camera': 'Camera Follow',
        'component.tilemap': 'Tilemap',
        'component.dialogue': 'Diálogo',
        'component.parallax': 'Parallax',
        'component.checkpoint': 'Checkpoint',
        'component.killzone': 'Kill Zone',

        // Sprite Component
        'sprite.source': 'Asset de Origem',
        'sprite.none': '(Nenhum - Cor Sólida)',
        'sprite.offsetX': 'Offset X',
        'sprite.offsetY': 'Offset Y',
        'sprite.scaleX': 'Escala X',
        'sprite.scaleY': 'Escala Y',
        'sprite.flipX': 'Inverter X',
        'sprite.flipY': 'Inverter Y',
        'sprite.autoplay': 'Animação Autoplay',
        'sprite.frameWidth': 'Largura do Frame',
        'sprite.frameHeight': 'Altura do Frame',

        // Collision Component
        'collision.width': 'Largura',
        'collision.height': 'Altura',
        'collision.offsetX': 'Offset X',
        'collision.offsetY': 'Offset Y',
        'collision.solid': 'É Sólido',
        'collision.trigger': 'É Trigger',
        'collision.oneWay': 'Plataforma One-Way',
        'collision.autofit': 'Auto-ajustar ao Sprite',

        // Script Component
        'script.name': 'Nome do Script',
        'script.template': 'Template',
        'script.properties': 'Propriedades',

        // Particle Component
        'particle.template': 'Template',
        'particle.emitting': 'Emitindo',
        'particle.rate': 'Taxa de Emissão',
        'particle.lifetime': 'Tempo de Vida',
        'particle.speed': 'Velocidade',
        'particle.size': 'Tamanho',
        'particle.color': 'Cor',
        'particle.gravity': 'Gravidade',

        // Light Component
        'light.color': 'Cor',
        'light.radius': 'Raio',
        'light.intensity': 'Intensidade',
        'light.shadows': 'Sombras',

        // Camera Follow
        'camera.smoothSpeed': 'Velocidade Suave',
        'camera.offsetX': 'Offset X',
        'camera.offsetY': 'Offset Y',

        // Assets
        'assets.upload': 'Upload de Asset',
        'assets.delete': 'Deletar Asset',
        'assets.rename': 'Renomear Asset',
        'assets.preview': 'Visualização',
        'assets.type': 'Tipo',
        'assets.size': 'Tamanho',
        'assets.empty': 'Nenhum recurso importado.',

        // Editores
        'editor.animation': 'Editor de Animações',
        'editor.particle': 'Editor de Partículas',
        'editor.lighting': 'Editor de Iluminação',
        'editor.tilemap': 'Editor de Tilemap',

        // Animações
        'animation.name': 'Nome',
        'animation.speed': 'Velocidade',
        'animation.loop': 'Loop',
        'animation.frames': 'Frames',
        'animation.add': 'Adicionar Animação',
        'animation.delete': 'Deletar Animação',
        'animation.preview': 'Preview',

        // Botões
        'btn.ok': 'OK',
        'btn.cancel': 'Cancelar',
        'btn.apply': 'Aplicar',
        'btn.close': 'Fechar',
        'btn.save': 'Salvar',
        'btn.load': 'Carregar',
        'btn.create': 'Criar',
        'btn.delete': 'Deletar',
        'btn.edit': 'Editar',

        // Mensagens
        'msg.confirmDelete': 'Tem certeza que deseja deletar?',
        'msg.saved': 'Salvo com sucesso!',
        'msg.loaded': 'Carregado com sucesso!',
        'msg.error': 'Erro',
        'msg.warning': 'Aviso',
        'msg.info': 'Informação',

        // Templates de Script
        'template.platform': 'Movimentação Plataforma',
        'template.basic': 'Movimentação Básica',
        'template.run': 'Movimentação com Corrida',
        'template.dash': 'Movimentação com Dash',
        'template.melee': 'Combate Melee',
        'template.enemy': 'IA Inimigo (Patrulha)',
        'template.death': 'Sistema de Morte',
        'template.respawn': 'Sistema de Respawn',

        // Outros
        'other.search': 'Buscar...',
        'other.filter': 'Filtrar',
        'other.sort': 'Ordenar',
        'other.language': 'Idioma',

        // Categorias de Componentes
        'category.system': 'SISTEMA',
        'category.visual': 'VISUAL',
        'category.gameplay': 'GAMEPLAY',
        'category.scripts': 'SCRIPTS',
        'category.plugins': 'PLUGINS',

        // Nomes de Componentes Adicionais
        'comp.spriteRenderer': 'Sprite Renderer',
        'comp.boxCollider': 'Box Collider 2D',
        'comp.cameraFollow': 'Camera Follow',
        'comp.tilemapSystem': 'Tilemap System',
        'comp.parallaxBg': 'Parallax Background',
        'comp.particleSystem': 'Sistema de Partículas',
        'comp.dialogueSystem': 'Dialogue System',
        'comp.killZone': 'Área de Morte',
        'comp.checkpoint': 'Checkpoint',
        'comp.scriptEmpty': 'Script Vazio',
        'comp.rpgTopDown': 'RPG Top-Down',
        'comp.platformer': 'Plataforma',
        'comp.aiPatrol': 'IA Patrulha',
        'comp.deathFade': 'Morte (Fade)',
        'comp.interaction': 'Interação',
        'comp.meleeCombat': 'Combate Melee',
        'comp.respawn': 'Respawn',
        'comp.floatingText': 'Texto Flutuante',

        // Attributos
        'properties.name': 'Nome',
        'properties.enabled': 'Ativo',
    },

    'en': {
        // Main Menu
        'menu.file': 'File',
        'menu.new': 'New',
        'menu.open': 'Open',
        'menu.save': 'Save',
        'menu.saveAs': 'Save As',
        'menu.export': 'Export',

        // Toolbar
        'toolbar.play': 'Play',
        'toolbar.pause': 'Pause',
        'toolbar.stop': 'Stop',
        'toolbar.grid': 'Grid',
        'toolbar.snap': 'Snap to Grid',

        // Panels
        'panel.hierarchy': '📂 Hierarchy',
        'panel.properties': '⚙️ Properties',
        'panel.assets': 'Assets',
        'panel.console': 'Console',
        'panel.scene': 'Scene',

        // Msg
        'panel.properties.noSelection': 'Select an entity to edit its properties',
        'panel.hierarchy.scene.empty': 'The scene is empty. Add entities to get started.',

        // Entities
        'entity.new': 'New Entity',
        'entity.delete': 'Delete Entity',
        'entity.duplicate': 'Duplicate',
        'entity.rename': 'Rename',
        'entity.name': 'Name',
        'entity.position': 'Position',
        'entity.size': 'Size',
        'entity.rotation': 'Rotation',
        'entity.visible': 'Visible',
        'entity.color': 'Color',

        // Components
        'component.add': 'Add Component',
        'component.remove': 'Remove Component',
        'component.sprite': 'Sprite Renderer',
        'component.collision': 'Collision',
        'component.script': 'Script',
        'component.particle': 'Particle Emitter',
        'component.light': 'Light',
        'component.camera': 'Camera Follow',
        'component.tilemap': 'Tilemap',
        'component.dialogue': 'Dialogue',
        'component.parallax': 'Parallax',
        'component.checkpoint': 'Checkpoint',
        'component.killzone': 'Kill Zone',

        // Sprite Component
        'sprite.source': 'Source Asset',
        'sprite.none': '(None - Solid Color)',
        'sprite.offsetX': 'Offset X',
        'sprite.offsetY': 'Offset Y',
        'sprite.scaleX': 'Scale X',
        'sprite.scaleY': 'Scale Y',
        'sprite.flipX': 'Flip X',
        'sprite.flipY': 'Flip Y',
        'sprite.autoplay': 'Autoplay Animation',
        'sprite.frameWidth': 'Frame Width',
        'sprite.frameHeight': 'Frame Height',

        // Collision Component
        'collision.width': 'Width',
        'collision.height': 'Height',
        'collision.offsetX': 'Offset X',
        'collision.offsetY': 'Offset Y',
        'collision.solid': 'Is Solid',
        'collision.trigger': 'Is Trigger',
        'collision.oneWay': 'One-Way Platform',
        'collision.autofit': 'Auto-fit to Sprite',

        // Script Component
        'script.name': 'Script Name',
        'script.template': 'Template',
        'script.properties': 'Properties',

        // Particle Component
        'particle.template': 'Template',
        'particle.emitting': 'Emitting',
        'particle.rate': 'Emission Rate',
        'particle.lifetime': 'Lifetime',
        'particle.speed': 'Speed',
        'particle.size': 'Size',
        'particle.color': 'Color',
        'particle.gravity': 'Gravity',

        // Light Component
        'light.color': 'Color',
        'light.radius': 'Radius',
        'light.intensity': 'Intensity',
        'light.shadows': 'Shadows',

        // Camera Follow
        'camera.smoothSpeed': 'Smooth Speed',
        'camera.offsetX': 'Offset X',
        'camera.offsetY': 'Offset Y',

        // Assets
        'assets.upload': 'Upload Asset',
        'assets.delete': 'Delete Asset',
        'assets.rename': 'Rename Asset',
        'assets.preview': 'Preview',
        'assets.type': 'Type',
        'assets.size': 'Size',
        'assets.empty': 'No assets imported.',

        // Editors
        'editor.animation': 'Animation Editor',
        'editor.particle': 'Particle Editor',
        'editor.lighting': 'Lighting Editor',
        'editor.tilemap': 'Tilemap Editor',

        // Animations
        'animation.name': 'Name',
        'animation.speed': 'Speed',
        'animation.loop': 'Loop',
        'animation.frames': 'Frames',
        'animation.add': 'Add Animation',
        'animation.delete': 'Delete Animation',
        'animation.preview': 'Preview',

        // Buttons
        'btn.ok': 'OK',
        'btn.cancel': 'Cancel',
        'btn.apply': 'Apply',
        'btn.close': 'Close',
        'btn.save': 'Save',
        'btn.load': 'Load',
        'btn.create': 'Create',
        'btn.delete': 'Delete',
        'btn.edit': 'Edit',

        // Messages
        'msg.confirmDelete': 'Are you sure you want to delete?',
        'msg.saved': 'Saved successfully!',
        'msg.loaded': 'Loaded successfully!',
        'msg.error': 'Error',
        'msg.warning': 'Warning',
        'msg.info': 'Information',

        // Script Templates
        'template.platform': 'Platform Movement',
        'template.basic': 'Basic Movement',
        'template.run': 'Movement with Run',
        'template.dash': 'Movement with Dash',
        'template.melee': 'Melee Combat',
        'template.enemy': 'Enemy AI (Patrol)',
        'template.death': 'Death System',
        'template.respawn': 'Respawn System',

        // Others
        'other.search': 'Search...',
        'other.filter': 'Filter',
        'other.sort': 'Sort',
        'other.language': 'Language',

        // Component Categories
        'category.system': 'SYSTEM',
        'category.visual': 'VISUAL',
        'category.gameplay': 'GAMEPLAY',
        'category.scripts': 'SCRIPTS',
        'category.plugins': 'PLUGINS',

        // Additional Component Names
        'comp.spriteRenderer': 'Sprite Renderer',
        'comp.boxCollider': 'Box Collider 2D',
        'comp.cameraFollow': 'Camera Follow',
        'comp.tilemapSystem': 'Tilemap System',
        'comp.parallaxBg': 'Parallax Background',
        'comp.particleSystem': 'Particle System',
        'comp.dialogueSystem': 'Dialogue System',
        'comp.killZone': 'Kill Zone',
        'comp.checkpoint': 'Checkpoint',
        'comp.scriptEmpty': 'Empty Script',
        'comp.rpgTopDown': 'RPG Top-Down',
        'comp.platformer': 'Platformer',
        'comp.aiPatrol': 'AI Patrol',
        'comp.deathFade': 'Death (Fade)',
        'comp.interaction': 'Interaction',
        'comp.meleeCombat': 'Melee Combat',
        'comp.respawn': 'Respawn',
        'comp.floatingText': 'Floating Text',

        // Attributes
        'properties.name': 'Name',
        'properties.enabled': 'Enabled',
    }
};

export default translations;

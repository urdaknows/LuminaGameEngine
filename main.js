import EditorPrincipal from './editor/EditorPrincipal.js?v=2001';

/**
 * Main - Inicialização do Editor Visual
 */

// Aguarda o carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Inicializando Editor Visual...');

    // Obtém o canvas
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error('Canvas não encontrado!');
        return;
    }

    // Cria o editor
    const editor = new EditorPrincipal(canvas);
    console.log('✓ Editor Visual criado');

    // Torna o editor global para debug (opcional)
    window.editor = editor;

    console.log('💡 Dica: Você pode acessar o editor via console usando window.editor');
    console.log('🎯 Clique em "+ Criar" para adicionar elementos ao jogo');
    console.log('🔍 Use a ferramenta de seleção para interagir com entidades');
    console.log('🖱️ Botão do meio/direito do mouse para mover a câmera');
    console.log('🔄 Roda do mouse para zoom');
});

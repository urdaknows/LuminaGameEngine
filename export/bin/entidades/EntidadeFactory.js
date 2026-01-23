import Entidade from './Entidade.js';
import { SpriteComponent } from '../componentes/SpriteComponent.js';
import CollisionComponent from '../componentes/CollisionComponent.js';
import TilemapComponent from '../componentes/TilemapComponent.js';

/**
 * Factory Para Criação de Entidades
 * Centraliza a configuração inicial de Players, NPCs e Objetos
 */
export class EntidadeFactory {

    /**
     * Cria e configura uma entidade baseada no tipo
     * @param {string} tipo - 'player', 'npc', 'objeto', 'menu'
     * @param {number} x - Posição X Inicial
     * @param {number} y - Posição Y Inicial
     * @returns {Entidade}
     */
    static criar(tipo, x = 0, y = 0) {
        // Gerar ID Único
        const id = 'entidade_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        // Nome provisório (sera sobrescrito pelo switch abaixo, mas garante fallback)
        const nomeInicial = tipo ? (tipo.charAt(0).toUpperCase() + tipo.slice(1)) : 'Nova Entidade';

        const entidade = new Entidade(id, nomeInicial, x, y);
        entidade.tipo = tipo || 'objeto'; // Garante que o tipo seja definido

        // Redundância para garantir
        entidade.x = x;
        entidade.y = y;
        entidade.startX = x;
        entidade.startY = y;

        // Configuração Padrão
        entidade.largura = 64;
        entidade.altura = 64;

        // Configurações Específicas por Tipo
        switch (tipo) {
            case 'player':
                entidade.nome = 'Player';
                entidade.tags = ['player']; // Adicionando tag explícita
                entidade.cor = '#ff0055'; // Vermelho/Rosa Vibrante
                // Player geralmente tem Sprite e Física
                entidade.adicionarComponente('SpriteComponent', new SpriteComponent());

                // Adicionar Colisão por padrão
                const colPlayer = new CollisionComponent();
                colPlayer.largura = 48; // Um pouco menor que o sprite para evitar agarrar em paredes
                colPlayer.altura = 60;
                colPlayer.offsetX = 8;
                colPlayer.offsetY = 4;
                entidade.adicionarComponente('CollisionComponent', colPlayer);

                entidade.temGravidade = true;
                entidade.gravidade = 980; // Gravidade padrão
                break;

            case 'npc':
                entidade.nome = 'NPC';
                entidade.cor = '#00ff88'; // Verde Neon
                entidade.adicionarComponente('SpriteComponent', new SpriteComponent());

                // NPCs também colidem
                const colNpc = new CollisionComponent();
                colNpc.largura = 64;
                colNpc.altura = 64;
                entidade.adicionarComponente('CollisionComponent', colNpc);

                entidade.temGravidade = true;
                entidade.gravidade = 980;
                break;

            case 'inimigo':
                entidade.nome = 'Inimigo'; // Nome chave para detecção
                entidade.cor = '#ff3300'; // Vermelho Sangue
                entidade.adicionarComponente('SpriteComponent', new SpriteComponent());

                // Inimigo PRECISA de colisão para matar o player
                const colEnemy = new CollisionComponent();
                colEnemy.largura = 50;
                colEnemy.altura = 50;
                colEnemy.offsetX = 7;
                colEnemy.offsetY = 14;
                entidade.adicionarComponente('CollisionComponent', colEnemy);

                entidade.temGravidade = true;
                entidade.gravidade = 980;
                break;

            case 'objeto':
                entidade.nome = 'Objeto';
                entidade.cor = '#ffdd00'; // Amarelo
                entidade.adicionarComponente('SpriteComponent', new SpriteComponent());

                // Objetos sólidos por padrão
                const colObj = new CollisionComponent();
                colObj.largura = 64;
                colObj.altura = 64;
                entidade.adicionarComponente('CollisionComponent', colObj);

                // Objetos podem ser estáticos (plataformas) ou dinâmicos (caixas)
                entidade.temGravidade = false;
                break;

            case 'menu':
                entidade.nome = 'Menu UI';
                entidade.cor = '#ff00ff'; // Magenta
                entidade.largura = 200;
                entidade.altura = 100;
                // Menus não têm física
                entidade.temGravidade = false;
                entidade.temGravidade = false;
                entidade.solido = false;
                break;

            case 'tilemap':
                entidade.nome = 'Tilemap';
                // entidade.tipo já setado no início
                entidade.adicionarComponente('TilemapComponent', new TilemapComponent());
                entidade.temGravidade = false;
                entidade.solido = false;
                entidade.largura = 32; // Placeholder
                entidade.altura = 32;
                break;

            default:
                entidade.cor = '#aaaaaa';
                break;
        }

        return entidade;
    }
}

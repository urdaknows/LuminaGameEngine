import Entidade from './Entidade.js';
import { SpriteComponent } from '../componentes/SpriteComponent.js';
import CollisionComponent from '../componentes/CollisionComponent.js';

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
        // Passar x e y para o construtor para definir startX/startY corretamente
        const entidade = new Entidade(tipo, undefined, x, y);

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
                entidade.solido = false;
                break;

            default:
                entidade.cor = '#aaaaaa';
                break;
        }

        return entidade;
    }
}

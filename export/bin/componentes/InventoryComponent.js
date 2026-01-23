/**
 * InventoryComponent.js
 * Gerencia o inventário de uma entidade (geralmente o Player)
 */
export default class InventoryComponent {
    constructor() {
        this.tipo = 'InventoryComponent';
        this.nome = 'Inventário';
        this.ativo = true;

        // Configuração
        this.slots = 5; // Número máximo de slots
        this.items = []; // Array de itens { id, qtd, icon }

        // Estado
        this.entidade = null;
        this.aberto = false; // Começa fechado por padrão
    }

    inicializar(entidade) {
        this.entidade = entidade;
    }

    toggle() {
        this.aberto = !this.aberto;
        return this.aberto;
    }

    abrir() { this.aberto = true; }
    fechar() { this.aberto = false; }


    /**
     * Adiciona um item ao inventário
     * @param {string} itemId - ID do item (ex: 'potion')
     * @param {number} qtd - Quantidade a adicionar (default: 1)
     * @param {string} icon - (Opcional) Asset ID do ícone
     * @returns {boolean} - True se adicionou, False se inventário cheio
     */
    addItem(itemId, qtd = 1, icon = null) {
        // 1. Tenta empilhar (stack)
        const existingItem = this.items.find(i => i.id === itemId);
        if (existingItem) {
            existingItem.qtd += qtd;
            // Atualiza ícone se o novo tiver e o antigo não (ou sobrescreve?)
            // Vamos assumir que mantém o do primeiro, ou atualiza se vier um novo
            if (icon) existingItem.icon = icon;

            console.log(`[Inventory] Added ${qtd} to existing ${itemId}. Total: ${existingItem.qtd}`);
            return true;
        }

        // 2. Novo slot (se tiver espaço)
        if (this.items.length < this.slots) {
            this.items.push({ id: itemId, qtd: qtd, icon: icon });
            console.log(`[Inventory] Added new item ${itemId} (x${qtd})`);
            return true;
        }

        console.log(`[Inventory] Full! Cannot add ${itemId}`);
        return false;
    }

    /**
     * Remove um item
     */
    removeItem(itemId, qtd = 1) {
        const index = this.items.findIndex(i => i.id === itemId);
        if (index === -1) return false;

        const item = this.items[index];
        item.qtd -= qtd;

        if (item.qtd <= 0) {
            this.items.splice(index, 1);
        }
        return true;
    }

    /**
     * Verifica se tem o item
     */
    hasItem(itemId) {
        return this.items.some(i => i.id === itemId);
    }

    // Serialização para salvar o jogo
    serializar() {
        return {
            tipo: 'InventoryComponent',
            slots: this.slots,
            items: JSON.parse(JSON.stringify(this.items)) // Deep copy para evitar referência compartilhada
        };
    }

    desserializar(dados) {
        this.slots = dados.slots || 5;
        this.items = dados.items || [];
    }
}

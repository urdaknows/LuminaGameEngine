/**
 * ImageCache - Cache global de imagens para evitar criar múltiplas Image() da mesma source
 * Reduz drasticamente uso de memória e garbage collection
 */
class ImageCache {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
    }

    /**
     * Obtém imagem do cache ou carrega
     * @param {string} src - URL da imagem
     * @returns {Promise<HTMLImageElement>}
     */
    get(src) {
        if (!src) return Promise.reject(new Error('Source vazio'));

        // Retorna do cache se já existe
        if (this.cache.has(src)) {
            return Promise.resolve(this.cache.get(src));
        }

        // Se já está carregando, retorna a promise existente
        if (this.loadingPromises.has(src)) {
            return this.loadingPromises.get(src);
        }

        // Carrega nova imagem
        const promise = new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                this.cache.set(src, img);
                this.loadingPromises.delete(src);
                resolve(img);
            };

            img.onerror = (err) => {
                this.loadingPromises.delete(src);
                reject(new Error(`Falha ao carregar: ${src}`));
            };

            img.src = src;
        });

        this.loadingPromises.set(src, promise);
        return promise;
    }

    /**
     * Obtém imagem sincronamente (se já carregada)
     */
    getSync(src) {
        return this.cache.get(src) || null;
    }

    /**
     * Limpa imagens não utilizadas
     */
    limpar() {
        this.cache.clear();
        this.loadingPromises.clear();
    }

    /**
     * Remove imagem específica
     */
    remover(src) {
        this.cache.delete(src);
        this.loadingPromises.delete(src);
    }

    /**
     * Tamanho do cache
     */
    get tamanho() {
        return this.cache.size;
    }
}

// Singleton global
if (typeof window !== 'undefined') {
    window._globalImageCache = window._globalImageCache || new ImageCache();
}

export default ImageCache;

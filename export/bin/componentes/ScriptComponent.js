/**
 * ScriptComponent - Componente que executa scripts customizados
 */
class ScriptComponent {
    constructor() {
        this.tipo = 'ScriptComponent';
        this.nome = 'ScriptComponent';
        this.id = 'ScriptComponent_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        this.source = ''; // Código fonte do script
        this.scriptName = 'Script Personalizado'; // Nome legível para UI
        this.instance = null; // Instância da classe do script
        this.erro = null;
        this.propsIniciais = {}; // Cache para valores carregados do save
    }

    /**
     * Define o código fonte e tenta compilar
     */
    setSource(codigo) {
        this.source = codigo;
        // Tenta extrair o nome da classe para usar como scriptName automaticamente se ainda for o padrão
        const match = codigo.match(/class\s+(\w+)/);
        if (match && match[1]) {
            this.scriptName = match[1];
        }
        this.compilar();
    }

    /**
     * Compila o código fonte
     */
    compilar() {
        if (!this.source) return;

        // Se ainda não temos a entidade, não podemos instanciar
        if (!this.entidade) {
            console.warn('ScriptComponent: Compilação adiada (entidade não definida)');
            return;
        }

        // Salva a instância anterior para fallback
        const oldInstance = this.instance;

        try {
            // Envolve o código para extrair a classe
            // O usuário deve definir uma "class NomeScript { ... }"
            // Nós procuramos essa classe e a instanciamos.

            let sourceParaExecutar = this.source;
            // Tenta extrair nome da classe
            // Regex melhorado: Aceita espaços antes de class
            const match = this.source.match(/class\s+(\w+)/);

            if (match) {
                const nomeClasse = match[1];
                // Atualiza o scriptName se encontrar a classe
                this.scriptName = nomeClasse;
                sourceParaExecutar += `\nreturn ${nomeClasse};`;
            }

            const Factory = new Function(sourceParaExecutar);
            const ClasseScript = Factory();
            this.instance = new ClasseScript(this.entidade);

            // Tenta preservar propriedades da instância anterior (Hot-Reload de valores)
            if (oldInstance) {
                const ignoredProps = ['entidade', 'velocidadeX', 'velocidadeY'];
                for (const key of Object.keys(oldInstance)) {
                    if (ignoredProps.includes(key)) continue;

                    // MIGRATION FIX: 'textos' -> '_textos'
                    // Se o oldInstance tem 'textos' (corrompido ou antigo) e o novo tem '_textos', ignoramos o antigo.
                    if (key === 'textos' && this.instance.hasOwnProperty('_textos')) {
                        console.log('🔄 Hot-Reload: Migrando "textos" antigo para "_textos" novo (Resetando).');
                        // Não copiamos, deixa o novo array vazio
                        continue;
                    }

                    // Se a nova instância tem a propriedade
                    if (this.instance.hasOwnProperty(key)) {
                        const val = oldInstance[key];
                        const novoVal = this.instance[key];

                        // PROTEÇÃO: Não sobrescrever Array com String (Correção do Bug FloatingText)
                        if (Array.isArray(novoVal) && typeof val === 'string') {
                            console.warn(`🔄 Hot-Reload: Ignorando sobrescrita de Array '${key}' por String '${val}'`);
                            continue;
                        }

                        // Só copia se tipos compatíveis (number/string/boolean) ou se target não for função
                        if (typeof val !== 'function' && typeof val !== 'object') {
                            this.instance[key] = val;
                        }
                    }
                }
                console.log('🔄 Hot-Reload: Propriedades preservadas do script anterior.');
            }
            // Restaurar propriedades do Save (se houver e não for hot-reload)
            else if (this.propsIniciais && Object.keys(this.propsIniciais).length > 0) {
                // FILTER: Ignorar propriedades de estado transiente (atacando, pulando, etc.)
                const ignoredKeys = [
                    'atacando', 'isAttacking', 'pulando', 'jumping',
                    'dash', 'dashed', 'dashCooling', 'invulneravel',
                    'attackTimer', 'cooldown', 'slideAtacando',
                    'correndo', 'estaMorto', 'morto', 'tomouDano',
                    'tempoDecorrido', 'tempoCooldown', 'tempoDash', 'tempoMorte'
                ];

                for (const [key, val] of Object.entries(this.propsIniciais)) {
                    if (ignoredKeys.includes(key)) continue;

                    if (this.instance.hasOwnProperty(key)) {
                        // PROTEÇÃO: Não sobrescrever Array com String (Correção de Saves Corrompidos)
                        const currentVal = this.instance[key];
                        if (Array.isArray(currentVal) && typeof val === 'string') {
                            console.warn(`⚠️ ScriptComponent: Bloqueando sobrescrita de Array '${key}' por String durante load.`);
                            continue;
                        }
                        this.instance[key] = val;
                    }
                }
            }

            this.erro = null;
            console.log('✅ Script compilado com sucesso:', this.scriptName);

        } catch (e) {
            console.error('❌ Erro ao compilar script:', e);
            this.erro = e.message;

            // CRÍTICO: Preserva instância anterior em vez de nullificar
            if (oldInstance) {
                console.warn('⚠️ Mantendo script anterior devido a erro de compilação');
                this.instance = oldInstance;
            } else {
                this.instance = null;
            }
        }
    }

    /**
     * Inicializa o componente
     */
    inicializar(entidade) {
        this.entidade = entidade;
        // Se já tem source, compila agora que temos a entidade
        if (this.source && !this.instance) {
            this.compilar();
        }
    }

    /**
     * Atualiza o script
     */
    atualizar(entidade, deltaTime) {
        if (this.instance) {
            // Processar Input (se houver engine e input)
            // IMPORTANTE: Passamos a ENGINE inteira como "input", pois ela contém os métodos teclaPressionada
            if (entidade.engine && this.instance.processarInput) {
                try {
                    this.instance.processarInput(entidade.engine);
                } catch (e) {
                    console.error('Erro em runtime no script (Input):', e);
                    this.erro = 'Runtime Input Error: ' + e.message;
                    this.instance = null; // Desabilita script com erro
                }
            }

            // Atualizar
            if (this.instance.atualizar) {
                try {
                    this.instance.atualizar(deltaTime);
                } catch (e) {
                    console.error('Erro em runtime no script:', e);
                    this.erro = 'Runtime Error: ' + e.message;
                    // Desabilita para não spammar erro
                    this.instance = null;
                }
            }
        }
    }

    /**
     * Renderização customizada do script
     */
    renderizar(renderizador, x, y, width, height) {
        if (this.instance && this.instance.renderizar) {
            try {
                // Debug: apenas para FloatingTextScript
                // if (this.instance.constructor.name === 'FloatingTextScript' || this.instance._textos) {
                //     console.log('[ScriptComponent] Renderizando FloatingTextScript, textos:', this.instance._textos ? this.instance._textos.length : 0);
                // }
                this.instance.renderizar(renderizador.ctx, x, y, width, height);
            } catch (e) {
                // Throttle error log?
                console.error('Erro de renderização no script:', e);
            }
        }
    }

    /**
     * HOOKS DE FÍSICA (Proxy para a instância do script)
     */
    onTriggerEnter(outro) {
        if (this.instance && this.instance.onTriggerEnter) {
            try { this.instance.onTriggerEnter(outro); } catch (e) { console.error('Script Runtime [onTriggerEnter]:', e); }
        }
    }

    onTriggerExit(outro) {
        if (this.instance && this.instance.onTriggerExit) {
            try { this.instance.onTriggerExit(outro); } catch (e) { console.error('Script Runtime [onTriggerExit]:', e); }
        }
    }

    onCollisionEnter(outro) {
        if (this.instance && this.instance.onCollisionEnter) {
            try { this.instance.onCollisionEnter(outro); } catch (e) { console.error('Script Runtime [onCollisionEnter]:', e); }
        }
    }

    onCollisionExit(outro) {
        if (this.instance && this.instance.onCollisionExit) {
            try { this.instance.onCollisionExit(outro); } catch (e) { console.error('Script Runtime [onCollisionExit]:', e); }
        }
    }

    /**
     * Serialização para salvar o projeto
     */
    serializar() {
        const dados = {
            tipo: 'ScriptComponent',
            source: this.source,
            scriptName: this.scriptName, // Salvar nome
            props: {}
        };

        // Salvar propriedades dinâmicas da instância
        if (this.instance) {
            const ignored = ['entidade', 'velocidadeX', 'velocidadeY', 'destruir', 'atualizar', 'renderizar', 'inicializar', 'processarInput'];
            for (const key of Object.keys(this.instance)) {
                if (ignored.includes(key)) continue;
                const val = this.instance[key];
                // Apenas tipos primitivos
                if (typeof val !== 'function' && typeof val !== 'object') {
                    dados.props[key] = val;
                }
            }
        }
        return dados;
    }

    desserializar(dados) {
        this.source = dados.source || '';
        this.scriptName = dados.scriptName || 'Script Personalizado'; // Restaurar nome
        this.propsIniciais = dados.props || {};

        // COMPILAÇÃO IMEDIATA: Garante que o script esteja pronto para rodar assim que carregar
        if (this.source && this.entidade) {
            this.compilar();
        }
    }

    /**
     * Destrói o componente
     */
    destruir() {
        this.instance = null;
    }
}

export default ScriptComponent;

/**
 * ParticleEmitterComponent - Sistema de Partículas
 * Cria e gerencia partículas com física, cor, tamanho e tempo de vida
 */
export class ParticleEmitterComponent {
    constructor() {
        this.tipo = 'ParticleEmitterComponent';
        this.entidade = null;

        // ===== REFERÊNCIA A TEMPLATE =====
        this.templateId = null;              // ID do template que está usando (null = configuração manual)

        // ===== PROPRIEDADES DE EMISSÃO =====
        this.emitindo = true;                // Se está emitindo partículas
        this.taxaEmissao = 10;               // Partículas por segundo
        this.maxParticulas = 100;            // Máximo de partículas ativas
        this.modo = 'continuo';              // 'continuo', 'burst', 'oneshot'
        this.burstQuantidade = 20;           // Quantidade em modo burst

        // ===== FORMATO DO EMISSOR =====
        this.formaEmissor = 'ponto';         // 'ponto', 'linha', 'circulo', 'retangulo'
        this.larguraEmissor = 0;             // Largura para linha/retângulo
        this.alturaEmissor = 0;              // Altura para retângulo
        this.raioEmissor = 20;               // Raio para círculo

        // ===== PROPRIEDADES VISUAIS =====
        this.corInicial = '#ffffff';         // Cor ao nascer
        this.corFinal = '#000000';           // Cor ao morrer
        this.tamanhoInicial = 5;             // Tamanho inicial (pixels)
        this.tamanhoFinal = 0;               // Tamanho final
        this.opacidadeInicial = 1.0;         // Alpha inicial
        this.opacidadeFinal = 0.0;           // Alpha final

        // ===== PROPRIEDADES DE FÍSICA =====
        this.velocidadeMin = 50;             // Velocidade mínima (pixels/s)
        this.velocidadeMax = 100;            // Velocidade máxima
        this.anguloMin = 0;                  // Ângulo mínimo (graus)
        this.anguloMax = 360;                // Ângulo máximo
        this.gravidade = 0;                  // Pixels/s² (positivo = para baixo)
        this.arrasto = 0.98;                 // Multiplicador de velocidade por frame (0-1)

        // ===== TEMPO DE VIDA =====
        this.tempoVidaMin = 1.0;             // Segundos
        this.tempoVidaMax = 2.0;             // Segundos

        // ===== VARIAÇÃO =====
        this.variacao = 0.1;                 // Variação aleatória (0-1)

        // ===== TEXTURA/SPRITE =====
        this.usarTextura = false;            // Se deve usar textura ao invés de círculo
        this.texturaUrl = null;              // URL da imagem
        this.texturaImage = null;            // Objeto Image carregado
        this.texturaLargura = 16;            // Largura da textura renderizada
        this.texturaAltura = 16;             // Altura da textura renderizada

        // ===== COLISÃO E RESPINGOS =====
        this.colidirComChao = false;         // Se partículas colidem com chão
        this.alturaChao = 600;               // Altura do chão (Y world)
        this.colidirComObjetos = false;      // Se partículas colidem com entidades
        this.criarRespingo = false;          // Se cria respingo ao colidir
        this.respingoQuantidade = 5;         // Quantas partículas de respingo
        this.respingoVelocidadeMin = 30;     // Velocidade mínima do respingo
        this.respingoVelocidadeMax = 80;     // Velocidade máxima do respingo

        // ===== ESTADO INTERNO =====
        this.particulas = [];
        this.respingos = [];                 // Partículas de respingo
        this.acumulador = 0;
        this.emitido = false;                // Para modo oneshot
    }

    /**
     * Aplica um preset de efeito
     */
    aplicarPreset(nome) {
        const presets = {
            fogo: {
                taxaEmissao: 30,
                maxParticulas: 150,
                corInicial: '#ff6600',
                corFinal: '#ff0000',
                tamanhoInicial: 8,
                tamanhoFinal: 2,
                opacidadeInicial: 1.0,
                opacidadeFinal: 0.0,
                velocidadeMin: 20,
                velocidadeMax: 60,
                anguloMin: 240,
                anguloMax: 300,
                gravidade: -30,
                tempoVidaMin: 0.5,
                tempoVidaMax: 1.5,
                formaEmissor: 'linha',
                larguraEmissor: 20
            },
            explosao: {
                modo: 'oneshot',
                burstQuantidade: 50,
                maxParticulas: 50,
                corInicial: '#ffaa00',
                corFinal: '#ff0000',
                tamanhoInicial: 10,
                tamanhoFinal: 0,
                velocidadeMin: 100,
                velocidadeMax: 200,
                anguloMin: 0,
                anguloMax: 360,
                gravidade: 200,
                tempoVidaMin: 0.3,
                tempoVidaMax: 0.8
            },
            fumaca: {
                taxaEmissao: 15,
                maxParticulas: 80,
                corInicial: '#888888',
                corFinal: '#333333',
                tamanhoInicial: 5,
                tamanhoFinal: 15,
                opacidadeInicial: 0.6,
                opacidadeFinal: 0.0,
                velocidadeMin: 10,
                velocidadeMax: 30,
                anguloMin: 240,
                anguloMax: 300,
                gravidade: -20,
                arrasto: 0.95,
                tempoVidaMin: 1.0,
                tempoVidaMax: 2.5
            },
            sparkles: {
                taxaEmissao: 20,
                maxParticulas: 100,
                corInicial: '#ffffaa',
                corFinal: '#ffff00',
                tamanhoInicial: 3,
                tamanhoFinal: 0,
                opacidadeInicial: 1.0,
                opacidadeFinal: 0.0,
                velocidadeMin: 30,
                velocidadeMax: 80,
                anguloMin: 0,
                anguloMax: 360,
                gravidade: 50,
                tempoVidaMin: 0.5,
                tempoVidaMax: 1.0,
                formaEmissor: 'circulo',
                raioEmissor: 10
            },
            chuva: {
                taxaEmissao: 50,
                maxParticulas: 200,
                corInicial: '#6699ff',
                corFinal: '#3366cc',
                tamanhoInicial: 2,
                tamanhoFinal: 1,
                opacidadeInicial: 0.7,
                opacidadeFinal: 0.3,
                velocidadeMin: 200,
                velocidadeMax: 300,
                anguloMin: 85,
                anguloMax: 95,
                gravidade: 400,
                tempoVidaMin: 1.0,
                tempoVidaMax: 2.0,
                formaEmissor: 'linha',
                larguraEmissor: 400
            },
            aura: {
                taxaEmissao: 25,
                maxParticulas: 120,
                corInicial: '#00ffff',
                corFinal: '#0066ff',
                tamanhoInicial: 4,
                tamanhoFinal: 0,
                opacidadeInicial: 0.8,
                opacidadeFinal: 0.0,
                velocidadeMin: 20,
                velocidadeMax: 40,
                anguloMin: 0,
                anguloMax: 360,
                gravidade: -10,
                tempoVidaMin: 0.8,
                tempoVidaMax: 1.5,
                formaEmissor: 'circulo',
                raioEmissor: 30
            }
        };

        const preset = presets[nome];
        if (preset) {
            Object.assign(this, preset);
            console.log(`✨ Preset "${nome}" aplicado!`);
        } else {
            console.warn(`⚠️ Preset "${nome}" não encontrado. Disponíveis:`, Object.keys(presets));
        }
    }

    /**
     * Aplica um template do gerenciador
     */
    aplicarTemplate(templateData) {
        if (!templateData) {
            console.warn('⚠️ Template vazio ou inválido');
            return;
        }

        // Remove propriedades que não devem ser copiadas
        const { id, nome, customizado, ...config } = templateData;

        // Aplica configuração
        Object.assign(this, config);

        // Define o templateId para rastreamento
        this.templateId = templateData.id;

        console.log(`✨ Template "${templateData.nome || templateData.id}" aplicado!`);
    }

    /**
     * Carrega uma textura para as partículas
     */
    carregarTextura(url) {
        if (!url) {
            this.usarTextura = false;
            this.texturaUrl = null;
            this.texturaImage = null;
            return;
        }

        this.texturaUrl = url;
        this.texturaImage = new Image();
        this.texturaImage.onload = () => {
            this.usarTextura = true;
            console.log(`✨ Textura carregada: ${url}`);
        };
        this.texturaImage.onerror = () => {
            console.warn(`⚠️ Erro ao carregar textura: ${url}`);
            this.usarTextura = false;
        };
        this.texturaImage.src = url;
    }

    /**
     * Cria uma nova partícula
     */
    criarParticula() {
        // Posição baseada na forma do emissor
        let px = 0, py = 0;

        switch (this.formaEmissor) {
            case 'linha':
                px = (Math.random() - 0.5) * this.larguraEmissor;
                break;
            case 'circulo':
                const angulo = Math.random() * Math.PI * 2;
                const raio = Math.random() * this.raioEmissor;
                px = Math.cos(angulo) * raio;
                py = Math.sin(angulo) * raio;
                break;
            case 'retangulo':
                px = (Math.random() - 0.5) * this.larguraEmissor;
                py = (Math.random() - 0.5) * this.alturaEmissor;
                break;
            default: // 'ponto'
                px = 0;
                py = 0;
        }

        // Velocidade e direção
        const velocidade = this.velocidadeMin + Math.random() * (this.velocidadeMax - this.velocidadeMin);
        const anguloGraus = this.anguloMin + Math.random() * (this.anguloMax - this.anguloMin);
        const anguloRad = (anguloGraus - 90) * Math.PI / 180; // -90 para 0° = para cima

        const vx = Math.cos(anguloRad) * velocidade;
        const vy = Math.sin(anguloRad) * velocidade;

        // Tempo de vida
        const vida = this.tempoVidaMin + Math.random() * (this.tempoVidaMax - this.tempoVidaMin);

        return {
            x: px,
            y: py,
            vx: vx,
            vy: vy,
            vida: vida,
            vidaMax: vida,
            tamanho: this.tamanhoInicial
        };
    }

    /**
     * Interpola entre dois valores
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * Interpola entre duas cores hex
     */
    lerpColor(color1, color2, t) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);

        const r = Math.round(this.lerp(c1.r, c2.r, t));
        const g = Math.round(this.lerp(c1.g, c2.g, t));
        const b = Math.round(this.lerp(c1.b, c2.b, t));

        return `rgb(${r}, ${g}, ${b})`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }

    /**
     * Verifica colisão de partícula com objetos
     */
    verificarColisaoComObjetos(worldX, worldY, entidades) {
        if (!entidades) return null;

        for (const entidade of entidades) {
            // Ignorar a própria entidade do emissor
            if (entidade === this.entidade) continue;

            // Verificar se tem CollisionComponent
            const collision = entidade.obterComponente?.('CollisionComponent');
            if (!collision) continue;

            // AABB simples
            const left = entidade.x;
            const right = entidade.x + entidade.largura;
            const top = entidade.y;
            const bottom = entidade.y + entidade.altura;

            if (worldX >= left && worldX <= right && worldY >= top && worldY <= bottom) {
                return {
                    entidade: entidade,
                    normal: worldY < (top + bottom) / 2 ? 'cima' : 'baixo'
                };
            }
        }

        return null;
    }

    atualizar(entidade, deltaTime) {
        // Inicializar referência à entidade se necessário
        if (!this.entidade) this.entidade = entidade;

        if (!this.entidade) return;

        // Emissão de partículas
        if (this.emitindo) {
            if (this.modo === 'continuo') {
                this.acumulador += deltaTime;
                const intervalo = 1 / this.taxaEmissao;

                while (this.acumulador >= intervalo && this.particulas.length < this.maxParticulas) {
                    this.particulas.push(this.criarParticula());
                    this.acumulador -= intervalo;
                }
            } else if ((this.modo === 'burst' || this.modo === 'oneshot') && !this.emitido) {
                for (let i = 0; i < this.burstQuantidade && this.particulas.length < this.maxParticulas; i++) {
                    this.particulas.push(this.criarParticula());
                }
                this.emitido = true;
                if (this.modo === 'oneshot') {
                    this.emitindo = false;
                }
            }
        }

        // Atualizar partículas
        for (let i = this.particulas.length - 1; i >= 0; i--) {
            const p = this.particulas[i];

            // Física
            p.vy += this.gravidade * deltaTime;
            p.vx *= Math.pow(this.arrasto, deltaTime * 60);
            p.vy *= Math.pow(this.arrasto, deltaTime * 60);

            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;

            // Verificar colisão com chão
            if (this.colidirComChao) {
                const worldY = (this.entidade.y + this.entidade.altura / 2) + p.y;

                if (worldY >= this.alturaChao && p.vy > 0) {
                    // Colidiu!

                    if (this.criarRespingo) {
                        // Criar partículas de respingo
                        for (let j = 0; j < this.respingoQuantidade; j++) {
                            const vel = this.respingoVelocidadeMin + Math.random() * (this.respingoVelocidadeMax - this.respingoVelocidadeMin);
                            const angulo = (180 + Math.random() * 180) * Math.PI / 180; // 180-360 graus (para cima/lados)

                            this.respingos.push({
                                x: p.x,
                                y: p.y,
                                vx: Math.cos(angulo) * vel,
                                vy: Math.sin(angulo) * vel,
                                vida: 0.3 + Math.random() * 0.3, // Vida curta
                                vidaMax: 0.5,
                                tamanho: this.tamanhoInicial * 0.5 // Menor que partícula original
                            });
                        }
                    }

                    // Remover partícula que colidiu
                    this.particulas.splice(i, 1);
                    continue;
                }
            }

            // Verificar colisão com objetos
            if (this.colidirComObjetos) {
                const emitterX = this.entidade.x + this.entidade.largura / 2;
                const emitterY = this.entidade.y + this.entidade.altura / 2;
                const worldX = emitterX + p.x;
                const worldY = emitterY + p.y;

                // Obter entidades - CORRIGIDO para modo Play!
                let entidades = [];

                // Tentar engine primeiro (modo Play)
                if (window.engine && window.engine.entidades) {
                    entidades = window.engine.entidades;
                }
                // Depois editor (modo Editor)
                else if (window.editor && window.editor.entidades) {
                    entidades = window.editor.entidades;
                }
                // Último recurso: engine via editor
                else if (window.editor && window.editor.engine && window.editor.engine.entidades) {
                    entidades = window.editor.engine.entidades;
                }

                const colisao = this.verificarColisaoComObjetos(worldX, worldY, entidades);

                if (colisao) {
                    // Colidiu com objeto!

                    if (this.criarRespingo) {
                        // Criar respingos
                        for (let j = 0; j < this.respingoQuantidade; j++) {
                            const vel = this.respingoVelocidadeMin + Math.random() * (this.respingoVelocidadeMax - this.respingoVelocidadeMin);
                            const angulo = (180 + Math.random() * 180) * Math.PI / 180;

                            this.respingos.push({
                                x: p.x,
                                y: p.y,
                                vx: Math.cos(angulo) * vel,
                                vy: Math.sin(angulo) * vel,
                                vida: 0.3 + Math.random() * 0.3,
                                vidaMax: 0.5,
                                tamanho: this.tamanhoInicial * 0.5
                            });
                        }
                    }

                    // Remover partícula
                    this.particulas.splice(i, 1);
                    continue;
                }
            }

            // Vida
            p.vida -= deltaTime;

            // Remover mortas
            if (p.vida <= 0) {
                this.particulas.splice(i, 1);
            }
        }

        // Atualizar respingos
        for (let i = this.respingos.length - 1; i >= 0; i--) {
            const r = this.respingos[i];

            // Física do respingo (gravidade mais forte)
            r.vy += this.gravidade * 2 * deltaTime;
            r.vx *= Math.pow(0.95, deltaTime * 60); // Arrasto maior
            r.vy *= Math.pow(0.95, deltaTime * 60);

            r.x += r.vx * deltaTime;
            r.y += r.vy * deltaTime;

            r.vida -= deltaTime;

            if (r.vida <= 0) {
                this.respingos.splice(i, 1);
            }
        }
    }

    renderizar(renderizador, x, y, largura, altura, rotacao) {
        if (!this.entidade) return;

        const ctx = renderizador.ctx;
        const camera = renderizador.camera;

        // Posição do emissor no mundo
        const emitterX = this.entidade.x + this.entidade.largura / 2;
        const emitterY = this.entidade.y + this.entidade.altura / 2;

        ctx.save();

        // Renderizar cada partícula
        for (const p of this.particulas) {
            const t = 1 - (p.vida / p.vidaMax); // 0 = nasceu, 1 = morrendo

            // Posição no mundo
            const worldX = emitterX + p.x;
            const worldY = emitterY + p.y;

            // Posição na tela
            const screenX = worldX - camera.x;
            const screenY = worldY - camera.y;

            // Interpolação de propriedades
            const tamanho = this.lerp(this.tamanhoInicial, this.tamanhoFinal, t);
            const opacidade = this.lerp(this.opacidadeInicial, this.opacidadeFinal, t);
            const cor = this.lerpColor(this.corInicial, this.corFinal, t);

            // Desenhar partícula
            ctx.globalAlpha = opacidade;

            if (this.usarTextura && this.texturaImage && this.texturaImage.complete) {
                // Desenhar com textura/sprite
                const largura = this.texturaLargura || tamanho;
                const altura = this.texturaAltura || tamanho;

                ctx.save();
                ctx.translate(screenX, screenY);

                // Aplicar tint de cor (blend com cor)
                if (cor !== 'rgb(255, 255, 255)') {
                    ctx.globalCompositeOperation = 'multiply';
                    ctx.fillStyle = cor;
                    ctx.fillRect(-largura / 2, -altura / 2, largura, altura);
                    ctx.globalCompositeOperation = 'destination-in';
                }

                ctx.drawImage(
                    this.texturaImage,
                    -largura / 2,
                    -altura / 2,
                    largura,
                    altura
                );

                ctx.restore();
            } else {
                // Fallback: desenhar círculo
                ctx.fillStyle = cor;
                ctx.beginPath();
                ctx.arc(screenX, screenY, tamanho / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Renderizar respingos
        for (const r of this.respingos) {
            const t = 1 - (r.vida / r.vidaMax);

            const worldX = emitterX + r.x;
            const worldY = emitterY + r.y;

            const screenX = worldX - camera.x;
            const screenY = worldY - camera.y;

            const tamanho = this.lerp(r.tamanho, 0, t);
            const opacidade = this.lerp(this.opacidadeInicial * 0.7, 0, t);
            const cor = this.lerpColor(this.corInicial, this.corFinal, t);

            ctx.globalAlpha = opacidade;
            ctx.fillStyle = cor;
            ctx.beginPath();
            ctx.arc(screenX, screenY, tamanho / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Reinicia o emissor
     */
    reiniciar() {
        this.particulas = [];
        this.acumulador = 0;
        this.emitido = false;
        this.emitindo = true;
    }

    /**
     * Emite um burst manual
     */
    emitirBurst(quantidade) {
        quantidade = quantidade || this.burstQuantidade;
        for (let i = 0; i < quantidade && this.particulas.length < this.maxParticulas; i++) {
            this.particulas.push(this.criarParticula());
        }
    }

    serializar() {
        return {
            tipo: 'ParticleEmitterComponent',
            emitindo: this.emitindo,
            taxaEmissao: this.taxaEmissao,
            maxParticulas: this.maxParticulas,
            modo: this.modo,
            burstQuantidade: this.burstQuantidade,
            formaEmissor: this.formaEmissor,
            larguraEmissor: this.larguraEmissor,
            alturaEmissor: this.alturaEmissor,
            raioEmissor: this.raioEmissor,
            corInicial: this.corInicial,
            corFinal: this.corFinal,
            tamanhoInicial: this.tamanhoInicial,
            tamanhoFinal: this.tamanhoFinal,
            opacidadeInicial: this.opacidadeInicial,
            opacidadeFinal: this.opacidadeFinal,
            velocidadeMin: this.velocidadeMin,
            velocidadeMax: this.velocidadeMax,
            anguloMin: this.anguloMin,
            anguloMax: this.anguloMax,
            gravidade: this.gravidade,
            arrasto: this.arrasto,
            tempoVidaMin: this.tempoVidaMin,
            tempoVidaMax: this.tempoVidaMax
        };
    }

    desserializar(dados) {
        Object.assign(this, dados);
        // Reinicializar estado
        this.particulas = [];
        this.acumulador = 0;
        this.emitido = false;
        return this;
    }
}

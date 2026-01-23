/**
 * AudioManager.js
 * Gerencia todo o sistema de áudio do jogo (BGM e SFX).
 */
class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterVolume = 1.0;
        this.musicVolume = 1.0;
        this.sfxVolume = 1.0;
        this.currentMusic = null; // Elemento Audio HTML5 para música (streaming)
        this.sounds = new Map(); // Cache de AudioBuffers para SFX
        this.activeSources = []; // Lista de fontes ativas (para poder parar)
        this.initialized = false;
        this.muted = false;

        // Tentar inicializar no primeiro clique do usuário (navegadores bloqueiam áudio automático)
        this.initOnInteraction();
    }

    initOnInteraction() {
        const unlock = () => {
            this.init();
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
        };
        window.addEventListener('click', unlock);
        window.addEventListener('keydown', unlock);
    }

    init() {
        if (this.initialized) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.initialized = true;
            console.log('🔊 AudioManager inicializado!');
        } catch (e) {
            console.error('Falha ao inicializar WebAudio:', e);
        }
    }

    /**
     * Alterna o estado de mudo global
     */
    toggleMute() {
        this.muted = !this.muted;

        // Mute Music
        if (this.currentMusic) {
            this.currentMusic.muted = this.muted;
        }

        // Mute WebAudio (Suspend/Resume context)
        if (this.ctx) {
            if (this.muted) {
                this.ctx.suspend();
            } else {
                this.ctx.resume();
            }
        }

        return this.muted;
    }

    /**
     * Toca um efeito sonoro (SFX) usando WebAudio API (baixa latência)
     * @param {string} assetId - ID do asset de áudio
     * @param {number} volume - 0.0 a 1.0 (multiplicado pelo master e sfx)
     * @param {boolean} loop - Se deve repetir
     */
    play(assetId, volume = 1.0, loop = false, playbackRate = 1.0) {
        if (this.muted || !this.ctx) return null;

        const buffer = window.GameAssets ? window.GameAssets[assetId] : null;

        // Apply Global Metadata Volume Correction
        let metaVol = 1.0;
        if (window.GameAssetsMeta && window.GameAssetsMeta[assetId]) {
            metaVol = window.GameAssetsMeta[assetId].volume || 1.0;
        }
        const correctedVol = volume * metaVol;

        if (!buffer || !(buffer instanceof AudioBuffer)) {
            // Fallback para String (Base64/URL) - Usando HTML5 Audio para SFX simples
            if (typeof buffer === 'string') {
                const audio = new Audio(buffer);
                audio.volume = correctedVol * this.masterVolume * this.sfxVolume;
                audio.loop = loop;
                audio.playbackRate = playbackRate;
                audio.play().catch(e => console.warn('Erro ao tocar SFX (HTML5):', e));

                return {
                    stop: () => { audio.pause(); audio.currentTime = 0; },
                    setVolume: (v) => { audio.volume = v * this.masterVolume * this.sfxVolume; },
                    setRate: (r) => { audio.playbackRate = r; }
                };
            }

            console.warn(`AudioBuffer não encontrado para: ${assetId}`);
            return null;
        }

        // Criar Source
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = loop;
        source.playbackRate.value = playbackRate;

        // Criar Gain Node (Volume)
        const gainNode = this.ctx.createGain();
        const finalVol = correctedVol * this.masterVolume * this.sfxVolume;
        gainNode.gain.value = finalVol;

        // Conectar: Source -> Gain -> Destino
        source.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        source.start(0);

        // Rastrear para poder parar se necessário (limpeza automática no onended)
        const soundObj = { source, gainNode, id: Date.now() };
        this.activeSources.push(soundObj);

        source.onended = () => {
            const idx = this.activeSources.indexOf(soundObj);
            if (idx > -1) this.activeSources.splice(idx, 1);
        };

        // Retorna handle de controle
        return {
            source: source,
            gainNode: gainNode,
            stop: () => {
                try { source.stop(); } catch (e) { }
            },
            setVolume: (v) => {
                // Smooth ramp to prevent clicking
                gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
                gainNode.gain.setValueAtTime(gainNode.gain.value, this.ctx.currentTime);
                gainNode.gain.linearRampToValueAtTime(v * this.masterVolume * this.sfxVolume, this.ctx.currentTime + 0.1);
            },
            setRate: (r) => {
                source.playbackRate.setValueAtTime(r, this.ctx.currentTime);
            }
        };
    }

    /**
     * Toca música de fundo (Ideal para streaming/arquivos longos)
     * @param {string} assetId 
     * @param {number} volume 
     * @param {boolean} loop 
     */
    playMusic(assetId, volume = 1.0, loop = true) {
        if (this.muted) return;

        // Parar música anterior com fade out (opcional, aqui faremos stop direto)
        this.stopMusic();

        const src = window.GameAssets ? window.GameAssets[assetId] : null;
        if (!src) {
            console.warn(`Música não encontrada: ${assetId}`);
            return;
        }

        // Se o asset for um blob URL ou caminho
        // NOTA: Nosso loader atual carrega IMAGENS. Precisaremos ajustar o loader para carregar AUDIO.
        // Assumindo por enquanto que o loader retornará uma URL ou AudioBuffer.

        // Estratégia Híbrida:
        // Se for AudioBuffer (carregado via XHR), usamos WebAudio.
        // Se for String (URL), usamos HTML5 Audio.

        if (typeof src === 'string') {
            this.currentMusic = new Audio(src);
            this.currentMusic.loop = loop;
            this.currentMusic.volume = volume * this.masterVolume * this.musicVolume;
            this.currentMusic.play().catch(e => console.log("Autoplay bloqueado na música:", e));
        } else if (src instanceof AudioBuffer) {
            // Tocar música com WebAudio (menos ideal para memória, mas funciona)
            // ... (Implementação WebAudio para música similar ao play())
        }
    }

    setMusicVolume(volume) {
        if (this.currentMusic) {
            this.currentMusic.volume = volume * this.masterVolume * this.musicVolume;
        }
    }

    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            this.currentMusic = null;
        }
    }

    stopAll() {
        this.stopMusic();
        this.activeSources.forEach(s => {
            try { s.source.stop(); } catch (e) { }
        });
        this.activeSources = [];
    }
}

// Exportar Singleton
window.AudioManager = new AudioManager();

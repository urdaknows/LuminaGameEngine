export default class SoundComponent {
    constructor(entidade) {
        this.entidade = entidade;

        // Propriedades Serializáveis
        // Propriedades Serializáveis
        this.tipo = 'SoundComponent';
        this.assetId = '';      // ID do arquivo de áudio
        this._volume = 1.0;      // 0 a 1 (Backing field)
        this.loop = false;      // Repetir?
        this.autoplay = false;  // Tocar ao iniciar?
        this.isMusic = false;   // É música de fundo?

        // Estado Interno
        this.playing = false;
        this.source = null;     // Referência ao AudioSource (se SFX) ou Element (se Music)
    }

    // Getter/Setter para Volume (Atualização em Tempo Real)
    get volume() { return this._volume; }
    set volume(val) {
        this._volume = val;
        if (this.playing && window.AudioManager) {
            if (this.isMusic) {
                window.AudioManager.setMusicVolume(val);
            } else if (this.source && this.source.setVolume) {
                this.source.setVolume(val);
            }
        }
    }

    iniciar() {
        if (this.autoplay && this.assetId) {
            this.play();
        }
    }

    play() {
        if (!window.AudioManager) return;

        if (this.isMusic) {
            window.AudioManager.playMusic(this.assetId, this._volume, this.loop);
            this.playing = true;
        } else {
            // SFX
            this.source = window.AudioManager.play(this.assetId, this._volume, this.loop);
            if (this.source) this.playing = true;
        }
    }

    stop() {
        if (!window.AudioManager) return;

        if (this.isMusic) {
            window.AudioManager.stopMusic();
        } else {
            if (this.source && this.source.stop) {
                try { this.source.stop(); } catch (e) { }
                this.source = null;
            }
        }
        this.playing = false;
    }

    serializar() {
        return {
            tipo: 'SoundComponent',
            assetId: this.assetId,
            volume: this._volume,
            loop: this.loop,
            autoplay: this.autoplay,
            isMusic: this.isMusic
        };
    }

    desserializar(dados) {
        this.assetId = dados.assetId || '';
        this.volume = dados.volume !== undefined ? dados.volume : 1.0;
        this.loop = dados.loop || false;
        this.autoplay = dados.autoplay || false;
        this.isMusic = dados.isMusic || false;
    }

    onDestroy() {
        // Parar som ao destruir o objeto
        this.stop();
    }
}

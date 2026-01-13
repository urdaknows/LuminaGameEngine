# Estratégias de Exportação do Projeto (Brainstorming)

Este documento detalha as estratégias levantadas para implementar a funcionalidade de "Exportar Jogo" no Lumina Game Engine. O objetivo é transformar projetos criados no editor em jogos executáveis independentes.

## 1. Web Export (Standalone Player com HTML5) [Recomendado como Base]

Esta é a abordagem mais direta, aproveitando a natureza web da engine. O jogo é distribuído como um pacote HTML/JS/CSS.

*   **Como funciona:**
    *   Cria-se um arquivo `player.html` dedicado (sem interface de editor, apenas Canvas).
    *   Este arquivo carrega a `Engine` (Core), os scripts de `Componentes` e o arquivo de dados do projeto (`game.json`).
    *   O `player.html` inicializa a Engine em modo "Runtime" (tela cheia).

*   **Processo de Build:**
    *   O Editor gera um arquivo `.zip` contendo:
        *   `index.html` (o `player.html` renomeado).
        *   `js/` (arquivos da engine minificados/bundlados).
        *   `assets/` (imagens e sons).
        *   `data.json` (o projeto).

*   **Prós:**
    *   **Implementação Rápida:** Utiliza a tecnologia já existente no editor.
    *   **Portabilidade:** Roda em qualquer dispositivo com navegador (PC, Mobile, Tablet).
    *   **Distribuição:** Pronto para itch.io, GitHub Pages ou hospedagem própria.
    *   **UX:** Basta um clique para jogar (zero instalação).

*   **Contras:**
    *   **Segurança:** Código fonte (Javascript) exposto e fácil de inspecionar.
    *   **Limitações de Navegador:** Depende de políticas de CORS (pode exigir um servidor local simples para rodar se baixado no PC).

---

## 2. Desktop Wrapper (Electron ou Tauri)

Empacotamento da versão Web dentro de um executável nativo, para uma experiência desktop "premium".

*   **Como funciona:**
    *   Utiliza-se uma ferramenta como **Electron** (Node.js) ou **Tauri** (Rust/WebView).
    *   Essas ferramentas criam uma janela de navegador "sem bordas" que carrega o `player.html` localmente.

*   **Processo de Build:**
    *   O usuário baixaria um "Exportador" ou o Editor teria uma ferramenta de CLI integrada que roda o build do Electron/Tauri para gerar `.exe` (Windows), `.app` (Mac) ou Binário Linux.

*   **Prós:**
    *   **Profissionalismo:** Gera um instalador e ícone na área de trabalho.
    *   **Acesso ao Sistema:** Permite salvar arquivos reais no disco (Save System robusto), acessar hardware específico, etc.
    *   **Proteção:** Código fonte levemente mais ofuscado (dentro do pacote do aplicativo).
    *   **Offline:** Funciona 100% offline sem problemas de CORS.

*   **Contras:**
    *   **Tamanho:** Executáveis Electron são pesados (~100MB+ Hello World). Tauri é mais leve mas exige setup de Rust.
    *   **Complexidade:** Requer ferramentas externas de build (Node, Compiladores) ou um serviço de build na nuvem.

---

## 3. Data-Driven Export (Player Genérico)

Separação total entre os DADOS do jogo e o EXECUTÁVEL.

*   **Como funciona:**
    *   Nós (desenvolvedores da Engine) distribuímos um "Lumina Player" oficial (.exe).
    *   O usuário exporta apenas o arquivo `.json` do jogo e sua pasta de assets.
    *   Para jogar, o usuário final abre o "Lumina Player" e carrega o arquivo do jogo.

*   **Processo de Build:**
    *   A exportação é apenas "Salvar Como..." (gerar o JSON limpo).

*   **Prós:**
    *   **Leveza:** O "jogo" do usuário tem poucos KB/MB.
    *   **Manutenção:** Podemos atualizar a Engine (Lumina Player) corrigindo bugs sem que o usuário precise re-exportar o jogo dele.
    *   **Simplicidade:** Mimetiza emuladores ou engines antigas (RPG Maker 2000).

*   **Contras:**
    *   **Dependência:** O jogador precisa ter o "Lumina Player" instalado previamente.
    *   **Identidade:** O jogo não parece "autônomo", parece um arquivo rodando em outro programa.

---

## Conclusão e Próximos Passos (Caminho Incremental)

A estratégia recomendada é adotar um desenvolvimento **incremental**:

1.  **Fase 1 (Web Player):** Focar 100% em fazer o `player.html` funcionar. Isso é pré-requisito para qualquer outra opção.
    *   *Tarefa:* Criar `player.html` que carrega `demo_game.json` e roda o jogo sem a UI do editor.

2.  **Fase 2 (Web Build):** Criar a automação no Editor que gera o `.zip` com o Web Player.

3.  **Fase 3 (Desktop Wrapper):** Futuramente, usar o resultado da Fase 2 como entrada para o Electron/Tauri, para quem deseja exportar para Steam/Desktop.

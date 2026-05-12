# Compactacao Da Conversa - Open Studio + OpenDesign

Data: 2026-05-11

## Decisao De Produto

Open Studio deixa de ser uma UI mockada e vira um produto local-first para criacao de conteudo. A diferenca central em relacao ao OpenDesign e o dominio: OpenDesign e um workspace generico de design/artefatos; Open Studio e focado em video creator workflow, com pacote de entrega composto por briefing, roteiro, titulos, thumbnail, legendas, assets, pesquisa, critica e export.

Escopo ativo visivel: texto, imagem, pacotes de conteudo, titulos CTR/SEO, legendas, thumbnails e export. Video/audio/musica ficam escondidos da UI ativa por enquanto, mas entram no daemon/media tool e no catalogo interno porque fazem sentido para o futuro do produto.

## Estado Atual Do Projeto

- O app roda em Next.js 16 com App Router.
- A UI ja tem dashboard, pipeline, scripts, thumbnails, assets, content e settings.
- Ja existe uma superficie daemon-like dentro das rotas Next, mas ainda nao ha daemon separado long-running.
- Ja existem rotas de geracao para texto, imagem, package, titles, captions, assets, exports, agents e media.
- Ja existe deteccao de CLIs locais inspirada no OpenDesign: Claude Code, Codex, Gemini, OpenCode e outros.
- Ja existe `.open-studio/` para settings, assets, exports e tasks basicas.
- Ja existe `scripts/open-studio.mjs` com comandos iniciais de media.
- `npm test`, `npm run lint` e `npm run build` passaram na ultima verificacao conhecida apos correcoes do Codex CLI.

## Problemas Encontrados

- O pipeline ainda e geracao solta por endpoint, nao run/project lifecycle.
- Titulos gerados no pipeline nao ficam claramente sincronizados com a rota de titulos.
- Selecao de provider/model ja foi corrigida parcialmente, mas precisa virar fonte unica de verdade.
- Codex CLI detecta, mas nesta maquina falhou por incompatibilidade/modelo/conta, com erro limpo extraido do JSON do proprio Codex.
- Imagem falhou porque caiu no provider default antigo ou sem chave configurada.
- Fallback BYOK para texto existe, mas ainda nao ha fallback visual/UX nem fallback forte para imagem/media.
- Settings simplificado removeu opcoes falsas, mas ainda precisa do modo avancado estilo OpenDesign para CLI/BYOK/media quando o backend suportar.
- Voz de marca, referencias e variaveis na tela de scripts ainda sao fracas ou parciais.

## OpenDesign Ja Estudado

Repositorio local clonado em `D:\_codex_tmp_open_design`.

Arquivos de maior interesse:

- `apps/daemon/src/server.ts`
- `apps/daemon/src/cli.ts`
- `apps/daemon/src/projects.ts`
- `apps/daemon/src/runs.ts`
- `apps/daemon/src/project-routes.ts`
- `apps/daemon/src/chat-routes.ts`
- `apps/daemon/src/runtimes/*`
- `apps/daemon/src/claude-stream.ts`
- `apps/daemon/src/json-event-stream.ts`
- `apps/daemon/src/copilot-stream.ts`
- `apps/daemon/src/qoder-stream.ts`
- `apps/daemon/src/pi-rpc.ts`
- `apps/daemon/src/acp.ts`
- `apps/daemon/src/media.ts`
- `apps/daemon/src/media-routes.ts`
- `apps/daemon/src/media-models.ts`
- `apps/daemon/src/media-tasks.ts`
- `apps/daemon/src/prompts/media-contract.ts`
- `apps/daemon/src/prompts/research-contract.ts`
- `apps/daemon/src/research/*`
- `apps/daemon/src/skills.ts`
- `apps/daemon/src/memory.ts`
- `apps/daemon/src/routines.ts`
- `apps/daemon/src/critique/*`
- `apps/daemon/src/live-artifacts/*`
- `apps/daemon/src/import-export-routes.ts`
- `apps/daemon/src/pdf-export.ts`
- `apps/daemon/src/origin-validation.ts`
- `apps/daemon/src/connectionTest.ts`
- `apps/daemon/src/providerModels.ts`
- `prompt-templates/*`
- `skills/*`

## Coisas Do OpenDesign Que Devem Entrar

Nada da lista abaixo deve ser removido do SDD:

- Daemon real separado.
- Projects/runs/status/cancel/resume/history.
- Artifact store completo por projeto.
- Agent loop com streaming, eventos, tool calls, stdout, stderr, file writes, errors, done e cancel.
- Parsers por agente.
- Capability gating.
- Fallback chain explicito.
- Skills registry.
- Prompt composer avancado.
- Media contract completo para image/video/audio.
- Media providers reais e catalogo grande.
- Tasks/wait/cancel/retry/progresso.
- Research/Tavily para CTR/SEO/outliers.
- Prompt templates importados.
- Design systems transformado em brand kit/voice visual.
- Memory local.
- Routines/presets de pipeline.
- Connectors como fase futura, mas especificado.
- MCP server como fase futura, mas especificado.
- Live artifacts adaptados para pacotes vivos/dashboards.
- Critique Theater para avaliar pacote.
- Comment mode/edicao cirurgica.
- Sliders/parametros de criacao.
- Preview/renderer sandbox.
- Export forte: MD, JSON, HTML, PDF, ZIP, PPTX quando fizer sentido.
- Import/export de projetos.
- Native folder dialog/desktop bridge.
- Origin validation/security.
- Provider model discovery/cache/live models.
- Connection test profundo.
- Prompt budget/argv guard.
- Claude diagnostics.
- Codex imagegen override.
- BYOK/API direct topology.
- Vercel/tunnel/deploy.
- i18n completo.
- Quick switcher/recents.
- File workspace.
- Sketch editor para thumbnail/storyboard.

## Direcao De UX

Preservar UI visual: dark premium, cinematic, magenta restrito, foco de criador. Nao transformar em clone visual do OpenDesign. OpenDesign entra como logica, runtime, fluxo e arquitetura. O app deve parecer um studio de producao de videos, nao uma IDE generica.

## Regra Operacional

Antes de implementar, o SDD vira fonte de verdade. Depois o trabalho deve ser quebrado em specs/sprints pequenos, com testes por camada e smoke real do fluxo:

1. Settings: CLI/BYOK/media/research.
2. Script.
3. Titulos CTR/SEO.
4. Thumbnail/imagem.
5. Pipeline package.
6. Assets/files.
7. Exports.
8. Run history/status.
9. Falhas/fallbacks.


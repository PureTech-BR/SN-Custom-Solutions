# Histórico

## 2.1.0 — 14/11/2026

- Reincorpora `aoop_service_availability_degradation_usecommitment` no motor por eventos.
- Aplica agenda, timezone e manutenção no numerador/denominador do modo por compromisso.
- Captura o modo uma vez por execução.
- Alterar a property não publica evento nem recalcula. Sincronização pelo fluxo nativo ordem 200 ou Fix Script manual.
- Trata base zero com percentual vazio; mantém somente três campos de resultado.
- Update Set único com 44 Customer Updates, incluindo desativações da V1.

## 2.0.0 — 14/11/2026

- Arquitetura por eventos com três BRs e Script Include central.
- Recálculo dirigido por alterações, exclusões, vínculos e novas disponibilidades.
- Integração ao evento nativo com Script Action ordem 200.
- Elimina dependência do booleano de cálculo, cursor e Scheduled Job próprio.
- Preserva V1 inativa para reversão; indicadores passam a usar percentual preenchido.

# Indicadores de cor configuráveis

Extensão visual implementada após o pacote de cálculo v1.0.0. Os fontes desta extensão estão em `src/ui`; o XML v1.0.0 existente ainda contém somente a solução de cálculo.

## Configuração

[Propriedade aoop_service_availability_degradation_color_ranges](https://dev437951.service-now.com/sys_properties.do?sys_id=73a960edc3e05758e079b13ed40131da)

```json
[
  {
    "max": 25,
    "color": "green"
  },
  {
    "max": 50,
    "color": "yellow"
  },
  {
    "max": 75,
    "color": "orange"
  },
  {
    "max": 100,
    "color": "red"
  }
]
```

São quatro faixas, com limites numéricos crescentes entre 0 e 100, e último limite igual a 100. Cada faixa começa acima do limite anterior: 25,01 entra na segunda faixa. Cores aceitas: green, yellow, orange, red. As cores podem ser repetidas ou trocadas de posição. JSON ou faixas inválidas usam os padrões acima; não há BR de validação ou sincronização.

Após salvar a propriedade, recarregue formulário/lista. Não é necessário executar o job ou recalcular os registros. A configuração só altera a apresentação.

## Componentes

| Componente | Função |
| --- | --- |
| Propriedade (73a960edc3e05758e079b13ed40131da) | Fonte única das faixas e nomes das cores. |
| Script Include AOOP_DegradationColorConfig (5fa920edc3e05758e079b13ed40131c1) | Valida a configuração em leitura, aplica fallback e classifica percentuais no servidor. Client callable, herda AbstractAjaxProcessor; único método de negócio público getRanges retorna apenas configuração visual, sem consultar registros de disponibilidade. Métodos internos têm prefixo _. |
| Client Script AOOP - Degradation - Percentage color (a663a069c3605758e079b13ed40131e2) | onLoad Desktop; consulta as faixas via GlideAjax e adiciona decoração com g_form.addDecoration. Não pinta o campo. |
| Quatro Field Styles (src/ui/field-styles.json) | Um por cor. Cada condição consulta a propriedade por meio do Script Include. No renderer nativo da lista clássica exibem a bolinha ao lado do percentual; não pintam a linha. A condição restringe a aplicação à URL service_availability_list.do para não preencher o fundo no formulário. |

Não há nova BR ativa para cores, nem evento ou job. As duas regras experimentais criadas durante o teste (bba960edc3e05758e079b13ed40131c9 e bfa960edc3e05758e079b13ed40131d1) foram desativadas e não fazem parte desta extensão.

Só há indicador quando u_degradation_calculated=true, o percentual está preenchido e fica entre 0 e 100. A classificação consulta a propriedade em memória de cache da plataforma; não varre service_availability. O formulário realiza uma chamada GlideAjax apenas nos registros elegíveis. Os Field Styles avaliam sua condição nas linhas renderizadas da lista. Os scripts nativos e o processamento de cálculo não foram alterados.

As classes semânticas do formulário seguem o tema da plataforma; os estilos da lista usam os equivalentes hexadecimais definidos nos fontes. A tonalidade visual pode variar entre tema e renderer.

## Validação

- 13 verificações finais no servidor: limites 0/25/25,01/50/50,01/75/75,01/100, valores fora da faixa, percentual vazio, registro não calculado e ausência de BR de cores ativa.
- Troca real da primeira faixa para max=20/color=red: formulário recebeu icon-info color-red; lista recebeu somente o marcador vermelho.
- Verificado campo do formulário sem background-color e célula da lista sem preenchimento da linha.
- Configuração original restaurada e bolinha verde confirmada.
- Nenhum dado de negócio foi alterado nos testes desta extensão.

## Transporte

O XML v1.0.0 não foi regenerado com a extensão visual. Para transportar esta extensão, capture a propriedade, o Script Include, o Client Script e os quatro Field Styles em um Update Set próprio. Não inclua as regras experimentais desativadas. A configuração visual foi validada na interface clássica Desktop; outras interfaces precisam de validação específica.

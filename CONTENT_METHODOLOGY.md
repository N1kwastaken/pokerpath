# Metodologia do conteúdo estratégico

## Estado atual

Os charts atuais são **referências pedagógicas simplificadas** para Cash
6-max com 100 BB efetivos. Eles são a fonte única dos exercícios preflop que
têm chart por trás, então gabarito, grade e barras concordam por construção.

Eles **não** são apresentados como soluções GTO verificadas. Os ranges de
defesa foram construídos manualmente e podem ter decisões discutíveis na borda.
Spots postflop, 4-bet e squeeze não recebem frequência quando não existe uma
fonte correspondente.

A versão visível na interface é `reference-2026.07-v1`.

## O que “solver verificado” exigirá

Um perfil só poderá usar essa classificação quando o repositório tiver:

1. árvore completa do spot: posições, stack efetivo, rake, sizings e abstrações;
2. identificação do solver e de sua versão;
3. export bruto preservado com hash;
4. importador reproduzível, sem digitação manual de frequências;
5. teste que compare 100% das células importadas com o artefato;
6. versão e premissas exibidas no chart e no feedback.

Até esses seis itens existirem, o conteúdo permanece `REFERENCE` e
`solverVerified: false`.

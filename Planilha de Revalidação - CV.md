# Objetivo

Adicionar um novo módulo ao Querida Labs chamado **Planilha de Revalidação - CV**.

O objetivo do módulo é permitir que o usuário importe uma planilha de Matérias-Primas e uma planilha de Produtos Bloqueados, realize a comparação entre ambas utilizando o código do produto como chave e gere automaticamente uma planilha final em formato Excel (.xlsx) contendo apenas os produtos presentes nas duas fontes.

---

# Fluxo do Usuário

1. O usuário acessa o módulo **Planilha de Revalidação - CV**.
2. O usuário pode cadastrar, editar, excluir e pesquisar Matérias-Primas manualmente.
3. O sistema disponibiliza um modelo vazio da planilha de Matérias-Primas para download.
4. O usuário pode importar uma planilha de Matérias-Primas para popular ou atualizar a base de dados.
5. O usuário importa a planilha de Produtos Bloqueados.
6. O usuário informa o nome que deseja utilizar nas abas da planilha final.
7. O usuário clica em **Gerar Planilha**.
8. O sistema realiza todas as validações, compara as duas bases de dados e gera uma planilha Excel (.xlsx) para download.

---

# Planilha de Matérias-Primas

A planilha de Matérias-Primas possui exatamente três colunas:

* Código do Produto (obrigatório)
* Nome do Produto (obrigatório)
* Distribuidor (opcional)

## Regras

* O Código do Produto deve ser único.
* Caso o Distribuidor esteja vazio, o sistema deve armazenar o valor **"Não Atribuido"**.
* O campo Distribuidor deve ser normalizado para letras maiúsculas antes do armazenamento.
* As Matérias-Primas devem ser persistidas no MongoDB utilizando a infraestrutura já existente do Querida Labs.
* A importação deve servir tanto para cadastro quanto para atualização da base.
* Caso o código já exista, todos os dados da Matéria-Prima devem ser atualizados utilizando os valores da planilha.
* Caso a planilha contenha códigos duplicados com informações diferentes entre si, o processamento deve ser interrompido e o sistema deve informar exatamente quais códigos estão duplicados.

Exemplo:

```text
123
Produto A

123
Produto B
```

O sistema também deve disponibilizar um modelo vazio desta planilha para download.

---

# Planilha de Produtos Bloqueados

A planilha de Produtos Bloqueados possui o seguinte formato:

* Código do Produto
* Nome do Produto
* Lote
* Saldo de Estoque
* Status
* Data de Fabricação
* Data de Validade
* Detalhes
* Observações
* Distribuída
* Qtd Pendente em Pedidos

## Regras

A comparação entre Produtos Bloqueados e Matérias-Primas deve ser realizada exclusivamente pelo campo **Código do Produto**.

Caso um produto da planilha de Produtos Bloqueados não exista na base de Matérias-Primas, ele deve ser ignorado e não deve gerar erro.

---

# Geração da Planilha Final

Sempre que o usuário clicar no botão **Gerar Planilha**, o sistema deverá gerar uma planilha Excel (.xlsx) contendo apenas os produtos encontrados em ambas as bases.

A planilha final deverá conter as seguintes colunas:

* Código do Produto (Matérias-Primas)
* Nome do Produto (Matérias-Primas)
* Lote (Produtos Bloqueados)
* Distribuída (Produtos Bloqueados)
* Saldo de Estoque (Produtos Bloqueados)
* Status (Produtos Bloqueados)
* Data de Fabricação (Produtos Bloqueados)
* Data de Validade (Produtos Bloqueados)
* Detalhes (Produtos Bloqueados)
* Observações (Produtos Bloqueados)
* Risco (coluna em branco)
* Estratégia Sugerida (coluna em branco)

A planilha deverá possuir duas abas:

### Geral

Deve conter todos os produtos encontrados.

### Vendas

Deve conter todos os produtos, exceto aqueles classificados como **Amostra**.

Antes da geração da planilha, o usuário deverá informar o nome das abas.

Os nomes deverão seguir exatamente o formato:

* Geral: `${nome informado pelo usuário}`
* Vendas: `${nome informado pelo usuário} - VENDAS`

---

# Regras de Classificação

Inicialmente o sistema deverá possuir a seguinte regra:

* Todo produto cujo Código do Produto comece com **85** deve ser classificado como **Amostra**.

As regras de classificação devem ser implementadas de forma extensível, permitindo a adição de novas regras futuramente sem necessidade de alterar a lógica principal de geração da planilha.

---

# CRUD de Matérias-Primas

Mesmo sem importar uma planilha, o usuário deve ser capaz de:

* Cadastrar Matérias-Primas manualmente.
* Editar Matérias-Primas.
* Excluir Matérias-Primas.
* Pesquisar Matérias-Primas.
* Visualizar os registros com paginação.

A pesquisa deverá ser parcial (**contains**) e não exigir correspondência exata.

Os campos pesquisáveis são:

* Código do Produto
* Nome do Produto
* Distribuidor
* Classificação (Amostra ou não)

---

# Validações

O sistema deverá:

* Aceitar apenas arquivos `.xlsx` e `.xls`.
* Validar todos os arquivos antes do processamento.
* Informar quando um arquivo estiver inválido ou corrompido.
* Validar a estrutura das planilhas importadas.
* Validar códigos duplicados na planilha de Matérias-Primas.
* Atualizar automaticamente registros existentes quando o Código do Produto já estiver cadastrado.

---

# Tratamento de Erros

Toda operação deverá apresentar mensagens de erro claras e descritivas.

Os erros devem permitir que o usuário identifique facilmente o problema e saiba como corrigi-lo.

Exemplos:

* Arquivo inválido.
* Arquivo corrompido.
* Colunas obrigatórias ausentes.
* Estrutura incorreta da planilha.
* Código duplicado na planilha de Matérias-Primas.
* Falha durante a geração da planilha.

---

# Requisitos Técnicos

* Utilizar a arquitetura já existente do Querida Labs.
* Seguir o padrão visual dos demais módulos.
* Código totalmente tipado em TypeScript.
* Componentes reutilizáveis.
* Não duplicar lógica.
* Utilizar Server Actions para operações de upload e geração da planilha.
* Utilizar MongoDB para persistência das Matérias-Primas.
* Utilizar ExcelJS para leitura e geração das planilhas.
* Validar todos os arquivos antes do processamento.
* Exibir feedback de progresso durante uploads e geração da planilha.
* Toda operação deve possuir tratamento de erro amigável.
* A geração da planilha deve ser determinística e reproduzível.
* Escrever testes unitários para as regras de classificação e comparação.
* Documentar a estrutura das planilhas aceitas.

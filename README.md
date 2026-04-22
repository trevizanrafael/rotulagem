# 🧠 Sistema de Auditoria de Rótulos Lácteos com IA
> Plataforma inteligente para análise, validação e auditoria de rótulos de produtos lácteos com base em checklists parametrizáveis e suporte de Inteligência Artificial.

---

## 🚀 Visão Geral

Este sistema permite que usuários realizem auditorias completas de rótulos de produtos lácteos, garantindo conformidade com legislações vigentes por meio de:

- 📋 Checklists automáticos (baseados em subcategoria)
- 🧠 Análise com Inteligência Artificial
- ⚙️ Estrutura 100% parametrizável (sem necessidade de código)
- 📄 Geração de relatórios auditáveis em PDF
- 🔐 Controle de usuários e rastreabilidade completa

---

## 🧩 Arquitetura do Sistema

O sistema é baseado em 4 pilares principais:

### 1. Estrutura Parametrizável
- Categorias
- Subcategorias
- Checklists
- Itens de checklist

👉 Tudo gerenciado pelo administrador, sem necessidade de alterar código.

---

### 2. Regra Automática de Checklist

O usuário NÃO escolhe checklist manualmente.

Fluxo:
1. Seleciona categoria
2. Seleciona subcategoria
3. Sistema monta automaticamente:
   - Checklists gerais
   - Checklist específico da subcategoria

---

### 3. Auditoria do Produto

Cada produto possui:
- Nome
- Categoria
- Subcategoria
- Imagem do rótulo
- Checklist preenchido

Cada item da checklist permite:
- ✅ Conforme
- ❌ Não conforme
- ⚠️ Não aplicável
- ⏳ Não avaliado

---

### 4. Integração com IA

A IA realiza análise do rótulo com base em:

- Imagens (Base64)
- Checklist preenchida

Regras:
- IA só é liberada quando checklist está completa
- Resposta é armazenada no sistema
- Deve conter fundamentação legal

---

## 🏗️ Funcionalidades

### 👤 Usuários
- Login / Logout
- Controle por perfil (Admin / Usuário)

---

### 📦 Produtos (Rótulos)
- Cadastro de produto
- Upload de imagens
- Edição e exclusão
- Visualização em cards

---

### 📋 Checklists
- Preenchimento por item
- Salvamento parcial
- Limpeza com confirmação
- Status automático

---

### 📄 Relatórios
- Exportação em PDF
- Conteúdo auditável
- Histórico de análises

---

### 🧠 IA
- Análise automática do rótulo
- Integração via API (OpenRouter)
- Armazenamento de respostas

---

### ⚙️ Painel Administrativo

Menu:
- Categorias
- Subcategorias
- Checklists
- Usuários

#### Funcionalidades:

**Categorias**
- Criar
- Editar
- Inativar

**Subcategorias**
- Criar
- Vincular categoria
- Vincular checklists
- Editar
- Inativar

**Checklists**
- Criar checklist
- Criar seções
- Criar itens
- Editar itens
- Versionar
- Inativar

**Usuários**
- Criar
- Editar
- Ativar/Inativar
- Definir perfil

---

## 🧠 Regras de Negócio

- ❌ Usuário não escolhe checklist manualmente
- ⚙️ Sistema monta checklist automaticamente
- 🔒 Checklist pode ser bloqueada após finalização
- 📊 Status do produto é gerado automaticamente
- 🧾 Sistema mantém rastreabilidade completa:
  - Usuário
  - Data/Hora
  - Versão da checklist
  - Versão do produto

---

## 📊 Lógica de Status

| Condição | Resultado |
|--------|---------|
| Existe "Não Conforme" | ❌ Reprovado |
| Existe "Não Avaliado" | ⏳ Incompleto |
| Apenas "Conforme" e "N/A" | ✅ Aprovado |

---

## 🔐 Segurança

- Senhas criptografadas
- Controle de acesso por perfil
- Logs de auditoria
- Histórico de alterações

---

## 📎 Requisitos Técnicos

- Suporte a múltiplos usuários
- Upload de imagens (JPG / PNG)
- Geração de PDF
- Integração com API de IA
- Sistema escalável

---

## 🧱 Estrutura Sugerida de Banco de Dados

### Principais entidades:

- users
- products
- categories
- subcategories
- checklists
- checklist_items
- checklist_versions
- product_checklist
- product_checklist_items
- ai_analysis
- logs

---

## 🔄 Fluxo do Sistema

1. Usuário cria produto
2. Seleciona categoria e subcategoria
3. Sistema monta checklist automaticamente
4. Usuário preenche checklist
5. Sistema gera status
6. Usuário executa análise por IA
7. Sistema armazena resposta
8. Usuário exporta relatório

---

## 🧪 Futuras Melhorias

- 📷 OCR automático de rótulos
- 📊 Dashboard com indicadores
- 📱 Versão mobile
- 🔔 Alertas de não conformidade
- 📚 Base legal dinâmica

---

## 📌 Objetivo do Sistema

Garantir que produtos lácteos estejam:

- ✔️ Em conformidade com a legislação
- ✔️ Seguros para consumo
- ✔️ Preparados para auditorias e fiscalizações

---

## 🧠 Filosofia do Projeto

> “O sistema não depende do usuário lembrar o que fazer.
> Ele já sabe.”

---

## 🛠️ Status do Projeto

🚧 Em desenvolvimento / pronto para implementação técnica

---

## 📞 Contato

FoodTech Consultoria  
Especialistas em inspeção e conformidade de alimentos

---

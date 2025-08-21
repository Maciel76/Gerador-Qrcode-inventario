# Sistema de Geração de QR Codes para Códigos de Produtos

Sistema web desenvolvido para gerar QR Codes a partir de códigos de produtos, facilitando o processo de inventário e controle de estoque através de coletores de dados.

## 🚀 Funcionalidades

- **Entrada de dados flexível**: Aceita colagem de texto ou upload de arquivo CSV
- **Geração de QR Codes**: Converte códigos em QR Codes prontos para bipagem
- **Visualização moderna**: Exibição em cards ou tabela
- **Opções personalizáveis**:
  - Tamanho ajustável do QR Code (64-256px)
  - Níveis de correção de erro (M, Q, H)
  - Opção de deduplicação de códigos
- **Impressão otimizada**: Layout preparado para impressão em formato A4
- **Persistência de dados**: Salva automaticamente suas preferências
- **Design responsivo**: Funciona em desktop e dispositivos móveis

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica do sistema
- **CSS3**: Estilos modernos com design responsivo
- **JavaScript**: Lógica de aplicação e interatividade
- **QRCode.js**: Biblioteca para geração de QR Codes
- **PapaParse**: Processamento de arquivos CSV
- **Font Awesome**: Ícones para interface

## 📦 Instalação

1. Clone ou faça download dos arquivos do projeto
2. Certifique-se de ter os seguintes arquivos:
   - `index.html`
   - `styles.css`
   - `app.js`
3. Abra o arquivo `index.html` em um navegador moderno

## 🎯 Como Usar

### 1. Entrada de Dados

**Opção 1 - Colar dados:**
codigo;nome;quantidade
1126755;BLUSA MOLETOM AZUL ESP G3;5
1172728;BOTINA TERMICA ELASTI MICROF 44;10
40164;CALCA JEANS MASCULINA M M;14

**Opção 2 - Upload de CSV:**

- Clique em "Selecionar arquivo CSV"
- Selecione um arquivo com as colunas: código, nome, quantidade

### 2. Configurações

- **Tamanho do QR Code**: Ajuste o tamanho do QR Code (96px padrão)
- **Correção de Erro**: Escolha entre níveis M (15%), Q (25%) ou H (30%)
- **Deduplicar**: Ative/desative a deduplicação de códigos repetidos

### 3. Geração

- Clique em "Gerar QR Codes" para processar os dados
- Visualize os resultados em cards ou tabela usando o seletor de visualização

### 4. Impressão

- Clique em "Imprimir" para gerar uma versão impressível
- O layout é otimizado para papel A4 com margens de 10mm

## 📁 Estrutura de Arquivos

sistema-qrcode/
├── index.html # Página principal
├── styles.css # Estilos e design responsivo
├── app.js # Lógica da aplicação
└── README.md # Este arquivo

## 🔧 Personalização

### Cores e Tema

As cores podem ser personalizadas editando as variáveis CSS no início do arquivo `styles.css`:

```css
:root {
    --primary-color: #4361ee;
    --secondary-color: #3a0ca3;
    --accent-color: #f72585;
    /* ... outras variáveis */
}
Configurações de QR Code
Os parâmetros dos QR Codes podem ser ajustados no código JavaScript:
new QRCode(box, {
    text: r.codigo,
    width: opts.size,          // Tamanho em pixels
    height: opts.size,
    correctLevel: QRCode.CorrectLevel[opts.ecc],  // Nível de correção
    margin: 2                  // Margem
});
🌐 Navegadores Suportados
Chrome 60+

Firefox 60+

Safari 12+

Edge 79+

📋 Requisitos
Navegador moderno com suporte a JavaScript

Conexão com internet para carregar bibliotecas externas (CDN)

🤝 Contribuição
Contribuições são bem-vindas! Sinta-se à vontade para:

Fazer um fork do projeto

Criar uma branch para sua feature (git checkout -b feature/AmazingFeature)

Commitar suas mudanças (git commit -m 'Add some AmazingFeature')

Fazer push para a branch (git push origin feature/AmazingFeature)

Abrir um Pull Request

📞 Suporte
Em caso de dúvidas ou problemas, entre em contato:

WhatsApp: (62) 98280-9010

Email: stwcontato@hotmail.com

GitHub: Maciel76

📄 Licença
Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

🎉 Agradecimentos
QRCode.js - Biblioteca de geração de QR Codes

PapaParse - Biblioteca de parsing de CSV

Font Awesome - Ícones

```

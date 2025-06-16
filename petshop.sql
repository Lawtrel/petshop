-- Garante que estamos usando o banco de dados correto.
-- Se o banco de dados não existir, crie-o primeiro com: CREATE DATABASE Petshop;
USE Petshop;
GO

-- ====================================================================================
-- TABELAS SEM DEPENDÊNCIAS (CATÁLOGOS)
-- ====================================================================================

-- Tabela de Clientes
CREATE TABLE Cliente (
    ClienteID INT PRIMARY KEY IDENTITY(1,1),
    Nome VARCHAR(100) NOT NULL,
    Rua VARCHAR(100) NOT NULL,
    Estado CHAR(2) NOT NULL,
    CEP VARCHAR(8) NOT NULL,
    CPF CHAR(11) NOT NULL UNIQUE
);
GO

-- Tabela de Contatos do Cliente
CREATE TABLE ClienteContato (
    ContatoID INT PRIMARY KEY IDENTITY(1,1),
    Telefone VARCHAR(15) NULL,
    Celular VARCHAR(15) NULL,
    Email VARCHAR(255) NOT NULL,
    ClienteID INT NOT NULL,
    CONSTRAINT FK_ClienteContato_Cliente FOREIGN KEY (ClienteID) REFERENCES Cliente(ClienteID)
);
GO

-- Tabela de Espécies de Animais
CREATE TABLE Especie (
    EspecieID INT PRIMARY KEY IDENTITY(1,1),
    NomeEspecie VARCHAR(50) NOT NULL
);
GO

-- Tabela de Raças (depende de Espécie)
CREATE TABLE Raca (
    RacaID INT PRIMARY KEY IDENTITY(1,1),
    NomeRaca VARCHAR(100) NOT NULL,
    Descricao VARCHAR(255) NULL,
    EspecieID INT NOT NULL,
    CONSTRAINT FK_Raca_Especie FOREIGN KEY (EspecieID) REFERENCES Especie(EspecieID)
);
GO

-- Tabela de Animais
CREATE TABLE Animal (
    AnimalID INT PRIMARY KEY IDENTITY(1,1),
    Nome VARCHAR(255) NOT NULL,
    ClienteID INT NOT NULL,
    EspecieID INT NOT NULL,
    RacaID INT NOT NULL,
    CONSTRAINT FK_Animal_Cliente FOREIGN KEY (ClienteID) REFERENCES Cliente(ClienteID),
    CONSTRAINT FK_Animal_Especie FOREIGN KEY (EspecieID) REFERENCES Especie(EspecieID),
    CONSTRAINT FK_Animal_Raca FOREIGN KEY (RacaID) REFERENCES Raca(RacaID)
);
GO

-- Tabela de Produtos
CREATE TABLE Produto (
    ProdutoID INT PRIMARY KEY IDENTITY(1,1),
    NomeProduto VARCHAR(100) NOT NULL,
    Preco DECIMAL(10, 2) NOT NULL,
    QuantidadeEstoque INT NOT NULL
);
GO

-- Tabela de Tipos de Serviço
CREATE TABLE TipoServico (
    TipoServicoID INT PRIMARY KEY IDENTITY(1,1),
    NomeTipoServico VARCHAR(125) NOT NULL
);
GO

-- Tabela de Serviços oferecidos (catálogo)
CREATE TABLE Servico (
    ServicoID INT PRIMARY KEY IDENTITY(1,1),
    NomeServico VARCHAR(100) NOT NULL,
    Descricao VARCHAR(255) NULL,
    Preco DECIMAL(10, 2) NOT NULL,
    TipoServicoID INT NOT NULL,
    CONSTRAINT FK_Servico_TipoServico FOREIGN KEY (TipoServicoID) REFERENCES TipoServico(TipoServicoID)
);
GO

-- Tabela de Formas de Pagamento
CREATE TABLE FormaPagamento (
    FormaPagamentoID INT PRIMARY KEY IDENTITY(1,1),
    NomeFormaPagamento VARCHAR(50) NOT NULL
);
GO

-- ====================================================================================
-- TABELAS TRANSACIONAIS (VENDAS)
-- ====================================================================================

-- Tabela Principal de Vendas
CREATE TABLE Venda (
    VendaID INT PRIMARY KEY IDENTITY(1,1),
    DataVenda DATETIME NOT NULL DEFAULT GETDATE(),
    ValorTotal DECIMAL(10, 2) NOT NULL,
    ClienteID INT NOT NULL,
    FormaPagamentoID INT NOT NULL,
    CONSTRAINT FK_Venda_Cliente FOREIGN KEY (ClienteID) REFERENCES Cliente(ClienteID),
    CONSTRAINT FK_Venda_FormaPagamento FOREIGN KEY (FormaPagamentoID) REFERENCES FormaPagamento(FormaPagamentoID)
);
GO

-- Tabela de Junção para registrar os produtos de uma venda (Muitos-para-Muitos)
CREATE TABLE VendaProduto (
    VendaProdutoID INT PRIMARY KEY IDENTITY(1,1),
    VendaID INT NOT NULL,
    ProdutoID INT NOT NULL,
    Quantidade INT NOT NULL,
    PrecoUnitario DECIMAL(10, 2) NOT NULL, -- Registra o preço no momento da venda
    CONSTRAINT FK_VendaProduto_Venda FOREIGN KEY (VendaID) REFERENCES Venda(VendaID),
    CONSTRAINT FK_VendaProduto_Produto FOREIGN KEY (ProdutoID) REFERENCES Produto(ProdutoID)
);
GO

-- Tabela de Junção para registrar os serviços de uma venda (Muitos-para-Muitos)
CREATE TABLE VendaServico (
    VendaServicoID INT PRIMARY KEY IDENTITY(1,1),
    VendaID INT NOT NULL,
    ServicoID INT NOT NULL,
    AnimalID INT NOT NULL, -- Qual animal recebeu o serviço
    PrecoCobrado DECIMAL(10, 2) NOT NULL, -- Registra o preço no momento do serviço
    CONSTRAINT FK_VendaServico_Venda FOREIGN KEY (VendaID) REFERENCES Venda(VendaID),
    CONSTRAINT FK_VendaServico_Servico FOREIGN KEY (ServicoID) REFERENCES Servico(ServicoID),
    CONSTRAINT FK_VendaServico_Animal FOREIGN KEY (AnimalID) REFERENCES Animal(AnimalID)
);
GO

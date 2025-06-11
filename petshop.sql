-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 04/06/2025 às 17:00
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `petshop`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `animal`
--

CREATE TABLE `animal` (
  `ID_Animal` int(11) NOT NULL,
  `Nome` varchar(255) DEFAULT NULL,
  `ID_cliente` int(11) DEFAULT NULL,
  `ID_Especie` int(11) DEFAULT NULL,
  `ID_Raca` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `cliente`
--

CREATE TABLE `cliente` (
  `ID_Cliente` int(11) NOT NULL,
  `Nome` varchar(100) NOT NULL,
  `Rua` varchar(100) NOT NULL,
  `Estado` varchar(2) NOT NULL,
  `CEP` varchar(8) NOT NULL,
  `CPF` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `cliente_contato`
--

CREATE TABLE `cliente_contato` (
  `ID` int(11) NOT NULL,
  `Tel` varchar(11) NOT NULL,
  `Cel` varchar(11) NOT NULL,
  `Email` varchar(20) NOT NULL,
  `ID_Cliente` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `compra`
--

CREATE TABLE `compra` (
  `id` int(11) NOT NULL,
  `Data_Compra` date NOT NULL DEFAULT current_timestamp(),
  `valor` decimal(5,2) NOT NULL,
  `ID_Cliente` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `especie`
--

CREATE TABLE `especie` (
  `ID_Especie` int(11) NOT NULL,
  `Especie` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `forma_pagamento`
--

CREATE TABLE `forma_pagamento` (
  `ID_Pagamento` int(11) NOT NULL,
  `forma_pagamento` varchar(25) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `produto`
--

CREATE TABLE `produto` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `preco` decimal(5,2) NOT NULL,
  `qtd` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `raca`
--

CREATE TABLE `raca` (
  `ID_Raca` int(11) NOT NULL,
  `Nome` varchar(100) DEFAULT NULL,
  `Descricao` varchar(100) DEFAULT NULL,
  `ID_Especie` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `servico`
--

CREATE TABLE `servico` (
  `ID_servico` int(11) NOT NULL,
  `Nome` varchar(100) DEFAULT NULL,
  `Descricao` varchar(100) DEFAULT NULL,
  `preco` decimal(5,2) DEFAULT NULL,
  `ID_Animal` int(11) DEFAULT NULL,
  `ID_tipo_servico` int(11) DEFAULT NULL,
  `ID_Forma_Pagamento` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tipo_servico`
--

CREATE TABLE `tipo_servico` (
  `id_tipo` int(11) NOT NULL,
  `tipo_servico` varchar(125) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `animal`
--
ALTER TABLE `animal`
  ADD PRIMARY KEY (`ID_Animal`),
  ADD KEY `ID_cliente` (`ID_cliente`),
  ADD KEY `ID_Especie` (`ID_Especie`),
  ADD KEY `ID_Raca` (`ID_Raca`);

--
-- Índices de tabela `cliente`
--
ALTER TABLE `cliente`
  ADD PRIMARY KEY (`ID_Cliente`),
  ADD UNIQUE KEY `CEP` (`CEP`),
  ADD UNIQUE KEY `CPF` (`CPF`);

--
-- Índices de tabela `cliente_contato`
--
ALTER TABLE `cliente_contato`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `ID_Cliente` (`ID_Cliente`);

--
-- Índices de tabela `compra`
--
ALTER TABLE `compra`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ID_Cliente` (`ID_Cliente`);

--
-- Índices de tabela `especie`
--
ALTER TABLE `especie`
  ADD PRIMARY KEY (`ID_Especie`);

--
-- Índices de tabela `forma_pagamento`
--
ALTER TABLE `forma_pagamento`
  ADD PRIMARY KEY (`ID_Pagamento`);

--
-- Índices de tabela `produto`
--
ALTER TABLE `produto`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `raca`
--
ALTER TABLE `raca`
  ADD PRIMARY KEY (`ID_Raca`),
  ADD KEY `ID_Especie` (`ID_Especie`);

--
-- Índices de tabela `servico`
--
ALTER TABLE `servico`
  ADD PRIMARY KEY (`ID_servico`),
  ADD KEY `ID_Forma_Pagamento` (`ID_Forma_Pagamento`);

--
-- Índices de tabela `tipo_servico`
--
ALTER TABLE `tipo_servico`
  ADD PRIMARY KEY (`id_tipo`);

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `animal`
--
ALTER TABLE `animal`
  ADD CONSTRAINT `animal_ibfk_1` FOREIGN KEY (`ID_cliente`) REFERENCES `cliente` (`ID_Cliente`),
  ADD CONSTRAINT `animal_ibfk_2` FOREIGN KEY (`ID_Especie`) REFERENCES `especie` (`ID_Especie`),
  ADD CONSTRAINT `animal_ibfk_3` FOREIGN KEY (`ID_Raca`) REFERENCES `raca` (`ID_Raca`);

--
-- Restrições para tabelas `cliente_contato`
--
ALTER TABLE `cliente_contato`
  ADD CONSTRAINT `cliente_contato_ibfk_1` FOREIGN KEY (`ID_Cliente`) REFERENCES `cliente` (`ID_Cliente`);

--
-- Restrições para tabelas `compra`
--
ALTER TABLE `compra`
  ADD CONSTRAINT `compra_ibfk_1` FOREIGN KEY (`ID_Cliente`) REFERENCES `cliente` (`ID_Cliente`);

--
-- Restrições para tabelas `raca`
--
ALTER TABLE `raca`
  ADD CONSTRAINT `raca_ibfk_1` FOREIGN KEY (`ID_Especie`) REFERENCES `especie` (`ID_Especie`);

--
-- Restrições para tabelas `servico`
--
ALTER TABLE `servico`
  ADD CONSTRAINT `servico_ibfk_1` FOREIGN KEY (`ID_Forma_Pagamento`) REFERENCES `forma_pagamento` (`ID_Pagamento`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

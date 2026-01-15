-- CreateTable
CREATE TABLE `RelatorioAluno` (
    `id` VARCHAR(191) NOT NULL,
    `conteudo` LONGTEXT NOT NULL,
    `periodo` VARCHAR(191) NOT NULL,
    `tipoPeriodo` ENUM('mensal', 'bimestral', 'trimestral', 'semestral') NOT NULL DEFAULT 'bimestral',
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `idAluno` VARCHAR(191) NOT NULL,
    `idProfessor` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RelatorioAluno` ADD CONSTRAINT `RelatorioAluno_idAluno_fkey` FOREIGN KEY (`idAluno`) REFERENCES `Aluno`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RelatorioAluno` ADD CONSTRAINT `RelatorioAluno_idProfessor_fkey` FOREIGN KEY (`idProfessor`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

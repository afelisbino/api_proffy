-- CreateTable
CREATE TABLE `TurmasProfessor` (
    `id` VARCHAR(191) NOT NULL,
    `idTurma` VARCHAR(191) NOT NULL,
    `idProfessor` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `TurmasProfessor_idTurma_idProfessor_key`(`idTurma`, `idProfessor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TurmasProfessor` ADD CONSTRAINT `TurmasProfessor_idTurma_fkey` FOREIGN KEY (`idTurma`) REFERENCES `Turma`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TurmasProfessor` ADD CONSTRAINT `TurmasProfessor_idProfessor_fkey` FOREIGN KEY (`idProfessor`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

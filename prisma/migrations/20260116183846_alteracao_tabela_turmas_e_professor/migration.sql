/*
  Warnings:

  - The primary key for the `TurmasProfessor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `TurmasProfessor` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `TurmasProfessor` DROP FOREIGN KEY `TurmasProfessor_idTurma_fkey`;

-- DropIndex
DROP INDEX `TurmasProfessor_idTurma_idProfessor_key` ON `TurmasProfessor`;

-- AlterTable
ALTER TABLE `TurmasProfessor` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD PRIMARY KEY (`idTurma`, `idProfessor`);

-- AddForeignKey
ALTER TABLE `TurmasProfessor` ADD CONSTRAINT `TurmasProfessor_idTurma_fkey` FOREIGN KEY (`idTurma`) REFERENCES `Turma`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

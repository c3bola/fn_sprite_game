/**
 * @fileoverview Level configurations containing path coordinates, speeds, and level definitions.
 */

export interface LevelConfig {
  id: number;
  name: string;
  points: number[];
  baseSpeed: number;
  totalBalls: number;
}

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Floresta Inicial (Zigue-Zague)',
    points: [
      480, -50,
      480, 100,
      80, 150,
      80, 300,
      460, 350,
      460, 500,
      80, 550,
      80, 750,
      270, 880,
      460, 750,
      270, 650
    ],
    baseSpeed: 0.025,
    // Aumentamos de 25 para 80. Assim a cauda da fila sempre ficará fora da tela
    // até que o jogador comece a destruir grandes partes da corrente.
    totalBalls: 80 
  },
  {
    id: 2,
    name: 'Espirais do Pântano',
    points: [
      270, -50,
      270, 120,
      460, 180,
      460, 420,
      80, 420,
      80, 240,
      380, 240,
      380, 600,
      120, 600,
      120, 780,
      270, 650
    ],
    baseSpeed: 0.032,
    totalBalls: 120 
  }
];
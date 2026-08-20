/**
 * @fileoverview Main configuration file for the Phaser 3 game instance.
 * Sets up rendering, scaling, physics, and the initial scene sequence.
 */

import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { GameScene } from '../scenes/GameScene';

/**
 * Phaser game configuration object.
 * Configured for a vertical 9:16 mobile aspect ratio.
 */
export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 540,
  height: 960,
  parent: 'game-container',
  backgroundColor: '#2d2d2d',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [BootScene, GameScene]
};
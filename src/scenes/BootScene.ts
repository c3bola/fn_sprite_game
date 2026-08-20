/**
 * @fileoverview Boot scene responsible for loading core assets before the game starts.
 */

import Phaser from 'phaser';

/**
 * BootScene handles the initial preload phase.
 * Transitions directly to the GameScene once assets are loaded.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  /**
   * Preloads game assets into memory.
   */
  preload(): void {
    // Assets will be loaded here in future iterations
    this.load.setPath('assets/sprites/');
  }

  /**
   * Called immediately after preload.
   * Initializes the main gameplay scene.
   */
  create(): void {
    this.scene.start('GameScene');
  }
}
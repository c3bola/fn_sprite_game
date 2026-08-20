/**
 * @fileoverview Overlay UI scene with level progression handling and event cleanup.
 */

import Phaser from 'phaser';

interface WinData {
  hasNextLevel: boolean;
  nextLevelIndex: number;
  mode: 'normal' | 'hard';
}

export class UIScene extends Phaser.Scene {
  private remainingText!: Phaser.GameObjects.Text;
  private hudContainer!: Phaser.GameObjects.Container;

  constructor() {
    super('UIScene');
  }

  create(): void {
    const gameScene = this.scene.get('GameScene');

    // CORREÇÃO: Limpa eventos antigos para o HUD não bugar (ficar com "--") no restart
    gameScene.events.off('update-count', this.updateRemainingCount, this);
    gameScene.events.off('game-over', this.showGameOver, this);
    gameScene.events.off('game-win', this.showGameWin, this);

    gameScene.events.on('update-count', this.updateRemainingCount, this);
    gameScene.events.on('game-over', this.showGameOver, this);
    gameScene.events.on('game-win', this.showGameWin, this);

    this.showModeSelection();
  }

  private showModeSelection(): void {
    this.children.removeAll();

    this.add.rectangle(270, 480, 540, 960, 0xe67e22);

    this.add.rectangle(270, 100, 380, 70, 0xc0392b);
    this.add.text(270, 100, 'SELEÇÃO DE MODO', {
      fontSize: '26px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Embananado
    const leftCard = this.add.rectangle(150, 450, 200, 420, 0xf5cd79)
      .setStrokeStyle(4, 0xf39c12)
      .setInteractive({ useHandCursor: true });

    this.add.circle(150, 400, 60, 0xf1c40f);
    this.add.text(150, 400, 'PEELY', { fontSize: '18px', color: '#000000', fontStyle: 'bold' }).setOrigin(0.5);

    const btnNormal = this.add.rectangle(150, 600, 170, 50, 0xd35400);
    this.add.text(150, 600, 'embananado', { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    leftCard.on('pointerdown', () => this.selectMode('normal'));

    // Tryhard
    const rightCard = this.add.rectangle(390, 450, 200, 420, 0xf5cd79)
      .setStrokeStyle(4, 0xf39c12)
      .setInteractive({ useHandCursor: true });

    this.add.circle(390, 400, 60, 0x2980b9);
    this.add.text(390, 400, 'TRYHARD', { fontSize: '16px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    const btnHard = this.add.rectangle(390, 600, 170, 50, 0xd35400);
    this.add.text(390, 600, 'tryhard', { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    rightCard.on('pointerdown', () => this.selectMode('hard'));
  }

  private selectMode(mode: 'normal' | 'hard', levelIndex: number = 0): void {
    this.children.removeAll();
    this.createHUD();
    this.scene.get('GameScene').events.emit('start-game', mode, levelIndex);
  }

  private createHUD(): void {
    this.hudContainer = this.add.container(270, 40);

    const hudBg = this.add.rectangle(0, 0, 220, 45, 0x000000, 0.6)
      .setStrokeStyle(2, 0xffffff);

    this.remainingText = this.add.text(0, 0, 'Restantes: --', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.hudContainer.add([hudBg, this.remainingText]);
  }

  private updateRemainingCount(count: number): void {
    if (this.remainingText && this.remainingText.active) {
      this.remainingText.setText(`Restantes: ${count}`);
    }
  }

  private showGameOver(reason: string): void {
    if (this.hudContainer) this.hudContainer.setVisible(false);

    this.add.rectangle(270, 480, 540, 960, 0x000000, 0.85);

    this.add.text(270, 380, 'GAME OVER', {
      fontSize: '36px',
      color: '#e84118',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(270, 430, reason, {
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 440 }
    }).setOrigin(0.5);

    const restartBtn = this.add.rectangle(270, 530, 220, 50, 0x00a8ff)
      .setInteractive({ useHandCursor: true });

    this.add.text(270, 530, 'TENTAR NOVAMENTE', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    restartBtn.on('pointerdown', () => {
      this.scene.stop('UIScene');
      this.scene.get('GameScene').scene.restart();
    });
  }

  private showGameWin(data: WinData): void {
    if (this.hudContainer) this.hudContainer.setVisible(false);

    this.add.rectangle(270, 480, 540, 960, 0x000000, 0.85);

    this.add.text(270, 380, 'VITÓRIA!', {
      fontSize: '36px',
      color: '#4cd137',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const btnLabel = data.hasNextLevel ? 'PRÓXIMO NÍVEL' : 'JOGAR DE NOVO';
    const nextBtn = this.add.rectangle(270, 530, 220, 50, 0xfbc531)
      .setInteractive({ useHandCursor: true });

    this.add.text(270, 530, btnLabel, {
      fontSize: '16px',
      color: '#000000',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    nextBtn.on('pointerdown', () => {
      this.scene.stop('UIScene');
      if (data.hasNextLevel) {
        this.selectMode(data.mode, data.nextLevelIndex);
      } else {
        this.scene.get('GameScene').scene.restart();
      }
    });
  }
}
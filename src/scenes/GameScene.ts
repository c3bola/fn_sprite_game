/**
 * @fileoverview Refactored core gameplay scene with continuous fleeing generation.
 */

import Phaser from 'phaser';
import { CurvePath } from '../core/CurvePath';
import { Cannon } from '../entities/Cannon';
import { Villain } from '../entities/Villain';
import { LEVELS, LevelConfig } from '../config/levelData';

export class GameScene extends Phaser.Scene {
  private path!: CurvePath;
  private cannon!: Cannon;
  private villain!: Villain;
  
  private aimLine!: Phaser.GameObjects.Graphics;
  private elementals: Phaser.GameObjects.Arc[] = [];
  
  private currentLevelIndex: number = 0;
  private currentMode: 'normal' | 'hard' = 'normal';
  
  private chainSpacing: number = 0.018; 
  private availableColors = [0x00a8ff, 0x4cd137, 0xe84118, 0xfbc531, 0x9c88ff];

  private isPlaying: boolean = false;
  private isGameOver: boolean = false;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#2d4c2d');

    this.isPlaying = false;
    this.isGameOver = false;

    this.cannon = new Cannon(this, 270, 750, this.availableColors);
    this.villain = new Villain(this);
    this.aimLine = this.add.graphics();

    this.scene.launch('UIScene');

    this.events.once('start-game', (mode: 'normal' | 'hard', levelIndex: number = 0) => {
      this.currentMode = mode;
      this.currentLevelIndex = levelIndex;
      this.loadLevel(this.currentLevelIndex);
      this.isPlaying = true;
      this.events.emit('update-count', this.elementals.length);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isPlaying || this.isGameOver) return;
      this.cannon.aim(pointer.x, pointer.y);
      this.aimLine.clear();
      this.aimLine.lineStyle(2, 0xffffff, 0.5);
      this.aimLine.lineBetween(this.cannon.container.x, this.cannon.container.y, pointer.x, pointer.y);
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isPlaying || this.isGameOver) return;
      this.cannon.shoot(pointer.x, pointer.y);
    });
  }

  private loadLevel(levelIndex: number): void {
    const level: LevelConfig = LEVELS[levelIndex] || LEVELS[0];
    this.path = new CurvePath(level.points);
    this.path.draw(this);

    const speed = this.currentMode === 'normal' ? level.baseSpeed : level.baseSpeed * 1.5;
    this.villain.reset(speed);

    this.elementals.forEach(el => el.destroy());

    const count = level.totalBalls; 
    this.elementals = Array.from({ length: count }).map(() => {
      const color = Phaser.Math.RND.pick(this.availableColors);
      const ball = this.add.circle(-100, -100, 20, color);
      ball.setVisible(false);
      return ball;
    });
  }

  checkMatches(insertIndex: number): void {
    if (insertIndex < 0 || insertIndex >= this.elementals.length) return;

    const targetColor = this.elementals[insertIndex].fillColor;
    let startIndex = insertIndex;
    let endIndex = insertIndex;

    while (startIndex > 0 && this.elementals[startIndex - 1].fillColor === targetColor) {
      startIndex--;
    }

    while (endIndex < this.elementals.length - 1 && this.elementals[endIndex + 1].fillColor === targetColor) {
      endIndex++;
    }

    const matchCount = endIndex - startIndex + 1;

    if (matchCount >= 3) {
      const removedElements = this.elementals.splice(startIndex, matchCount);
      removedElements.forEach(el => el.destroy());

      if (this.villain.state === 'ADVANCING') {
        this.villain.progress -= 0.06; 
      } else {
        // Na fuga, o recuo significa puxar ele de volta em direção ao player (1.0)
        this.villain.progress += 0.08; 
      }
      
      this.events.emit('update-count', this.elementals.length);

      if (this.elementals.length === 0) {
        this.triggerWin();
      }
    }
  }

  private triggerWin(): void {
    this.isGameOver = true;
    const nextLevelExists = this.currentLevelIndex + 1 < LEVELS.length;
    this.events.emit('game-win', {
      hasNextLevel: nextLevelExists,
      nextLevelIndex: this.currentLevelIndex + 1,
      mode: this.currentMode
    });
  }

  private triggerGameOver(reason: string): void {
    this.isGameOver = true;
    this.events.emit('game-over', reason);
  }

  update(time: number, delta: number): void {
    if (!this.isPlaying || this.isGameOver) return;
    const deltaSeconds = delta / 1000;

    if (this.villain.state === 'ADVANCING') {
      this.villain.progress += this.villain.speed * deltaSeconds;
      
      if (this.villain.progress <= 0) {
        this.triggerWin();
        return;
      }

      if (this.villain.progress >= 1) {
        if (this.currentMode === 'normal') {
          this.triggerGameOver('O Vilão alcançou o cofre!');
          return;
        } else {
          this.villain.startFleeing();
          this.villain.progress = 0.75; 
          
          // Esvazia a cobra antiga. A nova será criada imediatamente pelo loop de fuga abaixo.
          this.elementals.forEach(el => el.destroy());
          this.elementals = [];

          this.cameras.main.flash(500, 255, 0, 0); 
        }
      }
    } else if (this.villain.state === 'FLEEING') {
      this.villain.progress -= (this.villain.speed * 0.8) * deltaSeconds;
      
      if (this.villain.progress <= 0) {
        this.triggerGameOver('O Vilão fugiu com o elemental roubado!');
        return;
      }

      // --- A MÁGICA DA GERAÇÃO CONTÍNUA ---
      // Se tiver espaço entre a cobra e o player (1.0), gera uma nova bolinha.
      while (this.villain.progress + (this.elementals.length * this.chainSpacing) < 1.0) {
        const color = Phaser.Math.RND.pick(this.availableColors);
        const newBall = this.add.circle(-100, -100, 20, color);
        this.elementals.push(newBall);
        this.events.emit('update-count', this.elementals.length);
      }

      // Se o Geno foi puxado para trás pelos combos, as bolinhas entram de volta no cofre (são removidas).
      while (this.elementals.length > 0 && this.villain.progress + (this.elementals.length * this.chainSpacing) > 1.0) {
        const el = this.elementals.pop();
        el?.destroy();
        this.events.emit('update-count', this.elementals.length);
      }

      // Se conseguirmos puxar o Geno de volta até o cofre, nós vencemos!
      if (this.villain.progress >= 1.0) {
        this.triggerWin();
        return;
      }
    }

    const genoPos = this.path.getPoint(Math.max(0, Math.min(1, this.villain.progress)));
    this.villain.container.setPosition(genoPos.x, genoPos.y);

    this.elementals.forEach((ball, index) => {
      let ballProgress = 0;
      
      if (this.villain.state === 'ADVANCING') {
        ballProgress = this.villain.progress - ((index + 1) * this.chainSpacing);
      } else {
        ballProgress = this.villain.progress + ((index + 1) * this.chainSpacing);
      }

      if (ballProgress >= 0 && ballProgress <= 1) {
        ball.setVisible(true);
        const pos = this.path.getPoint(ballProgress);
        ball.setPosition(pos.x, pos.y);
      } else {
        ball.setVisible(false);
      }
    });

    for (let i = 0; i < this.cannon.projectiles.length; i++) {
      const p = this.cannon.projectiles[i];
      if (!p.active) continue;

      p.x += (p as any).vx * deltaSeconds;
      p.y += (p as any).vy * deltaSeconds;

      let hit = false;
      for (let j = 0; j < this.elementals.length; j++) {
        const el = this.elementals[j];
        if (!el.visible) continue;

        const distance = Phaser.Math.Distance.Between(p.x, p.y, el.x, el.y);
        
        if (distance < 40) {
          const newBall = this.add.circle(-100, -100, 20, p.fillColor);
          this.elementals.splice(j, 0, newBall);
          
          p.setActive(false);
          p.setVisible(false);
          
          this.events.emit('update-count', this.elementals.length);
          this.checkMatches(j);
          
          hit = true;
          break; 
        }
      }

      if (hit) continue;

      if (p.x < 0 || p.x > 540 || p.y < 0 || p.y > 960) {
        p.setActive(false);
        p.setVisible(false);
      }
    }
  }
}
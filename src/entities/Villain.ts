/**
 * @fileoverview Villain controller handling states (Advancing/Fleeing) and rendering.
 */

import Phaser from 'phaser';

export type VillainState = 'ADVANCING' | 'FLEEING';

export class Villain {
  public container: Phaser.GameObjects.Container;
  public text: Phaser.GameObjects.Text;
  
  public progress: number = 0;
  public speed: number = 0.025;
  public state: VillainState = 'ADVANCING';

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0);
    const circle = scene.add.circle(0, 0, 30, 0xa0522d);
    this.text = scene.add.text(0, 0, 'Vilão', { fontSize: '14px', color: '#fff' }).setOrigin(0.5);
    
    this.container.add([circle, this.text]);
    this.container.setDepth(10);
  }

  startFleeing(): void {
    this.state = 'FLEEING';
    this.text.setText('FUGINDO!');
  }

  reset(speed: number): void {
    this.progress = 0.05;
    this.speed = speed;
    this.state = 'ADVANCING';
    this.text.setText('Vilão');
  }
}
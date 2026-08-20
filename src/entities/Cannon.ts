/**
 * @fileoverview Player cannon controller with Object Pooling for optimized shooting.
 */

import Phaser from 'phaser';

export class Cannon {
  public container: Phaser.GameObjects.Container;
  private loadedElemental: Phaser.GameObjects.Arc;
  private scene: Phaser.Scene;
  private availableColors: number[];
  
  // Object Pool
  public projectiles: Phaser.GameObjects.Arc[] = [];
  private poolSize: number = 15;
  public projectileSpeed: number = 1200;

  constructor(scene: Phaser.Scene, x: number, y: number, colors: number[]) {
    this.scene = scene;
    this.availableColors = colors;

    this.container = scene.add.container(x, y);
    const playerCircle = scene.add.circle(0, 0, 45, 0x8b0000);
    const playerText = scene.add.text(0, 0, 'Player', { fontSize: '16px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    
    const firstShotColor = Phaser.Math.RND.pick(this.availableColors);
    this.loadedElemental = scene.add.circle(0, -45, 20, firstShotColor);
    
    this.container.add([playerCircle, playerText, this.loadedElemental]);

    // Pré-aloca os projéteis na memória (Object Pooling)
    for (let i = 0; i < this.poolSize; i++) {
      const proj = scene.add.circle(0, 0, 20, 0xffffff);
      proj.setVisible(false);
      proj.setActive(false);
      this.projectiles.push(proj);
    }
  }

  aim(targetX: number, targetY: number): void {
    const angle = Phaser.Math.Angle.Between(this.container.x, this.container.y, targetX, targetY);
    this.container.rotation = angle + Math.PI / 2;
  }

  shoot(targetX: number, targetY: number): void {
    // Busca o primeiro projétil desativado na piscina
    const proj = this.projectiles.find(p => !p.active);
    if (!proj) return; // Se todos estiverem na tela, ignora o clique

    // Configura e ativa o projétil
    const color = this.loadedElemental.fillColor;
    proj.setFillStyle(color);
    proj.setPosition(this.container.x, this.container.y);
    proj.setVisible(true);
    proj.setActive(true);

    // Calcula a velocidade
    const angle = Phaser.Math.Angle.Between(this.container.x, this.container.y, targetX, targetY);
    (proj as any).vx = Math.cos(angle) * this.projectileSpeed;
    (proj as any).vy = Math.sin(angle) * this.projectileSpeed;

    // Recarrega a arma
    this.loadedElemental.setFillStyle(Phaser.Math.RND.pick(this.availableColors));
  }
}
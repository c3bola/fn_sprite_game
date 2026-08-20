/**
 * @fileoverview Mathematical curve definition supporting dynamic level layouts.
 */

import Phaser from 'phaser';

export class CurvePath {
  public curve: Phaser.Curves.Spline;

  constructor(points: number[]) {
    this.curve = new Phaser.Curves.Spline(points);
  }

  draw(scene: Phaser.Scene): void {
    const graphics = scene.add.graphics();
    graphics.lineStyle(40, 0xcccccc, 1);
    this.curve.draw(graphics, 64);
  }

  getPoint(u: number): Phaser.Math.Vector2 {
    return this.curve.getPointAt(u);
  }
}
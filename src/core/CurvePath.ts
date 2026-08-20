/**
 * @fileoverview Mathematical curve definition for the elemental chain's path.
 */

import Phaser from 'phaser';

/**
 * Represents the zigzag path navigated by the villain and the elemental chain.
 * Uses a Spline curve to ensure smooth interpolation between coordinates.
 */
export class CurvePath {
  public curve: Phaser.Curves.Spline;

  constructor() {
    // 2D coordinates representing the level layout
    const points = [
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
    ];
    
    this.curve = new Phaser.Curves.Spline(points);
  }

  /**
   * Draws the curve on the screen for debugging and greyboxing.
   * @param scene - The Phaser Scene where the graphic should be drawn.
   */
  draw(scene: Phaser.Scene): void {
    const graphics = scene.add.graphics();
    graphics.lineStyle(40, 0xcccccc, 1); 
    this.curve.draw(graphics, 64);
  }

  /**
   * Gets a point on the curve based on a normalized distance.
   * @param u - The distance along the curve (0.0 to 1.0).
   * @returns A Vector2 containing the X and Y coordinates.
   */
  getPoint(u: number): Phaser.Math.Vector2 {
    // getPointAt ensures constant uniform velocity across straight lines and curves
    return this.curve.getPointAt(u); 
  }
}
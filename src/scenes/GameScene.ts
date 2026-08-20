/**
 * @fileoverview Core gameplay scene containing the Zuma-like mechanical loop.
 * Handles the path navigation, chain rendering, shooting, and match-3 logic.
 */

import Phaser from 'phaser';
import { CurvePath } from '../core/CurvePath';

export class GameScene extends Phaser.Scene {
  private path!: CurvePath;
  private genoContainer!: Phaser.GameObjects.Container;
  
  private genoProgress: number = 0; 
  private genoSpeed: number = 0.03; 
  
  private elementals: Phaser.GameObjects.Arc[] = [];
  private chainSpacing: number = 0.018; 

  private playerContainer!: Phaser.GameObjects.Container;
  private loadedElemental!: Phaser.GameObjects.Arc;
  private aimLine!: Phaser.GameObjects.Graphics;
  
  private playerX = 270;
  private playerY = 750;
  
  // Greybox color palette representing elemental types
  private availableColors = [
    0x00a8ff, // Water
    0x4cd137, // Earth
    0xe84118, // Fire
    0xfbc531, // Lightning
    0x9c88ff  // Special
  ];

  private projectiles: Phaser.GameObjects.Arc[] = [];
  private projectileSpeed = 1200; 

  constructor() {
    super('GameScene');
  }

  /**
   * Initializes the game objects, path, player, villain, and input events.
   */
  create(): void {
    this.cameras.main.setBackgroundColor('#2d4c2d');

    // 1. Initialize Path
    this.path = new CurvePath();
    this.path.draw(this);

    // 2. Initialize Elemental Chain
    this.elementals = Array.from({ length: 50 }).map(() => {
      const randomColor = Phaser.Math.RND.pick(this.availableColors);
      const ball = this.add.circle(-100, -100, 20, randomColor);
      ball.setVisible(false);
      return ball;
    });

    // 3. Initialize Villain (Geno)
    this.genoContainer = this.add.container(0, 0);
    const genoCircle = this.add.circle(0, 0, 30, 0xa0522d);
    const genoText = this.add.text(0, 0, 'Vilão', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
    this.genoContainer.add([genoCircle, genoText]);
    this.genoContainer.setDepth(10); 

    // 4. Initialize Player Cannon (Jonesy)
    this.playerContainer = this.add.container(this.playerX, this.playerY);
    const playerCircle = this.add.circle(0, 0, 45, 0x8b0000);
    const playerText = this.add.text(0, 0, 'Player', { fontSize: '16px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    
    const firstShotColor = Phaser.Math.RND.pick(this.availableColors);
    this.loadedElemental = this.add.circle(0, -45, 20, firstShotColor); 

    this.playerContainer.add([playerCircle, playerText, this.loadedElemental]);

    // 5. Input Listeners
    this.aimLine = this.add.graphics();
    
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const angle = Phaser.Math.Angle.Between(this.playerX, this.playerY, pointer.x, pointer.y);
      this.playerContainer.rotation = angle + Math.PI / 2;
      this.aimLine.clear();
      this.aimLine.lineStyle(2, 0xffffff, 0.5);
      this.aimLine.lineBetween(this.playerX, this.playerY, pointer.x, pointer.y);
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.shootElemental(pointer.x, pointer.y);
    });
  }

  /**
   * Fires the currently loaded elemental towards the specified target coordinates.
   * @param targetX - X coordinate of the pointer tap/click.
   * @param targetY - Y coordinate of the pointer tap/click.
   */
  shootElemental(targetX: number, targetY: number): void {
    const color = this.loadedElemental.fillColor;
    const projectile = this.add.circle(this.playerX, this.playerY, 20, color);
    
    const angle = Phaser.Math.Angle.Between(this.playerX, this.playerY, targetX, targetY);
    const velocityX = Math.cos(angle) * this.projectileSpeed;
    const velocityY = Math.sin(angle) * this.projectileSpeed;
    
    // Inject custom velocity properties
    (projectile as any).vx = velocityX;
    (projectile as any).vy = velocityY;
    this.projectiles.push(projectile);

    // Reload weapon
    const nextColor = Phaser.Math.RND.pick(this.availableColors);
    this.loadedElemental.setFillStyle(nextColor);
  }

  /**
   * Evaluates the chain for a match-3 condition after an insertion.
   * Removes matching elements and pushes the villain backward if successful.
   * @param insertIndex - The array index where the new elemental was inserted.
   */
  checkMatches(insertIndex: number): void {
    if (insertIndex < 0 || insertIndex >= this.elementals.length) return;

    const targetColor = this.elementals[insertIndex].fillColor;
    let startIndex = insertIndex;
    let endIndex = insertIndex;

    // Scan backwards
    while (startIndex > 0 && this.elementals[startIndex - 1].fillColor === targetColor) {
      startIndex--;
    }

    // Scan forwards
    while (endIndex < this.elementals.length - 1 && this.elementals[endIndex + 1].fillColor === targetColor) {
      endIndex++;
    }

    const matchCount = endIndex - startIndex + 1;

    // Execute extraction if match-3 or greater
    if (matchCount >= 3) {
      const removedElements = this.elementals.splice(startIndex, matchCount);
      removedElements.forEach(el => el.destroy());

      // Push villain back (Hard Mode dynamic)
      this.genoProgress -= 0.05; 
      if (this.genoProgress < 0) this.genoProgress = 0;
    }
  }

  /**
   * Main game loop called every frame.
   * Handles villain movement, chain positioning, and projectile collisions.
   * @param time - Current time.
   * @param delta - Milliseconds since the last frame.
   */
  update(time: number, delta: number): void {
    const deltaSeconds = delta / 1000;

    // Update villain progress
    this.genoProgress += this.genoSpeed * deltaSeconds;
    if (this.genoProgress >= 1) {
      this.genoProgress = 1;
      // TODO: Implement Game Over condition here
    }

    const genoPos = this.path.getPoint(this.genoProgress);
    this.genoContainer.setPosition(genoPos.x, genoPos.y);

    // Update chain positions
    this.elementals.forEach((ball, index) => {
      const ballProgress = this.genoProgress - ((index + 1) * this.chainSpacing);
      if (ballProgress >= 0 && ballProgress <= 1) {
        ball.setVisible(true);
        const pos = this.path.getPoint(ballProgress);
        ball.setPosition(pos.x, pos.y);
      } else {
        ball.setVisible(false);
      }
    });

    // Update projectiles and evaluate collisions
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      
      p.x += (p as any).vx * deltaSeconds;
      p.y += (p as any).vy * deltaSeconds;

      let hit = false;

      // Check collision against the chain
      for (let j = 0; j < this.elementals.length; j++) {
        const el = this.elementals[j];
        if (!el.visible) continue;

        const distance = Phaser.Math.Distance.Between(p.x, p.y, el.x, el.y);
        
        // Collision threshold (sum of radii)
        if (distance < 40) {
          delete (p as any).vx;
          delete (p as any).vy;
          this.projectiles.splice(i, 1);
          
          // Insert into chain
          this.elementals.splice(j, 0, p);
          this.checkMatches(j);
          
          hit = true;
          break; 
        }
      }

      if (hit) continue;

      // Garbage collection for off-screen projectiles
      if (p.x < 0 || p.x > 540 || p.y < 0 || p.y > 960) {
        p.destroy();
        this.projectiles.splice(i, 1);
      }
    }
  }
}
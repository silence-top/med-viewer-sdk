// 坐标算法 (Image to Screen)
export class Coords {
  static imageToScreen(imageX: number, imageY: number, scale: number): { x: number; y: number } {
    return {
      x: imageX * scale,
      y: imageY * scale
    };
  }
}

export enum TileType {
  OBSTACLE = 0,
  PATH = 1,
  RUNNING = 2,
  REVERSI = 3,
  MINING = 4,
  QUEST = 5,
}

export class MapData {
  public static readonly GRID_SIZE = 7;
  
  public static readonly LAYOUT: TileType[][] = [
    [0, 0, 0, 2, 0, 0, 0],
    [0, 0, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [3, 1, 1, 1, 1, 1, 4],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 5, 0, 0, 0],
  ];

  public static isWalkable(x: number, y: number): boolean {
    if (x < 0 || x >= this.GRID_SIZE || y < 0 || y >= this.GRID_SIZE) {
      return false;
    }
    return this.LAYOUT[y][x] !== TileType.OBSTACLE;
  }

  public static getFacilityId(x: number, y: number): string | null {
    if (x < 0 || x >= this.GRID_SIZE || y < 0 || y >= this.GRID_SIZE) {
      return null;
    }
    const tile = this.LAYOUT[y][x];
    switch (tile) {
      case TileType.RUNNING: return 'running';
      case TileType.REVERSI: return 'reversi';
      case TileType.MINING: return 'mining';
      case TileType.QUEST: return 'quest';
      default: return null;
    }
  }
}

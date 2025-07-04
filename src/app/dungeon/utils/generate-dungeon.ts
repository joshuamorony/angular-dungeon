export function generateDungeonLayout(w: number, h: number): string[][] {
  // initialize all walls
  const grid = Array.from({ length: h }, () => Array(w).fill('1'));

  // pick entrance on west wall, carve it open
  const entranceY = Math.floor(h / 2);
  grid[entranceY][0] = '0';

  // carve winding corridors by a simple randomized DFS on a coarse 2-cell grid
  const visited = new Set<string>();
  function carve(cx: number, cy: number) {
    // make sure this cell is open
    grid[cy][cx] = '0';
    visited.add(`${cx},${cy}`);

    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].sort(() => Math.random() - 0.5);
    for (let [dx, dy] of dirs) {
      const nx = cx + dx * 2,
        ny = cy + dy * 2;
      if (ny > 0 && ny < h - 1 && nx > 0 && nx < w - 1 && !visited.has(`${nx},${ny}`)) {
        // knock down wall between
        grid[cy + dy][cx + dx] = '0';
        grid[ny][nx] = '0';
        carve(nx, ny);
      }
    }
  }
  // start DFS just inside the entrance
  carve(1, entranceY);

  // carve a few random rooms
  for (let i = 0; i < 5; i++) {
    const rw = 4 + Math.floor(Math.random() * 4);
    const rh = 4 + Math.floor(Math.random() * 4);
    const rx = 2 + Math.floor(Math.random() * (w - rw - 4));
    const ry = 2 + Math.floor(Math.random() * (h - rh - 4));
    // carve room
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        grid[y][x] = '0';
      }
    }
    // maybe add pillars
    if (Math.random() < 0.5) {
      const px = rx + 1 + Math.floor(Math.random() * (rw - 2));
      const py = ry + 1 + Math.floor(Math.random() * (rh - 2));
      grid[py][px] = '1';
    }
  }

  return grid;
}

export function getDeadEnds(grid: string[][]): boolean[][] {
  const height = grid.length;
  const width = grid[0].length;
  // boolean map of dead-end cells, indexed by [x][y]
  const deadEnds: boolean[][] = Array.from({ length: width }, () => Array(height).fill(false));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] === '0') {
        const neighbors = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]
          .map(([dx, dy]) => grid[y + dy]?.[x + dx] === '0')
          .filter(Boolean).length;
        if (neighbors === 1) deadEnds[x][y] = true;
      }
    }
  }
  return deadEnds;
}

/**
 * Build a grid of BFS distances from (startX,startY) to every open cell (grid[y][x]==='0').
 * Unreachable cells remain Infinity.*/

export function computeDistanceMap(grid: string[][], startX: number, startY: number): number[][] {
  const H = grid.length;
  const W = grid[0].length;
  const dist = Array.from({ length: H }, () => Array<number>(W).fill(Infinity));
  const q: [number, number][] = [[startY, startX]];
  dist[startY][startX] = 0;
  const dirs: [number, number][] = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  while (q.length) {
    const [y, x] = q.shift()!;
    const d0 = dist[y][x] + 1;
    for (const [dx, dy] of dirs) {
      const nx = x + dx,
        ny = y + dy;
      if (ny >= 0 && ny < H && nx >= 0 && nx < W && grid[ny][nx] === '0' && dist[ny][nx] === Infinity) {
        dist[ny][nx] = d0;
        q.push([ny, nx]);
      }
    }
  }
  return dist;
}

import { Random } from 'mockjs';


export enum PieceType {
  /**
   * 玩家
   */
  Player = 0,
  /**
   * 出口
   */
  Exit = 1,

  /**
   * 弹板
   * @desc 将玩家改变方向
   */
  Bound = 2, // 0撇 1捺
  /**
   * 半弹板
   * @desc 弹板面将物体改变方向，非弹面阻止物体前进
   * // 0左上弹 1右上弹 2右下弹 3左下弹
   */
  HalfBound = 3,
  /**
   * 车轮
   * @desc 站立状态被撞击，会根据撞击方向变为垂直或水平的可滚动状态
   * @state 0站立 1垂直 2水平
   */
  Cylinder = 4,
  /**
   * 洞
   * @desc 金币滑向洞会掉进去，其他物体滑向洞则停在洞旁边
   * @state 0有盖 1空 2填充
   */
  Hole = 5,
  /**
   * 金币
   * @desc 被玩家击飞，玩家留在金币原来的位置，金币可滑落入洞
   * @state 0正常 1进洞
   */
  Coin = 6,
  /**
   * 箱子
   * @desc 被玩家击飞，玩家留在盒子原来的位置
   */
  Box = 7,
  /**
   * 石头
   * @desc 无法移动
   */
  Stone = 8,
  /**
   * 隧道
   * @desc 成对出现，将玩家从出口传出，方向不变
   * @state 相同state的隧道相连
   */
  Tunnel = 9,
}

export type Piece = {
  x: number;
  y: number;
  type: PieceType;
  status: number;
};

export type Game = {
  cols: number;
  rows: number;
  pieces: Piece[];
};

export type DiffGame = {
  from: Game;
  to: Game;
  direction: Direction,
  pieceDiffs: (Piece & { index: number })[];
};

export type Step = Game & {
  dirs: number[];
};

export type Direction = {
  x: number;
  y: number;
};

export const directions: Direction[] = [
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: -1, y: 0 },
]; // 下上右左

export function lintGame(game: Game) {
  console.assert(game.cols >= 5 && game.cols <= 10, '列数需要在5-10之间');
  console.assert(game.rows >= 5 && game.rows <= 10, '行数需要在5-10之间');
  console.assert(game.pieces[0]?.type === PieceType.Player, '第一个棋子必须是玩家');
  console.assert(game.pieces[1]?.type === PieceType.Exit, '第二个棋子必须是出口');
  const playerCount = game.pieces.filter((item) => item.type === PieceType.Player).length;
  console.assert(playerCount === 1, '游戏必须有一个玩家');
  const targetCount = game.pieces.filter((item) => item.type === PieceType.Exit).length;
  console.assert(targetCount === 1, '游戏必须有一个出口');
  const piecesPosSet = new Set<string>();
  for (const piece of game.pieces) {
    const posStr = '' + piece.x + piece.y;
    if (piecesPosSet.has(posStr)) {
      console.assert(false, '游戏中的所有棋子位置不能重复');
    } else {
      piecesPosSet.add(posStr);
    }
  }
}

export function clonePieces(pieces: Piece[]) {
  return pieces.map((item) => ({ ...item }));
}

export function sloveGame(game: Game) {
  const steps: Step[] = [
    {
      ...game,
      dirs: [],
    },
  ];
  const piecesKeySet = new Set<string>(piecesToKey(game.pieces));
  while (steps.length > 0) {
    const step = steps.shift() as Step;
    const { solution, nextSteps } = sloveNextSteps(step);
    if (solution) {
      return solution;
    }
    steps.push(
      ...nextSteps.filter((item) => {
        const key = piecesToKey(item.pieces);
        if (piecesKeySet.has(key)) {
          return false;
        } else {
          piecesKeySet.add(key);
          return true;
        }
      })
    );
  }
  return undefined;
}

export function piecesToKey(pieces: Piece[]) {
  return pieces.map((item) => '' + item.x + item.y + item.type + item.status).join('');
}

export function sloveNextSteps(step: Step) {
  const nextSteps: Step[] = [];

  for (let dirIndex = 0; dirIndex < 4; dirIndex++) {
    const direction = directions[dirIndex];
    const { isWin, isDiff, nextPieces } = dirMove(step, direction);
    if (!isDiff) {
      continue;
    }
    const dirs = [...step.dirs, dirIndex];
    if (isWin) {
      return { solution: dirs, nextSteps: [] };
    }
    nextSteps.push({
      ...step,
      pieces: nextPieces,
      dirs: dirs,
    });
  }

  return { solution: undefined, nextSteps };
}

export function dirMove(game: Game, direction: Direction) {
  let isDiff = false;
  let isWin = false;
  let movingPieceIndex = 0;
  const nextPieces = clonePieces(game.pieces);

  let i = 0;
  const pieceDiffs: (Piece & { index: number })[] = [];
  while (i < 100) {
    i++;
    const movingPiece = nextPieces[movingPieceIndex] as Piece;
    const x = movingPiece.x + direction.x;
    const y = movingPiece.y + direction.y;

    if (x < 0 || x >= game.cols || y < 0 || y >= game.rows) {
      break;
    }
    const posPieceIndex = nextPieces.findIndex((item) => item.x === x && item.y === y);
    if (posPieceIndex === -1) {
      movingPiece.x = x;
      movingPiece.y = y;
      pieceDiffs.push({ ...movingPiece, index: movingPieceIndex });
      isDiff = true;

      continue;
    }
    const piece = nextPieces[posPieceIndex];

    if (piece.type !== PieceType.Hole && movingPiece.type !== PieceType.Player) {
      break;
    } else if (piece.type === PieceType.Hole) {
      if (piece.status === 0) {
        movingPiece.x = x;
        movingPiece.y = y;
        piece.status = 1;
        pieceDiffs.push({ ...piece, index: posPieceIndex });
        pieceDiffs.push({ ...movingPiece, index: movingPieceIndex });
        isDiff = true;

        continue;
      } else if (piece.status === 1 && movingPiece.type === PieceType.Coin) {
        movingPiece.x = x;
        movingPiece.y = y;
        movingPiece.status = 1;
        piece.x = -1;
        piece.y = -1;
        piece.status = 2;
        pieceDiffs.push({ ...piece, index: posPieceIndex });
        pieceDiffs.push({ ...movingPiece, index: movingPieceIndex });
        isDiff = true;
      }
      break;
    } else {
      // 此条件下movingPiece.type === PieceType.Player
      if (piece.type === PieceType.Stone || (piece.type === PieceType.Coin && piece.status === 1)) {
        break;
      } else if (piece.type === PieceType.Exit) {
        movingPiece.x = x;
        movingPiece.y = y;
        pieceDiffs.push({ ...movingPiece, index: movingPieceIndex });
        isDiff = true;
        isWin = true;
        break;
      } else if (piece.type === PieceType.Box || piece.type === PieceType.Coin) {
        const nextX = x + direction.x;
        const nextY = y + direction.y;
        if (
          nextX < 0 ||
          nextX >= game.cols ||
          nextY < 0 ||
          nextY >= game.rows ||
          nextPieces.some((p) => p.x === nextX && p.y === nextY)
        ) {
          break;
        }

        movingPiece.x = x;
        movingPiece.y = y;
        pieceDiffs.push({ ...movingPiece, index: movingPieceIndex });
        isDiff = true;
        movingPieceIndex = posPieceIndex;

        continue;
      } else if (piece.type === PieceType.Tunnel) {
        const tunnelExitPieceIndex = nextPieces.findIndex(
          (p, i) =>
            p.type === PieceType.Tunnel && p.status === movingPiece.status && i !== posPieceIndex
        );

        const tunnelExitPiece = nextPieces[tunnelExitPieceIndex];

        const nextX = tunnelExitPiece.x + direction.x;
        const nextY = tunnelExitPiece.y + direction.y;

        if (nextPieces[1].x === nextX && nextPieces[1].y === nextY) {
          movingPiece.x = nextX;
          movingPiece.y = nextY;
          pieceDiffs.push({ ...movingPiece, index: movingPieceIndex });
          isDiff = true;
          isWin = true;
          break;
        } else if (
          nextX >= 0 &&
          nextX < 10 &&
          nextY >= 0 &&
          nextY < 10 &&
          !nextPieces.some((p) => p.x === nextX && p.y === nextY)
        ) {
          movingPiece.x = nextX;
          movingPiece.y = nextY;
          pieceDiffs.push({ ...movingPiece, index: movingPieceIndex });
          isDiff = true;
          continue;
        } else {
          break;
        }
      } else if (piece.type === PieceType.Bound) {
        let newDirection = { ...direction };
        if (piece.status === 0) {
          // /
          if (direction.x === 0 && direction.y === 1) {
            newDirection = { x: -1, y: 0 };
          } else if (direction.x === 0 && direction.y === -1) {
            newDirection = { x: 1, y: 0 };
          } else if (direction.x === 1 && direction.y === 0) {
            newDirection = { x: 0, y: -1 };
          } else if (direction.x === -1 && direction.y === 0) {
            newDirection = { x: 0, y: 1 };
          }
        } else {
          // \
          if (direction.x === 0 && direction.y === 1) {
            newDirection = { x: 1, y: 0 };
          } else if (direction.x === 0 && direction.y === -1) {
            newDirection = { x: -1, y: 0 };
          } else if (direction.x === 1 && direction.y === 0) {
            newDirection = { x: 0, y: 1 };
          } else if (direction.x === -1 && direction.y === 0) {
            newDirection = { x: 0, y: -1 };
          }
        }

        if (direction.x !== newDirection.x || direction.y !== newDirection.y) {
          piece.status = piece.status === 0 ? 1 : 0;
          pieceDiffs.push({ ...piece, index: posPieceIndex });
        }

        const nextX = piece.x + newDirection.x;
        const nextY = piece.y + newDirection.y;
        direction = newDirection;

        if (nextPieces[1].x === nextX && nextPieces[1].y === nextY) {
          movingPiece.x = nextX;
          movingPiece.y = nextX;
          // piece.status = piece.status === 1 ? 0 : 1;
          pieceDiffs.push({ ...movingPiece, index: movingPieceIndex });
          isDiff = true;
          isWin = true;
          break;
        } else if (
          nextX >= 0 &&
          nextX < game.cols &&
          nextY >= 0 &&
          nextY < game.rows &&
          !nextPieces.some((p) => p.x === nextX && p.y === nextY)
        ) {
          movingPiece.x = nextX;
          movingPiece.y = nextY;
          pieceDiffs.push({ ...movingPiece, index: movingPieceIndex });
          // piece.status = piece.status === 1 ? 0 : 1;
          isDiff = true;

          continue;
        } else {
          break;
        }
      } else if (piece.type === PieceType.HalfBound) {
        let newDirection = { ...direction };
        if (piece.status === 0) {
          if (direction.x === 0 && direction.y === 1) {
            newDirection = { x: -1, y: 0 };
          } else if (direction.x === 1 && direction.y === 0) {
            newDirection = { x: 0, y: -1 };
          }
        } else if (piece.status === 1) {
          if (direction.x === 0 && direction.y === 1) {
            newDirection = { x: 1, y: 0 };
          } else if (direction.x === -1 && direction.y === 0) {
            newDirection = { x: 0, y: -1 };
          }
        } else if (piece.status === 2) {
          if (direction.x === 0 && direction.y === -1) {
            newDirection = { x: 1, y: 0 };
          } else if (direction.x === -1 && direction.y === 0) {
            newDirection = { x: 0, y: 1 };
          }
        } else if (piece.status === 3) {
          if (direction.x === 0 && direction.y === -1) {
            newDirection = { x: -1, y: 0 };
          } else if (direction.x === 1 && direction.y === 0) {
            newDirection = { x: 0, y: 1 };
          }
        }
        if (newDirection.x === direction.x && newDirection.y === direction.y) {
          break;
        }
        piece.status = (piece.status + 1) % 4;
        pieceDiffs.push({ ...piece, index: posPieceIndex });
        const nextX = piece.x + newDirection.x;
        const nextY = piece.y + newDirection.y;
        direction = newDirection;
        if (nextPieces[1].x === nextX && nextPieces[1].y === nextY) {
          movingPiece.x = nextX;
          movingPiece.y = nextX;
          pieceDiffs.push({ ...movingPiece, index: movingPieceIndex });
          isDiff = true;
          isWin = true;

          break;
        } else if (
          nextX >= 0 &&
          nextX < game.cols &&
          nextY >= 0 &&
          nextY < game.rows &&
          !nextPieces.some((p) => p.x === nextX && p.y === nextY)
        ) {
          movingPiece.x = nextX;
          movingPiece.y = nextY;
          pieceDiffs.push({ ...movingPiece, index: movingPieceIndex });
          isDiff = true;
          continue;
        } else {
          break;
        }
      } else if (piece.type === PieceType.Cylinder) {
        if (piece.status === 0) {
          if (direction.x === 0) {
            piece.status = 1;
          } else {
            piece.status = 2;
          }
          pieceDiffs.push({ ...piece, index: posPieceIndex });
          isDiff = true;
          break;
        } else if (
          (piece.status === 1 && direction.y === 0) ||
          (piece.status === 2 && direction.x === 0)
        ) {
          const nextX = x + direction.x;
          const nextY = y + direction.y;
          if (
            nextX < 0 ||
            nextX >= game.cols ||
            nextY < 0 ||
            nextY >= game.rows ||
            nextPieces.some((p) => p.x === nextX && p.y === nextY)
          ) {
            break;
          }
          movingPiece.x = x;
          movingPiece.y = y;
          pieceDiffs.push({ ...movingPiece, index: movingPieceIndex });
          isDiff = true;
          movingPieceIndex = posPieceIndex;
          continue;
        }
        break;
      }
    }
    break;
  }
  return { isWin, isDiff, nextPieces, pieceDiffs };
}

export function randomGame() {
  const game: Game = {
    cols: Random.integer(5, 9),
    rows: Random.integer(5, 9),
    pieces: [],
  };
  const piecesLen = Random.integer(4, 12);
  const posList = new Set<number>();
  for (let i = 0; i < piecesLen; i++) {
    const x = Random.integer(0, game.cols - 1);
    const y = Random.integer(0, game.rows - 1);
    const key = y * game.rows + x;
    if (posList.has(key)) {
      i--;
      continue;
    } else {
      posList.add(key);
      if (i === 0) {
        game.pieces.push({ x, y, type: 0, status: 0 });
      } else if (i === 1) {
        game.pieces.push({ x, y, type: 1, status: 0 });
      } else {
        game.pieces.push({
          x,
          y,
          type: Random.pick([
            2, 3,
            4, 5, 6, 7,
            8,
          ]),
          status: 0,
        });
      }
    }
  }
  return game;
}

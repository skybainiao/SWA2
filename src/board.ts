// src/board.ts

export  enum Tile {
    A = "A",
    B = "B",
    C = "C",
    D = "D",
    E = "E",
    F = "F",
    // ... 添加更多的瓷砖类型
}

type Position = { row: number; col: number };

type BoardListener = (event: BoardEvent) => void;

export class Board<T> {
    public readonly rows: number;
    public readonly cols: number;
    private readonly grid: (T | null)[][]; // 使用 T 或 null 类型来允许空瓷砖
    private listeners: BoardListener[] = [];


    constructor(rows: number, cols: number, private generator: () => T) {
        this.rows = rows; // 初始化 rows
        this.cols = cols; // 初始化 cols
        this.grid = Array.from({ length: rows }, () =>
            Array.from({ length: cols }, () => generator()));
    }

    // 在Board类中

    public canMove(from: Position, to: Position): boolean {
        // 检查是否在同一行或同一列
        const isSameRow = from.row === to.row;
        const isSameCol = from.col === to.col;
        const isAdjacent = Math.abs(isSameRow ? from.col - to.col : from.row - to.row) === 1;

        return (isSameRow || isSameCol) && isAdjacent;
    }

    // 在Board类中

    public swapTiles(from: Position, to: Position): void {
        if (this.canMove(from, to)) {
            [this.grid[from.row][from.col], this.grid[to.row][to.col]] =
                [this.grid[to.row][to.col], this.grid[from.row][from.col]];
        }
    }

    // 在Board类中

// 这个方法是一个示例，你需要根据实际逻辑来实现匹配检测和瓷砖移除
    public findMatches(): Match[] {
        let matches: Match[] = [];
        // 检查水平匹配
        for (let row = 0; row < this.grid.length; row++) {
            for (let col = 0; col < this.grid[row].length - 2; col++) {
                if (
                    this.grid[row][col] === this.grid[row][col + 1] &&
                    this.grid[row][col] === this.grid[row][col + 2]
                ) {
                    // 找到匹配，添加到matches数组
                    matches.push(<Match><unknown>{
                        matched: this.grid[row][col],
                        positions: [
                            {row, col},
                            {row, col: col + 1},
                            {row, col: col + 2},
                        ],
                    });
                    // 可以跳过已经匹配的瓷砖
                    col += 2;
                }
            }
        }
        // 检查垂直匹配
        for (let col = 0; col < this.grid[0].length; col++) {
            for (let row = 0; row < this.grid.length - 2; row++) {
                if (
                    this.grid[row][col] === this.grid[row + 1][col] &&
                    this.grid[row][col] === this.grid[row + 2][col]
                ) {
                    // 找到匹配，添加到matches数组
                    matches.push(<Match><unknown>{
                        matched: this.grid[row][col],
                        positions: [
                            {row, col},
                            {row: row + 1, col},
                            {row: row + 2, col},
                        ],
                    });
                    // 可以跳过已经匹配的瓷砖
                    row += 2;
                }
            }
        }
        return matches;
    }

    // 移除匹配的瓷砖并让上方的瓷砖下落
    public removeMatches(matches: Match[]): void {
        // 标记需要移除的瓷砖
        for (let match of matches) {
            for (let pos of match.positions) {
                this.grid[pos.row][pos.col] = null; // 假设null表示空位
            }
        }

        // 让瓷砖下落填补空位
        for (let col = 0; col < this.grid[0].length; col++) {
            let emptyRow = this.grid.length; // 初始化emptyRow为grid的长度
            for (let row = this.grid.length - 1; row >= 0; row--) {
                if (this.grid[row][col] === null) {
                    // 如果当前是空位，则减少emptyRow计数
                    emptyRow--;
                } else if (emptyRow < this.grid.length) {
                    // 如果当前不是空位，并且emptyRow已经更新（即下方有空位）
                    this.grid[emptyRow][col] = this.grid[row][col]; // 将当前瓷砖下移
                    this.grid[row][col] = null; // 当前位置设置为null
                }
            }
        }

        // 生成新的瓷砖填补顶部空位
        this.refill(); // 移除匹配后立即填补空位
    }

// 填补空缺
    public refill(): void {
        for (let col = 0; col < this.grid[0].length; col++) {
            for (let row = 0; row < this.grid.length; row++) {
                if (this.grid[row][col] === null) {
                    this.grid[row][col] = this.generator(); // 使用generator函数生成新瓷砖
                }
            }
        }
    }


    // 辅助方法：找到指定列的第一个空行
    private findFirstEmptyRow(col: number): number {
        for (let row = this.grid.length - 1; row >= 0; row--) {
            if (this.grid[row][col] === null) {
                return row;
            }
        }
        return -1; // 如果没有空行，返回-1
    }


    // 添加事件监听器
    public addListener(listener: BoardListener): void {
        this.listeners.push(listener);
    }

    // 触发事件
    private triggerEvent(event: BoardEvent): void {
        this.listeners.forEach(listener => listener(event));
    }
}

// 定义Match类型和BoardEvent类型
type Match = {
    matched: Tile;
    positions: Position[];
};

type BoardEvent = {
    kind: 'Match' | 'Refill';
    match?: Match;
    board?: Board<Tile>;
};
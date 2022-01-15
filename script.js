class Canvas {
  constructor() {
    const el = document.createElement('canvas');
    document.querySelector('.game-wrapper').appendChild(el);
    this.width = el.width = el.getBoundingClientRect().width;
    this.height = el.height = el.getBoundingClientRect().height;
    this.ctx = el.getContext('2d');
  }
  renderSquare(posSize=[0,0,0,0], fill='black') {
    this.ctx.beginPath();
    this.ctx.rect(...posSize);
    this.ctx.fillStyle = fill;
    this.ctx.fill();
  }
}

class Game {
  BORDER_TOP = 0;
  BORDER_RIGHT = 1;
  BORDER_BOTTOM = 2;
  BORDER_LEFT = 3;

  constructor() {
    this.canvas = new Canvas();
    this.playerPos = [0, 0];
    this.goalPos = [0, 0];
    this.borders = new Map();

    this.init();
    
    ['keyup', 'change'].forEach(eventName => {
      document.querySelector('input[name="gridsize"]').addEventListener(eventName, () => {
        this.init();
      });
    });
    document.onkeydown = this.controls.bind(this);
  }

  init() {
    this.updateGridSize();

    this.generateLevel();
    this.render();
  }

  render() {
    this.canvas.renderSquare([0, 0, this.canvas.width, this.canvas.height]);
    let borderSize = this.canvas.width / this.gridSize / 20;
    let squareSize = (this.canvas.width - borderSize * this.gridSize) / this.gridSize;

    for (let row = 0; row < this.gridSize; row++) {
      for (let column = 0; column < this.gridSize; column++) {

        let fill = 'rgb(44,44,44)';
        if (row == this.playerPos[0] && column == this.playerPos[1]) {
          fill = 'blue';
        }
        else if (row == this.goalPos[0] && column == this.goalPos[1]) {
          fill = 'green';
        }

        this.canvas.renderSquare([
          ((row+1) * borderSize) + row * squareSize,
          ((column+1) * borderSize) + column * squareSize,
          squareSize - borderSize,
          squareSize - borderSize
        ], fill);

        switch (this.borders.get(column + ',' + row)) {
          case this.BORDER_TOP:
            this.canvas.renderSquare([
              borderSize / 2 + (column * borderSize) + column * squareSize,
              (row * borderSize) + row * squareSize - borderSize,
              squareSize,
              borderSize * 2
            ], 'red');
            break;
          case this.BORDER_RIGHT:
            this.canvas.renderSquare([
              (column * borderSize) + (column + 1) * squareSize,
              borderSize / 2 + (row * borderSize) + row * squareSize,
              borderSize * 2,
              squareSize
            ], 'red');
            break;
          case this.BORDER_BOTTOM:
            this.canvas.renderSquare([
              borderSize / 2 + (column * borderSize) + column * squareSize,
              (row * borderSize) + (row + 1) * squareSize,
              squareSize,
              borderSize*2
            ], 'red');
            break;
          case this.BORDER_LEFT:
            this.canvas.renderSquare([
              (column * borderSize) + column * squareSize - borderSize,
              borderSize / 2 + (row * borderSize) + row * squareSize,
              borderSize * 2,
              squareSize
            ], 'red');
            break;
        }
      }
    }
  }

  generateLevel() {
    // create new goal position
    for (var i = 0; i <= 1; i++) {
      let possibilities = [...Array(this.gridSize).keys()];
      possibilities.splice(this.playerPos[i], 1);
      this.goalPos[i] = possibilities[Math.floor(Math.random()*possibilities.length)];
    }

    // generate new borders
    for (let row = 0; row < this.gridSize; row++) {
      for (let column = 0; column < this.gridSize; column++) {
        this.borders.set(column + ',' + row, Math.floor(Math.random() * 4));
      }
    }

    if (!this.isLevelPossible) {
      this.generateLevel();
    }
  }

  updateGridSize() {
    let val = parseInt(document.querySelector('input[name="gridsize"]').value);
    this.gridSize = val < 3 ? 3 : val > 100 ? 100 : val;
  }

  get isLevelPossible() {
    return this.accessibleSquares(this.playerPos).has(this.goalPos.toString());
  }

  accessibleSquares(currentSquare=[0,0]) {
    let accessibleSquares = new Map([[currentSquare.toString(), currentSquare]]);
    accessibleSquares.forEach((value, key, map) => {
      ['left', 'right', 'up', 'down'].forEach((direction) => {
        let target = this.getSquareInDirection(value, direction);
        if (
          this.canMoveInDirection(value, direction, target) &&
          !map.has(target.toString())
        ) {
          map.set(target.toString(), target);
        }
      });
    });
    return accessibleSquares;
  }


  getSquareInDirection(origin, direction) {
    switch(direction) {
      case 'left':
        return [
          (origin[0] - 1 + this.gridSize) % this.gridSize,
          origin[1]
        ];
      case 'right':
        return [
          (origin[0] + 1 + this.gridSize) % this.gridSize,
          origin[1]
        ];
      case 'up':
        return [
          origin[0],
          (origin[1] - 1 + this.gridSize) % this.gridSize
        ];
      case 'down':
        return [
          origin[0],
          (origin[1] + 1 + this.gridSize) % this.gridSize
        ];
    }
  }

  canMoveInDirection(origin, direction, target=null) {
    target = target || this.getSquareInDirection(origin, direction);
    switch(direction) {
      case 'left':
        return this.getBorder(origin) !== this.BORDER_LEFT && this.getBorder(target) !== this.BORDER_RIGHT;
      case 'right':
        return this.getBorder(origin) !== this.BORDER_RIGHT && this.getBorder(target) !== this.BORDER_LEFT;
      case 'up':
        return this.getBorder(origin) !== this.BORDER_TOP && this.getBorder(target) !== this.BORDER_BOTTOM;
      case 'down':
        return this.getBorder(origin) !== this.BORDER_BOTTOM && this.getBorder(target) !== this.BORDER_TOP;
    }
  }

  getBorder(square) {
    return this.borders.get(square.toString());
  }

  controls(e) {
    const oldPos = [...this.playerPos];
    switch(e.code) {
      case 'KeyA':
      case 'ArrowLeft':
        if (this.canMoveInDirection(this.playerPos, 'left')) {
          this.playerPos = this.getSquareInDirection(this.playerPos, 'left');
        }
        break;
      case 'KeyW':
      case 'ArrowUp':
        if (this.canMoveInDirection(this.playerPos, 'up')) {
          this.playerPos = this.getSquareInDirection(this.playerPos, 'up');
        }
        break;
      case 'KeyD':
      case 'ArrowRight':
        if (this.canMoveInDirection(this.playerPos, 'right')) {
          this.playerPos = this.getSquareInDirection(this.playerPos, 'right');
        }
        break;
      case 'KeyS':
      case 'ArrowDown':
        if (this.canMoveInDirection(this.playerPos, 'down')) {
          this.playerPos = this.getSquareInDirection(this.playerPos, 'down');
        }
        break;
    }

    if (oldPos.toString() !== this.playerPos.toString()) {
      if (this.playerPos.toString() === this.goalPos.toString()) {
        this.generateLevel();
      }
      this.render();
    }
  }
}

game = new Game();


class Canvas {
  constructor() {
    const el = document.createElement('canvas');
    document.querySelector('.game-wrapper').appendChild(el);
    this.width = el.width = el.getBoundingClientRect().width;
    this.height = el.height = el.getBoundingClientRect().height;
    this.ctx = el.getContext('2d');
    this.el = el;
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

  DIRECTIONS = ['left', 'right', 'up', 'down'];

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
    document.onkeydown = this.keyControls.bind(this);

    ['touchstart', 'touchmove'].forEach(eventName => {
      document.addEventListener(eventName, this.touchControls.bind(this));
    });
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
    const goal = this.goalPos.toString();
    for (let square of this.accessibleSquares(this.playerPos)) {
      if (square === goal) {
        return true;
      }
    }
    return false;
  }

  * accessibleSquares(currentSquare=[0,0]) {
    let accessibleSquares = new Map([[currentSquare.toString(), currentSquare]]);
    yield currentSquare.toString();
    for (let [key, square] of accessibleSquares) {
      for (let direction of ['left', 'right', 'up', 'down']) {
        let target = this.getSquareInDirection(square, direction);
        if (
          this.canMoveInDirection(square, direction, target) &&
          !accessibleSquares.has(target.toString())
        ) {
          accessibleSquares.set(target.toString(), target);
          yield target.toString();
        }
      }
    }
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

  keyControls(e) {
    switch(e.code) {
      case 'KeyA':
      case 'ArrowLeft':
        this.tryMovingInDirection('left');
        e.preventDefault();
        break;
      case 'KeyW':
      case 'ArrowUp':
        this.tryMovingInDirection('up');
        e.preventDefault();
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.tryMovingInDirection('right');
        e.preventDefault();
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.tryMovingInDirection('down');
        e.preventDefault();
        break;
    }
  }

  touchControls(e) {
    let touch = e.touches[0];
    let square = this.getSquareByCoordinates(touch.pageX, touch.pageY);
    if (!square) return;
    e.preventDefault();
    this.tryMovingToSquare(square);
  }

  getSquareByCoordinates(absX, absY) {
    let rect = this.canvas.el.getBoundingClientRect();
    let x = absX - rect.x;
    let y = absY - rect.y;

    let width = this.canvas.el.width;
    let height = this.canvas.el.height;

    if (x < 0 || x > width) return null;
    if (y < 0 || y > height) return null;

    return [
      Math.floor(x / (width / this.gridSize)),
      Math.floor(y / (height / this.gridSize)),
    ];
  }

  tryMovingToSquare(targetSquare) {
    let direction = this.directionOfSquares(this.playerPos, targetSquare);
    if (!direction) return;
    this.tryMovingInDirection(direction);
  }

  tryMovingInDirection(direction) {
    const oldPos = [...this.playerPos];
    if (this.canMoveInDirection(this.playerPos, direction)) {
      this.playerPos = this.getSquareInDirection(this.playerPos, direction);
    }
    if (oldPos.toString() !== this.playerPos.toString()) {
      if (this.playerPos.toString() === this.goalPos.toString()) {
        this.generateLevel();
      }
      this.render();
    }
  }

  directionOfSquares(source, target) {
    for (let direction of this.DIRECTIONS) {
      let square = this.getSquareInDirection(source, direction);
      if (square.toString() === target.toString()) {
        return direction;
      }
    }
    return null;
  }

}

game = new Game();


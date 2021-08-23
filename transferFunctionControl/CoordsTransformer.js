class CoordsTransformer {
    constructor(startX, startY, width, height) {
        this._startX = startX;
        this._startY = startY;
        this._width = width;
        this._height = height;
    }

    relativeToAbsolute(point) {
        return {
            x: this._startX + this._width * point.x,
            y: this._startY + (this._height * (1 - point.y))
        };
    }

    absoluteToRelative(point) {
        return {
            x: (point.x - this._startX) / this._width,
            y: 1 - (point.y - this._startY) / this._height
        };
    }
}
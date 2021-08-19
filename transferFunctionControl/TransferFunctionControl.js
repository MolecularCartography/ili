class Drawing {
    constructor(parent, ns) {
        this._parent = parent;
        this._ns = ns;
    }

    drawRectangle(x, y, width, height, rectangle) {
        if (!rectangle) {
            rectangle = document.createElementNS(this._ns, 'rect');
            this._parent.appendChild(rectangle)
        }
        this._changeRectangle(rectangle, x, y, width, height);
        return rectangle;
    }

    _changeRectangle(rectangle, x, y, width, height) {
        rectangle.setAttributeNS(null, 'width', width.toString())
        rectangle.setAttributeNS(null, 'height', height.toString())
        rectangle.setAttributeNS(null, 'x', x.toString())
        rectangle.setAttributeNS(null, 'y', y.toString())
        return rectangle;
    }

    drawLine(x1, y1, x2, y2, line) {
        if (!line) {
            line = document.createElementNS(this._ns, 'line');
            this._parent.appendChild(line);
        }
        this._changeLine(line, x1, y1, x2, y2,);
        return line;
    }

    _changeLine(line, x1, y1, x2, y2,) {
        line.setAttributeNS(null, 'x1', x1.toString());
        line.setAttributeNS(null, 'y1', y1.toString());
        line.setAttributeNS(null, 'x2', x2.toString());
        line.setAttributeNS(null, 'y2', y2.toString());
        return line;
    }

    drawText(x, y, label, text) {
        if (!text) {
            text = document.createElementNS(this._ns, 'text');
            this._parent.appendChild(text);
        }
        this._changeText(text, x, y, label);
        return text;
    }

    _changeText(text, x, y, label) {
        text.setAttributeNS(null, 'x', x.toString());
        text.setAttributeNS(null, 'y', y.toString());
        text.textContent = label;
        return text;
    }

    drawCircle(cx, cy, r, circle) {
        if (!circle) {
            circle = document.createElementNS(this._ns, 'circle');
            this._parent.appendChild(circle);
        }
        this._changeCircle(circle, cx, cy, r);
        return circle;
    }

    _changeCircle(circle, cx, cy, r) {
        circle.setAttributeNS(null, 'cx', cx.toString());
        circle.setAttributeNS(null, 'cy', cy.toString());
        circle.setAttributeNS(null, 'r', r.toString());
        return circle;
    }

    drawPolyline(points, polyline) {
        if (!polyline) {
            polyline = document.createElementNS(this._ns, 'polyline');
            this._parent.appendChild(polyline);
        }
        this._changePolyline(polyline, points);
        return polyline;
    }

    _changePolyline(polyline, points) {
        polyline.setAttributeNS(null, 'points', points.toString());
        polyline.setAttributeNS(null, 'fill', 'none');
        return polyline;
    }
}

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

class TransferFunctionControl extends HTMLElement {
    constructor(div, minorTicksDensity, majorTicksDensity) {
        super();
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttributeNS(null, 'width', '100%')
        svg.setAttributeNS(null, 'height', '100%')
        svg.id = "svg";

        this._container = div.appendChild(svg);
        this._letterOffset = 15;
        this._defaultPoints = [{x: 0, y: 0}, {x: 1, y: 1}]
        this._updateEvent = new CustomEvent('update');
        this._container.addEventListener('mousemove', event => this._dragPoint(event));
        this._container.addEventListener('contextmenu', event => event.preventDefault());
        this._container.addEventListener('mouseup', () => this._selectedIndex = -1);
        this._minorTicksDensity = minorTicksDensity;
        this._majorTicksDensity = majorTicksDensity;
        this._drawing = new Drawing(svg, ns);
        this._selectedIndex = -1;
        this._pointRadius = 5;

        new ResizeObserver(entries => {
            const entry = entries[0].contentRect;
            if (entry.width > 3 * this._letterOffset && entry.height > 3 * this._letterOffset)
                this.draw();
        }).observe(div);
    }

    get points() {
        return this._points;
    }

    set points(value) {
        if (!Array.isArray(value))
            return;
        this._points = value.sort((a, b) => a.x - b.x);
        if (this._points[0].x !== 0)
            this._points.unshift({x: 0, y: 0});
        if (this._points[this._points.length - 1].x !== 1)
            this._points.push({x: 1, y: 1});
        if (this._coordsTransformer)
            this.draw();
    }

    draw() {
        this._canvasStartX = this._letterOffset * 2;
        this._canvasStartY = this._letterOffset;
        this._canvasWidth = this._container.clientWidth - 3 * this._letterOffset;
        this._canvasHeight = this._container.clientHeight - 3 * this._letterOffset;
        this._coordsTransformer = new CoordsTransformer(this._canvasStartX, this._canvasStartY, this._canvasWidth,
            this._canvasHeight);
        this._points = this._points || this._defaultPoints;
        this._drawBackground();
        this._container.querySelectorAll('circle').forEach(element => {
            element.parentNode.removeChild(element);
        });
        this._circles = new Array(this._points.length);
        for (let i = 0; i < this._points.length; i++)
            this._addControlPoint(i);
        const canvas = this._container.querySelector('svg rect');
        canvas.onmousedown = event => {
            if (event.which === 1)
                this._addPoint(event, this._container, this._points)
        };
    }

    _addControlPoint(index) {
        const absolutePoints = this._makeArrayAbsolute(this._points);
        this._polyline = this._drawing.drawPolyline(this._makeArrayAbsolute(this._points).map(a => a.x + ',' + a.y), this._polyline);
        this._polyline.classList.add('line');
        this._circles.splice(index, 0, this._drawing.drawCircle(absolutePoints[index].x,
            absolutePoints[index].y, this._pointRadius));
        const circle = this._circles[index];
        circle.classList.add('points');
        circle.addEventListener('mousedown', (event) => {
            if (event.which === 1)
                this._selectedIndex = this._circles.indexOf(circle);
        });
        circle.addEventListener('contextmenu', () => this._deletePoint(circle));
    }

    _addPoint(event, parent, points) {
        const mousePosition = this._getCursorPosition(event);
        const elem = this._coordsTransformer.absoluteToRelative(mousePosition);
        this._selectedIndex = this._insertIntoArray(points, elem);
        this._addControlPoint(this._selectedIndex);
        this.dispatchEvent(this._updateEvent);
    }

    _deletePoint(point) {
        const index = this._circles.indexOf(point);
        if (index === 0 || index === this.points.length - 1)
            return;
        this.points.splice(index, 1);
        this._drawing.drawPolyline(this._makeArrayAbsolute(this.points).map(a => a.x + ',' + a.y), this._polyline);
        point.parentNode.removeChild(point);
        this._circles.splice(index, 1);
        this.dispatchEvent(this._updateEvent);
    }

    _dragPoint(event) {
        if (this._selectedIndex < 0)
            return;
        let mousePos = this._getCursorPosition(event);
        const relativePoint = this._coordsTransformer.absoluteToRelative(mousePos);
        if (relativePoint.y > 1)
            relativePoint.y = 1;
        else if (relativePoint.y < 0)
            relativePoint.y = 0;
        if (this._selectedIndex === 0)
            relativePoint.x = 0;
        else if (this._selectedIndex === this._points.length - 1)
            relativePoint.x = 1;
        else if (relativePoint.x < this._points[this._selectedIndex - 1].x)
            relativePoint.x = this._points[this._selectedIndex - 1].x;
        else if (relativePoint.x > this._points[this._selectedIndex + 1].x)
            relativePoint.x = this._points[this._selectedIndex + 1].x;
        this._points[this._selectedIndex] = relativePoint;
        mousePos = this._coordsTransformer.relativeToAbsolute(relativePoint);
        this._drawing.drawPolyline(this._makeArrayAbsolute(this._points).map(a => a.x + ',' + a.y), this._polyline);
        this._circles[this._selectedIndex] = this._drawing.drawCircle(mousePos.x, mousePos.y,
            this._pointRadius, this._circles[this._selectedIndex]);
        this.dispatchEvent(this._updateEvent);
    }

    _getTicksCount(length, density) {

        let tmpCount = Math.trunc(length / density);
        let count = 1;
        while (tmpCount >= 10) {
            tmpCount = Math.trunc(tmpCount / 10)
            count *= 10;
        }
        if (tmpCount >= 5) {
            tmpCount = Math.trunc(tmpCount / 5)
            count *= 5;
        }
        if (tmpCount >= 2) {
            count *= 2;
        }
        return count;
    }

    _drawBackground() {
        this._container.querySelectorAll('line.ticks').forEach(tick => tick.parentNode.removeChild(tick));
        this._container.querySelectorAll('text.label').forEach(label => label.parentNode.removeChild(label));
        this._container.querySelectorAll('line.grid-line').forEach(line => line.parentNode.removeChild(line));

        const minorTickLength = this._canvasStartX / 9;
        const xMajorTicksCount = this._getTicksCount(this._canvasWidth, this._majorTicksDensity);
        const yMajorTicksCount = this._getTicksCount(this._canvasHeight, this._majorTicksDensity);
        const xMinorTicksCount = this._getTicksCount(this._canvasWidth, this._minorTicksDensity);
        const yMinorTicksCount = this._getTicksCount(this._canvasHeight, this._minorTicksDensity);

        const xMinorTicksDistance = this._canvasWidth / xMinorTicksCount;
        const yMinorTicksDistance = this._canvasHeight / yMinorTicksCount;
        const xMajorTicksDistance = this._canvasWidth / xMajorTicksCount;
        const yMajorTicksDistance = this._canvasHeight / yMajorTicksCount;
        const xMajorTickLabel = 1 / xMajorTicksCount;
        const yMajorTickLabel = 1 / yMajorTicksCount;

        this._canvas = this._drawing.drawRectangle(this._canvasStartX, this._canvasStartY, this._canvasWidth, this._canvasHeight, this._canvas);
        this._canvas.classList.add('canvas');

        this._axisX = this._drawing.drawLine(this._canvasStartX, this._canvasStartY + this._canvasHeight, this._canvasStartX + this._canvasWidth, this._canvasStartY + this._canvasHeight, this._axisX);
        this._axisX.classList.add('axis');
        this._axisY = this._drawing.drawLine(this._canvasStartX, this._canvasStartY, this._canvasStartX, this._canvasStartY + this._canvasHeight, this._axisY);
        this._axisY.classList.add('axis');

        for (let i = 0; i < xMinorTicksCount; i++) {
            const minorTick = this._drawing.drawLine(this._canvasStartX + (i + 1) * xMinorTicksDistance, this._canvasStartY + this._canvasHeight - minorTickLength,
                this._canvasStartX + (i + 1) * xMinorTicksDistance, this._canvasStartY + this._canvasHeight + minorTickLength);
            minorTick.classList.add('ticks');
        }

        for (let i = 0; i < yMinorTicksCount; i++) {
            const minorTick = this._drawing.drawLine(this._canvasStartX - minorTickLength, this._canvasStartY + i * yMinorTicksDistance,
                this._canvasStartX + minorTickLength, this._canvasStartY + i * yMinorTicksDistance);
            minorTick.classList.add('ticks');
        }

        for (let i = 0; i < xMajorTicksCount; i++) {
            const majorTicks = (this._drawing.drawLine(this._canvasStartX + (i + 1) * xMajorTicksDistance, this._canvasStartY + this._canvasHeight - 2 * minorTickLength,
                this._canvasStartX + (i + 1) * xMajorTicksDistance, this._canvasStartY + this._canvasHeight + 2 * minorTickLength));
            majorTicks.classList.add('ticks');
        }

        for (let i = 0; i < yMajorTicksCount; i++) {
            const majorTick = this._drawing.drawLine(
                this._canvasStartX - 2 * minorTickLength, this._canvasStartY + i * yMajorTicksDistance,
                this._canvasStartX + 2 * minorTickLength, this._canvasStartY + i * yMajorTicksDistance);
            majorTick.classList.add('ticks');
        }

        for (let i = 0; i < xMajorTicksCount + 1; i++) {
            const label = this._drawing.drawText(this._canvasStartX + (i + 1) * xMajorTicksDistance, this._canvasStartY + this._canvasHeight + 6 * minorTickLength,
                (xMajorTickLabel * (i + 1)).toFixed(1));
            label.classList.add('label');
        }

        for (let i = 0; i < yMajorTicksCount; i++) {
            const label = this._drawing.drawText(this._canvasStartX - 6 * minorTickLength,
                this._canvasStartY + i * yMajorTicksDistance,
                (yMajorTickLabel * (yMajorTicksCount - i)).toFixed(1));
            label.classList.add('label');
        }

        const label = this._drawing.drawText(this._canvasStartX - minorTickLength - 3 * minorTickLength,
            this._canvasStartY + this._canvasHeight + 6 * minorTickLength, 0);
        label.classList.add('label');

        for (let i = 0; i < xMajorTicksCount - 1; i++) {
            const gridLine = this._drawing.drawLine(this._canvasStartX + (i + 1) * xMajorTicksDistance, this._canvasStartY + this._canvasHeight,
                this._canvasStartX + (i + 1) * xMajorTicksDistance, this._canvasStartY);
            gridLine.classList.add('grid-line');
        }

        for (let i = 0; i < yMajorTicksCount - 1; i++) {
            const gridLine = this._drawing.drawLine(this._canvasStartX, this._canvasStartY + (i + 1) * yMajorTicksDistance,
                this._canvasStartX + this._canvasWidth, this._canvasStartY + (i + 1) * yMajorTicksDistance);
            gridLine.classList.add('grid-line');
        }

    }

    _getCursorPosition(event) {
        const rect = this._container.getBoundingClientRect()
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    _insertIntoArray(points, point) {
        let indexForInsert = 0;
        while (points[indexForInsert].x < point.x)
            indexForInsert++;
        points.splice(indexForInsert, 0, point);
        return indexForInsert;
    }

    _makeArrayAbsolute(points) {
        const relativePoints = [];
        points.forEach(point => relativePoints.push(this._coordsTransformer.relativeToAbsolute(point)));
        return relativePoints;
    }
}

customElements.define('transfer-widget', TransferFunctionControl);

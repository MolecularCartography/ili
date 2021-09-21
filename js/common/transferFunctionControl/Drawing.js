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
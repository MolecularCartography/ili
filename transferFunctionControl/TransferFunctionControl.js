'use strict';

define([
        'drawing', 'coordstransformer', 'objectcache'
    ],
    function () {

        const transferFunctionControl =
            class TransferFunctionControl extends HTMLElement {
                constructor(div, minorTicksDensity, majorTicksDensity) {
                    super();
                    const ns = 'http://www.w3.org/2000/svg';
                    const svg = document.createElementNS(ns, 'svg');
                    svg.setAttributeNS(null, 'width', '100%')
                    svg.setAttributeNS(null, 'height', '100%')
                    svg.id = "svg";
                    this._drawing = new Drawing(svg, ns);
                    this._canvas = this._drawing.drawRectangle(0, 0, 0, 0, this._canvas);
                    this._canvas.classList.add('canvas');

                    this._container = div.appendChild(svg);
                    this._letterOffset = 15;
                    this._defaultPoints = [{x: 0, y: 0}, {x: 1, y: 1}]
                    this._updateEvent = new CustomEvent('update');
                    this._canvas.addEventListener('mousedown', event => {
                        if (event.which === 1)
                            this._addPoint(event, this._container, this._points)
                    });
                    this._container.addEventListener('mousemove', event => this._dragPoint(event));
                    this._container.addEventListener('contextmenu', event => event.preventDefault());
                    this._container.addEventListener('mouseup', () => this._selectedIndex = -1);
                    this._minorTicksDensity = minorTicksDensity;
                    this._majorTicksDensity = majorTicksDensity;
                    this._selectedIndex = -1;
                    this._pointRadius = 5;

                    const activator = {
                        action: (qualifiedName, className) => {
                           return  {
                               activate: (element) =>  element.style.display = '',
                               deactivate: (element) => element.style.display = 'none',
                               create: () => {
                                   const elem = document.createElementNS(ns, qualifiedName);
                                   elem.classList.add(className);
                                   return this._container.appendChild(elem);
                               }
                           }
                        }
                    }

                    this._minorTicksCache = new ObjectCache(activator.action('line', 'ticks'));
                    this._majorTicksCache = new ObjectCache(activator.action('line', 'ticks'));
                    this._gridLinesCache = new ObjectCache(activator.action('line', 'grid-line'));
                    this._labelsCache = new ObjectCache(activator.action('text', 'label'));

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
                    this._axisX = this._drawing.drawLine(this._canvasStartX, this._canvasStartY + this._canvasHeight, this._canvasStartX + this._canvasWidth, this._canvasStartY + this._canvasHeight, this._axisX);
                    this._axisX.classList.add('axis');
                    this._axisY = this._drawing.drawLine(this._canvasStartX, this._canvasStartY, this._canvasStartX, this._canvasStartY + this._canvasHeight, this._axisY);
                    this._axisY.classList.add('axis');

                    const gridLines = this._gridLinesCache.get(xMajorTicksCount + yMajorTicksCount - 2);

                    for (let i = 0; i < xMajorTicksCount - 1; i++) {
                        gridLines[i] = this._drawing.drawLine(this._canvasStartX + (i + 1) * xMajorTicksDistance,
                            this._canvasStartY + this._canvasHeight, this._canvasStartX + (i + 1) * xMajorTicksDistance,
                            this._canvasStartY, gridLines[i]);
                    }

                    for (let i = 0; i < yMajorTicksCount - 1; i++) {
                        gridLines[xMajorTicksCount + i - 1] = this._drawing.drawLine(this._canvasStartX,
                            this._canvasStartY + (i + 1) * yMajorTicksDistance, this._canvasStartX + this._canvasWidth,
                            this._canvasStartY + (i + 1) * yMajorTicksDistance, gridLines[xMajorTicksCount + i - 1]);
                    }

                    const minorTicks = this._minorTicksCache.get(xMinorTicksCount + yMinorTicksCount);

                    for (let i = 0; i < xMinorTicksCount; i++) {
                        minorTicks[i] = this._drawing.drawLine(this._canvasStartX + (i + 1) * xMinorTicksDistance,
                            this._canvasStartY + this._canvasHeight - minorTickLength, this._canvasStartX + (i + 1) * xMinorTicksDistance,
                            this._canvasStartY + this._canvasHeight + minorTickLength, minorTicks[i]);
                    }

                    for (let i = 0; i < yMinorTicksCount; i++) {
                        minorTicks[xMinorTicksCount + i] = this._drawing.drawLine(this._canvasStartX - minorTickLength,
                            this._canvasStartY + i * yMinorTicksDistance, this._canvasStartX + minorTickLength,
                            this._canvasStartY + i * yMinorTicksDistance, minorTicks[xMinorTicksCount + i]);
                    }
                    const majorTicks = this._majorTicksCache.get(xMajorTicksCount + yMajorTicksCount);

                    for (let i = 0; i < xMajorTicksCount; i++) {
                        majorTicks[i] = this._drawing.drawLine(this._canvasStartX + (i + 1) * xMajorTicksDistance,
                            this._canvasStartY + this._canvasHeight - 2 * minorTickLength, this._canvasStartX + (i + 1) * xMajorTicksDistance,
                            this._canvasStartY + this._canvasHeight + 2 * minorTickLength, majorTicks[i]);
                    }

                    for (let i = 0; i < yMajorTicksCount; i++) {
                        majorTicks[xMajorTicksCount + i] = this._drawing.drawLine(
                            this._canvasStartX - 2 * minorTickLength, this._canvasStartY + i * yMajorTicksDistance,
                            this._canvasStartX + 2 * minorTickLength, this._canvasStartY + i * yMajorTicksDistance,
                            majorTicks[xMajorTicksCount + i]);
                    }

                    const labels = this._labelsCache.get(xMajorTicksCount + yMajorTicksCount + 1);

                    for (let i = 0; i < xMajorTicksCount + 1; i++) {
                        labels[i] = this._drawing.drawText(this._canvasStartX + (i + 1) * xMajorTicksDistance,
                            this._canvasStartY + this._canvasHeight + 6 * minorTickLength,
                            (xMajorTickLabel * (i + 1)).toFixed(1), labels[i]);
                    }

                    for (let i = 0; i < yMajorTicksCount; i++) {
                        labels[xMajorTicksCount + i] = this._drawing.drawText(this._canvasStartX - 6 * minorTickLength,
                            this._canvasStartY + i * yMajorTicksDistance, (yMajorTickLabel * (yMajorTicksCount - i)).toFixed(1),
                            labels[xMajorTicksCount + i]);
                    }

                    labels[xMajorTicksCount + yMajorTicksCount] = this._drawing.drawText(this._canvasStartX - minorTickLength - 3 * minorTickLength,
                        this._canvasStartY + this._canvasHeight + 6 * minorTickLength, 0, labels[xMajorTicksCount + yMajorTicksCount]);
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

        customElements.define('transfer-widget', transferFunctionControl);
        return transferFunctionControl;
    });

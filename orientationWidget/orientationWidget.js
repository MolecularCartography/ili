class OrientationWidget extends HTMLElement {

    classes = {
        'front-top-right': (dist, edgeDist, cornerDist) => [cornerDist, cornerDist, cornerDist],
        'front-bottom-right': (dist, edgeDist, cornerDist) => [cornerDist, -cornerDist, cornerDist],
        'front-top-left': (dist, edgeDist, cornerDist) => [-cornerDist, cornerDist, cornerDist],
        'front-bottom-left': (dist, edgeDist, cornerDist) => [-cornerDist, -cornerDist, cornerDist],

        'back-top-right': (dist, edgeDist, cornerDist) => [cornerDist, cornerDist, -cornerDist],
        'back-bottom-right': (dist, edgeDist, cornerDist) => [cornerDist, -cornerDist, -cornerDist],
        'back-top-left': (dist, edgeDist, cornerDist) => [-cornerDist, cornerDist, -cornerDist],
        'back-bottom-left': (dist, edgeDist, cornerDist) => [-cornerDist, -cornerDist, -cornerDist],

        'front-top': (dist, edgeDist, cornerDist) => [0, edgeDist, edgeDist],
        'front-bottom': (dist, edgeDist, cornerDist) => [0, -edgeDist, edgeDist],
        'front-right': (dist, edgeDist, cornerDist) => [edgeDist, 0, edgeDist],
        'front-left': (dist, edgeDist, cornerDist) => [-edgeDist, 0, edgeDist],

        'back-top': (dist, edgeDist, cornerDist) => [0, edgeDist, -edgeDist],
        'back-bottom': (dist, edgeDist, cornerDist) => [0, -edgeDist, -edgeDist],
        'back-right': (dist, edgeDist, cornerDist) => [edgeDist, 0, -edgeDist],
        'back-left': (dist, edgeDist, cornerDist) => [-edgeDist, 0, -edgeDist],

        'right-top': (dist, edgeDist, cornerDist) => [edgeDist, edgeDist, 0],
        'right-bottom': (dist, edgeDist, cornerDist) => [edgeDist, -edgeDist, 0],
        'left-top': (dist, edgeDist, cornerDist) => [-edgeDist, edgeDist, 0],
        'left-bottom': (dist, edgeDist, cornerDist) => [-edgeDist, -edgeDist, 0],

        'front': (dist, edgeDist, cornerDist) => [0, 0, dist],
        'back': (dist, edgeDist, cornerDist) => [0, 0, -dist],
        'right': (dist, edgeDist, cornerDist) => [dist, 0, 0],
        'left': (dist, edgeDist, cornerDist) => [-dist, 0, 0],
        'top': (dist, edgeDist, cornerDist) => [0, dist, 0],
        'bottom': (dist, edgeDist, cornerDist) => [0, -dist, 0],
    };

    constructor() {
        super();
    }

    connectedCallback() {
        fetch('orientationWidget/orientationWidget.html')
            .then(r => r.text())
            .then(t => {
                this.innerHTML = t;
                for (const [key, value] of Object.entries(this.classes)) {
                    let elements = this.firstChild.firstElementChild.getElementsByClassName(key);
                    for (let i = 0; i < elements.length; i++) {
                        elements[i].addEventListener('mouseover', () => {
                            for (let j = 0; j < elements.length; j++) {
                                elements[j].style.backgroundColor = 'rgba(255,255,255,0.3)';
                            }
                        });
                        elements[i].addEventListener('mouseout', () => {
                            for (let j = 0; j < elements.length; j++) {
                                elements[j].style.background = 'transparent';
                            }
                        })
                        elements[i].addEventListener('click', () => this._cameraRotateFunc(value));
                    }
                }
            });
    }

    set cameraRotateFunc(val) {
        this._cameraRotateFunc = val;
    }

    set transform(val) {
        let cube = this.firstChild.firstElementChild;
        cube.style.transform = val;
    }
}

customElements.define('orientation-widget', OrientationWidget);
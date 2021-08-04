class OrientationWidget extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        fetch('orientationWidget/orientationWidget.html')
            .then( r => r.text() )
            .then( t => this.innerHTML = t );
    }

    get myTransform() {
        let cube = this.firstChild.firstElementChild;
        return cube.style.transform;
    }

    set myTransform(val) {
        let cube = this.firstChild.firstElementChild;
        cube.style.transform = val;
    }
}

customElements.define('orientation-widget', OrientationWidget);
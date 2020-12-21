
var header = document.createElement('div')
header.className = 'header';
header.innerHTML += 'Choose mode';
document.body.appendChild(header);

var main = document.createElement('div');
main.className = 'main';
document.body.appendChild(main);

let surfacebtn = document.createElement('button');
surfacebtn.addEventListener('click', surface);
surfacebtn.className = 'menuBtn';
surfacebtn.id = 'surfaceBtn';
let surfaceName = document.createElement('div');
surfaceName.className = 'text';
surfaceName.textContent = 'Surface';
surfacebtn.appendChild(surfaceName);
main.appendChild(surfacebtn);

let volumebtn = document.createElement('button');
volumebtn.addEventListener('click', volume);
volumebtn.className = 'menuBtn';
volumebtn.id ='volumeBtn';
let volumeName = document.createElement('div');
volumeName.textContent = 'Volume';
volumeName.className = 'text';
volumebtn.appendChild(volumeName);
main.appendChild(volumebtn);

function deleteStartLayout(){
    main.parentNode.removeChild(main);
    header.parentNode.removeChild(header);
}

function surface(){
    deleteStartLayout();
    require(['js/surface/main'], function (ili) { new ili(document.body);});
}
function volume(){
    deleteStartLayout();
    require(['js/volume/main'], function (ili) { new ili(document.body);});
}

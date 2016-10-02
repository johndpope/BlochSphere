var $document = $(document);
var $container = $('#container');

var WIDTH = $document.width();
var HEIGHT = $document.height();

var VIEW_ANGLE = 45,
    ASPECT = WIDTH / HEIGHT,
    NEAR = 0.1,
    FAR = 10000;

// create a WebGL renderer, camera
// and a scene
var renderer = new THREE.WebGLRenderer();
renderer.autoClear = false;
var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
var scene = new THREE.Scene();
var scene2 = new THREE.Scene();

camera.position.x = 2.5;
camera.position.y = 2.5;
camera.position.z = 2.5;
camera.lookAt(new THREE.Vector3(0, 0, 0));
scene.add(camera);

// start the renderer
renderer.setSize(WIDTH, HEIGHT);

// attach the render-supplied DOM element
$container.append(renderer.domElement);

var spheregeometry = new THREE.SphereGeometry(1, 30, 30);
var spherematerial = new THREE.MeshNormalMaterial({
    transparent: true,
    opacity: 0.5,
});
var sphere = new THREE.Mesh(spheregeometry, spherematerial);
sphere.position.set(0, 0, 0);
scene.add(sphere);

var direction = new THREE.Vector3(1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3));
var r = new THREE.ArrowHelper(direction.normalize(), new THREE.Vector3(0, 0, 0), 1, 0xffffff);
scene.add(r);

var linematerial = new THREE.LineBasicMaterial({
    color: 0x0000ff
});
var geometry = new THREE.Geometry();
geometry.vertices.push(new THREE.Vector3(-1.1, 0, 0));
geometry.vertices.push(new THREE.Vector3(1.1, 0, 0));
var line = new THREE.Line(geometry, linematerial);
scene.add(line);
geometry = new THREE.Geometry();
geometry.vertices.push(new THREE.Vector3(0, -1.1, 0));
geometry.vertices.push(new THREE.Vector3(0, 1.1, 0));
line = new THREE.Line(geometry, linematerial);
scene.add(line);
geometry = new THREE.Geometry();
geometry.vertices.push(new THREE.Vector3(0, 0, -1.1));
geometry.vertices.push(new THREE.Vector3(0, 0, 1.1));
line = new THREE.Line(geometry, linematerial);
scene.add(line);

controls = new THREE.OrbitControls(camera, renderer.domElement);
//controls.addEventListener('change', render);

var $x = $('<div style="position: absolute; top: 10px; left: 10px; color: white;"></div>');
$x.text("x");
$container.append($x);
var $y = $('<div style="position: absolute; top: 10px; left: 10px; color: white;"></div>');
$y.text("y");
$container.append($y);
var $z = $('<div style="position: absolute; top: 10px; left: 10px; color: white;"></div>');
$z.text("z");
$container.append($z);

function positionText(pos3D, el) {
    v = pos3D.project(camera);
    var left = WIDTH * (v.x + 1) / 2;
    var top = HEIGHT * (-v.y + 1) / 2;
    el.css({
        left: left,
        top: top
    });
}

var pos = 0;

function createPoint(vec) {
    var dotGeometry = new THREE.Geometry();
    dotGeometry.vertices.push(vec);
    var dotMaterial = new THREE.PointsMaterial({
        size: 1,
        transparent: true,
        sizeAttenuation: false
    });
    var dot = new THREE.Points(dotGeometry, dotMaterial);
    scene2.add(dot);
    return dot;
}

var idx = 0;
var points = [];

function render() {
    positionText(new THREE.Vector3(1.1, 0, 0), $x);
    positionText(new THREE.Vector3(0, 1.1, 0), $y);
    positionText(new THREE.Vector3(0, 0, 1.1), $z);
    t += 0.01;
    vec = direction.clone().applyMatrix3(transformation(rabiFrequency, detuning, t));
    r.setDirection(vec);
    if (points.length < 500) {
        for (var i = 0; i < idx; ++i) {
            points[i].material.opacity *= 0.97;
        }
        ++idx;
        points.push(createPoint(vec));
    } else {
        for (var i = idx - 500; i < idx; i++) {
            points[(i + points.length) % points.length].material.opacity *= 0.97;
        }
        var pt = points[idx++ % points.length];
        pt.geometry.vertices[0] = vec;
        pt.material.opacity = 1;
        pt.geometry.verticesNeedUpdate = true;
    }
    renderer.render(scene, camera);
    renderer.clearDepth();
    renderer.render(scene2, camera);
}

t = 0;
detuning = 1;
rabiFrequency = 0;
vec = direction;

function renderLoop() {
    render();
    setTimeout(function() {
        renderLoop();
    }, 50);
}

function p2(k) {
    return Math.pow(k, 2);
}

function gr(rabi, detuning) {
    return Math.sqrt(p2(rabi) + p2(detuning));
}

function transformation(r, d, t) {
    var g = gr(r, d);
    return new THREE.Matrix3().fromArray([
        (p2(r) + p2(d) * Math.cos(g * t)) / p2(g), -d * Math.sin(g * t) / g, -d * r * (1 - Math.cos(g * t)) / p2(g),
        d * Math.sin(g * t) / g, Math.cos(g * t), r * Math.sin(g * t) / g, -d * r * (1 - Math.cos(g * t)) / p2(g), -r * Math.sin(g * t) / g, (p2(d) + p2(r) * Math.cos(g * t)) / p2(g)
    ]);
}

function reset() {
    direction = new THREE.Vector3($("#a").val(), $("#b").val(), $("#c").val()).normalize();
    vec = direction;
    t = 0;
    for (var i = 0; i < points.length; ++i) {
        scene.remove(points[i]);
    }
    points = [];
    idx = 0;
}

function updateDetuning(value) {
    direction = vec;
    detuning = value;
    t = 0;
    render();
}

function updateRabiFrequency(value) {
    direction = vec;
    rabiFrequency = value;
    t = 0;
    render();
}

renderLoop();
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const game = document.getElementById("game");

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x9ed5f0);
scene.fog = new THREE.Fog(0x9ed5f0, 180, 650);

const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1200
);

camera.position.set(120, 110, 150);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

game.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;
controls.dampingFactor = 0.08;

controls.minDistance = 35;
controls.maxDistance = 400;

controls.maxPolarAngle = Math.PI / 2.15;
controls.minPolarAngle = 0.25;

controls.target.set(0, 0, 0);

const ambientLight = new THREE.HemisphereLight(
    0xdff4ff,
    0x65734f,
    2.2
);

scene.add(ambientLight);

const sun = new THREE.DirectionalLight(
    0xffffff,
    3.5
);

sun.position.set(120, 220, 80);
sun.castShadow = true;

sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;

sun.shadow.camera.left = -250;
sun.shadow.camera.right = 250;
sun.shadow.camera.top = 250;
sun.shadow.camera.bottom = -250;

sun.shadow.camera.near = 1;
sun.shadow.camera.far = 600;

scene.add(sun);

const groundGeometry = new THREE.PlaneGeometry(
    700,
    700,
    80,
    80
);

const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x6f9d55,
    roughness: 1
});

const ground = new THREE.Mesh(
    groundGeometry,
    groundMaterial
);

ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;

scene.add(ground);

const waterGeometry = new THREE.PlaneGeometry(
    230,
    150
);

const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x4fa7c8,
    roughness: 0.25,
    metalness: 0.05
});

const water = new THREE.Mesh(
    waterGeometry,
    waterMaterial
);

water.rotation.x = -Math.PI / 2;
water.position.set(-185, 0.25, -170);
water.receiveShadow = true;

scene.add(water);

function createHill(x, z, size, height) {

    const geometry = new THREE.ConeGeometry(
        size,
        height,
        24
    );

    const material = new THREE.MeshStandardMaterial({
        color: 0x668d4e,
        roughness: 1
    });

    const hill = new THREE.Mesh(
        geometry,
        material
    );

    hill.position.set(x, height / 2, z);

    hill.castShadow = true;
    hill.receiveShadow = true;

    scene.add(hill);
}

createHill(-250, -20, 65, 45);
createHill(-180, 80, 50, 32);
createHill(250, -170, 75, 55);
createHill(300, 80, 55, 40);

function createTree(x, z, scale = 1) {

    const group = new THREE.Group();

    const trunkGeometry = new THREE.CylinderGeometry(
        0.8 * scale,
        1.1 * scale,
        7 * scale,
        8
    );

    const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x765039
    });

    const trunk = new THREE.Mesh(
        trunkGeometry,
        trunkMaterial
    );

    trunk.position.y = 3.5 * scale;
    trunk.castShadow = true;

    group.add(trunk);

    const leavesGeometry = new THREE.SphereGeometry(
        4.5 * scale,
        10,
        8
    );

    const leavesMaterial = new THREE.MeshStandardMaterial({
        color: 0x3f7e3e,
        roughness: 1
    });

    const leaves = new THREE.Mesh(
        leavesGeometry,
        leavesMaterial
    );

    leaves.position.y = 9 * scale;
    leaves.castShadow = true;

    group.add(leaves);

    group.position.set(x, 0, z);

    scene.add(group);
}

for (let i = 0; i < 70; i++) {

    const x = (Math.random() - 0.5) * 560;
    const z = (Math.random() - 0.5) * 560;

    if (
        Math.abs(x) < 130 &&
        Math.abs(z) < 130
    ) {
        continue;
    }

    if (
        x < -80 &&
        z < -80
    ) {
        continue;
    }

    createTree(
        x,
        z,
        0.7 + Math.random() * 0.7
    );
}

const roadMaterial = new THREE.MeshStandardMaterial({
    color: 0x3d4246,
    roughness: 0.95
});

const roadLineMaterial = new THREE.MeshBasicMaterial({
    color: 0xe8d477
});

const roads = [];

function createRoad(x, z, width, length, rotation = 0) {

    const group = new THREE.Group();

    const geometry = new THREE.BoxGeometry(
        width,
        0.35,
        length
    );

    const road = new THREE.Mesh(
        geometry,
        roadMaterial
    );

    road.position.y = 0.18;
    road.receiveShadow = true;

    group.add(road);

    const lineGeometry = new THREE.BoxGeometry(
        0.45,
        0.04,
        length - 5
    );

    const line = new THREE.Mesh(
        lineGeometry,
        roadLineMaterial
    );

    line.position.y = 0.39;

    group.add(line);

    group.position.set(x, 0, z);
    group.rotation.y = rotation;

    scene.add(group);

    roads.push({
        object: group,
        width: width,
        length: length
    });

    return group;
}

createRoad(0, 0, 18, 330, 0);
createRoad(0, 0, 18, 330, Math.PI / 2);

createRoad(0, -90, 14, 300, 0);
createRoad(-90, 0, 14, 300, Math.PI / 2);

const buildPanel = document.createElement("div");

buildPanel.style.position = "absolute";
buildPanel.style.left = "20px";
buildPanel.style.top = "20px";
buildPanel.style.padding = "14px 18px";
buildPanel.style.background = "rgba(20,25,28,0.92)";
buildPanel.style.border = "1px solid rgba(255,255,255,0.18)";
buildPanel.style.borderRadius = "12px";
buildPanel.style.color = "white";
buildPanel.style.fontFamily = "Arial,sans-serif";
buildPanel.style.fontSize = "14px";
buildPanel.style.zIndex = "20";
buildPanel.style.boxShadow = "0 8px 30px rgba(0,0,0,0.3)";

buildPanel.innerHTML = `
<div style="font-size:20px;font-weight:bold;margin-bottom:8px">
CITY BUILDER
</div>
<div style="opacity:.8;margin-bottom:12px">
Build your first roads
</div>
<button id="roadButton" style="
padding:9px 14px;
border:0;
border-radius:8px;
background:#4f8cff;
color:white;
font-weight:bold;
cursor:pointer;
">
BUILD ROAD
</button>
<div id="buildStatus" style="
margin-top:10px;
font-size:13px;
opacity:.75;
">
Road building: OFF
</div>
`;

game.appendChild(buildPanel);

const roadButton = document.getElementById("roadButton");
const buildStatus = document.getElementById("buildStatus");

let buildMode = false;
let buildingRoad = false;
let roadStart = null;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function getGroundPosition(event) {

    const rect = renderer.domElement.getBoundingClientRect();

    mouse.x =
        ((event.clientX - rect.left) / rect.width) * 2 - 1;

    mouse.y =
        -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const hit = raycaster.intersectObject(ground);

    if (!hit.length) {
        return null;
    }

    return hit[0].point;
}

function snap(value) {
    return Math.round(value / 5) * 5;
}

function updateBuildStatus(text) {
    buildStatus.textContent = text;
}

roadButton.addEventListener("click", () => {

    buildMode = !buildMode;

    if (buildMode) {

        roadButton.textContent = "EXIT ROAD BUILDING";
        roadButton.style.background = "#e67e22";

        updateBuildStatus(
            "Road building: ON — click and drag"
        );

        controls.enabled = false;

    } else {

        roadButton.textContent = "BUILD ROAD";
        roadButton.style.background = "#4f8cff";

        buildingRoad = false;
        roadStart = null;

        updateBuildStatus(
            "Road building: OFF"
        );

        controls.enabled = true;
    }
});

renderer.domElement.addEventListener("pointerdown", event => {

    if (!buildMode) {
        return;
    }

    if (event.button !== 0) {
        return;
    }

    const position = getGroundPosition(event);

    if (!position) {
        return;
    }

    roadStart = {
        x: snap(position.x),
        z: snap(position.z)
    };

    buildingRoad = true;

    updateBuildStatus(
        "Drag to place road..."
    );
});

renderer.domElement.addEventListener("pointerup", event => {

    if (!buildMode) {
        return;
    }

    if (!buildingRoad) {
        return;
    }

    if (event.button !== 0) {
        return;
    }

    const position = getGroundPosition(event);

    if (!position || !roadStart) {
        buildingRoad = false;
        roadStart = null;
        return;
    }

    const end = {
        x: snap(position.x),
        z: snap(position.z)
    };

    const dx = end.x - roadStart.x;
    const dz = end.z - roadStart.z;

    if (Math.abs(dx) < 5 && Math.abs(dz) < 5) {

        buildingRoad = false;
        roadStart = null;

        updateBuildStatus(
            "Road too short"
        );

        return;
    }

    let x;
    let z;
    let length;
    let rotation;

    if (Math.abs(dx) >= Math.abs(dz)) {

        x = (roadStart.x + end.x) / 2;
        z = roadStart.z;

        length = Math.abs(dx) + 10;
        rotation = Math.PI / 2;

    } else {

        x = roadStart.x;
        z = (roadStart.z + end.z) / 2;

        length = Math.abs(dz) + 10;
        rotation = 0;
    }

    createRoad(
        x,
        z,
        12,
        length,
        rotation
    );

    buildingRoad = false;
    roadStart = null;

    updateBuildStatus(
        "Road built!"
    );
});

renderer.domElement.addEventListener("pointermove", event => {

    if (!buildMode || !buildingRoad || !roadStart) {
        return;
    }

    const position = getGroundPosition(event);

    if (!position) {
        return;
    }

    const x = snap(position.x);
    const z = snap(position.z);

    const dx = x - roadStart.x;
    const dz = z - roadStart.z;

    if (Math.abs(dx) >= Math.abs(dz)) {

        updateBuildStatus(
            `Road preview: ${Math.abs(dx)}m`
        );

    } else {

        updateBuildStatus(
            `Road preview: ${Math.abs(dz)}m`
        );
    }
});

const clock = new THREE.Clock();

function animate() {

    requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();

    controls.update();

    water.material.color.offsetHSL(
        Math.sin(elapsed * 0.15) * 0.0004,
        0,
        0
    );

    renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {

    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
});

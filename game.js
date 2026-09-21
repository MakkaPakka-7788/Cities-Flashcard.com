
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

camera.position.set(120,110,150);

const renderer = new THREE.WebGLRenderer({
    antialias:true
});

renderer.setSize(window.innerWidth,window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));

renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;

renderer.outputColorSpace=THREE.SRGBColorSpace;

game.appendChild(renderer.domElement);

const controls = new OrbitControls(camera,renderer.domElement);

controls.enableDamping=true;
controls.dampingFactor=0.08;

controls.minDistance=35;
controls.maxDistance=400;

controls.maxPolarAngle=Math.PI/2.15;
controls.minPolarAngle=0.25;

controls.target.set(0,0,0);

const ambientLight=new THREE.HemisphereLight(
    0xdff4ff,
    0x65734f,
    2.2
);

scene.add(ambientLight);

const sun=new THREE.DirectionalLight(
    0xffffff,
    3.5
);

sun.position.set(120,220,80);
sun.castShadow=true;

sun.shadow.mapSize.width=2048;
sun.shadow.mapSize.height=2048;

sun.shadow.camera.left=-250;
sun.shadow.camera.right=250;
sun.shadow.camera.top=250;
sun.shadow.camera.bottom=-250;

sun.shadow.camera.near=1;
sun.shadow.camera.far=600;

scene.add(sun);

const groundGeometry=new THREE.PlaneGeometry(
    700,
    700,
    80,
    80
);

const groundMaterial=new THREE.MeshStandardMaterial({
    color:0x6f9d55,
    roughness:1
});

const ground=new THREE.Mesh(
    groundGeometry,
    groundMaterial
);

ground.rotation.x=-Math.PI/2;
ground.receiveShadow=true;

scene.add(ground);

const waterGeometry=new THREE.PlaneGeometry(
    230,
    150
);

const waterMaterial=new THREE.MeshStandardMaterial({
    color:0x4fa7c8,
    roughness:0.25,
    metalness:0.05
});

const water=new THREE.Mesh(
    waterGeometry,
    waterMaterial
);

water.rotation.x=-Math.PI/2;
water.position.set(-185,0.25,-170);

water.receiveShadow=true;

scene.add(water);

function createHill(x,z,size,height){

    const geometry=new THREE.ConeGeometry(
        size,
        height,
        24
    );

    const material=new THREE.MeshStandardMaterial({
        color:0x668d4e,
        roughness:1
    });

    const hill=new THREE.Mesh(
        geometry,
        material
    );

    hill.position.set(x,height/2,z);

    hill.castShadow=true;
    hill.receiveShadow=true;

    scene.add(hill);
}

createHill(-250,-20,65,45);
createHill(-180,80,50,32);
createHill(250,-170,75,55);
createHill(300,80,55,40);

function createTree(x,z,scale=1){

    const group=new THREE.Group();

    const trunkGeometry=new THREE.CylinderGeometry(
        0.8*scale,
        1.1*scale,
        7*scale,
        8
    );

    const trunkMaterial=new THREE.MeshStandardMaterial({
        color:0x765039
    });

    const trunk=new THREE.Mesh(
        trunkGeometry,
        trunkMaterial
    );

    trunk.position.y=3.5*scale;
    trunk.castShadow=true;

    group.add(trunk);

    const leavesGeometry=new THREE.SphereGeometry(
        4.5*scale,
        10,
        8
    );

    const leavesMaterial=new THREE.MeshStandardMaterial({
        color:0x3f7e3e,
        roughness:1
    });

    const leaves=new THREE.Mesh(
        leavesGeometry,
        leavesMaterial
    );

    leaves.position.y=9*scale;
    leaves.castShadow=true;

    group.add(leaves);

    group.position.set(x,0,z);

    scene.add(group);
}

for(let i=0;i<70;i++){

    const x=(Math.random()-0.5)*560;
    const z=(Math.random()-0.5)*560;

    if(
        Math.abs(x)<130 &&
        Math.abs(z)<130
    ){
        continue;
    }

    if(
        x<-80 &&
        z<-80
    ){
        continue;
    }

    createTree(
        x,
        z,
        0.7+Math.random()*0.7
    );
}

const roadMaterial=new THREE.MeshStandardMaterial({
    color:0x3d4246,
    roughness:0.95
});

function createRoad(x,z,width,length,rotation=0){

    const geometry=new THREE.BoxGeometry(
        width,
        0.35,
        length
    );

    const road=new THREE.Mesh(
        geometry,
        roadMaterial
    );

    road.position.set(x,0.18,z);
    road.rotation.y=rotation;

    road.receiveShadow=true;

    scene.add(road);

    const lineMaterial=new THREE.MeshBasicMaterial({
        color:0xe8d477
    });

    const lineGeometry=new THREE.BoxGeometry(
        0.45,
        0.04,
        length-5
    );

    const line=new THREE.Mesh(
        lineGeometry,
        lineMaterial
    );

    line.position.set(x,0.39,z);
    line.rotation.y=rotation;

    scene.add(line);
}

createRoad(0,0,18,330,0);
createRoad(0,0,18,330,Math.PI/2);

createRoad(0,-90,14,300,0);
createRoad(-90,0,14,300,Math.PI/2);

const clock=new THREE.Clock();

function animate(){

    requestAnimationFrame(animate);

    const elapsed=clock.getElapsedTime();

    controls.update();

    water.material.color.offsetHSL(
        Math.sin(elapsed*0.15)*0.0004,
        0,
        0
    );

    renderer.render(scene,camera);
}

animate();

window.addEventListener("resize",()=>{

    camera.aspect=
        window.innerWidth/window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

});

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const game = document.getElementById("game");

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x9ed5f0);
scene.fog = new THREE.Fog(0x9ed5f0,180,650);

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

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio,2)
);

renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;

game.appendChild(renderer.domElement);

const controls = new OrbitControls(
    camera,
    renderer.domElement
);

controls.enableDamping=true;
controls.dampingFactor=.08;

controls.minDistance=35;
controls.maxDistance=400;

controls.maxPolarAngle=Math.PI/2.15;
controls.minPolarAngle=.25;

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
    roughness:.25,
    metalness:.05
});

const water=new THREE.Mesh(
    waterGeometry,
    waterMaterial
);

water.rotation.x=-Math.PI/2;
water.position.set(-185,.25,-170);
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
        .8*scale,
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

    const x=(Math.random()-.5)*560;
    const z=(Math.random()-.5)*560;

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
        .7+Math.random()*.7
    );
}

const roadMaterial=new THREE.MeshStandardMaterial({
    color:0x3d4246,
    roughness:.95
});

const roadLineMaterial=new THREE.MeshBasicMaterial({
    color:0xe8d477
});

const roads=[];

function createRoad(
    x,
    z,
    width,
    length,
    rotation=0
){

    const group=new THREE.Group();

    const geometry=new THREE.BoxGeometry(
        width,
        .35,
        length
    );

    const road=new THREE.Mesh(
        geometry,
        roadMaterial
    );

    road.position.y=.18;
    road.receiveShadow=true;

    group.add(road);

    const lineGeometry=new THREE.BoxGeometry(
        .45,
        .04,
        length-5
    );

    const line=new THREE.Mesh(
        lineGeometry,
        roadLineMaterial
    );

    line.position.y=.39;

    group.add(line);

    group.position.set(x,0,z);
    group.rotation.y=rotation;

    scene.add(group);

    roads.push(group);

    return group;
}

createRoad(0,0,18,330,0);
createRoad(0,0,18,330,Math.PI/2);

createRoad(0,-90,14,300,0);
createRoad(-90,0,14,300,Math.PI/2);

const topbar=document.createElement("div");

topbar.className="city-topbar";

topbar.innerHTML=`
<div class="city-title">
🏙️ MY CITY
</div>

<div class="city-stats">

<div class="stat">
<div class="stat-label">Population</div>
<div class="stat-value" id="population">1,240</div>
</div>

<div class="stat">
<div class="stat-label">Money</div>
<div class="stat-value" id="money">$25,000</div>
</div>

<div class="stat">
<div class="stat-label">Happiness</div>
<div class="stat-value" id="happiness">72%</div>
</div>

<div class="stat">
<div class="stat-label">Traffic</div>
<div class="stat-value" id="traffic">18%</div>
</div>

<div class="stat">
<div class="stat-label">Day</div>
<div class="stat-value" id="day">1</div>
</div>

</div>
`;

game.appendChild(topbar);

const buildButton=document.createElement("button");

buildButton.className="build-main";
buildButton.textContent="🏗️  BUILD";

game.appendChild(buildButton);

const menu=document.createElement("div");

menu.className="build-menu";

menu.innerHTML=`

<div class="menu-header">

<div class="menu-title">
Build
</div>

<button class="close-menu">
×
</button>

</div>

<div class="build-grid">

<button class="build-card" data-build="road">
<div class="build-icon">🛣️</div>
<div class="build-name">Roads</div>
<div class="build-price">$50</div>
</button>

<button class="build-card" data-build="residential">
<div class="build-icon">🏠</div>
<div class="build-name">Residential</div>
<div class="build-price">$100</div>
</button>

<button class="build-card" data-build="commercial">
<div class="build-icon">🏪</div>
<div class="build-name">Shops</div>
<div class="build-price">$150</div>
</button>

<button class="build-card" data-build="industrial">
<div class="build-icon">🏭</div>
<div class="build-name">Industrial</div>
<div class="build-price">$300</div>
</button>

<button class="build-card" data-build="water">
<div class="build-icon">💧</div>
<div class="build-name">Water</div>
<div class="build-price">$500</div>
</button>

<button class="build-card" data-build="power">
<div class="build-icon">⚡</div>
<div class="build-name">Electricity</div>
<div class="build-price">$750</div>
</button>

<button class="build-card" data-build="parks">
<div class="build-icon">🌳</div>
<div class="build-name">Parks</div>
<div class="build-price">$200</div>
</button>

<button class="build-card" data-build="services">
<div class="build-icon">🏥</div>
<div class="build-name">Services</div>
<div class="build-price">$400</div>
</button>

</div>
`;

game.appendChild(menu);

const status=document.createElement("div");

status.className="build-status";

game.appendChild(status);

let buildMode=false;
let selectedBuild=null;
let buildingRoad=false;
let roadStart=null;

const raycaster=new THREE.Raycaster();
const mouse=new THREE.Vector2();

function getGroundPosition(event){

    const rect=renderer.domElement.getBoundingClientRect();

    mouse.x=
        ((event.clientX-rect.left)/rect.width)*2-1;

    mouse.y=
        -((event.clientY-rect.top)/rect.height)*2+1;

    raycaster.setFromCamera(mouse,camera);

    const hit=raycaster.intersectObject(ground);

    if(!hit.length){
        return null;
    }

    return hit[0].point;
}

function snap(value){

    return Math.round(value/5)*5;
}

function showStatus(message){

    status.textContent=message;
    status.classList.add("show");

    clearTimeout(status.timer);

    status.timer=setTimeout(()=>{
        status.classList.remove("show");
    },1800);
}

function closeBuildMenu(){

    menu.classList.remove("open");
    buildButton.classList.remove("active");

    buildMode=false;
    selectedBuild=null;
    buildingRoad=false;
    roadStart=null;

    controls.enabled=true;

    document.querySelectorAll(".build-card").forEach(card=>{
        card.classList.remove("selected");
    });
}

buildButton.addEventListener("click",()=>{

    const opening=!menu.classList.contains("open");

    if(opening){

        menu.classList.add("open");
        buildButton.classList.add("active");
        buildButton.textContent="✕  CLOSE BUILD";

    }else{

        closeBuildMenu();
        buildButton.textContent="🏗️  BUILD";
    }
});

document.querySelector(".close-menu").addEventListener(
    "click",
    ()=>{
        closeBuildMenu();
        buildButton.textContent="🏗️  BUILD";
    }
);

document.querySelectorAll(".build-card").forEach(card=>{

    card.addEventListener("click",()=>{

        document.querySelectorAll(".build-card").forEach(
            other=>{
                other.classList.remove("selected");
            }
        );

        card.classList.add("selected");

        selectedBuild=card.dataset.build;

        if(selectedBuild==="road"){

            buildMode=true;
            controls.enabled=false;

            showStatus(
                "Road tool selected — click and drag on the map"
            );

        }else{

            buildMode=false;
            controls.enabled=true;

            showStatus(
                card.querySelector(".build-name").textContent+
                " selected — we'll make this buildable next"
            );
        }
    });
});

renderer.domElement.addEventListener(
    "pointerdown",
    event=>{

        if(!buildMode){
            return;
        }

        if(selectedBuild!=="road"){
            return;
        }

        if(event.button!==0){
            return;
        }

        const position=getGroundPosition(event);

        if(!position){
            return;
        }

        roadStart={
            x:snap(position.x),
            z:snap(position.z)
        };

        buildingRoad=true;

        showStatus("Drag to build your road...");
    }
);

renderer.domElement.addEventListener(
    "pointerup",
    event=>{

        if(!buildingRoad){
            return;
        }

        if(event.button!==0){
            return;
        }

        const position=getGroundPosition(event);

        if(!position){
            buildingRoad=false;
            roadStart=null;
            return;
        }

        const end={
            x:snap(position.x),
            z:snap(position.z)
        };

        const dx=end.x-roadStart.x;
        const dz=end.z-roadStart.z;

        if(
            Math.abs(dx)<5 &&
            Math.abs(dz)<5
        ){

            buildingRoad=false;
            roadStart=null;

            showStatus("Road is too short");

            return;
        }

        let x;
        let z;
        let length;
        let rotation;

        if(Math.abs(dx)>=Math.abs(dz)){

            x=(roadStart.x+end.x)/2;
            z=roadStart.z;
            length=Math.abs(dx)+10;
            rotation=Math.PI/2;

        }else{

            x=roadStart.x;
            z=(roadStart.z+end.z)/2;
            length=Math.abs(dz)+10;
            rotation=0;
        }

        createRoad(
            x,
            z,
            12,
            length,
            rotation
        );

        buildingRoad=false;
        roadStart=null;

        showStatus("Road built!");
    }
);

renderer.domElement.addEventListener(
    "contextmenu",
    event=>{
        if(buildMode){
            event.preventDefault();
        }
    }
);

const clock=new THREE.Clock();

function animate(){

    requestAnimationFrame(animate);

    const elapsed=clock.getElapsedTime();

    controls.update();

    water.material.color.offsetHSL(
        Math.sin(elapsed*.15)*.0004,
        0,
        0
    );

    renderer.render(
        scene,
        camera
    );
}

animate();

window.addEventListener(
    "resize",
    ()=>{

        camera.aspect=
            window.innerWidth/window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
    }
);

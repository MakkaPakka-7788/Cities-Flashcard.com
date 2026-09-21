import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fc8eb);

const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
);

camera.position.set(80, 90, 80);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.getElementById("game").appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 20;
controls.maxDistance = 260;
controls.maxPolarAngle = Math.PI * 0.47;
controls.target.set(0, 0, 0);

const ambient = new THREE.HemisphereLight(0xdff5ff, 0x52634a, 2.1);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(80, 140, 60);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.left = -180;
sun.shadow.camera.right = 180;
sun.shadow.camera.top = 180;
sun.shadow.camera.bottom = -180;
scene.add(sun);

const CITY_SIZE = 80;
const TILE = 5;
const HALF = CITY_SIZE / 2;

const roads = new Map();
const buildings = new Map();
const effects = [];
const trees = [];
const smokeParticles = [];
const constructionObjects = [];

let selectedTool = null;
let dragging = false;
let lastBuildTile = null;
let hoveredTile = null;

let money = 50000;
let population = 0;
let jobs = 0;
let happiness = 70;
let traffic = 0;
let pollution = 0;

const services = {
    electricity: {
        supply: 0,
        demand: 0
    },
    water: {
        supply: 0,
        demand: 0
    },
    waste: {
        supply: 0,
        demand: 0
    },
    health: {
        coverage: 0
    },
    fire: {
        coverage: 0
    },
    police: {
        coverage: 0
    },
    education: {
        coverage: 0
    }
};

const buildingTypes = {
    house: {
        name: "House",
        category: "Residential",
        cost: 800,
        width: 1,
        depth: 1,
        population: 4,
        jobs: 0,
        electricity: 2,
        water: 2,
        waste: 1,
        happiness: 2,
        pollution: 0,
        color: 0xd8b58b
    },

    townhouse: {
        name: "Townhouse",
        category: "Residential",
        cost: 1400,
        width: 1,
        depth: 1,
        population: 8,
        jobs: 0,
        electricity: 3,
        water: 3,
        waste: 2,
        happiness: 2,
        pollution: 0,
        color: 0xc88d69
    },

    apartment: {
        name: "Apartment",
        category: "Residential",
        cost: 5000,
        width: 2,
        depth: 2,
        population: 30,
        jobs: 0,
        electricity: 10,
        water: 9,
        waste: 7,
        happiness: 4,
        pollution: 0,
        color: 0xb8c1c7
    },

    apartmentTower: {
        name: "Apartment Tower",
        category: "Residential",
        cost: 12000,
        width: 2,
        depth: 2,
        population: 75,
        jobs: 0,
        electricity: 24,
        water: 20,
        waste: 16,
        happiness: 5,
        pollution: 0,
        color: 0x8798a3
    },

    shop: {
        name: "Shop",
        category: "Commercial",
        cost: 2500,
        width: 1,
        depth: 1,
        population: 0,
        jobs: 8,
        electricity: 6,
        water: 3,
        waste: 3,
        happiness: 1,
        pollution: 1,
        color: 0xd6a84d
    },

    restaurant: {
        name: "Restaurant",
        category: "Commercial",
        cost: 3500,
        width: 1,
        depth: 1,
        population: 0,
        jobs: 12,
        electricity: 7,
        water: 5,
        waste: 5,
        happiness: 2,
        pollution: 1,
        color: 0xb85f50
    },

    supermarket: {
        name: "Supermarket",
        category: "Commercial",
        cost: 7000,
        width: 2,
        depth: 2,
        population: 0,
        jobs: 25,
        electricity: 14,
        water: 8,
        waste: 10,
        happiness: 2,
        pollution: 2,
        color: 0x668b62
    },

    office: {
        name: "Office",
        category: "Commercial",
        cost: 9000,
        width: 2,
        depth: 2,
        population: 0,
        jobs: 45,
        electricity: 20,
        water: 8,
        waste: 8,
        happiness: 1,
        pollution: 1,
        color: 0x62879c
    },

    warehouse: {
        name: "Warehouse",
        category: "Industrial",
        cost: 5000,
        width: 2,
        depth: 2,
        population: 0,
        jobs: 20,
        electricity: 10,
        water: 5,
        waste: 12,
        happiness: -2,
        pollution: 7,
        color: 0x858585
    },

    factory: {
        name: "Factory",
        category: "Industrial",
        cost: 11000,
        width: 3,
        depth: 2,
        population: 0,
        jobs: 45,
        electricity: 25,
        water: 15,
        waste: 20,
        happiness: -4,
        pollution: 15,
        color: 0x707070
    },

    manufacturing: {
        name: "Manufacturing Plant",
        category: "Industrial",
        cost: 18000,
        width: 3,
        depth: 3,
        population: 0,
        jobs: 75,
        electricity: 40,
        water: 25,
        waste: 30,
        happiness: -5,
        pollution: 25,
        color: 0x626262
    },

    playground: {
        name: "Playground",
        category: "Park",
        cost: 1800,
        width: 1,
        depth: 1,
        radius: 2,
        happinessEffect: 5,
        color: 0x77b85a
    },

    neighborhoodPark: {
        name: "Neighborhood Park",
        category: "Park",
        cost: 3500,
        width: 2,
        depth: 2,
        radius: 4,
        happinessEffect: 10,
        color: 0x62a94e
    },

    sportsPark: {
        name: "Sports Park",
        category: "Park",
        cost: 6500,
        width: 3,
        depth: 3,
        radius: 5,
        happinessEffect: 13,
        color: 0x4d9850
    },

    botanicalGarden: {
        name: "Botanical Garden",
        category: "Park",
        cost: 12000,
        width: 4,
        depth: 4,
        radius: 7,
        happinessEffect: 18,
        color: 0x4e9d62
    },

    cityPark: {
        name: "Large City Park",
        category: "Park",
        cost: 20000,
        width: 5,
        depth: 5,
        radius: 10,
        happinessEffect: 25,
        color: 0x3e914c
    },

    powerPlant: {
        name: "Power Plant",
        category: "Utilities",
        cost: 18000,
        width: 3,
        depth: 3,
        electricitySupply: 150,
        water: 10,
        waste: 5,
        pollution: 15,
        color: 0x795548
    },

    waterPlant: {
        name: "Water Plant",
        category: "Utilities",
        cost: 14000,
        width: 3,
        depth: 3,
        waterSupply: 150,
        electricity: 10,
        waste: 4,
        pollution: 2,
        color: 0x4c83b8
    },

    wastePlant: {
        name: "Waste Facility",
        category: "Utilities",
        cost: 16000,
        width: 3,
        depth: 3,
        wasteSupply: 150,
        electricity: 12,
        water: 5,
        pollution: 10,
        color: 0x777777
    },

    hospital: {
        name: "Hospital",
        category: "Services",
        cost: 22000,
        width: 3,
        depth: 3,
        radius: 7,
        healthEffect: 35,
        electricity: 20,
        water: 15,
        waste: 10,
        color: 0xe5e5e5
    },

    fireStation: {
        name: "Fire Station",
        category: "Services",
        cost: 10000,
        width: 2,
        depth: 2,
        radius: 6,
        fireEffect: 35,
        electricity: 8,
        water: 7,
        waste: 4,
        color: 0xc74a42
    },

    policeStation: {
        name: "Police Station",
        category: "Services",
        cost: 10000,
        width: 2,
        depth: 2,
        radius: 6,
        policeEffect: 35,
        electricity: 8,
        water: 5,
        waste: 4,
        color: 0x456b9d
    },

    school: {
        name: "School",
        category: "Services",
        cost: 13000,
        width: 3,
        depth: 3,
        radius: 7,
        educationEffect: 40,
        electricity: 10,
        water: 8,
        waste: 5,
        color: 0xd3b56e
    }
};

const buildMenuItems = [
    ["house", "🏠", "House"],
    ["townhouse", "🏘️", "Townhouse"],
    ["apartment", "🏢", "Apartment"],
    ["apartmentTower", "🏙️", "Apartment Tower"],
    ["shop", "🛍️", "Shop"],
    ["restaurant", "🍽️", "Restaurant"],
    ["supermarket", "🛒", "Supermarket"],
    ["office", "🏢", "Office"],
    ["warehouse", "🏭", "Warehouse"],
    ["factory", "🏭", "Factory"],
    ["manufacturing", "🏗️", "Manufacturing"],
    ["playground", "🛝", "Playground"],
    ["neighborhoodPark", "🌳", "Neighborhood Park"],
    ["sportsPark", "⚽", "Sports Park"],
    ["botanicalGarden", "🌺", "Botanical Garden"],
    ["cityPark", "🌲", "Large City Park"],
    ["powerPlant", "⚡", "Power Plant"],
    ["waterPlant", "💧", "Water Plant"],
    ["wastePlant", "♻️", "Waste Facility"],
    ["hospital", "🏥", "Hospital"],
    ["fireStation", "🚒", "Fire Station"],
    ["policeStation", "🚓", "Police Station"],
    ["school", "🏫", "School"]
];

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(CITY_SIZE, CITY_SIZE),
    new THREE.MeshStandardMaterial({
        color: 0x79a96b,
        roughness: 1
    })
);

ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const water = new THREE.Mesh(
    new THREE.PlaneGeometry(220, 220),
    new THREE.MeshStandardMaterial({
        color: 0x3d9ed0,
        roughness: 0.25,
        metalness: 0.05
    })
);

water.rotation.x = -Math.PI / 2;
water.position.y = -0.25;
scene.add(water);

function createGrid() {
    const group = new THREE.Group();

    const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.11
    });

    for (let x = -HALF; x <= HALF; x += TILE) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(x, 0.025, -HALF),
            new THREE.Vector3(x, 0.025, HALF)
        ]);
        group.add(new THREE.Line(geometry, material));
    }

    for (let z = -HALF; z <= HALF; z += TILE) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-HALF, 0.025, z),
            new THREE.Vector3(HALF, 0.025, z)
        ]);
        group.add(new THREE.Line(geometry, material));
    }

    scene.add(group);
}

createGrid();

function key(x, z) {
    return `${x},${z}`;
}

function tileToWorld(x, z) {
    return {
        x: x * TILE + TILE / 2,
        z: z * TILE + TILE / 2
    };
}

function worldToTile(worldX, worldZ) {
    return {
        x: Math.floor((worldX + HALF) / TILE) - Math.floor(CITY_SIZE / TILE / 2),
        z: Math.floor((worldZ + HALF) / TILE) - Math.floor(CITY_SIZE / TILE / 2)
    };
}

function tileCenter(x, z) {
    return {
        x: x * TILE + TILE / 2,
        z: z * TILE + TILE / 2
    };
}

function roadExists(x, z) {
    return roads.has(key(x, z));
}

function buildingOccupies(x, z) {
    for (const building of buildings.values()) {
        for (let dx = 0; dx < building.width; dx++) {
            for (let dz = 0; dz < building.depth; dz++) {
                if (building.x + dx === x && building.z + dz === z) {
                    return true;
                }
            }
        }
    }

    return false;
}

function areaFree(x, z, width, depth) {
    for (let dx = 0; dx < width; dx++) {
        for (let dz = 0; dz < depth; dz++) {
            if (
                x + dx < -8 ||
                z + dz < -8 ||
                x + dx > 7 ||
                z + dz > 7
            ) {
                return false;
            }

            if (roadExists(x + dx, z + dz)) {
                return false;
            }

            if (buildingOccupies(x + dx, z + dz)) {
                return false;
            }
        }
    }

    return true;
}

function adjacentToRoad(x, z, width, depth) {
    for (let dx = -1; dx <= width; dx++) {
        if (roadExists(x + dx, z - 1)) return true;
        if (roadExists(x + dx, z + depth)) return true;
    }

    for (let dz = 0; dz < depth; dz++) {
        if (roadExists(x - 1, z + dz)) return true;
        if (roadExists(x + width, z + dz)) return true;
    }

    return false;
}

function createRoadBase(x, z, type) {
    const center = tileCenter(x, z);
    const group = new THREE.Group();

    const roadWidth =
        type === "basic" ? 4.5 :
        type === "avenue" ? 5 :
        type === "major" ? 6 :
        7;

    const road = new THREE.Mesh(
        new THREE.BoxGeometry(roadWidth, 0.18, TILE),
        new THREE.MeshStandardMaterial({
            color:
                type === "basic" ? 0x3e4144 :
                type === "avenue" ? 0x35383b :
                type === "major" ? 0x2f3235 :
                0x26292c,
            roughness: 0.95
        })
    );

    road.position.set(center.x, 0.09, center.z);
    road.receiveShadow = true;
    road.castShadow = true;

    if (type === "basic") {
        road.rotation.y = 0;
    }

    group.add(road);

    const curb = new THREE.Mesh(
        new THREE.BoxGeometry(roadWidth + 0.2, 0.22, TILE),
        new THREE.MeshStandardMaterial({
            color: 0x777777
        })
    );

    curb.position.set(center.x, 0.055, center.z);
    curb.visible = type !== "basic";
    group.add(curb);

    createRoadMarkings(group, x, z, type);

    group.position.y = 0.03;
    scene.add(group);

    return group;
}

function roadConnections(x, z) {
    return {
        n: roadExists(x, z - 1),
        s: roadExists(x, z + 1),
        e: roadExists(x + 1, z),
        w: roadExists(x - 1, z)
    };
}

function createRoadMarkings(group, x, z, type) {
    const c = roadConnections(x, z);
    const material = new THREE.MeshBasicMaterial({
        color: 0xf3d54e
    });

    const lineWidth = type === "highway" ? 0.18 : 0.12;

    const horizontal = new THREE.Mesh(
        new THREE.BoxGeometry(TILE, lineWidth, 0.12),
        material
    );

    horizontal.position.y = 0.13;
    horizontal.position.z = 0;

    const vertical = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, lineWidth, TILE),
        material
    );

    vertical.position.y = 0.14;
    vertical.position.x = 0;

    const count =
        Number(c.n) +
        Number(c.s) +
        Number(c.e) +
        Number(c.w);

    if (count === 0) {
        horizontal.position.z = 0;
        group.add(horizontal);
        return;
    }

    if (count === 1) {
        if (c.n || c.s) {
            group.add(vertical);
        } else {
            group.add(horizontal);
        }
        return;
    }

    if (c.n && c.s && c.e && c.w) {
        group.add(horizontal);
        group.add(vertical);
        return;
    }

    if (c.n && c.s) {
        group.add(vertical);

        if (c.e || c.w) {
            group.add(horizontal);
        }

        return;
    }

    if (c.e && c.w) {
        group.add(horizontal);

        if (c.n || c.s) {
            group.add(vertical);
        }

        return;
    }

    const corner = new THREE.Mesh(
        new THREE.TorusGeometry(
            2.2,
            0.06,
            5,
            16,
            Math.PI / 2
        ),
        material
    );

    corner.rotation.x = Math.PI / 2;
    corner.position.y = 0.15;

    if (c.n && c.e) {
        corner.rotation.z = Math.PI;
    } else if (c.e && c.s) {
        corner.rotation.z = Math.PI / 2;
    } else if (c.s && c.w) {
        corner.rotation.z = 0;
    } else {
        corner.rotation.z = -Math.PI / 2;
    }

    group.add(corner);
}

function rebuildRoad(x, z) {
    const road = roads.get(key(x, z));

    if (!road) return;

    scene.remove(road.object);
    road.object = createRoadBase(x, z, road.type);
}

function updateNearbyRoads(x, z) {
    const positions = [
        [x, z],
        [x - 1, z],
        [x + 1, z],
        [x, z - 1],
        [x, z + 1]
    ];

    for (const [rx, rz] of positions) {
        rebuildRoad(rx, rz);
    }
}

function buildRoad(x, z) {
    if (roads.has(key(x, z))) return;

    if (buildingOccupies(x, z)) {
        showStatus("A building is already here");
        return;
    }

    const data = {
        x,
        z,
        type: "basic",
        object: null
    };

    roads.set(key(x, z), data);
    data.object = createRoadBase(x, z, data.type);

    updateNearbyRoads(x, z);

    money -= 300;
    updateStats();
}

function upgradeRoad(x, z) {
    const road = roads.get(key(x, z));

    if (!road) {
        showStatus("Select a road to upgrade");
        return;
    }

    const order = ["basic", "avenue", "major", "highway"];
    const current = order.indexOf(road.type);

    if (current >= order.length - 1) {
        showStatus("This road is already a highway");
        return;
    }

    const costs = [700, 1400, 3000];

    if (money < costs[current]) {
        showStatus("Not enough money");
        return;
    }

    money -= costs[current];
    road.type = order[current + 1];

    rebuildRoad(x, z);
    updateNearbyRoads(x, z);
    updateStats();
}

function createHouse(type, data) {
    const group = new THREE.Group();

    const width = data.width * TILE - 0.5;
    const depth = data.depth * TILE - 0.5;

    const base = new THREE.Mesh(
        new THREE.BoxGeometry(width, 2.6, depth),
        new THREE.MeshStandardMaterial({
            color: type.color,
            roughness: 0.85
        })
    );

    base.position.y = 1.3;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const roof = new THREE.Mesh(
        new THREE.ConeGeometry(
            Math.max(width, depth) * 0.7,
            2.3,
            4
        ),
        new THREE.MeshStandardMaterial({
            color: 0x75483b
        })
    );

    roof.position.y = 3.7;
    roof.rotation.y = Math.PI / 4;
    roof.scale.z = depth / width;
    roof.castShadow = true;
    group.add(roof);

    addWindows(group, width, depth, 1.8, 2);
    addDoor(group, width, depth);

    return group;
}

function createTownhouse(type, data) {
    const group = new THREE.Group();

    const width = data.width * TILE - 0.5;
    const depth = data.depth * TILE - 0.5;

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, 5.5, depth),
        new THREE.MeshStandardMaterial({
            color: type.color
        })
    );

    body.position.y = 2.75;
    body.castShadow = true;
    group.add(body);

    for (let floor = 0; floor < 2; floor++) {
        addWindows(group, width, depth, 1.7 + floor * 2.1, 2);
    }

    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.2, 0.35, depth + 0.2),
        new THREE.MeshStandardMaterial({
            color: 0x5c514d
        })
    );

    roof.position.y = 5.65;
    group.add(roof);

    addDoor(group, width, depth);

    return group;
}

function createApartment(type, data) {
    const group = new THREE.Group();

    const width = data.width * TILE - 0.35;
    const depth = data.depth * TILE - 0.35;
    const floors = 4;

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, floors * 2.1, depth),
        new THREE.MeshStandardMaterial({
            color: type.color
        })
    );

    body.position.y = floors * 1.05;
    body.castShadow = true;
    group.add(body);

    for (let floor = 0; floor < floors; floor++) {
        addWindows(group, width, depth, 0.75 + floor * 2.1, 4);
    }

    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.25, 0.35, depth + 0.25),
        new THREE.MeshStandardMaterial({
            color: 0x52585c
        })
    );

    roof.position.y = floors * 2.1 + 0.2;
    group.add(roof);

    return group;
}

function createApartmentTower(type, data) {
    const group = new THREE.Group();

    const width = data.width * TILE - 0.3;
    const depth = data.depth * TILE - 0.3;
    const floors = 9;

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, floors * 2.2, depth),
        new THREE.MeshStandardMaterial({
            color: type.color,
            roughness: 0.65
        })
    );

    body.position.y = floors * 1.1;
    body.castShadow = true;
    group.add(body);

    for (let floor = 0; floor < floors; floor++) {
        addWindows(group, width, depth, 0.8 + floor * 2.2, 5);
    }

    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.3, 0.5, depth + 0.3),
        new THREE.MeshStandardMaterial({
            color: 0x454b50
        })
    );

    roof.position.y = floors * 2.2 + 0.25;
    group.add(roof);

    return group;
}

function createShop(type, data) {
    const group = new THREE.Group();

    const width = data.width * TILE - 0.4;
    const depth = data.depth * TILE - 0.4;

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, 3.5, depth),
        new THREE.MeshStandardMaterial({
            color: type.color
        })
    );

    body.position.y = 1.75;
    body.castShadow = true;
    group.add(body);

    const storefront = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.75, 1.35, 0.08),
        new THREE.MeshStandardMaterial({
            color: 0x9bd0df,
            roughness: 0.2
        })
    );

    storefront.position.set(0, 1.35, depth / 2 + 0.05);
    group.add(storefront);

    const sign = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.75, 0.5, 0.12),
        new THREE.MeshStandardMaterial({
            color: 0xf0d85d
        })
    );

    sign.position.set(0, 2.55, depth / 2 + 0.08);
    group.add(sign);

    return group;
}

function createRestaurant(type, data) {
    const group = createShop(type, data);

    const awning = new THREE.Mesh(
        new THREE.BoxGeometry(3.8, 0.18, 0.8),
        new THREE.MeshStandardMaterial({
            color: 0xb83d35
        })
    );

    awning.position.set(0, 2.05, 2.65);
    group.add(awning);

    return group;
}

function createSupermarket(type, data) {
    const group = new THREE.Group();

    const width = data.width * TILE - 0.3;
    const depth = data.depth * TILE - 0.3;

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, 3.8, depth),
        new THREE.MeshStandardMaterial({
            color: type.color
        })
    );

    body.position.y = 1.9;
    body.castShadow = true;
    group.add(body);

    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.2, 0.3, depth + 0.2),
        new THREE.MeshStandardMaterial({
            color: 0xeeeeee
        })
    );

    roof.position.y = 3.9;
    group.add(roof);

    const glass = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.8, 1.3, 0.08),
        new THREE.MeshStandardMaterial({
            color: 0x9fd4e2,
            roughness: 0.2
        })
    );

    glass.position.set(0, 1.35, depth / 2 + 0.05);
    group.add(glass);

    return group;
}

function createOffice(type, data) {
    const group = new THREE.Group();

    const width = data.width * TILE - 0.4;
    const depth = data.depth * TILE - 0.4;
    const floors = 7;

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, floors * 2, depth),
        new THREE.MeshStandardMaterial({
            color: type.color,
            roughness: 0.35,
            metalness: 0.1
        })
    );

    body.position.y = floors;
    body.castShadow = true;
    group.add(body);

    for (let floor = 0; floor < floors; floor++) {
        addWindows(group, width, depth, 0.55 + floor * 2, 5, 0x9bc6d3);
    }

    return group;
}

function createWarehouse(type, data) {
    const group = new THREE.Group();

    const width = data.width * TILE - 0.35;
    const depth = data.depth * TILE - 0.35;

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, 4, depth),
        new THREE.MeshStandardMaterial({
            color: type.color
        })
    );

    body.position.y = 2;
    body.castShadow = true;
    group.add(body);

    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.2, 0.35, depth + 0.2),
        new THREE.MeshStandardMaterial({
            color: 0x4e5355
        })
    );

    roof.position.y = 4.15;
    group.add(roof);

    const door = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 2.3, 0.08),
        new THREE.MeshStandardMaterial({
            color: 0x303438
        })
    );

    door.position.set(0, 1.3, depth / 2 + 0.05);
    group.add(door);

    return group;
}

function createFactory(type, data) {
    const group = createWarehouse(type, data);

    for (let i = -1; i <= 1; i++) {
        const chimney = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.45, 5, 10),
            new THREE.MeshStandardMaterial({
                color: 0x5b5b5b
            })
        );

        chimney.position.set(i * 2.1, 6.5, -1);
        chimney.castShadow = true;
        group.add(chimney);

        createSmoke(group, i * 2.1, 9, -1);
    }

    return group;
}

function createManufacturing(type, data) {
    const group = createFactory(type, data);

    const tank = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, 3.5, 16),
        new THREE.MeshStandardMaterial({
            color: 0x9a9a9a
        })
    );

    tank.position.set(5, 2, -3);
    group.add(tank);

    return group;
}

function createPark(type, data) {
    const group = new THREE.Group();

    const width = data.width * TILE - 0.3;
    const depth = data.depth * TILE - 0.3;

    const grass = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.16, depth),
        new THREE.MeshStandardMaterial({
            color: type.color
        })
    );

    grass.position.y = 0.1;
    grass.receiveShadow = true;
    group.add(grass);

    const treeCount = Math.max(
        3,
        Math.floor(data.width * data.depth * 0.7)
    );

    for (let i = 0; i < treeCount; i++) {
        const tree = createTree();

        tree.position.x =
            (Math.random() - 0.5) * Math.max(1, width - 1);

        tree.position.z =
            (Math.random() - 0.5) * Math.max(1, depth - 1);

        tree.scale.setScalar(0.7 + Math.random() * 0.35);
        group.add(tree);
    }

    if (type.name.includes("Sports")) {
        const field = new THREE.Mesh(
            new THREE.BoxGeometry(width * 0.65, 0.05, depth * 0.55),
            new THREE.MeshStandardMaterial({
                color: 0x3d873f
            })
        );

        field.position.y = 0.2;
        group.add(field);
    }

    if (type.name.includes("Playground")) {
        const equipment = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 1.2, 1.8),
            new THREE.MeshStandardMaterial({
                color: 0xd19b3d
            })
        );

        equipment.position.y = 0.8;
        group.add(equipment);
    }

    if (type.name.includes("Botanical")) {
        for (let i = 0; i < 8; i++) {
            const flower = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 8, 8),
                new THREE.MeshStandardMaterial({
                    color: 0xf1d45c
                })
            );

            flower.position.set(
                (Math.random() - 0.5) * width,
                0.4,
                (Math.random() - 0.5) * depth
            );

            group.add(flower);
        }
    }

    return group;
}

function createUtility(type, data) {
    const group = createWarehouse(type, data);

    const tank = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 3.5, 20),
        new THREE.MeshStandardMaterial({
            color: type.name === "Water Plant" ? 0x5c9ed0 : 0x858585
        })
    );

    tank.position.set(4, 2.2, -3);
    group.add(tank);

    return group;
}

function createHospital(type, data) {
    const group = createOffice(type, data);

    const cross = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 0.25, 0.4),
        new THREE.MeshStandardMaterial({
            color: 0xd84040
        })
    );

    cross.position.set(0, 7.2, 5.05);
    group.add(cross);

    const cross2 = cross.clone();
    cross2.scale.set(0.25, 1, 4.25);
    group.add(cross2);

    return group;
}

function createService(type, data) {
    const group = new THREE.Group();

    const width = data.width * TILE - 0.4;
    const depth = data.depth * TILE - 0.4;

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, 3.5, depth),
        new THREE.MeshStandardMaterial({
            color: type.color
        })
    );

    body.position.y = 1.75;
    body.castShadow = true;
    group.add(body);

    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.2, 0.25, depth + 0.2),
        new THREE.MeshStandardMaterial({
            color: 0x444444
        })
    );

    roof.position.y = 3.65;
    group.add(roof);

    if (type.name === "Fire Station") {
        const garage = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 2.1, 0.12),
            new THREE.MeshStandardMaterial({
                color: 0x383838
            })
        );

        garage.position.set(0, 1.15, depth / 2 + 0.07);
        group.add(garage);
    }

    return group;
}

function createSchool(type, data) {
    const group = new THREE.Group();

    const width = data.width * TILE - 0.4;
    const depth = data.depth * TILE - 0.4;

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, 4.5, depth),
        new THREE.MeshStandardMaterial({
            color: type.color
        })
    );

    body.position.y = 2.25;
    body.castShadow = true;
    group.add(body);

    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.2, 0.3, depth + 0.2),
        new THREE.MeshStandardMaterial({
            color: 0x8d6551
        })
    );

    roof.position.y = 4.65;
    group.add(roof);

    for (let i = -1; i <= 1; i++) {
        const window = new THREE.Mesh(
            new THREE.BoxGeometry(1.1, 1, 0.08),
            new THREE.MeshStandardMaterial({
                color: 0x8cc7d5
            })
        );

        window.position.set(i * 2.5, 2.7, depth / 2 + 0.05);
        group.add(window);
    }

    return group;
}

function addWindows(group, width, depth, y, count, color = 0x92c9d5) {
    const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.25,
        metalness: 0.05
    });

    const spacing = width / (count + 1);

    for (let i = 1; i <= count; i++) {
        const window = new THREE.Mesh(
            new THREE.BoxGeometry(0.55, 0.65, 0.08),
            material
        );

        window.position.set(
            -width / 2 + spacing * i,
            y,
            depth / 2 + 0.04
        );

        group.add(window);

        const back = window.clone();
        back.position.z = -depth / 2 - 0.04;
        group.add(back);
    }
}

function addDoor(group, width, depth) {
    const door = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 1.4, 0.08),
        new THREE.MeshStandardMaterial({
            color: 0x514137
        })
    );

    door.position.set(
        0,
        0.7,
        depth / 2 + 0.05
    );

    group.add(door);
}

function createTree() {
    const group = new THREE.Group();

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.22, 1.4, 8),
        new THREE.MeshStandardMaterial({
            color: 0x70503a
        })
    );

    trunk.position.y = 0.7;
    trunk.castShadow = true;
    group.add(trunk);

    const leaves = new THREE.Mesh(
        new THREE.SphereGeometry(0.9, 8, 6),
        new THREE.MeshStandardMaterial({
            color: 0x438548
        })
    );

    leaves.position.y = 1.7;
    leaves.castShadow = true;
    group.add(leaves);

    return group;
}

function createSmoke(parent, x, y, z) {
    const smoke = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 8, 8),
        new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            transparent: true,
            opacity: 0.35
        })
    );

    smoke.position.set(x, y, z);
    smoke.userData.baseY = y;
    smoke.userData.speed = 0.5 + Math.random() * 0.5;

    parent.add(smoke);
    smokeParticles.push(smoke);
}

function createBuildingObject(type, data) {
    if (
        type.category === "Residential" &&
        type.name === "House"
    ) {
        return createHouse(type, data);
    }

    if (
        type.category === "Residential" &&
        type.name === "Townhouse"
    ) {
        return createTownhouse(type, data);
    }

    if (type.name === "Apartment") {
        return createApartment(type, data);
    }

    if (type.name === "Apartment Tower") {
        return createApartmentTower(type, data);
    }

    if (type.name === "Shop") {
        return createShop(type, data);
    }

    if (type.name === "Restaurant") {
        return createRestaurant(type, data);
    }

    if (type.name === "Supermarket") {
        return createSupermarket(type, data);
    }

    if (type.name === "Office") {
        return createOffice(type, data);
    }

    if (type.name === "Warehouse") {
        return createWarehouse(type, data);
    }

    if (type.name === "Factory") {
        return createFactory(type, data);
    }

    if (type.name === "Manufacturing Plant") {
        return createManufacturing(type, data);
    }

    if (type.category === "Park") {
        return createPark(type, data);
    }

    if (type.category === "Utilities") {
        return createUtility(type, data);
    }

    if (type.name === "Hospital") {
        return createHospital(type, data);
    }

    if (type.name === "School") {
        return createSchool(type, data);
    }

    if (type.category === "Services") {
        return createService(type, data);
    }

    return createHouse(type, data);
}

function getBuildingHeight(type) {
    if (type.name === "House") return 4.8;
    if (type.name === "Townhouse") return 5.9;
    if (type.name === "Apartment") return 8.8;
    if (type.name === "Apartment Tower") return 20;
    if (type.name === "Office") return 14;
    if (type.name === "Hospital") return 15;
    if (type.name === "School") return 5;
    if (type.name === "Factory") return 10;
    if (type.name === "Manufacturing Plant") return 10;
    if (type.name === "Warehouse") return 4.5;
    if (type.category === "Park") return 2.5;
    if (type.category === "Utilities") return 8;
    if (type.category === "Services") return 4.5;
    return 5;
}

function addEffect(data, type) {
    if (!type.radius) return;

    const effect = {
        x: data.x,
        z: data.z,
        radius: type.radius,
        happiness: type.happinessEffect || 0,
        health: type.healthEffect || 0,
        fire: type.fireEffect || 0,
        police: type.policeEffect || 0,
        education: type.educationEffect || 0,
        pollution: type.pollution || 0,
        category: type.category,
        object: null
    };

    effects.push(effect);
}

function createBuilding(typeId, x, z) {
    const type = buildingTypes[typeId];

    if (!type) return;

    if (!areaFree(x, z, type.width, type.depth)) {
        showStatus("That space is occupied");
        return;
    }

    if (
        type.category !== "Park" &&
        type.category !== "Utilities" &&
        type.category !== "Services" &&
        !adjacentToRoad(x, z, type.width, type.depth)
    ) {
        showStatus("Buildings need to connect to a road");
        return;
    }

    if (money < type.cost) {
        showStatus("Not enough money");
        return;
    }

    money -= type.cost;

    const center = tileCenter(
        x + (type.width - 1) / 2,
        z + (type.depth - 1) / 2
    );

    const data = {
        id: `${typeId}-${Date.now()}-${Math.random()}`,
        typeId,
        x,
        z,
        width: type.width,
        depth: type.depth,
        object: null
    };

    const object = createBuildingObject(type, data);

    object.position.set(
        center.x,
        0,
        center.z
    );

    object.scale.y = 0.05;
    scene.add(object);

    data.object = object;
    buildings.set(data.id, data);

    constructionObjects.push({
        object,
        target: 1,
        speed: 2.2
    });

    addEffect(data, type);

    updateStats();
    showStatus(`${type.name} built`);
}

function calculateEffects() {
    let happinessBonus = 0;
    let health = 0;
    let fire = 0;
    let police = 0;
    let education = 0;
    let pollutionEffect = 0;

    services.health.coverage = 0;
    services.fire.coverage = 0;
    services.police.coverage = 0;
    services.education.coverage = 0;

    for (const effect of effects) {
        if (
            effect.category === "Park"
        ) {
            happinessBonus += effect.happiness;
        }

        if (effect.health) {
            health += effect.health;
            services.health.coverage += effect.health;
        }

        if (effect.fire) {
            fire += effect.fire;
            services.fire.coverage += effect.fire;
        }

        if (effect.police) {
            police += effect.police;
            services.police.coverage += effect.police;
        }

        if (effect.education) {
            education += effect.education;
            services.education.coverage += effect.education;
        }

        if (effect.pollution) {
            pollutionEffect += effect.pollution;
        }
    }

    for (const building of buildings.values()) {
        const type = buildingTypes[building.typeId];

        if (!type) continue;

        if (type.category === "Residential") {
            const centerX =
                building.x + (building.width - 1) / 2;

            const centerZ =
                building.z + (building.depth - 1) / 2;

            for (const effect of effects) {
                const dx = centerX - effect.x;
                const dz = centerZ - effect.z;
                const distance = Math.sqrt(
                    dx * dx + dz * dz
                );

                if (distance <= effect.radius) {
                    if (effect.happiness) {
                        happinessBonus +=
                            effect.happiness * 0.12;
                    }

                    if (effect.health) {
                        health += 1;
                    }

                    if (effect.education) {
                        education += 1;
                    }
                }
            }
        }
    }

    return {
        happinessBonus,
        health,
        fire,
        police,
        education,
        pollutionEffect
    };
}

function updateStats() {
    population = 0;
    jobs = 0;

    services.electricity.supply = 0;
    services.electricity.demand = 0;

    services.water.supply = 0;
    services.water.demand = 0;

    services.waste.supply = 0;
    services.waste.demand = 0;

    let baseHappiness = 70;
    let basePollution = 0;

    for (const building of buildings.values()) {
        const type = buildingTypes[building.typeId];

        if (!type) continue;

        population += type.population || 0;
        jobs += type.jobs || 0;

        services.electricity.demand +=
            type.electricity || 0;

        services.water.demand +=
            type.water || 0;

        services.waste.demand +=
            type.waste || 0;

        services.electricity.supply +=
            type.electricitySupply || 0;

        services.water.supply +=
            type.waterSupply || 0;

        services.waste.supply +=
            type.wasteSupply || 0;

        baseHappiness += type.happiness || 0;
        basePollution += type.pollution || 0;
    }

    const effectData = calculateEffects();

    let rating = baseHappiness;

    if (population > 0) {
        rating += effectData.happinessBonus;
    }

    const electricityRatio =
        services.electricity.demand === 0
            ? 1
            : Math.min(
                1,
                services.electricity.supply /
                services.electricity.demand
            );

    const waterRatio =
        services.water.demand === 0
            ? 1
            : Math.min(
                1,
                services.water.supply /
                services.water.demand
            );

    const wasteRatio =
        services.waste.demand === 0
            ? 1
            : Math.min(
                1,
                services.waste.supply /
                services.waste.demand
            );

    const serviceRatio = Math.min(
        electricityRatio,
        waterRatio,
        wasteRatio
    );

    if (serviceRatio < 1) {
        rating -= (1 - serviceRatio) * 40;
    }

    if (services.electricity.supply === 0 &&
        services.electricity.demand > 0) {
        rating -= 20;
    }

    if (services.water.supply === 0 &&
        services.water.demand > 0) {
        rating -= 20;
    }

    if (services.waste.supply === 0 &&
        services.waste.demand > 0) {
        rating -= 15;
    }

    if (services.health.coverage < population * 0.15) {
        rating -= 2;
    }

    if (services.education.coverage < population * 0.1) {
        rating -= 2;
    }

    pollution =
        Math.max(
            0,
            basePollution + effectData.pollutionEffect
        );

    rating -= Math.min(25, pollution * 0.08);

    happiness = Math.max(
        0,
        Math.min(100, Math.round(rating))
    );

    const populationElement =
        document.getElementById("population");

    const happinessElement =
        document.getElementById("happiness");

    const trafficElement =
        document.getElementById("traffic");

    const moneyElement =
        document.getElementById("money");

    const incomeElement =
        document.getElementById("income");

    if (populationElement) {
        populationElement.textContent =
            population.toLocaleString();
    }

    if (happinessElement) {
        happinessElement.textContent =
            `${happiness}%`;
    }

    if (trafficElement) {
        trafficElement.textContent =
            `${Math.min(100, Math.round(
                buildings.size * 2 +
                roads.size * 0.5
            ))}%`;
    }

    if (moneyElement) {
        moneyElement.textContent =
            `$${Math.floor(money).toLocaleString()}`;
    }

    if (incomeElement) {
        const income =
            Math.round(
                population * 3 +
                jobs * 2
            );

        incomeElement.textContent =
            `+$${income}/day`;
    }

    updateServicePanel();
}

function updateServicePanel() {
    let panel = document.getElementById("service-panel");

    if (!panel) {
        panel = document.createElement("div");
        panel.id = "service-panel";

        panel.style.position = "absolute";
        panel.style.right = "18px";
        panel.style.bottom = "18px";
        panel.style.width = "235px";
        panel.style.padding = "14px";
        panel.style.borderRadius = "14px";
        panel.style.background = "rgba(19,25,28,.94)";
        panel.style.border = "1px solid rgba(255,255,255,.12)";
        panel.style.color = "white";
        panel.style.fontSize = "12px";
        panel.style.zIndex = "20";
        panel.style.boxShadow =
            "0 12px 40px rgba(0,0,0,.3)";

        document.getElementById("game").appendChild(panel);
    }

    const electricityPercent =
        services.electricity.demand === 0
            ? 100
            : Math.round(
                Math.min(
                    100,
                    services.electricity.supply /
                    services.electricity.demand *
                    100
                )
            );

    const waterPercent =
        services.water.demand === 0
            ? 100
            : Math.round(
                Math.min(
                    100,
                    services.water.supply /
                    services.water.demand *
                    100
                )
            );

    const wastePercent =
        services.waste.demand === 0
            ? 100
            : Math.round(
                Math.min(
                    100,
                    services.waste.supply /
                    services.waste.demand *
                    100
                )
            );

    panel.innerHTML = `
        <div style="font-weight:800;font-size:14px;margin-bottom:10px">
            CITY SERVICES
        </div>

        <div style="margin:7px 0">
            ⚡ Electricity
            <b style="float:right">
                ${services.electricity.supply}/${services.electricity.demand}
            </b>
        </div>

        <div style="height:5px;background:#30383c;border-radius:5px;overflow:hidden">
            <div style="height:100%;width:${electricityPercent}%;background:#e7c84b"></div>
        </div>

        <div style="margin:10px 0 7px">
            💧 Water
            <b style="float:right">
                ${services.water.supply}/${services.water.demand}
            </b>
        </div>

        <div style="height:5px;background:#30383c;border-radius:5px;overflow:hidden">
            <div style="height:100%;width:${waterPercent}%;background:#58aee0"></div>
        </div>

        <div style="margin:10px 0 7px">
            ♻️ Waste
            <b style="float:right">
                ${services.waste.supply}/${services.waste.demand}
            </b>
        </div>

        <div style="height:5px;background:#30383c;border-radius:5px;overflow:hidden">
            <div style="height:100%;width:${wastePercent}%;background:#8f9b8f"></div>
        </div>

        <div style="margin-top:12px;border-top:1px solid rgba(255,255,255,.08);padding-top:10px">
            🏥 Health coverage:
            ${Math.round(services.health.coverage)}
        </div>

        <div style="margin-top:5px">
            🚒 Fire coverage:
            ${Math.round(services.fire.coverage)}
        </div>

        <div style="margin-top:5px">
            🚓 Police coverage:
            ${Math.round(services.police.coverage)}
        </div>

        <div style="margin-top:5px">
            🎓 Education coverage:
            ${Math.round(services.education.coverage)}
        </div>

        <div style="margin-top:5px">
            ☁️ Pollution:
            ${Math.round(pollution)}
        </div>
    `;
}

function createEffectTiles() {
    for (const effect of effects) {
        if (effect.object) {
            scene.remove(effect.object);
        }

        const group = new THREE.Group();

        const isPark = effect.category === "Park";
        const color = isPark ? 0x52c878 : 0x4e8edb;

        for (
            let dx = -effect.radius;
            dx <= effect.radius;
            dx++
        ) {
            for (
                let dz = -effect.radius;
                dz <= effect.radius;
                dz++
            ) {
                if (
                    Math.sqrt(dx * dx + dz * dz) >
                    effect.radius
                ) {
                    continue;
                }

                const center = tileCenter(
                    effect.x + dx,
                    effect.z + dz
                );

                const tile = new THREE.Mesh(
                    new THREE.PlaneGeometry(
                        TILE - 0.12,
                        TILE - 0.12
                    ),
                    new THREE.MeshBasicMaterial({
                        color,
                        transparent: true,
                        opacity: 0.14,
                        depthWrite: false
                    })
                );

                tile.rotation.x = -Math.PI / 2;
                tile.position.set(
                    center.x,
                    0.065,
                    center.z
                );

                group.add(tile);
            }
        }

        group.visible = false;
        scene.add(group);
        effect.object = group;
    }
}

function toggleEffects() {
    let visible = false;

    for (const effect of effects) {
        if (effect.object) {
            visible = !effect.object.visible;
            break;
        }
    }

    for (const effect of effects) {
        if (effect.object) {
            effect.object.visible = visible;
        }
    }

    showStatus(
        visible
            ? "Coverage shown"
            : "Coverage hidden"
    );
}

function showStatus(message) {
    let status = document.getElementById("build-status");

    if (!status) {
        status = document.createElement("div");
        status.id = "build-status";
        status.className = "build-status";
        document.getElementById("game").appendChild(status);
    }

    status.textContent = message;
    status.classList.add("show");

    clearTimeout(status._timer);

    status._timer = setTimeout(() => {
        status.classList.remove("show");
    }, 1800);
}

function createUI() {
    const topbar = document.createElement("div");
    topbar.className = "city-topbar";

    topbar.innerHTML = `
        <div class="city-title">Cities - Flashcard.com</div>

        <div class="city-stats">

            <div class="stat">
                <div class="stat-label">Money</div>
                <div class="stat-value" id="money">$50,000</div>
            </div>

            <div class="stat">
                <div class="stat-label">Population</div>
                <div class="stat-value" id="population">0</div>
            </div>

            <div class="stat">
                <div class="stat-label">Happiness</div>
                <div class="stat-value" id="happiness">70%</div>
            </div>

            <div class="stat">
                <div class="stat-label">Traffic</div>
                <div class="stat-value" id="traffic">0%</div>
            </div>

            <div class="stat">
                <div class="stat-label">Income</div>
                <div class="stat-value" id="income">+$0/day</div>
            </div>

        </div>
    `;

    document.getElementById("game").appendChild(topbar);

    const buildButton = document.createElement("button");
    buildButton.className = "build-main";
    buildButton.textContent = "BUILD";
    buildButton.id = "build-button";

    document.getElementById("game").appendChild(buildButton);

    const menu = document.createElement("div");
    menu.className = "build-menu";
    menu.id = "build-menu";

    menu.innerHTML = `
        <div class="menu-header">
            <div class="menu-title">Build</div>
            <button class="close-menu" id="close-menu">×</button>
        </div>

        <div class="build-grid" id="build-grid"></div>

        <div class="build-info">
            Click a building, then click a free grid tile next to a road.
            Roads can be upgraded without rebuilding them.
        </div>
    `;

    document.getElementById("game").appendChild(menu);

    const grid = document.getElementById("build-grid");

    for (const [id, icon, name] of buildMenuItems) {
        const type = buildingTypes[id];

        const card = document.createElement("button");
        card.className = "build-card";
        card.dataset.tool = id;

        card.innerHTML = `
            <div class="build-icon">${icon}</div>
            <div class="build-name">${name}</div>
            <div class="build-price">$${type.cost.toLocaleString()}</div>
        `;

        card.addEventListener("click", () => {
            selectedTool = id;

            document.querySelectorAll(".build-card")
                .forEach(el => el.classList.remove("selected"));

            card.classList.add("selected");

            menu.classList.remove("open");
            buildButton.classList.remove("active");

            showStatus(`${name} selected`);
        });

        grid.appendChild(card);
    }

    const tools = document.createElement("div");

    tools.style.position = "absolute";
    tools.style.top = "92px";
    tools.style.left = "18px";
    tools.style.zIndex = "20";
    tools.style.display = "flex";
    tools.style.gap = "7px";

    tools.innerHTML = `
        <button id="road-tool" style="
            border:0;
            padding:10px 13px;
            border-radius:9px;
            background:#263238;
            color:white;
            cursor:pointer;
            font-weight:700;
        ">ROAD</button>

        <button id="upgrade-tool" style="
            border:0;
            padding:10px 13px;
            border-radius:9px;
            background:#263238;
            color:white;
            cursor:pointer;
            font-weight:700;
        ">UPGRADE</button>

        <button id="coverage-tool" style="
            border:0;
            padding:10px 13px;
            border-radius:9px;
            background:#263238;
            color:white;
            cursor:pointer;
            font-weight:700;
        ">COVERAGE</button>
    `;

    document.getElementById("game").appendChild(tools);

    buildButton.addEventListener("click", () => {
        menu.classList.toggle("open");
        buildButton.classList.toggle("active");
    });

    document.getElementById("close-menu")
        .addEventListener("click", () => {
            menu.classList.remove("open");
            buildButton.classList.remove("active");
        });

    document.getElementById("road-tool")
        .addEventListener("click", () => {
            selectedTool = "road";
            showStatus("Road tool selected");
        });

    document.getElementById("upgrade-tool")
        .addEventListener("click", () => {
            selectedTool = "upgrade";
            showStatus("Upgrade tool selected");
        });

    document.getElementById("coverage-tool")
        .addEventListener("click", toggleEffects);
}

createUI();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const hoverMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide
});

const hoverTile = new THREE.Mesh(
    new THREE.PlaneGeometry(TILE - 0.12, TILE - 0.12),
    hoverMaterial
);

hoverTile.rotation.x = -Math.PI / 2;
hoverTile.position.y = 0.08;
hoverTile.visible = false;
scene.add(hoverTile);

const buildPreview = new THREE.Mesh(
    new THREE.BoxGeometry(TILE - 0.25, 0.1, TILE - 0.25),
    new THREE.MeshBasicMaterial({
        color: 0x65b9ff,
        transparent: true,
        opacity: 0.3
    })
);

buildPreview.position.y = 0.12;
buildPreview.visible = false;
scene.add(buildPreview);

function getPointerTile(event) {
    const rect = renderer.domElement.getBoundingClientRect();

    mouse.x =
        ((event.clientX - rect.left) / rect.width) * 2 - 1;

    mouse.y =
        -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersection =
        raycaster.intersectObject(ground, false)[0];

    if (!intersection) return null;

    return worldToTile(
        intersection.point.x,
        intersection.point.z
    );
}

function updateHover(event) {
    const tile = getPointerTile(event);

    if (!tile) {
        hoverTile.visible = false;
        buildPreview.visible = false;
        return;
    }

    hoveredTile = tile;

    const center = tileCenter(tile.x, tile.z);

    hoverTile.position.set(
        center.x,
        0.08,
        center.z
    );

    hoverTile.visible = true;

    if (
        selectedTool &&
        buildingTypes[selectedTool]
    ) {
        const type = buildingTypes[selectedTool];

        const previewCenter = tileCenter(
            tile.x + (type.width - 1) / 2,
            tile.z + (type.depth - 1) / 2
        );

        buildPreview.geometry.dispose();

        buildPreview.geometry =
            new THREE.BoxGeometry(
                type.width * TILE - 0.25,
                0.1,
                type.depth * TILE - 0.25
            );

        buildPreview.position.set(
            previewCenter.x,
            0.13,
            previewCenter.z
        );

        const valid =
            areaFree(
                tile.x,
                tile.z,
                type.width,
                type.depth
            ) &&
            (
                type.category === "Park" ||
                type.category === "Utilities" ||
                type.category === "Services" ||
                adjacentToRoad(
                    tile.x,
                    tile.z,
                    type.width,
                    type.depth
                )
            );

        buildPreview.material.color.set(
            valid ? 0x65c978 : 0xe85b5b
        );

        buildPreview.visible = true;
    } else {
        buildPreview.visible = false;
    }
}

renderer.domElement.addEventListener(
    "pointermove",
    updateHover
);

renderer.domElement.addEventListener(
    "pointerdown",
    event => {
        if (event.button !== 0) return;

        dragging = true;

        const tile = getPointerTile(event);

        if (!tile) return;

        handleTileClick(tile);
        lastBuildTile = tile;
    }
);

renderer.domElement.addEventListener(
    "pointerup",
    () => {
        dragging = false;
        lastBuildTile = null;
    }
);

renderer.domElement.addEventListener(
    "pointerleave",
    () => {
        dragging = false;
        lastBuildTile = null;
    }
);

renderer.domElement.addEventListener(
    "pointermove",
    event => {
        if (!dragging) return;

        if (
            selectedTool !== "road"
        ) {
            return;
        }

        const tile = getPointerTile(event);

        if (!tile) return;

        if (
            !lastBuildTile ||
            tile.x !== lastBuildTile.x ||
            tile.z !== lastBuildTile.z
        ) {
            buildRoad(tile.x, tile.z);
            lastBuildTile = tile;
        }
    }
);

function handleTileClick(tile) {
    if (!selectedTool) {
        return;
    }

    if (selectedTool === "road") {
        buildRoad(tile.x, tile.z);
        return;
    }

    if (selectedTool === "upgrade") {
        upgradeRoad(tile.x, tile.z);
        return;
    }

    if (buildingTypes[selectedTool]) {
        createBuilding(
            selectedTool,
            tile.x,
            tile.z
        );
    }
}

window.addEventListener(
    "keydown",
    event => {
        if (
            event.key.toLowerCase() === "u"
        ) {
            selectedTool = "upgrade";
            showStatus("Upgrade tool selected");
        }

        if (
            event.key === "Escape"
        ) {
            selectedTool = null;
            buildPreview.visible = false;

            document.querySelectorAll(".build-card")
                .forEach(el =>
                    el.classList.remove("selected")
                );

            showStatus("Tool cancelled");
        }
    }
);

function addInitialRoads() {
    for (let x = -6; x <= 6; x++) {
        buildRoad(x, 0);
    }

    for (let z = -4; z <= 4; z++) {
        if (z !== 0) {
            buildRoad(0, z);
        }
    }
}

function addInitialTrees() {
    for (let i = 0; i < 55; i++) {
        const x =
            Math.floor(
                Math.random() * 32
            ) - 16;

        const z =
            Math.floor(
                Math.random() * 32
            ) - 16;

        if (
            Math.abs(x) < 7 &&
            Math.abs(z) < 7
        ) {
            continue;
        }

        if (
            roadExists(x, z) ||
            buildingOccupies(x, z)
        ) {
            continue;
        }

        const tree = createTree();
        const center = tileCenter(x, z);

        tree.position.set(
            center.x,
            0,
            center.z
        );

        tree.scale.setScalar(
            0.7 + Math.random() * 0.6
        );

        scene.add(tree);
        trees.push(tree);
    }
}

addInitialRoads();
addInitialTrees();

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now() * 0.001;

    for (const tree of trees) {
        tree.rotation.z =
            Math.sin(time * 1.2 + tree.position.x) *
            0.025;
    }

    for (const smoke of smokeParticles) {
        smoke.position.y +=
            smoke.userData.speed * 0.008;

        smoke.position.x +=
            Math.sin(time + smoke.position.y) *
            0.002;

        if (
            smoke.position.y >
            smoke.userData.baseY + 3
        ) {
            smoke.position.y =
                smoke.userData.baseY;
        }
    }

    for (const construction of constructionObjects) {
        if (
            construction.object.scale.y <
            construction.target
        ) {
            construction.object.scale.y +=
                construction.speed * 0.016;

            if (
                construction.object.scale.y >
                construction.target
            ) {
                construction.object.scale.y =
                    construction.target;
            }
        }
    }

    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener(
    "resize",
    () => {
        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
    }
);

setInterval(() => {
    const income =
        population * 3 +
        jobs * 2;

    money += income;

    updateStats();
}, 1000);

setInterval(() => {
    createEffectTiles();
}, 500);

updateStats();
animate();

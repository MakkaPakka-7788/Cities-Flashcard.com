import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const TILE = 5;
const MAP_SIZE = 80;
const HALF = MAP_SIZE / 2;
const SAVE_KEY = "citiesFlashcardSaveV4";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fc8eb);
scene.fog = new THREE.Fog(0x8fc8eb, 180, 420);

const camera = new THREE.PerspectiveCamera(
    50,
    innerWidth / innerHeight,
    0.1,
    1000
);

camera.position.set(95, 105, 95);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.getElementById("game").appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 25;
controls.maxDistance = 300;
controls.maxPolarAngle = Math.PI * 0.47;
controls.target.set(0, 0, 0);

const ambient = new THREE.HemisphereLight(0xcfeaff, 0x526342, 2.2);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(80, 140, 50);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.left = -220;
sun.shadow.camera.right = 220;
sun.shadow.camera.top = 220;
sun.shadow.camera.bottom = -220;
scene.add(sun);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const groundGroup = new THREE.Group();
const roadGroup = new THREE.Group();
const buildingGroup = new THREE.Group();
const parkGroup = new THREE.Group();
const treeGroup = new THREE.Group();
const carGroup = new THREE.Group();
const waterGroup = new THREE.Group();
const expansionGroup = new THREE.Group();

scene.add(groundGroup);
scene.add(roadGroup);
scene.add(buildingGroup);
scene.add(parkGroup);
scene.add(treeGroup);
scene.add(carGroup);
scene.add(waterGroup);
scene.add(expansionGroup);

const state = {
    money: 30000,
    population: 0,
    level: 1,
    xp: 0,
    happiness: 72,
    traffic: 0,
    pollution: 0,
    keys: 0,
    electricity: 0,
    electricityCapacity: 0,
    waste: 0,
    wasteCapacity: 0,
    materials: {
        wood: 40,
        steel: 25,
        concrete: 40,
        electronics: 10,
        goods: 0
    },
    roads: new Map(),
    buildings: new Map(),
    cars: [],
    unlockedExpansions: 1,
    quests: [],
    selectedCategory: "residential",
    selectedBuild: null,
    placement: null,
    nextCarTime: 0,
    cityTime: 0,
    lastSave: 0
};

const unlockedAreas = [
    { id: 1, name: "Starting District", x: 0, z: 0 },
    { id: 2, name: "Northern Plains", x: 0, z: -100 },
    { id: 3, name: "Eastern Valley", x: 100, z: 0 },
    { id: 4, name: "Western Woods", x: -100, z: 0 },
    { id: 5, name: "Southern Coast", x: 0, z: 100 },
    { id: 6, name: "Mountain District", x: 100, z: -100 },
    { id: 7, name: "Harbour District", x: 100, z: 100 },
    { id: 8, name: "Industrial Plains", x: -100, z: 100 }
];

const BUILDINGS = [
    {
        id: "house",
        name: "House",
        category: "residential",
        cost: 700,
        w: 1,
        d: 1,
        population: 4,
        jobs: 0,
        power: 2,
        waste: 1,
        pollution: 0,
        upgrade: true
    },
    {
        id: "townhouse",
        name: "Townhouse",
        category: "residential",
        cost: 1600,
        w: 1,
        d: 2,
        population: 10,
        jobs: 0,
        power: 4,
        waste: 2,
        pollution: 0,
        upgrade: true
    },
    {
        id: "apartment",
        name: "Apartment",
        category: "residential",
        cost: 4500,
        w: 2,
        d: 2,
        population: 35,
        jobs: 0,
        power: 10,
        waste: 5,
        pollution: 0,
        upgrade: true
    },
    {
        id: "highrise",
        name: "High Rise",
        category: "residential",
        cost: 12000,
        w: 2,
        d: 3,
        population: 100,
        jobs: 0,
        power: 28,
        waste: 14,
        pollution: 0,
        unlock: 8,
        upgrade: true
    },

    {
        id: "shop",
        name: "Local Shop",
        category: "commercial",
        cost: 2200,
        w: 1,
        d: 1,
        jobs: 8,
        power: 3,
        waste: 2,
        pollution: 1,
        materials: { wood: 2, concrete: 2 },
        goodsNeeded: 3,
        income: 35
    },
    {
        id: "supermarket",
        name: "Supermarket",
        category: "commercial",
        cost: 6500,
        w: 2,
        d: 2,
        jobs: 28,
        power: 8,
        waste: 6,
        pollution: 2,
        materials: { concrete: 5, steel: 3, electronics: 1 },
        goodsNeeded: 10,
        income: 100
    },
    {
        id: "restaurant",
        name: "Restaurant",
        category: "commercial",
        cost: 4200,
        w: 1,
        d: 2,
        jobs: 16,
        power: 5,
        waste: 4,
        pollution: 2,
        materials: { wood: 3, concrete: 2 },
        goodsNeeded: 6,
        income: 70
    },
    {
        id: "shopping",
        name: "Shopping Centre",
        category: "commercial",
        cost: 16000,
        w: 3,
        d: 3,
        jobs: 75,
        power: 22,
        waste: 15,
        pollution: 4,
        materials: { concrete: 15, steel: 10, electronics: 5 },
        goodsNeeded: 30,
        income: 260,
        unlock: 7
    },

    {
        id: "basicFactory",
        name: "Wood Factory",
        category: "industrial",
        cost: 3500,
        w: 2,
        d: 2,
        jobs: 30,
        power: 12,
        waste: 8,
        pollution: 18,
        production: {
            type: "wood",
            amount: 10,
            seconds: 18
        }
    },
    {
        id: "steelFactory",
        name: "Steel Factory",
        category: "industrial",
        cost: 7000,
        w: 2,
        d: 2,
        jobs: 50,
        power: 20,
        waste: 13,
        pollution: 30,
        production: {
            type: "steel",
            amount: 8,
            seconds: 28
        },
        unlock: 4
    },
    {
        id: "concreteFactory",
        name: "Concrete Plant",
        category: "industrial",
        cost: 6000,
        w: 2,
        d: 2,
        jobs: 45,
        power: 15,
        waste: 11,
        pollution: 22,
        production: {
            type: "concrete",
            amount: 12,
            seconds: 22
        },
        unlock: 3
    },
    {
        id: "electronicsFactory",
        name: "Electronics Factory",
        category: "industrial",
        cost: 14000,
        w: 3,
        d: 2,
        jobs: 90,
        power: 30,
        waste: 16,
        pollution: 10,
        production: {
            type: "electronics",
            amount: 5,
            seconds: 30
        },
        unlock: 8
    },

    {
        id: "smallPark",
        name: "Neighbourhood Park",
        category: "parks",
        cost: 900,
        w: 1,
        d: 1,
        happiness: 5,
        radius: 18
    },
    {
        id: "playground",
        name: "Playground",
        category: "parks",
        cost: 1400,
        w: 1,
        d: 1,
        happiness: 7,
        radius: 20
    },
    {
        id: "sportsField",
        name: "Sports Field",
        category: "parks",
        cost: 3000,
        w: 2,
        d: 3,
        happiness: 11,
        radius: 28
    },
    {
        id: "basketball",
        name: "Basketball Court",
        category: "parks",
        cost: 1800,
        w: 1,
        d: 2,
        happiness: 8,
        radius: 22
    },
    {
        id: "tennis",
        name: "Tennis Courts",
        category: "parks",
        cost: 2500,
        w: 2,
        d: 2,
        happiness: 9,
        radius: 24
    },
    {
        id: "dogPark",
        name: "Dog Park",
        category: "parks",
        cost: 1600,
        w: 1,
        d: 1,
        happiness: 7,
        radius: 20
    },
    {
        id: "skatePark",
        name: "Skate Park",
        category: "parks",
        cost: 2500,
        w: 2,
        d: 2,
        happiness: 10,
        radius: 24
    },
    {
        id: "garden",
        name: "Community Garden",
        category: "parks",
        cost: 1900,
        w: 2,
        d: 2,
        happiness: 9,
        radius: 25
    },
    {
        id: "plaza",
        name: "City Plaza",
        category: "parks",
        cost: 4500,
        w: 2,
        d: 2,
        happiness: 14,
        radius: 30
    },
    {
        id: "botanical",
        name: "Botanical Garden",
        category: "parks",
        cost: 9000,
        w: 3,
        d: 3,
        happiness: 20,
        radius: 42,
        unlock: 5
    },
    {
        id: "lakePark",
        name: "Lake Park",
        category: "parks",
        cost: 7500,
        w: 4,
        d: 3,
        happiness: 18,
        radius: 38,
        unlock: 6
    },
    {
        id: "forestPark",
        name: "Forest Park",
        category: "parks",
        cost: 6000,
        w: 4,
        d: 4,
        happiness: 17,
        radius: 42,
        unlock: 4
    },

    {
        id: "powerPlant",
        name: "Power Plant",
        category: "utilities",
        cost: 9000,
        w: 2,
        d: 2,
        powerCapacity: 220,
        pollution: 12
    },
    {
        id: "solarPlant",
        name: "Solar Plant",
        category: "utilities",
        cost: 13000,
        w: 3,
        d: 2,
        powerCapacity: 300,
        pollution: 0,
        unlock: 5
    },
    {
        id: "wastePlant",
        name: "Waste Processing Plant",
        category: "utilities",
        cost: 8000,
        w: 2,
        d: 2,
        wasteCapacity: 220,
        pollution: 4
    },
    {
        id: "recycling",
        name: "Recycling Centre",
        category: "utilities",
        cost: 11000,
        w: 2,
        d: 2,
        wasteCapacity: 350,
        pollution: 1,
        unlock: 6
    },

    {
        id: "school",
        name: "School",
        category: "services",
        cost: 6000,
        w: 2,
        d: 2,
        jobs: 20,
        power: 8,
        waste: 5,
        happiness: 6
    },
    {
        id: "hospital",
        name: "Hospital",
        category: "services",
        cost: 14000,
        w: 3,
        d: 2,
        jobs: 55,
        power: 18,
        waste: 10,
        happiness: 9,
        unlock: 4
    },
    {
        id: "fire",
        name: "Fire Station",
        category: "services",
        cost: 5500,
        w: 2,
        d: 1,
        jobs: 18,
        power: 5,
        waste: 3,
        happiness: 4
    },
    {
        id: "police",
        name: "Police Station",
        category: "services",
        cost: 6000,
        w: 2,
        d: 1,
        jobs: 20,
        power: 5,
        waste: 3,
        happiness: 5
    },

    {
        id: "busDepot",
        name: "Bus Depot",
        category: "transport",
        cost: 7500,
        w: 2,
        d: 2,
        jobs: 20,
        power: 6,
        waste: 4
    },
    {
        id: "trainStation",
        name: "Train Station",
        category: "transport",
        cost: 16000,
        w: 3,
        d: 2,
        jobs: 40,
        power: 14,
        waste: 7,
        unlock: 7
    },

    {
        id: "cityHall",
        name: "City Hall",
        category: "landmarks",
        cost: 18000,
        w: 3,
        d: 3,
        jobs: 40,
        power: 12,
        waste: 7,
        happiness: 8,
        unlock: 3
    },
    {
        id: "stadium",
        name: "Stadium",
        category: "landmarks",
        cost: 30000,
        w: 5,
        d: 4,
        jobs: 100,
        power: 30,
        waste: 20,
        happiness: 16,
        unlock: 10
    }
];

const QUESTS = [
    {
        id: "firstfactory",
        title: "Industrial Start",
        text: "Build your first factory.",
        reward: 1,
        test: () => countCategory("industrial") >= 1
    },
    {
        id: "firstshop",
        title: "Open For Business",
        text: "Build your first shop.",
        reward: 1,
        test: () => countCategory("commercial") >= 1
    },
    {
        id: "population100",
        title: "Growing Community",
        text: "Reach 100 population.",
        reward: 2,
        test: () => state.population >= 100
    },
    {
        id: "power",
        title: "Keep The Lights On",
        text: "Build a power plant.",
        reward: 1,
        test: () => countBuilding("powerPlant") + countBuilding("solarPlant") >= 1
    },
    {
        id: "waste",
        title: "Clean City",
        text: "Build a waste processing plant.",
        reward: 1,
        test: () => countBuilding("wastePlant") + countBuilding("recycling") >= 1
    },
    {
        id: "parks",
        title: "Green City",
        text: "Build 5 parks.",
        reward: 2,
        test: () => countCategory("parks") >= 5
    },
    {
        id: "population500",
        title: "Busy City",
        text: "Reach 500 population.",
        reward: 3,
        test: () => state.population >= 500
    }
];

const quests = new Map();

for (const q of QUESTS) {
    quests.set(q.id, {
        id: q.id,
        completed: false,
        claimed: false
    });
}

function key(gx, gz) {
    return `${gx},${gz}`;
}

function worldX(gx) {
    return gx * TILE + TILE / 2;
}

function worldZ(gz) {
    return gz * TILE + TILE / 2;
}

function gridFromWorld(x, z) {
    return {
        gx: Math.floor(x / TILE),
        gz: Math.floor(z / TILE)
    };
}

function makeMaterial(color, roughness = 0.8) {
    return new THREE.MeshStandardMaterial({
        color,
        roughness
    });
}

const materials = {
    grass: makeMaterial(0x5d934d),
    grass2: makeMaterial(0x6ca758),
    road: makeMaterial(0x34373b),
    roadLine: makeMaterial(0xd9d5a5),
    water: new THREE.MeshStandardMaterial({
        color: 0x3d9edb,
        roughness: 0.15,
        metalness: 0.05
    }),
    white: makeMaterial(0xffffff),
    wood: makeMaterial(0x8d5d38),
    steel: makeMaterial(0x6b7076),
    concrete: makeMaterial(0xb4b7b7),
    glass: new THREE.MeshStandardMaterial({
        color: 0x75b9d6,
        roughness: 0.2,
        metalness: 0.1,
        transparent: true,
        opacity: 0.72
    }),
    red: makeMaterial(0xc83d35),
    yellow: makeMaterial(0xf1c644),
    green: makeMaterial(0x3c9d55),
    dark: makeMaterial(0x24282b)
};

function addBox(parent, x, y, z, w, h, d, material, cast = true) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        material
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
}

function addCylinder(parent, x, y, z, radius, height, material) {
    const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, height, 12),
        material
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
}

function createGround() {
    const size = MAP_SIZE * TILE;

    const ground = new THREE.Mesh(
        new THREE.BoxGeometry(size, 1, size),
        materials.grass
    );

    ground.position.y = -0.5;
    ground.receiveShadow = true;
    groundGroup.add(ground);

    for (let gx = -HALF; gx < HALF; gx++) {
        for (let gz = -HALF; gz < HALF; gz++) {
            if (Math.random() < 0.025) {
                const h = 0.3 + Math.random() * 1.5;

                const patch = new THREE.Mesh(
                    new THREE.BoxGeometry(TILE, h, TILE),
                    Math.random() > 0.5
                        ? materials.grass2
                        : materials.grass
                );

                patch.position.set(
                    worldX(gx),
                    h / 2,
                    worldZ(gz)
                );

                patch.receiveShadow = true;
                groundGroup.add(patch);
            }
        }
    }
}

function createWater() {
    for (let gx = -4; gx <= 3; gx++) {
        for (let gz = -HALF; gz < HALF; gz++) {
            if (Math.abs(gz) < 5 || Math.random() < 0.12) {
                const water = new THREE.Mesh(
                    new THREE.BoxGeometry(TILE, 0.35, TILE),
                    materials.water
                );

                water.position.set(
                    worldX(gx),
                    0.05,
                    worldZ(gz)
                );

                water.userData.water = true;
                waterGroup.add(water);
            }
        }
    }
}

function createTree(x, z, scale = 1) {
    const group = new THREE.Group();

    addCylinder(
        group,
        0,
        1.2 * scale,
        0,
        0.25 * scale,
        2.4 * scale,
        materials.wood
    );

    const crown = new THREE.Mesh(
        new THREE.SphereGeometry(1.3 * scale, 10, 8),
        materials.green
    );

    crown.position.y = 2.7 * scale;
    crown.castShadow = true;
    group.add(crown);

    group.position.set(x, 0, z);
    treeGroup.add(group);

    return group;
}

function createTrees() {
    for (let i = 0; i < 260; i++) {
        const gx = Math.floor(Math.random() * MAP_SIZE) - HALF;
        const gz = Math.floor(Math.random() * MAP_SIZE) - HALF;

        if (Math.abs(gx) < 12 && Math.abs(gz) < 12) continue;

        if (gx >= -5 && gx <= 3) continue;

        createTree(
            worldX(gx) + (Math.random() - 0.5) * 2,
            worldZ(gz) + (Math.random() - 0.5) * 2,
            0.65 + Math.random() * 0.55
        );
    }
}

function isExpansionUnlocked(gx, gz) {
    const xArea = Math.floor((gx + HALF) / MAP_SIZE);
    const zArea = Math.floor((gz + HALF) / MAP_SIZE);

    if (xArea === 0 && zArea === 0) return true;

    const id = Math.max(
        1,
        Math.abs(xArea) + Math.abs(zArea) + 1
    );

    return id <= state.unlockedExpansions;
}

function createExpansionBorders() {
    expansionGroup.clear();

    for (let i = 1; i < unlockedAreas.length; i++) {
        const area = unlockedAreas[i];

        const locked = i + 1 > state.unlockedExpansions;

        const size = 80;

        const border = new THREE.Mesh(
            new THREE.BoxGeometry(size, 0.25, size),
            new THREE.MeshStandardMaterial({
                color: locked ? 0x555555 : 0x4f914a,
                transparent: true,
                opacity: locked ? 0.18 : 0.04
            })
        );

        border.position.set(area.x, 0.15, area.z);
        expansionGroup.add(border);

        if (locked) {
            const ring = new THREE.Mesh(
                new THREE.RingGeometry(30, 30.7, 32),
                new THREE.MeshBasicMaterial({
                    color: 0xf0b84b,
                    transparent: true,
                    opacity: 0.75,
                    side: THREE.DoubleSide
                })
            );

            ring.rotation.x = -Math.PI / 2;
            ring.position.set(area.x, 0.25, area.z);
            expansionGroup.add(ring);
        }
    }
}

function roadKey(gx, gz) {
    return key(gx, gz);
}

function roadExists(gx, gz) {
    return state.roads.has(roadKey(gx, gz));
}

function createRoad(gx, gz, type = "basic") {
    if (!isExpansionUnlocked(gx, gz)) return false;

    if (state.roads.has(key(gx, gz))) return false;

    if (gx >= -5 && gx <= 3) return false;

    state.roads.set(key(gx, gz), {
        gx,
        gz,
        type
    });

    rebuildRoad(gx, gz);
    return true;
}

function roadWidth(type) {
    if (type === "avenue") return 4;
    if (type === "major") return 5.8;
    if (type === "highway") return 8;
    return 3.2;
}

function rebuildRoad(gx, gz) {
    const positions = [
        [gx, gz],
        [gx + 1, gz],
        [gx - 1, gz],
        [gx, gz + 1],
        [gx, gz - 1]
    ];

    for (const [x, z] of positions) {
        if (state.roads.has(key(x, z))) {
            redrawRoad(x, z);
        }
    }
}

function redrawRoad(gx, gz) {
    const old = roadGroup.children.filter(
        m => m.userData.gx === gx && m.userData.gz === gz
    );

    for (const mesh of old) {
        roadGroup.remove(mesh);
        mesh.geometry.dispose();
        if (mesh.material.dispose) mesh.material.dispose();
    }

    const road = state.roads.get(key(gx, gz));
    if (!road) return;

    const width = roadWidth(road.type);

    const tile = new THREE.Mesh(
        new THREE.BoxGeometry(TILE, 0.16, TILE),
        materials.road
    );

    tile.position.set(
        worldX(gx),
        0.08,
        worldZ(gz)
    );

    tile.userData.gx = gx;
    tile.userData.gz = gz;
    tile.receiveShadow = true;
    roadGroup.add(tile);

    const neighbours = {
        n: roadExists(gx, gz - 1),
        s: roadExists(gx, gz + 1),
        e: roadExists(gx + 1, gz),
        w: roadExists(gx - 1, gz)
    };

    const directions = [];

    if (neighbours.n) directions.push([0, -1]);
    if (neighbours.s) directions.push([0, 1]);
    if (neighbours.e) directions.push([1, 0]);
    if (neighbours.w) directions.push([-1, 0]);

    if (directions.length === 0) {
        directions.push([0, -1], [0, 1]);
    }

    for (const [dx, dz] of directions) {
        const line = new THREE.Mesh(
            new THREE.BoxGeometry(
                dx !== 0 ? 0.12 : 0.12,
                0.03,
                dz !== 0 ? 1.5 : 1.5
            ),
            materials.roadLine
        );

        line.position.set(
            worldX(gx) + dx * 1.3,
            0.18,
            worldZ(gz) + dz * 1.3
        );

        line.userData.gx = gx;
        line.userData.gz = gz;
        roadGroup.add(line);
    }
}

function rebuildAllRoads() {
    roadGroup.clear();

    for (const road of state.roads.values()) {
        redrawRoad(road.gx, road.gz);
    }
}

function createBuildingModel(item, level = 1) {
    const group = new THREE.Group();

    if (item.category === "residential") {
        if (item.id === "house") {
            addBox(group, 0, 1.2, 0, 3.6, 2.4 + level * 0.3, 3.6, materials.concrete);
            addBox(group, 0, 2.7, 0, 3.9, 0.35, 3.9, materials.red);
            addBox(group, 0, 1.5, 1.86, 1.2, 1.1, 0.1, materials.glass);
            addBox(group, -1.1, 1.5, 1.86, 0.55, 1.1, 0.1, materials.glass);
            addBox(group, 0, 0.55, 1.9, 0.7, 1.1, 0.15, materials.wood);
        }

        if (item.id === "townhouse") {
            for (let i = -1; i <= 1; i++) {
                addBox(group, i * 1.35, 1.5, 0, 1.15, 3, 3.6, materials.concrete);
                addBox(group, i * 1.35, 3.15, 0, 1.25, 0.3, 3.8, materials.red);
            }
        }

        if (item.id === "apartment") {
            const floors = 4 + level;
            addBox(group, 0, floors * 0.8, 0, 8, floors * 1.6, 8, materials.concrete);

            for (let f = 0; f < floors; f++) {
                for (let x = -2.5; x <= 2.5; x += 1.25) {
                    addBox(
                        group,
                        x,
                        0.7 + f * 1.6,
                        4.03,
                        0.7,
                        0.65,
                        0.08,
                        materials.glass,
                        false
                    );
                }
            }
        }

        if (item.id === "highrise") {
            const floors = 9 + level * 2;

            addBox(
                group,
                0,
                floors * 0.75,
                0,
                9,
                floors * 1.5,
                12,
                materials.glass
            );

            for (let f = 0; f < floors; f++) {
                addBox(
                    group,
                    0,
                    0.75 + f * 1.5,
                    6.05,
                    8,
                    0.08,
                    0.08,
                    materials.white,
                    false
                );
            }
        }
    }

    if (item.category === "commercial") {
        if (item.id === "shop") {
            addBox(group, 0, 1.5, 0, 4, 3, 4, materials.concrete);
            addBox(group, 0, 3.2, 0, 4.3, 0.35, 4.3, materials.yellow);
            addBox(group, 0, 1.4, 2.05, 3.1, 1.8, 0.1, materials.glass);
        }

        if (item.id === "supermarket") {
            addBox(group, 0, 2.5, 0, 9, 5, 9, materials.concrete);
            addBox(group, 0, 5.2, 0, 9.3, 0.35, 9.3, materials.yellow);
            for (let x = -3; x <= 3; x += 2) {
                addBox(group, x, 2.3, 4.55, 1.3, 2, 0.08, materials.glass);
            }
        }

        if (item.id === "restaurant") {
            addBox(group, 0, 1.7, 0, 4, 3.4, 8, materials.wood);
            addBox(group, 0, 3.7, 0, 4.3, 0.35, 8.3, materials.red);
            addBox(group, 0, 1.5, 4.05, 3, 1.6, 0.1, materials.glass);
        }

        if (item.id === "shopping") {
            addBox(group, 0, 3, 0, 14, 6, 14, materials.concrete);
            addBox(group, 0, 6.2, 0, 14.5, 0.35, 14.5, materials.glass);

            for (let x = -5; x <= 5; x += 2.5) {
                addBox(group, x, 2.4, 7.05, 1.5, 2, 0.08, materials.glass);
            }
        }
    }

    if (item.category === "industrial") {
        const baseW = item.w * TILE - 0.5;
        const baseD = item.d * TILE - 0.5;

        addBox(group, 0, 2, 0, baseW, 4, baseD, materials.steel);

        addBox(
            group,
            0,
            4.4,
            0,
            baseW + 0.2,
            0.5,
            baseD + 0.2,
            materials.dark
        );

        addCylinder(
            group,
            baseW * 0.25,
            5,
            baseD * 0.25,
            0.45,
            6,
            materials.dark
        );

        addCylinder(
            group,
            -baseW * 0.25,
            4.7,
            -baseD * 0.2,
            0.35,
            5,
            materials.dark
        );
    }

    if (item.category === "parks") {
        const w = item.w * TILE - 0.25;
        const d = item.d * TILE - 0.25;

        addBox(group, 0, 0.08, 0, w, 0.16, d, materials.green, false);

        if (item.id === "smallPark") {
            createParkTree(group, -1.2, -1);
            createParkTree(group, 1.2, 1);
            createBench(group, 0, 0.5);
        }

        if (item.id === "playground") {
            createParkTree(group, -1.6, -1.5);
            addBox(group, 0, 0.7, 0, 2.4, 0.15, 0.15, materials.red);
            addCylinder(group, -1, 0.6, 0, 0.08, 1.2, materials.yellow);
            addCylinder(group, 1, 0.6, 0, 0.08, 1.2, materials.yellow);
        }

        if (item.id === "sportsField") {
            addBox(group, 0, 0.15, 0, w - 1, 0.12, d - 1, materials.green);
            createFieldLines(group, w - 1, d - 1);
        }

        if (item.id === "basketball") {
            addBox(group, 0, 0.15, 0, w - 0.5, 0.12, d - 0.5, materials.dark);
            addBox(group, 0, 1.4, -d / 2 + 0.3, 0.08, 2.6, 0.08, materials.white);
            addBox(group, 0, 2.2, -d / 2 + 0.3, 1.2, 0.08, 0.08, materials.red);
        }

        if (item.id === "tennis") {
            addBox(group, 0, 0.15, 0, w - 0.5, 0.12, d - 0.5, materials.green);
            addBox(group, 0, 0.4, 0, 0.08, 0.5, d - 0.5, materials.white);
        }

        if (item.id === "dogPark") {
            addBox(group, 0, 0.2, 0, w - 0.5, 0.12, d - 0.5, materials.green);
            addCylinder(group, -1, 0.6, 0, 0.08, 1.2, materials.wood);
            addCylinder(group, 1, 0.6, 0, 0.08, 1.2, materials.wood);
        }

        if (item.id === "skatePark") {
            addBox(group, 0, 0.18, 0, w - 0.4, 0.12, d - 0.4, materials.concrete);
            addBox(group, 0, 0.5, 0, 2, 0.35, 0.8, materials.concrete);
            addBox(group, 0, 0.35, 1, 3, 0.2, 0.5, materials.concrete);
        }

        if (item.id === "garden") {
            for (let x = -2; x <= 2; x += 1.2) {
                for (let z = -2; z <= 2; z += 1.2) {
                    addBox(group, x, 0.3, z, 0.8, 0.25, 0.8, materials.wood);
                    addCylinder(group, x, 0.55, z, 0.2, 0.5, materials.green);
                }
            }
        }

        if (item.id === "plaza") {
            addBox(group, 0, 0.15, 0, w, 0.2, d, materials.concrete);
            addCylinder(group, 0, 0.6, 0, 1.2, 0.9, materials.water);
            for (let i = 0; i < 4; i++) {
                const a = i * Math.PI / 2;
                createBench(group, Math.cos(a) * 3, Math.sin(a) * 3);
            }
        }

        if (item.id === "botanical") {
            for (let i = 0; i < 12; i++) {
                createParkTree(
                    group,
                    -5 + Math.random() * 10,
                    -5 + Math.random() * 10
                );
            }
        }

        if (item.id === "lakePark") {
            const lake = new THREE.Mesh(
                new THREE.CylinderGeometry(
                    Math.min(w, d) * 0.3,
                    Math.min(w, d) * 0.3,
                    0.15,
                    24
                ),
                materials.water
            );

            lake.position.y = 0.2;
            group.add(lake);

            for (let i = 0; i < 7; i++) {
                createParkTree(
                    group,
                    -5 + Math.random() * 10,
                    -5 + Math.random() * 7
                );
            }
        }

        if (item.id === "forestPark") {
            for (let i = 0; i < 18; i++) {
                createParkTree(
                    group,
                    -8 + Math.random() * 16,
                    -8 + Math.random() * 16
                );
            }
        }
    }

    if (item.category === "utilities") {
        addBox(
            group,
            0,
            2,
            0,
            item.w * TILE - 0.5,
            4,
            item.d * TILE - 0.5,
            item.id === "solarPlant"
                ? materials.concrete
                : materials.steel
        );

        if (item.id === "powerPlant") {
            addCylinder(group, 0, 5, 0, 0.8, 5, materials.dark);
        }

        if (item.id === "solarPlant") {
            for (let x = -4; x <= 4; x += 2) {
                addBox(group, x, 0.7, 0, 1.5, 0.15, 2.5, materials.glass);
            }
        }

        if (item.id === "wastePlant" || item.id === "recycling") {
            addCylinder(group, 0, 3, 0, 1.2, 2.5, materials.dark);
        }
    }

    if (item.category === "services") {
        addBox(
            group,
            0,
            2,
            0,
            item.w * TILE - 0.4,
            4,
            item.d * TILE - 0.4,
            materials.concrete
        );

        addBox(
            group,
            0,
            4.2,
            0,
            item.w * TILE,
            0.35,
            item.d * TILE,
            item.id === "hospital"
                ? materials.white
                : materials.red
        );
    }

    if (item.category === "transport") {
        addBox(
            group,
            0,
            1.8,
            0,
            item.w * TILE - 0.4,
            3.6,
            item.d * TILE - 0.4,
            materials.concrete
        );

        if (item.id === "busDepot") {
            addBox(group, 0, 1, 3, 5, 1.8, 2, materials.yellow);
        }

        if (item.id === "trainStation") {
            addBox(group, 0, 1, 3, 10, 1.8, 2, materials.glass);
        }
    }

    if (item.category === "landmarks") {
        addBox(
            group,
            0,
            3,
            0,
            item.w * TILE - 0.3,
            6,
            item.d * TILE - 0.3,
            materials.concrete
        );

        if (item.id === "cityHall") {
            addBox(group, 0, 6.3, 0, 10, 0.5, 10, materials.red);
        }

        if (item.id === "stadium") {
            addCylinder(group, 0, 2, 0, 8, 4, materials.concrete);
            addCylinder(group, 0, 4.1, 0, 6.5, 0.5, materials.green);
        }
    }

    return group;
}

function createParkTree(parent, x, z) {
    const tree = new THREE.Group();

    addCylinder(
        tree,
        0,
        0.8,
        0,
        0.15,
        1.6,
        materials.wood
    );

    const crown = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 8, 7),
        materials.green
    );

    crown.position.y = 1.7;
    crown.castShadow = true;
    tree.add(crown);

    tree.position.set(x, 0, z);
    parent.add(tree);
}

function createBench(parent, x, z) {
    addBox(
        parent,
        x,
        0.45,
        z,
        1.6,
        0.15,
        0.4,
        materials.wood
    );
}

function createFieldLines(parent, w, d) {
    addBox(parent, 0, 0.25, -d / 2, w, 0.03, 0.08, materials.white);
    addBox(parent, 0, 0.25, d / 2, w, 0.03, 0.08, materials.white);
    addBox(parent, 0, 0.25, 0, 0.08, 0.03, d, materials.white);
}

function occupied(gx, gz, w, d, ignoreKey = null) {
    for (let x = 0; x < w; x++) {
        for (let z = 0; z < d; z++) {
            const k = key(gx + x, gz + z);

            if (ignoreKey && k === ignoreKey) continue;

            if (state.buildings.has(k)) return true;
            if (state.roads.has(k)) return true;
        }
    }

    return false;
}

function waterAt(gx, gz) {
    const x = worldX(gx);
    const z = worldZ(gz);

    return Math.abs(
        Math.floor(x / TILE)
    ) <= 3;
}

function canPlace(item, gx, gz) {
    if (!isExpansionUnlocked(gx, gz)) {
        showStatus("This area is locked. Complete quests to earn Keys.");
        return false;
    }

    if (gx < -HALF || gx + item.w > HALF) {
        return false;
    }

    if (gz < -HALF || gz + item.d > HALF) {
        return false;
    }

    for (let x = 0; x < item.w; x++) {
        for (let z = 0; z < item.d; z++) {
            if (waterAt(gx + x, gz + z)) {
                showStatus("You cannot build in the river.");
                return false;
            }
        }
    }

    if (occupied(gx, gz, item.w, item.d)) {
        showStatus("That tile is already occupied.");
        return false;
    }

    return true;
}

function factoryLimit() {
    if (state.level >= 15) return 5;
    if (state.level >= 10) return 4;
    if (state.level >= 7) return 3;
    if (state.level >= 4) return 2;
    return 1;
}

function canBuildFactory() {
    return countCategory("industrial") < factoryLimit();
}

function constructionMaterials(item) {
    if (item.category === "residential") {
        return {
            wood: item.w * item.d * 2,
            concrete: item.w * item.d * 3,
            steel: item.id === "highrise" ? 5 : 1
        };
    }

    if (item.category === "commercial") {
        return {
            wood: 3,
            concrete: 5,
            steel: 2
        };
    }

    return {};
}

function hasMaterials(cost) {
    for (const type in cost) {
        if ((state.materials[type] || 0) < cost[type]) {
            return false;
        }
    }

    return true;
}

function consumeMaterials(cost) {
    for (const type in cost) {
        state.materials[type] -= cost[type];
    }
}

function addBuilding(item, gx, gz) {
    if (!canPlace(item, gx, gz)) return;

    if (item.factory && !canBuildFactory()) {
        showStatus(`Factory limit reached: ${factoryLimit()}`);
        return;
    }

    if (state.money < item.cost) {
        showStatus("Not enough money.");
        return;
    }

    if (item.unlock && state.level < item.unlock) {
        showStatus(`Unlocks at city level ${item.unlock}.`);
        return;
    }

    const materialCost = constructionMaterials(item);

    if (!hasMaterials(materialCost)) {
        showStatus("You need more factory materials to build this.");
        return;
    }

    state.money -= item.cost;
    consumeMaterials(materialCost);

    const id = `${Date.now()}-${Math.random()}`;

    const building = {
        uid: id,
        id: item.id,
        gx,
        gz,
        level: 1,
        productionStarted: 0,
        productionEnds: 0,
        goods: 0,
        construction: 1
    };

    state.buildings.set(key(gx, gz), building);

    const model = createBuildingModel(item, 1);

    model.position.set(
        worldX(gx) + item.w * TILE / 2 - TILE / 2,
        0,
        worldZ(gz) + item.d * TILE / 2 - TILE / 2
    );

    model.scale.set(0.1, 0.1, 0.1);
    model.userData.buildingKey = key(gx, gz);
    model.userData.uid = id;

    building.model = model;

    buildingGroup.add(model);

    let frame = 0;

    const grow = () => {
        frame += 0.08;
        const s = Math.min(1, frame);

        if (building.model) {
            building.model.scale.set(
                s,
                s,
                s
            );
        }

        if (s < 1) requestAnimationFrame(grow);
    };

    grow();

    addXP(item.category === "parks" ? 40 : 80);

    showStatus(`${item.name} built.`);
    saveGame();
}

function rebuildBuilding(building) {
    const item = getBuildingType(building.id);
    if (!item) return;

    if (building.model) {
        buildingGroup.remove(building.model);
    }

    const model = createBuildingModel(item, building.level);

    model.position.set(
        worldX(building.gx) + item.w * TILE / 2 - TILE / 2,
        0,
        worldZ(building.gz) + item.d * TILE / 2 - TILE / 2
    );

    model.userData.buildingKey =
        key(building.gx, building.gz);

    model.userData.uid = building.uid;

    building.model = model;
    buildingGroup.add(model);
}

function getBuildingType(id) {
    return BUILDINGS.find(b => b.id === id);
}

function countBuilding(id) {
    let n = 0;

    for (const b of state.buildings.values()) {
        if (b.id === id) n++;
    }

    return n;
}

function countCategory(category) {
    let n = 0;

    for (const b of state.buildings.values()) {
        const item = getBuildingType(b.id);

        if (item && item.category === category) {
            n++;
        }
    }

    return n;
}

function upgradeHouse(building) {
    const item = getBuildingType(building.id);

    if (!item || item.category !== "residential") return;

    const maxLevel =
        building.id === "house" ? 5 :
        building.id === "townhouse" ? 4 :
        building.id === "apartment" ? 5 :
        3;

    if (building.level >= maxLevel) {
        showStatus("This house is fully upgraded.");
        return;
    }

    const materialCost = {
        wood: 5 * building.level,
        concrete: 8 * building.level,
        steel: 2 * building.level
    };

    if (building.level >= 3) {
        materialCost.electronics = 2 * building.level;
    }

    if (!hasMaterials(materialCost)) {
        showStatus("Not enough factory materials for this upgrade.");
        return;
    }

    const cost =
        1000 *
        building.level *
        building.level;

    if (state.money < cost) {
        showStatus("Not enough money.");
        return;
    }

    if (!canCityGrow()) {
        showStatus("The city cannot grow yet. Fix electricity, waste and pollution.");
        return;
    }

    state.money -= cost;
    consumeMaterials(materialCost);

    building.level++;

    rebuildBuilding(building);

    addXP(150);

    showStatus(
        `${item.name} upgraded to level ${building.level}.`
    );

    saveGame();
}

function canCityGrow() {
    const demand = calculatePowerDemand();

    if (state.electricityCapacity < demand) {
        return false;
    }

    const wasteDemand = calculateWasteDemand();

    if (state.wasteCapacity < wasteDemand) {
        return false;
    }

    if (state.pollution > 18) {
        return false;
    }

    return true;
}

function calculatePopulation() {
    let total = 0;

    for (const b of state.buildings.values()) {
        const item = getBuildingType(b.id);

        if (!item || item.category !== "residential") continue;

        total += item.population * b.level;
    }

    return total;
}

function calculateJobs() {
    let total = 0;

    for (const b of state.buildings.values()) {
        const item = getBuildingType(b.id);

        if (item) total += item.jobs || 0;
    }

    return total;
}

function calculatePowerDemand() {
    let total = 0;

    for (const b of state.buildings.values()) {
        const item = getBuildingType(b.id);

        if (item) {
            total += (item.power || 0) * b.level;
        }
    }

    return total;
}

function calculateWasteDemand() {
    let total = 0;

    for (const b of state.buildings.values()) {
        const item = getBuildingType(b.id);

        if (item) {
            total += (item.waste || 0) * b.level;
        }
    }

    return total;
}

function calculatePollution() {
    let total = 0;

    for (const b of state.buildings.values()) {
        const item = getBuildingType(b.id);

        if (item) {
            total += item.pollution || 0;
        }
    }

    return Math.max(0, total);
}

function calculateHappiness() {
    let value = 68;

    const powerDemand = calculatePowerDemand();
    const wasteDemand = calculateWasteDemand();

    if (state.electricityCapacity < powerDemand) {
        value -= 25;
    }

    if (state.wasteCapacity < wasteDemand) {
        value -= 20;
    }

    if (state.pollution > 18) {
        value -= Math.min(25, state.pollution - 18);
    }

    value -= state.traffic * 0.1;

    for (const b of state.buildings.values()) {
        const item = getBuildingType(b.id);

        if (!item) continue;

        if (item.happiness) {
            value += item.happiness * 0.15;
        }

        if (item.category === "parks") {
            value += parkCoverageBonus(b);
        }
    }

    return THREE.MathUtils.clamp(value, 0, 100);
}

function parkCoverageBonus(park) {
    const item = getBuildingType(park.id);

    if (!item || !item.radius) return 0;

    let bonus = 0;

    for (const b of state.buildings.values()) {
        const residential = getBuildingType(b.id);

        if (!residential || residential.category !== "residential") {
            continue;
        }

        const dx =
            worldX(b.gx) -
            (worldX(park.gx) + item.w * TILE / 2 - TILE / 2);

        const dz =
            worldZ(b.gz) -
            (worldZ(park.gz) + item.d * TILE / 2 - TILE / 2);

        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance <= item.radius) {
            bonus += 0.25;
        }
    }

    return Math.min(6, bonus);
}

function updateCity() {
    state.population = calculatePopulation();
    state.pollution = calculatePollution();
    state.happiness = calculateHappiness();
    state.electricity = state.electricityCapacity;
    state.waste = state.wasteCapacity;

    if (canCityGrow() && state.population > 0) {
        const growth =
            Math.max(
                0,
                Math.floor(
                    state.population *
                    0.0008 *
                    (state.happiness / 70)
                )
            );

        state.population += growth;
    }

    state.traffic = Math.min(
        100,
        Math.max(
            0,
            state.population / 8 -
            countCategory("transport") * 8
        )
    );
}

function updateUtilities() {
    let power = 0;
    let waste = 0;

    for (const b of state.buildings.values()) {
        const item = getBuildingType(b.id);

        if (!item) continue;

        power += item.powerCapacity || 0;
        waste += item.wasteCapacity || 0;
    }

    state.electricityCapacity = power;
    state.wasteCapacity = waste;
}

function factoryCanOperate(factory, item) {
    const demand = calculatePowerDemand();

    if (state.electricityCapacity < demand) {
        return false;
    }

    const wasteDemand = calculateWasteDemand();

    if (state.wasteCapacity < wasteDemand) {
        return false;
    }

    return true;
}

function updateFactories(delta) {
    for (const factory of state.buildings.values()) {
        const item = getBuildingType(factory.id);

        if (!item || !item.production) continue;

        if (!factory.productionStarted) {
            if (factoryCanOperate(factory, item)) {
                factory.productionStarted =
                    state.cityTime;

                factory.productionEnds =
                    state.cityTime +
                    item.production.seconds;
            }

            continue;
        }

        if (state.cityTime >= factory.productionEnds) {
            const type = item.production.type;
            const amount = item.production.amount;

            state.materials[type] =
                (state.materials[type] || 0) +
                amount;

            factory.productionStarted = state.cityTime;
            factory.productionEnds =
                state.cityTime +
                item.production.seconds;

            state.money += 30;

            addXP(20);

            showStatus(
                `${item.name} produced ${amount} ${type}.`
            );
        }
    }
}

function updateShops(delta) {
    for (const shop of state.buildings.values()) {
        const item = getBuildingType(shop.id);

        if (!item || item.category !== "commercial") {
            continue;
        }

        if (!shop.goods) shop.goods = 0;

        if (state.materials.goods >= item.goodsNeeded) {
            state.materials.goods -= item.goodsNeeded;
            shop.goods += 1;
        }

        if (shop.goods > 0) {
            shop.goods -= 1;
            state.money += item.income || 0;
            addXP(5);
        }
    }
}

function makeGoodsFromMaterials() {
    const available =
        Math.min(
            Math.floor(state.materials.wood / 2),
            Math.floor(state.materials.steel / 1),
            Math.floor(state.materials.concrete / 2)
        );

    if (available <= 0) return;

    const amount = Math.min(available, 3);

    state.materials.wood -= amount * 2;
    state.materials.steel -= amount;
    state.materials.concrete -= amount * 2;

    state.materials.goods += amount;
}

function updateProduction(delta) {
    makeGoodsFromMaterials();
}

function carColor() {
    const colors = [
        0xe53935,
        0x1976d2,
        0xfbc02d,
        0xeeeeee,
        0x43a047,
        0x7e57c2,
        0x263238
    ];

    return colors[
        Math.floor(Math.random() * colors.length)
    ];
}

function createCar() {
    const roads = [...state.roads.values()];

    if (!roads.length) return;

    const start =
        roads[
            Math.floor(
                Math.random() * roads.length
            )
        ];

    const car = new THREE.Group();

    addBox(
        car,
        0,
        0.65,
        0,
        2.4,
        0.65,
        1.25,
        makeMaterial(carColor())
    );

    addBox(
        car,
        0,
        1.05,
        0,
        1.2,
        0.45,
        1,
        materials.glass
    );

    const wheels = [];

    for (const x of [-0.8, 0.8]) {
        for (const z of [-0.7, 0.7]) {
            const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.28,
                    0.28,
                    0.2,
                    10
                ),
                materials.dark
            );

            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(x, 0.35, z);
            car.add(wheel);
            wheels.push(wheel);
        }
    }

    car.position.set(
        worldX(start.gx),
        0,
        worldZ(start.gz)
    );

    car.userData = {
        gx: start.gx,
        gz: start.gz,
        target: null,
        speed: 8 + Math.random() * 6
    };

    carGroup.add(car);
    state.cars.push(car);
}

function chooseCarTarget(car) {
    const roads = [...state.roads.values()];

    if (!roads.length) return;

    const candidates = roads.filter(
        r =>
            Math.abs(r.gx - car.userData.gx) +
            Math.abs(r.gz - car.userData.gz) <= 5
    );

    if (!candidates.length) {
        car.userData.target =
            roads[
                Math.floor(
                    Math.random() * roads.length
                )
            ];
        return;
    }

    car.userData.target =
        candidates[
            Math.floor(
                Math.random() * candidates.length
            )
        ];
}

function updateCars(delta) {
    if (
        state.population > 20 &&
        state.cityTime > state.nextCarTime
    ) {
        createCar();

        state.nextCarTime =
            state.cityTime +
            5 +
            Math.random() * 8;
    }

    for (let i = state.cars.length - 1; i >= 0; i--) {
        const car = state.cars[i];

        if (!car.parent) {
            state.cars.splice(i, 1);
            continue;
        }

        if (!car.userData.target) {
            chooseCarTarget(car);
        }

        const target = car.userData.target;

        if (!target) continue;

        const tx = worldX(target.gx);
        const tz = worldZ(target.gz);

        const dx = tx - car.position.x;
        const dz = tz - car.position.z;

        const distance =
            Math.sqrt(dx * dx + dz * dz);

        if (distance < 0.7) {
            car.userData.gx = target.gx;
            car.userData.gz = target.gz;
            chooseCarTarget(car);
            continue;
        }

        const angle = Math.atan2(dx, dz);

        car.rotation.y = angle;

        car.position.x +=
            Math.sin(angle) *
            car.userData.speed *
            delta;

        car.position.z +=
            Math.cos(angle) *
            car.userData.speed *
            delta;
    }

    if (state.cars.length > 80) {
        const car = state.cars.shift();

        if (car.parent) {
            car.parent.remove(car);
        }
    }
}

function addXP(amount) {
    state.xp += amount;

    const needed =
        500 +
        state.level * 450;

    if (state.xp >= needed) {
        state.xp -= needed;
        state.level++;

        showStatus(
            `City reached level ${state.level}!`
        );

        createExpansionBorders();
    }
}

function checkQuests() {
    for (const q of QUESTS) {
        const progress = quests.get(q.id);

        if (!progress || progress.completed) continue;

        if (q.test()) {
            progress.completed = true;
            progress.claimed = false;

            state.keys += q.reward;

            showStatus(
                `Quest complete: ${q.title} +${q.reward} Key`
            );

            saveGame();
        }
    }
}

function unlockNextArea() {
    if (
        state.keys <= 0 ||
        state.unlockedExpansions >= unlockedAreas.length
    ) {
        return;
    }

    state.keys--;

    state.unlockedExpansions++;

    createExpansionBorders();

    showStatus(
        `New map area unlocked: ${unlockedAreas[state.unlockedExpansions - 1].name}`
    );

    addXP(300);
    saveGame();
}

function createUI() {
    const ui = document.createElement("div");

    ui.innerHTML = `
        <div class="city-topbar">
            <div class="city-title">Cities - Flashcard.com</div>

            <div class="city-stats">
                <div class="stat">
                    <div class="stat-label">Population</div>
                    <div class="stat-value" id="population">0</div>
                </div>

                <div class="stat">
                    <div class="stat-label">Money</div>
                    <div class="stat-value" id="money">$0</div>
                </div>

                <div class="stat">
                    <div class="stat-label">Happiness</div>
                    <div class="stat-value" id="happiness">0%</div>
                </div>

                <div class="stat">
                    <div class="stat-label">Power</div>
                    <div class="stat-value" id="power">0 / 0</div>
                </div>

                <div class="stat">
                    <div class="stat-label">Waste</div>
                    <div class="stat-value" id="waste">0 / 0</div>
                </div>

                <div class="stat">
                    <div class="stat-label">Keys</div>
                    <div class="stat-value" id="keys">0</div>
                </div>
            </div>
        </div>

        <div id="city-panel"></div>

        <button class="build-main" id="build-button">
            BUILD
        </button>

        <div class="build-menu" id="build-menu">
            <div class="menu-header">
                <div class="menu-title">City Construction</div>
                <button class="close-menu" id="close-build">×</button>
            </div>

            <div id="category-buttons"></div>
            <div class="build-grid" id="build-grid"></div>

            <div class="build-info">
                Click an item, then click a tile on the map.
                Buildings snap directly to the tile grid.
            </div>
        </div>

        <div class="build-status" id="build-status"></div>

        <div id="material-panel"></div>

        <div id="quest-panel"></div>
    `;

    document.getElementById("game").appendChild(ui);

    const menu = document.getElementById("build-menu");

    document.getElementById("build-button").onclick = () => {
        menu.classList.toggle("open");
        document
            .getElementById("build-button")
            .classList.toggle(
                "active",
                menu.classList.contains("open")
            );
    };

    document.getElementById("close-build").onclick = () => {
        menu.classList.remove("open");

        document
            .getElementById("build-button")
            .classList.remove("active");

        state.selectedBuild = null;
    };

    createCategories();
    updateBuildMenu();
}

const categories = [
    ["residential", "Residential"],
    ["commercial", "Shops"],
    ["industrial", "Factories"],
    ["parks", "Parks"],
    ["utilities", "Utilities"],
    ["services", "Services"],
    ["transport", "Transport"],
    ["landmarks", "Landmarks"],
    ["roads", "Roads"]
];

function createCategories() {
    const holder =
        document.getElementById("category-buttons");

    holder.style.display = "flex";
    holder.style.flexWrap = "wrap";
    holder.style.gap = "7px";
    holder.style.marginBottom = "12px";

    for (const [id, name] of categories) {
        const button =
            document.createElement("button");

        button.textContent = name;

        button.style.border = "0";
        button.style.padding = "8px 12px";
        button.style.borderRadius = "8px";
        button.style.background = "#303a3f";
        button.style.color = "white";
        button.style.cursor = "pointer";

        button.onclick = () => {
            state.selectedCategory = id;
            updateBuildMenu();
        };

        holder.appendChild(button);
    }
}

function updateBuildMenu() {
    const grid =
        document.getElementById("build-grid");

    grid.innerHTML = "";

    if (state.selectedCategory === "roads") {
        addBuildCard({
            id: "roadBasic",
            name: "Road",
            cost: 150,
            w: 1,
            d: 1,
            road: "basic"
        });

        addBuildCard({
            id: "roadAvenue",
            name: "Avenue",
            cost: 450,
            w: 1,
            d: 1,
            road: "avenue",
            unlock: 4
        });

        addBuildCard({
            id: "roadMajor",
            name: "Major Road",
            cost: 1000,
            w: 1,
            d: 1,
            road: "major",
            unlock: 7
        });

        addBuildCard({
            id: "roadHighway",
            name: "Highway",
            cost: 2500,
            w: 1,
            d: 1,
            road: "highway",
            unlock: 12
        });

        return;
    }

    for (const item of BUILDINGS) {
        if (item.category !== state.selectedCategory) {
            continue;
        }

        addBuildCard(item);
    }
}

function addBuildCard(item) {
    const card =
        document.createElement("button");

    card.className = "build-card";

    const icon =
        document.createElement("div");

    icon.className = "build-icon";

    icon.textContent =
        item.category === "parks" ? "🌳" :
        item.category === "industrial" ? "🏭" :
        item.category === "commercial" ? "🏪" :
        item.category === "residential" ? "🏠" :
        item.category === "utilities" ? "⚡" :
        item.category === "services" ? "🏥" :
        item.category === "transport" ? "🚌" :
        item.category === "landmarks" ? "🏙️" :
        "🛣️";

    const name =
        document.createElement("div");

    name.className = "build-name";
    name.textContent = item.name;

    const price =
        document.createElement("div");

    price.className = "build-price";

    price.textContent =
        item.road
            ? `$${item.cost}`
            : `$${item.cost}`;

    card.appendChild(icon);
    card.appendChild(name);
    card.appendChild(price);

    card.onclick = () => {
        if (item.unlock && state.level < item.unlock) {
            showStatus(
                `Unlocks at city level ${item.unlock}.`
            );
            return;
        }

        state.selectedBuild = item;

        document
            .querySelectorAll(".build-card")
            .forEach(c =>
                c.classList.remove("selected")
            );

        card.classList.add("selected");

        showStatus(
            `Place ${item.name} on a tile.`
        );
    };

    document
        .getElementById("build-grid")
        .appendChild(card);
}

function updatePanels() {
    const powerDemand = calculatePowerDemand();
    const wasteDemand = calculateWasteDemand();

    document.getElementById("population").textContent =
        Math.floor(state.population).toLocaleString();

    document.getElementById("money").textContent =
        `$${Math.floor(state.money).toLocaleString()}`;

    document.getElementById("happiness").textContent =
        `${Math.floor(state.happiness)}%`;

    document.getElementById("power").textContent =
        `${powerDemand} / ${state.electricityCapacity}`;

    document.getElementById("waste").textContent =
        `${wasteDemand} / ${state.wasteCapacity}`;

    document.getElementById("keys").textContent =
        state.keys;

    const materialPanel =
        document.getElementById("material-panel");

    materialPanel.innerHTML = `
        <div style="
            position:absolute;
            top:88px;
            right:18px;
            z-index:20;
            background:rgba(19,25,28,.94);
            padding:12px 15px;
            border-radius:12px;
            border:1px solid rgba(255,255,255,.1);
            font-size:12px;
            line-height:1.7;
        ">
            <b>FACTORY MATERIALS</b><br>
            🪵 Wood: ${Math.floor(state.materials.wood)}<br>
            🔩 Steel: ${Math.floor(state.materials.steel)}<br>
            🧱 Concrete: ${Math.floor(state.materials.concrete)}<br>
            💻 Electronics: ${Math.floor(state.materials.electronics)}<br>
            📦 Shop Goods: ${Math.floor(state.materials.goods)}
        </div>
    `;

    const questPanel =
        document.getElementById("quest-panel");

    const completed =
        QUESTS.filter(q =>
            quests.get(q.id)?.completed
        ).length;

    questPanel.innerHTML = `
        <div style="
            position:absolute;
            top:250px;
            right:18px;
            width:245px;
            z-index:20;
            background:rgba(19,25,28,.94);
            padding:13px;
            border-radius:12px;
            border:1px solid rgba(255,255,255,.1);
            font-size:12px;
        ">
            <b>QUESTS</b>
            <div style="opacity:.6;margin:4px 0 9px">
                ${completed}/${QUESTS.length} completed
            </div>
            ${QUESTS.map(q => {
                const p = quests.get(q.id);

                return `
                    <div style="
                        padding:7px 0;
                        border-top:1px solid rgba(255,255,255,.06);
                    ">
                        <b>${p.completed ? "✓" : "○"} ${q.title}</b>
                        <br>
                        <span style="opacity:.6">
                            ${q.text}
                        </span>
                        <br>
                        <span style="color:#f0c45c">
                            +${q.reward} Key
                        </span>
                    </div>
                `;
            }).join("")}

            <button id="expand-area" style="
                width:100%;
                margin-top:10px;
                padding:9px;
                border:0;
                border-radius:8px;
                cursor:pointer;
                background:#c99438;
                color:white;
                font-weight:bold;
            ">
                Unlock New Area (${state.keys} Keys)
            </button>
        </div>
    `;

    document.getElementById("expand-area").onclick =
        unlockNextArea;
}

function showStatus(text) {
    const el =
        document.getElementById("build-status");

    if (!el) return;

    el.textContent = text;
    el.classList.add("show");

    clearTimeout(el._timer);

    el._timer =
        setTimeout(() => {
            el.classList.remove("show");
        }, 2600);
}

function getMapIntersection(event) {
    const rect =
        renderer.domElement.getBoundingClientRect();

    mouse.x =
        ((event.clientX - rect.left) /
            rect.width) *
        2 - 1;

    mouse.y =
        -((event.clientY - rect.top) /
            rect.height) *
        2 + 1;

    raycaster.setFromCamera(
        mouse,
        camera
    );

    const hit =
        raycaster.intersectObject(
            groundGroup.children[0]
        )[0];

    if (!hit) return null;

    return gridFromWorld(
        hit.point.x,
        hit.point.z
    );
}

renderer.domElement.addEventListener(
    "click",
    event => {
        const grid =
            getMapIntersection(event);

        if (!grid) return;

        const { gx, gz } = grid;

        if (!state.selectedBuild) return;

        const item =
            state.selectedBuild;

        if (item.road) {
            if (state.money < item.cost) {
                showStatus("Not enough money.");
                return;
            }

            if (gx >= -5 && gx <= 3) {
                showStatus("That tile is reserved for the river.");
                return;
            }

            if (!isExpansionUnlocked(gx, gz)) {
                showStatus("Unlock this area first.");
                return;
            }

            if (state.roads.has(key(gx, gz))) {
                showStatus("A road is already here.");
                return;
            }

            state.money -= item.cost;

            createRoad(
                gx,
                gz,
                item.road
            );

            rebuildRoad(gx, gz);

            saveGame();

            return;
        }

        addBuilding(item, gx, gz);
    }
);

renderer.domElement.addEventListener(
    "dblclick",
    event => {
        const grid =
            getMapIntersection(event);

        if (!grid) return;

        const building =
            state.buildings.get(
                key(grid.gx, grid.gz)
            );

        if (!building) return;

        const item =
            getBuildingType(building.id);

        if (
            item &&
            item.category === "residential"
        ) {
            upgradeHouse(building);
        }

        if (
            item &&
            item.production
        ) {
            showStatus(
                `${item.name}: producing ${item.production.type}`
            );
        }
    }
);

function saveGame() {
    const save = {
        money: state.money,
        level: state.level,
        xp: state.xp,
        keys: state.keys,
        unlockedExpansions:
            state.unlockedExpansions,
        materials: state.materials,

        roads: [...state.roads.values()].map(
            r => ({
                gx: r.gx,
                gz: r.gz,
                type: r.type
            })
        ),

        buildings:
            [...state.buildings.values()].map(
                b => ({
                    uid: b.uid,
                    id: b.id,
                    gx: b.gx,
                    gz: b.gz,
                    level: b.level,
                    goods: b.goods || 0,
                    productionStarted:
                        b.productionStarted || 0,
                    productionEnds:
                        b.productionEnds || 0
                })
            ),

        quests:
            [...quests.entries()].map(
                ([id, value]) => ({
                    id,
                    completed: value.completed,
                    claimed: value.claimed
                })
            )
    };

    localStorage.setItem(
        SAVE_KEY,
        JSON.stringify(save)
    );
}

function loadGame() {
    const raw =
        localStorage.getItem(SAVE_KEY);

    if (!raw) return;

    try {
        const save = JSON.parse(raw);

        state.money =
            save.money ?? state.money;

        state.level =
            save.level ?? state.level;

        state.xp =
            save.xp ?? state.xp;

        state.keys =
            save.keys ?? 0;

        state.unlockedExpansions =
            save.unlockedExpansions ?? 1;

        if (save.materials) {
            state.materials = {
                ...state.materials,
                ...save.materials
            };
        }

        state.roads.clear();
        state.buildings.clear();

        if (Array.isArray(save.roads)) {
            for (const r of save.roads) {
                state.roads.set(
                    key(r.gx, r.gz),
                    r
                );
            }
        }

        if (Array.isArray(save.buildings)) {
            for (const b of save.buildings) {
                state.buildings.set(
                    key(b.gx, b.gz),
                    {
                        ...b,
                        model: null
                    }
                );
            }
        }

        if (Array.isArray(save.quests)) {
            for (const q of save.quests) {
                if (quests.has(q.id)) {
                    quests.set(q.id, {
                        completed: !!q.completed,
                        claimed: !!q.claimed
                    });
                }
            }
        }
    } catch {
        localStorage.removeItem(SAVE_KEY);
    }
}

function rebuildBuildings() {
    buildingGroup.clear();

    for (const building of state.buildings.values()) {
        rebuildBuilding(building);
    }
}

function resetGame() {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
}

window.addEventListener(
    "keydown",
    event => {
        if (
            event.key.toLowerCase() === "s"
        ) {
            saveGame();
            showStatus("City saved.");
        }

        if (
            event.key.toLowerCase() === "u"
        ) {
            upgradeNearestRoad();
        }

        if (
            event.key.toLowerCase() === "r" &&
            event.repeat === false
        ) {
            if (event.shiftKey) {
                resetGame();
            }
        }
    }
);

function upgradeNearestRoad() {
    let nearest = null;
    let distance = Infinity;

    const target = controls.target;

    for (const road of state.roads.values()) {
        const dx =
            worldX(road.gx) -
            target.x;

        const dz =
            worldZ(road.gz) -
            target.z;

        const d =
            dx * dx +
            dz * dz;

        if (d < distance) {
            distance = d;
            nearest = road;
        }
    }

    if (!nearest) return;

    const levels = [
        "basic",
        "avenue",
        "major",
        "highway"
    ];

    const current =
        levels.indexOf(nearest.type);

    if (current >= levels.length - 1) {
        showStatus("Road is fully upgraded.");
        return;
    }

    const costs = [
        300,
        900,
        2200
    ];

    const cost = costs[current];

    if (state.money < cost) {
        showStatus("Not enough money.");
        return;
    }

    state.money -= cost;

    nearest.type =
        levels[current + 1];

    rebuildRoad(
        nearest.gx,
        nearest.gz
    );

    showStatus(
        `Road upgraded to ${nearest.type}.`
    );

    saveGame();
}

function animateTrees(time) {
    for (const tree of treeGroup.children) {
        tree.rotation.z =
            Math.sin(
                time * 0.001 +
                tree.position.x
            ) * 0.015;
    }
}

function animateParkEffects(time) {
    for (const b of state.buildings.values()) {
        const item =
            getBuildingType(b.id);

        if (!item || !b.model) continue;

        if (
            item.id === "lakePark" ||
            item.id === "plaza"
        ) {
            b.model.rotation.y =
                Math.sin(time * 0.0004) *
                0.01;
        }
    }
}

let lastTime = performance.now();
let uiTimer = 0;
let questTimer = 0;

function animate(time) {
    requestAnimationFrame(animate);

    const delta =
        Math.min(
            0.05,
            (time - lastTime) / 1000
        );

    lastTime = time;

    state.cityTime += delta;

    controls.update();

    updateUtilities();
    updateFactories(delta);
    updateProduction(delta);
    updateShops(delta);
    updateCity();
    updateCars(delta);

    animateTrees(time);
    animateParkEffects(time);

    uiTimer += delta;

    if (uiTimer > 0.5) {
        updatePanels();
        uiTimer = 0;
    }

    questTimer += delta;

    if (questTimer > 1) {
        checkQuests();
        questTimer = 0;
    }

    if (time - state.lastSave > 10000) {
        saveGame();
        state.lastSave = time;
    }

    renderer.render(
        scene,
        camera
    );
}

function initialize() {
    createGround();
    createWater();
    createTrees();

    loadGame();

    rebuildAllRoads();
    rebuildBuildings();
    createExpansionBorders();

    createUI();
    updatePanels();

    animate(performance.now());
}

window.addEventListener(
    "resize",
    () => {
        camera.aspect =
            innerWidth / innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            innerWidth,
            innerHeight
        );
    }
);

initialize();

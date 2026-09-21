import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const game = document.getElementById("game");

const TILE = 5;
const MAP_SIZE = 80;
const HALF = MAP_SIZE / 2;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bcde8);
scene.fog = new THREE.Fog(0x9bcde8, 180, 420);

const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(95, 105, 95);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
game.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 25;
controls.maxDistance = 250;
controls.maxPolarAngle = Math.PI / 2.05;
controls.target.set(0, 0, 0);

const ambient = new THREE.HemisphereLight(0xddefff, 0x526048, 2.2);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(100, 150, 80);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.left = -220;
sun.shadow.camera.right = 220;
sun.shadow.camera.top = 220;
sun.shadow.camera.bottom = -220;
scene.add(sun);

const state = {
    money: 25000,
    population: 0,
    level: 1,
    xp: 0,
    happiness: 75,
    traffic: 0,
    pollution: 0,
    roads: new Map(),
    buildings: new Map(),
    parks: new Map(),
    factories: new Map(),
    services: new Map(),
    trees: [],
    selectedCategory: "residential",
    selectedBuild: null,
    showCoverage: false,
    lastBuildKey: null,
    income: 0,
    expenses: 0
};

const LEVEL_XP = [
    0,
    100,
    250,
    500,
    900,
    1400,
    2100,
    3000,
    4200,
    5700,
    7500,
    9600,
    12000,
    15000,
    18500,
    22500
];

const BUILDINGS = {
    residential: [
        {
            id: "house",
            name: "Small House",
            cost: 500,
            width: 1,
            depth: 1,
            population: 12,
            power: 2,
            water: 2,
            sewage: 1,
            waste: 1,
            xp: 20,
            unlock: 1
        },
        {
            id: "townhouse",
            name: "Townhouse",
            cost: 900,
            width: 1,
            depth: 1,
            population: 24,
            power: 3,
            water: 3,
            sewage: 2,
            waste: 1,
            xp: 35,
            unlock: 2
        },
        {
            id: "apartment",
            name: "Apartment",
            cost: 2200,
            width: 2,
            depth: 2,
            population: 70,
            power: 7,
            water: 7,
            sewage: 5,
            waste: 4,
            xp: 70,
            unlock: 3
        },
        {
            id: "highrise",
            name: "High-Rise",
            cost: 6500,
            width: 2,
            depth: 2,
            population: 190,
            power: 16,
            water: 16,
            sewage: 12,
            waste: 9,
            xp: 150,
            unlock: 6
        },
        {
            id: "luxury",
            name: "Luxury Tower",
            cost: 14000,
            width: 3,
            depth: 3,
            population: 420,
            power: 30,
            water: 28,
            sewage: 22,
            waste: 16,
            xp: 300,
            unlock: 10
        }
    ],

    commercial: [
        {
            id: "shop",
            name: "Local Shop",
            cost: 1000,
            width: 1,
            depth: 1,
            jobs: 8,
            power: 3,
            water: 2,
            sewage: 1,
            waste: 2,
            income: 18,
            xp: 30,
            unlock: 1
        },
        {
            id: "cafe",
            name: "Cafe",
            cost: 1400,
            width: 1,
            depth: 1,
            jobs: 12,
            power: 4,
            water: 3,
            sewage: 2,
            waste: 2,
            income: 25,
            xp: 40,
            unlock: 2
        },
        {
            id: "supermarket",
            name: "Supermarket",
            cost: 3500,
            width: 2,
            depth: 2,
            jobs: 30,
            power: 8,
            water: 5,
            sewage: 4,
            waste: 6,
            income: 55,
            xp: 80,
            unlock: 4
        },
        {
            id: "shopping",
            name: "Shopping Centre",
            cost: 9000,
            width: 3,
            depth: 2,
            jobs: 85,
            power: 20,
            water: 14,
            sewage: 11,
            waste: 14,
            income: 140,
            xp: 180,
            unlock: 8
        },
        {
            id: "mall",
            name: "City Mall",
            cost: 18000,
            width: 4,
            depth: 3,
            jobs: 180,
            power: 40,
            water: 25,
            sewage: 20,
            waste: 28,
            income: 300,
            xp: 350,
            unlock: 12
        }
    ],

    industrial: [
        {
            id: "basicFactory",
            name: "Basic Factory",
            cost: 3000,
            width: 2,
            depth: 2,
            jobs: 35,
            power: 12,
            water: 8,
            sewage: 6,
            waste: 10,
            pollution: 12,
            productionTime: 30,
            income: 70,
            xp: 100,
            unlock: 1,
            factory: true
        },
        {
            id: "efficientFactory",
            name: "Efficient Factory",
            cost: 6500,
            width: 2,
            depth: 2,
            jobs: 60,
            power: 15,
            water: 9,
            sewage: 7,
            waste: 8,
            pollution: 7,
            productionTime: 20,
            income: 130,
            xp: 180,
            unlock: 5,
            factory: true
        },
        {
            id: "advancedFactory",
            name: "Advanced Factory",
            cost: 13000,
            width: 3,
            depth: 2,
            jobs: 110,
            power: 25,
            water: 15,
            sewage: 10,
            waste: 9,
            pollution: 3,
            productionTime: 12,
            income: 260,
            xp: 300,
            unlock: 10,
            factory: true
        }
    ],

    parks: [
        {
            id: "smallPark",
            name: "Small Park",
            cost: 700,
            width: 1,
            depth: 1,
            radius: 3,
            happiness: 5,
            xp: 25,
            unlock: 1
        },
        {
            id: "playground",
            name: "Playground",
            cost: 1200,
            width: 1,
            depth: 1,
            radius: 4,
            happiness: 7,
            xp: 35,
            unlock: 2
        },
        {
            id: "sportsField",
            name: "Sports Field",
            cost: 2500,
            width: 2,
            depth: 2,
            radius: 5,
            happiness: 9,
            xp: 65,
            unlock: 3
        },
        {
            id: "dogPark",
            name: "Dog Park",
            cost: 1800,
            width: 2,
            depth: 1,
            radius: 5,
            happiness: 8,
            xp: 55,
            unlock: 4
        },
        {
            id: "cityPark",
            name: "City Park",
            cost: 5500,
            width: 3,
            depth: 3,
            radius: 8,
            happiness: 14,
            xp: 130,
            unlock: 6
        },
        {
            id: "botanical",
            name: "Botanical Garden",
            cost: 10000,
            width: 4,
            depth: 3,
            radius: 11,
            happiness: 20,
            xp: 230,
            unlock: 9
        }
    ],

    utilities: [
        {
            id: "powerPlant",
            name: "Power Plant",
            cost: 5000,
            width: 2,
            depth: 2,
            service: "power",
            capacity: 120,
            pollution: 8,
            xp: 120,
            unlock: 1
        },
        {
            id: "solarPlant",
            name: "Solar Plant",
            cost: 9000,
            width: 2,
            depth: 2,
            service: "power",
            capacity: 220,
            pollution: 0,
            xp: 180,
            unlock: 6
        },
        {
            id: "waterTower",
            name: "Water Tower",
            cost: 3500,
            width: 1,
            depth: 1,
            service: "water",
            capacity: 140,
            xp: 100,
            unlock: 1
        },
        {
            id: "waterPlant",
            name: "Water Plant",
            cost: 7500,
            width: 2,
            depth: 2,
            service: "water",
            capacity: 300,
            xp: 170,
            unlock: 7
        },
        {
            id: "sewagePlant",
            name: "Sewage Plant",
            cost: 4500,
            width: 2,
            depth: 2,
            service: "sewage",
            capacity: 180,
            pollution: 5,
            xp: 120,
            unlock: 2
        },
        {
            id: "wastePlant",
            name: "Waste Facility",
            cost: 5000,
            width: 2,
            depth: 2,
            service: "waste",
            capacity: 180,
            pollution: 4,
            xp: 120,
            unlock: 3
        }
    ],

    services: [
        {
            id: "fireStation",
            name: "Fire Station",
            cost: 3500,
            width: 1,
            depth: 1,
            service: "fire",
            radius: 8,
            xp: 100,
            unlock: 2
        },
        {
            id: "policeStation",
            name: "Police Station",
            cost: 4500,
            width: 1,
            depth: 1,
            service: "police",
            radius: 9,
            xp: 120,
            unlock: 3
        },
        {
            id: "clinic",
            name: "Clinic",
            cost: 6000,
            width: 2,
            depth: 1,
            service: "health",
            radius: 10,
            xp: 150,
            unlock: 4
        }
    ],

    education: [
        {
            id: "school",
            name: "School",
            cost: 5000,
            width: 2,
            depth: 2,
            service: "education",
            radius: 9,
            xp: 140,
            unlock: 4
        },
        {
            id: "highSchool",
            name: "High School",
            cost: 10000,
            width: 3,
            depth: 2,
            service: "education",
            radius: 12,
            xp: 220,
            unlock: 7
        },
        {
            id: "university",
            name: "University",
            cost: 22000,
            width: 4,
            depth: 3,
            service: "education",
            radius: 16,
            xp: 400,
            unlock: 12
        }
    ],

    transport: [
        {
            id: "busDepot",
            name: "Bus Depot",
            cost: 7000,
            width: 2,
            depth: 2,
            service: "transport",
            radius: 15,
            xp: 180,
            unlock: 5
        },
        {
            id: "trainStation",
            name: "Train Station",
            cost: 16000,
            width: 3,
            depth: 2,
            service: "transport",
            radius: 25,
            xp: 300,
            unlock: 10
        }
    ],

    landmarks: [
        {
            id: "cityHall",
            name: "City Hall",
            cost: 25000,
            width: 3,
            depth: 3,
            population: 0,
            xp: 500,
            unlock: 8
        },
        {
            id: "stadium",
            name: "Stadium",
            cost: 40000,
            width: 5,
            depth: 4,
            jobs: 250,
            happiness: 12,
            xp: 650,
            unlock: 14
        }
    ]
};

const CATEGORIES = [
    ["roads", "Roads"],
    ["residential", "Residential"],
    ["commercial", "Commercial"],
    ["industrial", "Industrial"],
    ["parks", "Parks"],
    ["utilities", "Utilities"],
    ["services", "Services"],
    ["education", "Education"],
    ["transport", "Transport"],
    ["landmarks", "Landmarks"]
];

const ROAD_TYPES = {
    basic: {
        name: "Road",
        cost: 100,
        width: 1
    },
    avenue: {
        name: "Avenue",
        cost: 350,
        width: 1
    },
    major: {
        name: "Major Avenue",
        cost: 800,
        width: 2
    },
    highway: {
        name: "Highway",
        cost: 1800,
        width: 2
    }
};

const roads = state.roads;
const buildings = state.buildings;

const waterTiles = new Set();

function key(gx, gz) {
    return `${gx},${gz}`;
}

function worldX(gx) {
    return gx * TILE;
}

function worldZ(gz) {
    return gz * TILE;
}

function inBounds(gx, gz) {
    return (
        gx >= -HALF &&
        gx < HALF &&
        gz >= -HALF &&
        gz < HALF
    );
}

function isWater(gx, gz) {
    return waterTiles.has(key(gx, gz));
}

function createWater() {
    const waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x3e9fca,
        roughness: 0.25,
        metalness: 0.05,
        transparent: true,
        opacity: 0.92
    });

    for (let gz = -HALF; gz < HALF; gz++) {
        let riverCenter = Math.round(
            Math.sin(gz * 0.13) * 6
        );

        for (let gx = riverCenter - 2; gx <= riverCenter + 2; gx++) {
            if (!inBounds(gx, gz)) continue;

            waterTiles.add(key(gx, gz));

            const water = new THREE.Mesh(
                new THREE.BoxGeometry(TILE, 0.18, TILE),
                waterMaterial
            );

            water.position.set(
                worldX(gx),
                -0.08,
                worldZ(gz)
            );

            water.receiveShadow = true;
            scene.add(water);
        }
    }
}

function createTerrain() {
    const ground = new THREE.Mesh(
        new THREE.BoxGeometry(
            MAP_SIZE * TILE,
            1,
            MAP_SIZE * TILE
        ),
        new THREE.MeshStandardMaterial({
            color: 0x75a95b,
            roughness: 0.95
        })
    );

    ground.position.y = -0.6;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(
        MAP_SIZE * TILE,
        MAP_SIZE,
        0x477b3c,
        0x62924f
    );

    grid.position.y = 0.02;
    grid.material.transparent = true;
    grid.material.opacity = 0.23;
    scene.add(grid);
}

function createTrees() {
    for (let i = 0; i < 280; i++) {
        const gx = Math.floor(Math.random() * MAP_SIZE) - HALF;
        const gz = Math.floor(Math.random() * MAP_SIZE) - HALF;

        if (isWater(gx, gz)) continue;

        const tree = createTree();

        tree.position.set(
            worldX(gx) + (Math.random() - 0.5) * 2,
            0,
            worldZ(gz) + (Math.random() - 0.5) * 2
        );

        scene.add(tree);

        state.trees.push({
            group: tree,
            baseRotation: tree.rotation.z
        });
    }
}

function createTree() {
    const group = new THREE.Group();

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.25, 1.8, 7),
        new THREE.MeshStandardMaterial({
            color: 0x75502f
        })
    );

    trunk.position.y = 0.9;
    trunk.castShadow = true;
    group.add(trunk);

    const crown = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.15, 1),
        new THREE.MeshStandardMaterial({
            color: 0x347d3a
        })
    );

    crown.position.y = 2.1;
    crown.castShadow = true;
    group.add(crown);

    group.scale.setScalar(0.7 + Math.random() * 0.5);

    return group;
}

function createRoadBase(type) {
    const material =
        type === "highway"
            ? new THREE.MeshStandardMaterial({
                color: 0x30343a,
                roughness: 0.8
            })
            : type === "major"
                ? new THREE.MeshStandardMaterial({
                    color: 0x42464b,
                    roughness: 0.82
                })
                : new THREE.MeshStandardMaterial({
                    color: 0x555a60,
                    roughness: 0.85
                });

    const road = new THREE.Mesh(
        new THREE.BoxGeometry(
            TILE - 0.06,
            0.18,
            TILE - 0.06
        ),
        material
    );

    road.position.y = 0.12;
    road.receiveShadow = true;

    return road;
}

function createRoadLines(gx, gz, type) {
    const group = new THREE.Group();

    const dirs = {
        north: roads.has(key(gx, gz - 1)),
        south: roads.has(key(gx, gz + 1)),
        west: roads.has(key(gx - 1, gz)),
        east: roads.has(key(gx + 1, gz))
    };

    const count =
        Number(dirs.north) +
        Number(dirs.south) +
        Number(dirs.west) +
        Number(dirs.east);

    const lineMaterial = new THREE.MeshBasicMaterial({
        color:
            type === "highway"
                ? 0xffffff
                : 0xf2d34f
    });

    const lineWidth = type === "basic" ? 0.09 : 0.13;

    if (count === 0) {
        const line = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.03, TILE - 0.7),
            lineMaterial
        );

        line.position.y = 0.23;
        group.add(line);
    } else {
        if (dirs.north || dirs.south) {
            const line = new THREE.Mesh(
                new THREE.BoxGeometry(
                    lineWidth,
                    0.03,
                    TILE - 0.2
                ),
                lineMaterial
            );

            line.position.y = 0.23;
            group.add(line);
        }

        if (dirs.east || dirs.west) {
            const line = new THREE.Mesh(
                new THREE.BoxGeometry(
                    TILE - 0.2,
                    0.03,
                    lineWidth
                ),
                lineMaterial
            );

            line.position.y = 0.24;
            group.add(line);
        }
    }

    if (type === "highway") {
        const sideMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff
        });

        const a = new THREE.Mesh(
            new THREE.BoxGeometry(0.07, 0.025, TILE),
            sideMaterial
        );

        const b = a.clone();

        a.position.set(-2.15, 0.235, 0);
        b.position.set(2.15, 0.235, 0);

        group.add(a, b);
    }

    return group;
}

function rebuildRoad(gx, gz) {
    const data = roads.get(key(gx, gz));

    if (!data) return;

    if (data.group) {
        scene.remove(data.group);
    }

    const group = new THREE.Group();

    group.add(createRoadBase(data.type));
    group.add(createRoadLines(gx, gz, data.type));

    group.position.set(
        worldX(gx),
        0,
        worldZ(gz)
    );

    data.group = group;

    scene.add(group);
}

function rebuildRoadAndNeighbours(gx, gz) {
    rebuildRoad(gx, gz);
    rebuildRoad(gx + 1, gz);
    rebuildRoad(gx - 1, gz);
    rebuildRoad(gx, gz + 1);
    rebuildRoad(gx, gz - 1);
}

function roadAlreadyExists(gx, gz) {
    return roads.has(key(gx, gz));
}

function buildRoad(gx, gz, type = "basic") {
    if (!inBounds(gx, gz)) return false;

    if (isWater(gx, gz)) {
        showStatus("You cannot build a road on water");
        return false;
    }

    if (roadAlreadyExists(gx, gz)) {
        return false;
    }

    if (occupiedByBuilding(gx, gz)) {
        showStatus("A building is already here");
        return false;
    }

    const roadType = ROAD_TYPES[type];

    if (state.money < roadType.cost) {
        showStatus("Not enough money");
        return false;
    }

    state.money -= roadType.cost;

    roads.set(key(gx, gz), {
        gx,
        gz,
        type,
        group: null
    });

    rebuildRoadAndNeighbours(gx, gz);

    addXP(8);

    return true;
}

function upgradeRoad(gx, gz) {
    const data = roads.get(key(gx, gz));

    if (!data) {
        showStatus("No road here");
        return;
    }

    const next =
        data.type === "basic"
            ? "avenue"
            : data.type === "avenue"
                ? "major"
                : data.type === "major"
                    ? "highway"
                    : null;

    if (!next) {
        showStatus("This road is already a highway");
        return;
    }

    const cost = ROAD_TYPES[next].cost;

    if (state.money < cost) {
        showStatus("Not enough money");
        return;
    }

    state.money -= cost;
    data.type = next;

    rebuildRoadAndNeighbours(gx, gz);

    addXP(20);
    showStatus(`${ROAD_TYPES[next].name} built`);
}

function occupiedByBuilding(gx, gz) {
    for (const data of buildings.values()) {
        for (let x = 0; x < data.width; x++) {
            for (let z = 0; z < data.depth; z++) {
                if (
                    data.gx + x === gx &&
                    data.gz + z === gz
                ) {
                    return true;
                }
            }
        }
    }

    return false;
}

function footprintFree(gx, gz, width, depth) {
    for (let x = 0; x < width; x++) {
        for (let z = 0; z < depth; z++) {
            const tx = gx + x;
            const tz = gz + z;

            if (!inBounds(tx, tz)) return false;
            if (isWater(tx, tz)) return false;
            if (roads.has(key(tx, tz))) return false;
            if (occupiedByBuilding(tx, tz)) return false;
        }
    }

    return true;
}

function nextToRoad(gx, gz, width, depth) {
    for (let x = 0; x < width; x++) {
        if (
            roads.has(key(gx + x, gz - 1)) ||
            roads.has(key(gx + x, gz + depth))
        ) {
            return true;
        }
    }

    for (let z = 0; z < depth; z++) {
        if (
            roads.has(key(gx - 1, gz + z)) ||
            roads.has(key(gx + width, gz + z))
        ) {
            return true;
        }
    }

    return false;
}

function createBuildingModel(data) {
    const group = new THREE.Group();

    if (data.category === "residential") {
        createResidential(group, data);
    } else if (data.category === "commercial") {
        createCommercial(group, data);
    } else if (data.category === "industrial") {
        createFactory(group, data);
    } else if (data.category === "parks") {
        createParkModel(group, data);
    } else if (data.category === "utilities") {
        createUtility(group, data);
    } else if (data.category === "services") {
        createService(group, data);
    } else if (data.category === "education") {
        createEducation(group, data);
    } else if (data.category === "transport") {
        createTransport(group, data);
    } else {
        createLandmark(group, data);
    }

    return group;
}

function box(group, w, h, d, y, material) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        material
    );

    mesh.position.y = y;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    group.add(mesh);

    return mesh;
}

function createResidential(group, data) {
    const level = data.level || 1;

    const body = box(
        group,
        data.width * 4.3,
        2.8 + level * 0.9,
        data.depth * 4.3,
        1.4 + level * 0.45,
        new THREE.MeshStandardMaterial({
            color:
                data.id === "luxury"
                    ? 0x8c9aa5
                    : data.id === "highrise"
                        ? 0x687d8d
                        : 0xe0c49c
        })
    );

    if (data.id === "house" || data.id === "townhouse") {
        const roof = box(
            group,
            data.width * 4.5,
            0.25,
            data.depth * 4.5,
            3.1,
            new THREE.MeshStandardMaterial({
                color: 0x70483d
            })
        );

        roof.rotation.y = Math.PI / 4;
    }

    const floors = Math.max(2, Math.round(1 + level * 1.5));

    for (let floor = 0; floor < floors; floor++) {
        for (let x = -1; x <= 1; x++) {
            const window = new THREE.Mesh(
                new THREE.BoxGeometry(0.55, 0.45, 0.05),
                new THREE.MeshStandardMaterial({
                    color: 0x9fd8e8,
                    emissive: 0x123844,
                    emissiveIntensity: 0.15
                })
            );

            window.position.set(
                x * 1.1,
                1 + floor * 1.05,
                data.depth * 2.15 + 0.03
            );

            group.add(window);
        }
    }
}

function createCommercial(group, data) {
    const height =
        data.id === "mall"
            ? 5
            : data.id === "shopping"
                ? 4
                : 2.8;

    box(
        group,
        data.width * 4.5,
        height,
        data.depth * 4.5,
        height / 2,
        new THREE.MeshStandardMaterial({
            color: 0x9cabb7
        })
    );

    const roof = box(
        group,
        data.width * 4.65,
        0.25,
        data.depth * 4.65,
        height + 0.15,
        new THREE.MeshStandardMaterial({
            color: 0x3d4850
        })
    );

    const sign = box(
        group,
        Math.min(data.width * 3, 4),
        0.45,
        0.12,
        height - 0.7,
        new THREE.MeshStandardMaterial({
            color: 0xf2c84b,
            emissive: 0x4d3d08,
            emissiveIntensity: 0.3
        })
    );

    sign.position.z = data.depth * 2.27;
}

function createFactory(group, data) {
    const body = box(
        group,
        data.width * 4.5,
        3.8,
        data.depth * 4.5,
        1.9,
        new THREE.MeshStandardMaterial({
            color: 0x788087
        })
    );

    box(
        group,
        data.width * 2,
        0.35,
        data.depth * 2,
        3.95,
        new THREE.MeshStandardMaterial({
            color: 0x42494e
        })
    );

    for (let i = 0; i < 2; i++) {
        const chimney = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.5, 4, 8),
            new THREE.MeshStandardMaterial({
                color: 0x5b6166
            })
        );

        chimney.position.set(
            -1.4 + i * 2.8,
            4.6,
            0
        );

        chimney.castShadow = true;
        group.add(chimney);
    }

    data.smoke = [];
}

function createParkModel(group, data) {
    const sizeX = data.width * 4.7;
    const sizeZ = data.depth * 4.7;

    box(
        group,
        sizeX,
        0.12,
        sizeZ,
        0.06,
        new THREE.MeshStandardMaterial({
            color: 0x55a85a
        })
    );

    for (let i = 0; i < 5; i++) {
        const tree = createTree();
        tree.scale.setScalar(0.45);
        tree.position.set(
            (Math.random() - 0.5) * sizeX * 0.7,
            0,
            (Math.random() - 0.5) * sizeZ * 0.7
        );

        group.add(tree);
    }

    if (data.id === "playground") {
        box(
            group,
            2.2,
            0.15,
            1.3,
            0.35,
            new THREE.MeshStandardMaterial({
                color: 0xe4b73b
            })
        );
    }

    if (data.id === "sportsField") {
        box(
            group,
            6,
            0.06,
            3.8,
            0.15,
            new THREE.MeshStandardMaterial({
                color: 0x3f9447
            })
        );
    }

    if (data.id === "botanical") {
        const fountain = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1.2, 0.35, 24),
            new THREE.MeshStandardMaterial({
                color: 0xc8d0d5
            })
        );

        fountain.position.y = 0.25;
        group.add(fountain);
    }
}

function createUtility(group, data) {
    const color =
        data.service === "power"
            ? 0xb46d3f
            : data.service === "water"
                ? 0x477ea8
                : 0x686b70;

    box(
        group,
        data.width * 4.4,
        3.5,
        data.depth * 4.4,
        1.75,
        new THREE.MeshStandardMaterial({
            color
        })
    );

    const tank = new THREE.Mesh(
        new THREE.CylinderGeometry(
            1.2,
            1.2,
            2.5,
            16
        ),
        new THREE.MeshStandardMaterial({
            color: 0xb9c0c4
        })
    );

    tank.position.set(0, 3, 0);
    group.add(tank);
}

function createService(group, data) {
    box(
        group,
        data.width * 4.4,
        3,
        data.depth * 4.4,
        1.5,
        new THREE.MeshStandardMaterial({
            color:
                data.service === "fire"
                    ? 0xc74d43
                    : data.service === "police"
                        ? 0x486ba1
                        : 0xe5e5e5
        })
    );

    const roof = box(
        group,
        data.width * 4.55,
        0.3,
        data.depth * 4.55,
        3.1,
        new THREE.MeshStandardMaterial({
            color: 0x42484c
        })
    );

    roof.position.y = 3.1;
}

function createEducation(group, data) {
    box(
        group,
        data.width * 4.4,
        2.8,
        data.depth * 4.4,
        1.4,
        new THREE.MeshStandardMaterial({
            color: 0xd7b66d
        })
    );

    for (let i = 0; i < 3; i++) {
        box(
            group,
            0.5,
            0.8,
            0.08,
            1.2,
            new THREE.MeshStandardMaterial({
                color: 0x6fa9bd
            })
        ).position.x = -1 + i;
    }
}

function createTransport(group, data) {
    box(
        group,
        data.width * 4.5,
        2.5,
        data.depth * 4.5,
        1.25,
        new THREE.MeshStandardMaterial({
            color: 0x566d79
        })
    );

    const platform = box(
        group,
        data.width * 4.3,
        0.25,
        1,
        2.6,
        new THREE.MeshStandardMaterial({
            color: 0x30353a
        })
    );

    platform.position.z = data.depth * 2;
}

function createLandmark(group, data) {
    box(
        group,
        data.width * 4.5,
        data.id === "stadium" ? 3 : 7,
        data.depth * 4.5,
        data.id === "stadium" ? 1.5 : 3.5,
        new THREE.MeshStandardMaterial({
            color: data.id === "stadium" ? 0x788c98 : 0xb9b2a4
        })
    );

    if (data.id === "stadium") {
        const field = new THREE.Mesh(
            new THREE.CylinderGeometry(3.5, 3.5, 0.3, 32),
            new THREE.MeshStandardMaterial({
                color: 0x3d9548
            })
        );

        field.position.y = 3.1;
        group.add(field);
    }
}

function maxFactoriesForLevel(level) {
    if (level >= 15) return 4;
    if (level >= 10) return 3;
    if (level >= 5) return 2;
    return 1;
}

function placeBuilding(item, category, gx, gz) {
    if (state.level < item.unlock) {
        showStatus(`Unlocks at level ${item.unlock}`);
        return false;
    }

    if (
        !footprintFree(
            gx,
            gz,
            item.width,
            item.depth
        )
    ) {
        showStatus("That space is occupied");
        return false;
    }

    if (
        category !== "parks" &&
        category !== "utilities" &&
        !nextToRoad(
            gx,
            gz,
            item.width,
            item.depth
        )
    ) {
        showStatus("Buildings must connect to a road");
        return false;
    }

    if (
        category === "industrial" &&
        item.factory
    ) {
        if (
            state.factories.size >=
            maxFactoriesForLevel(state.level)
        ) {
            showStatus(
                `Factory limit: ${maxFactoriesForLevel(state.level)}`
            );
            return false;
        }
    }

    if (state.money < item.cost) {
        showStatus("Not enough money");
        return false;
    }

    state.money -= item.cost;

    const id =
        `${item.id}_${Date.now()}_${Math.random()}`;

    const data = {
        ...item,
        category,
        gx,
        gz,
        id: item.id,
        instanceId: id,
        level: 1,
        builtAt: performance.now()
    };

    const group = createBuildingModel(data);

    group.position.set(
        worldX(gx) + ((item.width - 1) * TILE) / 2,
        0,
        worldZ(gz) + ((item.depth - 1) * TILE) / 2
    );

    group.scale.set(0.05, 0.05, 0.05);

    scene.add(group);

    data.group = group;

    buildings.set(id, data);

    if (category === "industrial" && item.factory) {
        state.factories.set(id, data);
        data.production = {
            active: false,
            started: 0,
            ends: 0
        };
    }

    if (category === "parks") {
        state.parks.set(id, data);
    }

    if (
        category === "utilities" ||
        category === "services"
    ) {
        state.services.set(id, data);
    }

    addXP(item.xp || 10);

    showStatus(`${item.name} built`);

    return true;
}

function calculateServices() {
    const capacity = {
        power: 0,
        water: 0,
        sewage: 0,
        waste: 0
    };

    for (const data of state.services.values()) {
        if (
            data.category === "utilities" &&
            data.service &&
            capacity[data.service] !== undefined
        ) {
            capacity[data.service] +=
                data.capacity || 0;
        }
    }

    const demand = {
        power: 0,
        water: 0,
        sewage: 0,
        waste: 0
    };

    for (const data of buildings.values()) {
        demand.power += data.power || 0;
        demand.water += data.water || 0;
        demand.sewage += data.sewage || 0;
        demand.waste += data.waste || 0;
    }

    return {
        capacity,
        demand
    };
}

function serviceRatio(capacity, demand) {
    if (demand <= 0) return 1;
    return Math.min(1, capacity / demand);
}

function calculateHappiness() {
    const services = calculateServices();

    const powerRatio = serviceRatio(
        services.capacity.power,
        services.demand.power
    );

    const waterRatio = serviceRatio(
        services.capacity.water,
        services.demand.water
    );

    const sewageRatio = serviceRatio(
        services.capacity.sewage,
        services.demand.sewage
    );

    const wasteRatio = serviceRatio(
        services.capacity.waste,
        services.demand.waste
    );

    let happiness = 75;

    happiness += parkHappinessBonus();

    happiness -= (1 - powerRatio) * 25;
    happiness -= (1 - waterRatio) * 20;
    happiness -= (1 - sewageRatio) * 15;
    happiness -= (1 - wasteRatio) * 15;

    happiness -= state.pollution * 0.25;
    happiness -= state.traffic * 0.12;

    return Math.max(
        0,
        Math.min(100, Math.round(happiness))
    );
}

function parkHappinessBonus() {
    let bonus = 0;

    for (const park of state.parks.values()) {
        const radius = park.radius || 3;

        let nearbyPopulation = 0;

        for (const building of buildings.values()) {
            if (building.category !== "residential") continue;

            const centerX =
                building.gx +
                (building.width - 1) / 2;

            const centerZ =
                building.gz +
                (building.depth - 1) / 2;

            const dx = centerX - park.gx;
            const dz = centerZ - park.gz;

            const distance = Math.sqrt(
                dx * dx + dz * dz
            );

            if (distance <= radius) {
                nearbyPopulation +=
                    building.population || 0;
            }
        }

        if (nearbyPopulation > 0) {
            bonus += park.happiness || 0;
        }
    }

    return Math.min(20, bonus);
}

function updatePollution() {
    let pollution = 0;

    for (const data of buildings.values()) {
        pollution += data.pollution || 0;
    }

    state.pollution = Math.min(100, pollution);
}

function updatePopulation() {
    let population = 0;

    for (const data of buildings.values()) {
        population += data.population || 0;
    }

    state.population = population;
}

function updateIncome() {
    let income = 0;
    let expenses = 0;

    for (const data of buildings.values()) {
        income += data.income || 0;

        if (data.category === "utilities") {
            expenses += 8;
        }

        if (
            data.category === "services" ||
            data.category === "education" ||
            data.category === "transport"
        ) {
            expenses += 10;
        }
    }

    income += Math.floor(state.population * 0.12);

    state.income = income;
    state.expenses = expenses;
}

function addXP(amount) {
    state.xp += amount;

    checkLevelUp();
}

function checkLevelUp() {
    while (
        state.level < LEVEL_XP.length - 1 &&
        state.xp >= LEVEL_XP[state.level]
    ) {
        state.level++;

        showStatus(
            `LEVEL ${state.level} UNLOCKED`
        );
    }
}

function updateStats() {
    updatePopulation();
    updatePollution();
    updateIncome();

    state.happiness = calculateHappiness();

    const services = calculateServices();

    const levelNeed =
        LEVEL_XP[Math.min(
            state.level,
            LEVEL_XP.length - 1
        )];

    const previousNeed =
        LEVEL_XP[state.level - 1] || 0;

    const progress =
        levelNeed > previousNeed
            ? Math.max(
                0,
                Math.min(
                    100,
                    ((state.xp - previousNeed) /
                        (levelNeed - previousNeed)) *
                    100
                )
            )
            : 100;

    const power =
        `${Math.round(services.capacity.power)}/${Math.round(services.demand.power)}`;

    const water =
        `${Math.round(services.capacity.water)}/${Math.round(services.demand.water)}`;

    const factories =
        `${state.factories.size}/${maxFactoriesForLevel(state.level)}`;

    document.querySelector(
        "#statPopulation"
    ).textContent = state.population.toLocaleString();

    document.querySelector(
        "#statMoney"
    ).textContent = `$${Math.floor(state.money).toLocaleString()}`;

    document.querySelector(
        "#statHappiness"
    ).textContent = `${state.happiness}%`;

    document.querySelector(
        "#statLevel"
    ).textContent = `LEVEL ${state.level}`;

    document.querySelector(
        "#statPower"
    ).textContent = power;

    document.querySelector(
        "#statWater"
    ).textContent = water;

    document.querySelector(
        "#statFactories"
    ).textContent = factories;

    const xpBar =
        document.querySelector("#xpBar");

    if (xpBar) {
        xpBar.style.width = `${progress}%`;
    }

    const income =
        document.querySelector("#incomeValue");

    if (income) {
        income.textContent =
            `+$${Math.max(
                0,
                state.income - state.expenses
            )}/day`;
    }
}

function createUI() {
    const topbar = document.createElement("div");
    topbar.className = "city-topbar";

    topbar.innerHTML = `
        <div class="city-title">Cities - Flashcard.com</div>

        <div class="city-stats">

            <div class="stat">
                <div class="stat-label">Population</div>
                <div class="stat-value" id="statPopulation">0</div>
            </div>

            <div class="stat">
                <div class="stat-label">Money</div>
                <div class="stat-value" id="statMoney">$25,000</div>
            </div>

            <div class="stat">
                <div class="stat-label">Happiness</div>
                <div class="stat-value" id="statHappiness">75%</div>
            </div>

            <div class="stat">
                <div class="stat-label">Level</div>
                <div class="stat-value" id="statLevel">LEVEL 1</div>
            </div>

            <div class="stat">
                <div class="stat-label">Power</div>
                <div class="stat-value" id="statPower">0/0</div>
            </div>

            <div class="stat">
                <div class="stat-label">Water</div>
                <div class="stat-value" id="statWater">0/0</div>
            </div>

            <div class="stat">
                <div class="stat-label">Factories</div>
                <div class="stat-value" id="statFactories">0/1</div>
            </div>

        </div>
    `;

    game.appendChild(topbar);

    const levelPanel =
        document.createElement("div");

    levelPanel.style.position = "absolute";
    levelPanel.style.left = "22px";
    levelPanel.style.top = "88px";
    levelPanel.style.width = "220px";
    levelPanel.style.padding = "12px";
    levelPanel.style.background =
        "rgba(20,26,29,.92)";
    levelPanel.style.borderRadius = "12px";
    levelPanel.style.zIndex = "20";

    levelPanel.innerHTML = `
        <div style="font-size:11px;opacity:.65">
            CITY PROGRESS
        </div>
        <div style="font-weight:800;margin-top:4px">
            LEVEL 1
        </div>
        <div style="
            height:6px;
            background:rgba(255,255,255,.1);
            border-radius:5px;
            margin-top:8px;
            overflow:hidden;
        ">
            <div id="xpBar"
                style="
                    width:0%;
                    height:100%;
                    background:#66a8ff;
                    transition:.3s;
                ">
            </div>
        </div>
        <div id="incomeValue"
            style="
                font-size:11px;
                opacity:.65;
                margin-top:7px;
            ">
            +$0/day
        </div>
    `;

    game.appendChild(levelPanel);

    const buildButton =
        document.createElement("button");

    buildButton.className = "build-main";
    buildButton.textContent = "BUILD";
    buildButton.id = "buildButton";

    game.appendChild(buildButton);

    const menu =
        document.createElement("div");

    menu.className = "build-menu";
    menu.id = "buildMenu";

    menu.innerHTML = `
        <div class="menu-header">
            <div class="menu-title">Build</div>
            <button class="close-menu">×</button>
        </div>

        <div id="categoryStrip"></div>

        <div class="build-grid" id="buildGrid"></div>

        <div class="build-info">
            Select something to build, then click a tile on the city map.
            Roads connect automatically.
        </div>
    `;

    game.appendChild(menu);

    buildButton.onclick = () => {
        menu.classList.toggle("open");
        buildButton.classList.toggle(
            "active",
            menu.classList.contains("open")
        );

        if (menu.classList.contains("open")) {
            renderCategories();
            renderBuildItems();
        }
    };

    menu.querySelector(
        ".close-menu"
    ).onclick = () => {
        menu.classList.remove("open");
        buildButton.classList.remove("active");
    };

    const status =
        document.createElement("div");

    status.id = "buildStatus";
    status.className = "build-status";

    game.appendChild(status);

    const coverageButton =
        document.createElement("button");

    coverageButton.textContent =
        "SHOW COVERAGE";

    coverageButton.style.position = "absolute";
    coverageButton.style.right = "20px";
    coverageButton.style.bottom = "24px";
    coverageButton.style.zIndex = "25";
    coverageButton.style.padding = "11px 15px";
    coverageButton.style.border = "0";
    coverageButton.style.borderRadius = "10px";
    coverageButton.style.background =
        "rgba(20,26,29,.92)";
    coverageButton.style.color = "white";
    coverageButton.style.cursor = "pointer";

    game.appendChild(coverageButton);

    coverageButton.onclick = () => {
        state.showCoverage =
            !state.showCoverage;

        coverageButton.textContent =
            state.showCoverage
                ? "HIDE COVERAGE"
                : "SHOW COVERAGE";

        rebuildCoverage();
    };
}

function renderCategories() {
    const strip =
        document.querySelector("#categoryStrip");

    strip.innerHTML = "";

    strip.style.display = "flex";
    strip.style.flexWrap = "wrap";
    strip.style.gap = "7px";
    strip.style.marginBottom = "12px";

    for (const [id, name] of CATEGORIES) {
        const button =
            document.createElement("button");

        button.textContent = name;

        button.style.border = "1px solid rgba(255,255,255,.1)";
        button.style.borderRadius = "9px";
        button.style.padding = "8px 11px";
        button.style.background =
            state.selectedCategory === id
                ? "#4b7bec"
                : "#252d31";
        button.style.color = "white";
        button.style.cursor = "pointer";
        button.style.fontWeight = "700";
        button.style.fontSize = "11px";

        button.onclick = () => {
            state.selectedCategory = id;
            state.selectedBuild = null;
            renderCategories();
            renderBuildItems();
        };

        strip.appendChild(button);
    }
}

function renderBuildItems() {
    const grid =
        document.querySelector("#buildGrid");

    grid.innerHTML = "";

    if (state.selectedCategory === "roads") {
        for (const [id, road] of Object.entries(
            ROAD_TYPES
        )) {
            const card =
                document.createElement("button");

            card.className = "build-card";

            card.innerHTML = `
                <div class="build-icon">▰</div>
                <div class="build-name">${road.name}</div>
                <div class="build-price">$${road.cost}</div>
            `;

            card.onclick = () => {
                state.selectedBuild = {
                    category: "roads",
                    roadType: id
                };

                showStatus(
                    `Selected ${road.name}`
                );
            };

            grid.appendChild(card);
        }

        const upgrade =
            document.createElement("button");

        upgrade.className = "build-card";

        upgrade.innerHTML = `
            <div class="build-icon">↑</div>
            <div class="build-name">Upgrade Road</div>
            <div class="build-price">Click a road</div>
        `;

        upgrade.onclick = () => {
            state.selectedBuild = {
                category: "upgrade"
            };

            showStatus("Select a road to upgrade");
        };

        grid.appendChild(upgrade);

        return;
    }

    const items =
        BUILDINGS[state.selectedCategory] || [];

    for (const item of items) {
        const card =
            document.createElement("button");

        card.className = "build-card";

        const locked =
            state.level < item.unlock;

        card.innerHTML = `
            <div class="build-icon">
                ${getIcon(state.selectedCategory)}
            </div>
            <div class="build-name">
                ${item.name}
            </div>
            <div class="build-price">
                ${locked
                    ? `Level ${item.unlock}`
                    : `$${item.cost.toLocaleString()}`
                }
            </div>
        `;

        if (locked) {
            card.style.opacity = ".42";
        }

        card.onclick = () => {
            if (locked) {
                showStatus(
                    `Unlocks at level ${item.unlock}`
                );
                return;
            }

            if (
                state.selectedCategory === "industrial" &&
                item.factory
            ) {
                if (
                    state.factories.size >=
                    maxFactoriesForLevel(state.level)
                ) {
                    showStatus(
                        `Factory limit: ${maxFactoriesForLevel(state.level)}`
                    );
                    return;
                }
            }

            state.selectedBuild = {
                category: state.selectedCategory,
                item
            };

            showStatus(
                `Place ${item.name}`
            );
        };

        grid.appendChild(card);
    }
}

function getIcon(category) {
    const icons = {
        residential: "⌂",
        commercial: "▦",
        industrial: "🏭",
        parks: "🌳",
        utilities: "⚡",
        services: "✚",
        education: "🎓",
        transport: "▤",
        landmarks: "★"
    };

    return icons[category] || "■";
}

function showStatus(text) {
    const el =
        document.querySelector("#buildStatus");

    if (!el) return;

    el.textContent = text;
    el.classList.add("show");

    clearTimeout(showStatus.timer);

    showStatus.timer = setTimeout(() => {
        el.classList.remove("show");
    }, 1800);
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const hover = new THREE.Mesh(
    new THREE.BoxGeometry(
        TILE - 0.08,
        0.08,
        TILE - 0.08
    ),
    new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.22
    })
);

hover.visible = false;
scene.add(hover);

function getGridPosition(event) {
    const rect =
        renderer.domElement.getBoundingClientRect();

    mouse.x =
        ((event.clientX - rect.left) /
            rect.width) *
        2 -
        1;

    mouse.y =
        -((event.clientY - rect.top) /
            rect.height) *
        2 +
        1;

    raycaster.setFromCamera(
        mouse,
        camera
    );

    const plane =
        new THREE.Plane(
            new THREE.Vector3(0, 1, 0),
            0
        );

    const point =
        new THREE.Vector3();

    if (
        !raycaster.ray.intersectPlane(
            plane,
            point
        )
    ) {
        return null;
    }

    const gx = Math.floor(
        point.x / TILE + 0.5
    );

    const gz = Math.floor(
        point.z / TILE + 0.5
    );

    return {
        gx,
        gz,
        point
    };
}

function updateHover(event) {
    const pos =
        getGridPosition(event);

    if (!pos || !inBounds(pos.gx, pos.gz)) {
        hover.visible = false;
        return;
    }

    hover.visible = true;

    hover.position.set(
        worldX(pos.gx),
        0.1,
        worldZ(pos.gz)
    );

    if (isWater(pos.gx, pos.gz)) {
        hover.material.color.set(0x2979ff);
        hover.material.opacity = 0.2;
    } else if (
        roads.has(key(pos.gx, pos.gz))
    ) {
        hover.material.color.set(0xf2d34f);
        hover.material.opacity = 0.2;
    } else {
        hover.material.color.set(0xffffff);
        hover.material.opacity = 0.22;
    }
}

renderer.domElement.addEventListener(
    "pointermove",
    event => {
        updateHover(event);

        if (
            event.buttons === 1 &&
            state.selectedBuild
        ) {
            buildFromPointer(event);
        }
    }
);

renderer.domElement.addEventListener(
    "pointerleave",
    () => {
        hover.visible = false;
    }
);

renderer.domElement.addEventListener(
    "pointerup",
    () => {
        state.lastBuildKey = null;
    }
);

renderer.domElement.addEventListener(
    "pointerdown",
    event => {
        if (event.button !== 0) return;

        if (!state.selectedBuild) return;

        buildFromPointer(event);
    }
);

function buildFromPointer(event) {
    const pos =
        getGridPosition(event);

    if (!pos) return;

    const build =
        state.selectedBuild;

    const k =
        key(pos.gx, pos.gz);

    if (state.lastBuildKey === k) {
        return;
    }

    if (build.category === "roads") {
        if (
            !roads.has(k)
        ) {
            if (
                buildRoad(
                    pos.gx,
                    pos.gz,
                    build.roadType
                )
            ) {
                state.lastBuildKey = k;
            }
        }

        return;
    }

    if (build.category === "upgrade") {
        if (roads.has(k)) {
            upgradeRoad(
                pos.gx,
                pos.gz
            );

            state.lastBuildKey = k;
        }

        return;
    }

    if (
        build.item
    ) {
        if (
            placeBuilding(
                build.item,
                build.category,
                pos.gx,
                pos.gz
            )
        ) {
            state.lastBuildKey = k;
        }
    }
}

const coverageMeshes = [];

function clearCoverage() {
    for (const mesh of coverageMeshes) {
        scene.remove(mesh);
    }

    coverageMeshes.length = 0;
}

function rebuildCoverage() {
    clearCoverage();

    if (!state.showCoverage) return;

    for (const park of state.parks.values()) {
        createCoverage(
            park,
            0x3fd35a,
            park.radius
        );
    }

    for (const service of state.services.values()) {
        if (
            service.category === "services" &&
            service.radius
        ) {
            createCoverage(
                service,
                0x3189ff,
                service.radius
            );
        }
    }

    for (const data of buildings.values()) {
        if (data.pollution > 0) {
            createCoverage(
                data,
                0x777777,
                Math.max(
                    2,
                    Math.round(
                        data.pollution / 2
                    )
                )
            );
        }
    }
}

function createCoverage(
    data,
    color,
    radius
) {
    const geometry =
        new THREE.RingGeometry(
            radius * TILE - 0.15,
            radius * TILE,
            48
        );

    const material =
        new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.18,
            side: THREE.DoubleSide
        });

    const mesh =
        new THREE.Mesh(
            geometry,
            material
        );

    mesh.rotation.x =
        -Math.PI / 2;

    mesh.position.set(
        worldX(data.gx),
        0.18,
        worldZ(data.gz)
    );

    scene.add(mesh);

    coverageMeshes.push(mesh);
}

function startFactory(factory) {
    if (
        !factory.production ||
        factory.production.active
    ) {
        return;
    }

    const now =
        performance.now();

    factory.production.active = true;
    factory.production.started = now;
    factory.production.ends =
        now +
        factory.productionTime *
        1000;

    showStatus(
        `${factory.name} started production`
    );
}

function updateFactories() {
    const now =
        performance.now();

    for (const factory of state.factories.values()) {
        if (!factory.production) continue;

        if (
            !factory.production.active
        ) {
            continue;
        }

        if (
            now >= factory.production.ends
        ) {
            factory.production.active = false;

            state.money +=
                factory.income || 0;

            addXP(
                Math.floor(
                    (factory.xp || 50) / 3
                )
            );

            showStatus(
                `${factory.name} finished production +$${factory.income || 0}`
            );
        }
    }
}

function animateBuildings(time) {
    for (const data of buildings.values()) {
        if (!data.group) continue;

        const age =
            time - data.builtAt;

        if (age < 1000) {
            const p =
                Math.min(
                    1,
                    age / 1000
                );

            const eased =
                1 -
                Math.pow(
                    1 - p,
                    3
                );

            data.group.scale.setScalar(
                0.05 +
                eased * 0.95
            );
        } else {
            data.group.scale.set(
                1,
                1,
                1
            );
        }

        if (
            data.category === "industrial" &&
            data.production &&
            data.production.active
        ) {
            data.group.rotation.y =
                Math.sin(time * 0.003) *
                0.004;
        }
    }
}

function animateTrees(time) {
    for (const tree of state.trees) {
        tree.group.rotation.z =
            Math.sin(
                time * 0.0012 +
                tree.group.position.x
            ) *
            0.018;

        tree.group.rotation.x =
            Math.cos(
                time * 0.001 +
                tree.group.position.z
            ) *
            0.012;
    }
}

function animateWater(time) {
    for (const child of scene.children) {
        if (
            child.isMesh &&
            child.geometry &&
            child.geometry.type === "BoxGeometry" &&
            child.material &&
            child.material.color &&
            child.material.color.getHex() === 0x3e9fca
        ) {
            child.position.y =
                -0.08 +
                Math.sin(
                    time * 0.001 +
                    child.position.x * 0.03 +
                    child.position.z * 0.03
                ) *
                0.025;
        }
    }
}

function simulateDay() {
    updateStats();

    const net =
        state.income -
        state.expenses;

    state.money +=
        Math.max(
            -50,
            net
        );

    if (state.money < 0) {
        state.money = 0;
    }
}

function createStartingRoads() {
    return;
}

function saveGame() {
    const save = {
        money: state.money,
        level: state.level,
        xp: state.xp,
        roads: [...roads.values()].map(
            r => ({
                gx: r.gx,
                gz: r.gz,
                type: r.type
            })
        ),
        buildings: [...buildings.values()].map(
            b => ({
                itemId: b.id,
                category: b.category,
                gx: b.gx,
                gz: b.gz
            })
        )
    };

    localStorage.setItem(
        "citiesFlashcardSave",
        JSON.stringify(save)
    );
}

function loadGame() {
    try {
        const raw =
            localStorage.getItem(
                "citiesFlashcardSave"
            );

        if (!raw) return;

        const save =
            JSON.parse(raw);

        state.money =
            save.money ?? 25000;

        state.level =
            save.level ?? 1;

        state.xp =
            save.xp ?? 0;

        for (const road of save.roads || []) {
            if (
                !inBounds(
                    road.gx,
                    road.gz
                )
            ) continue;

            if (
                isWater(
                    road.gx,
                    road.gz
                )
            ) continue;

            roads.set(
                key(
                    road.gx,
                    road.gz
                ),
                {
                    gx: road.gx,
                    gz: road.gz,
                    type: road.type,
                    group: null
                }
            );
        }

        for (const road of roads.values()) {
            rebuildRoad(
                road.gx,
                road.gz
            );
        }

        for (const saved of save.buildings || []) {
            const list =
                BUILDINGS[
                    saved.category
                ] || [];

            const item =
                list.find(
                    b =>
                        b.id ===
                        saved.itemId
                );

            if (!item) continue;

            placeBuildingWithoutCost(
                item,
                saved.category,
                saved.gx,
                saved.gz
            );
        }

        rebuildCoverage();
    } catch {
    }
}

function placeBuildingWithoutCost(
    item,
    category,
    gx,
    gz
) {
    if (
        !footprintFree(
            gx,
            gz,
            item.width,
            item.depth
        )
    ) {
        return;
    }

    const id =
        `${item.id}_${Date.now()}_${Math.random()}`;

    const data = {
        ...item,
        category,
        gx,
        gz,
        id: item.id,
        instanceId: id,
        level: 1,
        builtAt: performance.now()
    };

    const group =
        createBuildingModel(data);

    group.position.set(
        worldX(gx) +
        ((item.width - 1) * TILE) / 2,
        0,
        worldZ(gz) +
        ((item.depth - 1) * TILE) / 2
    );

    group.scale.set(
        1,
        1,
        1
    );

    scene.add(group);

    data.group = group;

    buildings.set(
        id,
        data
    );

    if (
        category === "industrial" &&
        item.factory
    ) {
        state.factories.set(
            id,
            data
        );

        data.production = {
            active: false,
            started: 0,
            ends: 0
        };
    }

    if (category === "parks") {
        state.parks.set(
            id,
            data
        );
    }

    if (
        category === "utilities" ||
        category === "services"
    ) {
        state.services.set(
            id,
            data
        );
    }
}

window.addEventListener(
    "keydown",
    event => {
        if (
            event.key.toLowerCase() === "u"
        ) {
            state.selectedBuild = {
                category: "upgrade"
            };

            showStatus(
                "Road upgrade selected"
            );
        }

        if (
            event.key.toLowerCase() === "escape"
        ) {
            state.selectedBuild = null;
            hover.visible = false;
        }

        if (
            event.key.toLowerCase() === "s"
        ) {
            saveGame();
            showStatus("City saved");
        }

        if (
            event.key.toLowerCase() === "p"
        ) {
            state.showCoverage =
                !state.showCoverage;

            rebuildCoverage();
        }
    }
);

renderer.domElement.addEventListener(
    "dblclick",
    event => {
        const pos =
            getGridPosition(event);

        if (!pos) return;

        const factory =
            [...state.factories.values()]
                .find(
                    f =>
                        Math.round(
                            f.gx
                        ) === pos.gx &&
                        Math.round(
                            f.gz
                        ) === pos.gz
                );

        if (factory) {
            startFactory(factory);
        }
    }
);

createTerrain();
createWater();
createTrees();
createStartingRoads();
createUI();
loadGame();
renderCategories();
renderBuildItems();
updateStats();

setInterval(
    simulateDay,
    5000
);

setInterval(
    saveGame,
    10000
);

function animate(time) {
    requestAnimationFrame(animate);

    controls.update();

    animateBuildings(time);
    animateTrees(time);
    animateWater(time);
    updateFactories();

    renderer.render(
        scene,
        camera
    );
}

animate(0);

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

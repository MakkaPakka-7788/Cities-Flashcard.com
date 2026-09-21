import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bcfee);

const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
);

camera.position.set(70, 80, 70);

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
controls.minDistance = 18;
controls.maxDistance = 230;
controls.maxPolarAngle = Math.PI * 0.47;
controls.target.set(0, 0, 0);

const skyLight = new THREE.HemisphereLight(
    0xdff6ff,
    0x4d6447,
    2
);

scene.add(skyLight);

const sun = new THREE.DirectionalLight(
    0xffffff,
    2.3
);

sun.position.set(70, 130, 70);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.left = -160;
sun.shadow.camera.right = 160;
sun.shadow.camera.top = 160;
sun.shadow.camera.bottom = -160;

scene.add(sun);

const CITY_SIZE = 80;
const TILE = 5;
const HALF = CITY_SIZE / 2;

const roads = new Map();
const buildings = new Map();
const effects = [];
const trees = [];
const smoke = [];
const construction = [];
const factories = [];

let selectedTool = null;
let dragging = false;
let lastTile = null;
let money = 50000;

let population = 0;
let jobs = 0;
let happiness = 70;
let pollution = 0;
let traffic = 0;

let level = 1;
let xp = 0;

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

    health: 0,
    fire: 0,
    police: 0,
    education: 0
};

const levelData = {
    1: {
        xp: 0,
        unlock: [
            "house",
            "townhouse",
            "shop",
            "basicFactory",
            "smallPark",
            "powerPlant",
            "waterPlant"
        ]
    },

    2: {
        xp: 100,
        unlock: [
            "restaurant",
            "warehouse",
            "playground",
            "fireStation"
        ]
    },

    3: {
        xp: 300,
        unlock: [
            "apartment",
            "supermarket",
            "neighborhoodPark",
            "policeStation",
            "wastePlant"
        ]
    },

    4: {
        xp: 700,
        unlock: [
            "office",
            "sportsPark",
            "hospital",
            "advancedFactory"
        ]
    },

    5: {
        xp: 1400,
        unlock: [
            "apartmentTower",
            "botanicalGarden",
            "modernFactory",
            "school"
        ]
    },

    6: {
        xp: 2500,
        unlock: [
            "largeCityPark",
            "industrialFactory"
        ]
    },

    7: {
        xp: 4200,
        unlock: [
            "manufacturingPlant"
        ]
    },

    8: {
        xp: 6500,
        unlock: [
            "megaFactory"
        ]
    },

    9: {
        xp: 9500,
        unlock: []
    },

    10: {
        xp: 14000,
        unlock: []
    }
};

const types = {
    house: {
        name: "House",
        category: "Residential",
        cost: 800,
        xp: 20,
        width: 1,
        depth: 1,
        population: 4,
        electricity: 2,
        water: 2,
        waste: 1,
        happiness: 2,
        color: 0xd9b58d
    },

    townhouse: {
        name: "Townhouse",
        category: "Residential",
        cost: 1500,
        xp: 30,
        width: 1,
        depth: 1,
        population: 8,
        electricity: 3,
        water: 3,
        waste: 2,
        happiness: 2,
        color: 0xc78e6c
    },

    apartment: {
        name: "Apartment",
        category: "Residential",
        cost: 5000,
        xp: 80,
        width: 2,
        depth: 2,
        population: 30,
        electricity: 10,
        water: 9,
        waste: 7,
        happiness: 3,
        color: 0xaebbc2
    },

    apartmentTower: {
        name: "Apartment Tower",
        category: "Residential",
        cost: 12000,
        xp: 150,
        width: 2,
        depth: 2,
        population: 75,
        electricity: 24,
        water: 20,
        waste: 16,
        happiness: 4,
        color: 0x8498a5
    },

    shop: {
        name: "Shop",
        category: "Commercial",
        cost: 2500,
        xp: 50,
        width: 1,
        depth: 1,
        jobs: 8,
        electricity: 6,
        water: 3,
        waste: 3,
        happiness: 1,
        color: 0xd5a94e
    },

    restaurant: {
        name: "Restaurant",
        category: "Commercial",
        cost: 3500,
        xp: 60,
        width: 1,
        depth: 1,
        jobs: 12,
        electricity: 7,
        water: 5,
        waste: 5,
        happiness: 2,
        color: 0xb85e4e
    },

    supermarket: {
        name: "Supermarket",
        category: "Commercial",
        cost: 7000,
        xp: 100,
        width: 2,
        depth: 2,
        jobs: 25,
        electricity: 14,
        water: 8,
        waste: 10,
        happiness: 2,
        color: 0x669064
    },

    office: {
        name: "Office",
        category: "Commercial",
        cost: 9000,
        xp: 130,
        width: 2,
        depth: 2,
        jobs: 45,
        electricity: 20,
        water: 8,
        waste: 8,
        happiness: 1,
        color: 0x5f8498
    },

    warehouse: {
        name: "Warehouse",
        category: "Industrial",
        cost: 5000,
        xp: 70,
        width: 2,
        depth: 2,
        jobs: 20,
        electricity: 10,
        water: 5,
        waste: 12,
        pollution: 7,
        color: 0x858585
    },

    basicFactory: {
        name: "Basic Factory",
        category: "Factories",
        cost: 9000,
        xp: 120,
        width: 3,
        depth: 2,
        jobs: 30,
        electricity: 18,
        water: 10,
        waste: 15,
        pollution: 12,
        productionTime: 30,
        productionCapacity: 1,
        color: 0x777777
    },

    advancedFactory: {
        name: "Advanced Factory",
        category: "Factories",
        cost: 16000,
        xp: 200,
        width: 3,
        depth: 2,
        jobs: 50,
        electricity: 25,
        water: 15,
        waste: 18,
        pollution: 10,
        productionTime: 20,
        productionCapacity: 2,
        color: 0x657c8a
    },

    industrialFactory: {
        name: "Industrial Factory",
        category: "Factories",
        cost: 26000,
        xp: 300,
        width: 3,
        depth: 3,
        jobs: 80,
        electricity: 38,
        water: 24,
        waste: 30,
        pollution: 20,
        productionTime: 15,
        productionCapacity: 3,
        color: 0x656565
    },

    modernFactory: {
        name: "Modern Factory",
        category: "Factories",
        cost: 35000,
        xp: 400,
        width: 3,
        depth: 3,
        jobs: 100,
        electricity: 42,
        water: 25,
        waste: 25,
        pollution: 12,
        productionTime: 10,
        productionCapacity: 4,
        color: 0x507b8c
    },

    manufacturingPlant: {
        name: "Manufacturing Plant",
        category: "Factories",
        cost: 50000,
        xp: 600,
        width: 4,
        depth: 3,
        jobs: 140,
        electricity: 60,
        water: 40,
        waste: 45,
        pollution: 25,
        productionTime: 8,
        productionCapacity: 5,
        color: 0x575757
    },

    megaFactory: {
        name: "Mega Factory",
        category: "Factories",
        cost: 85000,
        xp: 1000,
        width: 4,
        depth: 4,
        jobs: 220,
        electricity: 90,
        water: 55,
        waste: 60,
        pollution: 35,
        productionTime: 5,
        productionCapacity: 8,
        color: 0x465a63
    },

    smallPark: {
        name: "Small Park",
        category: "Parks",
        cost: 1800,
        xp: 35,
        width: 1,
        depth: 1,
        radius: 2,
        happinessEffect: 5,
        color: 0x70b45c
    },

    playground: {
        name: "Playground",
        category: "Parks",
        cost: 2500,
        xp: 45,
        width: 1,
        depth: 1,
        radius: 3,
        happinessEffect: 7,
        color: 0x69ae58
    },

    neighborhoodPark: {
        name: "Neighborhood Park",
        category: "Parks",
        cost: 4000,
        xp: 65,
        width: 2,
        depth: 2,
        radius: 4,
        happinessEffect: 10,
        color: 0x5da84f
    },

    sportsPark: {
        name: "Sports Park",
        category: "Parks",
        cost: 6500,
        xp: 90,
        width: 3,
        depth: 3,
        radius: 5,
        happinessEffect: 14,
        color: 0x4e994d
    },

    botanicalGarden: {
        name: "Botanical Garden",
        category: "Parks",
        cost: 12000,
        xp: 150,
        width: 4,
        depth: 4,
        radius: 7,
        happinessEffect: 20,
        color: 0x48915c
    },

    largeCityPark: {
        name: "Large City Park",
        category: "Parks",
        cost: 20000,
        xp: 220,
        width: 5,
        depth: 5,
        radius: 10,
        happinessEffect: 28,
        color: 0x3d8c4c
    },

    powerPlant: {
        name: "Power Plant",
        category: "Utilities",
        cost: 18000,
        xp: 120,
        width: 3,
        depth: 3,
        electricitySupply: 150,
        electricity: 0,
        water: 10,
        waste: 5,
        pollution: 15,
        color: 0x765347
    },

    waterPlant: {
        name: "Water Plant",
        category: "Utilities",
        cost: 14000,
        xp: 100,
        width: 3,
        depth: 3,
        waterSupply: 150,
        electricity: 10,
        water: 0,
        waste: 4,
        pollution: 2,
        color: 0x4c83b8
    },

    wastePlant: {
        name: "Waste Facility",
        category: "Utilities",
        cost: 16000,
        xp: 110,
        width: 3,
        depth: 3,
        wasteSupply: 150,
        electricity: 12,
        water: 5,
        waste: 0,
        pollution: 10,
        color: 0x777777
    },

    fireStation: {
        name: "Fire Station",
        category: "Emergency Services",
        cost: 10000,
        xp: 90,
        width: 2,
        depth: 2,
        radius: 6,
        fire: 35,
        electricity: 8,
        water: 7,
        waste: 4,
        color: 0xc94a42
    },

    policeStation: {
        name: "Police Station",
        category: "Emergency Services",
        cost: 10000,
        xp: 90,
        width: 2,
        depth: 2,
        radius: 6,
        police: 35,
        electricity: 8,
        water: 5,
        waste: 4,
        color: 0x466c9d
    },

    hospital: {
        name: "Hospital",
        category: "Emergency Services",
        cost: 22000,
        xp: 180,
        width: 3,
        depth: 3,
        radius: 7,
        health: 40,
        electricity: 20,
        water: 15,
        waste: 10,
        color: 0xe3e3e3
    },

    school: {
        name: "School",
        category: "Education",
        cost: 13000,
        xp: 140,
        width: 3,
        depth: 3,
        radius: 7,
        education: 40,
        electricity: 10,
        water: 8,
        waste: 5,
        color: 0xd4b76d
    }
};

const categories = [
    {
        name: "Roads",
        items: ["road", "upgrade"]
    },

    {
        name: "Residential",
        items: [
            "house",
            "townhouse",
            "apartment",
            "apartmentTower"
        ]
    },

    {
        name: "Commercial",
        items: [
            "shop",
            "restaurant",
            "supermarket",
            "office"
        ]
    },

    {
        name: "Industrial",
        items: [
            "warehouse"
        ]
    },

    {
        name: "Factories",
        items: [
            "basicFactory",
            "advancedFactory",
            "industrialFactory",
            "modernFactory",
            "manufacturingPlant",
            "megaFactory"
        ]
    },

    {
        name: "Parks",
        items: [
            "smallPark",
            "playground",
            "neighborhoodPark",
            "sportsPark",
            "botanicalGarden",
            "largeCityPark"
        ]
    },

    {
        name: "Utilities",
        items: [
            "powerPlant",
            "waterPlant",
            "wastePlant"
        ]
    },

    {
        name: "Emergency Services",
        items: [
            "fireStation",
            "policeStation",
            "hospital"
        ]
    },

    {
        name: "Education",
        items: [
            "school"
        ]
    }
];

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(
        CITY_SIZE,
        CITY_SIZE
    ),
    new THREE.MeshStandardMaterial({
        color: 0x78a86a,
        roughness: 1
    })
);

ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

function createWater() {
    const river = new THREE.Mesh(
        new THREE.PlaneGeometry(
            CITY_SIZE,
            18
        ),
        new THREE.MeshStandardMaterial({
            color: 0x3d9ed0,
            roughness: 0.25,
            metalness: 0.05
        })
    );

    river.rotation.x = -Math.PI / 2;
    river.position.set(
        0,
        -0.12,
        -31
    );

    scene.add(river);

    const lake = new THREE.Mesh(
        new THREE.CircleGeometry(
            14,
            48
        ),
        new THREE.MeshStandardMaterial({
            color: 0x3d9ed0,
            roughness: 0.25,
            metalness: 0.05
        })
    );

    lake.rotation.x = -Math.PI / 2;
    lake.position.set(
        24,
        -0.1,
        20
    );

    scene.add(lake);
}

createWater();

function createGrid() {
    const group = new THREE.Group();

    const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.11
    });

    for (
        let x = -HALF;
        x <= HALF;
        x += TILE
    ) {
        const geometry =
            new THREE.BufferGeometry()
                .setFromPoints([
                    new THREE.Vector3(
                        x,
                        0.025,
                        -HALF
                    ),

                    new THREE.Vector3(
                        x,
                        0.025,
                        HALF
                    )
                ]);

        group.add(
            new THREE.Line(
                geometry,
                material
            )
        );
    }

    for (
        let z = -HALF;
        z <= HALF;
        z += TILE
    ) {
        const geometry =
            new THREE.BufferGeometry()
                .setFromPoints([
                    new THREE.Vector3(
                        -HALF,
                        0.025,
                        z
                    ),

                    new THREE.Vector3(
                        HALF,
                        0.025,
                        z
                    )
                ]);

        group.add(
            new THREE.Line(
                geometry,
                material
            )
        );
    }

    scene.add(group);
}

createGrid();

function key(x, z) {
    return `${x},${z}`;
}

function center(x, z) {
    return {
        x: x * TILE + TILE / 2,
        z: z * TILE + TILE / 2
    };
}

function worldToTile(x, z) {
    return {
        x:
            Math.floor(
                (x + HALF) / TILE
            ) -
            Math.floor(
                CITY_SIZE / TILE / 2
            ),

        z:
            Math.floor(
                (z + HALF) / TILE
            ) -
            Math.floor(
                CITY_SIZE / TILE / 2
            )
    };
}

function roadExists(x, z) {
    return roads.has(
        key(x, z)
    );
}

function buildingOccupies(x, z) {
    for (
        const building of buildings.values()
    ) {
        for (
            let dx = 0;
            dx < building.width;
            dx++
        ) {
            for (
                let dz = 0;
                dz < building.depth;
                dz++
            ) {
                if (
                    building.x + dx === x &&
                    building.z + dz === z
                ) {
                    return true;
                }
            }
        }
    }

    return false;
}

function areaFree(
    x,
    z,
    width,
    depth
) {
    for (
        let dx = 0;
        dx < width;
        dx++
    ) {
        for (
            let dz = 0;
            dz < depth;
            dz++
        ) {
            const tx = x + dx;
            const tz = z + dz;

            if (
                tx < -8 ||
                tz < -8 ||
                tx > 7 ||
                tz > 7
            ) {
                return false;
            }

            if (
                roadExists(
                    tx,
                    tz
                )
            ) {
                return false;
            }

            if (
                buildingOccupies(
                    tx,
                    tz
                )
            ) {
                return false;
            }
        }
    }

    return true;
}

function adjacentRoad(
    x,
    z,
    width,
    depth
) {
    for (
        let dx = -1;
        dx <= width;
        dx++
    ) {
        if (
            roadExists(
                x + dx,
                z - 1
            )
        ) {
            return true;
        }

        if (
            roadExists(
                x + dx,
                z + depth
            )
        ) {
            return true;
        }
    }

    for (
        let dz = 0;
        dz < depth;
        dz++
    ) {
        if (
            roadExists(
                x - 1,
                z + dz
            )
        ) {
            return true;
        }

        if (
            roadExists(
                x + width,
                z + dz
            )
        ) {
            return true;
        }
    }

    return false;
}

function roadConnections(x, z) {
    return {
        n: roadExists(x, z - 1),
        s: roadExists(x, z + 1),
        e: roadExists(x + 1, z),
        w: roadExists(x - 1, z)
    };
}

function createRoadObject(
    x,
    z,
    type
) {
    const c = center(x, z);
    const group = new THREE.Group();

    const width =
        type === "basic"
            ? 4.5
            : type === "avenue"
                ? 5
                : type === "major"
                    ? 6
                    : 7;

    const road = new THREE.Mesh(
        new THREE.BoxGeometry(
            width,
            0.18,
            TILE
        ),
        new THREE.MeshStandardMaterial({
            color:
                type === "basic"
                    ? 0x404347
                    : type === "avenue"
                        ? 0x36393c
                        : type === "major"
                            ? 0x303336
                            : 0x25282b,
            roughness: 0.95
        })
    );

    road.position.set(
        c.x,
        0.09,
        c.z
    );

    road.castShadow = true;
    road.receiveShadow = true;

    group.add(road);

    const connections =
        roadConnections(x, z);

    const count =
        Number(connections.n) +
        Number(connections.s) +
        Number(connections.e) +
        Number(connections.w);

    const markMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xf2d44f
        });

    if (
        count === 0 ||
        count === 1
    ) {
        const line =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    TILE,
                    0.04,
                    0.12
                ),
                markMaterial
            );

        line.position.set(
            c.x,
            0.2,
            c.z
        );

        group.add(line);
    }

    if (
        connections.n &&
        connections.s
    ) {
        const line =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.12,
                    0.04,
                    TILE
                ),
                markMaterial
            );

        line.position.set(
            c.x,
            0.2,
            c.z
        );

        group.add(line);
    }

    if (
        connections.e &&
        connections.w
    ) {
        const line =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    TILE,
                    0.04,
                    0.12
                ),
                markMaterial
            );

        line.position.set(
            c.x,
            0.2,
            c.z
        );

        group.add(line);
    }

    if (
        count >= 3
    ) {
        const line1 =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    TILE,
                    0.04,
                    0.1
                ),
                markMaterial
            );

        line1.position.set(
            c.x,
            0.2,
            c.z
        );

        const line2 =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.1,
                    0.04,
                    TILE
                ),
                markMaterial
            );

        line2.position.set(
            c.x,
            0.2,
            c.z
        );

        group.add(line1);
        group.add(line2);
    }

    scene.add(group);

    return group;
}

function rebuildRoad(
    x,
    z
) {
    const data =
        roads.get(
            key(x, z)
        );

    if (!data) {
        return;
    }

    if (
        data.object
    ) {
        scene.remove(
            data.object
        );
    }

    data.object =
        createRoadObject(
            x,
            z,
            data.type
        );
}

function updateRoads(
    x,
    z
) {
    const nearby = [
        [x, z],
        [x - 1, z],
        [x + 1, z],
        [x, z - 1],
        [x, z + 1]
    ];

    for (
        const [rx, rz] of nearby
    ) {
        rebuildRoad(
            rx,
            rz
        );
    }
}

function buildRoad(
    x,
    z
) {
    if (
        roads.has(
            key(x, z)
        )
    ) {
        showStatus(
            "Road already built"
        );
        return;
    }

    if (
        buildingOccupies(
            x,
            z
        )
    ) {
        showStatus(
            "A building is here"
        );
        return;
    }

    if (
        money < 300
    ) {
        showStatus(
            "Not enough money"
        );
        return;
    }

    const data = {
        x,
        z,
        type: "basic",
        object: null
    };

    roads.set(
        key(x, z),
        data
    );

    data.object =
        createRoadObject(
            x,
            z,
            "basic"
        );

    updateRoads(
        x,
        z
    );

    money -= 300;

    gainXP(10);
    updateStats();
}

function upgradeRoad(
    x,
    z
) {
    const data =
        roads.get(
            key(x, z)
        );

    if (!data) {
        showStatus(
            "There is no road here"
        );
        return;
    }

    const levels = [
        "basic",
        "avenue",
        "major",
        "highway"
    ];

    const costs = [
        700,
        1400,
        3000
    ];

    const current =
        levels.indexOf(
            data.type
        );

    if (
        current ===
        levels.length - 1
    ) {
        showStatus(
            "Maximum road level"
        );
        return;
    }

    if (
        money <
        costs[current]
    ) {
        showStatus(
            "Not enough money"
        );
        return;
    }

    money -=
        costs[current];

    data.type =
        levels[
            current + 1
        ];

    rebuildRoad(
        x,
        z
    );

    updateRoads(
        x,
        z
    );

    gainXP(20);
    updateStats();

    showStatus(
        `${data.type.toUpperCase()} built`
    );
}

function isUnlocked(
    id
) {
    for (
        let l = 1;
        l <= level;
        l++
    ) {
        if (
            levelData[l] &&
            levelData[l].unlock.includes(id)
        ) {
            return true;
        }
    }

    return false;
}

function factoryLimit() {
    if (level >= 8) return 4;
    if (level >= 5) return 2;
    return 1;
}

function canBuildFactory() {
    return (
        factories.length <
        factoryLimit()
    );
}

function gainXP(amount) {
    xp += amount;

    let newLevel =
        level;

    for (
        let l = 10;
        l >= 1;
        l--
    ) {
        if (
            xp >=
            levelData[l].xp
        ) {
            newLevel = l;
            break;
        }
    }

    if (
        newLevel >
        level
    ) {
        level =
            newLevel;

        showStatus(
            `LEVEL ${level} UNLOCKED`
        );

        updateBuildMenu();
    }

    updateStats();
}

function createTree() {
    const group =
        new THREE.Group();

    const trunk =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.15,
                0.22,
                1.4,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x6e5038
            })
        );

    trunk.position.y =
        0.7;

    group.add(
        trunk
    );

    const leaves =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.9,
                8,
                6
            ),
            new THREE.MeshStandardMaterial({
                color: 0x448648
            })
        );

    leaves.position.y =
        1.7;

    group.add(
        leaves
    );

    return group;
}

function addWindows(
    group,
    width,
    depth,
    y,
    count,
    color = 0x94cad7
) {
    const material =
        new THREE.MeshStandardMaterial({
            color,
            roughness: 0.2
        });

    const spacing =
        width /
        (count + 1);

    for (
        let i = 1;
        i <= count;
        i++
    ) {
        const window =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.55,
                    0.65,
                    0.08
                ),
                material
            );

        window.position.set(
            -width / 2 +
                spacing * i,
            y,
            depth / 2
        );

        group.add(
            window
        );

        const back =
            window.clone();

        back.position.z =
            -depth / 2;

        group.add(
            back
        );
    }
}

function addDoor(
    group,
    depth
) {
    const door =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.7,
                1.4,
                0.08
            ),
            new THREE.MeshStandardMaterial({
                color: 0x514137
            })
        );

    door.position.set(
        0,
        0.7,
        depth / 2
    );

    group.add(
        door
    );
}

function houseObject(
    type
) {
    const group =
        new THREE.Group();

    const width =
        type.width * TILE -
        0.5;

    const depth =
        type.depth * TILE -
        0.5;

    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                width,
                2.7,
                depth
            ),
            new THREE.MeshStandardMaterial({
                color:
                    type.color
            })
        );

    body.position.y =
        1.35;

    body.castShadow = true;

    group.add(
        body
    );

    const roof =
        new THREE.Mesh(
            new THREE.ConeGeometry(
                Math.max(
                    width,
                    depth
                ) * 0.7,
                2.2,
                4
            ),
            new THREE.MeshStandardMaterial({
                color: 0x70473b
            })
        );

    roof.position.y =
        3.8;

    roof.rotation.y =
        Math.PI / 4;

    group.add(
        roof
    );

    addWindows(
        group,
        width,
        depth,
        1.8,
        2
    );

    addDoor(
        group,
        depth
    );

    return group;
}

function apartmentObject(
    type
) {
    const group =
        new THREE.Group();

    const width =
        type.width * TILE -
        0.4;

    const depth =
        type.depth * TILE -
        0.4;

    const floors =
        type.name ===
        "Apartment Tower"
            ? 9
            : 4;

    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                width,
                floors * 2,
                depth
            ),
            new THREE.MeshStandardMaterial({
                color:
                    type.color
            })
        );

    body.position.y =
        floors;

    body.castShadow = true;

    group.add(
        body
    );

    for (
        let floor = 0;
        floor < floors;
        floor++
    ) {
        addWindows(
            group,
            width,
            depth,
            0.8 +
                floor * 2,
            5
        );
    }

    return group;
}

function shopObject(
    type
) {
    const group =
        new THREE.Group();

    const width =
        type.width * TILE -
        0.4;

    const depth =
        type.depth * TILE -
        0.4;

    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                width,
                3.5,
                depth
            ),
            new THREE.MeshStandardMaterial({
                color:
                    type.color
            })
        );

    body.position.y =
        1.75;

    body.castShadow = true;

    group.add(
        body
    );

    const glass =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                width * 0.75,
                1.3,
                0.08
            ),
            new THREE.MeshStandardMaterial({
                color: 0x9dd2df,
                roughness: 0.2
            })
        );

    glass.position.set(
        0,
        1.3,
        depth / 2
    );

    group.add(
        glass
    );

    return group;
}

function factoryObject(
    type
) {
    const group =
        new THREE.Group();

    const width =
        type.width * TILE -
        0.35;

    const depth =
        type.depth * TILE -
        0.35;

    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                width,
                4.5,
                depth
            ),
            new THREE.MeshStandardMaterial({
                color:
                    type.color
            })
        );

    body.position.y =
        2.25;

    body.castShadow = true;

    group.add(
        body
    );

    const roof =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                width + 0.25,
                0.3,
                depth + 0.25
            ),
            new THREE.MeshStandardMaterial({
                color: 0x4d5154
            })
        );

    roof.position.y =
        4.6;

    group.add(
        roof
    );

    const chimneys =
        type.name ===
            "Basic Factory"
            ? 1
            : type.name ===
                "Advanced Factory"
                ? 2
                : 3;

    for (
        let i = 0;
        i < chimneys;
        i++
    ) {
        const chimney =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.35,
                    0.45,
                    4.5,
                    10
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x555555
                })
            );

        chimney.position.set(
            -width / 3 +
                i * 2,
            6.8,
            -depth / 4
        );

        group.add(
            chimney
        );
    }

    return group;
}

function parkObject(
    type
) {
    const group =
        new THREE.Group();

    const width =
        type.width * TILE -
        0.3;

    const depth =
        type.depth * TILE -
        0.3;

    const grass =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                width,
                0.16,
                depth
            ),
            new THREE.MeshStandardMaterial({
                color:
                    type.color
            })
        );

    grass.position.y =
        0.1;

    group.add(
        grass
    );

    const count =
        Math.max(
            3,
            Math.floor(
                type.width *
                type.depth *
                0.65
            )
        );

    for (
        let i = 0;
        i < count;
        i++
    ) {
        const tree =
            createTree();

        tree.position.set(
            (Math.random() - 0.5) *
                Math.max(
                    1,
                    width - 1
                ),
            0,
            (Math.random() - 0.5) *
                Math.max(
                    1,
                    depth - 1
                )
        );

        tree.scale.setScalar(
            0.65 +
                Math.random() *
                0.35
        );

        group.add(
            tree
        );
    }

    return group;
}

function serviceObject(
    type
) {
    const group =
        new THREE.Group();

    const width =
        type.width * TILE -
        0.4;

    const depth =
        type.depth * TILE -
        0.4;

    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                width,
                4,
                depth
            ),
            new THREE.MeshStandardMaterial({
                color:
                    type.color
            })
        );

    body.position.y =
        2;

    group.add(
        body
    );

    const roof =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                width + 0.2,
                0.3,
                depth + 0.2
            ),
            new THREE.MeshStandardMaterial({
                color: 0x454545
            })
        );

    roof.position.y =
        4.15;

    group.add(
        roof
    );

    return group;
}

function buildingObject(
    type
) {
    if (
        type.category ===
        "Residential"
    ) {
        if (
            type.name ===
            "House" ||
            type.name ===
            "Townhouse"
        ) {
            return houseObject(
                type
            );
        }

        return apartmentObject(
            type
        );
    }

    if (
        type.category ===
        "Commercial"
    ) {
        return shopObject(
            type
        );
    }

    if (
        type.category ===
        "Factories"
    ) {
        return factoryObject(
            type
        );
    }

    if (
        type.category ===
        "Industrial"
    ) {
        return factoryObject(
            type
        );
    }

    if (
        type.category ===
        "Parks"
    ) {
        return parkObject(
            type
        );
    }

    return serviceObject(
        type
    );
}

function createEffect(
    data,
    type
) {
    if (
        !type.radius
    ) {
        return;
    }

    effects.push({
        x: data.x,
        z: data.z,
        radius: type.radius,
        happiness:
            type.happinessEffect ||
            0,
        health:
            type.health ||
            0,
        fire:
            type.fire ||
            0,
        police:
            type.police ||
            0,
        education:
            type.education ||
            0,
        object: null
    });
}

function createBuilding(
    id,
    x,
    z
) {
    const type =
        types[id];

    if (!type) {
        return;
    }

    if (
        !isUnlocked(id)
    ) {
        showStatus(
            "Locked — level up first"
        );
        return;
    }

    if (
        type.category ===
        "Factories"
    ) {
        if (
            !canBuildFactory()
        ) {
            showStatus(
                `Factory limit: ${factoryLimit()}`
            );
            return;
        }
    }

    if (
        !areaFree(
            x,
            z,
            type.width,
            type.depth
        )
    ) {
        showStatus(
            "That space is occupied"
        );
        return;
    }

    if (
        !adjacentRoad(
            x,
            z,
            type.width,
            type.depth
        )
    ) {
        showStatus(
            "Connect it to a road"
        );
        return;
    }

    if (
        money <
        type.cost
    ) {
        showStatus(
            "Not enough money"
        );
        return;
    }

    money -=
        type.cost;

    const c =
        center(
            x +
                (type.width - 1) /
                    2,
            z +
                (type.depth - 1) /
                    2
        );

    const data = {
        id:
            `${id}-${Date.now()}-${Math.random()}`,
        typeId: id,
        x,
        z,
        width:
            type.width,
        depth:
            type.depth,
        object: null
    };

    const object =
        buildingObject(
            type
        );

    object.position.set(
        c.x,
        0,
        c.z
    );

    object.scale.y =
        0.05;

    scene.add(
        object
    );

    data.object =
        object;

    buildings.set(
        data.id,
        data
    );

    construction.push({
        object,
        target: 1,
        speed:
            1 /
            Math.max(
                2,
                type.buildTime ||
                3
            )
    });

    createEffect(
        data,
        type
    );

    if (
        type.category ===
        "Factories"
    ) {
        factories.push({
            buildingId:
                data.id,
            typeId: id,
            production: 0,
            working: true
        });
    }

    gainXP(
        type.xp
    );

    updateStats();

    showStatus(
        `${type.name} construction started`
    );
}

function updateStats() {
    population = 0;
    jobs = 0;
    pollution = 0;

    services.electricity.supply = 0;
    services.electricity.demand = 0;

    services.water.supply = 0;
    services.water.demand = 0;

    services.waste.supply = 0;
    services.waste.demand = 0;

    services.health = 0;
    services.fire = 0;
    services.police = 0;
    services.education = 0;

    let baseHappiness =
        70;

    for (
        const building of buildings.values()
    ) {
        const type =
            types[
                building.typeId
            ];

        population +=
            type.population ||
            0;

        jobs +=
            type.jobs ||
            0;

        services.electricity.demand +=
            type.electricity ||
            0;

        services.water.demand +=
            type.water ||
            0;

        services.waste.demand +=
            type.waste ||
            0;

        services.electricity.supply +=
            type.electricitySupply ||
            0;

        services.water.supply +=
            type.waterSupply ||
            0;

        services.waste.supply +=
            type.wasteSupply ||
            0;

        pollution +=
            type.pollution ||
            0;

        baseHappiness +=
            type.happiness ||
            0;
    }

    let parkBonus = 0;

    for (
        const effect of effects
    ) {
        parkBonus +=
            effect.happiness ||
            0;

        services.health +=
            effect.health ||
            0;

        services.fire +=
            effect.fire ||
            0;

        services.police +=
            effect.police ||
            0;

        services.education +=
            effect.education ||
            0;
    }

    let rating =
        baseHappiness +
        parkBonus;

    const powerRatio =
        services.electricity.demand === 0
            ? 1
            :
            Math.min(
                1,
                services.electricity.supply /
                services.electricity.demand
            );

    const waterRatio =
        services.water.demand === 0
            ? 1
            :
            Math.min(
                1,
                services.water.supply /
                services.water.demand
            );

    const wasteRatio =
        services.waste.demand === 0
            ? 1
            :
            Math.min(
                1,
                services.waste.supply /
                services.waste.demand
            );

    const serviceRatio =
        Math.min(
            powerRatio,
            waterRatio,
            wasteRatio
        );

    if (
        serviceRatio <
        1
    ) {
        rating -=
            (1 - serviceRatio) *
            45;
    }

    rating -=
        Math.min(
            25,
            pollution * 0.08
        );

    if (
        population >
        0
    ) {
        if (
            services.health <
            population * 0.1
        ) {
            rating -= 3;
        }

        if (
            services.education <
            population * 0.1
        ) {
            rating -= 3;
        }
    }

    happiness =
        Math.max(
            0,
            Math.min(
                100,
                Math.round(
                    rating
                )
            )
        );

    traffic =
        Math.min(
            100,
            Math.round(
                buildings.size * 1.5 +
                roads.size * 0.6
            )
        );

    const income =
        population * 3 +
        jobs * 2;

    const moneyElement =
        document.getElementById(
            "money"
        );

    const populationElement =
        document.getElementById(
            "population"
        );

    const happinessElement =
        document.getElementById(
            "happiness"
        );

    const trafficElement =
        document.getElementById(
            "traffic"
        );

    const incomeElement =
        document.getElementById(
            "income"
        );

    const levelElement =
        document.getElementById(
            "city-level"
        );

    const xpElement =
        document.getElementById(
            "city-xp"
        );

    if (
        moneyElement
    ) {
        moneyElement.textContent =
            `$${Math.floor(
                money
            ).toLocaleString()}`;
    }

    if (
        populationElement
    ) {
        populationElement.textContent =
            population.toLocaleString();
    }

    if (
        happinessElement
    ) {
        happinessElement.textContent =
            `${happiness}%`;
    }

    if (
        trafficElement
    ) {
        trafficElement.textContent =
            `${traffic}%`;
    }

    if (
        incomeElement
    ) {
        incomeElement.textContent =
            `+$${income}/day`;
    }

    if (
        levelElement
    ) {
        levelElement.textContent =
            `Level ${level}`;
    }

    if (
        xpElement
    ) {
        const next =
            level < 10
                ? levelData[
                    level + 1
                ].xp
                : levelData[10].xp;

        xpElement.textContent =
            level >= 10
                ? "MAX LEVEL"
                :
                `${xp}/${next} XP`;
    }

    updateServicePanel();
}

function updateServicePanel() {
    let panel =
        document.getElementById(
            "service-panel"
        );

    if (!panel) {
        panel =
            document.createElement(
                "div"
            );

        panel.id =
            "service-panel";

        panel.style.position =
            "absolute";

        panel.style.right =
            "18px";

        panel.style.bottom =
            "18px";

        panel.style.width =
            "245px";

        panel.style.padding =
            "14px";

        panel.style.borderRadius =
            "14px";

        panel.style.background =
            "rgba(19,25,28,.95)";

        panel.style.color =
            "white";

        panel.style.zIndex =
            "20";

        panel.style.fontSize =
            "12px";

        panel.style.boxShadow =
            "0 12px 40px rgba(0,0,0,.3)";

        document
            .getElementById(
                "game"
            )
            .appendChild(
                panel
            );
    }

    const power =
        services.electricity;

    const water =
        services.water;

    const waste =
        services.waste;

    function ratio(
        supply,
        demand
    ) {
        if (
            demand === 0
        ) {
            return 100;
        }

        return Math.round(
            Math.min(
                100,
                supply /
                demand *
                100
            )
        );
    }

    panel.innerHTML = `
        <div style="font-weight:800;font-size:14px;margin-bottom:10px">
            CITY SERVICES
        </div>

        <div style="margin:6px 0">
            ⚡ Electricity
            <b style="float:right">
                ${power.supply}/${power.demand}
            </b>
        </div>

        <div style="height:5px;background:#30383c;border-radius:5px;overflow:hidden">
            <div style="height:100%;width:${ratio(power.supply,power.demand)}%;background:#e7c84b"></div>
        </div>

        <div style="margin:10px 0 6px">
            💧 Water
            <b style="float:right">
                ${water.supply}/${water.demand}
            </b>
        </div>

        <div style="height:5px;background:#30383c;border-radius:5px;overflow:hidden">
            <div style="height:100%;width:${ratio(water.supply,water.demand)}%;background:#4ca9df"></div>
        </div>

        <div style="margin:10px 0 6px">
            ♻️ Waste
            <b style="float:right">
                ${waste.supply}/${waste.demand}
            </b>
        </div>

        <div style="height:5px;background:#30383c;border-radius:5px;overflow:hidden">
            <div style="height:100%;width:${ratio(waste.supply,waste.demand)}%;background:#8e9a8e"></div>
        </div>

        <div style="margin-top:12px;padding-top:9px;border-top:1px solid rgba(255,255,255,.1)">
            🏥 Health: ${Math.round(services.health)}
        </div>

        <div style="margin-top:5px">
            🚒 Fire: ${Math.round(services.fire)}
        </div>

        <div style="margin-top:5px">
            🚓 Police: ${Math.round(services.police)}
        </div>

        <div style="margin-top:5px">
            🎓 Education: ${Math.round(services.education)}
        </div>

        <div style="margin-top:5px">
            ☁️ Pollution: ${Math.round(pollution)}
        </div>

        <div style="margin-top:8px">
            🏭 Factories: ${factories.length}/${factoryLimit()}
        </div>
    `;
}

function createEffectTiles() {
    for (
        const effect of effects
    ) {
        if (
            effect.object
        ) {
            scene.remove(
                effect.object
            );
        }

        const group =
            new THREE.Group();

        const color =
            effect.happiness
                ? 0x55c878
                : 0x4c8edb;

        for (
            let dx =
                -effect.radius;
            dx <=
                effect.radius;
            dx++
        ) {
            for (
                let dz =
                    -effect.radius;
                dz <=
                    effect.radius;
                dz++
            ) {
                if (
                    Math.sqrt(
                        dx * dx +
                        dz * dz
                    ) >
                    effect.radius
                ) {
                    continue;
                }

                const c =
                    center(
                        effect.x +
                            dx,
                        effect.z +
                            dz
                    );

                const tile =
                    new THREE.Mesh(
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

                tile.rotation.x =
                    -Math.PI / 2;

                tile.position.set(
                    c.x,
                    0.07,
                    c.z
                );

                group.add(
                    tile
                );
            }
        }

        group.visible =
            false;

        scene.add(
            group
        );

        effect.object =
            group;
    }
}

function toggleCoverage() {
    let show =
        false;

    for (
        const effect of effects
    ) {
        if (
            effect.object
        ) {
            show =
                !effect.object.visible;
            break;
        }
    }

    for (
        const effect of effects
    ) {
        if (
            effect.object
        ) {
            effect.object.visible =
                show;
        }
    }

    showStatus(
        show
            ? "Coverage shown"
            : "Coverage hidden"
    );
}

function showStatus(
    text
) {
    let status =
        document.getElementById(
            "build-status"
        );

    if (!status) {
        status =
            document.createElement(
                "div"
            );

        status.id =
            "build-status";

        status.className =
            "build-status";

        document
            .getElementById(
                "game"
            )
            .appendChild(
                status
            );
    }

    status.textContent =
        text;

    status.classList.add(
        "show"
    );

    clearTimeout(
        status.timer
    );

    status.timer =
        setTimeout(
            () => {
                status.classList.remove(
                    "show"
                );
            },
            1800
        );
}

function createUI() {
    const top =
        document.createElement(
            "div"
        );

    top.className =
        "city-topbar";

    top.innerHTML = `
        <div class="city-title">
            Cities - Flashcard.com
        </div>

        <div class="city-stats">

            <div class="stat">
                <div class="stat-label">
                    Level
                </div>
                <div class="stat-value"
                     id="city-level">
                    Level 1
                </div>
            </div>

            <div class="stat">
                <div class="stat-label">
                    XP
                </div>
                <div class="stat-value"
                     id="city-xp">
                    0/100 XP
                </div>
            </div>

            <div class="stat">
                <div class="stat-label">
                    Money
                </div>
                <div class="stat-value"
                     id="money">
                    $50,000
                </div>
            </div>

            <div class="stat">
                <div class="stat-label">
                    Population
                </div>
                <div class="stat-value"
                     id="population">
                    0
                </div>
            </div>

            <div class="stat">
                <div class="stat-label">
                    Happiness
                </div>
                <div class="stat-value"
                     id="happiness">
                    70%
                </div>
            </div>

            <div class="stat">
                <div class="stat-label">
                    Income
                </div>
                <div class="stat-value"
                     id="income">
                    +$0/day
                </div>
            </div>
        </div>
    `;

    document
        .getElementById(
            "game"
        )
        .appendChild(
            top
        );

    const button =
        document.createElement(
            "button"
        );

    button.className =
        "build-main";

    button.id =
        "build-button";

    button.textContent =
        "BUILD";

    document
        .getElementById(
            "game"
        )
        .appendChild(
            button
        );

    const menu =
        document.createElement(
            "div"
        );

    menu.className =
        "build-menu";

    menu.id =
        "build-menu";

    menu.innerHTML = `
        <div class="menu-header">
            <div class="menu-title">
                Build
            </div>

            <button
                class="close-menu"
                id="close-menu">
                ×
            </button>
        </div>

        <div
            id="category-tabs"
            style="
                display:flex;
                gap:7px;
                overflow-x:auto;
                margin-bottom:12px;
                padding-bottom:3px;
            ">
        </div>

        <div
            class="build-grid"
            id="build-grid">
        </div>

        <div
            class="build-info"
            id="build-info">
        </div>
    `;

    document
        .getElementById(
            "game"
        )
        .appendChild(
            menu
        );

    const tabs =
        document.getElementById(
            "category-tabs"
        );

    const grid =
        document.getElementById(
            "build-grid"
        );

    let currentCategory =
        "Residential";

    function renderCategory(
        category
    ) {
        currentCategory =
            category;

        tabs
            .querySelectorAll(
                "button"
            )
            .forEach(
                b => {
                    b.style.background =
                        b.dataset.category ===
                        category
                            ? "#4b7bec"
                            : "#252d31";
                }
            );

        grid.innerHTML =
            "";

        const data =
            categories.find(
                c =>
                    c.name ===
                    category
            );

        if (!data) {
            return;
        }

        for (
            const id of
            data.items
        ) {
            if (
                id !== "road" &&
                id !== "upgrade" &&
                !isUnlocked(id)
            ) {
                continue;
            }

            const type =
                types[id];

            const card =
                document.createElement(
                    "button"
                );

            card.className =
                "build-card";

            if (
                id === "road"
            ) {
                card.innerHTML = `
                    <div class="build-icon">
                        🛣️
                    </div>
                    <div class="build-name">
                        Road
                    </div>
                    <div class="build-price">
                        $300
                    </div>
                `;
            } else if (
                id === "upgrade"
            ) {
                card.innerHTML = `
                    <div class="build-icon">
                        ⬆️
                    </div>
                    <div class="build-name">
                        Upgrade Road
                    </div>
                    <div class="build-price">
                        $700+
                    </div>
                `;
            } else {
                const lockedFactory =
                    type.category ===
                        "Factories" &&
                    factories.length >=
                        factoryLimit();

                card.innerHTML = `
                    <div class="build-icon">
                        ${
                            type.category ===
                            "Residential"
                                ? "🏠"
                                : type.category ===
                                    "Commercial"
                                    ? "🏢"
                                    : type.category ===
                                        "Factories"
                                        ? "🏭"
                                        : type.category ===
                                            "Parks"
                                            ? "🌳"
                                            : type.category ===
                                                "Utilities"
                                                ? "⚡"
                                                : "🏛️"
                        }
                    </div>

                    <div class="build-name">
                        ${type.name}
                    </div>

                    <div class="build-price">
                        ${
                            lockedFactory
                                ? `Limit ${factoryLimit()}`
                                : `$${type.cost.toLocaleString()}`
                        }
                    </div>
                `;
            }

            card.addEventListener(
                "click",
                () => {
                    if (
                        id !== "road" &&
                        id !== "upgrade" &&
                        !isUnlocked(id)
                    ) {
                        showStatus(
                            "Locked"
                        );
                        return;
                    }

                    selectedTool =
                        id;

                    menu.classList.remove(
                        "open"
                    );

                    button.classList.remove(
                        "active"
                    );

                    showStatus(
                        id === "road"
                            ? "Road selected"
                            : id === "upgrade"
                                ? "Upgrade selected"
                                : `${types[id].name} selected`
                    );
                }
            );

            grid.appendChild(
                card
            );
        }

        document.getElementById(
            "build-info"
        ).textContent =
            category === "Factories"
                ? `Factories: ${factories.length}/${factoryLimit()} available`
                : "Buildings must connect to a road.";
    }

    for (
        const category of categories
    ) {
        const tab =
            document.createElement(
                "button"
            );

        tab.dataset.category =
            category.name;

        tab.textContent =
            category.name;

        tab.style.border =
            "0";

        tab.style.padding =
            "9px 12px";

        tab.style.borderRadius =
            "9px";

        tab.style.background =
            "#252d31";

        tab.style.color =
            "white";

        tab.style.cursor =
            "pointer";

        tab.style.fontWeight =
            "700";

        tab.addEventListener(
            "click",
            () => {
                renderCategory(
                    category.name
                );
            }
        );

        tabs.appendChild(
            tab
        );
    }

    renderCategory(
        currentCategory
    );

    window.updateBuildMenu =
        () => {
            renderCategory(
                currentCategory
            );
        };

    button.addEventListener(
        "click",
        () => {
            menu.classList.toggle(
                "open"
            );

            button.classList.toggle(
                "active"
            );
        }
    );

    document
        .getElementById(
            "close-menu"
        )
        .addEventListener(
            "click",
            () => {
                menu.classList.remove(
                    "open"
                );

                button.classList.remove(
                    "active"
                );
            }
        );

    const tools =
        document.createElement(
            "div"
        );

    tools.style.position =
        "absolute";

    tools.style.top =
        "92px";

    tools.style.left =
        "18px";

    tools.style.zIndex =
        "20";

    tools.style.display =
        "flex";

    tools.style.gap =
        "7px";

    tools.innerHTML = `
        <button
            id="coverage-tool"
            style="
                border:0;
                padding:10px 13px;
                border-radius:9px;
                background:#263238;
                color:white;
                cursor:pointer;
                font-weight:700;
            ">
            COVERAGE
        </button>
    `;

    document
        .getElementById(
            "game"
        )
        .appendChild(
            tools
        );

    document
        .getElementById(
            "coverage-tool"
        )
        .addEventListener(
            "click",
            toggleCoverage
        );
}

createUI();

const raycaster =
    new THREE.Raycaster();

const mouse =
    new THREE.Vector2();

const hover =
    new THREE.Mesh(
        new THREE.PlaneGeometry(
            TILE - 0.12,
            TILE - 0.12
        ),
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.12
        })
    );

hover.rotation.x =
    -Math.PI / 2;

hover.position.y =
    0.08;

hover.visible =
    false;

scene.add(
    hover
);

const preview =
    new THREE.Mesh(
        new THREE.BoxGeometry(
            TILE,
            0.1,
            TILE
        ),
        new THREE.MeshBasicMaterial({
            color: 0x65c978,
            transparent: true,
            opacity: 0.3
        })
    );

preview.position.y =
    0.12;

preview.visible =
    false;

scene.add(
    preview
);

function pointerTile(
    event
) {
    const rect =
        renderer.domElement.getBoundingClientRect();

    mouse.x =
        ((event.clientX -
            rect.left) /
            rect.width) *
            2 -
        1;

    mouse.y =
        -(
            (event.clientY -
                rect.top) /
            rect.height
        ) *
            2 +
        1;

    raycaster.setFromCamera(
        mouse,
        camera
    );

    const hit =
        raycaster.intersectObject(
            ground
        )[0];

    if (!hit) {
        return null;
    }

    return worldToTile(
        hit.point.x,
        hit.point.z
    );
}

renderer.domElement.addEventListener(
    "pointermove",
    event => {
        const tile =
            pointerTile(
                event
            );

        if (!tile) {
            hover.visible =
                false;

            preview.visible =
                false;

            return;
        }

        const c =
            center(
                tile.x,
                tile.z
            );

        hover.position.set(
            c.x,
            0.08,
            c.z
        );

        hover.visible =
            true;

        if (
            selectedTool &&
            types[
                selectedTool
            ]
        ) {
            const type =
                types[
                    selectedTool
                ];

            const pc =
                center(
                    tile.x +
                        (type.width - 1) /
                            2,
                    tile.z +
                        (type.depth - 1) /
                            2
                );

            preview.geometry.dispose();

            preview.geometry =
                new THREE.BoxGeometry(
                    type.width *
                        TILE -
                        0.2,
                    0.1,
                    type.depth *
                        TILE -
                        0.2
                );

            preview.position.set(
                pc.x,
                0.13,
                pc.z
            );

            const valid =
                isUnlocked(
                    selectedTool
                ) &&
                areaFree(
                    tile.x,
                    tile.z,
                    type.width,
                    type.depth
                ) &&
                adjacentRoad(
                    tile.x,
                    tile.z,
                    type.width,
                    type.depth
                );

            preview.material.color.set(
                valid
                    ? 0x65c978
                    : 0xe85b5b
            );

            preview.visible =
                true;
        } else {
            preview.visible =
                false;
        }
    }
);

function handleTile(
    tile
) {
    if (
        !selectedTool
    ) {
        return;
    }

    if (
        selectedTool ===
        "road"
    ) {
        buildRoad(
            tile.x,
            tile.z
        );

        return;
    }

    if (
        selectedTool ===
        "upgrade"
    ) {
        upgradeRoad(
            tile.x,
            tile.z
        );

        return;
    }

    createBuilding(
        selectedTool,
        tile.x,
        tile.z
    );
}

renderer.domElement.addEventListener(
    "pointerdown",
    event => {
        if (
            event.button !== 0
        ) {
            return;
        }

        dragging =
            true;

        const tile =
            pointerTile(
                event
            );

        if (!tile) {
            return;
        }

        handleTile(
            tile
        );

        lastTile =
            tile;
    }
);

renderer.domElement.addEventListener(
    "pointermove",
    event => {
        if (
            !dragging
        ) {
            return;
        }

        if (
            selectedTool !==
            "road"
        ) {
            return;
        }

        const tile =
            pointerTile(
                event
            );

        if (!tile) {
            return;
        }

        if (
            !lastTile ||
            tile.x !==
                lastTile.x ||
            tile.z !==
                lastTile.z
        ) {
            buildRoad(
                tile.x,
                tile.z
            );

            lastTile =
                tile;
        }
    }
);

renderer.domElement.addEventListener(
    "pointerup",
    () => {
        dragging =
            false;

        lastTile =
            null;
    }
);

renderer.domElement.addEventListener(
    "pointerleave",
    () => {
        dragging =
            false;

        lastTile =
            null;
    }
);

window.addEventListener(
    "keydown",
    event => {
        if (
            event.key ===
            "Escape"
        ) {
            selectedTool =
                null;

            preview.visible =
                false;

            showStatus(
                "Tool cancelled"
            );
        }

        if (
            event.key.toLowerCase() ===
            "u"
        ) {
            selectedTool =
                "upgrade";

            showStatus(
                "Upgrade selected"
            );
        }
    }
);

function createStarterRoads() {
    for (
        let x = -6;
        x <= 6;
        x++
    ) {
        buildRoad(
            x,
            0
        );
    }

    for (
        let z = -4;
        z <= 4;
        z++
    ) {
        if (
            z !== 0
        ) {
            buildRoad(
                0,
                z
            );
        }
    }

    money =
        50000;

    updateStats();
}

function createTrees() {
    for (
        let i = 0;
        i < 60;
        i++
    ) {
        const x =
            Math.floor(
                Math.random() *
                    32
            ) - 16;

        const z =
            Math.floor(
                Math.random() *
                    32
            ) - 16;

        if (
            Math.abs(x) <
                7 &&
            Math.abs(z) <
                7
        ) {
            continue;
        }

        if (
            roadExists(
                x,
                z
            )
        ) {
            continue;
        }

        const tree =
            createTree();

        const c =
            center(
                x,
                z
            );

        tree.position.set(
            c.x,
            0,
            c.z
        );

        tree.scale.setScalar(
            0.7 +
                Math.random() *
                0.5
        );

        scene.add(
            tree
        );

        trees.push(
            tree
        );
    }
}

createStarterRoads();
createTrees();

function animate() {
    requestAnimationFrame(
        animate
    );

    const time =
        performance.now() *
        0.001;

    for (
        const tree of trees
    ) {
        tree.rotation.z =
            Math.sin(
                time * 1.2 +
                tree.position.x
            ) *
            0.025;
    }

    for (
        const item of construction
    ) {
        if (
            item.object.scale.y <
            item.target
        ) {
            item.object.scale.y +=
                item.speed;

            if (
                item.object.scale.y >
                item.target
            ) {
                item.object.scale.y =
                    item.target;
            }
        }
    }

    controls.update();

    renderer.render(
        scene,
        camera
    );
}

setInterval(
    () => {
        const income =
            population * 3 +
            jobs * 2;

        money +=
            income;

        updateStats();
    },
    1000
);

setInterval(
    () => {
        createEffectTiles();
    },
    500
);

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

updateStats();
animate();

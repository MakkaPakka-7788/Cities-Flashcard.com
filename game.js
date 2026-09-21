import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const game = document.getElementById("game");

const TILE = 5;
const GRID = 140;
const WORLD = TILE * GRID;
const HALF = WORLD / 2;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ed5f0);
scene.fog = new THREE.Fog(0x9ed5f0, 220, 720);

const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1400
);

camera.position.set(125, 115, 155);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

game.appendChild(renderer.domElement);

const controls = new OrbitControls(
    camera,
    renderer.domElement
);

controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.minDistance = 18;
controls.maxDistance = 480;
controls.maxPolarAngle = Math.PI / 2.05;
controls.minPolarAngle = 0.18;
controls.target.set(0, 0, 0);

const hemi = new THREE.HemisphereLight(
    0xe5f5ff,
    0x5c7449,
    2.3
);

scene.add(hemi);

const sun = new THREE.DirectionalLight(
    0xffffff,
    3.4
);

sun.position.set(140, 240, 100);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.left = -350;
sun.shadow.camera.right = 350;
sun.shadow.camera.top = 350;
sun.shadow.camera.bottom = -350;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 750;

scene.add(sun);

const fillLight = new THREE.DirectionalLight(
    0xb9dcff,
    0.5
);

fillLight.position.set(-180, 100, -160);
scene.add(fillLight);

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD, WORLD),
    new THREE.MeshStandardMaterial({
        color: 0x709d57,
        roughness: 1
    })
);

ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const water = new THREE.Mesh(
    new THREE.PlaneGeometry(220, 145),
    new THREE.MeshStandardMaterial({
        color: 0x4aa8cf,
        roughness: 0.28,
        metalness: 0.03
    })
);

water.rotation.x = -Math.PI / 2;
water.position.set(-260, 0.08, -220);
water.receiveShadow = true;
scene.add(water);

function hill(x, z, radius, height) {

    const mesh = new THREE.Mesh(
        new THREE.ConeGeometry(radius, height, 28),
        new THREE.MeshStandardMaterial({
            color: 0x648b4d,
            roughness: 1
        })
    );

    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);
}

hill(-275, -30, 65, 45);
hill(-205, 100, 52, 35);
hill(285, -210, 75, 55);
hill(300, 100, 58, 42);

const trees = [];

function createTree(x, z, scale = 1) {

    const group = new THREE.Group();

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.65 * scale,
            1 * scale,
            6 * scale,
            8
        ),
        new THREE.MeshStandardMaterial({
            color: 0x75503a
        })
    );

    trunk.position.y = 3 * scale;
    trunk.castShadow = true;

    group.add(trunk);

    const crown = new THREE.Mesh(
        new THREE.SphereGeometry(
            4.1 * scale,
            10,
            8
        ),
        new THREE.MeshStandardMaterial({
            color: 0x3f7f40,
            roughness: 1
        })
    );

    crown.position.y = 8 * scale;
    crown.castShadow = true;

    group.add(crown);

    group.position.set(x, 0, z);
    scene.add(group);
    trees.push(group);
}

for (let i = 0; i < 105; i++) {

    const x = (Math.random() - 0.5) * WORLD;
    const z = (Math.random() - 0.5) * WORLD;

    if (Math.abs(x) < 175 && Math.abs(z) < 175) {
        continue;
    }

    if (x < -100 && z < -100) {
        continue;
    }

    createTree(
        x,
        z,
        0.65 + Math.random() * 0.75
    );
}

const grid = new THREE.GridHelper(
    WORLD,
    GRID,
    0x5e7f50,
    0x7c9c68
);

grid.position.y = 0.035;
scene.add(grid);

const hoverGeometry = new THREE.BoxGeometry(
    TILE - 0.12,
    0.07,
    TILE - 0.12
);

const hoverMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.35,
    depthWrite: false
});

const hoverTile = new THREE.Mesh(
    hoverGeometry,
    hoverMaterial
);

hoverTile.visible = false;
hoverTile.position.y = 0.12;
scene.add(hoverTile);

const roads = new Map();
const zones = new Map();
const buildings = [];
const parks = [];
const services = [];
const coverageObjects = [];

const city = {
    money: 25000,
    population: 1240,
    happiness: 72,
    traffic: 18,
    day: 1,
    income: 0,
    expenses: 0
};

let selectedTool = null;
let selectedObject = null;
let mouseDown = false;
let currentGrid = null;
let constructionObjects = [];

const roadTypes = {
    basic: {
        name: "Basic Road",
        level: 1,
        width: 1,
        capacity: 30,
        speed: 1,
        cost: 50,
        color: 0x41464a
    },
    avenue: {
        name: "Avenue",
        level: 2,
        width: 2,
        capacity: 70,
        speed: 1.25,
        cost: 180,
        color: 0x363b3f
    },
    major: {
        name: "Major Avenue",
        level: 3,
        width: 3,
        capacity: 130,
        speed: 1.5,
        cost: 450,
        color: 0x303438
    },
    highway: {
        name: "Highway",
        level: 4,
        width: 4,
        capacity: 300,
        speed: 2.1,
        cost: 1000,
        color: 0x292d30
    }
};

const zoneTypes = {
    residential: {
        name: "Residential",
        color: 0x5fae6b,
        transparent: 0.42,
        population: 10
    },
    commercial: {
        name: "Commercial",
        color: 0x4c8fd6,
        transparent: 0.42,
        population: 3
    },
    industrial: {
        name: "Industrial",
        color: 0x9b8d62,
        transparent: 0.42,
        population: 1
    }
};

const buildingTypes = {
    residential: [
        {
            name: "Small House",
            w: 2,
            d: 2,
            height: 3.5,
            color: 0xd7b27e,
            population: 12
        },
        {
            name: "Townhouse",
            w: 2,
            d: 3,
            height: 6,
            color: 0xb97862,
            population: 28
        },
        {
            name: "Apartment",
            w: 3,
            d: 3,
            height: 11,
            color: 0xb7bdc2,
            population: 65
        },
        {
            name: "Apartment Tower",
            w: 4,
            d: 4,
            height: 19,
            color: 0x9ca9b5,
            population: 150
        }
    ],
    commercial: [
        {
            name: "Shop",
            w: 2,
            d: 2,
            height: 4,
            color: 0xd4a75d,
            population: 5
        },
        {
            name: "Restaurant",
            w: 2,
            d: 3,
            height: 5,
            color: 0xc66e59,
            population: 8
        },
        {
            name: "Office",
            w: 3,
            d: 3,
            height: 10,
            color: 0x718db4,
            population: 20
        },
        {
            name: "Office Tower",
            w: 4,
            d: 4,
            height: 24,
            color: 0x54749c,
            population: 55
        }
    ],
    industrial: [
        {
            name: "Warehouse",
            w: 3,
            d: 3,
            height: 5,
            color: 0x77736a,
            population: 8
        },
        {
            name: "Factory",
            w: 4,
            d: 4,
            height: 8,
            color: 0x777b80,
            population: 18
        },
        {
            name: "Manufacturing Plant",
            w: 5,
            d: 4,
            height: 12,
            color: 0x64686b,
            population: 35
        }
    ]
};

function gridKey(gx, gz) {
    return gx + "," + gz;
}

function worldToGrid(x, z) {

    const gx = Math.floor((x + HALF) / TILE);
    const gz = Math.floor((z + HALF) / TILE);

    if (
        gx < 0 ||
        gz < 0 ||
        gx >= GRID ||
        gz >= GRID
    ) {
        return null;
    }

    return {
        gx,
        gz,
        x: -HALF + gx * TILE + TILE / 2,
        z: -HALF + gz * TILE + TILE / 2
    };
}

function gridToWorld(gx, gz) {

    return {
        x: -HALF + gx * TILE + TILE / 2,
        z: -HALF + gz * TILE + TILE / 2
    };
}

function isRoad(gx, gz) {
    return roads.has(gridKey(gx, gz));
}

function isZone(gx, gz) {
    return zones.has(gridKey(gx, gz));
}

function isOccupied(gx, gz) {

    return buildings.some(building => {

        return (
            gx >= building.gx &&
            gx < building.gx + building.w &&
            gz >= building.gz &&
            gz < building.gz + building.d
        );
    });
}

function hasRoadNearby(gx, gz, distance = 1) {

    for (let x = gx - distance; x <= gx + distance; x++) {

        for (let z = gz - distance; z <= gz + distance; z++) {

            if (isRoad(x, z)) {
                return true;
            }
        }
    }

    return false;
}

function roadConnections(gx, gz) {

    return {
        north: isRoad(gx, gz - 1),
        south: isRoad(gx, gz + 1),
        west: isRoad(gx - 1, gz),
        east: isRoad(gx + 1, gz)
    };
}

function createRoadTile(gx, gz, type = "basic") {

    const key = gridKey(gx, gz);

    if (roads.has(key)) {
        return false;
    }

    const data = roadTypes[type];
    const position = gridToWorld(gx, gz);

    const group = new THREE.Group();

    const road = new THREE.Mesh(
        new THREE.BoxGeometry(
            TILE * data.width,
            data === roadTypes.basic ? 0.34 : 0.4,
            TILE
        ),
        new THREE.MeshStandardMaterial({
            color: data.color,
            roughness: 0.95
        })
    );

    road.position.y = 0.18;
    road.receiveShadow = true;

    group.add(road);

    const centerLine = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.16,
            0.025,
            TILE - 0.7
        ),
        new THREE.MeshBasicMaterial({
            color: 0xf2df79
        })
    );

    centerLine.position.y = 0.38;

    if (data.width === 1) {
        group.add(centerLine);
    }

    group.position.set(
        position.x,
        0,
        position.z
    );

    scene.add(group);

    roads.set(key, {
        gx,
        gz,
        type,
        group,
        level: data.level
    });

    updateRoadVisuals(gx, gz);

    return true;
}

function updateRoadVisuals(gx, gz) {

    const affected = [
        [gx, gz],
        [gx + 1, gz],
        [gx - 1, gz],
        [gx, gz + 1],
        [gx, gz - 1]
    ];

    affected.forEach(([x, z]) => {

        const roadData = roads.get(gridKey(x, z));

        if (!roadData) {
            return;
        }

        const group = roadData.group;

        group.children.forEach(child => {
            if (child.userData.roadVisual) {
                group.remove(child);
            }
        });

        const data = roadTypes[roadData.type];
        const c = roadConnections(x, z);

        if (data.level === 1) {

            const dirs = [
                c.north,
                c.south,
                c.west,
                c.east
            ];

            dirs.forEach((connected, index) => {

                if (!connected) {
                    return;
                }

                const horizontal = index >= 2;

                const length = TILE * 0.52;

                const mesh = new THREE.Mesh(
                    new THREE.BoxGeometry(
                        horizontal ? length : TILE * 0.52,
                        0.345,
                        horizontal ? TILE * 0.52 : length
                    ),
                    new THREE.MeshStandardMaterial({
                        color: data.color,
                        roughness: 0.95
                    })
                );

                mesh.position.y = 0.18;

                if (index === 0) {
                    mesh.position.z = -TILE * 0.25;
                }

                if (index === 1) {
                    mesh.position.z = TILE * 0.25;
                }

                if (index === 2) {
                    mesh.position.x = -TILE * 0.25;
                }

                if (index === 3) {
                    mesh.position.x = TILE * 0.25;
                }

                mesh.userData.roadVisual = true;
                mesh.receiveShadow = true;

                group.add(mesh);
            });
        }
    });
}

function upgradeRoad(gx, gz) {

    const data = roads.get(gridKey(gx, gz));

    if (!data) {
        showStatus("Select a road first");
        return;
    }

    if (data.level >= 4) {
        showStatus("This highway is fully upgraded");
        return;
    }

    const nextTypes = [
        "basic",
        "avenue",
        "major",
        "highway"
    ];

    const next = nextTypes[data.level];

    const cost = roadTypes[next].cost;

    if (city.money < cost) {
        showStatus("Not enough money");
        return;
    }

    city.money -= cost;

    const position = gridToWorld(gx, gz);

    scene.remove(data.group);

    roads.delete(gridKey(gx, gz));

    createRoadTile(
        gx,
        gz,
        next
    );

    const newData = roads.get(gridKey(gx, gz));

    newData.group.scale.set(
        0.2,
        1,
        1
    );

    newData.group.userData.upgrading = true;

    constructionObjects.push({
        object: newData.group,
        start: performance.now(),
        duration: 450,
        mode: "road"
    });

    updateStats();

    showStatus(
        roadTypes[next].name +
        " built for $" +
        cost
    );
}

function createZoneTile(gx, gz, type) {

    const key = gridKey(gx, gz);

    if (zones.has(key)) {
        return;
    }

    if (isRoad(gx, gz)) {
        showStatus("Roads cannot be zoned");
        return;
    }

    const position = gridToWorld(gx, gz);
    const data = zoneTypes[type];

    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(
            TILE - 0.18,
            0.05,
            TILE - 0.18
        ),
        new THREE.MeshBasicMaterial({
            color: data.color,
            transparent: true,
            opacity: data.transparent,
            depthWrite: false
        })
    );

    mesh.position.set(
        position.x,
        0.08,
        position.z
    );

    mesh.userData.zone = true;
    mesh.userData.type = type;

    scene.add(mesh);

    zones.set(key, {
        gx,
        gz,
        type,
        mesh
    });

    attemptGrowth(gx, gz);
}

function findZoneArea(gx, gz, type) {

    const possible = [];

    for (let w = 2; w <= 5; w++) {

        for (let d = 2; d <= 5; d++) {

            let valid = true;

            for (let x = 0; x < w; x++) {

                for (let z = 0; z < d; z++) {

                    const tx = gx + x;
                    const tz = gz + z;

                    const zone = zones.get(
                        gridKey(tx, tz)
                    );

                    if (
                        !zone ||
                        zone.type !== type ||
                        isRoad(tx, tz) ||
                        isOccupied(tx, tz)
                    ) {
                        valid = false;
                    }
                }
            }

            if (valid) {
                possible.push({
                    w,
                    d
                });
            }
        }
    }

    if (!possible.length) {
        return null;
    }

    possible.sort(
        (a, b) =>
            Math.abs(a.w * a.d - 9) -
            Math.abs(b.w * b.d - 9)
    );

    return possible[0];
}

function createBuilding(
    gx,
    gz,
    type,
    definition
) {

    for (let x = 0; x < definition.w; x++) {

        for (let z = 0; z < definition.d; z++) {

            if (
                isRoad(gx + x, gz + z) ||
                isOccupied(gx + x, gz + z)
            ) {
                return null;
            }
        }
    }

    if (!hasRoadNearby(gx, gz, 2)) {
        return null;
    }

    const center = gridToWorld(
        gx + (definition.w - 1) / 2,
        gz + (definition.d - 1) / 2
    );

    const group = new THREE.Group();

    const buildingMaterial =
        new THREE.MeshStandardMaterial({
            color: definition.color,
            roughness: 0.72
        });

    const building = new THREE.Mesh(
        new THREE.BoxGeometry(
            definition.w * TILE - 0.45,
            definition.height,
            definition.d * TILE - 0.45
        ),
        buildingMaterial
    );

    building.position.y =
        definition.height / 2;

    building.castShadow = true;
    building.receiveShadow = true;

    group.add(building);

    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(
            definition.w * TILE - 0.3,
            0.28,
            definition.d * TILE - 0.3
        ),
        new THREE.MeshStandardMaterial({
            color: 0x45494c,
            roughness: 0.85
        })
    );

    roof.position.y =
        definition.height + 0.14;

    roof.castShadow = true;

    group.add(roof);

    if (definition.height >= 8) {

        const floors =
            Math.max(
                2,
                Math.floor(definition.height / 3)
            );

        for (let i = 0; i < floors; i++) {

            const windowRows = new THREE.Group();

            for (let side = 0; side < 2; side++) {

                const window = new THREE.Mesh(
                    new THREE.BoxGeometry(
                        Math.max(
                            0.45,
                            definition.w * TILE * 0.45
                        ),
                        0.55,
                        0.12
                    ),
                    new THREE.MeshStandardMaterial({
                        color: 0x9fc5d8,
                        emissive: 0x18333d,
                        emissiveIntensity: 0.12
                    })
                );

                window.position.set(
                    0,
                    1.5 + i * 3,
                    side === 0
                        ? -(definition.d * TILE) / 2
                        : (definition.d * TILE) / 2
                );

                windowRows.add(window);
            }

            group.add(windowRows);
        }
    }

    if (type === "industrial") {

        const chimney = new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.45,
                0.65,
                definition.height * 0.8,
                10
            ),
            new THREE.MeshStandardMaterial({
                color: 0x575b5e
            })
        );

        chimney.position.set(
            definition.w * TILE * 0.25,
            definition.height * 0.9,
            0
        );

        chimney.castShadow = true;
        group.add(chimney);

        const smoke = new THREE.Mesh(
            new THREE.SphereGeometry(
                1.2,
                8,
                8
            ),
            new THREE.MeshBasicMaterial({
                color: 0xb4b4b4,
                transparent: true,
                opacity: 0.38
            })
        );

        smoke.position.set(
            definition.w * TILE * 0.25,
            definition.height * 1.4,
            0
        );

        smoke.userData.smoke = true;
        group.add(smoke);
    }

    group.position.set(
        center.x,
        0,
        center.z
    );

    group.scale.set(
        0.05,
        0.05,
        0.05
    );

    scene.add(group);

    const buildingData = {
        gx,
        gz,
        w: definition.w,
        d: definition.d,
        type,
        name: definition.name,
        population: definition.population,
        height: definition.height,
        group,
        level: 1
    };

    buildings.push(buildingData);

    constructionObjects.push({
        object: group,
        start: performance.now(),
        duration: 850,
        mode: "building"
    });

    return buildingData;
}

function attemptGrowth(gx, gz) {

    const zone = zones.get(
        gridKey(gx, gz)
    );

    if (!zone) {
        return;
    }

    if (!hasRoadNearby(gx, gz, 2)) {
        return;
    }

    if (Math.random() > 0.075) {
        return;
    }

    const area = findZoneArea(
        gx,
        gz,
        zone.type
    );

    if (!area) {
        return;
    }

    const choices =
        buildingTypes[zone.type];

    const definition =
        choices[
            Math.floor(
                Math.random() * choices.length
            )
        ];

    createBuilding(
        gx,
        gz,
        zone.type,
        definition
    );
}

function createPark(gx, gz, kind = "park") {

    if (isRoad(gx, gz) || isOccupied(gx, gz)) {
        showStatus("That tile is occupied");
        return;
    }

    const position = gridToWorld(gx, gz);

    const group = new THREE.Group();

    const base = new THREE.Mesh(
        new THREE.BoxGeometry(
            TILE * 2 - 0.25,
            0.12,
            TILE * 2 - 0.25
        ),
        new THREE.MeshStandardMaterial({
            color: 0x4e9b50,
            roughness: 1
        })
    );

    base.position.y = 0.12;
    base.receiveShadow = true;

    group.add(base);

    for (let i = 0; i < 4; i++) {

        const tree = new THREE.Mesh(
            new THREE.SphereGeometry(
                0.75,
                8,
                7
            ),
            new THREE.MeshStandardMaterial({
                color: 0x2e7135
            })
        );

        tree.position.set(
            -3.5 + (i % 2) * 7,
            1.4,
            -3.5 + Math.floor(i / 2) * 7
        );

        tree.castShadow = true;

        group.add(tree);
    }

    if (kind === "playground") {

        const slide = new THREE.Mesh(
            new THREE.BoxGeometry(
                0.8,
                2,
                3
            ),
            new THREE.MeshStandardMaterial({
                color: 0xe6b54b
            })
        );

        slide.position.set(
            0,
            1,
            0
        );

        group.add(slide);
    }

    group.position.set(
        position.x + TILE * 0.5,
        0,
        position.z + TILE * 0.5
    );

    scene.add(group);

    parks.push({
        gx,
        gz,
        group,
        radius: kind === "playground" ? 22 : 28,
        happiness: kind === "playground" ? 7 : 5
    });

    showStatus("Park built");

    createCoverage(
        position.x + TILE * 0.5,
        position.z + TILE * 0.5,
        kind === "playground" ? 22 : 28,
        0x54c96b,
        0.16
    );
}

function createService(gx, gz) {

    if (isRoad(gx, gz) || isOccupied(gx, gz)) {
        showStatus("That tile is occupied");
        return;
    }

    const position = gridToWorld(gx, gz);

    const group = new THREE.Group();

    const building = new THREE.Mesh(
        new THREE.BoxGeometry(
            TILE * 2 - 0.3,
            5,
            TILE * 2 - 0.3
        ),
        new THREE.MeshStandardMaterial({
            color: 0xe3e5e6,
            roughness: 0.7
        })
    );

    building.position.y = 2.5;
    building.castShadow = true;
    building.receiveShadow = true;

    group.add(building);

    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(
            TILE * 2,
            0.3,
            TILE * 2
        ),
        new THREE.MeshStandardMaterial({
            color: 0x3f5661
        })
    );

    roof.position.y = 5.15;

    group.add(roof);

    const cross1 = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.65,
            0.15,
            2.5
        ),
        new THREE.MeshBasicMaterial({
            color: 0xd94949
        })
    );

    const cross2 = cross1.clone();

    cross2.rotation.y = Math.PI / 2;

    cross1.position.set(
        0,
        5.35,
        0
    );

    cross2.position.set(
        0,
        5.36,
        0
    );

    group.add(cross1);
    group.add(cross2);

    group.position.set(
        position.x + TILE * 0.5,
        0,
        position.z + TILE * 0.5
    );

    scene.add(group);

    services.push({
        gx,
        gz,
        group,
        radius: 35
    });

    showStatus("Service building built");

    createCoverage(
        position.x + TILE * 0.5,
        position.z + TILE * 0.5,
        35,
        0x4e91e8,
        0.14
    );
}

function createCoverage(
    x,
    z,
    radius,
    color,
    opacity
) {

    const geometry = new THREE.CircleGeometry(
        radius,
        64
    );

    const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(
        geometry,
        material
    );

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(
        x,
        0.18,
        z
    );

    scene.add(mesh);

    coverageObjects.push(mesh);

    return mesh;
}

function clearCoverage() {

    coverageObjects.forEach(
        object => scene.remove(object)
    );

    coverageObjects.length = 0;
}

function showBuildingCoverage(building) {

    clearCoverage();

    const center = gridToWorld(
        building.gx + (building.w - 1) / 2,
        building.gz + (building.d - 1) / 2
    );

    if (building.type === "residential") {

        createCoverage(
            center.x,
            center.z,
            18,
            0x54c96b,
            0.12
        );
    }

    if (building.type === "commercial") {

        createCoverage(
            center.x,
            center.z,
            20,
            0x55a3ef,
            0.1
        );
    }

    if (building.type === "industrial") {

        createCoverage(
            center.x,
            center.z,
            28,
            0x777777,
            0.19
        );
    }
}

function getGroundPosition(event) {

    const rect =
        renderer.domElement.getBoundingClientRect();

    mouse.x =
        ((event.clientX - rect.left) /
            rect.width) * 2 - 1;

    mouse.y =
        -((event.clientY - rect.top) /
            rect.height) * 2 + 1;

    raycaster.setFromCamera(
        mouse,
        camera
    );

    const hit =
        raycaster.intersectObjects(
            [ground],
            false
        );

    if (!hit.length) {
        return null;
    }

    return worldToGrid(
        hit[0].point.x,
        hit[0].point.z
    );
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function updateHover(gridPosition) {

    if (!gridPosition) {

        hoverTile.visible = false;
        return;
    }

    hoverTile.visible = true;

    hoverTile.position.set(
        gridPosition.x,
        0.12,
        gridPosition.z
    );

    if (selectedTool === "road") {
        hoverMaterial.color.set(0xffffff);
    }

    if (selectedTool === "residential") {
        hoverMaterial.color.set(0x65c878);
    }

    if (selectedTool === "commercial") {
        hoverMaterial.color.set(0x4e9be7);
    }

    if (selectedTool === "industrial") {
        hoverMaterial.color.set(0xd0c07a);
    }

    if (selectedTool === "park") {
        hoverMaterial.color.set(0x54c96b);
    }

    if (selectedTool === "service") {
        hoverMaterial.color.set(0x4e91e8);
    }

    if (selectedTool === "upgrade") {
        hoverMaterial.color.set(0xf0b84d);
    }
}

function selectTool(tool) {

    selectedTool = tool;

    document
        .querySelectorAll(".build-card")
        .forEach(card => {
            card.classList.toggle(
                "selected",
                card.dataset.build === tool
            );
        });

    controls.enabled = false;

    const names = {
        road: "Road tool selected",
        residential: "Residential zoning selected",
        commercial: "Commercial zoning selected",
        industrial: "Industrial zoning selected",
        park: "Park selected",
        service: "Services selected",
        upgrade: "Road upgrade selected"
    };

    showStatus(
        names[tool] +
        " — click the map"
    );
}

function cancelTool() {

    selectedTool = null;
    currentGrid = null;
    mouseDown = false;

    hoverTile.visible = false;

    controls.enabled = true;

    document
        .querySelectorAll(".build-card")
        .forEach(card => {
            card.classList.remove("selected");
        });

    clearCoverage();
}

function placeTool(g) {

    if (!g) {
        return;
    }

    if (selectedTool === "road") {

        const key = gridKey(
            g.gx,
            g.gz
        );

        if (roads.has(key)) {

            upgradeRoad(
                g.gx,
                g.gz
            );

            return;
        }

        const cost =
            roadTypes.basic.cost;

        if (city.money < cost) {

            showStatus(
                "Not enough money"
            );

            return;
        }

        city.money -= cost;

        createRoadTile(
            g.gx,
            g.gz,
            "basic"
        );

        showStatus(
            "Road tile built"
        );

        updateStats();

        return;
    }

    if (
        selectedTool === "residential" ||
        selectedTool === "commercial" ||
        selectedTool === "industrial"
    ) {

        const cost =
            selectedTool === "residential"
                ? 100
                : selectedTool === "commercial"
                    ? 150
                    : 300;

        if (city.money < cost) {

            showStatus(
                "Not enough money"
            );

            return;
        }

        if (
            isRoad(g.gx, g.gz)
        ) {

            showStatus(
                "Roads cannot be zoned"
            );

            return;
        }

        city.money -= cost;

        createZoneTile(
            g.gx,
            g.gz,
            selectedTool
        );

        showStatus(
            zoneTypes[selectedTool].name +
            " zone created"
        );

        updateStats();

        return;
    }

    if (selectedTool === "park") {

        if (city.money < 200) {

            showStatus(
                "Not enough money"
            );

            return;
        }

        city.money -= 200;

        createPark(
            g.gx,
            g.gz,
            "park"
        );

        updateStats();

        return;
    }

    if (selectedTool === "service") {

        if (city.money < 400) {

            showStatus(
                "Not enough money"
            );

            return;
        }

        city.money -= 400;

        createService(
            g.gx,
            g.gz
        );

        updateStats();

        return;
    }

    if (selectedTool === "upgrade") {

        upgradeRoad(
            g.gx,
            g.gz
        );
    }
}

renderer.domElement.addEventListener(
    "pointermove",
    event => {

        currentGrid =
            getGroundPosition(event);

        updateHover(currentGrid);

        if (
            mouseDown &&
            selectedTool
        ) {
            placeTool(currentGrid);
        }
    }
);

renderer.domElement.addEventListener(
    "pointerdown",
    event => {

        if (
            event.button !== 0 ||
            !selectedTool
        ) {
            return;
        }

        currentGrid =
            getGroundPosition(event);

        if (!currentGrid) {
            return;
        }

        mouseDown = true;

        placeTool(currentGrid);
    }
);

renderer.domElement.addEventListener(
    "pointerup",
    event => {

        if (event.button === 0) {
            mouseDown = false;
        }
    }
);

renderer.domElement.addEventListener(
    "pointerleave",
    () => {
        mouseDown = false;
        hoverTile.visible = false;
    }
);

renderer.domElement.addEventListener(
    "contextmenu",
    event => {
        event.preventDefault();
    }
);

document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {
            cancelTool();
        }

        if (
            event.key.toLowerCase() === "u" &&
            currentGrid
        ) {

            selectTool("upgrade");
        }
    }
);

const topbar = document.createElement("div");

topbar.className = "city-topbar";

topbar.innerHTML = `
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
<div class="stat-label">Income</div>
<div class="stat-value" id="income">$0</div>
</div>

<div class="stat">
<div class="stat-label">Day</div>
<div class="stat-value" id="day">1</div>
</div>

</div>
`;

game.appendChild(topbar);

const buildButton =
    document.createElement("button");

buildButton.className = "build-main";
buildButton.textContent = "🏗️ BUILD";

game.appendChild(buildButton);

const menu =
    document.createElement("div");

menu.className = "build-menu";

menu.innerHTML = `
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
<div class="build-name">Road</div>
<div class="build-price">$50 / tile</div>
</button>

<button class="build-card" data-build="upgrade">
<div class="build-icon">⬆️</div>
<div class="build-name">Upgrade Road</div>
<div class="build-price">U key</div>
</button>

<button class="build-card" data-build="residential">
<div class="build-icon">🏠</div>
<div class="build-name">Residential</div>
<div class="build-price">$100</div>
</button>

<button class="build-card" data-build="commercial">
<div class="build-icon">🏪</div>
<div class="build-name">Commercial</div>
<div class="build-price">$150</div>
</button>

<button class="build-card" data-build="industrial">
<div class="build-icon">🏭</div>
<div class="build-name">Industrial</div>
<div class="build-price">$300</div>
</button>

<button class="build-card" data-build="park">
<div class="build-icon">🌳</div>
<div class="build-name">Park</div>
<div class="build-price">$200</div>
</button>

<button class="build-card" data-build="service">
<div class="build-icon">🏥</div>
<div class="build-name">Services</div>
<div class="build-price">$400</div>
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

</div>

<div class="build-info">
Click a tool, then close this menu and build directly on the grid.
</div>
`;

game.appendChild(menu);

const status =
    document.createElement("div");

status.className = "build-status";

game.appendChild(status);

function showStatus(message) {

    status.textContent = message;
    status.classList.add("show");

    clearTimeout(status.timer);

    status.timer = setTimeout(
        () => {
            status.classList.remove("show");
        },
        1900
    );
}

buildButton.addEventListener(
    "click",
    () => {

        const open =
            !menu.classList.contains("open");

        if (open) {

            menu.classList.add("open");
            buildButton.classList.add("active");
            buildButton.textContent =
                "✕ CLOSE BUILD";

        } else {

            menu.classList.remove("open");
            buildButton.classList.remove("active");
            buildButton.textContent =
                "🏗️ BUILD";
        }
    }
);

document
    .querySelector(".close-menu")
    .addEventListener(
        "click",
        () => {

            menu.classList.remove("open");
            buildButton.classList.remove("active");
            buildButton.textContent =
                "🏗️ BUILD";
        }
    );

document
    .querySelectorAll(".build-card")
    .forEach(card => {

        card.addEventListener(
            "click",
            () => {

                selectTool(
                    card.dataset.build
                );

                menu.classList.remove("open");
                buildButton.classList.remove("active");
                buildButton.textContent =
                    "🏗️ BUILD";
            }
        );
    });

function updateStats() {

    let population =
        1240;

    buildings.forEach(
        building => {
            population +=
                building.population;
        }
    );

    city.population =
        population;

    const parkBonus =
        parks.length * 3;

    const serviceBonus =
        services.length * 2;

    const industrialPenalty =
        buildings.filter(
            b => b.type === "industrial"
        ).length * 1.5;

    city.happiness =
        Math.max(
            0,
            Math.min(
                100,
                72 +
                parkBonus +
                serviceBonus -
                industrialPenalty
            )
        );

    let roadCapacity = 0;

    roads.forEach(
        road => {
            roadCapacity +=
                roadTypes[road.type].capacity;
        }
    );

    const roadDemand =
        buildings.length * 5;

    city.traffic =
        roadCapacity <= 0
            ? 0
            : Math.max(
                0,
                Math.min(
                    100,
                    Math.round(
                        (roadDemand /
                            roadCapacity) *
                            100
                    )
                )
            );

    let income = 0;

    buildings.forEach(
        building => {

            if (building.type === "commercial") {
                income += 25;
            }

            if (building.type === "residential") {
                income += 8;
            }

            if (building.type === "industrial") {
                income += 35;
            }
        }
    );

    city.income = income;

    const pop =
        document.getElementById(
            "population"
        );

    const money =
        document.getElementById(
            "money"
        );

    const happiness =
        document.getElementById(
            "happiness"
        );

    const traffic =
        document.getElementById(
            "traffic"
        );

    const income =
        document.getElementById(
            "income"
        );

    const day =
        document.getElementById(
            "day"
        );

    if (pop) {
        pop.textContent =
            city.population.toLocaleString();
    }

    if (money) {
        money.textContent =
            "$" +
            Math.floor(city.money)
                .toLocaleString();
    }

    if (happiness) {
        happiness.textContent =
            Math.round(
                city.happiness
            ) + "%";
    }

    if (traffic) {
        traffic.textContent =
            Math.round(
                city.traffic
            ) + "%";
    }

    if (income) {
        income.textContent =
            "$" +
            city.income
                .toLocaleString();
    }

    if (day) {
        day.textContent =
            city.day;
    }
}

function growCity() {

    zones.forEach(
        zone => {

            attemptGrowth(
                zone.gx,
                zone.gz
            );
        }
    );

    city.money +=
        city.income;

    city.day++;

    updateStats();
}

setInterval(
    growCity,
    5000
);

function animateConstruction(time) {

    constructionObjects =
        constructionObjects.filter(
            item => {

                const progress =
                    Math.min(
                        1,
                        (time - item.start) /
                        item.duration
                    );

                const eased =
                    1 -
                    Math.pow(
                        1 - progress,
                        3
                    );

                if (
                    item.mode === "building"
                ) {

                    item.object.scale.set(
                        eased,
                        eased,
                        eased
                    );
                }

                if (
                    item.mode === "road"
                ) {

                    item.object.scale.x =
                        0.2 +
                        eased * 0.8;
                }

                if (progress >= 1) {

                    item.object.scale.set(
                        1,
                        1,
                        1
                    );

                    return false;
                }

                return true;
            }
        );
}

const clock =
    new THREE.Clock();

function animate() {

    requestAnimationFrame(
        animate
    );

    const time =
        performance.now();

    animateConstruction(
        time
    );

    const elapsed =
        clock.getElapsedTime();

    trees.forEach(
        (tree, index) => {

            tree.rotation.z =
                Math.sin(
                    elapsed * 0.7 +
                    index
                ) * 0.008;
        }
    );

    buildings.forEach(
        building => {

            building.group
                .children
                .forEach(
                    child => {

                        if (
                            child.userData.smoke
                        ) {

                            child.position.y +=
                                0.004;

                            child.scale.multiplyScalar(
                                1.0008
                            );

                            if (
                                child.position.y >
                                building.height * 1.8
                            ) {

                                child.position.y =
                                    building.height * 1.4;

                                child.scale.set(
                                    1,
                                    1,
                                    1
                                );
                            }
                        }
                    }
                );
        }
    );

    controls.update();

    renderer.render(
        scene,
        camera
    );
}

updateStats();
animate();

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

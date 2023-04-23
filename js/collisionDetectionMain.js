import * as CANNON from "cannon-es";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { GUI } from "/lil-gui.module.min.js";

let mouse = new THREE.Vector2();

const renderer = new THREE.WebGLRenderer({ antialias: true });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  24,
  window.innerWidth / window.innerHeight,
  1,
  2000
);
const orbit = new OrbitControls(camera, renderer.domElement);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
const pointLight = new THREE.PointLight(0xffffff, 0.5);

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xa3a3a3);
document.body.appendChild(renderer.domElement);

camera.position.set(4, 1, 1);
camera.lookAt(0, 0, 0);

orbit.update();

// Add lights
scene.add(ambientLight);
pointLight.position.set(10, 10, 10);
camera.add(pointLight);
scene.add(camera);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 0, -10);
directionalLight.target.position.set(0, 0, 0);
scene.add(directionalLight);

const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.8, 0),
});

const Nx = 15;
const Ny = 20;
const mass = 1;
const clothSize = 0.75;
const dist = clothSize / Nx;

const shape = new CANNON.Particle();

const particles = [];

for (let i = 0; i < Nx + 1; i++) {
  particles.push([]);
  for (let j = 0; j < Ny + 1; j++) {
    const particle = new CANNON.Body({
      mass: j === Ny ? 0 : mass,
      shape,
      position: new CANNON.Vec3(
        (i - Nx * 0.5) * dist,
        (j - Ny * 0.5) * dist,
        0
      ),
      velocity: new CANNON.Vec3(0, 0, -0.1 * (Ny - j)),
    });
    particles[i].push(particle);
    world.addBody(particle);
  }
}

function connect(i1, j1, i2, j2) {
  world.addConstraint(
    new CANNON.DistanceConstraint(particles[i1][j1], particles[i2][j2], dist)
  );
}

for (let i = 0; i < Nx + 1; i++) {
  for (let j = 0; j < Ny + 1; j++) {
    if (i < Nx) connect(i, j, i + 1, j);
    if (j < Ny) connect(i, j, i, j + 1);
  }
}

const clothGeometry = new THREE.PlaneGeometry(1, 1, Nx, Ny);

const clothMat = new THREE.MeshPhongMaterial({
  side: THREE.DoubleSide,
  //wireframe: true,
  map: new THREE.TextureLoader().load("resources/texture.jpg"),
});
//  const texture = loader.load("resources/OIP.jpg");

const clothMesh = new THREE.Mesh(clothGeometry, clothMat);
scene.add(clothMesh);
// Set up the ground
const groundTexture = new THREE.TextureLoader().load(
  "https://threejs.org/examples/textures/hardwood2_diffuse.jpg"
);
groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(20, 20);
const groundMaterial = new THREE.MeshPhongMaterial({
  map: groundTexture,
});
const groundGeometry = new THREE.PlaneGeometry(50, 50);
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.7;
scene.add(ground);

const groundShape = new CANNON.Plane();
const groundBody = new CANNON.Body({ mass: 0, shape: groundShape });
world.addBody(groundBody);

function updateParticules() {
  for (let i = 0; i < Nx + 1; i++) {
    for (let j = 0; j < Ny + 1; j++) {
      const index = j * (Nx + 1) + i;
      const positionAttribute = clothGeometry.attributes.position;
      const position = particles[i][Ny - j].position;
      positionAttribute.setXYZ(index, position.x, position.y, position.z);
      positionAttribute.needsUpdate = true;
    }
  }
}
//create sphere

const sphereSize = 0.1;
const sphereGeometry = new THREE.SphereGeometry(sphereSize);
const sphereMat = new THREE.MeshPhongMaterial({ color: 0x89cff0 });
const sphereShape = new CANNON.Sphere(sphereSize * 1.3);
const sphereBody = new CANNON.Body({
  shape: sphereShape,
});
const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMat);
const movementRadius = 0.2;

function addSphere() {
  scene.add(sphereMesh);
  world.addBody(sphereBody);
  //need to account for sphere placement
  //need to account for sphere orbiting.
}

// Create first pole
const poleGeometry = new THREE.BoxGeometry(0.1, 2, 0.1);
const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
const poleMesh = new THREE.Mesh(poleGeometry, poleMaterial);
poleMesh.position.set(0.53, -0.5, 0);
scene.add(poleMesh);
const poleShape = new CANNON.Box(new CANNON.Vec3(0.05, 0.5, 0.05));
const poleBody = new CANNON.Body({ mass: 1, shape: poleShape });
poleBody.position.set(0.5, -0.5, 0);
world.addBody(poleBody);
world.addConstraint(
  new CANNON.PointToPointConstraint(
    poleBody,
    new CANNON.Vec3(0, 0.5, 0),
    particles[7][0],
    new CANNON.Vec3(-dist / 2, -dist / 2, 0)
  )
);
// Create second pole geometry and material
const secondPoleGeometry = new THREE.BoxGeometry(0.1, 2, 0.1);
const secondPoleMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
const secondPoleMesh = new THREE.Mesh(secondPoleGeometry, secondPoleMaterial);
secondPoleMesh.position.set(-0.53, -0.5, 0);
scene.add(secondPoleMesh);
const secondPoleShape = new CANNON.Box(new CANNON.Vec3(0.05, 0.5, 0.05));
const secondPoleBody = new CANNON.Body({ mass: 1, shape: secondPoleShape });
secondPoleBody.position.set(0.5, -0.5, 0);
world.addBody(secondPoleBody);
world.addConstraint(
  new CANNON.PointToPointConstraint(
    secondPoleBody,
    new CANNON.Vec3(0, 0.5, 0),
    particles[7][1],
    new CANNON.Vec3(dist / 2, -dist / 2, 0)
  )
);
// Create third pole geometry and material
const topPoleGeometry = new THREE.BoxGeometry(0.01, 2, 0.5);
const topPoleMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
const topPoleMesh = new THREE.Mesh(topPoleGeometry, topPoleMaterial);
topPoleMesh.position.set(0, 0.5, 0);
topPoleMesh.scale.set(1, 0.5, 0.1);
scene.add(topPoleMesh);
topPoleMesh.rotation.z = Math.PI / 2;
const topPoleShape = new CANNON.Box(new CANNON.Vec3(0.05, 0.5, 0.05));
const topPoleBody = new CANNON.Body({ mass: 1, shape: topPoleShape });
topPoleBody.position.set(0.5, -0.5, 0);
world.addBody(topPoleBody);
world.addConstraint(
  new CANNON.PointToPointConstraint(
    topPoleBody,
    new CANNON.Vec3(0, 0.5, 0),
    particles[7][2],
    new CANNON.Vec3(dist / 2, -dist / 2, 0)
  )
);
const timeStep = 1 / 60;

const options = {
  enableWind: false,
  enableSphere: false,
};
function createGUI() {
  const gui = new GUI();

  //add the option to enable wind
  gui.add(options, "enableWind").name("Enable Wind");
  //add the option to enable ball
  gui.add(options, "enableSphere").name("Enable Ball");
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function mouseMove(event) {
  event.preventDefault();
}

function mouseDown(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

createGUI();

function animate(time) {
  updateParticules();
  world.step(timeStep);

  //if the option to enable sphere is selected, the sphere exists
  if (options.enableSphere) {
    addSphere();

    sphereBody.position.set(
      movementRadius * Math.sin(time / 1000),
      -0.6,
      movementRadius * Math.cos(time / 1000)
    );
    //CHANGE positon.set to change y axis of ball (set it to 0 to go in the midde, etc)
    sphereMesh.position.copy(sphereBody.position);
  } else {
    //else, it is meant to be removed.
    
    // remove the mesh from the scene
    scene.remove(sphereMesh);

    // remove the body from the physics world
    world.removeBody(sphereBody);

    // dispose the geometry and material to free up memory
    sphereGeometry.dispose();
    sphereMat.dispose();
  }

  if (options.enableWind) {
    const wind = new CANNON.Vec3(1, 2, 3);
    for (let i = 0; i < Nx + 1; i++) {
      for (let j = 0; j < Ny + 1; j++) {
        const particle = particles[i][j];
        particle.applyForce(wind, particle.position);
      }
    }
  }

  renderer.render(scene, camera);

  window.addEventListener("resize", onWindowResize);
  window.addEventListener("mousedown", mouseDown, false);
  window.addEventListener("mousemove", mouseMove, false);
}
renderer.setAnimationLoop(animate);
window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 3D Audio Visualization
let scene, camera, renderer, analyser, dataArray;
let shapes = [];

// Setup Three.js scene
function initScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    document.body.appendChild(renderer.domElement);
    
    camera.position.z = 5;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x222222);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Create parametric shapes
    createShapes();
}

function createShapes() {
    // Parameters for the shapes
    const params = {
        tubes: new THREE.ParametricGeometry((u, v, target) => {
            const x = Math.cos(u * Math.PI * 2) * (2 + Math.cos(v * Math.PI * 2));
            const y = Math.sin(u * Math.PI * 2) * (2 + Math.cos(v * Math.PI * 2));
            const z = Math.sin(v * Math.PI * 2);
            target.set(x, y, z);
        }, 50, 25),
        
        mobius: new THREE.ParametricGeometry((u, v, target) => {
            u = u * 2 * Math.PI;
            v = v * 2 - 1;
            const r = 2 + Math.sin(3 * u) / 2;
            target.set(
                r * Math.cos(u),
                r * Math.sin(u),
                v * Math.cos(u / 2)
            );
        }, 40, 20)
    };

    // Create materials with emission
    const materials = [
        new THREE.MeshPhongMaterial({
            color: 0xFF6B6B,
            emissive: 0xFF6B6B,
            emissiveIntensity: 0.5,
            shininess: 100
        }),
        new THREE.MeshPhongMaterial({
            color: 0xFFB347,
            emissive: 0xFFB347,
            emissiveIntensity: 0.5,
            shininess: 100
        })
    ];

    // Create meshes
    Object.entries(params).forEach(([_, geometry], i) => {
        const mesh = new THREE.Mesh(geometry, materials[i]);
        mesh.scale.multiplyScalar(0.5);
        scene.add(mesh);
        shapes.push(mesh);
    });
}

// Audio setup
function initAudio() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    // Create oscillator for demo
    const oscillator = audioContext.createOscillator();
    oscillator.connect(analyser);
    analyser.connect(audioContext.destination);
    oscillator.start();

    dataArray = new Uint8Array(analyser.frequencyBinCount);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        
        // Update shapes based on audio data
        shapes.forEach((shape, i) => {
            const value = dataArray[i * 20] / 255;
            
            // Scale and rotate based on audio
            shape.scale.setScalar(0.5 + value * 0.5);
            shape.rotation.x += 0.01 + value * 0.02;
            shape.rotation.y += 0.01 + value * 0.02;
            
            // Update emission intensity
            shape.material.emissiveIntensity = value;
        });
    }

    // Rotate camera
    camera.position.x = Math.sin(Date.now() * 0.001) * 5;
    camera.position.z = Math.cos(Date.now() * 0.001) * 5;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize everything
initScene();
window.addEventListener('resize', onWindowResize);
animate();

// Start audio visualization on demo button click
document.querySelector('.demo-trigger').addEventListener('click', (e) => {
    e.preventDefault();
    if (!analyser) {
        initAudio();
    }
}); 
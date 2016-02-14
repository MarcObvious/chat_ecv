function CanvasCtrl($log, $scope) {
    'ngInject';

    // ViewModel
    const vm = this;

    //var init = function () {
    //    vm.title = 'ECV - Chat';
    //
    //    vm.config = {};
    //    vm.config.connected = false;
    //    vm.config.ip = '84.89.136.194:9000';
    //    vm.config.room = 'CHAT';
    //
    //    vm.data = {};
    //    vm.data.name = '';
    //    vm.data.textToSend = '';
    //    vm.data.text = '';
    //    vm.data.events = '';
    //    vm.data.sendTo = 'ALL';
    //
    //    ChatService.new();
    //    vm.connect();
    //};


    var renderer; //this is the thing that draws
    var scene; //this contains all the objects
    var camera; //this is where we look from
    var cameraControl;

    function createRenderer() {
        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(0x009119, 1.0); //makes screen black
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
    }

    function createCamera() {
        camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth/window.innerHeight,
            0.1, 1000
        );
        camera.position.x = 90;
        camera.position.y = 32;
        camera.position.z = 32;
        camera.lookAt(scene.position);
    }

    function createLight() {
        var spotLight = new THREE.SpotLight(0xFFFFFF);
        spotLight.position.set(10,20,30);
        spotLight.shadowCameraNear = 20;
        spotLight.shadowCameraFar = 50;
        spotLight.castShadow = true;
        scene.add(spotLight);
    }

    function createDirectionalLight(){
        var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(100, 10, -50);
        directionalLight.name = 'directional';
        scene.add(directionalLight);
    }

    function createAmbientLight(){
        var ambientLight = new THREE.AmbientLight(0x111111);
        scene.add(ambientLight);
    }

    function createEarthMaterial(){
        var earthTexture = new THREE.Texture();
        var loader = new THREE.ImageLoader();
        loader.load('earthmap2k.jpg', function(image){
            earthTexture.image = image;
            earthTexture.needsUpdate = true;
        });

        var normalTexture = new THREE.Texture();
        loader.load('earth_normalmap_flat2k.jpg', function(image){
            normalTexture.image = image;
            normalTexture.needsUpdate = true;
        });

        var specularTexture = new THREE.Texture();
        loader.load('earthspec2k.jpg', function(image){
            specularTexture.image = image;
            specularTexture.needsUpdate = true;
        });

        var earthMaterial = new THREE.MeshPhongMaterial();
        earthMaterial.map = earthTexture;
        earthMaterial.normalMap = normalTexture;
        earthMaterial.specularMap = specularTexture;
        earthMaterial.shininess = 30;

        return earthMaterial;
    }

    function createEarth(){
        var sphereGeometry = new THREE.SphereGeometry(15, 30, 30);
        var sphereMaterial = createEarthMaterial();
        var earthMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
        earthMesh.name = 'earth';
        scene.add(earthMesh);
    }

    function createCloudsMaterial(){
        var cloudsTexture = new THREE.Texture();
        var loader = new THREE.ImageLoader();
        loader.load('fair_clouds_1k.png', function(image){
            cloudsTexture.image = image;
            cloudsTexture.needsUpdate = true;
        });
        var cloudsMaterial = new THREE.MeshPhongMaterial();
        cloudsMaterial.map = cloudsTexture;
        cloudsMaterial.transparent = true;
        return cloudsMaterial;
    }

    function createClouds(){
        var sphereGeometry = new THREE.SphereGeometry(15.1, 30.1, 30.1);
        var sphereMaterial = createCloudsMaterial();
        var cloudsMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
        cloudsMesh.name = 'clouds';
        scene.add(cloudsMesh);
    }

    function createEnvironment(){
        // create the geometry sphere
        var envGeometry  = new THREE.SphereGeometry(90, 32, 32);
        // create the material, using a texture of startfield
        var envMaterial  = new THREE.MeshBasicMaterial();
        envMaterial.map   =    THREE.ImageUtils.loadTexture('galaxy_starfield.png');
        envMaterial.side  = THREE.BackSide;
        // create the mesh based on geometry and material
        var mesh  = new THREE.Mesh(envGeometry, envMaterial);
        scene.add(mesh);
    }

    function createBox() {
        var boxGeometry = new THREE.BoxGeometry(6,4,6);
        var boxMaterial = new THREE.MeshLambertMaterial(
            {color:"blue"}
        );
        var box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.castShadow = true;
        scene.add(box);
    }

    function createPlane(){
        var planeGeometry = new THREE.PlaneGeometry(20, 20);
        var planeMaterial = new THREE.MeshLambertMaterial({
            color: 0xcccccc
        });
        var plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.receiveShadow = true;
        plane.rotation.x = -0.5 * Math.PI;
        plane.position.y = -2;
        scene.add(plane);
    }

//init() gets executed once
    function init() { //initalise all of our objects
        scene = new THREE.Scene();
        createRenderer();
        createCamera();
        createLight();
        createDirectionalLight();
        createAmbientLight();
        createBox();
        createPlane();
        createEarth();
        createClouds();
        createEnvironment();
        cameraControl = new THREE.OrbitControls(camera);
        //render() gets called at end of init
        //as it looped forever
        document.body.appendChild(renderer.domElement);
        render();
    }

//infinite loop
    function render() { //this render the scene
        cameraControl.update();
        scene.getObjectByName('earth').rotation.y += 0.001;//rotate earth
        scene.getObjectByName('clouds').rotation.y += 0.0015;//rotate clouds
        renderer.render(scene,camera);
        requestAnimationFrame(render);
    }
}

export default {
    name: 'CanvasCtrl',
    fn: CanvasCtrl
};

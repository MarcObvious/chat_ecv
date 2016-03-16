function SceneBox() {

    return {
        restrict: 'EA',
        templateUrl: 'directives/scene.html',
        scope: {
            title: '@',
            message: '@sceneDirective',
            width: '=',
            height: '=',
            countrie: '=',
        },
        link: (scope, element, attrs) => {

            //var THREE = require ('../libs/three.min.js');
            var THREE = require('../libs/OrbitControls');

            var renderer;
            var scene;
            var camera;
            var cameraControl;
            var followingTopic = false; //variable que indica si l'usuari està seguint un topic concret
            var countryAndTopic = {country: "Catalonia", topic: 1}; //dupla on guardem el país i el topic més propers a l'usuari

            function createRenderer(){
                renderer = new THREE.WebGLRenderer();
                renderer.setClearColor(0x009119, 1.0);
                element[0].style.position = 'fixed';
                element[0].style.top = 0;
                element[0].style.left = 0;
                element[0].style['z-index'] = 0;
                renderer.setSize(window.innerWidth, window.innerHeight);
                //renderer.setSize(700, 400);
                renderer.shadowMap.enabled = true;
            }

            function createShipMaterial(){
                var shipTexture = new THREE.Texture();
                var loader = new THREE.ImageLoader();
                loader.load('./images/ship.jpg', function(image){
                    shipTexture.image = image;
                    shipTexture.needsUpdate = true;
                });
                var shipMaterial = new THREE.MeshPhongMaterial();
                shipMaterial.map = shipTexture;
                return shipMaterial;
            }

            function createShip(){ //creem la nau en forma d'esfera que mourà l'usuari
                var sphereGeometry = new THREE.SphereGeometry(1,30,30);
                var sphereMaterial = createShipMaterial();
                var ship = new THREE.Mesh(sphereGeometry, sphereMaterial);
                ship.castShadow = true;
                ship.name = 'ship';
                ship.position.x = 300;
                ship.position.y = 0;
                ship.position.z = 0;
                scene.add(ship);
            }

            function shipMovement(){
                var tecla = event.keyCode;
                //calculem la distància de l'usuari a la càmera
                var dist = Math.sqrt(Math.pow(scene.getObjectByName('ship').position.x - camera.position.x,2) + Math.pow(scene.getObjectByName('ship').position.z - camera.position.z,2));
                if (tecla == 87){
                    scene.getObjectByName('ship').translateX(-1.5); // tecla w per moure la nau de l'usuari per l'eix -X
                    camera.translateZ(-1.5);
                    if (dist < 20){
                        var aux = 20 - dist;
                        camera.translateZ(aux);
                    }
                }
                if (tecla == 83){
                    scene.getObjectByName('ship').translateX(1,5); // tecla s per moure la nau de l'usuari per l'eix +X
                    camera.translateZ(1.5);
                    if (dist > 20){
                        var aux = dist-20;
                        camera.translateZ(-aux);
                    }
                }
                if (tecla == 68){
                    scene.getObjectByName('ship').rotation.y -= (Math.PI/3.15)/20; // tecla d per rotar la nau de l'usuari per l'eix -Y
                    camera.translateX(-1);
                    if (dist > 20){
                        var aux = dist-20;
                        camera.translateZ(-aux);
                    }
                }
                if (tecla == 65){
                    scene.getObjectByName('ship').rotation.y += (Math.PI/3.15)/20; // tecla a per rotar la nau de l'usuari per l'eix +Y
                    camera.translateX(1);
                    if (dist > 20){
                        var aux = dist-20;
                        camera.translateZ(-aux);
                    }
                }
                if (tecla == 73 && !followingTopic){
                    scene.getObjectByName('ship').position.y += 1; // tecla i per moure la nau de l'usuari per l'eix +Y
                    camera.position.y += 1;
                }
                if (tecla == 75 && !followingTopic){
                    scene.getObjectByName('ship').position.y -= 1; // tecla k per moure la nau de l'usuari per l'eix -Y
                    camera.position.y -= 1
                }
                if (tecla == 74){ //tecla j per llegir
                    followingTopic = true;
                    followTopic();
                }
                if (tecla == 76){	//tecla l per deixar de llegir
                    followingTopic = false;
                }
                //enfoquem la camera sempre a la nau de l'usuari
                camera.lookAt(new THREE.Vector3(scene.getObjectByName('ship').position.x,scene.getObjectByName('ship').position.y,scene.getObjectByName('ship').position.z));
            }

            function createCamera() {
                camera = new THREE.PerspectiveCamera(
                    45,
                    window.innerWidth/window.innerHeight,
                    0.1, 1000
                );
                //situem la càmera darrera la nau de l'usuari en el mateix pla i enfocant cap a ell
                camera.position.x = scene.getObjectByName('ship').position.x + 20;
                camera.position.y = scene.getObjectByName('ship').position.y;
                camera.position.z = scene.getObjectByName('ship').position.z;
                camera.lookAt(new THREE.Vector3(scene.getObjectByName('ship').position.x,scene.getObjectByName('ship').position.y,scene.getObjectByName('ship').position.z));
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
                var ambientLight = new THREE.AmbientLight(0x555555);
                scene.add(ambientLight);
            }

            function createEnvironment(){
                var envGeometry  = new THREE.SphereGeometry(500, 32, 32);
                var envMaterial  = new THREE.MeshBasicMaterial();
                envMaterial.map   =    THREE.ImageUtils.loadTexture('./images/galaxy_starfield.png');
                envMaterial.side  = THREE.BackSide;
                var mesh  = new THREE.Mesh(envGeometry, envMaterial);
                scene.add(mesh);
            }

            function createTwitterMaterial(){
                var twitterTexture = new THREE.Texture();
                var loader = new THREE.ImageLoader();
                loader.load('./images/twitter.png', function(image){
                    twitterTexture.image = image;
                    twitterTexture.needsUpdate = true;
                });
                var twitterMaterial = new THREE.MeshPhongMaterial();
                twitterMaterial.map = twitterTexture;
                twitterMaterial.shininess = 30;
                return twitterMaterial;
            }

            function createTwitter(){ //creem l'esfera de Twitter al voltant de la qual hi rotaran totes les esferes de països
                var sphereGeometry = new THREE.SphereGeometry(30, 30, 30);
                var sphereMaterial = createTwitterMaterial();
                var twitterMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
                twitterMesh.name = 'twitter';
                scene.add(twitterMesh);
            }

            function createCountriesMaterial(i){
                var texture = new THREE.Texture();
                var loader = new THREE.ImageLoader();
                loader.load('./images/country'+i+'.png', function(image){
                    texture.image = image;
                    texture.needsUpdate = true;
                });
                var material = new THREE.MeshPhongMaterial();
                material.map = texture;
                material.shininess = 30;
                return material;
            }

            function createCountries(){ //creem els 5 països dels quals llegirem tweets
                var sphereGeometrySpain = new THREE.SphereGeometry(17, 30, 30);
                var sphereMaterialSpain = createCountriesMaterial(0);
                var spain = new THREE.Mesh(sphereGeometrySpain, sphereMaterialSpain);
                spain.name = 'country0';
                spain.position.x = 70;
                spain.position.y = 0;
                spain.position.z = 0;
                spain.rotationSpeed = 0.005;
                spain.speed = 0.08;
                spain.distX = spain.position.x;
                spain.halfWay = true;
                scene.add(spain);

                var sphereGeometryPortugal = new THREE.SphereGeometry(7, 30, 30);
                var sphereMaterialPortugal = createCountriesMaterial(1);
                var portugal = new THREE.Mesh(sphereGeometryPortugal, sphereMaterialPortugal);
                portugal.name = 'country1';
                portugal.position.x = 140;
                portugal.position.y = 0;
                portugal.position.z = 0;
                portugal.rotationSpeed = 0.01;
                portugal.speed = 0.08;
                portugal.distX = portugal.position.x;
                portugal.halfWay = true;
                scene.add(portugal);

                var sphereGeometryFrance = new THREE.SphereGeometry(20, 30, 30);
                var sphereMaterialFrance = createCountriesMaterial(2);
                var france = new THREE.Mesh(sphereGeometryFrance, sphereMaterialFrance);
                france.name = 'country2';
                france.position.x = 200;
                france.position.y = 0;
                france.position.z = 0;
                france.rotationSpeed = 0.002;
                france.speed = 0.06;
                france.distX = france.position.x;
                france.halfWay = true;
                scene.add(france);

                var sphereGeometrySwiz = new THREE.SphereGeometry(4, 30, 30);
                var sphereMaterialSwiz = createCountriesMaterial(3);
                var swiz = new THREE.Mesh(sphereGeometrySwiz, sphereMaterialSwiz);
                swiz.name = 'country3';
                swiz.position.x = 250;
                swiz.position.y = 0;
                swiz.position.z = 0;
                swiz.rotationSpeed = 0.02;
                swiz.speed = 0.04;
                swiz.distX = swiz.position.x;
                swiz.halfWay = true;
                scene.add(swiz);

                var sphereGeometryCatalunya = new THREE.SphereGeometry(2, 30, 30);
                var sphereMaterialCatalunya = createCountriesMaterial(4);
                var catalunya = new THREE.Mesh(sphereGeometryCatalunya, sphereMaterialCatalunya);
                catalunya.name = 'country4';
                catalunya.position.x = 290;
                catalunya.position.y = 0;
                catalunya.position.z = 0;
                catalunya.rotationSpeed = 0.04;
                catalunya.speed = 0.02;
                catalunya.distX = catalunya.position.x;
                catalunya.halfWay = true;
                scene.add(catalunya);
            }

            function orbitCountries(i){ //orbitem els països al voltant de l'esfera de Twitter
                if(scene.getObjectByName('country'+i).halfWay){
                    scene.getObjectByName('country'+i).position.z = Math.sqrt(scene.getObjectByName('country'+i).distX*scene.getObjectByName('country'+i).distX-scene.getObjectByName('country'+i).position.x*scene.getObjectByName('country'+i).position.x);
                    scene.getObjectByName('country'+i).position.x -= scene.getObjectByName('country'+i).speed;
                    scene.getObjectByName('country'+i).position.x = Math.round(scene.getObjectByName('country'+i).position.x*100)/100;
                    if(scene.getObjectByName('country'+i).position.x <= -scene.getObjectByName('country'+i).distX-scene.getObjectByName('country'+i).speed){
                        scene.getObjectByName('country'+i).halfWay = false;
                        scene.getObjectByName('country'+i).position.x += scene.getObjectByName('country'+i).speed*2;
                        scene.getObjectByName('country'+i).position.x = Math.round(scene.getObjectByName('country'+i).position.x*100)/100;
                        return;
                    }
                }
                else{
                    scene.getObjectByName('country'+i).position.z = -Math.sqrt(scene.getObjectByName('country'+i).distX*scene.getObjectByName('country'+i).distX-scene.getObjectByName('country'+i).position.x*scene.getObjectByName('country'+i).position.x);
                    scene.getObjectByName('country'+i).position.x += scene.getObjectByName('country'+i).speed;
                    scene.getObjectByName('country'+i).position.x = Math.round(scene.getObjectByName('country'+i).position.x*100)/100;
                    if(scene.getObjectByName('country'+i).position.x >= scene.getObjectByName('country'+i).distX) scene.getObjectByName('country'+i).halfWay = true;
                }
            }

            function createTopicsMaterial(i){
                if (i == 0 || i == 4 || i == 8 || i == 12 || i == 16) var imatge = 'sun';
                if (i == 1 || i == 5 || i == 9 || i == 13 || i == 17) var imatge = 'moon';
                if (i == 2 || i == 6 || i == 10 || i == 14 || i == 18) var imatge = 'emerald';
                if (i == 3 || i == 7 || i == 11 || i == 15 || i == 19) var imatge = 'cyan';
                var texture = new THREE.Texture();
                var loader = new THREE.ImageLoader();
                loader.load('./images/' + imatge + '.jpg', function(image){
                    texture.image = image;
                    texture.needsUpdate = true;
                });
                var material = new THREE.MeshPhongMaterial();
                material.map = texture;
                material.shininess = 30;
                return material;
            }

            function createTopics(){ //creem les esferes dels Topics, cada país en tindrà 4 al seu voltant
                for(var i=0; i<20; ++i){
                    var sphereGeometryTopic = new THREE.SphereGeometry(3, 30, 30);
                    var sphereMaterialTopic = createTopicsMaterial(i);
                    var topic = new THREE.Mesh(sphereGeometryTopic, sphereMaterialTopic);
                    topic.name = 'topic'+i;
                    topic.rotationSpeed = 0.02;
                    scene.add(topic);
                }
            }

            function orbitTopics(i){ //mantenim els 4 topics de cada planeta al costat del que li correspon mentre aquest orbita
                if (i < 4) var j = 0;
                if (i >= 4 && i < 8) var j = 1;
                if (i >= 8 && i < 12) var j = 2;
                if (i >= 12 && i < 16) var j = 3;
                if (i >= 16) var j = 4;

                if (i == 0 || i == 4 || i == 8 || i == 12 || i == 16){
                    scene.getObjectByName('topic'+i).position.x = scene.getObjectByName('country'+j).position.x - 18;
                    scene.getObjectByName('topic'+i).position.z = scene.getObjectByName('country'+j).position.z - 18;
                }
                if (i == 1 || i == 5 || i == 9 || i == 13 || i == 17){
                    scene.getObjectByName('topic'+i).position.x = scene.getObjectByName('country'+j).position.x + 18;
                    scene.getObjectByName('topic'+i).position.z = scene.getObjectByName('country'+j).position.z - 18;
                }
                if (i == 2 || i == 6 || i == 10 || i == 14 || i == 18){
                    scene.getObjectByName('topic'+i).position.x = scene.getObjectByName('country'+j).position.x - 18;
                    scene.getObjectByName('topic'+i).position.z = scene.getObjectByName('country'+j).position.z + 18;
                }
                if (i == 3 || i == 7 || i == 11 || i == 15 || i == 19){
                    scene.getObjectByName('topic'+i).position.x = scene.getObjectByName('country'+j).position.x + 18;
                    scene.getObjectByName('topic'+i).position.z = scene.getObjectByName('country'+j).position.z + 18;
                }
            }

            function readFromTopic(){ //busquem l'esfera del Topic més proper a la nau de l'usuari
                var nearestTopic = 0;
                var distTopics = [];

                for (var i=0; i<20; ++i){

                    var dist = Math.sqrt(Math.pow(scene.getObjectByName('ship').position.x - scene.getObjectByName('topic'+i).position.x,2) + Math.pow(scene.getObjectByName('ship').position.z - scene.getObjectByName('topic'+i).position.z,2));
                    if (dist < distTopics[nearestTopic]) {
                        nearestTopic = i
                    }
                    distTopics.push(dist);
                }


                //console.log(scope.countrie );
                /*if(distTopics[nearestTopic] > 100 && countryAndTopic.country !== 'WorldWide'){ //si els topics són molt lluny veurem els trending mundials
                    countryAndTopic.country = "WorldWide";
                    countryAndTopic.topic = -1;
                   // scope.$apply();
                    scope.countrie = 'WorldWide';
                  //  console.log("WorldWide");
                 console.log(countryAndTopic.country);

                    //return countryAndTopic;
                }
                else { */
                    //sinó veiem els tweets del Topic més proper del país corresponen
                    if (nearestTopic < 4 && countryAndTopic.country !== 'Spain'){
                        countryAndTopic.country = "Spain";
                        countryAndTopic.topic = nearestTopic;
                        scope.countrie = 'Spain';
                        console.log(countryAndTopic.country);
                        scope.$apply();
                        //scope.$apply();

                        //console.log(nearestTopic+"SPAIN "+countryAndTopic.country+"x"+countryAndTopic.topic);
                        return countryAndTopic;
                    }
                    if (nearestTopic >= 4 && nearestTopic < 8 && countryAndTopic.country !== 'Portugal') {
                        countryAndTopic.country = "Portugal";
                        scope.countrie = 'Portugal';
                        console.log(countryAndTopic.country);
                       // scope.$apply();
                        countryAndTopic.topic = nearestTopic-4;
                        scope.$apply();

                        //console.log(nearestTopic+"PORTUGAL "+countryAndTopic.country+"x"+countryAndTopic.topic);
                        //return countryAndTopic;
                    }
                    if (nearestTopic >= 8 && nearestTopic < 12 && countryAndTopic.country !== 'France'){
                        countryAndTopic.country = "France";
                        scope.countrie = 'France';
                        console.log(countryAndTopic.country);
                      //  scope.$apply();
                        countryAndTopic.topic = nearestTopic-8;
                        scope.$apply();

                      //  console.log(nearestTopic+"FRANCE "+countryAndTopic.country+"x"+countryAndTopic.topic);
                        return countryAndTopic;
                    }
                    if (nearestTopic >= 12 && nearestTopic < 16 && countryAndTopic.country !== 'Switzerland'){
                        countryAndTopic.country = "Switzerland";
                        console.log(countryAndTopic.country);
                        scope.countrie = 'Switzerland';
                       // scope.$apply();
                        countryAndTopic.topic = nearestTopic-12;
                        scope.$apply();

                        //console.log(nearestTopic+"SWIZ "+countryAndTopic.country+"x"+countryAndTopic.topic);
                        //return countryAndTopic;
                    }
                    if (nearestTopic >= 16 && countryAndTopic.country !== 'Catalonia'){
                        countryAndTopic.country = "Catalonia";
                        console.log(countryAndTopic.country);
                        scope.countrie = 'Catalonia';
                      //  scope.$apply();
                        countryAndTopic.topic = nearestTopic-16;
                        scope.$apply();

                     //   console.log(nearestTopic+"CATALUNYA "+countryAndTopic.country+"x"+countryAndTopic.topic);
                        //return countryAndTopic;
                    }
              //  }
            }

            function followTopic(){ //mantenim anclada la nau de l'usuari al costat del topic que vol llegir durant una estona
                var nearestCountryAndTopic = readFromTopic();
                if(nearestCountryAndTopic.country != "WorldWide" && nearestCountryAndTopic.topic != -1){
                    if (nearestCountryAndTopic.country == "Portugal") nearestCountryAndTopic.topic += 4;
                    if (nearestCountryAndTopic.country == "France") nearestCountryAndTopic.topic += 8;
                    if (nearestCountryAndTopic.country == "Switzerland") nearestCountryAndTopic.topic += 12;
                    if (nearestCountryAndTopic.country == "Catalonia") nearestCountryAndTopic.topic += 16;
                    scene.getObjectByName('ship').position.x = scene.getObjectByName('topic'+nearestCountryAndTopic.topic).position.x - 3;
                    scene.getObjectByName('ship').position.z = scene.getObjectByName('topic'+nearestCountryAndTopic.topic).position.z - 3;
                    scene.getObjectByName('ship').position.y = scene.getObjectByName('topic'+nearestCountryAndTopic.topic).position.y;
                }
                else followingTopic = false;
            }

            function hotTopics(i){ //calculem la velocitat de rotació de les esferes dels topics en funció de la quantitat de tweets que tenen
                //amountOfTweets = he d'agafar de lu d'en marc
                //if (amountOfTweets == 'null') scene.getObjectByName('topic'+i).rotationSpeed = 0.02;
                //else scene.getObjectByName('topic'+i).rotationSpeed = amountOfTweets/100000;
            }


            var init = function() { //initalise all of our objects

                element[0].addEventListener( 'keydown', shipMovement, false );
                scene = new THREE.Scene();
                createRenderer();
                createLight();
                createDirectionalLight();
                createAmbientLight();
                createShip();
                createCamera();
                createTwitter();
                createEnvironment();
                createCountries();
                createTopics();
                cameraControl = new THREE.OrbitControls(camera);
                element[0].appendChild(renderer.domElement);
                render();

            };

            function render(){
                scene.getObjectByName('twitter').rotation.y += 0.001;//rotem l'esfera de twitter

                for(var i=0; i<5; ++i){ //rotem i fem orbitar les esferes dels planetes
                    scene.getObjectByName('country'+i).rotation.y += scene.getObjectByName('country'+i).rotationSpeed; //rotate countries
                    orbitCountries(i);
                }

                for (var j=0; j<20; ++j){ //rotem i fem orbitar les esferes dels Topics
                    scene.getObjectByName('topic'+j).rotation.y -= scene.getObjectByName('topic'+j).rotationSpeed; //rotate topics
                    //scene.getObjectByName('topic'+i).rotation += 1;
                    hotTopics(j);
                    orbitTopics(j);
                }

                if (followingTopic) {
                    followTopic();
                } //mantenim la nau de l'usuari anclada al Topic corresponent en cas que estigui llegint

                readFromTopic(); //calculem el Topic més proper a la nau de l'usuari

                renderer.render(scene,camera);
                requestAnimationFrame(render);
            }

          /*  element.on('keydown', () => {
                window.alert('Element clicked: ' + scope.message);
            });*/

            init();

        }
    };
}

export default {
    name: 'sceneBox',
    fn: SceneBox
};

function SceneDirective() {

  return {
    restrict: 'EA',
    templateUrl: 'directives/scene.html',
    scope: {
      title: '@',
      message: '@sceneDirective',
      'width': '=',
      'height': '=',
      'fillcontainer': '=',
      'scale': '=',
      'materialType': '=',
      'sat': '=',

    },
    link: (scope, element, attrs) => {

      var THREE = require ('../libs/three.min.js');
      THREE.OrbitControls = function ( object, domElement, attrs) {

        this.object = object;
        this.domElement = ( domElement !== undefined ) ? domElement : document;

        // API

        // Set to false to disable this control
        this.enabled = true;

        // "target" sets the location of focus, where the control orbits around
        // and where it pans with respect to.
        this.target = new THREE.Vector3();

        // center is old, deprecated; use "target" instead
        this.center = this.target;

        // This option actually enables dollying in and out; left as "zoom" for
        // backwards compatibility
        this.noZoom = false;
        this.zoomSpeed = 1.0;

        // Limits to how far you can dolly in and out ( PerspectiveCamera only )
        this.minDistance = 0;
        this.maxDistance = Infinity;

        // Limits to how far you can zoom in and out ( OrthographicCamera only )
        this.minZoom = 0;
        this.maxZoom = Infinity;

        // Set to true to disable this control
        this.noRotate = false;
        this.rotateSpeed = 1.0;

        // Set to true to disable this control
        this.noPan = false;
        this.keyPanSpeed = 7.0;	// pixels moved per arrow key push

        // Set to true to automatically rotate around the target
        this.autoRotate = false;
        this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

        // How far you can orbit vertically, upper and lower limits.
        // Range is 0 to Math.PI radians.
        this.minPolarAngle = 0; // radians
        this.maxPolarAngle = Math.PI; // radians

        // How far you can orbit horizontally, upper and lower limits.
        // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
        this.minAzimuthAngle = - Infinity; // radians
        this.maxAzimuthAngle = Infinity; // radians

        // Set to true to disable use of the keys
        this.noKeys = false;

        // The four arrow keys
        this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

        // Mouse buttons
        this.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT };

        ////////////
        // internals

        var scope = this;

        var EPS = 0.000001;

        var rotateStart = new THREE.Vector2();
        var rotateEnd = new THREE.Vector2();
        var rotateDelta = new THREE.Vector2();

        var panStart = new THREE.Vector2();
        var panEnd = new THREE.Vector2();
        var panDelta = new THREE.Vector2();
        var panOffset = new THREE.Vector3();

        var offset = new THREE.Vector3();

        var dollyStart = new THREE.Vector2();
        var dollyEnd = new THREE.Vector2();
        var dollyDelta = new THREE.Vector2();

        var theta;
        var phi;
        var phiDelta = 0;
        var thetaDelta = 0;
        var scale = 1;
        var pan = new THREE.Vector3();

        var lastPosition = new THREE.Vector3();
        var lastQuaternion = new THREE.Quaternion();

        var STATE = { NONE : -1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };

        var state = STATE.NONE;

        // for reset

        this.target0 = this.target.clone();
        this.position0 = this.object.position.clone();
        this.zoom0 = this.object.zoom;

        // so camera.up is the orbit axis

        var quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
        var quatInverse = quat.clone().inverse();

        // events

        var changeEvent = { type: 'change' };
        var startEvent = { type: 'start' };
        var endEvent = { type: 'end' };

        this.rotateLeft = function ( angle ) {

          if ( angle === undefined ) {

            angle = getAutoRotationAngle();

          }

          thetaDelta -= angle;

        };

        this.rotateUp = function ( angle ) {

          if ( angle === undefined ) {

            angle = getAutoRotationAngle();

          }

          phiDelta -= angle;

        };

        // pass in distance in world space to move left
        this.panLeft = function ( distance ) {

          var te = this.object.matrix.elements;

          // get X column of matrix
          panOffset.set( te[ 0 ], te[ 1 ], te[ 2 ] );
          panOffset.multiplyScalar( - distance );

          pan.add( panOffset );

        };

        // pass in distance in world space to move up
        this.panUp = function ( distance ) {

          var te = this.object.matrix.elements;

          // get Y column of matrix
          panOffset.set( te[ 4 ], te[ 5 ], te[ 6 ] );
          panOffset.multiplyScalar( distance );

          pan.add( panOffset );

        };

        // pass in x,y of change desired in pixel space,
        // right and down are positive
        this.pan = function ( deltaX, deltaY ) {

          var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

          if ( scope.object instanceof THREE.PerspectiveCamera ) {

            // perspective
            var position = scope.object.position;
            var offset = position.clone().sub( scope.target );
            var targetDistance = offset.length();

            // half of the fov is center to top of screen
            targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );

            // we actually don't use screenWidth, since perspective camera is fixed to screen height
            scope.panLeft( 2 * deltaX * targetDistance / element.clientHeight );
            scope.panUp( 2 * deltaY * targetDistance / element.clientHeight );

          } else if ( scope.object instanceof THREE.OrthographicCamera ) {

            // orthographic
            scope.panLeft( deltaX * (scope.object.right - scope.object.left) / element.clientWidth );
            scope.panUp( deltaY * (scope.object.top - scope.object.bottom) / element.clientHeight );

          } else {

            // camera neither orthographic or perspective
            console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );

          }

        };

        this.dollyIn = function ( dollyScale ) {

          if ( dollyScale === undefined ) {

            dollyScale = getZoomScale();

          }

          if ( scope.object instanceof THREE.PerspectiveCamera ) {

            scale /= dollyScale;

          } else if ( scope.object instanceof THREE.OrthographicCamera ) {

            scope.object.zoom = Math.max( this.minZoom, Math.min( this.maxZoom, this.object.zoom * dollyScale ) );
            scope.object.updateProjectionMatrix();
            scope.dispatchEvent( changeEvent );

          } else {

            console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );

          }

        };

        this.dollyOut = function ( dollyScale ) {

          if ( dollyScale === undefined ) {

            dollyScale = getZoomScale();

          }

          if ( scope.object instanceof THREE.PerspectiveCamera ) {

            scale *= dollyScale;

          } else if ( scope.object instanceof THREE.OrthographicCamera ) {

            scope.object.zoom = Math.max( this.minZoom, Math.min( this.maxZoom, this.object.zoom / dollyScale ) );
            scope.object.updateProjectionMatrix();
            scope.dispatchEvent( changeEvent );

          } else {

            console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );

          }

        };

        this.update = function () {

          var position = this.object.position;

          offset.copy( position ).sub( this.target );

          // rotate offset to "y-axis-is-up" space
          offset.applyQuaternion( quat );

          // angle from z-axis around y-axis

          theta = Math.atan2( offset.x, offset.z );

          // angle from y-axis

          phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), offset.y );

          if ( this.autoRotate && state === STATE.NONE ) {

            this.rotateLeft( getAutoRotationAngle() );

          }

          theta += thetaDelta;
          phi += phiDelta;

          // restrict theta to be between desired limits
          theta = Math.max( this.minAzimuthAngle, Math.min( this.maxAzimuthAngle, theta ) );

          // restrict phi to be between desired limits
          phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, phi ) );

          // restrict phi to be betwee EPS and PI-EPS
          phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );

          var radius = offset.length() * scale;

          // restrict radius to be between desired limits
          radius = Math.max( this.minDistance, Math.min( this.maxDistance, radius ) );

          // move target to panned location
          this.target.add( pan );

          offset.x = radius * Math.sin( phi ) * Math.sin( theta );
          offset.y = radius * Math.cos( phi );
          offset.z = radius * Math.sin( phi ) * Math.cos( theta );

          // rotate offset back to "camera-up-vector-is-up" space
          offset.applyQuaternion( quatInverse );

          position.copy( this.target ).add( offset );

          this.object.lookAt( this.target );

          thetaDelta = 0;
          phiDelta = 0;
          scale = 1;
          pan.set( 0, 0, 0 );

          // update condition is:
          // min(camera displacement, camera rotation in radians)^2 > EPS
          // using small-angle approximation cos(x/2) = 1 - x^2 / 8

          if ( lastPosition.distanceToSquared( this.object.position ) > EPS
              || 8 * (1 - lastQuaternion.dot(this.object.quaternion)) > EPS ) {

            this.dispatchEvent( changeEvent );

            lastPosition.copy( this.object.position );
            lastQuaternion.copy (this.object.quaternion );

          }

        };


        this.reset = function () {

          state = STATE.NONE;

          this.target.copy( this.target0 );
          this.object.position.copy( this.position0 );
          this.object.zoom = this.zoom0;

          this.object.updateProjectionMatrix();
          this.dispatchEvent( changeEvent );

          this.update();

        };

        this.getPolarAngle = function () {

          return phi;

        };

        this.getAzimuthalAngle = function () {

          return theta

        };

        function getAutoRotationAngle() {

          return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

        }

        function getZoomScale() {

          return Math.pow( 0.95, scope.zoomSpeed );

        }

        function onMouseDown( event ) {

          if ( scope.enabled === false ) return;
          event.preventDefault();

          if ( event.button === scope.mouseButtons.ORBIT ) {
            if ( scope.noRotate === true ) return;

            state = STATE.ROTATE;

            rotateStart.set( event.clientX, event.clientY );

          } else if ( event.button === scope.mouseButtons.ZOOM ) {
            if ( scope.noZoom === true ) return;

            state = STATE.DOLLY;

            dollyStart.set( event.clientX, event.clientY );

          } else if ( event.button === scope.mouseButtons.PAN ) {
            if ( scope.noPan === true ) return;

            state = STATE.PAN;

            panStart.set( event.clientX, event.clientY );

          }

          if ( state !== STATE.NONE ) {
            element[0].addEventListener( 'mousemove', onMouseMove, false );
            element[0].addEventListener( 'mouseup', onMouseUp, false );
            scope.dispatchEvent( startEvent );
          }

        }

        function onMouseMove( event ) {

          if ( scope.enabled === false ) return;

          event.preventDefault();

          var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

          if ( state === STATE.ROTATE ) {

            if ( scope.noRotate === true ) return;

            rotateEnd.set( event.clientX, event.clientY );
            rotateDelta.subVectors( rotateEnd, rotateStart );

            // rotating across whole screen goes 360 degrees around
            scope.rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );

            // rotating up and down along whole screen attempts to go 360, but limited to 180
            scope.rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

            rotateStart.copy( rotateEnd );

          } else if ( state === STATE.DOLLY ) {

            if ( scope.noZoom === true ) return;

            dollyEnd.set( event.clientX, event.clientY );
            dollyDelta.subVectors( dollyEnd, dollyStart );

            if ( dollyDelta.y > 0 ) {

              scope.dollyIn();

            } else if ( dollyDelta.y < 0 ) {

              scope.dollyOut();

            }

            dollyStart.copy( dollyEnd );

          } else if ( state === STATE.PAN ) {

            if ( scope.noPan === true ) return;

            panEnd.set( event.clientX, event.clientY );
            panDelta.subVectors( panEnd, panStart );

            scope.pan( panDelta.x, panDelta.y );

            panStart.copy( panEnd );

          }

          if ( state !== STATE.NONE ) scope.update();

        }

        function onMouseUp( /* event */ ) {

          if ( scope.enabled === false ) return;

          element[0].removeEventListener( 'mousemove', onMouseMove, false );
          element[0].removeEventListener( 'mouseup', onMouseUp, false );
          scope.dispatchEvent( endEvent );
          state = STATE.NONE;

        }

        function onMouseWheel( event ) {

          if ( scope.enabled === false || scope.noZoom === true || state !== STATE.NONE ) return;

          event.preventDefault();
          event.stopPropagation();

          var delta = 0;

          if ( event.wheelDelta !== undefined ) { // WebKit / Opera / Explorer 9

            delta = event.wheelDelta;

          } else if ( event.detail !== undefined ) { // Firefox

            delta = - event.detail;

          }

          if ( delta > 0 ) {

            scope.dollyOut();

          } else if ( delta < 0 ) {

            scope.dollyIn();

          }

          scope.update();
          scope.dispatchEvent( startEvent );
          scope.dispatchEvent( endEvent );

        }

        /*function onKeyDown( event ) {

         if ( scope.enabled === false || scope.noKeys === true || scope.noPan === true ) return;

         switch ( event.keyCode ) {

         case scope.keys.UP:
         scope.pan( 0, scope.keyPanSpeed );
         scope.update();
         break;

         case scope.keys.BOTTOM:
         scope.pan( 0, - scope.keyPanSpeed );
         scope.update();
         break;

         case scope.keys.LEFT:
         scope.pan( scope.keyPanSpeed, 0 );
         scope.update();
         break;

         case scope.keys.RIGHT:
         scope.pan( - scope.keyPanSpeed, 0 );
         scope.update();
         break;

         }

         }*/

        function touchstart( event ) {

          if ( scope.enabled === false ) return;

          switch ( event.touches.length ) {

            case 1:	// one-fingered touch: rotate

              if ( scope.noRotate === true ) return;

              state = STATE.TOUCH_ROTATE;

              rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
              break;

            case 2:	// two-fingered touch: dolly

              if ( scope.noZoom === true ) return;

              state = STATE.TOUCH_DOLLY;

              var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
              var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
              var distance = Math.sqrt( dx * dx + dy * dy );
              dollyStart.set( 0, distance );
              break;

            case 3: // three-fingered touch: pan

              if ( scope.noPan === true ) return;

              state = STATE.TOUCH_PAN;

              panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
              break;

            default:

              state = STATE.NONE;

          }

          if ( state !== STATE.NONE ) scope.dispatchEvent( startEvent );

        }

        function touchmove( event ) {

          if ( scope.enabled === false ) return;

          event.preventDefault();
          event.stopPropagation();

          var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

          switch ( event.touches.length ) {

            case 1: // one-fingered touch: rotate

              if ( scope.noRotate === true ) return;
              if ( state !== STATE.TOUCH_ROTATE ) return;

              rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
              rotateDelta.subVectors( rotateEnd, rotateStart );

              // rotating across whole screen goes 360 degrees around
              scope.rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );
              // rotating up and down along whole screen attempts to go 360, but limited to 180
              scope.rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

              rotateStart.copy( rotateEnd );

              scope.update();
              break;

            case 2: // two-fingered touch: dolly

              if ( scope.noZoom === true ) return;
              if ( state !== STATE.TOUCH_DOLLY ) return;

              var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
              var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
              var distance = Math.sqrt( dx * dx + dy * dy );

              dollyEnd.set( 0, distance );
              dollyDelta.subVectors( dollyEnd, dollyStart );

              if ( dollyDelta.y > 0 ) {

                scope.dollyOut();

              } else if ( dollyDelta.y < 0 ) {

                scope.dollyIn();

              }

              dollyStart.copy( dollyEnd );

              scope.update();
              break;

            case 3: // three-fingered touch: pan

              if ( scope.noPan === true ) return;
              if ( state !== STATE.TOUCH_PAN ) return;

              panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
              panDelta.subVectors( panEnd, panStart );

              scope.pan( panDelta.x, panDelta.y );

              panStart.copy( panEnd );

              scope.update();
              break;

            default:

              state = STATE.NONE;

          }

        }

        function touchend( /* event */ ) {

          if ( scope.enabled === false ) return;

          scope.dispatchEvent( endEvent );
          state = STATE.NONE;

        }

        element[0].addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
        element[0].addEventListener( 'mousedown', onMouseDown, false );
        element[0].addEventListener( 'mousewheel', onMouseWheel, false );
        element[0].addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox

        element[0].addEventListener( 'touchstart', touchstart, false );
        element[0].addEventListener( 'touchend', touchend, false );
        element[0].addEventListener( 'touchmove', touchmove, false );

        // window.addEventListener( 'keydown', onKeyDown, false );

        // force an update at start
        this.update();

      };


      THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );
      THREE.OrbitControls.prototype.constructor = THREE.OrbitControls;


      var contW = scope.width,
          contH = scope.height,
          windowHalfX = contW / 2,
          windowHalfY = contH / 2;
      var satelitCounter = 0;

      var renderer; //this is the thing that draws
      var scene; //this contains all the objects
      var camera; //this is where we look from
      var cameraControl;


      function createRenderer() {
        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(0x009119, 1.0);
        console.log(element);
        renderer.setSize(700, 400);
        renderer.shadowMap.enabled = true;
      }

      function createCamera() {
        camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth/window.innerHeight,
            0.1, 1000
        );
        camera.position.x = 140;
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
        loader.load('./images/earthmap2k.jpg', function(image){
          earthTexture.image = image;
          earthTexture.needsUpdate = true;
        });

        var normalTexture = new THREE.Texture();
        loader.load('./images/earth_normalmap_flat2k.jpg', function(image){
          normalTexture.image = image;
          normalTexture.needsUpdate = true;
        });

        var specularTexture = new THREE.Texture();
        loader.load('./images/earthspec2k.jpg', function(image){
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
        loader.load('./images/fair_clouds_1k.png', function(image){
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
        var envGeometry  = new THREE.SphereGeometry(150, 32, 32);
        // create the material, using a texture of startfield
        var envMaterial  = new THREE.MeshBasicMaterial();
        envMaterial.map   =    THREE.ImageUtils.loadTexture('./images/galaxy_starfield.png');
        envMaterial.side  = THREE.BackSide;
        // create the mesh based on geometry and material
        var mesh  = new THREE.Mesh(envGeometry, envMaterial);
        scene.add(mesh);
      }

      function createMoonMaterial(){
        var moonTexture = new THREE.Texture();
        var loader = new THREE.ImageLoader();
        loader.load('./images/moon.jpg', function(image){
          moonTexture.image = image;
          moonTexture.needsUpdate = true;
        });
        var moonMaterial = new THREE.MeshPhongMaterial();
        moonMaterial.map = moonTexture;
        return moonMaterial;
      }

      function createMoon() {
        var sphereGeometry = new THREE.SphereGeometry(3,30,30);
        var sphereMaterial = createMoonMaterial();
        var moon = new THREE.Mesh(sphereGeometry, sphereMaterial);
        moon.castShadow = true;
        moon.name = 'moon';
        moon.position.x = 25;
        moon.position.y = 0;
        moon.position.z = 0;
        scene.add(moon);
      }

      var firstHalf = true;
      function orbitMoon(){
        if(firstHalf){
          scene.getObjectByName('moon').position.y = Math.sqrt(25*25-scene.getObjectByName('moon').position.x*scene.getObjectByName('moon').position.x);
          //console.log(scene.getObjectByName('moon').position.x+" x "+scene.getObjectByName('moon').position.y);
          scene.getObjectByName('moon').position.x -= 0.05;
          scene.getObjectByName('moon').position.x = Math.round(scene.getObjectByName('moon').position.x*100)/100;
          if(scene.getObjectByName('moon').position.x == -25.05){
            firstHalf = false;
            scene.getObjectByName('moon').position.x += 0.1;
            scene.getObjectByName('moon').position.x = Math.round(scene.getObjectByName('moon').position.x*100)/100;
            return;
          }
        }
        else{
          scene.getObjectByName('moon').position.y = -Math.sqrt(25*25-scene.getObjectByName('moon').position.x*scene.getObjectByName('moon').position.x);
          //console.log(scene.getObjectByName('moon').position.x+" x "+scene.getObjectByName('moon').position.y);
          scene.getObjectByName('moon').position.x += 0.05;
          scene.getObjectByName('moon').position.x = Math.round(scene.getObjectByName('moon').position.x*100)/100;
          if(scene.getObjectByName('moon').position.x == 25) firstHalf = true;
        }
      }
      function getRandomColor(){
        var color = "black";
        var c = Math.random()*6;
        if (c > 5) color = "red";
        if (c <= 5 && c > 4) color = "blue";
        if (c <= 4 && c > 3) color = "green";
        if (c <= 3 && c > 2) color = "yellow";
        if (c <= 2 && c > 1) color = "white";
        if (c <= 1) color = "purple";
        return color;
      }

      scope.$watchCollection('sat', function () {
        console.log("HOLA!");
        if (scope.sat) {
          addSatelit(scope.sat);
          delete scope.sat;
        }

      });

      function addSatelit(sat){
        var satelitGeometry = new THREE.SphereGeometry(sat.geometry,32,32);
        var satelitMaterial = new THREE.MeshLambertMaterial({color: sat.color});
        var satelit = new THREE.Mesh(satelitGeometry, satelitMaterial);
        satelit.castShadow = sat.castShadow;
        satelit.name = 'satelit'+satelitCounter;
        satelit.position.x = sat.position.x;
        satelit.position.y = sat.position.y;
        satelit.position.z = sat.position.z;
        satelit.speed = sat.speed;
        satelit.distX = sat.distX;
        satelit.distY = sat.distY;
        satelit.distZ = sat.distZ;
        satelit.halfWay = true;
        scene.add(satelit);
        console.log("SATELIT N "+satelitCounter+" AMB VELOCITAT "+satelit.speed+" AFEGIT");
        ++satelitCounter;
      }

      function orbitSatelit(i){
        //scene.getObjectByName('satelit'+i).position.x += scene.getObjectByName('satelit'+i).speed;
        if(scene.getObjectByName('satelit'+i).halfWay){
          scene.getObjectByName('satelit'+i).position.z = Math.sqrt(scene.getObjectByName('satelit'+i).distX*scene.getObjectByName('satelit'+i).distX-scene.getObjectByName('satelit'+i).position.x*scene.getObjectByName('satelit'+i).position.x);
          //console.log(scene.getObjectByName('satelit'+i).position.x+" x "+scene.getObjectByName('satelit'+i).position.y);
          scene.getObjectByName('satelit'+i).position.x -= scene.getObjectByName('satelit'+i).speed;
          scene.getObjectByName('satelit'+i).position.x = Math.round(scene.getObjectByName('satelit'+i).position.x*100)/100;
          if(scene.getObjectByName('satelit'+i).position.x <= -scene.getObjectByName('satelit'+i).distX-scene.getObjectByName('satelit'+i).speed){
            scene.getObjectByName('satelit'+i).halfWay = false;
            scene.getObjectByName('satelit'+i).position.x += scene.getObjectByName('satelit'+i).speed*2;
            scene.getObjectByName('satelit'+i).position.x = Math.round(scene.getObjectByName('satelit'+i).position.x*100)/100;
            return;
          }
        }
        else{
          scene.getObjectByName('satelit'+i).position.z = -Math.sqrt(scene.getObjectByName('satelit'+i).distX*scene.getObjectByName('satelit'+i).distX-scene.getObjectByName('satelit'+i).position.x*scene.getObjectByName('satelit'+i).position.x);
          //console.log(scene.getObjectByName('satelit'+i).position.x+" x "+scene.getObjectByName('satelit'+i).position.y);
          scene.getObjectByName('satelit'+i).position.x += scene.getObjectByName('satelit'+i).speed;
          scene.getObjectByName('satelit'+i).position.x = Math.round(scene.getObjectByName('satelit'+i).position.x*100)/100;
          if(scene.getObjectByName('satelit'+i).position.x >= scene.getObjectByName('satelit'+i).distX) scene.getObjectByName('satelit'+i).halfWay = true;
        }
      }

//init() gets executed once
      function init() { //initalise all of our objects
        console.log(scope);

        scene = new THREE.Scene();
        createRenderer();
        createCamera();
        createLight();
        createDirectionalLight();
        createAmbientLight();
        createBox();
        createPlane();
        createMoon();
        createEarth();
        createClouds();
        createEnvironment();
        //addSatelit();
        cameraControl = new THREE.OrbitControls(camera);
        //render() gets called at end of init
        //as it looped forever
        element[0].appendChild(renderer.domElement);
        render();


      }

//infinite loop
      function render() { //this render the scene
        cameraControl.update();
        scene.getObjectByName('earth').rotation.y += 0.001;//rotate earth
        scene.getObjectByName('clouds').rotation.y += 0.0015;//rotate clouds
        scene.getObjectByName('moon').rotation.y -= 0.01;//rotate moon
        orbitMoon();
        try{
          for (var i = 0; i < satelitCounter; ++i) orbitSatelit(i);// fiuuum
        }
        catch (err){

        }
        renderer.render(scene,camera);
        requestAnimationFrame(render);
      }


      init();

    }
  };
}

export default {
  name: 'sceneDirective',
  fn: SceneDirective
};

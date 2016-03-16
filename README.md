#chat_ecv

AngularJs chat/twitter timeline with THREE.js animations showing trending topics from different locations through twitter.
Every planet represents a country and every satellite a topic.
All is dynamic (the connexion with twitter is real) and built with websockets 

The THREE.js scene is placed in the directive `sceneBox`,
The Twitter timeline is placed in the directive `twitterTimeline`,
The connexion with our API is done by the service `twitterService` and the connexion with the 'Chat' server is done by the service `chatService`.
We don't have direct connection to Twitter, we will recover the data through our API.

## Boilerplate forked from:
- `https://github.com/MarcObvious/chat_ecv_api`

### Live example
- `http://84.89.136.194/students/entornsupf2016/`

### Getting it up and running
1. Clone this repo from `https://github.com/MarcObvious/chat_ecv.git`
2. Run `npm install`
3. Run `gulp dev` in order to test the page

### Getting the webpage into the server
1. Run `gulp prod`
2. `scp -r build/* entornsupf2016@84.89.136.194:www`

## SillySever savaged from:
- `https://github.com/jagenjo/SillyServer.js`

## Boilerplate forked from:
- `https://github.com/jakemmarsh/angularjs-gulp-browserify-boilerplate`

[View contributors](https://github.com/MarcObvious/chat_ecv/graphs/contributors)

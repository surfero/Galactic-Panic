// NOTE: webpackGameEntrypoint must go at top of file!
import webpackGameEntrypoint from 'devkitCore/clientapi/webpackGameEntrypoint';

import device from 'device';

import TitleScreen from 'src/view_controller/TitleScreen'
import GameScreen from 'src/view_controller/GameScreen'

import View from 'ui/View';
import StackView from 'ui/StackView';

import animate from 'frontend/devkit-core/timestep/src/animate.js';
import ParticleEngine from 'frontend/devkit-core/timestep/src/ui/ParticleEngine.js'; 

import facebook from 'facebook'

facebook.initializeAsync()
.then(function(){});


export default class Application extends View {
    constructor(opts) {
        super(opts);

        this.rootView = new StackView({
            superview: this,
            x: 0,
            y: 0,
            width: device.screen.width,
            height: device.screen.height,
        });

        this.gameScreen = new GameScreen(opts);
        this.titleScreen = new TitleScreen(opts);
        this.rootView.push(this.titleScreen);

        this._wait();
    }

    _wait() {
        this.titleScreen.on('titleScreen:start', () => {
            this.rootView.push(this.gameScreen, {noAnimate: false});
            this.gameScreen.alive = true;
            this.gameScreen._startGame(1);
        });
        this.gameScreen.on('gameScreen:restart', () => {
            this.rootView.pop();
            this.titleScreen._replaceViews();
            this.titleScreen._createActions();
        });
    }
}

facebook.startGameAsync().then(() => {
    webpackGameEntrypoint(Application);
});


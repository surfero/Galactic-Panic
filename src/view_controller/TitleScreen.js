import device from 'device';
import View from 'ui/View';
import ImageView from 'ui/ImageView';
import ViewPool from 'ui/ViewPool';

import BitmapFontTextView from 'ui/bitmapFont/BitmapFontTextView';
import ImageViewCache from 'ui/resource/ImageViewCache';
import BitmapFont from 'ui/bitmapFont/BitmapFont';
import hummingData from 'xml-loader!resources/images/fonts/latin/humming.fnt';

import Asteroid from 'src/Asteroid';

import SliderView from "frontend/devkit-core/timestep/src/ui/widget/SliderView";
import TextView from "frontend/devkit-core/timestep/src/ui/TextView.js";

import animate from 'frontend/devkit-core/timestep/src/animate.js';
import ParticleEngine from 'ui/ParticleEngine.js';

import AudioManager from 'frontend/devkit-core/timestep/src/AudioManager';

export default class TitleScreen extends View {
    constructor(opts) {
        super(opts);
        this.activeParticleSystems = [];
        this._resize();
        this._buildViews();
        this._start();
    }

    _start() {
        this.numTicks = 0;
        this.laserActive = false;
        this.audio.play('strategist');
        this._createActions();
    }
    
    _resize() {
        this.style.width = device.screen.width;
        this.style.height = device.screen.height;
    }
    
    _buildViews() {
        this.titleScreenViews = [];

        this.font = new BitmapFont(ImageViewCache.getImage(
            'resources/images/fonts/latin/humming.png'),
            hummingData);

        this.background = new ImageView({
            parent: this,
            image: 'resources/images/tsums/large/space.png',
            x: this.style.width / 2,
            width: this.style.width,
            height: this.style.height * 2,
            canHandleEvents: false,
            centerOnOrigin: true,
        });
        this.titleScreenViews.push(this.background);

        this.removeFlames = false;
        
        this.titleLabel = new BitmapFontTextView({
            superview: this,
            x: this.style.width / 2,
            y: this.style.height / 2 - 500,
            width: 120,
            height: 40,
            scale: 5.0,
            centerOnOrigin: true,
            font: this.font,
            align: 'center',
            verticalAlign: 'center',
            text: "Galactic Panic",
            color: "red",
            opacity: 1.0,
        });
        this.titleScreenViews.push(this.titleLabel);

        this.startButton = new ImageView({
            superview: this,
            width: 250,
            height: 100,
            opacity: 1.0,
            x: this.style.width / 2,
            y: this.style.height / 2 + 400,
            image: 'resources/images/tsums/large/startButton.png',
            centerOnOrigin: true,
        });
        this.titleScreenViews.push(this.startButton);

        this.rocket = new ImageView({
            parent: this,
            image: 'resources/images/tsums/large/rocket.png',
            x: this.style.width / 2,
            y: -150,
            centerOnOrigin: true,
            flipY: true,
            width: 200,
            height: 200,
            visible: false,
        });
        this.titleScreenViews.push(this.rocket);

        this.flames = new ImageView({
            parent: this.rocket,
            image: "resources/images/particles/glow_04.png",
            x: this.rocket.style.width / 2,
            y: this.rocket.style.height - 18, 
            opacity: 5.0,
            width: 40,
            height: 100,
            centerOnOrigin: true,
        });
        this.titleScreenViews.push(this.flames);

        this.laser = new ImageView({
            parent: this,
            image: 'resources/images/particles/glow_13.png',
            x: this.style.width / 2,
            y: (this.style.height / 2) - 200,
            opacity: 2.5,
            width: 100,
            height: 100,
            visible: false,
            centerOnOrigin: true,
        });
        this.titleScreenViews.push(this.laser);

        this.laserShine = new ImageView({
            parent: this,
            image: 'resources/images/particles/dim_sparkle_13.png',
            x: this.style.width / 2,
            y: (this.style.height / 2) - 200,
            width: 150,
            opacity: 0.01,
            height: 150,
            centerOnOrigin: true,
        });
        this.titleScreenViews.push(this.laserShine);

        this.explosion = new ImageView({
            parent: this.startButton,
            image: 'resources/images/particles/hot_pop_03.png',
            x: this.startButton.style.width / 2,
            y: this.startButton.style.height / 2,
            opacity: 0.2,
            scale: 1.0,
            visible: false,
            height: 200,
            width: 200,
            centerOnOrigin: true,
        });
        this.titleScreenViews.push(this.explosion);

        this.nextLevel = new BitmapFontTextView({
            parent: this,
            x: this.style.width / 2,
            y: this.style.height / 2,
            width: 300,
            opacity: 0.01,
            height: 80,
            scale: 5.0,
            centerOnOrigin: true,
            visible: false,
            font: this.font,
            align: 'center',
            verticalAlign: 'center',
            text: "Level 1",
            color: 'red',
        });

        this.laserTrailEngine = new ParticleEngine({
            parent: this.laser,
            initCount: 1,
        });
        this.activeParticleSystems.push(this.laserTrailEngine);


        this.asteroidPool = new ViewPool({
            ctor: Asteroid,
            initCount: 8,
            initOpts: {
                superview: this,
                width: 150,
                height: 150,
                x: this.style.width / 2,
                y: -300,
                opacity: 4,
                image: 'resources/images/tsums/large/fireball.png',
                centerOnOrigin: true,
            }
        });

        this.asteroids = [];

        this.audio = new AudioManager({
            path: 'resources/sounds/',
            files: {
                laser: {
                    path: 'laser',
                },
                fireBallExplosion: {
                    path: 'fireBallExplosion',
                },
                nextLevel: {
                    path: 'nextLevel',
                },
                start: {
                    path: 'start',
                },
                strategist: {
                    path: 'strategist',
                },
            },
        });
        this.audio.addSound('laser', {
            path: 'sfx',
            background: false,
        });
        this.audio.addSound('fireBallExplosion', {
            path: 'sfx',
            background: false,
        });
        this.audio.addSound('nextLevel', {
            volume: 2.0,
            path: 'sfx',
        });
        this.audio.addSound('start', {
            volume: 1.5,
            path: 'sfx',
        });
        this.audio.addSound('strategist', {
            volume: 3.0,
            path: 'music',
        });

        this.ready = false;
        this.removing = false;
    }

    // replace views back to original spots upon game restart
    _replaceViews() {
        for (var i = 0; i < this.titleScreenViews.length; i++) {
            this.titleScreenViews[i].show();
            this.titleScreenViews[i].style.opacity = 1;
        }
        this.rocket.style.x = this.style.width / 2;
        this.rocket.style.y = -150;

        this.flames.style.opacity = 5.0;

        this.laser.style.x = this.laser.style.width / 2;
        this.laser.style.y = (this.laser.style.height / 2) - 100
        this.laser.style.opacity = 2.5;
        this.laser.hide();

        this.laserShine.style.opacity = 0.01;

        this.explosion.style.width = 200;
        this.explosion.style.height = 200;
        this.explosion.style.scale = 1.0;
        this.explosion.hide();

        this.nextLevel.hide();
    }

    _createActions() {
        var app = this;
        var xDist = 100 * Math.sin(this.rocket.style.r);
        var yDist = 100 * Math.cos(this.rocket.style.r);
        var xTip = this.rocket.style.x + xDist;
        var yTip = this.rocket.style.y - yDist;

        var fadeAnimation = function() {
            animate(this)
            .now({opacity: 0}, 750)
            .then({opacity: 1.0}, 750)
            .then(fadeAnimation.bind(this));
        }
        var titleLabelFade = fadeAnimation.bind(this.titleLabel);
        titleLabelFade();

        var onInputSelectFn = function(stopEvent, stopPoint) {
            if (app.ready) {
                return;
            }
            
            app.audio.play('start');

            this.style.opacity = 1.0;

            app.ready = true;
            app.rocket.show();

            // animate title screen game start animation
            animate(app.titleLabel).now({opacity: 0}, 2000);
            
            animate(app.rocket)
            .now({y: 500}, 3000)
            .then(() => { 
                animate(app.flames)
                .now({opacity:0}, 200)
                .then(() => app.flames.hide())
            })
            .then(() => {
                animate(app.laserShine)
                .now({opacity:1}, 500)
                .then(() => {
                    app.audio.play('laser');
                    app.laserShine.hide();
                 })
                .then(() => {
                    app.laserActive = true;
                    animate(app.laser)
                    .now({visible: true}, 1)
                    .then({y: 1200}, 500)
                    .then(() => {
                        app.laserActive = false;
                        app.laser.hide();
                        app.audio.play('fireBallExplosion');
                     })
                    .then(() => {
                        animate(app.explosion)
                        .now({visible: true}, 1)
                        .then({scale: 20, opacity: 2}, 400)
                        .then(() => {
                            app.explosion.hide();
                            app.startButton.hide();
                        })
                        .then(() => {
                            animate(app.rocket)
                            .now({opacity: 0}, 1000)
                            .then(() => {app.rocket.hide()});

                            app.audio.stop('strategist');

                            animate(app.titleLabel)
                            .now({opacity: 0}, 1000)

                            animate(app.background)
                            .now({opacity: 0}, 1000)
                            .then(() => {app.background.hide()})
                            .then(() => {
                                app.titleLabel.hide();
                                app.audio.play('nextLevel');
                                animate(app.nextLevel)
                                .now({visible: true})
                                .then({opacity: 1}, 2000)
                                .then({opacity: 0}, 2000)
                                .then(() => {
                                    app.titleLabel.hide();
                                    app.emit('titleScreen:start');
                                    app.ready = false;
                                })
                            })
                        })
                    })
                })
            })
        }
        
        this.startButton.onInputStart = () => {
            this.startButton.style.opacity = 0.5;
        };
        this.startButton.onInputOut = () => {
            this.startButton.style.opacity = 1.0;
        };

        this.startButton.onInputSelect = onInputSelectFn.bind(this.startButton);
    }

    _tick(dt) {
        this.numTicks++;
        this.background.style.y += 5;
        if (this.background.style.y - this.style.height > 0) {
            this.background.style.y = 0;
        }

        if (this.numTicks % 150 === 0 && this.asteroids.length < 8) {
            var asteroid = this.asteroidPool.obtainView();
            asteroid.setProperties(this, this.rocket.style.x, this.rocket.style.y, this.level);

            asteroid.flare.hide();
            asteroid.flare.style.visible = false;

            this.asteroids.push(asteroid);
        }

        if (!this.ready) {
            this._moveAsteroids();
        } else if (this.ready && !this.removing && this.asteroids.length > 0) {
            this.removing = true;
            for (var i = 0; i < this.asteroids.length; i++) {
                var cur = this.asteroids[i];
                this.asteroids.splice(i, 1);

                animate(cur)
                .now({opacity: 0.0}, 1000)
                .then(() => {
                    this.asteroidPool.releaseView(cur);
                });
            }
        }

        if (this.laserActive) {
            var explosionParticleArray = this.laserTrailEngine.obtainParticleArray(1);
            var ttl = 1000;
            var particle = explosionParticleArray[0];
            particle.centerOnOrigin = true;
            particle.ttl = ttl;
            particle.image = 'resources/images/particles/glow_13.png';
            particle.dy = -700 * Math.sin(0.5);
            particle.opacity = 0.5;
            particle.dopacity = -1;
            particle.width = this.laser.style.width;
            particle.height = this.laser.style.height; 
            this.laserTrailEngine.emitParticles(explosionParticleArray);
        }

        for (var i = 0; i < this.activeParticleSystems.length; i++) {
            this.activeParticleSystems[i].runTick(dt);
        }
    }

    _moveAsteroids() {
        for (var i = this.asteroids.length - 1; i >= 0; i--) {
            var cur = this.asteroids[i];

            cur.move();
            var w = cur.style.width;
            var h = cur.style.height;

            cur.flare.hide();
            cur.flare.style.visible = false;

            if ((cur.style.x > this.style.width + w + 300 || cur.style.x < 0 + w - 300 ||
                cur.style.y > this.style.height + h + 300|| cur.style.y < 0 + h - 300) &&
                cur.movedAcrossScreen)
            {
                this.asteroids.splice(i, 1);
                this.asteroidPool.releaseView(cur);
            }
        }
    }            
}

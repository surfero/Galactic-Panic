import View from 'ui/View';
import ImageView from 'ui/ImageView';

import AudioManager from 'AudioManager';

import Vec2D from 'frontend/jsio/math/geom/Vec2D';
import Point from 'frontend/jsio/math/geom/Point';

import animate from 'frontend/devkit-core/timestep/src/animate.js'; 
import ParticleEngine from 'ui/ParticleEngine.js';

export default class Asteroid extends ImageView {
    constructor() {
        super(...arguments);
        this.asteroidTrailEngine = new ParticleEngine({
            parent: this,
            initCount: 1,
        });
    }

    setProperties(p, rocketX, rocketY, level) {
        this.backgroundColor = "red";
        this.speed = genRandomSpeed(8, 18);
        var pathVariance = Math.floor(Math.random() * Math.floor(200));
        if (Math.floor(Math.random() * 2) == 0) pathVariance *= -1;
        this.p = p;
        this.flare = new ImageView({
            parent: this.p,
            image: 'resources/images/particles/hot_sparkle_03.png',
            centerOnOrigin: true,
            x: 0,
            y: 0,
            width: 300,
            height: 300,
            opacity: 1,
        });

        var random = Math.floor(Math.random() * Math.floor(4));
        if (random == 0) {
            this.style.x = 0 - (p.style.width/2);
            this.style.y = genRandomSpeed(-100, p.style.height + 100);
            this.flare.style.x = 0;
            this.flare.style.y = this.style.y + 200;
        } else if (random == 1) {
            this.style.x = genRandomSpeed(-100, p.style.width + 100);
            this.style.y = 0 - (p.style.height/2);
            this.flare.style.x = this.style.x + 200;
            this.flare.style.y = 0;
        } else if (random == 2) {
            this.style.x = p.style.width + (p.style.width/2);
            this.style.y = genRandomSpeed(- 100, p.style.height + 100);
            this.flare.style.x = p.style.width;
            this.flare.style.y = this.style.y;
        } else {
            this.style.x = genRandomSpeed(-100, p.style.width + 100);
            this.style.y = p.style.height + (p.style.height/2);
            this.flare.style.x = this.style.x;
            this.flare.style.y = p.style.height;
        }

        this.style.opacity = 4;
        this.show();
        this.style.visible = true;

        this.path = new Vec2D({x: rocketX - this.style.x + pathVariance, y: rocketY - this.style.y + pathVariance});
        this.pathAngle = this.path.getAngle();
        this.hx = this.style.width / 1.2
        this.hy = this.style.height / 1.2;
        this.collided = false;
        this.active = false;
        this.onScreen = false;
        this.movedAcrossScreen = false;
        this.warning = false;
        this.audio = new AudioManager({
            path: 'resources/sounds/',
            files: {
                asteroid: {path: 'asteroid'},
            }
        });
        this.audio.addSound('asteroid', {
            path: 'sfx',
            volume: 1.5,
        });
    }

    move() {
        if (!this.warning) {
            animate(this.flare)
            .now(() => { 
                this.flare.style.opacity = 1;
                this.flare.style.visible = true;
                this.flare.show();
            }, 1500)
            .then(() => {this.flare.hide()});
        }
        this.warning = true;
        this.style.x += this.speed * Math.cos(this.pathAngle);
        this.style.y += this.speed * Math.sin(this.pathAngle);

        var asteroidTrail = this.asteroidTrailEngine.obtainParticleArray(1);

        var particle = asteroidTrail[0];
        particle.centerOnOrigin = true;
        particle.ttl = 1000;
        particle.image = 'resources/images/particles/glow_04.png';
        particle.dx = -700 * Math.cos(this.pathAngle);
        particle.dy = -700 * Math.sin(this.pathAngle);
        particle.opacity = 0.35;
        particle.dopacity = -1;
        particle.width = this.style.width;
        particle.height = this.style.height;
        this.asteroidTrailEngine.emitParticles(asteroidTrail);

        // play asteroid fly-by sound when entering the screen
        if (this.style.x < this.p.style.width && this.style.x > 0 &&
            this.style.y <= this.p.style.height && this.style.y > 0 && 
            !this.onScreen) 
        {
            this.audio.play('asteroid');
            this.onScreen = true;
        }

        // remove from screen once it has traveled across it
        if ((this.style.x > this.p.style.width || this.style.x < 0 ||
            this.style.y > this.p.style.height || this.style.y < 0) 
            && !this.movedAcrossScreen && this.onScreen) 
        {
            this.movedAcrossScreen = true; 
        }
    }

    _tick(dt) {
        this.asteroidTrailEngine.runTick(dt);
    }
}

function genRandomSpeed(min,max) {
    return Math.random() * (max - min) + min
}

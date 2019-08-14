import View from 'ui/View';
import ImageView from 'ui/ImageView';

import BitmapFont from 'ui/bitmapFont/BitmapFont';
import BitmapFontTextView from 'ui/bitmapFont/BitmapFontTextView';
import hummingData from 'xml-loader!resources/images/fonts/latin/humming.fnt';
import ImageViewCache from 'ui/resource/ImageViewCache';

import animate from 'frontend/devkit-core/timestep/src/animate.js';
import ParticleEngine from 'frontend/devkit-core/timestep/src/ui/ParticleEngine.js'; 

var BOSSES = [
    'resources/images/tsums/large/Bosses/Death.png',
]

export default class Boss  {
    constructor(p, l) {
        this.b = new ImageView({
            parent: p,
            image: BOSSES[Math.floor(Math.random() * Math.floor(BOSSES.length))],
            x: p.style.width / 2 - 200,
            y: 0,
            width: 422,
            height: 705,
            opacity: 0,
            visible: false,
        });

        this.font = new BitmapFont(ImageViewCache.getImage(
            'resources/images/fonts/latin/humming.png'),
            hummingData);
        this.moveRight = false;
        this.moveDown = true;
        this.xSpeed = 18;
        this.ySpeed = 3;
        this.collided = false;
        this.active = false;
        this.health = l + 1;
        this.darkEnergyReady = false;
        this.p = p;

        this.healthLabel = new BitmapFontTextView({
            parent: p,
            x: p.style.width - 200,
            y: 100, 
            width: 50,
            height: 20,
            scale: 5.0,
            centerOnOrigin: true,
            font: this.font,
            align: 'center',
            verticalAlign: 'center',
            visible: false,
            color: 'red',
        });

        this.darkEnergy = new ImageView({
            parent: this.p,
            image: 'resources/images/tsums/large/Bosses/darkEnergy.png',
            x: this.b.style.x + this.b.style.width / 2 - 199,
            y: this.b.style.y + this.b.style.height / 2 + 160,
            visible: false,
            opacity: 1.0,
            width: 100,
            height: 100,
            centerOnOrigin: true,
        });

        this.darkEnergyTrailEngine = new ParticleEngine({
            parent: this.b,
            initCount: 1,
        });

        p.activeParticleSystems.push(this.darkEnergyTrailEngine);
    }

    _spawn() {
        this.b.show();
        animate(this.b).now({opacity:1.0}, 3000).then(() => {
            this.active = true;
            this.darkEnergyReady = true;
            this.healthLabel.show();
            this.healthLabel.text = "Boss HP: " + this.health;
        });
    }

    _fireDarkEnergy() {
        if (this.b.style.opacity < 1) {
            return;
        }

        this.p.nextDarkEnergy = this.p.seconds;
        const bossStyle = this.b.style;
        this.darkEnergy.style.x = bossStyle.x + bossStyle.width / 2 - 199;
        this.darkEnergy.style.y = bossStyle.y + bossStyle.height / 2 + 160;
        this.darkEnergy.style.visible = true;

        this.p.audio.play('dark');
        this.p.darkEnergyActive = true;
    }

    _moveBoss(app) {
        if (this.b.style.opacity < 1) {
            return;
        }

        var r = app.rocket.style;
        var rhb = app.rocketHitBox.style;
        var b = this.b.style;
        var moveBoss = () => {
            if (!this.moveRight) {
                this.b.style.x -= this.xSpeed;
                if (b.x <= 0) {
                    this.moveRight = true;
                }
            } else {
                this.b.style.x += this.xSpeed;
                if (b.x + b.width >= app.style.width) {
                    this.moveRight = false;
                }
            }

            var trail = this.darkEnergyTrailEngine.obtainParticleArray(1);
            var ttl = 1000;
            var particle = trail[0];
            particle.centerOnOrigin = true;
            particle.ttl = ttl;
            particle.image = 'resources/images/particles/glow_17.png';
            particle.x = -150;
            particle.y = -300;
            particle.opacity = 0.15;
            particle.dopacity = -1;
            particle.scale = 2
            particle.width = this.b.style.width;
            particle.height = this.b.style.height;
            this.darkEnergyTrailEngine.emitParticles(trail);
        }

        var checkCollision = function() {
            if (app.alive && (r.x + rhb.x) < (b.x + b.width - 20) &&
                (r.x + rhb.x + rhb.width) > (b.x + 70) &&
                (r.y + rhb.y) < (b.y + b.height + 10) &&
                (r.y + rhb.y + rhb.height) > (b.y)) 
            {
                if (app.repairProgress > 5) {
                    app.rocketHit = (12 - app.repairProgress) * 10;
                }
                
                if (app.repairProgress > 0 && app.seconds - app.invincibility >= 1) {
                    app.repairProgress -= 5;
                    if (app.repairProgress < 0) {
                        app.repairProgress = 0;
                    }
                    
                    app.audio.play('asteroidImpact');

                    app.asteroidImpact.show();
                    app.asteroidImpact.style.visible = true;

                    animate(app.asteroidImpact)
                    .now({
                        dscale: 140,
                    }, 500)
                    .then(() => {
                        app.asteroidImpact.hide();
                        app.asteroidImpact.style.visible = false;
                        app.asteroidImpact.style.opacity = 1.0;
                        app.asteroidImpact.style.scale = 1.0;
                    });


                    app.repairProgressLabel.text = "Repair progress: " + Math.floor((app.repairProgress / 12) * 100) + "%";
                    app.invincibility = app.seconds;
                    animate(app.rocket)
                    .now({opacity: 0.2}, 500)
                    .then({opacity: 0.8}, 500)
                    .then({opacity: 1.0});

                    if (app.repairProgress <= 0) {
                        app._gameOver(false);
                    }
                }
            }
        }

        var checkCollisionAction = checkCollision.bind(this);
        checkCollisionAction();
        var moveBossAction = moveBoss.bind(this);
        moveBossAction();
    }
}

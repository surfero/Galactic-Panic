import device from 'device' 

import TitleScreen from 'src/view_controller/TitleScreen';

import View from 'ui/View';
import ImageView from 'ui/ImageView';
import ViewPool from 'ui/ViewPool';
import TextView from 'ui/TextView';
import BitmapFont from 'ui/bitmapFont/BitmapFont';
import BitmapFontTextView from 'ui/bitmapFont/BitmapFontTextView';
import hummingData from 'xml-loader!resources/images/fonts/latin/humming.fnt';
import ImageViewCache from 'ui/resource/ImageViewCache';
import ImageScaleView from 'ui/ImageScaleView.js';

import Asteroid from 'src/model/Asteroid';
import Boss from 'src/model/Boss';
import PowerUp from 'src/model/PowerUp';

import AudioManager from 'AudioManager';
import sounds from 'src/lib/sounds'; 

import Vec2D from 'math/geom/Vec2D';
import Point from 'math/geom/Point';

import animate from 'animate';
import ParticleEngine from 'ui/ParticleEngine.js';

export default class GameScreen extends View {
    constructor (opts) {
        super(opts);
        device.screen.on('Resize', () => this._resize());
        this._resize();
        this._buildViews();
        this._audio();
    }

    _buildViews() {
        this.background = new ImageView({
            parent: this,
            image: 'resources/images/tsums/large/space.png',
            x: this.style.width / 2,
            width: this.style.width,
            height: this.style.height * 2,
            centerOnOrigin: true,
            visible: false,
        });

        this.rocket = new ImageView({
            parent: this,
            image: 'resources/images/tsums/large/rocket.png',
            x: this.style.width / 2,
            y: this.style.height / 2,
            anchorX: this.style.width / 2,
            anchorY: this.style.height / 2,
            centerOnOrigin: true,
            opacity: 1,
            width: 200,
            height: 200,
        });

        this.rocketFlame = new ImageView({
            parent: this.rocket,
            image: 'resources/images/particles/glow_04.png',
            x: this.rocket.style.width / 2,
            y: this.rocket.style.height - 18,
            width: 40,
            height: 100,
            centerOnOrigin: true,
            opacity: 0.0001,
            visible: false,
        });

        this.repairEffect = new ImageView({
            parent: this.rocket,
            image: 'resources/images/particles/hot_pop_25.png',
            x: this.rocket.style.width / 2,
            y: this.rocket.style.height / 2,
            opacity: 1.0,
            width: 10,
            height: 10,
            centerOnOrigin: true,
            visible: false,
        });

        this.obtainedPowerUpEffect = new ImageView({
            parent: this.rocket,
            image: 'resources/images/particles/hot_pop_13.png',
            x: this.rocket.style.width / 2,
            y: this.rocket.style.height / 2,
            opacity: 1.0,
            width: 10,
            height: 10,
            centerOnOrigin: true,
            visible: false
        });

        this.powerUp = new ImageView({
            parent: this,
            image: 'resources/images/particles/dim_pop_13.png',
            x: 0,
            y: 0,
            opacity: 1.0,
            width: 180,
            height: 180,
            centerOnOrigin: true,
            visible: false,
        });

        this.powerUpSpawnEffect = new ImageView({
            parent: this,
            image: 'resources/images/particles/hot_pop_13.png',
            x: 0,
            y: 0,
            opacity: 0.8,
            width: 400,
            height: 400,
            centerOnOrigin: true,
            visible: false,
        });

        this.asteroidImpact = new ImageView({
            parent: this.rocket,
            image: 'resources/images/particles/glow_24.png',
            x: this.rocket.style.width / 2,
            y: this.rocket.style.height / 2,
            opacity: 2.0,
            width: 10,
            height: 10,
            centerOnOrigin: true,
            visible: false,
        });

        // hitbox of rocket for collision detection
        this.rocketHitBox = new View({
            parent: this.rocket,
            centerOnOrigin: true,
            x: this.rocket.style.width / 2,
            y: this.rocket.style.height / 2,
            width: 90,
            height: 150,
        });

        this.asteroidPool = new ViewPool({
            ctor: Asteroid,
            initCount: 15,
            initOpts: {
                parent: this,
                width: 150,
                height: 150,
                x: this.style.width/2,
                y: -300,
                opacity: 4,
                image: 'resources/images/tsums/large/fireball.png',
                centerOnOrigin: true,
            }
        });

        this.font = new BitmapFont(ImageViewCache.getImage(
            'resources/images/fonts/latin/humming.png'),
            hummingData);

        this.repairProgressLabel = new BitmapFontTextView({
            parent: this,
            x: 220,
            y: 100,
            width: 80,
            height: 20,
            scale: 5.0,
            centerOnOrigin: true,
            font: this.font,
            align: 'center',
            verticalAlign: 'center',
            text: "Repair progress: " + Math.floor((5/12)*100) + "%",
            color: "green",
            opacity: 1.0,
        });

        this.repairPlus = new BitmapFontTextView({
            parent: this,
            x: this.rocket.style.x + 10,
            y: this.rocket.style.y - 50,
            width: 40,
            height: 40,
            scale: 4.0,
            centerOnOrigin: true,
            font: this.font,
            align: 'center',
            verticalAlign: 'center',
            text: "+1",
            color: "green",
            opacity: 1.0,
            visible: false,
        });

        this.repairMinus = new BitmapFontTextView({
            parent: this,
            x: this.rocket.style.x + 10,
            y: this.rocket.style.y - 50,
            width: 40,
            height: 40,
            scale: 4.0,
            centerOnOrigin: true,
            font: this.font,
            align: 'center',
            verticalAlign: 'center',
            text: "-1",
            color: "red",
            opacity: 1.0,
            visible: false,
        });

        this.titleLabel = new BitmapFontTextView({
            superview: this,
            x: this.style.width / 2,
            y: this.style.height / 2 + 150,
            width: 50,
            height: 20,
            scale: 8.0,
            visible: false,
            centerOnOrigin: true,
            font: this.font,
            align: 'center',
            verticalAlign: 'center',
            text: 'title screen',
            color: 'red',
        });

        this.gameOverLabel = new BitmapFontTextView({
            superview: this,
            x: this.style.width / 2,
            y: this.style.height / 2,
            width: 80,
            height: 40,
            scale: 5.0,
            visible: false,
            centerOnOrigin: true,
            font: this.font,
            align: 'center',
            verticalAlign: 'center',
            text: 'game over!',
        });

        // laser muzzle flash imageview to animate before firing laser
        this.laserShine = new ImageView({
            parent: this,
            image: 'resources/images/particles/dim_sparkle_13.png',
            x: 0,
            y: 0,
            width: 150,
            opacity: 0.01,
            height: 150,
            centerOnOrigin: true,
        });

        this.laser = new ImageView({
            parent: this,
            image: 'resources/images/particles/glow_13.png',
            x: 0,
            y: 0,
            opacity: 2,
            width: 100,
            height: 100,
            visible: false,
            centerOnOrigin: true,
        });

        this.sparkle = new ImageView({
            parent: this,
            image: 'resources/images/particles/dim_sparkle_13.png',
            x: this.laser.style.x - 38,
            y: this.laser.style.y - 60,
            anchorX: this.style.width / 2,
            anchorY: this.style.height / 2,
            centerOnOrigin: true,
            opacity: 1,
            visible: false,
            width: 150,
            height: 150,
        });

        this.nextLevel = new BitmapFontTextView({
            parent: this,
            x: this.style.width / 2,
            y: this.style.height / 2,
            width: 200,
            height: 60,
            scale: 4.5,
            centerOnOrigin: true,
            opacity: 0.0,
            visible: false,
            font: this.font,
            align: 'center',
            verticalAlign: 'center',
            text: "Level " + (this.level+1),
            color: 'red',
        });

        this.warning = new BitmapFontTextView({
            parent: this,
            x: this.style.width / 2,
            y: this.style.height / 2,
            width: 300,
            height: 80,
            scale: 5.0,
            centerOnOrigin: true,
            opacity: 1.0,
            visible: false,
            font: this.font,
            align: 'center',
            verticalAlign: 'center',
            text: 'WARNING!!! THREAT APPROACHING!!!',
            color: 'red',
        });

        this.rocketOutOfBoundsLabel = new BitmapFontTextView({
            parent: this,
            x: this.style.width / 2,
            y: this.style.height / 2,
            width: 300,
            height: 80,
            scale: 4.5,
            centerOnOrigin: true,
            opacity: 1.0,
            visible: false,
            font: this.font,
            align: 'center',
            verticalAlign: 'center',
            text: "DANGER!!! YOUR ROCKET IS TAKING DAMAGE FROM AN UNKNOWN FORCE!",
            color: "red",
        });

        this.activeParticleSystems = [];

        this.boss = new Boss(this, this.level);

        this.sparkEngine = new ParticleEngine({
            parent: this,
            initCount: 12 - this.repairProgress
        });
        this.activeParticleSystems.push(this.sparkEngine);

        this.sparkHitEngine = new ParticleEngine({
            parent: this,
            initCount: (12 - this.repairProgress) * 10,
        });
        this.activeParticleSystems.push(this.sparkHitEngine);

        this.laserTrailEngine = new ParticleEngine({
            parent: this.laser,
            initCount: 1,
        });
        this.activeParticleSystems.push(this.laserTrailEngine);

        this.asteroidExplosionEngine = new ParticleEngine({
            parent: this,
            initCount: 1,
        });
        this.activeParticleSystems.push(this.asteroidExplosionEngine);

        this.darkEnergyFadeEngine = new ParticleEngine({
            parent: this.boss.darkEnergy,
            initCount: 1,
        });
        this.activeParticleSystems.push(this.darkEnergyFadeEngine);

        this.rocketExplosionEngine = new ParticleEngine({
            parent: this,
            initCount: 1,
        });
        this.activeParticleSystems.push(this.rocketExplosionEngine);

        this.activePower = new PowerUp(this);
        this.activePower.updateOpts({
            superview: this,
            x: 0,
            y: 0,
            width: 500,
            height: 500,
            visible: false,
            centerOnOrigin: true,
        });
    }

    _audio() {
        // audio files
        this.audio = new AudioManager({
            path: 'resources/sounds/',
            files: {
                more: {path: 'more'},
                rocket: {path: 'rocket'},
                laser: {path: 'laser'},
                rocketExplosion: {path: 'rocketExplosion'},
                fireBallExplosion: {path: 'fireBallExplosion'},
                panic: {path: 'panic'},
                death: {path: 'death'},
                bossHit: {path: 'bossHit'},
                warning: {path: 'warning'},
                outOfBounds: {path: 'outOfBounds'},
                repairUpgrade: {path: 'repairUpgrade'},
                nextLevel: {path: 'nextLevel'},
                turret: {path: 'turret'},
                lifeUp: {path: 'lifeUp'},
                redLaser: {path: 'redLaser'},
                powerSpawn: {path: 'powerSpawn'},
                asteroidHit: {path: 'asteroidHit'},
                dark: {path: 'dark'},
                force: {path: 'force'},
                obtained: {path: 'obtained'},
            }
        });

        this.audio.addSound('more', {
            path: 'sfx',
            volume: 3.0,
            background: false,
        });
        this.audio.addSound('rocket', {
            path: 'sfx',
            volume: 1.5,
            background: false,
        });
        this.audio.addSound('laser', {
            path: 'sfx',
            background: false,
        });
        this.audio.addSound('rocketExplosion', {
            path: 'sfx',
            background: false,
        });
        this.audio.addSound('fireBallExplosion', {
            path: 'sfx',
            background: false,
        });
        this.audio.addSound('panic', {
            volume: 1.5,
            path: 'music',
        });
        this.audio.addSound('death', {
            volume: 1.5,
            path: 'music',
        });
        this.audio.addSound('bossHit', {
            volume: 1.5,
            path: 'sfx',
        });
        this.audio.addSound('warning', {
            volume: 2.0,
            path: 'sfx',
        });
        this.audio.addSound('outOfBounds', {
            volume: 1.5,
            path: 'sfx',
        });
        this.audio.addSound('repairUpgrade', {
            volume: 2.0,
            path: 'sfx',
        });
        this.audio.addSound('nextLevel', {
            volume: 2.0,
            path: 'sfx',
        });
        this.audio.addSound('turret', {
            volume: 1.0,
            path: 'sfx',
        });
        this.audio.addSound('lifeUp', {
            volume: 1.0,
            path: 'sfx',
        });
        this.audio.addSound('redLaser', {
            volume: 1.0,
            path: 'sfx',
        });
        this.audio.addSound('powerSpawn', {
            volume: 1.0,
            path: 'sfx',
        });
        this.audio.addSound('asteroidHit', {
            volume: 1.0,
            path: 'sfx',
        });
        this.audio.addSound('dark', {
            volume: 1.0,
            path: 'sfx',
        });
        this.audio.addSound('force', {
            volume: 1.0,
            path: 'sfx',
        });
        this.audio.addSound('obtained', {
            volume: 1.0,
            path: 'sfx',
        });
    }

    _resize () {
        this.style.width = device.screen.width;
        this.style.height = device.screen.height;
    }

    _fireLaser() {
        this.chargingLaser = true;
        var xDist = 100 * Math.sin(this.rocket.style.r);
        var yDist = 100 * Math.cos(this.rocket.style.r);
        var xTip = this.rocket.style.x + xDist;
        var yTip = this.rocket.style.y - yDist;

        this.laserShine.style.x = xTip;
        this.laserShine.style.y = yTip;
        this.laserShine.show();
        this.laserShine.style.opacity = 0.01;

        // animate muzzle flash and fire laser
        animate(this.laserShine)
        .now({
            opacity: 1.0
        }, 2000)
        .then(() => {
            this.laserShine.hide();
            xDist = 100 * Math.sin(this.rocket.style.r);
            yDist = 100 * Math.cos(this.rocket.style.r);
            this.laser.style.x = this.rocket.style.x + xDist;
            this.laser.style.y = this.rocket.style.y - yDist;
            this.laser.show();
            this.audio.play('laser');
            xTip = this.rocket.style.x + xDist;
            yTip = this.rocket.style.y - yDist;

            this.laserPath = new Vec2D({x: xTip - this.rocket.style.x, y: yTip - this.rocket.style.y});
            this.laserActive = true;
            this.chargingLaser = false;

            // remember time laser fired at so we can fire laser on specific interval
            this.firedAt = this.seconds;
        });
    }

    // rocket movement is to become steadilaserY more "in control" as the ship continues to repair
    _moveRocket() {
        var steadyControls = 1;
        if (this.repairProgress != 12) {
            steadyControls = Math.floor(Math.random() * (16 - this.repairProgress));
        }

        // rocket movement logic
        if (this.moving) {
            if (this.rocketAcceleration < 120) {
                this.rocketAcceleration++;
            }

            // how well we can control the ship based on current repair progress
            var steadyControls = 1;
            if (this.repairProgress != 12) steadyControls = Math.floor(Math.random() * (16 - this.repairProgress));

            // calculate tip of rocket from center for path vector of rocket
            var xDist = 100 * Math.sin(this.rocket.style.r);
            var yDist = 100 * Math.cos(this.rocket.style.r);
            var xTip = this.rocket.style.x + xDist;
            var yTip = this.rocket.style.y - yDist;
            var yBot = this.rocket.style.y + yDist;
            var rocketAngle = this.path.getAngle();
            var rd = new Vec2D({x: xTip - this.rocket.style.x, y: yTip - this.rocket.style.y});

            // rocket acceleration speed up factor
            var speedUp = 0;
            if (this.rocketAcceleration < 30) {
                speedUp = 10;
            }
            else if (this.rocketAcceleration < 60) {
                speedUp = 8;
            }
            else if (this.rocketAcceleration < 90) {
                speedUp = 6;
            }
            else if (this.rocketAcceleration < 120) {
                speedUp = 3;
            }

            // determine if rocket should rotate to direction of path; if not, move in direction of path vector
            var theta = Math.acos((rd.dot(this.path))/(rd.getMagnitude()*this.path.getMagnitude()));
            if (!(theta < 0.05)) {
                // determine whether it's faster for rocket to rotate clockwise or counterclockwise
                if (this.path.x * rd.y < this.path.y * rd.x) this.rocket.style.r += Math.cos(0.1) * 0.08;
                else this.rocket.style.r -= Math.cos(0.1) * 0.08;

                // if rocket tip not pointed in direction of desired path, slowlaserY build up speed until
                // rocket has fullaserY rotated so that tip is align with path vector
                this.rocketSpeed = (4 - (steadyControls / 4))-speedUp;
                if (theta < 3 && theta > 2.5) this.rocketSpeed += 1;
                else if (theta < 2.5 & theta > 2) this.rocketSpeed += 2;
                else if (theta < 2 && theta > 1.5) this.rocketSpeed += 3;
                else if (theta < 1.5 && theta > 1) this.rocketSpeed += 4;
                else if (theta < 1 && theta > 0.5) this.rocketSpeed += 6;
                else if (theta < 0.5 && theta > 0.3) this.rocketSpeed += 8;
                else if (theta < 0.3 && theta > 0.05) this.rocketSpeed += 11;
                this.rocketSpeed -= (steadyControls - 2);

            // rocket pointed fullaserY in correct direction
            } else {
                this.rocketSpeed = 16 - (steadyControls) - speedUp;
            }

            // add random variance (choppy bumps) to rocket based on repairs
            if (Math.floor(Math.random() * 2) === 0) {
                this.rocket.style.x += steadyControls;
                this.rocket.style.y += steadyControls;
            } else {
                this.rocket.style.x -= steadyControls;
                this.rocket.style.y -= steadyControls;
            }
            this.rocket.style.x += this.rocketSpeed * Math.cos(rocketAngle)
            this.rocket.style.y += this.rocketSpeed * Math.sin(rocketAngle)

            if (!this.rocketFlame.visible) {
                this.rocketFlame.show();
                this.rocketFlame.visible = true;
                animate(this.rocketFlame)
                .now({opacity: 4.5}, 300);
            }
        } else {
            if (this.rocketAcceleration > 0) this.rocketAcceleration--;
            // slow down rocket if player not tapping on screen to move rocket (assuming rocket moving)
            if (this.rocketSpeed > 0) {
                var rocketAngle = this.path.getAngle();
                this.rocketSpeed -= 0.25;
                this.rocket.style.x += this.rocketSpeed * Math.cos(rocketAngle); 
                this.rocket.style.y += this.rocketSpeed * Math.sin(rocketAngle);
                if (Math.floor(Math.random() * 2) === 0) {
                    this.rocket.style.x += steadyControls;
                    this.rocket.style.y += steadyControls;
                } else {
                    this.rocket.style.x -= steadyControls;
                    this.rocket.style.y -= steadyControls;
                }
            }
            this.rocket.style.x += steadyControls * Math.cos(this.time);
            this.rocket.style.y += steadyControls * Math.sin(this.time);

            if (this.rocketFlame.visible) {
                animate(this.rocketFlame)
                .now({opacity: 0.0001}, 300);
                this.rocketFlame.hide();
                this.rocketFlame.visible = false;
            }
        }

        if (this.rocket.style.x <= 0 || 
            this.rocket.style.y <= 0 ||
            this.rocket.style.x >= this.style.width ||
            this.rocket.style.y >= this.style.height) 
        {
            this.rocketOutOfBounds = true;
            if (!this.rocketOutOfBoundsLabel.visible) {
                this.rocketOutOfBoundsLabel.show();
                this.rocketOutOfBoundsLabel.visible = true;

                if (this.bossActive) {
                    this.audio.pause('death');
                } else {
                    this.audio.pause('panic');
                }
                this.audio.play('outOfBounds', {loop: true});
                
                var fadeAnimation = () => {
                    animate(this.rocketOutOfBoundsLabel)
                    .now({opacity: 1.0}, 500)
                    .then({opacity: 0.0}, 500)
                    .then(fadeAnimation.bind(this.rocketOutOfBoundsLabel));
                }
                var labelFade = fadeAnimation.bind(this.rocketOutOfBoundsLabel);
                labelFade();
            }
        } else if (this.rocketOutOfBounds) {
            this.rocketOutOfBounds = false;

            if (this.rocketOutOfBoundsLabel.visible) {
                this.rocketOutOfBoundsLabel.hide();
                this.rocketOutOfBoundsLabel.visible = false;

                this.audio.stop('outOfBounds');
                if (this.bossActive) {
                    this.audio.play('death');
                } else {
                    this.audio.play('panic');
                }
            }
        }
    }

    _checkLaserCollision() {
        // calculate tip of rocket from center for direction path
        var xDist = 100 * Math.sin(this.rocket.style.r);
        var yDist = 100 * Math.cos(this.rocket.style.r);
        var xTip = this.rocket.style.x + xDist;
        var yTip = this.rocket.style.y - yDist;

        // move laser along its path
        var laserAng = this.laserPath.getAngle();
        this.laser.style.x += this.laserSpeed * Math.cos(laserAng);
        this.laser.style.y += this.laserSpeed * Math.sin(laserAng);
        this.laserShine.style.x = xTip;
        this.laserShine.style.y = yTip;


        var explosionParticleArray = this.laserTrailEngine.obtainParticleArray(1);
        var ttl = 1000;
        var particle = explosionParticleArray[0];
        particle.centerOnOrigin = true;
        particle.ttl = ttl;
        particle.image = 'resources/images/particles/glow_13.png';
        particle.dx = -400 * Math.cos(laserAng);
        particle.dy = -400 * Math.sin(laserAng);
        particle.opacity = 0.5;
        particle.dopacity = -1;
        particle.width = this.laser.style.width;
        particle.height = this.laser.style.height; 
        this.laserTrailEngine.emitParticles(explosionParticleArray);
        
        var hit = false;
        var checkLaserHit = () => {
            if (this.bossActive) {
                return;
            }

            for (var i = 0; i < this.asteroids.length; i++) {
                var cur = this.asteroids[i];

                var fx = cur.hx;
                var fy = cur.hy; 

                var laserWidthHitbox = this.laser.style.width;
                var laserHeightHitbox = this.laser.style.height;

                var rect1 = {
                    x: cur.style.x, 
                    y: cur.style.y, 
                    width: fx, 
                    height: fy
                };
                
                var rect2= {
                    x: this.laser.style.x, 
                    y: this.laser.style.y, 
                    width: laserWidthHitbox,
                    height: laserHeightHitbox
                };

                if (rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x &&
                    rect1.y < rect2.y + rect2.height && rect1.height + rect1.y > rect2.y) 
                {
                    this.laser.hide();
                    this.asteroidPool.releaseView(cur);
                    this.asteroids.splice(i, 1);

                    this.audio.play('fireBallExplosion');
                    hit = true;

                    var data = this.asteroidExplosionEngine.obtainParticleArray(1);
                    var ttl = 500;
                    var particle = data[0];
                    particle.centerOnOrigin = true;
                    particle.ttl = ttl;
                    particle.x = this.laser.style.x;
                    particle.y = this.laser.style.y;
                    particle.image = 'resources/images/particles/hot_pop_03.png';
                    particle.opacity = 0.2;
                    particle.dopacity = 2;
                    particle.width = 200;
                    particle.height = 200;
                    particle.dscale = 20;
                    particle.anchorX = particle.width / 2;
                    particle.anchorY = particle.height / 2;

                    this.asteroidExplosionEngine.emitParticles(data);
                }
            }
        }

        var checkLaserCollision = checkLaserHit.bind(this);
        checkLaserHit(this);

        // check for collision with laser and boss
        var checkLaserBossHit = () => {
            var laserX = this.laser.style.x;
            var laserY = this.laser.style.y;

            var b = this.boss.b.style;
            if (this.ready && (this.seconds - this.prevSeconds) % 4 === 0) {
                this.ready = false;
            } else {
                this.ready = true;
            }
            if (this.alive && this.seconds > this.bossNextHit &&
                laserX < (b.x + b.width - 20) && (laserX + this.laser.style.width) > (b.x + 70) &&
                laserY < (b.y + b.height - 30) && (laserY + this.laser.style.height) > (b.y)) 
            {
                this.bossNextHit = this.seconds;
                this.audio.play("bossHit");
                this.boss.health--;
                this.boss.healthLabel.text = "Boss HP: " + this.boss.health;
                
                this.sparkle.style.x = this.laser.style.x - 38;
                this.sparkle.style.y = this.laser.style.y - 60;
                this.sparkle.style.scale = 1;
                this.sparkle.show();

                animate(this.sparkle)
                .now({scale:20}, 300)
                .then(() => {this.sparkle.hide()});

                this.laser.hide();

                // if boss hit and now has 0 health, begin transition to next level
                if (this.boss.health === 0) {
                    this.boss.darkEnergyReady = false;
                    animate(this.boss.b)
                    .now({opacity:0.001}, 750)
                    .then(() => {
                        this.boss.b.hide();
                        this.alive = false;
                    })
                    .then(() => {
                        animate(this.background)
                        .now({opacity:0.01}, 750)
                        .then(() => {
                            this.background.hide();
                            this.repairProgressLabel.hide();
                            this._gameOver(true);
                            this.nextLevel.show();
                            this.nextLevel.text = "Level " + (this.level + 1);
                            this.audio.play("nextLevel");
                            animate(this.nextLevel)
                            .now({opacity: 1.0}, 2000)
                            .then({opacity: 0.0}, 2000)
                            .then(() => {
                                this.nextLevel.hide();
                            })
                            .then(() => {
                                this.bossActive = false;
                                this._startGame(this.level + 1);
                            })
                        })
                    });
                    if (this.darkEnergyActive) {
                        this.boss.darkEnergy.hide();
                        this.darkEnergyActive = false;
                    }
                    this.boss.healthLabel.hide();
                    this.audio.stop('death');
                    this.timer = 0;
                }
            }
        }

        if (this.bossActive) {
            const checkBossHit = checkLaserBossHit.bind(this);
            checkBossHit(this);
        }
    }

    _emitShipSparks(dt) {
        // emit sparks from ship; the more the ship repairs, the less sparks that are emitted
        if (this.alive) {
            if (this.repairProgress === 0 || this.repairProgress != 12 && this.numTicks % this.repairProgress == 0) {
                var sparkParticleArray = this.sparkEngine.obtainParticleArray(12-this.repairProgress);
                var ttl = 2500;
                for (var i = 0; i < sparkParticleArray.length; i++) {
                    var particle = sparkParticleArray[i];
                    particle.centerOnOrigin = true;
                    particle.ttl = ttl;
                    particle.image = 'resources/images/particles/dim_pop_04.png';
                    particle.x = this.rocket.style.x - this.rocket.style.width/4;
                    particle.y = this.rocket.style.y - this.rocket.style.height/4; 
                    particle.dx = Math.floor(Math.random() * 50);
                    if (Math.floor(Math.random() * 2) === 0) particle.dx *= -1;
                    particle.dy = 20 + Math.floor(Math.random() * 250);
                    particle.ddy = 10 + Math.floor(Math.random() * 200);
                    particle.opacity = 1.0;
                    particle.dopacity = -0.5
                    particle.scale = 2;
                    particle.width = 30;
                    particle.height = 30;
                    this.sparkEngine.emitParticles(sparkParticleArray);
                }
            }
        }

        // emit more sparks from rocket if rocket collides with asteroid
        // (rocketHit counts number of sparks left to emit)
        if (this.rocketHit > 0) {
            this.rocketHit--;

            var d = this.sparkHitEngine.obtainParticleArray((12-this.repairProgress) * 10);
            var ttl = 300;
            for (var i = 0; i < d.length; i++) {
                var p = d[i];
                p.centerOnOrigin = true;
                p.ttl = ttl;
                p.image = 'resources/images/particles/dim_pop_04.png';
                p.x = this.rocket.style.x - this.rocket.style.width/4;
                p.y = this.rocket.style.y - this.rocket.style.height/4; 
                var dx = 500;
                var dy = 500;
                p.ddx = 100 + Math.floor(Math.random() * 20);
                if (Math.floor(Math.random() * 2) === 0) p.dx = (-1 * dx) * Math.cos(dt);
                else p.dx = dx;
                p.ddy = 200 + Math.floor(Math.random() * 200);
                if (Math.floor(Math.random() * 2) === 0) p.dy = -1 * dy * Math.sin(dt);
                else p.dy = dy;
                p.opacity = 1.0;
                p.dopacity = -0.5
                p.scale = 2;
                p.width = 30;
                p.height = 30;
                this.sparkHitEngine.emitParticles(d);
            }
        }
    }

    // repair ship every 5 seconds
    _repairShip() {
        if (!this.rocketOutOfBounds && this.seconds - this.prevRepairTime >= 5 && this.repairProgress <= 12) {
            this.repairProgress += 1;
            
            this.audio.play("repairUpgrade");
            this.repairEffect.show();
            this.repairEffect.style.visible = true;

            animate(this.repairEffect)
            .now({
                dscale: 140,
                opacity: 0.3,
            }, 600)
            .then(() => {
                this.repairEffect.hide();
                this.repairEffect.style.visible = false;
                this.repairEffect.style.scale = 1.0;
                this.repairEffect.style.opacity = 1.0;
            });

            this.repairPlus.show();
            this.repairPlus.style.y = this.rocket.style.y - 50;
            this.repairPlus.visible = true;

            animate(this.repairPlus)
            .now({dy: -200}, 750)
            .then(() => {
                this.repairPlus.hide();
                this.repairPlus.style.visible = false;
            });

            if (this.repairProgress >= 12) {
                this.repairProgressLabel.text = "Repair progress: 100%";
            }
            else {
                this.repairProgressLabel.text = "Repair progress: " + Math.floor((this.repairProgress / 12)*100) + "%";
            }

            this.prevRepairTime = this.seconds;
        }
    }

    // fire new laser if player has enough rocket repairs done and 
    // at least two seconds have passed since last laser
    _laserReadyCheck() {
        if (this.seconds - this.firedAt >= 2) this.laserActive = false;

        // if the player has lasers (and none are on the screen), fire a laser every two seconds
        if (!this.chargingLaser && !this.laserActive && this.repairProgress >= 8) {
            this._fireLaser();
        }
    }

    _updateLaserShinePosition() {
        var xDist = 100 * Math.sin(this.rocket.style.r);
        var yDist = 100 * Math.cos(this.rocket.style.r);
        var xTip = this.rocket.style.x + xDist;
        var yTip = this.rocket.style.y - yDist;

        this.laserShine.style.x = xTip;
        this.laserShine.style.y = yTip;
    }

    // dynamic moving background
    _scrollBackgroundDown() {
        this.background.style.y += 5;
        if (this.background.style.y - this.style.height > 0) {
            this.background.style.y = 0; 
        }
    }

    _playGameMusic() {
        if (this.alive && !this.gameMusic && !this.bossActive) {
            this.audio.play('panic', {loop: true});
            this.gameMusic = true;
        } else if (this.alive && !this.gameMusic && this.bossActive) {
            this.audio.play('death', {loop: true});
            this.gameMusic = true;
            for (var i = 0; i < this.asteroids.length; i++) {
                var cur = this.asteroids[i];
                cur.active = false;
                animate(cur).now({opacity:0.01}, 1500).then(() => {
                    cur.hide();
                    cur.visible = false;
                    this.asteroids.splice(i, 1);
                    this.asteroidPool.releaseView(cur);
                });
            }
        }
    }

    _updateBoss() {
        this.boss.darkEnergy.style.y += 7;
        this.boss.darkEnergy.style.x += Math.cos(this.time * 0.0074) * 30;

        var darkEnergyList = this.darkEnergyFadeEngine.obtainParticleArray(1);
        var ttl = 500;
        var particle = darkEnergyList[0];
        particle.centerOnOrigin = true;
        particle.ttl = ttl;
        particle.image = 'resources/images/tsums/large/Bosses/darkEnergy.png';
        particle.dx = 10 * Math.cos(this.time * 0.0074) * 30;
        particle.opacity = 0.3;
        particle.dopacity = -0.5;
        particle.width = this.boss.darkEnergy.style.width;
        particle.height = this.boss.darkEnergy.style.height; 
        this.darkEnergyFadeEngine.emitParticles(darkEnergyList);
        
        var r = this.rocket.style;
        var rbh = this.rocketHitBox.style;
        var de = this.boss.darkEnergy.style;

        var rhb = this.rocketHitBox.style;
        var checkCollision = () => {
            var a = Math.pow(Math.abs(this.rocket.style.x - this.boss.darkEnergy.style.x), 2);
            var b = Math.pow(Math.abs(this.boss.darkEnergy.style.y - this.rocket.style.y), 2);
            var c = Math.pow(50 + 50, 2);

            if (a + b <= c) {
               if (this.repairProgress > 4) {
                   this.rocketHit = (12 - this.repairProgress) * 10;
               }

                if (this.repairProgress > 0 && this.seconds - this.invincibility >= 1) {
                    // number of sparks to emit when rocket hit (scales up when less repairs done)
                    if (this.repairProgress > 4) this.rocketHit = (12 - this.repairProgress) * 10;
                        
                    this.audio.play('asteroidHit');

                    this.asteroidImpact.show();
                    this.asteroidImpact.style.visible = true;

                    animate(this.asteroidImpact)
                    .now({
                        dscale: 140,
                    }, 500)
                    .then(() => {
                        this.asteroidImpact.hide();
                        this.asteroidImpact.style.visible = false;
                        this.asteroidImpact.style.opacity = 1.0;
                        this.asteroidImpact.style.scale = 1.0;
                    });

                    this.repairProgress -= 4;
                    if (this.repairProgress < 0) {
                        this.repairProgress = 0;
                    }

                    this.repairProgressLabel.text = "Repair progress: " + Math.floor((this.repairProgress / 12)*100) + "%";
                    this.invincibility = this.seconds;
                    animate(this.rocket).now({opacity: 0.2}, 500).then({opacity: 0.8}, 500).then({opacity: 1.0});
                    if (this.repairProgress <= 0) {
                        this._gameOver(false);
                    }
                }
            }
        }

        var checkCollisionAction = checkCollision.bind(this.boss.darkEnergy);
        checkCollisionAction();

        // once 5 seconds have passed after dark energy has fired, it will
        // now be inactive and the boss can fire a new one
        if (this.seconds - this.nextDarkEnergy >= 3) {
            this.darkEnergyActive = false;
            this.boss.darkEnergy.hide();
        }
    }

    _canBossSpawn() {
        // spawn boss after level has played for 60 seconds
        if (!this.bossActive && this.seconds === 60) {
            if (this.hasPowerUp) {
                this.activePower._stopRunning();
            }

            this.bossActive = true;
            this.gameMusic = false;
            this.audio.stop('panic');
            this.boss._spawn();
        } else if (!this.bossActive && this.seconds === 50 && !this.warningActive) {
            // send warning 10 seconds before boss spawn
            this.audio.pause('panic');
            this.audio.play('warning');
            this.warningActive = true;
            this.warning.show();
            this.warning.style.opacity = 1.0;
            animate(this.warning)
            .now({opacity: 0}, 750)
            .then({opacity: 1}, 750)
            .then({opacity: 0}, 750)
            .then({opacity: 1}, 750)
            .then({opacity: 0}, 750)
            .then(() => {
                this.warning.hide();
                this.warningActive = false;
                this.audio.play('panic');
             });
        }
    }

    _tick (dt) {
        this.timer += dt;
        this.numTicks++;

        this._emitShipSparks(dt);

        var r = this.rocket.style;
        this.time += dt;

        this._laserReadyCheck();

        // check for laser collision if it is active on screen
        // otherwise; update laser muzzle flash position
        if (!this.chargingLaser && this.laserActive) {
            this._checkLaserCollision();
        } else if (this.chargingLaser && !this.laserActive) {
            this._updateLaserShinePosition();
        }

        this._scrollBackgroundDown();

        // run active particle systems
        // *** my particles are not disappearing after my set ttl, thus 
        // game performance drops after too many particles are created
        // as their memory is still in use (I don't know what I'm doing
        // wrong) ***
        for (var i = 0; i < this.activeParticleSystems.length; i++) {
            this.activeParticleSystems[i].runTick(dt);
        }

        this._playGameMusic();

        // have boss fire dark energy
        if (this.bossActive && this.boss.darkEnergyReady && !this.darkEnergyActive && 
            this.seconds - this.nextDarkEnergy >= 1 && 
            Math.floor(Math.random() * Math.floor(2000))) 
        {
            this.boss._fireDarkEnergy();
        }

        // update boss dark energy position
        if (this.bossActive && this.darkEnergyActive) {
            this._updateBoss();
        }

        // add new asteroids if boss is not active
        if (!this.bossActive) {
            if (this.alive && this.numTicks % (150 / (this.level+1)) === 0 && this.asteroids.length < 15) {
                var asteroid = this.asteroidPool.obtainView();
                asteroid.setProperties(this, this.rocket.style.x, this.rocket.style.y, this.level);
                this.asteroids.push(asteroid);
            }
            this._moveAsteroids();   
        } else {
            if (this.bossActive && this.boss.darkEnergyReady) {
                this.boss._moveBoss(this);
            }
        }

        // update timer every second if player is alive
        // add boss if not active after 60 seconds of level
        if (this.alive) {
            this._moveRocket();
            this._repairShip();
            this._updateSeconds();
            this._canBossSpawn();
            
            if (this.powerUpOnScreen) {
                this._checkPowerUpCollision();
            }

            if (this.hasPowerUp) {
                this.activePower._action(this, this.asteroids);
            }
        }


        // check for collision between fireball and rocket
        if (!this.bossActive) {
            this._checkRocketAsteroidCollision();
        }
    }

    _checkPowerUpCollision() {
        var a = Math.pow(Math.abs(this.rocket.style.x - this.powerUp.style.x), 2);
        var b = Math.pow(Math.abs(this.powerUp.style.y - this.rocket.style.y), 2);
        var c = Math.pow(30 + 60, 2);

        if (a + b <= c) {
            this.powerUpOnScreen = false;
            this.powerUp.hide();
            this.powerUp.visible = false;

            this.obtainedPowerUpEffect.show();
            this.obtainedPowerUpEffect.style.visible = true;

            animate(this.obtainedPowerUpEffect)
            .now({
                dscale: 140,
                opacity: 0.3,
            }, 600)
            .then(() => {this.audio.play('obtained')})
            .then(() => {
                this.obtainedPowerUpEffect.hide();
                this.obtainedPowerUpEffect.style.visible = false;
                this.obtainedPowerUpEffect.style.opacity = 1.0;
                this.obtainedPowerUpEffect.style.scale = 1.0;

                this.hasPowerUp = true;
                this.powerUpTime = this.seconds;
                
                this.activePower._generatePowerUp(this.rocket);
            });
        }
    }

    _updateSeconds() {
        if (Math.floor(this.timer / 1000) > this.seconds) {
            if (this.rocketOutOfBounds) {
                this.repairProgress -= 1;
                this.repairProgressLabel.text = "Repair progress: " + Math.floor((this.repairProgress / 12)*100) + "%";
                if (this.repairProgress === 0) {
                    this._gameOver(false);
                }
            }

            if (!this.bossActive && !this.hasPowerUp && 
                !this.powerUpOnScreen && Math.floor(Math.random() * Math.floor(5)) === 0) {

                this.powerUpOnScreen = true;

                this.powerUp.style.x = Math.random() * (1000 - 100) + 100;
                this.powerUp.style.y = Math.random() * (500 - 200) + 200;

                this.powerUpSpawnEffect.style.x = this.powerUp.style.x;
                this.powerUpSpawnEffect.style.y = this.powerUp.style.y;

                this.powerUpSpawnEffect.style.opacity = 0.8
                this.powerUpSpawnEffect.style.width = 400;
                this.powerUpSpawnEffect.style.height = 400;
                this.powerUpSpawnEffect.style.scale = 1;

                this.powerUpSpawnEffect.show();
                this.powerUpSpawnEffect.style.visible = true;

                this.audio.play('powerSpawn');

                animate(this.powerUpSpawnEffect)
                .now({
                    scale: -2,
                    opacity: 0.3,
                }, 300)
                .then(() => {
                    this.powerUpSpawnEffect.hide();
                    this.powerUpSpawnEffect.style.visible = false;

                    this.powerUp.show();
                    this.powerUp.style.visible = true;
                    this.powerUp.style.opacity = 0.01;

                    animate(this.powerUp)
                    .now({opacity: 1.0}, 1000)
                    .then({
                        dy: this.style.height - 100,
                        ddy: 2,
                    }, 3000)
                    .then(() => {
                        this.powerUp.hide();
                        this.powerUp.style.visible = false;
                        this.powerUpOnScreen = false;
                    });
                });
            }

            this.prevSeconds = this.seconds;
            this.seconds = Math.floor(this.timer / 1000);
            
            if (this.hasPowerUp && this.seconds - this.powerUpTime > 8) {
                this.activePower._stopRunning();
            }
        }
    }
   
    // called at the beginning of every level
    _startGame(l) {
        // determines number of rocket sparks to emit when rocket is hit
        this.rocketHit = 0;

        this.hasPowerUp = false;
        this.powerUpOnScreen = false;
        this.powerUpTime = 0;

        this.rocketOutOfBounds = false;

        // rocket acceleration factor
        this.rocketAcceleration = 0;

        // counts number of ticks in game loop
        this.numTicks = 0;

        // flag to set when boss warning label appears
        this.warningActive = false;

        // previous time rocket has been repaired at
        this.prevRepairTime = -1;

        this.level = l;
        this.boss.health = l + 1;

        // player starts off with certain rocket repair progression
        // rocket repairs decrease as levels get harder
        if (this.level >= 4) {
            this.repairProgress = 2;
        }
        else {
            this.repairProgress = 6 - this.level;
        }
        
        // invincibility frames for when rocket is hit
        this.invincibility = 0;

        // the last time a laser was fired (used to check when next when can be fired)
        this.firedAt = 0;

        this.bossActive = false;

        // indicates whether or not laser is charging (and not active on screen)
        this.chargingLaser = false;

        // timer for rocket rotation animation
        this.time = 0;

        // when boss can get hit again
        this.bossNextHit = 0;

        // for tracking taps on screen
        this.x = 0;
        this.y = 0;

        // when difference between this and game timer is  2, new laser is fired
        this.nextLaser = 0;

        // when difference between this and game timer is 5, new dark energy is fired
        this.nextDarkEnergy = 0;
        
        this.darkEnergyActive = false;

        // field to track rocket status
        this.alive = true;

        // field to track if ball is eligible to be added
        this.added = false;
        
        // field to track if rocket is moving
        this.moving = false;

        // path vector that rocket is traveling on
        this.path = null;

        // path vector for laser
        this.laserPath = null;
        
        // the current speed of the rocket
        this.rocketSpeed = 0;

        // laser speed
        this.laserSpeed = 30;

        // main music playing
        this.gameMusic = false;

        // checks if laser is active on screen (don't want more than one on screen at a time)
        this.laserActive = false;
        
        // counts number of seconds since level has started
        this.seconds = 0;
        this.prevSeconds = -1;

        // game timer used to help calculate number of game seconds in game loop
        this.timer = 0;

        this.repairProgressLabel.text = "Repair progress: " + Math.floor((this.repairProgress/12)*100) + "%";

        this.background.show();
        this.background.style.opacity = 1.0;
        this.rocket.show();
        this.repairProgressLabel.show();
        this.rocket.style.x = this.style.width / 2;
        this.rocket.style.y = this.style.height / 2;

        // add asteroids to asteroid list
        var asteroid = this.asteroidPool.obtainView({superview: this});
        asteroid.setProperties(this, this.rocket.style.x, this.rocket.style.y, this.level);
        this.asteroids = [];
        this.asteroids.push(asteroid);

        // set touch actions
        this._setActions();
    }

    // game screen touch actions
    _setActions() {
        this.onInputStart = (startEvent, startPoint) => {
            this.moving = true;
            if (this.alive) {
                this.audio.play('rocket', {loop: true});
            }
            this.x = startPoint.x;
            this.y = startPoint.y;
            this.path = new Vec2D({x: this.x - this.rocket.style.x, y: this.y - this.rocket.style.y});
            this.startDrag({
                inputStartEvt: startEvent,
                radius: 1,
            });
        };

        this.onInputSelect = (stopEvent, stopPoint) => {
            this.moving = false;
            this.audio.pause('rocket');
        };

        this.onDragStart = (dragEvent) => {
            this.moving = true;
            this.x = dragEvent.currPt.x;
            this.y = dragEvent.currPt.y;
            this.path = new Vec2D({x: this.x - this.rocket.style.x, y: this.y - this.rocket.style.y});
        };

        this.onDrag = (dragEvent, moveEvent, delta) => {
            this.moving = true;
            this.x = dragEvent.currPt.x;
            this.y = dragEvent.currPt.y;
            this.path = new Vec2D({x: this.x - this.rocket.style.x, y: this.y - this.rocket.style.y});
        };

        this.onDragStop = (dragEvent, stopEvent) => {
            this.moving = false;
            this.audio.pause('rocket');
        };
    }

    // check for collision between rocket and asteroid
    _checkRocketAsteroidCollision() {
        var checkCollision = (fireBall) => {
            var phw = this.rocket.style.width / 1.6;
            var phh = this.rocket.style.height / 1.6;
            
            var fx = fireBall.hx
            var fy = fireBall.hy

            var rect1 = {x: fireBall.style.x, y: fireBall.style.y, width: fx, height: fy};
            var rect2 = {x: this.rocket.style.x, y: this.rocket.style.y, width: phw, height: phh};

            // if rectangular hitboxes collide when rocket is not invincible (rocket is invincible
            // for two seconds after being hit), take damage
            if (rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.height && rect1.height + rect1.y > rect2.y &&
                this.seconds - this.invincibility >= 2)
            {
                if (this.repairProgress - 2 > 0 && !this.asteroidImpact.style.visible) {
                    this.audio.play('asteroidHit');
                    
                    this.asteroidImpact.show();
                    this.asteroidImpact.style.visible = true;

                    animate(this.asteroidImpact)
                    .now({
                        dscale: 140,
                    }, 500)
                    .then(() => {
                        this.asteroidImpact.hide();
                        this.asteroidImpact.style.visible = false;
                        this.asteroidImpact.style.opacity = 1.0;
                        this.asteroidImpact.style.scale = 1.0;
                    });

                    this.repairMinus.show();
                    this.repairMinus.style.y = this.rocket.style.y - 50;
                    this.repairMinus.style.visible = true;

                    animate(this.repairMinus)
                    .now({dy: -200}, 750)
                    .then(() => {
                        this.repairMinus.hide();
                        this.repairMinus.style.visible = false;
                    });
                }

                // number of sparks to emit when rocket hit (scales up when less repairs done)
                if (this.repairProgress > 2) this.rocketHit = (12 - this.repairProgress) * 10;

                // take away repairProgress and update repair progress label
                // set brief rocket invincibility 
                if (this.repairProgress > 0 && this.seconds - this.invincibility >= 1) {
                    this.repairProgress -= 2;
                    if (this.repairProgress < 0) this.repairProgress = 0; 
                    this.repairProgressLabel.text = "Repair progress: " + Math.floor((this.repairProgress / 12)*100) + "%";
                    this.invincibility = this.seconds;
                    animate(this.rocket).now({opacity: 0.2}, 500).then({opacity: 0.8}, 500).then({opacity: 1.0});
                    if (this.repairProgress <= 0) {
                        this._gameOver(false);
                    }
                }
                else {
                    this.invincibility = this.seconds;
                    this._gameOver(false);
                }
            }
        }
        
        // check for collision with all active asteroids
        for (var i = 0; i < this.asteroids.length; i++) {
            var curAsteroid = this.asteroids[i];
            var checkAction = checkCollision.bind(curAsteroid);
            checkAction(curAsteroid);
        }
    }

    // game over handling (called when rocket has 0% repair progression, aka rocket is destroyed)
    _gameOver(reset) {
        this.rocket.hide();

        this.repairProgressLabel.text = "Repair progress: " + "0%";

        if (this.hasPowerUp) {
            this.activePower._stopRunning();
        }

        this.boss.darkEnergy.hide();

        if (this.rocketOutOfBoundsLabel.visible) {
            this.rocketOutOfBounds = false;
            this.rocketOutOfBoundsLabel.hide();
            this.rocketOutOfBoundsLabel.visible = false;
        }
        // if game over is called as a result of the player losing (0% rocket repair),
        // otherwise, user pressed "title screen" label to go back
        if (!reset ) {
            if (this.alive) {
                var data = this.rocketExplosionEngine.obtainParticleArray(1);
                var ttl = 500;
                var particle = data[0];
                particle.centerOnOrigin = true;
                particle.ttl = ttl;
                particle.x = this.rocket.style.x;
                particle.y = this.rocket.style.y;
                particle.image = 'resources/images/particles/hot_pop_03.png';
                particle.opacity = 0.2;
                particle.dopacity = 1.5;
                particle.width = 200
                particle.height = 200;
                particle.dscale = 20;
                particle.anchorX = particle.width / 2;
                particle.anchorY = particle.height / 2;
                this.rocketExplosionEngine.emitParticles(data);

                this.titleLabel.show();

                this.gameOverLabel.show();

                // checks for user tap on title screen button
                this.titleLabel.onInputSelect = (stopEvent, stopPoint) => {
                    this.rocket.hide();
                    for (var i = 0; i < this.asteroids.length; i++) { 
                        this.asteroids[i].style.visible = false;
                        this.asteroids[i].hide();
                        this.asteroidPool.releaseView(this.asteroids[i]);
                        this.asteroids.splice(this.asteroids[i]);
                    }
                    this.background.hide();
                    this.laserActive = false;
                    this.emit('gameScreen:restart');
                    this.gameOverLabel.hide();
                    this.titleLabel.hide();
                    if (this.bossActive) {
                        this.boss.b.hide();
                        this.boss.darkEnergy.hide();
                        this.boss.b.style.opacity = 0;
                    }
                    if (this.laserActive) {
                        this.laser.hide();
                    }

                    for (var i = 0, children = this.getSubviews(), len = children.length; i < len; i++) {
                        children[i].hide();
                        children[i].visible = false;
                    }
                };
            }
        }

        // stop rocket moving sound if player loses while moving
        if (this.moving) {
            this.audio.stop('rocket');
        }
        
        // explosion sound if player loses 
        if (this.alive && !reset) {
            this.audio.play('rocketExplosion');
        }

        if (this.bossActive) {
            this.audio.stop('death');
        } else {
            this.audio.stop('panic');
        }

        this.audio.stop('outOfBounds');

        this.gameMusic = false;
        this.alive = false;
    }

    _moveAsteroids() {
        for (var i = this.asteroids.length - 1; i >= 0; i--) {
            var cur = this.asteroids[i];
            cur.move();
            var w = cur.style.width;
            var h = cur.style.height;

            if ((cur.style.x > this.style.width + w || cur.style.x < 0 + w ||
                cur.style.y > this.style.height + h || cur.style.y < 0 + h) &&
                cur.movedAcrossScreen)
            {
                this.asteroids.splice(i, 1);
                this.asteroidPool.releaseView(cur);
            }
        }
    }            
}


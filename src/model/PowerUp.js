import View from 'ui/View';
import ImageView from 'ui/ImageView';
import ViewPool from 'ui/ViewPool';

import AudioManager from 'AudioManager';

import Vec2D from 'frontend/jsio/math/geom/Vec2D';
import Point from 'frontend/jsio/math/geom/Point';

import animate from 'frontend/devkit-core/timestep/src/animate.js'; 
import ParticleEngine from 'ui/ParticleEngine.js';

const POWERUPS = [
    "force field",
    "double repair",
    "rapid blast",
    "shockwave",
    "turret",
]

export default class PowerUp extends ImageView {
    constructor(game) {
        super();
        this.game = game;

        this.blastsReady = false;
        this.blastsCharging = false;
        this.activeBlasts = [];
        this.activeBlastAngles = [];

        this.turretBlastsReady = false;
        this.turretCharging = false;
        this.activeTurretBlasts = [];

        this.activeParticleEngines = [];

        this._buildPools();
        this._buildParticleEngines();
    }

    _buildPools() {
        this.blastPool = new ViewPool({
            ctor: ImageView,
            initCount: 12,
            initOpts: {
                parent: this.game,
                image: 'resources/images/particles/glow_24.png',
                x: 0,
                y: 0,
                opacity: 4,
                width: 100,
                height: 100,
                visible: false,
                centerOnOrigin: true,
            },
        });

        this.turretBlastPool = new ViewPool({
            ctor: ImageView,
            initCount: 12,
            initOpts: {
                parent: this.game,
                image: 'resources/images/particles/glow_17.png',
                x: 0,
                y: 0,
                opacity: 4.0,
                width: 100,
                height: 100,
                visible: true,
                centerOnOrigin: true,
            },
        });
    }

    _buildParticleEngines() {
        this.blastTrailEngine = new ParticleEngine({
            initCount: 12,
        });
        this.activeParticleEngines.push(this.blastTrailEngine);
    }

    _generatePowerUp(rocket) {
        this.rocket = rocket;
        var random = Math.floor(Math.random() * POWERUPS.length);

        if (this.game.repairProgress >= 12) {
            while (random == 1) {
                random = Math.floor(Math.random() * POWERUPS.length);
            }
        }

        this.powerUpType = POWERUPS[random];

        if (this.powerUpType === POWERUPS[0]) {
            this.updateOpts({
                superview: this.game,
                x: this.game.rocket.style.x,
                y: this.game.rocket.style.y,
                width: 500,
                height: 500,
                visible: true,
                scale: 0,
                opacity: 1.5,
                centerOnOrigin: true,
            });
            this.setImage("resources/images/particles/glow_10.png");

            this.show();
            this.style.visible = true;

            animate(this).now({scale: 1.0}, 700)
            .then(() => {
                this.game.audio.play('force');
            });
        } else if (this.powerUpType === POWERUPS[1]) {
            this.game.repairProgress += 2;
            this.game.prevRepairTime = this.game.seconds;

            this.game.audio.play("lifeUp");

            if (this.game.repairProgress >= 12) {
                this.game.repairProgressLabel.text = "Repair progress: 100%";
            } else {
                this.game.repairProgressLabel.text = "Repair progress: " + Math.floor((this.game.repairProgress / 12) * 100) + "%";
            }

            this.game.repairPlus.updateOpts({
                text: "+2",
                y: this.game.rocket.style.y - 50,
                visible: true,
            });
            this.game.repairPlus.show();
            
            animate(this.game.repairPlus)
            .now({dy: -200}, 750)
            .then(() => {
                this.game.repairPlus.hide();
                this.game.repairPlus.visible = false;
                this.game.repairPlus.text = "+1";
            });
            
            this.game.hasPowerUp = false;
        } else if (this.powerUpType === POWERUPS[2]) {
            var xDist = 100 * Math.sin(this.game.rocket.style.r);
            var yDist = 100 * Math.cos(this.game.rocket.style.r);
            var xTip = this.game.rocket.style.x + xDist;
            var yTip = this.game.rocket.style.y - yDist;

            this.updateOpts({
                superview: this.game,
                x: xTip,
                y: yTip,
                opacity: 0.01,
                width: 200,
                height: 200,
                visible: true,
                centerOnOrigin: true,
            });
            this.show();
            
            this.blastsReady = true;
            this.setImage("resources/images/particles/dim_sparkle_24.png");
        } else if (this.powerUpType === POWERUPS[3]) {
            this.updateOpts({
                superview: this.game,
                x: this.game.rocket.style.x,
                y: this.game.rocket.style.y,
                width: 50,
                height: 50,
                visible: true,
                scale: 1,
                dscale: 20,
                ddscale: 5,
                opacity: 0.3,
                centerOnOrigin: true,
                anchorX: this.game.rocket.style.x,
                anchorY: this.game.rocket.style.y, 
            });
            this.setImage("resources/images/particles/hot_pop_17.png");

            this.show();
            this.style.visible = true;

            animate(this)
            .now({
                dopacity: 1.0,
                dscale: 350,
            }, 500)
            .then({dopacity: -1.0}, 500)
            .then(() => {
                this.style.scale = 1.0;
                this.style.dscale = 0;
                this.style.ddscale = 0;
                this.style.dopacity = 0;

                this._stopRunning();
            }, 2000);
        } else if (this.powerUpType === POWERUPS[4]) {
            this.updateOpts({
                superview: this.game,
                x: this.game.style.width / 2,
                y: this.game.style.height / 2,
                width: 150,
                height: 150,
                r: Math.random() * 1.5,
                opacity: 0,
                visible: false,
                centerOnOrigin: true,
                anchorX: this.style.width / 2,
                anchorY: this.style.height / 2,
            });
            this.setImage("resources/images/tsums/large/turret.png");

            this.show();
            this.style.visible = true;

            this.turretBlastsReady = true;

            animate(this).now({opacity: 1.0}, 1000);
        }
    }

    _tick(dt) {
        if (this.powerUpType === POWERUPS[0]) {
            this.updateOpts({
                x: this.game.rocket.style.x,
                y: this.game.rocket.style.y,
            });
        } else if (this.powerUpType === POWERUPS[2]) {
            var xDist = 100 * Math.sin(this.game.rocket.style.r);
            var yDist = 100 * Math.cos(this.game.rocket.style.r);
            var xTip = this.game.rocket.style.x + xDist;
            var yTip = this.game.rocket.style.y - yDist;

            this.updateOpts({
                x: xTip,
                y: yTip,
            });
        } else if (this.powerUpType === POWERUPS[4]) {
            this.style.r = Math.cos(this.game.time * 0.005) * 4;
        }

        for (var i = 0; i < this.activeParticleEngines.length; i++) {
            this.activeParticleEngines[i].runTick(dt);
        }

        for (var i = 0; i < this.activeTurretBlasts.length; i++) {
            var blast = this.activeTurretBlasts[i];

            this._checkTurretBlastHit(blast, i);
        }

        for (var i = 0; i < this.activeBlasts.length; i++) {
            var blast = this.activeBlasts[i];
            var blastAngle = this.activeBlastAngles[i];

            var blastParticleArray = this.blastTrailEngine.obtainParticleArray(1);
            var ttl = 1800;
            var particle = blastParticleArray[0];
            particle.superview = blast;
            particle.centerOnOrigin = true;
            particle.ttl = ttl;
            particle.image = 'resources/images/particles/glow_24.png';
            particle.dx = -400 * Math.cos(blastAngle);
            particle.dy = -400 * Math.sin(blastAngle);
            particle.opacity = 0.5;
            particle.dopacity = -1;
            particle.width = blast.style.width;
            particle.height = blast.style.height;
            this.blastTrailEngine.emitParticles(blastParticleArray);

            this._checkBlastHit(blast, i);
        }
    }

    _checkTurretBlastHit(blast, blastIndex) {
        for (var i = 0; i < this.game.asteroids.length; i++) {
            var cur = this.game.asteroids[i];

            if (!cur.onScreen) {
                return;
            }

            var fx = cur.hx;
            var fy = cur.hy; 

            var blastWidthHitbox = blast.style.width;
            var blastHeightHitbox = blast.style.height;

            var rect1 = {
                x: cur.style.x, 
                y: cur.style.y, 
                width: fx, 
                height: fy
            };
            
            var rect2= {
                x: blast.style.x, 
                y: blast.style.y, 
                width: blastWidthHitbox,
                height: blastHeightHitbox
            };

            if (rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.height && rect1.height + rect1.y > rect2.y) 
            {
                var blastX = blast.style.x;
                var blastY = blast.style.y;

                blast.hide();

                this.turretBlastPool.releaseView(blast);
                this.activeTurretBlasts.splice(blastIndex, 1);

                this.game.asteroidPool.releaseView(cur);
                this.game.asteroids.splice(i, 1);

                this.game.audio.play('fireBallExplosion');

                var data = this.game.asteroidExplosionEngine.obtainParticleArray(1);
                var ttl = 500;
                var particle = data[0];
                particle.centerOnOrigin = true;
                particle.ttl = ttl;
                particle.x = blastX;
                particle.y = blastY;
                particle.image = 'resources/images/particles/hot_pop_03.png';
                particle.opacity = 0.2;
                particle.dopacity = 2;
                particle.width = 200;
                particle.height = 200;
                particle.dscale = 20;
                particle.anchorX = particle.width / 2;
                particle.anchorY = particle.height / 2;

                this.game.asteroidExplosionEngine.emitParticles(data);
            }
        }
    }

    _checkBlastHit(blast, blastIndex) {
        for (var i = 0; i < this.game.asteroids.length; i++) {
            var cur = this.game.asteroids[i];

            if (!cur.onScreen) {
                return;
            }

            var fx = cur.hx;
            var fy = cur.hy; 

            var blastWidthHitbox = blast.style.width;
            var blastHeightHitbox = blast.style.height;

            var rect1 = {
                x: cur.style.x, 
                y: cur.style.y, 
                width: fx, 
                height: fy
            };
            
            var rect2= {
                x: blast.style.x, 
                y: blast.style.y, 
                width: blastWidthHitbox,
                height: blastHeightHitbox
            };

            if (rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.height && rect1.height + rect1.y > rect2.y) 
            {
                var blastX = blast.style.x;
                var blastY = blast.style.y;

                blast.hide();

                this.blastPool.releaseView(blast);
                this.activeBlasts.splice(blastIndex, 1);
                this.activeBlastAngles.splice(blastIndex, 1);

                this.game.asteroidPool.releaseView(cur);
                this.game.asteroids.splice(i, 1);

                this.game.audio.play('fireBallExplosion');

                var data = this.game.asteroidExplosionEngine.obtainParticleArray(1);
                var ttl = 500;
                var particle = data[0];
                particle.centerOnOrigin = true;
                particle.ttl = ttl;
                particle.x = blastX;
                particle.y = blastY;
                particle.image = 'resources/images/particles/hot_pop_03.png';
                particle.opacity = 0.2;
                particle.dopacity = 2;
                particle.width = 200;
                particle.height = 200;
                particle.dscale = 20;
                particle.anchorX = particle.width / 2;
                particle.anchorY = particle.height / 2;

                this.game.asteroidExplosionEngine.emitParticles(data);
            }
        }
    }

    _stopRunning() {
        for (var i = 0; i < this.activeBlasts.length; i++) {
            this.blastPool.releaseView(this.activeBlasts[i]);
            this.activeBlasts.splice(i, 1);
        }

        for (var i = 0; i < this.activeTurretBlasts.length; i++) {
            this.turretBlastPool.releaseView(this.activeTurretBlasts[i]);
            this.activeTurretBlasts.splice(i, 1);
        }

        if (this.powerUpType === POWERUPS[0]) {
            if (this.style.scale < 0.5) {
                return;
            }

            animate(this)
            .now({scale: 0}, 1300)
            .then(() => {
                this.powerUpType = "";
                this.hide();
                this.scale = 1.0;

                this.game.hasPowerUp = false;
            });
        } else if (this.powerUpType === POWERUPS[4]) {
            if (this.opacity < 1.0) {
                return;
            }

            animate(this)
            .now({opacity: 0}, 500)
            .then(() => {
                this.powerUpType = "";
                this.hide();

                this.game.hasPowerUp = false;
                this.turretCharging = false;
            });
        }

        else {
            this.blastsReady = false;

            this.activeBlasts = [];
            this.activeBlastAngles = [];

            this.activeTurretBlasts = [];

            this.powerUpType = "";
            this.hide();

            this.game.hasPowerUp = false;
        }
    }

    _forceField(game, asteroids) {
        for (var i = 0; i < asteroids.length; i++) {
            var cur = asteroids[i]; 

            var a = Math.pow(Math.abs(this.style.x - cur.style.x), 2);
            var b = Math.pow(Math.abs(cur.style.y - this.style.y), 2);
            var c = Math.pow(75 + 180, 2);

            if (a + b <= c) {
                var asteroidX = cur.style.x;
                var asteroidY = cur.style.y;

                game.asteroidPool.releaseView(cur);
                game.asteroids.splice(i, 1);

                game.audio.play('fireBallExplosion');

                var data = game.asteroidExplosionEngine.obtainParticleArray(1);
                var ttl = 500;
                var particle = data[0];
                particle.centerOnOrigin = true;
                particle.ttl = ttl;
                particle.x = asteroidX;
                particle.y = asteroidY;
                particle.image = 'resources/images/particles/hot_pop_03.png';
                particle.opacity = 0.2;
                particle.dopacity = 2;
                particle.width = 200;
                particle.height = 200;
                particle.dscale = 20;
                particle.anchorX = particle.width / 2;
                particle.anchorY = particle.height / 2;
                
                game.asteroidExplosionEngine.emitParticles(data);
            }
        }
    }

    _rapidFire(game, asteroids) {
        this.show();
        this.style.visible = true;

        this.blastsCharging = true;

        animate(this)
        .now({opacity: 1.0}, 500)
        .then(() => {
            this.hide();
            this.style.visible = false;
            this.style.opacity = 0.01;
            this.blastsCharging = false;
            
            var xDist = 100 * Math.sin(this.rocket.style.r);
            var yDist = 100 * Math.cos(this.rocket.style.r);
            var xTip = this.rocket.style.x + xDist;
            var yTip = this.rocket.style.y - yDist;

            var blast = this.blastPool.obtainView();
            blast.updateOpts({
                x: xTip,
                y: yTip,
            });
            
            var blastPath = new Vec2D({
                x: xTip - this.game.rocket.style.x,
                y: yTip - this.game.rocket.style.y,
            });

            var blastAngle = blastPath.getAngle();

            this.game.audio.play('redLaser');

            animate(blast)
            .now({
                x: 3000 * Math.cos(blastAngle),
                y: 3000 * Math.sin(blastAngle),
            }, 1800)
            .then(() => {
                for (var i = 0; i < this.activeBlasts.length; i++) {
                    if (this.activeBlasts[i] === blast) {
                        this.activeBlasts.splice(i, 1);
                        this.activeBlastAngles.splice(i, 1);
                        this.blastPool.releaseView(blast);
                        break;
                    }
                }
            });

            this.activeBlasts.push(blast);
            this.activeBlastAngles.push(blastAngle);
        });
    }

    _turretFire(game, asteroids) {
        this.show();
        this.style.visible = true;

        this.turretCharging = true;

        animate(this)
        .now({opacity: 1.0}, 500)
        .then(() => {
            this.turretCharging = false;
        });

        var blast = this.turretBlastPool.obtainView();
        blast.updateOpts({
            x: this.game.style.width / 2,
            y: this.game.style.height / 2,
        });

        var blastAngle = this.style.r + 1.15;

        this.game.audio.play("turret");

        animate(blast)
        .now({
            x: 3000 * Math.cos(blastAngle),
            y: 3000 * Math.sin(blastAngle),
        }, 1800)
        .then(() => {
            for (var i = 0; i < this.activeTurretBlasts.length; i++) {
                if (this.activeTurretBlasts[i] === blast) {
                    this.activeTurretBlasts.splice(i, 1);
                    this.turretBlastPool.releaseView(blast);
                    break;
                }
            }
        });
        
        this.activeTurretBlasts.push(blast);
    }

    _shockWave(game, asteroids) {
        for (var i = 0; i < this.game.asteroids.length; i++) {
            var cur = this.game.asteroids[i];

            if (!cur.onScreen) {
                return;
            }

            var a = Math.pow(Math.abs(this.style.x - cur.style.x), 2);
            var b = Math.pow(Math.abs(cur.style.y - this.style.y), 2);
            var c = Math.pow(((this.style.scale * this.style.width) / 2) + 75, 2);

            if (a + b <= c) {
                this.game.asteroidPool.releaseView(cur);
                this.game.asteroids.splice(i, 1);

                cur.flare.style.visible = false;
                cur.flare.style.opacity = 0;
                cur.flare.hide();
                cur.flare.removeFromSuperview();

                this.game.audio.play("fireBallExplosion");

                var data = this.game.asteroidExplosionEngine.obtainParticleArray(1);
                var ttl = 500;
                var particle = data[0];
                particle.centerOnOrigin = true;
                particle.ttl = ttl;
                particle.x = cur.style.x;
                particle.y = cur.style.y;
                particle.image = 'resources/images/particles/hot_pop_03.png';
                particle.opacity = 0.2;
                particle.dopacity = 2;
                particle.width = 200;
                particle.height = 200;
                particle.dscale = 20;
                particle.anchorX = particle.width / 2;
                particle.anchorY = particle.height / 2;

                this.game.asteroidExplosionEngine.emitParticles(data);
            }
        }
    }

    _action(game, asteroids) {
        if (this.powerUpType === POWERUPS[0]) {
            this._forceField(game, asteroids);
        } else if (this.powerUpType === POWERUPS[2] && this.blastsReady) {
            if (!this.blastsCharging) {
                this._rapidFire(game, asteroids);
            }
        } else if (this.powerUpType === POWERUPS[3]) {
            this._shockWave(game, asteroids);
        } else if (this.powerUpType === POWERUPS[4] && this.turretBlastsReady) {
            if (!this.turretCharging) {
                this._turretFire(game, asteroids);
            }
        }
    }
}

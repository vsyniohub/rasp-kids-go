const fs   = require('fs');
const path = require('path');

const SAVE_FILE            = path.join(__dirname, '..', 'pet-save.json');
const SECONDS_PER_TICK     = 30;   // 1 tick = 30 real seconds of offline time

const DECAY = {
  hunger:    1.5,
  happiness: 1.0,
  energy:    0.8,
};

class Pet {
  constructor(name) {
    this.name      = name;
    this.hunger    = 80;
    this.happiness = 80;
    this.energy    = 80;
    this.health    = 100;
    this.age       = 0;
    this.isAlive   = true;
  }

  get mood() {
    if (!this.isAlive)         return 'dead';
    if (this.health    < 25)   return 'sick';
    if (this.energy    < 20)   return 'sleepy';
    if (this.hunger    < 20)   return 'hungry';
    if (this.happiness < 25)   return 'sad';
    if (this.happiness > 70 && this.hunger > 60 && this.energy > 60) return 'happy';
    return 'normal';
  }

  tick() {
    if (!this.isAlive) return;

    this.hunger    = clamp(this.hunger    - DECAY.hunger,    0, 100);
    this.happiness = clamp(this.happiness - DECAY.happiness, 0, 100);
    this.energy    = clamp(this.energy    - DECAY.energy,    0, 100);
    this.age++;

    // Health erodes when multiple stats are critically low
    const criticals = [this.hunger, this.happiness, this.energy].filter(v => v < 15).length;
    if (criticals > 0) {
      this.health = clamp(this.health - criticals * 2, 0, 100);
    } else if (this.hunger > 60 && this.happiness > 60 && this.energy > 60) {
      this.health = clamp(this.health + 0.3, 0, 100);
    }

    if (this.health <= 0) this.isAlive = false;
  }

  feed() {
    if (this.hunger >= 95) return `${this.name} is already full!`;
    this.hunger    = clamp(this.hunger    + 30, 0, 100);
    this.happiness = clamp(this.happiness +  5, 0, 100);
    return `Nom nom nom! ${this.name} loved that!`;
  }

  play() {
    if (this.energy < 15) return `${this.name} is too tired to play right now...`;
    this.happiness = clamp(this.happiness + 30, 0, 100);
    this.energy    = clamp(this.energy    - 15, 0, 100);
    return `Wheee! ${this.name} had so much fun!`;
  }

  sleep() {
    if (this.energy >= 95) return `${this.name} is not sleepy yet!`;
    this.energy    = clamp(this.energy    + 35, 0, 100);
    this.happiness = clamp(this.happiness +  5, 0, 100);
    return `Zzz... ${this.name} is having sweet dreams!`;
  }

  clean() {
    this.health    = clamp(this.health    + 20, 0, 100);
    this.happiness = clamp(this.happiness +  5, 0, 100);
    return `Squeaky clean! ${this.name} sparkles!`;
  }

  save() {
    fs.writeFileSync(SAVE_FILE, JSON.stringify({ ...this, savedAt: Date.now() }, null, 2));
  }

  static load() {
    if (!fs.existsSync(SAVE_FILE)) return null;
    try {
      const raw = JSON.parse(fs.readFileSync(SAVE_FILE, 'utf8'));
      const pet = new Pet(raw.name);
      Object.assign(pet, raw);

      // Apply ticks for time spent offline (capped at 100 ticks to avoid huge drops)
      const elapsed = Date.now() - raw.savedAt;
      const ticks   = Math.min(Math.floor(elapsed / (SECONDS_PER_TICK * 1000)), 100);
      for (let i = 0; i < ticks; i++) pet.tick();

      return pet;
    } catch {
      return null;
    }
  }
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

module.exports = Pet;

function ceilToNearestTen(num) {
  return Math.ceil(num / 10) * 10;
}

const textInput = document.getElementById('text');
textInput.addEventListener('keypress', (e) => {
  if (e.keyCode === 13) {
    const inputValue = e.target.value;
    if (inputValue === '') return;
    console.log('Input Value:', inputValue);
    effect.text = inputValue;
    effect.init('text');

    const customText = document.getElementById('custom-text');
    customText.style.display = 'none';
  }
});

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = ceilToNearestTen(window.innerWidth);
canvas.height = ceilToNearestTen(window.innerHeight);

ctx.fillStyle = 'white';
ctx.strokeStyle = 'white';
ctx.lineWidth = 1;

class Particle {
  constructor(effect) {
    this.effect = effect;
    this.x = Math.floor(Math.random() * effect.width);
    this.y = Math.floor(Math.random() * effect.height);
    this.speedX;
    this.speedY;
    this.speedModifier = Math.floor(Math.random() * 5 + 1);
    this.history = [{ x: this.x, y: this.y }];
    this.maxLenth = Math.floor(Math.random() * 200) + 10;
    this.angle = 0;
    this.timer = this.maxLenth * 2;
    this.colors = [
      '#32a8e3',
      '#46b9f2',
      '#1b80b3',
      '#1498db',
      '#6ec1eb',
      '#063f5c',
      '#00a9ff',
      '#294e61',
    ];
    this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
  }

  draw(context) {
    context.beginPath();
    context.moveTo(this.history[0].x, this.history[0].y);
    for (let i = 1; i < this.history.length; i++) {
      context.lineTo(this.history[i].x, this.history[i].y);
    }
    context.strokeStyle = this.color;
    context.stroke();
  }

  update() {
    this.timer--;
    if (this.timer >= 1) {
      const x = Math.floor(this.x / this.effect.cellSize);
      const y = Math.floor(this.y / this.effect.cellSize);
      const index = y * this.effect.cols + x;

      this.angle = this.effect.flowField[index];

      this.speedX = Math.cos(this.angle);
      this.speedY = Math.sin(this.angle);
      this.x += this.speedX * this.speedModifier;
      this.y += this.speedY * this.speedModifier;

      this.history.push({ x: this.x, y: this.y });
      if (this.history.length > this.maxLenth) {
        this.history.shift();
      }
    } else if (this.history.length > 1) {
      this.history.shift();
    } else {
      this.reset();
    }
  }

  reset() {
    this.x = Math.floor(Math.random() * this.effect.width);
    this.y = Math.floor(Math.random() * this.effect.height);
    this.history = [{ x: this.x, y: this.y }];
    this.timer = this.maxLenth * 2;
  }
}

class Effect {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.context = ctx;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.particles = [];
    this.numberOfParticles = 4000;
    this.cellSize = 10;
    this.rows;
    this.cols;
    this.flowField = [];
    this.curve = 1.3;
    this.zoom = 0.07;
    this.debug = false;
    this.text = '';
    this.init();

    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'd') {
        this.debug = !this.debug;
      }
    });

    window.addEventListener('resize', (e) => {
      this.resize(
        ceilToNearestTen(e.target.innerWidth),
        ceilToNearestTen(e.target.innerHeight)
      );
    });
  }

  drawText() {
    this.context.font = '400px impact';
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';

    const gradient1 = this.context.createRadialGradient(
      this.width * 0.5,
      this.height * 0.5,
      10,
      this.width * 0.5,
      this.height * 0.5,
      this.width
    );
    gradient1.addColorStop(0.2, 'rgb(255,0,0)');
    gradient1.addColorStop(0.4, 'rgb(255,255,0)');
    gradient1.addColorStop(0.6, 'rgb(0,255,255)');
    gradient1.addColorStop(0.8, 'rgb(0,0,255)');

    this.context.fillStyle = gradient1;
    this.context.fillText(this.text, this.width * 0.5, this.height * 0.5);
  }

  initDefault() {
    this.flowField = [];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const angle =
          (Math.cos(x * this.zoom) + Math.sin(y * this.zoom)) * this.curve;
        this.flowField.push(angle);
      }
    }
  }

  initText() {
    this.flowField = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawText();

    const pixles = this.context.getImageData(0, 0, this.width, this.height);
    for (let y = 0; y < this.height; y += this.cellSize) {
      for (let x = 0; x < this.width; x += this.cellSize) {
        const index = (y * this.width + x) * 4;
        const red = pixles.data[index];
        const green = pixles.data[index + 1];
        const blue = pixles.data[index + 2];
        const grayscale = (red + green + blue) / 3;
        const colorAngle = (grayscale / 255) * 6.26;
        this.flowField.push(colorAngle);
      }
    }
  }

  init(type) {
    // create flow field
    this.rows = Math.floor(this.height / this.cellSize);
    this.cols = Math.floor(this.width / this.cellSize);

    if (type === 'text') {
      this.initText();
    } else {
      this.initDefault();
    }

    // crate particles
    this.particles = [];
    for (let i = 0; i < this.numberOfParticles; i++) {
      this.particles.push(new Particle(this));
    }
  }

  render() {
    if (this.debug) {
      this.drawGrid();
      this.drawText();
    }
    this.particles.forEach((particle) => {
      particle.draw(this.context);
      particle.update();
    });
  }

  drawGrid() {
    this.context.save();
    this.context.strokeStyle = 'red';
    this.context.lineWidth = 0.2;
    for (let c = 0; c < this.cols; c++) {
      this.context.beginPath();
      this.context.moveTo(this.cellSize * c, 0);
      this.context.lineTo(this.cellSize * c, this.height);
      this.context.stroke();
    }
    for (let r = 0; r < this.rows; r++) {
      this.context.beginPath();
      this.context.moveTo(0, this.cellSize * r);
      this.context.lineTo(this.width, this.cellSize * r);
      this.context.stroke();
    }
    this.context.restore();
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;
  }
}

const effect = new Effect(canvas, ctx);

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  effect.render();
  requestAnimationFrame(animate);
}
animate();

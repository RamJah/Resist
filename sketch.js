let algae = [];

const palette = [
  [255, 215, 0],
  [218, 165, 32],
  [184, 134, 11],
  [140, 100, 40],
  [120, 80, 50],
  [180, 60, 40],
  [200, 50, 60],
  [170, 30, 50],
  [120, 15, 40]
];

const BASE_CAP = 40;
const REVIVAL_DELAY = 30000; // 30 seconds

let phase = "active";
let capReachedAt = 0;

let introShown = false;
let introAlpha = 0;
let introState = "fadeIn"; // fadeIn | visible | fadeOut | hidden
let algaeSpawnTime = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);

  setTimeout(() => {
    introShown = true;
    algaeSpawnTime = millis();

    algae.push(
      new Algae(
        width / 2 + random(-80, 80),
        height / 2 + random(-80, 80),
        random(TWO_PI)
      )
    );
  }, 1600);
}

function draw() {
  background(0);

  // INTRO TEXT

  if (introState !== "hidden") {

    if (introState === "fadeIn") {
      introAlpha += 3;

      if (introAlpha >= 220) {
        introAlpha = 220;
        introState = "visible";
      }
    }

    if (
      introState === "visible" &&
      introShown &&
      millis() - algaeSpawnTime > 1000
    ) {
      introState = "fadeOut";
    }

    if (introState === "fadeOut") {
      introAlpha -= 2;

      if (introAlpha <= 0) {
        introAlpha = 0;
        introState = "hidden";
      }
    }

    fill(218, 165, 32, introAlpha);
noStroke();

textFont("Palatino");
textStyle(NORMAL);

textAlign(CENTER, CENTER);

textSize(min(width, height) * 0.04);

text("SWISH TO CUT", width / 2, height / 2);
  }

  if (!introShown) return;

  // CAP REACHED

  if (phase === "active" && algae.length >= BASE_CAP) {
    phase = "capped";
    capReachedAt = millis();
  }

  // REVIVAL AFTER 42 SECONDS

  if (
    phase === "capped" &&
    millis() - capReachedAt > REVIVAL_DELAY
  ) {
    phase = "active";

    for (let a of algae) {
      a.dead = false;
      a.length = 0;
      a.maxLength = random(1200, 2200);
      a.growthSpeed = random(1.2, 2.5);
      a.targetAngle = random(TWO_PI);

      if (a.points.length >= 1) {
        let len = a.points.length;
        let tip = a.points[len - 1];
        let prev = a.points[len >= 2 ? len - 2 : 0];

        a.angle = atan2(
          tip.y - prev.y,
          tip.x - prev.x
        );
      }
    }
  }

  // UPDATE + DRAW

  for (let a of algae) {
    a.update();
    a.show();
  }

  handleCuts();
}

function handleCuts() {
  if (!mouseIsPressed) return;

  let canSpawn = phase === "active";

  for (let a of algae) {

    if (a.points.length < 20) continue;

    for (let j = 10; j < a.points.length - 10; j++) {

      let p = a.points[j];

      if (
        dist(mouseX, mouseY, p.x, p.y) <
        a.baseWidth
      ) {
        a.performCut(j, canSpawn);
        break;
      }
    }
  }
}

class Algae {

  constructor(
    x,
    y,
    angle,
    bodyColor = null,
    isBlack = false
  ) {

    this.points = [createVector(x, y)];

    this.angle = angle;

    this.length = 0;
    this.maxLength = random(2200, 3200);
    this.growthSpeed = random(1, 1.8);

    this.baseWidth = random(10, 22);

    this.noiseOffset = random(5000);
    this.targetAngle = random(TWO_PI);

    this.dead = false;

    this.isBlack = isBlack;

    this.bodyColor =
      bodyColor ||
      (
        isBlack
          ? color(0)
          : color(...random(palette), 95)
      );
  }

  update() {
    this.grow();
  }

  grow() {

    if (this.dead) return;

    let last =
      this.points[this.points.length - 1];

   let margin = 100;

if (last.x < margin) {
  this.targetAngle = 0;
}
else if (last.x > width - margin) {
  this.targetAngle = PI;
}

if (last.y < margin) {
  this.targetAngle = HALF_PI;
}
else if (last.y > height - margin) {
  this.targetAngle = -HALF_PI;
}

    if (this.length > this.maxLength) return;

    let bend = map(
      noise(this.noiseOffset),
      0,
      1,
      -0.08,
      0.08
    );

    this.angle =
      lerp(
        this.angle,
        this.targetAngle,
        0.01
      ) + bend;

    let dx =
      cos(this.angle) *
      this.growthSpeed;

    let dy =
      sin(this.angle) *
      this.growthSpeed;

    this.points.push(
      createVector(
        last.x + dx,
        last.y + dy
      )
    );

    this.length += this.growthSpeed;
    this.noiseOffset += 0.015;

    if (this.points.length > 4000) {
      this.dead = true;
    }
  }

  performCut(index, canSpawn) {

    this.points =
      this.points.slice(0, index);

    if (this.points.length < 8) return;
    if (!canSpawn) return;
    if (algae.length >= BASE_CAP) return;

    let base =
      this.points[this.points.length - 1];

    let spawnBlack =
      random() < 0.25;

    let newColor =
      spawnBlack
        ? color(0)
        : color(
            ...random(palette),
            95
          );

    let spawnCount =
      min(
        floor(random(1, 4)),
        2
      );

    for (let i = 0; i < spawnCount; i++) {

      if (algae.length >= BASE_CAP) {
        break;
      }

      algae.push(
        new Algae(
          base.x,
          base.y,
          random(TWO_PI),
          newColor,
          spawnBlack
        )
      );
    }
  }

  show() {

    if (this.points.length < 3) return;

    let leftEdge = [];
    let rightEdge = [];

    for (
      let i = 0;
      i < this.points.length;
      i++
    ) {

      let p = this.points[i];

      let dir =
        i < this.points.length - 1
          ? p5.Vector.sub(
              this.points[i + 1],
              p
            )
          : p5.Vector.sub(
              p,
              this.points[i - 1]
            );

      dir.normalize();

      let normal =
        createVector(
          -dir.y,
          dir.x
        );

      let taper = 1;
      let edgeFade = 25;

      if (i < edgeFade) {
        taper = map(
          i,
          0,
          edgeFade,
          0,
          1
        );
      }

      if (
        i >
        this.points.length - edgeFade
      ) {
        taper = min(
          taper,
          map(
            i,
            this.points.length -
              edgeFade,
            this.points.length,
            1,
            0
          )
        );
      }

      let w =
        this.baseWidth * taper;

      let wave =
        sin(
          i * 0.35 +
          frameCount * 0.05
        ) * 2.5;

      leftEdge.push(
        createVector(
          p.x +
            normal.x *
              (w + wave),
          p.y +
            normal.y *
              (w + wave)
        )
      );

      rightEdge.push(
        createVector(
          p.x -
            normal.x *
              (w + wave),
          p.y -
            normal.y *
              (w + wave)
        )
      );
    }

    fill(this.bodyColor);
if (this.isBlack) {
  stroke(120, 50, 70, 220);
} else {
  stroke(90, 60, 35, 220);
}
strokeWeight(0.5);

    beginShape();

    for (let p of leftEdge) {
      vertex(p.x, p.y);
    }

    for (
      let i = rightEdge.length - 1;
      i >= 0;
      i--
    ) {
      vertex(
        rightEdge[i].x,
        rightEdge[i].y
      );
    }

    endShape(CLOSE);
  }
}

function windowResized() {
  resizeCanvas(
    windowWidth,
    windowHeight
  );
}
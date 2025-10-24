import "./style.css";

const title = document.createElement("h1");
title.textContent = "Sketch Pad";
document.body.append(title);

const canvas = document.createElement("canvas");
canvas.width = 500;
canvas.height = 500;
document.body.append(canvas);

const ctx = canvas.getContext("2d")!;
let currentStrokeSize: number = 3;
ctx.lineWidth = currentStrokeSize;
ctx.strokeStyle = "black";
const preview = {
  active: false,
  x: 0,
  y: 0,
};

interface DrawCommand {
  lineWidth: number;
  display(ctx: CanvasRenderingContext2D): void;
  drag(x: number, y: number): void;
}

interface ActiveDrawCommand extends DrawCommand {
  drag(x: number, y: number): void;
}

function createMarkerCommand(
  startX: number,
  startY: number,
  lineWidth: number,
): DrawCommand {
  const points: { x: number; y: number }[] = [{ x: startX, y: startY }];

  return {
    lineWidth: lineWidth,

    display(ctx) {
      if (points.length < 2) return;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    },
    drag(x: number, y: number) {
      points.push({ x, y });
    },
  };
}

let commands: ActiveDrawCommand[] = [];
let currentCommand: DrawCommand | null = null;
const redoCommands: DrawCommand[] = [];

const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentCommand = createMarkerCommand(cursor.x, cursor.y, currentStrokeSize);
  commands.push(currentCommand);
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentCommand?.drag(cursor.x, cursor.y);
  } else {
    preview.x = e.offsetX;
    preview.y = e.offsetY;
  }

  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

canvas.addEventListener("mouseenter", (e) => { //called it mouse enter and not tool moved for consistent naming convention
  preview.active = true;
  preview.x = e.offsetX;
  preview.y = e.offsetY;
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

// Set preview to inactive when the mouse leaves the canvas
canvas.addEventListener("mouseleave", () => {
  preview.active = false;
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

canvas.addEventListener("mouseup", () => {
  //stop adding coords and reset currentLine
  cursor.active = false;
  currentCommand = null;
});

//clear canvas and redraw based on coords from lines
canvas.addEventListener("drawing-changed", () => {
  ctx.strokeStyle = "black";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const cmd of commands) {
    cmd.display(ctx);
  }
  if (preview.active && !cursor.active) {
    drawStrokePreview(preview.x, preview.y);
  }
});

function drawStrokePreview(x: number, y: number) {
  ctx.strokeStyle = "gray";
  ctx.lineWidth = 1;

  ctx.fillStyle = "rgba(100, 100, 100, 0.5)";

  ctx.beginPath();

  const radius = currentStrokeSize / 2;
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "black";
  ctx.lineWidth = currentStrokeSize;
}

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  commands = [];
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
document.body.append(undoButton);

undoButton.addEventListener("click", () => {
  if (commands.length > 0) {
    const lastCmd = commands.pop();
    if (lastCmd) {
      redoCommands.push(lastCmd);
      canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    }
  }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoCommands.length > 0) {
    const redoCmd = redoCommands.pop();
    if (redoCmd) {
      commands.push(redoCmd);
      canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    }
  }
});

const sizeLabel = document.createElement("span");
sizeLabel.textContent = "Stroke Size: ";
document.body.append(sizeLabel);

const strokeSizes = [3, 10, 20];

strokeSizes.forEach((size) => {
  const sizeButton = document.createElement("button");
  sizeButton.innerHTML = `${size}px`;

  if (size === currentStrokeSize) {
    sizeButton.style.fontWeight = "bold";
  }

  sizeButton.addEventListener("click", () => {
    currentStrokeSize = size;

    document.querySelectorAll(".size-button").forEach((btn) => {
      (btn as HTMLButtonElement).style.fontWeight = "normal";
    });
    sizeButton.style.fontWeight = "bold";
  });

  sizeButton.classList.add("size-button");
  document.body.append(sizeButton);
});

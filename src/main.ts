import "./style.css";

const title = document.createElement("h1");
title.textContent = "Sketch Pad";
document.body.append(title);

const canvas = document.createElement("canvas");
canvas.width = 500;
canvas.height = 500;
document.body.append(canvas);

const ctx = canvas.getContext("2d")!;
ctx.lineWidth = 3;
ctx.strokeStyle = "black";

interface DrawCommand {
  display(ctx: CanvasRenderingContext2D): void;
  drag(x: number, y: number): void;
}

interface ActiveDrawCommand extends DrawCommand {
  drag(x: number, y: number): void;
}

function createMarkerCommand(startX: number, startY: number): DrawCommand {
  const points: { x: number; y: number }[] = [{ x: startX, y: startY }];

  return {
    display(ctx) {
      if (points.length < 2) return;
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

  currentCommand = createMarkerCommand(cursor.x, cursor.y);
  commands.push(currentCommand);
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentCommand?.drag(cursor.x, cursor.y);
    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
  }
});

canvas.addEventListener("mouseup", () => {
  //stop adding coords and reset currentLine
  cursor.active = false;
  currentCommand = null;
});

//clear canvas and redraw based on coords from lines
canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const cmd of commands) {
    cmd.display(ctx);
  }
});

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

/*const lineSize = document.createElement("select");
lineSize.innerHTML = `
  <option value=3>Thickness</option>
  <option value=1>1</option>
  <option value=3>3</option>
  <option value=5>5</option>
  <option value=10>10</option>
  <option value=15>15</option>
`;
document.body.append(lineSize);

lineSize.addEventListener("change", (e) => {
  const target = e.target as HTMLSelectElement;
  if (target.value) {
    ctx.lineWidth = target.value;
  }
});*/

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

type Point = { x: number; y: number };
let lines: Point[][] = [];
const redoLines: Point[][] = [];
let currentLine: Point[] | null = null;

const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  //assign lines to reference currentLine and add first point
  currentLine = [];
  lines.push(currentLine);
  if (currentLine) {
    currentLine.push({
      x: cursor.x,
      y: cursor.y,
    });
  }

  //call event to draw first stroke
  //canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    //add new coords to to currentLine while the cursor is down
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentLine?.push({
      x: cursor.x,
      y: cursor.y,
    });

    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
  }
});

canvas.addEventListener("mouseup", () => {
  //stop adding coords and reset currentLine
  cursor.active = false;
  currentLine = null;

  //canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

//clear canvas and redraw based on coords from lines
canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const line of lines) {
    if (line.length > 1) {
      ctx.beginPath();
      const { x, y } = line[0];
      ctx.moveTo(x, y);

      for (const { x, y } of line) {
        ctx.lineTo(x, y);
      }

      ctx.stroke();
    }
  }
});

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  lines = [];
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
document.body.append(undoButton);

undoButton.addEventListener("click", () => {
  if (lines.length > 0) {
    const lastLine = lines.pop();
    if (lastLine) {
      redoLines.push(lastLine);
      canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    }
  }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoLines.length > 0) {
    const redoLine = redoLines.pop();

    if (redoLine) {
      lines.push(redoLine);
      canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    }
  }
});

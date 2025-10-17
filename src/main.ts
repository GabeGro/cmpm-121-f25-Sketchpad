import "./style.css";

const title = document.createElement("h1");
title.textContent = "Sketch Pad";
document.body.append(title);

const canvas = document.createElement("canvas");
canvas.width = 500;
canvas.height = 500;
document.body.append(canvas);

const ctx = canvas.getContext("2d")!;
ctx.lineWidth = 2;
ctx.strokeStyle = "black";

const cursor = { active: false, x: 0, y: 0 };

//store cursor pos1
canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
});

//when cursor moves to pos2, draw line between pos1 and pos2
canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    ctx.beginPath();
    ctx.moveTo(cursor.x, cursor.y);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
});

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas?.width, canvas.height);
});

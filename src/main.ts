import "./style.css";

const title = document.createElement("h1");
title.textContent = "Sketch Pad";
document.body.append(title);

const canvas = document.createElement("canvas");
canvas.width = 500;
canvas.height = 500;
document.body.append(canvas);

let currentEmoji: string = "😀";
const stickerSize: number = 30;
let currentStrokeSize: number = 3;

//define drawing modes
type DrawingMode = "marker" | "sticker";
let currentMode: DrawingMode = "marker";

const ctx = canvas.getContext("2d")!;
ctx.lineWidth = currentStrokeSize;
ctx.strokeStyle = "black";
const preview = {
  active: false,
  x: 0,
  y: 0,
};

interface DrawCommand {
  lineWidth: number;
  emoji?: string;
  size?: number;
  x?: number;
  y?: number;
  display(ctx: CanvasRenderingContext2D): void;
  drag(x: number, y: number): void;
}

interface ActiveDrawCommand extends DrawCommand {
  drag(x: number, y: number): void;
}

function createStickerCommand(
  x: number,
  y: number,
  emoji: string,
  size: number,
): DrawCommand {
  return {
    lineWidth: 1,
    emoji: emoji,
    size: size,
    x: x,
    y: y,

    display(ctx) {
      ctx.font = `${this.size}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillText(this.emoji!, this.x!, this.y!);
    },
    drag(_x: number, _y: number) {
    },
  };
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

  if (currentMode == "marker") {
    currentCommand = createMarkerCommand(cursor.x, cursor.y, currentStrokeSize);
    commands.push(currentCommand);
  } else if (currentMode == "sticker") {
    const newStickerCommand = createStickerCommand(
      cursor.x,
      cursor.y,
      currentEmoji,
      stickerSize,
    );
    commands.push(newStickerCommand);
    cursor.active = false;
  }

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

//is the mouse on the canvas or not
canvas.addEventListener("mouseenter", (e) => { //called it mouse enter and not tool moved for consistent naming convention
  preview.active = true;
  preview.x = e.offsetX;
  preview.y = e.offsetY;
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});
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
    if (cmd.emoji) {
      console.log("Hi!");
    } else {
      ctx.lineWidth = cmd.lineWidth;
    }

    cmd.display(ctx);
  }

  if (preview.active && !cursor.active) {
    drawStrokePreview(preview.x, preview.y);
  }
});

//store the preview appearance
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

//emoji selection
document.body.append(document.createElement("hr"));
const stickerLabel = document.createElement("span");
stickerLabel.textContent = "Stickers: ";
document.body.append(stickerLabel);

const availableEmojis = ["😀", "🚀", "💡", "❤️", "⭐"];

availableEmojis.forEach((emoji) => {
  const emojiButton = document.createElement("button");
  emojiButton.innerHTML = emoji;
  emojiButton.classList.add("emoji-button");

  //set initial emoji
  if (emoji === currentEmoji) {
    emojiButton.style.border = "3px solid blue";
  }

  emojiButton.addEventListener("click", () => {
    currentMode = "sticker";
    currentEmoji = emoji;

    //update button styles
    document.querySelectorAll(".mode-button").forEach((btn) =>
      (btn as HTMLButtonElement).style.fontWeight = "normal"
    );
    document.querySelectorAll(".emoji-button").forEach((btn) =>
      (btn as HTMLButtonElement).style.border = "1px solid black"
    );
    emojiButton.style.border = "3px solid blue";
    markerModeButton.style.fontWeight = "normal";
  });

  document.body.append(emojiButton);
});

//emoji selection menu
const toolDiv = document.createElement("div");
toolDiv.style.marginTop = "10px";
document.body.append(toolDiv);

const markerModeButton = document.createElement("button");
markerModeButton.innerHTML = "Marker Mode";
markerModeButton.classList.add("mode-button");
markerModeButton.style.fontWeight = "bold"; // Start in marker mode
toolDiv.append(markerModeButton);

markerModeButton.addEventListener("click", () => {
  currentMode = "marker";

  // Reset UI styles
  document.querySelectorAll(".mode-button").forEach((btn) =>
    (btn as HTMLButtonElement).style.fontWeight = "normal"
  );
  document.querySelectorAll(".emoji-button").forEach((btn) =>
    (btn as HTMLButtonElement).style.border = "1px solid black"
  );
  markerModeButton.style.fontWeight = "bold";
});

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
let currentStrokeColor: string = "black"; //variable for current color

//define drawing modes
type DrawingMode = "marker" | "sticker";
let currentMode: DrawingMode = "marker";

const ctx = canvas.getContext("2d")!;
ctx.lineWidth = currentStrokeSize;
ctx.strokeStyle = currentStrokeColor; //use the new color variable
const preview = {
  active: false,
  x: 0,
  y: 0,
};

interface DrawCommand {
  lineWidth: number;
  color?: string; //added color property for marker commands
  emoji?: string;
  size?: number;
  x?: number;
  y?: number;
  display(ctx: CanvasRenderingContext2D, scale?: number): void;
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

    display(ctx, scale = 1) { //apply scale to position and size
      ctx.font = `${this.size! * scale}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillText(this.emoji!, this.x! * scale, this.y! * scale);
    },
    drag(_x: number, _y: number) {
      //stickers are placed instantly, no dragging
    },
  };
}

function createMarkerCommand(
  startX: number,
  startY: number,
  lineWidth: number,
  color: string,
): DrawCommand {
  const points: { x: number; y: number }[] = [{ x: startX, y: startY }];
  return {
    lineWidth: lineWidth,
    color: color, //store the color used when the command was created

    display(ctx, scale = 1) { //apply scale to lineWidth and points
      if (points.length < 2) return;
      ctx.lineWidth = lineWidth * scale;
      ctx.strokeStyle = this.color!; //use the command's stored color
      ctx.beginPath();
      ctx.moveTo(points[0].x * scale, points[0].y * scale);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * scale, points[i].y * scale);
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
    //pass currentStrokeColor to the marker command
    currentCommand = createMarkerCommand(
      cursor.x,
      cursor.y,
      currentStrokeSize,
      currentStrokeColor,
    );
    commands.push(currentCommand as ActiveDrawCommand);
  } else if (currentMode == "sticker") {
    const newStickerCommand = createStickerCommand(
      cursor.x,
      cursor.y,
      currentEmoji,
      stickerSize,
    );
    commands.push(newStickerCommand as ActiveDrawCommand);
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
canvas.addEventListener("mouseenter", (e) => {
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
  cursor.active = false;
  currentCommand = null;
});

/**
 * Redraws all commands on the given context.
 * @param context The 2D rendering context to draw on.
 * @param scale The scaling factor (1 for display, > 1 for export).
 */
function redrawCommands(context: CanvasRenderingContext2D, scale: number) {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  for (const cmd of commands) {
    //marker commands set their own color inside display
    cmd.display(context, scale);
  }
}

//clear canvas and redraw based on coords from lines
canvas.addEventListener("drawing-changed", () => {
  redrawCommands(ctx, 1);

  if (preview.active && !cursor.active) {
    drawStrokePreview(preview.x, preview.y);
  }
});

//store the preview appearance
function drawStrokePreview(x: number, y: number) {
  if (currentMode === "marker") {
    // Use the current color for the preview
    ctx.strokeStyle = currentStrokeColor;
    ctx.lineWidth = 1;

    //make the fill slightly transparent for preview
    const R = parseInt(currentStrokeColor.slice(1, 3), 16);
    const G = parseInt(currentStrokeColor.slice(3, 5), 16);
    const B = parseInt(currentStrokeColor.slice(5, 7), 16);
    ctx.fillStyle = `rgba(${R}, ${G}, ${B}, 0.5)`;

    ctx.beginPath();

    const radius = currentStrokeSize / 2;
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = currentStrokeColor;
    ctx.lineWidth = currentStrokeSize;
  } else if (currentMode === "sticker") {
    ctx.font = `${stickerSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = 0.5;
    ctx.fillText(currentEmoji, x, y);
    ctx.globalAlpha = 1.0;
  }
}

//utility function for random color
function getRandomColor(): string {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

//ui elements
const buttonDiv = document.createElement("div");
document.body.append(document.createElement("hr"));
document.body.append(buttonDiv);
buttonDiv.style.marginBottom = "10px";

//clear undo and redo buttons
const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
buttonDiv.append(clearButton);

clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  commands = [];
  redoCommands.length = 0;
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
buttonDiv.append(undoButton);

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
redoButton.innerHTML = "Redo";
buttonDiv.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoCommands.length > 0) {
    const redoCmd = redoCommands.pop();
    if (redoCmd) {
      commands.push(redoCmd as ActiveDrawCommand);
      canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    }
  }
});

//export button
const exportButton = document.createElement("button");
exportButton.innerHTML = "Export PNG (1024x1024) 💾";
buttonDiv.append(exportButton);

exportButton.addEventListener("click", () => {
  exportDrawing();
});

//export handler
const EXPORT_SIZE = 1024;
const DISPLAY_SIZE = canvas.width;
const SCALE_FACTOR = EXPORT_SIZE / DISPLAY_SIZE;

function exportDrawing() {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = EXPORT_SIZE;
  exportCanvas.height = EXPORT_SIZE;
  const exportCtx = exportCanvas.getContext("2d");

  if (!exportCtx) return;

  //use the unified redraw function
  redrawCommands(exportCtx, SCALE_FACTOR);

  const imageURL = exportCanvas.toDataURL("image/png");

  const link = document.createElement("a");
  link.download = "sketchpad_export.png";
  link.href = imageURL;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

//color controls
const colorDiv = document.createElement("div");
document.body.append(colorDiv);
colorDiv.style.marginTop = "10px";

const colorLabel = document.createElement("span");
colorLabel.textContent = "Color: ";
colorDiv.append(colorLabel);

//random Color Button
const randomColorButton = document.createElement("button");
randomColorButton.innerHTML = "🎨 Random Color";
colorDiv.append(randomColorButton);

randomColorButton.addEventListener("click", () => {
  currentStrokeColor = getRandomColor();
  //ensure switch to marker mode
  currentMode = "marker";
  //reset UI styles to highlight marker mode
  (document.querySelector("#marker-mode-button") as HTMLButtonElement).click();
});

//stroke size controls
const sizeDiv = document.createElement("div");
document.body.append(sizeDiv);

const sizeLabel = document.createElement("span");
sizeLabel.textContent = "Stroke Size: ";
sizeDiv.append(sizeLabel);

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
  sizeDiv.append(sizeButton);
});

//sticker mode controls
document.body.append(document.createElement("hr"));
const toolDiv = document.createElement("div");
document.body.append(toolDiv);

const stickerLabel = document.createElement("span");
stickerLabel.textContent = "Stickers: ";
toolDiv.append(stickerLabel);

const availableEmojis = ["😀", "🚀", "💡", "❤️", "⭐"];

function updateEmojiButtonStyles(activeButton: HTMLButtonElement | null) {
  document.querySelectorAll(".mode-button").forEach((btn) =>
    (btn as HTMLButtonElement).style.fontWeight = "normal"
  );
  document.querySelectorAll(".emoji-button").forEach((btn) =>
    (btn as HTMLButtonElement).style.border = "1px solid black"
  );
  if (activeButton) {
    activeButton.style.border = "3px solid blue";
  }
  //ensure marker mode button is normal if sticker is selected
  const markerModeButton = document.querySelector(
    "#marker-mode-button",
  ) as HTMLButtonElement;
  if (markerModeButton) markerModeButton.style.fontWeight = "normal";
}

availableEmojis.forEach((emoji) => {
  const emojiButton = document.createElement("button");
  emojiButton.innerHTML = emoji;
  emojiButton.classList.add("emoji-button");
  emojiButton.dataset.emoji = emoji;

  if (emoji === currentEmoji && currentMode === "sticker") {
    emojiButton.style.border = "3px solid blue";
  }

  emojiButton.addEventListener("click", () => {
    currentMode = "sticker";
    currentEmoji = emoji;
    updateEmojiButtonStyles(emojiButton);
  });

  toolDiv.append(emojiButton);
});

//custom emoji input
const customEmojiDiv = document.createElement("div");
customEmojiDiv.style.display = "inline-block";
customEmojiDiv.style.marginLeft = "10px";
toolDiv.append(customEmojiDiv);

const customEmojiButton = document.createElement("button");
customEmojiButton.innerHTML = "Custom Emoji";
customEmojiButton.classList.add("emoji-button");
customEmojiDiv.append(customEmojiButton);

const customEmojiInput = document.createElement("input");
customEmojiInput.type = "text";
customEmojiInput.placeholder = "Enter emoji";
customEmojiInput.maxLength = 1;
customEmojiInput.style.width = "70px";
customEmojiInput.style.marginLeft = "5px";
customEmojiDiv.append(customEmojiInput);

customEmojiButton.addEventListener("click", () => {
  currentMode = "sticker";
  currentEmoji = customEmojiInput.value.trim() || availableEmojis[0];
  updateEmojiButtonStyles(customEmojiButton);
});

customEmojiInput.addEventListener("input", (e) => {
  const inputElement = e.target as HTMLInputElement;
  const emoji = inputElement.value.trim().substring(0, 1);

  if (emoji.length > 0) {
    currentEmoji = emoji;
    if (currentMode !== "sticker") {
      currentMode = "sticker";
      updateEmojiButtonStyles(customEmojiButton);
    }
  }
});

// Marker Mode Control
const markerModeButton = document.createElement("button");
markerModeButton.id = "marker-mode-button";
markerModeButton.innerHTML = "Marker Mode";
markerModeButton.classList.add("mode-button");
markerModeButton.style.fontWeight = "bold"; //start in marker mode
toolDiv.append(markerModeButton);

markerModeButton.addEventListener("click", () => {
  currentMode = "marker";

  //reset UI styles
  document.querySelectorAll(".mode-button").forEach((btn) =>
    (btn as HTMLButtonElement).style.fontWeight = "normal"
  );
  document.querySelectorAll(".emoji-button").forEach((btn) =>
    (btn as HTMLButtonElement).style.border = "1px solid black"
  );
  markerModeButton.style.fontWeight = "bold";
});

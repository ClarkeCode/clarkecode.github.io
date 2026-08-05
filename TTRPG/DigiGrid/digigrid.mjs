/**
 * @typedef ToolEventHandlers
 * @property {(event: MouseEvent) => {}} [mousedown]
 * @property {(event: MouseEvent) => {}} [mouseup]
 * @property {(event: KeyboardEvent) => {}} [keydown]
 * @property {(event: KeyboardEvent) => {}} [keyup]
 */

/**
 * @typedef DefaultTool
 * @property {{name: string, active: boolean}} defaultState
 * @property {ToolEventHandlers} eventHandlers
 * @property {() => {}} drawTool
 */

/**
 * @typedef Tool
 * @property {string} name
 * @property {boolean} active
 * @property {ToolEventHandlers} eventHandlers
 * @property {() => {}} drawTool
 */

/**
 * @typedef Shape
 * @property {"line"|"rect"|"door"} type Currently either "line" or "rect" or "door"
 * @property {string} [subtype]
 * @property {Coord[]} vertices
 */

/**
 * @typedef {Object} Coord
 * @property {number} x
 * @property {number} y
 */

/**
 * Assume x and y are the minimum of vertices (closest to origin)
 * @typedef {Object} Rect
 * @property {number} x
 * @property {number} y
 * @property {number} w
 * @property {number} h
 */

/**
 * @param {number} x 
 * @param {number} y 
 * @returns {Coord}
 */
const coord = (x, y) => {
	return {x: x, y: y};
};

/**
 * Return true if `low <= test <= high`, false otherwise
 * @template {T}
 * @param {T} low
 * @param {T} test
 * @param {T} high
 */
const isWithin = (low, test, high) => {
	return low <= test && test <= high;
}


/**
 * https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
 * @param {MouseEvent} event 
 */
const mouseButtonsPressed = (event) => {
	return {
		any:     event.buttons > 0,
		left:    event.buttons &  1,
		right:   event.buttons &  2,
		middle:  event.buttons &  4,
		back:    event.buttons &  8,
		forward: event.buttons & 16,
		numPressed: [
			event.buttons &  1,
			event.buttons &  2,
			event.buttons &  4,
			event.buttons &  8,
			event.buttons & 16,
		].filter(Boolean).length
	}
}

/**
 * @param {Coord} point 
 * @param {Rect} rect 
 */
const isPointInRect = (point, rect) => {
	return (
		isWithin(rect.x, point.x, rect.x + rect.w) &&
		isWithin(rect.y, point.y, rect.y + rect.h)
	);
}

/**
 * Yoinked from https://github.com/raysan5/raylib/blob/3ea8b9298f75513388cde1aef7bb7af614cd3ec4/src/rshapes.c#L2383, Ty Ray!
 * @param {Rect} r1 
 * @param {Rect} r2 
 */
const isIntersectingRects = (r1, r2) => {
	return (
		(r1.x < r2.x + r2.w) &&
		(r1.x + r1.w > r2.x) &&
		(r1.y < r2.y + r2.h) &&
		(r1.y + r1.h > r2.y)
	);
}




/*
 ________________________
|.----------------------.|
||                      ||
||       ______         ||
||     .;;;;;;;;.       ||
||    /;;;;;;;;;;;\     ||
||   /;/`    `-;;;;; . .||
||   |;|__  __  \;;;|   ||
||.-.|;| e`/e`  |;;;|   ||
||   |;|  |     |;;;|'--||
||   |;|  '-    |;;;|   ||
||   |;;\ --'  /|;;;|   ||
||   |;;;;;---'\|;;;|   ||
||   |;;;;|     |;;;|   ||
||   |;;.-'     |;;;|   ||
||'--|/`        |;;;|--.||
||;;;;    .     ;;;;.\;;||
||;;;;;-.;_    /.-;;;;;;||
||;;;;;;;;;;;;;;;;;;;;;;||
||jgs;;;;;;;;;;;;;;;;;;;||
'------------------------'
*/
const canvas = document.getElementById("canvas-id");
/** @type {CanvasRenderingContext2D}  */
const ctx = canvas.getContext("2d");

const MILLISECONDS_PER_SECOND = 1000;
let lastFrametime = performance.now();


let visualScale = 25;
let userInCanvas = false;

let mouse = {
	x: 0,
	y: 0,
}
let keyboard = {
	pressedKeys: []
}
let controller = {
	cameraDragMode: false,
	snapScale: 1,
}
const MIN_SNAP = 0.5;
const MAX_SNAP = 2;
const increaseGridSnap = () => {
	if (controller.snapScale < MAX_SNAP) controller.snapScale *= 2;
}
const decreaseGridSnap = () => {
	if (controller.snapScale > MIN_SNAP) controller.snapScale /= 2;
}


let camera = {
	x: 0.0,
	y: 0.0,

	baseWidth: 40,
	baseHeight: 30,
	zoomFactor: 1.0,
}
const increaseZoom = () => camera.zoomFactor += 0.25;
const decreaseZoom = () => {if (camera.zoomFactor > 0.25) camera.zoomFactor -= 0.25};

/** Visible area as a World-space rectangle @returns {Rect} */
const cameraAsRect = () => {
	return {
		x: camera.x - (camera.baseWidth / camera.zoomFactor) / 2,
		y: camera.y + (camera.baseHeight / camera.zoomFactor) / 2,
		w: (camera.baseWidth  / camera.zoomFactor),
		h: (camera.baseHeight / camera.zoomFactor)
	};
}

/** @param {Coord} point Worldspace location @returns {Coord} Screenspace location */
const worldToScreen = (point) => {
	const cam = cameraAsRect();
	const [screenWidth, screenHeight] = [ctx.canvas.width, ctx.canvas.height];

	return coord(
		(point.x - cam.x) * (screenWidth / cam.w),
		-(point.y - cam.y) * (screenHeight / cam.h)
	);
}

/** @param {Coord} point Screenspace location @returns {Coord} Worldspace location */
const screenToWorld = (point) => {
	const cam = cameraAsRect();
	const [screenWidth, screenHeight] = [ctx.canvas.width, ctx.canvas.height];

	return coord(
		point.x * (cam.w / screenWidth) + cam.x,
		cam.y - point.y * (cam.h / screenHeight)
	);
}


const mouseToWorld = () => screenToWorld(coord(mouse.x, mouse.y));


/**
 * @type {Shape[]}
 */
let shapes = [
	{
		type: "line",
		vertices: [coord(1,1), coord(2,2), coord(3,1), coord(3,3), coord(5, 3)]
	},
	{
		type: "line",
		vertices: [coord(5,10), coord(10,10), coord(14,14), coord(18,10), coord(20, 10)]
	},
	{
		type: "line",
		vertices: [coord(1,5), coord(10,5)]
	},
	{
		type: "line",
		vertices: [coord(15,2), coord(15,8)]
	},
];



/** @type {Tool} */
let currentTool = {};

/**
 * The ENTIRE purpose of this function and the entire distinction of Tool vs DefaultTool w/ a 'defaultState' property is because
 * structuredClone() chokes and dies when asked to copy a function...... serious language btw :/
 * @param {DefaultTool} defaultTool 
 */
const selectTool = (defaultTool) => {
	currentTool = structuredClone(defaultTool.defaultState);
	currentTool.eventHandlers = defaultTool.eventHandlers;
	currentTool.drawTool = defaultTool.drawTool;
}


/*
 .----.                                .---.  
'---,  `.____________________________.'  _  `.
     )   ____________________________   <_>  :
.---'  .'                            `.     .'
 `----'                                `---'  
*/

/** @type {DefaultTool} */
const squareTool = {
	defaultState: {
		name: "Square",
		active: false,
		startCoord: {x: 0, y: 0},
	},

	eventHandlers: {
		mousedown: (event) => {
			const mouseButtons = mouseButtonsPressed(event);
			if (currentTool.active && mouseButtons.right) { //Right click while dragging should cancel as if user pressed "Escape"
				selectTool(squareTool);
				return;
			}

			currentTool.active = true;
		
			currentTool.startCoord = snapToGrid(mouseToWorld());
		},
		mouseup: (event) => {
			const snapped = snapToGrid(mouseToWorld())
			const dragRect = {
				x: Math.min(currentTool.startCoord.x, snapped.x),
				y: Math.min(currentTool.startCoord.y, snapped.y),
				w: Math.max(currentTool.startCoord.x, snapped.x) - Math.min(currentTool.startCoord.x, snapped.x),
				h: Math.max(currentTool.startCoord.y, snapped.y) - Math.min(currentTool.startCoord.y, snapped.y),
			};

			//Finalize
			if (currentTool.active) {
				shapes.push({
					type: "rect",
					rect: dragRect,
					vertices: [
						coord(dragRect.x, dragRect.y),
						coord(dragRect.x + dragRect.w, dragRect.y),
						coord(dragRect.x + dragRect.w, dragRect.y + dragRect.h),
						coord(dragRect.x, dragRect.y + dragRect.h),
						coord(dragRect.x, dragRect.y), //Close shape
					]
				})
				selectTool(squareTool);
			}
		},
		keydown: (event) => {
			if (event.code === "Escape") {
				currentTool.active = false; //Discard anything in progress
				selectTool(squareTool);
			}
		}
	},

	drawTool: () => {
		const snapped = snapToGrid(mouseToWorld())
		const dragRect = {
			x: Math.min(currentTool.startCoord.x, snapped.x),
			y: Math.min(currentTool.startCoord.y, snapped.y),
			w: Math.max(currentTool.startCoord.x, snapped.x) - Math.min(currentTool.startCoord.x, snapped.x),
			h: Math.max(currentTool.startCoord.y, snapped.y) - Math.min(currentTool.startCoord.y, snapped.y),
		};

		ctx.save();
		ctx.strokeStyle = "#00AA00";
		ctx.strokeRect(
			visualScale * dragRect.x,
			visualScale * dragRect.y,
			visualScale * dragRect.w,
			visualScale * dragRect.h,
		);
		ctx.restore();

		ctx.strokeText(`${dragRect.w * 10}x${dragRect.h * 10} ft`, mouse.x + 25, mouse.y + 25);
	}
}

/** @type {DefaultTool} */
const lineTool = {
	defaultState: {
		name: "Line",
		active: false,

		modeAdditive: false,
		/** @type {Coord[]} */
		lineCoords: [],

		modeSubtractive: false,
		startCoord: {x: 0, y: 0},
	},

	eventHandlers: {
		mousedown: (event) => {
			const mouseButtons = mouseButtonsPressed(event);
			const worldPos = mouseToWorld();
			const snapped = snapToGrid(worldPos);

			//On initial press, go into additive or subtractive mode based on left/right click
			if (!currentTool.active && mouseButtons.right) {
				currentTool.name = "Line (Delete)";
				currentTool.modeSubtractive = true;
				currentTool.startCoord = worldPos;
			}
			else if (!currentTool.active && mouseButtons.any) {
				currentTool.modeAdditive = true;
				currentTool.name = "Line (Draw)";
			}
			currentTool.active = true;

			//When in add-mode, drop a vertex when a button is pressed
			if (currentTool.modeAdditive && mouseButtons.any) {
				currentTool.lineCoords.push(snapped);
			}

			//Any other mousepress while in delete-mode should Discard anything in progress
			if (currentTool.active && currentTool.modeSubtractive && mouseButtons.numPressed > 1) {
				selectTool(lineTool);
			}
		},
		mouseup: (event) => {
			if (!currentTool.active) return;

			const mouseButtons = mouseButtonsPressed(event);
			const endCoord = (currentTool.modeAdditive) ? snapToGrid(mouseToWorld()) : mouseToWorld();
			if (!mouseButtons.any) {
				//Finalize
				if (currentTool.modeAdditive) {
					shapes.push({
						type: "line",
						vertices: [
							...currentTool.lineCoords,
							endCoord
						]
					});
				}
				else {
					//Delete line segments from any shape which intersects w/ the line

					//If would delete a line segment, split the shape into 2 or more shapes
					console.log(`Was ${shapes.length} shapes`);
					shapes = shapes.map(shape => {
						if (doLineIntersectShape(shape, currentTool.startCoord, endCoord)) {
							return splitShape(shape, currentTool.startCoord, endCoord);
						}
						return shape;
					}).flat();
					console.log(`Now ${shapes.length} shapes`);
				}
				selectTool(lineTool);
			}
		},
		keydown: (event) => {
			if (event.code === "Escape") { //Discard anything in progress
				selectTool(lineTool);
			}
		}
	},
	drawTool: () => {
		const endCoord = (currentTool.modeAdditive) ? snapToGrid(mouseToWorld()) : mouseToWorld();
		ctx.save();
		if (currentTool.modeAdditive) ctx.strokeStyle = "#00AA00";
		else ctx.strokeStyle = "#AA0000";
		ctx.beginPath();
		if (currentTool.modeAdditive) {
			for (const [v1, v2] of iterateListSlidingWindow([...currentTool.lineCoords, endCoord])) {
				ctx.moveTo(visualScale * v1.x, visualScale * v1.y);
				ctx.lineTo(visualScale * v2.x, visualScale * v2.y);
			}
		}
		else { //currentTool.modeSubtractive
			ctx.moveTo(
				visualScale * currentTool.startCoord.x,
				visualScale * currentTool.startCoord.y
			);
			ctx.lineTo(
				visualScale * endCoord.x,
				visualScale * endCoord.y
			);
		}
		ctx.stroke();


		if (currentTool.modeSubtractive) {
			ctx.lineWidth = 3;
			ctx.lineCap = "round";
			ctx.strokeStyle = "#aa4400";
			ctx.beginPath();
			//If would delete
			for (const shape of shapes) {
				for (const [v1, v2] of iterateListSlidingWindow(shape.vertices)) {
					if (doLinesIntersect(v1, v2, currentTool.startCoord, endCoord)){
						ctx.moveTo(v1.x * visualScale, v1.y * visualScale);
						ctx.lineTo(v2.x * visualScale, v2.y * visualScale);
					}
				}
			}
			ctx.stroke();
		}
		
		ctx.restore();
	}
};

/** @type {DefaultTool} */
const doorTool = {
	defaultState: {
		name: "Door",
		active: false,

		/** @type {Coord} */
		startCoord: {x: 0, y: 0},
	},

	eventHandlers: {
		mousedown: (event) => {
			const mouseButtons = mouseButtonsPressed(event);
			console.log(mouseButtons);
			const worldPos = mouseToWorld();
			const snapped = snapToGrid(worldPos);

			//On initial press, store initial coordinate and exit early
			if (!currentTool.active) {
				currentTool.active = true;
				currentTool.startCoord = snapped;
				return;
			}

			//Discard if there are more than one button pressed
			if (mouseButtons.numPressed > 1) {
				selectTool(doorTool);
			}
		},
		mouseup: (event) => {
			if (!currentTool.active) return;

			const mouseButtons = mouseButtonsPressed(event);
			const endCoord = snapToGrid(mouseToWorld());

			if (!mouseButtons.any) {	
				shapes.push({
					type: "door",
					subtype: "door-standard",
					vertices: [currentTool.startCoord, endCoord]
				});
				selectTool(doorTool);
			}
		},
		keydown: (event) => {
			if (event.code === "Escape") { //Discard anything in progress
				selectTool(doorTool);
			}
		}
	},
	drawTool: () => {
		const endCoord = snapToGrid(mouseToWorld());
		ctx.save();

		ctx.strokeStyle = "#00AA88";
		ctx.beginPath();
		ctx.moveTo(
			visualScale * currentTool.startCoord.x,
			visualScale * currentTool.startCoord.y
		);
		ctx.lineTo(
			visualScale * endCoord.x,
			visualScale * endCoord.y
		);
		ctx.stroke();

		ctx.restore();
	}
};

//TODO: "ruler" tool for measuring distances. Maybe use manhattan distance? Or Euclidean distance rounded to nearest half-unit?

/*
                                  ____________________________  
 _____                          ,\\    ___________________    \ 
|     `------------------------'  ||  (___________________)   `|
|_____.------------------------._ ||  ____________________     |
                                `//__(____________________)___/ 
*/


/**
 * 
 * @param {Shape} shape where there is at least one intersection with line AB
 * @param {*} A 
 * @param {*} B 
 */
const splitShape = (shape, A, B) => {
	let queue = iterateListSlidingWindow(shape.vertices);

	let multiVerts = [];
	let vert = [queue.at(0)[0]];
	for (const [index, v1v2] of queue.entries()) {
		const [v1, v2] = v1v2;
		if (doLinesIntersect(A, B, v1, v2)) { //Split
			multiVerts.push(vert);
			vert = [v2]
		}
		else {
			vert.push(v2);
		}
	}
	multiVerts.push(vert);


	return multiVerts.filter(
		vertList => vertList.length >= 2 //If a split happened which leaves an orphaned vertex, remove it
	).map(
		vertList => {
			return {type: "line", vertices: vertList}
		}
	);
}

/**
 * 
 * @param {Shape} shape 
 * @param {*} A 
 * @param {*} B 
 */
const doLineIntersectShape = (shape, A, B) => {
	return iterateListSlidingWindow(shape.vertices).map(v1v2 => {
		const [v1, v2] = v1v2;
		return doLinesIntersect(A, B, v1, v2);
	}).includes(true);
}


/**
 * Returns true if points ABC are in Clockwise winding order
 * @param {Coord} A 
 * @param {Coord} B 
 * @param {Coord} C 
 */
const isClockwise = (A, B, C) => {
	return (C.y - A.y) * (B.x - A.x) < (C.x - A.x) * (B.y - A.y);
}

/**
 * Test if line AB and line CD intersect
 * @param {Coord} A 
 * @param {Coord} B 
 * @param {Coord} C 
 * @param {Coord} D 
 */
const doLinesIntersect = (A, B, C, D) => {
	return (
		isClockwise(A, B, C) != isClockwise(A, B, D) &&
		isClockwise(C, D, A) != isClockwise(C, D, B)
	);
}


//////////////////////////
//Main Interaction Hook //
//////////////////////////
/*    jgs
       /
      ()
      ||
      ||
   __  \\
  /  >   \\
  ||` .-"||".
   \\/  _//. `\
    (  (-'  \  \
     \  )   |  |
      `"   /  /
          /  /
         |  (       _
          \  `.-.-.'o`\
           '.( ( ( .--'
             `"`"'`
*/
{
	window.addEventListener("keydown", (event) => {
		if (!userInCanvas) return;

		if (!keyboard.pressedKeys.includes(event.code)) {
			keyboard.pressedKeys.push(event.code);
		}


		if (event.code == "Home") { //Reset camera to worldspace origin
			camera.x = 0;
			camera.y = 0;
			camera.zoomFactor = 1.0;
		}

		if (event.code == "KeyR") increaseZoom();
		if (event.code == "KeyF") decreaseZoom();

		if (event.code == "Space") {
			controller.cameraDragMode = true;
			canvas.style.cursor = "grabbing";
		}

		if (event.code == "KeyQ") decreaseGridSnap();
		if (event.code == "KeyE") increaseGridSnap();

		else if (event.code == "Digit1" && currentTool.name !== squareTool.defaultState.name) {
			selectTool(squareTool);
		}
		else if (event.code == "Digit2" && currentTool.name !== lineTool.defaultState.name) {
			selectTool(lineTool);
		}
		else if (event.code == "Digit3" && currentTool.name !== doorTool.defaultState.name) {
			selectTool(doorTool);
		}
		if (currentTool.eventHandlers.keydown) {
			currentTool.eventHandlers.keydown(event);
		}
	})

	window.addEventListener("keyup", (event) => {
		if (!userInCanvas) return;
		keyboard.pressedKeys = keyboard.pressedKeys.filter(ele => ele != event.code);
		//console.log(`KY: ${event.key}`, typeof(event.key), event.code)
		if (event.code == "Space") {
			controller.cameraDragMode = false;
			canvas.style.cursor = "auto";
		}
		if (currentTool.eventHandlers.keyup) {
			currentTool.eventHandlers.keyup(event);
		}
	})

	canvas.addEventListener("mouseenter", (event) => {
		userInCanvas = true;
	})

	canvas.addEventListener("mouseleave", (event) => {
		userInCanvas = false;
	})

	canvas.addEventListener("wheel", (event) => {
		event.preventDefault();
		if (!event.shiftKey) {
			if (event.deltaY < 0) { //Wheel Up
				increaseZoom();
			}
			if (event.deltaY > 0) { //Wheel Down
				decreaseZoom();
			}
		}
		if (event.shiftKey) {
			if (event.deltaY < 0) { //Wheel Up
				increaseGridSnap();
			}
			if (event.deltaY > 0) { //Wheel Down
				decreaseGridSnap();
			}
		}
	})

	canvas.addEventListener("mousemove", (event) => {
		const rect = canvas.getBoundingClientRect();
		mouse.x = event.clientX - rect.x;
		mouse.y = event.clientY - rect.y;
	})

	canvas.addEventListener("mousedown", (event) => {
		//console.log("Down", event.buttons);

		if (currentTool.eventHandlers.mousedown) {
			currentTool.eventHandlers.mousedown(event);
		}
	})

	canvas.addEventListener("mouseup", (event) => {
		if (currentTool.eventHandlers.mouseup) {
			currentTool.eventHandlers.mouseup(event);
		}
	})
}




/**
 * @param {Coord} coord Coordinate in world-space
 * @returns {Coord} The closest snap-point in world-space
 */
const snapToGrid = (coord) => {
	const snapScale = controller.snapScale;
	const unsnapX = coord.x / snapScale;
	const unsnapY = coord.y / snapScale;

	//Determine the direction of "towards the origin" depending on the sign of the coordinate
	const snapXawayFromOrigin = (unsnapX >= 0) ? Math.ceil  : Math.floor;
	const snapXtowardsOrigin  = (unsnapX >= 0) ? Math.floor : Math.ceil;

	const snapYawayFromOrigin = (unsnapY >= 0) ? Math.ceil  : Math.floor;
	const snapYtowardsOrigin  = (unsnapY >= 0) ? Math.floor : Math.ceil;

	const fractionalX = Math.abs(unsnapX - Math.trunc(unsnapX));
	const fractionalY = Math.abs(unsnapY - Math.trunc(unsnapY));

	//If the fractional part of the coordinate is more than 0.5, snap away from the origin
	const snappedX = (fractionalX >= 0.5) ? snapXawayFromOrigin(unsnapX) : snapXtowardsOrigin(unsnapX);
	const snappedY = (fractionalY >= 0.5) ? snapYawayFromOrigin(unsnapY) : snapYtowardsOrigin(unsnapY);

	return {
		x: snappedX * snapScale,
		y: snappedY * snapScale,
	}
}

/**
 * @template T
 * @param {T[]} list 
 * @param {boolean} includeFirstNLast With a list of ABC, will return [AB, BC] when false or [AB, BC, CA] when true
 * @returns 
 */
const iterateListSlidingWindow = (list, includeFirstNLast = false) => {
	return [
		...list.slice(0, -1).map((element, index) => [element, list[index+1]]),
		...[(includeFirstNLast) ? [list[0], list[list.length-1]] : undefined]
	].filter(e => e);
}









/*
            _
           H||
           H||
 __________H||___________
[|.......................|
||.........## --.#.......|
||.........   #  # ......|            @@@@
||.........     *  ......|          @@@@@@@
||........     -^........|   ,      - @@@@
||.....##\        .......|   |     '_ @@@
||....#####     /###.....|   |     __\@ \@
||....########\ \((#.....|  _\\  (/ ) @\_/)____
||..####,   ))/ ##.......|   |(__/ /     /|% #/
||..#####      '####.....|    \___/ ----/_|-%/
||..#####\____/#####.....|       ,:   '(
||...######..######......|       |:     \
||.....""""  """"...b'ger|       |:      )
[|_______________________|       |:      |
       H||_______H||             |_____,_|
       H||________\|              |   / (
       H||       H||              |  /\  )
       H||       H||              (  \| /
      _H||_______H||__            |  /'=.
    H|________________|           '=>/  \
                                 /  \ /|/
                               ,___/|

*/
const drawShapes = () => {
	ctx.save();
	ctx.beginPath();
	for (const shape of shapes) {
		
		//TODO: not updated yet
		if (shape.type === "door") {
			const [v1, v2] = shape.vertices;
			const dwidth = 0.3;
			const lenBeforeDoor = 0.25;
			if (v1.x == v2.x) {
				//Vert door
				ctx.rect(
					(v1.x - dwidth/2) * visualScale,
					(Math.min(v1.y, v2.y) + lenBeforeDoor) * visualScale,
					dwidth * visualScale,
					(Math.abs(v2.y - v1.y) - 2 * lenBeforeDoor) * visualScale
				);
				ctx.moveTo(v1.x * visualScale, v1.y * visualScale);
				ctx.lineTo(v1.x * visualScale, (v1.y + lenBeforeDoor * ((v1.y > v2.y) ? -1 : 1)) * visualScale);
				ctx.moveTo(v2.x * visualScale, v2.y * visualScale);
				ctx.lineTo(v2.x * visualScale, (v2.y - lenBeforeDoor * ((v1.y > v2.y) ? -1 : 1)) * visualScale);
			}
			else if (v1.y == v2.y) {
				//Horiz door
				ctx.rect(
					(Math.min(v1.x, v2.x) + lenBeforeDoor) * visualScale,
					(v1.y - dwidth/2) * visualScale,
					(Math.abs(v2.x - v1.x) - 2 * lenBeforeDoor) * visualScale,
					dwidth * visualScale
				);
				ctx.moveTo(v1.x * visualScale, v1.y * visualScale);
				ctx.lineTo((v1.x + lenBeforeDoor * ((v1.x > v2.x) ? -1 : 1)) * visualScale, v1.y * visualScale);
				ctx.moveTo(v2.x * visualScale, v2.y * visualScale);
				ctx.lineTo((v2.x - lenBeforeDoor * ((v1.x > v2.x) ? -1 : 1)) * visualScale, v2.y * visualScale);
			}
			else {
				ctx.moveTo(v1.x * visualScale, v1.y * visualScale);
				ctx.lineTo(v2.x * visualScale, v2.y * visualScale);
			}
			continue;
		}

		for (const [v1, v2] of iterateListSlidingWindow(shape.vertices)) {
			const [sc1, sc2] = [worldToScreen(v1), worldToScreen(v2)]
			ctx.moveTo(sc1.x, sc1.y);
			ctx.lineTo(sc2.x, sc2.y);
		}
	}
	ctx.stroke();
	ctx.restore();
}

const imposeGridHatching = () => {
	const cam = cameraAsRect();
	const worldX = Math.floor(cam.x);
	const worldY = Math.ceil(cam.y);

	ctx.save();
	ctx.strokeStyle = "#3AA1A580"
	ctx.beginPath()
	for (let wy = worldY; wy > cam.y - cam.h; wy--) {
		const {y} = worldToScreen(coord(0, wy));
		ctx.moveTo(0, y);
		ctx.lineTo(ctx.canvas.width, y);
	}
	for (let wx = worldX; wx < cam.x + cam.w; wx++) {
		const {x} = worldToScreen(coord(wx, 0));
		ctx.moveTo(x, 0);
		ctx.lineTo(x, ctx.canvas.height);
	}
	ctx.stroke();
	ctx.restore();
}

const drawMouseIndicator = () => {
	const snapped = snapToGrid(mouseToWorld())
	const drawLocation = worldToScreen(snapped);
	ctx.beginPath();
	ctx.arc(drawLocation.x, drawLocation.y, 2.5, 0, Math.PI * 2);
	ctx.stroke();
}



const draw = () => {
	{
		ctx.font = "25px serif";
		ctx.strokeStyle = "#000000";
		ctx.fillStyle = "#DDDDDD";
	}
	ctx.save();
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	
	ctx.beginPath();
	const origin = worldToScreen(coord(0, 0));
	ctx.arc(origin.x, origin.y, 5, 0, Math.PI * 2);
	ctx.fill();
	ctx.stroke();
	ctx.restore();

	imposeGridHatching();

	drawShapes();
	drawMouseIndicator();

	//Tool
	if (currentTool.active) {
		currentTool.drawTool();
	}

	const ttt = canvas.getBoundingClientRect()
	ctx.strokeText(
		`Tool: ${currentTool.name}`,
		ctx.canvas.width - 180,
		ctx.canvas.height - 65
	);
	ctx.strokeText(
		`Zoom: ${camera.zoomFactor}`,
		ctx.canvas.width - 180,
		ctx.canvas.height - 35
	);
	ctx.strokeText(
		`Snapscale: ${controller.snapScale * 10} ft`,
		ctx.canvas.width - 180,
		ctx.canvas.height - 5
	);
}









/**
 * @param {number} deltaTime Time since last frame in seconds
 */
const update = (deltaTime) => {
	if (!userInCanvas) return;
	const speed = 10.0 / camera.zoomFactor;
	const mod = speed * deltaTime;

	if (keyboard.pressedKeys.includes("KeyD")) camera.x += speed * deltaTime;
	if (keyboard.pressedKeys.includes("KeyA")) camera.x -= speed * deltaTime;
	if (keyboard.pressedKeys.includes("KeyW")) camera.y += speed * deltaTime;
	if (keyboard.pressedKeys.includes("KeyS")) camera.y -= speed * deltaTime;
}


/**
 * 
 * @param {DOMHighResTimeStamp} currentFrametime 
 */
const processFrame = (currentFrametime) => {
	const deltaTime = (currentFrametime - lastFrametime) / MILLISECONDS_PER_SECOND;
	lastFrametime = currentFrametime;

	update(deltaTime);
	draw(); //AKA render

	requestAnimationFrame(processFrame);
}




const CURRENT_DATA_VERSION = 1;
const getStateForSaving = () => {
	return {
		dataVersion: CURRENT_DATA_VERSION,
		shapes: shapes,
	}
}
/**
 * 
 * @param {{dataVersion: number}} obj 
 */
const loadStateFromObject = (obj) => {
	console.log(`Loading data-version: ${obj.dataVersion}`);
	if (obj.dataVersion > CURRENT_DATA_VERSION) {
		console.error(`Cannot Load: file data version is ${obj.dataVersion}, latest is ${CURRENT_DATA_VERSION}`);
		return;
	}
	if (obj.dataVersion < CURRENT_DATA_VERSION) {
		//PERFORM MIGRATION
	}

	
	shapes = obj.shapes;
	console.log(`Loaded ${shapes.length} shapes`);
}

const downloadMap = () => {
	const url = URL.createObjectURL(
		new Blob([JSON.stringify(getStateForSaving(), null, '\t')], {type: "application/json"}
	));

	const link = document.createElement("a");
	link.setAttribute("href", url);
	link.setAttribute("download", "mymap.json");
	link.click();

	document.body.removeChild(link);
	URL.revokeObjectURL(link);
}

document.getElementById("fileInput").addEventListener("change", (event) => {
	if (!(event.target.files) || event.target.files.length < 1) return;
	const file = event.target.files[0];

	const reader = new FileReader();
	reader.onload = (e) => {
		try {
			const result = JSON.parse(e.target.result);
			loadStateFromObject(result);
		}
		catch (err) {
			console.error(`Invalid JSON format:`, err)
		}
	}
	reader.readAsText(file);
})




console.log(cameraAsRect())

selectTool(lineTool);
requestAnimationFrame(processFrame);











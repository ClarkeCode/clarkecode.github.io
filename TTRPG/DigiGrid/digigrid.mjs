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
 * @property {"line"|"rect"} type Currently either "line" or "rect"
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
		left:    event.buttons & 1,
		right:   event.buttons & 2,
		middle:  event.buttons & 4,
		back:    event.buttons & 8,
		forward: event.buttons & 16
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
/**
 * @type {CanvasRenderingContext2D}
 */
const ctx = canvas.getContext("2d");

let visualScale = 25;
let userInCanvas = false;

let mouse = {
	x: 0,
	y: 0,
}
let controller = {
	cameraDragMode: false,
	snapScale: 1,
}
/**
 * @type {Shape[]}
 */
let shapes = [
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
			const snapped = snapToGrid(mouseToWorld());

			//On initial press, go into additive or subtractive mode based on left/right click
			if (!currentTool.active && mouseButtons.right) {
				currentTool.name = "Line (Delete)";
				currentTool.modeSubtractive = true;
				currentTool.startCoord = snapped;
				//console.log(currentTool)
			}
			else if (!currentTool.active && mouseButtons.any) {
				currentTool.modeAdditive = true;
				currentTool.name = "Line (Draw)";
			}
			currentTool.active = true;


			//When in add-mode, drop a vertex when another button is pressed
			if (currentTool.modeAdditive && mouseButtons.any) {
				currentTool.lineCoords.push(snapped);
			}

			//Any other mousepress while in delete-mode should Discard anything in progress
			if (currentTool.active && currentTool.modeSubtractive &&
				(mouseButtons.left || mouseButtons.middle || mouseButtons.back || mouseButtons.forward)
			) {
				selectTool(lineTool);
			}
		},
		mouseup: (event) => {
			if (!currentTool.active) return;

			const mouseButtons = mouseButtonsPressed(event);
			const snapped = snapToGrid(mouseToWorld());
			if (!mouseButtons.any) {
				//Finalize
				if (currentTool.modeAdditive) {
					shapes.push({
						type: "line",
						vertices: [
							...currentTool.lineCoords,
							snapped
						]
					});
				}
				else {
					//Delete line segments from any shape which intersects w/ the line

					//If would delete a line segment, split the shape into 2 or more shapes
					console.log(`Was ${shapes.length} shapes`);
					shapes = shapes.map(shape => {
						if (doLineIntersectShape(shape, currentTool.startCoord, snapped)) {
							return splitShape(shape, currentTool.startCoord, snapped);
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
		const snapped = snapToGrid(mouseToWorld());
		ctx.save();
		if (currentTool.modeAdditive) ctx.strokeStyle = "#00AA00";
		else ctx.strokeStyle = "#AA0000";
		ctx.beginPath();
		if (currentTool.modeAdditive) {
			for (const [v1, v2] of iterateListSlidingWindow([...currentTool.lineCoords, snapped])) {
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
				visualScale * snapped.x,
				visualScale * snapped.y
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
					if (doLinesIntersect(v1, v2, currentTool.startCoord, snapped)){
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
 * @param {Shape} shape where there is at least one intersection with the line
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
		//console.log(`KY: ${event.key}`, typeof(event.key), event.code)
		if (event.code == "Space") {
			controller.cameraDragMode = true;
			canvas.style.cursor = "grabbing";
		}
		else if (event.code == "KeyQ" || event.code == "KeyE") {
			if (event.code == "KeyQ" && controller.snapScale > 1) {controller.snapScale /= 2;}
			if (event.code == "KeyE" && controller.snapScale < 4) {controller.snapScale *= 2;}
		}
		else if (event.code == "Digit1" && currentTool.name !== squareTool.defaultState.name) {
			selectTool(squareTool);
		}
		else if (event.code == "Digit2" && currentTool.name !== lineTool.defaultState.name) {
			selectTool(lineTool);
		}
		if (currentTool.eventHandlers.keydown) {
			currentTool.eventHandlers.keydown(event);
		}
		draw();
	})

	window.addEventListener("keyup", (event) => {
		if (!userInCanvas) return;
		//console.log(`KY: ${event.key}`, typeof(event.key), event.code)
		if (event.code == "Space") {
			controller.cameraDragMode = false;
			canvas.style.cursor = "auto";
		}
		if (currentTool.eventHandlers.keyup) {
			currentTool.eventHandlers.keyup(event);
		}
		draw();
	})

	canvas.addEventListener("mouseenter", (event) => {
		userInCanvas = true;
		//console.log("URIN");
	})

	canvas.addEventListener("mouseleave", (event) => {
		userInCanvas = false;
		//console.log("UROUT");
	})
	canvas.addEventListener("mousemove", (event) => {
		const rect = canvas.getBoundingClientRect();
		mouse.x = event.clientX - rect.x;
		mouse.y = event.clientY - rect.y;
		//"Canvas coordinate-space"

		//console.log("Mo2ve", mouse);
		draw();
	})

	canvas.addEventListener("mousedown", (event) => {
		//console.log("Down", event.buttons);

		if (currentTool.eventHandlers.mousedown) {
			currentTool.eventHandlers.mousedown(event);
		}
		draw();
	})

	canvas.addEventListener("mouseup", (event) => {
		//console.log("Up", event.buttons);
		//dragger.isDragging = false;
		if (currentTool.eventHandlers.mouseup) {
			currentTool.eventHandlers.mouseup(event);
		}
		draw();
	})
}



const mouseToWorld = () => {
	return {
		x: mouse.x / visualScale,
		y: mouse.y / visualScale,
	}
}

/**
 * @param {Coord} coord 
 * @returns {Coord}
 */
const snapToGrid = (coord) => {
	const snapScale = controller.snapScale;
	const unsnapX = coord.x / snapScale;
	const unsnapY = coord.y / snapScale;

	const [xint, xfrac] = [Math.floor(unsnapX), unsnapX - Math.trunc(unsnapX)];
	const [yint, yfrac] = [Math.floor(unsnapY), unsnapY - Math.trunc(unsnapY)];

	const snappedX = (() => {
		if (xfrac >= 0.75) return xint + 1;
		else if (xfrac >= 0.25) return xint + 0.5;
		return xint;
	})();

	const snappedY = (() => {
		if (yfrac >= 0.75) return yint + 1;
		else if (yfrac >= 0.25) return yint + 0.5;
		return yint;
	})();

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
	for (const shape of shapes) {
		if (shape.drawCustom) shape.drawCustom();
	}
	ctx.restore();


	ctx.save();
	ctx.strokeStyle = "#000000";
	ctx.fillStyle = "#DDDDDD";
	ctx.beginPath();
	for (const shape of shapes) {
		//let isClosedShape = false;
		//if (shape.type === "rect") isClosedShape = true;
		//if (shape.type === "line") isClosedShape = false;

		for (const [v1, v2] of iterateListSlidingWindow(shape.vertices)) {
			ctx.moveTo(v1.x * visualScale, v1.y * visualScale);
			ctx.lineTo(v2.x * visualScale, v2.y * visualScale);
		}
	}
	ctx.stroke();
	ctx.restore();
}

const imposeGridHatching = () => {
	ctx.save();
	ctx.strokeStyle = "#3AA1A580"
	ctx.beginPath()
	for (let y = 0; y < 20; y++) {
		ctx.moveTo(-10, y * visualScale);
		ctx.lineTo(ctx.canvas.width+10, y * visualScale);
	}
	for (let x = 0; x < 20; x++) {
		ctx.moveTo(x * visualScale, -10);
		ctx.lineTo(x * visualScale, ctx.canvas.height+10);
	}
	ctx.stroke();
	ctx.restore();
}

const drawMouseIndicator = () => {
	const snapped = snapToGrid(mouseToWorld())
	ctx.beginPath();
	ctx.arc(snapped.x * visualScale, snapped.y * visualScale, 2.5, 0, Math.PI * 2);
	ctx.stroke();
}



const draw = () => {
	{
		ctx.font = "25px serif";
		ctx.strokeStyle = "#000000";
		ctx.fillStyle = "#DDDDDD";
	}
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	imposeGridHatching();

	drawShapes();
	drawMouseIndicator();

	//Tool
	if (currentTool.active) {
		currentTool.drawTool();
	}

	ctx.strokeText(`Tool: ${currentTool.name}`, 20, ctx.canvas.height - 35);
	ctx.strokeText(`Snapscale: ${controller.snapScale * 5} ft`, 20, ctx.canvas.height - 5);
}







selectTool(lineTool);
draw();




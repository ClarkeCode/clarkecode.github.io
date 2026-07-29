/**
 * @typedef Tool
 * @property {string} name
 * @property {boolean} active
 * @property {{
 * 	mousedown?: (event: MouseEvent) => {}
 * 	mouseup?: 	(event: MouseEvent) => {}
 * 	keydown?: 	(event: KeyboardEvent) => {}
 * 	keyup?:   	(event: KeyboardEvent) => {}
 * }} eventHandlers
 * @property {() => {}} drawTool
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
	console.log("TT", point, rect)
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


//TODO: cutting lots of shapes is slow after a while, why?
// Perhaps giving a bounding box so we can quickly dismiss shapes that are definately not intersected by the cutter?





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
	snapScale: 2,
}
/**
 * @type {{type: string, vertices: Coord[]}[]}
 */
let shapes = [
	{
		type: "line",
		vertices: [coord(10,10), coord(14,14), coord(18,10)]
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

let verts = [];







/** @type {Tool} */
const draggerTool = {
	name: "Dragger",
	active: false,
	startCoord: {x: 0, y: 0},
	additive: true,

	eventHandlers: {
		mousedown: (event) => {
			const mouseButtons = mouseButtonsPressed(event);
			if (currentTool.active && mouseButtons.right) { //Right click while dragging should cancel as if user pressed "Escape"
				currentTool.active = false;
				return;
			}

			currentTool.active = true;
			currentTool.additive = !mouseButtons.right;
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

			//Additive
			if (currentTool.active && currentTool.additive) {
				console.log("ADD", dragRect);
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
			}

			//Subtractive
			else if (currentTool.active && !currentTool.additive) {
				for (let shape of shapes) {
					if (shape.type === "rect" && isIntersectingRects(shape.rect, dragRect)) {
						console.log("COLLIDE", shape.rect);
						shape.drawCustom = () => {
							ctx.save();
							ctx.moveTo(0,0);
							console.log("DRAWC", shape.rect);
							console.log("DRAWCV", shape.vertices);
							ctx.fillStyle = "#FF880080";
							ctx.fillRect(
								visualScale * shape.rect.x, 
								visualScale * shape.rect.y, 
								visualScale * shape.rect.w, 
								visualScale * shape.rect.h
							);
							ctx.restore();
						}
					}


					let intersections = [];
					for (const [v1, v2] of iterateListSlidingWindow(shape.vertices)) {
						const res = lineIntersectionsWithRect(v1, v2, dragRect);
						if (res.length > 0) {
							intersections.push(...res);
						}
					}

					//console.log("Shape Intersect", intersections);
					verts.push(...intersections);

					//console.log("SPLITSHAPE", splitShapeByRect(shape.vertices, dragRect));

					//for (const v of shape.vertices) {
					//	if (isPointInRect(v, dragRect)) {
					//		verts.push(v);
					//	}
					//}
				}
				shapes = shapes.map(shape => splitShapeByRect(shape.vertices, dragRect)).flat();
			}
			currentTool.active = false
			console.log(shapes);
		},
		keydown: (event) => {
			console.log("E HANDLER");
			if (event.code === "Escape") {
				currentTool.active = false; //Discard anything in progress
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
		ctx.strokeStyle = currentTool.additive ? "#00AA00" : "#FF0000";
		ctx.strokeRect(
			visualScale * dragRect.x,
			visualScale * dragRect.y,
			visualScale * dragRect.w,
			visualScale * dragRect.h,
		);
		ctx.restore();

		ctx.font = "25px serif"
		ctx.strokeText(`${dragRect.w * 10}x${dragRect.h * 10} ft`, mouse.x + 25, mouse.y + 25);
	}
}

/** @type {Tool} */
const lineTool = {
	name: "Line",
	active: false,
	
	/** @type {Coord[]} */
	lineCoords: [],

	eventHandlers: {
		mousedown: (event) => {
			const mouseButtons = mouseButtonsPressed(event);
			const snapped = snapToGrid(mouseToWorld());
			if (mouseButtons.any) {
				currentTool.active = true;
				currentTool.lineCoords.push(snapped);
			}
			console.log(currentTool.lineCoords);
		},
		mouseup: (event) => {
			const mouseButtons = mouseButtonsPressed(event);
			const snapped = snapToGrid(mouseToWorld());
			if (!mouseButtons.any) {
				currentTool.active = false;
				//Finalize
				shapes.push({
					type: "line",
					vertices: [
						...currentTool.lineCoords,
						snapped
					]
				});
				currentTool.lineCoords = [];
			}
		},
		keydown: (event) => {
			if (event.code === "Escape") { //Discard anything in progress
				currentTool.active = false;
				currentTool.lineCoords = [];
			}
		}
	},
	drawTool: () => {
		const snapped = snapToGrid(mouseToWorld());
		ctx.save();
		ctx.strokeStyle = "#00AA00";
		ctx.beginPath();
		console.log(currentTool.lineCoords);
		console.log(iterateListSlidingWindow([...currentTool.lineCoords, snapped]));
		for (const [v1, v2] of iterateListSlidingWindow([...currentTool.lineCoords, snapped])) {
			ctx.moveTo(v1.x * visualScale, v1.y * visualScale);
			ctx.lineTo(v2.x * visualScale, v2.y * visualScale);
		}
		ctx.stroke();
		ctx.restore();
	}
};

let currentTool = draggerTool;



/**
 * @param {Coord[]} vertices 
 * @param {Rect} eraseRect 
 */
const splitShapeByRect = (vertices, eraseRect) => {
	let output = [];
	/** @type {Coord[]} */
	let strip = [];
	//debugger;
	for (const [v1, v2] of iterateListSlidingWindow(vertices)) {
		console.log("V", v1, v2);
		const [within1, within2] = [
			isPointInRect(v1, eraseRect),
			isPointInRect(v2, eraseRect)
		];
		const intersections = lineIntersectionsWithRect(v1, v2, eraseRect);

		//outside / outside
		if (!within1 && !within2) {
			//		-> line is totally outside rect, [v1, v2]
			if (intersections.length == 0) {
				strip.push(v1, v2);
			}
			//		-> line is intersected twice; finalize and start a new shape [v1, i1], [i2, v2]
			else {
				const [i1, i2] = intersections;
				console.log("GGG", v1, v2);
				console.log("III", intersections);

				strip.push(v1, i1);
				output.push(strip);
				strip = [];

				strip.push(i2, v2);
			}
		}
		//outside / inside -> [v1, i1] //Finalize this new shape
		else if (!within1 && within2) {
			strip.push(v1, ...intersections);
			output.push(strip);
			strip = [];
		}
		//inside / outside -> [i1, v2] //Begin new shape
		else if (within1 && !within2) {
			strip.push(...intersections, v2);
		}
		//inside / inside -> line is totally within rect, ignore both
		else {}
	}
	if (strip.length > 0) {
		output.push(strip);
	}
	console.log("FINI", output.length);
	return output.map(vertices => {
		return {
			type: "line",
			vertices: vertices
		}
	});
}

//////////////////////////
//Main Interaction Hook //
//////////////////////////
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
		else if (event.code == "Digit1" && currentTool.name !== draggerTool.name) {
			currentTool = draggerTool;
		}
		else if (event.code == "Digit2" && currentTool.name !== lineTool.name) {
			currentTool = lineTool;
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

/**
 * 
 * @param {Coord} v1 
 * @param {Coord} v2 
 * @param {{x?: number, y?: number}} testPlane 
 */
const lineCrossesPlane = (v1, v2, testPlane) => {
	const slope = (v2.y - v1.y) / (v2.x - v1.x);
	// y = mx + b
	// y - b = mx
	//-b = mx - y
	// b = y - mx
	const interceptX = v1.y - slope * v1.x;
	// y = mx + b
	// (y-b)/m = x


	if (testPlane.x) {
		const [lowX, highX] = [Math.min(v1.x, v2.x), Math.max(v1.x, v2.x)];
		if (lowX < testPlane.x && testPlane.x < highX) {
			return coord(testPlane.x, slope * testPlane.x + interceptX);
		}
		return undefined;
	}
}

/**
 * 
 * @param {Coord} v1 
 * @param {Coord} v2 
 * @param {Rect} rect 
 */
const lineIntersectionsWithRect = (v1, v2, rect) => {
	const [lineXMin, lineXMax] = [Math.min(v1.x, v2.x), Math.max(v1.x, v2.x)];
	const [lineYMin, lineYMax] = [Math.min(v1.y, v2.y), Math.max(v1.y, v2.y)];
	//Special case: vertical line
	if (v1.x === v2.x) {
		if (isWithin(rect.x, v1.x, rect.x + rect.w)) {
			//console.log("INTERSECT VERT LINE")
			//Project line onto rectangle and keep coords if they are within the original line segment
			return [
				coord(v1.x, rect.y),
				coord(v1.x, rect.y + rect.h)
			].filter(coord => isWithin(
				lineYMin, coord.y, lineYMax
			));
		}
		return [];
	}

	//Special case: horizontal line
	else if (v1.y === v2.y) {
		if (isWithin(rect.y, v1.y, rect.y + rect.h)) {
			//console.log("INTERSECT HORIZ LINE")
			return [
				coord(rect.x, v1.y),
				coord(rect.x + rect.w, v1.y)
			].filter(coord => isWithin(
				lineXMin, coord.x, lineXMax
			));
		}
		return [];
	}

	const slope = (v2.y - v1.y) / (v2.x - v1.x);
	// y = mx + b
	// y - b = mx
	//-b = mx - y
	// b = y - mx
	const interceptX = v1.y - slope * v1.x;
	// y = mx + b
	// (y-b)/m = x

	const yLine = (x) => slope * x + interceptX;   //y = mx + b
	const xLine = (y) => (y - interceptX) / slope; //x = (y-b)/m
	//console.log("INTERSECT SLOPE LINE")

	const a = [
		coord(rect.x, yLine(rect.x)),
		coord(rect.x + rect.w, yLine(rect.x + rect.w)),
		coord(xLine(rect.y), rect.y),
		coord(xLine(rect.y + rect.h), rect.y + rect.h)
	].filter(coord => {
		return (
			isWithin(lineXMin, coord.x, lineXMax) &&
			isWithin(lineYMin, coord.y, lineYMax) &&
			isWithin(rect.x, coord.x, rect.x + rect.w) &&
			isWithin(rect.y, coord.y, rect.y + rect.h)
		);
	});

	return a;
}

console.log(
	lineCrossesPlane(coord(1,0), coord(3,1), {x: 2})
)

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

		for (const [v1, v2] of iterateListSlidingWindow(shape.vertices//, isClosedShape

		)) {
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









const draw = () => {
	ctx.save();
	ctx.strokeStyle = "#000000";
	ctx.fillStyle = "#DDDDDD";
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.restore();

	imposeGridHatching();

	drawShapes();

	ctx.strokeStyle = "#000000";
	ctx.fillStyle = "#CCCCCC";

	ctx.save();
	ctx.fillStyle = "#FF4444";
	for (const v of verts) {
		ctx.beginPath();
		ctx.arc(v.x * visualScale, v.y * visualScale, 2.5, 0, Math.PI * 2);
		ctx.fill();
	}

	ctx.restore();


	//const comp = new Path2D();
	//comp.rect(50, 50, 300, 100);
	//comp.rect(100, 0, 100, 200);
	//ctx.stroke(comp);


	const snapped = snapToGrid(mouseToWorld())
	ctx.beginPath();
	ctx.arc(snapped.x * visualScale, snapped.y * visualScale, 2.5, 0, Math.PI * 2);
	ctx.stroke();


	if (currentTool.active) {
		currentTool.drawTool();
	}

	ctx.strokeText(`Tool: ${currentTool.name}`, 20, ctx.canvas.height - 35);
	ctx.strokeText(`Snapscale: ${controller.snapScale * 5} ft`, 20, ctx.canvas.height - 5);
}

draw();
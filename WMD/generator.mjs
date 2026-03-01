//https://edwardtufte.github.io/tufte-css/
//https://kyl.neocities.org/books/%5BTEC%20TUF%5D%20the%20visual%20display%20of%20quantitative%20information.pdf

import { parseMarkdown, renderMarkdownToHTML, processLine, MDFlag } from "./mdProcessor.mjs";

/**
 * @typedef {Object} Gear
 * @property {string} name
 * @property {number|null} price
 * @property {string} description
 */

/**
 * @type {Gear[]}
 */
const enhancements = [
	{name: "Skeleton Arm", price: 150, description: "Named for its skeletal appearance, this crude prosthetic arm lacks sense feedback. While providing the basic manipulation, the user must be able to see. !!+1 Difficulty to tests where objects are not visible.!!"},
	{name: "Skeleton Leg", price: 150, description: "Named for its skeletal appearance, this crude prosthetic leg lacks sense feedback. While providing the basic function of walking, it has a noticeable abnormal gait. !!+1 Difficulty to [[Blend In]] tests.!!"},
	{name: "Mechano-Arm", price: 1000, description: "A sturdy mechanical arm with sense feedback. Room for one enhancement."},
	{name: "Mechano-Leg", price: 1000, description: "A sturdy mechanical leg with sense feedback. Room for one enhancement."},
	{name: "Intravenous Port", price: 100, description: "Allows non-alchemists to inject alchemical [[Infusions]] or less reputable substances. Often seen on the necks and arms of soldiers and addicts."},
	{name: "Dolman's Liver", price: 500, description: "Created by targeted application of polarized æther, a Dolman's Liver permanently increases the body's ability to process toxins. !!Add +1 die to [[Grit Teeth]] tests involving poison or toxin.!!"},
	{name: "Finger Gun", price: 250, description: "This artificial finger conceals a single-shot derringer. Can be used by fleshy or prosthetic hands."},
	//{name: "Mergills", price: 500, description: ""},
	{name: "Prosthetic Eye", price: 150, description: "A prosthetic eye connected to the optic nerves. Lenses made from inferior quality machined glass make focusing hard for the wearer. !!+1 Difficulty for [[Reaction Speed]] tests relying on sight.!!"},
	{name: "Mechano-Eye", price: 500, description: "Precision-machined crystals reproduce natural sight. Room for one enhancement."},
	{name: "", price: null, description: ""},
];

/**
 * @type {Gear[]}
*/
const gear = [
	{name: "Auto-Scribe", price: 200, description: "Pressing the carefully machined glass lens against writing lets the auto-scribe copy the document. At a rate of 6 pages per minute, the encoded instructions to replicate the writing is typewritten into the attached metal drum. Roughly the size of a brick."},
	{name: "Quickwire", price: 50, description: "50m of wire made from a copper-silver alloy. Used to connect ætheric devices."},
	{name: "Lead-Plated Quickwire", price: 150, description: "50m of Quickwire. Lead plating prevents external disruption or inspection of signals. Used to connect ætheric devices."},
	{name: "Quickwire Tap", price: 100, description: "Allows you to tap into an existing quickwire network. Unless specified, the tap allows signals to enter but not exit your sub-network."},
	{name: "Compact Telegraph", price: 200, description: "A favourite amongst less scrupulous gamblers. Operated by a spring-loaded lever, compact telegraphs transmit a series of dots and dashes. Can be connected by [[Quickwire]]."},
	{name: "Remote Transceiver", price: 200, description: "Vibrating crystals allow for signal transmission and reception at a distance. Transmissions are blocked by 3 floors of a building, large amounts of stone, or any quantity of lead. Dials allow you to tune transceivers to particular wavelengths. Compatable with [[Quickwire]] networks."},
	{name: "Manual Trigger", price: 50, description: "Comfortably held in one's hand, a manual trigger can be used with [[Quickwire]] to activate ætheric devices or detonate explosives."},
	{name: "Tripwire Trigger", price: 50, description: "A thin wire is suspended between two points, typically at foot level. Activates connected explosive or ætheric devices when the wire is removed. The signal can be transmitted by [[Quickwire]]."},
	{name: "Microphone Bug", price: 100, description: "A small microphone records nearby sounds. Powered by a small æther resevoir, it can transmit signals over [[Quickwire]]."},
	{name: "Headset", price: 250, description: "Two earphones are connected by an adjustable armature; designed to reproduce sounds at a distance. Has a small clip designed to connect to [[Quickwire]]."},
	{name: "Speaker", price: 100, description: "A metal mesh designed to reproduce sounds at a distance. Has a dial to control volume. Can receive signals over [[Quickwire]]."},
	{name: "Suitcase", price: 10, description: "A portable container large enough to store several changes of clothes. Common accessory."},
	{name: "Lead-Lined Suitcase", price: 200, description: "A portable container with a special lining. Lead behind the inner lining prevents remote inspection of the bag's contents or æther leakage from exiting."},
	{name: "Cigarettes", price: 10, description: "A carton of 'Strike it Rich: Dwarves Choice' cigarettes."},
	{name: "", price: null, description: ""},
];

/**
 * @type {Gear[]}
*/
const grenades = [
	{
		name: "Smoke Grenade", price: 50,
		description: "Oily smoke obscures the affected area for 1 minute (20 rounds). !!+1 Difficulty to actions or targeting enemies obscured by smoke.!!"
	},
	{
		name: "Peppergas Grenade", price: 50,
		description: "Puffs of aerosolized irritants cloud the air. All characters in the affected area must pass a [[Grit Teeth]] (1) test or have the Damaged Eyes status for 1 minute (20 rounds). !!Characters with damaged eyes have +1 Difficulty to tests which require vision.!!"
	},
	{
		name: "Improvised Explosive", price: 50,
		description: "An explosive device cobbled together with improvised materials. If the explosive detonates, it deals 5d6 damage to all affected characters. !!Roll a d6: On a 1 something prevents the explosive from detonating.!!"
	},
	{
		name: "Explosive Grenade", price: 100,
		description: "A grenade designed to eject deadly shrapnel. When the grenade detonates it deals 6d6 damage to all affected characters. !!Armoured characters which take damage from the explosion gain 2 [[Shatter]] points instead of 1.!!"
	},
	{
		name: "Breaching Charge", price: 200,
		description: "A device designed to destroy buildings with a focused explosion. Once activated, the charge detonates after a 6-second (2 round) delay, dealing 8d6 damage in a 1x1 square area. !!The damage dealt by the charge is doubled against objects.!!"
	},
	{
		name: "Alchemist’s Fire", price: 100,
		description: "Burning propellants coats the affected area for 1 minute (20 rounds). Characters which start their turn or pass through the affected area are lit on fire. Burning characters are dealt 2 damage directly to their HP at the end of their turn. Burning characters can spend an [[Action]] to extinguish themselves."
	},
	{
		name: "Phosphorous Flasher", price: 100,
		description: "The flasher detonates in bright flash and loud boom. All characters in the affected area must pass a [[Grit Teeth]](2) test or have damaged eyes and ears for 1 minute (20 rounds). !!Characters with damaged eyes have +1 Difficulty to tests which require vision. Characters with damaged ears have +1 Difficulty to tests which require hearing.!!"
	},
	{
		name: "Sleeping Gas Grenade", price: 500,
		description: "Artificial chemicals mix to create a strong soporific gas. All characters in the affected area must pass a [[Grit Teeth]] (1) test or fall asleep for 1 minute (20 rounds). Sleeping characters fall Prone and are unconscious for the duration unless they take damage or another character takes an [[Action]] to shake them awake."
	},
	{
		name: "Mustard Gas Grenade", price: 500,
		description: "Noxious emissions burn and choke all unfortunate enough to be exposed to the ghostly yellow gas. All characters in the affected area must pass a [[Grit Teeth]] (2) test or be dealt 3d6 damage directly to their HP."
	},
	{
		name: "Ætheric Disruptor", price: 500,
		description: "Controlled æther annihilation disrupts nearby æther channels. All characters in the affected area must pass an [[Ætheric Engineering]] (2) test or the Director chooses 2 enchantments or magical items to disable for 1 minute (20 rounds)."
	},

	{name: "", price: null, description: ""},
	{name: "", price: null, description: ""},
	{name: "", price: null, description: ""},
];


const fileNames = [
	"./skills.md",
	"./roles.md",
];

const markdowns = fileNames.map(name => parseMarkdown(name));



const makeSection = (section, content) => `<section><h2><a class="subtle-anchor" id="${section}" href="#${section}">${section}</a></h2>${content}</section>`;

/**
 * 
 * @param {string[]} sectionNames 
 */
const makeTableOfContents = (sectionNames) => {
	return makeSection("Table of Contents", `<ul>${processLine(sectionNames.map(e => `<li>[[${e}]]</li>`).join(""))}</ul>`);
}

const markdownTitles = markdowns.flat(9).filter(e => e.kind === MDFlag.H1).map(e => e.text);


const gearTransformer = item => {
	const sprice = (item.price) ? ` <span class="wmd-item-price">${item.price} kr</span>` : "";
	return `<h3><a id="${item.name}" href="#${item.name}">${item.name}</a>${sprice}</h3>
		<p>${processLine(item.description)}</p>`;
};

const outputHTML = `
<!DOCTYPE html>
<html>
	<!-- This is a generated file, so the HTML will look ugly -->
	<head>
		<title>WMD</title>
		<link rel="stylesheet" href="../tufte.css"/>
		<link rel="stylesheet" href="wmd.css"/>
	</head>
	<body>
		<article>
			<h1>WMD</h1>
			${makeTableOfContents(["Gear", "Enhancements", "Grenades", ...markdownTitles])}

			${makeSection("Gear", gear.map(gearTransformer).join(""))}
			${makeSection("Enhancements", enhancements.map(gearTransformer).join(""))}
			${makeSection("Grenades",     grenades.map(gearTransformer).join(""))}
		</article>
	
		${markdowns.map(e => renderMarkdownToHTML(e)).join("")}
	</body>
</html>
`;

console.log(outputHTML);


const d6 = () => Math.floor(Math.random() * 6) + 1;
const dX = (x) => Math.floor(Math.random() * x) + 1;
const _3d6 = () => d6() + d6() + d6();

/**
 * @template T
 * @param array {T[]} 
 * @returns {T}
 */
const randSelect = (array) => {
	const index = Math.floor(Math.random() * array.length);
	return array[index];
}

/**
 * @template T
 * @param array {T[]} 
 */
const randSelectWithRemainder = (array) => {
	const chosen = randSelect(array);
	const chosenIndex = array.indexOf(chosen);
	const remainder = [...array.slice(0, chosenIndex), ...array.slice(chosenIndex + 1)];
	return {
		chosen: chosen,
		remainder: remainder,
	};
}

/**
 * @template T
 * @param array {T[]} 
 * @param equalityFunc {(arrElement: T) => boolean} 
 */
const selectWithRemainder = (array, equalityFunc) => {
	let selectedIndex = 0;
	for (const ele of array) {
		if (equalityFunc(ele)) break;
		selectedIndex++;
	}
	return {
		chosen: array[selectedIndex],
		remainder: [...array.slice(0, selectedIndex), ...array.slice(selectedIndex + 1)],
	};
}


const languages = {
	common: [
		{name: "Common", speakers: "Most humanoids"},
		{name: "Dwarvish", speakers: "Dwarves"},
		{name: "Elvish", speakers: "Elves"},
		{name: "Giant", speakers: "Giants, Ogres, Trolls"},
		{name: "Goblin", speakers: "Goblins, Hobgoblins, Bugbears"},
		{name: "Merran", speakers: "Merfolk, Sirens, Sahuagin"},
		{name: "Orcish", speakers: "Orcs"},
		{name: "Reptilian", speakers: "Lizardfolk, Viperians"},
		{name: "Sylvan", speakers: "Faeries, Dryads, Centaurs"},
		{name: "Thanian", speakers: "Beastment, Minotaurs, Manticores"},
	],
	rare: [
		{name: "Celestial", speakers: "Angels"},
		{name: "Diabolic", speakers: "Demons, Devils"},
		{name: "Draconic", speakers: "Dragons"},
		{name: "Primordial", speakers: "Elementals, Elder-Things"},
	],
};

/**
 * @template T
 * @param {T[]} languages
 * @param {...string} langNames
 */
const specifyLanguageByNames = (languages, ...langNames) => {
	let chosenLangs = [];
	let unchosenLangs = languages;
	for (const name of langNames) {
		const result = selectWithRemainder(unchosenLangs, lang => lang.name == name);
		if (result.chosen) {
			chosenLangs.push(result.chosen);
		}
		unchosenLangs = result.remainder;
	}
	return {
		languages: chosenLangs,
		remainder: unchosenLangs,
	};
}

/**
 * @template T
 * @param {T[]} languages
 * @param {number} randomLanguages
 * @param {...string} guaranteedLanguages
 */
const getLanguagesFromList = (languages, randomLanguages, ...guaranteedLanguages) => {
	const first = specifyLanguageByNames(languages, ...guaranteedLanguages);
	let langs = first.languages;
	let remainder = first.remainder;

	for (let x = 0; x < randomLanguages; x++) {
		const result = randSelectWithRemainder(remainder);
		langs.push(result.chosen);
		remainder = result.remainder;
	}

	return {
		languages: langs,
		remainder: remainder,
	};
}





//Stats


//Names p38
const dwarfNames = () => randSelect(["Hilde", "Torbin", "Marga", "Bruno", "Karina", "Naugrim", "Brenna", "Darvin", "Elga", "Alric", "Isolde", "Gendry", "Bruga", "Junnor", "Vidrid", "Torson", "Brielle", "Ulfgar", "Sarna", "Grimm"]);
const elfNames = () => randSelect(["Eliara", "Ryarn", "Sariel", "Tirolas", "Galira", "Varos", "Daeniel", "Axidor", "Hiralia", "Cyrwin", "Lothiel", "Zaphiel", "Nayra", "Ithior", "Amriel", "Elyon", "Jirwyn", "Natinel", "Fiora", "Ruhiel"]);
const goblinNames = () => randSelect(["Iggs", "Tark", "Nix", "Lenk", "Roke", "Fitz", "Tila", "Riggs", "Prim", "Zeb", "Finn", "Borg", "Yark", "Deeg", "Nibs", "Brak", "Fink", "Rizzo", "Squib", "Grix"]);
const halflingNames = () => randSelect(["Willow", "Benny", "Annie", "Tucker", "Marie", "Hobb", "Cora", "Gordie", "Rose", "Ardo", "Alma", "Norbert", "Jennie", "Barvin", "Tilly", "Pike", "Lydia", "Marlow", "Astrid", "Jasper"]);
const halforcNames = () => randSelect(["Vara", "Gralk", "Ranna", "Korv", "Zasha", "Hrogar", "Klara", "Tragan", "Brolga", "Drago", "Yelena", "Krull", "Ulara", "Tulk", "Shiraal", "Wulf", "Ivara", "Hirok", "Aja", "Zoraan"]);
const humanNames = () => randSelect(["Zali", "Bram", "Clara", "Nattias", "Rina", "Denton", "Mirena", "Aran", "Morgan", "Giralt", "Tamra", "Oscar", "Ishana", "Rogar", "Jasmin", "Tarin", "Yuri", "Malchor", "Lienna", "Godfrey"]);
//Species p16
//Languages p32
const race = () => {
	const raceList = [
		{
			name: "Dwarf",
			languageListFunc: () => getLanguagesFromList(languages.common, 0, "Common", "Dwarvish").languages,
			charNameFunc: dwarfNames,
			talent: {name: "Stout", description: "Start with +2 HP. Roll hit points per level with advantage."},
		},
		{
			name: "Elf",
			languageListFunc: () => getLanguagesFromList(languages.common, 0, "Common", "Elvish", "Sylvan").languages,
			charNameFunc: elfNames,
			talent: {name: "Farsight", description: "+1 bonus to attack rolls with ranged weapons OR +1 bonus to spellcasting checks."},
		},
		{
			name: "Goblin",
			languageListFunc: () => getLanguagesFromList(languages.common, 0, "Common", "Goblin").languages,
			charNameFunc: goblinNames,
			talent: {name: "Keen Senses", description: "You can't be surprised."},
		},
		{
			name: "Half-Orc",
			languageListFunc: () => getLanguagesFromList(languages.common, 0, "Common", "Orcish").languages,
			charNameFunc: halforcNames,
			talent: {name: "Mighty", description: "+1 bonus to attack and damage rolls with melee weapons."},
		},
		{
			name: "Halfling",
			languageListFunc: () => getLanguagesFromList(languages.common, 0, "Common").languages,
			charNameFunc: halflingNames,
			talent: {name: "Stealthy", description: "1/Day: Become invisible for 3 rounds."},
		},
		{
			name: "Human",
			languageListFunc: () => getLanguagesFromList(languages.common, 1, "Common").languages,
			charNameFunc: humanNames,
			talent: {name: "Ambitious", description: "Gain one additional talent roll at 1st level."},
		},
	];

	switch (dX(12)) {
		case 1:
		case 2:
		case 3:
		case 4:
			return selectWithRemainder(raceList, ele => ele.name == "Human").chosen;
		case 5:
		case 6:
			return selectWithRemainder(raceList, ele => ele.name == "Elf").chosen;
		case 7:
		case 8:
			return selectWithRemainder(raceList, ele => ele.name == "Dwarf").chosen;
		case 9:
		case 10:
			return selectWithRemainder(raceList, ele => ele.name == "Halfling").chosen;
		case 11:
			return selectWithRemainder(raceList, ele => ele.name == "Half-Orc").chosen;
		default:
			return selectWithRemainder(raceList, ele => ele.name == "Goblin").chosen;
	}

	return randSelect(raceList);
}

//Background p26
const background = () => {
	const bgList = [
		{name: "Urchin", description: "You grew up in the merciliss streets of a large city"},
		{name: "Wanted", description: "There's a price on your head, but you have allies"},
		{name: "Cult Initiate", description: "You know blasphemous secrets and ritual"},
		{name: "Thieves' Guild", description: "You have connections, contacts, and debts"},
		{name: "Banished", description: "Your people cast you out for supposed crimes"},
		{name: "Orphaned", description: "An unusual guardian rescued and raised you"},
		{name: "Wizard's Apprentice", description: "You have a knack and eye for magic"},
		{name: "Jeweler", description: "You can easily appraise value and authenticity"},
		{name: "Herbalist", description: "You know plants, medicines, and poisons"},
		{name: "Barbarian", description: "You left the horde, but it never quite left you"},
		{name: "Mercenary", description: "You fought friend and foe alike for coin"},
		{name: "Sailor", description: "Pirate, privateer, or merchant - the seas are yours"},
		{name: "Acolyte", description: "You're well trained in religious rites and doctrines"},
		{name: "Soldier", description: "You served as a fighter in an organized army"},
		{name: "Woodsman", description: "The woods and wilds are your true home"},
		{name: "Scout", description: "You survived on stealth, observation, and speed"},
		{name: "Minstrel", description: "You've traveled far with your charm and talent"},
		{name: "Scholar", description: "You know much about ancient history and lore"},
		{name: "Noble", description: "A famous name has opened many doors for you"},
		{name: "Surgeon", description: "You know anatomy, surgery, and first aid"},
	];
	return randSelect(bgList);
}

const statline = () => {
	return {
		str: _3d6(),
		dex: _3d6(),
		con: _3d6(),
		wis: _3d6(),
		int: _3d6(),
		cha: _3d6(),
	};
}

//Alignment p27
const alignment = () => {
	return randSelect(["Lawful", "Neutral", "Chaotic"]);
}

//Random Characters p40
const makeChar = () => {
	let chosenRace = race();
	
	return {
		name: chosenRace.charNameFunc(),
		alignment: alignment(),
		race: chosenRace,
		languages: chosenRace.languageListFunc(),
		background: background(),
		stats: statline(),
	};
}
//TODO: have rollable list for rare languages and common languages
//TODO: have rollable list for all gods, or gods by alignment

//light 
//cwounds 
//hweapon 
//prot evil 
//sfaith 
//rr 
//Equipment Crawling Kit, One Weapon (and ammo if needed), Leather Armour (if useable), 5gp
// 7 + ? + 10 + 5 = 22 + ?

//Fighter - str|dex,con, d8
//Priest - wis/str , d6
//Thief - str|dex,cha, d4
//Wizard - int, d4
//Bard - cha, d6
//Ranger - str|dex,int, d8

let currentChar = makeChar();

const update = (domID, val) => {
	const ele = document.getElementById(domID);
	if (ele) ele.innerHTML = val;
}

const refreshChar = () => {
	const renderStat = (statNum) => `${statNum} (${statNum > 9 ? '+' : ''}${Math.floor((-10 + statNum)/2)})`
	const renderLang = (language) => `<strong>${language.name}</strong>: Spoken by ${language.speakers}`

	document.getElementById("reroll.stats").disabled = false;
	if (Object.values(currentChar.stats).map(e => e>=14).includes(true))
	document.getElementById("reroll.stats").disabled = true;

	document.getElementById("reroll.languages").disabled = currentChar.race.name !== "Human";

	update("char.name", currentChar.name);
	update("char.alignment", currentChar.alignment);
	update("char.race", currentChar.race.name);
	update("char.trait.name", currentChar.race.talent.name);
	update("char.trait.desc", currentChar.race.talent.description);

	update("char.str", renderStat(currentChar.stats.str));
	update("char.dex", renderStat(currentChar.stats.dex));
	update("char.con", renderStat(currentChar.stats.con));
	update("char.wis", renderStat(currentChar.stats.wis));
	update("char.int", renderStat(currentChar.stats.int));
	update("char.cha", renderStat(currentChar.stats.cha));

	update("char.background.name", currentChar.background.name);
	update("char.background.desc", currentChar.background.description);

	update("char.languages", currentChar.languages.map(renderLang).map(ele => `<li>${ele}</li>`).join(""));

	document.getElementById("char.card").style.visibility = "visible";
}
refreshChar();


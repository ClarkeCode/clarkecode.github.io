import { readFileSync } from "node:fs";

/**
 * @typedef {object} MDBlock
 * @property {number} kind
 * @property {string | string[]} text
 */

/**
 * @typedef {MDBlock[]} ParsedMarkdown
 */

/**
 * @typedef {string} HTMLString
 */


export const MDFlag = Object.freeze({
	H1:   990,
	H2:   880,
	H3:   770,
	H4:   660,
	H5:   550,
	H6:   440,
	Para:  90,
	Olist: 91,
	Ulist: 92,
	Empty:  1,
});


/**
 * @param {string} line 
 * @returns {MDBlock}
 */
const mdLexer = (line) => {
	if (line.startsWith("# "))      return { kind: MDFlag.H1,    text: line.replace(/^# /,          "").trim() };
	if (line.startsWith("## "))     return { kind: MDFlag.H2,    text: line.replace(/^## /,         "").trim() };
	if (line.startsWith("### "))    return { kind: MDFlag.H3,    text: line.replace(/^### /,        "").trim() };
	if (line.startsWith("#### "))   return { kind: MDFlag.H4,    text: line.replace(/^#### /,       "").trim() };
	if (line.startsWith("##### "))  return { kind: MDFlag.H5,    text: line.replace(/^##### /,      "").trim() };
	if (line.startsWith("###### ")) return { kind: MDFlag.H6,    text: line.replace(/^###### /,     "").trim() };
	if (line.match(/^[-+*] {1,4}/)) return { kind: MDFlag.Ulist, text: [line.replace(/^[-+*] {1,4}/, "").trim()] };
	if (line.match(/^\d+\. {1,4}/)) return { kind: MDFlag.Olist, text: [line.replace(/^\d+\. {1,4}/, "").trim()] };
	if (line.trim().length === 0)   return { kind: MDFlag.Empty, text: "" };
									return { kind: MDFlag.Para,  text: line.trim() };
}

/**
 * 
 * @param {string} fname 
 * @returns {ParsedMarkdown}
 */
export const parseMarkdown = (fname) => {
	const flaggedItems = readFileSync(fname).toString().split("\n").map(mdLexer);
	if (flaggedItems.length <= 0) return [];
	/**
	 * @type {MDBlock[]}
	 */
	const outQueue = [flaggedItems.shift()];
	const last = () => outQueue[outQueue.length - 1];

	//Merge items where possible
	for (const item of flaggedItems) {
		//Skip multiple empty lines in a row
		if (item.kind === MDFlag.Empty && last().kind === MDFlag.Empty) continue;
		//Merge sequential Paragraphs into a single Paragraph
		if (item.kind === MDFlag.Para && last().kind === MDFlag.Para) {last().text += " " + item.text; continue;}
		//Combine sequential list items (of the same kind)
		if (item.kind === MDFlag.Olist && last().kind === MDFlag.Olist) {last().text = last().text.concat(item.text); continue;}
		if (item.kind === MDFlag.Ulist && last().kind === MDFlag.Ulist) {last().text = last().text.concat(item.text); continue;}
		//If a paragraph follows a list, merge the paragraph text with the last entry in the list
		if (item.kind === MDFlag.Para && [MDFlag.Olist, MDFlag.Ulist].includes(last().kind)) {
			last().text[last().text.length - 1] += " " + item.text; continue;
		} //💩🚽🤢

		//Otherwise add item to the output
		outQueue.push(item);
	}
	return outQueue.filter(item => item.kind !== MDFlag.Empty); //Since merging has finished, we can discard info about empty lines
}

/**
 * @param {string} line 
 * @returns {HTMLString}
 */
export const processLine = (line) => {
	return line
	.replace(/\*\*(.*?)\*\*/g, `<strong>$1</strong>`) //Markdown bolding
	.replace(/\[\[(.*?)\]\] ?\((\d+?)\)/g, `<a href="#$1">$1 <span>($2)</span></a>`) //Skill reference with minimum difficulty
	.replace(/\[\[(.*?)\]\]/g, `<a href="#$1">$1</a>`)               //Linkable item
	.replace(/!!(.*?)!!/g, `<strong class="wmd-effect">$1</strong>`) //Glow effect
	.replace(/(\d+?)d(\d+?)/g, `<span class="dice">$1d$2</span>`)    //Dice notation 3d6
}

/**
 * 
 * @param {ParsedMarkdown} parsedMarkdown 
 * @returns {HTMLString}
 */
export const renderMarkdownToHTML = (parsedMarkdown) => {
	/**
	 * @type {{kind: MDFlag, closingHTML: string}[]}
	 */
	const stack = [];
	var outputHTMLString = "";

	for (const item of parsedMarkdown) {
		//Pop closers on the stack until the current item is "heavier"
		while (stack.length > 0 && item.kind >= stack[0].kind) {
			outputHTMLString += stack.shift().closingHTML;
		}

		//If the current item should start an organizational group, push onto the stack so it can be closed when appropriate
		if (item.kind === MDFlag.H1) {
			outputHTMLString += `<article>`;
			stack.unshift({kind: item.kind, closingHTML: `</article>\n`});
		}
		if (item.kind === MDFlag.H2) {
			outputHTMLString += `<section>`;
			stack.unshift({kind: item.kind, closingHTML: `</section>`});
		}


		//Emit HTML for the current item
		const content = (![MDFlag.Olist, MDFlag.Ulist].includes(item.kind)) ? processLine(item.text) : processLine(item.text.map(e => `<li>${e}</li>`).join(""));
		if (item.kind === MDFlag.H1) outputHTMLString += `<h1><a id="${content}" href="#${content}">${content}</a></h1>`;
		if (item.kind === MDFlag.H2) outputHTMLString += `<h2><a id="${content}" href="#${content}">${content}</a></h2>`;
		if (item.kind === MDFlag.H3) outputHTMLString += `<h3><a id="${content}" href="#${content}">${content}</a></h3>`;
		if (item.kind === MDFlag.H4) outputHTMLString += `<h4><a id="${content}" href="#${content}">${content}</a></h4>`;
		if (item.kind === MDFlag.H5) outputHTMLString += `<h5><a id="${content}" href="#${content}">${content}</a></h5>`;
		if (item.kind === MDFlag.H6) outputHTMLString += `<h6><a id="${content}" href="#${content}">${content}</a></h6>`;

		if (item.kind === MDFlag.Para)  outputHTMLString += `<p>${content}</p>`;
		if (item.kind === MDFlag.Olist) outputHTMLString += `<ol>${content}</ol>`;
		if (item.kind === MDFlag.Ulist) outputHTMLString += `<ul>${content}</ul>`;
	}

	//If there are any unclosed items left on the stack, empty it into the output string
	while (stack.length > 0) outputHTMLString += stack.shift().closingHTML;

	return outputHTMLString;
}

//console.log(renderMarkdownToHTML(mdParse("./test.md")));






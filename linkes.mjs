//https://edwardtufte.github.io/tufte-css/
//https://kyl.neocities.org/books/%5BTEC%20TUF%5D%20the%20visual%20display%20of%20quantitative%20information.pdf

const linkes = {
	"Applied Statistics": [
		"https://en.wikipedia.org/wiki/K-means_clustering",
		"https://gis.stackexchange.com/questions/257182/how-to-draw-boundaries-to-separate-clusters",
		"https://stats.stackexchange.com/questions/375787/how-to-cluster-parts-of-broken-line-made-of-points",
		"https://stats.stackexchange.com/questions/33078/data-has-two-trends-how-to-extract-independent-trendlines/33102#33102",
		"https://stackoverflow.com/questions/64670189/how-to-draw-a-line-between-a-set-of-points-while-trying-to-satisfy-a-set-of-cond",
		"https://gis.stackexchange.com/questions/446239/cluster-points-alongside-lines-with-a-limit",
		"https://stackoverflow.com/questions/33629842/grouping-points-that-represent-lines",
		

		"https://en.wikipedia.org/wiki/Random_sample_consensus",
		"https://www.mathworks.com/discovery/ransac.html",
		"http://www.cse.yorku.ca/~kosta/CompVis_Notes/ransac.pdf",
		"https://www.youtube.com/watch?v=9D5rrtCC_E0",
		"https://www.baeldung.com/cs/ransac",
		"https://www.youtube.com/watch?v=Cu1f6vpEilg",

		"https://en.wikipedia.org/wiki/DBSCAN",
		"https://www.youtube.com/watch?v=VMatzTGT8NI",
	],
	"TTRPGs": [
		"https://rtalsoriangames.com/downloadable-content/",
		"https://www.paradiso.zone/",
		"https://www.youtube.com/watch?v=OCznJM41JLY",
		"https://paradiso.works/collections/warped-beyond-recognition/products/ooo-wbr-mod",
		"https://donjon.bin.sh/",
		"https://www.youtube.com/watch?v=M7h0VaWM3fM",
	],
	"Interesting Repos & Programmers": [
		"https://github.com/ChrisBuilds/terminaltexteffects",
		"https://www.nicbarker.com/",
		"https://github.com/nicbarker/clay",
		"https://www.youtube.com/@diinkikot/videos",
		"https://www.youtube.com/watch?v=AS_nxNS6YKY",
		"https://www.youtube.com/watch?v=TmsrVxGt76k",
		"https://github.com/castholm/SDL?tab=readme-ov-file",
	],
	"Misc. Songs": [
		"https://www.youtube.com/watch?v=D-NvQ6VJYtE",
		"https://www.youtube.com/watch?v=4JkIs37a2JE",
		"https://www.youtube.com/watch?v=FcZat6kuIY0",
		"https://www.youtube.com/watch?v=3ivaGaT2jq0",
		"https://www.youtube.com/watch?v=Ec99sWuce_Y",
		"https://www.youtube.com/watch?v=mngtcfcaVrI",
		"https://www.youtube.com/watch?v=uj3_FxyVK0c",
		"https://www.youtube.com/watch?v=FxDMMeWK1ZE",
	],
	"Visual Art": [
		"https://en.wikipedia.org/wiki/Frank_R._Paul",
		"http://www.frankwu.com/paul1.html",
		"https://www.art.com/gallery/id--a52007/frank-r-paul-posters.htm",
		"https://en.wikipedia.org/wiki/J._C._Leyendecker",
		"https://www.artrenewal.org/artists/joseph-christian-leyendecker/833",
		"https://www.wikiart.org/en/j-c-leyendecker/all-works#!#filterName:all-paintings-chronologically,resultType:masonry",
		"https://www.illustrationhistory.org/images/uploads/LD1.jpg",
		"https://www.artrenewal.org/secureimages/artwork/833/833/46297/9a5e21c8-f3a7-4db7-b1ab-e2abe4f97013.jpg",
		"https://x.com/Chaoclypse",
		"https://x.com/Chaoclypse/status/1799005923257766025",
		"https://www.dropbox.com/scl/fo/zyj0trj7hvc5rrhhzihan/ANW9p0d8pDFzvVs_pN2S7B8?rlkey=4ryu4w0mmzygb7vth04o6ug5p&e=2&dl=0",
		"https://www.dropbox.com/scl/fi/hixdct7wh2072i5obgn3a/Getty.zip?rlkey=ezno83qrrlakgsqgo3h7t4rm4&e=2&dl=0",
		"https://chaoclypse.itch.io/noise-dystopia-machine",
		"https://newschoolrevolution.com/public-domain-art/",
		"https://drive.google.com/drive/folders/1jK4gL6BJHntwi8KheJpKxhpzkAiJgwTh",
	],
	"Wargames & 40k": [
		"https://www.youtube.com/@SamPearsonGameDesign",
		"https://www.youtube.com/watch?v=QHwVFNMZrDs",
		"https://themagnetbaron.com/",
		"https://wahapedia.ru/wh40k10ed/factions/t-au-empire/",
		"https://shop.fenrisworkshop.com/collections/tau-empire",
		"https://www.patreon.com/posts/turnip28-core-81080090",
		"https://gamefound.com/en/projects/golden-dragon-games-inc/marcher-empires-at-war-first-edition",
		
	],
	"Programming Languages": [
		"https://www.youtube.com/watch?v=qjWkNZ0SXfo&sttick=0",
	],
	//https://www.uiua.org/
	"Procedural Generation": [
		"https://www.roguebasin.com/index.php/Dungeon-Building_Algorithm",
		"https://www.roguebasin.com/index.php/Basic_BSP_Dungeon_generation",
		"https://www.reddit.com/r/roguelikedev/comments/6vf8j4/dungeon_and_town_generation_algorithms/?rdt=65290",
		"https://www.gridsagegames.com/blog/2014/06/procedural-map-generation/",
		"https://www.rockpapershotgun.com/how-do-roguelikes-generate-levels",
		"https://varav.in/archive/dungeon/",
		""
	],
	//https://sonniss.com/gameaudiogdc/
	"Compilers and Parsers": [
		"https://www.reddit.com/r/compsci/comments/kgpjv/can_somebody_please_explain_the_difference/",
		"https://blog.reverberate.org/2013/07/ll-and-lr-parsing-demystified.html",
		"https://blog.reverberate.org/2013/09/ll-and-lr-in-context-why-parsing-tools.html",
		"https://en.wikipedia.org/wiki/LL_grammar",
		"https://en.wikipedia.org/wiki/LR_parser",
		"https://en.wikipedia.org/wiki/Lexer_hack",
		"https://dickgrune.com/Books/PTAPG_2nd_Edition/",
		"https://www.youtube.com/watch?v=1BanGrbOcjs", //How to write a Pratt Parser
	],
	//https://blog.reverberate.org/2014/09/what-every-computer-programmer-should.html //Floating Point Demystified
};

const linklist = Object.keys(linkes).map(key => {
	const ttt = linkes[key].map(link => {
		return `\n<li><a href=${link}>${link}</a></li>`
	}).join("");
	const list = `<ul>${ttt}</ul>`
	return `<section><h2>${key}</h2>\t${list}</section>\n\n`;
}).join("");

const ggg = `
<!DOCTYPE html>
<html>
	<!-- This is a generated file, so the HTML will look ugly -->
	<head>
		<title>Links 'n Things</title>
		<link rel="stylesheet" href="tufte.css"/>
	</head>
	<body>
		<h1>Links 'n Things</h1>
		${linklist}
	</body>
</html>
`;

console.log(ggg);

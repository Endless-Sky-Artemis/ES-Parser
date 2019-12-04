const GAMEDATA = {}; //make everything more easily and quickly accessible
GAMEDATA.classes = {} //store all the classes and their contents from each text file
GAMEDATA.files = [];//file names
GAMEDATA.directory = 'app/assets/data';

GAMEDATA.collect = (dataType) => {
	let raw = PARSERTOOLS.search.main(`${dataType} -a category -p category`);
	itemsRaw = raw.split('\n');
	let items = new Map();
	for (i = 0; i < itemsRaw.length; i += 3) {
		if (itemsRaw[i].includes(`${dataType} `)) items.set(itemsRaw[i].replace(/ship |outfit /g, ''), itemsRaw[i + 1].replace(/\t|"|category /g, ''));
	}
	return items;
}
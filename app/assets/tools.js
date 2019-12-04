
const PARSERTOOLS = {};

PARSERTOOLS.perSec = value => {
	/* Takes a value and returns the total amount of it in 60 frames in a second */
	return value * 60;
};

PARSERTOOLS.formatRaw = raw => {
	/* Format the raw data from the file into a string that we can use */
	let mapObj = {
		'\\n"': '',
		'\\n':'\n',
		'\\t':'\t',
		'\\"': '"',
		'"#': '#'
	};
	let str = JSON.stringify(raw).replace(/\\n"|\\n|\\t|\\"|\"#/g, (matches) => mapObj[matches]);
	return str;
};

PARSERTOOLS.countTabs = (line) => {
	/* Counts the number of times a tab appears at the start of a line */
	line = line.replace(/\t/g, '\t@');
	let arr = line.split('@');
	let charNum = 0;
	for (let str of arr) {
		if (str == '\t') {
			charNum += 1;
		} else {
			break;
		}
	}
	return charNum;
}

PARSERTOOLS.getFileNames = directory => {
	return new Promise((resolve, reject) => {
		Neutralino.filesystem.readDirectory(directory,
			data => {
				PARSERUI.ui.logStatus.innerHTML = `Success: Found directory ${directory}`;
				resolve(data.files); //files.name files.type
			},
			() => {
				PARSERUI.ui.logStatus.innerHTML = `Error: Couldn't find directory ${directory}`;
				console.error(`Error: Couldn't find directory ${directory}`);
				reject(err);
			}
		);
	});
};

PARSERTOOLS.readFile = file => {
	return new Promise((resolve, reject) => {
		if (file != undefined) {
			Neutralino.filesystem.readFile(`app/assets/data/${file}`,
				data => {
					PARSERUI.ui.logStatus.innerHTML = `Success: ${file} read`;
					resolve(data.content); //PARSERTOOLS.formatRaw(data);
				},
				() => {
					PARSERUI.ui.logStatus.innerHTML = `Error: Couldn't read file ${file}`;
					console.error(`Error: Couldn't read file ${file}`);
					clearInterval(readingInterval);
				}
			);
		}
	});
};

PARSERTOOLS.segregate = {};
PARSERTOOLS.segregate.main = raw => {
	/* Seperate the properties and values of different game object data */
	let lines = PARSERTOOLS.formatRaw(raw).split('\n');
	let gameObj = ['', ''];
	for (let line of lines) {
		if (line.startsWith('#')){ // exlude comments
			gameObj = ['', ''];
		} else if (!(line.startsWith('\t')) && (line != undefined) && line.length) { //only assign items in lines that don't start with tabs
			if (line.includes(' ')) {
				gameObj[0] = line.substring(0, line.indexOf(' '));
				gameObj[1] = line.substring(line.indexOf(' ') + 1, line.length);
			} else {
				gameObj[0] = line;
				gameObj[1] = 'self'; // refers to a single item in a line
			}
			if (!GAMEDATA.classes.hasOwnProperty(gameObj[0])) GAMEDATA.classes[gameObj[0]] = {}; // check if the class has been added; if not add it
			GAMEDATA.classes[gameObj[0]][gameObj[1]] = {};
			GAMEDATA.classes[gameObj[0]][gameObj[1]].raws = [];
		}
		if (gameObj[0].length) { //checks if the current lines are part of a game object
			let tabCount = PARSERTOOLS.countTabs(line);
			line = line.replace(/\t/g, '');
			GAMEDATA.classes[gameObj[0]][gameObj[1]].raws.push({'raw': line, 'tabs': tabCount});
		}
	}
};

PARSERTOOLS.search = {};
PARSERTOOLS.search.main = query => {
	/* Searches for items in the game data */
	let receivedData = PARSERTOOLS.search.flags(query).all[0] ? '' : PARSERTOOLS.search.properties(query); // search through property names
	if (receivedData.length) {
		return receivedData;
	} else {
		receivedData = PARSERTOOLS.search.raws(query); // search through the raws for matches
		return receivedData.length ? receivedData : `Search returned nothing for ${query}`;
	}
};
PARSERTOOLS.search.properties = query => {
	/* Searches through GAMEDATA.classes properties */
	query = PARSERTOOLS.search.alts(query);
	let attributes = PARSERTOOLS.search.flags(query).attributes;
	query = attributes[2];
	let line; //make it more readible
	let raws = '';
	if (GAMEDATA.classes.hasOwnProperty(query)) {
		for (let item in GAMEDATA.classes[query]) {
			line = PARSERTOOLS.returnRaws(GAMEDATA.classes[query][item]);
			raws += `${attributes[0] ? PARSERTOOLS.search.attributes(line, attributes[1]) : line}\n`;
		}
	} else {
		if (!(query.startsWith('"'))) query = `"${query}`;
		if (!(query.endsWith('"'))) query = `${query}"`;
		for (let item in GAMEDATA.classes) {
			if (GAMEDATA.classes[item].hasOwnProperty(query)) {
				line = PARSERTOOLS.returnRaws(GAMEDATA.classes[item][query]);
				raws = attributes[0] ? PARSERTOOLS.search.attributes(line, attributes[1]) : line;
			}
		}
	}
	return raws;
};
PARSERTOOLS.search.raws = query => {
	/* Searches through raws for specific matches */
	let raws = ''
	let flags = PARSERTOOLS.search.flags(query);
	for (let item in GAMEDATA.classes) {
		for (let subitem in GAMEDATA.classes[item]) {
			let line = PARSERTOOLS.returnRaws(GAMEDATA.classes[item][subitem]);
			if (GAMEDATA.classes[item][subitem].raws[0].raw.includes(flags.all[2])) {
				let attributes = flags.all[1];
				let matches = true;
				if (attributes) {
					for (let attribute of attributes) {
						if (!line.includes(attribute)) {
							matches = false;
							break;
						}
					}
				}
				attributes = flags.attributes;
				if (matches) raws += `${attributes[0] ? PARSERTOOLS.search.attributes(line, attributes[1]) : line}\n`;
			}
		}
	}
	return raws;
};
PARSERTOOLS.search.alts = item => {
	/* Gives the alternative property name in the GAMEDATA.classes if the search item matches */
	switch(item.toLowerCase()) {
		case 'ships':
			return 'ship';
		case 'outfits':
			return 'outfit';
		case 'effects':
			return 'effect';
		case 'governments':
			return 'government';
		case 'events':
			return 'event';
		case 'fleets':
			return 'fleet';
		default:
			return item;
	}
};
PARSERTOOLS.search.flags = item => {
	let flags = {
		'all': [false, false, item],
		'attributes': [false, false, item]
	};
	let flagCheck = check => {
		switch(check) {
			case '-a':
				return 'all';
			case '-p':
				return 'attributes';
			default:
				return false;
		}
	};
	if (item.includes(' ')) {
		let items = item.match(/(?:[^\s"]+|"[^"]*")+/g);
		let flag = false;
		item = '';
		for (let subitem in items) {
			let checkIfFlag = flagCheck(items[subitem]);
			if (checkIfFlag) {
				flag = checkIfFlag;
				flags[flag][0] = true;
			} else if (flag) {
				if (!flags[flag][1]) flags[flag][1] = [];
				flags[flag][1].push(items[subitem].includes('"<-') ? items[subitem].replace(/<-/g, '') : items[subitem].replace(/"/g, '').replace(/<-/g, ' ')); //the '->' is use in place of spaces when you want to include a space in the search
			} else {
				item += `${items[subitem]} `;
			}
		}
		flags.all[2] = item.trimEnd();
		flags.attributes[2] = item.trimEnd();
	} else {
		flagCheck(item); //in case its only a flag in the whole line
	}
	return flags;
};
PARSERTOOLS.search.attributes = (item, attributes) => {
	let raws = '';
	let carryOn = 0;
	let loop = str => {
		for (let attribute of attributes) {
			if (str.includes(attribute.replace('->', '')) || carryOn) {
				if (attribute.includes('->') && !carryOn) carryOn = PARSERTOOLS.countTabs(str);
				raws += `${str}\n`;
				break;
			}
		}
	};
	if (attributes) {
		let items = item.split('\n');
		for (let subitem in items) {
			if (subitem) {
				if (carryOn >= PARSERTOOLS.countTabs(items[subitem])) carryOn = 0;
				loop(items[subitem]);
			}
		}
		item = raws.length ? `${items[0]}\n${raws}` : item;
	}
	return item;
};

PARSERTOOLS.returnRaws = obj => {
	/* Grabs all the raw properties from an item in the GAMEDATA.classes */
	let raws = '';
	for (let line of obj.raws) {
		let raw = line.raw;
		let tabCount = line.tabs;
		raws += '\t'.repeat(tabCount) + raw + '\n';
	}
	return raws.trimEnd();
};

PARSERTOOLS.averages = {};
PARSERTOOLS.averages.value = (raw, stats) => {
	stats.forEach((value, stat) => {
		if ((stat != 'outfits') && (stat != 'weapon')) {
			let re = new RegExp(`\\t"${stat}\\b|\\t${stat}\\b`);
			let match = raw.match(re);
			if (match != null) {
				newLine = raw.substring(match.index, raw.length).match(/\n/);
				let val = raw.substring(match.index + match[0].length, (newLine != null ? match.index + newLine.index : raw.length)).replace(/"/, '').trim();
				if(!(isNaN(val))) {
					stats.set(stat, value + parseFloat(val));
				} else if ((stat == 'submunition') && val.length) {
					stats.set(stat, val);
				}
			}
		}
	});
	return stats
};
PARSERTOOLS.averages.outfit = (outfit, quickView = false) => {
	/* Return the average of each outfit property value */
	// submunition
	// weapon values are at one frame of 60 frames per second
	let raw = PARSERTOOLS.search.main(`${outfit}`);
	let re = new RegExp('\\t\\bweapon\\b', 'g');
	let match = re.exec(raw);
	let weapon;
	let description;
	if (match != null) {
		weapon = raw.substring(match.index, raw.length);
		raw = raw.replace(weapon, '');
		re = new RegExp('\\n\\t\\bdescription\\b', 'g');
		match = re.exec(weapon);
		if (match != null) {
			description = weapon.substring(match.index, weapon.length);
			weapon = weapon.replace(description, '');
		}
	} else {
		weapon = false;
	}
	let stats = new Map(PARSERTOOLS.averages.value(raw, new Map(PARSERTOOLS.averages.stats().get('outfits'))));
	if (weapon) {
		weapon = new Map(PARSERTOOLS.averages.weapon(weapon));
		weapon.forEach((value, stat) => {
			stats.get('weapon').set(stat, value);
		});
	}
	return stats;
};
PARSERTOOLS.averages.weapon = weapon => {
	/* Return the average of each outfit weapon properties values */
	let conversions = new Map([
		['reload', 0],
		['burst count', 0],
		['burst reload', 0]
	]);
	let exclude = [
		'infrared tracking',
		'optical tracking',
		'radar tracking',
		'tracking',
		'missile strength',
		'anti-missile',
		'piercing'
	];
	let stats = new Map(PARSERTOOLS.averages.value(weapon, new Map([...PARSERTOOLS.averages.stats().get('outfits').get('weapon'), ...conversions, ["submunition", '']])));
	conversions.forEach((_value, key) => {
		conversions.set(key, stats.get(key));
		stats.delete(key);
	});
	let converge = item => {
		item.get('weapon').forEach((value, stat) => {
			if (!exclude.includes(stat)) stats.set(stat, value + stats.get(stat));
		});
	};
	if (stats.get('submunition').length) {
		let submunition = stats.get('submunition');
		stats.delete('submunition');
		if (submunition.includes(' ')) {
			submunition = submunition.split(' ');
			if (isNaN(submunition[submunition.length -1])) {
				converge(new Map(PARSERTOOLS.averages.outfit(submunition.join(' '))));
			} else {
				let i = parseFloat(submunition[submunition.length - 1]);
				submunition = new Map(PARSERTOOLS.averages.outfit(submunition.slice(0, submunition.length - 1).join(' ')));
				for (; i > 0; i--) {
					converge(submunition);
				}
			}
		} else {
			converge(new Map(PARSERTOOLS.averages.outfit(submunition)));
		}
	} else {
		stats.delete('submunition');
	}
	stats.forEach((value, stat) => {
		if (!exclude.includes(stat)) {
			if (conversions.get('burst reload')) value /= conversions.get('burst reload');
			if (conversions.get('burst count')) value *= conversions.get('burst count');
			if (conversions.get('reload')) value /= conversions.get('reload');
			stats.set(stat, value);
		}
	});
	return stats;
};
PARSERTOOLS.averages.ship = (ship, quickView = false) => {
	/* Return the average of a ships property values */
	let criteria = [
		'attributes->',
		'weapon->',
		'outfits->'
	];
	let otherAtt = [//these attributes don't stack or are capped
		'infrared tracking',
		'optical tracking',
		'radar tracking',
		'tracking',
		'missile strength',
		'anti-missile',
		'piercing'
	];
	let raw = PARSERTOOLS.search.main(`${ship} -p ${criteria.join(' ')}`);
	let stats = new Map(PARSERTOOLS.averages.value(raw, new Map(PARSERTOOLS.averages.stats())));
	let match = raw.match(/\boutfits\b/);
	let outfits = raw.substring(match.index + 'outfits'.length, raw.length).replace(/\t/g, '').split('\n').filter(line => line.length > 0);
	let converge = item => {
		item.forEach((value, stat) => {
			if (stat != 'weapon') {
				stats.get('outfits').set(stat, value + stats.get('outfits').get(stat));
			} else {
				value.forEach((subValue, subStat) => {
					let mainValue = stats.get('outfits').get('weapon').get(subStat);
					if (otherAtt.includes(subStat)) {
						stats.get('outfits').get('weapon').set(subStat, subValue > mainValue ? subValue : mainValue);
					} else {
						stats.get('outfits').get('weapon').set(subStat, subValue + mainValue);
					}
				});
			}
		});
	};
	for (let outfit of outfits) {
		if (outfit.includes(' ')) {
			outfit = outfit.split(' ');
			if (isNaN(outfit[outfit.length - 1])) {
				converge(new Map(PARSERTOOLS.averages.outfit(outfit.join(' '))));
			} else {
				let i = parseFloat(outfit[outfit.length - 1]);
				outfit = new Map(PARSERTOOLS.averages.outfit(outfit.slice(0, outfit.length - 1).join(' ')));
				for (; i > 0; i--) {
					converge(outfit);
				}
			}
		} else {
			converge(new Map(PARSERTOOLS.averages.outfit(outfit)));
		}
	}
	return stats;
};
PARSERTOOLS.averages.multi = (items, dataType) => { // ([sample1, sample2]) uses array
	/* Return the average of multiple ship property values */
	let allStats = new Map(PARSERTOOLS.averages.stats());
	for (let item of items) {
		let itemStats;
		switch (dataType) {
			case 'outfit':
				itemStats = new Map(PARSERTOOLS.averages.stats());
				itemStats.set('outfits', new Map(PARSERTOOLS.averages.outfit(item)));
				break;
			case 'ship':
				itemStats = new Map(PARSERTOOLS.averages.ship(item));
				break;
			default:
				break;
		}
		itemStats.forEach((value, stat) => {
			if (stat == 'outfits') {
				value.forEach((subValue, subStat) => {
					if (subStat != 'weapon') {
						allStats.get('outfits').set(subStat, subValue + allStats.get('outfits').get(subStat));
					} else {
						subValue.forEach((weapValue, weapStat) => {
							allStats.get('outfits').get('weapon').set(weapStat, weapValue + allStats.get('outfits').get('weapon').get(weapStat));
						});
					}
				});
			} else {
				allStats.set(stat, value + allStats.get(stat));
			}
		});
	}
	allStats.forEach((value, stat) => {
		if (stat == 'outfits') {
			value.forEach((subValue, subStat) => {
				if (subStat != 'weapon') {
					allStats.get('outfits').set(subStat, (subValue / items.length));
				} else {
					subValue.forEach((weapValue, weapStat) => {
						allStats.get('outfits').get('weapon').set(weapStat, (weapValue / items.length));
					});
				}
			});
		} else {
			allStats.set(stat, (value / items.length));
		}
	});
	switch(dataType) {
		case 'outfit':
			return allStats.get('outfits');
		case 'ship':
			return allStats;
		default:
			break;
	}
};
PARSERTOOLS.averages.stats = () => {
	/* Returns an object for storing stats */
	let weapon = new Map([
		['firing energy', 0],
		['firing force', 0],
		['firing heat', 0],
		['infrared tracking', 0],
		['optical tracking', 0],
		['radar tracking', 0],
		['tracking', 0],
		['missile strength', 0],
		['anti-missile', 0],
		['hit force', 0],
		['piercing', 0],
		['shield damage', 0],
		['hull damage', 0],
		['heat damage', 0],
		['fuel damage', 0],
		['ion damage', 0],
		['disruption damage', 0],
		['slowing damage', 0]
	])
	let outfits = new Map([
		['active cooling', 0],
		['afterburner energy', 0],
		['afterburner fuel', 0],
		['afterburner heat', 0],
		['afterburner thrust', 0],
		['atmosphere scan', 0],
		['bunks', 0],
		['capture attack', 0],
		['capture defense', 0],
		['cargo scan power', 0],
		['cargo scan speed', 0],
		['cargo space', 0],
		['cloak', 0],
		['cloaking energy', 0],
		['cloaking fuel', 0],
		['cloaking heat', 0],
		['cooling', 0],
		['cooling energy', 0],
		['cooling inefficiency', 0],
		['cost', 0],
		['disruption resistance', 0],
		['drag', 0],
		['energy capacity', 0],
		['energy consumption', 0],
		['energy generation', 0],
		['engine capacity', 0],
		['fuel capacity', 0],
		['fuel consumption', 0],
		['fuel energy', 0],
		['fuel heat', 0],
		['fuel generation', 0],
		['heat dissipation', 0],
		['heat generation', 0],
		['hull', 0],
		['hull energy', 0],
		['hull fuel', 0],
		['hull heat', 0],
		['hull repair rate', 0],
		['ion resistance', 0],
		['maintenance costs', 0],
		['mass', 0],
		['operating costs', 0],
		['outfit scan power', 0],
		['outfit scan speed', 0],
		['outfit space', 0],
		['radar jamming', 0],
		['ramscoop', 0],
		['required crew', 0],
		['reverse thrust', 0],
		['reverse thrusting energy', 0],
		['reverse thrusting heat', 0],
		['scan interference', 0],
		['shield energy', 0],
		['shield fuel', 0],
		['shield generation', 0],
		['shield heat', 0],
		['shields', 0],
		['slowing resistance', 0],
		['solar collection', 0],
		['thrust', 0],
		['thrusting energy', 0],
		['thrusting heat', 0],
		['turn', 0],
		['turning energy', 0],
		['turning heat', 0],
		['weapon capacity', 0],
		['weapon', new Map(weapon)]
	]);
	let stats = new Map([
		['cost', 0],
		['hull', 0],
		['shields', 0],
		['required crew', 0],
		['bunks', 0],
		['mass', 0],
		['drag', 0],
		['heat dissipation', 0],
		['fuel capacity', 0],
		['cargo space', 0],
		['outfit space', 0],
		['weapon capacity', 0],
		['engine capacity', 0],
		['shield generation', 0],
		['shield energy', 0],
		['shield heat', 0],
		['hull repair', 0],
		['hull energy', 0],
		['turn', 0],
		['turning energy', 0],
		['turning heat', 0],
		['thrust', 0],
		['thrusting energy', 0],
		['thrusting heat', 0],
		['ramscoop', 0],
		['cargo scan power', 0],
		['cargo scan speed', 0],
		['outfit scan power', 0],
		['outfit scan speed', 0],
		['asteroid scan power', 0],
		['atmosphere scan', 0],
		['tactical scan power', 0],
		['cloak', 0],
		['cloaking energy', 0],
		['cloaking fuel', 0],
		['cloaking heat', 0],
		['energy generation', 0],
		['energy consumption', 0],
		['energy capacity', 0],
		['heat generation', 0],
		['blast radius', 0],
		['shield damage', 0],
		['hull damage', 0],
		['hit force', 0],
		['outfits', new Map(outfits)]
	]);
	return stats;
};

// **CHECKLIST**
// create json storage
// organize & clean up
// switch from pointer to semicolons & use dict for attributes
const PARSERUI = {};
PARSERUI.ui = {};
PARSERUI.ui.logStatus = document.getElementById('parserlogstatus');
PARSERUI.ui.logFiles = document.getElementById('parserlogfiles');
PARSERUI.ui.searchPre = document.getElementById('parserdata');

PARSERUI.ui.switchModes = (prev, next) => {
	/* Turns display off for one view and on for a different view*/
	prev = document.querySelectorAll(prev);
	next = document.querySelectorAll(next);
	for (let item of prev) item.style.display = 'none';
	for (let item of next) item.style.display = 'inline-block';
};

PARSERUI.ui.switchActive = (button1 = false, button2 = false) => {
	if (button1) {
		button1 = document.querySelector(button1);
		button1.classList.remove('active');
	}
	if (button2) {
		button2 = document.querySelector(button2);
		button2.classList.add('active');
	}
};

PARSERUI.ui.select = (el, mode = false) => {
	/* Selects or deselects all items from an element */
	el = document.querySelectorAll(el);
	for(let item of el) {
		if (item.parentNode.style.display != 'none') {
			if (mode && !item.checked) item.click()
			else if (!mode && item.checked) item.click();
		}
	}
};

PARSERUI.ui.showChecked = show => {
	/* Turns display off for one view and on for a different view*/
	show = document.querySelectorAll(show);
	for (let item of show) {
		item.style.display = item.style.display == 'none' ? 'inline-block' : 'none';
	}
};

PARSERUI.ui.addItems = () => {
	let ships = new Map(GAMEDATA.collect('ship'));
	let outfits = new Map(GAMEDATA.collect('outfit'));
	let shipChecklist = [];
	let outfitChecklist = [];
	ships.forEach((category, ship) => {
		shipChecklist.push(`<div style="display: none;" data-category="${category}" class="checkitem"><input type="checkbox" name='${ship}' value='${ship}'><span>${ship}</span></div>`);
	});
	outfits.forEach((category, outfit) => {
		outfitChecklist.push(`<div style="display: none;" data-category="${category}" class="checkitem"><input type="checkbox" name='${outfit}' value='${outfit}'><span>${outfit}</span></div>`);
	});
	document.querySelector('#items .checklist.ships').innerHTML = shipChecklist.join('');
	document.querySelector('#items .checklist.outfits').innerHTML = outfitChecklist.join('');
};

PARSERUI.ui.getValues = () => {
	let items = document.querySelectorAll('#neutralinoapp #items .checklist input');
	let values = [];
	for (let item of items) {
		if (item.checked) {
			values.push(item.getAttribute('value'));
		}
	}
	return values;
};

PARSERUI.ui.compare = 'ship';

PARSERUI.ui.averages = false;

PARSERUI.ui.multiplier = 1;

PARSERUI.ui.averagesToggle = () => {
	let el = document.querySelector('#submissionbox button[name="averages"]');
	PARSERUI.ui.averages = PARSERUI.ui.averages ? false : true;
	if (PARSERUI.ui.averages) {
		el.classList.add('active');
	} else {
		el.classList.remove('active');
	}
};

PARSERUI.ui.submit = () => {
	let dataQuery = PARSERUI.ui.getValues();
	if (dataQuery.length) {
		PARSERUI.ui.multiplier = document.querySelector('#submissionbox select').value;
		let text = [];
		let items;
		let exclude = [
			[	
				'infrared tracking',
				'optical tracking',
				'radar tracking',
				'tracking',
				'missile strength',
				'piercing',
				'atmosphere scan',
				'bunks',
				'capture attack',
				'capture defense',
				'cargo scan power',
				'cargo scan speed',
				'cargo space',
				'cost',
				'disruption resistance',
				'drag',
				'energy capacity',
				'engine capacity',
				'fuel capacity',
				'hull',
				'ion resistance',
				'maintenance costs',
				'mass',
				'operating costs',
				'outfit scan power',
				'outfit scan speed',
				'outfit space',
				'radar jamming',
				'required crew',
				'scan interference',
				'shields',
				'slowing resistance',
				'weapon capacity',
				'asteroid scan power',
				'tactical scan power',
				'blast radius'
			],
			[
				'shield damage',
				'hull damage',
				'hit force'
			]
		];
		let constructText = () => {
			items.forEach((value, item) => {
				if ((item == 'outfits') || (item == 'weapon')) {
					text.push(`${item}:`);
					value.forEach((subValue, subItem) => {
						if (subItem == 'weapon') {
							text.push(`\tweapon:`);
							subValue.forEach((weapValue, weapItem) => {
								text.push(`\t\t${weapItem}: ${(exclude[0].includes(weapItem) ? weapValue : weapValue * PARSERUI.ui.multiplier).toFixed(2)}`);
							});
						} else {
							text.push(`\t${subItem}: ${(exclude[0].includes(subItem) ? subValue : subValue * PARSERUI.ui.multiplier).toFixed(2)}`);
						}
					});
				} else {
					text.push(`${item}: ${(exclude[0].includes(item) ||  exclude[1].includes(item) ? value : value * PARSERUI.ui.multiplier).toFixed(2)}`);
				}
			});
		};
		let getData = () => {
			for (let query of dataQuery) {
				switch (PARSERUI.ui.compare) {
					case 'ship':
						items = new Map(PARSERTOOLS.averages.ship(query));
						break;
					case 'outfit':
						items = new Map(PARSERTOOLS.averages.outfit(query));
						break;
				}
				text.push(`\n${query} STATS\n`);
				constructText();
				text.push('\n\n');
			}
		}
		if (PARSERUI.ui.averages) {
			items = new Map(PARSERTOOLS.averages.multi(dataQuery, PARSERUI.ui.compare));
			console.log(items);
			text.push(`AVERAGES\n`);
			constructText();
		} else { 
			getData();
		}
		let result = document.querySelector('#result');
		let criteria = document.querySelector('#neutralinoapp #compareUI .criteria');
		result.querySelector('pre').innerHTML = text.join('\n');
		result.style.display = 'inline-block';
		criteria.style.display = 'none';
	}
	
};
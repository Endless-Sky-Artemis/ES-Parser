// MIT License

// Copyright (c) 2018 Neutralinojs

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

let readingInterval;
let myapp = {
    dataLoader : () => {
		// ...
		let rawInitiator = PARSERTOOLS.getFileNames(GAMEDATA.directory);
		rawInitiator.then(files => {
			for (const file of files) {
				if (file.type != 'directory') {
					GAMEDATA.files.push(file.name);
				}
			}
			let reading = false;
			let fileIndex = 0;
			readingInterval = setInterval(() => {
				if (fileIndex == GAMEDATA.files.length) {
					PARSERUI.ui.logStatus.innerHTML = 'Finished reading files';
					PARSERUI.ui.logFiles.innerHTML = 'Status: Ready!';
					window.addEventListener('keypress', e => {
						if (e.key == 'Enter') {
							e.preventDefault();
							let search = document.getElementById('parsersearch').value;
							if (search.length) PARSERUI.ui.searchPre.innerHTML= PARSERTOOLS.search.main(search);
						}
					});
					document.querySelector('#parsersearch').removeAttribute('disabled');
					PARSERUI.ui.addItems();
					document.querySelector('#neutralinoapp nav button[name="Compare"]').setAttribute('onclick', "PARSERUI.ui.switchModes('#searchUI', '#compareUI'); PARSERUI.ui.switchActive(`nav button[name='Search']`, `nav button[name='Compare']`);");
					clearInterval(readingInterval);
				} else if (!reading) {
					let reading = true;
					let fileInitiatior = PARSERTOOLS.readFile(GAMEDATA.files[fileIndex]);
					fileInitiatior.then(raw => {
						PARSERTOOLS.segregate.main(raw);
						PARSERUI.ui.logFiles.innerHTML = `File: ${fileIndex + 1}/${GAMEDATA.files.length}`;
						fileIndex += 1;
						reading = false;
					});
				}
			}, 200);
		},
		err => {
			console.log(err);
			clearInterval(readingInterval);
		});
	}
};


Neutralino.init({
    load: function() {
        myapp.dataLoader();
    },
    pingSuccessCallback : function() {

    },
    pingFailCallback : function() {

    }
});
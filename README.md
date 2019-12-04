# ES-Parser
A tool for searching ES text files

Gives you the option to search through the ES text files more quickly and compare stats between ships or outfits.

# Install
Just download the zip and copy the endless sky "data" folder into "ES-Parser/app/assets/".

# Running
To run simply click on the ES-Parser file for your corresponding platform.

# Search
The search mode allows the usage of flags for more fine tuning.
- -a: Searches through every single thing in the text files with the option of specific properties to look for.

  - ex: ship -a "Emergency Ramscoop" Transport

- -p: Grabs specific properties in the search

  - ex: ship -p bunks outfits->

  - (-> tells it to grab any properties one indent further. By default the parser ignores double quotes but you can turn this off by adding <- after the second double quote, ex: "Light Warship"<-)

  - ex with all flags: ship -a "Light Warship" -p weapon-> outfits->

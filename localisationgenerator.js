/*
Copyright (c) 2020 officialmugi/lnaban
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 

If you dare contact me about this not working I will yell at you.

Generates localisation files for Hearts of Iron IV by using existing localisation files from a mod and basegame. Uses default ideology groups to fill in blank names.

Usage: node localisationgenerator.js
Requires some tweaking, the lines up to line 27 might need to be changed depending on your use situation. If you can't figure this you're on your own sorry fam
THIS DOES NOT COVER COSMETIC TAGS, I'LL DO SOMETHING ABOUT IT LATER OKAY

*/

// DON'T CHANGE THESE TWO LINES, IF YOU DO AND DARE CONTACT ME I WILL GET MAD AT YOU 
const fs = require('fs');
const path = require('path');

const hoi4Folder = '/mnt/c/Games/steamapps/common/Hearts of Iron IV'; // This is the path to the base game
const modFolder = '/mnt/c/Users/VeryCoolUser/Documents/GitHub/CoolModFolder'; // This is the path to the mod you are making
const ideologies = 'localisationgenerator_ideologies.json' // Contains the ideologies and which vanilla ideologies they map to
var scannedTags = (fs.readFileSync(modFolder + "/common/country_tags/00_countries.txt") + "").split("\n"); // Double check that your country tags for the mod is in this path, otherwise change it. 
var language = "english"; // Change if using other language than English
var modLocalisation = "localisation/countries_l_" + language + ".yml"; // Existing localisation file for the mod, make sure it exists even if it is empty. Should be countries_l_english.yml by default. Relative to the mod folder, so no absolute location.
var outputFile = "localisation_l_english.yml"; // The file for output, you can always output it in the mod directory but like this it just outputs in the current directory.
var unfinishedString = "CHANGEME"; // Change this if you want to, if you add new countries you will have to use this to fill in their names. 

// Code begins here, you shouldn't edit this unless you know what you are doing
var countryTags = [];
const ideologiesObj = JSON.parse(fs.readFileSync(ideologies));
var allowedIdeologies = [];

// Validate tags to be added
for (var tag of scannedTags) {
	tag = tag.substring(0, 3);
	if (tag.match(/^[0-9A-Z]+$/)) {
		var countryList = [tag]; // One tag as header for an internal array
		countryTags.push(countryList); // Uses a 2D-array to store things
	}
}

// Add allowed ideologies
addAll(ideologiesObj.fascism);
addAll(ideologiesObj.democratic);
addAll(ideologiesObj.neutrality);
addAll(ideologiesObj.communism);

// Read the localisation files
var hoi4Localisation = (fs.readFileSync(hoi4Folder + "/localisation/countries_l_" + language + ".yml") + "").split("\n");
var modLocalisedFiles = (fs.readFileSync(modFolder + "/" + modLocalisation) + "").split("\n");

// Adding lines already in mod localisation file
addTags(modLocalisedFiles);

// Adding lines from the Hoi4 localisation file
addTags(hoi4Localisation);

// Adding missing ideologies, this might take some time
for (var country of countryTags) {
	var index = findTag(country[0], countryTags);
	for (var ideology of allowedIdeologies) {
		if (!ideologyExists(country[0] + "_" + ideology, country)) {
			countryTags[index].push(newIdeologyMapping(ideology, country[0], ""));
		}
		if (!ideologyExists(country[0] + "_" + ideology + "_DEF", country)) {
			countryTags[index].push(newIdeologyMapping(ideology, country[0], "_DEF"));
		}
		if (!ideologyExists(country[0] + "_" + ideology + "_ADJ", country)) {
			countryTags[index].push(newIdeologyMapping(ideology, country[0], "_ADJ"));
		}
	}
	if (!ideologyExists(country[0], country)) {
		countryTags[index].push(newIdeologyMapping("", country[0], ""));
	}
	if (!ideologyExists(country[0] + "_DEF", country)) {
		countryTags[index].push(newIdeologyMapping("", country[0], "_DEF"));
	}
	if (!ideologyExists(country[0] + "_ADJ", country)) {
		countryTags[index].push(newIdeologyMapping("", country[0], "_ADJ"));
	}
}

// Create the localisation file
var streamest = fs.createWriteStream(outputFile);
streamest.once('open', function(fd) {
	streamest.write("\ufeffl_english:\n");
	for (gamer of countryTags) {
		index = countryTags.indexOf(gamer);
		var ADJ = [];
		var genericList = [];
		for (i of gamer) {
			if (gamer.indexOf(i) != 0) {
				if (i.includes(i.substring(0,3) + ":") || i.includes(i.substring(0,3) + "_DEF") || i.includes(i.substring(0,3) + "_ADJ")) {
					genericList.push(i);
				} else if (i.includes("_ADJ")) {
					ADJ.push(i);
				} else {
					streamest.write(" " + i + "\n");
				}
			}
		}
		for (j of ADJ) {
			streamest.write(" " + j + "\n");
		}
		for (k of genericList) {
			streamest.write(" " + k + "\n");
		}
		streamest.write(" \n");
	}
	streamest.end();
});

// Functions used at some point lmao

function findTag(tag, selectedArray) {
	for (var tag2 of selectedArray) {
		if (tag === tag2[0]) {
			return selectedArray.indexOf(tag2);
		}
	}
}

function addTags(LocalisedFiles) {
	var lastTag = "";
	var index = 0;
	for (var tag of LocalisedFiles) {
		tag = tag.substring(1);
		if (tag.substring(0,3).match(/^[0-9A-Z]+$/)) {
			if (!(tag.substring(0,3) === lastTag)) {
				index = findTag(tag.substring(0,3), countryTags);
				lastTag = tag.substring(0,3);
			}
			if (countryTags[index]) {
				if (!ideologyExists(tag, countryTags[index]) && allowedIdeology(tag) || isGeneric(tag)) {
					countryTags[index].push(tag);
				}
			}
		}
	}
}

function ideologyExists(tag, tagArray) {
	for (var i of tagArray) {
		if (tag.split(":")[0] === i.split(":")[0] && tagArray.indexOf(i) > 0) return true;
	}
	return false;
}

function allowedIdeology(tag) {
	for (var i of allowedIdeologies) {
		if ((tag.split(":")[0]).replace("_DEF", "").replace("_ADJ", "").replace(tag.substring(0,3) + "_", "") === i) return true;
	}
	return false;
}

function addAll(i) {
	for (var j = 0; j < i.length; j++) {
		allowedIdeologies.push(i[j]);
	}
}

function newIdeologyMapping(ideology, tag, def) {
	var group = "";
	if((ideologiesObj.fascism).includes(ideology)) group = "fascism";
	else if((ideologiesObj.democratic).includes(ideology)) group = "democratic";
	else if((ideologiesObj.neutrality).includes(ideology)) group = "neutrality";
	else if((ideologiesObj.communism).includes(ideology)) group = "communism";
	if (!(ideology === "")) {
		ideology = "_" + ideology;
	} 
	
	for (var ideaString of modLocalisedFiles) {
		if ((" " + tag + "_" + group + def) === ideaString.split(":")[0]) {
			return tag + ideology + def + ":" + (ideaString.split(":")[1]);
		}
	}
	for (var ideaString of hoi4Localisation) {
		if ((" " + tag + "_" + group + def) === ideaString.split(":")[0]) {
			return tag + ideology + def + ":" + (ideaString.split(":")[1]);
		}
	}
	return tag + ideology + def + ':0 "' + unfinishedString + '"'; 
}

// In 1.9.1 or 1.9.2 Paradox added what seems to be generic country names (finally), this is a quick fix to deal with that
function isGeneric(tag) {
	if (tag.split(":")[0] === tag.substring(0,3) || tag.split(":")[0] === tag.substring(0,3) + "_DEF" || tag.split(":")[0] === tag.substring(0,3) + "_ADJ") {
		return true;
	}
	return false;
}
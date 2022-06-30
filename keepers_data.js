fetch = require('node-fetch');
const discordDisplay = require('./discord_display');

// active/inactive Keeper names and addrs
let activeKeepers = new Map();
let debugKeepers = new Map();

// 
async function updKeepersAddrsMap() {
    await fetch(`https://api.rook.fi/api/v1/coordinator/keepers`)
    .then(resp => resp.json())
    .then(allKeepersData => {
        // extract the active kepers
        for (const keeper of allKeepersData) {
            if (keeper.status === "active") {
                activeKeepers.set(keeper["name"], keeper["activeTakerAddresses"].map(element => {
                    return element.toLowerCase();
                }));
            }
            else {
                // debug (inactive) keepers
                debugKeepers.set(keeper["name"], keeper["activeTakerAddresses"].map(element => {
                    return element.toLowerCase();
                }));
            }
        }
    })
}

// keep track of subscribing/unsubscribing keepers
async function displayKeepersAddrsMap() {
    // current keepers addrs for the POST message   
    let fields = [];
    var firstIter = true;
    for (const [keeper, allKeeperAddrs] of activeKeepers) {
        let fieldName = '';
        if (firstIter) {
            fieldName = 'Current Keeper Addresses:\n';
            firstIter = false;
        }
        fieldName += `**${keeper}**:\n`;

        let fieldValue = '';
        for (const keeperAddr of allKeeperAddrs) {
            fieldValue += `> ${keeperAddr}\n`;
        }

        fields = fields.concat([{"name": fieldName, "value": fieldValue}]);
    }


    // if message not empty, sent POST req with keepers addrs to the discord channel
    await discordDisplay.postMessDiscord(fields);
}

async function periodicKeepersAddrsUpd() {
    // update the keepers addrs
    await updKeepersAddrsMap();

    // update the keepers addrs each hour
    setTimeout(periodicKeepersAddrsUpd, 600000);
}

module.exports = { activeKeepers, debugKeepers, updKeepersAddrsMap, displayKeepersAddrsMap, periodicKeepersAddrsUpd };

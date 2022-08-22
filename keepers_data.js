fetch = require('node-fetch');
const discordModule = require('./discord_display');

let activeKeepers = new Map();
let debugKeepers = new Map();


function getActiveKeepers() {
    return activeKeepers;
}

function getDebugKeepers() {
    return debugKeepers;
}

async function updateKeepersAddressMap() {
    return fetch(`https://api.rook.fi/api/v1/coordinator/keepers`)
        .then(resp => resp.json())
        .then(allKeepersData => {
            // extract the active kepers
            for (const keeper of allKeepersData) {
                if (keeper.status === "active") {
                    activeKeepers.set(keeper.name, keeper.activeTakerAddresses.map(element => {
                        return element.toLowerCase();
                    }));
                }
                else {
                    // debug (inactive) keepers
                    debugKeepers.set(keeper.name, keeper.activeTakerAddresses.map(element => {
                        return element.toLowerCase();
                    }));
                }
            }
        })
}

function displayKeepersAddressMap() { 
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
        let addressCounter = 0;
        let maxAddressesAllowedInPostRequest = 20;
        for (const keeperAddr of allKeeperAddrs) {
            addressCounter++;

            fieldValue += `> ${keeperAddr}\n`;

            if (!(addressCounter % maxAddressesAllowedInPostRequest) && addressCounter) {
                fields = fields.concat([{
                    "name": fieldName.concat(`- Total keepers: ${allKeeperAddrs.length}`,
                        `, batch: ${addressCounter-maxAddressesAllowedInPostRequest + 1}-${addressCounter}`), 
                    "value": fieldValue
                }]);
                fieldValue = '';
            }
        }
        if (fieldName.length > 0 && fieldValue.length > 0) {
            fields = fields.concat([{
                "name": fieldName.concat(`- Total keepers: ${allKeeperAddrs.length}`,
                    `, batch: ${addressCounter - addressCounter % maxAddressesAllowedInPostRequest + 1}-${addressCounter}`), 
                "value": fieldValue
            }]);
            // fields = fields.concat([{"name": fieldName, "value": fieldValue}]);
        }
        
    }
    // console.log(fields);

    discordModule.postDiscordMessage(fields);
}

// update the keepers addrs each hour
function periodicKeepersAddressUpdate() {
    updateKeepersAddressMap();

    setTimeout(periodicKeepersAddressUpdate, 600000);
}

module.exports = { getActiveKeepers, getDebugKeepers, updateKeepersAddressMap, displayKeepersAddressMap, periodicKeepersAddressUpdate };

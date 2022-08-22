// connect to eth ntw through an Infura node
const Web3 = require('web3');
let web3Provider = new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/ws/v3/ebad15b2e19d425ea600d0ce8a4b058c");
var web3 = new Web3(web3Provider);

// support modules 
const tokenDataModule = require("./token_metadata");
const keepersDataModule = require("./keepers_data");
const discordModule = require('./discord_display');

// contract and event addrs
const PROXY_0X_CONTRACT_ADDR = '0xdef1c0ded9bec7f1a1670819833240f027b25eff';
const TX_ORIGIN_COORD_ADDR = '0xbd49a97300e10325c78d6b4ec864af31623bb5dd';
const RFQ_ORDER_ORIGINS_ALLOWED_EV = '0x02dfead5eb769b298e82dd9650b31c40559a3d42701dbf53c931bc2682847c31';
const RFQ_ORDER_FILLED_EV = '0x829fa99d94dc4636925b38632e625736a614c154d55006b7ab6bea979c210c32';

// options for the getPastLogs (new keepers/order filled)
let originsAllowedOptions = {
    fromBlock: 14921992,                    //Number || "earliest" || "pending" || "latest"
    toBlock: 14921992,
    address: PROXY_0X_CONTRACT_ADDR,
    topics: [RFQ_ORDER_ORIGINS_ALLOWED_EV]   // new Keeper Taker addr registered
};
let orderFilledOptions = {
        fromBlock: 15049600,                  //Number || "earliest" || "pending" || "latest"
        toBlock: 15049800,
        address: PROXY_0X_CONTRACT_ADDR,
        topics: [RFQ_ORDER_FILLED_EV]      // Rfq order filled
};

// method to service RFQ_ORDER_ORIGINS_ALLOWED_EV events
async function originsEventCallback(error, results) {
    if (!error) {
        if (!Array.isArray(results))
            results = [results]; // if not an array of res was returned, rather only an element
        for (let i = 0; i < results.length; i++) {
            // block nr
            console.log(`Block nr: ${results[i].blockNumber}`);

            // decode data field in each results entry
            const dataRes = web3.eth.abi.decodeParameters(['address', 'address[]', 'bool'], results[i].data);
            
            if (TX_ORIGIN_COORD_ADDR === dataRes[0].toLowerCase()) {
                // POST req content to be sent to the webhook
                let fields = [];
                let fieldName = ''; 
                let fieldValue = '';

                // lowercase all addresses
                dataRes[1] = dataRes[1].map(element => {
                    return element.toLowerCase();
                });

                // get all active keepers addrs
                keeperTakerAddr = [].concat(...Array.from(keepersDataModule.getActiveKeepers().values()));
                // get rid of debugging keeper addrs
                let debugKeeperAddrs = [].concat(...Array.from(keepersDataModule.getDebugKeepers().values()))
                dataRes[1] = dataRes[1].filter(x => !debugKeeperAddrs.includes(x));

                if (dataRes[2]) {
                    // if the addr was allowed, update the Keeper Taker addrs
                    // welcome new user addresses
                    let newKeeperAddrs = '';
                    if (keeperTakerAddr.length > 0)
                        newKeeperAddrs = dataRes[1].filter(x => !keeperTakerAddr.includes(x));

                    if (newKeeperAddrs.length === 1) {
                        fieldName = `Welcome new Keeper:\n\n`;
                        fieldValue = `> ${newKeeperAddrs}\n`
                    }
                    else if (newKeeperAddrs.length > 1) {
                        fieldName = `Welcome new Keepers:\n\n`;
                        for (let j = 0; j < newKeeperAddrs.length; j++)
                            fieldValue += `> ${newKeeperAddrs[j]}\n`;
                    }
                }
                else {
                    // allowed param - false to unregister Keeper Taker Addresses
                    // old user addresses
                    let exKeeperAddrs = '';
                    if (keeperTakerAddr.length > 0)
                        exKeeperAddrs = keeperTakerAddr.filter(x => !dataRes[1].includes(x));

                    if (exKeeperAddrs.length === 1) {
                        fieldName = `Following Keeper just unsubscribed:\n`;
                        fieldValue = `> ${exKeeperAddrs}\n`
                    }
                    else if (exKeeperAddrs.length > 1) {
                        fieldName = `Following Keepers just unsubscribed:\n`;
                        for (let j = 0; j < exKeeperAddrs.length; j++)
                            fieldValue += `> ${exKeeperAddrs[j]}\n`;
                    }
                }

                if (fieldName.length > 0 && fieldValue.length > 0) {
                    fields = fields.concat([{"name": fieldName, "value": fieldValue}]);
                }

                // if message not empty, sent POST req with keepers addrs to the discord channel
                await discordModule.postDiscordMessage(fields);
            }
        }
    }
}

// old (deprecated) method to get Keeper Taker Addresses. Used mainly for testing purposes and doc of web3 calls.
async function getKeeperAddrs() {
    web3.eth.getPastLogs(originsAllowedOptions, async (error, results) => {
        // console.log(results)
        await originsEventCallback(error, results);
        // update the keepers map on subs event
        await keepersDataModule.updateKeepersAddressMap();
        // print the newly upd addrs map
        keepersDataModule.displayKeepersAddressMap();
    });
}

// method to subscribe to RFQ_ORDER_ORIGINS_ALLOWED_EV events
function originsAllowedSubscription() {
    web3.eth.subscribe('logs', {
        address: PROXY_0X_CONTRACT_ADDR,
        topics: [RFQ_ORDER_ORIGINS_ALLOWED_EV]
    })
    .on("data", async (results) => {
        // log res for debugging purposes
        // console.log(results);  
        // display the new/old keeper address(es)
        await originsEventCallback(null, results); // set error param to null to use the callback function
        // update the keepers map on subs event
        await keepersDataModule.updateKeepersAddressMap();
        // print the newly upd addrs map
        keepersDataModule.displayKeepersAddressMap();
    });
}

// method to service RFQ_ORDER_FILLED_EV events
async function orderFilledEventCallback(error, results) {  
    if (!error) {        
        let fields = [];
        if (!results.length)
            results = [results] // if not an array of res was returned, rather only an element
        for (let i = 0; i < results.length; i++) {
            // decode data field in each results entry
            const dataRes = web3.eth.abi.decodeParameters(['bytes32', 'address', 'address', 
                'address', 'address', 'uint128', 'uint128', 'bytes32'], results[i].data);
            // check if the taker address is enlisted into the Keeper Takers ones
            keeperTakerAddr = [].concat(...Array.from(keepersDataModule.getActiveKeepers().values()));
            if (keeperTakerAddr.includes(dataRes[2].toLowerCase())) {
                // block nr
                console.log(`Block nr: ${results[i].blockNumber}`);
                // get token market info
                makerTokenData = tokenDataModule.getTokenDataByAddress(dataRes[3].toLowerCase());
                takerTokenData = tokenDataModule.getTokenDataByAddress(dataRes[4].toLowerCase());

                if (makerTokenData && takerTokenData) {
                    // compute amounts exchanged
                    let makerAmount = +(Math.round(dataRes[6]/(10**makerTokenData["decimals"]) + "e+2")  + "e-2");
                    let takerAmount = +(Math.round(dataRes[5]/(10**takerTokenData["decimals"]) + "e+2")  + "e-2");
                    // get Tx keeper name
                    let keeperName = [...keepersDataModule.getActiveKeepers()].find(([key, value]) => value.includes(dataRes[2].toLowerCase()))[0]
                    // format the webhook message content
                    fieldName = `New OrderFill:\n\n`;
                    fieldValue = `${makerAmount} ${makerTokenData["name"]} to ${takerAmount} ${takerTokenData["name"]} (~$${Math.round(takerAmount*takerTokenData["latest_price"]["usd_price"])})\n\n`;
                    fieldValue += `Filled by Keeper ${keeperName}\n\n`;
                    fieldValue += `Tx link:\nhttps://etherscan.io/tx/${results[i]["transactionHash"]}\n\n`;

                    fields = fields.concat([{"name": fieldName, "value": fieldValue}]);
                }
            }
        }

        await discordModule.postDiscordMessage(fields);
    }
}

// old (deprecated) method to get past orders filled by Keeper. Used mainly for testing purposes and doc of web3 calls.
function filterOrderFilledLogs() {
    web3.eth.getPastLogs(orderFilledOptions, (error, results) => {
        orderFilledEventCallback(error, results);
    });
}

// method to subscribe to RFQ_ORDER_FILLED_EV events
function orderFilledEventSubscription() {
    web3.eth.subscribe('logs', {
        address: PROXY_0X_CONTRACT_ADDR,
        topics: [RFQ_ORDER_FILLED_EV]
    })
    .on("data", (results) => {
        // log res for debugging purposes
        // console.log(results);                       
        orderFilledEventCallback(null, results);    // set error param to null to use the callback function
    });
}

// main method to subscribe to the req events and periodically upd token and keepers data
async function trackOriginsAndOrderFilledEvents() {
    // make sure we are synced to the eth ntw
    web3.eth.isSyncing()
        .then(async (result) => {
            if (!result)    // false once the sync is done, see doc
            {
                console.log('Successfully synced!');

                // if server just started, display in Discord all active Keepers
                await keepersDataModule.updateKeepersAddressMap();
                keepersDataModule.displayKeepersAddressMap();
                // ... and some orderFilled past logs
                await tokenDataModule.updateTokenData();
                filterOrderFilledLogs();

                tokenDataModule.periodicTokenDataUpdate();
                // redundant periodic call (safety measure), keeper addrs are updated automatically in case of events
                // through the subscription callback mechanism
                keepersDataModule.periodicKeepersAddressUpdate();

                // perform event subscriptions
                originsAllowedSubscription();
                orderFilledEventSubscription();
            }
            else {
                console.log("Error at syncing! Restart server...");
            }
        })
}

module.exports = { trackOriginsAndOrderFilledEvents };

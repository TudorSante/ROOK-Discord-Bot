fetch = require('node-fetch');

let allTokenMetadata = [];

// update all token info
async function updAllTokenMetadata() {
    // endpoint to get the data of every token supported by the hidingbook
    await fetch(`https://api.rook.fi/api/v1/trade/tokens`)
    .then(resp => resp.json())
    .then(data => {
        allTokenMetadata = [];
        for (const tokenData of data) {
            allTokenMetadata = allTokenMetadata.concat([{name:tokenData["name"], address:tokenData["address"], decimals:tokenData["decimals"], icon_url:tokenData["icon_url"], latest_price:tokenData["latest_price"]}]);
        }
    })
}

// obtain token info based on contract address
function getTokenDataByAddr(tokenContractAddr) {
    for (const tokenData of allTokenMetadata) {
        if (tokenData["address"] === tokenContractAddr) {
            return tokenData;
        }
    }

    return 0;
}

async function periodicTokenDataUpd() {
    await updAllTokenMetadata();

    // update the token data each minute
    setTimeout(periodicTokenDataUpd, 60000);
}

module.exports = { updAllTokenMetadata, getTokenDataByAddr, periodicTokenDataUpd };

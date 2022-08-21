fetch = require('node-fetch');

let tokenData = [];

async function updateTokenData() {
    try {
        await fetch(`https://api.rook.fi/api/v1/trade/tokens`) // endpoint to get the data of every token supported by the hidingbook
        .then(resp => resp.json())
        .then(fetchedTokenData => {
            tokenData = [];

            for (const token of fetchedTokenData) {
                tokenData = tokenData.concat([{
                    name:token.name, 
                    address:token.address, 
                    decimals:token.decimals, 
                    icon_url:token.icon_url, 
                    latest_price:token.latest_price
                }]);
            }
        })
    } catch (error) {
        console.log(error);
    }
}

function getTokenDataByAddress(tokenContractAddr) {
    for (const token of tokenData) {
        if (token.address === tokenContractAddr) {
            return token;
        }
    }

    return null;
}

// update the token data each minute
async function periodicTokenDataUpdate() {
    await updateTokenData();

    setTimeout(periodicTokenDataUpdate, 60000);
}

module.exports = { updateTokenData, getTokenDataByAddress, periodicTokenDataUpdate };

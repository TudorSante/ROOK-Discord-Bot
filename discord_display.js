const axios = require("axios").default;

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/980194686557884508/3n60LRZGZcvNPB0dvfF9JMnEiBNLC1CsUgEhxbhx24hMUle7tmOFwFj5-h5b2kBqCwYc';

// format and display Discord message
async function postMessDiscord(fields) {
    if (fields.length) {
        // console.log(content);
        try {
            await axios.post(DISCORD_WEBHOOK_URL, {
                // content: content,
                embeds: [{
                    fields: 
                        fields
                }],
            })
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = { postMessDiscord };

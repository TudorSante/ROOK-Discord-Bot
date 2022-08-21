# ROOK-Discord-Bot setup steps:

## Clone the repo in a directory of your choice.
```bash
git init
git clone https://github.com/TudorSante/ROOK-Discord-Bot
```

## Install required dependencies starting with the main npm packs:
```bash
npm init
```

## Install the express server functionality:
```bash
npm install express
```

## Install the remaining dependencies:
```bash
npm install axios
npm install node-fetch
npm install web3
npm install nodemon
```

## Run the server app:
```bash
nodemon start
```

### Note: To display the event logs into a Discord channel of your choice, replace
<DISCORD_WEBHOOK_URL> in the file <discord_display.js> with an url of your own.

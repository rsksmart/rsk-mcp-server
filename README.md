# Rootstock MCP Server

A Model Context Protocol (MCP) server that provides onchain tools for Claude AI, allowing it to interact with the Rootstock (RSK) blockchain.

## Features

- Call contract functions on RSK Network
- Get ERC20 token balances
- Transfer ERC20 tokens
- Get current gas prices

## Installation

1. Clone this repository:
```bash
git clone https://github.com/rsksmart/rsk-mcp-server
cd rootstock-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
SEED_PHRASE="your twelve word seed phrase here"
```

## Usage

### Running the server

```bash
npm start
```

### Using with Claude

To use this MCP server with Claude, you need to add it to your MCP settings file:

For VSCode Claude extension:
```json
{
  "mcpServers": {
    "rsk": {
      "command": "node",
      "args": ["/path/to/rootstock-mcp/build/index.js"],
      "env": {
        "SEED_PHRASE": "your twelve word seed phrase here"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

For Claude desktop app:
```json
{
  "mcpServers": {
    "rsk": {
      "command": "node",
      "args": ["/path/to/rootstock-mcp/build/index.js"],
      "env": {
        "SEED_PHRASE": "your twelve word seed phrase here"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Available Tools

### call_contract

Call a contract function on RSK Network.

Parameters:
- `contractAddress`: The address of the contract to call
- `functionName`: The name of the function to call
- `functionArgs`: The arguments to pass to the function
- `abi`: The ABI of the contract
- `value` (optional): The value of RBTC to send with the transaction

### erc20_balance

Get the balance of an ERC20 token on RSK Network.

Parameters:
- `contractAddress`: The address of the contract to get the balance of

### erc20_transfer

Transfer an ERC20 token on RSK Network.

Parameters:
- `contractAddress`: The address of the contract to transfer the token from
- `toAddress`: The address of the recipient
- `amount`: The amount of tokens to transfer

### get_gas_price

Get the current gas price on RSK Network.

## License

MIT

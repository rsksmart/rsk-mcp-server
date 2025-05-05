[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/rsksmart/rsk-mcp-server/badge)](https://scorecard.dev/viewer/?uri=github.com/rsksmart/rsk-mcp-server)
[![CodeQL](https://github.com/rsksmart/rsk-mcp-server/workflows/CodeQL/badge.svg)](https://github.com/rsksmart/rsk-mcp-server/actions?query=workflow%3ACodeQL)
<img src="img/rootstock-docs.png" alt="Rootstock Logo" style="width:100%; height: auto;" />

# Rootstock MCP Server

This is a Model Context Protocol (MCP) server that provides onchain tools for Claude AI, allowing it to interact with the Rootstock blockchain.

## Features

- Call contract functions on Rootstock Network
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

```json
{
  "mcpServers": {
    "rootstock": {
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

Call a contract function on Rootstock Network.

Parameters:
- `contractAddress`: The address of the contract to call
- `functionName`: The name of the function to call
- `functionArgs`: The arguments to pass to the function
- `abi`: The ABI of the contract
- `value` (optional): The value of RBTC to send with the transaction

### erc20_balance

Get the balance of an ERC20 token on Rootstock Network.

Parameters:
- `contractAddress`: The address of the contract to get the balance of

### erc20_transfer

Transfer an ERC20 token on Rootstock Network.

Parameters:
- `contractAddress`: The address of the contract to transfer the token from
- `toAddress`: The address of the recipient
- `amount`: The amount of tokens to transfer

### get_gas_price

Get the current gas price on Rootstock Network.

## License

MIT

# Disclaimer
The software provided in this GitHub repository is offered “as is,” without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement.
- **Testing:** The software has not undergone testing of any kind, and its functionality, accuracy, reliability, and suitability for any purpose are not guaranteed.
- **Use at Your Own Risk:** The user assumes all risks associated with the use of this software. The author(s) of this software shall not be held liable for any damages, including but not limited to direct, indirect, incidental, special, consequential, or punitive damages arising out of the use of or inability to use this software, even if advised of the possibility of such damages.
- **No Liability:** The author(s) of this software are not liable for any loss or damage, including without limitation, any loss of profits, business interruption, loss of information or data, or other pecuniary loss arising out of the use of or inability to use this software.
- **Sole Responsibility:** The user acknowledges that they are solely responsible for the outcome of the use of this software, including any decisions made or actions taken based on the software’s output or functionality.
- **No Endorsement:** Mention of any specific product, service, or organization does not constitute or imply endorsement by the author(s) of this software.
- **Modification and Distribution:** This software may be modified and distributed under the terms of the license provided with the software. By modifying or distributing this software, you agree to be bound by the terms of the license.
- **Assumption of Risk:** By using this software, the user acknowledges and agrees that they have read, understood, and accepted the terms of this disclaimer and assumes all risks associated with the use of this software.

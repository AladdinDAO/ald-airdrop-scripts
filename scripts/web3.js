const Web3 = require('web3')

let web3 = new Web3(new Web3.providers.HttpProvider('YOUR_ARCHIVE_NODE_KEY'), null, {
  transactionConfirmationBlocks: 1,
})

const pk = 'YOUR_PRIVATE_KEY'

const importWallet = async() => {
  await web3.eth.accounts.wallet.add(pk)
}

let account = web3.eth.accounts.privateKeyToAccount(pk)
let walletAddress = account.address
module.exports = {
  web3,
  walletAddress,
  account,
  importWallet
}

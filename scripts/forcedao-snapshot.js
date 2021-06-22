const { web3, walletAddress } = require('./web3')
const blacklist = require('./blacklist.json')
const erc20ABI = require('../abi/ERC20.json') 
const fs = require('fs')

const oldForceAddress = '0x6807d7f7df53b7739f6438eabd40ab8c262c0aa8'
const xForceAddress = '0xe7f445b93eb9cdabfe76541cc43ff8de930a58e6'
const oldForceETHSushiLPAddress = '0xd10240e5365d4b86821d746a91ee1dcc84c3eff7'
const oldForceETHUniLPAddress = '0x5dc1a938d9caa215dd81d9425cd08ee19e7fb2e8'
const snapshotBlock = 12171679
const snapshotBlock1 = 12169679

const getInteractAddresses = async (contractAddress, startBlock, dataFilename) => {
  const pastEvents = await getPastEvents(contractAddress, startBlock, snapshotBlock)
  fs.writeFileSync(dataFilename, JSON.stringify(pastEvents), {flag: 'w'})
  // parse
  let addressSet = {}
  pastEvents.map((data) => {
    const from = data.returnValues.from
    const to = data.returnValues.to
    addressSet[from] = 1
    addressSet[to] = 1
  })
  delete addressSet[undefined]
  delete addressSet['0x0000000000000000000000000000000000000000']
  const addresses = Object.keys(addressSet)

  // console.log(JSON.stringify(Object.keys(addressSet)))
  return addresses
}


const getHistoricBalance = async (contractAddress, userAddress, block) => {
  const contract = new web3.eth.Contract(erc20ABI, contractAddress, {
    from: walletAddress
  });
  return await contract.methods.balanceOf(userAddress).call( { from: walletAddress}, block)
}


const getPastEvents = async (contractAddress, startBlock, endBlock) => {
  const contract = new web3.eth.Contract(erc20ABI, contractAddress, {
    from: walletAddress
  });
  const events = await contract.getPastEvents("Transfer", { fromBlock: startBlock, toBlock: endBlock})
  // const events = await contract.getPastEvents("allEvents", {fromBlock: 11719589, toBlock: 11720000 })
  return events
}

const takeSnapshot = async (tokenContractAddress, startBlock, addressFilename, balanceFilename, dataFilename) => {
  // Step 1
  const addressSet = await getInteractAddresses(tokenContractAddress, startBlock, dataFilename)
  fs.writeFileSync(addressFilename, JSON.stringify(addressSet), {flag: 'w'})
 
  // Step 2
  const addressListStr = fs.readFileSync(addressFilename)
  const addressList = JSON.parse(addressListStr)
  console.log('addr,snapshotBalance')
  let balanceList = {}
  for (const addr of addressList) {
    const snapshotBalance = await getHistoricBalance(tokenContractAddress, addr, snapshotBlock)
    if (snapshotBalance > 0) {
      balanceList[addr] = snapshotBalance
      console.log(addr, ',', snapshotBalance)
    }
  }
  fs.writeFileSync(balanceFilename, JSON.stringify(balanceList), {flag: 'w'})
}

const main = async () => {

  await takeSnapshot(oldForceAddress,
    11719589,
    '../jsons/01-forcedao-old-force-addresses.json',
    '../jsons/01-forcedao-old-force-balances.json',
    '../jsons/01-forcedao-old-force-events-data.json'
  )

  await takeSnapshot(xForceAddress,
    12125143,
    '../jsons/02-forcedao-xforce-addresses.json',
    '../jsons/02-forcedao-xforce-balances.json',
    '../jsons/02-forcedao-xforce-events-data.json'
  )

  await takeSnapshot(oldForceETHSushiLPAddress,
    12162164,
    '../jsons/03-forcedao-slp-addresses.json',
    '../jsons/03-forcedao-slp-balances.json',
    '../jsons/03-forcedao-slp-events-data.json'
  )
  await takeSnapshot(oldForceETHUniLPAddress,
    12145379,
    '../jsons/04-forcedao-unilp-addresses.json',
    '../jsons/04-forcedao-unilp-balances.json',
    '../jsons/04-forcedao-unilp-events-data.json'
  )
}

const getIndependentAddresses = async () => {

  const filename1 = '../jsons/01-forcedao-old-force-balances.json'
  const filename2 = '../jsons/02-forcedao-xforce-balances-1.json'
  const filename3 = '../jsons/02-forcedao-xforce-balances-2.json'
  const filename4 = '../jsons/03-forcedao-slp-balances.json'
  const filename5 = '../jsons/04-forcedao-unilp-balances.json'
  const jsonFiles = [filename1, filename2, filename3, filename4, filename5]

  let nonZeroBalance = {}
  const blacklistData = Array.from(blacklist)
  console.log('type', typeof blacklist, Array.from(blacklist))

  for (const filename of jsonFiles) {
    const file = fs.readFileSync(filename)
    const data = JSON.parse(file)

    for (const addr in data) {
      const balance = data[addr]
      if (Number(balance) > 0 && (blacklistData.indexOf(addr.trim().toLowerCase()) === -1)) {
        const key = addr.trim().toLowerCase()
        nonZeroBalance[key] = 1
        console.log(addr, ',', balance, ',', (blacklistData.indexOf(addr.trim().toLowerCase())))
      }
    }
  }

  // remove blacklisted address
  const mergedAddress = Object.keys(nonZeroBalance)
  // for (const addr of blacklist) {
  //   delete mergedAddress[addr]
  // }
  fs.writeFileSync('../jsons/05-forcedao-ald-airdrop-forcedao-addresses.json', JSON.stringify(mergedAddress), { flag: 'w' })
  return mergedAddress
}

main()
getIndependentAddresses()

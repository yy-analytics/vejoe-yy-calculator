
export const LATEST_BLOCK_QUERY = `
query indexingStatusForCurrentVersion($subgraphName: String) {
  indexingStatusForCurrentVersion(subgraphName: $subgraphName) {
      chains(network: "avalanche") {
          network
          latestBlock {
              hash
              number
          }
      }
  }
}
`

export const USER_VEJOE_QUERY = `
query users($idList: [String], $latestBlock: Int) {
  users(first: 1000, where: {id_in: $idList}, block: {number: $latestBlock}) {
    id
    joeStaked
    joeStakedUSD
    totalVeJoeMinted
    totalVeJoeBurned
    veJoeBalance
  }
}
`

export const USER_BALANCE_QUERY = `
query masterChef($id: String, $addresses: [String], $latestBlock: Int) {
  masterChef(id: $id, block: {number: $latestBlock}) {
    totalAllocPoint
    pools(first: 1000) {
      id
      pair
      allocPoint
      balance
      jlpBalance
      users(first: 1000, where: {address_in: $addresses}) {
        address
        amount
      }
    }
  }
}
`

export const PAIRS_EXCHANGE_PRICES_QUERY = `
query($idList: [String], $id: String, $latestBlock: Int) {
  pairs(first: 1000, where: {id_in: $idList}, block: {number: $latestBlock}) {
    id
    name
    reserveUSD
    totalSupply
    hourData(first: 24, orderBy: date, orderDirection: desc) {
      volumeUSD
      untrackedVolumeUSD
    }
  }
  bundle(id: 1, block: {number: $latestBlock}) {
    avaxPrice
  }
  token(id: $id, block: {number: $latestBlock}) {
    derivedAVAX
  }
}
`
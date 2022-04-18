
export const EXCHANGE_API_URL = 'https://api.thegraph.com/subgraphs/name/traderjoe-xyz/exchange';
export const BOOSTED_API_URL = 'https://api.thegraph.com/subgraphs/name/traderjoe-xyz/boosted-master-chef';
export const VEJOE_API_URL = 'https://api.thegraph.com/subgraphs/name/traderjoe-xyz/vejoe';
export const LATEST_BLOCK_API_URL = 'https://api.thegraph.com/index-node/graphql';

export const RPC_URL = 'https://api.avax.network/ext/bc/C/rpc';

export const BOOSTED_MASTERCHEF_ADDRESS = "0x4483f0b6e2f5486d06958c20f8c39a7abe87bf8f";
export const JOE_ADDRESS = "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd"

export const ZERO_18 = '000000000000000000'
export const POOL_FEE = 0.0025

// Do not add anything below with the name 'User'
export const COMPARISON_ADDRESSES = [
    {
        name: "Yield Yak",
        address: "0xe7462905B79370389e8180E300F58f63D35B725F",
        webpage: "https://yieldyak.com/farms?tab=allFarms&platform=traderjoe&farmType=vejoe"
    },
    {
        name: "Beefy",
        address: "0x1f2a8034f444dc55f963fb5925a9b6eb744eee2c",
        webpage: "https://app.beefy.com/#/"
    },
    {
        name: "North Pole",
        address: "0xf30e775240d4137daea097109fea882c406d61cc",
        webpage: "https://northpole.money/#/vejoe"
    },
];

export const BOOSTED_MASTERCHEF_ABI = [
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "", "type": "uint256"
            }
        ],
        "name": "poolInfo",
        "outputs": [
            {
                "internalType": "contract IERC20",
                "name": "lpToken",
                "type": "address"
            },
            {
                "internalType": "uint96",
                "name": "allocPoint",
                "type": "uint96"
            },
            {
                "internalType": "uint256",
                "name": "accJoePerShare",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "accJoePerFactorPerShare",
                "type": "uint256"
            },
            {
                "internalType": "uint64",
                "name": "lastRewardTimestamp",
                "type": "uint64"
            },
            {
                "internalType": "contract IRewarder",
                "name": "rewarder",
                "type": "address"
            },
            {
                "internalType": "uint32",
                "name": "veJoeShareBp",
                "type": "uint32"
            },
            {
                "internalType": "uint256",
                "name": "totalFactor",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "totalLpSupply",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "joePerSec",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]
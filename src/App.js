import Button from '@mui/material/Button'
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import InputAdornment from '@mui/material/InputAdornment';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { ApolloClient, InMemoryCache, gql } from '@apollo/client'
import { CssBaseline, Link, TextField, Tooltip } from '@mui/material';

import { BigNumber } from 'ethers';
import { Interface } from 'ethers/lib/utils';
import { ethers } from "ethers";


import {
  EXCHANGE_API_URL,
  BOOSTED_API_URL,
  VEJOE_API_URL,
  LATEST_BLOCK_API_URL,
  RPC_URL,
  BOOSTED_MASTERCHEF_ADDRESS,
  JOE_ADDRESS,
  COMPARISON_ADDRESSES,
  BOOSTED_MASTERCHEF_ABI,
  ZERO_18,
  POOL_FEE,
} from './constants'

import {
  LATEST_BLOCK_QUERY,
  USER_VEJOE_QUERY,
  USER_BALANCE_QUERY,
  PAIRS_EXCHANGE_PRICES_QUERY,
} from './queries'


async function getUserAddress() {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner()
  const address = await signer.getAddress()
  console.log(address);
}
getUserAddress();

// Borrowed from stack overflow...
const leftJoin = (objArr1, objArr2, key1, key2, defaults = {}) => objArr1.map(
  anObj1 => ({
    ...defaults,
    ...objArr2.find(
      anObj2 => anObj1[key1] === anObj2[key2]
    ),
    ...anObj1
  })
);

const callContractFunction = async (abi, contractAddress, contractFunction, functionData = [], defaultBlock = 'latest', rpcURL = RPC_URL) => {
  const iface = new Interface(abi);
  const _ = await fetch(rpcURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [
        {
          to: contractAddress,
          data: iface.encodeFunctionData(contractFunction, functionData),
        },
        defaultBlock,
      ],
    }),
  });
  const { result } = await _.json();
  const resultDecoded = iface.decodeFunctionResult(contractFunction, result)
  return resultDecoded;
};


const getGraphData = async (API_URL, QUERY, VARIABLES) => {
  const client = new ApolloClient({
    uri: API_URL,
    cache: new InMemoryCache(),
  });

  let result = null
  result = await client.query({
    query: gql(QUERY),
    variables: VARIABLES,
  })
  result = result["data"]
  return result
};

const formatNumber = (number) => {
  // this puts commas into the number eg 1000 goes to 1,000,
  return Math.floor(number)
    .toString()
    .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
};

const currencyFormat = (number) => {
  return '$' + formatNumber(number);
};

const percentageFormat = (number) => {
  return parseFloat(100 * number).toFixed(4) + '%';
}

const theme = createTheme({
  status: {
    danger: '#FFBE40',
  },
  palette: {
    primary: {
      main: '#1A77CD',
      darker: '#262626',
      contrastText: '#F0F0F0',
      headingText: '#969696',
    },
    success: {
      main: '#0EAB4D',
      contrastText: '#F0F0F0',
    },
    background: {
      default: '#262626',
      card: '#303030',
      paper: '#404040',
    },
    traderjoe: 'rgb(242, 113, 106)',
    button: {
      traderjoe: 'rgb(242, 113, 106)',
      yieldyak: '#553f77',
    }
  },
  typography: {
    h4: {
      color: '#F0F0F0',
    },
    h5: {
      color: '#F0F0F0',
    },
    body1: {
      color: '#F0F0F0',
    },
  }
});

function FarmCard(props) {
  const [toggleAddLiquidity, setToggleAddLiquidity] = React.useState('move');
  const [addLiquidity, setAddLiquidity] = React.useState(0);

  const handleToggleAddLiquidity = (event) => {
    setToggleAddLiquidity(event.target.value);
  }

  const handleAddLiquidityChange = (event) => {
    setAddLiquidity(event.target.value);
  }

  let poolTVL = toggleAddLiquidity === 'move' ? props.farmData.poolTVL : props.farmData.poolTVL + Number(addLiquidity)
  let poolJLPBalance = props.farmData.poolJLPBalance * poolTVL / props.farmData.poolTVL
  let poolAPR = props.farmData.poolAPR * poolTVL / props.farmData.poolTVL
  let joeAPR = props.farmData.joeAPR * poolTVL / props.farmData.poolTVL
  let userTVL = toggleAddLiquidity === 'move' ? props.farmData.userTVL : props.farmData.userTVL + Number(addLiquidity)
  let userJLPBalance = userTVL * poolJLPBalance / poolTVL
  let userFactor = Math.sqrt(userJLPBalance * props.farmData.userVeJoeBalance)
  let totalFactor = props.farmData.totalFactor - props.farmData.userFactor + userFactor
  let userBoostAPR = userTVL === 0 ? 0 : userFactor * props.joePerYearUSD * (props.farmData.veJoeShareBp / 10000) * props.farmData.allocPoint / (props.farmData.totalAllocPoint * totalFactor * userTVL)

  return (
    <Grid item xs={12} md={6} xl={4} height={400}>
      <Card align="left" raised sx={{ bgcolor: 'background.card', height: '100%', width: '100%', padding: '10px' }}>
        <Grid container spacing={2}>
          <Grid item xs={9}>
            <Grid item xs={12}>
              <Typography variant='h4'>
                {props.farmData.name}
              </Typography>
            </Grid>
            <Grid container spacing={2}>
              {[
                { label: 'Liquidity', value: currencyFormat(poolTVL), toolTip: poolJLPBalance + ' JLP' },
                { label: 'Pool APR', value: percentageFormat(poolAPR), toolTip: '' },
                { label: 'JOE APR', value: percentageFormat(joeAPR), toolTip: '' },
                { label: 'Your liquidity', value: currencyFormat(userTVL), toolTip: userJLPBalance + ' JLP' },
                { label: 'Your veJOE balance', value: formatNumber(props.farmData.userVeJoeBalance), toolTip: 'Staked JOE: ' + formatNumber(props.farmData.userJoeStaked) },
                { label: 'Your boost APR', value: percentageFormat(userBoostAPR), toolTip: 'User factor: ' + parseFloat(userFactor).toFixed(4) + ' Total factor: ' + parseFloat(totalFactor).toFixed(4) },
              ].map(item => (
                <Grid item xs={4}>
                  <Tooltip title={item.toolTip}>
                    <Grid container align="center">
                      <Grid item xs={12}>
                        <Typography variant='body1' sx={{ color: 'primary.headingText' }}>
                          {item.label}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant='body1'>
                          {item.value}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Tooltip>
                </Grid>
              )
              )}
            </Grid>
          </Grid>
          <Grid item xs={3}>
            <Grid container>
              <Grid item xs={12}>
                <FormControl>
                  <FormLabel id={"radio-buttons-" + props.farmData.id}>Calculate for</FormLabel>
                  <RadioGroup
                    aria-labelledby={"radio-buttons-" + props.farmData.id}
                    name="controlled-radio-buttons-group"
                    value={toggleAddLiquidity}
                    onChange={handleToggleAddLiquidity}
                  >
                    <FormControlLabel value="move" control={<Radio />} label="Move Liquidity" />
                    <FormControlLabel value="add" control={<Radio />} label="Add Liquidity" />
                  </RadioGroup>
                </FormControl>
              </Grid>
              {toggleAddLiquidity === 'move' ? "" :
                <Grid item xs={12}>
                  <TextField
                    label="Additional liquidity"
                    id="liquidity"
                    fullWidth
                    focused
                    color="success"
                    value={addLiquidity}
                    onChange={handleAddLiquidityChange}
                    sx={{ input: { color: 'primary.contrastText' } }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start" sx={{ color: 'primary.contrastText' }}>$</InputAdornment>,
                    }}
                  />
                </Grid>
              }
            </Grid>
          </Grid>
          {props.farmData.comparisons.map(comp => {
            let altCompTVL = toggleAddLiquidity === 'move' ? comp.compTVL : comp.compTVL + Number(addLiquidity)
            let altCompJLPBalance = altCompTVL * poolJLPBalance / poolTVL
            let altCompFactor = Math.sqrt(altCompJLPBalance * comp.compVeJoeBalance)
            let altTotalFactor = props.farmData.totalFactor - comp.compFactor + altCompFactor
            let altBoostAPR = toggleAddLiquidity === 'move' ? comp.altBoostAPR : (altCompTVL === 0 ? 0 : altCompFactor * props.joePerYearUSD * (props.farmData.veJoeShareBp / 10000) * props.farmData.allocPoint / (props.farmData.totalAllocPoint * altTotalFactor * altCompTVL))
            // The line below is pretty complex as we have to take into account how the total factor changing will impact on alternative's boosted APRs
            let altAnnualGain = toggleAddLiquidity === 'move' ? comp.altAnnualGain : (altBoostAPR * Number(addLiquidity) + props.farmData.userBoostAPR * (props.farmData.totalFactor / altTotalFactor) * props.farmData.userTVL) - userBoostAPR * userTVL
            
            return (
            <Grid item xs={12}>
              <Paper sx={{ bgcolor: 'background.paper', width: '100%', border: '1px solid green', padding: '5px' }}>
                <Grid container align='center' spacing={2}>
                  <Grid item xs={6}>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <Typography variant='body1'>
                          {comp.name}
                        </Typography>
                      </Grid>
                      {[
                        { label: 'Liquidity', value: currencyFormat(comp.compTVL), toolTip: comp.compJLPBalance + ' JLP' },
                        { label: 'veJOE balance', value: formatNumber(comp.compVeJoeBalance), toolTip: 'Staked JOE: ' + formatNumber(comp.compJoeStaked) },
                        { label: 'Boost APR', value: percentageFormat(comp.compBoostAPR), toolTip: 'Factor: ' + parseFloat(comp.compFactor).toFixed(4) },
                      ].map(item => (
                        <Tooltip title={item.toolTip}>
                          <Grid item xs={6}>
                            <Grid container align="center">
                              <Grid item xs={12}>
                                <Typography variant='body1' sx={{ color: 'primary.headingText' }}>
                                  {item.label}
                                </Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant='body1'>
                                  {item.value}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Grid>
                        </Tooltip>
                      ))}
                    </Grid>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ bgcolor: 'background.card', width: '100%', border: '1px solid green', padding: '5px' }}>
                      <Grid container>
                        <Grid item xs={12}>
                          <Typography variant='body1'>
                            If you move your LPs:
                          </Typography>
                        </Grid>
                        {[
                          { label: 'Boost APR', value: percentageFormat(altBoostAPR) },
                          { label: 'Annualised gains*', value: currencyFormat(altAnnualGain) },
                        ].map(item => (
                          <Grid item xs={6}>
                            <Grid container align="center">
                              <Grid item xs={12}>
                                <Typography variant='body1' sx={{ color: 'primary.headingText' }}>
                                  {item.label}
                                </Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant='body1'>
                                  {item.value}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Grid>
                        ))}
                        <Grid item xs={6}>
                          <Button variant='contained' sx={{ bgcolor: 'button.traderjoe' }} href={`https://traderjoexyz.com/farm/${props.farmData.pair}-${BOOSTED_MASTERCHEF_ADDRESS}#/`} target="_blank">
                            trader Joe
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button variant='contained' sx={{ bgcolor: 'button.yieldyak' }} href="https://yieldyak.com/farms?tab=allFarms&platform=traderjoe&farmType=vejoe" target="_blank">
                            {comp.name}
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )})}
        </Grid>
      </Card>
    </Grid>
  )
}

function App() {

  const [fullData, setFullData] = React.useState([]);
  const [chosenAddress, setChosenAddress] = React.useState("0x46f41e39fACdD1eA0E957827ef01082cb96dD361");
  const [latestBlock, setLatestBlock] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState("");
  const [jpy, setJPY] = React.useState(0);

  // React.useEffect(() => {
  //   handleRefreshData();
  // }, [])

  const handleAddressChange = (event) => {
    setChosenAddress(event.target.value);
  };

  const handleRefreshData = async () => {

    setLoading(true);

    // Start by getting the latest block for each of the subgraphs we will be using.
    setStatus("Getting latest block number...")

    let latestBlockNumbers = await Promise.all([
      'traderjoe-xyz/exchange',
      'traderjoe-xyz/boosted-master-chef',
      'traderjoe-xyz/vejoe',
    ].map(sg => getGraphData(LATEST_BLOCK_API_URL, LATEST_BLOCK_QUERY, { subgraphName: sg })))
    latestBlockNumbers = latestBlockNumbers.map(data => Number(data["indexingStatusForCurrentVersion"]["chains"][0]["latestBlock"]["number"]))

    const newLatestBlock = Math.min.apply(Math, latestBlockNumbers);
    setLatestBlock(newLatestBlock);

    // Here we just get an array for the addresses in which we are interested.
    let addresses = COMPARISON_ADDRESSES.map(ca => ca.address.toLowerCase())
    addresses.push(chosenAddress.toLowerCase())
    const allAddresses = COMPARISON_ADDRESSES.map(x => ({ name: x.name, address: x.address.toLowerCase() }))
    allAddresses.push(
      {
        name: 'User',
        address: chosenAddress.toLowerCase(),
      }
    )

    // Now we get the veJOE data for these addresses.
    setStatus("Getting veJOE data...")
    let userVeJoeData = await getGraphData(VEJOE_API_URL, USER_VEJOE_QUERY, {
      idList: addresses,
      latestBlock: newLatestBlock,
    })
    userVeJoeData = userVeJoeData.users

    // Now get the Boosted Master Chef data and user balance data.
    setStatus("Getting Boosted Master Chef data and balance data...")
    let userBalanceData = await getGraphData(BOOSTED_API_URL, USER_BALANCE_QUERY, {
      id: BOOSTED_MASTERCHEF_ADDRESS,
      addresses: addresses,
      latestBlock: newLatestBlock,
    })
    userBalanceData = userBalanceData.masterChef
    const boostedPairs = userBalanceData.pools.map(pool => pool.pair)

    // Now get the exchange data for each pair corresponding to a Boosted Pool, and the AVAX and JOE prices alongside these.
    setStatus("Getting info for the pairs in each farm...")
    let { pairs, bundle, token } = await getGraphData(EXCHANGE_API_URL, PAIRS_EXCHANGE_PRICES_QUERY, {
      idList: boostedPairs,
      id: JOE_ADDRESS.toLowerCase(),
      latestBlock: newLatestBlock,
    })

    let pairsData = pairs.map(pair => ({
      volumeUSD24H: pair.hourData.map(hd => Number(hd.volumeUSD)).reduce((a, b) => a + b),
      untrackedVolumeUSD24H: pair.hourData.map(hd => Number(hd.untrackedVolumeUSD)).reduce((a, b) => a + b),
      ...pair
    })).map(({ hourData, ...others }) => others)
    const avaxPrice = Number(bundle.avaxPrice)
    const joePrice = Number(token.derivedAVAX) * avaxPrice

    // Data from the graph is now complete... Time to get the last few parts from the chain directly.

    // Now get the required boosted master chef contract info directly using the RPC_URL
    setStatus("Getting reward rate for boosted pools...")
    let joePerSec = await callContractFunction(BOOSTED_MASTERCHEF_ABI, BOOSTED_MASTERCHEF_ADDRESS, 'joePerSec', [], ethers.utils.hexValue(newLatestBlock));
    joePerSec = Number((ZERO_18 + BigNumber.from(joePerSec[0]).toString()).replace(/(\d+)(\d{18})/, '$1.$2'))

    setStatus("Getting poolInfo for boosted pools...")
    const poolIDs = userBalanceData.pools.map(pool => pool.id)
    let poolInfo = await Promise.all(poolIDs.map(
      async (id) => {
        return ({ id: id, result: await callContractFunction(BOOSTED_MASTERCHEF_ABI, BOOSTED_MASTERCHEF_ADDRESS, 'poolInfo', [id], ethers.utils.hexValue(newLatestBlock)) })
      }
    ))
    poolInfo = poolInfo.map(pool => ({
      poolID: pool.id,
      totalFactor: Number((ZERO_18 + BigNumber.from(pool.result.totalFactor).toString()).replace(/(\d+)(\d{18})/, '$1.$2')),
      veJoeShareBp: pool.result.veJoeShareBp
    }))

    // At this point we have all of the data required, it's just a case of stitching it together in the right way to get what we need.
    setStatus("Aggregating and calculating...")
    let completeData = userBalanceData.pools.map(pool => ({
      totalAllocPoint: Number(userBalanceData.totalAllocPoint),
      ...pool
    }))
    completeData = leftJoin(completeData, poolInfo, 'id', 'poolID')
    completeData = leftJoin(completeData, pairsData, 'pair', 'id')

    // Below we add in the user data (complex)
    completeData = completeData.map(pool => (
      {
        ...pool,
        users: leftJoin(
          leftJoin(
            allAddresses, pool.users, 'address', 'address', { amount: "0" }
          ),
          userVeJoeData,
          'address',
          'id',
          {
            joeStaked: "0",
            joeStakedUSD: "0",
            totalVeJoeMinted: "0",
            totalVeJoeBurned: "0",
            veJoeBalance: "0",
          }
        )
      }
    ))

    // Here we start some of the calculations...
    const joePerYearUSD = joePerSec * 60 * 60 * 24 * 365 * joePrice
    setJPY(joePerYearUSD)
    // Useful to have this before the next ones.
    completeData = completeData.map(pool => (
      {
        ...pool,
        poolTVL: Number(pool.jlpBalance) * Number(pool.reserveUSD) / Number(pool.totalSupply),
        poolJLPBalance: Number(pool.jlpBalance),
        allocPoint: Number(pool.allocPoint),
        poolID: Number(pool.poolID),
      }
    ))
    // Here we do a lot of number conversions and calculations ahead of the next step
    completeData = completeData.map(pool => (
      {
        ...pool,
        poolAPR: POOL_FEE * pool.untrackedVolumeUSD24H * 365 / pool.poolTVL,
        joeAPR: joePerYearUSD * pool.allocPoint * (1 - pool.veJoeShareBp / 10000) / (pool.totalAllocPoint * pool.poolTVL),
        userTVL: Number((ZERO_18 + pool.users.find(user => user.address === chosenAddress.toLowerCase()).amount).replace(/(\d+)(\d{18})/, '$1.$2')) * pool.poolTVL / Number((ZERO_18 + pool.balance).replace(/(\d+)(\d{18})/, '$1.$2')),
        userJLPBalance: Number((ZERO_18 + pool.users.find(user => user.address === chosenAddress.toLowerCase()).amount).replace(/(\d+)(\d{18})/, '$1.$2')),
        userVeJoeBalance: Number(pool.users.find(user => user.address === chosenAddress.toLowerCase()).veJoeBalance),
        userJoeStaked: Number(pool.users.find(user => user.address === chosenAddress.toLowerCase()).joeStaked),
        comparisons: pool.users.filter(user => user.address != chosenAddress.toLowerCase()).map(
          user => ({
            name: user.name,
            compTVL: Number((ZERO_18 + user.amount).replace(/(\d+)(\d{18})/, '$1.$2')) * pool.poolTVL / Number((ZERO_18 + pool.balance).replace(/(\d+)(\d{18})/, '$1.$2')),
            compJLPBalance: Number((ZERO_18 + user.amount).replace(/(\d+)(\d{18})/, '$1.$2')),
            compVeJoeBalance: Number(user.veJoeBalance),
            compJoeStaked: Number(user.joeStaked),
          })
        ),
      }
    ))
    // Here we add the boost APRs for the user and alternatives.
    completeData = completeData.map(pool => (
      {
        ...pool,
        userFactor: Math.sqrt(pool.userJLPBalance * pool.userVeJoeBalance),
        userBoostAPR: pool.userTVL === 0 ? 0 : Math.sqrt(pool.userJLPBalance * pool.userVeJoeBalance) * joePerYearUSD * (pool.veJoeShareBp / 10000) * pool.allocPoint / (pool.totalAllocPoint * pool.totalFactor * pool.userTVL),
        comparisons: pool.comparisons.map(
          comp => ({
            ...comp,
            compFactor: Math.sqrt(comp.compJLPBalance * comp.compVeJoeBalance),
            compBoostAPR: comp.compTVL === 0 ? 0 : Math.sqrt(comp.compJLPBalance * comp.compVeJoeBalance) * joePerYearUSD * (pool.veJoeShareBp / 10000) * pool.allocPoint / (pool.totalAllocPoint * pool.totalFactor * comp.compTVL),
            altBoostAPR: (comp.compTVL + pool.userTVL) === 0 ? 0 : Math.sqrt((comp.compJLPBalance + pool.userJLPBalance) * comp.compVeJoeBalance) * joePerYearUSD * (pool.veJoeShareBp / 10000) * pool.allocPoint / (pool.totalAllocPoint * (pool.totalFactor - Math.sqrt(pool.userJLPBalance * pool.userVeJoeBalance) - Math.sqrt(comp.compJLPBalance * comp.compVeJoeBalance) + Math.sqrt((comp.compJLPBalance + pool.userJLPBalance) * comp.compVeJoeBalance)) * (comp.compTVL + pool.userTVL)),
          })
        )
      }
    ))
    // Finally we add the annualised gain calculation.
    completeData = completeData.map(pool => (
      {
        ...pool,
        comparisons: pool.comparisons.map(
          comp => ({
            ...comp,
            altAnnualGain: (comp.altBoostAPR - pool.userBoostAPR) * pool.userTVL
          })
        )
      }
    ))
    // Final step is just dropping the fields we don't want to make use of...
    completeData = completeData.map((
      {
        balance,
        id,
        jlpBalance,
        reserveUSD,
        totalSupply,
        users,
        ...others
      }) => others
    )
    console.log(completeData)
    setFullData(completeData);
    setStatus("")
    setLoading(false)
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{
        height: '100vh',
        padding: "10px",
        '& .super-app-theme--yy': {
          bgcolor: "success.main",
        }
      }}>
        <Grid container spacing={2} align="center" sx={{ height: '100%', }}>
          <Grid container item alignItems="center">
            <Grid item xs={12} sm={6}>
              <Typography variant="h4">Liquidity Optimiser - veJOE boosted farms</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Address"
                id="address"
                fullWidth
                focused
                color="success"
                disabled={loading}
                value={chosenAddress}
                onChange={handleAddressChange}
                sx={{ input: { color: 'primary.contrastText' } }}
              />
            </Grid>
            <Grid item xs={12} lg={2}>
              <Grid container spacing={0}>
                <Grid item xs={12}>
                  <Box sx={{ m: 1, position: 'relative' }}>
                    <Button
                      variant="contained"
                      onClick={handleRefreshData}
                      disabled={loading}
                    >
                      Refresh data
                    </Button>
                    {loading && (
                      <CircularProgress
                        size={24}
                        sx={{
                          color: "white",
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          marginTop: '-12px',
                          marginLeft: '-12px',
                        }}
                      />
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body1">Last refresh: {latestBlock === "" ? "n/a" : "block " + latestBlock}</Typography>
                </Grid>
                {
                  status === "" ? "" :
                    <Grid item xs={12}>
                      <Typography variant="body1">{status}</Typography>
                    </Grid>
                }
              </Grid>
            </Grid>
          </Grid>
          <Grid container spacing={2} height={'80vh'}>
            {fullData.map(farm => (
              <FarmCard
                id={farm.poolID}
                farmData={farm}
                joePerYearUSD={jpy}
              />
            ))}
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}

export default App;

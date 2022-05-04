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
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InfoIcon from '@mui/icons-material/Info';
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

// For now will not add the connection to MetaMask.
// async function getUserAddress() {
//   const provider = new ethers.providers.Web3Provider(window.ethereum)
//   await provider.send("eth_requestAccounts", []);
//   const signer = provider.getSigner()
//   const address = await signer.getAddress()
//   console.log(address);
// }
// getUserAddress();

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
      comp: '#553f77',
      yieldyak: '#0EAB4D',
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
    subtitle2: {
      color: '#F0F0F0',
    },
  }
});

function FarmCard(props) {
  const [toggleAddLiquidity, setToggleAddLiquidity] = React.useState(props.farmData.userTVL === 0 ? 'add' : 'move');
  const [addLiquidity, setAddLiquidity] = React.useState('');
  const [addVeJoe, setAddVeJoe] = React.useState('');

  const handleToggleAddLiquidity = (event) => {
    setToggleAddLiquidity(event.target.value);
  }

  const handleAddLiquidityChange = (event) => {
    setAddLiquidity(event.target.value);
  }

  const handleAddVeJoeChange = (event) => {
    setAddVeJoe(event.target.value);
  }

  let poolTVL = toggleAddLiquidity === 'move' ? props.farmData.poolTVL : props.farmData.poolTVL + Number(addLiquidity)
  let poolJLPBalance = props.farmData.poolJLPBalance * poolTVL / props.farmData.poolTVL
  let poolAPR = props.farmData.poolAPR * props.farmData.poolTVL / poolTVL
  let joeAPR = props.farmData.joeAPR * props.farmData.poolTVL / poolTVL
  let userTVL = toggleAddLiquidity === 'move' ? props.farmData.userTVL : props.farmData.userTVL + Number(addLiquidity)
  let userJLPBalance = userTVL * props.farmData.poolJLPBalance / props.farmData.poolTVL
  let userVeJoeBalance = toggleAddLiquidity === 'move' ? props.farmData.userVeJoeBalance : props.farmData.userVeJoeBalance + Number(addVeJoe)
  let userFactor = Math.sqrt(userJLPBalance * userVeJoeBalance)
  let totalFactor = props.farmData.totalFactor - props.farmData.userFactor + userFactor
  let userBoostAPR = userTVL === 0 ? 0 : userFactor * props.joePerYearUSD * (props.farmData.veJoeShareBp / 10000) * props.farmData.allocPoint / (props.farmData.totalAllocPoint * totalFactor * userTVL)

  let extraComp = props.farmData.comparisons.map(comp => {
    let altCompTVL = toggleAddLiquidity === 'move' ? comp.compTVL : comp.compTVL + Number(addLiquidity)
    let altCompJLPBalance = altCompTVL * poolJLPBalance / poolTVL
    let altCompFactor = Math.sqrt(altCompJLPBalance * comp.compVeJoeBalance)
    let altUserFactor = Math.sqrt(props.farmData.userJLPBalance * userVeJoeBalance)
    let altTotalFactor = props.farmData.totalFactor - comp.compFactor + altCompFactor - props.farmData.userFactor + altUserFactor
    let altUserBoostAPR = props.farmData.userTVL === 0 ? 0 : altUserFactor * props.joePerYearUSD * (props.farmData.veJoeShareBp / 10000) * props.farmData.allocPoint / (props.farmData.totalAllocPoint * altTotalFactor * props.farmData.userTVL)
    let altBoostAPR = toggleAddLiquidity === 'move' ? comp.altBoostAPR : (altCompTVL === 0 ? 0 : altCompFactor * props.joePerYearUSD * (props.farmData.veJoeShareBp / 10000) * props.farmData.allocPoint / (props.farmData.totalAllocPoint * altTotalFactor * altCompTVL))
    // The line below is pretty complex as we have to take into account how the total factor changing will impact on alternative's boosted APRs
    let altAnnualGain = toggleAddLiquidity === 'move' ? comp.altAnnualGain : (altBoostAPR * Number(addLiquidity) + altUserBoostAPR * props.farmData.userTVL) - userBoostAPR * userTVL
    let altTotalAPR = poolAPR + joeAPR + altBoostAPR
    return (
      {
        ...comp,
        altCompTVL: altCompTVL,
        altCompJLPBalance: altCompJLPBalance,
        altCompFactor: altCompFactor,
        altTotalFactor: altTotalFactor,
        altBoostAPR: altBoostAPR,
        altAnnualGain: altAnnualGain,
        altTotalAPR: altTotalAPR,
      }
    )
  })
  let addRecommendation = extraComp.reduce((res, row) => row.altAnnualGain > res.altAnnualGain && row.compTVL > 0 ? row : res)
  let recommendation = (toggleAddLiquidity === 'move' ?
    (props.farmData.moveRecommendation.altAnnualGain > 0
      ? ('Best APR (before fees) if you moved your LP tokens is with ' + props.farmData.moveRecommendation.name + ' for ~' + currencyFormat(props.farmData.moveRecommendation.altAnnualGain) + ' benefit.'
        + (props.farmData.moveRecommendation.name === 'Yield Yak' ? '' : ' DYOR on this platform before moving LP tokens.'))
      : (props.farmData.userTVL > 0 ? 'Keep your LP tokens staked with Trader Joe' : 'n/a')
    )
    : (addRecommendation.altAnnualGain > 0
      ? ('Best APR (before fees) for your new LP tokens is with ' + addRecommendation.name + ' for ~' + currencyFormat(addRecommendation.altAnnualGain) + ' benefit.'
        + (addRecommendation.name === 'Yield Yak' ? '' : ' DYOR on this platform before depositing.'))
      : (addLiquidity > 0 ? 'Farm your LP tokens with Trader Joe directly' : 'Enter additional liquidity to see best APR (before fees).')
    )
  )

  return (
    <Grid item xs={12} lg={6}>
      <Card align="left" raised sx={{ bgcolor: 'background.card', height: '100%', width: '100%', padding: '10px' }}>
        <Grid container spacing={2}>
          <Grid item xs={9}>
            <Grid item xs={12}>
              <Tooltip title={'Pool ID: ' + props.farmData.poolID}>
                <Typography variant='h4'>
                  {props.farmData.name}
                </Typography>
              </Tooltip>
            </Grid>
            <Grid container spacing={2}>
              {[
                { label: 'Liquidity', value: currencyFormat(poolTVL), toolTip: poolJLPBalance + ' JLP' },
                { label: 'Pool APR', value: percentageFormat(poolAPR), toolTip: '' },
                { label: 'JOE APR', value: percentageFormat(joeAPR), toolTip: '' },
                { label: 'Your liquidity', value: currencyFormat(userTVL), toolTip: userJLPBalance + ' JLP' },
                { label: 'Your veJOE balance', value: formatNumber(userVeJoeBalance), toolTip: 'Current staked JOE: ' + formatNumber(props.farmData.userJoeStaked) },
                { label: 'Your boost APR', value: percentageFormat(userBoostAPR), toolTip: 'User factor: ' + parseFloat(userFactor).toFixed(4) + ' Total factor: ' + parseFloat(totalFactor).toFixed(4) },
              ].map(item => (
                <Grid item xs={4} key={item.label}>
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
              <Grid item xs={8}>
                <Typography variant='body1' sx={{ color: 'yellow' }}>
                  {recommendation}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Grid container align="center">
                  <Grid item xs={12}>
                    <Tooltip title="Unstake LP tokens here, or add liquidity by following 'Get LP Tokens' on this page">
                      <Button variant='contained' sx={{ bgcolor: 'button.traderjoe' }} href={`https://traderjoexyz.com/farm/${ethers.utils.getAddress(props.farmData.pair)}-${ethers.utils.getAddress(BOOSTED_MASTERCHEF_ADDRESS)}`} target="_blank">
                        Trader Joe
                      </Button>
                    </Tooltip>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={3}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl>
                  <FormLabel id={"radio-buttons-" + props.farmData.id}>Calculate for</FormLabel>
                  <RadioGroup
                    aria-labelledby={"radio-buttons-" + props.farmData.id}
                    name="controlled-radio-buttons-group"
                    value={toggleAddLiquidity}
                    onChange={handleToggleAddLiquidity}
                  >
                    <FormControlLabel value="move" control={<Radio />} label="Move LPs" />
                    <FormControlLabel value="add" control={<Radio />} label="Add Liquidity / veJOE" />
                  </RadioGroup>
                </FormControl>
              </Grid>
              {toggleAddLiquidity === 'move' ? "" :
                <Grid item xs={12}>
                  <TextField
                    label="Additional liquidity ($)"
                    id="liquidity"
                    fullWidth
                    focused
                    color="success"
                    type="number"
                    size="small"
                    inputProps={{ min: 0, max: 999999999, step: 1000 }}
                    value={addLiquidity}
                    onChange={handleAddLiquidityChange}
                    sx={{ input: { color: 'primary.contrastText' } }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><span style={{ color: 'white' }}>$</span></InputAdornment>,
                    }}
                  />
                </Grid>
              }
              {toggleAddLiquidity === 'move' ? "" :
                <Grid item xs={12}>
                  <TextField
                    label="Additional veJOE"
                    id="veJoe"
                    fullWidth
                    focused
                    color="success"
                    type="number"
                    size="small"
                    inputProps={{ min: 0, max: 99999999999, step: 1000 }}
                    value={addVeJoe}
                    onChange={handleAddVeJoeChange}
                    sx={{ input: { color: 'primary.contrastText' } }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end"><span style={{ color: 'white' }}>veJOE</span></InputAdornment>,
                    }}
                  />
                </Grid>
              }
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
              >
                <Typography>Compare options</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container align='center' spacing={1}>
                  {extraComp.map(comp => {
                    if (comp.compTVL === 0) {
                      return null
                    }
                    return (
                      <Grid item xs={12} key={comp.name}>
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
                                  <Tooltip title={item.toolTip} key={item.label}>
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
                                      {toggleAddLiquidity === 'move' ? 'If you move your LPs:' : 'If you add new liquidity:'}
                                    </Typography>
                                  </Grid>
                                  {[
                                    { label: 'Boost APR', value: percentageFormat(comp.altBoostAPR), toolTip: 'Factor: ' + parseFloat(comp.altCompFactor).toFixed(4) + ' Total factor: ' + parseFloat(comp.altTotalFactor).toFixed(4) },
                                    { label: 'Annualised gains*', value: currencyFormat(comp.altAnnualGain), toolTip: '* see explanation note on fees' },
                                    { label: 'Total APR*', value: percentageFormat(comp.altTotalAPR), toolTip: '* see explanation note on fees and APR vs APY' },
                                  ].map(item => (
                                    <Tooltip title={item.toolTip} key={item.label}>
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
                                  <Grid item xs={6}>
                                    <Grid container align="center" spacing={1}>
                                      <Grid item xs={12}>
                                        <Tooltip title="Deposit your LP tokens here">
                                          <Button variant='contained' sx={{ bgcolor: 'button.comp' }} href={comp.webpage} target="_blank">
                                            {comp.name}
                                          </Button>
                                        </Tooltip>
                                      </Grid>
                                      {
                                        comp.yy_webpage && (
                                          <Grid item xs={12}>
                                            <Button
                                              variant='contained'
                                              sx={{ bgcolor: 'button.yieldyak' }}
                                              href={comp.yy_webpage}
                                              target="_blank"
                                              endIcon={
                                                <Tooltip title={
                                                  <Typography>
                                                    {/* <span role="img" aria-label="flame">🔥🔥🔥</span> */}
                                                    {/* <br/> */}
                                                    You may be able to benefit from the veJoe boost of Vector whilst also compounding ALL of your rewards (the JOE tokens as well as the additional VTX tokens) by depositing your JLP tokens in the Vector LP farms on Yield Yak. We know it sounds complex (farming with Trader Joe via Vector via Yield Yak) but there are gains to be had, especially if your main focus is accruing more of the underlying pool assets!
                                                    {/* <br/> */}
                                                    <span role="img" aria-label="flame">🔥🔥🔥</span>
                                                  </Typography>
                                                }>
                                                  <InfoIcon />
                                                </Tooltip>
                                              }
                                            >
                                              <Tooltip title="Deposit your LP tokens here">
                                                <Typography variant="button">
                                                  Yield Yak
                                                </Typography>
                                              </Tooltip>
                                            </Button>
                                          </Grid>)
                                      }
                                    </Grid>
                                  </Grid>
                                </Grid>
                              </Paper>
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                    )
                  })}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>
      </Card>
    </Grid>
  )
}

function App() {

  const [fullData, setFullData] = React.useState([]);
  const [chosenAddress, setChosenAddress] = React.useState("");
  const [showAddressError, setShowAddressError] = React.useState(false);
  const [latestBlock, setLatestBlock] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState("");
  const [jpy, setJPY] = React.useState(0);

  // React.useEffect(() => {
  //   handleRefreshData();
  // }, [])

  const handleAddressChange = (event) => {
    setChosenAddress(event.target.value);
    // setShowAddressError(false);
  };

  const handleRefreshData = async () => {

    setLoading(true);
    setFullData([]);
    setShowAddressError(!(ethers.utils.isAddress(chosenAddress) || chosenAddress === ""))

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
    const userAddress = ethers.utils.isAddress(chosenAddress) ? ethers.utils.getAddress(chosenAddress).toLowerCase() : ""
    addresses.push(userAddress)
    const allAddresses = COMPARISON_ADDRESSES.map(x => ({ name: x.name, address: x.address.toLowerCase(), webpage: x.webpage, yy_webpage: x.yy_webpage }))
    allAddresses.push(
      {
        name: 'User',
        address: userAddress,
        webpage: '',
        yy_webpage: '',
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
        poolAPR: POOL_FEE * (pool.volumeUSD24H === 0 ? pool.untrackedVolumeUSD24H : pool.volumeUSD24H) * 365 / pool.poolTVL,
        joeAPR: joePerYearUSD * pool.allocPoint * (1 - pool.veJoeShareBp / 10000) / (pool.totalAllocPoint * pool.poolTVL),
        userTVL: Number((ZERO_18 + pool.users.find(user => user.address === userAddress).amount).replace(/(\d+)(\d{18})/, '$1.$2')) * pool.poolTVL / Number((ZERO_18 + pool.balance).replace(/(\d+)(\d{18})/, '$1.$2')),
        userJLPBalance: Number((ZERO_18 + pool.users.find(user => user.address === userAddress).amount).replace(/(\d+)(\d{18})/, '$1.$2')),
        userVeJoeBalance: Number(pool.users.find(user => user.address === userAddress).veJoeBalance),
        userJoeStaked: Number(pool.users.find(user => user.address === userAddress).joeStaked),
        comparisons: pool.users.filter(user => user.address !== userAddress).map(
          user => ({
            name: user.name,
            webpage: user.webpage,
            yy_webpage: user.yy_webpage,
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
    // Here we find the best option for moving liquidity (comparison option needs to have some TVL already, esle we assume it's not an option as the farm doesn't exist).
    completeData = completeData.map(pool => (
      {
        ...pool,
        moveRecommendation: pool.comparisons.reduce((res, row) => row.altAnnualGain > res.altAnnualGain && row.compTVL > 0 ? row : res)
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
    // First sort by pool TVL
    completeData = completeData.sort((a, b) => b.poolTVL - a.poolTVL)
    // Then sort by user TVL
    completeData = completeData.sort((a, b) => b.userTVL - a.userTVL)
    // Finally sort by the annualised gains (when there is something to move)
    completeData = completeData.sort((a, b) => b.userTVL === 0 || a.userTVL === 0 ? 0 : b.moveRecommendation.altAnnualGain - a.moveRecommendation.altAnnualGain)
    // console.log(completeData)
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
              <Grid container alignItems="center">
                <Grid item xs={2} sm={1}>
                  <IconButton href="https://yieldyak.com/farms?tab=allFarms&platform=traderjoe&farmType=vejoe" target="_blank">
                    <Avatar src="https://yieldyak.com/static/favicon/favicon-96x96.png" >
                    </Avatar>
                  </IconButton>
                </Grid>
                <Grid item xs={10} sm={11}>
                  <Grid container alignItems="center" spacing={1}>
                    <Grid item xs={12}>
                      <Typography variant="h4">Liquidity Optimiser - veJOE boosted farms</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">A Yield Yak community product</Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Your Address"
                id="address"
                fullWidth
                focused
                color="success"
                error={showAddressError}
                helperText={showAddressError ? "Invalid address - will treat as blank entry" : ''}
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
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                >
                  <Typography><strong>Explanation / Background / Tip Jar / (*)</strong></Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography textAlign={'left'}>
                    This calculator is intended to allow the user to optimise where they choose to stake / farm their LP tokens for Trader Joe veJOE-boosted farms.
                    <br /><br />
                    When it comes to farming LP tokens, there are many more options than just staking on Trader Joe itself and many auto-compounders (such as Yield Yak)
                    do the heavy lifting for you by selling the reward tokens for more LP tokens (i.e. adding more liquidity to the pool), so that in the end, you deposit
                    JLP and exit with more JLP than you started with that you can then convert back to the underlying tokens on Trader Joe. There are a few options listed in
                    this calculator. We cannot accept liability for any SC risks that arise from actions taken as a result of data shown in this calculator. DYOR.
                    <br /><br />
                    There are already benefits to using an auto-compounder (as the name suggests, your rewards are automatically compounded which leads to higher overall returns), but what's
                    particularly special about the veJOE boosted farms is that auto-compounders like Yield Yak can accrue huge amounts of veJOE, the likes of which are normally
                    only in the possession of whales. This allows users with more modest holdings to also benefit from veJOE-related boosts (think of it as a whale with a large
                    veJOE holding is adding your liquidity on your behalf, but you get to take advantage of their veJOE for the boost).
                    <br /><br />
                    From our analysis, it's not just users with modest holdings who stand to benefit though - there are many whales who would benefit greatly by moving their LP tokens,
                    either because they hold no veJOE, or because they hold so little relative to their TVL that they would be better off just moving the TVL elsewhere - this calculator
                    is also aimed to help them see what they could gain by making a switch. For an example of such a user, try running the calculator for this address: 0x46f41e39fACdD1eA0E957827ef01082cb96dD361
                    (as of April 2022, potential gains of over $1m if they switched to Yield Yak from farming directly with Trader Joe).
                    <br /><br />
                    There are also mechanisms via which you can help the auto-compounders boost even further (e.g. yyJOE), but those are separate benefits that are not needed to
                    boost your own TVL. To be crystal clear:
                    <br /><br />
                    <span style={{ color: 'red' }}>YOU DO NOT NEED TO DEPOSIT JOE FOR yyJOE IN ORDER TO BENEFIT FROM THE OVERALL
                      BOOST THAT COMES FROM YIELD YAK'S veJOE ACCRUAL. YOU CAN SIMPLY DEPOSIT YOUR LP TOKENS WITH YIELD YAK AND GET THE BETTER BOOST.</span>
                    <br /><br />
                    <strong>About the calculator</strong>
                    <br />
                    Inputting your address above and clicking the "refresh data" button will retrieve the latest information available about your veJOE balance and your
                    holdings in Trader Joe boosted farms (where you have staked directly with Trader Joe itself), as well as overall information about each of the boosted farms.
                    <br /><br />
                    For each of the boosted farms it also calculates the relevant APR values, and for a selected list of third party options (including Yield Yak), it
                    shows their TVL and veJOE accrual, and calculates the boost that those farms are receiving so that it's easy to compare against yours. it also calculates your
                    potential gain if you moved your liquidity and the order these farms appear is determined by 1) Your potential gain, 2) Your TVL in the TJ farm, 3) The farm TVL.
                    If you have liquidity with Trader Joe then the "Move LPs" option will be enabled by default, otherwise it will calculate for adding liquidity.
                    <br /><br />
                    <strong>Move Liquidity</strong> - Figuring out what you should do is not as simple as just comparing the boost APR you currently receive against the boost APR that other options
                    (e.g. Yield Yak) currently receive. Whilst moving liquidity from Trader Joe (direct) to Trader Joe (via Yield Yak) will not have any impact on the Pool APR or
                    the Joe APR, it does affect the Boosted APR, though the smaller your holding, the less of an impact this will have. A full explanation of the calculation for
                    veJOE boosted rewards can be found in the Trader Joe <a href="https://docs.traderjoexyz.com/main/trader-joe/staking/vejoe-staking" rel="noreferrer" target="_blank" style={{ color: 'white' }}>docs</a>.
                    This calculator figures out what the Boost APR would be in the event that you moved your liquidity (i.e. after you move it), which is a lot more useful than
                    simply knowing what the Boost APR is now. It compares this new Boost APR against what you get at the moment and then calculates the potential annualised gains
                    from making the switch.
                    <br /><br />
                    *There are a few caveats here to be aware of:
                    <li>Fees - all of the options charge fees for auto-compounding, and in some cases they also charge a fee for these boosted farms specifically (so that they can
                      get even more veJOE over time). These are not accounted for in the figures shown. DYOR.</li>
                    <li>Having said that, these figures also do not account for the additional compounding effects that (e.g.) Yield Yak strategies make use of - these would push
                      the APY higher than shown and this, alongside slight differences in calculation methods, is a reason that the APY shown on the official websites may differ
                      from the APR values shown here. For an explanation of how Yield Yak calculates APY, see <a href="https://yieldyak.medium.com/yield-yak-upgrades-farm-apy-calculations-d3fc247fbbf2" target="_blank" rel="noreferrer" style={{ color: 'white' }}>here</a>.</li>
                    <li>In some cases also, protocols are offering additional incentives in their own token for staking LP tokens on their platform. The values shown here are related to
                      the rewards (in JOE) coming from Trader Joe only (i.e. Pool APR, Joe APR, and Boost APR). DYOR on other tokens which may make APRs for some platforms appear higher.</li>
                    <br />
                    <strong>Add liquidity</strong> - Using the add liquidity option shows what you would achieve if you added <strong>new</strong> liquidity ($ value of LP tokens) into
                    the various available options. In this case you will notice the Pool APR and Joe APR also decreasing slightly as the amount you add increases. The comparison done in
                    this case is about where you should add this <strong>additional</strong> liquidity. Specifically it compares your annualised returns in the event that you add it to
                    your existing staked JLP tokens with Trader Joe versus if you added it via a third party option such as Yield Yak. This difference is what is shown for the annualised
                    gain in this case. If you want to use the calculator "fresh" (i.e. not taking into account your existing veJOE or liquidity) then simply leave the address blank and
                    refresh the data.
                    <br /><br />
                    <strong>Tip jar</strong>
                    <br />
                    If you like what you've seen and feel that it has helped you optimise your liquidity, please consider making a donation to this address:
                    <br />
                    <span style={{ color: 'rgb(200, 200, 200)' }}>0xcaA9Af8039143C92Ba7bca81fCEe845EEC516090</span>
                    <Tooltip title="Copy address">
                      <IconButton color="primary" onClick={() => { navigator.clipboard.writeText("0xcaA9Af8039143C92Ba7bca81fCEe845EEC516090") }} >
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
          <Grid container spacing={2} height={'80vh'}>
            {fullData.map(farm => (
              <FarmCard
                key={farm.poolID}
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

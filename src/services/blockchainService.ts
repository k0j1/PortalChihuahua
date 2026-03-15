import { createPublicClient, http, parseAbi, formatUnits } from 'viem';
import { base } from 'viem/chains';

const ALCHEMY_URL = 'https://base-mainnet.g.alchemy.com/v2/y4ylt3H0bLrzPvadrGl0M';
const CHH_CONTRACT = '0xb0525542e3d818460546332e76e511562dff9b07';

const client = createPublicClient({
  chain: base,
  transport: http(ALCHEMY_URL),
});

export const getChhBalance = async (address: `0x${string}`) => {
  try {
    const balance = await client.readContract({
      address: CHH_CONTRACT as `0x${string}`,
      abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
      functionName: 'balanceOf',
      args: [address],
    } as any) as bigint;
    return formatUnits(balance, 18);
  } catch (error) {
    console.error('Failed to fetch CHH balance', error);
    return '0';
  }
};

export const getRecentLogs = async () => {
  const contracts = [
    '0x65F5661319C4d23c973C806e1e006Bb06d5557D2',
    '0x9B9191f213Afe0588570028174C97b3751c20Db0',
    '0x0d013d7DC17E8240595778D1db7241f176Ca51F9',
    '0x38156DB0e482EB3a5C198d49917fdb6746344db1'
  ];
  
  try {
    const response = await fetch(ALCHEMY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getLogs',
        params: [{
          address: contracts,
          fromBlock: 'latest',
          toBlock: 'latest'
        }]
      })
    });
    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error('Failed to fetch logs', error);
    return [];
  }
};

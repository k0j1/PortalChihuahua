import { createPublicClient, http, parseAbi, formatUnits } from 'viem';
import { base } from 'viem/chains';
import { Alchemy, Network, AssetTransfersCategory } from 'alchemy-sdk';

const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY || 'y4ylt3H0bLrzPvadrGl0M';
const ALCHEMY_URL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
const CHH_CONTRACT = '0xB0748f58befa009A42306c91E01ED9DD3378eb01';

const alchemyConfig = {
  apiKey: ALCHEMY_API_KEY,
  network: Network.BASE_MAINNET,
};

const alchemy = new Alchemy(alchemyConfig);

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

export const getRecentActivity = async () => {
  const fromContracts = [
    '0x65F5661319C4d23c973C806e1e006Bb06d5557D2',
    '0x9B9191f213Afe0588570028174C97b3751c20Db0',
    '0x38156DB0e482EB3a5C198d49917fdb6746344db1',
    '0x193708bB0AC212E59fc44d6D6F3507F25Bc97fd4'
  ];

  const toContracts = [
    '0x5F07A1992Cb9A652b262dead336E4202349B77F5',
    '0x0d013d7DC17E8240595778D1db7241f176Ca51F9'
  ];
  
  const fetchWithRetry = async (fn: () => Promise<any>) => {
    try {
      return await fn();
    } catch (error) {
      console.warn('Fetch failed, retrying in 1s...', error);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await fn();
    }
  };

  try {
    const fromPromises = fromContracts.map(contract => 
      fetchWithRetry(() => alchemy.core.getAssetTransfers({
        fromAddress: contract,
        category: [
          AssetTransfersCategory.EXTERNAL,
          AssetTransfersCategory.ERC20,
          AssetTransfersCategory.ERC721,
          AssetTransfersCategory.ERC1155
        ],
        withMetadata: true,
        maxCount: 100,
        order: 'desc' as any,
        toBlock: 'latest',
      }))
    );

    const toPromises = toContracts.map(contract => 
      fetchWithRetry(() => alchemy.core.getAssetTransfers({
        toAddress: contract,
        category: [
          AssetTransfersCategory.EXTERNAL,
          AssetTransfersCategory.ERC20,
          AssetTransfersCategory.ERC721,
          AssetTransfersCategory.ERC1155
        ],
        withMetadata: true,
        maxCount: 100,
        order: 'desc' as any,
        toBlock: 'latest',
      }))
    );

    const results = await Promise.all([...fromPromises, ...toPromises]);
    
    // 1ヶ月前の日時を計算
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const oneMonthAgoTime = oneMonthAgo.getTime();

    const mergedTransfers = results.flatMap(res => res.transfers)
      .filter(transfer => {
        if (!transfer.metadata.blockTimestamp) return false;
        const txTime = new Date(transfer.metadata.blockTimestamp).getTime();
        return txTime >= oneMonthAgoTime; // 1ヶ月以内のトランザクションのみ
      })
      .sort((a, b) => {
        const timeA = new Date(a.metadata.blockTimestamp).getTime();
        const timeB = new Date(b.metadata.blockTimestamp).getTime();
        return timeB - timeA; // 日付の降順（最新が上）
      })
      .slice(0, 100);

    return mergedTransfers;
  } catch (error) {
    console.error('Failed to fetch asset transfers', error);
    return [];
  }
};

// 互換性のために残す
export const getRecentLogs = async () => {
  return getRecentActivity();
};

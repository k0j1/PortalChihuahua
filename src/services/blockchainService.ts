import { createPublicClient, http, parseAbi, formatUnits } from 'viem';
import { base } from 'viem/chains';
import { Alchemy, Network, AssetTransfersCategory } from 'alchemy-sdk';

const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY || 'y4ylt3H0bLrzPvadrGl0M';
const ALCHEMY_URL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
const CHH_CONTRACT = '0xB0748f58befa009A42306c91E01ED9DD3378eb01';
const USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const TARGET_CONTRACT = '0xfb79857eC43d3e035ea5e0b4670975231786d3a4';

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
    '0x193708bB0AC212E59fc44d6D6F3507F25Bc97fd4',
    '0xfb79857ec43d3e035ea5e0b4670975231786d3a4'
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
    const fromPromises = fromContracts.map(contract => {
      const params: any = {
        fromAddress: contract,
        category: [AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.ERC20, AssetTransfersCategory.ERC721, AssetTransfersCategory.ERC1155],
        withMetadata: true,
        maxCount: 100,
        order: 'desc' as any,
        toBlock: 'latest',
      };
      return fetchWithRetry(() => alchemy.core.getAssetTransfers(params));
    });

    const toPromises = toContracts.map(contract => {
      const params: any = {
        toAddress: contract,
        category: [AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.ERC20, AssetTransfersCategory.ERC721, AssetTransfersCategory.ERC1155],
        withMetadata: true,
        maxCount: 100,
        order: 'desc' as any,
        toBlock: 'latest',
      };
      return fetchWithRetry(async () => {
        const result = await alchemy.core.getAssetTransfers(params);
        if (contract.toLowerCase() === TARGET_CONTRACT.toLowerCase()) {
            console.log(`Debug transfers to ${TARGET_CONTRACT}:`, result.transfers);
        }
        return result;
      });
    });

    const results = await Promise.all([...fromPromises, ...toPromises]);
    
    // 1ヶ月前の日時を計算
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const oneMonthAgoTime = oneMonthAgo.getTime();

    const mergedTransfers = results.flatMap(res => res.transfers)
      .filter(transfer => {
        if (!transfer.metadata.blockTimestamp) return false;
        
        // ターゲットコントラクトの特殊フィルタリング
        if (transfer.from.toLowerCase() === TARGET_CONTRACT.toLowerCase() && transfer.asset !== 'CHH') {
            return false;
        }
        if (transfer.to.toLowerCase() === TARGET_CONTRACT.toLowerCase() && transfer.asset !== 'USDC') {
            return false;
        }

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


export const getChihuahuaQuestStats = async (address: `0x${string}`) => {
  try {
    console.log('Fetching stats for address:', address);
    console.log('Target contract:', TARGET_CONTRACT);
    const [ids, counts] = await client.readContract({
      address: TARGET_CONTRACT as `0x${string}`,
      abi: parseAbi([
        'function getPlayerInventory(address player) view returns (uint256[] ids, uint256[] counts)'
      ]),
      functionName: 'getPlayerInventory',
      args: [address],
    } as any) as [bigint[], bigint[]];

    console.log('Result from getPlayerInventory - ids:', ids, 'counts:', counts);

    let totalTreasures = 0n;
    let totalCHH = 0n;

    for (let i = 0; i < ids.length; i++) {
        const count = counts[i];
        totalTreasures += count;
        
        const reward = await client.readContract({
            address: TARGET_CONTRACT as `0x${string}`,
            abi: parseAbi([
                'function treasureRewards(uint256 id) view returns (uint256 chhAmount, bool exists)'
            ]),
            functionName: 'treasureRewards',
            args: [ids[i]],
        } as any) as [bigint, boolean];
        
        const [chhAmount, exists] = reward;
        console.log(`Treasure ID ${ids[i]}: count ${count}, amount ${chhAmount}, exists ${exists}`);
        
        if (exists) {
            totalCHH += count * chhAmount;
        }
    }
    
    const result = {
        totalTreasures: Number(totalTreasures),
        totalCHH: formatUnits(totalCHH, 18),
    };
    console.log('Final stats result:', result);
    return result;
  } catch (error) {
    console.error('Failed to fetch ChihuahuaQuest stats', error);
    return { totalTreasures: 0, totalCHH: '0' };
  }
};

// 互換性のために残す
export const getRecentLogs = async () => {
  return getRecentActivity();
};

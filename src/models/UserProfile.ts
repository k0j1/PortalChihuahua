export class UserProfile {
  constructor(
    public id: string,
    public name: string,
    public username: string,
    public farcasterId: string,
    public avatarUrl: string,
    public chihuahuaIcon: string,
    public totalScore: number,
    public overallRank: number,
    public walletAddress: string,
    public fid?: string,
    public runningStats?: { runCount: number; stamina: number },
    public reversiStats?: { totalWins: number },
    public miningStats?: {
      questCount: number;
      gachaHeroCount: number;
      gachaEquipmentCount: number;
      item01: number;
      item02: number;
      item03: number;
    }
  ) {}
}

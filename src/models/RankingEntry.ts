export class RankingEntry {
  constructor(
    public rank: number,
    public playerName: string,
    public score: number,
    public date: string,
    public pfpUrl?: string,
    public username?: string
  ) {}
}

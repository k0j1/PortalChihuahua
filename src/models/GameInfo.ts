export class GameInfo {
  constructor(
    public id: string,
    public title: string,
    public url: string,
    public farcasterUrl: string,
    public description: string,
    public icon: string,
    public iconUrl: string,
    public color: string,
    public appId?: string
  ) {}
}

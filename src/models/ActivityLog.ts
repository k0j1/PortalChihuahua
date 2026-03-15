export class ActivityLog {
  constructor(
    public id: string,
    public userName: string,
    public userAvatar: string,
    public gameId: string,
    public action: string,
    public timestamp: string,
    public txHash?: string // スマートコントラクトのトランザクションハッシュ（モック）
  ) {}
}

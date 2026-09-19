// A remembered local profile, not authentication or proof of Riot account ownership.
export class LocalIdentityRepository {
  private key = 'rift-house:profile:v1';
  read(): string | null {
    return localStorage.getItem(this.key);
  }
  select(playerId: string) {
    localStorage.setItem(this.key, playerId);
  }
  clear() {
    localStorage.removeItem(this.key);
  }
}

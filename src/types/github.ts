export interface GitHubProfile {
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

export interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: "public" | "private" | null;
}

export interface GitHubToken {
  access_token: string;
  scope: string;
  token_type: string;
}

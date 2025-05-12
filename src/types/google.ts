export interface GoogleProfile {
  email: string;
  name: string;
  verified_email: boolean;
  picture: string;
}

export interface GoogleToken {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token: string;
}

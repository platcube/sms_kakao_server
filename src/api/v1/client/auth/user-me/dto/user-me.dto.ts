export type ClientUserMeAuthDto = {
  userId: number;
  clientId: number;
  account: string;
};

export type ClientUserMeResponseDto = {
  user: {
    id: number;
    account: string;
    name: string;
    status: "ACTIVE" | "INACTIVE" | "LOCKED";
    lastLoginAt: string | null;
  };
  client: {
    id: number;
    clientCode: string;
    name: string;
    status: "ACTIVE" | "INACTIVE";
    senderPhone: string;
    apiKey: string | null;
  };
};

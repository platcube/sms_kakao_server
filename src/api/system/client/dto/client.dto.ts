export type ClientCreateBodyDto = {
  clientCode: string;
  name: string;
  senderPhone: string;
  status?: "ACTIVE" | "INACTIVE";
};

export type ClientCreateResponseDto = {
  id: number;
  clientCode: string;
  name: string;
  senderPhone: string;
  status: "ACTIVE" | "INACTIVE";
  apiKey: string;
  createdAt: string;
};

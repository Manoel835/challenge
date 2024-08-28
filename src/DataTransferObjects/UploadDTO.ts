export type UploadRequest = {
    image: string;
    customerCode: string;
    measureDatetime: string; 
    measureType: 'WATER' | 'GAS';
  };

  export type UploadResponse = {
    imageUrl: string;
    measureValue: number;
    measureUuid: string;
  };

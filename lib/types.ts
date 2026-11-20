export type StoreApp = {
  id: string;
  name: string;
  developer: string;
  icon: string | null;
  score: number | null;
  ratingCount: number | null;
  price: string;
  url: string;
};

export type SearchResponse = {
  query: string;
  ios: StoreApp[];
  android: StoreApp[];
  errors: {
    ios: string | null;
    android: string | null;
  };
};

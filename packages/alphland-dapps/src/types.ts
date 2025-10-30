export interface NFTPreview {
  image_url: string;
  name: string;
}

export interface NFT {
  collectionLink: string;
  collectionContract: string;
  collectionName: string;
  collectionPreview: NFTPreview[];
}

export interface Audit {
  name: string;
  url: string;
}

export interface Contract {
  name: string;
  address: string;
}

export interface Links {
  website: string;
  mirror: string;
  twitter: string;
  telegram: string;
  discord: string;
  github: string;
  youtube: string;
  medium: string;
  careers: string;
  linkedin: string;
  docs: string;
}

export interface Gallery {
  url: string;
  description: string;
}

export interface Media {
  logoUrl: string;
  bannerUrl: string;
  previewUrl: string;
  videoUrl?: string;
  gallery: Gallery[];
}

export interface TeamInfo {
  founded: string;
  anonymous: boolean;
  contactEmail?: string;
  name?: string;
}

export interface Token {
  symbol: string;
  address: string;
}

export interface DappInfo {
  description: string;
  short_description: string;
  name: string;
  tags: string[];
  group?: string;
  contracts?: Contract[];
  audits: Audit[];
  verified: boolean;
  links: Links;
  teamInfo: TeamInfo;
  tokens: Token[];
  media: Media;
  dotw: boolean;
  councils_choice: boolean;
  twitterName: string;
  nft?: NFT;
  url: string;
}

export interface DappCard {
  short_description: string;
  title: string;
  tags: string[];
  url: string;
  image: string;
  logo: string;
  featured: boolean;
  annonymous: boolean;
  audits: Audit[];
  verified: boolean;
  councils_choice: boolean;
}

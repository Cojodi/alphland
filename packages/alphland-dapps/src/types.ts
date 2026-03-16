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

export interface DappDirectory {
  slug: string;
  isFeatured: boolean;
  name: string;
  description?: string;
  short_description?: string;
  tags?: string[];
  councils_choice?: boolean;
  verified?: boolean;
  dotw?: boolean;
  links?: {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
    github?: string;
    youtube?: string;
    medium?: string;
    mirror?: string;
    linkedin?: string;
    docs?: string;
    careers?: string;
  };
  teamInfo?: {
    name?: string;
    contactEmail?: string;
    anonymous?: boolean;
    founded?: string;
  };
  media?: {
    logoUrl?: string;
    bannerUrl?: string;
    previewUrl?: string;
    videoUrl?: string;
    gallery?: unknown[];
  };
  contracts?: unknown[];
  audits?: unknown[];
  tokens?: unknown[];
  nft?: unknown;
  twitterName?: string;
  group?: string;
}

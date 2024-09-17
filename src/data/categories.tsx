import bridges from "../assets/icons/bridges.svg";
import bridgesLight from "../assets/icons/bridgesLight.svg";
import card from "../assets/icons/card.svg";
import cardLight from "../assets/icons/cardLight.svg";
import contacts from "../assets/icons/contacts.svg";
import contactsLight from "../assets/icons/contactsLight.svg";
import database from "../assets/icons/database.svg";
import databaseLight from "../assets/icons/databaseLight.svg";
import gallery from "../assets/icons/gallery.svg";
import galleryLight from "../assets/icons/galleryLight.svg";
import gaming from "../assets/icons/gaming.svg";
import gamingLight from "../assets/icons/gamingLight.svg";
import hashrate from "../assets/icons/hashrate.svg";
import hashrateLight from "../assets/icons/hashrateLight.svg";
import heart from "../assets/icons/heart.svg";
import heartLight from "../assets/icons/heartLight.svg";
import legal from "../assets/icons/legal.svg";
import legalLight from "../assets/icons/legalLight.svg";
import lock from "../assets/icons/lock.svg";
import lockLight from "../assets/icons/lockLight.svg";
import profile from "../assets/icons/profile.svg";
import profileLight from "../assets/icons/profileLight.svg";
import star from "../assets/icons/starFilled.svg";
import stats from "../assets/icons/stats.svg";
import statsLight from "../assets/icons/statsLight.svg";
import swap from "../assets/icons/swap.svg";
import swapLight from "../assets/icons/swapLight.svg";
import time from "../assets/icons/time.svg";
import timeLight from "../assets/icons/timeLight.svg";
import verified from "../assets/icons/verified.svg";
import verifiedLight from "../assets/icons/verifiedLight.svg";
import wallet from "../assets/icons/wallet.svg";
import walletLight from "../assets/icons/walletLight.svg";

export const categories = [
  { key: "onramps", name: "Onramps", icon: card, iconDark: cardLight },
  { key: "bridges", name: "Bridges", icon: bridges, iconDark: bridgesLight },
  { key: "defi", name: "DeFi", icon: swap, iconDark: swapLight },
  { key: "games", name: "Games", icon: gaming, iconDark: gamingLight },
  { key: "nfts", name: "NFTs", icon: gallery, iconDark: galleryLight },
  { key: "social", name: "Social", icon: heart, iconDark: heartLight },
  { key: "wallets", name: "Wallets", icon: wallet, iconDark: walletLight },
  { key: "security", name: "Security", icon: lock, iconDark: lockLight },
  { key: "stats", name: "Stats", icon: stats, iconDark: statsLight },
  {
    key: "hashrate",
    name: "Hashrate",
    icon: hashrate,
    iconDark: hashrateLight,
  },
  {
    key: "infrastructure",
    name: "Infrastructure",
    icon: database,
    iconDark: databaseLight,
  },
  { key: "daos", name: "DAOs", icon: contacts, iconDark: contactsLight },
  { key: "soon", name: "ComingSoon", icon: time, iconDark: timeLight },
];

export const reputation = [
  { key: "doxxed", name: "Public team", icon: profile, iconDark: profileLight },
  { key: "audited", name: "Audited", icon: legal, iconDark: legalLight },
  {
    key: "councils_choice",
    name: "Councils Choice",
    icon: legal,
    iconDark: legalLight,
  },

  {
    key: "verified",
    name: "Verified contracts",
    icon: verified,
    iconDark: verifiedLight,
  },
];

export const ratings = [
  { key: "5", name: "5", icon: star, iconDark: star },
  { key: "4", name: "4", icon: star, iconDark: star },
  { key: "3", name: "3", icon: star, iconDark: star },
  { key: "2", name: "2", icon: star, iconDark: star },
  { key: "1", name: "1", icon: star, iconDark: star },
];

export const allCategories = [...categories, ...reputation, ...ratings];

export const changeTagsToCategoriesSlug = (tags: string[]) => {
  let categories: Array<string> = [];
  const categoriesNames = allCategories.map((category) => category.name);
  tags.forEach((tag) => {
    if (categoriesNames.includes(tag)) {
      const categorySlug = allCategories.find((item) => item.name === tag)?.key;
      if (categorySlug) categories.push(categorySlug);
    }
  });
  return categories;
};

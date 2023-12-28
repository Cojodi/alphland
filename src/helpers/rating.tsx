export const getRatingForDapp = async (name: string) => {
  try {
    return await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tokens/dapps/ratings/name/${name}`
    ).then((res) => res.json());
  } catch (error) {
    return [];
  }
};

export const getRatingsFromUser = async ({
  account,
  dappKey,
}: {
  account: string;
  dappKey: string;
}) => {
  const data = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/tokens/dapps/ratings/key/${dappKey}?account_id=${account}`
  ).then((res) => res.json());
  return data?.userRating || null;
};

export const getRatings = async () => {
  let data;
  try {
    data = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tokens/dapps/ratings`
    ).then((res) => res.json());
  } catch (error) {}

  const ratings: Rating[] = data?.ratings || [];

  const ratingsMap = new Map();

  ratings.forEach((rating) => {
    const key = Math.round(rating.average_rating);
    if (!ratingsMap.get(key)) {
      ratingsMap.set(key, []);
    }
    ratingsMap.set(key, [...ratingsMap.get(key), rating]);
  });
  const ratingEntries: {
    [key: string]: Rating[];
  } = Object.fromEntries(ratingsMap);
  const dappsByRating: {
    [key: string]: string[];
  } = {};

  Object.keys(ratingEntries).forEach((key) => {
    const dappKeys = ratingEntries[key].map((obj) => obj.dappKey);
    dappsByRating[key] = dappKeys;
  });
  return dappsByRating;
};

export const filterDappcardsByRating = ({
  dappRatings,
  dappCards,
  selectedRatings,
  isMainCategory,
}: {
  dappCards: DappCard[];
  dappRatings: { [key: string]: string[] };
  selectedRatings: string[];
  isMainCategory?: boolean;
}) => {
  if (!selectedRatings.length) {
    return dappCards;
  }
  const availableRatings = Object.fromEntries(
    Object.entries(dappRatings).filter(([key]) => selectedRatings.includes(key))
  );
  return dappCards.filter((dappCard) =>
    Object.values(availableRatings).some(
      (array) => array.includes(dappCard.url.replace("/", "")) || isMainCategory
    )
  );
};

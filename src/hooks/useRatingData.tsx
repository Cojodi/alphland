import { useEffect, useState } from "react";

interface RatingWidgetData {
  average_rating: number;
  dapp_key: string;
  vote_count: number;
}

type ResponseData = {
  isLoading: boolean;
  ratingData?: RatingWidgetData;
};

const useRatingData = (dappName: string): ResponseData => {
  const [ratingData, setRatingData] = useState<RatingWidgetData>();
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async (): Promise<any> => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tokens/dapps/ratings/name/${dappName}`
        );
        const data = (await response.json()) as RatingWidgetData;
        setRatingData(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (dappName) {
      void fetchReviews();
    }
  }, [dappName]);
  return { ratingData, isLoading };
};

export default useRatingData;

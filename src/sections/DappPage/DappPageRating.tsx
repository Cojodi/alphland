import starEmpty from "../../assets/icons/starEmpty.svg";
import starFilled from "../../assets/icons/starFilled.svg";
import ConnectWalletModal from "../../components/Modal/ConnectWalletModal";
import { getRatingForDapp, getRatingsFromUser } from "../../helpers/rating";
import { useWallet } from "@alephium/web3-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

type Props = {
  dappKey?: string;
};

const DappPageRating = ({ dappKey = "my_dapp" }: Props) => {
  const [averageRating, setAverageRating] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const { account, connectionStatus, signer } = useWallet();

  const [currentRating, setCurrentRating] = useState<number | null>(null);
  const [isRatingModalOpen, setRatingModalOpen] = useState(false);
  useEffect(() => {
    const getRatingsData = async () => {
      const dappRatings = await getRatingForDapp(dappKey);
      setAverageRating(dappRatings?.average_rating || null);
    };
    getRatingsData();
  }, []);

  useEffect(() => {
    const getUserOldRatings = async ({ account }: { account: string }) => {
      const rating = await getRatingsFromUser({ account, dappKey });
      if (rating !== null) {
        setCurrentRating(rating - 1);
      }
    };
    if (account?.address) {
      getUserOldRatings({ account: account.address });
    }
  }, []);

  const determineIfMainnet = () => {
    if (typeof window !== "undefined") {
      const { hostname } = window.location;
      return hostname.includes("alph.land");
    } else {
      return false;
    }
  };

  const rateDapp = async (rating: number) => {
    let ratingValue = rating + 1;

    console.log(`Trying to rate dapp ${dappKey} with rating ${ratingValue}`);

    setError(null);
    if (ratingValue === null || ratingValue === undefined) {
      throw Error("Not rated");
    }

    if (!account?.address) {
      throw Error("Invalid account address");
    }
    //todo
    // const messageParams: SignMessageParams = {
    //   message: `${dappKey},${ratingValue}`,
    //   signerAddress: account?.address,
    //   messageHasher: "alephium",
    // };
    // console.log(signer);
    // const signatures = signer?.signMessage(messageParams);
    const signature = "test";
    const bodyData = {
      dapp_key: dappKey,
      name: dappKey,
      signature,
      rating_score: ratingValue,
      account_id: account?.address,
    };

    const handleErrors = (response: any) => {
      if (!response.ok) {
        return response.text().then((text: string) => {
          throw new Error(text);
        });
      }
      return response.json();
    };

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tokens/dapps/ratings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    })
      .then(handleErrors)
      .then((res) => {
        setAverageRating(res.average_rating);
        if (ratingValue) {
          setCurrentRating(ratingValue - 1);
          toast(`You rated ${dappKey} with ${ratingValue} stars!`);
        }
        setError(null);
        setRatingModalOpen(false);
      })
      .catch((err) => {
        toast(`Rating failed.`);
        const parsedMessage = JSON.parse(err.message);
        if (parsedMessage.status) {
          setError("Error: " + parsedMessage.status);
        } else {
          setError("An error occurred.");
        }
      });
  };

  return (
    <div>
      <div className="mt-12 xl:mt-0">
        <h2 className="text-[28px] leading-[34px] font-bold mb-4">Rating</h2>
        <ConnectWalletModal
          isOpen={isRatingModalOpen}
          error={error}
          onClose={() => {
            setError(null);
            setRatingModalOpen(false);
          }}
          onConfirm={() => {
            setRatingModalOpen(false);
          }}
        />
        <div className="flex items-end gap-1 mb-6">
          {averageRating ? (
            <>
              <h3 className="text-[64px] leading-[64px] font-bold">
                {averageRating - Math.floor(averageRating) !== 0
                  ? (Math.round(averageRating * 10) / 10).toFixed(1)
                  : averageRating}
              </h3>
              <div className="text-[20px] font-bold dark:text-white text-[#8C8C8C]">
                /
              </div>
              <div className="text-[20px] font-bold dark:text-white text-[#8C8C8C]">
                5
              </div>
            </>
          ) : (
            <h3 className="text-[18px] leading-[24px]">Not rated yet</h3>
          )}
        </div>
        <div className="mb-2">Your Rating</div>
        <div className="relative flex items-center gap-1">
          {Array.from(Array(5).keys()).map((val) => (
            <button
              key={val}
              onMouseEnter={() => setHoverIndex(val)}
              onMouseLeave={() => setHoverIndex(null)}
              onClick={() => {
                if (connectionStatus === "disconnected") {
                  setRatingModalOpen(true);
                } else {
                  setCurrentRating(val);

                  rateDapp(val);
                }
              }}
            >
              <Image
                width={28}
                height={28}
                src={
                  hoverIndex !== null
                    ? hoverIndex >= val
                      ? starFilled
                      : starEmpty
                    : currentRating !== null && currentRating >= val
                    ? starFilled
                    : starEmpty
                }
                className="z-[1]"
                alt="star-empty"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DappPageRating;

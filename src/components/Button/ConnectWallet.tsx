import power from "../../assets/icons/power.svg";
import powerLight from "../../assets/icons/powerLight.svg";
import powerorange from "../../assets/icons/powerOrange.svg";
import { useDarkMode } from "../../hooks/useDarkMode";
import { useWalletStore } from "../../hooks/useWalletStore";
import ConnectWalletModal from "../Modal/ConnectWalletModal";
import AlephiumWalletConnectButton from "../WalletConnect/AlephiumWalletConnect";
import { useWallet } from "@alephium/web3-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const ConnectWallet = () => {
  const { currentTheme } = useDarkMode();
  const [ratingsModalOpen, setRatingModalOpen] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const { account, connectionStatus } = useWallet();
  const connectedWallet = useWalletStore((state) => state.connectedWallet);
  const setConnectedWallet = useWalletStore(
    (state) => state.setConnectedWallet
  );

  useEffect(() => {
    console.log(account);
  }, [account]);

  const onConfirm = async () => {
    setRatingModalOpen(false);

    //todo on error display useful help message

    // const wallets = await sn.getAvailableWallets();
    // const argentWallet = wallets.find(
    //   (wallet: StarknetWindowObject) => wallet.id === "argentX"
    // );
    // if (argentWallet) {
    //   sn.enable(argentWallet)
    //     .then((res) => {
    //       setConnectedWallet(res);
    //       setError(null);
    //       setRatingModalOpen(false);
    //     })
    //     .catch(() => {
    //       setError("User rejected wallet selection or wallet not found");
    //       throw Error("User rejected wallet selection or wallet not found");
    //     });
    // } else {
    //   connect()
    //     .then((res) => {
    //       setConnectedWallet(res);
    //       setError(null);
    //       setRatingModalOpen(false);
    //     })
    //     .catch(() => {
    //       setError("User rejected wallet selection or wallet not found");
    //       throw Error("User rejected wallet selection or wallet not found");
    //     });
    // }
  };

  return (
    <>
      {connectionStatus === "connected" ? (
        <div>
          {/*Connected to: {account?.address}*/}
          <AlephiumWalletConnectButton />
        </div>
      ) : (
        <button
          onClick={async () => {
            setRatingModalOpen(true);
          }}
          className="group relative flex items-center justify-between border-solid border border-black dark:border-white bg-none rounded-3xl hover:border-orange dark:hover:border-orange px-4 py-[12.5px] lg:py-[10.5px] text-black dark:text-white hover:text-orange dark:hover:text-orange w-full lg:w-auto"
        >
          <div className="font-semibold mr-[20px] flex justify-center lg:justify-start items-center lg:items-start w-full lg:w-auto">
            {connectedWallet ? "Disconnect" : "Connect wallet"}
          </div>
          <div className="absolute w-[1px] h-full bg-black dark:bg-white right-10 group-hover:bg-orange" />
          <div>
            <div className="flex group-hover:hidden">
              <Image
                src={currentTheme === "dark" ? powerLight : power}
                alt="power-icon"
                className="text-orange"
                color="orange"
              />
            </div>
            <div className="hidden group-hover:flex">
              <Image
                src={powerorange}
                alt="power-icon"
                className="text-orange"
                color="orange"
              />
            </div>
          </div>
        </button>
      )}

      <ConnectWalletModal
        isOpen={ratingsModalOpen}
        onClose={() => {
          setRatingModalOpen(false);
        }}
        fromNav
        onConfirm={onConfirm}
        error={error}
      />
    </>
  );
};

export default ConnectWallet;

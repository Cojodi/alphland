import { AlephiumConnectButton } from "@alephium/web3-react";
import React from "react";

const AlephiumWalletConnectButton = () => {
  return (
    <AlephiumConnectButton.Custom>
      {({ isConnected, disconnect, show, account }) => {
        return isConnected ? (
          <button
            className="group relative flex items-center justify-between border-solid border border-black dark:border-white bg-none rounded-3xl hover:border-orange dark:hover:border-orange px-4 py-[12.5px] lg:py-[10.5px] text-black dark:text-white hover:text-orange dark:hover:text-orange w-full lg:w-auto"
            onClick={disconnect}
          >
            Disconnect
          </button>
        ) : (
          <button onClick={show}>Connect</button>
        );
      }}
    </AlephiumConnectButton.Custom>
  );
};
export default AlephiumWalletConnectButton;

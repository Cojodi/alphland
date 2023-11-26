import { AlephiumConnectButton } from "@alephium/web3-react";
import React from "react";

const AlephiumWalletConnectButton = () => {
  return (
    <AlephiumConnectButton.Custom>
      {({ isConnected, disconnect, show, account }) => {
        return isConnected ? (
          <button onClick={disconnect}>Disconnect</button>
        ) : (
          <button onClick={show}>Connect</button>
        );
      }}
    </AlephiumConnectButton.Custom>
  );
};
export default AlephiumWalletConnectButton;

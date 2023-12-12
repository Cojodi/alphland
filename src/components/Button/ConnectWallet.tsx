import ConnectWalletModal from "../Modal/ConnectWalletModal";
import AlephiumWalletConnectButton from "../WalletConnect/AlephiumWalletConnect";
import React, { useState } from "react";

const ConnectWallet = () => {
  const [ratingsModalOpen, setRatingModalOpen] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const onConfirm = async () => {
    setRatingModalOpen(false);
  };

  return (
    <>
      <AlephiumWalletConnectButton />

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

import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { providers, Contract, utils } from "ethers";
import { NFT_CONTRACT_ADDRESS, abi } from "../constants";

export default function Home() {
  const [isOwner, setIsOwner] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [numTokenMinted, setNumTokenMinted] = useState("0");
  const [loading, setLoading] = useState(false);
  const web3ModalRef = useRef();

  const getNumMintedTokens = async () => {
    try {
      const provider = await getProviderOrSigner(true);

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      const numTokenIds = await nftContract.tokenIds();
      setNumTokenMinted(numTokenIds.toString());
    } catch (error) {
      console.error(error);
    }
  };

  const presaleMint = async () => {
    try {
      setLoading(true);
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

      const txn = await nftContract.presaleMint({
        value: utils.parseEther("0.01"),
      });
      await txn.wait();

      window.alert("You succesfully minted a CryptoDev!");
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const publicMint = async () => {
    try {
      setLoading(true);
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

      const txn = await nftContract.mint({
        value: utils.parseEther("0.01"),
      });
      await txn.wait();

      window.alert("You succesfully minted a CryptoDev!");
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const getOwner = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

      const owner = await nftContract.owner();

      const userAddress = await signer.getAddress();

      if (owner.toLowerCase() === userAddress.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const startPresale = async () => {
    try {
      setLoading(true);
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

      const txn = await nftContract.startPresale();
      await txn.wait(true);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      // This will return a big number && return timestamps in seconds
      const presaleEndTime = await nftContract.presaleEnded();
      const currentTimeInSeconds = Date.now() / 1000;

      const hasPresaleEnded = presaleEndTime.lt(
        Math.floor(currentTimeInSeconds)
      );

      setPresaleEnded(hasPresaleEnded);
    } catch (error) {
      console.error(error);
    }
  };

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      const isPresaleStarted = await nftContract.presaleStarted();
      setPresaleStarted(isPresaleStarted);

      return isPresaleStarted;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Please switch to Rinkeby network");
      throw new Error("Incorrect network !");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  };

  const onPageLoad = async () => {
    await connectWallet();
    await getOwner();
    const presaleStarted = await checkIfPresaleStarted();
    if (presaleEnded) {
      await checkIfPresaleEnded();
    }
    await getNumMintedTokens();

    // track the number of minted NFT
    setInterval(async () => {
      await getNumMintedTokens();
    }, 5 * 1000);

    //track status of presale
    setInterval(async () => {
      const presaleStarted = await checkIfPresaleStarted();
      if (presaleStarted) {
        await checkIfPresaleEnded();
      }
    }, 5 * 1000);
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      onPageLoad();
    }
  }, []);

  function renderBody() {
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect Wallet
        </button>
      );
    }

    if (loading) {
      return <span className={styles.description}>Loading... 🤌</span>;
    }

    if (isOwner && !presaleStarted) {
      return (
        <button onClick={startPresale} className={styles.button}>
          Start Presale 💎
        </button>
      );
    }

    if (!presaleStarted) {
      return (
        <div>
          <span className={styles.description}>
            Presale has not started yet 🥺 Come back later!{" "}
          </span>
        </div>
      );
    }

    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <span className={styles.description}>
            Presale has started ! If your address iswhitelisted, you can mint a
            cryptoDev!
          </span>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    if (presaleEnded) {
      return (
        <div>
          <span className={styles.description}>
            Presale has Ended ! You can mint a CryptoDev in public sale, if ay
            remain.
          </span>
          <button className={styles.button} onClick={publicMint}>
            Public Mint 🚀
          </button>
        </div>
      );
    }
  }

  return (
    <div>
      <Head>
        <title> Crypto Devs NFT </title>
      </Head>

      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to CryptoDevs NFT !</h1>
          <div className={styles.description}>
            CryptoDevs NFT is a collection for developers in web3{" "}
          </div>

          <div className={styles.description}>
            {numTokenMinted}/20 have been minted already!
          </div>

          {renderBody()}
        </div>
        <img className={styles.image} src="/cryptodevs/0.svg"></img>
      </div>
      <footer className={styles.footer}>Made with &#10084; by Alexis</footer>
    </div>
  );
}

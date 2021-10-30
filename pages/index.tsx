import { Box, Text } from "@chakra-ui/layout";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import AppHeader from "../components/AppHeader";
import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <AppHeader />

      <Box
        height="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <div>
          <Text fontSize="4xl">Under Construction 🏗️</Text>
          <h4>
            <a href="https://linktr.ee/carlomigueldy" target="_blank">
              carlomigueldy.eth
            </a>
          </h4>
        </div>
      </Box>
    </>
  );
};

export default Home;
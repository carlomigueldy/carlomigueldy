import React from "react";
import {
  chakra,
  Box,
  useColorModeValue,
  Flex,
  Button,
  HStack,
} from "@chakra-ui/react";

const AppHero = () => {
  return (
    <Flex px={4} py={32} mx="auto">
      <Box mx="auto" w={{ lg: 8 / 12, xl: 5 / 12, sm: "full" }}>
        <chakra.p
          mb={2}
          fontSize="xs"
          fontWeight="semibold"
          letterSpacing="wide"
          color="gray.400"
          textTransform="uppercase"
        >
          Hi my name is
        </chakra.p>
        <chakra.h1
          mb={3}
          fontSize={{ base: "3xl", md: "4xl" }}
          fontWeight="bold"
          lineHeight="shorter"
          color={useColorModeValue("gray.900", "white")}
        >
          Carlo Miguel Dy
        </chakra.h1>
        <chakra.p mb={5} color="gray.500" fontSize={{ md: "lg" }}>
          I'm a full stack software engineer and I help you scale your business
          by building you software that you need!
        </chakra.p>
        <HStack>
          <Button
            as="a"
            w={{ base: "full", sm: "auto" }}
            variant="solid"
            colorScheme="facebook"
            size="lg"
            mb={{ base: 2, sm: 0 }}
            cursor="pointer"
          >
            Sign up for free
          </Button>
          <Button
            as="a"
            w={{ base: "full", sm: "auto" }}
            mb={{ base: 2, sm: 0 }}
            size="lg"
            cursor="pointer"
          >
            Read our blog
          </Button>
        </HStack>
      </Box>
    </Flex>
  );
};

export default AppHero;

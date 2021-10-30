import React from "react";
import {
  chakra,
  Flex,
  HStack,
  Icon,
  IconButton,
  Link,
  useColorMode,
  useColorModeValue,
  useDisclosure,
  CloseButton,
  Box,
  VStack,
  Button,
  Avatar,
} from "@chakra-ui/react";
import { useViewportScroll } from "framer-motion";
import { FaMoon, FaSun, FaHeart, FaCoffee } from "react-icons/fa";
import {
  AiFillGithub,
  AiOutlineMenu,
  AiFillHome,
  AiOutlineInbox,
} from "react-icons/ai";
import { BsFillCameraVideoFill } from "react-icons/bs";
import { PHOTOS } from "../constants/photos";
import { SIZE } from "../constants/size";
import { useRouter } from "next/dist/client/router";
// import { Logo } from "@choc-ui/logo";

const AppHeader = () => {
  const router = useRouter();

  const mobileNav = useDisclosure();

  const { toggleColorMode: toggleMode } = useColorMode();
  const text = useColorModeValue("dark", "light");
  const SwitchIcon = useColorModeValue(FaMoon, FaSun);

  const bg = useColorModeValue("white", "gray.800");
  const ref = React.useRef<HTMLInputElement>();
  const [y, setY] = React.useState(0);
  const { height = 0 } = ref.current ? ref.current.getBoundingClientRect() : {};

  const { scrollY } = useViewportScroll();
  React.useEffect(() => {
    return scrollY.onChange(() => setY(scrollY.get()));
  }, [scrollY]);

  const BuyMeACoffeeButton = (
    <Box
      display={{ base: "none", md: "flex" }}
      alignItems="center"
      as="a"
      aria-label="Buy me a Coffee"
      href="https://www.buymeacoffee.com/carlomigueldy"
      target="_blank"
      // rel="noopener noreferrer"
      bg="gray.50"
      borderWidth="1px"
      borderColor="gray.200"
      px="1em"
      minH="36px"
      rounded="md"
      fontSize="sm"
      color="gray.800"
      outline="0"
      transition="all 0.3s"
      _hover={{
        bg: "gray.100",
        borderColor: "gray.300",
      }}
      _active={{
        borderColor: "gray.200",
      }}
      _focus={{
        boxShadow: "outline",
      }}
      ml={5}
    >
      <Icon as={FaCoffee} w="4" h="4" color="yellow.500" mr="2" />
      <Box as="strong" lineHeight="inherit" fontWeight="semibold">
        Buy me a Coffee
      </Box>
    </Box>
  );

  const MobileNavContent = (
    <VStack
      pos="absolute"
      top={0}
      left={0}
      right={0}
      display={mobileNav.isOpen ? "flex" : "none"}
      flexDirection="column"
      p={2}
      pb={4}
      m={2}
      bg={bg}
      spacing={3}
      rounded="sm"
      shadow="sm"
    >
      <CloseButton
        aria-label="Close menu"
        justifySelf="self-start"
        onClick={mobileNav.onClose}
      />
      <Button w="full" variant="ghost" leftIcon={<AiFillHome />}>
        Dashboard
      </Button>
      <Button
        w="full"
        variant="solid"
        colorScheme="brand"
        leftIcon={<AiOutlineInbox />}
      >
        Inbox
      </Button>
      <Button w="full" variant="ghost" leftIcon={<BsFillCameraVideoFill />}>
        Videos
      </Button>
    </VStack>
  );

  return (
    <Box
      pos="fixed"
      top="0"
      left="0"
      right="0"
      backdropFilter="blur(6px)"
      background="transparent"
      zIndex="999"
    >
      <chakra.header
        // @ts-ignore
        ref={ref}
        shadow={y > height ? "sm" : undefined}
        transition="box-shadow 0.2s"
        // bg={bg}
        // borderTop="6px solid"
        // borderTopColor="brand.400"
        w="full"
        overflowY="hidden"
      >
        <chakra.div h="4.5rem" mx={SIZE.mx} maxW={SIZE.maxW}>
          <Flex w="full" h="full" px="6" align="center" justify="space-between">
            <Flex align="center">
              <HStack>
                <Avatar
                  name="Carlo Miguel Dy"
                  src={PHOTOS.me}
                  onClick={() => router.replace("/")}
                  cursor="pointer"
                />
              </HStack>
            </Flex>

            <Flex
              justify="flex-end"
              w="full"
              maxW="824px"
              align="center"
              color="gray.400"
            >
              <HStack spacing="5" display={{ base: "none", md: "flex" }}>
                <Link
                  isExternal
                  aria-label="Go to GitHub Profile"
                  href="https://github.com/carlomigueldy"
                  target="_blank"
                >
                  <Icon
                    as={AiFillGithub}
                    display="block"
                    transition="color 0.2s"
                    w="5"
                    h="5"
                    _hover={{ color: "gray.600" }}
                  />
                </Link>
              </HStack>
              {/* <IconButton
                size="md"
                fontSize="lg"
                aria-label={`Switch to ${text} mode`}
                variant="ghost"
                color="current"
                ml={{ base: "0", md: "3" }}
                onClick={toggleMode}
                icon={<SwitchIcon />}
              /> */}
              {BuyMeACoffeeButton}
              <IconButton
                display={{ base: "flex", md: "none" }}
                aria-label="Open menu"
                fontSize="20px"
                color={useColorModeValue("gray.800", "inherit")}
                variant="ghost"
                icon={<AiOutlineMenu />}
                onClick={mobileNav.onOpen}
              />
            </Flex>
          </Flex>
          {MobileNavContent}
        </chakra.div>
      </chakra.header>
    </Box>
  );
};

export default AppHeader;

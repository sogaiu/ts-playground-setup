#! /bin/sh

JANET_TAG=v1.35.2

########################################################################

JANET_BIN=./janet/build/janet

dir=$(pwd)

########################################################################

# https://stackoverflow.com/a/27776822
# https://en.wikipedia.org/wiki/Uname#Examples
case $(uname -s) in
  Linux* | Darwin*)
    MAKE="make"
    ;;
  DragonFly* | FreeBSD* | NetBSD* | OpenBSD*)
    MAKE="gmake"
    ;;
  *)
    printf "Unrecognized system, defaulting to: make"
    MAKE="make"
    ;;
esac

########################################################################

fetch_and_build_janet()
{
  git clone https://github.com/janet-lang/janet \
      --depth 1 --branch "$JANET_TAG" && \
    cd janet && \
    "$MAKE" clean && \
    "$MAKE" && \
    cd "$dir" || exit
}

main()
{
 if [ ! -f "$JANET_BIN" ]; then
   fetch_and_build_janet
 fi
 cd "$dir" || exit
 if [ -f "$JANET_BIN" ]; then
   "$JANET_BIN" main.janet
 else
   printf "failed to find janet binary at: %s\n" "$JANET_BIN"
   exit
 fi
}

########################################################################

if [ -n "$NON_INTERACTIVE" ]; then
  main
else
  printf "Prepare a tree-sitter playground directory.\n"
  printf "\n"
  printf "This involves cloning, building, scraping, etc.\n"
  printf "\n"
  printf "Note: probably good to edit grammar-repos.txt first.\n"
  printf "\n"
  printf "Continue? [y/N] "

  read -r answer

  case "$answer" in
    y | Y | yes | YES)
      main
      ;;
    *)
      printf "Ok, aborting.\n"
      ;;
  esac
fi

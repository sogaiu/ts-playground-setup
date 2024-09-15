#! /bin/sh

JANET_VERSION=1.36.0
JANET_TAG="v$JANET_VERSION"

########################################################################

JANET_BIN=./janet/build/janet
JANET_MINGW_EXE=./bin/janet.exe

########################################################################

UNAME_S=$(uname -s)

dir=$(pwd)

########################################################################

# https://stackoverflow.com/a/27776822
# https://en.wikipedia.org/wiki/Uname#Examples
case $UNAME_S in
  Linux* | Darwin*)
    MAKE="make"
    ;;
  DragonFly* | FreeBSD* | NetBSD* | OpenBSD*)
    MAKE="gmake"
    ;;
  MINGW64_NT*)
    MAKE="make"
    export CC="gcc"
    ;;
  *)
    printf "Unrecognized system, defaulting to: make"
    MAKE="make"
    ;;
esac

########################################################################

ensure_janet()
{
  case $UNAME_S in
    MINGW64_NT*)
      mkdir -p ./janet/build
      cp "$JANET_MINGW_EXE" "$JANET_BIN"
      ;;
  *)
      if [ ! -d "janet" ]; then
        git clone https://github.com/janet-lang/janet \
          --depth 1 \
          --branch "$JANET_TAG" || exit
      fi

      cd janet && \
      "$MAKE" clean && \
      "$MAKE" && \
      cd "$dir" || exit
      ;;
  esac
}

main()
{
 if [ ! -f "$JANET_BIN" ]; then
   ensure_janet
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

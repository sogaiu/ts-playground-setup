#! /bin/sh

JANET_TAG=v1.35.2

# https://stackoverflow.com/a/27776822
# https://en.wikipedia.org/wiki/Uname#Examples
case $(uname -s) in
  Linux*)
    MAKE="make"
    ;;
  Darwin* | DragonFly* | FreeBSD* | NetBSD* | OpenBSD*)
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
  git clone https://github.com/janet-lang/janet && \
    cd janet && \
    git checkout "$JANET_TAG" && \
    "$MAKE" && \
    cd "$dir" || exit
}

########################################################################

dir=$(pwd)

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
     if [ ! -f ./janet/build/janet ]; then
       fetch_and_build_janet
     fi
     cd "$dir" || exit
     if [ -f ./janet/build/janet ]; then
       ./janet/build/janet main.janet
     fi
    ;;
  *)
    printf "Ok, aborting.\n"
    ;;
esac


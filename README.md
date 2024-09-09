# ts-playground-setup

Prepare a directory of files to serve a tree-sitter playground for one
or more grammars, like
[this](https://sogaiu.github.io/ts-playground-setup/playground.html).

## Introduction

### What and Why

This repository provides code to automate the process of assembling a
tree of files and directories for hosting a tree-sitter playground for
a user-specified list of grammars.

This might be useful in the following sorts of cases:

* Demoing one's grammar via a web server...well, because :)
* Switching among multiple similar grammars for comparison [0]
* Easing the experiencing / investigation of an issue

### Prerequisites

It may work on typical Unix-ish systems / environments [1] that have
tools such as:

* bash
* gcc [2]
* git
* GNU make
* python3 [3]
* typical sh

Also, a relatively recent version of the `tree-sitter` cli is needed.
Out-of-the-box, this code should work with version `0.23.0` [4].

Most of this document is written with a slant toward a UNIX-like
system, but it's possible with some work to get it to work on Windows
too.  See the Windows section near the end of this document for more
information.

### Other Things to Examine

Consider inspecting the `sample-output-dir` directory as it is an
example of what can be produced with this tool [5].

See the Details section below for information regarding:

* Implementation
* Limits
* Security <- *PLEASE LOOK AT THIS*

## Instructions

### Setup and Run

Clone this repository:

```
git clone https://github.com/sogaiu/ts-playground-setup
```

Edit list of grammar repositories [6]:

```
cd ts-playground-setup
$EDITOR grammar-repos.txt || $VISUAL grammar-repos.txt
```

Prepare web directory:

```
sh build-and-run.sh
```

### Verify

Examine results by running a web server, e.g.:

```
cd web && python3 -m http.server
```

and viewing via a web browser, e.g.:

```
xdg-open http://localhost:8000/playground.html
```

## Details

### Implementation

The final product is a directory that contains HTML, CSS, JavaScript,
and WASM files.  There are three groups of files:

1. General and editor JavaScript and CSS
  * `clusterize.min.js` and associated css
  * `codemirror.min.js` and associated css
  * `jquery-*.min.js`

2. Bits from or based on tree-sitter repository content
  * `assets` directory with images
  * `playground.html`
  * `playground.js`
  * `tree-sitter.js`
  * `tree-sitter.wasm`

3. WASM files built for each grammar
  * `tree-sitter-*.wasm` files

Files for group 1 are just fetched by curl.

Files for group 2 are obtained by cloning the tree-sitter repository,
building, and copying.  `playground.html` is modified in various ways
including:

* changing to account for the grammars specified by the user via
  `grammar-repos.txt`
* changing links to `.css`, `.js`, `.wasm`, etc. be local ones
* some other tweaks (including cosmetic things)

Files for group 3 are obtained by cloning grammar repositories and
building appropriate `.wasm` files.

Note that for building `.wasm` files (both the grammar ones and
`tree-sitter.wasm`), emsdk is used, so it is also cloned and prepared
for use.

The code that orchestrates all of this is written in the Janet
programming language so that is cloned and built as well.

### Limits

This probably won't work for grammars that depend on other grammars
(e.g. tree-sitter-cpp).

This may not work if the repository url doesn't end in something
like `tree-sitter-<name>`.

I've seen reports of failure to build `.wasm` files for some grammars,
so those may not work with the code in this repository either.

### Security

This tool clones, compiles, and executes code from a variety of
sources.  So the usual disclaimers apply regarding running code that
has been written by others.

There are at least two contexts that are relevant:

* Using this tool to generate the web directory
* Viewing the served files in one's web browser

For the former (using the tool), in addition to this repository and
any user-specified grammar repositories (via `grammar-repos.txt`), the
repositories involved include:

* [emsdk](https://github.com/emscripten-core/emsdk)
* [janet](https://github.com/janet-lang/janet)
* [tree-sitter](https://github.com/tree-sitter/tree-sitter)

For the latter (viewing via a browser), the `.html`, `.js`, and
`.wasm` files (or the source used to generate them) originate from:

* user-specified grammar repositories (via `grammar-repos.txt`)
* [clusterize](https://github.com/NeXTs/Clusterize.js) (actually via a cdn)
* [codemirror](https://github.com/codemirror/codemirror5) (actually via a cdn)
* [jquery](https://github.com/jquery/jquery)
* [tree-sitter](https://github.com/tree-sitter/tree-sitter)

Also worthy of note might be [this
issue](https://github.com/tree-sitter/tree-sitter/issues/1641) that
summarizes some important security considerations regarding the use of
grammar repository code.

## Windows

A relatively easy way for a working Windows arrangement is to use
[scoop](https://scoop.sh) to install its `git` (underlying bits are
from [git for windows](https://gitforwindows.org/)), `mingw`, and
`python` packages, i.e. via a powershell prompt:

```
scoop install git
scoop install mingw
scoop install python
```

Then via the bash shell that comes with "git for windows", confirm
that the `gcc` and `make` binaries that would be invoked come from
`mingw`.  They are typically under a location like:

```
C:\Users\<username>\scoop\apps\mingw\current\bin
```

so check `PATH` and adjust accordingly if needed.  Note that if doing
this from the bash shell, the paths listed in `PATH` might look more
like `/c/Users/<username>/scoop/apps/mingw/current/bin`, so some
massaging (e.g. use forward slashes, don't lead with `C:`, etc.) to
conform may be in order.

Once all of that is ready, it may be possible to follow the steps in
the earlier Instructions section, though some minor adjustment for the
UNIX-orientedness will likely be needed.

## Footnotes

[0] For this to work, the grammars likely need to have different
names.

[1] There is CI now for linux, macos, and windows (mingw + git for
windows).

[2] It may be possible to get this to work with `clang` but this has
not been attempted.

[3] The code in this repository uses emsdk and will fetch and
configure that for use, but emsdk itself requires python3.  Please
ensure python3 is available.

[4] The code can probably work with versions back to around `0.20.9`,
but some editing of the `main.janet` file to change the tree-sitter
repository tag (see the definition of `ts-repo`) is probably
necessary.

[5] The content of the directory `sample-output-dir` could be
copy-modified to one's taste instead of using the code in this
repository to achieve one's ends :)

[6] See
[here](https://github.com/sogaiu/ts-questions/blob/master/ts-grammar-repositories.txt)
for a list of repository urls.


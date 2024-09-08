# ts-playground-setup

Prepare a directory of files to serve a tree-sitter playground for one
or more grammars, like
[this](https://sogaiu.github.io/ts-playground-setup/playground.html).

## Introduction

This repository provides code to automate the process of assembling a
tree-sitter playground that works with a user-specified list of
grammars.

This might be useful in the following sorts of cases:

* Demo one's grammar via a web server...well, because :)
* Switch between multiple alternate similar grammars for comparison [0]
* Make it easier for folks to experience / investigate an issue with
  your grammar

It may work on Unix-ish systems / environments [1] that have typical dev
tools such as:

* git
* gcc or clang
* GNU make
* typical shell such as dash, bash, or zsh

A relatively recent version of the `tree-sitter` cli is also
necessary.  Out-of-the-box, this code should work with version
`0.23.0` [2].

Also, the directory `sample-output-dir` is an example of what can be
produced with this tool [3].

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

Edit list of grammar repositories [4]:

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

## Footnotes

[0] For this to work, I think the grammars need to have different
names.

[1] There is CI now for linux and macos.  Have confirmed that it can
work on Windows with appropriate bits.

A relatively easy way for a working Windows arrangement is to use
[scoop](https://scoop.sh) to install its `git` (underlying bits are
from [git for windows](https://gitforwindows.org/) and `mingw`
packages, i.e. via a powershell prompt:

```
scoop install git
scoop install mingw
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
massaging to conform may be in order.

[2] The code can probably work with versions back to around `0.20.9`,
but some editing of the `main.janet` file to change the tree-sitter
repository tag (see the definition of `ts-repo`) is probably
necessary.

[3] The content of the directory `sample-output-dir` could be
copy-modified to one's taste instead of using the code in this
repository to achieve one's ends :)

[4] See
[here](https://github.com/sogaiu/ts-questions/blob/master/ts-grammar-repositories.txt)
for a list of repository urls.


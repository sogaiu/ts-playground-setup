# script to prepare a directory with appropriate .js, .html, .wasm, etc.
# for serving a tree-sitter playground for grammars of one's choice.

# 0. visit ts-questions to confirm the appropriate emsdk version
#    to use relative to the tree-sitter cli version you will be using.
#
# 1. edit grammar-repo-urls below to specify grammar repository urls
#
# 2. optionally confirm the jquery, codemirror, and clusterize versions
#    to use.  the versions in this script were obtained via a copy
#    of cli/src/playrgound.html within the tree-sitter repository.
#
# 3. run this script using janet.
#
# 4. assuming it succeeded, observe the output as it will give hints
#    about how to edit web/playground.html...then edit appropriately.
#
# 5. cd to the web directory and try serving the web pages and viewing
#    via a browser.  with python3, one can do `python3 -m http.server`

########################################################################

# versions of things one might want to update from time-to-time

# see ts-questions repository for info on appropriate version
(def emsdk-version "3.1.64")

# see latest playground.html in tree-sitter repository for versions
(def jquery-version "3.3.1")
(def codemirror-version "5.45.0")
(def clusterize-version "0.18.0")

########################################################################

# paths and urls

(def web-root "web")

(def ts-repo-url
  "https://github.com/tree-sitter/tree-sitter")

(def emsdk-repo-url
  "https://github.com/emscripten-core/emsdk")

(def grammar-repo-urls
  @["https://github.com/sogaiu/tree-sitter-clojure"
    "https://github.com/sogaiu/tree-sitter-janet-simple"])

(def js-urls
  # obtained urls via playground.html
  @[(string/format "https://code.jquery.com/jquery-%s.min.js"
                   jquery-version)
    (string/format (string "https://cdnjs.cloudflare.com"
                           "/ajax/libs/codemirror/%s/codemirror.min.js")
                   codemirror-version)
    (string/format (string "https://cdnjs.cloudflare.com"
                           "/ajax/libs/clusterize.js/%s/clusterize.min.js")
                   clusterize-version)])

(def css-urls
  # obtained urls via playground.html
  @[(string/format (string "https://cdnjs.cloudflare.com"
                           "/ajax/libs/codemirror/%s/codemirror.min.css")
                   codemirror-version)
    (string/format (string "https://cdnjs.cloudflare.com"
                           "/ajax/libs/clusterize.js/%s/clusterize.min.css")
                   clusterize-version)])

########################################################################

# XXX: just for reference -- which things might matter from tree-sitter
(def playground-file-paths
  @["tree-sitter/cli/src/playground.html"
    "tree-sitter/docs/assets/images/favicon-16x16.png"
    "tree-sitter/docs/assets/images/favicon-32x32.png"
    "tree-sitter/docs/assets/js/playground.js"
    "tree-sitter/lib/binding_web/tree-sitter.js"
    "tree-sitter/lib/binding_web/tree-sitter.wasm"])

########################################################################

(defn tail-from-url
  [url]
  (string/slice url (inc (last (string/find-all "/" url)))))

########################################################################

(def repo-root-dir (os/cwd))

(def repo-urls
  @[ts-repo-url
    emsdk-repo-url
    ;grammar-repo-urls
    ])

# 1. clone all the things
(each url repo-urls
  (when (not (os/stat (tail-from-url url)))
    (os/execute ["git" "clone" url] :px)))

# 2. setup emsdk
(defer (os/cd repo-root-dir)
  (os/cd "emsdk")
  (os/execute ["./emsdk" "install" emsdk-version] :px)
  (os/execute ["./emsdk" "activate" emsdk-version] :px))

# https://github.com/emscripten-core/emsdk/issues/1142 \
#         #issuecomment-1334065131
(def path-with-emcc
  (string (os/cwd) "/emsdk/upstream/emscripten" ":"
          (os/getenv "PATH")))

(def env-with-emcc
  (merge (os/environ)
         {"PATH" path-with-emcc}))

# XXX: can use this to see if emcc is available using env-with-emcc
'(os/execute ["which" "emcc"] :pex env-with-emcc)

# 3. prepare the web root hierarchy skeleton
(os/mkdir web-root)
(os/mkdir (string web-root "/assets"))
(os/mkdir (string web-root "/assets/css"))
(os/mkdir (string web-root "/assets/images"))

(defer (os/cd repo-root-dir)
  (os/cd (string web-root "/assets/css"))
  (each css-url css-urls
    (def name (tail-from-url css-url))
    (os/execute ["curl"
                 "--output" name
                 "--location"
                 css-url] :px)))

(defer (os/cd repo-root-dir)
  (os/cd web-root)
  (each js-url js-urls
    (def name (tail-from-url js-url))
    (os/execute ["curl"
                 "--output" name
                 "--location"
                 js-url] :px)))

# 4. build and copy grammar wasm files
(each g-url grammar-repo-urls
  (defer (os/cd repo-root-dir)
    (def local-dir (tail-from-url g-url))
    (def name
      (->> (string/slice local-dir (length "tree-sitter-"))
           # ...because naming can be tricky
           (string/replace-all "-" "_")))
    (os/cd local-dir)
    # make sure src/parser.c and friends exist
    (os/execute ["tree-sitter" "generate" "--no-bindings"] :px)
    # build wasm files
    (os/execute ["tree-sitter" "build" "--wasm"] :pex env-with-emcc)
    # copy built wasm into web-root
    (def wasm-name (string "tree-sitter-" name ".wasm"))
    (spit (string "../" web-root "/" wasm-name)
          (slurp wasm-name))))

# 5. build tree-sitter.{js,wasm}, and copy results and web stuff
(defer (os/cd repo-root-dir)
  (os/cd "tree-sitter")
  # among other things, creates lib/binding_web/tree-sitter.{js,wasm}
  (os/execute ["bash" "script/build-wasm" "--debug"] :pex env-with-emcc)
  # copy to web-root, lib/binding_web/tree-sitter.{js,wasm}
  (spit (string "../" web-root "/tree-sitter.js")
        (slurp "lib/binding_web/tree-sitter.js"))
  (spit (string "../" web-root "/tree-sitter.wasm")
        (slurp "lib/binding_web/tree-sitter.wasm"))
  # copy other relevant bits
  (spit (string "../" web-root "/assets/images/favicon-16x16.png")
        (slurp "docs/assets/images/favicon-16x16.png"))
  (spit (string "../" web-root "/assets/images/favicon-32x32.png")
        (slurp "docs/assets/images/favicon-32x32.png"))
  (spit (string "../" web-root "/playground.js")
        (slurp "docs/assets/js/playground.js"))
  # XXX: playground.html needs to be edited!
  (spit (string "../" web-root "/playground.html")
        (slurp "cli/src/playground.html")))

# 6. give some hints as to how to finish ott
(def diff
  ``
  --- tree-sitter/cli/src/playground.html	2024-08-26 19:22:17.486280893 +0900
  +++ web/playground.html	2024-08-26 19:25:28.551343347 +0900
  @@ -1,17 +1,17 @@
   <head>
     <meta charset="utf-8">
  -  <title>tree-sitter THE_LANGUAGE_NAME</title>
  -  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.45.0/codemirror.min.css">
  -  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/clusterize.js/0.18.0/clusterize.min.css">
  -  <link rel="icon" type="image/png" href="https://tree-sitter.github.io/tree-sitter/assets/images/favicon-32x32.png" sizes="32x32" />
  -  <link rel="icon" type="image/png" href="https://tree-sitter.github.io/tree-sitter/assets/images/favicon-16x16.png" sizes="16x16" />
  +  <title>tree-sitter playground</title>
  +  <link rel="stylesheet" href="/assets/css/codemirror.min.css">
  +  <link rel="stylesheet" href="/assets/css/clusterize.min.css">
  +  <link rel="icon" type="image/png" href="/assets/images/favicon-32x32.png" sizes="32x32" />
  +  <link rel="icon" type="image/png" href="/assets/images/favicon-16x16.png" sizes="16x16" />
   </head>

   <body>
     <div id="playground-container" style="visibility: hidden;">
       <header>
         <div class=header-item>
  -        <bold>THE_LANGUAGE_NAME</bold>
  +        <bold>playground</bold>
         </div>

         <div class=header-item>
  @@ -33,8 +33,9 @@
           <a href="https://tree-sitter.github.io/tree-sitter/playground#about">(?)</a>
         </div>

  -      <select id="language-select" style="display: none;">
  -        <option value="parser">Parser</option>
  +      <select id="language-select">
  +        <option value="clojure">clojure</option>
  +        <option value="janet_simple">janet_simple</option>
         </select>
       </header>

  @@ -56,12 +57,12 @@
     </div>

     <script
  -    src="https://code.jquery.com/jquery-3.3.1.min.js"
  +    src="/jquery-3.3.1.min.js"
       crossorigin="anonymous">
     </script>

  -  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.45.0/codemirror.min.js"></script>
  -  <script src="https://cdnjs.cloudflare.com/ajax/libs/clusterize.js/0.18.0/clusterize.min.js"></script>
  +  <script src="/codemirror.min.js"></script>
  +  <script src="/clusterize.min.js"></script>

     <script>LANGUAGE_BASE_URL = "";</script>
     <script src=tree-sitter.js></script>
  ``)

(print)

(print diff)

(print)

(printf "Please edit %s/playground.html (see example diff above)."
        web-root)


# script to prepare a directory with appropriate .js, .html, .wasm, etc.
# for serving a tree-sitter playground for grammars of one's choice.

# 0. visit ts-questions to confirm the appropriate emsdk version
#    to use relative to the tree-sitter cli version you will be using.
#
# 1. edit grammar-repo-urls below to specify grammar repository urls
#
# 2. run this script using janet.
#
# 3. cd to the web directory and try serving the web pages and viewing
#    via a browser.  with python3, one can do `python3 -m http.server`

########################################################################

# TODO
#
# 1. write a version in bash, test in osh
# 2. write a version in ysh

########################################################################

# see ts-questions repository for info on appropriate version
(def emsdk-version "3.1.64")

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

(comment

  (tail-from-url "https://github.com/tree-sitter/tree-sitter-c")
  # =>
  "tree-sitter-c"

  )

(defn dir-to-name
  [dir]
  (->> (string/slice dir (length "tree-sitter-"))
       # ...because naming can be tricky
       (string/replace-all "-" "_")))

(comment

  (dir-to-name "tree-sitter-janet-simple")
  # =>
  "janet_simple"

  )

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

# 4. build and copy grammar wasm files
(each g-url grammar-repo-urls
  (defer (os/cd repo-root-dir)
    (def local-dir (tail-from-url g-url))
    (def name (dir-to-name local-dir))
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

# 6. extract info from playground.html and edit
(def pg-path (string web-root "/playground.html"))

(var pg (slurp pg-path))

(def codemirror-version
  (when-let [[target]
             (peg/match ~(sequence (thru "/ajax/libs/codemirror/")
                                   (capture (to "/")))
                        pg)]
    target))

(assert codemirror-version "failed to determine codemirror version")

(def clusterize-version
  (when-let [[target]
             (peg/match ~(sequence (thru "/ajax/libs/clusterize.js/")
                                   (capture (to "/")))
                        pg)]
    target))

(assert clusterize-version "failed to determine clusterize version")

(def jquery-version
  (when-let [[target]
             (peg/match ~(sequence (thru "code.jquery.com/jquery-")
                                   (capture (to ".min.js")))
                        pg)]
    target))

(assert jquery-version "failed to determine jquery version")

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

# mostly account for grammars and make things local
(def patches
  @[#
    [`THE_LANGUAGE_NAME`
     `playground`]
    # make js local
    ;(map |[$ (string "/" (tail-from-url $))]
          js-urls)
    # make css local
    ;(map |[$ (string "/assets/css/" (tail-from-url $))]
          css-urls)
    # some image paths
    [`https://tree-sitter.github.io/tree-sitter/assets/images/`
     `/assets/images/`]
    # show drop down
    [`<select id="language-select" style="display: none;">`
     `<select id="language-select">`]
    # show items for each grammar
    [`<option value="parser">Parser</option>`
     (string/join (map |(do
                          (def name (dir-to-name (tail-from-url $)))
                          (string/format `<option value="%s">%s</option>`
                                         name name))
                       grammar-repo-urls)
                  "\n")]])

(each [target replacement] patches
  (set pg (string/replace-all target replacement pg)))

(spit pg-path pg)

# 7. fetch css and js files
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

# 8. report
(print "Done.\n")

(printf "To test:\n")
(printf "1. Start a web server in the directory named: %s" web-root)
(printf "   e.g. cd %s && python3 -m http.server" web-root)
(printf "2. Visit the playground.html file in a browser via http")
(printf "   e.g. xdg-open http://localhost:8000/playground.html")


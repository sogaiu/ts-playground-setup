# script to prepare a directory with appropriate .js, .html, .wasm, etc.
# for serving a tree-sitter playground for grammars of one's choice.

# 0. edit content of the file grammar-repos.txt appropriately
#
# 1. run this script using janet.
#
# 2. cd to the web directory and try serving the web pages and viewing
#    via a browser.  with python3, one can do `python3 -m http.server`

########################################################################

# paths and urls that likely can stay the same

(def web-root "web")

(def ts-repo-url
  "https://github.com/tree-sitter/tree-sitter")

(def emsdk-repo-url
  "https://github.com/emscripten-core/emsdk")

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
  (->> (string/replace "tree-sitter-" "" dir)
       # ...because naming can be tricky
       (string/replace-all "-" "_")))

(comment

  (dir-to-name "tree-sitter-janet-simple")
  # =>
  "janet_simple"

  )

########################################################################

(def repo-root-dir (os/cwd))

(def grammar-repos
  (let [gr "grammar-repos.txt"]
    (when (os/stat gr)
      (def content (string/trim (slurp gr)))
      (def info @[])
      (each line (string/split "\n" content)
        (when (string/has-prefix? "https://" line)
          (array/push info
                      (string/split " " (string/trim line)))))
      (when (empty? info)
        (errorf "failed to find repo info in %s" gr))
      info)))

(def repo-urls
  @[ts-repo-url
    emsdk-repo-url
    ;(map first grammar-repos)
    ])

# 1. clone all the things
(each url repo-urls
  (when (not (os/stat (tail-from-url url)))
    (os/execute ["git" "clone" "--depth" "1" url] :px)))

# 2. setup emsdk
(def emsdk-version
  # valid from around 2022-09-06 (pre v0.20.8), see commit: d47713ee
  (string/trim (slurp "tree-sitter/cli/loader/emscripten-version")))

(assert (peg/match ~(sequence :d+ "." :d+ "." :d+) emsdk-version)
        (string/format "unexpected emsdk-version: %s" emsdk-version))

(defer (os/cd repo-root-dir)
  (os/cd "emsdk")
  (os/execute ["./emsdk" "install" emsdk-version] :px)
  (os/execute ["./emsdk" "activate" emsdk-version] :px))

# https://github.com/emscripten-core/emsdk/issues/1142#issuecomment-1334065131
(def path-with-emcc
  (string (os/cwd) "/emsdk/upstream/emscripten" ":"
          (os/getenv "PATH")))

(def env-with-emcc
  (merge (os/environ)
         {"PATH" path-with-emcc}))

# XXX: can use this to see if emcc is available using env-with-emcc
'(os/execute ["which" "emcc"] :pex env-with-emcc)

# 3. prepare the web root hierarchy skeleton
(each path [web-root
            (string web-root "/assets")
            (string web-root "/assets/css")
            (string web-root "/assets/images")]
  (os/mkdir path))

# 4. build and copy grammar wasm files
(each [url extra] grammar-repos
  (defer (os/cd repo-root-dir)
    (def local-dir (tail-from-url url))
    (def name
      (dir-to-name (if extra
                     extra
                     local-dir)))
    (os/cd local-dir)
    (when extra
      (os/cd extra))
    # make sure src/parser.c and friends exist
    (os/execute ["tree-sitter" "generate" "--no-bindings"] :px)
    # build wasm files
    (os/execute ["tree-sitter" "build" "--wasm"] :pex env-with-emcc)
    # copy built wasm into web-root
    (def wasm-name (string "tree-sitter-" name ".wasm"))
    (spit (string repo-root-dir "/" web-root "/" wasm-name)
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
  # copy other web-relevant bits
  (spit (string "../" web-root "/assets/images/favicon-16x16.png")
        (slurp "docs/assets/images/favicon-16x16.png"))
  (spit (string "../" web-root "/assets/images/favicon-32x32.png")
        (slurp "docs/assets/images/favicon-32x32.png"))
  (spit (string "../" web-root "/playground.js")
        (slurp "docs/assets/js/playground.js"))
  (spit (string "../" web-root "/playground.html")
        (slurp "cli/src/playground.html")))

# 6. extract info from playground.html and edit in-place
(def pg-path (string web-root "/playground.html"))

(var pg (slurp pg-path))

(def codemirror-version
  (if-let [[target]
           (peg/match ~(sequence (thru "/ajax/libs/codemirror/")
                                 (capture (to "/")))
                      pg)]
    target
    "failed to determine codemirror version"))

(def clusterize-version
  (if-let [[target]
           (peg/match ~(sequence (thru "/ajax/libs/clusterize.js/")
                                 (capture (to "/")))
                      pg)]
    target
    "failed to determine clusterize version"))

(def jquery-version
  (if-let [[target]
           (peg/match ~(sequence (thru "code.jquery.com/jquery-")
                                 (capture (to ".min.js")))
                      pg)]
    target
    "failed to determine jquery version"))

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

# account for grammars, make things local, and some minor changes
(def patches
  @[#
    [`THE_LANGUAGE_NAME`
     `playground`]
    # remove about link
    [(string `<a href="`
             `https://tree-sitter.github.io/tree-sitter/playground#about`
             `">(?)</a>`)
     ""]
    # make js local
    ;(map |[$ (string "/" (tail-from-url $))]
          js-urls)
    # make css local
    ;(map |[$ (string "/assets/css/" (tail-from-url $))]
          css-urls)
    # make some images paths local
    [`https://tree-sitter.github.io/tree-sitter/assets/images/`
     `/assets/images/`]
    # show drop down
    [`<select id="language-select" style="display: none;">`
     `<select id="language-select">`]
    # show items for each grammar
    [`<option value="parser">Parser</option>`
     (string/join (map |(let [[url extra] $
                              local-dir (tail-from-url url)
                              name (dir-to-name (if extra
                                                  extra
                                                  local-dir))]
                          (string/format `<option value="%s">%s</option>`
                                         name name))
                       grammar-repos)
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
(printf "1. Start a web server in the directory named %s, e.g." web-root)
(print)
(printf "   cd %s && python3 -m http.server" web-root)
(print)
(printf "2. Visit the playground.html file in a browser via http, e.g.")
(print)
(printf "   xdg-open http://localhost:8000/playground.html")


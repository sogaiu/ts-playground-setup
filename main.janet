# script to prepare a directory with appropriate .js, .html, .wasm, etc.
# for serving a tree-sitter playground for grammars of one's choice.

# 0. confirm tree-sitter cli version and make ts-repo tag info and
#    ts-bin-path cli version consistent if necessary
#
# 1. edit content of the file grammar-repos.txt appropriately
#
# 2. run this script using janet.
#
# 3. cd to the web directory and try serving the web pages and viewing
#    via a browser.  with python3, one can do `python3 -m http.server`

########################################################################

(def ts-repo
  ["https://github.com/tree-sitter/tree-sitter"
   #"v0.20.9"
   #"v0.22.2"
   #"v0.22.6"
   "v0.23.0"
   ])

# name or path to tree-sitter binary
(def ts-bin-path
  "tree-sitter"
  #"tree-sitter.0.20.9"
  #"tree-sitter.0.22.2"
  #"tree-sitter.0.22.6"
  #"tree-sitter.0.23.0"
  )

# https://github.com/sogaiu/ts-questions/blob \
#                   /98536e18af4da0560a543aab63f4bffa9ca2dbe2 \
#                   /questions \
#                   /which-version-of-emscripten-should-be-used-for-the-playground
#                   /README.md#versions
(def ts-emsdk
  @{"v0.20.9" "3.1.37"
    "v0.21.0" "3.1.37"
    "v0.22.0" "3.1.37"
    "v0.22.1" "3.1.37"
    "v0.22.2" "3.1.37"
    "v0.22.3" "3.1.55"
    "v0.22.4" "3.1.55"
    "v0.22.5" "3.1.55"
    "v0.22.6" "3.1.55"
    "v0.23.0" "3.1.64"})

# https://github.com/emscripten-core/emsdk/issues/1441
(def emsdk-version
  (get ts-emsdk (get ts-repo 1)))

(def emsdk-repo
  ["https://github.com/emscripten-core/emsdk"
   emsdk-version])

########################################################################

# paths

(def grammar-repos-file "grammar-repos.txt")

(def web-root "web")

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

(def log @[])

(defn print-and-logf
  [fmt & args]
  (def msg (string/format fmt ;args))
  (print msg)
  (array/push log msg))

(defn dump-log
  []
  (each line log (eprint line)))

(defn exit-with-logf
  [msg & args]
  (def response (getline "Dump full log? [y/N]"))
  (when (= "y" (string/ascii-lower response))
    (dump-log))
  (eprintf msg ;args)
  (os/exit 1))

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

(defn ts-version
  []
  (with [of (file/temp)]
    (def ts-ver-result (os/execute [ts-bin-path "--version"] :p {:out of}))
    (when (not (zero? ts-ver-result))
      (exit-with-logf (string "exit code: %d\n"
                              "failed to determine tree-sitter version")
                      ts-ver-result))
    #
    (file/seek of :set 0)
    # e.g. tree-sitter 0.23.0 (12fb31826b8469cc7b9788e72bceee5af1cf0977)
    (def output (->> (file/read of :all)
                     string/trim
                     (string/split " ")))
    #
    (map scan-number (string/split "." (get output 1)))))

(comment

  (ts-version)
  # = >
  @[0 23 0]

  )

(defn do-command
  [command flags &opt env]
  (default env {})
  (with [of (file/temp)]
    (with [ef (file/temp)]
      (def result
        (os/execute command flags (merge env {:err ef :out of})))
      (when (not (zero? result))
        (print-and-logf of)
        (print-and-logf ef)
        (exit-with-logf (string "exit code: %d\n"
                                "%n failed")
                        result command)))))

(defn ts-build-wasm
  [env]
  # XXX: don't enable yet
  #(def [major minor patch] (ts-version))
  (def args
    # XXX: don't enable yet
    # plan is for v0.24.0 to remove build-wasm apparently
    #(if (and (zero? major) (<= minor 23))
      ["build-wasm"]
    #  ["build" "--wasm"])
    )
  (do-command [ts-bin-path ;args] :pe env))

########################################################################

(def [result _]
  (protect (os/execute [ts-bin-path] :p {:err (file/temp)})))

(assert result
        (string/format "failed to find tree-sitter cli via: %s"
                       ts-bin-path))

(assert (= :file (os/stat grammar-repos-file :mode))
        (string/format "failed to find grammar repos file: %s"
                       grammar-repos-file))

(assert emsdk-version
        (string "failed to guess emsdk version.\n"
                "tip: can specify a value via emsdk-version\n"))

########################################################################

(def repo-root-dir (os/cwd))

(print-and-logf "0. Detecting grammars")

(def grammar-repos
  (let [content (string/trim (slurp grammar-repos-file))
        repo-info @[]]
    (each line (string/split "\n" content)
      (when (string/has-prefix? "https://" line)
        (array/push repo-info
                    (string/split " " (string/trim line)))))
    (when (empty? repo-info)
      (exit-with-logf "failed to find repo info in %s"
                      grammar-repos-file))
    repo-info))

(each [url _] grammar-repos
  (print-and-logf "* %s" url))

(def repos
  @[ts-repo
    emsdk-repo
    ;(map |[(first $)] grammar-repos)
    ])

(print-and-logf "1. Cloning repositories")

(each [url branch] repos
  (when (not (os/stat (tail-from-url url)))
    (def branch-part (if branch ["--branch" branch] []))
    (print-and-logf "* Cloning %s..." url)
    (do-command ["git" "clone" "--depth" "1" ;branch-part url] :p)))

(print-and-logf "2. Setting up emsdk")

(def emsdk-version-from-ts
  # valid from around 2022-09-06 (pre v0.20.8), see commit: d47713ee
  (string/trim (slurp "tree-sitter/cli/loader/emscripten-version")))

(assert (= emsdk-version emsdk-version-from-ts)
        (string/format (string "emsdk version mismatch\n"
                               "* tree-sitter says: %s\n"
                               "* script specifies: %s")
                       emsdk-version-from-ts emsdk-version))

(assert (peg/match ~(sequence :d+ "." :d+ "." :d+) emsdk-version)
        (string/format "unexpected emsdk-version: %s" emsdk-version))

(defer (os/cd repo-root-dir)
  (os/cd "emsdk")
  (print-and-logf "* Running ./emsdk install %s..." emsdk-version)
  (do-command ["./emsdk" "install" emsdk-version] :p)
  #
  (print-and-logf "* Running ./emsdk activate %s..." emsdk-version)
  (do-command ["./emsdk" "activate" emsdk-version] :p))

# https://github.com/emscripten-core/emsdk/issues/1142#issuecomment-1334065131
(def path-with-emcc
  (string (os/cwd) "/emsdk/upstream/emscripten" ":"
          (os/getenv "PATH")))

(def env-with-emcc
  (merge (os/environ) {"PATH" path-with-emcc}))

# XXX: can use this to see if emcc is available using env-with-emcc
'(os/execute ["which" "emcc"] :pex env-with-emcc)


(print-and-logf "3. Preparing web root skeleton")

(each path [web-root
            (string web-root "/assets")
            (string web-root "/assets/images")
            (string web-root "/assets/css")
            (string web-root "/assets/wasm")]
  (os/mkdir path))

(print-and-logf "4. Building and copying grammar .wasm files")

(each [url extra] grammar-repos
  (def local-dir (tail-from-url url))
  (def name (dir-to-name (if extra
                           extra
                           local-dir)))
  (def wasm-name (string "tree-sitter-" name ".wasm"))
  (def wasm-path
    (string repo-root-dir "/" web-root "/assets/wasm/" wasm-name))
  (when (not (os/stat wasm-path))
    (defer (os/cd repo-root-dir)
      (os/cd local-dir)
      (when extra
        (os/cd extra))
      # make sure src/parser.c and friends exist
      (print-and-logf "* Generating parser.c and friends for %s..." name)
      (do-command [ts-bin-path "generate" "--no-bindings"] :p)
      # build wasm files
      (print-and-logf "* Building .wasm for %s..." name)
      (ts-build-wasm env-with-emcc)
      # copy built wasm into web-root
      (spit wasm-path (slurp wasm-name)))))

(print-and-logf "5. Building and copying playground web bits")

(defer (os/cd repo-root-dir)
  (os/cd "tree-sitter")
  # among other things, creates lib/binding_web/tree-sitter.{js,wasm}
  (print-and-logf "* Building tree-sitter.{js,wasm}")
  (do-command ["bash" "script/build-wasm" "--debug"] :pe env-with-emcc)
  # copy to web-root, lib/binding_web/tree-sitter.{js,wasm}
  (print-and-logf "* Copying some files into %s directory..." web-root)
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

(print-and-logf "6. Patching playground.html")

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
    [`LANGUAGE_BASE_URL = "";`
     `LANGUAGE_BASE_URL = "assets/wasm";`]
    # remove about link
    [(string `<a href="`
             `https://tree-sitter.github.io/tree-sitter/playground#about`
             `">(?)</a>`)
     ""]
    # make js local
    ;(map |[$ (tail-from-url $)]
          js-urls)
    # make css local
    ;(map |[$ (string "assets/css/" (tail-from-url $))]
          css-urls)
    # make some images paths local
    [`https://tree-sitter.github.io/tree-sitter/assets/images/`
     `assets/images/`]
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

(print-and-logf "7. Fetching external .css and .js files")

# 7. fetch css and js files
(defer (os/cd repo-root-dir)
  (os/cd (string web-root "/assets/css"))
  (print-and-logf "* Fetching .css files...")
  (each css-url css-urls
    (def name (tail-from-url css-url))
    (do-command ["curl" "--output" name
                 "--location"
                 css-url] :p)))

(defer (os/cd repo-root-dir)
  (os/cd web-root)
  (print-and-logf "* Fetching .js files...")
  (each js-url js-urls
    (def name (tail-from-url js-url))
    (do-command ["curl" "--output" name
                 "--location"
                 js-url] :p)))

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


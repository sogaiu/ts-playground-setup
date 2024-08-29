// include: shell.js
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(moduleArg) => Promise<Module>
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Module != "undefined" ? Module : {};

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).
// Attempt to auto-detect the environment
var ENVIRONMENT_IS_WEB = typeof window == "object";

var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";

// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";

var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (Module["ENVIRONMENT"]) {
  throw new Error("Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)");
}

if (ENVIRONMENT_IS_NODE) {}

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)
// include: /home/user/src/ts-playground-setup/tree-sitter/lib/binding_web/prefix.js
var TreeSitter = function() {
  var initPromise;
  var document = typeof window == "object" ? {
    currentScript: window.document.currentScript
  } : null;
  class Parser {
    constructor() {
      this.initialize();
    }
    initialize() {
      throw new Error("cannot construct a Parser before calling `init()`");
    }
    static init(moduleOptions) {
      if (initPromise) return initPromise;
      Module = Object.assign({}, Module, moduleOptions);
      return initPromise = new Promise(resolveInitPromise => {
        // end include: /home/user/src/ts-playground-setup/tree-sitter/lib/binding_web/prefix.js
        // Sometimes an existing Module object exists with properties
        // meant to overwrite the default module functionality. Here
        // we collect those properties and reapply _after_ we configure
        // the current environment's defaults to avoid having to be so
        // defensive during initialization.
        var moduleOverrides = Object.assign({}, Module);
        var arguments_ = [];
        var thisProgram = "./this.program";
        var quit_ = (status, toThrow) => {
          throw toThrow;
        };
        // `/` should be present at the end if `scriptDirectory` is not empty
        var scriptDirectory = "";
        function locateFile(path) {
          if (Module["locateFile"]) {
            return Module["locateFile"](path, scriptDirectory);
          }
          return scriptDirectory + path;
        }
        // Hooks that are implemented differently in different runtime environments.
        var readAsync, readBinary;
        if (ENVIRONMENT_IS_NODE) {
          if (typeof process == "undefined" || !process.release || process.release.name !== "node") throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
          var nodeVersion = process.versions.node;
          var numericVersion = nodeVersion.split(".").slice(0, 3);
          numericVersion = (numericVersion[0] * 1e4) + (numericVersion[1] * 100) + (numericVersion[2].split("-")[0] * 1);
          var minVersion = 16e4;
          if (numericVersion < 16e4) {
            throw new Error("This emscripten-generated code requires node v16.0.0 (detected v" + nodeVersion + ")");
          }
          // These modules will usually be used on Node.js. Load them eagerly to avoid
          // the complexity of lazy-loading.
          var fs = require("fs");
          var nodePath = require("path");
          scriptDirectory = __dirname + "/";
          // include: node_shell_read.js
          readBinary = filename => {
            // We need to re-wrap `file://` strings to URLs. Normalizing isn't
            // necessary in that case, the path should already be absolute.
            filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
            var ret = fs.readFileSync(filename);
            assert(ret.buffer);
            return ret;
          };
          readAsync = (filename, binary = true) => {
            // See the comment in the `readBinary` function.
            filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
            return new Promise((resolve, reject) => {
              fs.readFile(filename, binary ? undefined : "utf8", (err, data) => {
                if (err) reject(err); else resolve(binary ? data.buffer : data);
              });
            });
          };
          // end include: node_shell_read.js
          if (!Module["thisProgram"] && process.argv.length > 1) {
            thisProgram = process.argv[1].replace(/\\/g, "/");
          }
          arguments_ = process.argv.slice(2);
          if (typeof module != "undefined") {
            module["exports"] = Module;
          }
          quit_ = (status, toThrow) => {
            process.exitCode = status;
            throw toThrow;
          };
        } else if (ENVIRONMENT_IS_SHELL) {
          if ((typeof process == "object" && typeof require === "function") || typeof window == "object" || typeof importScripts == "function") throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
        } else // Note that this includes Node.js workers when relevant (pthreads is enabled).
        // Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
        // ENVIRONMENT_IS_NODE.
        if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
          if (ENVIRONMENT_IS_WORKER) {
            // Check worker, not web, since window could be polyfilled
            scriptDirectory = self.location.href;
          } else if (typeof document != "undefined" && document.currentScript) {
            // web
            scriptDirectory = document.currentScript.src;
          }
          // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
          // otherwise, slice off the final part of the url to find the script directory.
          // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
          // and scriptDirectory will correctly be replaced with an empty string.
          // If scriptDirectory contains a query (starting with ?) or a fragment (starting with #),
          // they are removed because they could contain a slash.
          if (scriptDirectory.startsWith("blob:")) {
            scriptDirectory = "";
          } else {
            scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
          }
          if (!(typeof window == "object" || typeof importScripts == "function")) throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
          {
            // include: web_or_worker_shell_read.js
            if (ENVIRONMENT_IS_WORKER) {
              readBinary = url => {
                var xhr = new XMLHttpRequest;
                xhr.open("GET", url, false);
                xhr.responseType = "arraybuffer";
                xhr.send(null);
                return new Uint8Array(/** @type{!ArrayBuffer} */ (xhr.response));
              };
            }
            readAsync = url => {
              // Fetch has some additional restrictions over XHR, like it can't be used on a file:// url.
              // See https://github.com/github/fetch/pull/92#issuecomment-140665932
              // Cordova or Electron apps are typically loaded from a file:// url.
              // So use XHR on webview if URL is a file URL.
              if (isFileURI(url)) {
                return new Promise((reject, resolve) => {
                  var xhr = new XMLHttpRequest;
                  xhr.open("GET", url, true);
                  xhr.responseType = "arraybuffer";
                  xhr.onload = () => {
                    if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
                      // file URLs can return 0
                      resolve(xhr.response);
                    }
                    reject(xhr.status);
                  };
                  xhr.onerror = reject;
                  xhr.send(null);
                });
              }
              return fetch(url, {
                credentials: "same-origin"
              }).then(response => {
                if (response.ok) {
                  return response.arrayBuffer();
                }
                return Promise.reject(new Error(response.status + " : " + response.url));
              });
            };
          }
        } else // end include: web_or_worker_shell_read.js
        {
          throw new Error("environment detection error");
        }
        var out = Module["print"] || console.log.bind(console);
        var err = Module["printErr"] || console.error.bind(console);
        // Merge back in the overrides
        Object.assign(Module, moduleOverrides);
        // Free the object hierarchy contained in the overrides, this lets the GC
        // reclaim data used.
        moduleOverrides = null;
        checkIncomingModuleAPI();
        // Emit code to handle expected values on the Module object. This applies Module.x
        // to the proper local x. This has two benefits: first, we only emit it if it is
        // expected to arrive, and second, by using a local everywhere else that can be
        // minified.
        if (Module["arguments"]) arguments_ = Module["arguments"];
        legacyModuleProp("arguments", "arguments_");
        if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
        legacyModuleProp("thisProgram", "thisProgram");
        if (Module["quit"]) quit_ = Module["quit"];
        legacyModuleProp("quit", "quit_");
        // perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message
        // Assertions on removed incoming Module JS APIs.
        assert(typeof Module["memoryInitializerPrefixURL"] == "undefined", "Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead");
        assert(typeof Module["pthreadMainPrefixURL"] == "undefined", "Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead");
        assert(typeof Module["cdInitializerPrefixURL"] == "undefined", "Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead");
        assert(typeof Module["filePackagePrefixURL"] == "undefined", "Module.filePackagePrefixURL option was removed, use Module.locateFile instead");
        assert(typeof Module["read"] == "undefined", "Module.read option was removed");
        assert(typeof Module["readAsync"] == "undefined", "Module.readAsync option was removed (modify readAsync in JS)");
        assert(typeof Module["readBinary"] == "undefined", "Module.readBinary option was removed (modify readBinary in JS)");
        assert(typeof Module["setWindowTitle"] == "undefined", "Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)");
        assert(typeof Module["TOTAL_MEMORY"] == "undefined", "Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY");
        legacyModuleProp("asm", "wasmExports");
        legacyModuleProp("readAsync", "readAsync");
        legacyModuleProp("readBinary", "readBinary");
        legacyModuleProp("setWindowTitle", "setWindowTitle");
        var IDBFS = "IDBFS is no longer included by default; build with -lidbfs.js";
        var PROXYFS = "PROXYFS is no longer included by default; build with -lproxyfs.js";
        var WORKERFS = "WORKERFS is no longer included by default; build with -lworkerfs.js";
        var FETCHFS = "FETCHFS is no longer included by default; build with -lfetchfs.js";
        var ICASEFS = "ICASEFS is no longer included by default; build with -licasefs.js";
        var JSFILEFS = "JSFILEFS is no longer included by default; build with -ljsfilefs.js";
        var OPFS = "OPFS is no longer included by default; build with -lopfs.js";
        var NODEFS = "NODEFS is no longer included by default; build with -lnodefs.js";
        assert(!ENVIRONMENT_IS_SHELL, "shell environment detected but not enabled at build time.  Add `shell` to `-sENVIRONMENT` to enable.");
        // end include: shell.js
        // include: preamble.js
        // === Preamble library stuff ===
        // Documentation for the public APIs defined in this file must be updated in:
        //    site/source/docs/api_reference/preamble.js.rst
        // A prebuilt local version of the documentation is available at:
        //    site/build/text/docs/api_reference/preamble.js.txt
        // You can also build docs locally as HTML or other formats in site/
        // An online HTML version (which may be of a different version of Emscripten)
        //    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html
        var dynamicLibraries = Module["dynamicLibraries"] || [];
        var wasmBinary;
        if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
        legacyModuleProp("wasmBinary", "wasmBinary");
        if (typeof WebAssembly != "object") {
          err("no native wasm support detected");
        }
        // include: runtime_safe_heap.js
        /** @param {number|boolean=} isFloat */ function getSafeHeapType(bytes, isFloat) {
          switch (bytes) {
           case 1:
            return "i8";

           case 2:
            return "i16";

           case 4:
            return isFloat ? "float" : "i32";

           case 8:
            return isFloat ? "double" : "i64";

           default:
            abort(`getSafeHeapType() invalid bytes=${bytes}`);
          }
        }
        /** @param {number|boolean=} isFloat */ function SAFE_HEAP_STORE(dest, value, bytes, isFloat) {
          if (dest <= 0) abort(`segmentation fault storing ${bytes} bytes to address ${dest}`);
          if (dest % bytes !== 0) abort(`alignment error storing to address ${dest}, which was expected to be aligned to a multiple of ${bytes}`);
          if (runtimeInitialized) {
            var brk = _sbrk(0);
            if (dest + bytes > brk) abort(`segmentation fault, exceeded the top of the available dynamic heap when storing ${bytes} bytes to address ${dest}. DYNAMICTOP=${brk}`);
            if (brk < _emscripten_stack_get_base()) abort(`brk >= _emscripten_stack_get_base() (brk=${brk}, _emscripten_stack_get_base()=${_emscripten_stack_get_base()})`);
            // sbrk-managed memory must be above the stack
            if (brk > wasmMemory.buffer.byteLength) abort(`brk <= wasmMemory.buffer.byteLength (brk=${brk}, wasmMemory.buffer.byteLength=${wasmMemory.buffer.byteLength})`);
          }
          setValue_safe(dest, value, getSafeHeapType(bytes, isFloat));
          return value;
        }
        function SAFE_HEAP_STORE_D(dest, value, bytes) {
          return SAFE_HEAP_STORE(dest, value, bytes, true);
        }
        /** @param {number|boolean=} isFloat */ function SAFE_HEAP_LOAD(dest, bytes, unsigned, isFloat) {
          if (dest <= 0) abort(`segmentation fault loading ${bytes} bytes from address ${dest}`);
          if (dest % bytes !== 0) abort(`alignment error loading from address ${dest}, which was expected to be aligned to a multiple of ${bytes}`);
          if (runtimeInitialized) {
            var brk = _sbrk(0);
            if (dest + bytes > brk) abort(`segmentation fault, exceeded the top of the available dynamic heap when loading ${bytes} bytes from address ${dest}. DYNAMICTOP=${brk}`);
            if (brk < _emscripten_stack_get_base()) abort(`brk >= _emscripten_stack_get_base() (brk=${brk}, _emscripten_stack_get_base()=${_emscripten_stack_get_base()})`);
            // sbrk-managed memory must be above the stack
            if (brk > wasmMemory.buffer.byteLength) abort(`brk <= wasmMemory.buffer.byteLength (brk=${brk}, wasmMemory.buffer.byteLength=${wasmMemory.buffer.byteLength})`);
          }
          var type = getSafeHeapType(bytes, isFloat);
          var ret = getValue_safe(dest, type);
          if (unsigned) ret = unSign(ret, parseInt(type.substr(1), 10));
          return ret;
        }
        function SAFE_HEAP_LOAD_D(dest, bytes, unsigned) {
          return SAFE_HEAP_LOAD(dest, bytes, unsigned, true);
        }
        function SAFE_FT_MASK(value, mask) {
          var ret = value & mask;
          if (ret !== value) {
            abort(`Function table mask error: function pointer is ${value} which is masked by ${mask}, the likely cause of this is that the function pointer is being called by the wrong type.`);
          }
          return ret;
        }
        function segfault() {
          abort("segmentation fault");
        }
        function alignfault() {
          abort("alignment fault");
        }
        // end include: runtime_safe_heap.js
        // Wasm globals
        var wasmMemory;
        //========================================
        // Runtime essentials
        //========================================
        // whether we are quitting the application. no code should run after this.
        // set in exit() and abort()
        var ABORT = false;
        // set by exit() and abort().  Passed to 'onExit' handler.
        // NOTE: This is also used as the process return code code in shell environments
        // but only when noExitRuntime is false.
        var EXITSTATUS;
        // In STRICT mode, we only define assert() when ASSERTIONS is set.  i.e. we
        // don't define it at all in release modes.  This matches the behaviour of
        // MINIMAL_RUNTIME.
        // TODO(sbc): Make this the default even without STRICT enabled.
        /** @type {function(*, string=)} */ function assert(condition, text) {
          if (!condition) {
            abort("Assertion failed" + (text ? ": " + text : ""));
          }
        }
        // We used to include malloc/free by default in the past. Show a helpful error in
        // builds with assertions.
        // Memory management
        var HEAP, /** @type {!Int8Array} */ HEAP8, /** @type {!Uint8Array} */ HEAPU8, /** @type {!Int16Array} */ HEAP16, /** @type {!Uint16Array} */ HEAPU16, /** @type {!Int32Array} */ HEAP32, /** @type {!Uint32Array} */ HEAPU32, /** @type {!Float32Array} */ HEAPF32, /** @type {!Float64Array} */ HEAPF64;
        var HEAP_DATA_VIEW;
        // include: runtime_shared.js
        function updateMemoryViews() {
          var b = wasmMemory.buffer;
          Module["HEAP_DATA_VIEW"] = HEAP_DATA_VIEW = new DataView(b);
          Module["HEAP8"] = HEAP8 = new Int8Array(b);
          Module["HEAP16"] = HEAP16 = new Int16Array(b);
          Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
          Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
          Module["HEAP32"] = HEAP32 = new Int32Array(b);
          Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
          Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
          Module["HEAPF64"] = HEAPF64 = new Float64Array(b);
        }
        // end include: runtime_shared.js
        assert(!Module["STACK_SIZE"], "STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time");
        assert(typeof Int32Array != "undefined" && typeof Float64Array !== "undefined" && Int32Array.prototype.subarray != undefined && Int32Array.prototype.set != undefined, "JS engine does not provide full typed array support");
        // In non-standalone/normal mode, we create the memory here.
        // include: runtime_init_memory.js
        // Create the wasm memory. (Note: this only applies if IMPORTED_MEMORY is defined)
        // check for full engine support (use string 'subarray' to avoid closure compiler confusion)
        if (Module["wasmMemory"]) {
          wasmMemory = Module["wasmMemory"];
        } else {
          var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 33554432;
          legacyModuleProp("INITIAL_MEMORY", "INITIAL_MEMORY");
          assert(INITIAL_MEMORY >= 65536, "INITIAL_MEMORY should be larger than STACK_SIZE, was " + INITIAL_MEMORY + "! (STACK_SIZE=" + 65536 + ")");
          wasmMemory = new WebAssembly.Memory({
            "initial": INITIAL_MEMORY / 65536,
            // In theory we should not need to emit the maximum if we want "unlimited"
            // or 4GB of memory, but VMs error on that atm, see
            // https://github.com/emscripten-core/emscripten/issues/14130
            // And in the pthreads case we definitely need to emit a maximum. So
            // always emit one.
            "maximum": 2147483648 / 65536
          });
        }
        updateMemoryViews();
        // end include: runtime_init_memory.js
        // include: runtime_stack_check.js
        // Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
        function writeStackCookie() {
          var max = _emscripten_stack_get_end();
          assert((max & 3) == 0);
          // If the stack ends at address zero we write our cookies 4 bytes into the
          // stack.  This prevents interference with SAFE_HEAP and ASAN which also
          // monitor writes to address zero.
          if (max == 0) {
            max += 4;
          }
          // The stack grow downwards towards _emscripten_stack_get_end.
          // We write cookies to the final two words in the stack and detect if they are
          // ever overwritten.
          LE_HEAP_STORE_U32(((max) >> 2) * 4, 34821223);
          LE_HEAP_STORE_U32((((max) + (4)) >> 2) * 4, 2310721022);
        }
        function checkStackCookie() {
          if (ABORT) return;
          var max = _emscripten_stack_get_end();
          // See writeStackCookie().
          if (max == 0) {
            max += 4;
          }
          var cookie1 = LE_HEAP_LOAD_U32(((max) >> 2) * 4);
          var cookie2 = LE_HEAP_LOAD_U32((((max) + (4)) >> 2) * 4);
          if (cookie1 != 34821223 || cookie2 != 2310721022) {
            abort(`Stack overflow! Stack cookie has been overwritten at ${ptrToString(max)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${ptrToString(cookie2)} ${ptrToString(cookie1)}`);
          }
        }
        // end include: runtime_stack_check.js
        // include: runtime_assertions.js
        // Endianness check
        // end include: runtime_assertions.js
        var __ATPRERUN__ = [];
        // functions called before the runtime is initialized
        var __ATINIT__ = [];
        // functions called during startup
        var __ATMAIN__ = [];
        // functions called when main() is to be run
        var __ATEXIT__ = [];
        // functions called during shutdown
        var __ATPOSTRUN__ = [];
        // functions called after the main() is called
        var __RELOC_FUNCS__ = [];
        var runtimeInitialized = false;
        function preRun() {
          if (Module["preRun"]) {
            if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
            while (Module["preRun"].length) {
              addOnPreRun(Module["preRun"].shift());
            }
          }
          callRuntimeCallbacks(__ATPRERUN__);
        }
        function initRuntime() {
          assert(!runtimeInitialized);
          runtimeInitialized = true;
          checkStackCookie();
          callRuntimeCallbacks(__RELOC_FUNCS__);
          callRuntimeCallbacks(__ATINIT__);
        }
        function preMain() {
          checkStackCookie();
          callRuntimeCallbacks(__ATMAIN__);
        }
        function postRun() {
          checkStackCookie();
          if (Module["postRun"]) {
            if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
            while (Module["postRun"].length) {
              addOnPostRun(Module["postRun"].shift());
            }
          }
          callRuntimeCallbacks(__ATPOSTRUN__);
        }
        function addOnPreRun(cb) {
          __ATPRERUN__.unshift(cb);
        }
        function addOnInit(cb) {
          __ATINIT__.unshift(cb);
        }
        function addOnPreMain(cb) {
          __ATMAIN__.unshift(cb);
        }
        function addOnExit(cb) {}
        function addOnPostRun(cb) {
          __ATPOSTRUN__.unshift(cb);
        }
        // include: runtime_math.js
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc
        assert(Math.imul, "This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
        assert(Math.fround, "This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
        assert(Math.clz32, "This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
        assert(Math.trunc, "This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
        // end include: runtime_math.js
        // A counter of dependencies for calling run(). If we need to
        // do asynchronous work before running, increment this and
        // decrement it. Incrementing must happen in a place like
        // Module.preRun (used by emcc to add file preloading).
        // Note that you can add dependencies in preRun, even though
        // it happens right before run - run will be postponed until
        // the dependencies are met.
        var runDependencies = 0;
        var runDependencyWatcher = null;
        var dependenciesFulfilled = null;
        // overridden to take different actions when all run dependencies are fulfilled
        var runDependencyTracking = {};
        function getUniqueRunDependency(id) {
          var orig = id;
          while (1) {
            if (!runDependencyTracking[id]) return id;
            id = orig + Math.random();
          }
        }
        function addRunDependency(id) {
          runDependencies++;
          Module["monitorRunDependencies"]?.(runDependencies);
          if (id) {
            assert(!runDependencyTracking[id]);
            runDependencyTracking[id] = 1;
            if (runDependencyWatcher === null && typeof setInterval != "undefined") {
              // Check for missing dependencies every few seconds
              runDependencyWatcher = setInterval(() => {
                if (ABORT) {
                  clearInterval(runDependencyWatcher);
                  runDependencyWatcher = null;
                  return;
                }
                var shown = false;
                for (var dep in runDependencyTracking) {
                  if (!shown) {
                    shown = true;
                    err("still waiting on run dependencies:");
                  }
                  err(`dependency: ${dep}`);
                }
                if (shown) {
                  err("(end of list)");
                }
              }, 1e4);
            }
          } else {
            err("warning: run dependency added without ID");
          }
        }
        function removeRunDependency(id) {
          runDependencies--;
          Module["monitorRunDependencies"]?.(runDependencies);
          if (id) {
            assert(runDependencyTracking[id]);
            delete runDependencyTracking[id];
          } else {
            err("warning: run dependency removed without ID");
          }
          if (runDependencies == 0) {
            if (runDependencyWatcher !== null) {
              clearInterval(runDependencyWatcher);
              runDependencyWatcher = null;
            }
            if (dependenciesFulfilled) {
              var callback = dependenciesFulfilled;
              dependenciesFulfilled = null;
              callback();
            }
          }
        }
        /** @param {string|number=} what */ function abort(what) {
          Module["onAbort"]?.(what);
          what = "Aborted(" + what + ")";
          // TODO(sbc): Should we remove printing and leave it up to whoever
          // catches the exception?
          err(what);
          ABORT = true;
          EXITSTATUS = 1;
          // Use a wasm runtime error, because a JS error might be seen as a foreign
          // exception, which means we'd run destructors on it. We need the error to
          // simply make the program stop.
          // FIXME This approach does not work in Wasm EH because it currently does not assume
          // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
          // a trap or not based on a hidden field within the object. So at the moment
          // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
          // allows this in the wasm spec.
          // Suppress closure compiler warning here. Closure compiler's builtin extern
          // definition for WebAssembly.RuntimeError claims it takes no arguments even
          // though it can.
          // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure gets fixed.
          /** @suppress {checkTypes} */ var e = new WebAssembly.RuntimeError(what);
          // Throw the error whether or not MODULARIZE is set because abort is used
          // in code paths apart from instantiation where an exception is expected
          // to be thrown when abort is called.
          throw e;
        }
        // include: memoryprofiler.js
        // end include: memoryprofiler.js
        // show errors on likely calls to FS when it was not included
        var FS = {
          error() {
            abort("Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with -sFORCE_FILESYSTEM");
          },
          init() {
            FS.error();
          },
          createDataFile() {
            FS.error();
          },
          createPreloadedFile() {
            FS.error();
          },
          createLazyFile() {
            FS.error();
          },
          open() {
            FS.error();
          },
          mkdev() {
            FS.error();
          },
          registerDevice() {
            FS.error();
          },
          analyzePath() {
            FS.error();
          },
          ErrnoError() {
            FS.error();
          }
        };
        Module["FS_createDataFile"] = FS.createDataFile;
        Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
        // include: URIUtils.js
        // Prefix of data URIs emitted by SINGLE_FILE and related options.
        var dataURIPrefix = "data:application/octet-stream;base64,";
        /**
 * Indicates whether filename is a base64 data URI.
 * @noinline
 */ var isDataURI = filename => filename.startsWith(dataURIPrefix);
        /**
 * Indicates whether filename is delivered via file protocol (as opposed to http/https)
 * @noinline
 */ var isFileURI = filename => filename.startsWith("file://");
        // end include: URIUtils.js
        function createExportWrapper(name, nargs) {
          return (...args) => {
            assert(runtimeInitialized, `native function \`${name}\` called before runtime initialization`);
            var f = wasmExports[name];
            assert(f, `exported native function \`${name}\` not found`);
            // Only assert for too many arguments. Too few can be valid since the missing arguments will be zero filled.
            assert(args.length <= nargs, `native function \`${name}\` called with ${args.length} args but expects ${nargs}`);
            return f(...args);
          };
        }
        // include: runtime_exceptions.js
        // end include: runtime_exceptions.js
        function findWasmBinary() {
          var f = "tree-sitter.wasm";
          if (!isDataURI(f)) {
            return locateFile(f);
          }
          return f;
        }
        var wasmBinaryFile;
        function getBinarySync(file) {
          if (file == wasmBinaryFile && wasmBinary) {
            return new Uint8Array(wasmBinary);
          }
          if (readBinary) {
            return readBinary(file);
          }
          throw "both async and sync fetching of the wasm failed";
        }
        function getBinaryPromise(binaryFile) {
          // If we don't have the binary yet, load it asynchronously using readAsync.
          if (!wasmBinary) {
            // Fetch the binary using readAsync
            return readAsync(binaryFile).then(response => new Uint8Array(/** @type{!ArrayBuffer} */ (response)), // Fall back to getBinarySync if readAsync fails
            () => getBinarySync(binaryFile));
          }
          // Otherwise, getBinarySync should be able to get it synchronously
          return Promise.resolve().then(() => getBinarySync(binaryFile));
        }
        function instantiateArrayBuffer(binaryFile, imports, receiver) {
          return getBinaryPromise(binaryFile).then(binary => WebAssembly.instantiate(binary, imports)).then(receiver, reason => {
            err(`failed to asynchronously prepare wasm: ${reason}`);
            // Warn on some common problems.
            if (isFileURI(wasmBinaryFile)) {
              err(`warning: Loading from a file URI (${wasmBinaryFile}) is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing`);
            }
            abort(reason);
          });
        }
        function instantiateAsync(binary, binaryFile, imports, callback) {
          if (!binary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(binaryFile) && // Don't use streaming for file:// delivered objects in a webview, fetch them synchronously.
          !isFileURI(binaryFile) && // Avoid instantiateStreaming() on Node.js environment for now, as while
          // Node.js v18.1.0 implements it, it does not have a full fetch()
          // implementation yet.
          // Reference:
          //   https://github.com/emscripten-core/emscripten/pull/16917
          !ENVIRONMENT_IS_NODE && typeof fetch == "function") {
            return fetch(binaryFile, {
              credentials: "same-origin"
            }).then(response => {
              // Suppress closure warning here since the upstream definition for
              // instantiateStreaming only allows Promise<Repsponse> rather than
              // an actual Response.
              // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure is fixed.
              /** @suppress {checkTypes} */ var result = WebAssembly.instantiateStreaming(response, imports);
              return result.then(callback, function(reason) {
                // We expect the most common failure cause to be a bad MIME type for the binary,
                // in which case falling back to ArrayBuffer instantiation should work.
                err(`wasm streaming compile failed: ${reason}`);
                err("falling back to ArrayBuffer instantiation");
                return instantiateArrayBuffer(binaryFile, imports, callback);
              });
            });
          }
          return instantiateArrayBuffer(binaryFile, imports, callback);
        }
        function getWasmImports() {
          // prepare imports
          return {
            "env": wasmImports,
            "wasi_snapshot_preview1": wasmImports,
            "GOT.mem": new Proxy(wasmImports, GOTHandler),
            "GOT.func": new Proxy(wasmImports, GOTHandler)
          };
        }
        // Create the wasm instance.
        // Receives the wasm imports, returns the exports.
        function createWasm() {
          var info = getWasmImports();
          // Load the wasm module and create an instance of using native support in the JS engine.
          // handle a generated wasm instance, receiving its exports and
          // performing other necessary setup
          /** @param {WebAssembly.Module=} module*/ function receiveInstance(instance, module) {
            wasmExports = instance.exports;
            wasmExports = relocateExports(wasmExports, 1024);
            var metadata = getDylinkMetadata(module);
            if (metadata.neededDynlibs) {
              dynamicLibraries = metadata.neededDynlibs.concat(dynamicLibraries);
            }
            mergeLibSymbols(wasmExports, "main");
            LDSO.init();
            loadDylibs();
            addOnInit(wasmExports["__wasm_call_ctors"]);
            __RELOC_FUNCS__.push(wasmExports["__wasm_apply_data_relocs"]);
            removeRunDependency("wasm-instantiate");
            return wasmExports;
          }
          // wait for the pthread pool (if any)
          addRunDependency("wasm-instantiate");
          // Prefer streaming instantiation if available.
          // Async compilation can be confusing when an error on the page overwrites Module
          // (for example, if the order of elements is wrong, and the one defining Module is
          // later), so we save Module and check it later.
          var trueModule = Module;
          function receiveInstantiationResult(result) {
            // 'result' is a ResultObject object which has both the module and instance.
            // receiveInstance() will swap in the exports (to Module.asm) so they can be called
            assert(Module === trueModule, "the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?");
            trueModule = null;
            receiveInstance(result["instance"], result["module"]);
          }
          // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
          // to manually instantiate the Wasm module themselves. This allows pages to
          // run the instantiation parallel to any other async startup actions they are
          // performing.
          // Also pthreads and wasm workers initialize the wasm instance through this
          // path.
          if (Module["instantiateWasm"]) {
            try {
              return Module["instantiateWasm"](info, receiveInstance);
            } catch (e) {
              err(`Module.instantiateWasm callback failed with error: ${e}`);
              return false;
            }
          }
          if (!wasmBinaryFile) wasmBinaryFile = findWasmBinary();
          instantiateAsync(wasmBinary, wasmBinaryFile, info, receiveInstantiationResult);
          return {};
        }
        // Globals used by JS i64 conversions (see makeSetValue)
        var tempDouble;
        var tempI64;
        // include: runtime_debug.js
        function legacyModuleProp(prop, newName, incoming = true) {
          if (!Object.getOwnPropertyDescriptor(Module, prop)) {
            Object.defineProperty(Module, prop, {
              configurable: true,
              get() {
                let extra = incoming ? " (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)" : "";
                abort(`\`Module.${prop}\` has been replaced by \`${newName}\`` + extra);
              }
            });
          }
        }
        function ignoredModuleProp(prop) {
          if (Object.getOwnPropertyDescriptor(Module, prop)) {
            abort(`\`Module.${prop}\` was supplied but \`${prop}\` not included in INCOMING_MODULE_JS_API`);
          }
        }
        // forcing the filesystem exports a few things by default
        function isExportedByForceFilesystem(name) {
          return name === "FS_createPath" || name === "FS_createDataFile" || name === "FS_createPreloadedFile" || name === "FS_unlink" || name === "addRunDependency" || // The old FS has some functionality that WasmFS lacks.
          name === "FS_createLazyFile" || name === "FS_createDevice" || name === "removeRunDependency";
        }
        function missingGlobal(sym, msg) {
          if (typeof globalThis != "undefined") {
            Object.defineProperty(globalThis, sym, {
              configurable: true,
              get() {
                warnOnce(`\`${sym}\` is not longer defined by emscripten. ${msg}`);
                return undefined;
              }
            });
          }
        }
        missingGlobal("buffer", "Please use HEAP8.buffer or wasmMemory.buffer");
        missingGlobal("asm", "Please use wasmExports instead");
        function missingLibrarySymbol(sym) {
          if (typeof globalThis != "undefined" && !Object.getOwnPropertyDescriptor(globalThis, sym)) {
            Object.defineProperty(globalThis, sym, {
              configurable: true,
              get() {
                // Can't `abort()` here because it would break code that does runtime
                // checks.  e.g. `if (typeof SDL === 'undefined')`.
                var msg = `\`${sym}\` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line`;
                // DEFAULT_LIBRARY_FUNCS_TO_INCLUDE requires the name as it appears in
                // library.js, which means $name for a JS name with no prefix, or name
                // for a JS name like _name.
                var librarySymbol = sym;
                if (!librarySymbol.startsWith("_")) {
                  librarySymbol = "$" + sym;
                }
                msg += ` (e.g. -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE='${librarySymbol}')`;
                if (isExportedByForceFilesystem(sym)) {
                  msg += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
                }
                warnOnce(msg);
                return undefined;
              }
            });
          }
          // Any symbol that is not included from the JS library is also (by definition)
          // not exported on the Module object.
          unexportedRuntimeSymbol(sym);
        }
        function unexportedRuntimeSymbol(sym) {
          if (!Object.getOwnPropertyDescriptor(Module, sym)) {
            Object.defineProperty(Module, sym, {
              configurable: true,
              get() {
                var msg = `'${sym}' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)`;
                if (isExportedByForceFilesystem(sym)) {
                  msg += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
                }
                abort(msg);
              }
            });
          }
        }
        // Used by XXXXX_DEBUG settings to output debug messages.
        function dbg(...args) {
          // TODO(sbc): Make this configurable somehow.  Its not always convenient for
          // logging to show up as warnings.
          console.warn(...args);
        }
        // end include: runtime_debug.js
        // === Body ===
        var ASM_CONSTS = {};
        // end include: preamble.js
        /** @constructor */ function ExitStatus(status) {
          this.name = "ExitStatus";
          this.message = `Program terminated with exit(${status})`;
          this.status = status;
        }
        var GOT = {};
        var currentModuleWeakSymbols = new Set([]);
        var GOTHandler = {
          get(obj, symName) {
            var rtn = GOT[symName];
            if (!rtn) {
              rtn = GOT[symName] = new WebAssembly.Global({
                "value": "i32",
                "mutable": true
              });
            }
            if (!currentModuleWeakSymbols.has(symName)) {
              // Any non-weak reference to a symbol marks it as `required`, which
              // enabled `reportUndefinedSymbols` to report undefeind symbol errors
              // correctly.
              rtn.required = true;
            }
            return rtn;
          }
        };
        var LE_HEAP_LOAD_F32 = byteOffset => HEAP_DATA_VIEW.getFloat32(byteOffset, true);
        var LE_HEAP_LOAD_F64 = byteOffset => HEAP_DATA_VIEW.getFloat64(byteOffset, true);
        var LE_HEAP_LOAD_I16 = byteOffset => HEAP_DATA_VIEW.getInt16(byteOffset, true);
        var LE_HEAP_LOAD_I32 = byteOffset => HEAP_DATA_VIEW.getInt32(byteOffset, true);
        var LE_HEAP_LOAD_U16 = byteOffset => HEAP_DATA_VIEW.getUint16(byteOffset, true);
        var LE_HEAP_LOAD_U32 = byteOffset => HEAP_DATA_VIEW.getUint32(byteOffset, true);
        var LE_HEAP_STORE_F32 = (byteOffset, value) => HEAP_DATA_VIEW.setFloat32(byteOffset, value, true);
        var LE_HEAP_STORE_F64 = (byteOffset, value) => HEAP_DATA_VIEW.setFloat64(byteOffset, value, true);
        var LE_HEAP_STORE_I16 = (byteOffset, value) => HEAP_DATA_VIEW.setInt16(byteOffset, value, true);
        var LE_HEAP_STORE_I32 = (byteOffset, value) => HEAP_DATA_VIEW.setInt32(byteOffset, value, true);
        var LE_HEAP_STORE_U16 = (byteOffset, value) => HEAP_DATA_VIEW.setUint16(byteOffset, value, true);
        var LE_HEAP_STORE_U32 = (byteOffset, value) => HEAP_DATA_VIEW.setUint32(byteOffset, value, true);
        var callRuntimeCallbacks = callbacks => {
          while (callbacks.length > 0) {
            // Pass the module as the first argument.
            callbacks.shift()(Module);
          }
        };
        var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder : undefined;
        /**
     * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
     * array that contains uint8 values, returns a copy of that string as a
     * Javascript String object.
     * heapOrArray is either a regular array, or a JavaScript typed array view.
     * @param {number} idx
     * @param {number=} maxBytesToRead
     * @return {string}
     */ var UTF8ArrayToString = (heapOrArray, idx, maxBytesToRead) => {
          var endIdx = idx + maxBytesToRead;
          var endPtr = idx;
          // TextDecoder needs to know the byte length in advance, it doesn't stop on
          // null terminator by itself.  Also, use the length info to avoid running tiny
          // strings through TextDecoder, since .subarray() allocates garbage.
          // (As a tiny code save trick, compare endPtr against endIdx using a negation,
          // so that undefined means Infinity)
          while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
          if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
            return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
          }
          var str = "";
          // If building with TextDecoder, we have already computed the string length
          // above, so test loop end condition against that
          while (idx < endPtr) {
            // For UTF8 byte structure, see:
            // http://en.wikipedia.org/wiki/UTF-8#Description
            // https://www.ietf.org/rfc/rfc2279.txt
            // https://tools.ietf.org/html/rfc3629
            var u0 = heapOrArray[idx++];
            if (!(u0 & 128)) {
              str += String.fromCharCode(u0);
              continue;
            }
            var u1 = heapOrArray[idx++] & 63;
            if ((u0 & 224) == 192) {
              str += String.fromCharCode(((u0 & 31) << 6) | u1);
              continue;
            }
            var u2 = heapOrArray[idx++] & 63;
            if ((u0 & 240) == 224) {
              u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
            } else {
              if ((u0 & 248) != 240) warnOnce("Invalid UTF-8 leading byte " + ptrToString(u0) + " encountered when deserializing a UTF-8 string in wasm memory to a JS string!");
              u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
            }
            if (u0 < 65536) {
              str += String.fromCharCode(u0);
            } else {
              var ch = u0 - 65536;
              str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
            }
          }
          return str;
        };
        var getDylinkMetadata = binary => {
          var offset = 0;
          var end = 0;
          function getU8() {
            return binary[offset++];
          }
          function getLEB() {
            var ret = 0;
            var mul = 1;
            while (1) {
              var byte = binary[offset++];
              ret += ((byte & 127) * mul);
              mul *= 128;
              if (!(byte & 128)) break;
            }
            return ret;
          }
          function getString() {
            var len = getLEB();
            offset += len;
            return UTF8ArrayToString(binary, offset - len, len);
          }
          /** @param {string=} message */ function failIf(condition, message) {
            if (condition) throw new Error(message);
          }
          var name = "dylink.0";
          if (binary instanceof WebAssembly.Module) {
            var dylinkSection = WebAssembly.Module.customSections(binary, name);
            if (dylinkSection.length === 0) {
              name = "dylink";
              dylinkSection = WebAssembly.Module.customSections(binary, name);
            }
            failIf(dylinkSection.length === 0, "need dylink section");
            binary = new Uint8Array(dylinkSection[0]);
            end = binary.length;
          } else {
            var int32View = new Uint32Array(new Uint8Array(binary.subarray(0, 24)).buffer);
            var magicNumberFound = int32View[0] == 1836278016 || int32View[0] == 6386541;
            failIf(!magicNumberFound, "need to see wasm magic number");
            // \0asm
            // we should see the dylink custom section right after the magic number and wasm version
            failIf(binary[8] !== 0, "need the dylink section to be first");
            offset = 9;
            var section_size = getLEB();
            //section size
            end = offset + section_size;
            name = getString();
          }
          var customSection = {
            neededDynlibs: [],
            tlsExports: new Set,
            weakImports: new Set
          };
          if (name == "dylink") {
            customSection.memorySize = getLEB();
            customSection.memoryAlign = getLEB();
            customSection.tableSize = getLEB();
            customSection.tableAlign = getLEB();
            // shared libraries this module needs. We need to load them first, so that
            // current module could resolve its imports. (see tools/shared.py
            // WebAssembly.make_shared_library() for "dylink" section extension format)
            var neededDynlibsCount = getLEB();
            for (var i = 0; i < neededDynlibsCount; ++i) {
              var libname = getString();
              customSection.neededDynlibs.push(libname);
            }
          } else {
            failIf(name !== "dylink.0");
            var WASM_DYLINK_MEM_INFO = 1;
            var WASM_DYLINK_NEEDED = 2;
            var WASM_DYLINK_EXPORT_INFO = 3;
            var WASM_DYLINK_IMPORT_INFO = 4;
            var WASM_SYMBOL_TLS = 256;
            var WASM_SYMBOL_BINDING_MASK = 3;
            var WASM_SYMBOL_BINDING_WEAK = 1;
            while (offset < end) {
              var subsectionType = getU8();
              var subsectionSize = getLEB();
              if (subsectionType === WASM_DYLINK_MEM_INFO) {
                customSection.memorySize = getLEB();
                customSection.memoryAlign = getLEB();
                customSection.tableSize = getLEB();
                customSection.tableAlign = getLEB();
              } else if (subsectionType === WASM_DYLINK_NEEDED) {
                var neededDynlibsCount = getLEB();
                for (var i = 0; i < neededDynlibsCount; ++i) {
                  libname = getString();
                  customSection.neededDynlibs.push(libname);
                }
              } else if (subsectionType === WASM_DYLINK_EXPORT_INFO) {
                var count = getLEB();
                while (count--) {
                  var symname = getString();
                  var flags = getLEB();
                  if (flags & WASM_SYMBOL_TLS) {
                    customSection.tlsExports.add(symname);
                  }
                }
              } else if (subsectionType === WASM_DYLINK_IMPORT_INFO) {
                var count = getLEB();
                while (count--) {
                  var modname = getString();
                  var symname = getString();
                  var flags = getLEB();
                  if ((flags & WASM_SYMBOL_BINDING_MASK) == WASM_SYMBOL_BINDING_WEAK) {
                    customSection.weakImports.add(symname);
                  }
                }
              } else {
                err(`unknown dylink.0 subsection: ${subsectionType}`);
                // unknown subsection
                offset += subsectionSize;
              }
            }
          }
          var tableAlign = Math.pow(2, customSection.tableAlign);
          assert(tableAlign === 1, `invalid tableAlign ${tableAlign}`);
          assert(offset == end);
          return customSection;
        };
        /**
     * @param {number} ptr
     * @param {string} type
     */ function getValue(ptr, type = "i8") {
          if (type.endsWith("*")) type = "*";
          switch (type) {
           case "i1":
            return SAFE_HEAP_LOAD(ptr, 1, 0);

           case "i8":
            return SAFE_HEAP_LOAD(ptr, 1, 0);

           case "i16":
            return LE_HEAP_LOAD_I16(((ptr) >> 1) * 2);

           case "i32":
            return LE_HEAP_LOAD_I32(((ptr) >> 2) * 4);

           case "i64":
            abort("to do getValue(i64) use WASM_BIGINT");

           case "float":
            return LE_HEAP_LOAD_F32(((ptr) >> 2) * 4);

           case "double":
            return LE_HEAP_LOAD_F64(((ptr) >> 3) * 8);

           case "*":
            return LE_HEAP_LOAD_U32(((ptr) >> 2) * 4);

           default:
            abort(`invalid type for getValue: ${type}`);
          }
        }
        function getValue_safe(ptr, type = "i8") {
          if (type.endsWith("*")) type = "*";
          switch (type) {
           case "i1":
            return HEAP8[ptr];

           case "i8":
            return HEAP8[ptr];

           case "i16":
            return LE_HEAP_LOAD_I16(((ptr) >> 1) * 2);

           case "i32":
            return LE_HEAP_LOAD_I32(((ptr) >> 2) * 4);

           case "i64":
            abort("to do getValue(i64) use WASM_BIGINT");

           case "float":
            return LE_HEAP_LOAD_F32(((ptr) >> 2) * 4);

           case "double":
            return LE_HEAP_LOAD_F64(((ptr) >> 3) * 8);

           case "*":
            return LE_HEAP_LOAD_U32(((ptr) >> 2) * 4);

           default:
            abort(`invalid type for getValue: ${type}`);
          }
        }
        var newDSO = (name, handle, syms) => {
          var dso = {
            refcount: Infinity,
            name: name,
            exports: syms,
            global: true
          };
          LDSO.loadedLibsByName[name] = dso;
          if (handle != undefined) {
            LDSO.loadedLibsByHandle[handle] = dso;
          }
          return dso;
        };
        var LDSO = {
          loadedLibsByName: {},
          loadedLibsByHandle: {},
          init() {
            // This function needs to run after the initial wasmImports object
            // as been created.
            assert(wasmImports);
            newDSO("__main__", 0, wasmImports);
          }
        };
        var ___heap_base = 78144;
        var zeroMemory = (address, size) => {
          HEAPU8.fill(0, address, address + size);
          return address;
        };
        var alignMemory = (size, alignment) => {
          assert(alignment, "alignment argument is required");
          return Math.ceil(size / alignment) * alignment;
        };
        var getMemory = size => {
          // After the runtime is initialized, we must only use sbrk() normally.
          if (runtimeInitialized) {
            // Currently we don't support freeing of static data when modules are
            // unloaded via dlclose.  This function is tagged as `noleakcheck` to
            // avoid having this reported as leak.
            return zeroMemory(_malloc(size), size);
          }
          var ret = ___heap_base;
          // Keep __heap_base stack aligned.
          var end = ret + alignMemory(size, 16);
          assert(end <= HEAP8.length, "failure to getMemory - memory growth etc. is not supported there, call malloc/sbrk directly or increase INITIAL_MEMORY");
          ___heap_base = end;
          GOT["__heap_base"].value = end;
          return ret;
        };
        var isInternalSym = symName => [ "__cpp_exception", "__c_longjmp", "__wasm_apply_data_relocs", "__dso_handle", "__tls_size", "__tls_align", "__set_stack_limits", "_emscripten_tls_init", "__wasm_init_tls", "__wasm_call_ctors", "__start_em_asm", "__stop_em_asm", "__start_em_js", "__stop_em_js" ].includes(symName) || symName.startsWith("__em_js__");
        var uleb128Encode = (n, target) => {
          assert(n < 16384);
          if (n < 128) {
            target.push(n);
          } else {
            target.push((n % 128) | 128, n >> 7);
          }
        };
        var sigToWasmTypes = sig => {
          assert(!sig.includes("j"), "i64 not permitted in function signatures when WASM_BIGINT is disabled");
          var typeNames = {
            "i": "i32",
            "j": "i64",
            "f": "f32",
            "d": "f64",
            "e": "externref",
            "p": "i32"
          };
          var type = {
            parameters: [],
            results: sig[0] == "v" ? [] : [ typeNames[sig[0]] ]
          };
          for (var i = 1; i < sig.length; ++i) {
            assert(sig[i] in typeNames, "invalid signature char: " + sig[i]);
            type.parameters.push(typeNames[sig[i]]);
          }
          return type;
        };
        var generateFuncType = (sig, target) => {
          var sigRet = sig.slice(0, 1);
          var sigParam = sig.slice(1);
          var typeCodes = {
            "i": 127,
            // i32
            "p": 127,
            // i32
            "j": 126,
            // i64
            "f": 125,
            // f32
            "d": 124,
            // f64
            "e": 111
          };
          // Parameters, length + signatures
          target.push(96);
          /* form: func */ uleb128Encode(sigParam.length, target);
          for (var i = 0; i < sigParam.length; ++i) {
            assert(sigParam[i] in typeCodes, "invalid signature char: " + sigParam[i]);
            target.push(typeCodes[sigParam[i]]);
          }
          // Return values, length + signatures
          // With no multi-return in MVP, either 0 (void) or 1 (anything else)
          if (sigRet == "v") {
            target.push(0);
          } else {
            target.push(1, typeCodes[sigRet]);
          }
        };
        var convertJsFunctionToWasm = (func, sig) => {
          assert(!sig.includes("j"), "i64 not permitted in function signatures when WASM_BIGINT is disabled");
          // If the type reflection proposal is available, use the new
          // "WebAssembly.Function" constructor.
          // Otherwise, construct a minimal wasm module importing the JS function and
          // re-exporting it.
          if (typeof WebAssembly.Function == "function") {
            return new WebAssembly.Function(sigToWasmTypes(sig), func);
          }
          // The module is static, with the exception of the type section, which is
          // generated based on the signature passed in.
          var typeSectionBody = [ 1 ];
          // count: 1
          generateFuncType(sig, typeSectionBody);
          // Rest of the module is static
          var bytes = [ 0, 97, 115, 109, // magic ("\0asm")
          1, 0, 0, 0, // version: 1
          1 ];
          // Write the overall length of the type section followed by the body
          uleb128Encode(typeSectionBody.length, bytes);
          bytes.push(...typeSectionBody);
          // The rest of the module is static
          bytes.push(2, 7, // import section
          // (import "e" "f" (func 0 (type 0)))
          1, 1, 101, 1, 102, 0, 0, 7, 5, // export section
          // (export "f" (func 0 (type 0)))
          1, 1, 102, 0, 0);
          // We can compile this wasm module synchronously because it is very small.
          // This accepts an import (at "e.f"), that it reroutes to an export (at "f")
          var module = new WebAssembly.Module(new Uint8Array(bytes));
          var instance = new WebAssembly.Instance(module, {
            "e": {
              "f": func
            }
          });
          var wrappedFunc = instance.exports["f"];
          return wrappedFunc;
        };
        var wasmTableMirror = [];
        /** @type {WebAssembly.Table} */ var wasmTable = new WebAssembly.Table({
          "initial": 28,
          "element": "anyfunc"
        });
        var getWasmTableEntry = funcPtr => {
          var func = wasmTableMirror[funcPtr];
          if (!func) {
            if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
            wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
          }
          assert(wasmTable.get(funcPtr) == func, "JavaScript-side Wasm function table mirror is out of date!");
          return func;
        };
        var updateTableMap = (offset, count) => {
          if (functionsInTableMap) {
            for (var i = offset; i < offset + count; i++) {
              var item = getWasmTableEntry(i);
              // Ignore null values.
              if (item) {
                functionsInTableMap.set(item, i);
              }
            }
          }
        };
        var functionsInTableMap;
        var getFunctionAddress = func => {
          // First, create the map if this is the first use.
          if (!functionsInTableMap) {
            functionsInTableMap = new WeakMap;
            updateTableMap(0, wasmTable.length);
          }
          return functionsInTableMap.get(func) || 0;
        };
        var freeTableIndexes = [];
        var getEmptyTableSlot = () => {
          // Reuse a free index if there is one, otherwise grow.
          if (freeTableIndexes.length) {
            return freeTableIndexes.pop();
          }
          // Grow the table
          try {
            wasmTable.grow(1);
          } catch (err) {
            if (!(err instanceof RangeError)) {
              throw err;
            }
            throw "Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.";
          }
          return wasmTable.length - 1;
        };
        var setWasmTableEntry = (idx, func) => {
          wasmTable.set(idx, func);
          // With ABORT_ON_WASM_EXCEPTIONS wasmTable.get is overridden to return wrapped
          // functions so we need to call it here to retrieve the potential wrapper correctly
          // instead of just storing 'func' directly into wasmTableMirror
          wasmTableMirror[idx] = wasmTable.get(idx);
        };
        /** @param {string=} sig */ var addFunction = (func, sig) => {
          assert(typeof func != "undefined");
          // Check if the function is already in the table, to ensure each function
          // gets a unique index.
          var rtn = getFunctionAddress(func);
          if (rtn) {
            return rtn;
          }
          // It's not in the table, add it now.
          var ret = getEmptyTableSlot();
          // Set the new value.
          try {
            // Attempting to call this with JS function will cause of table.set() to fail
            setWasmTableEntry(ret, func);
          } catch (err) {
            if (!(err instanceof TypeError)) {
              throw err;
            }
            assert(typeof sig != "undefined", "Missing signature argument to addFunction: " + func);
            var wrapped = convertJsFunctionToWasm(func, sig);
            setWasmTableEntry(ret, wrapped);
          }
          functionsInTableMap.set(func, ret);
          return ret;
        };
        var updateGOT = (exports, replace) => {
          for (var symName in exports) {
            if (isInternalSym(symName)) {
              continue;
            }
            var value = exports[symName];
            if (symName.startsWith("orig$")) {
              symName = symName.split("$")[1];
              replace = true;
            }
            GOT[symName] ||= new WebAssembly.Global({
              "value": "i32",
              "mutable": true
            });
            if (replace || GOT[symName].value == 0) {
              if (typeof value == "function") {
                GOT[symName].value = addFunction(value);
              } else if (typeof value == "number") {
                GOT[symName].value = value;
              } else {
                err(`unhandled export type for '${symName}': ${typeof value}`);
              }
            }
          }
        };
        /** @param {boolean=} replace */ var relocateExports = (exports, memoryBase, replace) => {
          var relocated = {};
          for (var e in exports) {
            var value = exports[e];
            if (typeof value == "object") {
              // a breaking change in the wasm spec, globals are now objects
              // https://github.com/WebAssembly/mutable-global/issues/1
              value = value.value;
            }
            if (typeof value == "number") {
              value += memoryBase;
            }
            relocated[e] = value;
          }
          updateGOT(relocated, replace);
          return relocated;
        };
        var isSymbolDefined = symName => {
          // Ignore 'stub' symbols that are auto-generated as part of the original
          // `wasmImports` used to instantiate the main module.
          var existing = wasmImports[symName];
          if (!existing || existing.stub) {
            return false;
          }
          return true;
        };
        var dynCallLegacy = (sig, ptr, args) => {
          sig = sig.replace(/p/g, "i");
          assert(("dynCall_" + sig) in Module, `bad function pointer type - dynCall function not found for sig '${sig}'`);
          if (args?.length) {
            // j (64-bit integer) must be passed in as two numbers [low 32, high 32].
            assert(args.length === sig.substring(1).replace(/j/g, "--").length);
          } else {
            assert(sig.length == 1);
          }
          var f = Module["dynCall_" + sig];
          return f(ptr, ...args);
        };
        var dynCall = (sig, ptr, args = []) => {
          // Without WASM_BIGINT support we cannot directly call function with i64 as
          // part of their signature, so we rely on the dynCall functions generated by
          // wasm-emscripten-finalize
          if (sig.includes("j")) {
            return dynCallLegacy(sig, ptr, args);
          }
          assert(getWasmTableEntry(ptr), `missing table entry in dynCall: ${ptr}`);
          var rtn = getWasmTableEntry(ptr)(...args);
          return rtn;
        };
        var stackSave = () => _emscripten_stack_get_current();
        var stackRestore = val => __emscripten_stack_restore(val);
        var createInvokeFunction = sig => (ptr, ...args) => {
          var sp = stackSave();
          try {
            return dynCall(sig, ptr, args);
          } catch (e) {
            stackRestore(sp);
            // Create a try-catch guard that rethrows the Emscripten EH exception.
            // Exceptions thrown from C++ will be a pointer (number) and longjmp
            // will throw the number Infinity. Use the compact and fast "e !== e+0"
            // test to check if e was not a Number.
            if (e !== e + 0) throw e;
            _setThrew(1, 0);
          }
        };
        var resolveGlobalSymbol = (symName, direct = false) => {
          var sym;
          // First look for the orig$ symbol which is the symbol without i64
          // legalization performed.
          if (direct && ("orig$" + symName in wasmImports)) {
            symName = "orig$" + symName;
          }
          if (isSymbolDefined(symName)) {
            sym = wasmImports[symName];
          } else // Asm.js-style exception handling: invoke wrapper generation
          if (symName.startsWith("invoke_")) {
            // Create (and cache) new invoke_ functions on demand.
            sym = wasmImports[symName] = createInvokeFunction(symName.split("_")[1]);
          }
          return {
            sym: sym,
            name: symName
          };
        };
        /**
     * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
     * emscripten HEAP, returns a copy of that string as a Javascript String object.
     *
     * @param {number} ptr
     * @param {number=} maxBytesToRead - An optional length that specifies the
     *   maximum number of bytes to read. You can omit this parameter to scan the
     *   string until the first 0 byte. If maxBytesToRead is passed, and the string
     *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
     *   string will cut short at that byte index (i.e. maxBytesToRead will not
     *   produce a string of exact length [ptr, ptr+maxBytesToRead[) N.B. mixing
     *   frequent uses of UTF8ToString() with and without maxBytesToRead may throw
     *   JS JIT optimizations off, so it is worth to consider consistently using one
     * @return {string}
     */ var UTF8ToString = (ptr, maxBytesToRead) => {
          assert(typeof ptr == "number", `UTF8ToString expects a number (got ${typeof ptr})`);
          return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
        };
        /**
      * @param {string=} libName
      * @param {Object=} localScope
      * @param {number=} handle
      */ var loadWebAssemblyModule = (binary, flags, libName, localScope, handle) => {
          var metadata = getDylinkMetadata(binary);
          currentModuleWeakSymbols = metadata.weakImports;
          var originalTable = wasmTable;
          // loadModule loads the wasm module after all its dependencies have been loaded.
          // can be called both sync/async.
          function loadModule() {
            // The first thread to load a given module needs to allocate the static
            // table and memory regions.  Later threads re-use the same table region
            // and can ignore the memory region (since memory is shared between
            // threads already).
            // If `handle` is specified than it is assumed that the calling thread has
            // exclusive access to it for the duration of this function.  See the
            // locking in `dynlink.c`.
            var firstLoad = !handle || !SAFE_HEAP_LOAD((handle) + (8), 1, 0);
            if (firstLoad) {
              // alignments are powers of 2
              var memAlign = Math.pow(2, metadata.memoryAlign);
              // prepare memory
              var memoryBase = metadata.memorySize ? alignMemory(getMemory(metadata.memorySize + memAlign), memAlign) : 0;
              // TODO: add to cleanups
              var tableBase = metadata.tableSize ? wasmTable.length : 0;
              if (handle) {
                SAFE_HEAP_STORE((handle) + (8), 1, 1);
                LE_HEAP_STORE_U32((((handle) + (12)) >> 2) * 4, memoryBase);
                LE_HEAP_STORE_I32((((handle) + (16)) >> 2) * 4, metadata.memorySize);
                LE_HEAP_STORE_U32((((handle) + (20)) >> 2) * 4, tableBase);
                LE_HEAP_STORE_I32((((handle) + (24)) >> 2) * 4, metadata.tableSize);
              }
            } else {
              memoryBase = LE_HEAP_LOAD_U32((((handle) + (12)) >> 2) * 4);
              tableBase = LE_HEAP_LOAD_U32((((handle) + (20)) >> 2) * 4);
            }
            var tableGrowthNeeded = tableBase + metadata.tableSize - wasmTable.length;
            if (tableGrowthNeeded > 0) {
              wasmTable.grow(tableGrowthNeeded);
            }
            // This is the export map that we ultimately return.  We declare it here
            // so it can be used within resolveSymbol.  We resolve symbols against
            // this local symbol map in the case there they are not present on the
            // global Module object.  We need this fallback because Modules sometime
            // need to import their own symbols
            var moduleExports;
            function resolveSymbol(sym) {
              var resolved = resolveGlobalSymbol(sym).sym;
              if (!resolved && localScope) {
                resolved = localScope[sym];
              }
              if (!resolved) {
                resolved = moduleExports[sym];
              }
              assert(resolved, `undefined symbol '${sym}'. perhaps a side module was not linked in? if this global was expected to arrive from a system library, try to build the MAIN_MODULE with EMCC_FORCE_STDLIBS=1 in the environment`);
              return resolved;
            }
            // TODO kill ↓↓↓ (except "symbols local to this module", it will likely be
            // not needed if we require that if A wants symbols from B it has to link
            // to B explicitly: similarly to -Wl,--no-undefined)
            // wasm dynamic libraries are pure wasm, so they cannot assist in
            // their own loading. When side module A wants to import something
            // provided by a side module B that is loaded later, we need to
            // add a layer of indirection, but worse, we can't even tell what
            // to add the indirection for, without inspecting what A's imports
            // are. To do that here, we use a JS proxy (another option would
            // be to inspect the binary directly).
            var proxyHandler = {
              get(stubs, prop) {
                // symbols that should be local to this module
                switch (prop) {
                 case "__memory_base":
                  return memoryBase;

                 case "__table_base":
                  return tableBase;
                }
                if (prop in wasmImports && !wasmImports[prop].stub) {
                  // No stub needed, symbol already exists in symbol table
                  return wasmImports[prop];
                }
                // Return a stub function that will resolve the symbol
                // when first called.
                if (!(prop in stubs)) {
                  var resolved;
                  stubs[prop] = (...args) => {
                    resolved ||= resolveSymbol(prop);
                    return resolved(...args);
                  };
                }
                return stubs[prop];
              }
            };
            var proxy = new Proxy({}, proxyHandler);
            var info = {
              "GOT.mem": new Proxy({}, GOTHandler),
              "GOT.func": new Proxy({}, GOTHandler),
              "env": proxy,
              "wasi_snapshot_preview1": proxy
            };
            function postInstantiation(module, instance) {
              // the table should be unchanged
              assert(wasmTable === originalTable);
              // add new entries to functionsInTableMap
              updateTableMap(tableBase, metadata.tableSize);
              moduleExports = relocateExports(instance.exports, memoryBase);
              if (!flags.allowUndefined) {
                reportUndefinedSymbols();
              }
              function addEmAsm(addr, body) {
                var args = [];
                var arity = 0;
                for (;arity < 16; arity++) {
                  if (body.indexOf("$" + arity) != -1) {
                    args.push("$" + arity);
                  } else {
                    break;
                  }
                }
                args = args.join(",");
                var func = `(${args}) => { ${body} };`;
                ASM_CONSTS[start] = eval(func);
              }
              // Add any EM_ASM function that exist in the side module
              if ("__start_em_asm" in moduleExports) {
                var start = moduleExports["__start_em_asm"];
                var stop = moduleExports["__stop_em_asm"];
                while (start < stop) {
                  var jsString = UTF8ToString(start);
                  addEmAsm(start, jsString);
                  start = HEAPU8.indexOf(0, start) + 1;
                }
              }
              function addEmJs(name, cSig, body) {
                // The signature here is a C signature (e.g. "(int foo, char* bar)").
                // See `create_em_js` in emcc.py` for the build-time version of this
                // code.
                var jsArgs = [];
                cSig = cSig.slice(1, -1);
                if (cSig != "void") {
                  cSig = cSig.split(",");
                  for (var i in cSig) {
                    var jsArg = cSig[i].split(" ").pop();
                    jsArgs.push(jsArg.replace("*", ""));
                  }
                }
                var func = `(${jsArgs}) => ${body};`;
                moduleExports[name] = eval(func);
              }
              for (var name in moduleExports) {
                if (name.startsWith("__em_js__")) {
                  var start = moduleExports[name];
                  var jsString = UTF8ToString(start);
                  // EM_JS strings are stored in the data section in the form
                  // SIG<::>BODY.
                  var parts = jsString.split("<::>");
                  addEmJs(name.replace("__em_js__", ""), parts[0], parts[1]);
                  delete moduleExports[name];
                }
              }
              // initialize the module
              var applyRelocs = moduleExports["__wasm_apply_data_relocs"];
              if (applyRelocs) {
                if (runtimeInitialized) {
                  applyRelocs();
                } else {
                  __RELOC_FUNCS__.push(applyRelocs);
                }
              }
              var init = moduleExports["__wasm_call_ctors"];
              if (init) {
                if (runtimeInitialized) {
                  init();
                } else {
                  // we aren't ready to run compiled code yet
                  __ATINIT__.push(init);
                }
              }
              return moduleExports;
            }
            if (flags.loadAsync) {
              if (binary instanceof WebAssembly.Module) {
                var instance = new WebAssembly.Instance(binary, info);
                return Promise.resolve(postInstantiation(binary, instance));
              }
              return WebAssembly.instantiate(binary, info).then(result => postInstantiation(result.module, result.instance));
            }
            var module = binary instanceof WebAssembly.Module ? binary : new WebAssembly.Module(binary);
            var instance = new WebAssembly.Instance(module, info);
            return postInstantiation(module, instance);
          }
          // now load needed libraries and the module itself.
          if (flags.loadAsync) {
            return metadata.neededDynlibs.reduce((chain, dynNeeded) => chain.then(() => loadDynamicLibrary(dynNeeded, flags, localScope)), Promise.resolve()).then(loadModule);
          }
          metadata.neededDynlibs.forEach(needed => loadDynamicLibrary(needed, flags, localScope));
          return loadModule();
        };
        var mergeLibSymbols = (exports, libName) => {
          // add symbols into global namespace TODO: weak linking etc.
          for (var [sym, exp] of Object.entries(exports)) {
            // When RTLD_GLOBAL is enabled, the symbols defined by this shared object
            // will be made available for symbol resolution of subsequently loaded
            // shared objects.
            // We should copy the symbols (which include methods and variables) from
            // SIDE_MODULE to MAIN_MODULE.
            const setImport = target => {
              if (!isSymbolDefined(target)) {
                wasmImports[target] = exp;
              }
            };
            setImport(sym);
            // Special case for handling of main symbol:  If a side module exports
            // `main` that also acts a definition for `__main_argc_argv` and vice
            // versa.
            const main_alias = "__main_argc_argv";
            if (sym == "main") {
              setImport(main_alias);
            }
            if (sym == main_alias) {
              setImport("main");
            }
            if (sym.startsWith("dynCall_") && !Module.hasOwnProperty(sym)) {
              Module[sym] = exp;
            }
          }
        };
        /** @param {boolean=} noRunDep */ var asyncLoad = (url, onload, onerror, noRunDep) => {
          var dep = !noRunDep ? getUniqueRunDependency(`al ${url}`) : "";
          readAsync(url).then(arrayBuffer => {
            assert(arrayBuffer, `Loading data file "${url}" failed (no arrayBuffer).`);
            onload(new Uint8Array(arrayBuffer));
            if (dep) removeRunDependency(dep);
          }, err => {
            if (onerror) {
              onerror();
            } else {
              throw `Loading data file "${url}" failed.`;
            }
          });
          if (dep) addRunDependency(dep);
        };
        /**
       * @param {number=} handle
       * @param {Object=} localScope
       */ function loadDynamicLibrary(libName, flags = {
          global: true,
          nodelete: true
        }, localScope, handle) {
          // when loadDynamicLibrary did not have flags, libraries were loaded
          // globally & permanently
          var dso = LDSO.loadedLibsByName[libName];
          if (dso) {
            // the library is being loaded or has been loaded already.
            assert(dso.exports !== "loading", `Attempt to load '${libName}' twice before the first load completed`);
            if (!flags.global) {
              if (localScope) {
                Object.assign(localScope, dso.exports);
              }
            } else if (!dso.global) {
              // The library was previously loaded only locally but not
              // we have a request with global=true.
              dso.global = true;
              mergeLibSymbols(dso.exports, libName);
            }
            // same for "nodelete"
            if (flags.nodelete && dso.refcount !== Infinity) {
              dso.refcount = Infinity;
            }
            dso.refcount++;
            if (handle) {
              LDSO.loadedLibsByHandle[handle] = dso;
            }
            return flags.loadAsync ? Promise.resolve(true) : true;
          }
          // allocate new DSO
          dso = newDSO(libName, handle, "loading");
          dso.refcount = flags.nodelete ? Infinity : 1;
          dso.global = flags.global;
          // libName -> libData
          function loadLibData() {
            // for wasm, we can use fetch for async, but for fs mode we can only imitate it
            if (handle) {
              var data = LE_HEAP_LOAD_U32((((handle) + (28)) >> 2) * 4);
              var dataSize = LE_HEAP_LOAD_U32((((handle) + (32)) >> 2) * 4);
              if (data && dataSize) {
                var libData = HEAP8.slice(data, data + dataSize);
                return flags.loadAsync ? Promise.resolve(libData) : libData;
              }
            }
            var libFile = locateFile(libName);
            if (flags.loadAsync) {
              return new Promise(function(resolve, reject) {
                asyncLoad(libFile, resolve, reject);
              });
            }
            // load the binary synchronously
            if (!readBinary) {
              throw new Error(`${libFile}: file not found, and synchronous loading of external files is not available`);
            }
            return readBinary(libFile);
          }
          // libName -> exports
          function getExports() {
            // module not preloaded - load lib data and create new module from it
            if (flags.loadAsync) {
              return loadLibData().then(libData => loadWebAssemblyModule(libData, flags, libName, localScope, handle));
            }
            return loadWebAssemblyModule(loadLibData(), flags, libName, localScope, handle);
          }
          // module for lib is loaded - update the dso & global namespace
          function moduleLoaded(exports) {
            if (dso.global) {
              mergeLibSymbols(exports, libName);
            } else if (localScope) {
              Object.assign(localScope, exports);
            }
            dso.exports = exports;
          }
          if (flags.loadAsync) {
            return getExports().then(exports => {
              moduleLoaded(exports);
              return true;
            });
          }
          moduleLoaded(getExports());
          return true;
        }
        var reportUndefinedSymbols = () => {
          for (var [symName, entry] of Object.entries(GOT)) {
            if (entry.value == 0) {
              var value = resolveGlobalSymbol(symName, true).sym;
              if (!value && !entry.required) {
                // Ignore undefined symbols that are imported as weak.
                continue;
              }
              assert(value, `undefined symbol '${symName}'. perhaps a side module was not linked in? if this global was expected to arrive from a system library, try to build the MAIN_MODULE with EMCC_FORCE_STDLIBS=1 in the environment`);
              if (typeof value == "function") {
                /** @suppress {checkTypes} */ entry.value = addFunction(value, value.sig);
              } else if (typeof value == "number") {
                entry.value = value;
              } else {
                throw new Error(`bad export type for '${symName}': ${typeof value}`);
              }
            }
          }
        };
        var loadDylibs = () => {
          if (!dynamicLibraries.length) {
            reportUndefinedSymbols();
            return;
          }
          // Load binaries asynchronously
          addRunDependency("loadDylibs");
          dynamicLibraries.reduce((chain, lib) => chain.then(() => loadDynamicLibrary(lib, {
            loadAsync: true,
            global: true,
            nodelete: true,
            allowUndefined: true
          })), Promise.resolve()).then(() => {
            // we got them all, wonderful
            reportUndefinedSymbols();
            removeRunDependency("loadDylibs");
          });
        };
        var noExitRuntime = Module["noExitRuntime"] || true;
        var ptrToString = ptr => {
          assert(typeof ptr === "number");
          // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
          ptr >>>= 0;
          return "0x" + ptr.toString(16).padStart(8, "0");
        };
        /**
     * @param {number} ptr
     * @param {number} value
     * @param {string} type
     */ function setValue(ptr, value, type = "i8") {
          if (type.endsWith("*")) type = "*";
          switch (type) {
           case "i1":
            SAFE_HEAP_STORE(ptr, value, 1);
            break;

           case "i8":
            SAFE_HEAP_STORE(ptr, value, 1);
            break;

           case "i16":
            LE_HEAP_STORE_I16(((ptr) >> 1) * 2, value);
            break;

           case "i32":
            LE_HEAP_STORE_I32(((ptr) >> 2) * 4, value);
            break;

           case "i64":
            abort("to do setValue(i64) use WASM_BIGINT");

           case "float":
            LE_HEAP_STORE_F32(((ptr) >> 2) * 4, value);
            break;

           case "double":
            LE_HEAP_STORE_F64(((ptr) >> 3) * 8, value);
            break;

           case "*":
            LE_HEAP_STORE_U32(((ptr) >> 2) * 4, value);
            break;

           default:
            abort(`invalid type for setValue: ${type}`);
          }
        }
        function setValue_safe(ptr, value, type = "i8") {
          if (type.endsWith("*")) type = "*";
          switch (type) {
           case "i1":
            HEAP8[ptr] = value;
            break;

           case "i8":
            HEAP8[ptr] = value;
            break;

           case "i16":
            LE_HEAP_STORE_I16(((ptr) >> 1) * 2, value);
            break;

           case "i32":
            LE_HEAP_STORE_I32(((ptr) >> 2) * 4, value);
            break;

           case "i64":
            abort("to do setValue(i64) use WASM_BIGINT");

           case "float":
            LE_HEAP_STORE_F32(((ptr) >> 2) * 4, value);
            break;

           case "double":
            LE_HEAP_STORE_F64(((ptr) >> 3) * 8, value);
            break;

           case "*":
            LE_HEAP_STORE_U32(((ptr) >> 2) * 4, value);
            break;

           default:
            abort(`invalid type for setValue: ${type}`);
          }
        }
        var unSign = (value, bits) => {
          if (value >= 0) {
            return value;
          }
          // Need some trickery, since if bits == 32, we are right at the limit of the
          // bits JS uses in bitshifts
          return bits <= 32 ? 2 * Math.abs(1 << (bits - 1)) + value : Math.pow(2, bits) + value;
        };
        var warnOnce = text => {
          warnOnce.shown ||= {};
          if (!warnOnce.shown[text]) {
            warnOnce.shown[text] = 1;
            if (ENVIRONMENT_IS_NODE) text = "warning: " + text;
            err(text);
          }
        };
        var ___memory_base = new WebAssembly.Global({
          "value": "i32",
          "mutable": false
        }, 1024);
        var ___stack_high = 78144;
        var ___stack_low = 12608;
        var ___stack_pointer = new WebAssembly.Global({
          "value": "i32",
          "mutable": true
        }, 78144);
        var ___table_base = new WebAssembly.Global({
          "value": "i32",
          "mutable": false
        }, 1);
        var __abort_js = () => {
          abort("native code called abort()");
        };
        __abort_js.sig = "v";
        var nowIsMonotonic = 1;
        var __emscripten_get_now_is_monotonic = () => nowIsMonotonic;
        __emscripten_get_now_is_monotonic.sig = "i";
        var __emscripten_memcpy_js = (dest, src, num) => HEAPU8.copyWithin(dest, src, src + num);
        __emscripten_memcpy_js.sig = "vppp";
        var _emscripten_date_now = () => Date.now();
        _emscripten_date_now.sig = "d";
        var _emscripten_get_now;
        // Modern environment where performance.now() is supported:
        // N.B. a shorter form "_emscripten_get_now = performance.now;" is
        // unfortunately not allowed even in current browsers (e.g. FF Nightly 75).
        _emscripten_get_now = () => performance.now();
        _emscripten_get_now.sig = "d";
        var getHeapMax = () => // Stay one Wasm page short of 4GB: while e.g. Chrome is able to allocate
        // full 4GB Wasm memories, the size will wrap back to 0 bytes in Wasm side
        // for any code that deals with heap sizes, which would require special
        // casing all heap size related code to treat 0 specially.
        2147483648;
        var growMemory = size => {
          var b = wasmMemory.buffer;
          var pages = (size - b.byteLength + 65535) / 65536;
          try {
            // round size grow request up to wasm page size (fixed 64KB per spec)
            wasmMemory.grow(pages);
            // .grow() takes a delta compared to the previous size
            updateMemoryViews();
            return 1;
          } /*success*/ catch (e) {
            err(`growMemory: Attempted to grow heap from ${b.byteLength} bytes to ${size} bytes, but got error: ${e}`);
          }
        };
        // implicit 0 return to save code size (caller will cast "undefined" into 0
        // anyhow)
        var _emscripten_resize_heap = requestedSize => {
          var oldSize = HEAPU8.length;
          // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
          requestedSize >>>= 0;
          // With multithreaded builds, races can happen (another thread might increase the size
          // in between), so return a failure, and let the caller retry.
          assert(requestedSize > oldSize);
          // Memory resize rules:
          // 1.  Always increase heap size to at least the requested size, rounded up
          //     to next page multiple.
          // 2a. If MEMORY_GROWTH_LINEAR_STEP == -1, excessively resize the heap
          //     geometrically: increase the heap size according to
          //     MEMORY_GROWTH_GEOMETRIC_STEP factor (default +20%), At most
          //     overreserve by MEMORY_GROWTH_GEOMETRIC_CAP bytes (default 96MB).
          // 2b. If MEMORY_GROWTH_LINEAR_STEP != -1, excessively resize the heap
          //     linearly: increase the heap size by at least
          //     MEMORY_GROWTH_LINEAR_STEP bytes.
          // 3.  Max size for the heap is capped at 2048MB-WASM_PAGE_SIZE, or by
          //     MAXIMUM_MEMORY, or by ASAN limit, depending on which is smallest
          // 4.  If we were unable to allocate as much memory, it may be due to
          //     over-eager decision to excessively reserve due to (3) above.
          //     Hence if an allocation fails, cut down on the amount of excess
          //     growth, in an attempt to succeed to perform a smaller allocation.
          // A limit is set for how much we can grow. We should not exceed that
          // (the wasm binary specifies it, so if we tried, we'd fail anyhow).
          var maxHeapSize = getHeapMax();
          if (requestedSize > maxHeapSize) {
            err(`Cannot enlarge memory, requested ${requestedSize} bytes, but the limit is ${maxHeapSize} bytes!`);
            return false;
          }
          var alignUp = (x, multiple) => x + (multiple - x % multiple) % multiple;
          // Loop through potential heap size increases. If we attempt a too eager
          // reservation that fails, cut down on the attempted size and reserve a
          // smaller bump instead. (max 3 times, chosen somewhat arbitrarily)
          for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
            var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
            // ensure geometric growth
            // but limit overreserving (default to capping at +96MB overgrowth at most)
            overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
            var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
            var replacement = growMemory(newSize);
            if (replacement) {
              return true;
            }
          }
          err(`Failed to grow the heap from ${oldSize} bytes to ${newSize} bytes, not enough memory!`);
          return false;
        };
        _emscripten_resize_heap.sig = "ip";
        var SYSCALLS = {
          varargs: undefined,
          getStr(ptr) {
            var ret = UTF8ToString(ptr);
            return ret;
          }
        };
        var _fd_close = fd => {
          abort("fd_close called without SYSCALLS_REQUIRE_FILESYSTEM");
        };
        _fd_close.sig = "ii";
        var convertI32PairToI53Checked = (lo, hi) => {
          assert(lo == (lo >>> 0) || lo == (lo | 0));
          // lo should either be a i32 or a u32
          assert(hi === (hi | 0));
          // hi should be a i32
          return ((hi + 2097152) >>> 0 < 4194305 - !!lo) ? (lo >>> 0) + hi * 4294967296 : NaN;
        };
        function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
          var offset = convertI32PairToI53Checked(offset_low, offset_high);
          return 70;
        }
        _fd_seek.sig = "iiiiip";
        var printCharBuffers = [ null, [], [] ];
        var printChar = (stream, curr) => {
          var buffer = printCharBuffers[stream];
          assert(buffer);
          if (curr === 0 || curr === 10) {
            (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
            buffer.length = 0;
          } else {
            buffer.push(curr);
          }
        };
        var flush_NO_FILESYSTEM = () => {
          // flush anything remaining in the buffers during shutdown
          _fflush(0);
          if (printCharBuffers[1].length) printChar(1, 10);
          if (printCharBuffers[2].length) printChar(2, 10);
        };
        var _fd_write = (fd, iov, iovcnt, pnum) => {
          // hack to support printf in SYSCALLS_REQUIRE_FILESYSTEM=0
          var num = 0;
          for (var i = 0; i < iovcnt; i++) {
            var ptr = LE_HEAP_LOAD_U32(((iov) >> 2) * 4);
            var len = LE_HEAP_LOAD_U32((((iov) + (4)) >> 2) * 4);
            iov += 8;
            for (var j = 0; j < len; j++) {
              printChar(fd, SAFE_HEAP_LOAD(ptr + j, 1, 1));
            }
            num += len;
          }
          LE_HEAP_STORE_U32(((pnum) >> 2) * 4, num);
          return 0;
        };
        _fd_write.sig = "iippp";
        function _tree_sitter_log_callback(isLexMessage, messageAddress) {
          if (currentLogCallback) {
            const message = UTF8ToString(messageAddress);
            currentLogCallback(message, isLexMessage !== 0);
          }
        }
        function _tree_sitter_parse_callback(inputBufferAddress, index, row, column, lengthAddress) {
          const INPUT_BUFFER_SIZE = 10 * 1024;
          const string = currentParseCallback(index, {
            row: row,
            column: column
          });
          if (typeof string === "string") {
            setValue(lengthAddress, string.length, "i32");
            stringToUTF16(string, inputBufferAddress, INPUT_BUFFER_SIZE);
          } else {
            setValue(lengthAddress, 0, "i32");
          }
        }
        var runtimeKeepaliveCounter = 0;
        var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
        var _proc_exit = code => {
          EXITSTATUS = code;
          if (!keepRuntimeAlive()) {
            Module["onExit"]?.(code);
            ABORT = true;
          }
          quit_(code, new ExitStatus(code));
        };
        _proc_exit.sig = "vi";
        /** @param {boolean|number=} implicit */ var exitJS = (status, implicit) => {
          EXITSTATUS = status;
          checkUnflushedContent();
          // if exit() was called explicitly, warn the user if the runtime isn't actually being shut down
          if (keepRuntimeAlive() && !implicit) {
            var msg = `program exited (with status: ${status}), but keepRuntimeAlive() is set (counter=${runtimeKeepaliveCounter}) due to an async operation, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)`;
            err(msg);
          }
          _proc_exit(status);
        };
        var handleException = e => {
          // Certain exception types we do not treat as errors since they are used for
          // internal control flow.
          // 1. ExitStatus, which is thrown by exit()
          // 2. "unwind", which is thrown by emscripten_unwind_to_js_event_loop() and others
          //    that wish to return to JS event loop.
          if (e instanceof ExitStatus || e == "unwind") {
            return EXITSTATUS;
          }
          checkStackCookie();
          if (e instanceof WebAssembly.RuntimeError) {
            if (_emscripten_stack_get_current() <= 0) {
              err("Stack overflow detected.  You can try increasing -sSTACK_SIZE (currently set to 65536)");
            }
          }
          quit_(1, e);
        };
        var lengthBytesUTF8 = str => {
          var len = 0;
          for (var i = 0; i < str.length; ++i) {
            // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
            // unit, not a Unicode code point of the character! So decode
            // UTF16->UTF32->UTF8.
            // See http://unicode.org/faq/utf_bom.html#utf16-3
            var c = str.charCodeAt(i);
            // possibly a lead surrogate
            if (c <= 127) {
              len++;
            } else if (c <= 2047) {
              len += 2;
            } else if (c >= 55296 && c <= 57343) {
              len += 4;
              ++i;
            } else {
              len += 3;
            }
          }
          return len;
        };
        var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
          assert(typeof str === "string", `stringToUTF8Array expects a string (got ${typeof str})`);
          // Parameter maxBytesToWrite is not optional. Negative values, 0, null,
          // undefined and false each don't write out any bytes.
          if (!(maxBytesToWrite > 0)) return 0;
          var startIdx = outIdx;
          var endIdx = outIdx + maxBytesToWrite - 1;
          // -1 for string null terminator.
          for (var i = 0; i < str.length; ++i) {
            // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
            // unit, not a Unicode code point of the character! So decode
            // UTF16->UTF32->UTF8.
            // See http://unicode.org/faq/utf_bom.html#utf16-3
            // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description
            // and https://www.ietf.org/rfc/rfc2279.txt
            // and https://tools.ietf.org/html/rfc3629
            var u = str.charCodeAt(i);
            // possibly a lead surrogate
            if (u >= 55296 && u <= 57343) {
              var u1 = str.charCodeAt(++i);
              u = 65536 + ((u & 1023) << 10) | (u1 & 1023);
            }
            if (u <= 127) {
              if (outIdx >= endIdx) break;
              heap[outIdx++] = u;
            } else if (u <= 2047) {
              if (outIdx + 1 >= endIdx) break;
              heap[outIdx++] = 192 | (u >> 6);
              heap[outIdx++] = 128 | (u & 63);
            } else if (u <= 65535) {
              if (outIdx + 2 >= endIdx) break;
              heap[outIdx++] = 224 | (u >> 12);
              heap[outIdx++] = 128 | ((u >> 6) & 63);
              heap[outIdx++] = 128 | (u & 63);
            } else {
              if (outIdx + 3 >= endIdx) break;
              if (u > 1114111) warnOnce("Invalid Unicode code point " + ptrToString(u) + " encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).");
              heap[outIdx++] = 240 | (u >> 18);
              heap[outIdx++] = 128 | ((u >> 12) & 63);
              heap[outIdx++] = 128 | ((u >> 6) & 63);
              heap[outIdx++] = 128 | (u & 63);
            }
          }
          // Null-terminate the pointer to the buffer.
          heap[outIdx] = 0;
          return outIdx - startIdx;
        };
        var stringToUTF8 = (str, outPtr, maxBytesToWrite) => {
          assert(typeof maxBytesToWrite == "number", "stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
          return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
        };
        var stackAlloc = sz => __emscripten_stack_alloc(sz);
        var stringToUTF8OnStack = str => {
          var size = lengthBytesUTF8(str) + 1;
          var ret = stackAlloc(size);
          stringToUTF8(str, ret, size);
          return ret;
        };
        var stringToUTF16 = (str, outPtr, maxBytesToWrite) => {
          assert(outPtr % 2 == 0, "Pointer passed to stringToUTF16 must be aligned to two bytes!");
          assert(typeof maxBytesToWrite == "number", "stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
          // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
          maxBytesToWrite ??= 2147483647;
          if (maxBytesToWrite < 2) return 0;
          maxBytesToWrite -= 2;
          // Null terminator.
          var startPtr = outPtr;
          var numCharsToWrite = (maxBytesToWrite < str.length * 2) ? (maxBytesToWrite / 2) : str.length;
          for (var i = 0; i < numCharsToWrite; ++i) {
            // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
            var codeUnit = str.charCodeAt(i);
            // possibly a lead surrogate
            LE_HEAP_STORE_I16(((outPtr) >> 1) * 2, codeUnit);
            outPtr += 2;
          }
          // Null-terminate the pointer to the HEAP.
          LE_HEAP_STORE_I16(((outPtr) >> 1) * 2, 0);
          return outPtr - startPtr;
        };
        var AsciiToString = ptr => {
          var str = "";
          while (1) {
            var ch = SAFE_HEAP_LOAD(ptr++, 1, 1);
            if (!ch) return str;
            str += String.fromCharCode(ch);
          }
        };
        function checkIncomingModuleAPI() {
          ignoredModuleProp("fetchSettings");
        }
        var wasmImports = {
          /** @export */ __heap_base: ___heap_base,
          /** @export */ __indirect_function_table: wasmTable,
          /** @export */ __memory_base: ___memory_base,
          /** @export */ __stack_high: ___stack_high,
          /** @export */ __stack_low: ___stack_low,
          /** @export */ __stack_pointer: ___stack_pointer,
          /** @export */ __table_base: ___table_base,
          /** @export */ _abort_js: __abort_js,
          /** @export */ _emscripten_get_now_is_monotonic: __emscripten_get_now_is_monotonic,
          /** @export */ _emscripten_memcpy_js: __emscripten_memcpy_js,
          /** @export */ alignfault: alignfault,
          /** @export */ emscripten_date_now: _emscripten_date_now,
          /** @export */ emscripten_get_now: _emscripten_get_now,
          /** @export */ emscripten_resize_heap: _emscripten_resize_heap,
          /** @export */ fd_close: _fd_close,
          /** @export */ fd_seek: _fd_seek,
          /** @export */ fd_write: _fd_write,
          /** @export */ memory: wasmMemory,
          /** @export */ segfault: segfault,
          /** @export */ tree_sitter_log_callback: _tree_sitter_log_callback,
          /** @export */ tree_sitter_parse_callback: _tree_sitter_parse_callback
        };
        var wasmExports = createWasm();
        var ___wasm_call_ctors = createExportWrapper("__wasm_call_ctors", 0);
        var ___wasm_apply_data_relocs = createExportWrapper("__wasm_apply_data_relocs", 0);
        var _malloc = Module["_malloc"] = createExportWrapper("malloc", 1);
        var _calloc = Module["_calloc"] = createExportWrapper("calloc", 2);
        var _realloc = Module["_realloc"] = createExportWrapper("realloc", 2);
        var _free = Module["_free"] = createExportWrapper("free", 1);
        var _ts_language_symbol_count = Module["_ts_language_symbol_count"] = createExportWrapper("ts_language_symbol_count", 1);
        var _ts_language_state_count = Module["_ts_language_state_count"] = createExportWrapper("ts_language_state_count", 1);
        var _ts_language_version = Module["_ts_language_version"] = createExportWrapper("ts_language_version", 1);
        var _ts_language_field_count = Module["_ts_language_field_count"] = createExportWrapper("ts_language_field_count", 1);
        var _ts_language_next_state = Module["_ts_language_next_state"] = createExportWrapper("ts_language_next_state", 3);
        var _ts_language_symbol_name = Module["_ts_language_symbol_name"] = createExportWrapper("ts_language_symbol_name", 2);
        var _ts_language_symbol_for_name = Module["_ts_language_symbol_for_name"] = createExportWrapper("ts_language_symbol_for_name", 4);
        var _strncmp = Module["_strncmp"] = createExportWrapper("strncmp", 3);
        var _ts_language_symbol_type = Module["_ts_language_symbol_type"] = createExportWrapper("ts_language_symbol_type", 2);
        var _ts_language_field_name_for_id = Module["_ts_language_field_name_for_id"] = createExportWrapper("ts_language_field_name_for_id", 2);
        var _ts_lookahead_iterator_new = Module["_ts_lookahead_iterator_new"] = createExportWrapper("ts_lookahead_iterator_new", 2);
        var _ts_lookahead_iterator_delete = Module["_ts_lookahead_iterator_delete"] = createExportWrapper("ts_lookahead_iterator_delete", 1);
        var _ts_lookahead_iterator_reset_state = Module["_ts_lookahead_iterator_reset_state"] = createExportWrapper("ts_lookahead_iterator_reset_state", 2);
        var _ts_lookahead_iterator_reset = Module["_ts_lookahead_iterator_reset"] = createExportWrapper("ts_lookahead_iterator_reset", 3);
        var _ts_lookahead_iterator_next = Module["_ts_lookahead_iterator_next"] = createExportWrapper("ts_lookahead_iterator_next", 1);
        var _ts_lookahead_iterator_current_symbol = Module["_ts_lookahead_iterator_current_symbol"] = createExportWrapper("ts_lookahead_iterator_current_symbol", 1);
        var _memset = Module["_memset"] = createExportWrapper("memset", 3);
        var _memcpy = Module["_memcpy"] = createExportWrapper("memcpy", 3);
        var _ts_parser_delete = Module["_ts_parser_delete"] = createExportWrapper("ts_parser_delete", 1);
        var _ts_parser_set_language = Module["_ts_parser_set_language"] = createExportWrapper("ts_parser_set_language", 2);
        var _ts_parser_reset = Module["_ts_parser_reset"] = createExportWrapper("ts_parser_reset", 1);
        var _ts_parser_timeout_micros = Module["_ts_parser_timeout_micros"] = createExportWrapper("ts_parser_timeout_micros", 1);
        var _ts_parser_set_timeout_micros = Module["_ts_parser_set_timeout_micros"] = createExportWrapper("ts_parser_set_timeout_micros", 3);
        var _ts_parser_set_included_ranges = Module["_ts_parser_set_included_ranges"] = createExportWrapper("ts_parser_set_included_ranges", 3);
        var _ts_query_new = Module["_ts_query_new"] = createExportWrapper("ts_query_new", 5);
        var _ts_query_delete = Module["_ts_query_delete"] = createExportWrapper("ts_query_delete", 1);
        var _iswspace = Module["_iswspace"] = createExportWrapper("iswspace", 1);
        var _ts_query_pattern_count = Module["_ts_query_pattern_count"] = createExportWrapper("ts_query_pattern_count", 1);
        var _ts_query_capture_count = Module["_ts_query_capture_count"] = createExportWrapper("ts_query_capture_count", 1);
        var _ts_query_string_count = Module["_ts_query_string_count"] = createExportWrapper("ts_query_string_count", 1);
        var _ts_query_capture_name_for_id = Module["_ts_query_capture_name_for_id"] = createExportWrapper("ts_query_capture_name_for_id", 3);
        var _ts_query_string_value_for_id = Module["_ts_query_string_value_for_id"] = createExportWrapper("ts_query_string_value_for_id", 3);
        var _ts_query_predicates_for_pattern = Module["_ts_query_predicates_for_pattern"] = createExportWrapper("ts_query_predicates_for_pattern", 3);
        var _ts_query_disable_capture = Module["_ts_query_disable_capture"] = createExportWrapper("ts_query_disable_capture", 3);
        var _memmove = Module["_memmove"] = createExportWrapper("memmove", 3);
        var _memcmp = Module["_memcmp"] = createExportWrapper("memcmp", 3);
        var _ts_tree_copy = Module["_ts_tree_copy"] = createExportWrapper("ts_tree_copy", 1);
        var _ts_tree_delete = Module["_ts_tree_delete"] = createExportWrapper("ts_tree_delete", 1);
        var _iswalnum = Module["_iswalnum"] = createExportWrapper("iswalnum", 1);
        var _ts_init = Module["_ts_init"] = createExportWrapper("ts_init", 0);
        var _ts_parser_new_wasm = Module["_ts_parser_new_wasm"] = createExportWrapper("ts_parser_new_wasm", 0);
        var _ts_parser_enable_logger_wasm = Module["_ts_parser_enable_logger_wasm"] = createExportWrapper("ts_parser_enable_logger_wasm", 2);
        var _ts_parser_parse_wasm = Module["_ts_parser_parse_wasm"] = createExportWrapper("ts_parser_parse_wasm", 5);
        var _ts_parser_included_ranges_wasm = Module["_ts_parser_included_ranges_wasm"] = createExportWrapper("ts_parser_included_ranges_wasm", 1);
        var _ts_language_type_is_named_wasm = Module["_ts_language_type_is_named_wasm"] = createExportWrapper("ts_language_type_is_named_wasm", 2);
        var _ts_language_type_is_visible_wasm = Module["_ts_language_type_is_visible_wasm"] = createExportWrapper("ts_language_type_is_visible_wasm", 2);
        var _ts_tree_root_node_wasm = Module["_ts_tree_root_node_wasm"] = createExportWrapper("ts_tree_root_node_wasm", 1);
        var _ts_tree_root_node_with_offset_wasm = Module["_ts_tree_root_node_with_offset_wasm"] = createExportWrapper("ts_tree_root_node_with_offset_wasm", 1);
        var _ts_tree_edit_wasm = Module["_ts_tree_edit_wasm"] = createExportWrapper("ts_tree_edit_wasm", 1);
        var _ts_tree_included_ranges_wasm = Module["_ts_tree_included_ranges_wasm"] = createExportWrapper("ts_tree_included_ranges_wasm", 1);
        var _ts_tree_get_changed_ranges_wasm = Module["_ts_tree_get_changed_ranges_wasm"] = createExportWrapper("ts_tree_get_changed_ranges_wasm", 2);
        var _ts_tree_cursor_new_wasm = Module["_ts_tree_cursor_new_wasm"] = createExportWrapper("ts_tree_cursor_new_wasm", 1);
        var _ts_tree_cursor_delete_wasm = Module["_ts_tree_cursor_delete_wasm"] = createExportWrapper("ts_tree_cursor_delete_wasm", 1);
        var _ts_tree_cursor_reset_wasm = Module["_ts_tree_cursor_reset_wasm"] = createExportWrapper("ts_tree_cursor_reset_wasm", 1);
        var _ts_tree_cursor_reset_to_wasm = Module["_ts_tree_cursor_reset_to_wasm"] = createExportWrapper("ts_tree_cursor_reset_to_wasm", 2);
        var _ts_tree_cursor_goto_first_child_wasm = Module["_ts_tree_cursor_goto_first_child_wasm"] = createExportWrapper("ts_tree_cursor_goto_first_child_wasm", 1);
        var _ts_tree_cursor_goto_last_child_wasm = Module["_ts_tree_cursor_goto_last_child_wasm"] = createExportWrapper("ts_tree_cursor_goto_last_child_wasm", 1);
        var _ts_tree_cursor_goto_first_child_for_index_wasm = Module["_ts_tree_cursor_goto_first_child_for_index_wasm"] = createExportWrapper("ts_tree_cursor_goto_first_child_for_index_wasm", 1);
        var _ts_tree_cursor_goto_first_child_for_position_wasm = Module["_ts_tree_cursor_goto_first_child_for_position_wasm"] = createExportWrapper("ts_tree_cursor_goto_first_child_for_position_wasm", 1);
        var _ts_tree_cursor_goto_next_sibling_wasm = Module["_ts_tree_cursor_goto_next_sibling_wasm"] = createExportWrapper("ts_tree_cursor_goto_next_sibling_wasm", 1);
        var _ts_tree_cursor_goto_previous_sibling_wasm = Module["_ts_tree_cursor_goto_previous_sibling_wasm"] = createExportWrapper("ts_tree_cursor_goto_previous_sibling_wasm", 1);
        var _ts_tree_cursor_goto_descendant_wasm = Module["_ts_tree_cursor_goto_descendant_wasm"] = createExportWrapper("ts_tree_cursor_goto_descendant_wasm", 2);
        var _ts_tree_cursor_goto_parent_wasm = Module["_ts_tree_cursor_goto_parent_wasm"] = createExportWrapper("ts_tree_cursor_goto_parent_wasm", 1);
        var _ts_tree_cursor_current_node_type_id_wasm = Module["_ts_tree_cursor_current_node_type_id_wasm"] = createExportWrapper("ts_tree_cursor_current_node_type_id_wasm", 1);
        var _ts_tree_cursor_current_node_state_id_wasm = Module["_ts_tree_cursor_current_node_state_id_wasm"] = createExportWrapper("ts_tree_cursor_current_node_state_id_wasm", 1);
        var _ts_tree_cursor_current_node_is_named_wasm = Module["_ts_tree_cursor_current_node_is_named_wasm"] = createExportWrapper("ts_tree_cursor_current_node_is_named_wasm", 1);
        var _ts_tree_cursor_current_node_is_missing_wasm = Module["_ts_tree_cursor_current_node_is_missing_wasm"] = createExportWrapper("ts_tree_cursor_current_node_is_missing_wasm", 1);
        var _ts_tree_cursor_current_node_id_wasm = Module["_ts_tree_cursor_current_node_id_wasm"] = createExportWrapper("ts_tree_cursor_current_node_id_wasm", 1);
        var _ts_tree_cursor_start_position_wasm = Module["_ts_tree_cursor_start_position_wasm"] = createExportWrapper("ts_tree_cursor_start_position_wasm", 1);
        var _ts_tree_cursor_end_position_wasm = Module["_ts_tree_cursor_end_position_wasm"] = createExportWrapper("ts_tree_cursor_end_position_wasm", 1);
        var _ts_tree_cursor_start_index_wasm = Module["_ts_tree_cursor_start_index_wasm"] = createExportWrapper("ts_tree_cursor_start_index_wasm", 1);
        var _ts_tree_cursor_end_index_wasm = Module["_ts_tree_cursor_end_index_wasm"] = createExportWrapper("ts_tree_cursor_end_index_wasm", 1);
        var _ts_tree_cursor_current_field_id_wasm = Module["_ts_tree_cursor_current_field_id_wasm"] = createExportWrapper("ts_tree_cursor_current_field_id_wasm", 1);
        var _ts_tree_cursor_current_depth_wasm = Module["_ts_tree_cursor_current_depth_wasm"] = createExportWrapper("ts_tree_cursor_current_depth_wasm", 1);
        var _ts_tree_cursor_current_descendant_index_wasm = Module["_ts_tree_cursor_current_descendant_index_wasm"] = createExportWrapper("ts_tree_cursor_current_descendant_index_wasm", 1);
        var _ts_tree_cursor_current_node_wasm = Module["_ts_tree_cursor_current_node_wasm"] = createExportWrapper("ts_tree_cursor_current_node_wasm", 1);
        var _ts_node_symbol_wasm = Module["_ts_node_symbol_wasm"] = createExportWrapper("ts_node_symbol_wasm", 1);
        var _ts_node_field_name_for_child_wasm = Module["_ts_node_field_name_for_child_wasm"] = createExportWrapper("ts_node_field_name_for_child_wasm", 2);
        var _ts_node_children_by_field_id_wasm = Module["_ts_node_children_by_field_id_wasm"] = createExportWrapper("ts_node_children_by_field_id_wasm", 2);
        var _ts_node_first_child_for_byte_wasm = Module["_ts_node_first_child_for_byte_wasm"] = createExportWrapper("ts_node_first_child_for_byte_wasm", 1);
        var _ts_node_first_named_child_for_byte_wasm = Module["_ts_node_first_named_child_for_byte_wasm"] = createExportWrapper("ts_node_first_named_child_for_byte_wasm", 1);
        var _ts_node_grammar_symbol_wasm = Module["_ts_node_grammar_symbol_wasm"] = createExportWrapper("ts_node_grammar_symbol_wasm", 1);
        var _ts_node_child_count_wasm = Module["_ts_node_child_count_wasm"] = createExportWrapper("ts_node_child_count_wasm", 1);
        var _ts_node_named_child_count_wasm = Module["_ts_node_named_child_count_wasm"] = createExportWrapper("ts_node_named_child_count_wasm", 1);
        var _ts_node_child_wasm = Module["_ts_node_child_wasm"] = createExportWrapper("ts_node_child_wasm", 2);
        var _ts_node_named_child_wasm = Module["_ts_node_named_child_wasm"] = createExportWrapper("ts_node_named_child_wasm", 2);
        var _ts_node_child_by_field_id_wasm = Module["_ts_node_child_by_field_id_wasm"] = createExportWrapper("ts_node_child_by_field_id_wasm", 2);
        var _ts_node_next_sibling_wasm = Module["_ts_node_next_sibling_wasm"] = createExportWrapper("ts_node_next_sibling_wasm", 1);
        var _ts_node_prev_sibling_wasm = Module["_ts_node_prev_sibling_wasm"] = createExportWrapper("ts_node_prev_sibling_wasm", 1);
        var _ts_node_next_named_sibling_wasm = Module["_ts_node_next_named_sibling_wasm"] = createExportWrapper("ts_node_next_named_sibling_wasm", 1);
        var _ts_node_prev_named_sibling_wasm = Module["_ts_node_prev_named_sibling_wasm"] = createExportWrapper("ts_node_prev_named_sibling_wasm", 1);
        var _ts_node_descendant_count_wasm = Module["_ts_node_descendant_count_wasm"] = createExportWrapper("ts_node_descendant_count_wasm", 1);
        var _ts_node_parent_wasm = Module["_ts_node_parent_wasm"] = createExportWrapper("ts_node_parent_wasm", 1);
        var _ts_node_descendant_for_index_wasm = Module["_ts_node_descendant_for_index_wasm"] = createExportWrapper("ts_node_descendant_for_index_wasm", 1);
        var _ts_node_named_descendant_for_index_wasm = Module["_ts_node_named_descendant_for_index_wasm"] = createExportWrapper("ts_node_named_descendant_for_index_wasm", 1);
        var _ts_node_descendant_for_position_wasm = Module["_ts_node_descendant_for_position_wasm"] = createExportWrapper("ts_node_descendant_for_position_wasm", 1);
        var _ts_node_named_descendant_for_position_wasm = Module["_ts_node_named_descendant_for_position_wasm"] = createExportWrapper("ts_node_named_descendant_for_position_wasm", 1);
        var _ts_node_start_point_wasm = Module["_ts_node_start_point_wasm"] = createExportWrapper("ts_node_start_point_wasm", 1);
        var _ts_node_end_point_wasm = Module["_ts_node_end_point_wasm"] = createExportWrapper("ts_node_end_point_wasm", 1);
        var _ts_node_start_index_wasm = Module["_ts_node_start_index_wasm"] = createExportWrapper("ts_node_start_index_wasm", 1);
        var _ts_node_end_index_wasm = Module["_ts_node_end_index_wasm"] = createExportWrapper("ts_node_end_index_wasm", 1);
        var _ts_node_to_string_wasm = Module["_ts_node_to_string_wasm"] = createExportWrapper("ts_node_to_string_wasm", 1);
        var _ts_node_children_wasm = Module["_ts_node_children_wasm"] = createExportWrapper("ts_node_children_wasm", 1);
        var _ts_node_named_children_wasm = Module["_ts_node_named_children_wasm"] = createExportWrapper("ts_node_named_children_wasm", 1);
        var _ts_node_descendants_of_type_wasm = Module["_ts_node_descendants_of_type_wasm"] = createExportWrapper("ts_node_descendants_of_type_wasm", 7);
        var _ts_node_is_named_wasm = Module["_ts_node_is_named_wasm"] = createExportWrapper("ts_node_is_named_wasm", 1);
        var _ts_node_has_changes_wasm = Module["_ts_node_has_changes_wasm"] = createExportWrapper("ts_node_has_changes_wasm", 1);
        var _ts_node_has_error_wasm = Module["_ts_node_has_error_wasm"] = createExportWrapper("ts_node_has_error_wasm", 1);
        var _ts_node_is_error_wasm = Module["_ts_node_is_error_wasm"] = createExportWrapper("ts_node_is_error_wasm", 1);
        var _ts_node_is_missing_wasm = Module["_ts_node_is_missing_wasm"] = createExportWrapper("ts_node_is_missing_wasm", 1);
        var _ts_node_is_extra_wasm = Module["_ts_node_is_extra_wasm"] = createExportWrapper("ts_node_is_extra_wasm", 1);
        var _ts_node_parse_state_wasm = Module["_ts_node_parse_state_wasm"] = createExportWrapper("ts_node_parse_state_wasm", 1);
        var _ts_node_next_parse_state_wasm = Module["_ts_node_next_parse_state_wasm"] = createExportWrapper("ts_node_next_parse_state_wasm", 1);
        var _ts_query_matches_wasm = Module["_ts_query_matches_wasm"] = createExportWrapper("ts_query_matches_wasm", 10);
        var _ts_query_captures_wasm = Module["_ts_query_captures_wasm"] = createExportWrapper("ts_query_captures_wasm", 10);
        var _fflush = createExportWrapper("fflush", 1);
        var _strlen = Module["_strlen"] = createExportWrapper("strlen", 1);
        var _iswalpha = Module["_iswalpha"] = createExportWrapper("iswalpha", 1);
        var _iswblank = Module["_iswblank"] = createExportWrapper("iswblank", 1);
        var _iswdigit = Module["_iswdigit"] = createExportWrapper("iswdigit", 1);
        var _iswlower = Module["_iswlower"] = createExportWrapper("iswlower", 1);
        var _iswupper = Module["_iswupper"] = createExportWrapper("iswupper", 1);
        var _iswxdigit = Module["_iswxdigit"] = createExportWrapper("iswxdigit", 1);
        var _memchr = Module["_memchr"] = createExportWrapper("memchr", 3);
        var _emscripten_get_sbrk_ptr = createExportWrapper("emscripten_get_sbrk_ptr", 0);
        var _sbrk = createExportWrapper("sbrk", 1);
        var _strcmp = Module["_strcmp"] = createExportWrapper("strcmp", 2);
        var _strncat = Module["_strncat"] = createExportWrapper("strncat", 3);
        var _strncpy = Module["_strncpy"] = createExportWrapper("strncpy", 3);
        var _towlower = Module["_towlower"] = createExportWrapper("towlower", 1);
        var _towupper = Module["_towupper"] = createExportWrapper("towupper", 1);
        var _setThrew = createExportWrapper("setThrew", 2);
        var _emscripten_stack_set_limits = (a0, a1) => (_emscripten_stack_set_limits = wasmExports["emscripten_stack_set_limits"])(a0, a1);
        var _emscripten_stack_get_free = () => (_emscripten_stack_get_free = wasmExports["emscripten_stack_get_free"])();
        var _emscripten_stack_get_base = () => (_emscripten_stack_get_base = wasmExports["emscripten_stack_get_base"])();
        var _emscripten_stack_get_end = () => (_emscripten_stack_get_end = wasmExports["emscripten_stack_get_end"])();
        var __emscripten_stack_restore = a0 => (__emscripten_stack_restore = wasmExports["_emscripten_stack_restore"])(a0);
        var __emscripten_stack_alloc = a0 => (__emscripten_stack_alloc = wasmExports["_emscripten_stack_alloc"])(a0);
        var _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports["emscripten_stack_get_current"])();
        var dynCall_jiji = Module["dynCall_jiji"] = createExportWrapper("dynCall_jiji", 5);
        var _orig$ts_parser_timeout_micros = Module["_orig$ts_parser_timeout_micros"] = createExportWrapper("orig$ts_parser_timeout_micros", 1);
        var _orig$ts_parser_set_timeout_micros = Module["_orig$ts_parser_set_timeout_micros"] = createExportWrapper("orig$ts_parser_set_timeout_micros", 2);
        // include: postamble.js
        // === Auto-generated postamble setup entry stuff ===
        Module["AsciiToString"] = AsciiToString;
        Module["stringToUTF16"] = stringToUTF16;
        var missingLibrarySymbols = [ "writeI53ToI64", "writeI53ToI64Clamped", "writeI53ToI64Signaling", "writeI53ToU64Clamped", "writeI53ToU64Signaling", "readI53FromI64", "readI53FromU64", "convertI32PairToI53", "convertU32PairToI53", "getTempRet0", "setTempRet0", "isLeapYear", "ydayFromDate", "arraySum", "addDays", "strError", "inetPton4", "inetNtop4", "inetPton6", "inetNtop6", "readSockaddr", "writeSockaddr", "initRandomFill", "randomFill", "emscriptenLog", "readEmAsmArgs", "runEmAsmFunction", "runMainThreadEmAsm", "jstoi_q", "getExecutableName", "listenOnce", "autoResumeAudioContext", "getDynCaller", "runtimeKeepalivePush", "runtimeKeepalivePop", "callUserCallback", "maybeExit", "asmjsMangle", "mmapAlloc", "HandleAllocator", "getNativeTypeSize", "STACK_SIZE", "STACK_ALIGN", "POINTER_SIZE", "ASSERTIONS", "getCFunc", "ccall", "cwrap", "removeFunction", "reallyNegative", "strLen", "reSign", "formatString", "intArrayFromString", "intArrayToString", "stringToAscii", "UTF16ToString", "lengthBytesUTF16", "UTF32ToString", "stringToUTF32", "lengthBytesUTF32", "stringToNewUTF8", "writeArrayToMemory", "registerKeyEventCallback", "maybeCStringToJsString", "findEventTarget", "getBoundingClientRect", "fillMouseEventData", "registerMouseEventCallback", "registerWheelEventCallback", "registerUiEventCallback", "registerFocusEventCallback", "fillDeviceOrientationEventData", "registerDeviceOrientationEventCallback", "fillDeviceMotionEventData", "registerDeviceMotionEventCallback", "screenOrientation", "fillOrientationChangeEventData", "registerOrientationChangeEventCallback", "fillFullscreenChangeEventData", "registerFullscreenChangeEventCallback", "JSEvents_requestFullscreen", "JSEvents_resizeCanvasForFullscreen", "registerRestoreOldStyle", "hideEverythingExceptGivenElement", "restoreHiddenElements", "setLetterbox", "softFullscreenResizeWebGLRenderTarget", "doRequestFullscreen", "fillPointerlockChangeEventData", "registerPointerlockChangeEventCallback", "registerPointerlockErrorEventCallback", "requestPointerLock", "fillVisibilityChangeEventData", "registerVisibilityChangeEventCallback", "registerTouchEventCallback", "fillGamepadEventData", "registerGamepadEventCallback", "registerBeforeUnloadEventCallback", "fillBatteryEventData", "battery", "registerBatteryEventCallback", "setCanvasElementSize", "getCanvasElementSize", "jsStackTrace", "getCallstack", "convertPCtoSourceLocation", "getEnvStrings", "checkWasiClock", "wasiRightsToMuslOFlags", "wasiOFlagsToMuslOFlags", "createDyncallWrapper", "safeSetTimeout", "setImmediateWrapped", "clearImmediateWrapped", "polyfillSetImmediate", "getPromise", "makePromise", "idsToPromises", "makePromiseCallback", "Browser_asyncPrepareDataCounter", "setMainLoop", "getSocketFromFD", "getSocketAddress", "dlopenInternal", "heapObjectForWebGLType", "toTypedArrayIndex", "webgl_enable_ANGLE_instanced_arrays", "webgl_enable_OES_vertex_array_object", "webgl_enable_WEBGL_draw_buffers", "webgl_enable_WEBGL_multi_draw", "emscriptenWebGLGet", "computeUnpackAlignedImageSize", "colorChannelsInGlTextureFormat", "emscriptenWebGLGetTexPixelData", "emscriptenWebGLGetUniform", "webglGetUniformLocation", "webglPrepareUniformLocationsBeforeFirstUse", "webglGetLeftBracePos", "emscriptenWebGLGetVertexAttrib", "__glGetActiveAttribOrUniform", "writeGLArray", "registerWebGlEventCallback", "runAndAbortIfError", "ALLOC_NORMAL", "ALLOC_STACK", "allocate", "writeStringToMemory", "writeAsciiToMemory", "setErrNo", "demangle", "stackTrace" ];
        missingLibrarySymbols.forEach(missingLibrarySymbol);
        var unexportedSymbols = [ "run", "addOnPreRun", "addOnInit", "addOnPreMain", "addOnExit", "addOnPostRun", "addRunDependency", "removeRunDependency", "out", "err", "callMain", "abort", "wasmMemory", "wasmExports", "writeStackCookie", "checkStackCookie", "convertI32PairToI53Checked", "stackSave", "stackRestore", "stackAlloc", "ptrToString", "zeroMemory", "exitJS", "getHeapMax", "growMemory", "ENV", "MONTH_DAYS_REGULAR", "MONTH_DAYS_LEAP", "MONTH_DAYS_REGULAR_CUMULATIVE", "MONTH_DAYS_LEAP_CUMULATIVE", "ERRNO_CODES", "DNS", "Protocols", "Sockets", "timers", "warnOnce", "readEmAsmArgsArray", "jstoi_s", "dynCallLegacy", "dynCall", "handleException", "keepRuntimeAlive", "asyncLoad", "alignMemory", "wasmTable", "noExitRuntime", "uleb128Encode", "sigToWasmTypes", "generateFuncType", "convertJsFunctionToWasm", "freeTableIndexes", "functionsInTableMap", "getEmptyTableSlot", "updateTableMap", "getFunctionAddress", "addFunction", "unSign", "setValue", "getValue", "PATH", "PATH_FS", "UTF8Decoder", "UTF8ArrayToString", "UTF8ToString", "stringToUTF8Array", "stringToUTF8", "lengthBytesUTF8", "UTF16Decoder", "stringToUTF8OnStack", "JSEvents", "specialHTMLTargets", "findCanvasEventTarget", "currentFullscreenStrategy", "restoreOldWindowedStyle", "UNWIND_CACHE", "ExitStatus", "flush_NO_FILESYSTEM", "promiseMap", "Browser", "getPreloadedImageData__data", "wget", "SYSCALLS", "isSymbolDefined", "GOT", "currentModuleWeakSymbols", "LDSO", "getMemory", "mergeLibSymbols", "loadWebAssemblyModule", "newDSO", "loadDynamicLibrary", "tempFixedLengthArray", "miniTempWebGLFloatBuffers", "miniTempWebGLIntBuffers", "GL", "AL", "GLUT", "EGL", "GLEW", "IDBStore", "SDL", "SDL_gfx", "allocateUTF8", "allocateUTF8OnStack", "print", "printErr", "LE_HEAP_STORE_U16", "LE_HEAP_STORE_I16", "LE_HEAP_STORE_U32", "LE_HEAP_STORE_I32", "LE_HEAP_STORE_F32", "LE_HEAP_STORE_F64", "LE_HEAP_LOAD_U16", "LE_HEAP_LOAD_I16", "LE_HEAP_LOAD_U32", "LE_HEAP_LOAD_I32", "LE_HEAP_LOAD_F32", "LE_HEAP_LOAD_F64" ];
        unexportedSymbols.forEach(unexportedRuntimeSymbol);
        var calledRun;
        dependenciesFulfilled = function runCaller() {
          // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
          if (!calledRun) run();
          if (!calledRun) dependenciesFulfilled = runCaller;
        };
        // try this again later, after new deps are fulfilled
        function callMain(args = []) {
          assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on Module["onRuntimeInitialized"])');
          assert(__ATPRERUN__.length == 0, "cannot call main when preRun functions remain to be called");
          var entryFunction = resolveGlobalSymbol("main").sym;
          // Main modules can't tell if they have main() at compile time, since it may
          // arrive from a dynamic library.
          if (!entryFunction) return;
          args.unshift(thisProgram);
          var argc = args.length;
          var argv = stackAlloc((argc + 1) * 4);
          var argv_ptr = argv;
          args.forEach(arg => {
            LE_HEAP_STORE_U32(((argv_ptr) >> 2) * 4, stringToUTF8OnStack(arg));
            argv_ptr += 4;
          });
          LE_HEAP_STORE_U32(((argv_ptr) >> 2) * 4, 0);
          try {
            var ret = entryFunction(argc, argv);
            // if we're not running an evented main loop, it's time to exit
            exitJS(ret, /* implicit = */ true);
            return ret;
          } catch (e) {
            return handleException(e);
          }
        }
        function stackCheckInit() {
          // This is normally called automatically during __wasm_call_ctors but need to
          // get these values before even running any of the ctors so we call it redundantly
          // here.
          _emscripten_stack_set_limits(78144, 12608);
          // TODO(sbc): Move writeStackCookie to native to to avoid this.
          writeStackCookie();
        }
        function run(args = arguments_) {
          if (runDependencies > 0) {
            return;
          }
          stackCheckInit();
          preRun();
          // a preRun added a dependency, run will be called later
          if (runDependencies > 0) {
            return;
          }
          function doRun() {
            // run may have just been called through dependencies being fulfilled just in this very frame,
            // or while the async setStatus time below was happening
            if (calledRun) return;
            calledRun = true;
            Module["calledRun"] = true;
            if (ABORT) return;
            initRuntime();
            preMain();
            Module["onRuntimeInitialized"]?.();
            if (shouldRunNow) callMain(args);
            postRun();
          }
          if (Module["setStatus"]) {
            Module["setStatus"]("Running...");
            setTimeout(function() {
              setTimeout(function() {
                Module["setStatus"]("");
              }, 1);
              doRun();
            }, 1);
          } else {
            doRun();
          }
          checkStackCookie();
        }
        function checkUnflushedContent() {
          // Compiler settings do not allow exiting the runtime, so flushing
          // the streams is not possible. but in ASSERTIONS mode we check
          // if there was something to flush, and if so tell the user they
          // should request that the runtime be exitable.
          // Normally we would not even include flush() at all, but in ASSERTIONS
          // builds we do so just for this check, and here we see if there is any
          // content to flush, that is, we check if there would have been
          // something a non-ASSERTIONS build would have not seen.
          // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
          // mode (which has its own special function for this; otherwise, all
          // the code is inside libc)
          var oldOut = out;
          var oldErr = err;
          var has = false;
          out = err = x => {
            has = true;
          };
          try {
            // it doesn't matter if it fails
            flush_NO_FILESYSTEM();
          } catch (e) {}
          out = oldOut;
          err = oldErr;
          if (has) {
            warnOnce("stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the Emscripten FAQ), or make sure to emit a newline when you printf etc.");
            warnOnce("(this may also be due to not including full filesystem support - try building with -sFORCE_FILESYSTEM)");
          }
        }
        if (Module["preInit"]) {
          if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
          while (Module["preInit"].length > 0) {
            Module["preInit"].pop()();
          }
        }
        // shouldRunNow refers to calling main(), not run().
        var shouldRunNow = true;
        if (Module["noInitialRun"]) shouldRunNow = false;
        run();
        // end include: postamble.js
        // include: /home/user/src/ts-playground-setup/tree-sitter/lib/binding_web/binding.js
        /* eslint-disable-next-line spaced-comment */ /// <reference types="emscripten" />
        /* eslint-disable-next-line spaced-comment */ /// <reference path="tree-sitter-web.d.ts"/>
        const C = Module;
        const INTERNAL = {};
        const SIZE_OF_INT = 4;
        const SIZE_OF_CURSOR = 4 * SIZE_OF_INT;
        const SIZE_OF_NODE = 5 * SIZE_OF_INT;
        const SIZE_OF_POINT = 2 * SIZE_OF_INT;
        const SIZE_OF_RANGE = 2 * SIZE_OF_INT + 2 * SIZE_OF_POINT;
        const ZERO_POINT = {
          row: 0,
          column: 0
        };
        const QUERY_WORD_REGEX = /[\w-.]*/g;
        const PREDICATE_STEP_TYPE_CAPTURE = 1;
        const PREDICATE_STEP_TYPE_STRING = 2;
        const LANGUAGE_FUNCTION_REGEX = /^_?tree_sitter_\w+/;
        let VERSION;
        let MIN_COMPATIBLE_VERSION;
        let TRANSFER_BUFFER;
        let currentParseCallback;
        // eslint-disable-next-line no-unused-vars
        let currentLogCallback;
        // eslint-disable-next-line no-unused-vars
        class ParserImpl {
          static init() {
            TRANSFER_BUFFER = C._ts_init();
            VERSION = getValue(TRANSFER_BUFFER, "i32");
            MIN_COMPATIBLE_VERSION = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
          }
          initialize() {
            C._ts_parser_new_wasm();
            this[0] = getValue(TRANSFER_BUFFER, "i32");
            this[1] = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
          }
          delete() {
            C._ts_parser_delete(this[0]);
            C._free(this[1]);
            this[0] = 0;
            this[1] = 0;
          }
          setLanguage(language) {
            let address;
            if (!language) {
              address = 0;
              language = null;
            } else if (language.constructor === Language) {
              address = language[0];
              const version = C._ts_language_version(address);
              if (version < MIN_COMPATIBLE_VERSION || VERSION < version) {
                throw new Error(`Incompatible language version ${version}. ` + `Compatibility range ${MIN_COMPATIBLE_VERSION} through ${VERSION}.`);
              }
            } else {
              throw new Error("Argument must be a Language");
            }
            this.language = language;
            C._ts_parser_set_language(this[0], address);
            return this;
          }
          getLanguage() {
            return this.language;
          }
          parse(callback, oldTree, options) {
            if (typeof callback === "string") {
              currentParseCallback = (index, _) => callback.slice(index);
            } else if (typeof callback === "function") {
              currentParseCallback = callback;
            } else {
              throw new Error("Argument must be a string or a function");
            }
            if (this.logCallback) {
              currentLogCallback = this.logCallback;
              C._ts_parser_enable_logger_wasm(this[0], 1);
            } else {
              currentLogCallback = null;
              C._ts_parser_enable_logger_wasm(this[0], 0);
            }
            let rangeCount = 0;
            let rangeAddress = 0;
            if (options?.includedRanges) {
              rangeCount = options.includedRanges.length;
              rangeAddress = C._calloc(rangeCount, SIZE_OF_RANGE);
              let address = rangeAddress;
              for (let i = 0; i < rangeCount; i++) {
                marshalRange(address, options.includedRanges[i]);
                address += SIZE_OF_RANGE;
              }
            }
            const treeAddress = C._ts_parser_parse_wasm(this[0], this[1], oldTree ? oldTree[0] : 0, rangeAddress, rangeCount);
            if (!treeAddress) {
              currentParseCallback = null;
              currentLogCallback = null;
              throw new Error("Parsing failed");
            }
            const result = new Tree(INTERNAL, treeAddress, this.language, currentParseCallback);
            currentParseCallback = null;
            currentLogCallback = null;
            return result;
          }
          reset() {
            C._ts_parser_reset(this[0]);
          }
          getIncludedRanges() {
            C._ts_parser_included_ranges_wasm(this[0]);
            const count = getValue(TRANSFER_BUFFER, "i32");
            const buffer = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
            const result = new Array(count);
            if (count > 0) {
              let address = buffer;
              for (let i = 0; i < count; i++) {
                result[i] = unmarshalRange(address);
                address += SIZE_OF_RANGE;
              }
              C._free(buffer);
            }
            return result;
          }
          getTimeoutMicros() {
            return C._ts_parser_timeout_micros(this[0]);
          }
          setTimeoutMicros(timeout) {
            C._ts_parser_set_timeout_micros(this[0], timeout);
          }
          setLogger(callback) {
            if (!callback) {
              callback = null;
            } else if (typeof callback !== "function") {
              throw new Error("Logger callback must be a function");
            }
            this.logCallback = callback;
            return this;
          }
          getLogger() {
            return this.logCallback;
          }
        }
        class Tree {
          constructor(internal, address, language, textCallback) {
            assertInternal(internal);
            this[0] = address;
            this.language = language;
            this.textCallback = textCallback;
          }
          copy() {
            const address = C._ts_tree_copy(this[0]);
            return new Tree(INTERNAL, address, this.language, this.textCallback);
          }
          delete() {
            C._ts_tree_delete(this[0]);
            this[0] = 0;
          }
          edit(edit) {
            marshalEdit(edit);
            C._ts_tree_edit_wasm(this[0]);
          }
          get rootNode() {
            C._ts_tree_root_node_wasm(this[0]);
            return unmarshalNode(this);
          }
          rootNodeWithOffset(offsetBytes, offsetExtent) {
            const address = TRANSFER_BUFFER + SIZE_OF_NODE;
            setValue(address, offsetBytes, "i32");
            marshalPoint(address + SIZE_OF_INT, offsetExtent);
            C._ts_tree_root_node_with_offset_wasm(this[0]);
            return unmarshalNode(this);
          }
          getLanguage() {
            return this.language;
          }
          walk() {
            return this.rootNode.walk();
          }
          getChangedRanges(other) {
            if (other.constructor !== Tree) {
              throw new TypeError("Argument must be a Tree");
            }
            C._ts_tree_get_changed_ranges_wasm(this[0], other[0]);
            const count = getValue(TRANSFER_BUFFER, "i32");
            const buffer = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
            const result = new Array(count);
            if (count > 0) {
              let address = buffer;
              for (let i = 0; i < count; i++) {
                result[i] = unmarshalRange(address);
                address += SIZE_OF_RANGE;
              }
              C._free(buffer);
            }
            return result;
          }
          getIncludedRanges() {
            C._ts_tree_included_ranges_wasm(this[0]);
            const count = getValue(TRANSFER_BUFFER, "i32");
            const buffer = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
            const result = new Array(count);
            if (count > 0) {
              let address = buffer;
              for (let i = 0; i < count; i++) {
                result[i] = unmarshalRange(address);
                address += SIZE_OF_RANGE;
              }
              C._free(buffer);
            }
            return result;
          }
        }
        class Node {
          constructor(internal, tree) {
            assertInternal(internal);
            this.tree = tree;
          }
          get typeId() {
            marshalNode(this);
            return C._ts_node_symbol_wasm(this.tree[0]);
          }
          get grammarId() {
            marshalNode(this);
            return C._ts_node_grammar_symbol_wasm(this.tree[0]);
          }
          get type() {
            return this.tree.language.types[this.typeId] || "ERROR";
          }
          get grammarType() {
            return this.tree.language.types[this.grammarId] || "ERROR";
          }
          get endPosition() {
            marshalNode(this);
            C._ts_node_end_point_wasm(this.tree[0]);
            return unmarshalPoint(TRANSFER_BUFFER);
          }
          get endIndex() {
            marshalNode(this);
            return C._ts_node_end_index_wasm(this.tree[0]);
          }
          get text() {
            return getText(this.tree, this.startIndex, this.endIndex);
          }
          get parseState() {
            marshalNode(this);
            return C._ts_node_parse_state_wasm(this.tree[0]);
          }
          get nextParseState() {
            marshalNode(this);
            return C._ts_node_next_parse_state_wasm(this.tree[0]);
          }
          get isNamed() {
            marshalNode(this);
            return C._ts_node_is_named_wasm(this.tree[0]) === 1;
          }
          get hasError() {
            marshalNode(this);
            return C._ts_node_has_error_wasm(this.tree[0]) === 1;
          }
          get hasChanges() {
            marshalNode(this);
            return C._ts_node_has_changes_wasm(this.tree[0]) === 1;
          }
          get isError() {
            marshalNode(this);
            return C._ts_node_is_error_wasm(this.tree[0]) === 1;
          }
          get isMissing() {
            marshalNode(this);
            return C._ts_node_is_missing_wasm(this.tree[0]) === 1;
          }
          get isExtra() {
            marshalNode(this);
            return C._ts_node_is_extra_wasm(this.tree[0]) === 1;
          }
          equals(other) {
            return this.id === other.id;
          }
          child(index) {
            marshalNode(this);
            C._ts_node_child_wasm(this.tree[0], index);
            return unmarshalNode(this.tree);
          }
          namedChild(index) {
            marshalNode(this);
            C._ts_node_named_child_wasm(this.tree[0], index);
            return unmarshalNode(this.tree);
          }
          childForFieldId(fieldId) {
            marshalNode(this);
            C._ts_node_child_by_field_id_wasm(this.tree[0], fieldId);
            return unmarshalNode(this.tree);
          }
          childForFieldName(fieldName) {
            const fieldId = this.tree.language.fields.indexOf(fieldName);
            if (fieldId !== -1) return this.childForFieldId(fieldId);
            return null;
          }
          fieldNameForChild(index) {
            marshalNode(this);
            const address = C._ts_node_field_name_for_child_wasm(this.tree[0], index);
            if (!address) {
              return null;
            }
            const result = AsciiToString(address);
            // must not free, the string memory is owned by the language
            return result;
          }
          childrenForFieldName(fieldName) {
            const fieldId = this.tree.language.fields.indexOf(fieldName);
            if (fieldId !== -1 && fieldId !== 0) return this.childrenForFieldId(fieldId);
            return [];
          }
          childrenForFieldId(fieldId) {
            marshalNode(this);
            C._ts_node_children_by_field_id_wasm(this.tree[0], fieldId);
            const count = getValue(TRANSFER_BUFFER, "i32");
            const buffer = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
            const result = new Array(count);
            if (count > 0) {
              let address = buffer;
              for (let i = 0; i < count; i++) {
                result[i] = unmarshalNode(this.tree, address);
                address += SIZE_OF_NODE;
              }
              C._free(buffer);
            }
            return result;
          }
          firstChildForIndex(index) {
            marshalNode(this);
            const address = TRANSFER_BUFFER + SIZE_OF_NODE;
            setValue(address, index, "i32");
            C._ts_node_first_child_for_byte_wasm(this.tree[0]);
            return unmarshalNode(this.tree);
          }
          firstNamedChildForIndex(index) {
            marshalNode(this);
            const address = TRANSFER_BUFFER + SIZE_OF_NODE;
            setValue(address, index, "i32");
            C._ts_node_first_named_child_for_byte_wasm(this.tree[0]);
            return unmarshalNode(this.tree);
          }
          get childCount() {
            marshalNode(this);
            return C._ts_node_child_count_wasm(this.tree[0]);
          }
          get namedChildCount() {
            marshalNode(this);
            return C._ts_node_named_child_count_wasm(this.tree[0]);
          }
          get firstChild() {
            return this.child(0);
          }
          get firstNamedChild() {
            return this.namedChild(0);
          }
          get lastChild() {
            return this.child(this.childCount - 1);
          }
          get lastNamedChild() {
            return this.namedChild(this.namedChildCount - 1);
          }
          get children() {
            if (!this._children) {
              marshalNode(this);
              C._ts_node_children_wasm(this.tree[0]);
              const count = getValue(TRANSFER_BUFFER, "i32");
              const buffer = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
              this._children = new Array(count);
              if (count > 0) {
                let address = buffer;
                for (let i = 0; i < count; i++) {
                  this._children[i] = unmarshalNode(this.tree, address);
                  address += SIZE_OF_NODE;
                }
                C._free(buffer);
              }
            }
            return this._children;
          }
          get namedChildren() {
            if (!this._namedChildren) {
              marshalNode(this);
              C._ts_node_named_children_wasm(this.tree[0]);
              const count = getValue(TRANSFER_BUFFER, "i32");
              const buffer = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
              this._namedChildren = new Array(count);
              if (count > 0) {
                let address = buffer;
                for (let i = 0; i < count; i++) {
                  this._namedChildren[i] = unmarshalNode(this.tree, address);
                  address += SIZE_OF_NODE;
                }
                C._free(buffer);
              }
            }
            return this._namedChildren;
          }
          descendantsOfType(types, startPosition, endPosition) {
            if (!Array.isArray(types)) types = [ types ];
            if (!startPosition) startPosition = ZERO_POINT;
            if (!endPosition) endPosition = ZERO_POINT;
            // Convert the type strings to numeric type symbols.
            const symbols = [];
            const typesBySymbol = this.tree.language.types;
            for (let i = 0, n = typesBySymbol.length; i < n; i++) {
              if (types.includes(typesBySymbol[i])) {
                symbols.push(i);
              }
            }
            // Copy the array of symbols to the WASM heap.
            const symbolsAddress = C._malloc(SIZE_OF_INT * symbols.length);
            for (let i = 0, n = symbols.length; i < n; i++) {
              setValue(symbolsAddress + i * SIZE_OF_INT, symbols[i], "i32");
            }
            // Call the C API to compute the descendants.
            marshalNode(this);
            C._ts_node_descendants_of_type_wasm(this.tree[0], symbolsAddress, symbols.length, startPosition.row, startPosition.column, endPosition.row, endPosition.column);
            // Instantiate the nodes based on the data returned.
            const descendantCount = getValue(TRANSFER_BUFFER, "i32");
            const descendantAddress = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
            const result = new Array(descendantCount);
            if (descendantCount > 0) {
              let address = descendantAddress;
              for (let i = 0; i < descendantCount; i++) {
                result[i] = unmarshalNode(this.tree, address);
                address += SIZE_OF_NODE;
              }
            }
            // Free the intermediate buffers
            C._free(descendantAddress);
            C._free(symbolsAddress);
            return result;
          }
          get nextSibling() {
            marshalNode(this);
            C._ts_node_next_sibling_wasm(this.tree[0]);
            return unmarshalNode(this.tree);
          }
          get previousSibling() {
            marshalNode(this);
            C._ts_node_prev_sibling_wasm(this.tree[0]);
            return unmarshalNode(this.tree);
          }
          get nextNamedSibling() {
            marshalNode(this);
            C._ts_node_next_named_sibling_wasm(this.tree[0]);
            return unmarshalNode(this.tree);
          }
          get previousNamedSibling() {
            marshalNode(this);
            C._ts_node_prev_named_sibling_wasm(this.tree[0]);
            return unmarshalNode(this.tree);
          }
          get descendantCount() {
            marshalNode(this);
            return C._ts_node_descendant_count_wasm(this.tree[0]);
          }
          get parent() {
            marshalNode(this);
            C._ts_node_parent_wasm(this.tree[0]);
            return unmarshalNode(this.tree);
          }
          descendantForIndex(start, end = start) {
            if (typeof start !== "number" || typeof end !== "number") {
              throw new Error("Arguments must be numbers");
            }
            marshalNode(this);
            const address = TRANSFER_BUFFER + SIZE_OF_NODE;
            setValue(address, start, "i32");
            setValue(address + SIZE_OF_INT, end, "i32");
            C._ts_node_descendant_for_index_wasm(this.tree[0]);
            return unmarshalNode(this.tree);
          }
          namedDescendantForIndex(start, end = start) {
            if (typeof start !== "number" || typeof end !== "number") {
              throw new Error("Arguments must be numbers");
            }
            marshalNode(this);
            const address = TRANSFER_BUFFER + SIZE_OF_NODE;
            setValue(address, start, "i32");
            setValue(address + SIZE_OF_INT, end, "i32");
            C._ts_node_named_descendant_for_index_wasm(this.tree[0]);
            return unmarshalNode(this.tree);
          }
          descendantForPosition(start, end = start) {
            if (!isPoint(start) || !isPoint(end)) {
              throw new Error("Arguments must be {row, column} objects");
            }
            marshalNode(this);
            const address = TRANSFER_BUFFER + SIZE_OF_NODE;
            marshalPoint(address, start);
            marshalPoint(address + SIZE_OF_POINT, end);
            C._ts_node_descendant_for_position_wasm(this.tree[0]);
            return unmarshalNode(this.tree);
          }
          namedDescendantForPosition(start, end = start) {
            if (!isPoint(start) || !isPoint(end)) {
              throw new Error("Arguments must be {row, column} objects");
            }
            marshalNode(this);
            const address = TRANSFER_BUFFER + SIZE_OF_NODE;
            marshalPoint(address, start);
            marshalPoint(address + SIZE_OF_POINT, end);
            C._ts_node_named_descendant_for_position_wasm(this.tree[0]);
            return unmarshalNode(this.tree);
          }
          walk() {
            marshalNode(this);
            C._ts_tree_cursor_new_wasm(this.tree[0]);
            return new TreeCursor(INTERNAL, this.tree);
          }
          toString() {
            marshalNode(this);
            const address = C._ts_node_to_string_wasm(this.tree[0]);
            const result = AsciiToString(address);
            C._free(address);
            return result;
          }
        }
        class TreeCursor {
          constructor(internal, tree) {
            assertInternal(internal);
            this.tree = tree;
            unmarshalTreeCursor(this);
          }
          delete() {
            marshalTreeCursor(this);
            C._ts_tree_cursor_delete_wasm(this.tree[0]);
            this[0] = this[1] = this[2] = 0;
          }
          reset(node) {
            marshalNode(node);
            marshalTreeCursor(this, TRANSFER_BUFFER + SIZE_OF_NODE);
            C._ts_tree_cursor_reset_wasm(this.tree[0]);
            unmarshalTreeCursor(this);
          }
          resetTo(cursor) {
            marshalTreeCursor(this, TRANSFER_BUFFER);
            marshalTreeCursor(cursor, TRANSFER_BUFFER + SIZE_OF_CURSOR);
            C._ts_tree_cursor_reset_to_wasm(this.tree[0], cursor.tree[0]);
            unmarshalTreeCursor(this);
          }
          get nodeType() {
            return this.tree.language.types[this.nodeTypeId] || "ERROR";
          }
          get nodeTypeId() {
            marshalTreeCursor(this);
            return C._ts_tree_cursor_current_node_type_id_wasm(this.tree[0]);
          }
          get nodeStateId() {
            marshalTreeCursor(this);
            return C._ts_tree_cursor_current_node_state_id_wasm(this.tree[0]);
          }
          get nodeId() {
            marshalTreeCursor(this);
            return C._ts_tree_cursor_current_node_id_wasm(this.tree[0]);
          }
          get nodeIsNamed() {
            marshalTreeCursor(this);
            return C._ts_tree_cursor_current_node_is_named_wasm(this.tree[0]) === 1;
          }
          get nodeIsMissing() {
            marshalTreeCursor(this);
            return C._ts_tree_cursor_current_node_is_missing_wasm(this.tree[0]) === 1;
          }
          get nodeText() {
            marshalTreeCursor(this);
            const startIndex = C._ts_tree_cursor_start_index_wasm(this.tree[0]);
            const endIndex = C._ts_tree_cursor_end_index_wasm(this.tree[0]);
            return getText(this.tree, startIndex, endIndex);
          }
          get startPosition() {
            marshalTreeCursor(this);
            C._ts_tree_cursor_start_position_wasm(this.tree[0]);
            return unmarshalPoint(TRANSFER_BUFFER);
          }
          get endPosition() {
            marshalTreeCursor(this);
            C._ts_tree_cursor_end_position_wasm(this.tree[0]);
            return unmarshalPoint(TRANSFER_BUFFER);
          }
          get startIndex() {
            marshalTreeCursor(this);
            return C._ts_tree_cursor_start_index_wasm(this.tree[0]);
          }
          get endIndex() {
            marshalTreeCursor(this);
            return C._ts_tree_cursor_end_index_wasm(this.tree[0]);
          }
          get currentNode() {
            marshalTreeCursor(this);
            C._ts_tree_cursor_current_node_wasm(this.tree[0]);
            return unmarshalNode(this.tree);
          }
          get currentFieldId() {
            marshalTreeCursor(this);
            return C._ts_tree_cursor_current_field_id_wasm(this.tree[0]);
          }
          get currentFieldName() {
            return this.tree.language.fields[this.currentFieldId];
          }
          get currentDepth() {
            marshalTreeCursor(this);
            return C._ts_tree_cursor_current_depth_wasm(this.tree[0]);
          }
          get currentDescendantIndex() {
            marshalTreeCursor(this);
            return C._ts_tree_cursor_current_descendant_index_wasm(this.tree[0]);
          }
          gotoFirstChild() {
            marshalTreeCursor(this);
            const result = C._ts_tree_cursor_goto_first_child_wasm(this.tree[0]);
            unmarshalTreeCursor(this);
            return result === 1;
          }
          gotoLastChild() {
            marshalTreeCursor(this);
            const result = C._ts_tree_cursor_goto_last_child_wasm(this.tree[0]);
            unmarshalTreeCursor(this);
            return result === 1;
          }
          gotoFirstChildForIndex(goalIndex) {
            marshalTreeCursor(this);
            setValue(TRANSFER_BUFFER + SIZE_OF_CURSOR, goalIndex, "i32");
            const result = C._ts_tree_cursor_goto_first_child_for_index_wasm(this.tree[0]);
            unmarshalTreeCursor(this);
            return result === 1;
          }
          gotoFirstChildForPosition(goalPosition) {
            marshalTreeCursor(this);
            marshalPoint(TRANSFER_BUFFER + SIZE_OF_CURSOR, goalPosition);
            const result = C._ts_tree_cursor_goto_first_child_for_position_wasm(this.tree[0]);
            unmarshalTreeCursor(this);
            return result === 1;
          }
          gotoNextSibling() {
            marshalTreeCursor(this);
            const result = C._ts_tree_cursor_goto_next_sibling_wasm(this.tree[0]);
            unmarshalTreeCursor(this);
            return result === 1;
          }
          gotoPreviousSibling() {
            marshalTreeCursor(this);
            const result = C._ts_tree_cursor_goto_previous_sibling_wasm(this.tree[0]);
            unmarshalTreeCursor(this);
            return result === 1;
          }
          gotoDescendant(goalDescendantindex) {
            marshalTreeCursor(this);
            C._ts_tree_cursor_goto_descendant_wasm(this.tree[0], goalDescendantindex);
            unmarshalTreeCursor(this);
          }
          gotoParent() {
            marshalTreeCursor(this);
            const result = C._ts_tree_cursor_goto_parent_wasm(this.tree[0]);
            unmarshalTreeCursor(this);
            return result === 1;
          }
        }
        class Language {
          constructor(internal, address) {
            assertInternal(internal);
            this[0] = address;
            this.types = new Array(C._ts_language_symbol_count(this[0]));
            for (let i = 0, n = this.types.length; i < n; i++) {
              if (C._ts_language_symbol_type(this[0], i) < 2) {
                this.types[i] = UTF8ToString(C._ts_language_symbol_name(this[0], i));
              }
            }
            this.fields = new Array(C._ts_language_field_count(this[0]) + 1);
            for (let i = 0, n = this.fields.length; i < n; i++) {
              const fieldName = C._ts_language_field_name_for_id(this[0], i);
              if (fieldName !== 0) {
                this.fields[i] = UTF8ToString(fieldName);
              } else {
                this.fields[i] = null;
              }
            }
          }
          get version() {
            return C._ts_language_version(this[0]);
          }
          get fieldCount() {
            return this.fields.length - 1;
          }
          get stateCount() {
            return C._ts_language_state_count(this[0]);
          }
          fieldIdForName(fieldName) {
            const result = this.fields.indexOf(fieldName);
            if (result !== -1) {
              return result;
            } else {
              return null;
            }
          }
          fieldNameForId(fieldId) {
            return this.fields[fieldId] || null;
          }
          idForNodeType(type, named) {
            const typeLength = lengthBytesUTF8(type);
            const typeAddress = C._malloc(typeLength + 1);
            stringToUTF8(type, typeAddress, typeLength + 1);
            const result = C._ts_language_symbol_for_name(this[0], typeAddress, typeLength, named);
            C._free(typeAddress);
            return result || null;
          }
          get nodeTypeCount() {
            return C._ts_language_symbol_count(this[0]);
          }
          nodeTypeForId(typeId) {
            const name = C._ts_language_symbol_name(this[0], typeId);
            return name ? UTF8ToString(name) : null;
          }
          nodeTypeIsNamed(typeId) {
            return C._ts_language_type_is_named_wasm(this[0], typeId) ? true : false;
          }
          nodeTypeIsVisible(typeId) {
            return C._ts_language_type_is_visible_wasm(this[0], typeId) ? true : false;
          }
          nextState(stateId, typeId) {
            return C._ts_language_next_state(this[0], stateId, typeId);
          }
          lookaheadIterator(stateId) {
            const address = C._ts_lookahead_iterator_new(this[0], stateId);
            if (address) return new LookaheadIterable(INTERNAL, address, this);
            return null;
          }
          query(source) {
            const sourceLength = lengthBytesUTF8(source);
            const sourceAddress = C._malloc(sourceLength + 1);
            stringToUTF8(source, sourceAddress, sourceLength + 1);
            const address = C._ts_query_new(this[0], sourceAddress, sourceLength, TRANSFER_BUFFER, TRANSFER_BUFFER + SIZE_OF_INT);
            if (!address) {
              const errorId = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
              const errorByte = getValue(TRANSFER_BUFFER, "i32");
              const errorIndex = UTF8ToString(sourceAddress, errorByte).length;
              const suffix = source.substr(errorIndex, 100).split("\n")[0];
              let word = suffix.match(QUERY_WORD_REGEX)[0];
              let error;
              switch (errorId) {
               case 2:
                error = new RangeError(`Bad node name '${word}'`);
                break;

               case 3:
                error = new RangeError(`Bad field name '${word}'`);
                break;

               case 4:
                error = new RangeError(`Bad capture name @${word}`);
                break;

               case 5:
                error = new TypeError(`Bad pattern structure at offset ${errorIndex}: '${suffix}'...`);
                word = "";
                break;

               default:
                error = new SyntaxError(`Bad syntax at offset ${errorIndex}: '${suffix}'...`);
                word = "";
                break;
              }
              error.index = errorIndex;
              error.length = word.length;
              C._free(sourceAddress);
              throw error;
            }
            const stringCount = C._ts_query_string_count(address);
            const captureCount = C._ts_query_capture_count(address);
            const patternCount = C._ts_query_pattern_count(address);
            const captureNames = new Array(captureCount);
            const stringValues = new Array(stringCount);
            for (let i = 0; i < captureCount; i++) {
              const nameAddress = C._ts_query_capture_name_for_id(address, i, TRANSFER_BUFFER);
              const nameLength = getValue(TRANSFER_BUFFER, "i32");
              captureNames[i] = UTF8ToString(nameAddress, nameLength);
            }
            for (let i = 0; i < stringCount; i++) {
              const valueAddress = C._ts_query_string_value_for_id(address, i, TRANSFER_BUFFER);
              const nameLength = getValue(TRANSFER_BUFFER, "i32");
              stringValues[i] = UTF8ToString(valueAddress, nameLength);
            }
            const setProperties = new Array(patternCount);
            const assertedProperties = new Array(patternCount);
            const refutedProperties = new Array(patternCount);
            const predicates = new Array(patternCount);
            const textPredicates = new Array(patternCount);
            for (let i = 0; i < patternCount; i++) {
              const predicatesAddress = C._ts_query_predicates_for_pattern(address, i, TRANSFER_BUFFER);
              const stepCount = getValue(TRANSFER_BUFFER, "i32");
              predicates[i] = [];
              textPredicates[i] = [];
              const steps = [];
              let stepAddress = predicatesAddress;
              for (let j = 0; j < stepCount; j++) {
                const stepType = getValue(stepAddress, "i32");
                stepAddress += SIZE_OF_INT;
                const stepValueId = getValue(stepAddress, "i32");
                stepAddress += SIZE_OF_INT;
                if (stepType === PREDICATE_STEP_TYPE_CAPTURE) {
                  steps.push({
                    type: "capture",
                    name: captureNames[stepValueId]
                  });
                } else if (stepType === PREDICATE_STEP_TYPE_STRING) {
                  steps.push({
                    type: "string",
                    value: stringValues[stepValueId]
                  });
                } else if (steps.length > 0) {
                  if (steps[0].type !== "string") {
                    throw new Error("Predicates must begin with a literal value");
                  }
                  const operator = steps[0].value;
                  let isPositive = true;
                  let matchAll = true;
                  let captureName;
                  switch (operator) {
                   case "any-not-eq?":
                   case "not-eq?":
                    isPositive = false;

                   case "any-eq?":
                   case "eq?":
                    if (steps.length !== 3) {
                      throw new Error(`Wrong number of arguments to \`#${operator}\` predicate. Expected 2, got ${steps.length - 1}`);
                    }
                    if (steps[1].type !== "capture") {
                      throw new Error(`First argument of \`#${operator}\` predicate must be a capture. Got "${steps[1].value}"`);
                    }
                    matchAll = !operator.startsWith("any-");
                    if (steps[2].type === "capture") {
                      const captureName1 = steps[1].name;
                      const captureName2 = steps[2].name;
                      textPredicates[i].push(captures => {
                        const nodes1 = [];
                        const nodes2 = [];
                        for (const c of captures) {
                          if (c.name === captureName1) nodes1.push(c.node);
                          if (c.name === captureName2) nodes2.push(c.node);
                        }
                        const compare = (n1, n2, positive) => positive ? n1.text === n2.text : n1.text !== n2.text;
                        return matchAll ? nodes1.every(n1 => nodes2.some(n2 => compare(n1, n2, isPositive))) : nodes1.some(n1 => nodes2.some(n2 => compare(n1, n2, isPositive)));
                      });
                    } else {
                      captureName = steps[1].name;
                      const stringValue = steps[2].value;
                      const matches = n => n.text === stringValue;
                      const doesNotMatch = n => n.text !== stringValue;
                      textPredicates[i].push(captures => {
                        const nodes = [];
                        for (const c of captures) {
                          if (c.name === captureName) nodes.push(c.node);
                        }
                        const test = isPositive ? matches : doesNotMatch;
                        return matchAll ? nodes.every(test) : nodes.some(test);
                      });
                    }
                    break;

                   case "any-not-match?":
                   case "not-match?":
                    isPositive = false;

                   case "any-match?":
                   case "match?":
                    if (steps.length !== 3) {
                      throw new Error(`Wrong number of arguments to \`#${operator}\` predicate. Expected 2, got ${steps.length - 1}.`);
                    }
                    if (steps[1].type !== "capture") {
                      throw new Error(`First argument of \`#${operator}\` predicate must be a capture. Got "${steps[1].value}".`);
                    }
                    if (steps[2].type !== "string") {
                      throw new Error(`Second argument of \`#${operator}\` predicate must be a string. Got @${steps[2].value}.`);
                    }
                    captureName = steps[1].name;
                    const regex = new RegExp(steps[2].value);
                    matchAll = !operator.startsWith("any-");
                    textPredicates[i].push(captures => {
                      const nodes = [];
                      for (const c of captures) {
                        if (c.name === captureName) nodes.push(c.node.text);
                      }
                      const test = (text, positive) => positive ? regex.test(text) : !regex.test(text);
                      if (nodes.length === 0) return !isPositive;
                      return matchAll ? nodes.every(text => test(text, isPositive)) : nodes.some(text => test(text, isPositive));
                    });
                    break;

                   case "set!":
                    if (steps.length < 2 || steps.length > 3) {
                      throw new Error(`Wrong number of arguments to \`#set!\` predicate. Expected 1 or 2. Got ${steps.length - 1}.`);
                    }
                    if (steps.some(s => s.type !== "string")) {
                      throw new Error(`Arguments to \`#set!\` predicate must be a strings.".`);
                    }
                    if (!setProperties[i]) setProperties[i] = {};
                    setProperties[i][steps[1].value] = steps[2] ? steps[2].value : null;
                    break;

                   case "is?":
                   case "is-not?":
                    if (steps.length < 2 || steps.length > 3) {
                      throw new Error(`Wrong number of arguments to \`#${operator}\` predicate. Expected 1 or 2. Got ${steps.length - 1}.`);
                    }
                    if (steps.some(s => s.type !== "string")) {
                      throw new Error(`Arguments to \`#${operator}\` predicate must be a strings.".`);
                    }
                    const properties = operator === "is?" ? assertedProperties : refutedProperties;
                    if (!properties[i]) properties[i] = {};
                    properties[i][steps[1].value] = steps[2] ? steps[2].value : null;
                    break;

                   case "not-any-of?":
                    isPositive = false;

                   case "any-of?":
                    if (steps.length < 2) {
                      throw new Error(`Wrong number of arguments to \`#${operator}\` predicate. Expected at least 1. Got ${steps.length - 1}.`);
                    }
                    if (steps[1].type !== "capture") {
                      throw new Error(`First argument of \`#${operator}\` predicate must be a capture. Got "${steps[1].value}".`);
                    }
                    for (let i = 2; i < steps.length; i++) {
                      if (steps[i].type !== "string") {
                        throw new Error(`Arguments to \`#${operator}\` predicate must be a strings.".`);
                      }
                    }
                    captureName = steps[1].name;
                    const values = steps.slice(2).map(s => s.value);
                    textPredicates[i].push(captures => {
                      const nodes = [];
                      for (const c of captures) {
                        if (c.name === captureName) nodes.push(c.node.text);
                      }
                      if (nodes.length === 0) return !isPositive;
                      return nodes.every(text => values.includes(text)) === isPositive;
                    });
                    break;

                   default:
                    predicates[i].push({
                      operator: operator,
                      operands: steps.slice(1)
                    });
                  }
                  steps.length = 0;
                }
              }
              Object.freeze(setProperties[i]);
              Object.freeze(assertedProperties[i]);
              Object.freeze(refutedProperties[i]);
            }
            C._free(sourceAddress);
            return new Query(INTERNAL, address, captureNames, textPredicates, predicates, Object.freeze(setProperties), Object.freeze(assertedProperties), Object.freeze(refutedProperties));
          }
          static load(input) {
            let bytes;
            if (input instanceof Uint8Array) {
              bytes = Promise.resolve(input);
            } else {
              const url = input;
              if (typeof process !== "undefined" && process.versions && process.versions.node) {
                const fs = require("fs");
                bytes = Promise.resolve(fs.readFileSync(url));
              } else {
                bytes = fetch(url).then(response => response.arrayBuffer().then(buffer => {
                  if (response.ok) {
                    return new Uint8Array(buffer);
                  } else {
                    const body = new TextDecoder("utf-8").decode(buffer);
                    throw new Error(`Language.load failed with status ${response.status}.\n\n${body}`);
                  }
                }));
              }
            }
            return bytes.then(bytes => loadWebAssemblyModule(bytes, {
              loadAsync: true
            })).then(mod => {
              const symbolNames = Object.keys(mod);
              const functionName = symbolNames.find(key => LANGUAGE_FUNCTION_REGEX.test(key) && !key.includes("external_scanner_"));
              if (!functionName) {
                console.log(`Couldn't find language function in WASM file. Symbols:\n${JSON.stringify(symbolNames, null, 2)}`);
              }
              const languageAddress = mod[functionName]();
              return new Language(INTERNAL, languageAddress);
            });
          }
        }
        class LookaheadIterable {
          constructor(internal, address, language) {
            assertInternal(internal);
            this[0] = address;
            this.language = language;
          }
          get currentTypeId() {
            return C._ts_lookahead_iterator_current_symbol(this[0]);
          }
          get currentType() {
            return this.language.types[this.currentTypeId] || "ERROR";
          }
          delete() {
            C._ts_lookahead_iterator_delete(this[0]);
            this[0] = 0;
          }
          resetState(stateId) {
            return C._ts_lookahead_iterator_reset_state(this[0], stateId);
          }
          reset(language, stateId) {
            if (C._ts_lookahead_iterator_reset(this[0], language[0], stateId)) {
              this.language = language;
              return true;
            }
            return false;
          }
          [Symbol.iterator]() {
            const self = this;
            return {
              next() {
                if (C._ts_lookahead_iterator_next(self[0])) {
                  return {
                    done: false,
                    value: self.currentType
                  };
                }
                return {
                  done: true,
                  value: ""
                };
              }
            };
          }
        }
        class Query {
          constructor(internal, address, captureNames, textPredicates, predicates, setProperties, assertedProperties, refutedProperties) {
            assertInternal(internal);
            this[0] = address;
            this.captureNames = captureNames;
            this.textPredicates = textPredicates;
            this.predicates = predicates;
            this.setProperties = setProperties;
            this.assertedProperties = assertedProperties;
            this.refutedProperties = refutedProperties;
            this.exceededMatchLimit = false;
          }
          delete() {
            C._ts_query_delete(this[0]);
            this[0] = 0;
          }
          matches(node, {startPosition: startPosition = ZERO_POINT, endPosition: endPosition = ZERO_POINT, startIndex: startIndex = 0, endIndex: endIndex = 0, matchLimit: matchLimit = 4294967295, maxStartDepth: maxStartDepth = 4294967295} = {}) {
            if (typeof matchLimit !== "number") {
              throw new Error("Arguments must be numbers");
            }
            marshalNode(node);
            C._ts_query_matches_wasm(this[0], node.tree[0], startPosition.row, startPosition.column, endPosition.row, endPosition.column, startIndex, endIndex, matchLimit, maxStartDepth);
            const rawCount = getValue(TRANSFER_BUFFER, "i32");
            const startAddress = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
            const didExceedMatchLimit = getValue(TRANSFER_BUFFER + 2 * SIZE_OF_INT, "i32");
            const result = new Array(rawCount);
            this.exceededMatchLimit = Boolean(didExceedMatchLimit);
            let filteredCount = 0;
            let address = startAddress;
            for (let i = 0; i < rawCount; i++) {
              const pattern = getValue(address, "i32");
              address += SIZE_OF_INT;
              const captureCount = getValue(address, "i32");
              address += SIZE_OF_INT;
              const captures = new Array(captureCount);
              address = unmarshalCaptures(this, node.tree, address, captures);
              if (this.textPredicates[pattern].every(p => p(captures))) {
                result[filteredCount] = {
                  pattern: pattern,
                  captures: captures
                };
                const setProperties = this.setProperties[pattern];
                if (setProperties) result[filteredCount].setProperties = setProperties;
                const assertedProperties = this.assertedProperties[pattern];
                if (assertedProperties) result[filteredCount].assertedProperties = assertedProperties;
                const refutedProperties = this.refutedProperties[pattern];
                if (refutedProperties) result[filteredCount].refutedProperties = refutedProperties;
                filteredCount++;
              }
            }
            result.length = filteredCount;
            C._free(startAddress);
            return result;
          }
          captures(node, {startPosition: startPosition = ZERO_POINT, endPosition: endPosition = ZERO_POINT, startIndex: startIndex = 0, endIndex: endIndex = 0, matchLimit: matchLimit = 4294967295, maxStartDepth: maxStartDepth = 4294967295} = {}) {
            if (typeof matchLimit !== "number") {
              throw new Error("Arguments must be numbers");
            }
            marshalNode(node);
            C._ts_query_captures_wasm(this[0], node.tree[0], startPosition.row, startPosition.column, endPosition.row, endPosition.column, startIndex, endIndex, matchLimit, maxStartDepth);
            const count = getValue(TRANSFER_BUFFER, "i32");
            const startAddress = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
            const didExceedMatchLimit = getValue(TRANSFER_BUFFER + 2 * SIZE_OF_INT, "i32");
            const result = [];
            this.exceededMatchLimit = Boolean(didExceedMatchLimit);
            const captures = [];
            let address = startAddress;
            for (let i = 0; i < count; i++) {
              const pattern = getValue(address, "i32");
              address += SIZE_OF_INT;
              const captureCount = getValue(address, "i32");
              address += SIZE_OF_INT;
              const captureIndex = getValue(address, "i32");
              address += SIZE_OF_INT;
              captures.length = captureCount;
              address = unmarshalCaptures(this, node.tree, address, captures);
              if (this.textPredicates[pattern].every(p => p(captures))) {
                const capture = captures[captureIndex];
                const setProperties = this.setProperties[pattern];
                if (setProperties) capture.setProperties = setProperties;
                const assertedProperties = this.assertedProperties[pattern];
                if (assertedProperties) capture.assertedProperties = assertedProperties;
                const refutedProperties = this.refutedProperties[pattern];
                if (refutedProperties) capture.refutedProperties = refutedProperties;
                result.push(capture);
              }
            }
            C._free(startAddress);
            return result;
          }
          predicatesForPattern(patternIndex) {
            return this.predicates[patternIndex];
          }
          disableCapture(captureName) {
            const captureNameLength = lengthBytesUTF8(captureName);
            const captureNameAddress = C._malloc(captureNameLength + 1);
            stringToUTF8(captureName, captureNameAddress, captureNameLength + 1);
            C._ts_query_disable_capture(this[0], captureNameAddress, captureNameLength);
            C._free(captureNameAddress);
          }
          didExceedMatchLimit() {
            return this.exceededMatchLimit;
          }
        }
        function getText(tree, startIndex, endIndex) {
          const length = endIndex - startIndex;
          let result = tree.textCallback(startIndex, null, endIndex);
          startIndex += result.length;
          while (startIndex < endIndex) {
            const string = tree.textCallback(startIndex, null, endIndex);
            if (string && string.length > 0) {
              startIndex += string.length;
              result += string;
            } else {
              break;
            }
          }
          if (startIndex > endIndex) {
            result = result.slice(0, length);
          }
          return result;
        }
        function unmarshalCaptures(query, tree, address, result) {
          for (let i = 0, n = result.length; i < n; i++) {
            const captureIndex = getValue(address, "i32");
            address += SIZE_OF_INT;
            const node = unmarshalNode(tree, address);
            address += SIZE_OF_NODE;
            result[i] = {
              name: query.captureNames[captureIndex],
              node: node
            };
          }
          return address;
        }
        function assertInternal(x) {
          if (x !== INTERNAL) throw new Error("Illegal constructor");
        }
        function isPoint(point) {
          return (point && typeof point.row === "number" && typeof point.column === "number");
        }
        function marshalNode(node) {
          let address = TRANSFER_BUFFER;
          setValue(address, node.id, "i32");
          address += SIZE_OF_INT;
          setValue(address, node.startIndex, "i32");
          address += SIZE_OF_INT;
          setValue(address, node.startPosition.row, "i32");
          address += SIZE_OF_INT;
          setValue(address, node.startPosition.column, "i32");
          address += SIZE_OF_INT;
          setValue(address, node[0], "i32");
        }
        function unmarshalNode(tree, address = TRANSFER_BUFFER) {
          const id = getValue(address, "i32");
          address += SIZE_OF_INT;
          if (id === 0) return null;
          const index = getValue(address, "i32");
          address += SIZE_OF_INT;
          const row = getValue(address, "i32");
          address += SIZE_OF_INT;
          const column = getValue(address, "i32");
          address += SIZE_OF_INT;
          const other = getValue(address, "i32");
          const result = new Node(INTERNAL, tree);
          result.id = id;
          result.startIndex = index;
          result.startPosition = {
            row: row,
            column: column
          };
          result[0] = other;
          return result;
        }
        function marshalTreeCursor(cursor, address = TRANSFER_BUFFER) {
          setValue(address + 0 * SIZE_OF_INT, cursor[0], "i32");
          setValue(address + 1 * SIZE_OF_INT, cursor[1], "i32");
          setValue(address + 2 * SIZE_OF_INT, cursor[2], "i32");
          setValue(address + 3 * SIZE_OF_INT, cursor[3], "i32");
        }
        function unmarshalTreeCursor(cursor) {
          cursor[0] = getValue(TRANSFER_BUFFER + 0 * SIZE_OF_INT, "i32");
          cursor[1] = getValue(TRANSFER_BUFFER + 1 * SIZE_OF_INT, "i32");
          cursor[2] = getValue(TRANSFER_BUFFER + 2 * SIZE_OF_INT, "i32");
          cursor[3] = getValue(TRANSFER_BUFFER + 3 * SIZE_OF_INT, "i32");
        }
        function marshalPoint(address, point) {
          setValue(address, point.row, "i32");
          setValue(address + SIZE_OF_INT, point.column, "i32");
        }
        function unmarshalPoint(address) {
          const result = {
            row: getValue(address, "i32") >>> 0,
            column: getValue(address + SIZE_OF_INT, "i32") >>> 0
          };
          return result;
        }
        function marshalRange(address, range) {
          marshalPoint(address, range.startPosition);
          address += SIZE_OF_POINT;
          marshalPoint(address, range.endPosition);
          address += SIZE_OF_POINT;
          setValue(address, range.startIndex, "i32");
          address += SIZE_OF_INT;
          setValue(address, range.endIndex, "i32");
          address += SIZE_OF_INT;
        }
        function unmarshalRange(address) {
          const result = {};
          result.startPosition = unmarshalPoint(address);
          address += SIZE_OF_POINT;
          result.endPosition = unmarshalPoint(address);
          address += SIZE_OF_POINT;
          result.startIndex = getValue(address, "i32") >>> 0;
          address += SIZE_OF_INT;
          result.endIndex = getValue(address, "i32") >>> 0;
          return result;
        }
        function marshalEdit(edit) {
          let address = TRANSFER_BUFFER;
          marshalPoint(address, edit.startPosition);
          address += SIZE_OF_POINT;
          marshalPoint(address, edit.oldEndPosition);
          address += SIZE_OF_POINT;
          marshalPoint(address, edit.newEndPosition);
          address += SIZE_OF_POINT;
          setValue(address, edit.startIndex, "i32");
          address += SIZE_OF_INT;
          setValue(address, edit.oldEndIndex, "i32");
          address += SIZE_OF_INT;
          setValue(address, edit.newEndIndex, "i32");
          address += SIZE_OF_INT;
        }
        // end include: /home/user/src/ts-playground-setup/tree-sitter/lib/binding_web/binding.js
        // include: /home/user/src/ts-playground-setup/tree-sitter/lib/binding_web/suffix.js
        for (const name of Object.getOwnPropertyNames(ParserImpl.prototype)) {
          Object.defineProperty(Parser.prototype, name, {
            value: ParserImpl.prototype[name],
            enumerable: false,
            writable: false
          });
        }
        Parser.Language = Language;
        Module.onRuntimeInitialized = () => {
          ParserImpl.init();
          resolveInitPromise();
        };
      });
    }
  }
  return Parser;
}();

if (typeof exports === "object") {
  module.exports = TreeSitter;
}

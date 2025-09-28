var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match, index) => {
    const mark = `@${index}`;
    groups.push([mark, match]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match[1], new RegExp(`^${match[2]}(?=/${next})`)] : [label, match[1], new RegExp(`^${match[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match) => {
      try {
        return decoder(match);
      } catch {
        return match;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf(`?${key}`, 8);
    if (keyIndex2 === -1) {
      keyIndex2 = url.indexOf(`&${key}`, 8);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  text() {
    return this.#cachedBody("text");
  }
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  blob() {
    return this.#cachedBody("blob");
  }
  formData() {
    return this.#cachedBody("formData");
  }
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  env = {};
  #var;
  finalized = false;
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  get res() {
    return this.#res ||= new Response(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  set res(_res) {
    if (this.#res && _res) {
      _res = new Response(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = new Response(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return new Response(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => new Response();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class {
  static {
    __name(this, "Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  route(path, app10) {
    const subApp = this.basePath(path);
    app10.routes.map((r) => {
      let handler;
      if (app10.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app10.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class {
  static {
    __name(this, "Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var emptyParam = [];
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match(method, path) {
    clearWildcardRegExpCache();
    const matchers = this.#buildAllMatchers();
    this.match = (method2, path2) => {
      const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
      const staticMatch = matcher[2][path2];
      if (staticMatch) {
        return staticMatch;
      }
      const match = path2.match(matcher[0]);
      if (!match) {
        return [[], emptyParam];
      }
      const index = match.indexOf("", 1);
      return [matcher[1][index], match];
    };
    return this.match(method, path);
  }
  #buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node2 = class {
  static {
    __name(this, "Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #getHandlerSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              handlerSets.push(
                ...this.#getHandlerSets(nextNode.#children["*"], method, node.#params)
              );
            }
            handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp) {
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
              if (Object.keys(child.#children).length) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
              if (child.#children["*"]) {
                handlerSets.push(
                  ...this.#getHandlerSets(child.#children["*"], method, params, node.#params)
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.origin !== "*") {
      const existingVary = c.req.header("Vary");
      if (existingVary) {
        set("Vary", existingVary);
      } else {
        set("Vary", "Origin");
      }
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
  }, "cors2");
}, "cors");

// node_modules/hono/dist/utils/color.js
function getColorEnabled() {
  const { process, Deno } = globalThis;
  const isNoColor = typeof Deno?.noColor === "boolean" ? Deno.noColor : process !== void 0 ? "NO_COLOR" in process?.env : false;
  return !isNoColor;
}
__name(getColorEnabled, "getColorEnabled");
async function getColorEnabledAsync() {
  const { navigator } = globalThis;
  const cfWorkers = "cloudflare:workers";
  const isNoColor = navigator !== void 0 && navigator.userAgent === "Cloudflare-Workers" ? await (async () => {
    try {
      return "NO_COLOR" in ((await import(cfWorkers)).env ?? {});
    } catch {
      return false;
    }
  })() : !getColorEnabled();
  return !isNoColor;
}
__name(getColorEnabledAsync, "getColorEnabledAsync");

// node_modules/hono/dist/middleware/logger/index.js
var humanize = /* @__PURE__ */ __name((times) => {
  const [delimiter, separator] = [",", "."];
  const orderTimes = times.map((v) => v.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + delimiter));
  return orderTimes.join(separator);
}, "humanize");
var time = /* @__PURE__ */ __name((start) => {
  const delta = Date.now() - start;
  return humanize([delta < 1e3 ? delta + "ms" : Math.round(delta / 1e3) + "s"]);
}, "time");
var colorStatus = /* @__PURE__ */ __name(async (status) => {
  const colorEnabled = await getColorEnabledAsync();
  if (colorEnabled) {
    switch (status / 100 | 0) {
      case 5:
        return `\x1B[31m${status}\x1B[0m`;
      case 4:
        return `\x1B[33m${status}\x1B[0m`;
      case 3:
        return `\x1B[36m${status}\x1B[0m`;
      case 2:
        return `\x1B[32m${status}\x1B[0m`;
    }
  }
  return `${status}`;
}, "colorStatus");
async function log(fn, prefix, method, path, status = 0, elapsed) {
  const out = prefix === "<--" ? `${prefix} ${method} ${path}` : `${prefix} ${method} ${path} ${await colorStatus(status)} ${elapsed}`;
  fn(out);
}
__name(log, "log");
var logger = /* @__PURE__ */ __name((fn = console.log) => {
  return /* @__PURE__ */ __name(async function logger2(c, next) {
    const { method, url } = c.req;
    const path = url.slice(url.indexOf("/", 8));
    await log(fn, "<--", method, path);
    const start = Date.now();
    await next();
    await log(fn, "-->", method, path, c.res.status, time(start));
  }, "logger2");
}, "logger");

// node_modules/hono/dist/middleware/pretty-json/index.js
var prettyJSON = /* @__PURE__ */ __name((options) => {
  const targetQuery = options?.query ?? "pretty";
  return /* @__PURE__ */ __name(async function prettyJSON2(c, next) {
    const pretty = c.req.query(targetQuery) || c.req.query(targetQuery) === "";
    await next();
    if (pretty && c.res.headers.get("Content-Type")?.startsWith("application/json")) {
      const obj = await c.res.json();
      c.res = new Response(JSON.stringify(obj, null, options?.space ?? 2), c.res);
    }
  }, "prettyJSON2");
}, "prettyJSON");

// src/data/kvProvider.js
function generateId() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  array[6] = array[6] & 15 | 64;
  array[8] = array[8] & 63 | 128;
  const hex = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
__name(generateId, "generateId");
var KEY_PREFIXES = {
  students: "student:",
  classes: "class:",
  books: "book:",
  genres: "genre:",
  sessions: "session:",
  settings: "settings",
  indexes: "index:"
};
function makeKey(type, id) {
  const prefix = KEY_PREFIXES[type];
  if (!prefix) {
    throw new Error(`Unknown entity type: ${type}`);
  }
  return `${prefix}${id}`;
}
__name(makeKey, "makeKey");
async function updateIndex(kv, type, id) {
  const indexKey = `index:${type}`;
  const existing = await kv.get(indexKey);
  const ids = existing ? JSON.parse(existing) : [];
  if (!ids.includes(id)) {
    ids.push(id);
    await kv.put(indexKey, JSON.stringify(ids));
  }
}
__name(updateIndex, "updateIndex");
async function removeFromIndex(kv, type, id) {
  const indexKey = `index:${type}`;
  const existing = await kv.get(indexKey);
  if (!existing) return;
  const ids = JSON.parse(existing).filter((existingId) => existingId !== id);
  await kv.put(indexKey, JSON.stringify(ids));
}
__name(removeFromIndex, "removeFromIndex");
async function getStudents(kv) {
  const index = await kv.get("index:students");
  const ids = index ? JSON.parse(index) : [];
  const students = [];
  for (const id of ids) {
    const student = await kv.get(makeKey("students", id));
    if (student) {
      const parsed = JSON.parse(student);
      if (!parsed.readingSessions) {
        parsed.readingSessions = [];
      }
      students.push(parsed);
    }
  }
  return students;
}
__name(getStudents, "getStudents");
async function getStudentById(kv, id) {
  const student = await kv.get(makeKey("students", id));
  return student ? JSON.parse(student) : null;
}
__name(getStudentById, "getStudentById");
async function saveStudent(kv, student) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const studentWithTimestamps = {
    ...student,
    updatedAt: now,
    createdAt: student.createdAt || now
  };
  await kv.put(makeKey("students", student.id), JSON.stringify(studentWithTimestamps));
  await updateIndex(kv, "students", student.id);
  return studentWithTimestamps;
}
__name(saveStudent, "saveStudent");
async function deleteStudent(kv, id) {
  await kv.delete(makeKey("students", id));
  await removeFromIndex(kv, "students", id);
  return true;
}
__name(deleteStudent, "deleteStudent");
async function getClasses(kv) {
  const index = await kv.get("index:classes");
  const ids = index ? JSON.parse(index) : [];
  const classes = [];
  for (const id of ids) {
    const classData = await kv.get(makeKey("classes", id));
    if (classData) classes.push(JSON.parse(classData));
  }
  return classes;
}
__name(getClasses, "getClasses");
async function getClassById(kv, id) {
  const classData = await kv.get(makeKey("classes", id));
  return classData ? JSON.parse(classData) : null;
}
__name(getClassById, "getClassById");
async function saveClass(kv, classData) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const classWithTimestamps = {
    ...classData,
    updatedAt: now,
    createdAt: classData.createdAt || now
  };
  await kv.put(makeKey("classes", classData.id), JSON.stringify(classWithTimestamps));
  await updateIndex(kv, "classes", classData.id);
  return classWithTimestamps;
}
__name(saveClass, "saveClass");
async function deleteClass(kv, id) {
  await kv.delete(makeKey("classes", id));
  await removeFromIndex(kv, "classes", id);
  return true;
}
__name(deleteClass, "deleteClass");
async function getBooks(kv) {
  const index = await kv.get("index:books");
  const ids = index ? JSON.parse(index) : [];
  const books = [];
  for (const id of ids) {
    const book = await kv.get(makeKey("books", id));
    if (book) books.push(JSON.parse(book));
  }
  return books;
}
__name(getBooks, "getBooks");
async function getBookById(kv, id) {
  const book = await kv.get(makeKey("books", id));
  return book ? JSON.parse(book) : null;
}
__name(getBookById, "getBookById");
async function saveBook(kv, book) {
  await kv.put(makeKey("books", book.id), JSON.stringify(book));
  await updateIndex(kv, "books", book.id);
  return book;
}
__name(saveBook, "saveBook");
async function deleteBook(kv, id) {
  await kv.delete(makeKey("books", id));
  await removeFromIndex(kv, "books", id);
  return true;
}
__name(deleteBook, "deleteBook");
async function getGenres(kv) {
  const index = await kv.get("index:genres");
  const ids = index ? JSON.parse(index) : [];
  const genres = [];
  for (const id of ids) {
    const genre = await kv.get(makeKey("genres", id));
    if (genre) genres.push(JSON.parse(genre));
  }
  return genres;
}
__name(getGenres, "getGenres");
async function getGenreById(kv, id) {
  const genre = await kv.get(makeKey("genres", id));
  return genre ? JSON.parse(genre) : null;
}
__name(getGenreById, "getGenreById");
async function saveGenre(kv, genre) {
  await kv.put(makeKey("genres", genre.id), JSON.stringify(genre));
  await updateIndex(kv, "genres", genre.id);
  return genre;
}
__name(saveGenre, "saveGenre");
async function deleteGenre(kv, id) {
  await kv.delete(makeKey("genres", id));
  await removeFromIndex(kv, "genres", id);
  return true;
}
__name(deleteGenre, "deleteGenre");
async function getSessions(kv) {
  const index = await kv.get("index:sessions");
  const ids = index ? JSON.parse(index) : [];
  const sessions = [];
  for (const id of ids) {
    const session = await kv.get(makeKey("sessions", id));
    if (session) sessions.push(JSON.parse(session));
  }
  return sessions;
}
__name(getSessions, "getSessions");
async function getSessionsByStudent(kv, studentId) {
  const sessions = await getSessions(kv);
  return sessions.filter((session) => session.studentId === studentId);
}
__name(getSessionsByStudent, "getSessionsByStudent");
async function saveSession(kv, session) {
  await kv.put(makeKey("sessions", session.id), JSON.stringify(session));
  await updateIndex(kv, "sessions", session.id);
  const student = await getStudentById(kv, session.studentId);
  if (student) {
    await saveStudent(kv, { ...student, lastReadDate: session.date });
  }
  return session;
}
__name(saveSession, "saveSession");
async function deleteSession(kv, id) {
  await kv.delete(makeKey("sessions", id));
  await removeFromIndex(kv, "sessions", id);
  return true;
}
__name(deleteSession, "deleteSession");
async function getSettings(kv) {
  const settings = await kv.get("settings");
  return settings ? JSON.parse(settings) : null;
}
__name(getSettings, "getSettings");
async function saveSettings2(kv, settings) {
  await kv.put("settings", JSON.stringify(settings));
  return settings;
}
__name(saveSettings2, "saveSettings");
async function initializeDefaultGenres(kv) {
  const existingGenres = await getGenres(kv);
  if (existingGenres.length > 0) return;
  const defaultGenres = [
    { id: generateId(), name: "Adventure", description: "Exciting stories with exploration and discovery", isPredefined: true },
    { id: generateId(), name: "Fantasy", description: "Magical worlds and mythical creatures", isPredefined: true },
    { id: generateId(), name: "Mystery", description: "Puzzles, detectives, and suspense", isPredefined: true },
    { id: generateId(), name: "Science Fiction", description: "Future worlds and space exploration", isPredefined: true },
    { id: generateId(), name: "Animal Stories", description: "Stories about animals and their adventures", isPredefined: true },
    { id: generateId(), name: "Friendship", description: "Stories about relationships and social themes", isPredefined: true },
    { id: generateId(), name: "Family", description: "Stories about families and home life", isPredefined: true },
    { id: generateId(), name: "School", description: "Stories about school experiences and learning", isPredefined: true },
    { id: generateId(), name: "Sports", description: "Athletic competitions and teamwork", isPredefined: true },
    { id: generateId(), name: "Humor", description: "Funny stories that make you laugh", isPredefined: true }
  ];
  for (const genre of defaultGenres) {
    await saveGenre(kv, genre);
  }
}
__name(initializeDefaultGenres, "initializeDefaultGenres");
async function initializeDefaultSettings(kv) {
  const existingSettings = await getSettings(kv);
  if (existingSettings) return;
  const defaultSettings = {
    readingStatusSettings: {
      recentlyReadDays: 7,
      needsAttentionDays: 14
    }
  };
  await saveSettings2(kv, defaultSettings);
}
__name(initializeDefaultSettings, "initializeDefaultSettings");

// src/routes/students.js
var app = new Hono2();
app.get("/", async (c) => {
  try {
    const students = await getStudents(c.env.READING_ASSISTANT_KV);
    return c.json({ data: students });
  } catch (error) {
    console.error("Error fetching students:", error);
    return c.json({
      error: {
        code: "FETCH_ERROR",
        message: "Failed to fetch students"
      }
    }, 500);
  }
});
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { name, classId, readingLevel, preferences } = body;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return c.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Student name is required"
        }
      }, 400);
    }
    const existingStudents = await getStudents(c.env.READING_ASSISTANT_KV);
    const duplicate = existingStudents.find((s) => s.name.toLowerCase() === name.toLowerCase().trim());
    if (duplicate) {
      return c.json({
        error: {
          code: "DUPLICATE_ERROR",
          message: "A student with this name already exists"
        }
      }, 409);
    }
    const student = {
      id: generateId(),
      name: name.trim(),
      classId: classId || null,
      readingLevel: readingLevel || null,
      lastReadDate: null,
      preferences: {
        favoriteGenreIds: [],
        likes: [],
        dislikes: [],
        readingFormats: [],
        ...preferences
      },
      readingSessions: [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const savedStudent = await saveStudent(c.env.READING_ASSISTANT_KV, student);
    return c.json({
      data: savedStudent,
      message: "Student created successfully"
    }, 201);
  } catch (error) {
    console.error("Error creating student:", error);
    return c.json({
      error: {
        code: "CREATE_ERROR",
        message: "Failed to create student"
      }
    }, 500);
  }
});
app.get("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const student = await getStudentById(c.env.READING_ASSISTANT_KV, id);
    if (!student) {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Student not found"
        }
      }, 404);
    }
    return c.json({ data: student });
  } catch (error) {
    console.error("Error fetching student:", error);
    return c.json({
      error: {
        code: "FETCH_ERROR",
        message: "Failed to fetch student"
      }
    }, 500);
  }
});
app.put("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const updates = await c.req.json();
    const existingStudent = await getStudentById(c.env.READING_ASSISTANT_KV, id);
    if (!existingStudent) {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Student not found"
        }
      }, 404);
    }
    if (updates.name !== void 0) {
      if (typeof updates.name !== "string" || updates.name.trim().length === 0) {
        return c.json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Student name must be a non-empty string"
          }
        }, 400);
      }
      const allStudents = await getStudents(c.env.READING_ASSISTANT_KV);
      const duplicate = allStudents.find(
        (s) => s.id !== id && s.name.toLowerCase() === updates.name.toLowerCase().trim()
      );
      if (duplicate) {
        return c.json({
          error: {
            code: "DUPLICATE_ERROR",
            message: "Another student with this name already exists"
          }
        }, 409);
      }
      updates.name = updates.name.trim();
    }
    const updatedStudent = {
      ...existingStudent,
      ...updates,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const savedStudent = await saveStudent(c.env.READING_ASSISTANT_KV, updatedStudent);
    return c.json({
      data: savedStudent,
      message: "Student updated successfully"
    });
  } catch (error) {
    console.error("Error updating student:", error);
    return c.json({
      error: {
        code: "UPDATE_ERROR",
        message: "Failed to update student"
      }
    }, 500);
  }
});
app.delete("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const existingStudent = await getStudentById(c.env.READING_ASSISTANT_KV, id);
    if (!existingStudent) {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Student not found"
        }
      }, 404);
    }
    await deleteStudent(c.env.READING_ASSISTANT_KV, id);
    return c.json({
      message: "Student deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    return c.json({
      error: {
        code: "DELETE_ERROR",
        message: "Failed to delete student"
      }
    }, 500);
  }
});
app.post("/bulk", async (c) => {
  try {
    const body = await c.req.json();
    const { students } = body;
    if (!Array.isArray(students)) {
      return c.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Students must be an array"
        }
      }, 400);
    }
    const createdStudents = [];
    const errors = [];
    for (const studentData of students) {
      try {
        const student = {
          id: generateId(),
          name: studentData.name?.trim(),
          classId: studentData.classId || null,
          readingLevel: studentData.readingLevel || null,
          lastReadDate: null,
          preferences: {
            favoriteGenreIds: [],
            likes: [],
            dislikes: [],
            readingFormats: [],
            ...studentData.preferences
          },
          readingSessions: [],
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        if (!student.name || student.name.length === 0) {
          errors.push(`Student missing name: ${JSON.stringify(studentData)}`);
          continue;
        }
        const savedStudent = await saveStudent(c.env.READING_ASSISTANT_KV, student);
        createdStudents.push(savedStudent);
      } catch (error) {
        errors.push(`Error creating student ${studentData.name}: ${error.message}`);
      }
    }
    return c.json({
      data: {
        created: createdStudents,
        errors
      },
      message: `Created ${createdStudents.length} students${errors.length > 0 ? `, ${errors.length} errors` : ""}`
    }, createdStudents.length > 0 ? 201 : 400);
  } catch (error) {
    console.error("Error bulk importing students:", error);
    return c.json({
      error: {
        code: "BULK_IMPORT_ERROR",
        message: "Failed to import students"
      }
    }, 500);
  }
});
var students_default = app;

// src/routes/classes.js
var app2 = new Hono2();
app2.get("/", async (c) => {
  try {
    const classes = await getClasses(c.env.READING_ASSISTANT_KV);
    return c.json({ data: classes });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return c.json({
      error: {
        code: "FETCH_ERROR",
        message: "Failed to fetch classes"
      }
    }, 500);
  }
});
app2.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { name, teacherName, schoolYear } = body;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return c.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Class name is required"
        }
      }, 400);
    }
    const existingClasses = await getClasses(c.env.READING_ASSISTANT_KV);
    const duplicate = existingClasses.find((cls) => cls.name.toLowerCase() === name.toLowerCase().trim());
    if (duplicate) {
      return c.json({
        error: {
          code: "DUPLICATE_ERROR",
          message: "A class with this name already exists"
        }
      }, 409);
    }
    const classData = {
      id: generateId(),
      name: name.trim(),
      teacherName: teacherName || null,
      schoolYear: schoolYear || null,
      disabled: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const savedClass = await saveClass(c.env.READING_ASSISTANT_KV, classData);
    return c.json({
      data: savedClass,
      message: "Class created successfully"
    }, 201);
  } catch (error) {
    console.error("Error creating class:", error);
    return c.json({
      error: {
        code: "CREATE_ERROR",
        message: "Failed to create class"
      }
    }, 500);
  }
});
app2.get("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const classData = await getClassById(c.env.READING_ASSISTANT_KV, id);
    if (!classData) {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Class not found"
        }
      }, 404);
    }
    return c.json({ data: classData });
  } catch (error) {
    console.error("Error fetching class:", error);
    return c.json({
      error: {
        code: "FETCH_ERROR",
        message: "Failed to fetch class"
      }
    }, 500);
  }
});
app2.put("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const updates = await c.req.json();
    const existingClass = await getClassById(c.env.READING_ASSISTANT_KV, id);
    if (!existingClass) {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Class not found"
        }
      }, 404);
    }
    if (updates.name !== void 0) {
      if (typeof updates.name !== "string" || updates.name.trim().length === 0) {
        return c.json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Class name must be a non-empty string"
          }
        }, 400);
      }
      const allClasses = await getClasses(c.env.READING_ASSISTANT_KV);
      const duplicate = allClasses.find(
        (cls) => cls.id !== id && cls.name.toLowerCase() === updates.name.toLowerCase().trim()
      );
      if (duplicate) {
        return c.json({
          error: {
            code: "DUPLICATE_ERROR",
            message: "Another class with this name already exists"
          }
        }, 409);
      }
      updates.name = updates.name.trim();
    }
    const updatedClass = {
      ...existingClass,
      ...updates,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const savedClass = await saveClass(c.env.READING_ASSISTANT_KV, updatedClass);
    return c.json({
      data: savedClass,
      message: "Class updated successfully"
    });
  } catch (error) {
    console.error("Error updating class:", error);
    return c.json({
      error: {
        code: "UPDATE_ERROR",
        message: "Failed to update class"
      }
    }, 500);
  }
});
app2.delete("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const existingClass = await getClassById(c.env.READING_ASSISTANT_KV, id);
    if (!existingClass) {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Class not found"
        }
      }, 404);
    }
    await deleteClass(c.env.READING_ASSISTANT_KV, id);
    return c.json({
      message: "Class deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting class:", error);
    return c.json({
      error: {
        code: "DELETE_ERROR",
        message: "Failed to delete class"
      }
    }, 500);
  }
});
var classes_default = app2;

// src/routes/books.js
var app3 = new Hono2();
app3.get("/", async (c) => {
  try {
    const books = await getBooks(c.env.READING_ASSISTANT_KV);
    return c.json({ data: books });
  } catch (error) {
    console.error("Error fetching books:", error);
    return c.json({
      error: {
        code: "FETCH_ERROR",
        message: "Failed to fetch books"
      }
    }, 500);
  }
});
app3.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { title, author, genreIds, readingLevel, ageRange } = body;
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return c.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Book title is required"
        }
      }, 400);
    }
    if (author !== void 0 && author !== null) {
      if (typeof author !== "string" || author.trim().length === 0) {
        return c.json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Book author must be a non-empty string"
          }
        }, 400);
      }
    }
    const existingBooks = await getBooks(c.env.READING_ASSISTANT_KV);
    const normalizedTitle = title.toLowerCase().trim();
    const normalizedAuthor = author ? author.toLowerCase().trim() : null;
    const duplicate = existingBooks.find((b) => {
      const bookTitle = b.title.toLowerCase();
      const bookAuthor = b.author ? b.author.toLowerCase() : null;
      if (normalizedAuthor && bookAuthor) {
        return bookTitle === normalizedTitle && bookAuthor === normalizedAuthor;
      }
      if (!normalizedAuthor && !bookAuthor) {
        return bookTitle === normalizedTitle;
      }
      return false;
    });
    if (duplicate) {
      const duplicateMessage = author ? "A book with this title and author already exists" : "A book with this title already exists";
      return c.json({
        error: {
          code: "DUPLICATE_ERROR",
          message: duplicateMessage
        }
      }, 409);
    }
    if (genreIds && Array.isArray(genreIds)) {
      const genres = await getGenres(c.env.READING_ASSISTANT_KV);
      const validGenreIds = genres.map((g) => g.id);
      const invalidGenres = genreIds.filter((id) => !validGenreIds.includes(id));
      if (invalidGenres.length > 0) {
        return c.json({
          error: {
            code: "VALIDATION_ERROR",
            message: `Invalid genre IDs: ${invalidGenres.join(", ")}`
          }
        }, 400);
      }
    }
    const book = {
      id: generateId(),
      title: title.trim(),
      author: author ? author.trim() : null,
      genreIds: genreIds || [],
      readingLevel: readingLevel || null,
      ageRange: ageRange || null
    };
    const savedBook = await saveBook(c.env.READING_ASSISTANT_KV, book);
    return c.json({
      data: savedBook,
      message: "Book created successfully"
    }, 201);
  } catch (error) {
    console.error("Error creating book:", error);
    return c.json({
      error: {
        code: "CREATE_ERROR",
        message: "Failed to create book"
      }
    }, 500);
  }
});
app3.get("/export", async (c) => {
  try {
    const books = await getBooks(c.env.READING_ASSISTANT_KV);
    const exportData = books.map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      genreIds: book.genreIds || [],
      readingLevel: book.readingLevel || null,
      ageRange: book.ageRange || null,
      description: book.description || null
    }));
    return c.json(exportData);
  } catch (error) {
    console.error("Error exporting books:", error);
    return c.json({
      error: {
        code: "EXPORT_ERROR",
        message: "Failed to export books"
      }
    }, 500);
  }
});
app3.get("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const book = await getBookById(c.env.READING_ASSISTANT_KV, id);
    if (!book) {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Book not found"
        }
      }, 404);
    }
    return c.json({ data: book });
  } catch (error) {
    console.error("Error fetching book:", error);
    return c.json({
      error: {
        code: "FETCH_ERROR",
        message: "Failed to fetch book"
      }
    }, 500);
  }
});
app3.put("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const updates = await c.req.json();
    const existingBook = await getBookById(c.env.READING_ASSISTANT_KV, id);
    if (!existingBook) {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Book not found"
        }
      }, 404);
    }
    if (updates.title !== void 0) {
      if (typeof updates.title !== "string" || updates.title.trim().length === 0) {
        return c.json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Book title must be a non-empty string"
          }
        }, 400);
      }
      updates.title = updates.title.trim();
    }
    if (updates.author !== void 0) {
      if (typeof updates.author !== "string" || updates.author.trim().length === 0) {
        return c.json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Book author must be a non-empty string"
          }
        }, 400);
      }
      updates.author = updates.author.trim();
    }
    if (updates.title !== void 0 && updates.author !== void 0) {
      const allBooks = await getBooks(c.env.READING_ASSISTANT_KV);
      const duplicate = allBooks.find(
        (b) => b.id !== id && b.title.toLowerCase() === updates.title.toLowerCase() && b.author.toLowerCase() === updates.author.toLowerCase()
      );
      if (duplicate) {
        return c.json({
          error: {
            code: "DUPLICATE_ERROR",
            message: "Another book with this title and author already exists"
          }
        }, 409);
      }
    }
    if (updates.genreIds !== void 0) {
      if (!Array.isArray(updates.genreIds)) {
        return c.json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Genre IDs must be an array"
          }
        }, 400);
      }
      const genres = await getGenres(c.env.READING_ASSISTANT_KV);
      const validGenreIds = genres.map((g) => g.id);
      const invalidGenres = updates.genreIds.filter((id2) => !validGenreIds.includes(id2));
      if (invalidGenres.length > 0) {
        return c.json({
          error: {
            code: "VALIDATION_ERROR",
            message: `Invalid genre IDs: ${invalidGenres.join(", ")}`
          }
        }, 400);
      }
    }
    const updatedBook = {
      ...existingBook,
      ...updates
    };
    const savedBook = await saveBook(c.env.READING_ASSISTANT_KV, updatedBook);
    return c.json({
      data: savedBook,
      message: "Book updated successfully"
    });
  } catch (error) {
    console.error("Error updating book:", error);
    return c.json({
      error: {
        code: "UPDATE_ERROR",
        message: "Failed to update book"
      }
    }, 500);
  }
});
app3.delete("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const existingBook = await getBookById(c.env.READING_ASSISTANT_KV, id);
    if (!existingBook) {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Book not found"
        }
      }, 404);
    }
    await deleteBook(c.env.READING_ASSISTANT_KV, id);
    return c.json({
      message: "Book deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting book:", error);
    return c.json({
      error: {
        code: "DELETE_ERROR",
        message: "Failed to delete book"
      }
    }, 500);
  }
});
app3.get("/search/external", async (c) => {
  try {
    const { q: query, limit = 10 } = c.req.query();
    if (!query || query.trim().length === 0) {
      return c.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Search query is required"
        }
      }, 400);
    }
    const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query.trim())}&limit=${limit}&fields=key,title,author_name,first_publish_year,editions,cover_i,subject`;
    const response = await fetch(searchUrl);
    if (!response.ok) {
      return c.json({
        error: {
          code: "EXTERNAL_API_ERROR",
          message: "Failed to search OpenLibrary"
        }
      }, 500);
    }
    const data = await response.json();
    const books = data.docs.map((doc) => ({
      id: null,
      // External books don't have our internal ID yet
      title: doc.title,
      author: doc.author_name ? doc.author_name.join(", ") : "Unknown Author",
      externalId: doc.key,
      firstPublishYear: doc.first_publish_year,
      coverImage: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
      subjects: doc.subject ? doc.subject.slice(0, 5) : [],
      // Limit to first 5 subjects
      editionCount: doc.editions ? doc.editions.count || 0 : 0
    }));
    return c.json({
      data: books,
      total: data.num_found,
      message: `Found ${books.length} books matching "${query}"`
    });
  } catch (error) {
    console.error("Error searching OpenLibrary:", error);
    return c.json({
      error: {
        code: "SEARCH_ERROR",
        message: "Failed to search external library"
      }
    }, 500);
  }
});
app3.get("/external/:workId", async (c) => {
  try {
    const { workId } = c.req.param();
    const cleanWorkId = workId.replace("/works/", "");
    const workUrl = `https://openlibrary.org/works/${cleanWorkId}.json`;
    const workResponse = await fetch(workUrl);
    if (!workResponse.ok) {
      return c.json({
        error: {
          code: "EXTERNAL_API_ERROR",
          message: "Book not found in OpenLibrary"
        }
      }, 404);
    }
    const workData = await workResponse.json();
    let authorData = null;
    if (workData.authors && workData.authors.length > 0) {
      const authorKey = workData.authors[0].author?.key || workData.authors[0].key;
      if (authorKey) {
        const cleanAuthorKey = authorKey.replace("/authors/", "");
        const authorUrl = `https://openlibrary.org/authors/${cleanAuthorKey}.json`;
        const authorResponse = await fetch(authorUrl);
        if (authorResponse.ok) {
          authorData = await authorResponse.json();
        }
      }
    }
    const bookData = {
      title: workData.title,
      author: authorData?.name || "Unknown Author",
      description: workData.description?.value || workData.description || null,
      subjects: workData.subjects ? workData.subjects.slice(0, 10) : [],
      firstPublishYear: workData.first_publish_date ? new Date(workData.first_publish_date).getFullYear() : null,
      coverImage: workData.covers && workData.covers.length > 0 ? `https://covers.openlibrary.org/b/id/${workData.covers[0]}-L.jpg` : null,
      externalId: workData.key,
      authorBio: authorData?.bio?.value || authorData?.bio || null,
      authorBirthDate: authorData?.birth_date || null,
      authorDeathDate: authorData?.death_date || null,
      pageCount: workData.number_of_pages_median || null
    };
    return c.json({ data: bookData });
  } catch (error) {
    console.error("Error fetching book from OpenLibrary:", error);
    return c.json({
      error: {
        code: "FETCH_ERROR",
        message: "Failed to fetch book details"
      }
    }, 500);
  }
});
app3.post("/import", async (c) => {
  try {
    const body = await c.req.json();
    const { externalId, genreIds, readingLevel, ageRange } = body;
    if (!externalId) {
      return c.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "External ID is required"
        }
      }, 400);
    }
    const cleanWorkId = externalId.replace("/works/", "");
    const workUrl = `https://openlibrary.org/works/${cleanWorkId}.json`;
    const workResponse = await fetch(workUrl);
    if (!workResponse.ok) {
      return c.json({
        error: {
          code: "EXTERNAL_API_ERROR",
          message: "Book not found in OpenLibrary"
        }
      }, 404);
    }
    const workData = await workResponse.json();
    let authorData = null;
    if (workData.authors && workData.authors.length > 0) {
      const authorKey = workData.authors[0].author?.key || workData.authors[0].key;
      if (authorKey) {
        const cleanAuthorKey = authorKey.replace("/authors/", "");
        const authorUrl = `https://openlibrary.org/authors/${cleanAuthorKey}.json`;
        const authorResponse = await fetch(authorUrl);
        if (authorResponse.ok) {
          authorData = await authorResponse.json();
        }
      }
    }
    const existingBooks = await getBooks(c.env.READING_ASSISTANT_KV);
    const duplicate = existingBooks.find(
      (b) => b.title.toLowerCase() === workData.title.toLowerCase() && (authorData?.name || "Unknown Author").toLowerCase() === b.author.toLowerCase()
    );
    if (duplicate) {
      return c.json({
        error: {
          code: "DUPLICATE_ERROR",
          message: "This book already exists in your library"
        }
      }, 409);
    }
    if (genreIds && Array.isArray(genreIds)) {
      const genres = await getGenres(c.env.READING_ASSISTANT_KV);
      const validGenreIds = genres.map((g) => g.id);
      const invalidGenres = genreIds.filter((id) => !validGenreIds.includes(id));
      if (invalidGenres.length > 0) {
        return c.json({
          error: {
            code: "VALIDATION_ERROR",
            message: `Invalid genre IDs: ${invalidGenres.join(", ")}`
          }
        }, 400);
      }
    }
    const book = {
      id: generateId(),
      title: workData.title,
      author: authorData?.name || "Unknown Author",
      genreIds: genreIds || [],
      readingLevel: readingLevel || null,
      ageRange: ageRange || null,
      description: workData.description?.value || workData.description || null,
      coverImage: workData.covers && workData.covers.length > 0 ? `https://covers.openlibrary.org/b/id/${workData.covers[0]}-L.jpg` : null,
      firstPublishYear: workData.first_publish_date ? new Date(workData.first_publish_date).getFullYear() : null,
      externalId: workData.key,
      importedFrom: "openlibrary",
      importedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const savedBook = await saveBook(c.env.READING_ASSISTANT_KV, book);
    return c.json({
      data: savedBook,
      message: "Book imported successfully from OpenLibrary"
    }, 201);
  } catch (error) {
    console.error("Error importing book from OpenLibrary:", error);
    return c.json({
      error: {
        code: "IMPORT_ERROR",
        message: "Failed to import book"
      }
    }, 500);
  }
});
app3.post("/bulk", async (c) => {
  try {
    const body = await c.req.json();
    const { books } = body;
    if (!Array.isArray(books)) {
      return c.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Books must be an array"
        }
      }, 400);
    }
    const createdBooks = [];
    const errors = [];
    const genres = await getGenres(c.env.READING_ASSISTANT_KV);
    const validGenreIds = genres.map((g) => g.id);
    for (const bookData of books) {
      try {
        let genreIds = bookData.genreIds || [];
        if (genreIds.length > 0) {
          const invalidGenres = genreIds.filter((id) => !validGenreIds.includes(id));
          if (invalidGenres.length > 0) {
            errors.push(`Book "${bookData.title}" has invalid genre IDs: ${invalidGenres.join(", ")}`);
            continue;
          }
        }
        const book = {
          id: generateId(),
          title: bookData.title?.trim(),
          author: bookData.author?.trim(),
          genreIds,
          readingLevel: bookData.readingLevel || null,
          ageRange: bookData.ageRange || null
        };
        if (!book.title || book.title.length === 0) {
          errors.push(`Book missing title: ${JSON.stringify(bookData)}`);
          continue;
        }
        if (!book.author || book.author.length === 0) {
          errors.push(`Book "${book.title}" missing author`);
          continue;
        }
        const savedBook = await saveBook(c.env.READING_ASSISTANT_KV, book);
        createdBooks.push(savedBook);
      } catch (error) {
        errors.push(`Error creating book "${bookData.title}": ${error.message}`);
      }
    }
    return c.json({
      data: {
        created: createdBooks,
        errors
      },
      message: `Created ${createdBooks.length} books${errors.length > 0 ? `, ${errors.length} errors` : ""}`
    }, createdBooks.length > 0 ? 201 : 400);
  } catch (error) {
    console.error("Error bulk importing books:", error);
    return c.json({
      error: {
        code: "BULK_IMPORT_ERROR",
        message: "Failed to import books"
      }
    }, 500);
  }
});
app3.post("/batch-import", async (c) => {
  try {
    const importBooks = await c.req.json();
    if (!Array.isArray(importBooks)) {
      return c.json({
        error: {
          code: "INVALID_INPUT",
          message: "Import data must be an array of books"
        }
      }, 400);
    }
    const createdBooks = [];
    const errors = [];
    for (const bookData of importBooks) {
      try {
        if (!bookData.title || !bookData.author) {
          errors.push(`Book missing title or author: ${JSON.stringify(bookData)}`);
          continue;
        }
        const newId = bookData.id || crypto.randomUUID();
        const book = {
          id: newId,
          title: bookData.title,
          author: bookData.author,
          genreIds: bookData.genreIds || [],
          readingLevel: bookData.readingLevel || null,
          ageRange: bookData.ageRange || null,
          description: bookData.description || null,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        const normalizedTitle = book.title.toLowerCase().trim();
        const normalizedAuthor = book.author.toLowerCase().trim();
        const existingBooks = await getBooks(c.env.READING_ASSISTANT_KV);
        const existingBook = existingBooks.find((b) => {
          const existingTitle = b.title.toLowerCase().trim();
          const existingAuthor = b.author.toLowerCase().trim();
          return existingTitle === normalizedTitle && existingAuthor === normalizedAuthor;
        });
        if (existingBook) {
          errors.push(`Book "${bookData.title}" by ${bookData.author} already exists`);
          continue;
        }
        await saveBook(c.env.READING_ASSISTANT_KV, book);
        createdBooks.push(book);
      } catch (error) {
        errors.push(`Error importing book "${bookData.title}": ${error.message}`);
      }
    }
    return c.json({
      data: {
        imported: createdBooks.length,
        errors
      },
      message: `Imported ${createdBooks.length} books${errors.length > 0 ? `, ${errors.length} errors` : ""}`
    }, createdBooks.length > 0 ? 201 : 400);
  } catch (error) {
    console.error("Error importing books:", error);
    return c.json({
      error: {
        code: "IMPORT_ERROR",
        message: "Failed to import books"
      }
    }, 500);
  }
});
var books_default = app3;

// src/routes/genres.js
var app4 = new Hono2();
app4.get("/", async (c) => {
  try {
    const genres = await getGenres(c.env.READING_ASSISTANT_KV);
    return c.json({ data: genres });
  } catch (error) {
    console.error("Error fetching genres:", error);
    return c.json({
      error: {
        code: "FETCH_ERROR",
        message: "Failed to fetch genres"
      }
    }, 500);
  }
});
app4.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { name, description, isPredefined } = body;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return c.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Genre name is required"
        }
      }, 400);
    }
    const existingGenres = await getGenres(c.env.READING_ASSISTANT_KV);
    const duplicate = existingGenres.find((g) => g.name.toLowerCase() === name.toLowerCase().trim());
    if (duplicate) {
      return c.json({
        error: {
          code: "DUPLICATE_ERROR",
          message: "A genre with this name already exists"
        }
      }, 409);
    }
    const genre = {
      id: generateId(),
      name: name.trim(),
      description: description || null,
      isPredefined: isPredefined || false
    };
    const savedGenre = await saveGenre(c.env.READING_ASSISTANT_KV, genre);
    return c.json({
      data: savedGenre,
      message: "Genre created successfully"
    }, 201);
  } catch (error) {
    console.error("Error creating genre:", error);
    return c.json({
      error: {
        code: "CREATE_ERROR",
        message: "Failed to create genre"
      }
    }, 500);
  }
});
app4.get("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const genre = await getGenreById(c.env.READING_ASSISTANT_KV, id);
    if (!genre) {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Genre not found"
        }
      }, 404);
    }
    return c.json({ data: genre });
  } catch (error) {
    console.error("Error fetching genre:", error);
    return c.json({
      error: {
        code: "FETCH_ERROR",
        message: "Failed to fetch genre"
      }
    }, 500);
  }
});
app4.put("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const updates = await c.req.json();
    const existingGenre = await getGenreById(c.env.READING_ASSISTANT_KV, id);
    if (!existingGenre) {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Genre not found"
        }
      }, 404);
    }
    if (existingGenre.isPredefined) {
      return c.json({
        error: {
          code: "FORBIDDEN",
          message: "Cannot edit predefined genres"
        }
      }, 403);
    }
    if (updates.name !== void 0) {
      if (typeof updates.name !== "string" || updates.name.trim().length === 0) {
        return c.json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Genre name must be a non-empty string"
          }
        }, 400);
      }
      const allGenres = await getGenres(c.env.READING_ASSISTANT_KV);
      const duplicate = allGenres.find(
        (g) => g.id !== id && g.name.toLowerCase() === updates.name.toLowerCase().trim()
      );
      if (duplicate) {
        return c.json({
          error: {
            code: "DUPLICATE_ERROR",
            message: "Another genre with this name already exists"
          }
        }, 409);
      }
      updates.name = updates.name.trim();
    }
    const updatedGenre = {
      ...existingGenre,
      ...updates
    };
    const savedGenre = await saveGenre(c.env.READING_ASSISTANT_KV, updatedGenre);
    return c.json({
      data: savedGenre,
      message: "Genre updated successfully"
    });
  } catch (error) {
    console.error("Error updating genre:", error);
    return c.json({
      error: {
        code: "UPDATE_ERROR",
        message: "Failed to update genre"
      }
    }, 500);
  }
});
app4.delete("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const existingGenre = await getGenreById(c.env.READING_ASSISTANT_KV, id);
    if (!existingGenre) {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Genre not found"
        }
      }, 404);
    }
    if (existingGenre.isPredefined) {
      return c.json({
        error: {
          code: "FORBIDDEN",
          message: "Cannot delete predefined genres"
        }
      }, 403);
    }
    await deleteGenre(c.env.READING_ASSISTANT_KV, id);
    return c.json({
      message: "Genre deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting genre:", error);
    return c.json({
      error: {
        code: "DELETE_ERROR",
        message: "Failed to delete genre"
      }
    }, 500);
  }
});
var genres_default = app4;

// src/routes/sessions.js
var app5 = new Hono2();
app5.get("/", async (c) => {
  try {
    const sessions = await getSessions(c.env.READING_ASSISTANT_KV);
    return c.json({ data: sessions });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return c.json({
      error: {
        code: "FETCH_ERROR",
        message: "Failed to fetch sessions"
      }
    }, 500);
  }
});
app5.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const {
      date,
      bookId,
      bookTitle,
      author,
      assessment,
      notes,
      environment,
      studentId,
      bookPreference
    } = body;
    if (!date || typeof date !== "string") {
      return c.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Session date is required"
        }
      }, 400);
    }
    if (!assessment || typeof assessment !== "string" || assessment.trim().length === 0) {
      return c.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Session assessment is required"
        }
      }, 400);
    }
    if (!environment || !["school", "home"].includes(environment)) {
      return c.json({
        error: {
          code: "VALIDATION_ERROR",
          message: 'Environment must be either "school" or "home"'
        }
      }, 400);
    }
    if (bookPreference && !["liked", "meh", "disliked"].includes(bookPreference)) {
      return c.json({
        error: {
          code: "VALIDATION_ERROR",
          message: 'Book preference must be "liked", "meh", or "disliked"'
        }
      }, 400);
    }
    if (!studentId || typeof studentId !== "string") {
      return c.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Student ID is required"
        }
      }, 400);
    }
    const student = await getStudentById(c.env.READING_ASSISTANT_KV, studentId);
    if (!student) {
      return c.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Student not found"
        }
      }, 400);
    }
    if (bookId) {
      const book = await getBookById(c.env.READING_ASSISTANT_KV, bookId);
      if (!book) {
        return c.json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Book not found"
          }
        }, 400);
      }
    }
    let finalBookTitle = bookTitle;
    let finalAuthor = author;
    if (bookId && !bookTitle) {
      const book = await getBookById(c.env.READING_ASSISTANT_KV, bookId);
      if (book) {
        finalBookTitle = book.title;
        finalAuthor = book.author;
      }
    }
    if (!finalBookTitle || !finalAuthor) {
      return c.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Book title and author are required"
        }
      }, 400);
    }
    const session = {
      id: generateId(),
      date,
      bookId: bookId || null,
      bookTitle: finalBookTitle,
      author: finalAuthor,
      assessment: assessment.trim(),
      notes: notes ? notes.trim() : null,
      environment,
      studentId,
      bookPreference: bookPreference || null
    };
    const savedSession = await saveSession(c.env.READING_ASSISTANT_KV, session);
    return c.json({
      data: savedSession,
      message: "Reading session created successfully"
    }, 201);
  } catch (error) {
    console.error("Error creating session:", error);
    return c.json({
      error: {
        code: "CREATE_ERROR",
        message: "Failed to create reading session"
      }
    }, 500);
  }
});
app5.get("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const sessions = await getSessions(c.env.READING_ASSISTANT_KV);
    const session = sessions.find((s) => s.id === id);
    if (!session) {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Session not found"
        }
      }, 404);
    }
    return c.json({ data: session });
  } catch (error) {
    console.error("Error fetching session:", error);
    return c.json({
      error: {
        code: "FETCH_ERROR",
        message: "Failed to fetch session"
      }
    }, 500);
  }
});
app5.put("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const updates = await c.req.json();
    const sessions = await getSessions(c.env.READING_ASSISTANT_KV);
    const existingSession = sessions.find((s) => s.id === id);
    if (!existingSession) {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Session not found"
        }
      }, 404);
    }
    if (updates.environment && !["school", "home"].includes(updates.environment)) {
      return c.json({
        error: {
          code: "VALIDATION_ERROR",
          message: 'Environment must be either "school" or "home"'
        }
      }, 400);
    }
    if (updates.studentId) {
      const student = await getStudentById(c.env.READING_ASSISTANT_KV, updates.studentId);
      if (!student) {
        return c.json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Student not found"
          }
        }, 400);
      }
    }
    if (updates.bookId) {
      const book = await getBookById(c.env.READING_ASSISTANT_KV, updates.bookId);
      if (!book) {
        return c.json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Book not found"
          }
        }, 400);
      }
      if (book) {
        updates.bookTitle = book.title;
        updates.author = book.author;
      }
    }
    const updatedSession = {
      ...existingSession,
      ...updates
    };
    await deleteSession(c.env.READING_ASSISTANT_KV, id);
    const savedSession = await saveSession(c.env.READING_ASSISTANT_KV, updatedSession);
    return c.json({
      data: savedSession,
      message: "Session updated successfully"
    });
  } catch (error) {
    console.error("Error updating session:", error);
    return c.json({
      error: {
        code: "UPDATE_ERROR",
        message: "Failed to update session"
      }
    }, 500);
  }
});
app5.delete("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const sessions = await getSessions(c.env.READING_ASSISTANT_KV);
    const existingSession = sessions.find((s) => s.id === id);
    if (!existingSession) {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Session not found"
        }
      }, 404);
    }
    await deleteSession(c.env.READING_ASSISTANT_KV, id);
    return c.json({
      message: "Session deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting session:", error);
    return c.json({
      error: {
        code: "DELETE_ERROR",
        message: "Failed to delete session"
      }
    }, 500);
  }
});
app5.get("/student/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const student = await getStudentById(c.env.READING_ASSISTANT_KV, id);
    if (!student) {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Student not found"
        }
      }, 404);
    }
    const sessions = await getSessionsByStudent(c.env.READING_ASSISTANT_KV, id);
    return c.json({ data: sessions });
  } catch (error) {
    console.error("Error fetching student sessions:", error);
    return c.json({
      error: {
        code: "FETCH_ERROR",
        message: "Failed to fetch student sessions"
      }
    }, 500);
  }
});
var sessions_default = app5;

// src/routes/recommendations.js
var app6 = new Hono2();
app6.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { studentId, limit = 5 } = body;
    if (!studentId || typeof studentId !== "string") {
      return c.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Student ID is required"
        }
      }, 400);
    }
    const student = await getStudentById(c.env.READING_ASSISTANT_KV, studentId);
    if (!student) {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Student not found"
        }
      }, 404);
    }
    const sessions = await getSessionsByStudent(c.env.READING_ASSISTANT_KV, studentId);
    const allBooks = await getBooks(c.env.READING_ASSISTANT_KV);
    const genres = await getGenres(c.env.READING_ASSISTANT_KV);
    const readBookIds = new Set(sessions.map((session) => session.bookId).filter(Boolean));
    const recommendations = await generateRecommendations(
      student,
      sessions,
      allBooks,
      genres,
      readBookIds,
      limit
    );
    return c.json({
      data: recommendations,
      message: "Recommendations generated successfully"
    });
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return c.json({
      error: {
        code: "RECOMMENDATION_ERROR",
        message: "Failed to generate recommendations"
      }
    }, 500);
  }
});
async function generateRecommendations(student, sessions, allBooks, genres, readBookIds, limit) {
  const recommendations = [];
  const studentPreferences = student.preferences || {};
  const unreadBooks = allBooks.filter((book) => !readBookIds.has(book.id));
  const scoredBooks = unreadBooks.map((book) => {
    let score = 0;
    if (studentPreferences.favoriteGenreIds && studentPreferences.favoriteGenreIds.length > 0) {
      const matchingGenres = book.genreIds.filter(
        (genreId) => studentPreferences.favoriteGenreIds.includes(genreId)
      );
      score += matchingGenres.length * 3;
    }
    if (studentPreferences.dislikes && studentPreferences.dislikes.length > 0) {
      const dislikedGenres = genres.filter(
        (genre) => studentPreferences.dislikes.some(
          (dislike) => genre.name.toLowerCase().includes(dislike.toLowerCase())
        )
      );
      const dislikedGenreIds = dislikedGenres.map((g) => g.id);
      const hasDislikedGenre = book.genreIds.some((genreId) => dislikedGenreIds.includes(genreId));
      if (hasDislikedGenre) {
        score -= 5;
      }
    }
    if (student.readingLevel && book.readingLevel) {
      if (student.readingLevel === book.readingLevel) {
        score += 2;
      }
    }
    if (book.ageRange) {
      score += 1;
    }
    score += Math.random() * 2;
    return { book, score };
  });
  scoredBooks.sort((a, b) => b.score - a.score);
  return scoredBooks.slice(0, limit).map((item) => ({
    book: item.book,
    score: item.score,
    reasoning: generateReasoning(student, item.book, genres, studentPreferences)
  }));
}
__name(generateRecommendations, "generateRecommendations");
function generateReasoning(student, book, genres, preferences) {
  const reasons = [];
  if (preferences.favoriteGenreIds && preferences.favoriteGenreIds.length > 0) {
    const bookGenres = genres.filter((g) => book.genreIds.includes(g.id));
    const favoriteGenres = genres.filter((g) => preferences.favoriteGenreIds.includes(g.id));
    const matchingGenres = bookGenres.filter(
      (bg) => favoriteGenres.some((fg) => fg.id === bg.id)
    );
    if (matchingGenres.length > 0) {
      reasons.push(`Matches favorite genre: ${matchingGenres.map((g) => g.name).join(", ")}`);
    }
  }
  if (student.readingLevel && book.readingLevel && student.readingLevel === book.readingLevel) {
    reasons.push(`Matches current reading level: ${student.readingLevel}`);
  }
  if (book.ageRange) {
    reasons.push(`Age appropriate content`);
  }
  if (reasons.length === 0) {
    const bookGenres = genres.filter((g) => book.genreIds.includes(g.id));
    if (bookGenres.length > 0) {
      reasons.push(`Features ${bookGenres.map((g) => g.name).join(", ")} genre`);
    } else {
      reasons.push("Recommended based on general appeal");
    }
  }
  return reasons;
}
__name(generateReasoning, "generateReasoning");
var recommendations_default = app6;

// src/routes/settings.js
var app7 = new Hono2();
app7.get("/", async (c) => {
  try {
    const settings = await getSettings(c.env.READING_ASSISTANT_KV);
    if (!settings) {
      return c.json({
        error: {
          code: "NOT_FOUND",
          message: "Settings not found"
        }
      }, 404);
    }
    return c.json({ data: settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return c.json({
      error: {
        code: "FETCH_ERROR",
        message: "Failed to fetch settings"
      }
    }, 500);
  }
});
app7.put("/", async (c) => {
  try {
    const updates = await c.req.json();
    const currentSettings = await getSettings(c.env.READING_ASSISTANT_KV) || {
      readingStatusSettings: {
        recentlyReadDays: 7,
        needsAttentionDays: 14
      }
    };
    if (updates.readingStatusSettings) {
      const { readingStatusSettings } = updates;
      if (readingStatusSettings.recentlyReadDays !== void 0) {
        const days = parseInt(readingStatusSettings.recentlyReadDays);
        if (isNaN(days) || days < 1 || days > 365) {
          return c.json({
            error: {
              code: "VALIDATION_ERROR",
              message: "Recently read days must be a number between 1 and 365"
            }
          }, 400);
        }
        readingStatusSettings.recentlyReadDays = days;
      }
      if (readingStatusSettings.needsAttentionDays !== void 0) {
        const days = parseInt(readingStatusSettings.needsAttentionDays);
        if (isNaN(days) || days < 1 || days > 365) {
          return c.json({
            error: {
              code: "VALIDATION_ERROR",
              message: "Needs attention days must be a number between 1 and 365"
            }
          }, 400);
        }
        readingStatusSettings.needsAttentionDays = days;
      }
      if (readingStatusSettings.recentlyReadDays >= readingStatusSettings.needsAttentionDays) {
        return c.json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Recently read days must be less than needs attention days"
          }
        }, 400);
      }
    }
    const updatedSettings = {
      ...currentSettings,
      ...updates,
      readingStatusSettings: {
        ...currentSettings.readingStatusSettings,
        ...updates.readingStatusSettings
      }
    };
    const savedSettings = await saveSettings2(c.env.READING_ASSISTANT_KV, updatedSettings);
    return c.json({
      data: savedSettings,
      message: "Settings updated successfully"
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return c.json({
      error: {
        code: "UPDATE_ERROR",
        message: "Failed to update settings"
      }
    }, 500);
  }
});
var settings_default = app7;

// src/routes/data.js
var app8 = new Hono2();
app8.get("/export", async (c) => {
  try {
    const [students, classes, books, genres, sessions, settings] = await Promise.all([
      getStudents(c.env.READING_ASSISTANT_KV),
      getClasses(c.env.READING_ASSISTANT_KV),
      getBooks(c.env.READING_ASSISTANT_KV),
      getGenres(c.env.READING_ASSISTANT_KV),
      getSessions(c.env.READING_ASSISTANT_KV),
      getSettings(c.env.READING_ASSISTANT_KV)
    ]);
    const exportData = {
      exportDate: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.0.0",
      data: {
        students,
        classes,
        books,
        genres,
        sessions,
        settings: settings || {
          readingStatusSettings: {
            recentlyReadDays: 7,
            needsAttentionDays: 14
          }
        }
      }
    };
    return c.json({
      data: exportData,
      message: "Data exported successfully"
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return c.json({
      error: {
        code: "EXPORT_ERROR",
        message: "Failed to export data"
      }
    }, 500);
  }
});
app8.post("/import", async (c) => {
  try {
    const body = await c.req.json();
    const { data, options = {} } = body;
    if (!data) {
      return c.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Import data is required"
        }
      }, 400);
    }
    const { overwrite = false } = options;
    const results = {
      students: { imported: 0, errors: [] },
      classes: { imported: 0, errors: [] },
      books: { imported: 0, errors: [] },
      genres: { imported: 0, errors: [] },
      sessions: { imported: 0, errors: [] }
    };
    const [existingStudents, existingClasses, existingBooks, existingGenres] = await Promise.all([
      getStudents(c.env.READING_ASSISTANT_KV),
      getClasses(c.env.READING_ASSISTANT_KV),
      getBooks(c.env.READING_ASSISTANT_KV),
      getGenres(c.env.READING_ASSISTANT_KV)
    ]);
    const existingStudentNames = new Set(existingStudents.map((s) => s.name.toLowerCase()));
    const existingClassNames = new Set(existingClasses.map((c2) => c2.name.toLowerCase()));
    const existingBookTitles = new Set(existingBooks.map((b) => `${b.title.toLowerCase()}|${b.author.toLowerCase()}`));
    const existingGenreNames = new Set(existingGenres.map((g) => g.name.toLowerCase()));
    if (data.genres) {
      for (const genreData of data.genres) {
        try {
          if (!genreData.name) {
            results.genres.errors.push("Genre missing name");
            continue;
          }
          const genreName = genreData.name.toLowerCase();
          if (!overwrite && existingGenreNames.has(genreName)) {
            results.genres.errors.push(`Genre "${genreData.name}" already exists`);
            continue;
          }
          const genre = {
            id: overwrite ? genreData.id || generateId() : generateId(),
            name: genreData.name,
            description: genreData.description || null,
            isPredefined: genreData.isPredefined || false
          };
          await saveGenre(c.env.READING_ASSISTANT_KV, genre);
          results.genres.imported++;
        } catch (error) {
          results.genres.errors.push(`Error importing genre "${genreData.name}": ${error.message}`);
        }
      }
    }
    if (data.classes) {
      for (const classData of data.classes) {
        try {
          if (!classData.name) {
            results.classes.errors.push("Class missing name");
            continue;
          }
          const className = classData.name.toLowerCase();
          if (!overwrite && existingClassNames.has(className)) {
            results.classes.errors.push(`Class "${classData.name}" already exists`);
            continue;
          }
          const classEntity = {
            id: overwrite ? classData.id || generateId() : generateId(),
            name: classData.name,
            teacherName: classData.teacherName || null,
            schoolYear: classData.schoolYear || null,
            disabled: classData.disabled || false,
            createdAt: classData.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          await saveClass(c.env.READING_ASSISTANT_KV, classEntity);
          results.classes.imported++;
        } catch (error) {
          results.classes.errors.push(`Error importing class "${classData.name}": ${error.message}`);
        }
      }
    }
    if (data.books) {
      for (const bookData of data.books) {
        try {
          if (!bookData.title || !bookData.author) {
            results.books.errors.push("Book missing title or author");
            continue;
          }
          const bookKey = `${bookData.title.toLowerCase()}|${bookData.author.toLowerCase()}`;
          if (!overwrite && existingBookTitles.has(bookKey)) {
            results.books.errors.push(`Book "${bookData.title}" by ${bookData.author} already exists`);
            continue;
          }
          const book = {
            id: overwrite ? bookData.id || generateId() : generateId(),
            title: bookData.title,
            author: bookData.author,
            genreIds: bookData.genreIds || [],
            readingLevel: bookData.readingLevel || null,
            ageRange: bookData.ageRange || null
          };
          await saveBook(c.env.READING_ASSISTANT_KV, book);
          results.books.imported++;
        } catch (error) {
          results.books.errors.push(`Error importing book "${bookData.title}": ${error.message}`);
        }
      }
    }
    if (data.students) {
      for (const studentData of data.students) {
        try {
          if (!studentData.name) {
            results.students.errors.push("Student missing name");
            continue;
          }
          const studentName = studentData.name.toLowerCase();
          if (!overwrite && existingStudentNames.has(studentName)) {
            results.students.errors.push(`Student "${studentData.name}" already exists`);
            continue;
          }
          const student = {
            id: overwrite ? studentData.id || generateId() : generateId(),
            name: studentData.name,
            classId: studentData.classId || null,
            readingLevel: studentData.readingLevel || null,
            lastReadDate: studentData.lastReadDate || null,
            preferences: {
              favoriteGenreIds: [],
              likes: [],
              dislikes: [],
              readingFormats: [],
              ...studentData.preferences
            },
            readingSessions: [],
            createdAt: studentData.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          await saveStudent(c.env.READING_ASSISTANT_KV, student);
          results.students.imported++;
        } catch (error) {
          results.students.errors.push(`Error importing student "${studentData.name}": ${error.message}`);
        }
      }
    }
    if (data.sessions) {
      for (const sessionData of data.sessions) {
        try {
          if (!sessionData.studentId || !sessionData.date || !sessionData.assessment) {
            results.sessions.errors.push("Session missing required fields");
            continue;
          }
          const session = {
            id: overwrite ? sessionData.id || generateId() : generateId(),
            date: sessionData.date,
            bookId: sessionData.bookId || null,
            bookTitle: sessionData.bookTitle,
            author: sessionData.author,
            assessment: sessionData.assessment,
            notes: sessionData.notes || null,
            environment: sessionData.environment || "school",
            studentId: sessionData.studentId
          };
          await saveSession(c.env.READING_ASSISTANT_KV, session);
          results.sessions.imported++;
        } catch (error) {
          results.sessions.errors.push(`Error importing session: ${error.message}`);
        }
      }
    }
    if (data.settings) {
      try {
        await saveSettings(c.env.READING_ASSISTANT_KV, data.settings);
      } catch (error) {
        console.error("Error importing settings:", error);
      }
    }
    const hasErrors = Object.values(results).some((result) => result.errors.length > 0);
    const totalImported = Object.values(results).reduce((sum, result) => sum + result.imported, 0);
    return c.json({
      data: results,
      message: `Import completed. Imported ${totalImported} records${hasErrors ? ` with ${Object.values(results).reduce((sum, result) => sum + result.errors.length, 0)} errors` : ""}`
    }, hasErrors ? 207 : 201);
  } catch (error) {
    console.error("Error importing data:", error);
    return c.json({
      error: {
        code: "IMPORT_ERROR",
        message: "Failed to import data"
      }
    }, 500);
  }
});
var data_default = app8;

// src/worker.js
var app9 = new Hono2();
app9.use("*", logger());
app9.use("*", prettyJSON());
app9.use("*", cors({
  origin: /* @__PURE__ */ __name((origin) => origin?.includes("localhost") || origin?.includes("127.0.0.1") ? origin : "*", "origin"),
  credentials: true
}));
app9.get("/health", (c) => c.json({
  status: "ok",
  timestamp: (/* @__PURE__ */ new Date()).toISOString(),
  environment: c.env.ENVIRONMENT || "development"
}));
app9.route("/api/students", students_default);
app9.route("/api/classes", classes_default);
app9.route("/api/books", books_default);
app9.route("/api/genres", genres_default);
app9.route("/api/sessions", sessions_default);
app9.route("/api/recommendations", recommendations_default);
app9.route("/api/settings", settings_default);
app9.route("/api/data", data_default);
app9.get("*", async (c) => {
  const url = new URL(c.req.url);
  const pathname = url.pathname;
  if (pathname.startsWith("/api/") || pathname.startsWith("/health")) {
    return c.notFound();
  }
  try {
    const assetPath = pathname === "/" ? "/index.html" : pathname;
    console.log("Looking for asset:", assetPath);
    const asset = await c.env.ASSETS.fetch(new Request(`https://example.com${assetPath}`));
    if (asset.ok) {
      console.log("Serving asset:", assetPath, "with status:", asset.status);
      const response = new Response(asset.body, {
        status: asset.status,
        statusText: asset.statusText,
        headers: asset.headers
      });
      if (pathname.endsWith(".js")) {
        response.headers.set("Content-Type", "application/javascript");
      }
      if (pathname === "/" || pathname === "/index.html") {
        response.headers.set("Cache-Control", "no-cache");
      } else {
        response.headers.set("Cache-Control", "public, max-age=31536000");
      }
      return response;
    } else {
      console.log("Asset not found:", assetPath, "status:", asset.status);
    }
  } catch (error) {
    console.error("Error serving asset:", error);
  }
  if (pathname !== "/") {
    try {
      const indexAsset = await c.env.ASSETS.fetch(new Request("https://example.com/index.html"));
      if (indexAsset.ok) {
        return new Response(indexAsset.body, {
          headers: {
            "Content-Type": "text/html",
            "Cache-Control": "no-cache"
          }
        });
      }
    } catch (error) {
      console.error("Error serving index.html:", error);
    }
  }
  return c.html(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reading Assistant - Primary School Reading Tracker</title>
    <meta name="description" content="A comprehensive reading tracking system for primary school students with AI-powered book recommendations" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <!-- Preconnect to fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
      rel="stylesheet"
    />
    <!-- Material Icons -->
    <link
      href="https://fonts.googleapis.com/icon?family=Material+Icons"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <!-- Scripts will be injected here by the build process -->
  <script defer src="/static/js/lib-react.fd756841.js"><\/script><script defer src="/static/js/lib-router.7cc6ab1b.js"><\/script><script defer src="/static/js/366.42b9c958.js"><\/script><script defer src="/static/js/index.3ed40cec.js"><\/script></body>
</html>`);
});
app9.onError((err, c) => {
  console.error("Worker error:", err);
  return c.json({ error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" } }, 500);
});
app9.notFound((c) => {
  const url = new URL(c.req.url);
  if (url.pathname.startsWith("/api/")) {
    return c.json({ error: { code: "NOT_FOUND", message: "API endpoint not found" } }, 404);
  }
  return c.text("Page not found", { status: 404 });
});
var worker_default = {
  async fetch(request, env, ctx) {
    ctx.waitUntil(
      (async () => {
        try {
          await initializeDefaultGenres(env.READING_ASSISTANT_KV);
          await initializeDefaultSettings(env.READING_ASSISTANT_KV);
        } catch (error) {
          console.error("Failed to initialize default data:", error);
        }
      })()
    );
    return app9.fetch(request, { ...env, ctx });
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-uxDWdA/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-uxDWdA/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map

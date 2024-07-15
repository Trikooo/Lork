function parseUrl(url) {
  let remainingStr = url
  let protocol = null;
  let host = null;
  let port = null;
  let path = null;
  let query = null;
  let fragment = null;
  let queryObject = {};
  if (remainingStr.includes("://")) {
    const split = remainingStr.split("://");
    protocol = split[0];
    remainingStr = split[1];
  }

  let hostPort = remainingStr.split("/")[0];
  remainingStr = remainingStr.replace(hostPort, "");
  if (hostPort.includes(":")) {
    const split = hostPort.split(":");
    host = split[0];
    port = split[1];
  } else {
    if (!hostPort === "") {
      host = hostPort;
    }
  }

  if (remainingStr.includes("?")) {
    const split = remainingStr.split("?");
    path = split[0];
    remainingStr = split[1];
    if (remainingStr.includes("#")) {
      const split = remainingStr.split("#");
      query = split[0];
      fragment = split[1];
      remainingStr = "";
    }
  } else if (remainingStr.includes("#") && !remainingStr.includes("?")) {
    const split = remainingStr.split("#");
    path = split[0];
    fragment = split[1];
    remainingStr = "";
  } else {
    path = remainingStr;
    remainingStr = "";
  }
  // query parsing...
  if (query) {
    if (query.includes("&")) {
      query = query.split("&");
    }
    for (const pair of query) {
      const split = pair.split("=");
      queryObject = { ...queryObject, [split[0]]: split[1] };
    }
  }
  let parsedUrl = {
    protocol: protocol,
    host: host,
    port: port,
    path: path,
    query: queryObject,
    fragment: fragment,
  };

  return parsedUrl;
}

module.exports = {parseUrl}
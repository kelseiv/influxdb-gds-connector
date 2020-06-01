const InfluxDBClient = require("../src/InfluxDBClient");

let client;

beforeEach(() => {
  client = new InfluxDBClient();
  UrlFetchApp = jest.fn();
  UrlFetchApp.fetch = jest.fn();

  let httpResponse = jest.fn();
  httpResponse.getContentText = jest.fn();

  UrlFetchApp.fetch.mockReturnValueOnce(httpResponse);

  Utilities = jest.fn();
  Utilities.parseCsv = jest.fn();
});

describe("get buckets", () => {
  test("success", () => {
    // noinspection JSConsecutiveCommasInArrayLiteral
    const csv = [
      [, "result", "table", "_value"],
      [, "_result", 0, "HEALTH"],
      [, "_result", 0, "_monitoring"],
      [, "_result", 0, "_tasks"],
      [, "_result", 0, "github"],
      [, , ,]
    ];

    Utilities.parseCsv.mockReturnValueOnce(csv);

    let configParams = {};
    configParams.INFLUXDB_URL = "http://localhost:9999";
    configParams.INFLUXDB_TOKEN = "my-token";
    configParams.INFLUXDB_ORG = "my-org";

    let buckets = client.getBuckets(configParams);
    expect(UrlFetchApp.fetch.mock.calls.length).toBe(1);
    expect(UrlFetchApp.fetch.mock.calls[0][0]).toBe(
      "http://localhost:9999/api/v2/query?org=my-org"
    );
    expect(UrlFetchApp.fetch.mock.calls[0][1]).toStrictEqual({
      contentType: "application/vnd.flux",
      headers: { Accept: "application/csv", Authorization: "Token my-token" },
      method: "post",
      payload:
        'buckets() |> rename(columns: {"name": "_value"}) |> keep(columns: ["_value"]) |> sort(columns: ["_value"], desc: false)'
    });

    expect(buckets).toHaveLength(4);
    expect(buckets).toEqual(["HEALTH", "_monitoring", "_tasks", "github"]);
  });
});

describe("get measurements", () => {
  test("success", () => {
    // noinspection JSConsecutiveCommasInArrayLiteral
    const csv = [
      [, "result", "table", "_value"],
      [, "_result", 0, "circleci"],
      [, "_result", 0, "github_repository"],
      [, , ,]
    ];

    Utilities.parseCsv.mockReturnValueOnce(csv);

    let configParams = {};
    configParams.INFLUXDB_URL = "http://localhost:9999";
    configParams.INFLUXDB_TOKEN = "my-token";
    configParams.INFLUXDB_ORG = "my-org";
    configParams.INFLUXDB_BUCKET = "my-bucket";

    let buckets = client.getMeasurements(configParams);
    expect(UrlFetchApp.fetch.mock.calls.length).toBe(1);
    expect(UrlFetchApp.fetch.mock.calls[0][0]).toBe(
      "http://localhost:9999/api/v2/query?org=my-org"
    );
    expect(UrlFetchApp.fetch.mock.calls[0][1]).toStrictEqual({
      contentType: "application/vnd.flux",
      headers: { Accept: "application/csv", Authorization: "Token my-token" },
      method: "post",
      payload:
        'import "influxdata/influxdb/v1" v1.measurements(bucket: "my-bucket")'
    });

    expect(buckets).toHaveLength(2);
    expect(buckets).toEqual(["circleci", "github_repository"]);
  });
});

describe("build URL", () => {
  test("value", () => {
    let configParams = {};
    configParams.INFLUXDB_URL = "http://localhost:9999";
    configParams.INFLUXDB_ORG = "my-org";

    let url = client._buildURL(configParams);
    expect(url).toEqual("http://localhost:9999/api/v2/query?org=my-org");
  });

  test("slash at the end", () => {
    let configParams = {};
    configParams.INFLUXDB_URL = "http://localhost:9999/";
    configParams.INFLUXDB_ORG = "my-org";

    let url = client._buildURL(configParams);
    expect(url).toEqual("http://localhost:9999/api/v2/query?org=my-org");
  });

  test("escaped org", () => {
    let configParams = {};
    configParams.INFLUXDB_URL = "http://localhost:9999";
    configParams.INFLUXDB_ORG = "my org";

    let url = client._buildURL(configParams);
    expect(url).toEqual("http://localhost:9999/api/v2/query?org=my%20org");
  });
});

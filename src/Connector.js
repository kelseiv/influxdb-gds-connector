var cc = DataStudioApp.createCommunityConnector();
var client = new InfluxDBClient();

/**
 * Returns the Auth Type of this connector.
 * @return {object} The Auth type.
 */
function getAuthType() {
  return cc
    .newAuthTypeResponse()
    .setAuthType(cc.AuthType.NONE)
    .build();
}

/**
 * This checks whether the current user is an admin user of the connector.
 *
 * @returns {boolean} Returns true if the current authenticated user at the time
 * of function execution is an admin user of the connector. If the function is
 * omitted or if it returns false, then the current user will not be considered
 * an admin user of the connector.
 */
function isAdminUser() {
  return false;
}

// https://developers.google.com/datastudioUrlFetchApp/connector/build#define_the_fields_with_getschema
function getFields(request) {
  var fields = cc.getFields();
  var types = cc.FieldType;

  fields
    .newDimension()
    .setId("measurement")
    .setName("Measurement")
    .setType(types.TEXT);

  return fields;
}

// https://developers.google.com/datastudio/connector/reference#getconfig
function getConfig(request) {
  var config = cc.getConfig();

  config
    .newTextInput()
    .setId("INFLUXDB_URL")
    .setName("InfluxDB URL")
    .setHelpText("e.g. https://us-west-2-1.aws.cloud2.influxdata.com");

  config
    .newInfo()
    .setId("instructions-token")
    .setText(
      "How to retrieve the token in the InfluxDB UI: https://v2.docs.influxdata.com/v2.0/security/tokens/view-tokens/."
    );

  config
    .newTextInput()
    .setId("INFLUXDB_TOKEN")
    .setName("Token")
    .setHelpText(
      "e.g. 2gihWWvM3_r1Q58GwSsF03iR9wsnjS4X6qNP9SLKj5eURe5-_eR0HMia-gU1gSAJ8SiCIzymRLgU1pmTV-0dDA=="
    );

  return config.build();
}

function getSchema(request) {
  validateConfig(request.configParams);
  var fields = getFields(request).build();
  return { schema: fields };
}

function getData(request) {
  request.configParams = validateConfig(request.configParams);

  var requestedFields = getFields().forIds(
    request.fields.map(function(field) {
      return field.name;
    })
  );

  return {
    schema: requestedFields.build(),
    rows: []
  };
}

/**
 * Validate config object and throw error if anything wrong.
 *
 * @param  {Object} configParams Config object supplied by user.
 */
function validateConfig(configParams) {
  let errors = client.validateConfig(configParams);
  if (errors) {
    throwUserError(errors);
  }
}

/**
 * Throws User-facing errors.
 *
 * @param  {string} message Error message.
 */
function throwUserError(message) {
  DataStudioApp.createCommunityConnector()
    .newUserError()
    .setText(message)
    .throwException();
}

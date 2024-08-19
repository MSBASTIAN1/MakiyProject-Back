"use strict";

const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
// AWS.config.update({ region: process.env.REGION });
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.REGION,
});

// Insert
module.exports.insert = async (event) => {
  console.log("insert", event);

  // Check if event.body is defined and not null
  if (!event.body) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow access from any origin
        "Access-Control-Allow-Credentials": true, // Allow credentials in requests
      },
      body: JSON.stringify(
        {
          message: "Error: The request body is empty.",
        },
        null,
        2
      ),
    };
  }

  const id = uuidv4();
  const body = JSON.parse(event.body);

  // Check if body contains the expected data
  if (
    !body.name ||
    !body.address ||
    !body.email ||
    !body.phone ||
    !body.website
  ) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow access from any origin
        "Access-Control-Allow-Credentials": true, // Allow credentials in requests
      },
      body: JSON.stringify(
        {
          message:
            "Error: The request body does not contain the expected data.",
        },
        null,
        2
      ),
    };
  }

  const supplier = {
    id: id,
    name: body.name,
    address: body.address,
    email: body.email,
    phone: body.phone,
    website: body.website,
  };

  const params = {
    TableName: process.env.SUPPLIERS_TABLE,
    Item: supplier,
  };

  try {
    const result = await dynamodb.put(params).promise();
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow access from any origin
        "Access-Control-Allow-Credentials": true, // Allow credentials in requests
      },
      body: JSON.stringify(
        {
          message: "Inserted Successfully",
          data: supplier,
        },
        null,
        2
      ),
    };
  } catch (error) {
    console.error("Error inserting data", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Error inserting data",
          error: error.message,
        },
        null,
        2
      ),
    };
  }
};

// Select
module.exports.select = async (event) => {
  console.log("select", event);

  // Define the parameters for the DynamoDB scan operation
  const params = {
    TableName: process.env.SUPPLIERS_TABLE,
  };

  try {
    // Execute the scan operation and wait for it to complete
    const result = await dynamodb.scan(params).promise();
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Data selected",
          result: result.Items, // result.Items contains the scanned data
        },
        null,
        2
      ),
    };
  } catch (error) {
    console.error("Error selecting data", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Error selecting data",
          error: error.message,
        },
        null,
        2
      ),
    };
  }
};

// Update
module.exports.update = async (event) => {
  console.log("update", event);

  // Parse the request body to get the data provided by the client
  const body = JSON.parse(event.body);

  // Define the parameters for the DynamoDB update operation
  const params = {
    TableName: process.env.SUPPLIERS_TABLE, // Specify the table where the update will occur
    Key: {
      id: body.id, // Specify the primary key of the item to be updated
    },
    // Update expression to modify the item's attributes, capturing reserved words
    UpdateExpression:
      "SET #name = :name, address = :address, email = :email, phone = :phone, website = :website",
    // Aliases for reserved keywords
    ExpressionAttributeNames: {
      "#name": "name",
    },
    // Values for the attributes to be set
    ExpressionAttributeValues: {
      ":name": body.name,
      ":address": body.address,
      ":email": body.email,
      ":phone": body.phone,
      ":website": body.website,
    },
    // Condition to ensure the item exists
    ConditionExpression: "attribute_exists(id)",
  };

  try {
    // Execute the update operation and wait for it to complete
    await dynamodb.update(params).promise();
    // Create the updated supplier object to display it later
    const updatedSupplier = {
      id: body.id,
      name: body.name,
      address: body.address,
      email: body.email,
      phone: body.phone,
      website: body.website,
    };

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Updated",
          data: updatedSupplier,
        },
        null,
        2
      ),
    };
  } catch (error) {
    // If the condition fails (if the item does not exist), DynamoDB will throw an error
    if (error.code === "ConditionalCheckFailedException") {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify(
          {
            message: "The item with the provided id does not exist.",
          },
          null,
          2
        ),
      };
    }
    console.error("Error updating data", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Error updating data",
          error: error.message,
        },
        null,
        2
      ),
    };
  }
};

// Delete
module.exports.delete = async (event) => {
  console.log("delete", event);

  // Verificar si el ID está presente en los parámetros de la ruta
  if (!event.pathParameters || !event.pathParameters.id) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        { message: "Error: The request must contain the id in the path." },
        null,
        2
      ),
    };
  }

  const { id } = event.pathParameters;

  // Parámetros para obtener el ítem antes de eliminarlo
  const getParams = {
    TableName: process.env.SUPPLIERS_TABLE,
    Key: {
      id,
    },
  };

  // Parámetros para la operación de eliminación en DynamoDB
  const deleteParams = {
    TableName: process.env.SUPPLIERS_TABLE,
    Key: {
      id,
    },
    ConditionExpression: "attribute_exists(id)",
  };

  try {
    // Obtener el ítem antes de eliminarlo
    const result = await dynamodb.get(getParams).promise();
    const supplierToDelete = result.Item;

    // Verificar si el ítem existe
    if (!supplierToDelete) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify(
          { message: "The item with the provided id does not exist." },
          null,
          2
        ),
      };
    }

    // Ejecutar la operación de eliminación
    await dynamodb.delete(deleteParams).promise();

    // Retornar una respuesta con los datos del ítem eliminado
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Deleted",
          data: supplierToDelete,
        },
        null,
        2
      ),
    };
  } catch (error) {
    console.error("Error deleting data", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Error deleting data",
          error: error.message,
        },
        null,
        2
      ),
    };
  }
};

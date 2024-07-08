"use strict";

const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.REGION,
});

// Insert
module.exports.insert = async (event) => {
  console.log("insertProduct", event);

  // Check if event.body is defined and not null
  if (!event.body) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow access from any origin
        "Access-Control-Allow-Credentials": true, // Allow credentials in requests
      },
      body: JSON.stringify(
        { message: "Error: The request body is empty." },
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
    !body.description ||
    !body.price ||
    !body.stock ||
    !body.supplier_id ||
    !body.image ||
    typeof body.available !== "boolean"
  ) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
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

  const product = {
    id: id,
    name: body.name,
    description: body.description,
    price: body.price,
    stock: body.stock,
    supplier_id: body.supplier_id,
    image: body.image,
    available: body.available,
  };

  const params = {
    TableName: process.env.PRODUCTS_TABLE,
    Item: product,
  };

  try {
    await dynamodb.put(params).promise();
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        { message: "Inserted Successfully", data: product },
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
        { message: "Error inserting data", error: error.message },
        null,
        2
      ),
    };
  }
};

// Select
module.exports.select = async (event) => {
  console.log("selectProducts", event);
  // Define the parameters for the DynamoDB scan operation
  const params = {
    TableName: process.env.PRODUCTS_TABLE,
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
        { message: "Data selected", result: result.Items },
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
        { message: "Error selecting data", error: error.message },
        null,
        2
      ),
    };
  }
};

// Update
module.exports.update = async (event) => {
  console.log("updateProduct", event);

  if (!event.body) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        { message: "Error: The request body is empty." },
        null,
        2
      ),
    };
  }

  // Parse the request body to get the data provided by the client
  const body = JSON.parse(event.body);

  if (!body.id) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        { message: "Error: The request body must contain the id." },
        null,
        2
      ),
    };
  }

  const params = {
    TableName: process.env.PRODUCTS_TABLE,
    Key: { id: body.id },
    UpdateExpression:
      "SET #name = :name, description = :description, price = :price, stock = :stock, supplier_id = :supplier_id, image = :image, available = :available",

    ExpressionAttributeNames: {
      "#name": "name",
    },

    ExpressionAttributeValues: {
      ":name": body.name,
      ":description": body.description,
      ":price": body.price,
      ":stock": body.stock,
      ":supplier_id": body.supplier_id,
      ":image": body.image,
      ":available": body.available,
    },
    ConditionExpression: "attribute_exists(id)",
  };

  try {
    await dynamodb.update(params).promise();
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        { message: "Updated Successfully", data: body },
        null,
        2
      ),
    };
  } catch (error) {
    if (error.code === "ConditionalCheckFailedException") {
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
    console.error("Error updating data", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        { message: "Error updating data", error: error.message },
        null,
        2
      ),
    };
  }
};

// Delete
module.exports.delete = async (event) => {
  console.log("deleteProduct", event);

  if (!event.body) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        { message: "Error: The request body is empty." },
        null,
        2
      ),
    };
  }

  const body = JSON.parse(event.body);

  if (!body.id) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        { message: "Error: The request body must contain the id." },
        null,
        2
      ),
    };
  }

  const params = {
    TableName: process.env.PRODUCTS_TABLE,
    Key: { id: body.id },
    ConditionExpression: "attribute_exists(id)",
  };

  try {
    const result = await dynamodb
      .get({ TableName: process.env.PRODUCTS_TABLE, Key: { id: body.id } })
      .promise();
    const productToDelete = result.Item;

    if (!productToDelete) {
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

    await dynamodb.delete(params).promise();
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        { message: "Deleted Successfully", data: productToDelete },
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
        { message: "Error deleting data", error: error.message },
        null,
        2
      ),
    };
  }
};

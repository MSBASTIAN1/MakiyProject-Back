"use strict";

const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
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
    !body.user_id ||
    !body.user_name ||
    !body.order_date ||
    !body.status ||
    !body.total ||
    !body.shipping_address ||
    !body.payment_method ||
    !body.quantity || // Check for quantity
    !body.products // Check for products
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

  const order = {
    id: id,
    user_id: body.user_id,
    user_name: body.user_name,
    order_date: body.order_date,
    status: body.status,
    total: body.total,
    shipping_address: body.shipping_address,
    payment_method: body.payment_method,
    quantity: body.quantity,
    products: body.products,
  };

  const params = {
    TableName: process.env.ORDERS_TABLE,
    Item: order,
  };

  try {
    await dynamodb.put(params).promise();
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow access from any origin
        "Access-Control-Allow-Credentials": true, // Allow credentials in requests
      },
      body: JSON.stringify(
        {
          message: "Inserted Successfully",
          data: order,
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
    TableName: process.env.ORDERS_TABLE,
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

//Update
module.exports.update = async (event) => {
  console.log("updateOrder", event);

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    };
  }

  console.log("lllegaste");
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
        {
          message: "Error: The request body must contain the id.",
        },
        null,
        2
      ),
    };
  }

  console.log("body:", body);

  const params = {
    TableName: process.env.ORDERS_TABLE,
    Key: { id: body.id },
    UpdateExpression:
      "SET user_id = :user_id, #user_name = :user_name, order_date = :order_date, #status = :status, #total = :total, shipping_address = :shipping_address, payment_method = :payment_method, quantity = :quantity, products = :products",
    ExpressionAttributeNames: {
      "#status": "status",
      "#total": "total",
      "#user_name": "user_name",
    },
    ExpressionAttributeValues: {
      ":user_id": body.user_id,
      ":user_name": body.user_name,
      ":order_date": body.order_date,
      ":status": body.status,
      ":total": body.total,
      ":shipping_address": body.shipping_address,
      ":payment_method": body.payment_method,
      ":quantity": body.quantity,
      ":products": body.products,
    },
    ConditionExpression: "attribute_exists(id)",
  };

  console.log("parametros:", params);

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
  console.log("delete", event);
  // Parse the request body to get the data provided by the client
  const body = JSON.parse(event.body);

  // Define the parameters to get the item before deleting it
  const getParams = {
    TableName: process.env.ORDERS_TABLE,
    Key: {
      id: body.id,
    },
  };

  // Define the parameters for the DynamoDB delete operation
  const deleteParams = {
    TableName: process.env.ORDERS_TABLE,
    Key: {
      id: body.id,
    },
    ConditionExpression: "attribute_exists(id)",
  };

  try {
    // Get the item before deleting it
    const result = await dynamodb.get(getParams).promise();
    const orderToDelete = result.Item;
    // Check if the item exists
    if (!orderToDelete) {
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

    // Execute the delete operation and wait for it to complete
    await dynamodb.delete(deleteParams).promise();
    // Return a response with the deleted item's data
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Deleted",
          data: orderToDelete,
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

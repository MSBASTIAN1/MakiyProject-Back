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
    !body.order_date ||
    !body.status ||
    !body.total ||
    !body.shipping_address ||
    !body.payment_method
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
    order_date: body.order_date,
    status: body.status,
    total: body.total,
    shipping_address: body.shipping_address,
    payment_method: body.payment_method,
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

// Update
module.exports.update = async (event) => {
  console.log("update", event);

  // Parse the request body to get the data provided by the client
  const body = JSON.parse(event.body);

  // Define the parameters for the DynamoDB update operation
  const params = {
    TableName: process.env.ORDERS_TABLE, // Specify the table where the update will occur
    Key: {
      id: body.id, // Specify the primary key of the item to be updated
    },
    // Update expression to modify the item's attributes, capturing reserved words
    UpdateExpression:
      "SET user_id = :user_id, order_date = :order_date, #status = :status, #total = :total, shipping_address = :shipping_address, payment_method = :payment_method",
    // Aliases for reserved keywords
    ExpressionAttributeNames: {
      "#status": "status",
      "#total": "total",
    },
    // Values for the attributes to be set
    ExpressionAttributeValues: {
      ":user_id": body.user_id,
      ":order_date": body.order_date,
      ":status": body.status,
      ":total": body.total,
      ":shipping_address": body.shipping_address,
      ":payment_method": body.payment_method,
    },
    // Condition to ensure the item exists
    ConditionExpression: "attribute_exists(id)",
  };

  try {
    // Execute the update operation and wait for it to complete
    await dynamodb.update(params).promise();
    // Create the updated order object to display it later
    const updatedOrder = {
      id: body.id,
      user_id: body.user_id,
      order_date: body.order_date,
      status: body.status,
      total: body.total,
      shipping_address: body.shipping_address,
      payment_method: body.payment_method,
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
          data: updatedOrder,
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

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
  if (!body.first_name || !body.last_name || !body.email || !body.password) {
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

  const admins = {
    id: id,
    first_name: body.first_name,
    last_name: body.last_name,
    email: body.email,
    password: body.password,
  };

  const params = {
    TableName: process.env.ADMINS_TABLE,
    Item: admins,
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
          data: admins,
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
    TableName: process.env.ADMINS_TABLE,
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

  const body = JSON.parse(event.body);

  // Obtener los detalles del administrador antes de actualizar
  const getParams = {
    TableName: process.env.ADMINS_TABLE,
    Key: { id: body.id },
  };

  try {
    const result = await dynamodb.get(getParams).promise();
    const adminToUpdate = result.Item;

    if (!adminToUpdate) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify(
          {
            message: "El administrador con el id proporcionado no existe.",
          },
          null,
          2
        ),
      };
    }

    // Verificar si el administrador que se va a actualizar es el propietario por defecto
    if (adminToUpdate.is_default_owner) {
      return {
        statusCode: 403,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify(
          {
            message: "No puedes actualizar al propietario por defecto.",
          },
          null,
          2
        ),
      };
    }

    // Continuar con la actualización
    const params = {
      TableName: process.env.ADMINS_TABLE,
      Key: { id: body.id },
      UpdateExpression:
        "SET first_name = :first_name, last_name = :last_name, password = :password, email = :email",
      ExpressionAttributeValues: {
        ":first_name": body.first_name,
        ":last_name": body.last_name,
        ":password": body.password,
        ":email": body.email,
      },
      ConditionExpression: "attribute_exists(id)",
    };

    await dynamodb.update(params).promise();

    const updatedAdmin = {
      id: body.id,
      first_name: body.first_name,
      last_name: body.last_name,
      password: body.password,
      email: body.email,
    };

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Actualizado",
          data: updatedAdmin,
        },
        null,
        2
      ),
    };
  } catch (error) {
    console.error("Error al actualizar los datos");
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Error al actualizar los datos",
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
    TableName: process.env.ADMINS_TABLE,
    Key: { id },
  };

  // Parámetros para la operación de eliminación en DynamoDB
  const deleteParams = {
    TableName: process.env.ADMINS_TABLE,
    Key: { id },
    ConditionExpression: "attribute_exists(id)",
  };

  try {
    // Obtener el ítem antes de eliminarlo
    const result = await dynamodb.get(getParams).promise();
    const adminToDelete = result.Item;

    // Verificar si el administrador es el dueño por defecto
    if (adminToDelete.is_default_owner) {
      return {
        statusCode: 403,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify(
          { message: "You cannot delete the default owner administrator." },
          null,
          2
        ),
      };
    }

    // Verificar si el ítem existe
    if (!adminToDelete) {
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
          data: adminToDelete,
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

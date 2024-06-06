"use strict";

const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
//AWS.config.update({ region: process.env.REGION });
const dynamodb = new AWS.DynamoDB.DocumentClient({region: process.env.REGION});


//Insert
module.exports.insert = async (event) => {
  console.log("insert", event);
  const idCustomer = uuidv4();

  const body = JSON.parse(event.body);

  const customer = {
    idCustomer: idCustomer,
    cedula: body.cedula,
    name: body.name,
    address: body.address
  };

  const params = {
    TableName: "CustomerTable",
    Item: customer
  };

  const result = await dynamodb.put(params).promise();
  return {
    statusCode: 200,
    body: JSON.stringify(
        {
          message: "Insertado Correctamente",
          data:customer
        },
        null,
        2
    ),
  };
};

//Select
module.exports.select = async (event) => {
  console.log("select", event);

  // Definimos los parámetros para la operación en DynamoDB
  const params = {
    TableName: "CustomerTable", // Especificamos la tabla
  };

  try {
    // Ejecutamos la operación de scan y esperamos a que se complete
    const result = await dynamodb.scan(params).promise();

    // Retorna una respuesta con el resultado
    return {
      statusCode: 200,
      body: JSON.stringify(
          {
            message: "Datos seleccionados",
            result: result.Items, // result.Items contiene los datos escaneados
          },
          null,
          2
      ),
    };
  } catch (error) {
    console.error("Error al seleccionar datos", error);
    return {
      statusCode: 500,
      body: JSON.stringify(
          {
            message: "Error al seleccionar datos",
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
  console.log("update", event);

  // Parseamos el cuerpo de la solicitud para obtener los datos proporcionados por el cliente
  const body = JSON.parse(event.body);

  // Definimos los parámetros para la operación de actualización en DynamoDB
  const params = {
    TableName: "CustomerTable", // Especificamos la tabla donde se realizará la actualización
    Key: {
      idCustomer: body.idCustomer, // Especificamos la clave primaria del elemento a actualizar
    },
    // Expresión de actualización para modificar los atributos del elemento y capturando palabra reservada
    UpdateExpression: "SET cedula = :cedula, #n = :name, address = :address",
    ExpressionAttributeNames: {
      "#n": "name",
    },
    // Valores de los atributos que se van a establecer
    ExpressionAttributeValues: {
      ":cedula": body.cedula,
      ":name": body.name,
      ":address": body.address,
    },
    // Condición para asegurarse de que el ítem exista
    ConditionExpression: "attribute_exists(idCustomer)",
  };

  try {
    // Ejecutamos la operación de actualización y espera a que se complete
    await dynamodb.update(params).promise();

    // Creamos el objeto customer con los datos actualizados para luego mostrarlos
    const updatedCustomer = {
      idCustomer: body.idCustomer,
      cedula: body.cedula,
      name: body.name,
      address: body.address
    };

    // Retorna una respuesta
    return {
      statusCode: 200,
      body: JSON.stringify(
          {
            message: "Actualizado",
            data: updatedCustomer,
          },
          null,
          2
      ),
    };
  } catch (error) {
    // Si la condición falla (si el ítem no existe), DynamoDB lanzará un error
    if (error.code === "ConditionalCheckFailedException") {
      return {
        statusCode: 400,
        body: JSON.stringify(
            {
              message: "El ítem con idCustomer proporcionado no existe.",
            },
            null,
            2
        ),
      };
    }
    console.error("Error al actualizar los datos", error);
    return {
      statusCode: 500,
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

//Delete
module.exports.delete = async (event) => {
  console.log("delete", event);

  // Parseamos el cuerpo de la solicitud para obtener los datos proporcionados por el cliente
  const body = JSON.parse(event.body);

  // Definimos los parámetros para obtener el ítem antes de eliminarlo
  const getParams = {
    TableName: "CustomerTable",
    Key: {
      idCustomer: body.idCustomer
    }
  };

  // Definimos los parámetros para la operación de eliminación en DynamoDB
  const deleteParams = {
    TableName: "CustomerTable",
    Key: {
      idCustomer: body.idCustomer
    },
    // Condición para asegurarse de que el ítem exista
    ConditionExpression: "attribute_exists(idCustomer)"
  };

  try {
    // Obtener el ítem antes de eliminarlo
    const result = await dynamodb.get(getParams).promise();
    const customerToDelete = result.Item;

    // Verificar si el ítem existe
    if (!customerToDelete) {
      return {
        statusCode: 400,
        body: JSON.stringify(
            {
              message: "El ítem con idCustomer proporcionado no existe."
            },
            null,
            2
        )
      };
    }

    // Ejecutar la operación de eliminación y esperar a que se complete
    await dynamodb.delete(deleteParams).promise();

    // Retornar una respuesta con los datos del ítem eliminado
    return {
      statusCode: 200,
      body: JSON.stringify(
          {
            message: "Eliminado",
            data: customerToDelete
          },
          null,
          2
      )
    };
  } catch (error) {
    console.error("Error al eliminar los datos", error);
    return {
      statusCode: 500,
      body: JSON.stringify(
          {
            message: "Error al eliminar los datos",
            error: error.message
          },
          null,
          2
      )
    };
  }
};



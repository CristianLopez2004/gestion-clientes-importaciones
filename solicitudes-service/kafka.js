const { Kafka } = require('kafkajs');

const broker = process.env.KAFKA_BROKER || 'localhost:9092';
const topic = process.env.KAFKA_TOPIC || 'solicitudes-importacion';
let producer;
let kafkaEnabled = false;

async function initKafka() {
  try {
    const kafka = new Kafka({ clientId: 'solicitudes-service', brokers: [broker] });
    producer = kafka.producer();
    await producer.connect();
    kafkaEnabled = true;
    console.log(`Kafka conectado en ${broker}, topic ${topic}`);
  } catch (error) {
    kafkaEnabled = false;
    console.warn('Kafka no disponible. El servicio seguirá funcionando sin mensajería:', error.message);
  }
}

async function publishEvent(eventType, payload) {
  if (!kafkaEnabled || !producer) {
    console.log('Evento no publicado porque Kafka no está conectado:', eventType, payload);
    return;
  }
  await producer.send({
    topic,
    messages: [
      {
        key: eventType,
        value: JSON.stringify({ eventType, payload, timestamp: new Date().toISOString() })
      }
    ]
  });
  console.log(`Evento publicado en Kafka: ${eventType}`);
}

module.exports = { initKafka, publishEvent };

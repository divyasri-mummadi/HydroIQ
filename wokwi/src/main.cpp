#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>

// =====================================================
// WIFI + MQTT
// =====================================================

const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

const char* MQTT_BROKER = "broker.emqx.io";
const int MQTT_PORT = 1883;
const char* MQTT_TOPIC = "hydrolq/telemetry/node1";

WiFiClient espClient;
PubSubClient mqttClient(espClient);


// =====================================================
// SENSOR PINS
// =====================================================

#define PRESSURE_PIN   34
#define FLOW_PIN       35
#define ACOUSTIC_PIN   32
#define PH_PIN         33
#define TDS_PIN        36
#define TURBIDITY_PIN  39


// =====================================================
// ZONE LED PINS
// =====================================================

#define ZONE_A_LED 2
#define ZONE_B_LED 4
#define ZONE_C_LED 16
#define ZONE_D_LED 17


// =====================================================
// TIMING
// =====================================================

// Conditions change every 2 seconds
const unsigned long CONDITION_INTERVAL = 2000;

// Publish telemetry every 1 second
const unsigned long PUBLISH_INTERVAL = 1000;

unsigned long lastConditionChange = 0;
unsigned long lastPublish = 0;


// =====================================================
// CONDITIONS
// =====================================================

enum Condition {
  NORMAL = 0,
  EARLY_ANOMALY = 1,
  LEAK = 2,
  WATER_QUALITY = 3,
  SENSOR_FAULT = 4
};


// =====================================================
// INITIAL CONDITIONS
// =====================================================

Condition zoneConditions[4] = {
  NORMAL,
  EARLY_ANOMALY,
  LEAK,
  WATER_QUALITY
};


// =====================================================
// DEVICE IDS
// =====================================================

const char* deviceIds[4] = {
  "ESP32_Node_1",
  "ESP32_Node_2",
  "ESP32_Node_3",
  "ESP32_Node_4"
};


// =====================================================
// CONDITION NAMES
// =====================================================

const char* conditionName(Condition condition) {

  switch (condition) {

    case NORMAL:
      return "NORMAL";

    case EARLY_ANOMALY:
      return "EARLY_ANOMALY";

    case LEAK:
      return "LEAK";

    case WATER_QUALITY:
      return "WATER_QUALITY";

    case SENSOR_FAULT:
      return "SENSOR_FAULT";

    default:
      return "NORMAL";
  }
}


// =====================================================
// RANDOM NOISE
// =====================================================

float noise(float amount) {

  return ((float)random(-1000, 1001) / 1000.0f) * amount;
}


// =====================================================
// WIFI CONNECTION
// =====================================================

void connectWiFi() {

  Serial.println();
  Serial.print("Connecting to WiFi");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {

    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected!");

  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}


// =====================================================
// MQTT CONNECTION
// =====================================================

void connectMQTT() {

  while (!mqttClient.connected()) {

    Serial.print("Connecting to MQTT... ");

    String clientId = "HydroIQ_Wokwi_";
    clientId += String(random(0xffff), HEX);

    if (mqttClient.connect(clientId.c_str())) {

      Serial.println("CONNECTED");

    } else {

      Serial.print("FAILED rc=");
      Serial.println(mqttClient.state());

      delay(3000);
    }
  }
}


// =====================================================
// READ POTENTIOMETER
// =====================================================

float readSensor(int pin) {

  int raw = analogRead(pin);

  return (float)raw / 4095.0f;
}


// =====================================================
// UPDATE LEDS
// =====================================================

void updateLEDs() {

  // NORMAL = OFF
  // Anything abnormal = ON

  digitalWrite(
    ZONE_A_LED,
    zoneConditions[0] == NORMAL ? LOW : HIGH
  );

  digitalWrite(
    ZONE_B_LED,
    zoneConditions[1] == NORMAL ? LOW : HIGH
  );

  digitalWrite(
    ZONE_C_LED,
    zoneConditions[2] == NORMAL ? LOW : HIGH
  );

  digitalWrite(
    ZONE_D_LED,
    zoneConditions[3] == NORMAL ? LOW : HIGH
  );
}


// =====================================================
// CHANGE NETWORK CONDITIONS
// =====================================================

void updateConditions() {

  if (millis() - lastConditionChange < CONDITION_INTERVAL) {
    return;
  }

  lastConditionChange = millis();


  Serial.println();
  Serial.println();
  Serial.println("================================================");
  Serial.println("       HYDROIQ NETWORK CONDITION UPDATE");
  Serial.println("================================================");


  // Move every zone to the next condition
  for (int i = 0; i < 4; i++) {

    zoneConditions[i] =
      (Condition)(((int)zoneConditions[i] + 1) % 5);

    Serial.print(deviceIds[i]);
    Serial.print(" -> ");
    Serial.println(conditionName(zoneConditions[i]));
  }


  updateLEDs();

  Serial.println("================================================");
  Serial.println();
}


// =====================================================
// PUBLISH ONE ZONE
// =====================================================

void publishZone(int zoneIndex) {

  Condition condition = zoneConditions[zoneIndex];


  // ===================================================
  // READ PHYSICAL POTENTIOMETERS
  // ===================================================

  float pressureSensor  = readSensor(PRESSURE_PIN);
  float flowSensor      = readSensor(FLOW_PIN);
  float acousticSensor  = readSensor(ACOUSTIC_PIN);
  float phSensor        = readSensor(PH_PIN);
  float tdsSensor       = readSensor(TDS_PIN);
  float turbiditySensor = readSensor(TURBIDITY_PIN);


  float pressure;
  float flow;
  float acoustic;
  float pH;
  float tds;
  float turbidity;


  // ===================================================
  // NORMAL
  // ===================================================

  if (condition == NORMAL) {

    pressure =
      2.85 + pressureSensor * 0.30 + noise(0.05);

    flow =
      105.0 + flowSensor * 30.0 + noise(2.0);

    acoustic =
      0.20 + acousticSensor * 0.20 + noise(0.02);

    pH =
      6.9 + phSensor * 0.6 + noise(0.03);

    tds =
      250.0 + tdsSensor * 100.0 + noise(8.0);

    turbidity =
      0.8 + turbiditySensor * 1.4 + noise(0.08);
  }


  // ===================================================
  // EARLY ANOMALY
  // ===================================================

  else if (condition == EARLY_ANOMALY) {

    pressure =
      2.15 + pressureSensor * 0.35 + noise(0.06);

    flow =
      125.0 + flowSensor * 18.0 + noise(3.0);

    acoustic =
      0.50 + acousticSensor * 0.35 + noise(0.04);

    pH =
      6.9 + phSensor * 0.6 + noise(0.04);

    tds =
      290.0 + tdsSensor * 80.0 + noise(10.0);

    turbidity =
      2.5 + turbiditySensor * 2.0 + noise(0.15);
  }


  // ===================================================
  // LEAK
  // ===================================================

  else if (condition == LEAK) {

    pressure =
      1.35 + pressureSensor * 0.55 + noise(0.06);

    flow =
      145.0 + flowSensor * 40.0 + noise(4.0);

    acoustic =
      1.20 + acousticSensor * 1.0 + noise(0.08);

    pH =
      6.9 + phSensor * 0.5 + noise(0.04);

    tds =
      250.0 + tdsSensor * 100.0 + noise(8.0);

    turbidity =
      1.2 + turbiditySensor * 1.8 + noise(0.10);
  }


  // ===================================================
  // WATER QUALITY
  // ===================================================

  else if (condition == WATER_QUALITY) {

    pressure =
      2.85 + pressureSensor * 0.30 + noise(0.05);

    flow =
      105.0 + flowSensor * 30.0 + noise(2.0);

    acoustic =
      0.20 + acousticSensor * 0.20 + noise(0.02);

    // Low pH
    pH =
      5.3 + phSensor * 0.9 + noise(0.05);

    // High TDS
    tds =
      550.0 + tdsSensor * 250.0 + noise(15.0);

    // High turbidity
    turbidity =
      4.5 + turbiditySensor * 4.0 + noise(0.20);
  }


  // ===================================================
  // SENSOR FAULT
  // ===================================================

  else {

    // Simulate a failed/stuck sensor.

    pressure = 0.0;
    flow = 0.0;
    acoustic = 0.0;
    pH = 0.0;
    tds = 0.0;
    turbidity = 0.0;
  }


  // ===================================================
  // SAFETY LIMITS
  // ===================================================

  pressure = max(0.0f, pressure);
  flow = max(0.0f, flow);
  acoustic = max(0.0f, acoustic);

  pH = constrain(
    pH,
    0.0f,
    14.0f
  );

  tds = max(0.0f, tds);
  turbidity = max(0.0f, turbidity);


  // ===================================================
  // CREATE JSON
  // ===================================================

  String payload = "{";


  payload += "\"device_id\":\"";
  payload += deviceIds[zoneIndex];
  payload += "\",";


  payload += "\"stage\":\"";
  payload += conditionName(condition);
  payload += "\",";


  payload += "\"pressure_bar\":";
  payload += String(pressure, 2);
  payload += ",";


  payload += "\"flow_L_min\":";
  payload += String(flow, 2);
  payload += ",";


  payload += "\"acoustic_amp\":";
  payload += String(acoustic, 2);
  payload += ",";


  payload += "\"pH\":";
  payload += String(pH, 2);
  payload += ",";


  payload += "\"tds_ppm\":";
  payload += String(tds, 0);
  payload += ",";


  payload += "\"turbidity_NTU\":";
  payload += String(turbidity, 2);


  payload += "}";


  // ===================================================
  // MQTT
  // ===================================================

  bool success =
    mqttClient.publish(
      MQTT_TOPIC,
      payload.c_str()
    );


  // ===================================================
  // SERIAL OUTPUT
  // ===================================================

  Serial.print(deviceIds[zoneIndex]);
  Serial.print(" | ");
  Serial.print(conditionName(condition));
  Serial.print(" | ");
  Serial.println(payload);


  if (success) {

    Serial.println("MQTT publish: OK");

  } else {

    Serial.println("MQTT publish: FAILED");
  }
}


// =====================================================
// SETUP
// =====================================================

void setup() {

  Serial.begin(115200);

  delay(1000);


  // 12-bit ADC
  analogReadResolution(12);


  // ===================================================
  // SENSOR INPUTS
  // ===================================================

  pinMode(PRESSURE_PIN, INPUT);
  pinMode(FLOW_PIN, INPUT);
  pinMode(ACOUSTIC_PIN, INPUT);
  pinMode(PH_PIN, INPUT);
  pinMode(TDS_PIN, INPUT);
  pinMode(TURBIDITY_PIN, INPUT);


  // ===================================================
  // LED OUTPUTS
  // ===================================================

  pinMode(ZONE_A_LED, OUTPUT);
  pinMode(ZONE_B_LED, OUTPUT);
  pinMode(ZONE_C_LED, OUTPUT);
  pinMode(ZONE_D_LED, OUTPUT);


  // Start LEDs according to initial conditions
  updateLEDs();


  // Random seed
  randomSeed(micros());


  // ===================================================
  // STARTUP MESSAGE
  // ===================================================

  Serial.println();
  Serial.println("================================================");
  Serial.println("          HYDROIQ WOKWI SIMULATOR");
  Serial.println("================================================");

  Serial.println();
  Serial.println("6 virtual sensors");
  Serial.println("4 virtual network zones");
  Serial.println("4 zone status LEDs");
  Serial.println();
  Serial.println("Conditions:");
  Serial.println("NORMAL");
  Serial.println("EARLY_ANOMALY");
  Serial.println("LEAK");
  Serial.println("WATER_QUALITY");
  Serial.println("SENSOR_FAULT");
  Serial.println();
  Serial.println("Condition change interval: 2 seconds");
  Serial.println("Telemetry interval: 1 second");
  Serial.println();


  // ===================================================
  // CONNECT
  // ===================================================

  connectWiFi();


  mqttClient.setServer(
    MQTT_BROKER,
    MQTT_PORT
  );
}


// =====================================================
// LOOP
// =====================================================

void loop() {

  // WiFi
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }


  // MQTT
  if (!mqttClient.connected()) {
    connectMQTT();
  }


  mqttClient.loop();


  // Change conditions every 2 seconds
  updateConditions();


  // Publish every 1 second
  if (millis() - lastPublish >= PUBLISH_INTERVAL) {

    lastPublish = millis();


    for (int i = 0; i < 4; i++) {

      publishZone(i);

      delay(100);
    }


    Serial.println();
    Serial.println("----------------------------------------------");
    Serial.println("All 4 zones published");
    Serial.println("----------------------------------------------");
  }
}
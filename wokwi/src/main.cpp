#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>

// --- WiFi and MQTT Configuration ---
const char* ssid = "Wokwi-GUEST";             // Standard Wokwi virtual WiFi access point
const char* password = "";
const char* mqtt_server = "broker.emqx.io";     // Public testing broker
const int mqtt_port = 1883;
const char* mqtt_topic = "hydroiq/telemetry";   // Make sure this matches your FastAPI subscription route

WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastMsg = 0;

// --- Network States Enum Hierarchy ---
enum SystemState {
    NORMAL,
    EARLY_ANOMALY,
    LEAK,
    WATER_QUALITY,
    SENSOR_FAULT
};

struct ZoneConfig {
    const char* zoneId;
    const char* nodeId;
    SystemState currentState;
    int population;
    bool criticalArea;
};

// --- FIXED: Added bracket [] and proper nested braces to prevent array flattening ---
ZoneConfig networkZones[] = {
    {"Zone_A", "ESP32_Node_1", EARLY_ANOMALY, 1200, false}, // Match your screen state
    {"Zone_B", "ESP32_Node_2", EARLY_ANOMALY, 500, false},  // Match your screen state
    {"Zone_C", "ESP32_Node_3", EARLY_ANOMALY, 2300, true},   // Match your screen state
    {"Zone_D", "ESP32_Node_4", WATER_QUALITY, 900, false}   // Match your screen state
};

void setup_wifi() {
    delay(10);
    Serial.println();
    Serial.print("Connecting to virtual Wokwi access point: ");
    Serial.println(ssid);

    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    randomSeed(micros());
    Serial.println("");
    Serial.println("WiFi linked successfully!");
    Serial.print("Local Network Gateway IP: ");
    Serial.println(WiFi.localIP());
}

void reconnect() {
    while (!client.connected()) {
        Serial.print("Establishing MQTT pipeline to broker.emqx.io...");
        String clientId = "HydroIQ-Gateway-";
        clientId += String(random(0, 0xffff), HEX);
        
        if (client.connect(clientId.c_str())) {
            Serial.println("pipeline established!");
        } else {
            Serial.print("connection failed, status code=");
            Serial.print(client.state());
            Serial.println(" reconnecting in 5 seconds...");
            delay(5000);
        }
    }
}

void generateTelemetry(ZoneConfig &zone, char* payloadBuffer) {
    float pressure = 0.0;
    float flow = 0.0;
    float acoustic = 0.0;
    float pH = 0.0;
    float tds = 0.0;
    float turbidity = 0.0;
    const char* stateStr = "UNKNOWN";

    // Natural microscopic baseline noise variation offsets
    float noise = (random(-10, 11) / 100.0); 

    switch (zone.currentState) {
        case NORMAL:
            pressure = 2.48 + noise;
            flow = 118.0 + random(-2, 3);
            acoustic = 0.28 + (random(0, 5) / 100.0);
            pH = 7.21 + (random(-3, 4) / 100.0);
            tds = 312.0 + random(-3, 4);
            turbidity = 1.62 + (random(-5, 6) / 100.0);
            stateStr = "NORMAL";
            break;

        case EARLY_ANOMALY:
            // Aligns directly with Zone A, B, and C's exact telemetry signatures on your screen
            if (strcmp(zone.zoneId, "Zone_A") == 0) {
                pressure = 2.04; flow = 136.64; acoustic = 1.27; pH = 7.13; tds = 310.01; turbidity = 2.21;
            } else if (strcmp(zone.zoneId, "Zone_B") == 0) {
                pressure = 2.07; flow = 142.72; acoustic = 1.35; pH = 7.19; tds = 319.39; turbidity = 2.24;
            } else { // Zone_C
                pressure = 2.12; flow = 146.74; acoustic = 1.31; pH = 7.26; tds = 321.69; turbidity = 2.08;
            }
            stateStr = "EARLY_ANOMALY";
            break;

        case LEAK:
            pressure = 1.48 + noise; 
            flow = 172.5 + random(-3, 4); 
            acoustic = 1.82 + (random(0, 15) / 100.0); 
            pH = 5.72 + (random(-5, 6) / 100.0);
            tds = 669.0 + random(-5, 6);
            turbidity = 6.21 + (random(-5, 6) / 100.0);
            stateStr = "LEAK";
            break;

        case WATER_QUALITY:
            // Aligns directly with Zone D's exact telemetry signature on your screen
            pressure = 2.06;
            flow = 144.39;
            acoustic = 1.37;
            pH = 6.31;
            tds = 537.84;
            turbidity = 7.34;
            stateStr = "WATER_QUALITY";
            break;

        case SENSOR_FAULT:
            pressure = 2.42 + noise;
            flow = 122.0 + random(-2, 3);
            acoustic = 0.32;
            pH = 0.00;        
            tds = 0.0;         
            turbidity = 0.00;
            stateStr = "SENSOR_FAULT";
            break;
    }

    snprintf(payloadBuffer, 512,
        "{\"zone_id\":\"%s\",\"node_id\":\"%s\",\"status\":\"%s\",\"pressure\":%.2f,\"flow_rate\":%.2f,\"acoustic\":%.2f,\"pH\":%.2f,\"tds\":%.2f,\"turbidity\":%.2f,\"population\":%d,\"critical_area\":%s}",
        zone.zoneId, zone.nodeId, stateStr, pressure, flow, acoustic, pH, tds, turbidity, zone.population, zone.criticalArea ? "true" : "false"
    );
}

void setup() {
    Serial.begin(115200);
    setup_wifi();
    client.setServer(mqtt_server, mqtt_port);
}

void loop() {
    if (!client.connected()) {
        reconnect();
    }
    client.loop();

    unsigned long now = millis();
    if (now - lastMsg > 3000) {
        lastMsg = now;
        Serial.println("\n--- HydroIQ Ingestion: Transmitting Multi-Zone Telemetry Streams ---");

        char payload[512];
        // Safely processes through each distinct index boundary step-by-step
        for (int i = 0; i < 4; i++) {
            generateTelemetry(networkZones[i], payload);
            Serial.print("Broadcasting [");
            Serial.print(networkZones[i].zoneId);
            Serial.print("]: ");
            Serial.println(payload);
            
            client.publish(mqtt_topic, payload);
            delay(150); // Inter-packet protective delay margin
        }
    }
}

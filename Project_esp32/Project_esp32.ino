#include <WiFi.h>
#include <HTTPClient.h>
#include <Arduino_JSON.h> // Lightweight library for JSON parsing

// Wi-Fi credentials
const char* ssid = "Sra Network";
const char* password = "gagandeep7";

// FastAPI server URL
String serverURL = "http://192.168.2.119:8000";

// Pins for the soil sensor and LED
const int soilSensorPin = 34;
const int ledPin = 18;

void setup() {
  Serial.begin(115200);

  // Initialize pins
  pinMode(soilSensorPin, INPUT);
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW); // Default LED state is OFF

  // Connect to Wi-Fi
  Serial.println("Connecting to Wi-Fi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("\nConnected to Wi-Fi");
  Serial.println("Wi-Fi connected with IP: " + WiFi.localIP().toString());
}

void loop() {
  // Read soil moisture and send to FastAPI
  float moisturePercent = getSoilMoisture();
  updateMoistureToServer(moisturePercent);

  // Get LED status from FastAPI and control LED
  String ledStatus = getLEDStatusFromServer();
  controlLED(ledStatus);

  // Wait for 2 seconds before the next loop
  delay(2000);
}

// Function to read soil moisture value
float getSoilMoisture() {
  int soilValue = analogRead(soilSensorPin);
  float moisturePercent = map(soilValue, 4095, 0, 0, 100); // Map to percentage
  Serial.print("Soil Moisture Percentage: ");
  Serial.println(moisturePercent);
  return moisturePercent;
}

// Function to send soil moisture data to the FastAPI server
void updateMoistureToServer(float moisture) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverURL + "/update_moisture");
    http.addHeader("Content-Type", "application/json");

    String postData = "{\"moisture\":" + String(moisture) + "}";
    int httpResponseCode = http.POST(postData);

    Serial.print("Moisture data sent, response code: ");
    Serial.println(httpResponseCode);

    if (httpResponseCode != 200) {
      Serial.println("Error: Failed to send moisture data");
    }

    http.end();
  } else {
    Serial.println("Error: Wi-Fi not connected");
  }
}

// Function to get LED status from the FastAPI server
String getLEDStatusFromServer() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverURL + "/get_led_status");

    int httpResponseCode = http.GET();
    if (httpResponseCode == 200) {
      String payload = http.getString();
      Serial.print("Received LED status payload: ");
      Serial.println(payload);

      JSONVar response = JSON.parse(payload);
      if (JSON.typeof(response) == "undefined") {
        Serial.println("Error: Failed to parse LED status JSON");
        return "";
      }

      String ledStatus = (const char*)response["led_status"];
      Serial.print("Parsed LED status: ");
      Serial.println(ledStatus);
      return ledStatus;
    } else {
      Serial.print("Error: Failed to get LED status, response code: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("Error: Wi-Fi not connected");
  }
  return "";
}

// Function to control LED based on the status from the server
void controlLED(String ledStatus) {
  if (ledStatus == "ON") {
    digitalWrite(ledPin, HIGH);
    Serial.println("Turning LED ON");
  } else if (ledStatus == "OFF") {
    digitalWrite(ledPin, LOW);
    Serial.println("Turning LED OFF");
  } else {
    Serial.println("Invalid LED status received");
  }
}

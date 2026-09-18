/*
  VENUS — ESP32 Hardware Node (MH-02)
  ============================================================
  Sensors  : MQ-7 (CO) on GPIO35, MQ-4 (CH4) on GPIO32
  Simulate : IR sensor (GPIO34) forces CO → DANGER
             Push button (GPIO33) forces CH4 → DANGER
  Outputs  : Red/Yellow/Green LEDs + buzzer
  Upload   : Supabase REST API (POST to sensor_readings table)
  ============================================================

  Arduino Libraries needed (install via Library Manager):
    - ArduinoJson  by Benoit Blanchon  (v7.x)
    - WiFi         (built-in ESP32)
    - HTTPClient   (built-in ESP32)

  Wiring:
    GPIO35 → MQ-7 AOUT (CO)
    GPIO32 → MQ-4 AOUT (CH4)
    GPIO34 → IR sensor OUT
    GPIO33 → Push button (other leg to GND)
    GPIO27 → Red LED (+ resistor)
    GPIO14 → Yellow LED (+ resistor)
    GPIO12 → Green LED (+ resistor)
    GPIO25 → Buzzer (+ transistor or direct for passive)
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ──────────────────────────────────────────────────────────
// WiFi credentials
// ──────────────────────────────────────────────────────────
const char* WIFI_SSID     = "Rithesh.shetty";
const char* WIFI_PASSWORD = "12345612";

// ──────────────────────────────────────────────────────────
// Supabase config
// ──────────────────────────────────────────────────────────
const char* SUPABASE_URL  = "https://oqwkasqjeqpywkxoygwq.supabase.co";
const char* SUPABASE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xd2thc3FqZXFweXdreG95Z3dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NTk5OTMsImV4cCI6MjEwNTMzNTk5M30.z2NlpR16qkEGZne__d8OE2fWDCbrr0HKjV2_dlGPGUE";
const char* MANHOLE_ID    = "MH-02";

// Upload interval — 5 seconds for responsive dashboard
const unsigned long UPLOAD_INTERVAL_MS = 5000;

// ──────────────────────────────────────────────────────────
// Pin map
// ──────────────────────────────────────────────────────────
const int PIN_MQ7    = 35;   // CO  — analog in
const int PIN_MQ4    = 32;   // CH4 — analog in
const int PIN_IR     = 34;   // IR proximity — digital in
const int PIN_BUTTON = 33;   // Push button  — digital in (INPUT_PULLUP)

const int PIN_LED_RED    = 27;
const int PIN_LED_YELLOW = 14;
const int PIN_LED_GREEN  = 12;
const int PIN_BUZZER     = 25;

// IR: most LM393 comparator boards pull OUT LOW when object detected
const int IR_ACTIVE_STATE = LOW;

// ──────────────────────────────────────────────────────────
// Calibration thresholds (ADC raw, 12-bit: 0–4095)
// Run with serial monitor and note clean-air baseline, then
// set WARNING at ~1.5× baseline, DANGER at ~2.5× baseline.
// ──────────────────────────────────────────────────────────
const int CO_WARNING_RAW  = 1500;
const int CO_DANGER_RAW   = 2500;
const int CH4_WARNING_RAW = 1500;
const int CH4_DANGER_RAW  = 2500;

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────
enum GasLevel { SAFE = 0, WARNING = 1, DANGER = 2 };

// ──────────────────────────────────────────────────────────
// Globals
// ──────────────────────────────────────────────────────────
unsigned long lastUploadTime = 0;

// ──────────────────────────────────────────────────────────
// setup
// ──────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== VENUS IoT Node MH-02 ===");

  pinMode(PIN_IR,     INPUT);
  pinMode(PIN_BUTTON, INPUT_PULLUP);

  pinMode(PIN_LED_RED,    OUTPUT);
  pinMode(PIN_LED_YELLOW, OUTPUT);
  pinMode(PIN_LED_GREEN,  OUTPUT);
  pinMode(PIN_BUZZER,     OUTPUT);

  // All outputs off
  digitalWrite(PIN_LED_RED,    LOW);
  digitalWrite(PIN_LED_YELLOW, LOW);
  digitalWrite(PIN_LED_GREEN,  LOW);
  digitalWrite(PIN_BUZZER,     LOW);

  connectWiFi();

  // Boot flash: blink green 3× to confirm ready
  for (int i = 0; i < 3; i++) {
    digitalWrite(PIN_LED_GREEN, HIGH); delay(150);
    digitalWrite(PIN_LED_GREEN, LOW);  delay(150);
  }
}

// ──────────────────────────────────────────────────────────
// loop
// ──────────────────────────────────────────────────────────
void loop() {
  int coRaw   = analogRead(PIN_MQ7);
  int ch4Raw  = analogRead(PIN_MQ4);
  bool irActive       = (digitalRead(PIN_IR) == IR_ACTIVE_STATE);
  bool buttonPressed  = (digitalRead(PIN_BUTTON) == LOW);

  GasLevel coLevel  = readCOLevel(coRaw, irActive);
  GasLevel ch4Level = readCH4Level(ch4Raw, buttonPressed);
  GasLevel overall  = worstOf(coLevel, ch4Level);

  applyOutputs(overall);

  Serial.printf("[MH-02] CO raw=%4d (%s)  CH4 raw=%4d (%s)  Overall=%s%s%s\n",
    coRaw,  levelName(coLevel),
    ch4Raw, levelName(ch4Level),
    levelName(overall),
    irActive      ? "  [IR ACTIVE]"     : "",
    buttonPressed ? "  [BTN PRESSED]"   : ""
  );

  if (millis() - lastUploadTime >= UPLOAD_INTERVAL_MS) {
    uploadToSupabase(coRaw, ch4Raw, coLevel, ch4Level, overall, irActive, buttonPressed);
    lastUploadTime = millis();
  }

  delay(300);
}

// ──────────────────────────────────────────────────────────
// Sensor helpers
// ──────────────────────────────────────────────────────────
GasLevel readCOLevel(int raw, bool irOverride) {
  if (irOverride) return DANGER;
  return classify(raw, CO_WARNING_RAW, CO_DANGER_RAW);
}

GasLevel readCH4Level(int raw, bool buttonOverride) {
  if (buttonOverride) return DANGER;
  return classify(raw, CH4_WARNING_RAW, CH4_DANGER_RAW);
}

GasLevel classify(int raw, int warnThresh, int dangerThresh) {
  if (raw >= dangerThresh) return DANGER;
  if (raw >= warnThresh)   return WARNING;
  return SAFE;
}

GasLevel worstOf(GasLevel a, GasLevel b) {
  return (a > b) ? a : b;
}

const char* levelName(GasLevel lvl) {
  switch (lvl) {
    case SAFE:    return "SAFE";
    case WARNING: return "WARNING";
    case DANGER:  return "DANGER";
  }
  return "SAFE";
}

// ──────────────────────────────────────────────────────────
// Output control
// ──────────────────────────────────────────────────────────
void applyOutputs(GasLevel level) {
  digitalWrite(PIN_LED_GREEN,  level == SAFE    ? HIGH : LOW);
  digitalWrite(PIN_LED_YELLOW, level == WARNING  ? HIGH : LOW);
  digitalWrite(PIN_LED_RED,    level == DANGER   ? HIGH : LOW);
  digitalWrite(PIN_BUZZER,     level == DANGER   ? HIGH : LOW);
}

// ──────────────────────────────────────────────────────────
// Supabase upload
// ──────────────────────────────────────────────────────────
void uploadToSupabase(int coRaw, int ch4Raw,
                      GasLevel coLvl, GasLevel ch4Lvl, GasLevel overall,
                      bool irActive, bool buttonPressed) {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("Upload skipped — no WiFi");
      return;
    }
  }

  // Build JSON payload
  JsonDocument doc;
  doc["manhole_id"]      = MANHOLE_ID;
  doc["co_raw"]          = coRaw;
  doc["ch4_raw"]         = ch4Raw;
  doc["co_status"]       = levelName(coLvl);
  doc["ch4_status"]      = levelName(ch4Lvl);
  doc["overall_status"]  = levelName(overall);
  doc["ir_active"]       = irActive;
  doc["button_pressed"]  = buttonPressed;

  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  String url = String(SUPABASE_URL) + "/rest/v1/sensor_readings";

  http.begin(url);
  http.addHeader("Content-Type",  "application/json");
  http.addHeader("apikey",        SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
  http.addHeader("Prefer",        "return=minimal");

  int code = http.POST(payload);

  if (code == 201 || code == 200) {
    Serial.printf("Supabase OK (%d) — CO=%s CH4=%s\n", code, levelName(coLvl), levelName(ch4Lvl));
  } else {
    Serial.printf("Supabase error %d: %s\n", code, http.getString().c_str());
  }

  http.end();
}

// ──────────────────────────────────────────────────────────
// WiFi
// ──────────────────────────────────────────────────────────
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to WiFi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("WiFi connected — IP: %s  RSSI: %d dBm\n",
      WiFi.localIP().toString().c_str(), WiFi.RSSI());
  } else {
    Serial.println("WiFi failed — uploads will retry next interval");
  }
}

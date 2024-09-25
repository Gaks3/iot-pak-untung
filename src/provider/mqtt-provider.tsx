import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import mqtt from "mqtt";
import { env } from "@/env";
import { toast } from "@/hooks/use-toast";

const setting = {
  url: `${env.NEXT_PUBLIC_MQTT_URL}:${env.NEXT_PUBLIC_MQTT_PORT}`,
  config: {
    username: env.NEXT_PUBLIC_MQTT_USERNAME,
    password: env.NEXT_PUBLIC_MQTT_PASSWORD,
  },
};

type Payload = {
  message?: string;
};

type MqttContextType = {
  mqttConnect: () => void;
  mqttDisconnect: () => void;
  mqttSubscribe: (topic: string) => void;
  mqttUnSubscribe: (topic: string) => void;
  mqttPublish: (topic: string, message: string) => void;
  payload: Payload;
  isConnected: boolean;
};

const MqttContext = createContext<MqttContextType | undefined>(undefined);

export const MqttProvider = ({ children }: { children: ReactNode }) => {
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [payload, setPayload] = useState<Payload>({});

  const getClientId = () => {
    return `mqttjs_${Math.random().toString(16).substr(2, 8)}`;
  };

  const mqttConnect = () => {
    const clientId = getClientId();
    const clientMqtt = mqtt.connect(setting.url, {
      clientId,
      keepalive: 60,
      ...setting.config,
    });
    setClient(clientMqtt);
  };

  const mqttDisconnect = () => {
    if (client) {
      client.end(() => {
        console.log("MQTT Disconnected");
        setIsConnected(false);
      });
    }
  };

  const mqttSubscribe = (topic: string) => {
    if (client) {
      client.subscribe(topic, (error) => {
        if (error) {
          console.log("MQTT Subscribe error", error);
          toast({ variant: "destructive", title: "Failed to connect" });
        } else {
          toast({ title: "Successfully subscribed to topic" });
        }
      });
    }
  };

  const mqttUnSubscribe = (topic: string) => {
    if (client) {
      client.unsubscribe(topic, (error) => {
        if (error) {
          console.log("MQTT Unsubscribe error", error);
        }
      });
    }
  };

  const mqttPublish = (topic: string, message: string) => {
    if (client) {
      client.publish(topic, message, (error) => {
        if (error) {
          console.log("MQTT Publish error", error);
        }
      });
    }
  };

  useEffect(() => {
    mqttConnect();
    return () => {
      mqttDisconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (client) {
      client.on("connect", () => {
        setIsConnected(true);
        console.log("MQTT Connected");
        toast({ title: "MQTT Connected" });
      });
      client.on("error", (err) => {
        console.error("MQTT Connection error: ", err);
        toast({ title: "MQTT was unable to connect" });
        client.end();
      });
      client.on("reconnect", () => {
        setIsConnected(true);
        console.log("MQTT Reconnected");
        toast({ title: "MQTT is trying to reconnect" });
      });
      client.on("message", (_topic, message) => {
        const payloadMessage = { message: message.toString() };
        setPayload(payloadMessage);
      });
    }
  }, [client]);

  return (
    <MqttContext.Provider
      value={{
        mqttConnect,
        mqttDisconnect,
        mqttSubscribe,
        mqttUnSubscribe,
        mqttPublish,
        payload,
        isConnected,
      }}
    >
      {children}
    </MqttContext.Provider>
  );
};

export const useMqtt = () => {
  const context = useContext(MqttContext);
  if (!context) {
    throw new Error("useMqtt must be used within an MqttProvider");
  }
  return context;
};

import abc

from kafka import KafkaProducer
import msgpack

class Transmitter(metaclass=abc.ABCMeta):
    @abc.abstractmethod
    def Transmit(self,data,*args):
        pass

class KafkaTransmitter(Transmitter):
    def __init__(self,broker):
        super().__init__()
        self.producer = KafkaProducer(bootstrap_servers=broker)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):        
        self.producer.flush()
        self.producer.close()

    def Transmit(self,data: dict,*args):
        encoded_message = self.Encode_record(data)
        self.producer.send(args[0], value=encoded_message)
    
    def Encode_record(self, record: dict) -> bytes:        
        payload = dict(record)        
        payload["_v"] = 1

        return msgpack.packb(
            payload,
            use_bin_type=True
        )

#include "KafkaRecordSender.h"

#include <librdkafka/rdkafkacpp.h>
#include <plog/Log.h>

#include <memory>
#include <vector>

class DeliveryReportCb : public RdKafka::DeliveryReportCb {
public:
    void dr_cb(RdKafka::Message& message) override {
        if (message.err()) {
            PLOG_ERROR << "Delivery failed: " << message.errstr();
        }
        else {
            PLOG_VERBOSE << "Delivered to topic "
                << message.topic_name()
                << " [" << message.partition()
                << "] offset " << message.offset();
        }
    }
};

static DeliveryReportCb deliveryReportCb;

struct DataLogger::KafkaRecordSender::Impl
{
    std::unique_ptr<RdKafka::Producer> producer;
};

DataLogger::KafkaRecordSender::KafkaRecordSender(
    const std::string& baseURL,
    const std::string& broker,
    const std::string& topic,
    std::unique_ptr<IAuthentication> authentication,
    std::unique_ptr<IMessageEncoder> messageEncoder
)
    : NetworkLoggerBase(baseURL,std::move(authentication)),
    _impl(std::make_unique<Impl>()),
    _topic(topic),
    _messageEncoder(std::move(messageEncoder))
{
    std::string errstr;

    RdKafka::Conf* conf = RdKafka::Conf::create(RdKafka::Conf::CONF_GLOBAL);
    if (!conf) {
        PLOG_FATAL << "Failed to create Kafka config object";
        std::exit(1);
    }

    PLOG_INFO << "Attempting to set broker to " << broker;
    if (conf->set("bootstrap.servers", broker, errstr) != RdKafka::Conf::CONF_OK) {
        PLOG_FATAL << errstr;
        std::exit(1);
    }
    PLOG_DEBUG << "Kafka broker set to: " << broker << " errstr=" << errstr;

    if (conf->set("dr_cb", &deliveryReportCb, errstr) != RdKafka::Conf::CONF_OK) {
        PLOG_FATAL << errstr;
        std::exit(1);
    }

    _impl->producer.reset(RdKafka::Producer::create(conf, errstr));
    if (!_impl->producer) {
        PLOG_FATAL << "Failed to create Kafka producer: " << errstr;
        std::exit(1);
    }

    delete conf;
    PLOG_DEBUG << "Kafka producer created for topic: " << _topic;
}

DataLogger::KafkaRecordSender::~KafkaRecordSender()
{
    if (!_impl->producer) return;

    PLOG_DEBUG << "Draining Kafka producer queue";

    const int maxDrainMs = 10 * 1000;
    const int pollIntervalMs = 100;
    int waitedMs = 0;

    while (_impl->producer->outq_len() > 0 && waitedMs < maxDrainMs) {
        _impl->producer->poll(pollIntervalMs);
        waitedMs += pollIntervalMs;
    }

    if (_impl->producer->outq_len() > 0) {
        PLOG_ERROR << _impl->producer->outq_len()
            << " Kafka messages not delivered after drain";
    }
    else {
        PLOG_DEBUG << "Kafka producer queue drained successfully";
    }
}

bool DataLogger::KafkaRecordSender::Submit(const Record& record) noexcept
{
    if (!_impl->producer) {
        PLOG_ERROR << "Kafka producer not initialized";
        return false;
    }

    try {
        if (!_messageEncoder) {
            PLOG_ERROR << "No encoder set for KafkaRecordSender";
            return false;
        }

        std::vector<uint8_t> encoded_message = _messageEncoder->Encode(record);

        const int maxRetries = 5;
        int retries = 0;

        while (true) {
            RdKafka::ErrorCode err = _impl->producer->produce(
                _topic,
                RdKafka::Topic::PARTITION_UA,
                RdKafka::Producer::RK_MSG_COPY,
                const_cast<char*>(
                    reinterpret_cast<const char*>(encoded_message.data())
                    ),
                encoded_message.size(),
                nullptr, 0,
                0,
                nullptr,
                nullptr
            );

            if (err == RdKafka::ERR__QUEUE_FULL) {
                _impl->producer->poll(100);
                if (++retries >= maxRetries) {
                    PLOG_ERROR << "Kafka queue full, dropping message";
                    return false;
                }
                continue;
            }

            if (err != RdKafka::ERR_NO_ERROR) {
                PLOG_ERROR << "Produce failed: " << RdKafka::err2str(err);
                return false;
            }

            break;
        }

        _impl->producer->poll(0);

        return true;
    }
    catch (const std::exception& e) {
        PLOG_ERROR << "Exception in KafkaRecordSender::Log(): " << e.what();
        return false;
    }
    catch (...) {
        PLOG_ERROR << "Unknown exception in KafkaRecordSender::Log()";
        return false;
    }
}

void DataLogger::KafkaRecordSender::Flush(int timeoutMs)
{
    if (_impl && _impl->producer) {
        _impl->producer->flush(timeoutMs);
    }
}

#pragma once
#include "NetworkLoggerBase.h"
#include "IMessageEncoder.h"
#include "IAuthentication.h"
#include <string>
#include <memory>

namespace DataLogger
{
    class KafkaRecordSender : public NetworkLoggerBase
    {
    public:
        KafkaRecordSender(
            const std::string &baseURL,
            const std::string &broker,
            const std::string &topic,
            std::unique_ptr<IAuthentication> authentication,
            std::unique_ptr<IMessageEncoder> messageEncoder);

        ~KafkaRecordSender();

        bool Submit(const Record &record) noexcept;

        virtual void Flush(int timeoutMs = 0) override;

    private:
        struct Impl;
        std::unique_ptr<Impl> _impl;
        const std::string _topic;
        std::unique_ptr<IMessageEncoder> _messageEncoder;
    };
}